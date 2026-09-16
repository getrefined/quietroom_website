# Build plan and content contract — Quiet Room Therapy

Read this before building anything. It is the contract between the component builders, the
Prismic setup agent and page composition. Field names and shapes below are load-bearing:
changing one side without the other breaks the site.

## Stack and layout

- Astro 7 static site → GitHub Pages at https://getrefined.github.io/quietroom_website/
  (`astro.config.mjs`: `base: '/quietroom_website/'`). Every internal href and asset path
  goes through the helpers in `src/lib/site.ts`. Never hardcode a `/...` path in markup.
- Multi-page. Routes: `/` (uid `home`), `/about/`, `/psychotherapy/`, `/supervision/`,
  `/services/`, `/booking/`, `/links/`, `/contact/`, `/privacy-statement/`. The nav is
  hardcoded from `nav` in `src/lib/site.ts`; `legalNav` holds the privacy link.
- Design tokens and utilities: `src/styles/global.css` — read it and use its custom
  properties and classes (`.container`, `.container--narrow`, `.section`, `.section--alt`,
  `.section--sage`, `.section--anchor`, `.section-heading`, `.eyebrow`, `.lead`, `.btn`
  - `.btn-primary|.btn-outline|.btn-light|.btn-outline-light`, `.btn-group`, `.card`,
    `.icon-badge`, `.logo-chip`, `.prose`, `.field`, `.form-status`, `.reveal` +
    `.reveal-delay-1..4`, `.grid .grid--2|--3`). Direction "Calm, Clinical, Mixed": white and
    soft-grey sections, deep-teal (`--color-anchor`) anchor bands, teal accents, sage icon
    badges, Manrope headings, Public Sans body. Section rhythm and density follow crs.je:
    airy, 64–96px vertical padding, 8–12px radii, pills only for tags.
- Already written, use them: `src/components/Icon.astro` (`<Icon name="leaf" />`, names
  listed in that file), `src/components/Logo.astro` (`<Logo variant="light" />` for dark
  bars, `variant="dark"` for light backgrounds), `src/layouts/BaseLayout.astro`,
  `src/lib/site.ts`, `src/lib/prismic.ts`, `src/data/rt.mjs`.
- Do not add hover effects to non-clickable cards. Only links and buttons get hover states.
- Images: client photos in `public/images/` (see `docs/site-copy.md` asset inventory).
  Fallback atmosphere photos use Unsplash URLs (calm, light, daylight interiors or Jersey
  coast; nothing amber-heavy).

## One data shape for Prismic and for hardcoded fallbacks

Pages render **slices**. A slice is `{ slice_type, variation: 'default', primary: {...} }`;
group fields are arrays inside `primary`. Prismic's API returns exactly this shape; the
fallback content in `src/data/pages.mjs` is written in the same shape with the helpers in
`src/data/rt.mjs`. Components therefore have ONE code path: read `slice.primary`.

Value shapes and the helper to render them (all in `src/lib/site.ts`):

| Field type     | Value                                                                                                                                       | Render with                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| StructuredText | `[{ type, text, spans }]`                                                                                                                   | `richText(field)` → HTML string, use `set:html`; or `plainText(field)`                                                 |
| Text / Select  | string                                                                                                                                      | as is                                                                                                                  |
| Boolean        | boolean                                                                                                                                     | as is                                                                                                                  |
| Image          | `{ url, alt, dimensions:{width,height} }` (Prismic adds `id`) — fallback `url` is relative like `images/x.jpg`, or an absolute Unsplash URL | `imageSrc(image)`, `image?.alt ?? ''`                                                                                  |
| Link           | `{ link_type:'Web'\|'Document'\|'Media'\|'Any', url?, uid?, text? }`                                                                        | `resolveLink(link)` → href or `undefined`; `linkLabel(link, 'Fallback')`. Do not render a link whose href is undefined |
| Group          | array of objects                                                                                                                            | map                                                                                                                    |

Component contract: `interface Props { slice?: any; index?: number }`. If `slice` is
missing render a small generic fallback so nothing crashes; real content always arrives via
`slice`. Wrap rich-text output in an element with class `prose`. Use `:global()` for styles
that target HTML injected via `set:html`.

