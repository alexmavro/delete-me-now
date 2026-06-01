import { GeneratedEmail, Language, Jurisdiction } from '../types';

// Art. 15 GDPR Subject Access Request. The legally-smarter sequence says
// "see what they have before asking them to delete it." This template
// exists as a first-class peer to the erasure letters.
//
// Scope: GDPR and UK-GDPR in all 5 UI languages, single formal register.
// (SAR letters don't reward SIMPLE/LEGAL/AGGRESSIVE splits; the ask is
// precise and needs to be.) CCPA "Right to Know" (§1798.110) and LGPD
// Art. 18 SAR are not yet implemented.

type EffectiveProfile = {
  fullName: string;
  email: string;
  address?: string;
  phone?: string;
  language: Language;
};

const IDENTITY_LABELS: Record<Language, { fullName: string; address: string; phone: string }> = {
  EN: { fullName: 'Full Name', address: 'Address', phone: 'Phone' },
  DE: { fullName: 'Name', address: 'Adresse', phone: 'Telefon' },
  FR: { fullName: 'Nom complet', address: 'Adresse', phone: 'Téléphone' },
  ES: { fullName: 'Nombre completo', address: 'Dirección', phone: 'Teléfono' },
  IT: { fullName: 'Nome completo', address: 'Indirizzo', phone: 'Telefono' },
};

function buildIdentity(user: EffectiveProfile): string {
  const labels = IDENTITY_LABELS[user.language];
  const lines = [`${labels.fullName}: ${user.fullName}`, `Email: ${user.email}`];
  if (user.address) lines.push(`${labels.address}: ${user.address}`);
  if (user.phone) lines.push(`${labels.phone}: ${user.phone}`);
  return lines.join('\n');
}

type SarRenderer = (ctx: { serviceName: string; user: EffectiveProfile; identity: string }) => GeneratedEmail;

