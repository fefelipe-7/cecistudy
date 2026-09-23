/**
 * Opções compartilhadas de cor/ícone de disciplina.
 *
 * Cores: 18 hex espelhando as escalas `@theme` do `src/index.css` (variações
 * 400/500/600/700 de rose, blue, green, yellow, red, beige) — são DADOS (usados
 * via `style={{}}`), não tokens de classe. As 7 cores históricas permanecem.
 *
 * Ícones: valores que resolvem no `COURSE_ICON_MAP` (ui/CourseIcon.tsx) via
 * `COURSE_ICON_NAMES`. Emojis (`COURSE_EMOJIS`) também são salvos em `Course.icon`
 * (SPEC-004) e renderizados como texto.
 */
export const COURSE_COLORS = [
  // rose
  '#F596AA',
  '#E97891',
  '#D85F79',
  '#B94862',
  // blue
  '#83BCD0',
  '#609FB8',
  '#4A879F',
  '#396D82',
  // green
  '#8BC7A2',
  '#5A9F76',
  '#43805B',
  // yellow
  '#E8C36D',
  '#BD913C',
  // red
  '#E89189',
  '#D97A72',
  '#A8514B',
  // beige
  '#AD9986',
  '#756354',
] as const;

export const COURSE_ICON_OPTIONS: Array<{ value: string; label: string; emoji: string }> = [
  { value: 'Brain', label: 'psicologia', emoji: '🧠' },
  { value: 'FileText', label: 'conteúdo', emoji: '📄' },
  { value: 'Sparkles', label: 'inovação', emoji: '✨' },
  { value: 'Users', label: 'grupo', emoji: '👥' },
  { value: 'HeartHandshake', label: 'clínica', emoji: '🤝' },
  { value: 'GraduationCap', label: 'acadêmico', emoji: '🎓' },
  { value: 'Landmark', label: 'sociedade', emoji: '🏛️' },
  { value: 'Flame', label: 'energia', emoji: '🔥' },
  { value: 'Target', label: 'foco', emoji: '🎯' },
  { value: 'Trophy', label: 'conquista', emoji: '🏆' },
  { value: 'Clock', label: 'rotina', emoji: '🕐' },
  { value: 'BookOpen', label: 'leitura', emoji: '📖' },
  { value: 'History', label: 'história', emoji: '🕰️' },
  { value: 'Lightbulb', label: 'ideia', emoji: '💡' },
  { value: 'User', label: 'pessoa', emoji: '🧑' },
  { value: 'Wrench', label: 'ferramenta', emoji: '🔧' },
];

/**
 * Emojis que podem ser salvos como ícone de disciplina (SPEC-004): curados de
 * psico/clínica, academia, natureza/afeto e arte/ferramentas. Renderizados como
 * texto na cor da disciplina.
 */
export const COURSE_EMOJIS: readonly string[] = [
  // classe psicologia
  '🧠', '📚', '✍️', '📝', '🎓', '🔬', '🧬', '🧩', '💭',
  // academia
  '🏛️', '⚖️', '💊', '🎯', '⏳', '📈', '🧭', '🪶',
  // natureza & afeto
  '🌸', '🦋', '🌱', '🐝', '🦉', '🐢', '🐋', '🐈', '🌼', '🍀', '🌙', '☀️',
  // arte & ferramentas
  '🎨', '🎸', '📷', '⚗️', '🧵', '🗿', '🧘', '✨',
];

/** Heurística para `Course.icon`: verdadeiro quando o valor é um emoji salvo. */
export function isEmojiIcon(icon?: string): boolean {
  return !!icon && icon.length <= 8 && /[^\u0000-\u007F]/.test(icon);
}