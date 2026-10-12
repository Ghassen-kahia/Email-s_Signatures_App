import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DesignPanel } from './components/DesignPanel';
import { ExportPanel } from './components/ExportPanel';
import { InstallGuide } from './components/InstallGuide';
import { PreviewPane } from './components/PreviewPane';
import { PrivacyPanel } from './components/PrivacyPanel';
import { ProfileEditor } from './components/ProfileEditor';
import { useSignatureState } from './hooks/useSignatureState';
import { copyRich, htmlToPlainText } from './lib/clipboard';
import { renderSignature } from './lib/templates';
import { hasErrors, validateProfile } from './lib/validation';

type Tab = 'profile' | 'design' | 'export' | 'privacy';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'design', label: 'Design' },
  { id: 'export', label: 'Export & install' },
  { id: 'privacy', label: 'Privacy' },
];

interface Toast {
  id: number;
  message: string;
  tone: 'ok' | 'error';
}

export default function App() {
  const { state, saveStatus, updateProfile, updateDesign, updateExport, loadSample, clearAll } = useSignatureState();
  const [tab, setTab] = useState<Tab>('profile');
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const errors = useMemo(() => validateProfile(state.profile), [state.profile]);
  const blocked = hasErrors(errors);
  const previewHtml = useMemo(() => renderSignature(state, 'preview'), [state]);
  const exportHtml = useMemo(() => renderSignature(state, 'export'), [state]);
  const errorCount = Object.values(errors).filter(Boolean).length;

  const notify = useCallback((message: string, tone: 'ok' | 'error' = 'ok') => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const quickCopy = async () => {
    try {
      await copyRich(exportHtml, htmlToPlainText(exportHtml));
      notify(blocked ? 'Copied — but some fields are invalid and were left out.' : 'Signature copied — paste it into Gmail or Outlook.', blocked ? 'error' : 'ok');
    } catch {
      notify('Your browser blocked clipboard access. Try “Download .html” instead.', 'error');
    }
  };

  const storageWarning =
    saveStatus === 'quota'
      ? 'Browser storage is full, so uploaded images were not saved (your text and design were). They’ll need re-uploading after a reload.'
      : saveStatus === 'unavailable'
        ? 'This browser is blocking local storage (private mode?). Your changes won’t survive a reload.'
        : '';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">Signature Studio</h1>
              <p className="hidden text-[11px] text-ink-400 sm:block">Private, email-safe signature builder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator status={saveStatus} />
            <button type="button" onClick={quickCopy} className="btn btn-primary py-1.5 text-xs">
              Copy signature
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:py-8">
        <div className="order-2 min-w-0 lg:order-1">
          <nav aria-label="Editor sections" className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-ink-700/70 bg-ink-900/70 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`relative flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === t.id ? 'bg-ink-700 text-white shadow' : 'text-ink-300 hover:text-white'
                }`}
              >
                {t.label}
                {t.id === 'profile' && errorCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500/90 px-1 text-[10px] font-bold text-white">
                    {errorCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {tab === 'profile' && <ProfileEditor profile={state.profile} errors={errors} onChange={updateProfile} />}
          {tab === 'design' && <DesignPanel state={state} onChange={updateDesign} />}
          {tab === 'export' && (
            <div className="space-y-5">
              <ExportPanel state={state} exportHtml={exportHtml} blocked={blocked} onOptionsChange={updateExport} notify={notify} />
              <InstallGuide />
            </div>
          )}
          {tab === 'privacy' && (
            <PrivacyPanel
              storageWarning={storageWarning}
              onReset={() => {
                loadSample();
                notify('Sample profile loaded.');
              }}
              onClear={() => {
                clearAll();
                notify('All saved data erased from this browser.');
              }}
            />
          )}
        </div>

        <aside className="order-1 min-w-0 lg:order-2">
          <div className="space-y-4 lg:sticky lg:top-[84px]">
            <PreviewPane previewHtml={previewHtml} exportHtml={exportHtml} senderName={state.profile.fullName} senderEmail={state.profile.email} />
            {blocked ? (
              <button type="button" onClick={() => setTab('profile')} className="w-full rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-left text-xs text-rose-200 transition hover:bg-rose-500/10">
                {errorCount} field{errorCount > 1 ? 's need' : ' needs'} attention — invalid values are left out of the export. Review in Profile →
              </button>
            ) : (
              <p className="px-1 text-xs text-ink-400">
                Changes save automatically to this browser. When it looks right, head to{' '}
                <button type="button" className="text-signal-300 underline-offset-2 hover:underline" onClick={() => setTab('export')}>
                  Export & install
                </button>
                .
              </p>
            )}
          </div>
        </aside>
      </main>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/50 backdrop-blur ${
              toast.tone === 'ok' ? 'border-signal-500/40 bg-ink-850/95 text-ink-100' : 'border-rose-500/40 bg-ink-850/95 text-rose-100'
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${toast.tone === 'ok' ? 'bg-signal-400' : 'bg-rose-400'}`} />
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: string }) {
  const label = status === 'pending' ? 'Saving…' : status === 'saved' ? 'Saved locally' : status === 'quota' ? 'Saved (without images)' : 'Not saved';
  const color = status === 'saved' ? 'bg-emerald-400' : status === 'pending' ? 'bg-ink-400' : 'bg-amber-400';
  return (
    <span className="hidden items-center gap-2 text-xs text-ink-300 sm:flex" aria-live="polite">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
