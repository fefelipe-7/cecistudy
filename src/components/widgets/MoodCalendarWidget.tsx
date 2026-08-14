import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PenTool, Sparkles } from 'lucide-react';

interface MoodDot {
  day: number;
  mood: 'alegre' | 'focada' | 'calma' | 'cansada' | 'reflexiva';
  note?: string;
}

export const MoodCalendarWidget: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState('agosto 2026');

  const moodColors = {
    alegre: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
    focada: 'bg-surface-mint border-ceci-border-mint text-success-leaf',
    calma: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong',
    cansada: 'bg-surface-muted border-ceci-border-default text-ceci-secondary',
    reflexiva: 'bg-surface-paper border-surface-sun text-gold',
  };

  const moodLabels = [
    { key: 'alegre', label: 'alegre', color: 'bg-surface-rose border border-ceci-border-brand' },
    { key: 'focada', label: 'focada', color: 'bg-surface-mint border border-ceci-border-mint' },
    { key: 'calma', label: 'calma', color: 'bg-surface-blue border border-ceci-border-academic' },
    { key: 'cansada', label: 'cansada', color: 'bg-surface-muted border border-ceci-border-default' },
    { key: 'reflexiva', label: 'reflexiva', color: 'bg-surface-paper border border-surface-sun' },
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

  const daysOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  return (
    <div className="rounded-[24px] p-6 bg-surface-muted border border-ceci-border-default shadow-sm font-sans">
      {/* Typewriter Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-ceci-border-subtle mb-5">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-ceci-tertiary lowercase flex items-center gap-1">
            <PenTool className="w-3 h-3 text-rose-500" /> mapa emocional & estudos
          </span>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-ceci-primary mt-0.5 tracking-tight">
            padrões de humor do mês
          </h3>
          <p className="text-xs text-ceci-secondary">
            mapeando a constância e o bem-estar ao longo das semanas de aula
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-full border border-ceci-border-default bg-white hover:bg-surface-rose text-ceci-secondary transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-ceci-primary px-2">{currentMonth}</span>
          <button className="p-1.5 rounded-full border border-ceci-border-default bg-white hover:bg-surface-rose text-ceci-secondary transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Dot Matrix */}
      <div className="max-w-xl mx-auto my-4">
        <div className="grid grid-cols-7 gap-2 text-center mb-2 text-[11px] font-bold text-ceci-tertiary">
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
                    mood ? moodColors[mood] : 'bg-white border-ceci-border-default text-ceci-faded'
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
      <div className="pt-4 border-t border-ceci-border-subtle mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
        {moodLabels.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5 text-ceci-secondary">
            <span className={`w-3 h-3 rounded-full ${m.color}`} />
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
