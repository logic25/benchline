import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client for server-side code that must bypass RLS: the Stripe
// webhook (no user session), the auto-release cron, and audit-log writes.
// NEVER import this from client components — the key must stay server-only.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required');
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
