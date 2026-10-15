import type { TemplateId } from '../../types';
import type { SignatureModel } from './model';
import {
  addressRow,
  contactRows,
  css,
  ctaButton,
  hSeparator,
  image,
  inlineLinks,
  link,
  logoImage,
  logoRow,
  socialLinks,
  spacer,
  table,
  td,
  textStyle,
  tr,
} from './primitives';

type Template = (m: SignatureModel) => string;

const MAX_WIDTH = 480;

function nameBlock(m: SignatureModel, nameColor: string, opts: { uppercase?: boolean; titleColor?: string } = {}): string {
  const s = m.style;
  const rows = [
    tr(td(m.name, textStyle(s, {
      'font-size': `${s.nameSize}px`,
      'line-height': `${s.nameSize + 6}px`,
      'font-weight': 'bold',
      color: nameColor,
      'letter-spacing': opts.uppercase ? '1px' : undefined,
      'text-transform': opts.uppercase ? 'uppercase' : undefined,
    }), { align: m.alignment })),
  ];
  const subtitle = [m.title, m.company].filter(Boolean).join(
    `<span style="${css({ color: s.accent })}">&nbsp;&nbsp;/&nbsp;&nbsp;</span>`,
  );
  if (subtitle) {
    rows.push(tr(td(subtitle, textStyle(s, { color: opts.titleColor ?? s.muted }), { align: m.alignment })));
  }
  return rows.join('');
}

function socialRow(m: SignatureModel, color: string): string {
  if (!m.socials.length) return '';
  if (m.iconBase) return spacer(6) + tr(td(socialLinks(m, color), {}, { align: m.alignment }));
  return tr(td(socialLinks(m, color), textStyle(m.style, { 'font-size': `${m.style.smallSize}px` }), { align: m.alignment }));
}

function ctaRow(m: SignatureModel, inner: string): string {
  if (!m.cta) return '';
  return spacer(Math.round(m.style.gap * 0.7)) + tr(td(inner, {}, { align: m.alignment }));
}

/** Photo beside content when left-aligned; stacked above when centered. */
function withPhoto(m: SignatureModel, content: string, divider: string): string {
  const s = m.style;
  // Fluid up to MAX_WIDTH so it never forces horizontal scrolling on phones.
  const wrapAttrs = { align: m.alignment === 'center' ? 'center' : undefined };
  const wrapStyle = { width: '100%', 'max-width': `${MAX_WIDTH}px` };
  if (!m.photo) return table(tr(td(content, { 'vertical-align': 'top' }, { align: m.alignment })), wrapAttrs, wrapStyle);
  const photo = image(m.photo, s.photoSize, s.photoSize, m.photoRounded);

  if (m.alignment === 'center') {
    return table(
      tr(td(photo, { 'padding-bottom': `${s.gap}px` }, { align: 'center' })) + tr(td(content, {}, { align: 'center' })),
      wrapAttrs,
      wrapStyle,
    );
  }
  return table(
    tr(
      td(photo, { 'vertical-align': 'top', 'padding-right': `${s.gap}px` }, { width: s.photoSize, valign: 'top' }) +
        divider +
        td(content, { 'vertical-align': 'top' }, { valign: 'top' }),
    ),
    wrapAttrs,
    wrapStyle,
  );
}

const minimal: Template = (m) => {
  const s = m.style;
  const contacts = [m.phone, m.email, m.website].filter((x) => x !== null);
  const body = table(
    nameBlock(m, s.primary) +
      (m.separator !== 'none' ? spacer(Math.round(s.gap / 2)) + hSeparator(m, '64px') + spacer(Math.round(s.gap / 2)) : spacer(s.gap / 2)) +
      (m.iconBase
        ? contactRows(m, s.text)
        : contacts.length
          ? tr(td(inlineLinks(contacts, s, s.text, s.accent, false), textStyle(s, { 'font-size': `${s.smallSize}px` }), { align: m.alignment }))
          : '') +
      addressRow(m) +
      socialRow(m, s.accent) +
      ctaRow(m, m.cta ? link(m.cta, s.accent, s, `${m.cta.text}&nbsp;&rarr;`, { 'font-weight': 'bold', 'font-size': `${s.smallSize}px` }) : '') +
      (m.logos.length ? spacer(s.gap) + tr(td(logoRow(m), {}, { align: m.alignment })) : ''),
  );
  return withPhoto(m, body, '');
};

