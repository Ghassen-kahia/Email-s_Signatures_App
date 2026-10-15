/**
 * Email-safe HTML building blocks.
 * Rules followed everywhere: tables for layout, inline styles only, explicit
 * font declarations on every text cell (Outlook does not inherit reliably),
 * width/height attributes on images, no classes, no <style>, no scripts.
 */
import type { IconName, ImageRef, LinkItem, ResolvedStyle, SignatureModel } from './model';

type Attrs = Record<string, string | number | undefined>;

function attrs(a: Attrs): string {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
}

export function css(rules: Record<string, string | number | undefined>): string {
  return Object.entries(rules)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

/** Presentation table with all the resets mail clients need. */
export function table(inner: string, extra: Attrs = {}, style: Record<string, string | number | undefined> = {}): string {
  return `<table${attrs({ cellpadding: 0, cellspacing: 0, border: 0, role: 'presentation', ...extra })} style="${css({
    'border-collapse': 'collapse',
    'mso-table-lspace': '0pt',
    'mso-table-rspace': '0pt',
    ...style,
  })}">${inner}</table>`;
}

export function td(inner: string, style: Record<string, string | number | undefined> = {}, extra: Attrs = {}): string {
  return `<td${attrs(extra)} style="${css(style)}">${inner}</td>`;
}

export const tr = (inner: string) => `<tr>${inner}</tr>`;

export function textStyle(s: ResolvedStyle, overrides: Record<string, string | number | undefined> = {}) {
  return {
    'font-family': s.font,
    'font-size': `${s.size}px`,
    'line-height': `${Math.round(s.size * s.lineHeight)}px`,
    color: s.text,
    ...overrides,
  };
}

export function link(item: LinkItem, color: string, s: ResolvedStyle, text = item.text, extra: Record<string, string> = {}): string {
  return `<a href="${item.href}" target="_blank" rel="noopener" style="${css({
    color,
    'text-decoration': 'none',
    'font-family': s.font,
    ...extra,
  })}">${text}</a>`;
}

export function image(img: ImageRef, width: number, height: number | 'auto', rounded: boolean): string {
  return `<img src="${img.src}" alt="${img.alt}" width="${width}"${height === 'auto' ? '' : ` height="${height}"`} style="${css({
    display: 'block',
    border: 0,
    outline: 'none',
    'text-decoration': 'none',
    width: `${width}px`,
    height: height === 'auto' ? 'auto' : `${height}px`,
    'max-width': `${width}px`,
    'border-radius': rounded ? '50%' : '6px',
  })}">`;
}

export function logoImage(img: ImageRef, s: ResolvedStyle): string {
  return `<img src="${img.src}" alt="${img.alt}" height="${s.logoHeight}" style="${css({
    display: 'block',
    border: 0,
    outline: 'none',
    height: `${s.logoHeight}px`,
    width: 'auto',
    'max-width': '180px',
  })}">`;
}

/**
 * A white glyph PNG on a coloured cell. The colour comes from `bgcolor`, so one
 * set of hosted icons matches any palette. Outlook for Windows shows a square
 * instead of a circle.
 */
export function iconCell(m: SignatureModel, icon: IconName, alt: string, size: number, bg: string, href?: string): string {
  // Kept lean: a signature can carry up to seven of these and Gmail caps signatures at 10,000 characters.
  const img = `<img src="${m.iconBase}${icon}.png" alt="${alt}" width="${size}" height="${size}" style="display:block;border:0">`;
  const inner = href ? `<a href="${href}" target="_blank" rel="noopener">${img}</a>` : img;
  return td(inner, { 'background-color': bg, 'border-radius': '50%', 'line-height': `${size}px`, 'font-size': '1px' }, { width: size, height: size, bgcolor: bg });
}

/** One line of text with an icon in front, in its own table so it can't widen the column. */
function iconLine(m: SignatureModel, icon: IconName, alt: string, content: string): string {
  const s = m.style;
  const size = Math.max(16, s.smallSize + 6);
  return table(
    tr(
      iconCell(m, icon, alt, size, s.accent) +
        td(content, textStyle(s, { 'font-size': `${s.smallSize}px`, 'padding-left': '8px', 'vertical-align': 'middle' }), { valign: 'middle' }),
    ),
    { align: m.alignment === 'center' ? 'center' : undefined },
  );
}

/** All logos in one row, with a gap between them. */
export function logoRow(m: SignatureModel): string {
  const s = m.style;
  const cells = m.logos.map((l, i) => td(logoImage(l, s), { 'padding-left': i ? `${s.gap}px` : undefined, 'vertical-align': 'middle' }, { valign: 'middle' }));
  return table(tr(cells.join('')), { align: m.alignment === 'center' ? 'center' : undefined });
}

/** Spacer row — more reliable than margins across clients. */
export function spacer(height: number): string {
  return tr(td('&nbsp;', { height: `${height}px`, 'line-height': `${height}px`, 'font-size': '1px', 'mso-line-height-rule': 'exactly' }));
}

/** Horizontal separator respecting the selected style. */
export function hSeparator(m: SignatureModel, width = '100%'): string {
  const s = m.style;
  switch (m.separator) {
    case 'none':
      return '';
    case 'dot':
      return tr(td(`<span style="${css({ color: s.accent, 'font-size': '14px', 'letter-spacing': '6px', 'font-family': s.font })}">&#9679;&#9679;&#9679;</span>`, {
        padding: `${Math.round(s.gap / 2)}px 0`,
        'line-height': '14px',
      }, { align: m.alignment }));
    case 'bar':
      return tr(td(table(tr(td('&nbsp;', { 'background-color': s.accent, height: '3px', 'line-height': '3px', 'font-size': '1px' }, { width: 48, bgcolor: s.accent })), { align: m.alignment === 'center' ? 'center' : undefined }), {
        padding: `${Math.round(s.gap / 2)}px 0`,
      }));
    case 'line':
    default:
      if (width !== '100%') {
        // A fixed-width line gets its own table: a sized cell would constrain the whole column.
        return tr(td(table(tr(td('&nbsp;', { 'border-top': `1px solid ${s.accent}`, 'font-size': '1px', 'line-height': '1px', height: '1px' }, { width: parseInt(width, 10) || 64 })), { align: m.alignment === 'center' ? 'center' : undefined }, { width })));
      }
      return tr(td('&nbsp;', {
        'border-top': `1px solid ${s.accent}`,
        'font-size': '1px',
        'line-height': '1px',
        height: '1px',
        width,
      }));
  }
}

/** Joins contact links into a single inline row: a · b · c */
export function inlineLinks(items: LinkItem[], s: ResolvedStyle, color: string, sepColor: string, labelled: boolean): string {
  return items
    .map((it) => {
      const lbl = labelled && it.label !== it.text ? `<span style="${css({ color: s.muted, 'font-family': s.font })}">${it.label}&nbsp;</span>` : '';
      return `${lbl}${link(it, color, s)}`;
    })
    .join(`<span style="${css({ color: sepColor, 'font-family': s.font })}">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`);
}

export function socialLinks(m: SignatureModel, color: string, extra: Record<string, string> = {}): string {
  const s = m.style;
  if (m.iconBase) {
    const size = s.smallSize + 12;
    const cells = m.socials.map((it) => iconCell(m, it.icon, it.label, size, color, it.href));
    return table(tr(cells.join(td('&nbsp;', { width: '6px', 'font-size': '1px' }, { width: 6 }))), { align: m.alignment === 'center' ? 'center' : undefined });
  }
  return m.socials
    .map((it) => link(it, color, s, it.label, { 'font-weight': 'bold', ...extra }))
    .join(`<span style="${css({ color: s.muted, 'font-family': s.font })}">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>`);
}

/** "Bulletproof" button: a table cell with bgcolor so it renders in Outlook too. */
export function ctaButton(m: SignatureModel, bg: string, fg = '#ffffff', pill = false): string {
  if (!m.cta) return '';
  const s = m.style;
  return table(
    tr(td(link(m.cta, fg, s, m.cta.text, {
      display: 'inline-block',
      padding: '8px 16px',
      'font-size': `${s.smallSize}px`,
      'font-weight': 'bold',
      'line-height': `${s.smallSize + 4}px`,
    }), {
      'background-color': bg,
      'border-radius': pill ? '999px' : '4px',
      'mso-padding-alt': '8px 16px',
    }, { bgcolor: bg, align: 'center' })),
    { align: m.alignment === 'center' ? 'center' : undefined },
  );
}

/** Contact lines (email/phone/website), one per row. */
export function contactRows(m: SignatureModel, linkColor: string): string {
  const s = m.style;
  const rows: string[] = [];
  const items = [m.phone, m.email, m.website].filter((x): x is LinkItem => x !== null);
  for (const it of items) {
    if (m.iconBase) {
      rows.push(tr(td(iconLine(m, it.icon, it.label, link(it, linkColor, s)), { 'padding-bottom': '4px' }, { align: m.alignment })));
      continue;
    }
    const lbl = m.showLinkLabels
      ? `<span style="${css({ color: m.style.accent, 'font-weight': 'bold', 'font-family': s.font })}">${it.label.charAt(0)}&nbsp;&nbsp;</span>`
      : '';
    rows.push(tr(td(`${lbl}${link(it, linkColor, s)}`, textStyle(s, { 'font-size': `${s.smallSize}px` }), { align: m.alignment })));
  }
  return rows.join('');
}

export function addressRow(m: SignatureModel): string {
  if (!m.address) return '';
  const s = m.style;
  if (m.iconBase) {
    return tr(td(iconLine(m, 'map-pin', 'Address', `<span style="${css({ color: s.muted, 'font-family': s.font })}">${m.address}</span>`), {}, { align: m.alignment }));
  }
  return tr(td(m.address, textStyle(s, { color: s.muted, 'font-size': `${s.smallSize}px` }), { align: m.alignment }));
}
