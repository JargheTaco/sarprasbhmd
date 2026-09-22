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
      asset_name: row.assets?.name || `Ruangan ${row.room_name || ''}`.trim(),
      asset_code: row.assets?.code || `${row.room_building || ''} / ${row.room_name || ''}`.trim(),
      asset_category: row.assets?.category || 'ROOM',
      asset_location: row.assets?.location || row.room_building || '-',
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

    const { data: itemRows, error: itemError } = await supabaseAdmin
      .from('loan_request_items')
      .select('assets(name, code, category, location, specs, condition)')
      .eq('loan_request_id', loan.id);
    if (itemError) throw itemError;
    const itemAssets = (itemRows || []).map((item) => item.assets?.[0]).filter(Boolean);
    loan.asset_items = [
      ...(loan.assets ? [loan.assets] : []),
      ...itemAssets,
    ];
    loan.asset_name = [
      ...(loan.assets ? [loan.assets.name] : []),
      ...itemAssets.map((asset) => asset.name),
    ].join(' + ') || `Ruangan ${loan.room_name || ''}`.trim();
    loan.asset_code = [
      ...(loan.assets ? [loan.assets.code] : []),
      ...itemAssets.map((asset) => asset.code),
    ].join(' + ') || `${loan.room_building || ''} / ${loan.room_name || ''}`.trim();

    return NextResponse.json({ success: true, loan });
  } catch (err: unknown) {
    console.error('Get loan by ticket error:', err);
    return NextResponse.json(
      { error: 'Gagal memuat detail pengajuan peminjaman' },
      { status: 500 }
    );
  }
}

