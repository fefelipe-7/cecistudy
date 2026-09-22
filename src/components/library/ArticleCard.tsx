import React from 'react';
import { Bookmark } from 'lucide-react';
import { Article } from '../../data/books';
import { PSYCHOTHERAPY_FAMILIES } from '../../data/books/families';

interface ArticleCardProps {
  article: Article;
  isSaved: boolean;
  onSelect: () => void;
}

/** Card de artigo no padrão dos livros, mas em formato de "folha de papel" colorida. */
export const ArticleCard: React.FC<ArticleCardProps> = ({ article, isSaved, onSelect }) => {
  const familia = PSYCHOTHERAPY_FAMILIES[article.familia];
  const color = familia?.color ?? '#F3EEE8';
  const accent = familia?.accent ?? '#6D6366';

  return (
    <button
      onClick={onSelect}
      className="card-lift relative w-full h-[150px] sm:h-[160px] rounded-2xl p-3 flex flex-col justify-between shadow-xs cursor-pointer overflow-hidden border border-black/5 select-none text-left"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 70%, var(--color-cover-base))` }}
      aria-label={`abrir artigo ${article.titulo}`}
    >
       {/* Dobradinha de folha de papel (canto superior direito) */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[18px] border-t-cover-base/70 border-l-[18px] border-l-transparent" />
      <div className="absolute top-0 right-0 w-[18px] h-[18px] bg-black/10 rounded-bl-[10px]" />

      {/* Linhas de pauta (folha pautada) */}
      <div className="absolute inset-x-3 top-[40%] space-y-[7px] pointer-events-none opacity-35">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-px w-full" style={{ backgroundColor: accent }} />
        ))}
      </div>

       {/* Badge + salvos */}
      <div className="relative flex items-center justify-between gap-1">
        <span
          className="text-[8px] font-extrabold uppercase tracking-wider bg-cover-base/90 px-1.5 py-0.5 rounded shadow-2xs line-clamp-1 max-w-[80px]"
          style={{ color: accent }}
        >
          artigo
        </span>
        {isSaved && <Bookmark className="w-3 h-3 fill-cover-ink text-cover-ink" />}
      </div>

      {/* Título sobre a pauta */}
      <div className="relative my-auto pt-2">
        <p className="font-display font-bold text-[11px] sm:text-[12px] leading-tight text-cover-ink line-clamp-4">
          {article.titulo}
        </p>
      </div>

      {/* Autores + ano */}
      <div className="relative space-y-0.5">
        <p className="text-[9px] font-semibold text-cover-ink/80 line-clamp-1">
          {article.autores}
        </p>
        <p className="text-[9px] font-bold" style={{ color: accent }}>
          {article.ano}
        </p>
      </div>
    </button>
  );
};
