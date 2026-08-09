import React, { useState } from 'react';
import { Sparkles, Heart, Check } from 'lucide-react';

interface MoodOption {
  id: string;
  label: string;
  description: string;
  faceSvg: React.ReactNode;
  color: string;
}

interface MoodSelectorWidgetProps {
  onSelectMood?: (moodId: string) => void;
}

export const MoodSelectorWidget: React.FC<MoodSelectorWidgetProps> = ({ onSelectMood }) => {
  const [selectedMood, setSelectedMood] = useState<string>('focada');

  const moods: MoodOption[] = [
    {
      id: 'focada',
      label: 'Focada',
      description: 'Pronta para imergir na matéria',
      color: 'bg-[#F4D7DF]/60 border-[#E8AFC0]',
      faceSvg: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 stroke-[#3F3940] fill-none stroke-[2.5] stroke-linecap-round">
          <circle cx="32" cy="32" r="26" fill="#F4D7DF" />
          {/* Eyeglasses */}
          <circle cx="22" cy="28" r="8" />
          <circle cx="42" cy="28" r="8" />
          <line x1="30" y1="28" x2="34" y2="28" />
          {/* Eyes */}
          <circle cx="22" cy="28" r="2.5" fill="#3F3940" />
          <circle cx="42" cy="28" r="2.5" fill="#3F3940" />
          {/* Confident Smile */}
          <path d="M24 42 Q32 48 40 42" />
        </svg>
      ),
    },
    {
      id: 'relaxada',
      label: 'Relaxando',
      description: 'Ritmo leve e leitura sem pressa',
      color: 'bg-[#E2ECE9]/80 border-[#A3C4BC]',
      faceSvg: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 stroke-[#3F3940] fill-none stroke-[2.5] stroke-linecap-round">
          <circle cx="32" cy="32" r="26" fill="#E2ECE9" />
          {/* Closed Happy Eyes */}
          <path d="M18 28 Q22 22 26 28" />
          <path d="M38 28 Q42 22 46 28" />
          {/* Soft Smile */}
          <path d="M22 40 Q32 46 42 40" />
        </svg>
      ),
    },
    {
      id: 'criativa',
      label: 'Criando',
      description: 'Elaborando mapas mentais & TCC',
      color: 'bg-[#FFF3C4]/80 border-[#F5C242]',
      faceSvg: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 stroke-[#3F3940] fill-none stroke-[2.5] stroke-linecap-round">
          <circle cx="32" cy="32" r="26" fill="#FFF3C4" />
          {/* Winking eye */}
          <circle cx="22" cy="28" r="3" fill="#3F3940" />
          <path d="M38 28 L46 28" />
          {/* Open mouth smile */}
          <path d="M22 38 Q32 48 42 38 Z" fill="#3F3940" />
        </svg>
      ),
    },
    {
      id: 'descanse',
      label: 'Descomprimindo',
      description: 'Pausa merecida após aula',
      color: 'bg-[#E5E0EC]/80 border-[#C3B8D8]',
      faceSvg: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 stroke-[#3F3940] fill-none stroke-[2.5] stroke-linecap-round">
          <circle cx="32" cy="32" r="26" fill="#E5E0EC" />
          {/* Sleeping Zzz Eyes */}
          <path d="M18 28 L26 28 L18 34 L26 34" strokeWidth="2" />
          <path d="M38 28 L46 28 L38 34 L46 34" strokeWidth="2" />
          {/* Small gentle mouth */}
          <ellipse cx="32" cy="42" rx="4" ry="2" fill="#3F3940" />
        </svg>
      ),
    },
  ];

  const handleSelect = (id: string) => {
    setSelectedMood(id);
    if (onSelectMood) onSelectMood(id);
  };

  return (
    <div className="journal-card p-6 bg-white border border-[#EFE5D8] shadow-xs">
      <div className="text-center max-w-md mx-auto mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[#9A9195] uppercase flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-[#E8AFC0]" /> Estado de Espírito do Dia
        </span>
        <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-[#3F3940] mt-1">
          Como a Ceci pode te ajudar hoje?
        </h3>
        <p className="text-xs text-[#716A70] mt-1">
          Escolha como quer direcionar sua sessão de estudos de Psicologia
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
        {moods.map((m) => {
          const isSelected = selectedMood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 group relative ${
                isSelected
                  ? `${m.color} ring-2 ring-[#3F3940]/20 shadow-xs scale-102`
                  : 'bg-[#FFFBF5] border-[#EFE5D8] hover:bg-white hover:border-[#E8AFC0]'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#3F3940] text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <div className="mb-2 transition-transform group-hover:scale-110">
                {m.faceSvg}
              </div>
              <span className="font-serif-display font-bold text-sm text-[#3F3940]">
                {m.label}
              </span>
              <span className="text-[10px] text-[#716A70] mt-0.5 line-clamp-2 leading-tight">
                {m.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
