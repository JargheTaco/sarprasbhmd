import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const assetId = searchParams.get('asset_id');
    const category = searchParams.get('category');
    const q = searchParams.get('q');

    let sql = `
      SELECT 
        l.*,
        a.name as asset_name,
        a.code as asset_code,
        a.category as asset_category,
        a.location as asset_location,
        a.specs as asset_specs
      FROM loan_requests l
      JOIN assets a ON l.asset_id = a.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status && status !== 'ALL') {
      sql += ' AND l.status = ?';
      params.push(status);
    }

    if (assetId) {
      sql += ' AND l.asset_id = ?';
      params.push(assetId);
    }

    if (category && category !== 'ALL') {
      sql += ' AND a.category = ?';
      params.push(category);
    }

    if (q) {
      sql += ` AND (
        l.ticket_code LIKE ? OR 
        l.borrower_name LIKE ? OR 
        l.borrower_id LIKE ? OR 
        l.borrower_phone LIKE ? OR 
        l.purpose LIKE ? OR 
        a.name LIKE ?
      )`;
      const term = `%${q}%`;
      params.push(term, term, term, term, term, term);
    }

    sql += ' ORDER BY l.created_at DESC';

    const loans = db.prepare(sql).all(...params);
    return NextResponse.json({ success: true, loans });
  } catch (err: unknown) {
    console.error('Fetch loans error:', err);
    return NextResponse.json({ error: 'Gagal memuat data peminjaman' }, { status: 500 });
  }
}

// PUBLIC SUBMISSION - NO LOGIN REQUIRED
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      borrower_name,
      borrower_id,
      borrower_role,
      borrower_phone,
      borrower_email,
      asset_id,
      start_date,
      start_time,
      end_date,
      end_time,
      purpose,
      destination,
      driver_needed,
      attachment_url,
    } = body;

    // Validation
    if (
      !borrower_name ||
      !borrower_id ||
      !borrower_phone ||
      !asset_id ||
      !start_date ||
      !start_time ||
      !end_date ||
      !end_time ||
      !purpose
    ) {
      return NextResponse.json(
        { error: 'Mohon lengkapi seluruh kolom formulir yang wajib diisi' },
        { status: 400 }
      );
    }

    // Check if asset exists and is not permanently broken
    interface AssetCheck {
      id: string;
      name: string;
      condition: string;
      status: string;
    }
    const asset = db.prepare('SELECT id, name, condition, status FROM assets WHERE id = ?').get(asset_id) as AssetCheck | undefined;
    if (!asset) {
      return NextResponse.json({ error: 'Sarpras / Aset yang dipilih tidak ditemukan' }, { status: 404 });
    }

    if (asset.condition === 'RUSAK_BERAT') {
      return NextResponse.json(
        { error: `Sarpras (${asset.name}) saat ini rusak berat dan tidak dapat dipinjam` },
        { status: 400 }
      );
    }

    // Check for scheduling conflict with already approved or active loans
    const startIso = `${start_date} ${start_time}`;
    const endIso = `${end_date} ${end_time}`;

    if (startIso >= endIso) {
      return NextResponse.json(
        { error: 'Waktu selesai peminjaman harus lebih akhir dari waktu mulai' },
        { status: 400 }
      );
    }

    interface ConflictRow {
      ticket_code: string;
      start_date: string;
      start_time: string;
      end_date: string;
      end_time: string;
    }

    const conflict = db.prepare(`
      SELECT ticket_code, start_date, start_time, end_date, end_time
      FROM loan_requests
      WHERE asset_id = ?
        AND status IN ('APPROVED', 'IN_USE', 'PENDING_HEAD')
        AND (
          (start_date || ' ' || start_time < ? AND end_date || ' ' || end_time > ?)
        )
    `).get(asset_id, endIso, startIso) as ConflictRow | undefined;

    if (conflict) {
      return NextResponse.json(
        {
          error: `Jadwal bentrok dengan peminjaman lain (${conflict.ticket_code}) pada tanggal ${conflict.start_date} ${conflict.start_time} s/d ${conflict.end_date} ${conflict.end_time}. Silakan pilih waktu atau unit lain.`
        },
        { status: 409 }
      );
    }

    // Generate unique friendly ticket code: SARPRAS-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const countRow = db.prepare(`
      SELECT COUNT(*) as count FROM loan_requests WHERE ticket_code LIKE ?
    `).get(`SARPRAS-${currentYear}-%`) as { count: number };

    const sequence = (countRow.count + 1).toString().padStart(4, '0');
    const ticketCode = `SARPRAS-${currentYear}-${sequence}`;

    const id = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO loan_requests (
        id, ticket_code, borrower_name, borrower_id, borrower_role, borrower_phone, borrower_email,
        asset_id, start_date, start_time, end_date, end_time, purpose, destination, driver_needed,
        attachment_url, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      ticketCode,
      borrower_name,
      borrower_id,
      borrower_role || 'Mahasiswa',
      borrower_phone,
      borrower_email || null,
      asset_id,
      start_date,
      start_time,
      end_date,
      end_time,
      purpose,
      destination || null,
      driver_needed ? 1 : 0,
      attachment_url || null,
      'PENDING_STAFF', // First step: Pending Staff review
      now
    );

    const createdLoan = db.prepare(`
      SELECT 
        l.*,
        a.name as asset_name,
        a.code as asset_code,
        a.category as asset_category
      FROM loan_requests l
      JOIN assets a ON l.asset_id = a.id
      WHERE l.id = ?
    `).get(id);

    return NextResponse.json({
      success: true,
      ticket_code: ticketCode,
      loan: createdLoan,
      message: 'Pengajuan peminjaman berhasil dikirim. Simpan kode tiket untuk pelacakan.',
    });
  } catch (err: unknown) {
    console.error('Submit loan error:', err);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses pengajuan peminjaman' },
      { status: 500 }
    );
  }
}

