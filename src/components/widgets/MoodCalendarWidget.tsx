import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PenTool, Sparkles } from 'lucide-react';

interface MoodDot {
  day: number;
  mood: 'alegre' | 'focada' | 'calma' | 'cansada' | 'reflexiva';
  note?: string;
}

export const MoodCalendarWidget: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState('Agosto 2026');

  // Colors based on Image 7 (Retro Typewriter Mood Patterns)
  const moodColors = {
    alegre: 'bg-[#E8AFC0] border-[#D88FA3]', // Rose
    focada: 'bg-[#A3C4BC] border-[#7F9E96]', // Sage
    calma: 'bg-[#F5C242] border-[#D9A321]',  // Mustard / Honey
    cansada: 'bg-[#DCCBB8] border-[#B8A693]', // Warm Beige
    reflexiva: 'bg-[#C3B8D8] border-[#A294BD]', // Soft Lavender
  };

  const moodLabels = [
    { key: 'alegre', label: 'Alegre', color: 'bg-[#E8AFC0]' },
    { key: 'focada', label: 'Focada', color: 'bg-[#A3C4BC]' },
    { key: 'calma', label: 'Calma', color: 'bg-[#F5C242]' },
    { key: 'cansada', label: 'Cansada', color: 'bg-[#DCCBB8]' },
    { key: 'reflexiva', label: 'Reflexiva', color: 'bg-[#C3B8D8]' },
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
    <div className="journal-card p-6 bg-[#FAF6EE] border border-[#EFE5D8] shadow-xs rounded-3xl font-serif">
      {/* Typewriter Title Header (Image 7 Inspiration) */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EFE5D8] mb-5">
        <div>
          <span className="text-[10px] font-sans font-bold tracking-widest text-[#9A9195] uppercase flex items-center gap-1">
            <PenTool className="w-3 h-3 text-[#E8AFC0]" /> MAPA EMOCIONAL & ESTUDOS
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-[#3F3940] mt-0.5 tracking-tight">
            Padrões de Humor do Mês
          </h3>
          <p className="text-xs text-[#716A70] font-sans">
            Mapeando a constância e o bem-estar ao longo das semanas de aula
          </p>
        </div>

        <div className="flex items-center gap-2 font-sans">
          <button className="p-1.5 rounded-full border border-[#EFE5D8] hover:bg-white text-[#716A70]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#3F3940] px-2">{currentMonth}</span>
          <button className="p-1.5 rounded-full border border-[#EFE5D8] hover:bg-white text-[#716A70]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Dot Matrix (Image 7 Inspiration) */}
      <div className="max-w-xl mx-auto my-4">
        <div className="grid grid-cols-7 gap-2 text-center mb-2 font-sans text-[11px] font-bold text-[#9A9195]">
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
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-sans font-bold text-[#3F3940] transition-transform group-hover:scale-115 shadow-2xs ${
                    mood ? moodColors[mood] : 'bg-[#EFE5D8]/50 border border-[#EFE5D8] text-[#9A9195]'
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

      {/* Mood Legend (Image 7 Inspiration) */}
      <div className="pt-4 border-t border-[#EFE5D8] mt-4 flex flex-wrap items-center justify-center gap-4 font-sans text-xs">
        {moodLabels.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5 text-[#716A70]">
            <span className={`w-3 h-3 rounded-full ${m.color}`} />
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
