import React from 'react';
import {
  HeartHandshake,
  Stethoscope,
  Compass,
  Users,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { InternshipLogType } from '../../types';
import { cn } from '@/lib/utils';

/**
 * Identidade por tipo (`SPEC-009 §9.1`).
 *
 * Antes o badge era **sempre rosa** (`InternshipLogCard.tsx`), o que fazia a mesma
 * supervisão aparecer rosa no diário e azul na aba de supervisão. Aqui a cor é
 * parte do tipo: campo é rosa, orientação profissional é azul, o resto é neutro.
 */
const TYPE_META: Record<
  InternshipLogType,
  { label: string; Icon: LucideIcon; chip: string; card: string }
> = {
  estagio: {
    label: 'estágio',
    Icon: HeartHandshake,
    chip: 'bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong',
    card: 'bg-surface-rose',
  },
  atendimento_clinico: {
    label: 'atendimento clínico',
    Icon: Stethoscope,
    chip: 'bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong',
    card: 'bg-surface-rose',
  },
  supervisao: {
    label: 'supervisão',
    Icon: Compass,
    chip: 'bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong',
    card: 'bg-surface-blue',
  },
  intervisao: {
    label: 'intervisão',
    Icon: Users,
    chip: 'bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong',
    card: 'bg-surface-blue',
  },
  outro: {
    label: 'outro',
    Icon: Sparkles,
    chip: 'bg-surface-muted border border-ceci-border-subtle text-ceci-secondary',
    card: 'bg-surface-muted',
  },
};

/** `type` nunca chega undefined: dados antigos caem em `estagio` (invariante `I7`). */
export const typeMeta = (type: InternshipLogType): (typeof TYPE_META)[InternshipLogType] =>
  TYPE_META[type] ?? TYPE_META.outro;

export const LogTypeBadge: React.FC<{
  type: InternshipLogType;
  className?: string;
}> = ({ type, className }) => {
  const meta = typeMeta(type);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full',
        meta.chip,
        className
      )}
    >
      <meta.Icon className="w-3 h-3" aria-hidden />
      {meta.label}
    </span>
  );
};

/** Mapa de rótulo para a copy e para os testes. */
export const INTERNSHIP_TYPE_LABEL: Record<InternshipLogType, string> = {
  estagio: 'estágio',
  atendimento_clinico: 'atendimento clínico',
  supervisao: 'supervisão',
  intervisao: 'intervisão',
  outro: 'outro',
};