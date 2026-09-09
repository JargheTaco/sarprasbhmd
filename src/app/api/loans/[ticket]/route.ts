import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ ticket: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { ticket } = await params;

    const { data: rows, error } = await supabaseAdmin
      .from('loan_requests')
      .select('*, assets(name, code, category, location, specs, condition)')
      .or(`ticket_code.eq.${ticket},id.eq.${ticket}`)
      .limit(1);
    if (error) throw error;
    const row = rows?.[0];
    const loan = row && {
      ...row,
      asset_name: row.assets?.name,
      asset_code: row.assets?.code,
      asset_category: row.assets?.category,
      asset_location: row.assets?.location,
      asset_specs: row.assets?.specs,
      asset_condition: row.assets?.condition,
      assets: undefined,
    };

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

