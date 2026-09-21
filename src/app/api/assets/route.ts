import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const statusFilter = searchParams.get('status');
    const building = searchParams.get('building');
    const room = searchParams.get('room');
    const search = searchParams.get('q');
    const loanableOnly = searchParams.get('loanable') === 'true';

    let query = supabaseAdmin.from('assets').select('*');

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    if (building && building !== 'ALL') {
      query = query.eq('building', building);
    }

    if (room && room !== 'ALL') {
      query = query.eq('room', room);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,building.ilike.%${search}%,room.ilike.%${search}%,location.ilike.%${search}%,specs.ilike.%${search}%`);
    }

    const { data: fetchedAssets, error } = await query.order('name', { ascending: true });
    if (error) throw error;

    const assets = loanableOnly
      ? (fetchedAssets || []).filter((asset) => {
          if (asset.category === 'VEHICLE' || asset.category === 'ROOM') return true;
          if (asset.category !== 'ELECTRONIC') return false;

          const searchableText = `${asset.name} ${asset.location} ${asset.specs}`.toLowerCase();
          return searchableText.includes('sarpras') || searchableText.includes('proyektor') || searchableText.includes('projector');
        })
      : fetchedAssets;
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
    const {
      code,
      name,
      category,
      building,
      room,
      location,
      condition,
      status,
      specs,
      capacity,
      purchase_year,
      purchase_date,
      purchase_price,
      depreciation_rate,
      depreciation_previous,
      depreciation_current,
      book_value,
      funding_source,
    } = body;

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
      capacity: Number(capacity) || 1,
      purchase_year: Number(purchase_year) || new Date().getFullYear(),
      purchase_date: purchase_date || null,
      purchase_price: Number(purchase_price) || 0,
      depreciation_rate: Number(depreciation_rate) || 10,
      depreciation_previous: Number(depreciation_previous) || 0,
      depreciation_current: Number(depreciation_current) || 0,
      book_value: Number(book_value) || 0,
      funding_source: funding_source || 'YPTSH',
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

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Admin yang dapat menghapus data gedung' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const building = searchParams.get('building')?.trim();
    if (!building) {
      return NextResponse.json({ error: 'Nama gedung wajib diisi' }, { status: 400 });
    }

    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('id')
      .eq('building', building);
    if (assetsError) throw assetsError;
    if (!assets?.length) {
      return NextResponse.json({ error: 'Gedung tidak memiliki aset' }, { status: 404 });
    }

    const assetIds = assets.map((asset) => asset.id);
    const [{ data: linkedLoans, error: loansError }, { data: linkedMaintenance, error: maintenanceError }] = await Promise.all([
      supabaseAdmin.from('loan_requests').select('id').in('asset_id', assetIds).limit(1),
      supabaseAdmin.from('maintenance_records').select('id').in('asset_id', assetIds).limit(1),
    ]);
    if (loansError) throw loansError;
    if (maintenanceError) throw maintenanceError;

    if (linkedLoans?.length) {
      return NextResponse.json(
        { error: 'Gedung tidak dapat dihapus karena memiliki aset dengan riwayat peminjaman.' },
        { status: 400 }
      );
    }
    if (linkedMaintenance?.length) {
      return NextResponse.json(
        { error: 'Gedung tidak dapat dihapus karena memiliki aset dengan riwayat perawatan.' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin.from('assets').delete().eq('building', building);
    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: `Gedung ${building} dan ${assets.length} aset berhasil dihapus`,
      deletedCount: assets.length,
    });
  } catch (err: unknown) {
    console.error('Delete building assets error:', err);
    return NextResponse.json({ error: 'Gagal menghapus gedung dan asetnya' }, { status: 500 });
  }
}