Headings: exactly one `<h1>` per page. `hero` and `page_header` render the `h1`; every other
slice heading is an `<h2>`, items inside slices are `<h3>`.

## Custom types

### `page` (repeatable, has UID) — label "Page"

Main tab: `uid` (UID), `title` (Text, "Page title"), `meta_description` (Text), `slices`
(Slice zone with every slice below).

### `settings` (single) — label "Site settings"

`site_name` Text · `tagline` Text · `practitioner_name` Text · `practitioner_title` Text ·
`phone` Text · `email` Text · `address` StructuredText multi `paragraph` ·
`footer_note` StructuredText multi `paragraph,strong,em,hyperlink` ·
`accreditations` Group { `logo` Image, `name` Text, `link` Link }.

Prismic field rules: headings are StructuredText `single: "heading1,em"` (hero and
page_header) or `single: "heading2,em"` (everything else); body text is StructuredText
`multi: "paragraph,strong,em,hyperlink"` unless noted; buttons are Link with
`allowText: true`; repeatables are Group fields in the primary zone; options are Select.
Slice IDs snake_case, names PascalCase, one `default` variation each.

## Slices — id → component (`src/components/<Name>.astro`), fields in `primary`

1. `hero` → `Hero` (home only). Full-bleed photo with a deep-teal gradient scrim
   (`linear-gradient(to right, rgba(13,59,64,.92), rgba(13,59,64,.35))`), min-height ~80vh,
   h1 + text + buttons, and a row of three highlight chips.
   `eyebrow` Text · `heading` heading1 · `text` multi · `primary_link` Link ·
   `secondary_link` Link · `image` Image · `highlights` Group { `label` Text }.
2. `page_header` → `PageHeader` (inner pages). Deep-teal band under the nav (`.section--anchor`),
   eyebrow + h1 + lead text; if `image` present, use it as a dimmed background.
   `eyebrow` Text · `heading` heading1 · `text` multi · `image` Image.
3. `intro_block` → `IntroBlock`. Two columns: text and image (`image_position` right|left),
   optional link button and a list of credential chips.
   `eyebrow` Text · `heading` heading2 · `text` multi `paragraph,strong,em,hyperlink,list-item` ·
   `image` Image · `image_position` Select [right, left] · `link` Link ·
   `credentials` Group { `label` Text }.
4. `feature_columns` → `FeatureColumns`. Three (auto-fit) columns, each `.icon-badge` icon,
   h3, text. `background` picks the section variant.
   `eyebrow` Text · `heading` heading2 · `text` multi · `background` Select [white, grey, sage] ·
   `items` Group { `icon` Select (icon names below), `title` Text, `text` multi }.
5. `service_cards` → `ServiceCards`. `.card` grid with icon, h3, text, optional link
   (arrow link, only the link is clickable). `columns` 3|2.
   `eyebrow` Text · `heading` heading2 · `text` multi · `columns` Select [3, 2] ·
   `items` Group { `icon` Select, `title` Text, `text` multi, `link` Link }.
6. `narrative` → `Narrative`. Long-form copy. `layout`: `prose` (narrow centred column),
   `image-right` / `image-left` (text + sticky image), `two-column` (text flows in two
   columns on wide screens). `background` white|grey.
   `eyebrow` Text · `heading` heading2 · `body` multi
   `paragraph,strong,em,hyperlink,list-item,o-list-item,heading3` · `image` Image ·
   `layout` Select [prose, image-right, image-left, two-column] · `background` Select [white, grey].
7. `cta_band` → `CtaBand`. Full-width `.section--anchor` band: h2, text, buttons
   (`.btn-light` primary, `.btn-outline-light` secondary).
   `heading` heading2 · `text` multi · `primary_link` Link · `secondary_link` Link.
8. `accreditations` → `Accreditations`. Row of `.logo-chip` logos with names; a small
   heading and one line of text. Chips are white even on grey.
   `heading` Text · `text` multi · `items` Group { `logo` Image, `name` Text, `link` Link }.
