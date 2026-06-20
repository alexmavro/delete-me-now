import JSZip from 'jszip';
import { buildEmlContent } from './email';
import { GeneratedEmail, Service, UserProfile } from '../types';
import { getBestEmail } from './contacts';

export interface BatchFailure {
  id: string;
  name: string;
  reason: string;
}

export interface BatchResult {
  ok: string[];
  failed: BatchFailure[];
}

export async function downloadBatchZip(
  services: Service[],
  profile: UserProfile,
  getEmail: (s: Service) => GeneratedEmail,
): Promise<BatchResult> {
  const zip = new JSZip();
  const date = new Date().toISOString().slice(0, 10);
  const ok: string[] = [];
  const failed: BatchFailure[] = [];
  const fromAddr = profile.email.trim();
  if (!fromAddr) throw new Error('Sender email not configured');

  for (const service of services) {
    try {
      const to = getBestEmail(service.contacts);
      if (!to) {
        failed.push({ id: service.id, name: service.name, reason: 'no recipient email' });
        continue;
      }
      const email = getEmail(service);
      const content = buildEmlContent(to, fromAddr, email);
      const safe = service.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      zip.file(`DELETE_${safe}.eml`, content);
      ok.push(service.id);
    } catch (err) {
      failed.push({
        id: service.id,
        name: service.name,
        reason: err instanceof Error ? err.message : 'unknown error',
      });
    }
  }

  if (ok.length === 0) {
    // Nothing to ship. Don't trigger an empty download.
    return { ok, failed };
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Erasure_Requests_${date}.zip`;
  a.click();
  // Defer revoke so the browser's save flow doesn't see the URL get pulled
  // out from under it on slower download paths.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return { ok, failed };
}
