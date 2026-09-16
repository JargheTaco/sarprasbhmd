import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    let query = supabaseAdmin.from('assets').select('*');

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,building.ilike.%${search}%,room.ilike.%${search}%,location.ilike.%${search}%,specs.ilike.%${search}%`);
    }

    const { data: assets, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
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
    const { code, name, category, building, room, location, condition, status, specs, capacity, purchase_year } = body;

    if (!code || !name || !category || !building || !room) {
      return NextResponse.json(
        { error: 'Kode, Nama, Kategori, Gedung, dan Ruang aset wajib diisi' },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('assets')
      .select('id')
      .eq('code', code.toUpperCase())
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json(
        { error: `Kode aset ${code} sudah digunakan oleh aset lain` },
        { status: 400 }
      );
    }

    const id = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const { error: insertError } = await supabaseAdmin.from('assets').insert({
      id,
      code: code.toUpperCase(),
      name,
      category,
      building,
      room,
      location: location || `${building} - ${room}`,
      condition: condition || 'BAIK',
      status: status || 'TERSEDIA',
      specs: specs || null,
      capacity: Number(capacity) || 0,
      purchase_year: Number(purchase_year) || new Date().getFullYear(),
      created_at: now,
    });
    if (insertError) throw insertError;

    const { data: newAsset, error: fetchError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    return NextResponse.json({ success: true, asset: newAsset });
  } catch (err: unknown) {
    console.error('Create asset error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan data aset' }, { status: 500 });
  }
}

