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

    const loan = db.prepare(`
      SELECT id, status, asset_id FROM loan_requests WHERE ticket_code = ? OR id = ?
    `).get(ticket, ticket) as LoanRow | undefined;

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
    db.prepare(`
      UPDATE loan_requests
      SET status = 'IN_USE', picked_up_at = ?
      WHERE id = ?
    `).run(now, loan.id);

    // Update asset status to DIPINJAM
    db.prepare(`
      UPDATE assets
      SET status = 'DIPINJAM'
      WHERE id = ?
    `).run(loan.asset_id);

    const updated = db.prepare('SELECT * FROM loan_requests WHERE id = ?').get(loan.id);

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

