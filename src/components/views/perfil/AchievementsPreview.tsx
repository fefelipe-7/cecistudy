// Perfil — "eu construí": conquistas, nível e ofensiva (SPEC-013 D8).
//
// Absorve o antigo `StudyStatsWidget` como **item** (a ofensiva detalhada abre a
// tela própria por `openStreak`) e o `StickersSection` com uma mudança de tom:
// nada de grade de emojis cinza — quem está bloqueado vira silhueta (§7).
import React from 'react';
import { ArrowRight, Flame, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProfileAchievements } from '../../../lib/profileViewModel';

interface AchievementsPreviewProps {
  achievements: ProfileAchievements;
  onOpenStickers: () => void;
  onOpenStreak: () => void;
}

/** Quantos stickers aparecem na linha de amostra. */
const VISIBLE = 6;

const AchievementsPreview: React.FC<AchievementsPreviewProps> = ({
  achievements,
  onOpenStickers,
  onOpenStreak,
}) => {
  const sample = achievements.visible.slice(0, VISIBLE);
  const { streak } = achievements;

  return (
    <section
      aria-labelledby="perfil-conquistas-titulo"
      className="rounded-3xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-ceci-brand-strong" aria-hidden="true" />
          <h2 id="perfil-conquistas-titulo" className="font-display font-bold text-xl text-ceci-primary">
            conquistas
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenStickers}
          className="touch-target shrink-0 inline-flex items-center gap-1 rounded-full border border-ceci-border-default px-3 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
        >
          ver todas
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="rounded-2xl bg-surface-rose border border-ceci-border-brand px-3.5 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-sm font-bold text-ceci-brand-strong">
            nível {achievements.level} · {achievements.title}
          </span>
          <span className="text-[11px] text-ceci-secondary">
            {achievements.unlocked} de {achievements.total}
          </span>
        </div>
        {achievements.next ? (
          <div className="space-y-1">
            <div
              role="progressbar"
              aria-valuenow={achievements.next.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${achievements.next.progress}% rumo ao próximo nível`}
              className="h-1.5 rounded-full bg-ceci-border-subtle overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-ceci-brand"
                style={{ width: `${achievements.next.progress}%` }}
              />
            </div>
            <p className="text-[11px] text-ceci-secondary">{achievements.next.label}</p>
          </div>
        ) : null}
      </div>

      {sample.length > 0 ? (
        <ul className="flex items-center gap-2">
          {sample.map((sticker) => (
            <li
              key={sticker.id}
              title={sticker.unlocked ? sticker.name : 'ainda bloqueado'}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-base border',
                sticker.unlocked
                  ? 'bg-surface-default border-ceci-border-brand'
                  : 'bg-surface-muted border-ceci-border-subtle text-ceci-muted',
              )}
            >
              <span aria-hidden="true">{sticker.unlocked ? sticker.emoji : <Lock className="w-3.5 h-3.5" />}</span>
              <span className="sr-only">
                {sticker.unlocked ? `${sticker.name}, desbloqueado` : `${sticker.name}, bloqueado`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={onOpenStreak}
        aria-label={`ofensiva atual de ${streak.current} dias. abrir a tela da ofensiva.`}
        className="touch-target w-full flex items-center gap-3 rounded-2xl bg-surface-muted border border-ceci-border-subtle px-3.5 py-3 text-left hover:border-ceci-border-default transition-colors cursor-pointer"
      >
        <Flame
          className={cn('w-5 h-5', streak.alive ? 'text-status-warning-strong' : 'text-ceci-muted')}
          aria-hidden="true"
        />
        <span className="flex-1 min-w-0">
          <span className="block font-display text-sm font-bold text-ceci-primary">
            ofensiva de {streak.current} {streak.current === 1 ? 'dia' : 'dias'}
          </span>
          <span className="block text-[11px] text-ceci-secondary">
            {streak.alive ? `recorde: ${streak.longest} dias` : `melhor sequência: ${streak.longest} dias`}
          </span>
        </span>
        <ArrowRight className="w-4 h-4 text-ceci-muted" aria-hidden="true" />
      </button>
    </section>
  );
};

export default AchievementsPreview;
