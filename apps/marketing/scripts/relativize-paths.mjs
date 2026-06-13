#!/usr/bin/env node
// Rewrites absolute paths in the static export to relative paths so the build
// works when served from a sub-path. Walks every .html file under out/ and
// converts:
//   "/_next/..."          → "<depth>_next/..."
//   "/foo/"               → "<depth>foo/" (only if the path resolves to a real file in out/)
//   href="/"              → "<depth>" + "index.html"
//   src="/og.png", etc.   → "<depth>og.png" for static asset files at out/ root
//
// We are conservative: only rewrite values that point to files/dirs that
// actually exist in out/, so we never mangle external URLs or query strings.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, posix } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (p.endsWith(".html")) out.push(p);
  }
  return out;
}

// Returns the relative prefix from htmlFile back to OUT, e.g. "" for out/index.html
// or "../" for out/about/index.html.
function prefixFor(htmlFile) {
  const rel = relative(dirname(htmlFile), OUT);
  if (rel === "") return "./";
  return rel.endsWith("/") ? rel : rel + "/";
}

// Check whether a path string (starting with /) resolves to a real file/dir in out/.
function existsInOut(absPath) {
  // Strip query/hash
  const clean = absPath.split("?")[0].split("#")[0];
  if (!clean.startsWith("/")) return false;
  const filesystemPath = join(OUT, clean);
  if (existsSync(filesystemPath)) return true;
  // Next.js with trailingSlash:true generates dir/index.html for routes
  if (existsSync(join(filesystemPath, "index.html"))) return true;
  return false;
}

function rewriteHtml(html, htmlFile) {
  const prefix = prefixFor(htmlFile); // e.g. "./" or "../"

  // Match attribute values: href="/...", src="/...", content="/..." (for og:url etc we leave alone — those need full URLs)
  // We rewrite href, src, srcset for known asset attributes.
  const attrPattern = /(href|src)=("|')(\/[^"'#]*?)(["'])/g;

  let changed = 0;
  let updated = html.replace(attrPattern, (match, attr, q1, value, q2) => {
    // Skip protocol-relative or external
    if (value.startsWith("//")) return match;
    // Always rewrite /_next/ assets — they're always real
    if (value.startsWith("/_next/")) {
      changed++;
      return `${attr}=${q1}${prefix}${value.slice(1)}${q2}`;
    }
    // For other absolute paths, only rewrite if they resolve to a real file/dir
    if (existsInOut(value)) {
      changed++;
      // For directory routes ending with /, append index.html so it works on S3
      let newValue = value.slice(1);
      const filesystemPath = join(OUT, value.split("?")[0].split("#")[0]);
      if (!existsSync(filesystemPath) && existsSync(join(filesystemPath, "index.html"))) {
        // Directory route — append index.html
        if (!newValue.endsWith("/")) newValue += "/";
        newValue += "index.html";
      } else if (existsSync(filesystemPath) && statSync(filesystemPath).isDirectory()) {
        if (!newValue.endsWith("/")) newValue += "/";
        if (existsSync(join(filesystemPath, "index.html"))) newValue += "index.html";
      }
      return `${attr}=${q1}${prefix}${newValue}${q2}`;
    }
    return match;
  });

  // Also handle href="/" specifically — points to index.html at root
  updated = updated.replace(/(href|src)=("|')\/(["'])/g, (_m, attr, q1, q2) => {
    changed++;
    return `${attr}=${q1}${prefix}index.html${q2}`;
  });

  // Rewrite absolute /_next/ paths inside inline RSC payload script bodies
  // (self.__next_f.push). Next.js encodes client-component chunk URLs as
  // absolute paths here, and the runtime fetches them as-is — so on a sub-path
  // host they 404. We convert them to depth-correct relative paths.
  // The inline payloads use escaped quotes (\") around URLs.
  const inlineNextPrefix = prefix.replace(/\/$/, ""); // strip trailing slash; the original has /_next/
  // Match \"/_next/...\" inside script content
  updated = updated.replace(/\\"\/_next\//g, () => {
    changed++;
    return `\\"${inlineNextPrefix}/_next/`;
  });

  return { html: updated, changed };
}

const htmlFiles = walk(OUT);
let totalChanges = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, "utf8");
  const { html: out, changed } = rewriteHtml(html, f);
  if (changed > 0) {
    writeFileSync(f, out);
    totalChanges += changed;
  }
}
console.log(`relativize-paths: rewrote ${totalChanges} references across ${htmlFiles.length} HTML files`);
