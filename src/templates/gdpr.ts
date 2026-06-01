import { GeneratedEmail, TemplateStyle, Language, Gender } from '../types';

type EffectiveProfile = { fullName: string; email: string; address?: string; phone?: string; isEuCitizen: boolean; language: Language; includeSpeculative: boolean; gender?: Gender };

// Self-reference noun by language × gender. EN and IT are grammatically
// gender-invariant. DE shifts citizen-noun (Bürger / Bürgerin / Bürger:in).
// FR shifts the past participle (résident / résidente / résident·e).
// ES — "residente" is invariable in Spanish, so this map only kicks in for
// the PS clause adjective (cómodo/cómoda).
function euClauseFor(lang: Language, gender: Gender): string {
  switch (lang) {
    case 'EN':
      return `As a resident of the European Union / EEA, I am exercising my rights under the General Data Protection Regulation (GDPR).`;
    case 'DE': {
      const noun = gender === 'F' ? 'Bürgerin' : gender === 'M' ? 'Bürger' : 'Bürger:in';
      return `Als ${noun} der Europäischen Union übe ich hiermit meine Rechte gemäß der Datenschutz-Grundverordnung (DSGVO) aus.`;
    }
    case 'FR': {
      const noun = gender === 'F' ? 'résidente' : gender === 'M' ? 'résident' : 'résident·e';
      return `En tant que ${noun} de l'Union européenne, j'exerce mes droits en vertu du Règlement Général sur la Protection des Données (RGPD).`;
    }
    case 'ES':
      return `Como residente de la Unión Europea, ejerzo mis derechos al amparo del Reglamento General de Protección de Datos (RGPD).`;
    case 'IT':
      return `In qualità di residente nell'Unione Europea, esercito i miei diritti ai sensi del Regolamento Generale sulla Protezione dei Dati (GDPR).`;
  }
}

function psBlockFor(lang: Language, gender: Gender): string {
  switch (lang) {
    case 'EN':
      return `P.S.: Please don't take this as any reflection on your service. With the rise of mass data mining, digital ID rollouts, and AI-assisted fraud, I simply no longer feel comfortable having my data stored across hundreds of databases I've lost track of. Thank you for understanding. :)`;
    case 'DE':
      return `P.S.: Bitte verstehen Sie dies keinesfalls als Unzufriedenheit mit Ihrem Service. Doch aufgrund des massiven Daten-Minings, der Einführung digitaler IDs und der Zunahme von KI-gestützter Kriminalität fühle ich mich einfach nicht mehr sicher, wenn meine Daten überall gespeichert sind. Vielen Dank für Ihr Verständnis. :)`;
    case 'FR':
      // "à l'aise" is gender-invariant in French. PS unchanged across genders.
      return `P.S.: Veuillez ne pas interpréter cela comme une insatisfaction envers vos services. Face à l'essor du data mining, des identités numériques et de la fraude assistée par IA, je ne me sens simplement plus à l'aise de voir mes données éparpillées partout. Merci de votre compréhension. :)`;
    case 'ES': {
      const adj = gender === 'F' ? 'cómoda' : gender === 'M' ? 'cómodo' : 'cómodo/a';
      return `P.D.: Por favor no interprete esto como una insatisfacción con sus servicios. Con el auge del data mining masivo, los IDs digitales y el fraude asistido por IA, simplemente ya no me siento ${adj} con mis datos repartidos por cientos de bases de datos. Gracias por su comprensión. :)`;
    }
    case 'IT':
      // "a mio agio" is gender-invariant. PS unchanged across genders.
      return `P.S.: Non interpreti questo come un'insoddisfazione verso i vostri servizi. Con la diffusione del data mining, delle identità digitali e delle frodi basate sull'IA, non mi sento più a mio agio nel sapere i miei dati sparsi ovunque. Grazie per la comprensione. :)`;
  }
}

