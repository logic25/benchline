import { Resend } from 'resend';

// Singleton Resend client. Returns null when RESEND_API_KEY is unset so callers
// can degrade gracefully (email is never required for a transaction to succeed).
let client: Resend | null = null;

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

// From address, e.g. "Benchline <hello@benchline.app>". Falls back to a sensible
// default so misconfiguration surfaces in Resend logs rather than crashing.
export function emailFrom(): string {
  return process.env.EMAIL_FROM || 'Benchline <hello@benchline.app>';
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
