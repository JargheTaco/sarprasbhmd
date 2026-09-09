import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const q = searchParams.get('q');

    let sql = `
      SELECT 
        m.*,
        a.name as asset_name,
        a.code as asset_code,
        a.location as asset_location,
        a.condition as asset_condition
      FROM maintenance_records m
      JOIN assets a ON m.asset_id = a.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (category && category !== 'ALL') {
      sql += ' AND m.category = ?';
      params.push(category);
    }

    if (status && status !== 'ALL') {
      sql += ' AND m.status = ?';
      params.push(status);
    }

    if (type && type !== 'ALL') {
      sql += ' AND m.type = ?';
      params.push(type);
    }

    if (q) {
      sql += ' AND (m.ticket_number LIKE ? OR m.title LIKE ? OR m.technician_name LIKE ? OR a.name LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY m.scheduled_date DESC, m.created_at DESC';

    const records = db.prepare(sql).all(...params);
    return NextResponse.json({ success: true, records });
  } catch (err: unknown) {
    console.error('Fetch maintenance error:', err);
    return NextResponse.json({ error: 'Gagal memuat data perawatan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'STAFF_SARPRAS' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Petugas/Staff yang dapat membuat jadwal perawatan.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { asset_id, type, category, title, description, technician_name, scheduled_date, cost } = body;

    if (!asset_id || !title || !scheduled_date) {
      return NextResponse.json(
        { error: 'Aset, judul perawatan, dan tanggal jadwal wajib diisi' },
        { status: 400 }
      );
    }

    interface AssetCheck {
      id: string;
      category: string;
    }
    const asset = db.prepare('SELECT id, category FROM assets WHERE id = ?').get(asset_id) as AssetCheck | undefined;
    if (!asset) {
      return NextResponse.json({ error: 'Aset tidak ditemukan' }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const countMnt = db.prepare('SELECT COUNT(*) as count FROM maintenance_records').get() as { count: number };
    const ticketCode = `MNT-${currentYear}-${(countMnt.count + 1).toString().padStart(4, '0')}`;
    const id = `mnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const mntCategory = category || (asset.category === 'MACHINERY' || asset.category === 'ELECTRICAL' ? asset.category : 'ELECTRONIC');

    db.prepare(`
      INSERT INTO maintenance_records (
        id, ticket_number, asset_id, type, category, title, description,
        technician_name, scheduled_date, cost, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      ticketCode,
      asset_id,
      type || 'PREVENTIVE',
      mntCategory,
      title,
      description || null,
      technician_name || 'Teknisi Sarpras',
      scheduled_date,
      Number(cost) || 0,
      'SCHEDULED',
      now
    );

    // If it is a corrective maintenance ticket, set asset status to DALAM_PERAWATAN
    if (type === 'CORRECTIVE') {
      db.prepare("UPDATE assets SET status = 'DALAM_PERAWATAN' WHERE id = ?").run(asset_id);
    }

    const created = db.prepare(`
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
      message: 'Jadwal perawatan aset berhasil ditambahkan',
      record: created,
    });
  } catch (err: unknown) {
    console.error('Create maintenance error:', err);
    return NextResponse.json({ error: 'Gagal membuat tiket perawatan aset' }, { status: 500 });
  }
}

