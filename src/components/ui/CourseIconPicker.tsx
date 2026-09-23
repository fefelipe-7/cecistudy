import React from 'react';
import { cn } from '@/lib/utils';
import { COURSE_EMOJIS, COURSE_ICON_OPTIONS } from '@/lib/courseOptions';
import type { CourseIconName } from '@/types';
import { CourseIcon } from './CourseIcon';

interface CourseIconPickerProps {
  /** Valor atual: emoji OU nome Lucide (SPEC-004). */
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

/**
 * Seletor único de ícone de disciplina em duas grades: emojis (texto, SPEC-004)
 * e ícones Lucide (16). Emoji salvo vira o próprio `Course.icon`.
 */
export const CourseIconPicker: React.FC<CourseIconPickerProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          emoji
        </span>
        <div className="grid grid-cols-8 gap-1.5">
          {COURSE_EMOJIS.map((e) => {
            const sel = value === e;
            return (
              <button
                key={e}
                type="button"
                onClick={() => onChange(e)}
                aria-pressed={sel}
                aria-label={`emoji ${e}`}
                className={cn(
                  'flex items-center justify-center text-2xl leading-none rounded-xl h-11 transition cursor-pointer active:scale-95',
                  sel
                    ? 'bg-surface-rose border-2 border-ceci-border-brand scale-95'
                    : 'border-2 border-transparent bg-surface-muted hover:bg-surface-subtle'
                )}
              >
                {e}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          ícone
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {COURSE_ICON_OPTIONS.map((o) => {
            const sel = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                aria-pressed={sel}
                aria-label={`ícone ${o.label}`}
                className={cn(
                  'flex items-center gap-1.5 justify-center rounded-xl h-11 transition cursor-pointer active:scale-95 px-2',
                  sel
                    ? 'bg-surface-rose border-2 border-ceci-border-brand text-ceci-brand-strong'
                    : 'border-2 border-transparent bg-surface-muted text-ceci-secondary hover:bg-surface-subtle'
                )}
              >
                <CourseIcon icon={o.value as CourseIconName} className="w-4 h-4" />
                <span className="text-[11px] font-semibold leading-none">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};