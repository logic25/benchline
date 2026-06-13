import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';
import { Gavel } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(0.14_0.035_268)] text-[oklch(0.96_0.01_85)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 60% at 80% -10%, oklch(0.38 0.12 268 / 0.35), transparent 50%),
            radial-gradient(ellipse 70% 50% at 0% 100%, oklch(0.25 0.06 268 / 0.45), transparent 45%)
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
      <div className="relative mx-auto min-h-screen max-w-lg px-4 py-12 md:flex md:flex-col md:justify-center md:py-16">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-5 inline-flex items-center justify-center gap-2 text-[oklch(0.95_0.02_85)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <Gavel className="h-5 w-5" />
            </span>
          </Link>
          <h1 className="font-heading text-4xl font-normal tracking-[-0.02em] md:text-[2.75rem] md:leading-tight">
            Join Benchline
          </h1>
          <p className="mt-2 text-base text-[oklch(0.72_0.03_85)]">Court coverage, on demand</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[oklch(0.18_0.04_268/0.65)] p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-md md:p-8">
          <SignupForm variant="onDark" />
        </div>
        <p className="mt-8 text-center text-sm text-[oklch(0.65_0.03_85)]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[oklch(0.9_0.02_85)] underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