9. `practitioner_list` → `PractitionerList`. Cards with photo, name, role, bio, and
   contact lines (mailto/tel/website links). Only the contact links are clickable.
   `eyebrow` Text · `heading` heading2 · `text` multi ·
   `items` Group { `name` Text, `role` Text, `photo` Image, `bio` multi, `email` Text,
   `phone` Text, `website` Link }.
10. `contact_details` → `ContactDetails`. Two columns: details (address, phone, email,
    directions, hours note) and the form. The form follows the contact-form contract:
    `<form class="contact-form" data-endpoint={contactEndpoint}>`, fields `name`, `email`,
    `subject`, `message` (all `required` except subject), the honeypot block, a
    `<button type="submit" class="form-submit btn btn-primary">`, and a
    `<p class="form-status" aria-live="polite">`. Include the submission script from
    `/home/alaistair/.claude/plugins/cache/getrefined/create-website/2.5.7/skills/create-website/templates/contact-form-script.html`
    adapted to read the endpoint from `form.dataset.endpoint` and to do nothing (leave the
    native form alone) when it is empty. When `contactEndpoint` is empty the form's `action`
    is `mailto:` + email as a last resort.
    `eyebrow` Text · `heading` heading2 · `text` multi · `address` multi `paragraph` ·
    `phone` Text · `email` Text · `directions` multi · `show_form` Boolean ·
    `form_heading` Text · `success_message` Text.

Also: `Nav` (`src/components/Nav.astro`, props `{ transparent?: boolean; currentPath?: string; settings?: any }`)
— fixed, deep-teal bar with `<Logo variant="light" />`, links from `nav`, "Book a session"
button (`.btn-light`, → `/contact/`), transparent over the hero when `transparent` and solid
after scrolling (small inline script toggling a class), hamburger + full-screen overlay on
mobile, `aria-current="page"` on the active link, `aria-expanded` on the toggle.
`Footer` (`src/components/Footer.astro`, props `{ settings?: any }`) — three columns like
crs.je (Quiet Room: nav links · Services: Psychotherapy/Supervision/Booking/Links ·
Contact: address/phone/email + Privacy Statement), accreditation logos on white chips,
bottom bar "© {year} Christopher Journeaux. All rights reserved." + "Site by Refined"
(link https://getrefined.com). Uses `settings` (Prismic `settings` data or the fallback
from `src/data/pages.mjs`) for contact details.
`SliceZone` (`src/components/SliceZone.astro`, props `{ slices: any[]; settings?: any }`)
— maps `slice_type` to the components above; unknown types render nothing.

## Icon names (Icon.astro)

leaf, feather, heart, shield, compass, chat, users, user, calendar, book, sun, moon, home,
smile, clock, phone, mail, map-pin, arrow-right, check, menu, close, external, video, award,
briefcase, life-buoy.

## Page composition (uid → slices, in order; content in docs/site-copy.md)

- home: hero · intro_block (Christopher, headshot, credentials) · feature_columns (Safe and
  confidential / A tailored approach / Experienced and registered) · service_cards
  (Psychotherapy & counselling → /psychotherapy/, Clinical supervision → /supervision/,
  Booking a session → /booking/) · narrative "Take the first step" (prose) · accreditations ·
  cta_band.
- about: page_header · intro_block (headshot, qualifications as credentials) · narrative
  (journey, image-right therapy room) · narrative (teaching and training, two-column) ·
  accreditations · cta_band.
- psychotherapy: page_header · narrative (image-right, room photo) · cta_band.
- supervision: page_header · narrative · feature_columns (Who it is for / How I work / Formats:
  individuals, agencies, groups, face to face or online) · cta_band.
- services: page_header · narrative (intro) · service_cards (5 areas, columns 3) · narrative
  (supervision paragraph, image-left) · cta_band.
- booking: page_header · narrative (image-right, room photo) · feature_columns (Get in touch /
  Free initial consultation / Decide together) · cta_band.
- links: page_header · practitioner_list · cta_band.
- contact: page_header · contact_details.
- privacy-statement: page_header · narrative (prose).
