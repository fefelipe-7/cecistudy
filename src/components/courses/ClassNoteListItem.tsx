import React from 'react';
import { BookOpen, ChevronRight, HelpCircle } from 'lucide-react';
import { ClassNote } from '../../types';
import { StarRating } from '../ui/StarRating';
import { useMobileApp } from '@/context/mobileApp';
import { useLongPress } from '../../lib/useLongPress';

interface ClassNoteListItemProps {
  note: ClassNote;
  onClick: () => void;
  showExtras?: boolean;
}

export const ClassNoteListItem: React.FC<ClassNoteListItemProps> = ({
  note,
  onClick,
  showExtras = false,
}) => {
  const { openManageItem } = useMobileApp();
  const handlers = useLongPress({
    onLongPress: () => openManageItem('class', note.id),
    onClick,
  });
  return (
    <div
      {...handlers}
      data-target={note.id}
      role="button"
      tabIndex={0}
      aria-label={`ver anotação: ${note.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="py-3.5 space-y-1.5 cursor-pointer group hover:bg-surface-muted/50 px-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-1"
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ceci-brand-strong text-[11px]">aula {note.number}</span>
          {note.rating ? <StarRating value={note.rating} size="sm" /> : null}
        </div>
        <span className="text-[11px] text-ceci-tertiary font-medium">{note.date}</span>
      </div>

      <h4 className="font-display font-bold text-sm text-ceci-primary group-hover:text-ceci-brand-strong transition-colors leading-tight">
        {note.title}
      </h4>

      <p className="text-xs text-ceci-secondary line-clamp-2 leading-relaxed">
        {note.summary}
      </p>

      {showExtras && (
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-ceci-academic-strong font-medium flex items-center gap-1">
            {note.materials && note.materials.length > 0 ? (
              <>
                <BookOpen className="w-3 h-3" />
                <span>
                  {note.materials.length}{' '}
                  {note.materials.length === 1 ? 'material anexo' : 'materiais anexos'}
                </span>
              </>
            ) : note.hasQuestions ? (
              <>
                <HelpCircle className="w-3 h-3" />
                <span>com dúvidas pra tirar</span>
              </>
            ) : null}
          </span>
          <span className="font-semibold text-ceci-brand-strong flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            ver anotação <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
};
