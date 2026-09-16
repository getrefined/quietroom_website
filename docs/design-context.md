# Design context — Quiet Room Therapy

Report from the `design-explorer` agent, 2026-09-16. Chrome DevTools MCP and Figma MCP were not available; the agent worked from saved crs.je HTML/CSS and current-site snapshots, a pixel-histogram of the logo PNG (Node + sharp) for exact hex extraction, and WCAG contrast maths for the accessibility flags.

```
BRAND ASSETS:
- Logos found: public/images/logo-quiet-room-therapy.png
  (82×172px raster — only logo in the project; no SVG anywhere in the repo or docs/source-images/, no favicon).
  This is low-res for header/hero use at any scale — worth asking the client for vector artwork, or
  redrawing it as a clean SVG, before it goes in a sticky header.

- Colors extracted (measured — histogrammed every opaque pixel of the PNG in three regions: full image,
  circle+wordmark area, outer hook area):
  - Teal — #18A1AB (rgb 24,161,171). Identical value in both the circle fill and the "THERAPY" wordmark
    (samples cluster tightly 17A0AA–18A1AB, i.e. one flat colour with anti-aliasing noise at the edges).
    This is the brand's one real accent colour.
  - Sage/mint green — #BEDDC3 (rgb 190,221,195). 100% flat in a pure-fill region (the top hook), so this
    is exact. Door-hanger body colour.
  - White — #FFFFFF, used reversed for "Quiet Room" inside the circle.
  - Cross-check: the current live site (thequietroom.co.uk) independently uses #05A0AB as its one accent
    colour — near-identical to the logo teal, confirming teal is the client's established brand colour.

- Accreditation badges (fixed third-party marks — treat as immutable, give them a clean light patch to
  sit on): public/images/badge-ukcp.jpg (154×103, colourful UKCP triangle — red/orange/yellow/blue — +
  black wordmark on white) and public/images/badge-gpsyc.png (180×68, black "GPsyC" wordmark + grey
  subtext on white, tiny teal divider tick). Neither should be recoloured; both need a white/very light
  background wherever they're placed, including inside any dark "anchor" sections.

- Headshot: public/images/christopher-journeaux.jpg (450×300, plain white background, navy-grey tweed
  jacket, light blue shirt, and a teal pocket square that echoes the brand). Square crop at
  christopher-journeaux-square.jpg (231×222). Closer crop at docs/source-images/christopher-journeaux-closeup.jpg.

- Room photography: therapy-room-chairs.jpg (521×295) and therapy-room-sofa.png (531×298) — both warm,
  lamp-lit shots: cream/wood/brown neutrals, soft amber light, plants, not cool or clinical. Alt crop in
  docs/source-images/therapy-room-chairs-alt.png. This warmth matters for palette choice — a stark
  cool-grey palette would sit oddly against this photography.

- Hero imagery: hero-grass-sunset.jpg (1906×568, current full hero) and banner-grass-sunset.jpg
  (1918×288, inner-page banner crop) — backlit grass silhouettes against an amber-to-cool-blue-green
  sunset gradient. Only loosely on-brand (the dominant amber/orange has no relationship to the palette).
  Weakest brand fit of the available assets. Links-page photo: public/images/kinga-gutkowska.jpg (169×190).

DESIGN TOKENS (if existing site):
- Ground-up build, not an update: no global.css, no CSS, no SVGs in the project. Bare Astro scaffold.
- The current live site (GoDaddy Website Builder): `Open Sans` for everything (no type hierarchy); white
  background; one accent colour #05A0AB (teal, matches the logo). No design system worth preserving —
  only the teal accent carries forward, and the logo is the better source for its exact value.

REFERENCE SITES:
- https://crs.je/ (saved HTML/CSS snapshot; Chrome DevTools MCP unavailable). The brief's description is
  confirmed and sharpened from the applied CSS (the Google-Fonts import also pulls Lato and Barlow, which
  have NO applied usage — leftovers):
  - Home page structure, confirmed via H1–H4 extraction: full-bleed photo hero (H1 "Compliance
    Recruitment Specialists" + one CTA, with a dark navy gradient scrim over the photo:
    `linear-gradient(to right,#002337e6,transparent)`) → intro/about block ("Our approach is Personal,
    Professional and Tailored to Your Needs.") → three-column features row (H3 ×3) → "Why Choose a
    Specialist?" narrative block → three icon cards ("Vacancies / Candidates / Employers") → full-width
    CTA band ("Ready to Take the Next Step?") → three-column footer (site nav / category nav / legal
    links) + bottom bar (copyright, company reg. no., "Site by" credit).
  - Fonts, from applied rules: `h1,.h2,.h3,.h4,.h5,.h6{font-family:"Albert Sans";font-weight:400}` with
    tight tracking (`letter-spacing:-0.035em` on h1) — light weight, tightly-tracked display style, not
    heavy/corporate-bold. Body/inputs/buttons: "Source Sans 3"; body text colour #2e2d2c (soft black).
  - Colours, confirmed by inspecting selectors: #10CBEB (bright cyan) and #002337 (dark navy) are the
    applied brand colours — cyan for link/button colour+border and active states, navy for button-hover
    fills, modal backgrounds, header bar and the hero scrim. #1863DC (most frequent raw hex) sits only in
    a third-party plugin's JSON config, never in a CSS rule — not a site colour. The Gutenberg preset
    colours are unused. Net palette: navy #002337 + cyan #10cbeb + greys #2e2d2c/#272727 + white/#f9f9f9.
  - Button style: outline/ghost by default — transparent fill, cyan text + cyan border,
    `border-radius:0.25em` (≈3-4px), modest padding, 14px label, plus a text-shadow (designed to sit over
    photos/dark fills, not flat white). Filled variant adds a small press-shadow. Submit buttons fill navy
    with light text on hover.
  - Corner radii: mostly subtle, 2–12px across cards/inputs/images; a handful of full-pill and circle
    shapes reserved for tags/toggles/icon badges. Mostly-square content with occasional pill/circle accents.
  - Density/rhythm: generous vertical section padding ~65–79px top/bottom on primary sections, with
    occasional tighter ~24–26px band sections — airy, not cramped.
  - Overall: cool, corporate-professional, photo-led hero with a dark scrim, mostly white/light-grey
    sections punctuated by dark-navy anchor sections (header, modals, hover states), bright cyan used
    sparingly as the one "electric" accent rather than as large fills. Inner pages (from a separate fetch
    of /about-us/): no photo hero — title, narrative two-column text + image, bullet list, three cards,
    CTA band, same footer.
- https://www.thequietroom.co.uk/home.html — light theme, Open Sans throughout, single teal accent
  #05A0AB matching the logo, no real layout system. Useful only as confirmation of the teal.

RECOMMENDATIONS:

ACCESSIBILITY FLAG — the logo teal on white (computed with the WCAG relative-luminance formula):
- #18A1AB (logo teal) on #FFFFFF = 3.12:1. FAILS WCAG AA for normal text (needs 4.5:1); only clears the
  3:1 minimum for large text (≥24px, or ≥18.66px bold) and for non-text UI components/icons/borders.
  Do not use the raw logo teal for body copy, small links, or small button labels on a white/light
  background. Fine for large display headings, big icon fills, border/outline treatments, and for a
  solid-fill button as long as the label is ≈16–18px+ semibold.
- For teal body text/links/small buttons on light backgrounds, darken it: #0E7480 (5.49:1, AA) or
  #0B6570 (6.75:1, close to AAA) both pass and still read as "the same teal."
- crs.je's own cyan (#10CBEB) is far worse on white (1.95:1) — do not literally port crs.je's
  coloured-text-on-white button pattern; for a mental-health audience err more conservative than the
  reference.
- The sage green (#BEDDC3) is a background/tint colour only — 1.47:1 against white. Works well as a light
  section background behind dark text (11.05:1 against dark navy/charcoal), never as foreground text.

Three distinct directions, all keeping the crs.je skeleton (full-bleed photo hero + gradient scrim +
headline + one CTA → intro block → 3-col feature row → narrative block → 3 icon cards → full-width CTA
band → 3-col footer; card/image radii 8–12px, pill shapes reserved for tags/badges, generous ~64–96px
desktop section padding), none defaulting to dark-with-gold:

1) "Light & Airy Teal Sanctuary" — light theme, teal-forward, closest to the logo as-is.
   Palette: #FBFAF6 (warm off-white background) · #FFFFFF (card/section white) · #18A1AB (logo teal —
   large headings, icon fills, borders, buttons ≥16px semibold) · #0E7480 (accessible teal — body links,
   small button labels, underlines) · #BEDDC3 (logo sage — alternating section tint, badge/chip fills) ·
   #16302E (deep teal-charcoal — heading colour on white, and the fill for the CTA band/footer in place
   of crs.je's navy, 14.03:1 on white).
   Fonts: Heading "Fraunces" (warm variable serif, editorial/calm) + Body "Karla" (clean humanist sans).
   Layout note: same crs.je skeleton, but swap its cold navy anchor sections for this deep teal-charcoal,
   alternate warm off-white/white section backgrounds instead of crs's cool #f9f9f9, soft 8-12px radii.

