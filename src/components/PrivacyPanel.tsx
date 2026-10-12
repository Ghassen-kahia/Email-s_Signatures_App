import { useEffect, useState } from 'react';
import { Callout, Section } from './ui';

interface Props {
  onReset: () => void;
  onClear: () => void;
  storageWarning: string;
}

export function PrivacyPanel({ onReset, onClear, storageWarning }: Props) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <Section kicker="Privacy" title="Your data stays here">
      <ul className="space-y-2.5 text-sm text-ink-200">
        {[
          'No analytics, tracking pixels, cookies or external fonts.',
          'No network requests — the app has no backend.',
          'Settings are saved in this browser’s local storage only.',
          'Uploaded photos are resized locally and never transmitted.',
        ].map((item) => (
          <li key={item} className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-400" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Callout title="When do images need hosting?">
          Your signature travels inside every email you send. Recipients’ mail apps download images from the address written in the
          signature, so a photo stored on your computer can’t be seen by anyone else. If you want recipients to see your photo or logo, you
          choose where to publish it and paste its <code className="font-mono">https://</code> link — the only time any image leaves your
          device, and it’s done by you, not this app.
        </Callout>
      </div>
      {storageWarning && (
        <div className="mt-3">
          <Callout tone="warn">{storageWarning}</Callout>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-700/60 pt-4">
        <button type="button" className="btn btn-ghost text-xs" onClick={onReset}>Load sample data</button>
        <button
          type="button"
          className="btn btn-quiet text-xs text-rose-300 hover:text-rose-200"
          onClick={() => {
            if (confirming) {
              setConfirming(false);
              onClear();
            } else setConfirming(true);
          }}
        >
          {confirming ? 'Click again to erase all saved data' : 'Clear everything'}
        </button>
      </div>
    </Section>
  );
}
