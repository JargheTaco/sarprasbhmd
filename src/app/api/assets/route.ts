import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    let sql = 'SELECT * FROM assets WHERE 1=1';
    const params: (string | number)[] = [];

    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'ALL') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ? OR location LIKE ? OR specs LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC';

    const assets = db.prepare(sql).all(...params);
    return NextResponse.json({ success: true, assets });
  } catch (err: unknown) {
    console.error('Fetch assets error:', err);
    return NextResponse.json({ error: 'Gagal mengambil data aset' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF_SARPRAS')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Petugas/Admin yang dapat menambah aset.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, name, category, location, condition, status, specs, capacity, purchase_year } = body;

    if (!code || !name || !category || !location) {
      return NextResponse.json(
        { error: 'Kode, Nama, Kategori, dan Lokasi aset wajib diisi' },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const existing = db.prepare('SELECT id FROM assets WHERE code = ?').get(code);
    if (existing) {
      return NextResponse.json(
        { error: `Kode aset ${code} sudah digunakan oleh aset lain` },
        { status: 400 }
      );
    }

    const id = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO assets (id, code, name, category, location, condition, status, specs, capacity, purchase_year, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      code.toUpperCase(),
      name,
      category,
      location,
      condition || 'BAIK',
      status || 'TERSEDIA',
      specs || null,
      Number(capacity) || 0,
      Number(purchase_year) || new Date().getFullYear(),
      now
    );

    const newAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    return NextResponse.json({ success: true, asset: newAsset });
  } catch (err: unknown) {
    console.error('Create asset error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan data aset' }, { status: 500 });
  }
}

