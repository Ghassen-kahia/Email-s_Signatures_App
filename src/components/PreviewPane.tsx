import { useState } from 'react';
import { SignatureFrame } from './SignatureFrame';

type Device = 'desktop' | 'mobile';

interface Props {
  previewHtml: string;
  exportHtml: string;
  senderName: string;
  senderEmail: string;
}

export function PreviewPane({ previewHtml, exportHtml, senderName, senderEmail }: Props) {
  const [device, setDevice] = useState<Device>('desktop');
  const [recipientView, setRecipientView] = useState(false);
  const html = recipientView ? exportHtml : previewHtml;

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal-400" />
          </span>
          <span className="kicker">Live preview</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={recipientView}
            onClick={() => setRecipientView((v) => !v)}
            title="Render exactly what will be exported — local-only images are hidden"
            className={`rounded-md border px-2.5 py-1 text-xs transition ${
              recipientView ? 'border-signal-500/60 bg-signal-500/10 text-signal-300' : 'border-ink-700 text-ink-300 hover:text-ink-100'
            }`}
          >
            Recipient view
          </button>
          <div role="radiogroup" aria-label="Preview device" className="flex rounded-md border border-ink-700 p-0.5">
            {(['desktop', 'mobile'] as Device[]).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={device === d}
                onClick={() => setDevice(d)}
                className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs capitalize transition ${
                  device === d ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-100'
                }`}
              >
                {d === 'desktop' ? <DesktopIcon /> : <PhoneIcon />}
                <span className="hidden sm:inline">{d}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[linear-gradient(transparent_23px,rgb(36_55_102/0.25)_24px),linear-gradient(90deg,transparent_23px,rgb(36_55_102/0.25)_24px)] bg-[size:24px_24px] p-4 sm:p-6">
        <div
          className={`mx-auto overflow-hidden bg-white text-slate-800 shadow-2xl shadow-black/40 transition-all duration-300 ${
            device === 'mobile' ? 'max-w-[375px] rounded-[28px] border-[6px] border-ink-800' : 'max-w-full rounded-xl'
          }`}
        >
          <div className="border-b border-slate-200 px-5 py-3 text-[12px] leading-5 text-slate-500">
            <p className="truncate"><span className="text-slate-400">From</span> <span className="font-medium text-slate-700">{senderName || 'You'}</span> {senderEmail && <>&lt;{senderEmail}&gt;</>}</p>
            <p className="truncate"><span className="text-slate-400">Subject</span> <span className="text-slate-700">Quick follow-up</span></p>
          </div>
          <div className="px-5 pt-4 text-[14px] leading-6 text-slate-700" style={{ fontFamily: 'Arial, sans-serif' }}>
            <p>Hi Sam,</p>
            <p className="mt-2">Thanks for the chat earlier — notes attached. Talk soon.</p>
            <p className="mt-2">Best,</p>
          </div>
          <SignatureFrame html={html} title="Signature preview" minHeight={60} padding={20} />
        </div>
        {recipientView && (
          <p className="mx-auto mt-3 max-w-md text-center text-xs text-ink-300">
            Showing the exported HTML. Images uploaded locally without a hosted URL are omitted here — exactly as recipients would experience it.
          </p>
        )}
      </div>
    </div>
  );
}

function DesktopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}
