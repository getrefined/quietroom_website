#!/usr/bin/env node
/**
 * Push the site content (src/data/pages.mjs) to Prismic with the Migration API.
 *
 *   node scripts/prismic-migrate.mjs
 *
 * - One `page` document per key of `pages` (uid = key, Page Builder title = page title) and one
 *   `settings` document, all in lang en-us.
 * - Image files under public/ are uploaded to the media library once per file (and reused by
 *   filename on later runs); the absolute hero URL is fetched by the client.
 * - `{ link_type: 'Document', uid }` links become content relationships to the page documents
 *   of this migration. Web links, empty links and rich text hyperlink spans are sent as they are.
 * - Re-runnable: documents that already exist (published, or created by a previous run and
 *   recorded in docs/prismic-migration.json) are updated in place, so edit the copy in
 *   src/data/pages.mjs and re-run to sync Prismic.
 *
 * Documents land in the repository's migration release as DRAFTS. Publish them in the Prismic
 * dashboard afterwards.
 *
 * Credentials come from docs/project-config.json (prismic.repositoryName, prismic.writeToken).
 * The token is never printed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prismic from '@prismicio/client';
import { pages, settings } from '../src/data/pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'docs/project-config.json');
const recordPath = path.join(root, 'docs/prismic-migration.json');
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const config = readJSON(configPath);
const repositoryName = config.prismic?.repositoryName;
const writeToken = config.prismic?.writeToken;
if (!repositoryName || !writeToken) {
  console.error(
    'docs/project-config.json must contain prismic.repositoryName and prismic.writeToken'
  );
  process.exit(1);
}

const LANG = 'en-us';
const SETTINGS_TITLE = 'Site settings';
const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};
const isAbsoluteUrl = (s) => /^https?:\/\//.test(s);
const log = (...args) => console.log(...args);

const client = prismic.createClient(repositoryName);
const writeClient = prismic.createWriteClient(repositoryName, { writeToken });
const migration = prismic.createMigration();

// --- existing documents -------------------------------------------------------------------

/** Published documents, from the Content API. Drafts (everything a previous run created and nobody published yet) are invisible here. */
async function fetchPublished() {
  const found = { pages: new Map(), settings: undefined };
  try {
    for (const doc of await client.getAllByType('page')) found.pages.set(doc.uid, doc);
  } catch (err) {
    log(`Content API: could not list page documents (${err.message})`);
  }
  try {
    found.settings = await client.getSingle('settings');
  } catch {
    // No published settings document.
  }
  return found;
}

/** Document ids recorded by a previous run (docs/prismic-migration.json). */
function loadRecord() {
  if (!fs.existsSync(recordPath)) return {};
  try {
    return readJSON(recordPath).documents ?? {};
  } catch {
    return {};
  }
}

// --- assets -------------------------------------------------------------------------------

