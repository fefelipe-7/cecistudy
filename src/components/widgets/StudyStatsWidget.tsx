import React from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export const StudyStatsWidget: React.FC = () => {
  const { streakStats, currentWeekProgress, openStreak } = useApp();
  const weekCells = currentWeekProgress.filter((c) => c.status !== 'weekend');
  const doneThisWeek = currentWeekProgress.filter((c) => c.status === 'done').length;

  return (
    <div
      onClick={openStreak}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openStreak();
        }
      }}
      className="card-lift press-card rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm cursor-pointer space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-rose flex items-center justify-center">
            <Flame className={`w-4 h-4 ${streakStats.alive ? 'fill-rose-500 text-rose-500' : 'text-ceci-muted'}`} />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-ceci-primary">
              ofensiva de estudos
            </h4>
            <p className="text-[11px] text-ceci-secondary">
              {streakStats.alive ? 'seu ritmo está a todo vapor ♡' : 'cada dia conta, comece hoje ♡'}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            streakStats.alive
              ? 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand'
              : 'bg-surface-muted text-ceci-secondary border-ceci-border-default'
          }`}
        >
          {streakStats.alive ? 'em chamas 🔥' : 'recomeçando ♡'}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="text-4xl font-display font-bold text-ceci-primary leading-none">
            <AnimatedNumber value={streakStats.current} />
          </span>
          <span className="text-sm font-medium text-ceci-secondary ml-1.5">
            {streakStats.current === 1 ? 'dia' : 'dias'}
          </span>
          <p className="text-xs text-ceci-secondary mt-1.5">
            {streakStats.current > 0
              ? streakStats.longest > streakStats.current
                ? `recorde: ${streakStats.longest} dias ♡`
                : 'seu hábito de estudo está consolidado!'
              : 'bora dar o primeiro passo hoje?'}
          </p>
        </div>
        <span className="text-[11px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-1 rounded-full border border-ceci-border-brand shrink-0">
          {doneThisWeek} de 5 dias ♡
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {weekCells.map((item) => (
          <div
            key={item.dateKey}
            className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-between ${
              item.status === 'done'
                ? 'bg-surface-rose border-ceci-border-brand'
                : item.status === 'today'
                  ? 'bg-white border-rose-500 shadow-2xs'
                  : 'bg-surface-muted border-ceci-border-subtle'
            }`}
          >
            <span className="text-[9px] font-medium lowercase text-ceci-secondary">{item.label}</span>
            <div className="my-1">
              {item.status === 'done' ? (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-2xs">
                  ✓
                </span>
              ) : item.status === 'today' ? (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                  ✨
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full bg-surface-muted border border-ceci-border-default" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-ceci-border-subtle pt-3">
        <p className="text-[10px] text-ceci-tertiary">
          sáb e dom são seu descanso ♡
        </p>
        <span className="text-xs font-semibold text-ceci-brand-strong flex items-center gap-0.5">
          ver ofensiva completa
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};