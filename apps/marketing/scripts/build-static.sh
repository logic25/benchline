#!/usr/bin/env bash
# Builds a fully static `out/` for preview hosting (no server runtime).
# Temporarily stubs the server-action file (incompatible with output: export),
# then restores it so the real source is unchanged.
set -e
cd "$(dirname "$0")/.."
ACTION="app/waitlist/actions.ts"
BACKUP="app/waitlist/actions.real.ts.bak"

cp "$ACTION" "$BACKUP"
cat > "$ACTION" <<'STUB'
// Static-preview stub (no "use server"). The real implementation lives in
// actions.real.ts.bak during static builds and is restored afterward.
export type WaitlistState = {
  status: "idle" | "success" | "error";
  message?: string;
};
export async function joinWaitlist(
  _prev: WaitlistState,
  _formData: FormData
): Promise<WaitlistState> {
  return { status: "success" };
}
STUB

restore() { mv "$BACKUP" "$ACTION"; }
trap restore EXIT

rm -rf out .next
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC_EXPORT=1 ./node_modules/.bin/next build

# Post-process: rewrite absolute asset paths to relative so the build works
# when served from a sub-path (e.g. perplexity.ai/computer/a/<asset>/...).
# Next.js static export emits /_next/... and / route hrefs; we convert those
# in HTML files based on each file's depth from out/.
node scripts/relativize-paths.mjs
