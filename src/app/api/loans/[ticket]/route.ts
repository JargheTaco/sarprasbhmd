import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Params {
  params: Promise<{ ticket: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { ticket } = await params;

    const loan = db.prepare(`
      SELECT 
        l.*,
        a.name as asset_name,
        a.code as asset_code,
        a.category as asset_category,
        a.location as asset_location,
        a.specs as asset_specs,
        a.condition as asset_condition
      FROM loan_requests l
      JOIN assets a ON l.asset_id = a.id
      WHERE l.ticket_code = ? OR l.id = ?
    `).get(ticket, ticket);

    if (!loan) {
      return NextResponse.json(
        { error: `Pengajuan peminjaman dengan kode/ID ${ticket} tidak ditemukan` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, loan });
  } catch (err: unknown) {
    console.error('Get loan by ticket error:', err);
    return NextResponse.json(
      { error: 'Gagal memuat detail pengajuan peminjaman' },
      { status: 500 }
    );
  }
}

