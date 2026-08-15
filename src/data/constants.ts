/**
 * Dados estáticos de UI (constantes do produto).
 *
 * Diferente dos dados do usuário, estes não são editáveis nem persistidos —
 * são listas/opções que as views renderizam. Viver aqui as mantém fora do JSX.
 */

/** Chips de intenção de estudo (EstadoDeEspiritoView). */
export const INTENTION_CHIPS = [
  'estudo leve e produtivo',
  'foco total em exames',
  'avançar no tcc',
  'leitura sem pressa',
  'organizar cronograma',
];

/** Explicação do que conta como "dia ativo" na streak (StreakView). */
export const STREAK_WHAT_COUNTS = [
  'concluir uma tarefa',
  'anotar uma aula',
  'registrar uma sessão de foco',
  'revisar um flashcard',
  'avançar uma leitura',
];

/** Labels dos dias da semana (streak/home). */
export const WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
