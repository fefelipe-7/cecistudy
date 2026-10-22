/**
 * HeroVideo — o vídeo de fundo do hero da Home.
 *
 * Componente de **apresentação pura**: não lê contexto, não calcula dado, não
 * navega. Quem decide o que aparece por cima é o `HeroSection`.
 *
 * O que ele garante (e por que cada coisa importa):
 *
 * - **`muted` + `playsInline` + `autoPlay` + `loop`.** Sem `muted`, iOS e
 *   Android **bloqueiam** o autoplay e o hero fica no poster para sempre.
 *   `playsInline` impede o vídeo de abrir em tela cheia no iPhone.
 *   Sem `controls`, não há botão de play — o vídeo é fundo, não player.
 *
 * - **`preload="none"` + `poster`.** O poster é a primeira pintura; o vídeo
 *   entra depois. Sem isso, o hero ficaria vazio até a rede delivering o
 *   arquivo — o que em 3G é exatamente o caminho crítico que o
 *   `spec-performance.md` §6.1 manda tratar como `opportunistic`.
 *
 * - **Não toca sob `prefers-reduced-motion`.** O poster estático é o
 *   fallback (RF-06). O `spec-performance.md` RNF-03 é garantia dura: nenhum
 *   loop continua quando o perfil reduzido está ativo.
 *
 * - **Não carrega em `saveData` / 2G.** Mesma política do prefetch
 *   (`screenPrefetch.ts` §6.3): quem economiza dado não recebe vídeo
 *   automático.
 *
 * - **Pausa fora da viewport e com o documento oculto.** Loop ornamental que
 *   continua rodando com a tela em segundo plano come bateria (RF-05). A
 *   regra mora em `useElementActivity` — o mesmo dono que serve os gráficos
 *   dithered.
 */
import React, { useEffect, useRef } from 'react';

import { useElementActivity } from '../../lib/useElementActivity';
import { prefersReducedMotion } from '../../lib/motion';

export interface HeroVideoProps {
  /** Arquivo mp4 (H.264) — o denominador comum do WebView iOS e Android. */
  srcMp4: string;
  /** Arquivo webm (VP9) — menor no Chrome; o browser pula se não souber. */
  srcWebm?: string;
  /** Primeiro frame, em webp: o que aparece antes do vídeo e sob reduced motion. */
  poster: string;
  /** Classe do `<video>`. O caller controla posição, tamanho e `object-fit`. */
  className?: string;
  testId?: string;
}

/**
 * Política de carregamento: o vídeo é um asset ornamental, então ele só entra
 * quando a rede permite. Mesma leitura do prefetch de chunks
 * (`screenPrefetch.ts` §6.3) — `saveData` e 2G não recebem carga automática.
 */
function podeCarregarVideo(): boolean {
  if (typeof navigator === 'undefined') return true;
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (conn?.saveData) return false;
  const type = conn?.effectiveType;
  if (type === 'slow-2g' || type === '2g') return false;
  return true;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({
  srcMp4,
  srcWebm,
  poster,
  className,
  testId = 'hero-video',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { isActive, onActivityChange } = useElementActivity(videoRef);

  // O sinal de movimento reduzido é lido UMA vez no mount (o mesmo contrato do
  // `useCanvasSetup`): a decisão de carregar ou não o vídeo não muda no meio
  // de uma sessão, e reler a cada render seria trabalho jogado fora.
  const reducedMotion = useRef(prefersReducedMotion()).current;
  const carregar = useRef(reducedMotion ? false : podeCarregarVideo()).current;

  // Toca e pausa conforme a atividade. A regra é do `useElementActivity`:
  // viewport E documento visível.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !carregar) return;

    const sync = (active: boolean) => {
      if (active) {
        // `play()` devolve promessa que rejeita quando o browser recusa
        // (política de autoplay). A rejeição não é erro: o poster fica.
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };

    sync(isActive.current);
    return onActivityChange(sync);
  }, [carregar, isActive, onActivityChange]);

  return (
    <video
      ref={videoRef}
      data-testid={testId}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={carregar}
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    >
      {srcWebm && <source src={srcWebm} type="video/webm" />}
      <source src={srcMp4} type="video/mp4" />
    </video>
  );
};

export default HeroVideo;
