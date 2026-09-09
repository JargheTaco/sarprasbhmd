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
        { error: 'Akses ditolak. Hanya Petugas/Staff yang dapat memproses pengembalian sarpras.' },
        { status: 403 }
      );
    }

    const { ticket } = await params;
    const body = await req.json();
    const { condition_ok, cleanliness_ok, fuel_ok, notes, create_maintenance_ticket, maintenance_description } = body;

    interface LoanRow {
      id: string;
      status: string;
      asset_id: string;
      ticket_code: string;
      borrower_name: string;
    }

    interface AssetRow {
      id: string;
      name: string;
      category: string;
    }

    const { data: loans, error: findError } = await supabaseAdmin
      .from('loan_requests')
      .select('id, status, asset_id, ticket_code, borrower_name')
      .or(`ticket_code.eq.${ticket},id.eq.${ticket}`)
      .limit(1);
    if (findError) throw findError;
    const loan = loans?.[0] as LoanRow | undefined;

    if (!loan) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (loan.status !== 'IN_USE' && loan.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Status peminjaman saat ini (${loan.status}) tidak valid untuk pengembalian` },
        { status: 400 }
      );
    }

    const { data: asset, error: assetFindError } = await supabaseAdmin
      .from('assets')
      .select('id, name, category')
      .eq('id', loan.asset_id)
      .maybeSingle<AssetRow>();
    if (assetFindError) throw assetFindError;

    const returnChecklistJson = JSON.stringify({
      condition_ok: !!condition_ok,
      cleanliness_ok: !!cleanliness_ok,
      fuel_ok: !!fuel_ok,
      notes: notes || 'Peminjaman telah dikembalikan lengkap.',
      inspected_by: user.name,
    });

    const now = new Date().toISOString();

    // Mark loan as RETURNED
    const { error: loanUpdateError } = await supabaseAdmin.from('loan_requests').update({
      status: 'RETURNED',
      return_checklist: JSON.parse(returnChecklistJson),
      returned_at: now,
    }).eq('id', loan.id);
    if (loanUpdateError) throw loanUpdateError;

    // If unit is in good condition, mark asset TERSEDIA.
    // If unit has issue, mark DALAM_PERAWATAN or RUSAK_RINGAN.
    const newAssetStatus = (!condition_ok || create_maintenance_ticket) ? 'DALAM_PERAWATAN' : 'TERSEDIA';
    const newAssetCondition = !condition_ok ? 'RUSAK_RINGAN' : 'BAIK';

    const { error: assetUpdateError } = await supabaseAdmin.from('assets').update({
      status: newAssetStatus,
      condition: newAssetCondition,
    }).eq('id', loan.asset_id);
    if (assetUpdateError) throw assetUpdateError;

    // If staff requests maintenance ticket creation due to issue
    if (create_maintenance_ticket && asset) {
      const currentYear = new Date().getFullYear();
      const { count, error: countError } = await supabaseAdmin
        .from('maintenance_records')
        .select('id', { count: 'exact', head: true });
      if (countError) throw countError;
      const mntCode = `MNT-${currentYear}-${((count || 0) + 1).toString().padStart(4, '0')}`;
      const mntId = `mnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      let mntCategory = 'ELECTRONIC';
      if (asset.category === 'MACHINERY') mntCategory = 'MACHINERY';
      if (asset.category === 'ELECTRICAL') mntCategory = 'ELECTRICAL';

      const { error: maintenanceError } = await supabaseAdmin.from('maintenance_records').insert({
        id: mntId,
        ticket_number: mntCode,
        asset_id: asset.id,
        type: 'CORRECTIVE',
        category: mntCategory,
        title: `Perbaikan Pasca Pengembalian (${loan.ticket_code}) - ${asset.name}`,
        description: maintenance_description || notes || `Laporan kendala saat pengembalian oleh ${loan.borrower_name}`,
        technician_name: 'Belum Ditugaskan',
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'SCHEDULED',
        created_at: now,
      });
      if (maintenanceError) throw maintenanceError;
    }

    const { data: updated, error: fetchError } = await supabaseAdmin.from('loan_requests').select('*').eq('id', loan.id).single();
    if (fetchError) throw fetchError;

    return NextResponse.json({
      success: true,
      message: 'Pengembalian sarpras berhasil dicatat. Status peminjaman selesai.',
      loan: updated,
    });
  } catch (err: unknown) {
    console.error('Return loan error:', err);
    return NextResponse.json({ error: 'Gagal memproses pengembalian sarpras' }, { status: 500 });
  }
}

