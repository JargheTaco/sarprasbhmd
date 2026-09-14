import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

// Pengecekan URL dan Key sederhana
export const hasSupabaseConfig = Boolean(
  supabaseUrl && 
  serviceRoleKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

export const supabaseConfigErrorMessage =
  'Supabase belum dikonfigurasi dengan benar. Periksa NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local lalu restart server.';

export function assertSupabaseConfigured(): void {
  if (!hasSupabaseConfig) {
    throw new Error(supabaseConfigErrorMessage);
  }
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export function getSupabaseError(error: { message?: string } | null): string {
  return error?.message || 'Supabase request failed';
}