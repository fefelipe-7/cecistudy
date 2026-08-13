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
      className="w-full max-w-md bg-white rounded-[28px] border border-[#E9DFDC] shadow-2xl p-6 space-y-5 text-[#40383A] animate-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto"
    >
        <div className="flex items-center justify-between border-b border-[#E9DFDC] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#B94862]" />
            <h3 className="font-display font-bold text-base text-[#40383A]">
              filtrar acervo & coleções
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#E9DFDC] text-[#6D6366] flex items-center justify-center cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Categoria da Coleção */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#918689] uppercase tracking-wider block">
            categoria da obra / coleção
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'todos', label: 'Todas as categorias' },
              { id: 'autores', label: 'Autores & Obras' },
              { id: 'conceitos', label: 'Conceitos-Chave' },
              { id: 'abordagens', label: 'Abordagens Terapêuticas' },
              { id: 'testes', label: 'Testes & Escalas' },
              { id: 'multidisciplinar', label: 'Bagagem Complementar' },
              { id: 'salvos', label: 'Salvos ♡' },
              { id: 'em_leitura', label: 'Em Leitura 📖' },
            ].map((cat) => {
              const isSel = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSel
                      ? 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862] font-bold'
                      : 'bg-[#FAF8F5] border-[#E9DFDC] text-[#40383A] hover:bg-white'
                  }`}
                >
                  <span className="line-clamp-1">{cat.label}</span>
                  {isSel && <Check className="w-3.5 h-3.5 text-[#B94862] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Status de Leitura */}
        <div className="space-y-2 pt-2 border-t border-[#E9DFDC]/70">
          <span className="text-[11px] font-bold text-[#918689] uppercase tracking-wider block">
            status de leitura
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'lendo', label: 'Lendo atualmente' },
              { id: 'concluido', label: 'Lidos' },
              { id: 'para_ler', label: 'Não iniciados' },
            ].map((st) => {
              const isSel = activeStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => onStatusChange(st.id)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#40383A] text-white border-[#40383A]'
                      : 'bg-white border-[#E9DFDC] text-[#6D6366] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Tags / Temas Rápidos */}
        <div className="space-y-2 pt-2 border-t border-[#E9DFDC]/70">
          <span className="text-[11px] font-bold text-[#918689] uppercase tracking-wider block">
            filtrar por tema / autor específico
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSel = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onTagChange(isSel ? null : tag)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#B94862] text-white border-[#B94862]'
                      : 'bg-[#FAF8F5] text-[#40383A] border-[#E9DFDC] hover:bg-white'
                  }`}
                >
                  {tag} {isSel && '✕'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="pt-3 border-t border-[#E9DFDC] flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-2xl border border-[#E9DFDC] text-[#6D6366] text-xs font-bold hover:bg-[#FAF8F5] cursor-pointer"
          >
            limpar tudo
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#40383A] text-white py-2.5 rounded-2xl text-xs font-bold shadow-2xs hover:bg-[#2D2728] cursor-pointer"
          >
            aplicar filtros
          </button>
        </div>
    </Modal>
  );
};
