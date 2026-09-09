// ZONA 1 — "meus materiais" (acesso pessoal primeiro) (MOD-001 / B.4).
// Extraída de `BibliotecaView.tsx`: nota seletora de "suas notas" + prateleiras
// "continuar lendo" e "salvos pra depois".

import React from 'react';
import { BookOpen, Bookmark, FileText, ChevronRight } from 'lucide-react';
import { CollectionBook } from '../../../data/libraryData';
import { ManageSurface } from '../../ui/ManageSurface';

/** Card compacto de livro para as prateleiras de "meus materiais". */
const MiniBookCard: React.FC<{
  book: CollectionBook;
  progressPct?: number;
  onSelect: () => void;
}> = ({ book, progressPct, onSelect }) => (
  <ManageSurface kind="catalogBook" id={book.id} onTap={onSelect} className="shrink-0">
    <button
      aria-label={`abrir ${book.title}`}
      className="w-[130px] sm:w-[145px] text-left space-y-1 group cursor-pointer"
    >
    <div
      className="w-full h-[120px] rounded-2xl p-2.5 flex flex-col justify-between relative overflow-hidden shadow-xs border border-black/5 card-lift"
      style={{ backgroundColor: book.coverColor }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 border-r border-black/10" />
      <p className="pl-1.5 font-display font-bold text-[10px] text-ceci-primary line-clamp-3 leading-tight my-auto">
        {book.title}
      </p>
      <p className="pl-1.5 text-[8px] font-semibold text-ceci-primary/80 line-clamp-1">{book.author}</p>
    </div>
    {progressPct !== undefined && (
      <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-ceci-brand to-ceci-brand-strong" style={{ width: `${Math.min(100, progressPct)}%` }} />
      </div>
    )}
    </button>
  </ManageSurface>
);

interface MyMaterialsSectionProps {
  looseNotesCount: number;
  readingBooks: CollectionBook[];
  savedBooks: CollectionBook[];
  readingProgress: Record<string, number>;
  onOpenNotes: () => void;
  onSelectBook: (book: CollectionBook) => void;
}

export const MyMaterialsSection: React.FC<MyMaterialsSectionProps> = ({
  looseNotesCount,
  readingBooks,
  savedBooks,
  readingProgress,
  onOpenNotes,
  onSelectBook,
}) => (
  <section className="space-y-3">
    <h2 className="font-display font-bold text-sm text-ceci-tertiary uppercase tracking-wider px-1">
      meus materiais
    </h2>

    {/* Simple Navigation Card "suas notas" */}
    <button
      onClick={onOpenNotes}
      className="w-full text-left bg-white rounded-xl p-4 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs tap-interactive hover:shadow-xs active:scale-[0.99] cursor-pointer group flex items-center justify-between"
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong group-hover:bg-ceci-brand-strong group-hover:text-white transition-colors shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-ceci-primary font-display group-hover:text-ceci-brand-strong transition-colors">
              suas notas
            </h2>
            <span className="text-[10px] font-extrabold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
              {looseNotesCount} {looseNotesCount === 1 ? 'nota' : 'notas'}
            </span>
          </div>
          <p className="text-xs text-ceci-secondary mt-0.5 truncate">
            anotações rápidas e pensamentos avulsos guardados no app
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-ceci-brand-strong group-hover:translate-x-1 transition-transform shrink-0" />
    </button>

    {/* Em andamento — prateleira com progresso */}
    {readingBooks.length > 0 && (
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-ceci-academic-strong" />
          <h3 className="text-xs font-bold text-ceci-primary font-display">continuar lendo</h3>
          <span className="text-[10px] font-bold text-ceci-academic-strong bg-surface-blue px-2 py-0.5 rounded-full border border-ceci-border-academic">
            {readingBooks.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {readingBooks.map((book) => {
            const total = book.totalPages;
            const read = readingProgress[book.id] ?? 0;
            return (
              <MiniBookCard
                key={book.id}
                book={book}
                progressPct={total ? Math.round((read / total) * 100) : undefined}
                onSelect={() => onSelectBook(book)}
              />
            );
          })}
        </div>
      </div>
    )}

    {/* Salvos — prateleira */}
    {savedBooks.length > 0 && (
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-ceci-brand-strong" />
          <h3 className="text-xs font-bold text-ceci-primary font-display">salvos pra depois</h3>
          <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
            {savedBooks.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {savedBooks.map((book) => (
            <MiniBookCard key={book.id} book={book} onSelect={() => onSelectBook(book)} />
          ))}
        </div>
      </div>
    )}

    {readingBooks.length === 0 && savedBooks.length === 0 && (
      <p className="text-xs text-ceci-secondary px-1">
        salve obras do acervo ♡ elas aparecem aqui, pertinho de você.
      </p>
    )}
  </section>
);