// A projeção da camada clínica do Estágio.
//
// `SPEC-M-013` `D1`. Este arquivo existe porque o registro clínico **completo**
// não pode existir no mobile — e a forma de isso ser verdade é o dado não estar
// aqui, e não haver uma lista de exclusão em algum lugar.
//
// Origem, na spec referencial:
//   §1.6 linha 23       [D] três domínios separados, nunca compartilham tabela, id nem vínculo
//   §4.8 linha 471      [D] a camada clínica não sincroniza para o mobile
//   §4.8 linha 472      [D] lista fechada: iniciais, data, duração, "Para levar"
//   §4.8 linha 466      [D] identificado por código ou iniciais, nunca por documento ou idade
//   §5.1 linha 545      [D] a Ceci nunca lê — "regra fixa, não configuração"
//
// O registro completo vive no desktop, no store clínico separado
// (`SPEC-D-008` `D68`, `src-tauri/migrations/0004_clinico.sql`). O tradutor
// aplica a lista fechada de quatro campos **antes** de serializar
// (`SPEC-C-013` `D5`), e recusa campo que não conhece em vez de ignorá-lo.

/**
 * Os campos que atravessam.
 *
 * Esta lista é a **única** autorizada a sair do desktop, e ela aparece em quatro
 * lugares que precisam concordar:
 *
 * 1. aqui, como tipo;
 * 2. em `FIELD_ORDER`, que é a ordem do payload canônico;
 * 3. no `CHECK` da tabela `internship_clinical`, em `src/lib/db/migrations/user.ts`;
 * 4. no literal do tradutor, em `src-tauri/src/tradutor/` (`SPEC-D-008` `D69`).
 *
 * Campo novo entra **aqui** e nos outros três, ou não entra.
 */
export const CAMPOS_DA_PROJECAO = [
  'id',
  'iniciais',
  'data',
  'duracaoMin',
  'paraLevar',
] as const;

/** Um nome de campo da projeção. `never` fora da lista, e não `string`. */
export type CampoDaProjecao = (typeof CAMPOS_DA_PROJECAO)[number];

/**
 * A ordem do payload.
 *
 * Ela é fixa porque o payload é comparado byte a byte entre implementações
 * (Canonical JSON v1, `packages/contracts/src/canonical-json.ts`). Ordem que
 * "normalmente sai igual" não é contrato; ordem declarada é.
 */
export const FIELD_ORDER: readonly CampoDaProjecao[] = CAMPOS_DA_PROJECAO;

/**
 * A projeção da camada clínica. Cinco campos, e a lista é fechada.
 *
 * Não é um resumo de um registro maior: é o **único** registro que existe fora
 * do desktop. Não existe campo para nome, idade, diagnóstico, intervenção,
 * observação ou tema — e a ausência é deliberada, porque §4.8 linha 466 proíbe
 * por definição e não por configuração.
 */
export interface ClinicalProjection {
  readonly id: string;
  /** §4.8 linha 466 — iniciais ou código. Nunca nome completo, nunca documento. */
  readonly iniciais: string;
  /** ISO 8601 de data local do atendimento. */
  readonly data: string;
  /** Duração em minutos. */
  readonly duracaoMin: number;
  /**
   * §4.8 linha 472 — o único texto que vai para o mobile, e ela o escolhe
   * conscientemente. Vazio é uma escolha válida: "não levei nada" é informação.
   */
  readonly paraLevar: string;
}

/** Os nomes de campo sensível, para o gate e para o log. Não usar para filtrar. */
export const CAMPOS_SENSIVEIS_DO_REGISTRO_CLINICO = [
  'patient',
  'patientAge',
  'sessionNumber',
  'theme',
  'approach',
  'interventionNotes',
  'observations',
  'supervisionLogId',
  'discussedLogIds',
] as const;

/**
 * `true` se o registro tem campo que não pode atravessar.
 *
 * Existe para o gate e para o log de migração falarem do campo pelo nome. **Não**
 * é filtro: um filtro deixa passar o que não conhece, e §4.8 linha 545 diz que
 * isso é "regra fixa, não configuração".
 */
export function temCampoSensivel(registro: Readonly<Record<string, unknown>>): boolean {
  return CAMPOS_SENSIVEIS_DO_REGISTRO_CLINICO.some((campo) => campo in registro);
}

/** Nomes dos campos sensíveis presentes no registro, para a mensagem de erro. */
export function camposSensiveisPresentes(
  registro: Readonly<Record<string, unknown>>,
): CampoSensivelEncontrado[] {
  return CAMPOS_SENSIVEIS_DO_REGISTRO_CLINICO.filter((campo) => campo in registro);
}

export type CampoSensivelEncontrado = (typeof CAMPOS_SENSIVEIS_DO_REGISTRO_CLINICO)[number];