import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';

// Tell React this is a test environment so act() works without warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render() {
  act(() => root.render(<App />));
}

function button(text: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  if (!found) throw new Error(`No button "${text}"`);
  return found;
}

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function previewSrc(): string {
  return container.querySelector<HTMLIFrameElement>('iframe[title="Signature preview"]')!.getAttribute('srcdoc') ?? '';
}

describe('App', () => {
  it('renders the editor and a live preview of the sample profile', () => {
    render();
    expect(container.textContent).toContain('Signature Studio');
    expect(previewSrc()).toContain('Ada Moreau');
  });

  it('updates the preview live and shows validation errors', () => {
    render();
    const name = container.querySelector<HTMLInputElement>('input[autocomplete="name"]')!;
    typeInto(name, 'Grace Hopper');
    expect(previewSrc()).toContain('Grace Hopper');

    const email = container.querySelector<HTMLInputElement>('input[type="email"]')!;
    typeInto(email, 'not-an-email');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(container.textContent).toContain('valid email address');
    expect(previewSrc()).not.toContain('mailto:not-an-email');
  });

  it('switches templates from the Design tab', () => {
    render();
    act(() => button('Design').click());
    const creative = Array.from(container.querySelectorAll('button[aria-pressed]')).find((b) => b.textContent?.includes('Creative'))!;
    act(() => (creative as HTMLButtonElement).click());
    expect(creative.getAttribute('aria-pressed')).toBe('true');
    expect(previewSrc()).toContain('text-transform:uppercase');
  });

  it('shows export actions, compatibility checks and install guides', () => {
    render();
    act(() => button('Export & install').click());
    expect(container.textContent).toContain('Copy HTML');
    expect(container.textContent).toContain('Download .html');
    expect(container.textContent).toContain('Inline CSS only');
    act(() => button('Outlook classic').click());
    expect(container.textContent).toContain('File → Options → Mail → Signatures');
  });

  it('persists changes to localStorage only', async () => {
    render();
    const title = container.querySelector<HTMLInputElement>('input[autocomplete="organization-title"]')!;
    typeInto(title, 'Rear Admiral');
    await act(() => new Promise((r) => setTimeout(r, 400)));
    expect(localStorage.getItem('signature-studio:v1')).toContain('Rear Admiral');
  });
});
