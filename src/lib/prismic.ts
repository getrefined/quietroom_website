import * as prismic from '@prismicio/client';
import { pages as fallbackPages, settings as fallbackSettings } from '../data/pages.mjs';

export const repositoryName = 'quietroom';

export const client = prismic.createClient(repositoryName);

export interface PageData {
  uid: string;
  title: string;
  description: string;
  slices: any[];
  source: 'prismic' | 'fallback';
}

/** Site settings document, or the hardcoded fallback. */
export async function loadSettings(): Promise<any> {
  try {
    const doc = await client.getSingle('settings');
    return { ...fallbackSettings, ...doc.data, source: 'prismic' };
  } catch {
    return { ...fallbackSettings, source: 'fallback' };
  }
}

/**
 * A page by UID. Prismic wins when the document exists and has slices; otherwise the
 * hardcoded fallback from src/data/pages.mjs renders, so the site is complete before any
 * document is published.
 */
export async function loadPage(uid: string): Promise<PageData> {
  const fb = (fallbackPages as any)[uid];
  try {
    const doc = await client.getByUID('page', uid);
    const slices = Array.isArray(doc.data.slices) ? doc.data.slices : [];
    if (slices.length === 0) throw new Error('empty document');
    return {
      uid,
      title: doc.data.title || fb?.title || '',
      description: doc.data.meta_description || fb?.description || '',
      slices,
      source: 'prismic',
    };
  } catch {
    if (!fb) throw new Error(`No fallback content for page "${uid}"`);
    return { uid, ...fb, source: 'fallback' };
  }
}
