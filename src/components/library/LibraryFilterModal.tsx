import React from 'react';
import { Filter, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface LibraryFilterModalProps {
  isOpen: boolean;
  activeCategory: string;
  activeStatus: string;
  selectedTag: string | null;
  availableTags: string[];
  onCategoryChange: (id: string) => void;
  onStatusChange: (id: string) => void;
  onTagChange: (tag: string | null) => void;
  onReset: () => void;
  onClose: () => void;
}

export const LibraryFilterModal: React.FC<LibraryFilterModalProps> = ({
  isOpen,
  activeCategory,
  activeStatus,
  selectedTag,
  availableTags,
  onCategoryChange,
  onStatusChange,
  onTagChange,
  onReset,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      open
      onClose={onClose}
      className="w-full max-w-md bg-white rounded-[28px] border border-ceci-border-default shadow-2xl p-6 space-y-5 text-ceci-primary animate-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto"
    >
        <div className="flex items-center justify-between border-b border-ceci-border-default pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ceci-brand-strong" />
            <h3 className="font-display font-bold text-base text-ceci-primary">
              filtrar acervo & coleções
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-muted hover:bg-ceci-border-default text-ceci-secondary flex items-center justify-center cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Categoria da Coleção */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-ceci-tertiary uppercase tracking-wider block">
            categoria da obra / coleção
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'todos', label: 'todas as categorias' },
              { id: 'autores', label: 'autores & obras' },
              { id: 'conceitos', label: 'conceitos-chave' },
              { id: 'abordagens', label: 'abordagens terapêuticas' },
              { id: 'testes', label: 'testes & escalas' },
              { id: 'multidisciplinar', label: 'bagagem complementar' },
              { id: 'salvos', label: 'salvos ♡' },
              { id: 'em_leitura', label: 'em leitura 📖' },
            ].map((cat) => {
              const isSel = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left tap-interactive cursor-pointer flex items-center justify-between ${
                    isSel
                      ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong font-bold'
                      : 'bg-surface-muted border-ceci-border-default text-ceci-primary hover:bg-white'
                  }`}
                >
                  <span className="line-clamp-1">{cat.label}</span>
                  {isSel && <Check className="w-3.5 h-3.5 text-ceci-brand-strong shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Status de Leitura */}
        <div className="space-y-2 pt-2 border-t border-ceci-border-default/70">
          <span className="text-[11px] font-bold text-ceci-tertiary uppercase tracking-wider block">
            status de leitura
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'todos', label: 'todos' },
              { id: 'lendo', label: 'lendo' },
              { id: 'concluido', label: 'lidos' },
              { id: 'para_ler', label: 'não iniciados' },
            ].map((st) => {
              const isSel = activeStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => onStatusChange(st.id)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold tap-interactive cursor-pointer ${
                    isSel
                      ? 'bg-ceci-primary text-white border-ceci-primary'
                      : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Tags / Temas Rápidos */}
        <div className="space-y-2 pt-2 border-t border-ceci-border-default/70">
          <span className="text-[11px] font-bold text-ceci-tertiary uppercase tracking-wider block">
            filtrar por tema / autor específico
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSel = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onTagChange(isSel ? null : tag)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium border tap-interactive cursor-pointer ${
                    isSel
                      ? 'bg-ceci-brand-strong text-white border-ceci-brand-strong'
                      : 'bg-surface-muted text-ceci-primary border-ceci-border-default hover:bg-white'
                  }`}
                >
                  {tag} {isSel && '✕'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="pt-3 border-t border-ceci-border-default flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-2xl border border-ceci-border-default text-ceci-secondary text-xs font-bold hover:bg-surface-muted cursor-pointer"
          >
            esquecer filtros
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-ceci-primary text-white py-2.5 rounded-2xl text-xs font-bold shadow-2xs hover:bg-ceci-primary-hover cursor-pointer"
          >
            aplicar filtros
          </button>
        </div>
    </Modal>
  );
};
