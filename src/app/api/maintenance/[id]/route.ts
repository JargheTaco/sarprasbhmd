import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'STAFF_SARPRAS' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Petugas/Staff yang dapat memperbarui data perawatan.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, technician_name, scheduled_date, cost, action_taken, spare_parts } = body;

    interface MntRow {
      id: string;
      asset_id: string;
      status: string;
    }

    const { data: mnt, error: findError } = await supabaseAdmin
      .from('maintenance_records')
      .select('id, asset_id, status')
      .eq('id', id)
      .maybeSingle<MntRow>();
    if (findError) throw findError;
    if (!mnt) {
      return NextResponse.json({ error: 'Data perawatan tidak ditemukan' }, { status: 404 });
    }

    const completed_date = status === 'COMPLETED' ? new Date().toISOString().split('T')[0] : null;

    const changes: Record<string, string | number | null> = {};
    if (status) changes.status = status;
    if (technician_name) changes.technician_name = technician_name;
    if (scheduled_date) changes.scheduled_date = scheduled_date;
    if (cost !== undefined) changes.cost = Number(cost);
    if (action_taken) changes.action_taken = action_taken;
    if (spare_parts) changes.spare_parts = spare_parts;
    if (status === 'COMPLETED') changes.completed_date = completed_date;
    const { error: updateError } = await supabaseAdmin.from('maintenance_records').update(changes).eq('id', id);
    if (updateError) throw updateError;

    // If completed, return asset to TERSEDIA and condition to BAIK
    if (status === 'COMPLETED') {
      const { error: assetError } = await supabaseAdmin.from('assets')
        .update({ status: 'TERSEDIA', condition: 'BAIK' })
        .eq('id', mnt.asset_id);
      if (assetError) throw assetError;
    }

    const { data: updatedRow, error: fetchError } = await supabaseAdmin
      .from('maintenance_records')
      .select('*, assets(name, code)')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    const updated = { ...updatedRow, asset_name: updatedRow.assets?.name, asset_code: updatedRow.assets?.code, assets: undefined };

    return NextResponse.json({
      success: true,
      message: 'Data pemeliharaan aset berhasil diperbarui',
      record: updated,
    });
  } catch (err: unknown) {
    console.error('Update maintenance error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui data perawatan' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Admin yang dapat menghapus catatan perawatan' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { error } = await supabaseAdmin.from('maintenance_records').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Catatan perawatan berhasil dihapus' });
  } catch (err: unknown) {
    console.error('Delete maintenance error:', err);
    return NextResponse.json({ error: 'Gagal menghapus catatan perawatan' }, { status: 500 });
  }
}

