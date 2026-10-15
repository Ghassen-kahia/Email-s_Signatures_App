/**
 * Text/URL hygiene for email HTML generation.
 * Everything that ends up inside the exported signature passes through these helpers.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape text for safe use in HTML element content or quoted attributes. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** Collapse whitespace and strip control characters from single-line text. */
export function cleanText(value: string, maxLength = 200): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Normalise a user-entered web address into an absolute https URL.
 * Returns null when the input is not a valid http(s) URL.
 * Bare domains ("example.com") are upgraded to https.
 */
export function normalizeWebUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!url.hostname.includes('.') || /\s/.test(value)) return null;
  if (url.username || url.password) return null;
  if (url.protocol === 'http:') url.protocol = 'https:';
  return url.toString();
}

/** Strict check for hosted images: must already be an absolute https URL. */
export function isHttpsUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim());
}

/** Phone: digits plus common separators, 6–20 digits total. */
export function isValidPhone(raw: string): boolean {
  const value = raw.trim();
  if (!/^\+?[0-9\s().\-/]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 20;
}

export function telHref(raw: string): string {
  const value = raw.trim();
  return `tel:${value.startsWith('+') ? '+' : ''}${value.replace(/\D/g, '')}`;
}

export function mailtoHref(raw: string): string {
  return `mailto:${encodeURIComponent(raw.trim()).replace(/%40/g, '@')}`;
}

/** Human-friendly display of a URL: strip protocol, www and trailing slash. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

/** Accept only #rgb / #rrggbb hex colours; fall back otherwise. */
export function safeColor(value: string, fallback: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
}

/**
 * Turn a "share" link from a common file host into a direct link to the image
 * itself. Share links open a web page, which email clients can't show as an
 * image. Returns the input unchanged when no rule applies.
 */
export function toDirectImageUrl(raw: string): string {
  const value = raw.trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return raw;
  }
  const host = url.hostname.replace(/^www\./, '');

  // Google Drive: /file/d/<id>/view, /open?id=<id>, /uc?id=<id>
  if (host === 'drive.google.com') {
    const id = /\/file\/d\/([\w-]+)/.exec(url.pathname)?.[1] ?? url.searchParams.get('id');
    if (id && /^[\w-]+$/.test(id)) return `https://lh3.googleusercontent.com/d/${id}`;
  }
  // Dropbox: ?dl=0 opens a preview page, ?raw=1 serves the file.
  if (host === 'dropbox.com') {
    url.searchParams.delete('dl');
    url.searchParams.set('raw', '1');
    return url.toString();
  }
  // GitHub: /<user>/<repo>/blob/<ref>/<path> → jsDelivr (correct image headers, CDN cached).
  if (host === 'github.com') {
    const m = /^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/.exec(url.pathname);
    if (m) return `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@${m[3]}/${m[4]}`;
  }
  return raw;
}
