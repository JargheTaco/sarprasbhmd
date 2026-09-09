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
    const { name, category, location, condition, status, specs, capacity, purchase_year } = body;

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
      location,
      condition,
      status,
      specs: specs || null,
      capacity: Number(capacity) || 0,
      purchase_year: Number(purchase_year) || new Date().getFullYear(),
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

    // Check if asset is currently linked to any active loans
    const { data: activeLoan, error: activeLoanError } = await supabaseAdmin
      .from('loan_requests')
      .select('id')
      .eq('asset_id', id)
      .in('status', ['PENDING_STAFF', 'PENDING_HEAD', 'APPROVED', 'IN_USE'])
      .limit(1)
      .maybeSingle();
    if (activeLoanError) throw activeLoanError;

    if (activeLoan) {
      return NextResponse.json(
        { error: 'Aset tidak dapat dihapus karena masih terkait peminjaman aktif' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin.from('assets').delete().eq('id', id);
    if (deleteError) throw deleteError;
    return NextResponse.json({ success: true, message: 'Aset berhasil dihapus' });
  } catch (err: unknown) {
    console.error('Delete asset error:', err);
    return NextResponse.json({ error: 'Gagal menghapus aset' }, { status: 500 });
  }
}

