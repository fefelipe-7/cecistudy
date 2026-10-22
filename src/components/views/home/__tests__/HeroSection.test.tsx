/**
 * Contrato do hero da Home (SPEC-023 D4).
 *
 * O que este teste fixa é o que a usuária pediu — e o que é fácil quebrar
 * sem perceber:
 *
 * - o vídeo fica **dentro** de um card (com raio e borda), não solto;
 * - o card é **fino** (faixa), não um bloco quadrado;
 * - o texto fica à **esquerda** (a arte tem a cecinho à direita);
 * - o interruptor `HERO_VIDEO.enabled` continua existindo e devolve a forma
 *   antiga.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import HeroSection from '../HeroSection';
import { HERO_VIDEO } from '../heroVideo.config';

/** O `HTMLMediaElement` do jsdom não implementa `play`/`pause` de verdade. */
function mockMedia() {
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    value: vi.fn().mockResolvedValue(undefined), writable: true,
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    value: vi.fn(), writable: true,
  });
}

beforeEach(() => {
  mockMedia();
});

const renderHero = () =>
  render(
    <HeroSection
      formattedDate="quinta-feira, 22 de outubro"
      greeting="boa tarde"
      name="Marina"
      dayMessage="duas provas na semana, bora?"
    />
  );

describe('HeroSection da Home', () => {
  it('o vídeo fica dentro de um card (raio + borda), não solto', () => {
    renderHero();
    const card = screen.getByTestId('hero-card');
    expect(card.className).toContain('rounded-[26px]');
    expect(card.className).toContain('border');
  });

  it('o card é uma faixa fina, com proporção de 3:1 e teto de altura', () => {
    renderHero();
    const card = screen.getByTestId('hero-card');
    expect(card.className).toContain('aspect-[3/1]');
    expect(card.className).toContain('max-h-');
  });

  it('o texto fica à esquerda, numa coluna estreita (a cecinho fica livre)', () => {
    renderHero();
    const h1 = screen.getByRole('heading', { level: 1 });
    const bloco = h1.parentElement;
    expect(bloco?.className).toContain('max-w-');
    expect(h1.textContent).toContain('Marina');
  });

  it('o vídeo é a superfície do card e enquadra a base da arte', () => {
    renderHero();
    const video = screen.getByTestId('hero-card').querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.className).toContain('object-cover');
    // A base da arte: a grama e a cecinho. O céu é a faixa do tema acima
    // do card, não a imagem.
    expect(video?.className).toContain('object-[50%_100%]');
  });

  it('com o interruptor desligado, volta a forma antiga (sem vídeo)', () => {
    // O config é `as const` (o interruptor é readonly no tipo); o teste
    // alterna em runtime, que é o que o interruptor é para existir.
    const flag = HERO_VIDEO as { enabled: boolean };
    const original = flag.enabled;
    flag.enabled = false;
    try {
      renderHero();
      expect(screen.queryByTestId('hero-card')).toBeNull();
      expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Marina');
    } finally {
      flag.enabled = original;
    }
  });
});
