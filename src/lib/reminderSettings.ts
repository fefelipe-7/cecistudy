/** Categorias de lembrete (SPEC-M-025 D12). */
export interface ReminderCategories {
  class: boolean;
  exam: boolean;
  task: boolean;
  thesis: boolean;
  internship: boolean;
  summary: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "HH:MM"
  categories: ReminderCategories;
}

export const DEFAULT_REMINDER_CATEGORIES: ReminderCategories = {
  class: true,
  exam: true,
  task: true,
  thesis: true,
  internship: true,
  summary: true,
};

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  time: '19:00',
  categories: DEFAULT_REMINDER_CATEGORIES,
};

/**
 * Ponte de leitura para o formato antigo de `reminder` (sem `categories`).
 *
 * `thesis` herda o on/off que morava no TCC; as outras categorias nascem
 * ligadas. Sem bump de schema: o valor antigo continua legível.
 */
export function normalizeReminderSettings(
  raw: Partial<ReminderSettings> | null | undefined,
  legacyThesisEnabled?: boolean,
): ReminderSettings {
  const hasCategories = raw?.categories != null;
  const categories: ReminderCategories = {
    ...DEFAULT_REMINDER_CATEGORIES,
    ...(raw?.categories ?? {}),
  };
  if (!hasCategories && legacyThesisEnabled === false) categories.thesis = false;
  return {
    enabled: raw?.enabled ?? false,
    time: raw?.time ?? DEFAULT_REMINDER.time,
    categories,
  };
}
