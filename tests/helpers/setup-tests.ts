import { installDiagramPlatform } from './diagram-platform';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

if (typeof document !== 'undefined') {
  installDiagramPlatform();
  // jsdom replaces typed arrays while Node's TextEncoder returns a different realm's
  // Uint8Array. fflate uses instanceof; align the platform boundary, not archive code.
  globalThis.TextEncoder = class extends TextEncoder {
    override encode(input?: string) {
      return new Uint8Array(super.encode(input));
    }
  };
}

afterEach(() => {
  if (typeof document !== 'undefined') {
    cleanup();
    localStorage.clear();
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
