import { describe, expect, it } from 'vitest';
import { mergeState } from './storage';

describe('mergeState', () => {
  it('migrates the single photo/logo saved by older versions', () => {
    const state = mergeState({
      profile: { photo: { hostedUrl: '', localDataUrl: 'data:image/jpeg;base64,AA' }, logo: { hostedUrl: 'https://x.dev/l.png', localDataUrl: '' } },
    } as never);
    expect(state.profile.photos).toHaveLength(1);
    expect(state.profile.photos[0].localDataUrl).toBe('data:image/jpeg;base64,AA');
    expect(state.profile.logos[0].hostedUrl).toBe('https://x.dev/l.png');
    expect(state.profile.activePhoto).toBe(0);
    expect('photo' in state.profile).toBe(false);
  });

  it('drops empty legacy images and clamps the active photo', () => {
    const state = mergeState({ profile: { photo: { hostedUrl: '', localDataUrl: '' }, activePhoto: 5 } } as never);
    expect(state.profile.photos).toEqual([]);
    expect(state.profile.activePhoto).toBe(0);
  });
});
