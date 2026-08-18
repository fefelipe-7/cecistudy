import React from 'react';
import { Filter } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { PillGroup } from '../ui/PillGroup';

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
      className="w-full max-w-md bg-white rounded-[28px] border border-ceci-border-default shadow-2xl p-6 space-y-5 text-ceci-primary max-h-[88vh] overflow-y-auto"
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
          <ChoiceCardGrid
            value={activeCategory}
            onChange={onCategoryChange}
            options={[
              { value: 'todos', label: 'todas as categorias' },
              { value: 'mistas', label: 'categorias mistas ✨' },
              { value: 'autores', label: 'autores & obras' },
              { value: 'conceitos', label: 'conceitos-chave' },
              { value: 'abordagens', label: 'abordagens terapêuticas' },
              { value: 'psicoterapias', label: 'catálogo de psicoterapias' },
              { value: 'testes', label: 'testes & escalas' },
              { value: 'multidisciplinar', label: 'bagagem complementar' },
              { value: 'artigos', label: 'artigos científicos' },
              { value: 'salvos', label: 'salvos ♡' },
              { value: 'em_leitura', label: 'em leitura 📖' },
            ]}
          />
        </div>

        {/* Section 2: Status de Leitura */}
        <div className="space-y-2 pt-2 border-t border-ceci-border-default/70">
          <span className="text-[11px] font-bold text-ceci-tertiary uppercase tracking-wider block">
            status de leitura
          </span>
          <PillGroup
            variant="primary"
            value={activeStatus}
            onChange={onStatusChange}
            options={[
              { value: 'todos', label: 'todos' },
              { value: 'lendo', label: 'lendo' },
              { value: 'concluido', label: 'lidos' },
              { value: 'para_ler', label: 'não iniciados' },
            ]}
          />
        </div>

        {/* Section 3: Tags / Temas Rápidos */}
        <div className="space-y-2 pt-2 border-t border-ceci-border-default/70">
          <span className="text-[11px] font-bold text-ceci-tertiary uppercase tracking-wider block">
            filtrar por tema / autor específico
          </span>
          <PillGroup
            variant="brand"
            value={selectedTag ?? ''}
            onChange={(v) => onTagChange(v === selectedTag ? null : v)}
            options={availableTags.map((tag) => ({ value: tag, label: tag }))}
          />
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
