export type ItemType = 'evento' | 'responsabilidade' | 'bloco';

export type SubCategory =
  | 'aula'
  | 'prova'
  | 'apresentacao'
  | 'reuniao'
  | 'estudo'
  | 'revisao'
  | 'bloco_tcc'
  | 'leitura'
  | 'entrega'
  | 'externo'
  | 'outro';

export type LayerType = 'faculdade' | 'tcc' | 'estudos' | 'marketing' | 'google_calendar';

export type CommitmentLevel = 'obrigatorio' | 'importante' | 'recomendado' | 'opcional';

export type ItemStatus =
  | 'planejado'
  | 'em_andamento'
  | 'concluido'
  | 'adiado'
  | 'nao_realizado'
  | 'cancelado'
  | 'dispensado';

export interface Etapa {
  id: string;
  title: string;
  completed: boolean;
}

export interface ExecutionRecord {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  notes?: string;
  completed: boolean;
  recordedAt: string;
}

export interface LinkedResource {
  id: string;
  type: 'tcc' | 'faculdade' | 'conhecimento' | 'estudos' | 'external';
  title: string;
  subtitle?: string;
}

export interface RecurrenceRule {
  frequency: 'weekly' | 'daily' | 'biweekly';
  daysOfWeek: number[]; // 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex
  startDate: string;
  endDate?: string;
}

export interface CalendarItem {
  id: string;
  title: string;
  type: ItemType;
  category: SubCategory;
  categoryLabel: string;
  layer: LayerType;
  commitment: CommitmentLevel;
  status: ItemStatus;
  date: string; // YYYY-MM-DD
  startTime: string; // "08:00"
  endTime: string; // "09:30"
  isAllDay?: boolean;
  plannedDurationMinutes: number;
  actualExecution?: ExecutionRecord;
  etapas: Etapa[];
  links: LinkedResource[];
  notes?: string;
  hasWarning?: boolean;
  warningText?: string;
  recurrence?: RecurrenceRule;
  googleCalendarSync?: {
    synced: boolean;
    lastSyncedAt: string;
    source: 'cecistudy' | 'google';
    readOnly?: boolean;
  };
}

export interface LayerConfig {
  id: LayerType;
  label: string;
  colorHex: string;
  borderHex: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  visible: boolean;
}

export type ViewMode = 'dia' | 'semana' | 'mes' | 'agenda';

export interface SubjectHoursProgress {
  id: string;
  code: string;
  name: string;
  layer: LayerType;
  colorHex: string;
  totalRequiredHours: number; // ex: 60h
  completedHours: number; // ex: 28h
  plannedHoursThisWeek: number; // ex: 3.5h
  credits: number; // ex: 4 créditos
  professor?: string;
  semester: string; // "2025.1"
}

export interface ComplementaryActivity {
  id: string;
  title: string;
  category: 'pesquisa' | 'extensao' | 'ensino' | 'cultural' | 'outro';
  categoryLabel: string;
  hours: number;
  date: string;
  institution: string;
  validated: boolean;
  certificateUrl?: string;
}

export interface CeciSuggestion {
  id: string;
  title: string;
  description: string;
  layer: LayerType;
  category: SubCategory;
  targetDate: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  commitment: CommitmentLevel;
  reason: string;
}

export interface WeeklyHoursStats {
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
  byLayer: Record<LayerType, { plannedMinutes: number; completedMinutes: number; count: number }>;
  bySubject: Record<string, { plannedMinutes: number; completedMinutes: number }>;
  focusSessionsCount: number;
  efficiencyRate: number; // 0 - 100%
}
