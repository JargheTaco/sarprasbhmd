import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya admin yang dapat menghapus akun.' }, { status: 403 });
  }

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: 'Akun yang sedang digunakan tidak dapat dihapus' }, { status: 400 });
  }

  try {
    const { data: target, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('id', id)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Gagal menghapus akun' }, { status: 500 });
  }
}
