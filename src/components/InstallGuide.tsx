import { useState, type ReactNode } from 'react';
import { Callout, Section } from './ui';

type ClientId = 'gmail' | 'outlook-new' | 'outlook-classic' | 'apple';

const GUIDES: Record<ClientId, { name: string; steps: ReactNode[]; note?: ReactNode }> = {
  gmail: {
    name: 'Gmail',
    steps: [
      <>Click <b>Copy signature</b> in the Export panel.</>,
      <>In Gmail on the web, open <b>Settings (gear) → See all settings</b>.</>,
      <>On the <b>General</b> tab, scroll to <b>Signature</b> and click <b>Create new</b>. Give it a name.</>,
      <>Click into the editor box and paste with <kbd>Ctrl</kbd>+<kbd>V</kbd>.</>,
      <>Under <b>Signature defaults</b>, choose it for new emails and replies.</>,
      <>Scroll to the bottom and click <b>Save Changes</b>.</>,
    ],
    note: <>Gmail mobile apps use the web signature only if you haven’t set a separate mobile signature. Gmail requires hosted <code>https://</code> images and rejects signatures over 10,000 characters.</>,
  },
  'outlook-new': {
    name: 'Outlook (new / web)',
    steps: [
      <>Click <b>Copy signature</b>.</>,
      <>In Outlook on the web or the new Outlook for Windows, open <b>Settings → Account → Signatures</b>.</>,
      <>Click <b>+ New signature</b> and give it a name.</>,
      <>Paste into the editor with <kbd>Ctrl</kbd>+<kbd>V</kbd>.</>,
      <>Choose it as the default for new messages and replies/forwards, then click <b>Save</b>.</>,
    ],
  },
  'outlook-classic': {
    name: 'Outlook classic',
    steps: [
      <>Click <b>Copy signature</b>.</>,
      <>In Outlook for Windows (classic), go to <b>File → Options → Mail → Signatures…</b></>,
      <>Click <b>New</b>, name the signature, and paste into the <b>Edit signature</b> box.</>,
      <>Set <b>New messages</b> and <b>Replies/forwards</b> on the right, then click <b>OK</b>.</>,
    ],
    note: <>Alternative: open the downloaded <code>.html</code> file in a browser, press <kbd>Ctrl</kbd>+<kbd>A</kbd> then <kbd>Ctrl</kbd>+<kbd>C</kbd>, and paste. Classic Outlook draws square corners on photos and buttons — that’s expected.</>,
  },
  apple: {
    name: 'Apple Mail',
    steps: [
      <>In Mail, open <b>Settings → Signatures</b>, select the account and click <b>+</b>.</>,
      <>Untick <b>Always match my default message font</b>.</>,
      <>Open the downloaded <code>.html</code> file in Safari, select all, copy, and paste into the signature box.</>,
    ],
  },
};

export function InstallGuide() {
  const [client, setClient] = useState<ClientId>('gmail');
  const guide = GUIDES[client];

  return (
    <Section kicker="Install" title="Add it to your mail client">
      <div role="tablist" aria-label="Mail client" className="mb-5 flex flex-wrap gap-1.5">
        {(Object.keys(GUIDES) as ClientId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={client === id}
            onClick={() => setClient(id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              client === id ? 'border-signal-500/60 bg-signal-500/10 text-signal-300' : 'border-ink-700 text-ink-300 hover:text-ink-100'
            }`}
          >
            {GUIDES[id].name}
          </button>
        ))}
      </div>
      <ol className="space-y-3" role="tabpanel">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-ink-200 [&_kbd]:rounded [&_kbd]:border [&_kbd]:border-ink-600 [&_kbd]:bg-ink-800 [&_kbd]:px-1.5 [&_kbd]:font-mono [&_kbd]:text-[11px] [&_code]:font-mono [&_code]:text-signal-300">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-600 font-mono text-[11px] text-signal-300">{i + 1}</span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      {guide.note && (
        <div className="mt-5 [&_code]:font-mono [&_kbd]:font-mono">
          <Callout>{guide.note}</Callout>
        </div>
      )}
      <div className="mt-4">
        <Callout tone="ok" title="Test before you rely on it">
          Send an email to yourself and to an account on a different provider (e.g. Gmail → Outlook.com), then open it on your phone. Check that
          images load and every link opens the right page.
        </Callout>
      </div>
    </Section>
  );
}