const GDPR_SAR: Record<Language, SarRenderer> = {
  EN: ({ serviceName, user, identity }) => ({
    subject: `Request for Access to Personal Data — Article 15 GDPR — ${user.fullName}`,
    body: `To the Data Protection Officer at ${serviceName},

I am exercising my right of access under Article 15 of the General Data Protection Regulation (EU) 2016/679 (GDPR).

Please provide me with a complete copy of all personal data you hold about me, together with the following information required by Article 15(1):

(a) the purposes of the processing;
(b) the categories of personal data concerned;
(c) the recipients or categories of recipients to whom my data have been or will be disclosed, including any recipients in third countries or international organisations;
(d) the envisaged retention period, or the criteria used to determine it;
(e) the existence of my rights to rectification, erasure, restriction of processing, and objection;
(f) my right to lodge a complaint with a supervisory authority;
(g) if the data were not collected from me, any available information about their source;
(h) the existence of automated decision-making, including profiling, and meaningful information about the logic involved and the consequences for me.

Where personal data have been transferred to a third country or international organisation, please also provide the safeguards relied upon (Article 15(2)).

Please deliver the copy in a commonly used electronic format (e.g. JSON, CSV, PDF).

Identification:
${identity}

Under Article 12(3), you are required to respond within one month of receipt. If you need to extend this period under Article 12(3) (complex/numerous requests), please notify me within the one-month window together with the reasons for the delay.

Sincerely,

${user.fullName}`.trim(),
  }),
  DE: ({ serviceName, user, identity }) => ({
    subject: `Auskunftsersuchen nach Art. 15 DSGVO — ${user.fullName}`,
    body: `An den Datenschutzbeauftragten von ${serviceName},

hiermit mache ich von meinem Auskunftsrecht nach Art. 15 der Datenschutz-Grundverordnung (EU) 2016/679 (DSGVO) Gebrauch.

Bitte übermitteln Sie mir eine vollständige Kopie aller personenbezogenen Daten, die Sie über mich verarbeiten, sowie die folgenden in Art. 15 Abs. 1 DSGVO genannten Informationen:

(a) die Verarbeitungszwecke;
(b) die Kategorien der verarbeiteten personenbezogenen Daten;
(c) die Empfänger oder Kategorien von Empfängern, gegenüber denen die Daten offengelegt worden sind oder werden, insbesondere Empfänger in Drittländern oder internationale Organisationen;
(d) die geplante Speicherdauer oder die Kriterien zu deren Festlegung;
(e) das Bestehen meiner Rechte auf Berichtigung, Löschung, Einschränkung der Verarbeitung sowie des Widerspruchs;
(f) mein Beschwerderecht bei einer Aufsichtsbehörde;
(g) soweit die Daten nicht bei mir erhoben wurden, alle verfügbaren Informationen über deren Herkunft;
(h) das Bestehen einer automatisierten Entscheidungsfindung einschließlich Profiling sowie aussagekräftige Informationen über die Logik und die Tragweite für mich.

Sofern personenbezogene Daten in ein Drittland oder an eine internationale Organisation übermittelt wurden, bitte ich zusätzlich um die Mitteilung geeigneter Garantien (Art. 15 Abs. 2 DSGVO).

Bitte übermitteln Sie die Kopie in einem gängigen elektronischen Format (z. B. JSON, CSV, PDF).

Identifikation:
${identity}

Gemäß Art. 12 Abs. 3 DSGVO ist innerhalb eines Monats zu antworten. Eine etwaige Fristverlängerung nach Art. 12 Abs. 3 (komplexe/zahlreiche Anträge) ist mir innerhalb der Monatsfrist unter Angabe der Gründe anzuzeigen.

Mit freundlichen Grüßen,

${user.fullName}`.trim(),
  }),
  FR: ({ serviceName, user, identity }) => ({
    subject: `Demande d'accès aux données personnelles — Article 15 RGPD — ${user.fullName}`,
    body: `Au Délégué à la Protection des Données de ${serviceName},

J'exerce par la présente mon droit d'accès en vertu de l'article 15 du Règlement Général sur la Protection des Données (UE) 2016/679 (RGPD).

Je vous prie de me fournir une copie complète de l'ensemble des données personnelles que vous détenez à mon sujet, accompagnée des informations suivantes exigées par l'article 15, paragraphe 1 :

(a) les finalités du traitement ;
(b) les catégories de données à caractère personnel concernées ;
(c) les destinataires ou catégories de destinataires auxquels les données ont été ou seront communiquées, en particulier les destinataires établis dans des pays tiers ou les organisations internationales ;
(d) la durée de conservation envisagée, ou les critères utilisés pour la déterminer ;
(e) l'existence de mes droits à la rectification, à l'effacement, à la limitation du traitement et à l'opposition ;
(f) mon droit d'introduire une réclamation auprès d'une autorité de contrôle ;
(g) lorsque les données n'ont pas été collectées auprès de moi, toute information disponible quant à leur source ;
(h) l'existence d'une prise de décision automatisée, y compris le profilage, ainsi que des informations utiles concernant la logique sous-jacente et les conséquences pour moi.

En cas de transfert vers un pays tiers ou une organisation internationale, je demande également les garanties appropriées (article 15, paragraphe 2).

Merci de transmettre la copie dans un format électronique courant (JSON, CSV, PDF, etc.).

Identification :
${identity}

Conformément à l'article 12, paragraphe 3, vous êtes tenu de répondre dans un délai d'un mois. Toute prolongation éventuelle fondée sur la complexité ou le nombre de demandes doit m'être notifiée dans ce délai initial, accompagnée des motifs du retard.

Cordialement,

${user.fullName}`.trim(),
  }),
  ES: ({ serviceName, user, identity }) => ({
    subject: `Solicitud de acceso a datos personales — Artículo 15 RGPD — ${user.fullName}`,
    body: `Al Delegado de Protección de Datos de ${serviceName},

Por la presente ejerzo mi derecho de acceso conforme al artículo 15 del Reglamento General de Protección de Datos (UE) 2016/679 (RGPD).

Les ruego me faciliten una copia completa de todos los datos personales que obren en su poder sobre mi persona, junto con la información exigida por el artículo 15, apartado 1:

(a) los fines del tratamiento;
(b) las categorías de datos personales de que se trate;
(c) los destinatarios o categorías de destinatarios a los que se hayan comunicado o se vayan a comunicar los datos, en particular los destinatarios en terceros países u organizaciones internacionales;
(d) el plazo previsto de conservación, o los criterios utilizados para determinarlo;
(e) la existencia de mis derechos de rectificación, supresión, limitación del tratamiento y oposición;
(f) mi derecho a presentar una reclamación ante una autoridad de control;
(g) cuando los datos no se hayan obtenido de mí, cualquier información disponible sobre su origen;
(h) la existencia de decisiones automatizadas, incluida la elaboración de perfiles, así como información significativa sobre la lógica aplicada y las consecuencias para mí.

En caso de transferencia a un tercer país o a una organización internacional, les pido asimismo las garantías adecuadas (artículo 15, apartado 2).

Les ruego entreguen la copia en un formato electrónico habitual (JSON, CSV, PDF u otro).

Identificación:
${identity}

Conforme al artículo 12, apartado 3, deben responder en el plazo de un mes. Cualquier prórroga basada en la complejidad o el número de solicitudes debe notificárseme dentro de dicho plazo, junto con los motivos del retraso.

Atentamente,

${user.fullName}`.trim(),
  }),
  IT: ({ serviceName, user, identity }) => ({
    subject: `Richiesta di accesso ai dati personali — Art. 15 GDPR — ${user.fullName}`,
    body: `Al Responsabile della Protezione dei Dati di ${serviceName},

Con la presente esercito il mio diritto di accesso ai sensi dell'articolo 15 del Regolamento Generale sulla Protezione dei Dati (UE) 2016/679 (GDPR).

Vi prego di fornirmi una copia completa di tutti i dati personali che mi riguardano in vostro possesso, unitamente alle seguenti informazioni richieste dall'articolo 15, paragrafo 1:

(a) le finalità del trattamento;
(b) le categorie di dati personali interessati;
(c) i destinatari o le categorie di destinatari a cui i dati sono stati o saranno comunicati, in particolare i destinatari in paesi terzi o organizzazioni internazionali;
(d) il periodo di conservazione previsto, o i criteri utilizzati per determinarlo;
(e) l'esistenza dei miei diritti di rettifica, cancellazione, limitazione del trattamento e opposizione;
(f) il mio diritto di proporre reclamo a un'autorità di controllo;
(g) qualora i dati non siano stati raccolti presso di me, ogni informazione disponibile sulla loro origine;
(h) l'esistenza di un processo decisionale automatizzato, inclusa la profilazione, nonché informazioni significative sulla logica utilizzata e sulle conseguenze per me.

In caso di trasferimento verso un paese terzo o un'organizzazione internazionale, Vi chiedo altresì le garanzie adeguate (art. 15, par. 2).

Vi prego di fornire la copia in un formato elettronico comune (JSON, CSV, PDF o simili).

Identificazione:
${identity}

Ai sensi dell'articolo 12, paragrafo 3, siete tenuti a rispondere entro un mese. Un'eventuale proroga basata sulla complessità o sul numero di richieste deve essermi notificata entro tale termine, con indicazione dei motivi del ritardo.

Cordiali saluti,

${user.fullName}`.trim(),
  }),
};

