'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import type { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

const darkField =
  'border-white/20 bg-white/[0.07] text-[oklch(0.98_0.005_85)] placeholder:text-[oklch(0.55_0.02_85)] focus-visible:border-white/40 focus-visible:ring-white/15';

export function SignupForm({ variant = 'default' }: { variant?: 'default' | 'onDark' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('litigator');
  const [barNumber, setBarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const onDark = variant === 'onDark';

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        role,
        bar_number: barNumber || null,
        full_name: fullName,
      }).eq('id', user.id);

      // Fire-and-forget welcome email; never block account creation on it.
      fetch('/api/email/welcome', { method: 'POST' }).catch(() => {});
    }

    setLoading(false);
    window.location.href = '/dashboard';
  }

  const formInner = (
    <form onSubmit={handleSignup} className="space-y-4">
      {error && (
        <div
          className={cn(
            'rounded-lg border p-3 text-sm',
            onDark ? 'border-red-400/30 bg-red-500/15 text-red-100' : 'bg-red-50 text-red-600'
          )}
        >
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="fullName" className={onDark ? 'text-[oklch(0.82_0.02_85)]' : undefined}>
          Full Name
        </Label>
        <Input
          id="fullName"
          placeholder="Jane Smith, Esq."
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className={onDark ? cn('h-10', darkField) : 'h-10'}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className={onDark ? 'text-[oklch(0.82_0.02_85)]' : undefined}>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@lawfirm.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={onDark ? cn('h-10', darkField) : 'h-10'}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className={onDark ? 'text-[oklch(0.82_0.02_85)]' : undefined}>
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className={onDark ? cn('h-10', darkField) : 'h-10'}
        />
      </div>
      <div className="relative z-20 space-y-2">
        <Label className={onDark ? 'text-[oklch(0.82_0.02_85)]' : undefined}>I am a…</Label>
        <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
          <SelectTrigger
            className={cn(
              'min-h-10 py-2',
              onDark && cn(darkField, '[&_svg]:text-[oklch(0.72_0.03_85)]')
            )}
          >
            <SelectValue placeholder="Choose your role" />
          </SelectTrigger>
          <SelectContent
            sideOffset={8}
            alignItemWithTrigger={false}
            className={cn(
              onDark &&
                'z-[300] max-h-72 border border-white/20 bg-[oklch(0.15_0.04_268)] text-[oklch(0.95_0.02_85)] shadow-2xl ring-1 ring-white/15 [&_[data-slot=select-item]]:cursor-pointer [&_[data-slot=select-item]]:text-[oklch(0.92_0.02_85)] [&_[data-slot=select-item]:focus]:bg-white/12 [&_[data-slot=select-item]:focus]:text-white [&_[data-slot=select-scroll-up-button]]:bg-[oklch(0.15_0.04_268)] [&_[data-slot=select-scroll-down-button]]:bg-[oklch(0.15_0.04_268)]'
            )}
          >
            <SelectItem value="litigator">Litigator (I need coverage)</SelectItem>
            <SelectItem value="per_diem">Per Diem Attorney (I provide coverage)</SelectItem>
            <SelectItem value="both">Both (post and cover)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="barNumber" className={onDark ? 'text-[oklch(0.82_0.02_85)]' : undefined}>
          NY Bar Number
        </Label>
        <Input
          id="barNumber"
          placeholder="e.g. 1234567"
          value={barNumber}
          onChange={(e) => setBarNumber(e.target.value)}
          className={onDark ? cn('h-10', darkField) : 'h-10'}
        />
      </div>
      <Button
        type="submit"
        className={cn(
          'h-10 w-full',
          onDark && 'border-0 bg-[oklch(0.96_0.015_85)] font-medium text-primary shadow-none hover:bg-white'
        )}
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
      {!onDark && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      )}
    </form>
  );

  if (onDark) {
    return (
      <>
        <OAuthButtons onDark />
        {formInner}
      </>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Join Benchline</CardTitle>
        <CardDescription>Create your account to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthButtons />
        {formInner}
      </CardContent>
    </Card>
  );
}
