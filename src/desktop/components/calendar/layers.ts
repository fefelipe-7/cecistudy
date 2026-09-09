import type { LucideIcon } from 'lucide-react';
import {
  GraduationCap,
  AlertCircle,
  Paperclip,
  FileText,
  BookOpen,
  Calendar as CalIcon,
} from 'lucide-react';
import type { CalendarLayer, CalendarSubtype } from '../../../lib/schedule';

/** Cores e rótulos de cada camada, mapeados aos tokens do design system. */
export const LAYER_META: Record<
  CalendarLayer,
  { label: string; bg: string; fg: string; border: string }
> = {
  faculdade: {
    label: 'faculdade',
    bg: 'var(--ds-layer-faculdade-bg)',
    fg: 'var(--ds-layer-faculdade)',
    border: 'var(--ds-layer-faculdade-border)',
  },
  tcc: {
    label: 'tcc',
    bg: 'var(--ds-layer-tcc-bg)',
    fg: 'var(--ds-layer-tcc)',
    border: 'var(--ds-layer-tcc-border)',
  },
  estudos: {
    label: 'estudos',
    bg: 'var(--ds-layer-estudos-bg)',
    fg: 'var(--ds-layer-estudos)',
    border: 'var(--ds-layer-estudos-border)',
  },
  gcal: {
    label: 'google calendar',
    bg: 'var(--ds-layer-externo-bg)',
    fg: 'var(--ds-layer-externo)',
    border: 'var(--ds-layer-externo-border)',
  },
};

export const SUBTYPE_ICON: Record<CalendarSubtype, LucideIcon> = {
  aula: GraduationCap,
  prova: AlertCircle,
  tarefa: Paperclip,
  tcc: FileText,
  estudo: BookOpen,
  externo: CalIcon,
};

export const CALENDAR_LAYERS: CalendarLayer[] = ['faculdade', 'tcc', 'estudos', 'gcal'];
