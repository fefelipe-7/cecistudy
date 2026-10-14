/**
 * SPEC-013 D8 — a ofensiva entra como **item** de conquistas (abre a tela por
 * `onOpenStreak`), o nível/título e o próximo objetivo aparecem, e os stickers
 * bloqueados viram silhueta, nunca grade de emojis cinza (§7).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementsPreview from '../AchievementsPreview';
import type { ProfileAchievements } from '../../../../lib/profileViewModel';
import type { Sticker } from '../../../../types';

const sticker = (over: Partial<Sticker> = {}): Sticker => ({
  id: 'stk-1',
  name: 'primeira leitura',
  emoji: '📖',
  description: 'terminou a primeira leitura',
  unlocked: true,
  category: 'leituras',
  ...over,
});

const achievements = (over: Partial<ProfileAchievements> = {}): ProfileAchievements => ({
  level: 4,
  title: 'caminhante',
  unlocked: 2,
  total: 5,
  visible: [
    sticker({ id: 'stk-1', emoji: '📖', unlocked: true }),
    sticker({ id: 'stk-2', emoji: '🌱', name: 'primeira tarefa', unlocked: false }),
  ],
  next: { label: 'rumo ao nível 5', progress: 40 },
  streak: { current: 3, longest: 7, total: 20, alive: true },
  ...over,
});

describe('AchievementsPreview', () => {
  it('mostra nível, título, progresso e a contagem desbloqueada', () => {
    render(
      <AchievementsPreview
        achievements={achievements()}
        onOpenStickers={vi.fn()}
        onOpenStreak={vi.fn()}
      />,
    );
    expect(screen.getByText('nível 4 · caminhante')).toBeTruthy();
    expect(screen.getByText('2 de 5')).toBeTruthy();
    expect(screen.getByText('rumo ao nível 5')).toBeTruthy();
  });

  it('a ofensiva é um item que abre a tela própria', () => {
    const onOpenStreak = vi.fn();
    render(
      <AchievementsPreview
        achievements={achievements()}
        onOpenStickers={vi.fn()}
        onOpenStreak={onOpenStreak}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /ofensiva atual de 3 dias/ }));
    expect(onOpenStreak).toHaveBeenCalledTimes(1);
  });

  it('o sticker bloqueado é silhueta (bloqueado), o desbloqueado mostra o emoji', () => {
    render(
      <AchievementsPreview
        achievements={achievements()}
        onOpenStickers={vi.fn()}
        onOpenStreak={vi.fn()}
      />,
    );
    expect(screen.getByText('primeira leitura, desbloqueado')).toBeTruthy();
    expect(screen.getByText('primeira tarefa, bloqueado')).toBeTruthy();
    // O emoji do bloqueado não é renderizado como texto visível.
    expect(screen.queryByText('🌱')).toBeNull();
  });

  it('"ver todas" abre a tela de stickers', () => {
    const onOpenStickers = vi.fn();
    render(
      <AchievementsPreview
        achievements={achievements()}
        onOpenStickers={onOpenStickers}
        onOpenStreak={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /ver todas/ }));
    expect(onOpenStickers).toHaveBeenCalledTimes(1);
  });

  it('sem próximo objetivo (teto), não renderiza a barra de progresso', () => {
    render(
      <AchievementsPreview
        achievements={achievements({ next: undefined })}
        onOpenStickers={vi.fn()}
        onOpenStreak={vi.fn()}
      />,
    );
    expect(screen.queryByText(/rumo ao nível/)).toBeNull();
  });

  it('sem stickers desbloqueados, ainda lista as silhuetas', () => {
    render(
      <AchievementsPreview
        achievements={achievements({ unlocked: 0, visible: [sticker({ unlocked: false })] })}
        onOpenStickers={vi.fn()}
        onOpenStreak={vi.fn()}
      />,
    );
    expect(screen.getByText('0 de 5')).toBeTruthy();
    expect(screen.getByText('primeira leitura, bloqueado')).toBeTruthy();
  });
});
