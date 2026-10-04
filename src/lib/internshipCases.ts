import type { ClinicalProjection, InternshipLog } from '../types';
import { CAMPOS_DA_PROJECAO, CAMPOS_SENSIVEIS_DO_REGISTRO_CLINICO } from '../types/clinical';
import type { CampoDaProjecao } from '../types/clinical';

/**
 * A visão "por paciente/caso" do estágio.
 *
 * Ela é derivada da **projeção** (`ClinicalProjection`) e não do registro clínico,
 * e a distinção é `SPEC-M-013` `D1`: o registro completo não existe no mobile, e
 * o que existe são cinco campos. Antes desta spec, a visão agrupava
 * `InternshipLog` com `type === 'atendimento_clinico'` e lia `patient`,
 * `sessionNumber` e `supervisionLogId` — três campos que §4.8 linha 466 e 472
 * proíem que estejam no aparelho.
 *
 * Consequência visível: a visão agrupava por nome de paciente e agora agrupa por
 * **iniciais ou código**, que é o que §4.8 linha 466 autoriza. E o total passou
 * de horas para **minutos**, porque a projeção guarda `duracaoMin` e não `hours` —
 * converter seria inventar precisão que o dado de origem não tem.
 */

export interface DerivedCase {
  /** Chave de agrupamento (iniciais normalizadas: minúsculas + sem espaços). */
  patientKey: string;
  /** Rótulo exibível — iniciais ou código, nunca nome. §4.8 linha 466. */
  patientLabel: string;
  /** Projeções do caso, ordenadas por data. */
  projections: readonly ClinicalProjection[];
  /** Soma de `duracaoMin`, em minutos. */
  totalMin: number;
  lastSessionDate: string;
  /** Projeções sem "Para levar" — o texto que ela escolheu levar. */
  pendingParaLevar: number;
  /** Projeções que nenhuma supervisão registrou como discutidas. */
  pendingSupervision: number;
}

function iniciaisNormalizadas(iniciais: string): string {
  return iniciais.trim().toLowerCase();
}

function dataNumerica(data: string): number {
  return new Date(data).getTime();
}

/**
 * Deriva a visão por caso a partir das projeções.
 *
 * `supervisoes` entra separado porque a relação é um campo da **supervisão**
 * (`discussedClinicalIds`), não da projeção: a projeção não sabe se foi
 * discutida, e afirmar que sabe seria inventar estado.
 */
export function deriveCases(
  projections: readonly ClinicalProjection[],
  supervisoes: readonly InternshipLog[] = [],
): DerivedCase[] {
  const discutidas = new Set(supervisoes.flatMap((s) => s.discussedClinicalIds ?? []));

  const porIniciais = new Map<string, ClinicalProjection[]>();
  for (const projecao of projections) {
    if (!projecao.iniciais.trim()) continue;
    const key = iniciaisNormalizadas(projecao.iniciais);
    const lista = porIniciais.get(key);
    if (lista) lista.push(projecao);
    else porIniciais.set(key, [projecao]);
  }

  const cases: DerivedCase[] = [];

  for (const [key, lista] of porIniciais) {
    const ordenadas = [...lista].sort((a, b) => dataNumerica(a.data) - dataNumerica(b.data));
    const ultima = ordenadas[ordenadas.length - 1];
    cases.push({
      patientKey: key,
      // O rótulo vem da projeção **não normalizada**: normalizar minúsculas
      // serviria para agrupar, não para exibir.
      patientLabel: ordenadas[0]?.iniciais.trim() ?? '',
      projections: ordenadas,
      totalMin: ordenadas.reduce((acc, p) => acc + p.duracaoMin, 0),
      lastSessionDate: ultima?.data ?? '',
      pendingParaLevar: ordenadas.filter((p) => !p.paraLevar.trim()).length,
      pendingSupervision: ordenadas.filter((p) => !discutidas.has(p.id)).length,
    });
  }

  // Mais recente primeiro.
  cases.sort((a, b) => (a.lastSessionDate < b.lastSessionDate ? 1 : -1));

  return cases;
}

/**
 * Campos que a projeção **não** pode ter.
 *
 * Existe para o gate e para o tipo. Não é filtro: `SPEC-M-013` `D5` diz que a
 * lista é o artefato, e `D3` diz que o schema é estrito. A função existe para o
 * **log de migração** poder dizer o que descartou, e para o gate afirmar que a
 * lista não cresceu.
 */
export const CAMPOS_QUE_NAO_ATRAVESSAM = CAMPOS_SENSIVEIS_DO_REGISTRO_CLINICO;

/** `true` se o objeto tem algum campo fora da lista fechada. */
export function temCampoForaDaLista(
  objeto: Readonly<Record<string, unknown>>,
): { dentro: false; campos: string[] } | { dentro: true; campos: [] } {
  const campos = Object.keys(objeto).filter(
    (k) => !CAMPOS_DA_PROJECAO.includes(k as CampoDaProjecao),
  );
  return campos.length === 0 ? { dentro: true, campos: [] } : { dentro: false, campos };
}