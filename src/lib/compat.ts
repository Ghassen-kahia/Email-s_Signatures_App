/**
 * Static compatibility checks for exported signature HTML.
 * These catch the problems that most often break signatures in Gmail and
 * Outlook. They do not replace sending a real test email to each client.
 */

export type CheckLevel = 'pass' | 'warn' | 'fail';

export interface CompatCheck {
  id: string;
  level: CheckLevel;
  title: string;
  detail: string;
}

/** Gmail rejects signatures longer than 10,000 characters. */
export const GMAIL_SIGNATURE_LIMIT = 10_000;

const UNSUPPORTED_CSS: { re: RegExp; name: string }[] = [
  { re: /display\s*:\s*(flex|grid|inline-flex)/i, name: 'flexbox / grid' },
  { re: /position\s*:\s*(absolute|fixed|relative|sticky)/i, name: 'positioning' },
  { re: /background-image\s*:/i, name: 'background images' },
  { re: /\b(var\(|calc\()/i, name: 'CSS variables / calc()' },
  { re: /box-shadow\s*:/i, name: 'box-shadow' },
];

export function checkCompatibility(html: string): CompatCheck[] {
  const checks: CompatCheck[] = [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const imgs = Array.from(doc.querySelectorAll('img'));
  const links = Array.from(doc.querySelectorAll('a'));

  const len = html.length;
  checks.push(
    len > GMAIL_SIGNATURE_LIMIT
      ? {
          id: 'size',
          level: 'fail',
          title: `Too long for Gmail (${len.toLocaleString()} / ${GMAIL_SIGNATURE_LIMIT.toLocaleString()} chars)`,
          detail: 'Gmail refuses signatures over 10,000 characters. Embedded images are the usual cause — use hosted image URLs instead.',
        }
      : {
          id: 'size',
          level: len > GMAIL_SIGNATURE_LIMIT * 0.8 ? 'warn' : 'pass',
          title: `Size: ${len.toLocaleString()} characters`,
          detail: 'Within Gmail’s 10,000 character signature limit.',
        },
  );

  const dataImgs = imgs.filter((i) => (i.getAttribute('src') ?? '').startsWith('data:'));
  const insecureImgs = imgs.filter((i) => {
    const src = i.getAttribute('src') ?? '';
    return !src.startsWith('data:') && !src.startsWith('https://');
  });
  if (dataImgs.length) {
    checks.push({
      id: 'data-uri',
      level: 'warn',
      title: `${dataImgs.length} embedded (base64) image${dataImgs.length > 1 ? 's' : ''}`,
      detail: 'Gmail strips data: images and Outlook often shows them as attachments. Host the image and paste its https:// URL for reliable display.',
    });
  }
  if (insecureImgs.length) {
    checks.push({
      id: 'insecure-img',
      level: 'fail',
      title: 'Image without an absolute https:// URL',
      detail: 'Recipients cannot load local or http:// images.',
    });
  }
  if (imgs.length && !dataImgs.length && !insecureImgs.length) {
    checks.push({ id: 'images', level: 'pass', title: 'Images use absolute https:// URLs', detail: 'Recipients can load them (some clients ask before showing remote images).' });
  }

  const missingAlt = imgs.filter((i) => !(i.getAttribute('alt') ?? '').trim());
  const missingSize = imgs.filter((i) => !i.getAttribute('width') && !i.getAttribute('height'));
  if (imgs.length) {
    checks.push(
      missingAlt.length
        ? { id: 'alt', level: 'warn', title: 'Image missing alt text', detail: 'Alt text is shown when images are blocked and read by screen readers.' }
        : { id: 'alt', level: 'pass', title: 'All images have alt text', detail: 'Shown when images are blocked; read by screen readers.' },
    );
    if (missingSize.length) {
      checks.push({ id: 'img-size', level: 'warn', title: 'Image without width/height attributes', detail: 'Outlook for Windows may render it at its natural size.' });
    }
  }

  const badLinks = links.filter((a) => !/^(https:|mailto:|tel:)/.test(a.getAttribute('href') ?? ''));
  checks.push(
    badLinks.length
      ? { id: 'links', level: 'fail', title: `${badLinks.length} link(s) with unsafe or relative URLs`, detail: 'Only https:, mailto: and tel: links are exported.' }
      : { id: 'links', level: 'pass', title: `${links.length} link${links.length === 1 ? '' : 's'} — all absolute and clickable`, detail: 'https:, mailto: and tel: only.' },
  );

  const hasScript = /<script|\son[a-z]+\s*=/i.test(html);
  const hasStyleTag = /<style|<link\b/i.test(html);
  const hasClass = /\sclass\s*=/i.test(html);
  checks.push(
    hasScript || hasStyleTag || hasClass
      ? { id: 'inline', level: 'fail', title: 'Contains scripts, stylesheets or classes', detail: 'Email clients strip these; all styling must be inline.' }
      : { id: 'inline', level: 'pass', title: 'Inline CSS only — no scripts, classes or stylesheets', detail: 'Survives Gmail’s and Outlook’s HTML sanitisers.' },
  );

  const usedUnsupported = UNSUPPORTED_CSS.filter((u) => u.re.test(html)).map((u) => u.name);
  checks.push(
    usedUnsupported.length
      ? { id: 'css', level: 'warn', title: `Unsupported CSS: ${usedUnsupported.join(', ')}`, detail: 'Outlook for Windows (Word engine) ignores these properties.' }
      : { id: 'css', level: 'pass', title: 'Table layout, no flexbox/grid/positioning', detail: 'Renders in Outlook’s Word-based engine.' },
  );

  return checks;
}
