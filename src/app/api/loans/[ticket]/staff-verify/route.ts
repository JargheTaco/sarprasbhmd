import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ ticket: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'STAFF_SARPRAS' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Staff Sarpras atau Admin yang berwenang melakukan verifikasi ini.' },
        { status: 403 }
      );
    }

    const { ticket } = await params;
    const body = await req.json();
    const { action, notes, unit_available, physical_condition_ok, fuel_or_key_ready, documents_complete } = body;

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

    if (loan.status !== 'PENDING_STAFF') {
      return NextResponse.json(
        { error: `Pengajuan tidak dalam tahap verifikasi staff (Status saat ini: ${loan.status})` },
        { status: 400 }
      );
    }

    const checklistJson = JSON.stringify({
      unit_available: !!unit_available,
      physical_condition_ok: !!physical_condition_ok,
      fuel_or_key_ready: !!fuel_or_key_ready,
      documents_complete: !!documents_complete,
      notes: notes || '',
    });

    const now = new Date().toISOString();
    const newStatus = action === 'REJECT' ? 'REJECTED' : 'PENDING_HEAD';

    const { error: updateError } = await supabaseAdmin.from('loan_requests').update({
      status: newStatus,
      staff_notes: notes || (action === 'REJECT' ? 'Ditolak pada tahap verifikasi staff' : 'Terverifikasi oleh staff Sarpras'),
      staff_checklist: JSON.parse(checklistJson),
      staff_verified_at: now,
      staff_verified_by: user.name,
    }).eq('id', loan.id);
    if (updateError) throw updateError;

    const { data: updated, error: fetchError } = await supabaseAdmin.from('loan_requests').select('*').eq('id', loan.id).single();
    if (fetchError) throw fetchError;

    return NextResponse.json({
      success: true,
      message: action === 'REJECT' 
        ? 'Pengajuan telah ditolak oleh staff Sarpras' 
        : 'Verifikasi staff berhasil! Pengajuan diteruskan ke Kepala Sarpras untuk persetujuan akhir.',
      loan: updated,
    });
  } catch (err: unknown) {
    console.error('Staff verify error:', err);
    return NextResponse.json({ error: 'Gagal memproses verifikasi staff' }, { status: 500 });
  }
}