const tech: Template = (m) => {
  const s = m.style;
  const divider =
    m.separator === 'none'
      ? ''
      : td('&nbsp;', {
          'border-left': m.separator === 'dot' ? `2px dotted ${s.accent}` : `${m.separator === 'bar' ? 3 : 1}px solid ${s.accent}`,
          'font-size': '1px',
          'padding-right': `${s.gap}px`,
        }, { width: m.separator === 'bar' ? 3 : 1 });

  const body = table(
    nameBlock(m, s.primary) +
      spacer(Math.round(s.gap / 2)) +
      contactRows(m, s.text) +
      addressRow(m) +
      (m.socials.length ? spacer(Math.round(s.gap / 2)) + socialRow(m, s.accent) : '') +
      ctaRow(m, ctaButton(m, s.primary, '#ffffff')) +
      (m.logos.length ? spacer(s.gap) + tr(td(logoRow(m), {}, { align: m.alignment })) : ''),
  );
  const content = m.alignment === 'center' && m.separator !== 'none' ? table(hSeparator(m) + tr(td(body, { 'padding-top': `${s.gap}px` }))) : body;
  return withPhoto(m, content, m.alignment === 'center' ? '' : divider);
};

const corporate: Template = (m) => {
  const s = m.style;
  const header = nameBlock(m, s.primary, { titleColor: s.text });
  const contacts = table(contactRows(m, s.text) + addressRow(m));
  const centered = m.alignment === 'center';

  let middle: string;
  if (m.logos.length && !centered) {
    middle = tr(td(table(tr(
      td(table(m.logos.map((l, i) => tr(td(logoImage(l, s), { 'padding-top': i ? `${s.gap / 2}px` : undefined }))).join('')), { 'padding-right': `${s.gap}px`, 'vertical-align': 'middle', 'border-right': `1px solid ${s.muted}` }, { valign: 'middle' }) +
        td(contacts, { 'padding-left': `${s.gap}px`, 'vertical-align': 'middle' }, { valign: 'middle' }),
    ))));
  } else {
    middle = (m.logos.length ? tr(td(logoRow(m), { 'padding-bottom': `${s.gap / 2}px` }, { align: m.alignment })) : '') + tr(td(contacts, {}, { align: m.alignment }));
  }

  const inner = table(
    header +
      spacer(Math.round(s.gap / 2)) +
      hSeparator(m) +
      spacer(Math.round(s.gap / 2)) +
      middle +
      (m.socials.length ? spacer(Math.round(s.gap / 2)) + socialRow(m, s.primary) : '') +
      ctaRow(m, ctaButton(m, s.accent)),
    { width: '100%' },
  );
  return withPhoto(m, inner, '');
};

const creative: Template = (m) => {
  const s = m.style;
  const banner = table(
    tr(td(
      table(nameBlock({ ...m, alignment: m.alignment }, '#ffffff', { uppercase: true, titleColor: '#ffffff' })),
      { 'background-color': s.primary, padding: `${s.gap}px ${s.gap + 4}px`, 'border-radius': '10px', 'border-bottom': `4px solid ${s.accent}` },
      { bgcolor: s.primary, align: m.alignment },
    )),
    { width: '100%' },
  );
  const contacts = [m.phone, m.email, m.website].filter((x) => x !== null);
  const body = table(
    tr(td(banner)) +
      spacer(Math.round(s.gap * 0.8)) +
      (m.iconBase
        ? contactRows(m, s.text)
        : contacts.length
          ? tr(td(inlineLinks(contacts, s, s.text, s.accent, m.showLinkLabels), textStyle(s, { 'font-size': `${s.smallSize}px` }), { align: m.alignment }))
          : '') +
      addressRow(m) +
      (m.separator !== 'none' && m.socials.length ? hSeparator({ ...m, separator: m.separator === 'line' ? 'dot' : m.separator }) : '') +
      socialRow(m, s.accent) +
      ctaRow(m, ctaButton(m, s.accent, '#ffffff', true)) +
      (m.logos.length ? spacer(s.gap) + tr(td(logoRow(m), {}, { align: m.alignment })) : ''),
    { width: '100%' },
  );
  return withPhoto(m, body, '');
};

export const TEMPLATES: Record<TemplateId, Template> = { minimal, tech, corporate, creative };
