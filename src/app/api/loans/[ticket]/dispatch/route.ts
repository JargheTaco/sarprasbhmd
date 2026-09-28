import { isMissingColumn } from '@/lib/assetTypes';
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
        { error: 'Akses ditolak. Hanya Petugas/Staff yang dapat melakukan serah terima sarpras.' },
        { status: 403 }
      );
    }

    const { ticket } = await params;

    // Data petugas / CS ruangan yang menerima sarpras (dipakai pada Surat Peminjaman)
    const body = await req.json().catch(() => ({}));
    const handoverToName = typeof body.handover_to_name === 'string' ? body.handover_to_name.trim() : '';
    const handoverToNip = typeof body.handover_to_nip === 'string' ? body.handover_to_nip.trim() : '';
    const handoverCondition = ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'].includes(body.handover_condition)
      ? body.handover_condition
      : '';

    if (handoverToName && handoverToName.length > 120) {
      return NextResponse.json({ error: 'Nama petugas / CS penerima terlalu panjang' }, { status: 400 });
    }

    interface LoanRow {
      id: string;
      status: string;
      asset_id: string;
    }

    const { data: loans, error: findError } = await supabaseAdmin
      .from('loan_requests')
      .select('id, status, asset_id')
      .or(`ticket_code.eq.${ticket},id.eq.${ticket}`)
      .limit(1);
    if (findError) throw findError;
    const loan = loans?.[0] as LoanRow | undefined;

    if (!loan) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (loan.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Hanya peminjaman berstatus "Disetujui (APPROVED)" yang dapat diserahterimakan' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update loan status to IN_USE
    const updatePayload: Record<string, unknown> = { status: 'IN_USE', picked_up_at: now };
    if (handoverToName) updatePayload.handover_to_name = handoverToName;
    if (handoverToNip) updatePayload.handover_to_nip = handoverToNip;
    if (handoverCondition) updatePayload.handover_condition = handoverCondition;

    let { error: loanError } = await supabaseAdmin
      .from('loan_requests')
      .update(updatePayload)
      .eq('id', loan.id);

    // Kolom serah terima belum tersedia di database lama: tetap proses tanpa data petugas.
    if (loanError && isMissingColumn(loanError)) {
      console.warn('Kolom serah terima (handover_*) belum tersedia, diteruskan tanpa data petugas.');
      const retry = await supabaseAdmin
        .from('loan_requests')
        .update({ status: 'IN_USE', picked_up_at: now })
        .eq('id', loan.id);
      loanError = retry.error;
    }
    if (loanError) throw loanError;

    const { data: additionalItems, error: itemError } = await supabaseAdmin
      .from('loan_request_items')
      .select('asset_id')
      .eq('loan_request_id', loan.id);
    if (itemError) throw itemError;
    const assetIds = [loan.asset_id, ...(additionalItems || []).map((item) => item.asset_id)].filter(Boolean);
    if (assetIds.length > 0) {
      const { error: assetError } = await supabaseAdmin.from('assets')
        .update({ status: 'DIPINJAM' })
        .in('id', assetIds);
      if (assetError) throw assetError;
    }

    const { data: updated, error: fetchError } = await supabaseAdmin.from('loan_requests').select('*').eq('id', loan.id).single();
    if (fetchError) throw fetchError;

    return NextResponse.json({
      success: true,
      message: 'Sarpras berhasil diserahterimakan ke pemohon. Status: Sedang Digunakan.',
      loan: updated,
    });
  } catch (err: unknown) {
    console.error('Dispatch error:', err);
    return NextResponse.json({ error: 'Gagal memproses serah terima sarpras' }, { status: 500 });
  }
}

