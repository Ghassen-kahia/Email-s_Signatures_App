/**
 * Clipboard helpers. "Rich" copy puts text/html on the clipboard so pasting into
 * Gmail / Outlook signature editors keeps formatting and links.
 */

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  legacyCopy((el) => {
    el.textContent = text;
    el.style.whiteSpace = 'pre';
  });
}

export async function copyRich(html: string, plain: string): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write && window.isSecureContext) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
      return;
    } catch {
      /* fall through to selection-based copy */
    }
  }
  legacyCopy((el) => {
    el.innerHTML = html;
  });
}

/** Selection + execCommand fallback for browsers without the async Clipboard API. */
function legacyCopy(fill: (el: HTMLDivElement) => void): void {
  const el = document.createElement('div');
  el.setAttribute('contenteditable', 'true');
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  el.style.top = '0';
  el.style.background = '#ffffff';
  fill(el);
  document.body.appendChild(el);
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  const ok = document.execCommand('copy');
  sel?.removeAllRanges();
  el.remove();
  if (!ok) throw new Error('Copy command was rejected by the browser.');
}

/** Plain-text version of the signature for the text/plain clipboard flavour. */
export function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lines: string[] = [];
  doc.querySelectorAll('td').forEach((cell) => {
    if (cell.querySelector('td')) return; // leaf cells only
    const text = (cell.textContent ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    if (text) lines.push(text);
  });
  return lines.join('\n');
}
