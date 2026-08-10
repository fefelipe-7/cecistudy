import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PenTool, Sparkles } from 'lucide-react';

interface MoodDot {
  day: number;
  mood: 'alegre' | 'focada' | 'calma' | 'cansada' | 'reflexiva';
  note?: string;
}

export const MoodCalendarWidget: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState('Agosto 2026');

  const moodColors = {
    alegre: 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862]',
    focada: 'bg-[#F2F8F4] border-[#D1E8D9] text-[#518265]',
    calma: 'bg-[#F3F9FC] border-[#CEE7F0] text-[#396D82]',
    cansada: 'bg-[#FAF8F5] border-[#E9DFDC] text-[#6D6366]',
    reflexiva: 'bg-[#FFFDF0] border-[#FFF8CC] text-[#8C7338]',
  };

  const moodLabels = [
    { key: 'alegre', label: 'Alegre', color: 'bg-[#FFF5F7] border border-[#FFD3DD]' },
    { key: 'focada', label: 'Focada', color: 'bg-[#F2F8F4] border border-[#D1E8D9]' },
    { key: 'calma', label: 'Calma', color: 'bg-[#F3F9FC] border border-[#CEE7F0]' },
    { key: 'cansada', label: 'Cansada', color: 'bg-[#FAF8F5] border border-[#E9DFDC]' },
    { key: 'reflexiva', label: 'Reflexiva', color: 'bg-[#FFFDF0] border border-[#FFF8CC]' },
  ];

  // Dummy calendar matrix data for 31 days
  const dotsData: Record<number, keyof typeof moodColors> = {
    1: 'focada', 2: 'focada', 3: 'calma', 4: 'alegre', 5: 'focada',
    6: 'reflexiva', 7: 'cansada', 8: 'focada', 9: 'alegre', 10: 'calma',
    11: 'focada', 12: 'focada', 13: 'reflexiva', 14: 'cansada', 15: 'alegre',
    16: 'focada', 17: 'calma', 18: 'alegre', 19: 'focada', 20: 'focada',
    21: 'reflexiva', 22: 'calma', 23: 'alegre', 24: 'focada', 25: 'alegre',
    26: 'focada', 27: 'calma', 28: 'reflexiva'
  };

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="rounded-[24px] p-6 bg-[#FAF8F5] border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] font-sans">
      {/* Typewriter Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F2EBE8] mb-5">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#918689] uppercase flex items-center gap-1">
            <PenTool className="w-3 h-3 text-[#E97891]" /> MAPA EMOCIONAL & ESTUDOS
          </span>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#40383A] mt-0.5 tracking-tight">
            Padrões de Humor do Mês
          </h3>
          <p className="text-xs text-[#6D6366]">
            Mapeando a constância e o bem-estar ao longo das semanas de aula
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-full border border-[#E9DFDC] bg-white hover:bg-[#FFF5F7] text-[#6D6366] transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#40383A] px-2">{currentMonth}</span>
          <button className="p-1.5 rounded-full border border-[#E9DFDC] bg-white hover:bg-[#FFF5F7] text-[#6D6366] transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Dot Matrix */}
      <div className="max-w-xl mx-auto my-4">
        <div className="grid grid-cols-7 gap-2 text-center mb-2 text-[11px] font-bold text-[#918689]">
          {daysOfWeek.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3 sm:gap-4 justify-items-center py-2">
          {Array.from({ length: 31 }, (_, idx) => {
            const dayNum = idx + 1;
            const mood = dotsData[dayNum];
            return (
              <div key={dayNum} className="flex flex-col items-center gap-1 group cursor-pointer">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-transform group-hover:scale-115 shadow-2xs ${
                    mood ? moodColors[mood] : 'bg-white border-[#E9DFDC] text-[#BEB4B6]'
                  }`}
                  title={mood ? `Dia ${dayNum}: ${mood}` : `Dia ${dayNum}`}
                >
                  {dayNum}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mood Legend */}
      <div className="pt-4 border-t border-[#F2EBE8] mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
        {moodLabels.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5 text-[#6D6366]">
            <span className={`w-3 h-3 rounded-full ${m.color}`} />
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
