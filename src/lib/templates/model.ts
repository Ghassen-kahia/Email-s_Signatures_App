import type { AppState, Design, ImageAsset, Spacing } from '../../types';
import { FONT_STACKS } from '../defaults';
import {
  cleanText,
  displayUrl,
  escapeHtml,
  isHttpsUrl,
  isValidEmail,
  isValidPhone,
  mailtoHref,
  normalizeWebUrl,
  safeColor,
  telHref,
} from '../sanitize';

export type RenderMode = 'preview' | 'export';

export interface LinkItem {
  /** Escaped, validated href. */
  href: string;
  /** Escaped visible text. */
  text: string;
  /** Escaped short label (e.g. "LinkedIn"). */
  label: string;
}

export interface ImageRef {
  src: string;
  alt: string;
}

/** Fully sanitised, render-ready data. Every string here is already HTML-escaped. */
export interface SignatureModel {
  name: string;
  title: string;
  company: string;
  address: string;
  email: LinkItem | null;
  phone: LinkItem | null;
  website: LinkItem | null;
  socials: LinkItem[];
  cta: LinkItem | null;
  photo: ImageRef | null;
  logo: ImageRef | null;
  style: ResolvedStyle;
  alignment: Design['alignment'];
  separator: Design['separator'];
  photoRounded: boolean;
  showLinkLabels: boolean;
}

export interface ResolvedStyle {
  font: string;
  size: number;
  nameSize: number;
  smallSize: number;
  primary: string;
  accent: string;
  text: string;
  muted: string;
  gap: number;
  lineHeight: number;
  photoSize: number;
  logoHeight: number;
}

const SPACING: Record<Spacing, { gap: number; lineHeight: number }> = {
  compact: { gap: 8, lineHeight: 1.35 },
  normal: { gap: 14, lineHeight: 1.5 },
  relaxed: { gap: 20, lineHeight: 1.65 },
};

export interface ImageResolution {
  ref: ImageRef | null;
  /** True when a local upload exists but cannot be shown to recipients. */
  omittedLocal: boolean;
  embeddedLocal: boolean;
}

export function resolveImage(asset: ImageAsset, alt: string, mode: RenderMode, embedLocal: boolean): ImageResolution {
  const hosted = asset.hostedUrl.trim();
  if (hosted && isHttpsUrl(hosted)) {
    return { ref: { src: escapeHtml(hosted), alt }, omittedLocal: false, embeddedLocal: false };
  }
  if (asset.localDataUrl) {
    if (mode === 'preview' || embedLocal) {
      return { ref: { src: escapeHtml(asset.localDataUrl), alt }, omittedLocal: false, embeddedLocal: mode === 'export' };
    }
    return { ref: null, omittedLocal: true, embeddedLocal: false };
  }
  return { ref: null, omittedLocal: false, embeddedLocal: false };
}

function webLink(raw: string, label: string, text?: string): LinkItem | null {
  const url = normalizeWebUrl(raw);
  if (!url) return null;
  return { href: escapeHtml(url), text: escapeHtml(text ?? displayUrl(url)), label: escapeHtml(label) };
}

export function buildModel(state: AppState, mode: RenderMode): SignatureModel {
  const { profile: p, design: d, exportOptions } = state;
  const spacing = SPACING[d.spacing];
  const size = Math.min(16, Math.max(11, Math.round(d.fontSize)));
  const name = escapeHtml(cleanText(p.fullName, 80));

  const email = isValidEmail(p.email)
    ? { href: escapeHtml(mailtoHref(p.email)), text: escapeHtml(p.email.trim()), label: 'Email' }
    : null;
  const phone = isValidPhone(p.phone)
    ? { href: escapeHtml(telHref(p.phone)), text: escapeHtml(cleanText(p.phone, 30)), label: 'Phone' }
    : null;

  const socials = [
    webLink(p.linkedin, 'LinkedIn'),
    webLink(p.github, 'GitHub'),
    webLink(p.portfolio, 'Portfolio'),
  ].filter((x): x is LinkItem => x !== null);

  const ctaLabel = cleanText(p.ctaLabel, 40);
  const cta = ctaLabel ? webLink(p.ctaUrl, ctaLabel, ctaLabel) : null;

  const photo = resolveImage(p.photo, `Photo of ${name || 'sender'}`, mode, exportOptions.embedLocalImages);
  const companyText = cleanText(p.company, 80);
  const logo = resolveImage(p.logo, escapeHtml(companyText ? `${companyText} logo` : 'Logo'), mode, exportOptions.embedLocalImages);

  return {
    name,
    title: escapeHtml(cleanText(p.jobTitle, 80)),
    company: escapeHtml(companyText),
    address: escapeHtml(cleanText(p.address, 160)),
    email,
    phone,
    website: webLink(p.website, 'Web'),
    socials,
    cta,
    photo: photo.ref,
    logo: logo.ref,
    alignment: d.alignment,
    separator: d.separator,
    photoRounded: d.photoRounded,
    showLinkLabels: d.showLinkLabels,
    style: {
      font: FONT_STACKS[d.fontFamily]?.stack ?? FONT_STACKS.arial.stack,
      size,
      nameSize: size + 5,
      smallSize: size - 1,
      primary: safeColor(d.primaryColor, '#0b1630'),
      accent: safeColor(d.accentColor, '#06b6d4'),
      text: safeColor(d.textColor, '#1f2937'),
      muted: safeColor(d.mutedColor, '#64748b'),
      gap: spacing.gap,
      lineHeight: spacing.lineHeight,
      photoSize: Math.min(140, Math.max(40, Math.round(d.photoSize))),
      logoHeight: 32,
    },
  };
}
