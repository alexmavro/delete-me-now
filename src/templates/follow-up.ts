import { Language, TemplateStyle, GeneratedEmail, Jurisdiction } from '../types';
import { DEADLINE_DAYS } from '../utils/deadlines';

interface FollowUpOptions {
  companyName: string;
  fullName: string;
  email: string;
  originalDate: string;
  jurisdiction: Jurisdiction;
  language: Language;
  style: TemplateStyle;
  dpaName?: string;
}

const LEGAL_BASIS: Record<string, Record<Language, string>> = {
  GDPR: {
    EN: 'Article 17 of the General Data Protection Regulation (EU) 2016/679',
    DE: 'Artikel 17 der Datenschutz-Grundverordnung (EU) 2016/679',
    FR: "l'article 17 du Règlement général sur la protection des données (UE) 2016/679",
    ES: 'el artículo 17 del Reglamento General de Protección de Datos (UE) 2016/679',
    IT: "l'articolo 17 del Regolamento Generale sulla Protezione dei Dati (UE) 2016/679",
  },
  CCPA: {
    EN: 'California Consumer Privacy Act (CCPA), Section 1798.105',
    DE: 'California Consumer Privacy Act (CCPA), Abschnitt 1798.105',
    FR: 'California Consumer Privacy Act (CCPA), Section 1798.105',
    ES: 'California Consumer Privacy Act (CCPA), Sección 1798.105',
    IT: 'California Consumer Privacy Act (CCPA), Sezione 1798.105',
  },
  UK_GDPR: {
    EN: 'Article 17 of the UK General Data Protection Regulation',
    DE: 'Artikel 17 der UK-Datenschutz-Grundverordnung',
    FR: "l'article 17 du Règlement général sur la protection des données du Royaume-Uni",
    ES: 'el artículo 17 del Reglamento General de Protección de Datos del Reino Unido',
    IT: "l'articolo 17 del Regolamento Generale sulla Protezione dei Dati del Regno Unito",
  },
  LGPD: {
    EN: 'Article 18 of Lei Geral de Proteção de Dados (LGPD)',
    DE: 'Artikel 18 des Lei Geral de Proteção de Dados (LGPD)',
    FR: "l'article 18 de la Lei Geral de Proteção de Dados (LGPD)",
    ES: 'el artículo 18 de la Lei Geral de Proteção de Dados (LGPD)',
    IT: "l'articolo 18 della Lei Geral de Proteção de Dados (LGPD)",
  },
};

