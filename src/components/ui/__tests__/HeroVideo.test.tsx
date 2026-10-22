/**
 * Contrato do vídeo do hero (`HeroVideo`).
 *
 * O que este teste garante — e por que cada uma dessas coisas é uma GARANTIA,
 * não convenção:
 *
 * - **`muted` + `playsInline` + `loop` + `autoPlay`.** Sem `muted`, iOS e
 *   Android bloqueiam o autoplay e o hero fica no poster para sempre. Sem
 *   `playsInline`, o iPhone abre o vídeo em tela cheia. Sem `loop`, o vídeo
 *   para na última volta. Sem `autoPlay`, ele nunca começa.
 *
 * - **`preload="none"` + `poster`.** O poster é a primeira pintura; sem
 *   `preload="none"` o browser joga o download no caminho crítico.
 *
 * - **Sem `controls`.** O vídeo é fundo, não player: um botão de play
 *   apareceria no meio do hero.
 *
 * - **`aria-hidden` + `tabIndex={-1}`.** O vídeo não carrega informação: a
 *   saudação em texto é a conteúdo. Ele não pode ser lido pelo leitor de
 *   tela nem receber foco.
 *
 * - **`prefers-reduced-motion` → não autoplaya.** O `spec-performance.md`
 *   RNF-03 é garantia dura: nenhum loop continua quando o perfil reduzido
 *   está ativo. O poster estático é o fallback.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HeroVideo } from '../HeroVideo';

function mockReducedMotion(reduce: boolean) {
  // O jsdom não tem `matchMedia` — ele é DEFINIDO aqui, não espiado.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        matches: reduce && query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  });
}

/** O `HTMLMediaElement` do jsdom não implementa `play`/`pause` de verdade. */
function mockMedia() {
  const play = vi.fn().mockResolvedValue(undefined);
  const pause = vi.fn();
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', { value: play, writable: true });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', { value: pause, writable: true });
  return { play, pause };
}

let media: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> };

beforeEach(() => {
  media = mockMedia();
  mockReducedMotion(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HeroVideo (contrato do vídeo de fundo do hero)', () => {
  it('toca em loop, mudo e inline — o que o autoplay mobile exige', () => {
    render(<HeroVideo srcMp4="/media/hero-home.mp4" poster="/media/hero-home-poster.webp" />);

    const video = screen.getByTestId('hero-video');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('autoplay');
    // `muted` é PROPRIEDADE, não atributo: o React a escreve no DOM, e é a
    // propriedade que o browser lê para decidir o autoplay. Verificar o
    // atributo daria `null` num vídeo perfeitamente mudo — o atributo `muted`
    // não é refletido no DOM.
    expect((video as HTMLVideoElement).muted).toBe(true);
    // E o que prova de verdade: o vídeo foi mandado tocar.
    expect(media.play).toHaveBeenCalled();
  });

  it('não tem controles: o vídeo é fundo, não player', () => {
    render(<HeroVideo srcMp4="/media/hero-home.mp4" poster="/media/hero-home-poster.webp" />);

    const video = screen.getByTestId('hero-video');
    expect(video).not.toHaveAttribute('controls');
  });

  it('carrega com preload=none e mostra o poster antes do vídeo', () => {
    render(<HeroVideo srcMp4="/media/hero-home.mp4" poster="/media/hero-home-poster.webp" />);

    const video = screen.getByTestId('hero-video');
    expect(video).toHaveAttribute('preload', 'none');
    expect(video).toHaveAttribute('poster', '/media/hero-home-poster.webp');
  });

  it('é decorativo: fora da árvore de leitura e sem foco', () => {
    render(<HeroVideo srcMp4="/media/hero-home.mp4" poster="/media/hero-home-poster.webp" />);

    const video = screen.getByTestId('hero-video');
    expect(video).toHaveAttribute('aria-hidden', 'true');
    expect(video).toHaveAttribute('tabindex', '-1');
  });

  it('oferece o webm antes do mp4 (o browser pula o que não decodifica)', () => {
    render(
      <HeroVideo
        srcMp4="/media/hero-home.mp4"
        srcWebm="/media/hero-home.webm"
        poster="/media/hero-home-poster.webp"
      />,
    );

    const sources = screen.getByTestId('hero-video').querySelectorAll('source');
    expect(sources).toHaveLength(2);
    expect(sources[0]).toHaveAttribute('type', 'video/webm');
    expect(sources[1]).toHaveAttribute('type', 'video/mp4');
  });

  it('reduced motion: não autoplaya — o poster estático é o fallback', () => {
    mockReducedMotion(true);
    render(<HeroVideo srcMp4="/media/hero-home.mp4" poster="/media/hero-home-poster.webp" />);

    const video = screen.getByTestId('hero-video');
    expect(video).not.toHaveAttribute('autoplay');
  });
});