const speculativeClause: Record<Language, string> = {
  EN: `\nIf I do not have an active account with you, please also check for any shadow profiles, marketing lists, or third-party data records that may be associated with my details.`,
  DE: `\nSollte ich kein aktives Konto bei Ihnen haben, prüfen Sie bitte Ihre Datenbanken auf Schattenprofile, Marketing-Listen oder Datensätze Dritter, die meinen Angaben entsprechen.`,
  FR: `\nSi je n'ai pas de compte actif chez vous, veuillez également vérifier l'existence de profils fantômes, de listes marketing ou de données tierces associées à mes informations.`,
  ES: `\nSi no tengo una cuenta activa, compruebe también si existen perfiles sombra, listas de marketing o registros de terceros asociados a mis datos.`,
  IT: `\nSe non ho un account attivo, verificare anche l'eventuale presenza di profili ombra, liste di marketing o dati di terze parti collegati ai miei dati.`,
};

const IDENTITY_LABELS: Record<Language, { fullName: string; address: string; phone: string }> = {
  EN: { fullName: 'Full Name', address: 'Address', phone: 'Phone' },
  DE: { fullName: 'Name', address: 'Adresse', phone: 'Telefon' },
  FR: { fullName: 'Nom complet', address: 'Adresse', phone: 'Téléphone' },
  ES: { fullName: 'Nombre completo', address: 'Dirección', phone: 'Teléfono' },
  IT: { fullName: 'Nome completo', address: 'Indirizzo', phone: 'Telefono' },
};

function buildIdentity(user: EffectiveProfile, lang: Language): string {
  const labels = IDENTITY_LABELS[lang];
  const lines = [`${labels.fullName}: ${user.fullName}`, `Email: ${user.email}`];
  if (user.address) lines.push(`${labels.address}: ${user.address}`);
  if (user.phone) lines.push(`${labels.phone}: ${user.phone}`);
  return lines.join('\n');
}

interface Ctx {
  serviceName: string;
  user: EffectiveProfile;
  eu: string;
  speculative: string;
  identity: string;
  ps: string;
}

// Each style is a per-language map of (ctx) -> GeneratedEmail.
// Mirrors the DE tone (firm/precise) for the LEGAL/AGGRESSIVE variants.
// Interpolation contract: every branch uses eu, identity, speculative,
// serviceName, user.fullName — never re-order or drop.
type StyleMap = Record<Language, (c: Ctx) => GeneratedEmail>;

const SIMPLE: StyleMap = {
  EN: ({ eu, identity, speculative, user, ps }) => ({
    subject: `Request for Erasure of Personal Data — Article 17 GDPR`,
    body: `Dear Support Team,

${eu}I am writing to request the deletion of my account and all personal data associated with me, in accordance with Article 17 GDPR (Right to Erasure).

My details:
${identity}${speculative}

Please confirm once the deletion has been completed, or let me know if you need any additional information.

Thank you and have a good week.

Sincerely,

${user.fullName}

${ps}`.trim(),
  }),
  DE: ({ eu, identity, speculative, user, ps }) => ({
    subject: `Antrag auf Löschung personenbezogener Daten (Art. 17 DSGVO)`,
    body: `Sehr geehrtes Support-Team,

${eu}ich schreibe Ihnen, um formell die Löschung meines Kontos und aller damit verbundenen personenbezogenen Daten zu beantragen.

In Übereinstimmung mit Artikel 17 DSGVO widerrufe ich meine Einwilligung zur Verarbeitung meiner Daten.

Meine Daten:
${identity}${speculative}

Bitte bestätigen Sie mir kurz die erfolgreiche Löschung oder informieren Sie mich, falls weitere Angaben erforderlich sind.

Vielen Dank und mit freundlichen Grüßen,

${user.fullName}

${ps}`.trim(),
  }),
  FR: ({ eu, identity, speculative, user, ps }) => ({
    subject: `Demande d'effacement de données personnelles — Article 17 RGPD`,
    body: `Madame, Monsieur,

${eu}Je vous écris afin de demander la suppression de mon compte ainsi que de toutes les données personnelles me concernant, conformément à l'article 17 du RGPD (droit à l'effacement).

Mes coordonnées :
${identity}${speculative}

Merci de me confirmer la bonne exécution de la suppression, ou de m'indiquer si des informations complémentaires vous sont nécessaires.

Je vous remercie par avance.

Cordialement,

${user.fullName}

${ps}`.trim(),
  }),
  ES: ({ eu, identity, speculative, user, ps }) => ({
    subject: `Solicitud de supresión de datos personales — Artículo 17 RGPD`,
    body: `Estimado equipo de soporte,

${eu}Me dirijo a ustedes para solicitar la eliminación de mi cuenta y de todos los datos personales asociados a mi persona, conforme al artículo 17 del RGPD (derecho de supresión).

Mis datos:
${identity}${speculative}

Les ruego me confirmen la ejecución de la supresión o me indiquen si necesitan información adicional.

Muchas gracias.

Atentamente,

${user.fullName}

${ps}`.trim(),
  }),
  IT: ({ eu, identity, speculative, user, ps }) => ({
    subject: `Richiesta di cancellazione dati personali — Art. 17 GDPR`,
    body: `Gentile team di supporto,

${eu}Vi scrivo per richiedere la cancellazione del mio account e di tutti i dati personali che mi riguardano, ai sensi dell'art. 17 GDPR (diritto alla cancellazione).

I miei dati:
${identity}${speculative}

Vi prego di confermarmi l'avvenuta cancellazione o di indicarmi se necessitate di ulteriori informazioni.

Grazie.

Cordiali saluti,

${user.fullName}

${ps}`.trim(),
  }),
};

