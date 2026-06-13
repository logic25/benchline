import { Badge } from '@/components/ui/badge';
import type { AppearanceStatus, PaymentStatus } from '@/lib/types';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

const APPEARANCE_VARIANT: Record<AppearanceStatus, Variant> = {
  open: 'secondary',
  claimed: 'default',
  in_progress: 'default',
  completed: 'outline',
  disputed: 'destructive',
  cancelled: 'outline',
};

const PAYMENT_VARIANT: Record<PaymentStatus, Variant> = {
  pending: 'secondary',
  authorized: 'default',
  captured: 'default',
  released: 'outline',
  refunded: 'outline',
  disputed: 'destructive',
  failed: 'destructive',
};

export function StatusBadge({ status }: { status: AppearanceStatus }) {
  return <Badge variant={APPEARANCE_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_VARIANT[status]}>{status}</Badge>;
}
