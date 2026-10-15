import type { AppState, ImageAsset } from '../types';
import { DEFAULT_STATE } from './defaults';

const STORAGE_KEY = 'signature-studio:v1';

type SavedImage = Partial<ImageAsset> | undefined;

/** Accepts the current list format and the single `photo` / `logo` object older versions saved. */
function imageList(list: unknown, legacy: SavedImage): ImageAsset[] {
  const items = Array.isArray(list) ? (list as SavedImage[]) : legacy ? [legacy] : [];
  return items
    .filter((i): i is Partial<ImageAsset> => !!i && typeof i === 'object')
    .map((i) => ({ id: i.id || newImageId(), hostedUrl: i.hostedUrl ?? '', localDataUrl: i.localDataUrl ?? '' }))
    .filter((i) => i.hostedUrl || i.localDataUrl);
}

export function newImageId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Merge saved data over defaults so fields added in later versions never break old saves. */
export function mergeState(saved: Partial<AppState>): AppState {
  const p = (saved.profile ?? {}) as Partial<AppState['profile']> & { photo?: SavedImage; logo?: SavedImage };
  const { photo, logo, ...rest } = p;
  const photos = imageList(p.photos, photo);
  return {
    profile: {
      ...DEFAULT_STATE.profile,
      ...rest,
      photos,
      activePhoto: Math.min(Math.max(0, Number(p.activePhoto) || 0), Math.max(0, photos.length - 1)),
      logos: imageList(p.logos, logo),
    },
    design: { ...DEFAULT_STATE.design, ...(saved.design ?? {}) },
    exportOptions: { ...DEFAULT_STATE.exportOptions, ...(saved.exportOptions ?? {}) },
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
    return mergeState(parsed as Partial<AppState>);
  } catch {
    return DEFAULT_STATE;
  }
}

export type SaveResult = 'saved' | 'quota' | 'unavailable';

/** Persist to this browser only. Nothing ever leaves the device. */
export function saveState(state: AppState): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return 'saved';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      // Uploaded images are the usual culprit — retry without them so text settings still persist.
      try {
        const lite: AppState = {
          ...state,
          profile: {
            ...state.profile,
            photos: state.profile.photos.map((i) => ({ ...i, localDataUrl: '' })),
            logos: state.profile.logos.map((i) => ({ ...i, localDataUrl: '' })),
          },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lite));
      } catch {
        /* ignore */
      }
      return 'quota';
    }
    return 'unavailable';
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
