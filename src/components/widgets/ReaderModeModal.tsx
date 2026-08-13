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
  const [theme, setTheme] = useState<'paper' | 'dark' | 'sepia'>('paper');
  const [fontSize, setFontSize] = useState<number>(18);
  const [currentPage, setCurrentPage] = useState<number>(() => reading?.readPages || 12);

  if (!isOpen || !reading) return null;

  const totalPages = reading.totalPages || 120;
  const progressPercent = Math.round((currentPage / totalPages) * 100);

  const themeClasses = {
    paper: 'bg-[#FAF8F5] text-[#40383A]',
    sepia: 'bg-[#FFFDF0] text-[#756354]',
    dark: 'bg-[#40383A] text-[#FAF8F5]',
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
        className={`w-full max-w-2xl h-[92vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden transition-colors duration-200 border border-[#E9DFDC] ${themeClasses[theme]}`}
      >
        {/* Top Controls Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-black/5">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            title="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold tracking-widest lowercase opacity-60">
              páginas {currentPage} de {totalPages}
            </span>
            <p className="font-display text-xs font-semibold opacity-90 line-clamp-1">
              {reading.title}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => (s >= 22 ? 14 : s + 2))}
              className="p-2 rounded-full hover:bg-black/5 transition-colors text-xs font-bold cursor-pointer"
              title="Ajustar Tamanho do Texto"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              title="Salvar Marcador"
            >
              <Bookmark className="w-4 h-4 text-[#E97891]" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Canvas Content */}
        <div className="flex-1 overflow-y-auto px-8 sm:px-14 py-8 space-y-6 select-text">
          <div className="text-center space-y-2 mb-8">
            <span className="text-[11px] lowercase tracking-widest opacity-50">
              capítulo {Math.ceil(currentPage / 10)}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              A Equação da Mente e do Afeto
            </h2>
            <div className="w-8 h-0.5 bg-[#E97891] mx-auto opacity-70 mt-3" />
          </div>

          {/* Highlighted Key Text Box */}
          <div className="my-6 p-4 rounded-xl bg-[#FFFDF0] border-l-4 border-[#8C7338] text-sm leading-relaxed italic text-[#756354]">
            "A riqueza da mente não está apenas no acúmulo de dados, mas em como acolhemos o desconhecido e ressignificamos nossa história interpessoal."
            <div className="mt-2 text-[10px] font-bold tracking-wider lowercase text-[#8C7338] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#8C7338] inline-block" />
              destaque do leitor
            </div>
          </div>

          {sampleExcerpt.map((paragraph, idx) => (
            <p
              key={idx}
              className="leading-relaxed text-justify"
              style={{ fontSize: `${fontSize}px` }}
            >
              {paragraph}
            </p>
          ))}

          <p
            className="leading-relaxed text-justify"
            style={{ fontSize: `${fontSize}px` }}
          >
            {reading.notes || "Em seus estudos em Psicologia, o acompanhamento regular e a síntese diária de leituras fortalecem a base teórico-prática para estágios e atendimentos."}
          </p>
        </div>

        {/* Floating Reader Actions Bar */}
        <div className="px-6 py-4 border-t border-black/5 bg-black/2 flex flex-col gap-3">
          {/* Progress Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] opacity-70">
              <span>{progressPercent}% lido</span>
              <span>página {currentPage} de {totalPages}</span>
              <span>~{Math.round((totalPages - currentPage) * 1.2)} min restantes</span>
            </div>
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="w-full accent-[#E97891] cursor-pointer"
            />
          </div>

          {/* Bottom Theme & Nav Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full">
              <button
                onClick={() => setTheme('paper')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  theme === 'paper' ? 'bg-white text-[#40383A] shadow-2xs' : 'opacity-70'
                }`}
              >
                papel
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  theme === 'sepia' ? 'bg-[#FFFDF0] text-[#756354] shadow-2xs' : 'opacity-70'
                }`}
              >
                sépia
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-[#40383A] text-white shadow-2xs' : 'opacity-70'
                }`}
              >
                noturno
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-30 transition-colors cursor-pointer"
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
