/**
 * Rich text helpers producing Prismic StructuredText JSON.
 *
 * The same content serves as the hardcoded fallback rendered by Astro AND as the source
 * for the Prismic documents pushed by scripts, so it is written once, in Prismic's shape.
 *
 * Inline syntax inside strings: **bold**, *italic*, [link text](https://example.com).
 * Internal links are written as site-relative paths: [About me](/about/).
 */

function parseInline(src) {
  let text = '';
  const spans = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(src))) {
    text += src.slice(last, m.index);
    const start = text.length;
    if (m[1] !== undefined) {
      text += m[1];
      spans.push({ start, end: text.length, type: 'strong' });
    } else if (m[2] !== undefined) {
      text += m[2];
      spans.push({ start, end: text.length, type: 'em' });
    } else {
      text += m[3];
      const url = m[4];
      const data = { link_type: 'Web', url };
      if (/^https?:\/\//.test(url)) data.target = '_blank';
      spans.push({ start, end: text.length, type: 'hyperlink', data });
    }
    last = m.index + m[0].length;
  }
  text += src.slice(last);
  return { text, spans };
}

/** One block of the given type. */
export const block = (type, src) => ({ type, ...parseInline(src) });

/** Paragraph blocks, one per argument. */
export const para = (...lines) => lines.map((l) => block('paragraph', l));
export const h1 = (s) => [block('heading1', s)];
export const h2 = (s) => [block('heading2', s)];
export const h3 = (s) => [block('heading3', s)];
export const ul = (...items) => items.map((i) => block('list-item', i));
export const ol = (...items) => items.map((i) => block('o-list-item', i));

/** Concatenate block arrays: rt(h3('Title'), para('a', 'b'), ul('x', 'y')). */
export const rt = (...parts) => parts.flat();

/** Links. Internal pages use `page(uid, text)`, everything else `web(url, text)`. */
export const web = (url, text) => ({ link_type: 'Web', url, text });
export const page = (uid, text) => ({ link_type: 'Document', type: 'page', uid, text });
export const noLink = () => ({ link_type: 'Any' });

/** Image field. `path` is relative to public/ (e.g. 'images/x.jpg') or an absolute URL. */
export const img = (path, alt, width, height) => ({
  url: path,
  alt,
  dimensions: { width, height },
});

/** Slice wrapper. */
export const slice = (slice_type, primary) => ({ slice_type, variation: 'default', primary });
