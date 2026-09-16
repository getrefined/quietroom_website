import * as prismic from '@prismicio/client';

/** Base path without trailing slash ('' on a root deploy, '/quietroom_website' on Pages). */
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const siteDefaults = {
  name: 'Quiet Room Therapy',
  description:
    'Professional psychotherapy, counselling and clinical supervision in St Helier, Jersey, with Christopher Journeaux, UKCP registered psychotherapist.',
  practitioner: 'Christopher Journeaux',
  phone: '07797 736595',
  phoneHref: 'tel:+447797736595',
  email: 'christopher@thequietroom.co.uk',
  addressLines: ['Suite 4, Bourne House', 'Francis Street', 'St Helier', 'Jersey JE2 4QE'],
};

/** Contact form endpoint (Cloudflare Worker /contact). Empty until the Worker is deployed. */
export const contactEndpoint = 'https://quietroom-worker.digital-f33.workers.dev';

export interface NavItem {
  uid: string;
  label: string;
  path: string;
}

export const nav: NavItem[] = [
  { uid: 'home', label: 'Home', path: '/' },
  { uid: 'about', label: 'About', path: '/about/' },
  { uid: 'psychotherapy', label: 'Psychotherapy', path: '/psychotherapy/' },
  { uid: 'supervision', label: 'Supervision', path: '/supervision/' },
  { uid: 'services', label: 'Services', path: '/services/' },
  { uid: 'booking', label: 'Booking', path: '/booking/' },
  { uid: 'links', label: 'Links', path: '/links/' },
  { uid: 'contact', label: 'Contact', path: '/contact/' },
];

export const legalNav: NavItem[] = [
  { uid: 'privacy-statement', label: 'Privacy Statement', path: '/privacy-statement/' },
];

export function pathFor(uid: string): string {
  return uid === 'home' ? '/' : `/${uid}/`;
}

/** Site-relative path → href with the base prefix. Absolute URLs pass through. */
export function href(path: string): string {
  if (!path) return `${base}/`;
  return path.startsWith('/') ? `${base}${path}` : path;
}

/** Path under public/ → URL. */
export function assetUrl(path: string): string {
  return `${base}/${path.replace(/^\/+/, '')}`;
}

/** Prismic image or fallback image → src. */
export function imageSrc(image: any): string | undefined {
  const url = image?.url;
  if (!url) return undefined;
  return /^(https?:)?\/\//.test(url) ? url : assetUrl(url);
}

export function isCurrent(path: string, currentPath?: string): boolean {
  if (!currentPath) return false;
  const norm = (p: string) => (p.endsWith('/') ? p : `${p}/`);
  return norm(href(path)) === norm(currentPath);
}

export const linkResolver = (doc: any): string => {
  if (doc?.type === 'page' && doc.uid) return href(pathFor(doc.uid));
  return href('/');
};

/** Prismic link field → href, or undefined when there is nothing to link to. */
const SAFE_URL = /^(https?:|mailto:|tel:|\/)/i;

export function resolveLink(link: any): string | undefined {
  if (!link) return undefined;
  if (
    (link.link_type === 'Web' || link.link_type === 'Media') &&
    link.url &&
    !SAFE_URL.test(link.url)
  ) {
    return undefined;
  }
  if (link.link_type === 'Document') return link.uid ? linkResolver(link) : undefined;
  if (link.link_type === 'Web' || link.link_type === 'Media') {
    return link.url ? href(link.url) : undefined;
  }
  return undefined;
}

export function linkLabel(link: any, fallback = ''): string {
  return link?.text || fallback;
}

export function isExternal(url?: string): boolean {
  return !!url && /^https?:\/\//.test(url) && !url.startsWith('https://getrefined.github.io');
}

const htmlSerializer = {
  hyperlink: ({ node, children }: { node: any; children: string }) => {
    const url = resolveLink(node?.data);
    if (!url) return children;
    const ext = isExternal(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${url}"${ext}>${children}</a>`;
  },
};

/** StructuredText → HTML (use with set:html). */
export function richText(field: any): string {
  if (!Array.isArray(field) || field.length === 0) return '';
  return prismic.asHTML(field, { linkResolver, serializer: htmlSerializer }) ?? '';
}

export function plainText(field: any): string {
  if (!Array.isArray(field)) return typeof field === 'string' ? field : '';
  return prismic.asText(field) ?? '';
}
