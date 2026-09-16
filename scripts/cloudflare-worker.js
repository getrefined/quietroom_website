/**
 * Cloudflare Worker: Multi-purpose API proxy
 *
 * Routes:
 *   POST /webhook           — Prismic webhook → triggers GitHub Actions rebuild
 *   POST /contact           — Contact form submission → sends email via Mailgun
 *   GET  /api/instagram-feed — Instagram feed proxy → cached Instagram Graph API
 *
 * Environment variables (set in Cloudflare Worker settings):
 *   GITHUB_TOKEN              - GitHub fine-grained PAT with Actions:Write
 *   WEBHOOK_SECRET            - Secret verifying Prismic webhook requests. Required for
 *                               new deployments; the Prismic webhook URL must carry it as
 *                               ?secret=<value>. Legacy workers without it still accept
 *                               unauthenticated rebuilds, and log a warning.
 *   DEPLOY_BRANCH             - (optional) branch to dispatch rebuilds against (default: main)
 *   MAILGUN_API_KEY           - Mailgun private API key
 *   MAILGUN_DOMAIN            - Mailgun sending domain (e.g., mg.client.co.uk)
 *   RECIPIENT_EMAIL           - Where form submissions are sent (e.g., hello@client.co.uk)
 *   ALLOWED_ORIGIN            - Allowed origin for form submissions (e.g., https://org.github.io).
 *                               Enforced server-side on /contact, not just as a CORS header.
 *   MAILGUN_REGION            - (optional) "us" for api.mailgun.net; defaults to EU
 *   EMAIL_SUBJECT             - (optional) overrides the generated subject line
 *   REPLY_TO_FIELD            - (optional) form field holding the reply address
 *   SENDER_NAME_FIELD         - (optional) form field holding the sender display name
 *   MAX_ATTACHMENTS           - (optional) attachments per submission (default: 5)
 *   MAX_ATTACHMENT_BYTES      - (optional) aggregate attachment bytes (default: 15MB)
 *   MAX_REQUEST_BYTES         - (optional) request body cap (default: 20MB)
 *   RATE_LIMIT_MAX            - (optional) submissions per IP per window (default: 5)
 *   RATE_LIMIT_WINDOW         - (optional) rate limit window in seconds (default: 3600)
 *
 * Optional KV binding:
 *   RATE_LIMIT                - KV namespace for /contact rate limiting. Without it,
 *                               rate limiting is skipped and a warning is logged.
 *
 * The /contact route implements docs/contact-form-contract.md.
 *   INSTAGRAM_ACCESS_TOKEN    - Long-lived Instagram access token
 *   INSTAGRAM_USER_ID         - Instagram user ID to fetch media from
 *   INSTAGRAM_CACHE_TTL       - (optional) Cache duration in seconds (default: 1800)
 *   INSTAGRAM_LIMIT           - (optional) Number of posts to fetch (default: 8)
 *
 * Replace getrefined and quietroom_website with your GitHub org and repo name.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(env, 204);
    }

    // Route by path, validate method per-route
    if (path === '/api/instagram-feed') {
      if (request.method !== 'GET') {
        return corsResponse(env, 405, 'Method not allowed');
      }
      return handleInstagramFeed(request, env, ctx);
    }

    if (request.method !== 'POST') {
      return corsResponse(env, 405, 'Method not allowed');
    }

    if (path === '/webhook' || path === '/') {
      return handleWebhook(request, env, url);
    }

    if (path === '/contact') {
      return handleContactForm(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

// --- Prismic Webhook Handler ---

// Warn once per isolate rather than on every request.
let webhookSecretWarned = false;

async function handleWebhook(request, env, url) {
  if (env.WEBHOOK_SECRET) {
    const secret = url.searchParams.get('secret');
    if (secret !== env.WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
  } else if (!webhookSecretWarned) {
    // Setup always generates a secret now, so an unset one means a worker deployed
    // before that change. Left permissive on purpose: rejecting here would break those
    // sites' rebuilds on their next worker redeploy, which is not the moment to find
    // out. Set WEBHOOK_SECRET and append ?secret=<value> to the Prismic webhook URL.
    console.warn(
      'WEBHOOK_SECRET is not set — /webhook accepts unauthenticated rebuild triggers. ' +
        "Anyone who learns this worker's URL can dispatch builds."
    );
    webhookSecretWarned = true;
  }

  const githubResponse = await fetch(
    'https://api.github.com/repos/getrefined/quietroom_website/actions/workflows/prismic-rebuild.yml/dispatches',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'quietroom_website-webhook',
      },
      // Same trap as deploy.yml's trigger: a repo whose default branch is not "main"
      // gets a 422 from the dispatch endpoint, and the Prismic webhook silently stops
      // rebuilding the site. Set DEPLOY_BRANCH when the default branch differs.
      body: JSON.stringify({ ref: env.DEPLOY_BRANCH || 'main' }),
    }
  );

  if (githubResponse.status === 204) {
    return new Response('Rebuild triggered', { status: 200 });
  }

  const body = await githubResponse.text();
  return new Response(`GitHub API error: ${githubResponse.status} ${body}`, {
    status: 502,
  });
}

// --- Contact Form Handler ---
//
// Implements docs/contact-form-contract.md. Read that before changing anything here:
// the client script in templates/contact-form-script.html is the other half and the two
// must move together.

const CONTACT_DEFAULTS = {
  MAX_ATTACHMENTS: 5,
  MAX_ATTACHMENT_BYTES: 15 * 1024 * 1024, // ~20MB after base64, inside a ~25MB mailbox
  MAX_REQUEST_BYTES: 20 * 1024 * 1024,
  RATE_LIMIT_MAX: 5,
  RATE_LIMIT_WINDOW: 3600,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Executable types. Refused regardless of declared MIME, which is attacker-controlled.
const BLOCKED_EXTENSIONS = [
  'exe',
  'dll',
  'scr',
  'bat',
  'cmd',
  'com',
  'msi',
  'jar',
  'vbs',
  'ps1',
  'sh',
  'app',
  'pif',
  'cpl',
  'hta',
];

const REPLY_TO_ALIASES = [
  'email',
  'email-address',
  'emailaddress',
  'your-email',
  'reply-to',
  'replyto',
];
const NAME_ALIASES = ['name', 'full-name', 'fullname', 'your-name'];
const FIRST_NAME_ALIASES = ['first-name', 'firstname', 'forename', 'given-name'];
const LAST_NAME_ALIASES = ['last-name', 'lastname', 'surname', 'family-name'];

function num(env, key) {
  const raw = env[key];
  const parsed = raw === undefined ? NaN : parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : CONTACT_DEFAULTS[key];
}

// "Your_Email " and "your-email" are the same key as far as alias matching is concerned.
function normaliseKey(key) {
  return key
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

// Compared after normaliseKey, which rewrites a leading "_" to "-".
const HONEYPOT_FIELD = normaliseKey('_confirm_email');

// Warn once per isolate rather than on every submission.
let rateLimitWarned = false;

// Strip anything that could break out of an email header. The old code interpolated the
// raw `name` field straight into From.
function headerSafe(value) {
  return (
    String(value)
      .replace(/[\r\n\t]+/g, ' ')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/[<>"]/g, '')
      .trim()
      .slice(0, 128)
  );
}

function safeFilename(name) {
  return (
    String(name)
      .replace(/[\\/]/g, '_')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/^\.+/, '')
      .trim()
      .slice(0, 200) || 'attachment'
  );
}

function humanise(key) {
  const words = String(key).replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Collect submitted fields without collapsing anything.
 * Returns { fields: [{ key, values: [] }], files: [File], control: Map }
 * preserving submission order. The previous implementation used Object.fromEntries,
 * which keeps only the last value for a repeated key — a checkbox group became one value.
 */
