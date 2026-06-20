import { useEffect, useState } from 'react';

// Live tally of outbound network requests since page load. Patches fetch,
// XHR, and sendBeacon once at module load. Module-level state means multiple
// Footer mounts share the same counter; re-patching would capture the
// already-patched version as "original" and double-count every request.

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
