import React, { useState } from 'react';
import { ChevronDown, Link2, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PillGroup } from '../ui/PillGroup';
import { Picker } from '../ui/Picker';
import { LOOSE_CATEGORIES, type ComposeMode } from '@/lib/composeLogic';
import type { LooseNote } from '@/types/entity';

const CATEGORY_EMOJI: Record<LooseNote['category'], string> = {
  'reflexão': '💭',
  'estudo': '📚',
  'ideia': '✨',
  'lembrete': '📌',
};

interface ComposeConfigAccordionProps {
  mode: ComposeMode;
  category: LooseNote['category'];
  onCategoryChange: (c: LooseNote['category']) => void;
  courseId: string | undefined;
  onCourseIdChange: (id: string | undefined) => void;
  courses: { id: string; name: string }[];
  emptyMessage?: string;
}

/** Detalhes da nota avulsa: categoria + vínculo com a matéria (antes, esquecia a aula!). */
export const ComposeConfigAccordion: React.FC<ComposeConfigAccordionProps> = ({
  mode,
  category,
  onCategoryChange,
  courseId,
  onCourseIdChange,
  courses,
}) => {
  const [open, setOpen] = useState(false);
  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <div className="bg-surface-default border border-ceci-border-default rounded-[16px] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 cursor-pointer hover:bg-surface-muted transition-colors text-left"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ceci-secondary">
          <Tags className="w-3.5 h-3.5 text-ceci-tertiary" />
          categoria
          <span className="text-ceci-tertiary font-medium">
            · {CATEGORY_EMOJI[category]} {category}
          </span>
          {courseId && (
            <span className="inline-flex items-center gap-1 text-ceci-academic-strong">
              <Link2 className="w-3 h-3" />
              {selectedCourse?.name ?? 'matéria'}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 text-ceci-tertiary transition-transform shrink-0', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="px-3.5 pb-3 pt-1 space-y-3 border-t border-ceci-border-subtle">
          <PillGroup
            variant="rose"
            size="sm"
            options={LOOSE_CATEGORIES.map((cat) => ({
              value: cat,
              label: `${CATEGORY_EMOJI[cat]} ${cat}`,
            }))}
            value={category}
            onChange={(v) => onCategoryChange(v)}
          />

          {mode === 'avulsa' && courses.length > 0 && (
            <div className="space-y-1.5">
              <Picker
                value={courseId ?? ''}
                onChange={(v) => onCourseIdChange(v || undefined)}
                options={courses.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="sem vínculo (opcional)"
                buttonClassName="bg-surface-subtle rounded-xl px-3.5 py-2.5 text-[11px] border border-ceci-border-default"
                sheetTitle="vincular com uma matéria"
                clearable
              />
              <p className="text-[10px] text-ceci-tertiary leading-snug px-0.5">
                vínculo com a matéria para a nota aparecer lá também ♡
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};