import { getCurrentUser, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

type UserRole = 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS';
const validRoles: UserRole[] = ['ADMIN', 'STAFF_SARPRAS', 'KEPALA_SARPRAS'];

async function getAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN' ? user : null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya admin yang dapat mengubah akun.' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const username = String(body.username || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    const role = body.role as UserRole;

    if (!username || !name || !role) {
      return NextResponse.json({ error: 'Username, nama, dan role wajib diisi' }, { status: 400 });
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau tanda hubung' }, { status: 400 });
    }
    if (password && password.length < 6) {
      return NextResponse.json({ error: 'Password minimal terdiri dari 6 karakter' }, { status: 400 });
    }
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role akun tidak valid' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json({ error: 'Username tersebut sudah digunakan' }, { status: 409 });
    }

    const updates: { username: string; name: string; role: UserRole; password_hash?: string } = { username, name, role };
    if (password) updates.password_hash = hashPassword(password);

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, username, name, role, created_at')
      .maybeSingle();
    if (error) throw error;
    if (!updatedUser) return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Gagal mengubah akun' }, { status: 500 });
  }
}

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
