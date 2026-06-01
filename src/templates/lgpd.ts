import { GeneratedEmail, TemplateStyle } from '../types';
type EffectiveProfile = { fullName: string; email: string; address?: string; phone?: string; includeSpeculative: boolean };

function buildIdentity(user: EffectiveProfile): string {
  const lines = [`Nome completo / Full Name: ${user.fullName}`, `E-mail / Email: ${user.email}`];
  if (user.address) lines.push(`Endereço / Address: ${user.address}`);
  if (user.phone) lines.push(`Telefone / Phone: ${user.phone}`);
  return lines.join('\n');
}

const speculativeClause = `\nCaso eu não possua uma conta ativa, solicito também a verificação e exclusão de perfis ocultos, listas de marketing ou registros de terceiros associados aos meus dados.`;

export function generateLgpdEmail(
  serviceName: string,
  user: EffectiveProfile,
  style: TemplateStyle,
): GeneratedEmail {
  const identity = buildIdentity(user);
  const speculative = user.includeSpeculative ? speculativeClause : '';

  if (style === 'SIMPLE') {
    return {
      subject: `Solicitação de Eliminação de Dados Pessoais — LGPD Art. 18`,
      body: `Prezada equipe de suporte,

Venho por meio desta solicitar a exclusão de minha conta e de todos os dados pessoais a mim associados, conforme previsto no Artigo 18 da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).

Meus dados:
${identity}${speculative}

Agradeço a confirmação da exclusão ou o contato caso seja necessária alguma informação adicional.

Atenciosamente,

${user.fullName}

P.S.: Não há insatisfação com seus serviços — estou apenas organizando minha presença digital. Obrigado/a pela compreensão. :)`.trim(),
    };
  }

  if (style === 'LEGAL') {
    return {
      subject: `Solicitação Formal de Eliminação de Dados — LGPD Art. 18 — ${user.fullName}`,
      body: `Ao Encarregado de Proteção de Dados (DPO) de ${serviceName},

Com fundamento no Art. 18, IV da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), solicito formalmente a eliminação de todos os dados pessoais que V.Sas. possuem sobre minha pessoa, bem como a comunicação a terceiros com quem os dados foram compartilhados.

Fundamentos do pedido:
— Dados desnecessários para a finalidade original (Art. 18, IV, LGPD)
— Revogação do consentimento (Art. 8º, § 5º, LGPD)
— Oposição ao tratamento (Art. 18, II, LGPD)

Dados do titular:
${identity}${speculative}

Solicito confirmação do atendimento no prazo de 15 dias, conforme Art. 18, § 3º da LGPD.

Atenciosamente,

${user.fullName}`.trim(),
    };
  }

  return {
    subject: `REQUERIMENTO LEGAL: ELIMINAÇÃO IMEDIATA DE DADOS — LGPD Art. 18`,
    body: `URGENTE: DEPARTAMENTO JURÍDICO / DPO

À ${serviceName},

Com fundamento na Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), Art. 18, IV, requeiro a ELIMINAÇÃO IMEDIATA de todos os dados pessoais a mim relacionados.

MEUS DADOS:
${identity}${speculative}

REQUERIMENTOS:
1. Eliminação de todos os dados vinculados aos meus identificadores.
2. Comunicação a terceiros para eliminação (Art. 18, VI, LGPD).
3. Confirmação por escrito no prazo de 15 dias (Art. 18, § 3º, LGPD).

O descumprimento será notificado à Autoridade Nacional de Proteção de Dados (ANPD).

${user.fullName}`.trim(),
  };
}
