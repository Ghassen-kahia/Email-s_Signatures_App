import type { FieldErrors, Profile } from '../types';
import { isHttpsUrl, isValidEmail, isValidPhone, normalizeWebUrl } from './sanitize';

const URL_FIELDS = ['website', 'linkedin', 'github', 'portfolio', 'ctaUrl'] as const;

const HOST_HINTS: Partial<Record<(typeof URL_FIELDS)[number], string>> = {
  linkedin: 'linkedin.com',
  github: 'github.com',
};

export function validateProfile(profile: Profile): FieldErrors {
  const errors: FieldErrors = {};

  if (!profile.fullName.trim()) errors.fullName = 'Your name is required — it anchors the signature.';
  if (profile.email.trim() && !isValidEmail(profile.email)) {
    errors.email = 'This doesn’t look like a valid email address (e.g. ada@example.com).';
  }
  if (profile.phone.trim() && !isValidPhone(profile.phone)) {
    errors.phone = 'Use digits with optional +, spaces, dashes or parentheses (6–20 digits).';
  }

  for (const field of URL_FIELDS) {
    const raw = profile[field];
    if (!raw.trim()) continue;
    const url = normalizeWebUrl(raw);
    if (!url) {
      errors[field] = 'Enter a valid web address, e.g. https://example.com';
      continue;
    }
    const hint = HOST_HINTS[field];
    if (hint && !new URL(url).hostname.endsWith(hint)) {
      errors[field] = `Expected a ${hint} link.`;
    }
  }

  if (profile.ctaUrl.trim() && !profile.ctaLabel.trim()) {
    errors.ctaLabel = 'Add a short label for your call-to-action button.';
  }
  if (profile.ctaLabel.trim() && !profile.ctaUrl.trim()) {
    errors.ctaUrl = 'A call-to-action needs a link.';
  }

  for (const img of [...profile.photos, ...profile.logos]) {
    const hosted = img.hostedUrl.trim();
    if (hosted && !isHttpsUrl(hosted)) {
      errors[`image.${img.id}`] = 'Hosted images must use an absolute https:// URL so recipients can load them.';
    }
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
