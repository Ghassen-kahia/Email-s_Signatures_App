import type { AppState } from '../types';
import { DEFAULT_STATE } from './defaults';

const STORAGE_KEY = 'signature-studio:v1';

/** Merge saved data over defaults so fields added in later versions never break old saves. */
export function mergeState(saved: Partial<AppState>): AppState {
  const p = saved.profile ?? ({} as Partial<AppState['profile']>);
  return {
    profile: {
      ...DEFAULT_STATE.profile,
      ...p,
      photo: { ...DEFAULT_STATE.profile.photo, ...(p.photo ?? {}) },
      logo: { ...DEFAULT_STATE.profile.logo, ...(p.logo ?? {}) },
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
            photo: { ...state.profile.photo, localDataUrl: '' },
            logo: { ...state.profile.logo, localDataUrl: '' },
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