function formatDate(iso: string, lang: Language): string {
  const d = new Date(iso);
  // Bad ISO returns "Invalid Date" via toLocaleDateString — that lands in a
  // legal letter and reads as a typo. Return the raw input instead so the
  // user spots their corrupted data when proofreading.
  if (!Number.isFinite(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const localeMap: Record<Language, string> = {
    EN: 'en-US', DE: 'de-DE', FR: 'fr-FR', ES: 'es-ES', IT: 'it-IT',
  };
  return d.toLocaleDateString(localeMap[lang], opts);
}

const TEMPLATES: Record<Language, Record<TemplateStyle, (o: FollowUpOptions & { deadlineDays: number; legalBasis: string; formattedDate: string }) => GeneratedEmail>> = {
  EN: {
    SIMPLE: (o) => ({
      subject: `Follow-up: Data Deletion Request — ${o.companyName}`,
      body: `Dear ${o.companyName},

On ${o.formattedDate}, I submitted a request for the deletion of my personal data under ${o.legalBasis}.

The statutory response period of ${o.deadlineDays} days has now passed without a response from your organization.

I kindly ask you to process my original request without further delay and confirm the deletion of my data.

If I do not receive a response within 14 days, I will be filing a formal complaint with ${o.dpaName || 'the relevant data protection authority'}.

Best regards,
${o.fullName}
${o.email}`,
    }),
    LEGAL: (o) => ({
      subject: `FOLLOW-UP: Data Erasure Request — ${o.companyName} — OVERDUE`,
      body: `To the Data Protection Officer,

Re: Follow-up to data erasure request dated ${o.formattedDate}

I refer to my original request for erasure of all personal data held by ${o.companyName}, submitted on ${o.formattedDate} pursuant to ${o.legalBasis}.

I note that the statutory response period of ${o.deadlineDays} calendar days has elapsed without any response or acknowledgment from your organization. This constitutes a breach of your obligations under the applicable data protection legislation.

I hereby formally request that you:
1. Process my original erasure request immediately
2. Confirm in writing the deletion of all personal data relating to me
3. Provide details of any third parties to whom my data was disclosed

Failure to respond within 14 calendar days will result in a formal complaint to ${o.dpaName || 'the competent supervisory authority'}.

Regards,
${o.fullName}
${o.email}`,
    }),
    AGGRESSIVE: (o) => ({
      subject: `FINAL NOTICE: Overdue Data Erasure Request — ${o.companyName}`,
      body: `To whom it may concern,

This is a final notice regarding my data erasure request dated ${o.formattedDate}.

Your organization has failed to respond within the ${o.deadlineDays}-day statutory period mandated by ${o.legalBasis}. You are now in violation of the law.

I demand immediate compliance with my original request. I require written confirmation that ALL personal data relating to me has been permanently erased from your systems, including backups, logs, and any third-party processors.

If I do not receive satisfactory confirmation within 14 days, I will file a formal complaint with ${o.dpaName || 'the relevant supervisory authority'} and reserve the right to pursue additional remedies available to me under the law.

${o.fullName}
${o.email}`,
    }),
  },
  DE: {
    SIMPLE: (o) => ({
      subject: `Nachfassung: Löschungsantrag — ${o.companyName}`,
      body: `Sehr geehrte Damen und Herren,

am ${o.formattedDate} habe ich einen Antrag auf Löschung meiner personenbezogenen Daten gemäß ${o.legalBasis} gestellt.

Die gesetzliche Antwortfrist von ${o.deadlineDays} Tagen ist verstrichen, ohne dass ich eine Antwort erhalten habe.

Ich bitte Sie, meinen ursprünglichen Antrag unverzüglich zu bearbeiten und mir die Löschung meiner Daten zu bestätigen.

Sollte ich innerhalb von 14 Tagen keine Antwort erhalten, werde ich eine formelle Beschwerde bei ${o.dpaName || 'der zuständigen Datenschutzbehörde'} einreichen.

Mit freundlichen Grüßen,
${o.fullName}
${o.email}`,
    }),
    LEGAL: (o) => ({
      subject: `NACHFASSUNG: Löschungsantrag — ${o.companyName} — ÜBERFÄLLIG`,
      body: `An den Datenschutzbeauftragten,

Betr.: Nachfassung zum Löschungsantrag vom ${o.formattedDate}

Ich beziehe mich auf meinen Antrag auf Löschung sämtlicher personenbezogener Daten bei ${o.companyName}, gestellt am ${o.formattedDate} gemäß ${o.legalBasis}.

Ich stelle fest, dass die gesetzliche Antwortfrist von ${o.deadlineDays} Kalendertagen ohne jegliche Antwort oder Bestätigung Ihrerseits verstrichen ist. Dies stellt einen Verstoß gegen Ihre Pflichten nach dem geltenden Datenschutzrecht dar.

Ich fordere Sie hiermit auf:
1. Meinen ursprünglichen Löschungsantrag unverzüglich zu bearbeiten
2. Die Löschung aller mich betreffenden personenbezogenen Daten schriftlich zu bestätigen
3. Angaben zu etwaigen Dritten zu machen, an die meine Daten weitergegeben wurden

Bei Nichtbeantwortung innerhalb von 14 Kalendertagen werde ich eine formelle Beschwerde bei ${o.dpaName || 'der zuständigen Aufsichtsbehörde'} einreichen.

Mit freundlichen Grüßen,
${o.fullName}
${o.email}`,
    }),
    AGGRESSIVE: (o) => ({
      subject: `LETZTE MAHNUNG: Überfälliger Löschungsantrag — ${o.companyName}`,
      body: `Sehr geehrte Damen und Herren,

dies ist eine letzte Mahnung bezüglich meines Löschungsantrags vom ${o.formattedDate}.

Ihre Organisation hat es versäumt, innerhalb der ${o.deadlineDays}-tägigen gesetzlichen Frist gemäß ${o.legalBasis} zu antworten. Sie befinden sich damit in Verstoß gegen geltendes Recht.

Ich fordere die unverzügliche Erfüllung meines ursprünglichen Antrags. Ich verlange eine schriftliche Bestätigung, dass ALLE mich betreffenden personenbezogenen Daten dauerhaft aus Ihren Systemen gelöscht wurden, einschließlich Backups, Protokolle und etwaiger Auftragsverarbeiter.

Sollte ich innerhalb von 14 Tagen keine zufriedenstellende Bestätigung erhalten, werde ich eine formelle Beschwerde bei ${o.dpaName || 'der zuständigen Aufsichtsbehörde'} einreichen und behalte mir alle weiteren rechtlichen Schritte vor.

${o.fullName}
${o.email}`,
    }),
  },
  FR: {
    SIMPLE: (o) => ({
      subject: `Relance : Demande de suppression — ${o.companyName}`,
      body: `Madame, Monsieur,

Le ${o.formattedDate}, j'ai soumis une demande de suppression de mes données personnelles conformément à ${o.legalBasis}.

Le délai légal de réponse de ${o.deadlineDays} jours est désormais dépassé sans réponse de votre part.

Je vous prie de traiter ma demande initiale sans délai et de confirmer la suppression de mes données.

Sans réponse sous 14 jours, je déposerai une plainte formelle auprès de ${o.dpaName || "l'autorité de protection des données compétente"}.

Cordialement,
${o.fullName}
${o.email}`,
    }),
    LEGAL: (o) => ({
      subject: `RELANCE : Demande d'effacement — ${o.companyName} — EN RETARD`,
      body: `Au Délégué à la Protection des Données,

Objet : Relance de la demande d'effacement du ${o.formattedDate}

Je me réfère à ma demande d'effacement de toutes les données personnelles détenues par ${o.companyName}, soumise le ${o.formattedDate} en vertu de ${o.legalBasis}.

Je constate que le délai légal de ${o.deadlineDays} jours calendaires s'est écoulé sans aucune réponse de votre organisation.

Je vous demande formellement de :
1. Traiter immédiatement ma demande d'effacement initiale
2. Confirmer par écrit la suppression de toutes mes données personnelles
3. Fournir les détails des tiers auxquels mes données ont été communiquées

À défaut de réponse sous 14 jours, je déposerai une plainte auprès de ${o.dpaName || "l'autorité de contrôle compétente"}.

Cordialement,
${o.fullName}
${o.email}`,
    }),
    AGGRESSIVE: (o) => ({
      subject: `DERNIER AVIS : Demande d'effacement en retard — ${o.companyName}`,
      body: `Madame, Monsieur,

Ceci est un dernier avis concernant ma demande d'effacement du ${o.formattedDate}.

Votre organisation n'a pas répondu dans le délai légal de ${o.deadlineDays} jours imposé par ${o.legalBasis}. Vous êtes en infraction.

J'exige le respect immédiat de ma demande initiale et une confirmation écrite de la suppression TOTALE de mes données personnelles, y compris sauvegardes, journaux et tout sous-traitant.

Sans confirmation satisfaisante sous 14 jours, je déposerai une plainte formelle auprès de ${o.dpaName || "l'autorité de contrôle compétente"}.

${o.fullName}
${o.email}`,
    }),
  },
  ES: {
    SIMPLE: (o) => ({
      subject: `Seguimiento: Solicitud de eliminación — ${o.companyName}`,
      body: `Estimados señores,

El ${o.formattedDate} presenté una solicitud de eliminación de mis datos personales conforme a ${o.legalBasis}.

El plazo legal de respuesta de ${o.deadlineDays} días ha transcurrido sin respuesta por su parte.

Les ruego tramiten mi solicitud original sin más demora y confirmen la eliminación de mis datos.

De no recibir respuesta en 14 días, presentaré una reclamación formal ante ${o.dpaName || 'la autoridad de protección de datos competente'}.

Atentamente,
${o.fullName}
${o.email}`,
    }),
    LEGAL: (o) => ({
      subject: `SEGUIMIENTO: Solicitud de supresión — ${o.companyName} — VENCIDA`,
      body: `Al Delegado de Protección de Datos,

Ref.: Seguimiento de la solicitud de supresión del ${o.formattedDate}

Me refiero a mi solicitud de supresión de todos los datos personales en poder de ${o.companyName}, presentada el ${o.formattedDate} en virtud de ${o.legalBasis}.

Constato que el plazo legal de ${o.deadlineDays} días ha transcurrido sin respuesta alguna. Esto constituye un incumplimiento de sus obligaciones.

Solicito formalmente:
1. El tratamiento inmediato de mi solicitud original
2. Confirmación por escrito de la eliminación de todos mis datos personales
3. Información sobre terceros a quienes se hayan comunicado mis datos

De no recibir respuesta en 14 días, presentaré una reclamación ante ${o.dpaName || 'la autoridad de control competente'}.

Atentamente,
${o.fullName}
${o.email}`,
    }),
    AGGRESSIVE: (o) => ({
      subject: `ÚLTIMO AVISO: Solicitud de supresión vencida — ${o.companyName}`,
      body: `A quien corresponda,

Este es un último aviso sobre mi solicitud de supresión del ${o.formattedDate}.

Su organización no ha respondido dentro del plazo legal de ${o.deadlineDays} días establecido por ${o.legalBasis}. Se encuentran en infracción de la ley.

Exijo el cumplimiento inmediato y confirmación por escrito de la eliminación TOTAL de mis datos personales, incluyendo copias de seguridad, registros y cualquier encargado del tratamiento.

Sin confirmación satisfactoria en 14 días, presentaré una reclamación ante ${o.dpaName || 'la autoridad de control competente'}.

${o.fullName}
${o.email}`,
    }),
  },
  IT: {
    SIMPLE: (o) => ({
      subject: `Sollecito: Richiesta di cancellazione — ${o.companyName}`,
      body: `Gentili Signori,

In data ${o.formattedDate} ho presentato una richiesta di cancellazione dei miei dati personali ai sensi de ${o.legalBasis}.

Il termine legale di risposta di ${o.deadlineDays} giorni è scaduto senza alcuna risposta.

Vi prego di evadere la mia richiesta originale senza ulteriori ritardi e di confermare la cancellazione dei miei dati.

In assenza di risposta entro 14 giorni, presenterò un reclamo formale presso ${o.dpaName || "l'autorità di protezione dei dati competente"}.

Cordiali saluti,
${o.fullName}
${o.email}`,
    }),
    LEGAL: (o) => ({
      subject: `SOLLECITO: Richiesta di cancellazione — ${o.companyName} — SCADUTA`,
      body: `Al Responsabile della Protezione dei Dati,

Oggetto: Sollecito alla richiesta di cancellazione del ${o.formattedDate}

Mi riferisco alla mia richiesta di cancellazione di tutti i dati personali detenuti da ${o.companyName}, presentata il ${o.formattedDate} ai sensi de ${o.legalBasis}.

Rilevo che il termine legale di ${o.deadlineDays} giorni è decorso senza alcuna risposta, in violazione dei Vostri obblighi.

Chiedo formalmente:
1. L'evasione immediata della richiesta originale
2. Conferma scritta della cancellazione di tutti i miei dati personali
3. Dettagli su eventuali terzi cui i miei dati sono stati comunicati

In assenza di risposta entro 14 giorni, presenterò reclamo presso ${o.dpaName || "l'autorità di controllo competente"}.

Cordiali saluti,
${o.fullName}
${o.email}`,
    }),
    AGGRESSIVE: (o) => ({
      subject: `ULTIMO AVVISO: Richiesta di cancellazione scaduta — ${o.companyName}`,
      body: `Alla cortese attenzione del responsabile,

Questo è un ultimo avviso riguardante la mia richiesta di cancellazione del ${o.formattedDate}.

La Vostra organizzazione non ha risposto entro il termine legale di ${o.deadlineDays} giorni previsto da ${o.legalBasis}. Siete in violazione della legge.

Esigo l'immediata conformità e conferma scritta della cancellazione TOTALE dei miei dati personali, inclusi backup, log e qualsiasi responsabile del trattamento.

In assenza di conferma soddisfacente entro 14 giorni, presenterò reclamo formale presso ${o.dpaName || "l'autorità di controllo competente"}.

${o.fullName}
${o.email}`,
    }),
  },
};

export function generateFollowUpEmail(options: FollowUpOptions): GeneratedEmail {
  const deadlineDays = DEADLINE_DAYS[options.jurisdiction];
  if (deadlineDays == null) {
    // Fail loudly — a silently-wrong deadline in a legal follow-up letter
    // (e.g. citing 30 days when LGPD is 15) is worse than a crash.
    throw new Error(`[follow-up] No DEADLINE_DAYS configured for jurisdiction: ${options.jurisdiction}`);
  }
  const legalBasis = LEGAL_BASIS[options.jurisdiction]?.[options.language]
    ?? LEGAL_BASIS[options.jurisdiction]?.EN
    ?? 'applicable data protection law';
  const formattedDate = formatDate(options.originalDate, options.language);

  let template = TEMPLATES[options.language]?.[options.style];
  if (!template) {
    console.warn(
      `follow-up: no template for ${options.language}/${options.style}, falling back to EN/${options.style}`,
    );
    template = TEMPLATES.EN[options.style] ?? TEMPLATES.EN.SIMPLE;
  }

  return template({ ...options, deadlineDays, legalBasis, formattedDate });
}
