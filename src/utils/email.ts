import { GeneratedEmail } from '../types';

export function buildMailtoUrl(to: string, email: GeneratedEmail): string {
  // Use encodeURIComponent (not URLSearchParams): mailto spec requires %20 for
  // space; URLSearchParams encodes space as '+' which some clients render literally.
  const subject = encodeURIComponent(email.subject);
  const body = encodeURIComponent(email.body);
  return `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
}

export function buildGmailUrl(to: string, email: GeneratedEmail): string {
  return (
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(to)}` +
    `&su=${encodeURIComponent(email.subject)}` +
    `&body=${encodeURIComponent(email.body)}`
  );
}

// Strip CR/LF + Unicode line separators + vertical-tab + form-feed + NUL
// from any string that lands in an RFC-822-style header. Profile fields
// flow into Subject + .eml To/From; without this a CRLF in a name field
// would let an attacker inject extra headers (BCC, Reply-To). Used at
// header build time AND at profile-save time as belt-and-suspenders.
export function sanitizeHeader(v: string): string {
  return v.replace(/[\r\n\u2028\u2029\v\f\x00]+/g, ' ').trim();
}

export function buildEmlContent(to: string, from: string, email: GeneratedEmail): string {
  const toSafe = sanitizeHeader(to);
  const fromSafe = sanitizeHeader(from);
  if (!toSafe) throw new Error('buildEmlContent: recipient address is empty after sanitization');
  if (!fromSafe) throw new Error('buildEmlContent: sender address is empty after sanitization');
  const date = new Date().toUTCString();
  return [
    `To: ${toSafe}`,
    `From: ${fromSafe}`,
    `Subject: ${sanitizeHeader(email.subject)}`,
    `Date: ${date}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    email.body,
  ].join('\r\n');
}

export function downloadEml(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // Defer the revoke so Firefox/older Safari don't cancel the download by
  // dropping the URL before the browser's save flow consumes it.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
