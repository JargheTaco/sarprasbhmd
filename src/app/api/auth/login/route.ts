import { AuthUser, COOKIE_NAME, createToken, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS' | 'KEPALA_ADMIN_UMUM';
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, password_hash, name, role')
      .eq('username', username)
      .maybeSingle<UserRow>();

    if (error) {
      throw error;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const hashed = hashPassword(password);
    if (hashed !== user.password_hash) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const token = createToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat login' },
      { status: 500 }
    );
  }
}