function collectEntries(iterable) {
  const order = [];
  const byKey = new Map();
  const files = [];
  const control = new Map();

  for (const [rawKey, value] of iterable) {
    const key = rawKey.trim();

    if (typeof value === 'object' && value !== null && typeof value.name === 'string') {
      if (value.size > 0) files.push(value); // zero-byte inputs are dropped, not rejected
      continue;
    }

    if (key.startsWith('_')) {
      control.set(normaliseKey(key), String(value));
      continue;
    }

    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key).push(String(value));
  }

  return {
    fields: order.map((key) => ({ key, values: byKey.get(key) })),
    files,
    control,
  };
}

function findByAlias(fields, aliases) {
  for (const alias of aliases) {
    const hit = fields.find((f) => normaliseKey(f.key) === alias);
    if (hit && hit.values.some((v) => v.trim())) {
      return hit.values.find((v) => v.trim()).trim();
    }
  }
  return null;
}

/** See "Reply address resolution" in the contract. */
function resolveReplyTo(fields, env) {
  if (env.REPLY_TO_FIELD) {
    const explicit = findByAlias(fields, [normaliseKey(env.REPLY_TO_FIELD)]);
    if (explicit && EMAIL_RE.test(explicit)) return explicit;
  }

  const aliased = findByAlias(fields, REPLY_TO_ALIASES);
  if (aliased && EMAIL_RE.test(aliased)) return aliased;

  // Last resort: exactly one field in the payload looks like an address. This is what
  // lets a first-name/surname form work with no configuration at all.
  const candidates = [];
  for (const field of fields) {
    for (const value of field.values) {
      if (EMAIL_RE.test(value.trim())) candidates.push(value.trim());
    }
  }
  if (candidates.length === 1) return candidates[0];

  return null;
}

