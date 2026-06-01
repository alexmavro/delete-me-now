import { Language, GeneratedEmail } from '../types';

interface ComplaintOptions {
  companyName: string;
  fullName: string;
  email: string;
  originalDate: string;
  followUpDate?: string;
  jurisdiction: 'GDPR' | 'CCPA' | 'UK_GDPR' | 'LGPD';
  language: Language;
  dpaName: string;
  companyAddress?: string;
}

function formatDate(iso: string, lang: Language): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const localeMap: Record<Language, string> = {
    EN: 'en-US', DE: 'de-DE', FR: 'fr-FR', ES: 'es-ES', IT: 'it-IT',
  };
  return d.toLocaleDateString(localeMap[lang], opts);
}

const TEMPLATES: Record<Language, (o: ComplaintOptions & { originalFormatted: string; followUpFormatted?: string }) => GeneratedEmail> = {
  EN: (o) => ({
    subject: `Complaint: ${o.companyName} — Failure to Comply with Data Erasure Request`,
    body: `Dear ${o.dpaName},

I am writing to file a formal complaint against ${o.companyName}${o.companyAddress ? ` (${o.companyAddress})` : ''} for failure to comply with my data erasure request.

Timeline of events:
- ${o.originalFormatted}: I submitted a data erasure request to ${o.companyName} via email
${o.followUpFormatted ? `- ${o.followUpFormatted}: I sent a follow-up request after receiving no response` : ''}
- As of today: I have not received a satisfactory response

The company has failed to comply with its obligations under applicable data protection law within the statutory response period.

I request that your authority:
1. Investigate this matter
2. Require the company to comply with my erasure request
3. Take appropriate enforcement action

My details:
Name: ${o.fullName}
Email: ${o.email}

I am happy to provide copies of my original correspondence upon request.

Yours sincerely,
${o.fullName}`,
  }),
  DE: (o) => ({
    subject: `Beschwerde: ${o.companyName} — Nichterfüllung des Löschungsantrags`,
    body: `Sehr geehrte Damen und Herren der ${o.dpaName},

ich möchte hiermit eine formelle Beschwerde gegen ${o.companyName}${o.companyAddress ? ` (${o.companyAddress})` : ''} einreichen wegen Nichterfüllung meines Löschungsantrags.

Chronologie:
- ${o.originalFormatted}: Einreichung meines Löschungsantrags bei ${o.companyName} per E-Mail
${o.followUpFormatted ? `- ${o.followUpFormatted}: Nachfassung nach ausbleibender Antwort` : ''}
- Bis heute: Keine zufriedenstellende Antwort erhalten

Das Unternehmen hat seine Pflichten nach dem geltenden Datenschutzrecht innerhalb der gesetzlichen Frist nicht erfüllt.

Ich bitte Ihre Behörde:
1. Die Angelegenheit zu untersuchen
2. Das Unternehmen zur Erfüllung meines Löschungsantrags aufzufordern
3. Geeignete Durchsetzungsmaßnahmen zu ergreifen

Meine Angaben:
Name: ${o.fullName}
E-Mail: ${o.email}

Kopien meiner ursprünglichen Korrespondenz stelle ich gerne auf Anfrage zur Verfügung.

Mit freundlichen Grüßen,
${o.fullName}`,
  }),
  FR: (o) => ({
    subject: `Plainte : ${o.companyName} — Non-respect de la demande d'effacement`,
    body: `Madame, Monsieur,

Je souhaite déposer une plainte formelle contre ${o.companyName}${o.companyAddress ? ` (${o.companyAddress})` : ''} pour non-respect de ma demande d'effacement de données.

Chronologie :
- ${o.originalFormatted} : Soumission de ma demande d'effacement à ${o.companyName} par e-mail
${o.followUpFormatted ? `- ${o.followUpFormatted} : Relance après absence de réponse` : ''}
- À ce jour : Aucune réponse satisfaisante reçue

L'entreprise n'a pas respecté ses obligations dans le délai légal.

Je demande à votre autorité de :
1. Enquêter sur cette affaire
2. Exiger la conformité de l'entreprise
3. Prendre les mesures d'exécution appropriées

Mes coordonnées :
Nom : ${o.fullName}
E-mail : ${o.email}

Je reste à disposition pour fournir des copies de ma correspondance.

Cordialement,
${o.fullName}`,
  }),
  ES: (o) => ({
    subject: `Reclamación: ${o.companyName} — Incumplimiento de solicitud de supresión`,
    body: `Estimados señores de la ${o.dpaName},

Deseo presentar una reclamación formal contra ${o.companyName}${o.companyAddress ? ` (${o.companyAddress})` : ''} por incumplimiento de mi solicitud de supresión de datos.

Cronología:
- ${o.originalFormatted}: Presentación de mi solicitud de supresión a ${o.companyName} por correo electrónico
${o.followUpFormatted ? `- ${o.followUpFormatted}: Seguimiento tras la falta de respuesta` : ''}
- A la fecha: No he recibido una respuesta satisfactoria

La empresa no ha cumplido con sus obligaciones dentro del plazo legal.

Solicito a su autoridad:
1. Investigar este asunto
2. Requerir a la empresa el cumplimiento
3. Tomar las medidas de ejecución apropiadas

Mis datos:
Nombre: ${o.fullName}
Correo electrónico: ${o.email}

Quedo a disposición para proporcionar copias de mi correspondencia.

Atentamente,
${o.fullName}`,
  }),
  IT: (o) => ({
    subject: `Reclamo: ${o.companyName} — Mancato rispetto della richiesta di cancellazione`,
    body: `Gentile ${o.dpaName},

Desidero presentare un reclamo formale contro ${o.companyName}${o.companyAddress ? ` (${o.companyAddress})` : ''} per mancato rispetto della mia richiesta di cancellazione dei dati.

Cronologia:
- ${o.originalFormatted}: Presentazione della richiesta di cancellazione a ${o.companyName} via e-mail
${o.followUpFormatted ? `- ${o.followUpFormatted}: Sollecito dopo mancata risposta` : ''}
- Ad oggi: Nessuna risposta soddisfacente ricevuta

L'azienda non ha adempiuto ai propri obblighi entro il termine di legge.

Chiedo alla Vostra autorità di:
1. Indagare sulla questione
2. Richiedere all'azienda la conformità
3. Adottare le misure esecutive appropriate

I miei dati:
Nome: ${o.fullName}
E-mail: ${o.email}

Resto a disposizione per fornire copie della mia corrispondenza.

Cordiali saluti,
${o.fullName}`,
  }),
};

export function generateDpaComplaint(options: ComplaintOptions): GeneratedEmail {
  const originalFormatted = formatDate(options.originalDate, options.language);
  const followUpFormatted = options.followUpDate
    ? formatDate(options.followUpDate, options.language)
    : undefined;

  let template = TEMPLATES[options.language];
  if (!template) {
    console.warn(`dpa-complaint: no template for ${options.language}, falling back to EN`);
    template = TEMPLATES.EN;
  }
  return template({ ...options, originalFormatted, followUpFormatted });
}
