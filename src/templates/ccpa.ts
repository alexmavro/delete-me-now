import { GeneratedEmail, TemplateStyle } from '../types';
type EffectiveProfile = { fullName: string; email: string; address?: string; phone?: string; includeSpeculative: boolean };

function buildIdentity(user: EffectiveProfile): string {
  const lines = [`Full Name: ${user.fullName}`, `Email: ${user.email}`];
  if (user.address) lines.push(`Address: ${user.address}`);
  if (user.phone) lines.push(`Phone: ${user.phone}`);
  return lines.join('\n');
}

const speculativeClause = `\nIf I do not have an active account with you, please also search for and delete any records, profiles, or data associated with my personal information listed above.`;

export function generateCcpaEmail(
  serviceName: string,
  user: EffectiveProfile,
  style: TemplateStyle,
): GeneratedEmail {
  const identity = buildIdentity(user);
  const speculative = user.includeSpeculative ? speculativeClause : '';

  if (style === 'SIMPLE') {
    return {
      subject: `Request to Delete Personal Information — CCPA Section 1798.105`,
      body: `Dear Support Team,

I am reaching out to request the deletion of my personal information, as provided under the California Consumer Privacy Act (CCPA), Section 1798.105.

My details:
${identity}${speculative}

Please confirm once my information has been deleted. I appreciate your prompt attention to this request.

Thank you,

${user.fullName}

P.S.: This isn't personal — I'm just cleaning up my digital footprint. Thanks for making this easy.`.trim(),
    };
  }

  if (style === 'LEGAL') {
    return {
      subject: `Formal Request to Delete Personal Information — CCPA § 1798.105 — ${user.fullName}`,
      body: `To the Privacy / Legal Department at ${serviceName},

Pursuant to the California Consumer Privacy Act (CCPA), California Civil Code § 1798.105, I hereby request that you delete all personal information you have collected, maintained, or disclosed about me.

This request applies to all personal information as defined under CCPA § 1798.140(o), including but not limited to:
— Identifiers (name, email, IP address, device IDs)
— Commercial information (purchase history, records of services)
— Internet or electronic network activity
— Inferences drawn from any personal information

Subject details:
${identity}${speculative}

Please confirm compliance with this request within 45 days as required by law.

Sincerely,

${user.fullName}`.trim(),
    };
  }

  return {
    subject: `LEGAL DEMAND: DELETE PERSONAL INFORMATION — CCPA § 1798.105`,
    body: `URGENT: LEGAL / PRIVACY DEPARTMENT

To ${serviceName},

I am formally invoking my rights under the California Consumer Privacy Act (CCPA), § 1798.105, and demanding the IMMEDIATE deletion of all personal information associated with me.

MY IDENTIFIERS:
${identity}${speculative}

DEMANDS:
1. Delete all personal information as defined under CCPA § 1798.140(o).
2. Direct all service providers to delete my information.
3. Do not sell or share my personal information (§ 1798.120).
4. Confirm deletion in writing within 45 days.

Failure to comply will result in a complaint filed with the California Privacy Protection Agency (CPPA).

${user.fullName}`.trim(),
  };
}