/** GET JSON with a few retries on 429. (The write client retries its own requests; this is for our direct calls.) */
async function fetchJSON(url, init, attempts = 4) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status === 429 && attempt < attempts) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const wait = Number.isNaN(retryAfter) || !retryAfter ? 1500 * attempt : retryAfter * 1000;
      await new Promise((resolve) => setTimeout(resolve, wait));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).trim()}`);
    return res.json();
  }
}

/** Existing media library assets keyed by filename, so re-runs do not upload duplicates. */
async function listAssets() {
  const byFilename = new Map();
  const headers = { repository: repositoryName, Authorization: `Bearer ${writeToken}` };
  const limit = 100;
  let cursor;
  let seen = 0;
  try {
    for (let page = 0; page < 50; page++) {
      const url = new URL('https://asset-api.prismic.io/assets');
      url.searchParams.set('limit', String(limit));
      if (cursor) url.searchParams.set('cursor', cursor);
      const json = await fetchJSON(url, { headers });
      const items = json.items ?? [];
      seen += items.length;
      for (const item of items) {
        if (item.filename && !byFilename.has(item.filename)) byFilename.set(item.filename, item);
      }
      // The API returns a cursor even on the last page: stop on a short page or once every asset was seen.
      const next = typeof json.cursor === 'string' && json.cursor ? json.cursor : undefined;
      const complete =
        items.length < limit || (typeof json.total === 'number' && seen >= json.total);
      if (complete || !next || next === cursor) break;
      cursor = next;
    }
  } catch (err) {
    log(
      `Asset API: listing incomplete after ${byFilename.size} asset(s); unmatched images will be uploaded (${err.message})`
    );
  }
  return byFilename;
}

function filenameFor(src) {
  if (isAbsoluteUrl(src)) {
    const base = new URL(src).pathname.split('/').pop() || 'image';
    return path.extname(base) ? base : `${base}.jpg`;
  }
  return path.basename(src);
}

const assetCache = new Map(); // image src -> { migrationAsset } | { existing }
const assetReport = { uploaded: [], reused: [] };

/**
 * Value to put in an image field for a source image `{ url, alt, dimensions }`:
 * a migration asset (uploaded by the client, which then fills in id/url/dimensions) or, when
 * the media library already holds a file with that name, a plain image value with its id.
 */
function imageValue(image, existingAssets) {
  const src = image.url;
  if (!assetCache.has(src)) {
    const filename = filenameFor(src);
    const alt = image.alt || undefined;
    const existing = existingAssets.get(filename);
    if (existing) {
      assetCache.set(src, { existing });
      assetReport.reused.push(filename);
    } else if (isAbsoluteUrl(src)) {
      assetCache.set(src, { migrationAsset: migration.createAsset(src, filename, { alt }) });
      assetReport.uploaded.push(filename);
    } else {
      const file = path.join(root, 'public', src);
      if (!fs.existsSync(file)) throw new Error(`Image not found under public/: ${src}`);
      const blob = new File([fs.readFileSync(file)], filename, {
        type: MIME[path.extname(filename).toLowerCase()],
      });
      assetCache.set(src, { migrationAsset: migration.createAsset(blob, filename, { alt }) });
      assetReport.uploaded.push(filename);
    }
  }
  const entry = assetCache.get(src);
  if (entry.migrationAsset) return entry.migrationAsset;
  const a = entry.existing;
  return {
    id: a.id,
    url: a.url,
    alt: image.alt ?? null,
    copyright: null,
    dimensions: { width: a.width, height: a.height },
    edit: { x: 0, y: 0, zoom: 1, background: 'transparent' },
  };
}

// --- content transform ----------------------------------------------------------------------

const isImage = (v) =>
  v && typeof v === 'object' && typeof v.url === 'string' && 'alt' in v && 'dimensions' in v;
const isDocumentLink = (v) =>
  v && typeof v === 'object' && v.link_type === 'Document' && typeof v.uid === 'string';

const linkedUids = new Set();

/** `{ link_type: 'Document', type: 'page', uid, text }` -> content relationship resolved lazily against this migration. */
function documentLink({ uid, text }) {
  linkedUids.add(uid);
  const link = { link_type: 'Document', id: () => migration.getByUID('page', uid) };
  if (text !== undefined) link.text = text;
  return link;
}

function transform(value, existingAssets) {
  if (Array.isArray(value)) return value.map((v) => transform(v, existingAssets));
  if (value && typeof value === 'object') {
    if (isImage(value)) return imageValue(value, existingAssets);
    if (isDocumentLink(value)) return documentLink(value);
    const out = {};
    for (const [key, v] of Object.entries(value)) out[key] = transform(v, existingAssets);
    if ('slice_type' in out && !('items' in out)) out.items = [];
    return out;
  }
  return value;
}

// --- reporter ------------------------------------------------------------------------------

function describe(migrationDoc) {
  const d = migrationDoc.document;
  return `${d.type}${d.uid ? `/${d.uid}` : ''} "${migrationDoc.title ?? ''}"`;
}

function reporter(event) {
  const { data } = event;
  switch (event.type) {
    case 'start':
      return log(
        `start: ${data.pending.documents} document(s), ${data.pending.assets} asset(s) pending`
      );
    case 'assets:creating':
      return log(`asset ${data.current}/${data.total}: uploading ${data.asset.config.filename}`);
    case 'assets:created':
      return log(`assets: ${data.created} created`);
    case 'documents:masterLocale':
      return log(`master locale: ${data.masterLocale}`);
    case 'documents:creating':
      return log(`document ${data.current}/${data.total}: creating ${describe(data.document)}`);
    case 'documents:created':
      return log(`documents: ${data.created} created`);
    case 'documents:updating':
      return log(
        `document ${data.current}/${data.total}: writing data to ${describe(data.document)} (${data.document.document.id})`
      );
    case 'documents:updated':
      return log(`documents: ${data.updated} updated with content`);
    case 'end':
      return log(
        `end: ${data.migrated.documents} document(s), ${data.migrated.assets} asset(s) migrated`
      );
    default:
      return log(event.type);
  }
}

function printError(err) {
  console.error(`\nMigration failed: ${err.message}`);
  if (err.url) console.error(`  url: ${err.url}`);
  if (err.response !== undefined)
    console.error(`  response: ${JSON.stringify(err.response, null, 2)}`);
}

// --- main ------------------------------------------------------------------------------------

async function main() {
  log(`Repository: ${repositoryName} (${LANG})`);
  const published = await fetchPublished();
  const recorded = loadRecord();
  const existingAssets = await listAssets();
  log(
    `Published: ${published.pages.size} page(s)${published.settings ? ' + settings' : ''}; recorded from earlier runs: ${Object.keys(recorded).length}; media library: ${existingAssets.size} asset(s)`
  );

  /** Existing document (published or recorded draft) for a page uid / the settings singleton. */
  function existingFor(type, uid) {
    if (type === 'page' && published.pages.has(uid))
      return { doc: published.pages.get(uid), status: 'published' };
    if (type === 'settings' && published.settings)
      return { doc: published.settings, status: 'published' };
    const rec = recorded[type === 'page' ? uid : type];
    if (rec?.id) {
      return {
        doc: { id: rec.id, type, uid: type === 'page' ? uid : undefined, lang: LANG, tags: [] },
        status: 'draft',
      };
    }
    return undefined;
  }

  // Deep-clone so src/data/pages.mjs objects are never mutated.
  const source = structuredClone({ pages, settings });
  const docs = {}; // record key -> PrismicMigrationDocument
  const counts = { create: 0, update: 0 };

  for (const [uid, page] of Object.entries(source.pages)) {
    const data = transform(
      { title: page.title, meta_description: page.description, slices: page.slices },
      existingAssets
    );
    const prev = existingFor('page', uid);
    if (prev) {
      docs[uid] = migration.updateDocument({ ...prev.doc, data }, page.title);
      counts.update++;
    } else {
      docs[uid] = migration.createDocument({ type: 'page', uid, lang: LANG, data }, page.title);
      counts.create++;
    }
    log(
      `  ${prev ? `update (${prev.status} ${prev.doc.id})` : 'create'}: page/${uid} "${page.title}" (${page.slices.length} slices)`
    );
  }
  {
    const data = transform(source.settings, existingAssets);
    const prev = existingFor('settings');
    if (prev) {
      docs.settings = migration.updateDocument({ ...prev.doc, data }, SETTINGS_TITLE);
      counts.update++;
    } else {
      docs.settings = migration.createDocument(
        { type: 'settings', lang: LANG, data },
        SETTINGS_TITLE
      );
      counts.create++;
    }
    log(
      `  ${prev ? `update (${prev.status} ${prev.doc.id})` : 'create'}: settings "${SETTINGS_TITLE}"`
    );
  }
  const unresolved = [...linkedUids].filter((uid) => !migration.getByUID('page', uid));
  if (unresolved.length)
    log(
      `Warning: links to pages missing from this migration will be sent empty: ${unresolved.join(', ')}`
    );
  log(
    `Links: ${linkedUids.size} page uid(s) referenced [${[...linkedUids].join(', ')}], ${unresolved.length} unresolved`
  );
  log(
    `Assets: ${assetReport.uploaded.length} to upload [${assetReport.uploaded.join(', ')}], ${assetReport.reused.length} reused [${assetReport.reused.join(', ')}]`
  );
  log('Running migration (the client throttles writes and retries rate limits)...\n');

  let failure;
  try {
    await writeClient.migrate(migration, { reporter });
  } catch (err) {
    failure = err;
    printError(err);
  }

  // Record ids (also after a failure, so a re-run updates instead of duplicating).
  const after = failure ? published : await fetchPublished();
  const documents = {};
  for (const [key, mdoc] of Object.entries(docs)) {
    const { type, uid, id } = mdoc.document;
    if (!id) continue;
    const isPublished = type === 'page' ? after.pages.has(uid) : Boolean(after.settings);
    documents[key] = {
      id,
      type,
      ...(uid ? { uid } : {}),
      status: isPublished ? 'published' : 'draft',
    };
  }
  const record = {
    repository: repositoryName,
    lang: LANG,
    generatedAt: new Date().toISOString(),
    note: 'Migration API writes are drafts in the migration release until published in the Prismic dashboard; "published" means a published version exists, the latest write may still be pending.',
    documents,
  };
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n');

  const current = readJSON(configPath);
  current.prismic.migrationDocs = Object.fromEntries(
    Object.entries(documents).map(([k, d]) => [k, d.id])
  );
  current.prismic.documentsPublished =
    Object.values(documents).length > 0 &&
    Object.values(documents).every((d) => d.status === 'published');
  fs.writeFileSync(configPath, JSON.stringify(current, null, 2) + '\n');

  log(`\n${path.relative(root, recordPath)}:`);
  log(JSON.stringify(record, null, 2));
  if (failure) {
    console.error(
      `\nIncomplete: ${Object.keys(documents).length} document id(s) recorded. Fix the error above and re-run.`
    );
    process.exit(1);
  }
  log(
    `\nDone: ${counts.create} created, ${counts.update} updated, ${assetReport.uploaded.length} asset(s) uploaded, ${assetReport.reused.length} reused.`
  );
  log(
    `The documents are DRAFTS in the migration release. Publish them at https://${repositoryName}.prismic.io`
  );
}

main().catch((err) => {
  printError(err);
  process.exit(1);
});
