/** Formata minutos de estudo em "Xh Ymin" / "Xmin". */
export function formatStudyTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

/** Reflexão de jornada derivada do semestre atual (voz carinhosa do cantinho). */
export function getJourneyReflection(semester: number, total: number): string {
  const half = Math.ceil(total / 2);
  if (semester < half) {
    return `no ${semester}º semestre, cada aula e leitura é um alicerce novo — a teoria vai se transformando em forma de ver o mundo. sem pressa, com carinho.`;
  }
  if (semester === half) {
    return `metade da graduação! no ${semester}º semestre a teoria ganha vida na prática do estágio e na estruturação do tcc. cada aula é um tijolinho na construção da profissional que estou me tornando.`;
  }
  return `no ${semester}º semestre, a caminhada está bem encaminhada — entre estágio, tcc e práticas, cada registro vira cuidado e conhecimento. falta pouco para a formatura ♡`;
}