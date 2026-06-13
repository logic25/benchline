"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { joinWaitlist, type WaitlistState } from "@/app/waitlist/actions";
import { Button, ButtonLink } from "@/components/ui";

const initial: WaitlistState = { status: "idle" };

// In a fully static preview build there is no server runtime for the action.
const STATIC_PREVIEW = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

function SubmitButton({ pending }: { pending?: boolean }) {
  const status = useFormStatus();
  const isPending = pending ?? status.pending;
  return (
    <Button type="submit" size="lg" className="w-full" disabled={isPending}>
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Joining…
        </>
      ) : (
        <>
          Join the waitlist <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

function SuccessPanel({ message }: { message?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-10 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15">
        <CheckCircle2 className="h-8 w-8 text-gold-dark" strokeWidth={1.8} />
      </div>
      <h2 className="mt-6 font-serif text-3xl text-navy">You&rsquo;re on the list.</h2>
      <p className="mx-auto mt-3 max-w-md text-slate">
        {message ||
          "Thanks for joining. We'll reach out as we open access across NYC. Watch your inbox for a confirmation."}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <ButtonLink href="/" variant="outline">
          Back to home
        </ButtonLink>
        <ButtonLink href="/pricing">See pricing</ButtonLink>
      </div>
    </div>
  );
}

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[0.97rem] text-navy placeholder:text-slate-light/70 focus:border-gold-dark focus:outline-none focus:ring-2 focus:ring-gold/30";
const labelCls = "mb-1.5 block text-sm font-medium text-navy";

function Fields({ error }: { error?: string }) {
  return (
    <div className="space-y-5">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="email" className={labelCls}>
          Email <span className="text-gold-dark">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@firm.com"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="role" className={labelCls}>
          How would you use Benchline? <span className="text-gold-dark">*</span>
        </label>
        <select id="role" name="role" required defaultValue="" className={field}>
          <option value="" disabled>
            Select one
          </option>
          <option value="litigator">I&rsquo;m a litigator who needs coverage</option>
          <option value="per-diem">I&rsquo;m a per diem attorney</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="barNumber" className={labelCls}>
            NY bar number{" "}
            <span className="font-normal text-slate-light">(optional)</span>
          </label>
          <input
            id="barNumber"
            name="barNumber"
            type="text"
            placeholder="e.g. 5XXXXXX"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="city" className={labelCls}>
            City / borough{" "}
            <span className="font-normal text-slate-light">(optional)</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            placeholder="Manhattan"
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="firmName" className={labelCls}>
          Firm name <span className="font-normal text-slate-light">(optional)</span>
        </label>
        <input
          id="firmName"
          name="firmName"
          type="text"
          placeholder="Your firm or solo practice"
          className={field}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const formShell =
  "rounded-3xl border border-line bg-white p-7 shadow-[var(--shadow-card)] md:p-9";

function Disclaimer() {
  return (
    <p className="mt-5 text-center text-xs leading-relaxed text-slate-light">
      By joining you agree to our{" "}
      <a href="/legal/terms" className="underline">
        Terms
      </a>{" "}
      and{" "}
      <a href="/legal/privacy" className="underline">
        Privacy Policy
      </a>
      . We&rsquo;ll only email you about Benchline.
    </p>
  );
}

/** Client-only variant used in static preview builds (no server runtime). */
function StaticForm() {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "");
    const role = String(data.get("role") || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!role) {
      setError("Please select how you'd use Benchline.");
      return;
    }
    setError(undefined);
    setPending(true);
    // Preview only — no backend. Simulate the confirmed state.
    setTimeout(() => setDone(true), 500);
  }

  if (done)
    return (
      <SuccessPanel message="Thanks for joining. (This is a preview — connect Supabase and Resend to capture real signups.)" />
    );

  return (
    <form onSubmit={onSubmit} className={formShell}>
      <Fields error={error} />
      <div className="mt-5">
        <SubmitButton pending={pending} />
      </div>
      <Disclaimer />
    </form>
  );
}

/** Server-action variant used on the real (Vercel) deployment. */
function ServerForm() {
  const [state, formAction] = useActionState(joinWaitlist, initial);
  if (state.status === "success") return <SuccessPanel message={state.message} />;
  return (
    <form action={formAction} className={formShell}>
      <Fields error={state.status === "error" ? state.message : undefined} />
      <div className="mt-5">
        <SubmitButton />
      </div>
      <Disclaimer />
    </form>
  );
}

export function WaitlistForm() {
  return STATIC_PREVIEW ? <StaticForm /> : <ServerForm />;
}
