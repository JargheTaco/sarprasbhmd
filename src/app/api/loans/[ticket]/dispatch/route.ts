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
    const { error: loanError } = await supabaseAdmin.from('loan_requests')
      .update({ status: 'IN_USE', picked_up_at: now })
      .eq('id', loan.id);
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

