# Delete Me Now

> Privacy is a right. This makes it a button.

A browser-only tool for firing off bulk data-deletion requests under GDPR, CCPA, UK-GDPR and
LGPD. Pick the companies sitting on your data, and it drafts the legally-grounded letters for you
to send. Free, open, and **nothing you type ever leaves your device** — there is no server.

## Why

Data brokers and ad-tech vendors trade your profile every second. The law says you can make them
stop. They bet on the process being too tedious to bother with. This removes the tedium: match your
details against a directory of ~2,900 known collectors and generate ready-to-send requests in minutes.

## How it works

1. **Profile.** Your name and email. That's it. It stays in your browser.
2. **Pick targets.** Search the directory or use a quick list (data brokers, EU ad-tech, social…).
3. **Send.** Preview each letter, then open it in your mail client or download `.eml` files. Track
   replies, deadlines, and escalate to a Data Protection Authority if a company ignores you.

Five languages (EN/DE/FR/ES/IT), four jurisdictions, three tones. A German company gets a German
letter regardless of your interface language.

## Privacy

No account. No backend. No analytics. After the page loads, the app makes **zero** network requests
involving your data — the footer keeps a live count, and you can confirm it yourself in DevTools →
Network. Your profile and progress live in this browser's `localStorage` only.

## Develop

```bash
git clone https://github.com/alexmavro/delete-me-now
cd delete-me-now
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```

Vite + React + TypeScript + Tailwind. The company directory is a build-time artifact regenerated
from public sources via `scripts/` (primary source: [Datenanfragen.de](https://www.datarequests.org/),
CC0).

## Disclaimer

This generates template letters based on standard regulations. I'm someone with a bone to pick with
Big Tech, not your lawyer — the templates are a starting point, and you're responsible for what you
send. Use the speculative-broker mode for brokers, not your local bakery.
