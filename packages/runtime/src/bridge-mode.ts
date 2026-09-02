import { isBrowser, isWorker } from './env';

export type BridgeMode = 'worker' | 'client' | 'auto';

export type ResolvedBridgeMode = 'worker' | 'client';

export function resolveBridgeMode(
  mode: BridgeMode = 'auto'
): ResolvedBridgeMode {
  if (mode === 'worker' || mode === 'client') {
    return mode;
  }

  if (isBrowser() && !isWorker()) {
    return 'worker';
  }

  return 'client';
}
