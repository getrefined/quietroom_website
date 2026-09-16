# Security audit — 2026-09-16

Report from the read-only `security-audit` agent, run before the first push to the public
repo getrefined/quietroom_website. Fixes applied afterwards are listed at the end.

## Findings

**CRITICAL** — none.

**HIGH** — Origin check on `/contact` bypassable by omitting the `Origin` header.
`scripts/cloudflare-worker.js` only rejected when `Origin` was present and mismatched, so a
non-browser client could skip the check. Fix: reject whenever `ALLOWED_ORIGIN` is set and the
Origin differs (browsers always send `Origin` on cross-origin POSTs, including no-JS form posts).

**MEDIUM** — Prismic-authored rich-text and button links were not scheme-validated before being
placed in `href` (`src/lib/site.ts`, `resolveLink` / `htmlSerializer.hyperlink`). A malicious
editor could publish a `javascript:` or `data:` URL that goes live on the next automatic
rebuild. Fix: allow only http, https, mailto and tel schemes (plus site-relative paths).

**LOW**
- `.gitignore` did not include `*.key` / `*.pem` (no such files exist; defence in depth).
- Worker logged Mailgun's full error body on failure; log the status only.
- No `<meta name="robots">`; site is intentionally indexable (robots.txt allows all).

**INFO**
- GitHub Pages cannot set response headers. Meta-level mitigations added to BaseLayout:
  `Content-Security-Policy: frame-ancestors 'none'` and `referrer` `strict-origin-when-cross-origin`.
  `X-Content-Type-Options` is not expressible in meta; add it via Cloudflare once the custom
  domain is proxied.
- `WEBHOOK_SECRET` is bound on the Worker; the route is warn-and-allow when unset by design.

**PASS** — no secrets in committed files (`docs/project-config.json` and `.env*` are gitignored,
`docs/prismic-migration.json` holds only document IDs); every `set:html` consumes `richText()`
output or fixed internal markup; contact form implements the contract (multipart FormData,
honeypot, header-safe From/Reply-To/Subject, server-side attachment limits, KV rate limiting,
CORS); email body is plain text; workflows use minimal permissions; external links use
`rel="noopener noreferrer"`; all assets HTTPS; `npm audit` 0 vulnerabilities (274 packages).

## Fixes applied (same day)

- Worker: strict Origin check; Mailgun error body no longer logged. Redeployed.
- `src/lib/site.ts`: `resolveLink` returns `undefined` for any URL not matching
  `^(https?:|mailto:|tel:|/)`; the serializer skips links without an href.
- `.gitignore`: added `*.key`, `*.pem`.
- `BaseLayout.astro`: added the CSP frame-ancestors and referrer meta tags.
