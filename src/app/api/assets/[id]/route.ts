import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { data: asset, error } = await supabaseAdmin.from('assets').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!asset) {
      return NextResponse.json({ error: 'Aset tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, asset });
  } catch (err: unknown) {
    console.error('Get asset error:', err);
    return NextResponse.json({ error: 'Gagal mengambil detail aset' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF_SARPRAS')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Petugas/Admin yang dapat mengubah aset.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const {
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

    if (!name || !category || !building || !room) {
      return NextResponse.json(
        { error: 'Nama, Kategori, Gedung, dan Ruang aset wajib diisi' },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('assets')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      return NextResponse.json({ error: 'Aset tidak ditemukan' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin.from('assets').update({
      name,
      category,
      building,
      room,
      location: location || `${building} - ${room}`,
      condition,
      status,
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
    }).eq('id', id);
    if (updateError) throw updateError;

    const { data: updated, error: fetchError } = await supabaseAdmin.from('assets').select('*').eq('id', id).single();
    if (fetchError) throw fetchError;
    return NextResponse.json({ success: true, asset: updated });
  } catch (err: unknown) {
    console.error('Update asset error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui data aset' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Admin yang dapat menghapus data aset' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Keep historical loan records valid; an asset with any loan history cannot be deleted.
    const { data: linkedLoan, error: linkedLoanError } = await supabaseAdmin
      .from('loan_requests')
      .select('id')
      .eq('asset_id', id)
      .limit(1)
      .maybeSingle();
    if (linkedLoanError) throw linkedLoanError;

    const { data: linkedLoanItem, error: linkedLoanItemError } = await supabaseAdmin
      .from('loan_request_items')
      .select('id')
      .eq('asset_id', id)
      .limit(1)
      .maybeSingle();
    if (linkedLoanItemError) throw linkedLoanItemError;

    if (linkedLoan || linkedLoanItem) {
      return NextResponse.json(
        { error: 'Aset tidak dapat dihapus karena memiliki riwayat peminjaman. Ubah status menjadi DALAM_PERAWATAN atau edit datanya.' },
        { status: 400 }
      );
    }

    const { data: linkedMaintenance, error: linkedMaintenanceError } = await supabaseAdmin
      .from('maintenance_records')
      .select('id')
      .eq('asset_id', id)
      .limit(1)
      .maybeSingle();
    if (linkedMaintenanceError) throw linkedMaintenanceError;
    if (linkedMaintenance) {
      return NextResponse.json(
        { error: 'Aset tidak dapat dihapus karena memiliki riwayat perawatan. Ubah status atau edit datanya.' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin.from('assets').delete().eq('id', id);
    if (deleteError) {
      console.error('Delete asset database error:', deleteError);
      return NextResponse.json(
        { error: 'Aset tidak dapat dihapus karena masih dipakai oleh data lain di Supabase.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, message: 'Aset berhasil dihapus' });
  } catch (err: unknown) {
    console.error('Delete asset error:', err);
    return NextResponse.json({ error: 'Gagal menghapus aset' }, { status: 500 });
  }
}

