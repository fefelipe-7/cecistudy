/**
 * Atividade de um elemento na tela: está na viewport **E** o documento está
 * visível.
 *
 * Este é o único dono da regra "loop ornamental pausa fora de vista ou com o
 * documento oculto" (`spec-performance.md` RF-05/RNF-03).-existiam duas
 * Kopien: o `useCanvasSetup` resolvia para os gráficos dithered, e o vídeo do
 * hero precisaria da mesma coisa — resolver de novo é nascer em dois lugares.
 *
 * Por que a combinação (e não só a viewport):
 *
 * - Só a viewport ignora a aba em segundo plano: o canvas continua pedindo
 *   frame com a aba escondida (corrigido pela F4 do `useCanvasSetup`).
 * - Só o documento ignora o elemento rolado para fora: o app continua animando
 *   um gráfico que ninguém vê.
 *
 * As duas fontes escrevem em refs separadas e o combinado só muda quando o
 * combinado de fato muda — a Activity é transbordada por callback, e quem
 * assina reage a transições, não a cada evento.
 */
import { useEffect, useRef, type RefObject } from 'react';

export interface UseElementActivityResult {
  /**
   * Verdadeiro quando o elemento está na viewport E o documento está
   * visível. É um ref, não estado: quem consulta no loop (o `requestAnimationFrame`)
   * não pode depender de re-render.
   */
  isActive: RefObject<boolean>;
  /**
   * Assina transições de atividade. Retorna a função de cancelamento.
   * O callback recebe `true` quando ficou ativo e `false` quando ficou inativo.
   */
  onActivityChange: (cb: (active: boolean) => void) => () => void;
}

/**
 * Observa a atividade de um elemento.
 *
 * @param elementRef  o elemento observado (o vídeo, o canvas).
 * @param rootMargin  margem do IntersectionObserver. O default `100px` antecipa
 *                    a ativação em ~uma tela de rolagem — o elemento já está
 *                    quase visível quando o loop começa.
 */
export function useElementActivity(
  elementRef: RefObject<Element | null>,
  rootMargin = '100px',
): UseElementActivityResult {
  const viewportRef = useRef(true);
  // Lê o estado REAL no mount: elemento montado com a aba já em background
  // não pode animar até um `visibilitychange` chegar.
  const documentRef = useRef(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );
  const isActive = useRef(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );
  const activityListeners = useRef(new Set<(active: boolean) => void>());

  const onActivityChange = (cb: (active: boolean) => void) => {
    activityListeners.current.add(cb);
    return () => {
      activityListeners.current.delete(cb);
    };
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateActivity = () => {
      const next = viewportRef.current && documentRef.current;
      if (next === isActive.current) return;
      isActive.current = next;
      for (const cb of activityListeners.current) cb(next);
    };

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              viewportRef.current = entry.isIntersecting;
              updateActivity();
            },
            { rootMargin },
          )
        : null;
    io?.observe(element);

    const handleVisibility = () => {
      documentRef.current = document.visibilityState === 'visible';
      updateActivity();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [elementRef, rootMargin]);

  return { isActive, onActivityChange };
}
