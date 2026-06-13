import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

// Server-side gate for the entire /admin subtree. Non-admins (and logged-out
// users) get a 404, not a 403 — we do not want to confirm that admin routes
// exist. This runs on the server before any admin page renders; the per-route
// API handlers and RLS enforce the same check again for mutations.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: me } = await supabase
    .from('profiles')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .single();
  if (!me?.is_admin) notFound();

  return <AdminShell adminName={me.full_name}>{children}</AdminShell>;
}