/** See "Sender display name". Never required. */
function resolveSenderName(fields, env, fallback) {
  if (env.SENDER_NAME_FIELD) {
    const explicit = findByAlias(fields, [normaliseKey(env.SENDER_NAME_FIELD)]);
    if (explicit) return explicit;
  }

  const single = findByAlias(fields, NAME_ALIASES);
  if (single) return single;

  const first = findByAlias(fields, FIRST_NAME_ALIASES);
  const last = findByAlias(fields, LAST_NAME_ALIASES);
  if (first || last) return [first, last].filter(Boolean).join(' ');

  return fallback;
}

function renderBody(fields, files, senderName) {
  const lines = [`New enquiry from ${senderName}`, ''];

  for (const { key, values } of fields) {
    const label = humanise(key);
    const value = values.join(', ');
    if (!value.trim()) continue;

    if (/[\r\n]/.test(value)) {
      // Indent so a multi-line value cannot be read as further "Label: value" pairs.
      // FormData normalises newlines to CRLF, so split on any line ending.
      lines.push(`${label}:`);
      for (const line of value.split(/\r\n|\r|\n/)) lines.push(`    ${line}`);
    } else {
      lines.push(`${label}: ${value}`);
    }
  }

  if (files.length) {
    lines.push('', `Attachments (${files.length}):`);
    for (const file of files) {
      lines.push(`    ${safeFilename(file.name)} (${Math.round(file.size / 1024)} KB)`);
    }
  }

  return lines.join('\n');
}

function validateAttachments(files, env) {
  const maxCount = num(env, 'MAX_ATTACHMENTS');
  const maxBytes = num(env, 'MAX_ATTACHMENT_BYTES');

  if (files.length > maxCount) {
    return { ok: false, status: 413, message: `At most ${maxCount} files can be attached.` };
  }

  let total = 0;
  for (const file of files) {
    const ext = safeFilename(file.name).split('.').pop().toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return { ok: false, status: 400, message: `Files of type .${ext} are not accepted.` };
    }
    total += file.size;
  }

  if (total > maxBytes) {
    const mb = Math.floor(maxBytes / (1024 * 1024));
    return { ok: false, status: 413, message: `Attachments must total less than ${mb}MB.` };
  }

  return { ok: true };
}

/**
 * Best-effort per-IP limit. Requires a KV namespace bound as RATE_LIMIT; without it the
 * Worker does not pretend to rate limit. KV is eventually consistent, so the count is
 * approximate — this is a spam control, not a quota.
 */
async function checkRateLimit(request, env) {
  if (!env.RATE_LIMIT) {
    if (!rateLimitWarned) {
      console.warn('RATE_LIMIT KV namespace not bound — /contact is not rate limited');
      rateLimitWarned = true;
    }
    return { ok: true };
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const window = num(env, 'RATE_LIMIT_WINDOW');
  const max = num(env, 'RATE_LIMIT_MAX');
  const key = `contact:${ip}:${Math.floor(Date.now() / 1000 / window)}`;

  const current = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
  if (current >= max) {
    return { ok: false, status: 429, message: 'Too many messages. Please try again later.' };
  }

  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: window + 60 });
  return { ok: true };
}

