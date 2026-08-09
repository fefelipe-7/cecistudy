import React, { useState } from 'react';
import { X, Bookmark, Share2, Sun, Moon, Type, ChevronLeft, ChevronRight, Highlighter } from 'lucide-react';
import { ReadingItem } from '../../types';

interface ReaderModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reading: ReadingItem | null;
  onUpdateProgress?: (readingId: string, newPages: number) => void;
}

export const ReaderModeModal: React.FC<ReaderModeModalProps> = ({
  isOpen,
  onClose,
  reading,
  onUpdateProgress,
}) => {
  if (!isOpen || !reading) return null;

  const [theme, setTheme] = useState<'paper' | 'dark' | 'sepia'>('paper');
  const [fontSize, setFontSize] = useState<number>(18);
  const [currentPage, setCurrentPage] = useState<number>(reading.readPages || 12);
  const totalPages = reading.totalPages || 120;
  const progressPercent = Math.round((currentPage / totalPages) * 100);

  const themeClasses = {
    paper: 'bg-[#FAF6EE] text-[#3F3940]',
    sepia: 'bg-[#F2E8D5] text-[#4A3B32]',
    dark: 'bg-[#2A252B] text-[#EFE5D8]',
  };

  const sampleExcerpt = [
    "A psicologia contemporânea e a psicanálise se cruzam na compreensão das formações do inconsciente e dos comportamentos humanos cotidianos.",
    "A riqueza da mente não está apenas no acúmulo de memórias conscientes, mas em como ressignificamos experiências e lidamos com a subjetividade.",
    "A maioria dos indivíduos subestima a força dos mecanismos de defesa e superestima a capacidade do controle racional absoluto sobre as emoções.",
    "Primeira regra do aprendizado reflexivo: não negligencie o afeto. Segunda regra: o escutar analítico é o instrumento fundamental para transformar angústia em elaboração.",
  ];

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    if (onUpdateProgress) {
      onUpdateProgress(reading.id, clamped);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div
        className={`w-full max-w-2xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-200 ${themeClasses[theme]}`}
      >
        {/* Top Controls Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-black/5">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            title="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
              PÁGINA {currentPage} DE {totalPages}
            </span>
            <p className="font-serif-display text-xs font-semibold opacity-90 line-clamp-1">
              {reading.title}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => (s >= 22 ? 14 : s + 2))}
              className="p-2 rounded-full hover:bg-black/5 transition-colors text-xs font-bold"
              title="Ajustar Tamanho do Texto"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              title="Salvar Marcador"
            >
              <Bookmark className="w-4 h-4 text-[#E8AFC0]" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Canvas Content (Image 1 Style) */}
        <div className="flex-1 overflow-y-auto px-8 sm:px-14 py-8 space-y-6 select-text">
          <div className="text-center space-y-2 mb-8">
            <span className="text-[11px] uppercase tracking-widest opacity-50 font-sans">
              Capítulo {Math.ceil(currentPage / 10)}
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold leading-tight">
              A Equação da Mente e do Afeto
            </h2>
            <div className="w-8 h-0.5 bg-[#E8AFC0] mx-auto opacity-70 mt-3" />
          </div>

          {/* Highlighted Key Text Box (Yellow Highlighter style from Reference Img 1) */}
          <div className="my-6 p-4 rounded-xl bg-[#FFF3C4]/60 dark:bg-[#FFF3C4]/10 border-l-4 border-[#F5C242] text-sm leading-relaxed font-serif italic text-[#332B1A] dark:text-[#FFF3C4]">
            "A riqueza da mente não está apenas no acúmulo de dados, mas em como acolhemos o desconhecido e ressignificamos nossa história interpessoal."
            <div className="mt-2 text-[10px] font-sans font-bold tracking-wider uppercase text-[#B8860B] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F5C242] inline-block" />
              Destaque do Leitor
            </div>
          </div>

          {sampleExcerpt.map((paragraph, idx) => (
            <p
              key={idx}
              className="font-serif leading-relaxed text-justify"
              style={{ fontSize: `${fontSize}px` }}
            >
              {paragraph}
            </p>
          ))}

          <p
            className="font-serif leading-relaxed text-justify"
            style={{ fontSize: `${fontSize}px` }}
          >
            {reading.notes || "Em seus estudos em Psicologia, o acompanhamento regular e a síntese diária de leituras fortalecem a base teórico-prática para estágios e atendimentos."}
          </p>
        </div>

        {/* Floating Reader Actions Bar (Reference Image 1 Bottom Bar) */}
        <div className="px-6 py-4 border-t border-black/5 bg-black/2 flex flex-col gap-3">
          {/* Progress Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] opacity-70">
              <span>{progressPercent}% Lido</span>
              <span>Página {currentPage} de {totalPages}</span>
              <span>~{Math.round((totalPages - currentPage) * 1.2)} min restantes</span>
            </div>
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="w-full accent-[#E8AFC0] cursor-pointer"
            />
          </div>

          {/* Bottom Theme & Nav Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full">
              <button
                onClick={() => setTheme('paper')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'paper' ? 'bg-white text-[#3F3940] shadow-2xs' : 'opacity-70'
                }`}
              >
                Papel
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'sepia' ? 'bg-[#F2E8D5] text-[#4A3B32] shadow-2xs' : 'opacity-70'
                }`}
              >
                Sépia
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'dark' ? 'bg-[#2A252B] text-white shadow-2xs' : 'opacity-70'
                }`}
              >
                Noturno
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
