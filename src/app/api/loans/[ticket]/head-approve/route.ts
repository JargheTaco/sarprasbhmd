import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ ticket: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'KEPALA_SARPRAS' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Kepala Bagian Sarpras atau Admin yang berwenang memberikan persetujuan akhir.' },
        { status: 403 }
      );
    }

    const { ticket } = await params;
    const body = await req.json();
    const { action, notes, priority_approved, schedule_approved } = body;

    interface LoanRow {
      id: string;
      status: string;
      ticket_code: string;
    }

    const { data: loans, error: findError } = await supabaseAdmin
      .from('loan_requests')
      .select('id, status, ticket_code')
      .or(`ticket_code.eq.${ticket},id.eq.${ticket}`)
      .limit(1);
    if (findError) throw findError;
    const loan = loans?.[0] as LoanRow | undefined;

    if (!loan) {
      return NextResponse.json({ error: 'Pengajuan peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (loan.status !== 'PENDING_HEAD') {
      return NextResponse.json(
        { error: `Pengajuan tidak dalam tahap persetujuan Kepala Sarpras (Status saat ini: ${loan.status})` },
        { status: 400 }
      );
    }

    const checklistJson = JSON.stringify({
      priority_approved: !!priority_approved,
      schedule_approved: !!schedule_approved,
      notes: notes || '',
    });

    const now = new Date().toISOString();
    const newStatus = action === 'REJECT' ? 'REJECTED' : 'APPROVED';

    const { error: updateError } = await supabaseAdmin.from('loan_requests').update({
      status: newStatus,
      head_notes: notes || (action === 'REJECT' ? 'Ditolak oleh Kepala Sarpras' : 'Disetujui oleh Kepala Sarpras'),
      head_checklist: JSON.parse(checklistJson),
      head_approved_at: now,
      head_approved_by: user.name,
    }).eq('id', loan.id);
    if (updateError) throw updateError;

    const { data: updated, error: fetchError } = await supabaseAdmin.from('loan_requests').select('*').eq('id', loan.id).single();
    if (fetchError) throw fetchError;

    return NextResponse.json({
      success: true,
      message: action === 'REJECT' 
        ? 'Pengajuan peminjaman telah ditolak oleh Kepala Sarpras' 
        : 'Peminjaman disetujui resmi oleh Kepala Sarpras! Pemohon dapat mencetak Surat Izin Peminjaman.',
      loan: updated,
    });
  } catch (err: unknown) {
    console.error('Head approve error:', err);
    return NextResponse.json({ error: 'Gagal memproses persetujuan Kepala Sarpras' }, { status: 500 });
  }
}

