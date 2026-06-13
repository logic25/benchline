'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface PhoneVerificationCardProps {
  initialPhone: string;
  initialVerified: boolean;
}

export function PhoneVerificationCard({ initialPhone, initialVerified }: PhoneVerificationCardProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [verified, setVerified] = useState(initialVerified);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    try {
      const res = await fetch('/api/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof json.error === 'string' ? json.error : 'Could not send code');
        return;
      }
      setCodeSent(true);
      setVerified(false);
      toast.success('Verification code sent');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    try {
      const res = await fetch('/api/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof json.error === 'string' ? json.error : 'Could not verify');
        return;
      }
      setVerified(true);
      setCodeSent(false);
      setCode('');
      toast.success('Phone verified');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone verification</CardTitle>
        <CardDescription>
          Verify your mobile number to receive day-of SMS reminders for appearances you cover. Use international
          format, e.g. +12125550100.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mobile number</Label>
          <div className="flex gap-2">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+12125550100"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={sendCode} disabled={busy || phone.trim().length < 8}>
              {verified ? 'Re-verify' : 'Send code'}
            </Button>
          </div>
          {verified && <p className="text-xs text-green-700">Verified — SMS reminders are enabled.</p>}
        </div>

        {codeSent && (
          <div className="space-y-2">
            <Label>Enter the 6-digit code</Label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
                className="flex-1"
              />
              <Button type="button" onClick={verifyCode} disabled={busy || code.trim().length !== 6}>
                Verify
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