const LEGAL: StyleMap = {
  EN: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `Formal Erasure Request — Article 17 GDPR — ${user.fullName}`,
    body: `To the Data Protection Officer at ${serviceName},

${eu}In accordance with Article 17 of the General Data Protection Regulation (GDPR), I hereby withdraw my consent and request the immediate erasure of all personal data you hold about me, including any data shared with third parties (Article 17(2) GDPR).

I am also exercising:
1. My right to withdraw consent (Article 7(3) GDPR)
2. My right to object to processing (Article 21 GDPR)

Subject details:
${identity}${speculative}

Please provide written confirmation of erasure within the statutory one-month timeframe.

Sincerely,

${user.fullName}`.trim(),
  }),
  DE: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `Rechtliche Aufforderung: Löschung nach Art. 17 DSGVO — ${user.fullName}`,
    body: `An den Datenschutzbeauftragten von ${serviceName},

${eu}hiermit mache ich von meinem Recht auf Löschung gemäß Art. 17 DSGVO Gebrauch und fordere Sie auf, unverzüglich alle personenbezogenen Daten zu löschen, die Sie über mich gespeichert haben — einschließlich aller Daten, die an Dritte weitergegeben wurden (Art. 17 Abs. 2 DSGVO).

Gleichzeitig übe ich folgende Rechte aus:
1. Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)
2. Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)

Identifikation:
${identity}${speculative}

Ich erwarte eine schriftliche Bestätigung der Löschung innerhalb der gesetzlichen Frist von einem Monat.

Mit freundlichen Grüßen,

${user.fullName}`.trim(),
  }),
  FR: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `Demande formelle d'effacement — Article 17 RGPD — ${user.fullName}`,
    body: `Au Délégué à la Protection des Données de ${serviceName},

${eu}Conformément à l'article 17 du Règlement Général sur la Protection des Données (RGPD), je retire par la présente mon consentement et exige l'effacement immédiat de l'ensemble des données personnelles que vous détenez à mon sujet, y compris celles communiquées à des tiers (article 17, paragraphe 2, RGPD).

J'exerce également :
1. Mon droit de retrait du consentement (article 7, paragraphe 3, RGPD)
2. Mon droit d'opposition au traitement (article 21 RGPD)

Identification :
${identity}${speculative}

Je vous demande de me fournir une confirmation écrite de l'effacement dans le délai légal d'un mois.

Cordialement,

${user.fullName}`.trim(),
  }),
  ES: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `Solicitud formal de supresión — Art. 17 RGPD — ${user.fullName}`,
    body: `Al Delegado de Protección de Datos de ${serviceName},

${eu}Conforme al artículo 17 del Reglamento General de Protección de Datos (RGPD), por la presente retiro mi consentimiento y solicito la supresión inmediata de todos los datos personales que obren en su poder sobre mi persona, incluidos los datos cedidos a terceros (artículo 17.2 RGPD).

Asimismo ejerzo:
1. Mi derecho a retirar el consentimiento (artículo 7.3 RGPD)
2. Mi derecho de oposición al tratamiento (artículo 21 RGPD)

Datos del interesado:
${identity}${speculative}

Exijo confirmación por escrito de la supresión dentro del plazo legal de un mes.

Atentamente,

${user.fullName}`.trim(),
  }),
  IT: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `Richiesta formale di cancellazione — Art. 17 GDPR — ${user.fullName}`,
    body: `Al Responsabile della Protezione dei Dati di ${serviceName},

${eu}Ai sensi dell'articolo 17 del Regolamento Generale sulla Protezione dei Dati (GDPR), con la presente revoco il mio consenso e richiedo la cancellazione immediata di tutti i dati personali che mi riguardano in vostro possesso, inclusi quelli comunicati a terzi (art. 17, par. 2, GDPR).

Esercito inoltre:
1. Il diritto di revoca del consenso (art. 7, par. 3, GDPR)
2. Il diritto di opposizione al trattamento (art. 21 GDPR)

Identificazione dell'interessato:
${identity}${speculative}

Esigo conferma scritta della cancellazione entro il termine legale di un mese.

Cordiali saluti,

${user.fullName}`.trim(),
  }),
};

