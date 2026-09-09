// Home — "ritmo da semana": 7 dias + streak (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React from 'react';
import { Activity, ArrowRight, Flame } from 'lucide-react';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { WEEK_CELL_STYLE } from '../../../lib/copy';
import type { WeekDayCell } from '../../../lib/streak';

interface WeekRhythmCardProps {
  streakLongest: number;
  streakCurrent: number;
  streakActive: boolean;
  weekProgress: WeekDayCell[];
  onOpenStreak: () => void;
}

const WeekRhythmCard: React.FC<WeekRhythmCardProps> = ({
  streakLongest,
  streakCurrent,
  streakActive,
  weekProgress,
  onOpenStreak,
}) => (
  <section className="px-0.5 pt-5 sm:pt-7">
    <button
      onClick={onOpenStreak}
      aria-label="ver sua ofensiva de estudos"
      className="w-full card-lift bg-surface-default rounded-xl p-5 border border-ceci-border-default hover:border-ceci-border-brand shadow-sm cursor-pointer space-y-4 tap-interactive text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500" />
          <h2 className="text-xs font-bold text-ceci-primary font-display uppercase tracking-wider">
            seu ritmo
          </h2>
        </div>
        <span className="text-[11px] text-ceci-secondary flex items-center gap-1">
          recorde: {streakLongest > 0 ? streakLongest : '—'}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* dias da semana (seg → dom) */}
      <div className="flex items-center justify-between gap-1.5">
        {weekProgress.map((cell) => (
          <div key={cell.dateKey} className="flex flex-col items-center gap-1 flex-1">
            <span
              className={`w-full max-w-[34px] aspect-square rounded-xl border flex items-center justify-center text-[11px] font-bold ${WEEK_CELL_STYLE[cell.status]}`}
            >
              {cell.active ? '✓' : cell.label.slice(0, 1).toUpperCase()}
            </span>
            <span className={`text-[10px] font-semibold ${
              cell.status === 'today' ? 'text-ceci-brand-strong' : 'text-ceci-muted'
            }`}>
              {cell.label.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-ceci-secondary flex items-center gap-1.5 border-t border-ceci-border-subtle pt-3.5 -mb-0.5">
        <Flame className={`w-4 h-4 shrink-0 ${streakActive ? 'fill-rose-500 text-rose-500' : 'text-ceci-muted'}`} />
        <span>
          sequência de{' '}
          <AnimatedNumber value={streakCurrent} />{' '}
          {streakCurrent === 1 ? 'dia' : 'dias'}
          {streakActive ? ' — bora manter! 🔥' : ' — hoje é um bom dia para recomeçar ♡'}
        </span>
      </p>
    </button>
  </section>
);

export default WeekRhythmCard;