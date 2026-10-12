export type TemplateId = 'minimal' | 'tech' | 'corporate' | 'creative';

export interface ImageAsset {
  /** Public HTTPS URL used in the exported signature. */
  hostedUrl: string;
  /** Local data URL from an upload — used for the in-app preview only. Never transmitted. */
  localDataUrl: string;
}

export interface Profile {
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  github: string;
  portfolio: string;
  address: string;
  ctaLabel: string;
  ctaUrl: string;
  photo: ImageAsset;
  logo: ImageAsset;
}

export type FontFamilyId = 'arial' | 'helvetica' | 'georgia' | 'verdana' | 'trebuchet' | 'tahoma';
export type SeparatorStyle = 'none' | 'line' | 'bar' | 'dot';
export type Alignment = 'left' | 'center';
export type Spacing = 'compact' | 'normal' | 'relaxed';

export interface Design {
  template: TemplateId;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  fontFamily: FontFamilyId;
  fontSize: number;
  spacing: Spacing;
  separator: SeparatorStyle;
  alignment: Alignment;
  photoSize: number;
  photoRounded: boolean;
  showLinkLabels: boolean;
}

export interface ExportOptions {
  /** Embed uploaded images as base64 data URIs (not recommended — blocked by Gmail and many clients). */
  embedLocalImages: boolean;
}

export interface AppState {
  profile: Profile;
  design: Design;
  exportOptions: ExportOptions;
}

export type FieldErrors = Partial<Record<string, string>>;
