import React from 'react';
import { X, ExternalLink, Copy, FileText, Landmark } from 'lucide-react';
import { Article } from '../../data/books';
import { PSYCHOTHERAPY_FAMILIES } from '../../data/books/families';
import { Modal } from '../ui/Modal';
import { Kitty } from '../ui/Kitty';
import { BookmarkToggle } from '../ui/BookmarkToggle';
import { copyToClipboard } from '../../lib/utils';
import { useApp } from '../../context/AppContext';

interface ArticleDetailModalProps {
  article: Article;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  isSaved,
  onClose,
  onToggleSave,
}) => {
  const { showToast } = useApp();
  const familia = PSYCHOTHERAPY_FAMILIES[article.familia];
  const hasLink = Boolean(article.linkDireto);

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(article.linkDireto || article.doi);
    showToast(ok ? 'link copiado com carinho ♡' : 'não consegui copiar o link 😢');
  };

  return (
    <Modal
      open
      onClose={onClose}
      className="w-full max-w-sm bg-white rounded-[28px] border border-ceci-border-default shadow-2xl overflow-hidden text-ceci-primary space-y-4"
    >
      {/* Header colorido da família */}
      <div
        className="p-5 relative space-y-3"
        style={{ backgroundColor: familia?.color ?? '#F3EEE8' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-ceci-primary flex items-center justify-center cursor-pointer shadow-2xs"
          aria-label="fechar artigo"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-2xl bg-white/90 flex items-center justify-center shadow-2xs"
          style={{ color: familia?.accent ?? '#6D6366' }}
        >
          <FileText className="w-5 h-5" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded-full shadow-2xs"
              style={{ color: familia?.accent ?? '#6D6366' }}
            >
              {familia?.label ?? 'artigo científico'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 text-ceci-primary px-2 py-0.5 rounded-full shadow-2xs capitalize">
              {article.classificacao.split(/[;,/]/)[0].trim()}
            </span>
          </div>
          <h3 className="font-display font-bold text-lg text-ceci-primary leading-tight">
            {article.titulo}
          </h3>
          <p className="text-xs text-ceci-secondary font-medium leading-relaxed">
            {article.autores}
          </p>
          <p className="text-[11px] text-ceci-tertiary font-medium">
            {article.ano} · {article.periodico}
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-6 space-y-4 pb-6">
        {/* Bonequinha surpresa — artigo interessante */}
        <div className="flex justify-center -my-1">
          <Kitty expression="surpresa" className="w-14 h-14" decorative />
        </div>

        {/* Resumo */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ceci-tertiary lowercase">resumo</span>
          <p className="text-xs text-ceci-secondary leading-relaxed bg-surface-muted p-3 rounded-2xl border border-ceci-border-subtle">
            {article.resumo}
          </p>
        </div>

        {/* Relevância */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ceci-tertiary lowercase flex items-center gap-1">
            <Landmark className="w-3 h-3" /> por que importa
          </span>
          <p className="text-xs text-ceci-primary leading-relaxed bg-surface-rose p-3 rounded-2xl border-l-4 border-rose-500">
            {article.observacao}
          </p>
        </div>

        {/* DOI / link */}
        {hasLink && (
          <div className="p-2.5 rounded-2xl bg-surface-muted border border-ceci-border-default">
            <p className="text-[10px] text-ceci-tertiary font-semibold px-1 pb-1 lowercase truncate">
              {article.doi || article.linkDireto}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={article.linkDireto}
                target="_blank"
                rel="external noopener noreferrer"
                className="flex-1 bg-ceci-primary hover:bg-ceci-primary-hover text-white py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-transform active:scale-98 cursor-pointer min-h-[44px]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>abrir artigo ↗</span>
              </a>
              <button
                onClick={handleCopyLink}
                className="p-3 rounded-2xl border border-ceci-border-default bg-white text-ceci-secondary hover:bg-surface-muted flex items-center justify-center transition-colors cursor-pointer min-h-[44px]"
                title="copiar link"
                aria-label="copiar link do artigo"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-1">
          <BookmarkToggle
            active={isSaved}
            onToggle={onToggleSave}
            size="md"
            label="guardar artigo"
            activeLabel="remover artigo dos salvos"
            ariaLabel={isSaved ? 'remover artigo dos salvos' : 'guardar artigo'}
          />
          <button
            onClick={onClose}
            className="flex-1 bg-surface-muted text-ceci-primary py-2.5 rounded-2xl text-xs font-semibold border border-ceci-border-default hover:bg-white transition-colors cursor-pointer min-h-[44px]"
          >
            voltar para a biblioteca
          </button>
        </div>
      </div>
    </Modal>
  );
};