const AGGRESSIVE: StyleMap = {
  EN: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `LEGAL DEMAND: IMMEDIATE ERASURE OF PERSONAL DATA — GDPR Article 17`,
    body: `URGENT: LEGAL / PRIVACY DEPARTMENT

To ${serviceName},

${eu}I am formally demanding the IMMEDIATE and PERMANENT erasure of all personal data identifying me.

Rights exercised:
— GDPR Article 17 (Right to be Forgotten)
— GDPR Article 21 (Right to Object)

MY IDENTIFIERS:
${identity}${speculative}

DEMANDS:
1. Permanently delete all records linked to these identifiers.
2. Remove any shadow profiles, marketing lists, or inferred data.
3. Confirm deletion in writing within the statutory timeframe.

Failure to comply will result in a formal complaint to the relevant Data Protection Authority.

${user.fullName}`.trim(),
  }),
  DE: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `RECHTSANSPRUCH: SOFORTIGE LÖSCHUNG (ART. 17 DSGVO) — ${user.fullName}`,
    body: `DRINGEND: RECHTSABTEILUNG / DATENSCHUTZ

An ${serviceName},

${eu}ich fordere die SOFORTIGE und UNWIDERRUFLICHE LÖSCHUNG aller mich betreffenden Daten.

Rechtsgrundlage:
— Art. 17 DSGVO (Recht auf Vergessenwerden)
— Art. 21 DSGVO (Widerspruchsrecht)

IDENTIFIKATION:
${identity}${speculative}

FORDERUNGEN:
1. Löschen Sie alle Datensätze, die mit meinen Identifikatoren verknüpft sind.
2. Entfernen Sie alle Schattenprofile oder Marketing-Listen.
3. Bestätigen Sie die Löschung schriftlich innerhalb der gesetzlichen Frist.

Nichtbeachtung werde ich bei der zuständigen Aufsichtsbehörde melden.

${user.fullName}`.trim(),
  }),
  FR: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `MISE EN DEMEURE : EFFACEMENT IMMÉDIAT — RGPD Article 17 — ${user.fullName}`,
    body: `URGENT : SERVICE JURIDIQUE / PROTECTION DES DONNÉES

À ${serviceName},

${eu}Je vous mets en demeure de procéder à l'EFFACEMENT IMMÉDIAT et DÉFINITIF de l'ensemble des données personnelles qui me concernent.

Droits invoqués :
— Article 17 RGPD (droit à l'oubli)
— Article 21 RGPD (droit d'opposition)

IDENTIFIANTS :
${identity}${speculative}

EXIGENCES :
1. Suppression définitive de tous les enregistrements liés à ces identifiants.
2. Suppression de tout profil fantôme, liste marketing ou donnée inférée.
3. Confirmation écrite de la suppression dans le délai légal.

À défaut, je saisirai sans délai l'autorité de protection des données compétente.

${user.fullName}`.trim(),
  }),
  ES: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `REQUERIMIENTO LEGAL: SUPRESIÓN INMEDIATA — RGPD Artículo 17 — ${user.fullName}`,
    body: `URGENTE: DEPARTAMENTO JURÍDICO / PROTECCIÓN DE DATOS

A ${serviceName},

${eu}Requiero formalmente la SUPRESIÓN INMEDIATA y DEFINITIVA de todos los datos personales que me identifican.

Derechos ejercidos:
— Artículo 17 RGPD (derecho al olvido)
— Artículo 21 RGPD (derecho de oposición)

IDENTIFICADORES:
${identity}${speculative}

EXIGENCIAS:
1. Eliminación definitiva de todos los registros vinculados a estos identificadores.
2. Eliminación de perfiles sombra, listas de marketing o datos inferidos.
3. Confirmación por escrito de la supresión dentro del plazo legal.

De no cumplirse, presentaré sin demora reclamación ante la autoridad de control competente.

${user.fullName}`.trim(),
  }),
  IT: ({ serviceName, eu, identity, speculative, user }) => ({
    subject: `DIFFIDA LEGALE: CANCELLAZIONE IMMEDIATA — GDPR Art. 17 — ${user.fullName}`,
    body: `URGENTE: UFFICIO LEGALE / PROTEZIONE DEI DATI

A ${serviceName},

${eu}Diffido formalmente a procedere alla CANCELLAZIONE IMMEDIATA e DEFINITIVA di tutti i dati personali che mi identificano.

Diritti invocati:
— Art. 17 GDPR (diritto all'oblio)
— Art. 21 GDPR (diritto di opposizione)

IDENTIFICATORI:
${identity}${speculative}

RICHIESTE:
1. Cancellazione definitiva di ogni dato collegato a questi identificatori.
2. Rimozione di profili ombra, liste di marketing o dati inferiti.
3. Conferma scritta della cancellazione entro il termine legale.

In mancanza di riscontro, presenterò senza indugio reclamo all'autorità di controllo competente.

${user.fullName}`.trim(),
  }),
};

