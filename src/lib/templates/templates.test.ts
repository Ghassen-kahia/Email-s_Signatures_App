import { describe, expect, it } from 'vitest';
import type { AppState, TemplateId } from '../../types';
import { checkCompatibility } from '../compat';
import { DEFAULT_STATE, SAMPLE_PROFILE, TEMPLATE_META } from '../defaults';
import { renderDocument, renderSignature } from './index';

const TEMPLATE_IDS = Object.keys(TEMPLATE_META) as TemplateId[];
const LOCAL_IMG = 'data:image/jpeg;base64,AAAA';

function stateFor(template: TemplateId, overrides: Partial<AppState['profile']> = {}): AppState {
  return {
    ...DEFAULT_STATE,
    profile: { ...SAMPLE_PROFILE, ...overrides },
    design: { ...DEFAULT_STATE.design, ...TEMPLATE_META[template].preset, template },
  };
}

function parse(html: string) {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe.each(TEMPLATE_IDS)('%s template', (id) => {
  const html = renderSignature(stateFor(id), 'export');
  const doc = parse(html);

  it('uses tables with inline styles only', () => {
    expect(doc.querySelector('table')).not.toBeNull();
    expect(html).not.toMatch(/<script|<style|<link|\sclass=|\son[a-z]+=/i);
    expect(html).not.toMatch(/display\s*:\s*(flex|grid)/i);
  });

  it('includes the profile content with working links', () => {
    expect(doc.body.textContent).toContain('Ada Moreau');
    const hrefs = Array.from(doc.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('mailto:ada.moreau@example.com');
    expect(hrefs).toContain('tel:+33612345678');
    expect(hrefs).toContain('https://www.linkedin.com/in/ada-moreau');
    expect(hrefs).toContain('https://github.com/adamoreau');
    expect(hrefs).toContain('https://example.com/meet');
    for (const href of hrefs) expect(href).toMatch(/^(https:|mailto:|tel:)/);
  });

  it('passes the compatibility checks', () => {
    const problems = checkCompatibility(html).filter((c) => c.level !== 'pass');
    expect(problems).toEqual([]);
  });

  it('renders in both alignments and with every separator', () => {
    for (const alignment of ['left', 'center'] as const) {
      for (const separator of ['none', 'line', 'bar', 'dot'] as const) {
        const s = stateFor(id);
        const out = renderSignature({ ...s, design: { ...s.design, alignment, separator } }, 'export');
        expect(parse(out).body.textContent).toContain('Ada Moreau');
      }
    }
  });
});

describe('layout', () => {
  it('never puts a narrow fixed width on a cell that shares a column with text', () => {
    // Regression: a 64px separator cell squeezed the Minimal template's text column.
    for (const id of TEMPLATE_IDS) {
      const doc = parse(renderSignature(stateFor(id), 'export'));
      for (const cell of Array.from(doc.querySelectorAll('td'))) {
        const w = /(?:^|;)width:(\d+)px/.exec(cell.getAttribute('style') ?? '');
        if (w && Number(w[1]) < 120) {
          const siblingsWithText = Array.from(cell.closest('table')!.rows).some((r) => r !== cell.parentElement && (r.textContent ?? '').trim().length > 20);
          expect(siblingsWithText, `${id}: narrow cell shares a table with text`).toBe(false);
        }
      }
    }
  });
});

describe('escaping', () => {
  it('neutralises markup in user input', () => {
    const html = renderSignature(stateFor('tech', { fullName: '<img src=x onerror=alert(1)>', jobTitle: '"><script>x</script>' }), 'export');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('drops invalid links instead of exporting them', () => {
    const html = renderSignature(stateFor('minimal', { website: 'javascript:alert(1)', email: 'bad' }), 'export');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('mailto:bad');
  });
});

describe('images', () => {
  const withLocal = (hostedUrl = '') => stateFor('tech', { photo: { hostedUrl, localDataUrl: LOCAL_IMG } });

  it('shows local uploads in preview but omits them from export', () => {
    expect(renderSignature(withLocal(), 'preview')).toContain(LOCAL_IMG);
    expect(renderSignature(withLocal(), 'export')).not.toContain('<img');
  });

  it('prefers the hosted https URL in export, with alt text and dimensions', () => {
    const html = renderSignature(withLocal('https://cdn.example.com/ada.jpg'), 'export');
    const img = parse(html).querySelector('img')!;
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/ada.jpg');
    expect(img.getAttribute('alt')).toContain('Ada Moreau');
    expect(img.getAttribute('width')).toBeTruthy();
    expect(html).not.toContain(LOCAL_IMG);
  });

  it('embeds local images only when explicitly opted in', () => {
    const s = withLocal();
    const html = renderSignature({ ...s, exportOptions: { embedLocalImages: true } }, 'export');
    expect(html).toContain(LOCAL_IMG);
    expect(checkCompatibility(html).some((c) => c.id === 'data-uri')).toBe(true);
  });
});

describe('renderDocument', () => {
  it('wraps the fragment in a standalone document', () => {
    const doc = renderDocument('<table></table>', 'Ada <Moreau>');
    expect(doc).toMatch(/^<!DOCTYPE html>/);
    expect(doc).toContain('<title>Ada Moreau</title>');
    expect(doc).toContain('<meta charset="utf-8">');
  });
});
