import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState, Design, ExportOptions, Profile } from '../types';
import { DEFAULT_STATE, EMPTY_PROFILE } from '../lib/defaults';
import { clearState, loadState, saveState, type SaveResult } from '../lib/storage';

/** App state with debounced, local-only persistence. */
export function useSignatureState() {
  const [state, setState] = useState<AppState>(loadState);
  const [saveStatus, setSaveStatus] = useState<SaveResult | 'pending'>('saved');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveStatus('pending');
    const t = setTimeout(() => setSaveStatus(saveState(state)), 350);
    return () => clearTimeout(t);
  }, [state]);

  const updateProfile = useCallback((patch: Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })), []);
  const updateDesign = useCallback((patch: Partial<Design>) => setState((s) => ({ ...s, design: { ...s.design, ...patch } })), []);
  const updateExport = useCallback(
    (patch: Partial<ExportOptions>) => setState((s) => ({ ...s, exportOptions: { ...s.exportOptions, ...patch } })),
    [],
  );
  const loadSample = useCallback(() => setState((s) => ({ ...s, profile: DEFAULT_STATE.profile })), []);
  const clearAll = useCallback(() => {
    clearState();
    setState({ ...DEFAULT_STATE, profile: EMPTY_PROFILE });
  }, []);

  return { state, saveStatus, updateProfile, updateDesign, updateExport, loadSample, clearAll };
}
