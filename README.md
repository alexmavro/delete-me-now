# Delete Me Now ⌐■_■

> *Privacy is a right. Treat it like one.*

A zero-knowledge, browser-only tool for exercising your right to data deletion, in bulk.

Manually writing deletion requests to thousands of data brokers is impossible. Paying a lawyer is
expensive. This does it for free, in minutes. Nothing you type leaves your device.

---

## ( o_o) Why does this exist?

Data brokers, ad-tech vendors, and scraping bots trade your personal profile every millisecond. GDPR,
CCPA, and similar laws say you can stop them. They count on the process being too annoying for you to
bother.

This removes the friction. It matches your details against a directory of ~3,000 known data collectors
and generates legally grounded deletion requests, ready to send.

---

## ¯\\_(ツ)_/¯ How it works

### Step 1. Profile

Enter your name and email. That's it. Your data stays in your browser and never leaves your device.

### Step 2. Pick your targets

Browse the directory or use quick lists:
- **Standard.** Top verified targets.
- **Data brokers.** US and global broker list.
- **EU ad-tech.** GDPR-relevant ad networks.
- **Social & media.** Major platforms.

Toggle speculative targets to also write to companies that may hold your data without a direct account
relationship. Good for data brokers who trade profiles without your knowledge.

### Step 3. Send

Preview each draft before it goes out. Open it in your mail client or Gmail, or download `.eml` files
(or a bulk `.zip`) and import them into your drafts. Track replies and deadlines, and escalate to a
Data Protection Authority if a company ignores you.

---

## ( >_<) What this means in practice

**No database.** Nothing about you is stored on a server. There is no server.

**No analytics.** The tool cannot see which companies you select, your name, or anything else. All local.

**No backend.** The app is a static bundle. After page load, zero outbound requests on your data. Open
DevTools, watch the Network panel — the footer keeps a live count.

---

## (=_=) Where your data actually lives

Your profile, your selected companies, and the "I sent this on Tuesday" timeline all sit in your
**browser's localStorage**. Three keys, kilobytes total.

**It survives:** closing the tab, closing the browser, restarting your laptop, coming back six months
later. Same device, same browser, same site = full memory.

**It does NOT survive:** clearing site data, Incognito / Private mode, a different browser, or a
different device. Chrome state ≠ Firefox state; laptop state ≠ phone state.

So if a deadline matters, screenshot the receipt when you send. The browser is durable, but it's still
a browser.

---

## ✨ What's in this build

- **Multi-jurisdiction.** GDPR (EU), CCPA (California), UK GDPR, LGPD (Brazil).
- **5 languages.** EN, DE, FR, ES, IT for the UI and the email templates.
- **3 email tones.** Friendly, Legal, Aggressive (for repeat offenders).
- **Email preview.** See exactly what goes out before opening the draft.
- **Quick lists.** One-click selection bundles by use case.
- **EU-resident toggle.** Adds enforceable Article 17 language to every request.
- **Speculative mode.** Includes a shadow-profile clause for data brokers.
- **Controller-language routing.** A German company gets a German letter, regardless of your UI language.
- **Cmd/Ctrl+K palette.** Jump to any company, switch theme, edit identity.

---

## DELETE ME NOW

```
      (TvT )
     --| |--     [ DELETE. EVERYTHING. ]
       | |
      /   \
```

---

## (^_^)b Run it locally

```bash
git clone https://github.com/alexmavro/delete-me-now
cd delete-me-now
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```

Vite + React + TypeScript + Tailwind. The directory is a build-time artifact regenerated from public
sources via `scripts/`.

---

## ( O.O) Credits & data sources

This stands on the shoulders of giants:

- **[Datenanfragen.de](https://www.datarequests.org/).** Primary source for EU/GDPR contacts (CC0
  License). Grüße nach Deutschland 🇩🇪
- **California Data Broker Registry.** US broker data.
- **SimpleOptOut / PrivacySpy.** Additional community lists.

---

## ( u_u) Disclaimer

This generates template text based on standard regulations. I am a girl with a bone to pick with Big
Tech, not a lawyer. The templates are a starting point. You're responsible for what you send.

Don't blast small businesses who clearly don't have your data. The speculative mode exists for data
brokers, not your local bakery.