async function handleContactForm(request, env) {
  // --- Origin. CORS headers are a browser convention and stop nothing server-side. ---
  const origin = request.headers.get('Origin');
  if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) {
    return corsResponse(env, 403, 'Requests from this origin are not accepted.');
  }

  // --- Size, before parsing anything. ---
  const declared = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (declared > num(env, 'MAX_REQUEST_BYTES')) {
    return corsResponse(env, 413, 'Submission is too large.');
  }

  const limited = await checkRateLimit(request, env);
  if (!limited.ok) return corsResponse(env, limited.status, limited.message);

  // --- Parse. ---
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  let collected;

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('x-www-form-urlencoded')
  ) {
    collected = collectEntries((await request.formData()).entries());
  } else if (contentType.includes('application/json')) {
    // Retained for sites generated before the wire contract existed. No file support.
    let json;
    try {
      json = await request.json();
    } catch {
      return corsResponse(env, 400, 'Could not read submission.');
    }
    const entries = [];
    for (const [key, value] of Object.entries(json || {})) {
      if (Array.isArray(value)) for (const v of value) entries.push([key, v]);
      else entries.push([key, value]);
    }
    collected = collectEntries(entries);
  } else {
    return corsResponse(env, 415, 'Unsupported content type.');
  }

  const { fields, files, control } = collected;

  // --- Honeypot: report success, send nothing. ---
  if ((control.get(HONEYPOT_FIELD) || '').trim()) {
    return corsResponse(env, 200, 'Message sent successfully');
  }

  // --- Reply address. No field is required to have a particular name. ---
  const replyTo = resolveReplyTo(fields, env);
  if (!replyTo) {
    return corsResponse(
      env,
      400,
      "A valid email address is required. Name the field 'email', or set REPLY_TO_FIELD."
    );
  }

  const attachmentCheck = validateAttachments(files, env);
  if (!attachmentCheck.ok) {
    return corsResponse(env, attachmentCheck.status, attachmentCheck.message);
  }

  const senderName = headerSafe(resolveSenderName(fields, env, replyTo));
  const emailBody = renderBody(fields, files, senderName);

  // --- Send. FormData, not URLSearchParams: Mailgun rejects urlencoded for attachments. ---
  const region = env.MAILGUN_REGION === 'us' ? 'api' : 'api.eu';
  const mailgunUrl = `https://${region}.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;

  const payload = new FormData();
  payload.append('from', `${senderName} <noreply@${env.MAILGUN_DOMAIN}>`);
  payload.append('to', env.RECIPIENT_EMAIL);
  payload.append('h:Reply-To', headerSafe(replyTo));
  payload.append('subject', headerSafe(env.EMAIL_SUBJECT || `Website enquiry from ${senderName}`));
  payload.append('text', emailBody);

  for (const file of files) {
    payload.append('attachment', file, safeFilename(file.name));
  }

  const mgResponse = await fetch(mailgunUrl, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`api:${env.MAILGUN_API_KEY}`) },
    body: payload,
  });

  if (!mgResponse.ok) {
    console.error('Mailgun error:', mgResponse.status);
    return corsResponse(env, 500, 'Failed to send message. Please try again.');
  }

  return corsResponse(env, 200, 'Message sent successfully');
}

// --- Instagram Feed Handler ---
const INSTAGRAM_API_BASE = 'https://graph.instagram.com/v24.0';
const INSTAGRAM_FIELDS = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp';
const DEFAULT_INSTAGRAM_LIMIT = 8;
const DEFAULT_CACHE_TTL = 1800;

async function handleInstagramFeed(request, env, ctx) {
  if (!env.INSTAGRAM_ACCESS_TOKEN || !env.INSTAGRAM_USER_ID) {
    return corsResponse(env, 500, 'Instagram integration not configured');
  }

  const corsOrigin = env.ALLOWED_ORIGIN || '*';

  // Check cache first
  const cacheKey = new Request('https://cache.internal/instagram-feed');
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Fetch from Instagram Graph API
  const limit = parseInt(env.INSTAGRAM_LIMIT || String(DEFAULT_INSTAGRAM_LIMIT));
  const url = `${INSTAGRAM_API_BASE}/${env.INSTAGRAM_USER_ID}/media?fields=${INSTAGRAM_FIELDS}&limit=${limit}&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`;

  const apiResponse = await fetch(url);
  if (!apiResponse.ok) {
    return corsResponse(env, 502, 'Failed to fetch Instagram feed');
  }

  const json = await apiResponse.json();
  const ttl = parseInt(env.INSTAGRAM_CACHE_TTL || String(DEFAULT_CACHE_TTL));

  const response = new Response(JSON.stringify(json.data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${ttl}`,
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

  // Non-blocking cache write
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

// --- CORS Helper ---
function corsResponse(env, status, body) {
  const origin = env.ALLOWED_ORIGIN || '*';
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify({ success: status < 400, message: body || '' }), {
    status,
    headers,
  });
}
