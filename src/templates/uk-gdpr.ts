import { GeneratedEmail, TemplateStyle } from '../types';
type EffectiveProfile = { fullName: string; email: string; address?: string; phone?: string; includeSpeculative: boolean };

function buildIdentity(user: EffectiveProfile): string {
  const lines = [`Full Name: ${user.fullName}`, `Email: ${user.email}`];
  if (user.address) lines.push(`Address: ${user.address}`);
  if (user.phone) lines.push(`Phone: ${user.phone}`);
  return lines.join('\n');
}

const speculativeClause = `\nIf I do not hold an active account with you, please also check for shadow profiles, marketing records, or third-party data entries associated with my details.`;

export function generateUkGdprEmail(
  serviceName: string,
  user: EffectiveProfile,
  style: TemplateStyle,
): GeneratedEmail {
  const identity = buildIdentity(user);
  const speculative = user.includeSpeculative ? speculativeClause : '';

  if (style === 'SIMPLE') {
    return {
      subject: `Request for Erasure of Personal Data — UK GDPR Article 17`,
      body: `Dear Support Team,

I am writing to request the deletion of my personal data under Article 17 of the UK General Data Protection Regulation (UK GDPR).

My details:
${identity}${speculative}

Please confirm once the deletion has been completed, or let me know if you require any additional information.

Thank you,

${user.fullName}

P.S.: I just want a tidier digital presence. Thanks for making this straightforward.`.trim(),
    };
  }

  if (style === 'LEGAL') {
    return {
      subject: `Formal Erasure Request — UK GDPR Article 17 — ${user.fullName}`,
      body: `To the Data Protection Officer at ${serviceName},

In accordance with Article 17 of the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018, I hereby request the erasure of all personal data you hold about me.

Grounds for erasure:
— The data is no longer necessary for the purposes for which it was collected (Art. 17(1)(a))
— I withdraw my consent where processing was based on consent (Art. 17(1)(b))
— I object to processing under Article 21 UK GDPR (Art. 17(1)(c))

Subject details:
${identity}${speculative}

Please provide written confirmation of erasure within one calendar month as required under Article 12 UK GDPR.

Yours sincerely,

${user.fullName}`.trim(),
    };
  }

  return {
    subject: `LEGAL DEMAND: IMMEDIATE ERASURE — UK GDPR Article 17`,
    body: `URGENT: DATA PROTECTION OFFICER / LEGAL DEPARTMENT

To ${serviceName},

I am formally demanding the IMMEDIATE erasure of all personal data you hold about me, pursuant to Article 17 of the UK GDPR.

MY IDENTIFIERS:
${identity}${speculative}

DEMANDS:
1. Erase all personal data associated with my identifiers without undue delay.
2. Inform any third parties to whom data was disclosed (Article 19 UK GDPR).
3. Confirm in writing within one month.

Non-compliance will be reported to the Information Commissioner's Office (ICO).

${user.fullName}`.trim(),
  };
}
