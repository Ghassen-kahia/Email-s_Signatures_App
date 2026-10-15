import { useMemo, useState } from 'react';
import type { AppState, ExportOptions } from '../types';
import { copyRich, copyText, htmlToPlainText } from '../lib/clipboard';
import { checkCompatibility, type CheckLevel } from '../lib/compat';
import { downloadFile, slugify } from '../lib/download';
import { imageExportStatus, renderDocument } from '../lib/templates';
import { Callout, Section, Toggle } from './ui';

interface Props {
  state: AppState;
  exportHtml: string;
  blocked: boolean;
  onOptionsChange: (patch: Partial<ExportOptions>) => void;
  notify: (message: string, tone?: 'ok' | 'error') => void;
}

export function ExportPanel({ state, exportHtml, blocked, onOptionsChange, notify }: Props) {
  const [showSource, setShowSource] = useState(false);
  const checks = useMemo(() => checkCompatibility(exportHtml), [exportHtml]);
  const { omitted, embedded } = imageExportStatus(state);

  async function run(action: () => Promise<void> | void, success: string) {
    try {
      await action();
      notify(success);
    } catch (err) {
      notify(err instanceof Error ? `Couldn’t complete that: ${err.message}` : 'Something went wrong.', 'error');
    }
  }

  const copyRendered = () =>
    run(() => copyRich(exportHtml, htmlToPlainText(exportHtml)), 'Signature copied — paste it into your mail client’s signature editor.');
  const copySource = () => run(() => copyText(exportHtml), 'HTML source copied to clipboard.');
  const download = () =>
    run(() => {
      const name = state.profile.fullName.trim();
      downloadFile(`${slugify(name)}-signature.html`, renderDocument(exportHtml, name ? `${name} — email signature` : 'Email signature'));
    }, 'Signature downloaded as an HTML file.');

  return (
    <div className="space-y-5">
      <Section kicker="Export" title="Get your signature" description="All exports are generated on this device. Nothing is uploaded.">
        {blocked && (
          <div className="mb-4">
            <Callout tone="warn" title="Fix the highlighted fields first">
              Some profile fields are invalid. Invalid links and addresses are left out of the export, so correct them in the Profile tab before copying.
            </Callout>
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" className="btn btn-primary" onClick={copyRendered}>
            <CopyIcon /> Copy signature
          </button>
          <button type="button" className="btn btn-ghost" onClick={copySource}>
            <CodeIcon /> Copy HTML
          </button>
          <button type="button" className="btn btn-ghost" onClick={download}>
            <DownloadIcon /> Download .html
          </button>
        </div>
        <p className="mt-3 text-xs text-ink-400">
          <strong className="text-ink-200">Copy signature</strong> is the one you want for Gmail and Outlook — it copies the formatted result.
          Use <strong className="text-ink-200">Copy HTML</strong> for clients that accept raw HTML (Apple Mail, Thunderbird, signature managers).
        </p>

        <div className="mt-5 space-y-3">
          {omitted > 0 && (
            <Callout tone="warn" title={`${omitted} image${omitted > 1 ? 's' : ''} won’t appear for recipients`}>
              Uploaded images live only in this browser. Email recipients load signature images from the internet, so each image needs a public{' '}
              <code className="font-mono">https://</code> URL. In the Profile tab, press “Host on GitHub” (when running <code>npm run dev</code>) or paste a
              hosted link. Until then the image is left out of the export.
            </Callout>
          )}
          {embedded > 0 && (
            <Callout tone="warn" title="Embedded images are unreliable">
              Gmail strips embedded (base64) images and Outlook often turns them into attachments. They also inflate the signature past Gmail’s
              10,000-character limit. Prefer a hosted URL.
            </Callout>
          )}
          <Toggle
            label="Embed uploaded images in the export"
            description="Fallback for Apple Mail / Thunderbird only. Not recommended for Gmail or Outlook."
            checked={state.exportOptions.embedLocalImages}
            onChange={(embedLocalImages) => onOptionsChange({ embedLocalImages })}
          />
        </div>
      </Section>

      <Section kicker="Compatibility" title="Email client checks" description="Automatic checks against the rules Gmail and Outlook enforce. Always send yourself a test email too.">
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-lg border border-ink-700/60 bg-ink-950/40 px-3 py-2.5">
              <StatusDot level={c.level} />
              <div>
                <p className="text-sm text-ink-100">{c.title}</p>
                <p className="text-xs text-ink-400">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-ink-400">
              <tr>
                <th className="py-2 pr-3 font-medium">Client</th>
                <th className="py-2 pr-3 font-medium">Layout & links</th>
                <th className="py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/60 text-ink-200">
              {CLIENT_NOTES.map((row) => (
                <tr key={row.client}>
                  <td className="py-2 pr-3 whitespace-nowrap">{row.client}</td>
                  <td className="py-2 pr-3 text-emerald-300">Supported</td>
                  <td className="py-2 text-ink-400">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        kicker="Source"
        title="HTML source"
        actions={
          <button type="button" className="btn btn-quiet text-xs" onClick={() => setShowSource((v) => !v)} aria-expanded={showSource}>
            {showSource ? 'Hide' : 'Show'}
          </button>
        }
      >
        {showSource ? (
          <pre className="scrollbar-thin max-h-80 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all text-ink-200">
            {exportHtml}
          </pre>
        ) : (
          <p className="text-xs text-ink-400">Table-based, inline-styled HTML · {exportHtml.length.toLocaleString()} characters.</p>
        )}
      </Section>
    </div>
  );
}

const CLIENT_NOTES = [
  { client: 'Gmail (web, iOS, Android)', note: 'Hosted https images only; 10,000 char limit.' },
  { client: 'Outlook (new / web)', note: 'Rounded corners supported.' },
  { client: 'Outlook classic (Windows)', note: 'Square photo & button corners; layout intact.' },
  { client: 'Apple Mail (macOS, iOS)', note: 'Full support, including embedded images.' },
  { client: 'Thunderbird', note: 'Use “Use HTML” with the downloaded file.' },
];

function StatusDot({ level }: { level: CheckLevel }) {
  const map = {
    pass: { cls: 'bg-emerald-400/15 text-emerald-300', label: 'Pass', icon: '✓' },
    warn: { cls: 'bg-amber-400/15 text-amber-300', label: 'Warning', icon: '!' },
    fail: { cls: 'bg-rose-500/15 text-rose-300', label: 'Problem', icon: '✕' },
  }[level];
  return (
    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${map.cls}`} aria-label={map.label} role="img">
      {map.icon}
    </span>
  );
}

const iconProps = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
function CopyIcon() {
  return <svg {...iconProps}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;
}
function CodeIcon() {
  return <svg {...iconProps}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></svg>;
}
function DownloadIcon() {
  return <svg {...iconProps}><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" /></svg>;
}
