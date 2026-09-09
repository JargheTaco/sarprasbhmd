import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const q = searchParams.get('q');

    let query = supabaseAdmin.from('maintenance_records').select('*, assets(name, code, location, condition)');

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (type && type !== 'ALL') {
      query = query.eq('type', type);
    }

    if (q) {
      query = query.or(`ticket_number.ilike.%${q}%,title.ilike.%${q}%,technician_name.ilike.%${q}%`);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    const records = (data || []).map((record) => ({
      ...record,
      asset_name: record.assets?.name,
      asset_code: record.assets?.code,
      asset_location: record.assets?.location,
      asset_condition: record.assets?.condition,
      assets: undefined,
    }));
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
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('id, category')
      .eq('id', asset_id)
      .maybeSingle<AssetCheck>();
    if (assetError) throw assetError;
    if (!asset) {
      return NextResponse.json({ error: 'Aset tidak ditemukan' }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const { count, error: countError } = await supabaseAdmin
      .from('maintenance_records')
      .select('id', { count: 'exact', head: true });
    if (countError) throw countError;
    const ticketCode = `MNT-${currentYear}-${((count || 0) + 1).toString().padStart(4, '0')}`;
    const id = `mnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const mntCategory = category || (asset.category === 'MACHINERY' || asset.category === 'ELECTRICAL' ? asset.category : 'ELECTRONIC');

    const { error: insertError } = await supabaseAdmin.from('maintenance_records').insert({
      id,
      ticket_number: ticketCode,
      asset_id,
      type: type || 'PREVENTIVE',
      category: mntCategory,
      title,
      description: description || null,
      technician_name: technician_name || 'Teknisi Sarpras',
      scheduled_date,
      cost: Number(cost) || 0,
      status: 'SCHEDULED',
      created_at: now,
    });
    if (insertError) throw insertError;

    // If it is a corrective maintenance ticket, set asset status to DALAM_PERAWATAN
    if (type === 'CORRECTIVE') {
      const { error: assetUpdateError } = await supabaseAdmin.from('assets').update({ status: 'DALAM_PERAWATAN' }).eq('id', asset_id);
      if (assetUpdateError) throw assetUpdateError;
    }

    const { data: createdRow, error: createdError } = await supabaseAdmin
      .from('maintenance_records')
      .select('*, assets(name, code)')
      .eq('id', id)
      .single();
    if (createdError) throw createdError;
    const created = { ...createdRow, asset_name: createdRow.assets?.name, asset_code: createdRow.assets?.code, assets: undefined };

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

