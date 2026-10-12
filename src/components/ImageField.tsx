import { useRef, useState } from 'react';
import type { ImageAsset } from '../types';
import { ACCEPTED_IMAGE_TYPES, ImageError, dataUrlBytes, processImage } from '../lib/image';
import { Field } from './ui';

interface Props {
  label: string;
  kind: 'photo' | 'logo';
  value: ImageAsset;
  onChange: (value: ImageAsset) => void;
  hostedError?: string;
}

export function ImageField({ label, kind, value, onChange, hostedError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const preview = value.hostedUrl.startsWith('https://') && !hostedError ? value.hostedUrl : value.localDataUrl;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      // Photos are cropped square; 2x the max display size keeps them sharp.
      const dataUrl = kind === 'photo' ? await processImage(file, 280, true) : await processImage(file, 360);
      onChange({ ...value, localDataUrl: dataUrl });
    } catch (err) {
      setError(err instanceof ImageError ? err.message : 'Could not process that image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-950/40 p-4">
      <div className="flex items-center gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-ink-600 bg-ink-900 ${
            kind === 'photo' ? 'h-16 w-16 rounded-full' : 'h-16 w-24 rounded-lg'
          }`}
        >
          {preview ? (
            <img src={preview} alt="" className={kind === 'photo' ? 'h-full w-full object-cover' : 'max-h-12 max-w-20 object-contain'} />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-500">{kind}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-100">{label}</p>
          <p className="text-xs text-ink-400">
            {value.localDataUrl
              ? `Local copy · ${(dataUrlBytes(value.localDataUrl) / 1024).toFixed(0)} KB · stays on this device`
              : 'Optional · PNG, JPEG, WebP or GIF'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost px-2.5 py-1 text-xs" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? 'Processing…' : value.localDataUrl ? 'Replace' : 'Upload'}
            </button>
            {(value.localDataUrl || value.hostedUrl) && (
              <button type="button" className="btn btn-quiet py-1 text-xs" onClick={() => onChange({ hostedUrl: '', localDataUrl: '' })}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="sr-only"
            tabIndex={-1}
            aria-label={`Upload ${kind}`}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose-300" role="alert">{error}</p>}
      <Field
        className="mt-4"
        label="Hosted image URL (used in the exported signature)"
        type="url"
        inputMode="url"
        placeholder="https://cdn.example.com/me.jpg"
        value={value.hostedUrl}
        onChange={(hostedUrl) => onChange({ ...value, hostedUrl })}
        error={hostedError}
        hint={
          value.localDataUrl && !value.hostedUrl
            ? 'Uploaded images are only shown in this preview. Recipients need a public https:// URL — see Export.'
            : 'Upload it somewhere public (your website, a CDN, Google Sites…) and paste the direct link.'
        }
      />
    </div>
  );
}
