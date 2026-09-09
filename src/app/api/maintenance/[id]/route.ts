import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'STAFF_SARPRAS' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Petugas/Staff yang dapat memperbarui data perawatan.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, technician_name, scheduled_date, cost, action_taken, spare_parts } = body;

    interface MntRow {
      id: string;
      asset_id: string;
      status: string;
    }

    const mnt = db.prepare('SELECT id, asset_id, status FROM maintenance_records WHERE id = ?').get(id) as MntRow | undefined;
    if (!mnt) {
      return NextResponse.json({ error: 'Data perawatan tidak ditemukan' }, { status: 404 });
    }

    const completed_date = status === 'COMPLETED' ? new Date().toISOString().split('T')[0] : null;

    db.prepare(`
      UPDATE maintenance_records
      SET 
        status = COALESCE(?, status),
        technician_name = COALESCE(?, technician_name),
        scheduled_date = COALESCE(?, scheduled_date),
        cost = COALESCE(?, cost),
        action_taken = COALESCE(?, action_taken),
        spare_parts = COALESCE(?, spare_parts),
        completed_date = CASE WHEN ? = 'COMPLETED' THEN ? ELSE completed_date END
      WHERE id = ?
    `).run(
      status || null,
      technician_name || null,
      scheduled_date || null,
      cost !== undefined ? Number(cost) : null,
      action_taken || null,
      spare_parts || null,
      status || null,
      completed_date,
      id
    );

    // If completed, return asset to TERSEDIA and condition to BAIK
    if (status === 'COMPLETED') {
      db.prepare(`
        UPDATE assets
        SET status = 'TERSEDIA', condition = 'BAIK'
        WHERE id = ?
      `).run(mnt.asset_id);
    }

    const updated = db.prepare(`
      SELECT 
        m.*,
        a.name as asset_name,
        a.code as asset_code
      FROM maintenance_records m
      JOIN assets a ON m.asset_id = a.id
      WHERE m.id = ?
    `).get(id);

    return NextResponse.json({
      success: true,
      message: 'Data pemeliharaan aset berhasil diperbarui',
      record: updated,
    });
  } catch (err: unknown) {
    console.error('Update maintenance error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui data perawatan' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Admin yang dapat menghapus catatan perawatan' },
        { status: 403 }
      );
    }

    const { id } = await params;
    db.prepare('DELETE FROM maintenance_records WHERE id = ?').run(id);
    return NextResponse.json({ success: true, message: 'Catatan perawatan berhasil dihapus' });
  } catch (err: unknown) {
    console.error('Delete maintenance error:', err);
    return NextResponse.json({ error: 'Gagal menghapus catatan perawatan' }, { status: 500 });
  }
}

