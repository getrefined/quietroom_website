# Quiet Room Therapy — website

Astro 7 static site for [Quiet Room Therapy](https://www.thequietroom.co.uk) (Christopher
Journeaux, psychotherapist, counsellor and clinical supervisor, St Helier, Jersey), with
Prismic as the CMS, a Cloudflare Worker for the contact form and rebuild webhook, and
GitHub Pages hosting.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321/quietroom_website/
npm run build    # static output in dist/
npm run preview
```

## How content works

- `src/data/pages.mjs` is the **single source of truth for the copy**, written in Prismic's
  slice shape with the helpers in `src/data/rt.mjs`. Astro renders it whenever a Prismic
  document is missing or unpublished, so the site is always complete.
- `scripts/prismic-migrate.mjs` pushes the same content to Prismic (`node scripts/prismic-migrate.mjs`);
  documents arrive as drafts and are published in the Prismic dashboard.
- `scripts/prismic-push-models.mjs` pushes the slice models (`src/slices/*/model.json`) and
  custom types (`customtypes/*/index.json`) to Prismic.
- `src/lib/prismic.ts` loads a page by UID: Prismic wins when the document exists and has
  slices, otherwise the fallback renders. `src/lib/site.ts` holds the base-path-aware
  helpers every component uses (`href`, `imageSrc`, `resolveLink`, `richText`).
- The contract for slices, fields and components is in `docs/build-plan.md`.

Pages: `/`, `/about/`, `/psychotherapy/`, `/supervision/`, `/services/`, `/booking/`,
`/links/`, `/contact/`, `/privacy-statement/`. Each page file in `src/pages/` is three lines:
load the page, load settings, render `SliceZone`.

## Deployment

- Push to `main` → `.github/workflows/deploy.yml` builds and publishes to GitHub Pages
  (source: GitHub Actions).
- Publishing in Prismic → webhook → Cloudflare Worker `/webhook` → dispatches
  `prismic-rebuild.yml`.
- `astro.config.mjs` sets `base: '/quietroom_website/'` for the Pages URL. When the site moves
  to `thequietroom.co.uk`, change `site` and set `base: '/'`, update `ALLOWED_ORIGIN` on the
  Worker, and point the domain's A/CNAME records at GitHub Pages.

## Infrastructure

| Piece             | Where                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| GitHub repo       | getrefined/quietroom_website                                                       |
| Pages URL         | https://getrefined.github.io/quietroom_website/                                    |
| Prismic repo      | quietroom (en-us)                                                                  |
| Cloudflare Worker | quietroom-worker (`/contact`, `/webhook`)                                          |
| Mailgun domain    | mg.thequietroom.co.uk (EU region)                                                  |
| DNS               | Cloudflare zone thequietroom.co.uk (nameservers must be switched at the registrar) |

Secrets and IDs live in `docs/project-config.json` (gitignored). Master keys live in
`~/.create-website-env`.

## Assets

Photos and badges in `public/images/` were recovered from the previous GoDaddy site and are
low resolution; replace them with originals from the client when available. The logo is
redrawn as SVG in `src/components/Logo.astro` and `public/favicon.svg`.
