"use server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const ROLES = ["litigator", "per-diem", "both"] as const;

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "").trim();
  const barNumber = String(formData.get("barNumber") || "").trim();
  const firmName = String(formData.get("firmName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  // Honeypot — bots fill this; humans never see it
  const trap = String(formData.get("company") || "").trim();

  if (trap) {
    return { status: "success" }; // silently swallow bots
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { status: "error", message: "Please select how you'd use Benchline." };
  }

  const record = {
    email,
    role,
    bar_number: barNumber || null,
    firm_name: firmName || null,
    city: city || null,
  };

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // --- Persist ---
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      const { error } = await supabase.from("waitlist").insert(record);
      if (error) {
        if (error.code === "23505") {
          return {
            status: "success",
            message: "You're already on the list — we'll be in touch.",
          };
        }
        console.error("[waitlist] Supabase insert error:", error.message);
        return {
          status: "error",
          message: "Something went wrong saving your spot. Please try again.",
        };
      }
    } catch (e) {
      console.error("[waitlist] Supabase exception:", e);
      return { status: "error", message: "Something went wrong. Please try again." };
    }
  } else {
    // Fallback: no Supabase configured — log so the signup isn't lost in dev.
    console.log("[waitlist] (no Supabase configured) New signup:", record);
  }

  // --- Confirmation email (best-effort) ---
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Benchline <hello@benchline.com>";
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "You're on the Benchline waitlist",
        text: `Thanks for joining the Benchline waitlist.

We're building the NYC per diem attorney marketplace — verified attorneys on both sides, AI-structured outcome reports, and Stripe instant payouts.

We'll reach out as we open access in your area. In the meantime, reply to this email with any questions — a real (NY-barred) person will answer.

— The Benchline team
hello@benchline.com`,
      });
    } catch (e) {
      // Don't fail the signup if email sending hiccups.
      console.error("[waitlist] Resend error:", e);
    }
  } else {
    console.log("[waitlist] (no Resend configured) Would email confirmation to:", email);
  }

  return { status: "success" };
}
