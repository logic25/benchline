import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendForNotification } from '@/lib/email/send-for-notification';

// Fired (fire-and-forget) by the signup form after account creation. Sends the
// welcome email to the currently authenticated user. Idempotency is not
// critical — a duplicate welcome is harmless — but we only send once per call.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const sent = await sendForNotification({
    service,
    recipientUserId: user.id,
    emailKey: 'welcome',
    context: {},
  });

  return NextResponse.json({ sent });
}
