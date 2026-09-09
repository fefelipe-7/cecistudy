import React from 'react';
import { X, ExternalLink, Copy, FileText, Landmark } from 'lucide-react';
import { Article } from '../../data/books';
import { PSYCHOTHERAPY_FAMILIES } from '../../data/books/families';
import { Modal } from '../ui/Modal';
import { BookmarkToggle } from '../ui/BookmarkToggle';
import { copyToClipboard } from '../../lib/utils';
import { useMobileApp } from '@/context/mobileApp';

interface ArticleDetailModalProps {
  article: Article;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
}

const chip =
  'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/90 text-ceci-primary shadow-2xs';

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  isSaved,
  onClose,
  onToggleSave,
}) => {
  const { showToast } = useMobileApp();
  const familia = PSYCHOTHERAPY_FAMILIES[article.familia];
  const hasLink = Boolean(article.linkDireto);

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(article.linkDireto || article.doi);
    showToast(ok ? 'link copiado com carinho ♡' : 'não consegui copiar o link 😔');
  };

  return (
    <Modal
      open
      onClose={onClose}
      className="w-full max-w-sm bg-surface-default rounded-[28px] border border-ceci-border-default shadow-2xl overflow-hidden text-ceci-primary flex flex-col max-h-[85dvh]"
    >
      {/* Hero da família */}
      <div
        className="relative shrink-0 pt-6"
        style={{
          backgroundColor: familia?.color ?? '#F3EEE8',
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.28), rgba(0,0,0,0.06))',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-ceci-primary flex items-center justify-center cursor-pointer shadow-2xs tap-interactive"
          aria-label="fechar artigo"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 flex-wrap px-10">
          <span
            className={chip}
            style={{ color: familia?.accent ?? '#6D6366' }}
          >
            {familia?.label ?? 'artigo científico'}
          </span>
          <span className={`${chip} capitalize`}>
            {article.classificacao.split(/[;,/]/)[0].trim()}
          </span>
        </div>

        {/* Medalhão do artigo sobrepondo a fronteira */}
        <div className="relative flex justify-center mt-3">
          <div
            className="relative z-10 w-14 h-14 -mb-7 rounded-2xl bg-white/95 shadow-lg border border-black/10 flex items-center justify-center rotate-2 transition-transform duration-300"
            style={{ color: familia?.accent ?? '#6D6366' }}
          >
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Corpo rolável */}
      <div className="px-6 pt-11 pb-4 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="text-center">
          <h3 className="font-display font-bold text-base text-ceci-primary leading-snug">
            {article.titulo}
          </h3>
          <p className="text-xs text-ceci-secondary font-medium leading-relaxed mt-1">
            {article.autores}
          </p>
          <p className="text-[11px] text-ceci-tertiary font-medium">
            {article.ano} · {article.periodico}
          </p>
        </div>

        {/* Resumo — com scroll próprio */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ceci-tertiary lowercase">resumo</span>
          <div className="max-h-40 overflow-y-auto overscroll-contain bg-surface-muted p-3.5 rounded-2xl">
            <p className="text-xs text-ceci-secondary leading-relaxed">
              {article.resumo}
            </p>
          </div>
        </div>

        {/* Por que importa */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ceci-tertiary lowercase flex items-center gap-1">
            <Landmark className="w-3 h-3" /> por que importa
          </span>
          <div className="rounded-2xl bg-surface-rose p-3.5">
            <p className="text-xs text-ceci-primary leading-relaxed">
              {article.observacao}
            </p>
          </div>
        </div>

        {/* DOI / link */}
        {hasLink && (
          <div className="rounded-2xl bg-surface-muted p-2.5 space-y-1">
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
                className="p-3 rounded-2xl bg-surface-default border border-ceci-border-default text-ceci-secondary hover:bg-surface-rose hover:text-ceci-brand-strong flex items-center justify-center transition-colors cursor-pointer min-h-[44px]"
                title="copiar link"
                aria-label="copiar link do artigo"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé fixo — sempre visível */}
      <div className="shrink-0 flex items-center gap-2 px-6 py-4 border-t border-ceci-border-subtle bg-surface-default">
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
          className="flex-1 bg-surface-muted text-ceci-primary py-2.5 rounded-2xl text-xs font-semibold border border-ceci-border-default hover:bg-surface-rose hover:border-ceci-border-brand transition-colors cursor-pointer min-h-[44px]"
        >
          voltar para a biblioteca
        </button>
      </div>
    </Modal>
  );
};
