/**
 * Dias inteiros (≥ 0) entre hoje e uma data `YYYY-MM-DD`; `null` se a data é
 * inválida ou já passou.
 *
 * `SPEC-M-018 D13` — morava em `src/lib/tips.ts`, que foi removido na F3 porque
 * virou motor de frase. Isto **não** é voz: é cálculo de data civil, sem texto, e
 * depende de `DateKey` do domínio — nunca de `Date` cru (`SPEC-009`).
 *
 * Fica em arquivo próprio porque Home, Estudos e a ficha da matéria precisam dele,
 * e nenhum deles pode puxar a voz inteira para computar um número de dias.
 */
export function daysUntil(
  data: string | null | undefined,
  agora: Date = new Date(),
): number | null {
  if (!data) return null;
  const alvo = new Date(`${data}T00:00:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
  return diff >= 0 ? diff : null;
}
