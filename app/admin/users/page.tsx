import { createServiceClient } from '@/lib/supabase/service';
import { UsersTable, type AdminUserRow } from '@/components/admin/users-table';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const service = createServiceClient();

  let query = service
    .from('profiles')
    .select('id, full_name, email, role, is_admin, bar_number, bar_verification_status, insurance_status, rating_avg, rating_count, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (q) {
    const term = `%${q}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term},bar_number.ilike.${term}`);
  }

  const { data } = await query;
  const rows = (data ?? []) as AdminUserRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-[-0.02em]">Users</h1>
        <p className="text-sm text-muted-foreground">{rows.length} shown. Search by name, email, or bar number.</p>
      </div>
      <UsersTable rows={rows} currentQuery={q ?? ''} />
    </div>
  );
}
