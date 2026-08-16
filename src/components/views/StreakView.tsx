import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Kitty } from '../ui/Kitty';
import { addDays, getRecentWeeks, toDateKey } from '../../lib/streak';

const fmtShort = (key: string): string => {
  const d = new Date(`${key}T00:00:00`);
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const WHAT_COUNTS = [
  'concluir uma tarefa',
  'registrar uma sessão de estudo',
  'revisar flashcards',
  'avançar em uma leitura',
  'anotar uma aula',
];

export const StreakView: React.FC = () => {
  const { streakStats, currentWeekProgress, streakData, handleNavigate } = useApp();
  const todayKey = toDateKey(new Date());
  const weekCells = currentWeekProgress.filter((c) => c.status !== 'weekend');
  const doneThisWeek = currentWeekProgress.filter((c) => c.status === 'done').length;
  const recentWeeks = getRecentWeeks(streakData.activeDays, todayKey);
  const todayPending = weekCells.some((c) => c.status === 'today');

  return (
    <div className="space-y-5">
      {/* Hero: a chama */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] p-6 bg-surface-rose border border-ceci-border-brand shadow-floating text-center space-y-4"
      >
        <motion.div
          animate={streakStats.alive ? { scale: [1, 1.08, 1] } : undefined}
          transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse' }}
          className="flex items-center justify-center"
        >
          <span className="w-16 h-16 rounded-full bg-white border border-ceci-border-brand flex items-center justify-center shadow-sm">
            <Flame className={`w-9 h-9 ${streakStats.alive ? 'fill-rose-500 text-rose-500' : 'text-ceci-muted'}`} />
          </span>
        </motion.div>

        <div>
          <div className="font-display font-bold text-5xl text-ceci-primary leading-none">
            <AnimatedNumber value={streakStats.current} />
          </div>
          <p className="text-sm font-medium text-ceci-secondary mt-1.5">
            {streakStats.current === 1 ? 'dia' : 'dias'} de ofensiva
          </p>
        </div>

        <span
          className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${
            streakStats.alive
              ? 'bg-white text-ceci-brand-strong border-ceci-border-brand'
              : 'bg-surface-muted text-ceci-secondary border-ceci-border-default'
          }`}
        >
          {streakStats.alive ? 'em chamas 🔥' : 'recomeçando ♡'}
        </span>

        <p className="text-xs text-ceci-secondary leading-relaxed">
          {todayPending
            ? 'hoje ainda não conta atividade — bora registrar uma tarefa ou sessão?'
            : streakStats.alive
              ? 'seu ritmo está a todo vapor ♡ cada dia útil com atividade mantém a chama acesa.'
              : 'cada dia conta, comece hoje ♡ uma atividade por dia útil é o suficiente.'}
        </p>

        <Kitty
          expression={streakStats.alive ? 'rindo' : todayPending ? 'curiosa' : 'sonolenta'}
          className="w-16 h-16 mx-auto"
          decorative
        />

        {todayPending && (
          <button
            onClick={() => handleNavigate('estudos', 'sessoes')}
            className="w-full bg-ceci-primary hover:bg-ceci-primary-hover text-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
          >
            bora estudar?
          </button>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-2xl bg-white border border-ceci-border-brand px-3 py-2.5">
            <div className="flex items-center justify-center gap-1 text-ceci-brand-strong">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">recorde</span>
            </div>
            <p className="font-display font-bold text-2xl text-ceci-primary text-center mt-0.5">
              <AnimatedNumber value={streakStats.longest} />
              <span className="text-xs font-normal text-ceci-secondary ml-1">dias</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-ceci-border-brand px-3 py-2.5">
            <div className="flex items-center justify-center gap-1 text-ceci-brand-strong">
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">dias ativos</span>
            </div>
            <p className="font-display font-bold text-2xl text-ceci-primary text-center mt-0.5">
              <AnimatedNumber value={streakStats.total} />
              <span className="text-xs font-normal text-ceci-secondary ml-1">no total</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Sua semana */}
      <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-ceci-primary">sua semana</h2>
          <span className="text-[11px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-1 rounded-full border border-ceci-border-brand">
            {doneThisWeek} de 5 dias ♡
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {weekCells.map((item) => (
            <motion.div
              key={item.dateKey}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`p-2 rounded-[18px] border text-center flex flex-col items-center justify-between ${
                item.status === 'done'
                  ? 'bg-surface-rose border-ceci-border-brand text-ceci-primary'
                  : item.status === 'today'
                    ? 'bg-white border-rose-500 shadow-2xs'
                    : 'bg-surface-muted border-ceci-border-subtle text-ceci-secondary'
              }`}
            >
              <span className="text-[10px] font-medium lowercase text-ceci-secondary">{item.label}</span>
              <div className="my-1">
                {item.status === 'done' ? (
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                    ✓
                  </span>
                ) : item.status === 'today' ? (
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                    ✨
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-surface-muted border border-ceci-border-default" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-ceci-secondary leading-relaxed border-t border-ceci-border-subtle pt-3">
          sáb e dom são seu descanso ♡ eles não contam como dia ativo nem apagam a chama.
        </p>
      </div>

      {/* Histórico das últimas semanas */}
      <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-3.5">
        <h2 className="font-display font-bold text-base text-ceci-primary">últimas semanas</h2>
        <div className="space-y-2.5">
          {recentWeeks.map((week) => (
            <div key={week.weekStart} className="flex items-center gap-3">
              <span className="w-14 text-[10px] font-semibold text-ceci-tertiary shrink-0">
                {fmtShort(week.weekStart)}–{fmtShort(addDays(week.weekStart, 4))}
              </span>
              <div className="flex-1 flex gap-1.5">
                {week.days.map((d) => (
                  <div
                    key={d.dateKey}
                    title={d.active ? `${d.label} ativo` : d.label}
                    className={`flex-1 h-7 rounded-lg ${
                      d.active
                        ? 'bg-rose-500 shadow-2xs'
                        : 'bg-surface-muted border border-ceci-border-subtle'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Como funciona */}
      <div className="rounded-[24px] p-5 bg-surface-subtle border border-ceci-border-default space-y-3">
        <h2 className="font-display font-bold text-base text-ceci-primary">como funciona a streak ♡</h2>
        <ul className="space-y-2">
          {WHAT_COUNTS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-ceci-primary">
              <CheckCircle2 className="w-4 h-4 text-ceci-brand-strong shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ceci-secondary leading-relaxed border-t border-ceci-border-default pt-3">
          um dia útil com pelo menos uma dessas atividades mantém a chama acesa. se um dia útil
          passar sem nada, a chama se apaga e você recomeça ♡
        </p>
      </div>
    </div>
  );
};