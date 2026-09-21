import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.AUTH_SECRET || 'sarpras-jwt-campus-secret-key-2026-secure';
const COOKIE_NAME = 'sarpras_session';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS' | 'KEPALA_ADMIN_UMUM';
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString();
}

export function createToken(payload: AuthUser): string {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const body = JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  });

  const headerB64 = base64UrlEncode(header);
  const bodyB64 = base64UrlEncode(body);
  const data = `${headerB64}.${bodyB64}`;

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, bodyB64, signature] = parts;
    const data = `${headerB64}.${bodyB64}`;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(bodyB64));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifyToken(sessionCookie.value);
}

export { COOKIE_NAME };

