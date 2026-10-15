import { useCallback, useEffect, useState } from 'react';
import type { FieldErrors, Profile } from '../types';
import { pendingCount, publishImages } from '../lib/hosting';
import { ImageField } from './ImageField';
import { Field, Section } from './ui';

interface Props {
  profile: Profile;
  errors: FieldErrors;
  onChange: (patch: Partial<Profile>) => void;
}

export function ProfileEditor({ profile: p, errors, onChange }: Props) {
  const text = (key: keyof Profile) => (value: string) => onChange({ [key]: value });
  const hosting = useHosting();
  const imageProps = { errors, canHost: hosting.available, onHosted: hosting.refresh, checkVersion: hosting.version };

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

      <Section
        kicker="05 · Images"
        title="Photos & logos"
        description={
          hosting.available
            ? 'Uploads are resized in your browser and saved into this project’s public/hosted folder. Publishing pushes them to your public GitHub repo so recipients can see them.'
            : 'Uploads are resized in your browser and never transmitted. Recipients need a public link for each image.'
        }
      >
        <div className="grid gap-4">
          <ImageField
            label="Profile photo"
            kind="photo"
            items={p.photos}
            onChange={(photos) => onChange({ photos })}
            active={p.activePhoto}
            onActiveChange={(activePhoto) => onChange({ activePhoto })}
            {...imageProps}
          />
          <ImageField label="Logos" kind="logo" items={p.logos} onChange={(logos) => onChange({ logos })} {...imageProps} />
          {hosting.available && (hosting.pending > 0 || hosting.error) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-400/5 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-200">
                  {hosting.pending > 0 ? `${hosting.pending} image${hosting.pending > 1 ? 's' : ''} not public yet` : 'Publishing failed'}
                </p>
                <p className="text-xs text-ink-400">
                  {hosting.error ? <span className="whitespace-pre-wrap text-rose-300">{hosting.error}</span> : 'Commits public/hosted and pushes it to GitHub. Anyone can view files in a public repo.'}
                </p>
              </div>
              <button type="button" className="btn btn-primary text-xs" onClick={hosting.publish} disabled={hosting.publishing}>
                {hosting.publishing ? 'Publishing…' : 'Publish to GitHub'}
              </button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

/** State of the dev server's GitHub image hosting (see hosting-plugin.ts). */
function useHosting() {
  const [pending, setPending] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    pendingCount().then(setPending);
  }, []);
  useEffect(refresh, [refresh]);

  async function publish() {
    setPublishing(true);
    setError('');
    try {
      setPending(await publishImages());
      // Re-run the link checks now that the files are public.
      setVersion(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publishing failed');
    } finally {
      setPublishing(false);
    }
  }

  return { available: pending !== null, pending: pending ?? 0, publishing, error, publish, refresh, version };
}
