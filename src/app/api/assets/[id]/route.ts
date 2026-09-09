import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    if (!asset) {
      return NextResponse.json({ error: 'Aset tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, asset });
  } catch (err: unknown) {
    console.error('Get asset error:', err);
    return NextResponse.json({ error: 'Gagal mengambil detail aset' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF_SARPRAS')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Petugas/Admin yang dapat mengubah aset.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, category, location, condition, status, specs, capacity, purchase_year } = body;

    const existing = db.prepare('SELECT id FROM assets WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Aset tidak ditemukan' }, { status: 404 });
    }

    db.prepare(`
      UPDATE assets
      SET name = ?, category = ?, location = ?, condition = ?, status = ?, specs = ?, capacity = ?, purchase_year = ?
      WHERE id = ?
    `).run(
      name,
      category,
      location,
      condition,
      status,
      specs || null,
      Number(capacity) || 0,
      Number(purchase_year) || new Date().getFullYear(),
      id
    );

    const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    return NextResponse.json({ success: true, asset: updated });
  } catch (err: unknown) {
    console.error('Update asset error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui data aset' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Admin yang dapat menghapus data aset' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if asset is currently linked to any active loans
    const activeLoan = db.prepare(`
      SELECT id FROM loan_requests
      WHERE asset_id = ? AND status IN ('PENDING_STAFF', 'PENDING_HEAD', 'APPROVED', 'IN_USE')
    `).get(id);

    if (activeLoan) {
      return NextResponse.json(
        { error: 'Aset tidak dapat dihapus karena masih terkait peminjaman aktif' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM assets WHERE id = ?').run(id);
    return NextResponse.json({ success: true, message: 'Aset berhasil dihapus' });
  } catch (err: unknown) {
    console.error('Delete asset error:', err);
    return NextResponse.json({ error: 'Gagal menghapus aset' }, { status: 500 });
  }
}