// Jurisdictions where SAR is implemented. GDPR and UK-GDPR share Art. 15
// verbatim (UK-GDPR is GDPR as retained in UK law), so they route to the
// same body. CCPA and LGPD have analogous rights but different statutes
// and different ritual phrasing; not yet implemented.
const SAR_BY_JURISDICTION: Partial<Record<Jurisdiction, Record<Language, SarRenderer>>> = {
  GDPR: GDPR_SAR,
  UK_GDPR: GDPR_SAR,
};

export function isSarSupported(jurisdiction: Jurisdiction): boolean {
  return SAR_BY_JURISDICTION[jurisdiction] != null;
}

export function generateSarEmail(
  serviceName: string,
  user: EffectiveProfile,
  jurisdiction: Jurisdiction,
): GeneratedEmail {
  const bodies = SAR_BY_JURISDICTION[jurisdiction];
  if (!bodies) {
    throw new Error(`[sar] SAR template not yet available for jurisdiction: ${jurisdiction}`);
  }
  let renderer = bodies[user.language];
  if (!renderer) {
    console.warn(`sar: no template for ${jurisdiction}/${user.language}, falling back to EN`);
    renderer = bodies.EN;
  }
  const identity = buildIdentity(user);
  return renderer({ serviceName, user, identity });
}
