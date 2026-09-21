import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ ticket: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'KEPALA_ADMIN_UMUM' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Kepala Administrasi Umum atau Admin yang berwenang memberikan persetujuan akhir.' },
        { status: 403 }
      );
    }

    const { ticket } = await params;
    const body = await req.json();
    const { action, notes, administration_approved } = body;

    const { data: loans, error: findError } = await supabaseAdmin
      .from('loan_requests')
      .select('id, status, ticket_code')
      .or(`ticket_code.eq.${ticket},id.eq.${ticket}`)
      .limit(1);
    if (findError) throw findError;

    const loan = loans?.[0] as { id: string; status: string; ticket_code: string } | undefined;
    if (!loan) {
      return NextResponse.json({ error: 'Pengajuan peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (loan.status !== 'PENDING_ADMIN_UMUM') {
      return NextResponse.json(
        { error: `Pengajuan tidak dalam tahap persetujuan Kepala Administrasi Umum (Status saat ini: ${loan.status})` },
        { status: 400 }
      );
    }

    const isRejected = action === 'REJECT';
    const checklist = {
      administration_approved: !!administration_approved,
      notes: notes || '',
    };
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('loan_requests')
      .update({
        status: isRejected ? 'REJECTED' : 'APPROVED',
        admin_umum_notes: notes || (isRejected ? 'Ditolak oleh Kepala Administrasi Umum' : 'Disetujui oleh Kepala Administrasi Umum'),
        admin_umum_checklist: checklist,
        admin_umum_approved_at: now,
        admin_umum_approved_by: user.name,
      })
      .eq('id', loan.id);
    if (updateError) throw updateError;

    const { data: updated, error: fetchError } = await supabaseAdmin
      .from('loan_requests')
      .select('*')
      .eq('id', loan.id)
      .single();
    if (fetchError) throw fetchError;

    return NextResponse.json({
      success: true,
      message: isRejected
        ? 'Pengajuan peminjaman telah ditolak oleh Kepala Administrasi Umum.'
        : 'Peminjaman disetujui secara lengkap dan siap untuk serah terima.',
      loan: updated,
    });
  } catch (err: unknown) {
    console.error('Admin umum approve error:', err);
    return NextResponse.json({ error: 'Gagal memproses persetujuan Kepala Administrasi Umum' }, { status: 500 });
  }
}
