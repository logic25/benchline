'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

const darkField =
  'border-white/20 bg-white/[0.07] text-[oklch(0.98_0.005_85)] placeholder:text-[oklch(0.55_0.02_85)] focus-visible:border-white/40 focus-visible:ring-white/15';

export function LoginForm({ variant = 'default' }: { variant?: 'default' | 'onDark' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const onDark = variant === 'onDark';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  }

  const formInner = (
    <form onSubmit={handleLogin} className="space-y-4">
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
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
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
      {!onDark && (
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary underline">
            Sign up
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
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>Sign in to your Benchline account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthButtons />
        {formInner}
      </CardContent>
    </Card>
  );
}
