export function getGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 0 && hour < 5) return 'boa madrugada';
  if (hour >= 5 && hour < 12) return 'bom dia';
  if (hour >= 12 && hour < 18) return 'boa tarde';
  return 'boa noite';
}

export function getDailyGoalMessage({
  pendingTasks,
  pendingExams,
}: {
  pendingTasks: number;
  pendingExams: number;
}): string {
  if (pendingTasks === 0 && pendingExams === 0) {
    return 'hoje está mais leve — dá para cuidar do que importa, respirar e seguir com calma ♡';
  }

  if (pendingTasks === 0 && pendingExams > 0) {
    return `a sua energia hoje está focada nas provas: ${pendingExams} ${pendingExams === 1 ? 'prova está' : 'provas estão'} na mira. vamos revisar com calma e confiança ♡`;
  }

  if (pendingTasks > 0 && pendingExams === 0) {
    return `hoje ainda tem ${pendingTasks} ${pendingTasks === 1 ? 'tarefa' : 'tarefas'} no seu caminho — o melhor é escolher uma e seguir passo a passo ♡`;
  }

  return `hoje tudo está misturado: ${pendingTasks} ${pendingTasks === 1 ? 'tarefa' : 'tarefas'} e ${pendingExams} ${pendingExams === 1 ? 'prova' : 'provas'} no radar. a ideia é fazer um pouco de cada coisa e manter o ritmo com carinho ♡`;
}