2) "Warm Sanctuary / Editorial" — light theme, warm-neutral-forward, teal as accent only; leans into the
   warm, lamp-lit room photography rather than the logo's cool teal.
   Palette: #FAF6EF (cream background) · #EDE4D3 (warm stone — alternating section tint) · #2B2724 (warm
   charcoal-brown body text, 13.74:1 on cream) · #18A1AB (teal — CTA buttons/icons, large scale only) ·
   #C97B4A (muted terracotta — small accents/tags/hover states only; 3.0–3.3:1 on cream/white, so
   large-text/icon use only) · #BEDDC3 (logo sage — low-opacity background wash/dividers).
   Fonts: Heading "Lora" (classic warm serif) + Body "Work Sans" (calm, neutral, approachable).
   Layout note: same skeleton, imagery-led with the room photography given room to breathe; CTA band
   and footer in the warm charcoal-brown rather than navy or teal; terracotta reserved for small pill
   tags on the services cards.

3) "Calm, Clinical, Mixed" — mixed theme (light throughout, one deep-teal anchor), the most structurally
   direct cousin of crs.je: same navy-anchor/cyan-accent pattern, recoloured into the teal family.
   Palette: #FFFFFF (main content background) · #F3F5F4 (cool-soft grey alternate section background) ·
   #0D3B40 (deep teal anchor — header, footer, CTA band, replacing crs's #002337; 12.23:1 with white
   text) · #18A1AB (logo teal — buttons/icons/links on white, 3.12:1 caveat as above) · #BEDDC3 (sage —
   icon-badge fills, soft highlight backgrounds) · #22302E (warm charcoal body text on white).
   Fonts: Heading "Manrope" (modern geometric sans, softer than crs's Albert Sans) + Body "Public Sans".
   Layout note: closest to crs.je's own rhythm — full-bleed hero with a deep-teal gradient scrim
   (mirroring crs's `#002337e6→transparent`) instead of navy, dark teal anchor sections for header/CTA
   band/footer exactly where crs.je uses navy, sage-filled circles for the icon cards.

Notes:
- Whichever direction is chosen, place the UKCP/GPsyC badges on white/near-white chips — never directly
  on a deep-teal or sage-tinted background.
- The logo's low resolution (82×172px, raster-only): fine for a small header lockup, soft at hero scale
  or as a favicon. A redrawn SVG (one flat sage door-hanger, one flat teal circle, one flat teal wordmark)
  is a cheap, low-risk fix.
- Hero image choice is open: hero-grass-sunset.jpg is the weakest brand fit of the available assets
  (amber/orange dominant) — compare against the room photography or fresh stock before locking it in,
  especially for Directions 1 and 3 where a warmer image would clash more.
```
