import twilio from 'twilio';

// Lazily-constructed Twilio client. Returns null when credentials are unset so
// callers can degrade gracefully (SMS is best-effort and never required).
let client: ReturnType<typeof twilio> | null = null;

export function getTwilio(): ReturnType<typeof twilio> | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  if (!client) client = twilio(sid, token);
  return client;
}

export function smsFromNumber(): string | undefined {
  return process.env.TWILIO_FROM_NUMBER;
}

export function isSmsConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

// Sends an SMS, returning the message SID on success or null on failure. Never
// throws — the caller decides how to record a failure.
export async function sendSms(to: string, body: string): Promise<string | null> {
  const tw = getTwilio();
  const from = smsFromNumber();
  if (!tw || !from) return null;
  try {
    const msg = await tw.messages.create({ to, from, body });
    return msg.sid;
  } catch (err) {
    console.error('twilio send failed:', err instanceof Error ? err.message : 'unknown');
    return null;
  }
}
