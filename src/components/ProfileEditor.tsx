import type { FieldErrors, Profile } from '../types';
import { ImageField } from './ImageField';
import { Field, Section } from './ui';

interface Props {
  profile: Profile;
  errors: FieldErrors;
  onChange: (patch: Partial<Profile>) => void;
}

export function ProfileEditor({ profile: p, errors, onChange }: Props) {
  const text = (key: keyof Profile) => (value: string) => onChange({ [key]: value });

  return (
    <div className="space-y-5">
      <Section kicker="01 · Identity" title="Who you are" description="Shown at the top of your signature.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Full name" required autoComplete="name" value={p.fullName} onChange={text('fullName')} error={errors.fullName} maxLength={80} />
          <Field label="Job title" autoComplete="organization-title" value={p.jobTitle} onChange={text('jobTitle')} maxLength={80} />
          <Field label="Company or school" autoComplete="organization" value={p.company} onChange={text('company')} maxLength={80} />
        </div>
      </Section>

      <Section kicker="02 · Contact" title="How to reach you">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" type="email" inputMode="email" autoComplete="email" value={p.email} onChange={text('email')} error={errors.email} />
          <Field label="Phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 555 010 0199" value={p.phone} onChange={text('phone')} error={errors.phone} />
          <Field className="sm:col-span-2" label="Website" inputMode="url" placeholder="example.com" value={p.website} onChange={text('website')} error={errors.website} hint="Bare domains are upgraded to https:// automatically." />
          <Field className="sm:col-span-2" label="Address" autoComplete="street-address" placeholder="Optional" value={p.address} onChange={text('address')} maxLength={160} />
        </div>
      </Section>

      <Section kicker="03 · Links" title="Profiles & portfolio">
        <div className="grid gap-4">
          <Field label="LinkedIn" inputMode="url" placeholder="https://www.linkedin.com/in/you" value={p.linkedin} onChange={text('linkedin')} error={errors.linkedin} />
          <Field label="GitHub" inputMode="url" placeholder="https://github.com/you" value={p.github} onChange={text('github')} error={errors.github} />
          <Field label="Portfolio" inputMode="url" placeholder="https://you.dev" value={p.portfolio} onChange={text('portfolio')} error={errors.portfolio} />
        </div>
      </Section>

      <Section kicker="04 · Call to action" title="Optional button" description="A single, clear next step — book a call, see your latest work…">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Button label" placeholder="Book a call" value={p.ctaLabel} onChange={text('ctaLabel')} error={errors.ctaLabel} maxLength={40} />
          <Field label="Button link" inputMode="url" placeholder="https://cal.com/you" value={p.ctaUrl} onChange={text('ctaUrl')} error={errors.ctaUrl} />
        </div>
      </Section>

      <Section kicker="05 · Images" title="Photo & logo" description="Uploads are processed in your browser and never transmitted.">
        <div className="grid gap-4">
          <ImageField label="Profile photo" kind="photo" value={p.photo} onChange={(photo) => onChange({ photo })} hostedError={errors['photo.hostedUrl']} />
          <ImageField label="Logo" kind="logo" value={p.logo} onChange={(logo) => onChange({ logo })} hostedError={errors['logo.hostedUrl']} />
        </div>
      </Section>
    </div>
  );
}
