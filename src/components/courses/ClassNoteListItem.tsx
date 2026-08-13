import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { ClassNote } from '../../types';

interface ClassNoteListItemProps {
  note: ClassNote;
  onClick: () => void;
  showExtras?: boolean;
}

export const ClassNoteListItem: React.FC<ClassNoteListItemProps> = ({
  note,
  onClick,
  showExtras = false,
}) => (
  <div
    onClick={onClick}
    className="py-3.5 space-y-1.5 cursor-pointer group hover:bg-[#FAF8F5]/50 px-1 rounded-lg transition-colors"
  >
    <div className="flex items-center justify-between text-xs">
      <span className="font-bold text-[#B94862] text-[11px]">Aula {note.number}</span>
      <span className="text-[11px] text-[#918689] font-medium">{note.date}</span>
    </div>

    <h4 className="font-display font-bold text-sm text-[#40383A] group-hover:text-[#B94862] transition-colors leading-tight">
      {note.title}
    </h4>

    <p className="text-xs text-[#6D6366] line-clamp-2 leading-relaxed">
      {note.summary}
    </p>

    {showExtras && (
      <div className="flex items-center justify-between text-[11px] pt-1">
        <span className="text-[#396D82] font-medium flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          <span>{note.materials?.length || 1} material anexo</span>
        </span>
        <span className="font-semibold text-[#B94862] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
          ver anotação <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    )}
  </div>
);
