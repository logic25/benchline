'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { UserRole, BarVerificationStatus, InsuranceStatus } from '@/lib/types';

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  bar_number: string | null;
  bar_verification_status: BarVerificationStatus;
  insurance_status: InsuranceStatus;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export function UsersTable({ rows, currentQuery }: { rows: AdminUserRow[]; currentQuery: string }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Input
        defaultValue={currentQuery}
        placeholder="Search name, email, or bar number — press Enter"
        className="max-w-md"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const v = (e.target as HTMLInputElement).value.trim();
            router.push(v ? `/admin/users?q=${encodeURIComponent(v)}` : '/admin/users');
          }
        }}
      />
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Bar</th>
              <th className="px-3 py-2 font-medium">Insurance</th>
              <th className="px-3 py-2 font-medium">Rating</th>
              <th className="px-3 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No users match.</td></tr>
            ) : rows.map((u) => (
              <tr key={u.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline">{u.full_name || '—'}</Link>
                  {u.is_admin && <Badge variant="secondary" className="ml-2">admin</Badge>}
                </td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.role.replace('_', ' ')}</td>
                <td className="px-3 py-2"><Badge variant={u.bar_verification_status === 'verified' ? 'outline' : 'secondary'}>{u.bar_verification_status}</Badge></td>
                <td className="px-3 py-2"><Badge variant={u.insurance_status === 'verified' ? 'outline' : 'secondary'}>{u.insurance_status}</Badge></td>
                <td className="px-3 py-2 tabular-nums">{u.rating_count > 0 ? `${u.rating_avg.toFixed(1)} (${u.rating_count})` : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{u.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
