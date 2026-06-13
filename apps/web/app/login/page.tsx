import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Gavel } from 'lucide-react';

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const oauthFailed = q.error === 'auth';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(0.14_0.035_268)] text-[oklch(0.96_0.01_85)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 60% at 20% -10%, oklch(0.38 0.12 268 / 0.4), transparent 50%),
            radial-gradient(ellipse 70% 50% at 100% 100%, oklch(0.25 0.06 268 / 0.5), transparent 45%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(oklch(1 0 0 / 0.06) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.06) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <div className="mb-10 text-center">
          <Link href="/" className="mb-6 inline-flex items-center justify-center gap-2 text-[oklch(0.95_0.02_85)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <Gavel className="h-5 w-5" />
            </span>
          </Link>
          <h1 className="font-heading text-3xl font-normal tracking-tight md:text-4xl">Welcome back</h1>
          <p className="mt-2 text-base text-[oklch(0.72_0.03_85)]">Sign in to Benchline</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[oklch(0.18_0.04_268/0.65)] p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-md md:p-8">
          {oauthFailed && (
            <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-100">
              Sign-in didn&apos;t complete. Try again or use email and password.
            </p>
          )}
          <LoginForm variant="onDark" />
        </div>
        <p className="mt-8 text-center text-sm text-[oklch(0.65_0.03_85)]">
          No account?{' '}
          <Link href="/signup" className="font-medium text-[oklch(0.9_0.02_85)] underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
