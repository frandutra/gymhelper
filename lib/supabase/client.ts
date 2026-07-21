import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para componentes 'use client'.
 * Solo expone la publishable/anon key (pública); la seguridad real la da RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
