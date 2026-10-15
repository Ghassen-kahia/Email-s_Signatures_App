import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE, SAMPLE_PROFILE } from './defaults';
import { hasErrors, validateProfile } from './validation';

describe('validateProfile', () => {
  it('accepts the sample profile', () => {
    expect(hasErrors(validateProfile(SAMPLE_PROFILE))).toBe(false);
  });

  it('requires a name', () => {
    expect(validateProfile(EMPTY_PROFILE).fullName).toBeTruthy();
  });

  it('flags invalid contact details and links', () => {
    const errors = validateProfile({
      ...SAMPLE_PROFILE,
      email: 'nope',
      phone: 'abc',
      website: 'javascript:alert(1)',
      linkedin: 'https://example.com/me',
      github: 'https://gitlab.com/me',
    });
    expect(errors.email).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.website).toBeTruthy();
    expect(errors.linkedin).toMatch(/linkedin\.com/);
    expect(errors.github).toMatch(/github\.com/);
  });

  it('requires CTA label and link together', () => {
    expect(validateProfile({ ...SAMPLE_PROFILE, ctaLabel: '' }).ctaLabel).toBeTruthy();
    expect(validateProfile({ ...SAMPLE_PROFILE, ctaUrl: '' }).ctaUrl).toBeTruthy();
  });

  it('requires hosted images to be https', () => {
    const errors = validateProfile({ ...SAMPLE_PROFILE, photos: [{ id: 'a', hostedUrl: 'http://example.com/me.jpg', localDataUrl: '' }] });
    expect(errors['image.a']).toBeTruthy();
  });
});
