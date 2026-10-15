/**
 * Client for the dev server's GitHub hosting endpoints (see hosting-plugin.ts).
 * In a production build the endpoints don't exist and these calls report
 * "unavailable", so the app falls back to manual hosted URLs.
 */
import { PUBLIC_REPO_BASE } from './defaults';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Save the image into the repo and return the public URL it will have once pushed, or null if hosting is unavailable. */
export async function hostImage(dataUrl: string): Promise<string | null> {
  try {
    const res = await fetch('/__hosting/upload', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ dataUrl }) });
    if (!res.ok) return null;
    const { path } = (await res.json()) as { path: string };
    return `${PUBLIC_REPO_BASE}${path}`;
  } catch {
    return null;
  }
}

/** Number of hosted images not pushed yet, or null when hosting is unavailable. */
export async function pendingCount(): Promise<number | null> {
  try {
    const res = await fetch('/__hosting/status');
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
    return ((await res.json()) as { pending: number }).pending;
  } catch {
    return null;
  }
}

/** Commit and push hosted images. Resolves with the remaining pending count; throws with git's message on failure. */
export async function publishImages(): Promise<number> {
  const res = await fetch('/__hosting/publish', { method: 'POST', headers: JSON_HEADERS, body: '{}' });
  const body = (await res.json()) as { pending?: number; error?: string };
  if (!res.ok) throw new Error(body.error ?? 'Publishing failed');
  return body.pending ?? 0;
}

export function isRepoHosted(url: string): boolean {
  return url.startsWith(PUBLIC_REPO_BASE);
}
