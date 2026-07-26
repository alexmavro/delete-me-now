# Security

## Reporting a vulnerability

Open a [private security advisory](https://github.com/alexmavro/delete-me-now/security/advisories/new)
on this repository. Please don't open a public issue for anything exploitable.

Expect a first reply within a week.

## What this tool is, in security terms

It is a static bundle. There is no server, no account, no database, and no API. Everything you
type stays in your browser's local storage, and the letters are handed to your own mail client.
Nothing is transmitted anywhere by this application.

That shape rules out most of what usually goes wrong — there is no backend to breach, no session
to steal, and no stored copy of anyone's personal data to leak. It also means there is no
server-side logging to help you if something does go wrong locally.

## In scope

- Anything that causes data to leave the browser. This is the core promise; a network request
  carrying user data is the most serious bug this project can have.
- Cross-site scripting, particularly through company names or notes rendered from the dataset.
- A weakness in the Content Security Policy in `public/_headers`.
- A malicious or compromised entry reaching `generated-services.json` through the import pipeline
  in `scripts/`, for example a contact address that redirects a letter somewhere unintended.
- Dependency vulnerabilities with a realistic path to exploitation here.

## Out of scope

- The privacy practices of the companies listed in the directory. The directory describes them; it
  does not endorse them.
- Contact details that are merely stale. Those are data-quality issues — please open a normal issue.
- Anything requiring an attacker to already control the user's device or browser profile.

## Verifying the no-network claim yourself

Open your browser's developer tools, go to the Network panel, and use the tool. The footer keeps a
live count of outbound requests for the same reason. After the initial page load, it should stay
at zero.
