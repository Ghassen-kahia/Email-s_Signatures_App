import type { AppState, Design, FontFamilyId, Profile, TemplateId } from '../types';

/** Sample data — replace with your own in the editor. All values are fictional. */
export const SAMPLE_PROFILE: Profile = {
  fullName: 'Ada Moreau',
  jobTitle: 'Senior Software Engineer',
  company: 'Northwind Labs',
  email: 'ada.moreau@example.com',
  phone: '+33 6 12 34 56 78',
  website: 'https://example.com',
  linkedin: 'https://www.linkedin.com/in/ada-moreau',
  github: 'https://github.com/adamoreau',
  portfolio: 'https://ada.example.dev',
  address: '12 Rue de la Paix, 75002 Paris',
  ctaLabel: 'Book a 20-min call',
  ctaUrl: 'https://example.com/meet',
  photo: { hostedUrl: '', localDataUrl: '' },
  logo: { hostedUrl: '', localDataUrl: '' },
};

export const EMPTY_PROFILE: Profile = {
  fullName: '',
  jobTitle: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  linkedin: '',
  github: '',
  portfolio: '',
  address: '',
  ctaLabel: '',
  ctaUrl: '',
  photo: { hostedUrl: '', localDataUrl: '' },
  logo: { hostedUrl: '', localDataUrl: '' },
};

/** Email-safe font stacks only — web fonts are not reliably supported in mail clients. */
export const FONT_STACKS: Record<FontFamilyId, { label: string; stack: string }> = {
  arial: { label: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  helvetica: { label: 'Helvetica', stack: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  verdana: { label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  tahoma: { label: 'Tahoma', stack: 'Tahoma, Geneva, sans-serif' },
  trebuchet: { label: 'Trebuchet MS', stack: "'Trebuchet MS', Arial, sans-serif" },
  georgia: { label: 'Georgia (serif)', stack: "Georgia, 'Times New Roman', serif" },
};

export const TEMPLATE_META: Record<TemplateId, { name: string; blurb: string; preset: Partial<Design> }> = {
  minimal: {
    name: 'Minimal',
    blurb: 'Quiet, typographic, one accent line.',
    preset: { primaryColor: '#0f172a', accentColor: '#0891b2', fontFamily: 'helvetica', separator: 'line' },
  },
  tech: {
    name: 'Tech Premium',
    blurb: 'Photo, accent bar and mono-style link row.',
    preset: { primaryColor: '#0b1630', accentColor: '#06b6d4', fontFamily: 'arial', separator: 'bar' },
  },
  corporate: {
    name: 'Corporate',
    blurb: 'Logo-forward, structured contact table.',
    preset: { primaryColor: '#1e3a8a', accentColor: '#2563eb', fontFamily: 'arial', separator: 'line' },
  },
  creative: {
    name: 'Creative',
    blurb: 'Bold name, colour block and pill CTA.',
    preset: { primaryColor: '#4c1d95', accentColor: '#db2777', fontFamily: 'trebuchet', separator: 'dot' },
  },
};

export const DEFAULT_DESIGN: Design = {
  template: 'tech',
  primaryColor: '#0b1630',
  accentColor: '#06b6d4',
  textColor: '#1f2937',
  mutedColor: '#64748b',
  fontFamily: 'arial',
  fontSize: 13,
  spacing: 'normal',
  separator: 'bar',
  alignment: 'left',
  photoSize: 80,
  photoRounded: true,
  showLinkLabels: true,
};

export const DEFAULT_STATE: AppState = {
  profile: SAMPLE_PROFILE,
  design: DEFAULT_DESIGN,
  exportOptions: { embedLocalImages: false },
};
