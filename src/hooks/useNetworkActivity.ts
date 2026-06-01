import { useEffect, useState } from 'react';

// Live tally of network requests made by the app since page load.
// Wraps `fetch`, `XMLHttpRequest`, and `navigator.sendBeacon` once at module
// load. Multiple Footer mounts (StrictMode dev double-invoke, future-proofing)
// share the same wrappers and counter — re-patching captures the patched
// version as "original" and creates an infinite double-count chain.
//
// In practice the counter should stay at 0 for the entire session, because we
// self-host fonts, icons, and the dataset; the tool makes ZERO runtime
// requests once the initial bundle is loaded. The whole point of surfacing
// this is that a privacy-skeptical user can verify it — both here in the
// footer and in their own DevTools Network tab.

interface NetworkCounts {
  outbound: number;
  trackingStartedAt: number;
}

const trackingStartedAt = Date.now();
const subscribers = new Set<(n: number) => void>();
let outbound = 0;

const bump = () => {
  outbound += 1;
  for (const s of subscribers) s(outbound);
};

// Patch globals once at module load. Idempotent — won't re-wrap on HMR.
let patched = false;
function ensurePatched() {
  if (patched || typeof window === 'undefined') return;
  patched = true;

  const originalFetch = window.fetch;
  window.fetch = function patchedFetch(...args: Parameters<typeof fetch>) {
    bump();
    return originalFetch.apply(this, args);
  };

  const OriginalXHR = window.XMLHttpRequest;
  class PatchedXHR extends OriginalXHR {
    open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
      bump();
      if (async === undefined) {
        return (OriginalXHR.prototype.open as (m: string, u: string | URL) => void).call(this, method, url);
      }
      return OriginalXHR.prototype.open.call(this, method, url, async, username ?? null, password ?? null);
    }
  }
  window.XMLHttpRequest = PatchedXHR as unknown as typeof XMLHttpRequest;

  const originalSendBeacon = navigator.sendBeacon?.bind(navigator);
  if (originalSendBeacon) {
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null) => {
      bump();
      return originalSendBeacon(url, data);
    };
  }
}

ensurePatched();

export function useNetworkActivity(): NetworkCounts {
  const [count, setCount] = useState(outbound);

  useEffect(() => {
    subscribers.add(setCount);
    return () => {
      subscribers.delete(setCount);
    };
  }, []);

  return { outbound: count, trackingStartedAt };
}
