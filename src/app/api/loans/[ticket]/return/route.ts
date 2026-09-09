import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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

    const loan = db.prepare(`
      SELECT id, status, asset_id, ticket_code, borrower_name FROM loan_requests WHERE ticket_code = ? OR id = ?
    `).get(ticket, ticket) as LoanRow | undefined;

    if (!loan) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (loan.status !== 'IN_USE' && loan.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Status peminjaman saat ini (${loan.status}) tidak valid untuk pengembalian` },
        { status: 400 }
      );
    }

    const asset = db.prepare('SELECT id, name, category FROM assets WHERE id = ?').get(loan.asset_id) as AssetRow | undefined;

    const returnChecklistJson = JSON.stringify({
      condition_ok: !!condition_ok,
      cleanliness_ok: !!cleanliness_ok,
      fuel_ok: !!fuel_ok,
      notes: notes || 'Peminjaman telah dikembalikan lengkap.',
      inspected_by: user.name,
    });

    const now = new Date().toISOString();

    // Mark loan as RETURNED
    db.prepare(`
      UPDATE loan_requests
      SET status = 'RETURNED', return_checklist = ?, returned_at = ?
      WHERE id = ?
    `).run(returnChecklistJson, now, loan.id);

    // If unit is in good condition, mark asset TERSEDIA.
    // If unit has issue, mark DALAM_PERAWATAN or RUSAK_RINGAN.
    const newAssetStatus = (!condition_ok || create_maintenance_ticket) ? 'DALAM_PERAWATAN' : 'TERSEDIA';
    const newAssetCondition = !condition_ok ? 'RUSAK_RINGAN' : 'BAIK';

    db.prepare(`
      UPDATE assets
      SET status = ?, condition = ?
      WHERE id = ?
    `).run(newAssetStatus, newAssetCondition, loan.asset_id);

    // If staff requests maintenance ticket creation due to issue
    if (create_maintenance_ticket && asset) {
      const currentYear = new Date().getFullYear();
      const countMnt = db.prepare('SELECT COUNT(*) as count FROM maintenance_records').get() as { count: number };
      const mntCode = `MNT-${currentYear}-${(countMnt.count + 1).toString().padStart(4, '0')}`;
      const mntId = `mnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      let mntCategory = 'ELECTRONIC';
      if (asset.category === 'MACHINERY') mntCategory = 'MACHINERY';
      if (asset.category === 'ELECTRICAL') mntCategory = 'ELECTRICAL';

      db.prepare(`
        INSERT INTO maintenance_records (
          id, ticket_number, asset_id, type, category, title, description,
          technician_name, scheduled_date, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        mntId,
        mntCode,
        asset.id,
        'CORRECTIVE',
        mntCategory,
        `Perbaikan Pasca Pengembalian (${loan.ticket_code}) - ${asset.name}`,
        maintenance_description || notes || `Laporan kendala saat pengembalian oleh ${loan.borrower_name}`,
        'Belum Ditugaskan',
        new Date().toISOString().split('T')[0],
        'SCHEDULED',
        now
      );
    }

    const updated = db.prepare('SELECT * FROM loan_requests WHERE id = ?').get(loan.id);

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

