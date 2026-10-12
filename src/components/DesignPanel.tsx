import { useMemo } from 'react';
import type { AppState, Design, FontFamilyId, TemplateId } from '../types';
import { FONT_STACKS, TEMPLATE_META } from '../lib/defaults';
import { renderSignature } from '../lib/templates';
import { SignatureFrame } from './SignatureFrame';
import { ColorField, Range, Section, Segmented, Toggle } from './ui';

interface Props {
  state: AppState;
  onChange: (patch: Partial<Design>) => void;
}

const PALETTES: { name: string; primary: string; accent: string }[] = [
  { name: 'Navy / Cyan', primary: '#0b1630', accent: '#06b6d4' },
  { name: 'Ink / Indigo', primary: '#111827', accent: '#6366f1' },
  { name: 'Forest', primary: '#14532d', accent: '#16a34a' },
  { name: 'Ember', primary: '#1c1917', accent: '#ea580c' },
  { name: 'Plum / Rose', primary: '#4c1d95', accent: '#db2777' },
  { name: 'Graphite', primary: '#27272a', accent: '#71717a' },
];

export function DesignPanel({ state, onChange }: Props) {
  const d = state.design;

  const thumbs = useMemo(
    () =>
      (Object.keys(TEMPLATE_META) as TemplateId[]).map((id) => ({
        id,
        html: renderSignature({ ...state, design: { ...d, ...TEMPLATE_META[id].preset, template: id } }, 'preview'),
      })),
    // Thumbnails only need to refresh when the content changes, not on every design tweak.
    [state.profile],
  );

  return (
    <div className="space-y-5">
      <Section kicker="Template" title="Choose a starting point" description="Picking a template applies its colour preset — fine-tune everything below.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {thumbs.map(({ id, html }) => {
            const meta = TEMPLATE_META[id];
            const active = d.template === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ template: id, ...meta.preset })}
                className={`group overflow-hidden rounded-xl border text-left transition ${
                  active ? 'border-signal-400 ring-2 ring-signal-400/30' : 'border-ink-700 hover:border-ink-500'
                }`}
              >
                <div className="h-28 overflow-hidden bg-white">
                  <SignatureFrame html={html} title={`${meta.name} template preview`} scale={0.5} width={560} padding={16} />
                </div>
                <div className="flex items-center justify-between gap-2 bg-ink-900 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">{meta.name}</p>
                    <p className="text-[11px] text-ink-400">{meta.blurb}</p>
                  </div>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${active ? 'bg-signal-400 shadow-[0_0_10px] shadow-signal-400' : 'bg-ink-700'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section kicker="Colour" title="Palette">
        <div className="mb-4 flex flex-wrap gap-2">
          {PALETTES.map((pal) => (
            <button
              key={pal.name}
              type="button"
              title={pal.name}
              aria-label={`Apply ${pal.name} palette`}
              onClick={() => onChange({ primaryColor: pal.primary, accentColor: pal.accent })}
              className="flex h-8 overflow-hidden rounded-lg border border-ink-700 transition hover:border-ink-400"
            >
              <span className="w-6" style={{ background: pal.primary }} />
              <span className="w-6" style={{ background: pal.accent }} />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Primary" value={d.primaryColor} onChange={(primaryColor) => onChange({ primaryColor })} />
          <ColorField label="Accent" value={d.accentColor} onChange={(accentColor) => onChange({ accentColor })} />
          <ColorField label="Body text" value={d.textColor} onChange={(textColor) => onChange({ textColor })} />
          <ColorField label="Muted text" value={d.mutedColor} onChange={(mutedColor) => onChange({ mutedColor })} />
        </div>
      </Section>

      <Section kicker="Typography & layout" title="Type, spacing and structure" description="Only email-safe system fonts are offered — web fonts fall back unpredictably in Outlook and Gmail.">
        <div className="grid gap-5">
          <div>
            <label htmlFor="font-family" className="label">Font family</label>
            <select
              id="font-family"
              className="input"
              value={d.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value as FontFamilyId })}
            >
              {(Object.keys(FONT_STACKS) as FontFamilyId[]).map((id) => (
                <option key={id} value={id} style={{ fontFamily: FONT_STACKS[id].stack }}>
                  {FONT_STACKS[id].label}
                </option>
              ))}
            </select>
          </div>
          <Range label="Base font size" value={d.fontSize} min={11} max={16} onChange={(fontSize) => onChange({ fontSize })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Segmented
              label="Spacing"
              value={d.spacing}
              onChange={(spacing) => onChange({ spacing })}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'normal', label: 'Normal' },
                { value: 'relaxed', label: 'Relaxed' },
              ]}
            />
            <Segmented
              label="Alignment"
              value={d.alignment}
              onChange={(alignment) => onChange({ alignment })}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
              ]}
            />
          </div>
          <Segmented
            label="Separator"
            value={d.separator}
            onChange={(separator) => onChange({ separator })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'line', label: 'Line' },
              { value: 'bar', label: 'Bar' },
              { value: 'dot', label: 'Dots' },
            ]}
          />
          <Range label="Photo size" value={d.photoSize} min={48} max={120} step={4} onChange={(photoSize) => onChange({ photoSize })} />
          <div className="space-y-4 border-t border-ink-700/60 pt-4">
            <Toggle label="Round photo" description="Outlook for Windows ignores rounding and shows a square." checked={d.photoRounded} onChange={(photoRounded) => onChange({ photoRounded })} />
            <Toggle label="Contact labels" description="Prefix email, phone and website with a short label." checked={d.showLinkLabels} onChange={(showLinkLabels) => onChange({ showLinkLabels })} />
          </div>
        </div>
      </Section>
    </div>
  );
}