const STYLE_MAPS: Record<TemplateStyle, StyleMap> = {
  SIMPLE,
  LEGAL,
  AGGRESSIVE,
};

export function generateGdprEmail(
  serviceName: string,
  user: EffectiveProfile,
  style: TemplateStyle,
): GeneratedEmail {
  const lang = user.language;
  const gender: Gender = user.gender ?? 'N';
  const eu = user.isEuCitizen ? euClauseFor(lang, gender) + '\n\n' : '';
  const speculative = user.includeSpeculative ? speculativeClause[lang] : '';
  const identity = buildIdentity(user, lang);
  const ps = psBlockFor(lang, gender);

  // Defensive dispatch: storage rehydration bypasses TS unions, so an
  // unknown `style` or `lang` from stale localStorage would crash. Fall
  // back to LEGAL/EN rather than throw — a slightly wrong letter is
  // better than a white-screen preview.
  let styleMap = STYLE_MAPS[style];
  if (!styleMap) {
    console.warn(`gdpr: unknown style ${style}, falling back to LEGAL`);
    styleMap = STYLE_MAPS.LEGAL;
  }
  let renderer = styleMap[lang];
  if (!renderer) {
    console.warn(`gdpr: no ${style} template for ${lang}, falling back to EN`);
    renderer = styleMap.EN ?? STYLE_MAPS.LEGAL.EN;
  }
  return renderer({ serviceName, user, eu, speculative, identity, ps });
}
