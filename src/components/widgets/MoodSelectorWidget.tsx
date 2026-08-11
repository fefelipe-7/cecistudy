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
      label: 'focada',
      description: 'pronta para imergir na matéria',
      color: 'bg-[#FFF5F7] border-[#FFD3DD]',
      faceSvg: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 stroke-[#40383A] fill-none stroke-[2.5] stroke-linecap-round">
          <circle cx="32" cy="32" r="26" fill="#FFF5F7" />
          {/* Eyeglasses */}
          <circle cx="22" cy="28" r="8" />
          <circle cx="42" cy="28" r="8" />
          <line x1="30" y1="28" x2="34" y2="28" />
          {/* Eyes */}
          <circle cx="22" cy="28" r="2.5" fill="#40383A" />
          <circle cx="42" cy="28" r="2.5" fill="#40383A" />
          {/* Confident Smile */}
          <path d="M24 42 Q32 48 40 42" />
        </svg>
      ),
    },
    {
      id: 'relaxada',
      label: 'relaxando',
      description: 'ritmo leve e leitura sem pressa',
      color: 'bg-[#F2F8F4] border-[#D1E8D9]',
      faceSvg: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 stroke-[#40383A] fill-none stroke-[2.5] stroke-linecap-round">
          <circle cx="32" cy="32" r="26" fill="#F2F8F4" />
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
      label: 'criando',
      description: 'elaborando mapas mentais & tcc',
      color: 'bg-[#FFFDF0] border-[#FFF8CC]',
      faceSvg: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 stroke-[#40383A] fill-none stroke-[2.5] stroke-linecap-round">
          <circle cx="32" cy="32" r="26" fill="#FFFDF0" />
          {/* Winking eye */}
          <circle cx="22" cy="28" r="3" fill="#40383A" />
          <path d="M38 28 L46 28" />
          {/* Open mouth smile */}
          <path d="M22 38 Q32 48 42 38 Z" fill="#40383A" />
        </svg>
      ),
    },
    {
      id: 'descanse',
      label: 'descomprimindo',
      description: 'pausa merecida após aula',
      color: 'bg-[#F3F9FC] border-[#CEE7F0]',
      faceSvg: (
        <svg viewBox="0 0 64 64" className="w-10 h-10 stroke-[#40383A] fill-none stroke-[2.5] stroke-linecap-round">
          <circle cx="32" cy="32" r="26" fill="#F3F9FC" />
          {/* Sleeping Zzz Eyes */}
          <path d="M18 28 L26 28 L18 34 L26 34" strokeWidth="2" />
          <path d="M38 28 L46 28 L38 34 L46 34" strokeWidth="2" />
          {/* Small gentle mouth */}
          <ellipse cx="32" cy="42" rx="4" ry="2" fill="#40383A" />
        </svg>
      ),
    },
  ];

  const handleSelect = (id: string) => {
    setSelectedMood(id);
    if (onSelectMood) onSelectMood(id);
  };

  return (
    <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)]">
      <div className="text-center max-w-md mx-auto mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[#918689] lowercase flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-[#E97891]" /> estado de espírito do dia
        </span>
        <h3 className="font-display text-xl sm:text-2xl font-bold text-[#40383A] mt-1">
          como a ceci pode te ajudar hoje?
        </h3>
        <p className="text-xs text-[#6D6366] mt-1">
          escolha como quer direcionar sua sessão de estudos de psicologia
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
        {moods.map((m) => {
          const isSelected = selectedMood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 group relative cursor-pointer ${
                isSelected
                  ? `${m.color} ring-2 ring-[#E97891]/30 shadow-2xs scale-102`
                  : 'bg-[#FAF8F5] border-[#E9DFDC] hover:bg-white hover:border-[#FFD3DD]'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#B94862] text-white flex items-center justify-center text-[10px] shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <div className="mb-2 transition-transform group-hover:scale-110">
                {m.faceSvg}
              </div>
              <span className="font-display font-bold text-sm text-[#40383A]">
                {m.label}
              </span>
              <span className="text-[10px] text-[#6D6366] mt-0.5 line-clamp-2 leading-tight">
                {m.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
