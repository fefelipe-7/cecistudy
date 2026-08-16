/** Escolhe um item do conjunto usando a data como semente (varia por dia, estável no render). */
function pickForDay<T>(items: T[], date = new Date()): T {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return items[seed % items.length];
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 0 && hour < 5) return 'boa madrugada';
  if (hour >= 5 && hour < 12) return 'bom dia';
  if (hour >= 12 && hour < 18) return 'boa tarde';
  return 'boa noite';
}

const NO_PENDING_PHRASES = [
  'hoje está mais leve — dá para cuidar do que importa, respirar e seguir com calma ♡',
  'dia tranquilo por aqui: sem pendências, sobra tempo para o que é gostoso ♡',
  'sem nada no radar hoje — que tal adiantar uma revisão ou só descansar a mente? ♡',
  'um dia aberto e sem correria: perfeito para cuidar de você e do seu cantinho ♡',
  'nada urgente hoje, hein? respira fundo e aproveita o ritmo leve ♡',
];

const EXAMS_ONLY_PHRASES = [
  (n: number) =>
    `a sua energia hoje está focada nas provas: ${n} ${n === 1 ? 'prova está' : 'provas estão'} na mira. vamos revisar com calma e confiança ♡`,
  (n: number) =>
    `só prova no horizonte hoje (${n}) — sem tarefa acumulada, dá para estudar com foco e leveza ♡`,
  (n: number) =>
    `hoje o dia é de ${n === 1 ? 'prova' : 'provas'}: respira, revisa o essencial e confia no que você já construiu ♡`,
];

const TASKS_ONLY_PHRASES = [
  (n: number) =>
    `hoje ainda tem ${n} ${n === 1 ? 'tarefa' : 'tarefas'} no seu caminho — o melhor é escolher uma e seguir passo a passo ♡`,
  (n: number) =>
    `${n} ${n === 1 ? 'tarefa te espera' : 'tarefas te esperam'} hoje. começa pela mais leve e o resto flui ♡`,
  (n: number) =>
    `dia de ${n} ${n === 1 ? 'tarefa' : 'tarefas'} — um passinho de cada vez e o cantinho fica em dia ♡`,
];

const MIXED_PHRASES = [
  (tasks: number, exams: number) =>
    `hoje tudo está misturado: ${tasks} ${tasks === 1 ? 'tarefa' : 'tarefas'} e ${exams} ${exams === 1 ? 'prova' : 'provas'} no radar. a ideia é fazer um pouco de cada coisa e manter o ritmo com carinho ♡`,
  (tasks: number, exams: number) =>
    `${tasks} ${tasks === 1 ? 'tarefa' : 'tarefas'} e ${exams} ${exams === 1 ? 'prova' : 'provas'} para hoje — organiza por prioridade e bora com calma ♡`,
  (tasks: number, exams: number) =>
    `dia cheio de carinho e organização: ${tasks} ${tasks === 1 ? 'tarefa' : 'tarefas'} e ${exams} ${exams === 1 ? 'prova' : 'provas'} te esperam ♡`,
];

export function getDailyGoalMessage(
  {
    pendingTasks,
    pendingExams,
  }: {
    pendingTasks: number;
    pendingExams: number;
  },
  date = new Date()
): string {
  if (pendingTasks === 0 && pendingExams === 0) {
    return pickForDay(NO_PENDING_PHRASES, date);
  }

  if (pendingTasks === 0 && pendingExams > 0) {
    return pickForDay(EXAMS_ONLY_PHRASES, date)(pendingExams);
  }

  if (pendingTasks > 0 && pendingExams === 0) {
    return pickForDay(TASKS_ONLY_PHRASES, date)(pendingTasks);
  }

  return pickForDay(MIXED_PHRASES, date)(pendingTasks, pendingExams);
}
