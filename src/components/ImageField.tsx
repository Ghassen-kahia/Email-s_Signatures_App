import { useEffect, useRef, useState } from 'react';
import type { FieldErrors, ImageAsset } from '../types';
import { hostImage, isRepoHosted } from '../lib/hosting';
import { ACCEPTED_IMAGE_TYPES, ImageError, dataUrlBytes, processImage } from '../lib/image';
import { isHttpsUrl, toDirectImageUrl } from '../lib/sanitize';
import { newImageId } from '../lib/storage';
import { Field } from './ui';

interface Props {
  label: string;
  kind: 'photo' | 'logo';
  items: ImageAsset[];
  onChange: (items: ImageAsset[]) => void;
  /** Photos only: index of the one shown in the signature. */
  active?: number;
  onActiveChange?: (index: number) => void;
  errors: FieldErrors;
  /** True when the dev server can save images into the GitHub repo. */
  canHost: boolean;
  /** Called after an image was saved into the repo, so the publish count can refresh. */
  onHosted: () => void;
  /** Bumped after publishing so link checks run again. */
  checkVersion: number;
}

export function ImageField({ label, kind, items, onChange, active = 0, onActiveChange, errors, canHost, onHosted, checkVersion }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function process(file: File): Promise<string> {
    // Photos are cropped square; 2x the max display size keeps them sharp.
    return kind === 'photo' ? processImage(file, 280, true) : processImage(file, 360);
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    setBusy(true);
    const added: ImageAsset[] = [];
    try {
      for (const file of Array.from(files)) {
        const localDataUrl = await process(file);
        const hostedUrl = canHost ? ((await hostImage(localDataUrl)) ?? '') : '';
        added.push({ id: newImageId(), localDataUrl, hostedUrl });
      }
    } catch (err) {
      setError(err instanceof ImageError ? err.message : 'Could not process that image.');
    } finally {
      if (added.length) {
        onChange([...items, ...added]);
        if (kind === 'photo' && onActiveChange) onActiveChange(items.length + added.length - 1);
        if (added.some((a) => a.hostedUrl)) onHosted();
      }
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const update = (id: string, patch: Partial<ImageAsset>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    // Keep the same photo selected; if it was the one removed, fall back to its neighbour.
    if (onActiveChange) onActiveChange(index < active ? active - 1 : Math.max(0, Math.min(active, items.length - 2)));
  };

  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink-100">{label}</p>
          <p className="text-xs text-ink-400">
            {kind === 'photo'
              ? 'Add several and pick the one to show.'
              : 'Add several — they’re shown side by side.'}{' '}
            PNG, JPEG, WebP or GIF.
          </p>
        </div>
        <button type="button" className="btn btn-ghost px-2.5 py-1 text-xs" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'Processing…' : `+ Add ${kind}`}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-label={`Upload ${kind}`}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-rose-300" role="alert">{error}</p>}

      {items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {items.map((item, index) => (
            <ImageItem
              key={item.id}
              kind={kind}
              item={item}
              selected={kind === 'photo' && index === active}
              onSelect={kind === 'photo' && onActiveChange ? () => onActiveChange(index) : undefined}
              onUpdate={(patch) => update(item.id, patch)}
              onRemove={() => remove(index)}
              error={errors[`image.${item.id}`]}
              canHost={canHost}
              onHosted={onHosted}
              checkVersion={checkVersion}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ImageItem({ kind, item, selected, onSelect, onUpdate, onRemove, error, canHost, onHosted, checkVersion }: {
  kind: 'photo' | 'logo';
  item: ImageAsset;
  selected: boolean;
  onSelect?: () => void;
  onUpdate: (patch: Partial<ImageAsset>) => void;
  onRemove: () => void;
  error?: string;
  canHost: boolean;
  onHosted: () => void;
  checkVersion: number;
}) {
  const [converted, setConverted] = useState(false);
  const [hosting, setHosting] = useState(false);
  const [showUrl, setShowUrl] = useState(!item.localDataUrl);
  const repoHosted = isRepoHosted(item.hostedUrl);
  const check = useHostedImageCheck(error ? '' : item.hostedUrl, checkVersion, repoHosted);
  const preview = check.status === 'ok' ? item.hostedUrl : item.localDataUrl || item.hostedUrl;

  function handleUrl(raw: string) {
    const direct = toDirectImageUrl(raw);
    setConverted(direct !== raw);
    onUpdate({ hostedUrl: direct });
  }

  async function hostNow() {
    setHosting(true);
    const url = await hostImage(item.localDataUrl);
    setHosting(false);
    if (url) {
      onUpdate({ hostedUrl: url });
      onHosted();
    }
  }

  let status: { tone: 'ok' | 'warn' | 'muted'; text: string };
  if (check.status === 'ok') status = { tone: 'ok', text: `✓ Public — recipients will see it (${check.width}×${check.height})${converted ? ', share link converted' : ''}` };
  else if (check.status === 'checking') status = { tone: 'muted', text: 'Checking the link…' };
  else if (repoHosted) status = { tone: 'warn', text: 'Saved in your repo. Not public yet: press “Publish to GitHub” below. After publishing, GitHub can take about 5 minutes to serve new files; this rechecks automatically.' };
  else if (check.status === 'broken') status = { tone: 'warn', text: BROKEN_HINT };
  else if (item.localDataUrl) status = { tone: 'warn', text: 'Only on this device — recipients won’t see it yet.' };
  else status = { tone: 'muted', text: 'Paste a public image link below.' };

  return (
    <li className={`rounded-lg border p-3 ${selected ? 'border-signal-400/70 bg-signal-400/5' : 'border-ink-700/60'}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSelect}
          disabled={!onSelect}
          aria-pressed={onSelect ? selected : undefined}
          aria-label={onSelect ? 'Use this photo' : undefined}
          className={`flex shrink-0 items-center justify-center overflow-hidden border bg-ink-900 ${
            kind === 'photo' ? 'h-14 w-14 rounded-full' : 'h-14 w-24 rounded-lg bg-white'
          } ${selected ? 'border-signal-400 ring-2 ring-signal-400/40' : 'border-ink-600'} ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {preview ? (
            <img src={preview} alt="" className={kind === 'photo' ? 'h-full w-full object-cover' : 'max-h-11 max-w-20 object-contain'} />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-500">{kind}</span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          {kind === 'photo' && (
            <p className="text-xs font-medium text-ink-200">{selected ? 'Shown in signature' : <button type="button" className="text-signal-300 hover:underline" onClick={onSelect}>Use this photo</button>}</p>
          )}
          <p className={`text-xs ${status.tone === 'ok' ? 'text-emerald-300' : status.tone === 'warn' ? 'text-amber-300' : 'text-ink-400'}`}>{status.text}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {canHost && item.localDataUrl && !item.hostedUrl && (
              <button type="button" className="btn btn-ghost px-2.5 py-1 text-xs" onClick={hostNow} disabled={hosting}>
                {hosting ? 'Saving…' : 'Host on GitHub'}
              </button>
            )}
            <button type="button" className="btn btn-quiet py-1 text-xs" onClick={() => setShowUrl((v) => !v)} aria-expanded={showUrl}>
              {showUrl ? 'Hide link' : 'Edit link'}
            </button>
            <button type="button" className="btn btn-quiet py-1 text-xs" onClick={onRemove}>
              Remove
            </button>
            {item.localDataUrl && <span className="self-center text-[11px] text-ink-500">{(dataUrlBytes(item.localDataUrl) / 1024).toFixed(0)} KB</span>}
          </div>
        </div>
      </div>
      {(showUrl || error) && (
        <>
          <Field
            className="mt-3"
            label="Hosted image URL (used in the exported signature)"
            type="url"
            inputMode="url"
            placeholder="https://… or a Google Drive / Dropbox / GitHub share link"
            value={item.hostedUrl}
            onChange={handleUrl}
            error={error}
          />
          {!canHost && check.status !== 'ok' && <HostingTips />}
        </>
      )}
    </li>
  );
}

function HostingTips() {
  return (
    <details className="mt-3 text-xs text-ink-400">
      <summary className="cursor-pointer text-ink-300 hover:text-ink-100">Where can I host it for free?</summary>
      <ul className="mt-2 list-disc space-y-1.5 pl-4">
        <li>
          <strong className="text-ink-200">Run the app with <code>npm run dev</code></strong>: uploads are saved into your GitHub repo and published with one click.
        </li>
        <li>
          <strong className="text-ink-200">Google Drive:</strong> Share → General access → “Anyone with the link”, then paste the link here. It’s converted to a
          direct image link automatically.
        </li>
        <li>
          <strong className="text-ink-200">GitHub or your own website:</strong> paste the github.com link or any direct .jpg / .png link.
        </li>
      </ul>
    </details>
  );
}

const BROKEN_HINT = 'This link doesn’t load as an image. Make sure it’s shared publicly and points to the image itself, not a web page.';

type HostedCheck = { status: 'idle' | 'checking' | 'broken' } | { status: 'ok'; width: number; height: number };

/** Load the hosted URL the way a recipient's mail app would, to catch private or non-image links early. */
function useHostedImageCheck(url: string, version: number, keepRetrying: boolean): HostedCheck {
  const [check, setCheck] = useState<HostedCheck>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);

  // Freshly published repo files 404 until GitHub's cache refreshes, so poll for ~10 minutes.
  useEffect(() => {
    if (!keepRetrying || check.status !== 'broken' || attempt >= 20) return;
    const timer = setTimeout(() => setAttempt((a) => a + 1), 30_000);
    return () => clearTimeout(timer);
  }, [keepRetrying, check.status, attempt]);

  useEffect(() => {
    const src = url.trim();
    if (!isHttpsUrl(src)) {
      setCheck({ status: 'idle' });
      return;
    }
    setCheck({ status: 'checking' });
    let cancelled = false;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => !cancelled && setCheck({ status: 'ok', width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => !cancelled && setCheck({ status: 'broken' });
    // Debounce so typing a URL doesn't fire a request per keystroke; the version
    // query defeats the browser's cached 404 after publishing.
    const bust = version || attempt ? `${src.includes('?') ? '&' : '?'}v=${version}-${attempt}` : '';
    const timer = setTimeout(() => (img.src = src + bust), 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      img.src = '';
    };
  }, [url, version, attempt]);
  return check;
}
