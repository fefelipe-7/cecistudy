import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { countUnlocked, currentValueFor } from '../../lib/stickers';
import { stickerConditionFor } from '../../data/stickerCatalog';
import {
  categoryXpOrDefault,
  levelFor,
  levelTitle,
  xpToNextLevel,
} from '../../lib/levels';
import { ProgressBar } from '../ui/ProgressBar';
import type { Sticker, StickerCondition } from '../../types';

const CATEGORY_LABELS: Record<Sticker['category'], string> = {
  faculdade: 'faculdade',
  estudo: 'estudos & foco',
  leituras: 'leituras',
  jornada: 'jornada',
};

const CATEGORY_ORDER: Sticker['category'][] = ['faculdade', 'estudo', 'leituras', 'jornada'];

/** Tela cheia de stickers & conquistas — desbloqueadas e a buscar. */
export const StickersView: React.FC = () => {
  const { stickers, stickerState, profile } = useMobileApp();
  const unlocked = countUnlocked(stickers);
  const categoryXp = categoryXpOrDefault(profile);

  const progressFor = (st: Sticker): { cur: number; min: number } | null => {
    const condition: StickerCondition | undefined = st.condition ?? stickerConditionFor(st.id);
    if (!condition || !('min' in condition)) return null;
    const cur = stickerState ? currentValueFor(condition, stickerState) : 0;
    return { cur, min: condition.min };
  };

  return (
    <div className="space-y-4 pb-1">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-ceci-primary leading-tight">
              stickers & conquistas
            </h2>
            <p className="text-[11px] text-ceci-secondary">celebrando cada passo do cantinho ♡</p>
          </div>
        </div>
        <div className="bg-ceci-brand-strong px-3.5 py-1.5 rounded-2xl text-right shrink-0">
          <p className="text-[10px] lowercase font-bold text-ceci-on-brand">desbloqueados</p>
          <p className="font-bold text-ceci-on-brand text-sm">
            {unlocked}/{stickers.length}
          </p>
        </div>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const group = stickers.filter((s) => s.category === category);
        if (group.length === 0) return null;
        const groupUnlocked = group.filter((s) => s.unlocked).length;
        const xp = categoryXp[category];
        const xpNext = xpToNextLevel(xp);
        const level = levelFor(xp);

        return (
          <div key={category} className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-base text-ceci-primary">
                  {CATEGORY_LABELS[category]}
                </h3>
                <p className="text-[11px] text-ceci-secondary mt-0.5 truncate">
                  nv. {level} · {levelTitle(category, level)}
                </p>
              </div>
              <span className="text-[11px] text-ceci-secondary shrink-0">
                {groupUnlocked}/{group.length}
              </span>
            </div>

            {!xpNext.isMaxLevel && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-ceci-secondary">
                  <span className="font-semibold">{xpNext.current}/{xpNext.needed} xp</span>
                  <span>{Math.round((xpNext.current / xpNext.needed) * 100)}%</span>
                </div>
                <ProgressBar value={(xpNext.current / xpNext.needed) * 100} className="h-1" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {group.map((st) => {
                const progress = progressFor(st);
                return (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-2xl border text-center transition-colors ${
                      st.unlocked
                        ? 'bg-surface-default border-ceci-border-brand shadow-2xs'
                        : 'bg-surface-muted border-dashed border-ceci-border-default'
                    }`}
                  >
                    <span className={`text-4xl block my-1 ${st.unlocked ? '' : 'opacity-40 grayscale'}`}>
                      {st.emoji}
                    </span>
                    <h4 className="font-display font-bold text-sm text-ceci-primary mt-1">{st.name}</h4>
                    <p className="text-[11px] text-ceci-secondary leading-tight mt-1">{st.description}</p>

                    {st.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand px-2 py-0.5 rounded-full font-medium mt-3">
                        <Sparkles className="w-2.5 h-2.5" />
                        {st.unlockedAt ? `conquistado em ${st.unlockedAt.split('-').reverse().join('/')}` : 'conquistado'}
                      </span>
                    ) : (
                      <div className="mt-3 space-y-1.5">
                        {progress && (
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between text-[9px] text-ceci-secondary">
                              <span className="font-semibold">{progress.cur}/{progress.min}</span>
                              <span>{Math.min(100, Math.round((progress.cur / progress.min) * 100))}%</span>
                            </div>
                            <ProgressBar value={(progress.cur / progress.min) * 100} className="h-1" />
                          </div>
                        )}
                        <span className="inline-flex items-center gap-1 text-[9px] bg-surface-muted text-ceci-tertiary px-2 py-0.5 rounded-full font-medium">
                          <Lock className="w-2.5 h-2.5" />
                          a desbloquear
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};