import { getCurrentUser, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

type UserRole = 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS';

const validRoles: UserRole[] = ['ADMIN', 'STAFF_SARPRAS', 'KEPALA_SARPRAS'];

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN' ? user : null;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya admin yang dapat mengelola akun.' }, { status: 403 });
  }

  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data akun' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya admin yang dapat membuat akun.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const username = String(body.username || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    const role = body.role as UserRole;

    if (!username || !name || !password || !role) {
      return NextResponse.json({ error: 'Username, nama, password, dan role wajib diisi' }, { status: 400 });
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau tanda hubung' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal terdiri dari 6 karakter' }, { status: 400 });
    }
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role akun tidak valid' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json({ error: 'Username tersebut sudah digunakan' }, { status: 409 });
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const { data: createdUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        id,
        username,
        password_hash: hashPassword(password),
        name,
        role,
        created_at: new Date().toISOString(),
      })
      .select('id, username, name, role, created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, user: createdUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 });
  }
}
