import { useCallback, useEffect, useRef, useState } from 'react';

import {
  chromeReducer,
  ESTADO_INICIAL,
  IDLE_HIDE_MS,
  type ChromeEvent,
  type ChromeState,
} from './chromeVisibility';

/**
 * Dono do listener de rolagem e do temporizador de inatividade (SPEC-M-019 D4,
 * §5.4). A máquina está em `chromeVisibility.ts`; aqui só mora o que tem
 *efeito colateral.
 *
 * ## Três garantias
 *
 * 1. **Passivo e coalescido.** `addEventListener(..., { passive: true })` e o
 *    tratamento marcado para o próximo `requestAnimationFrame`. Rolagem longa
 *    dispara dezenas de eventos por segundo e **no máximo um** tratamento por quadro.
 * 2. **Um** temporizador, e ele é dono do hook. Nasce quando a barra fica
 *    visível e não está presa; qualquer rolagem, troca de tela ou unmount cancela.
 * 3. **Fechamento assíncrono.** `setState` nunca roda depois do unmount — a
 *    referência de "montado" é lida no callback, não capturada.
 *
 * ## Por que `reduced` e `foco` vêm por parâmetro (A8)
 *
 * `src/lib/` não deve importar `src/components/motion/` — a dependência aponta
 * para o outro lado. O hook recebe `reduced: boolean` e o componente passa
 * `profile.reduced`, que é o sinal do **sistema**, não da plataforma.
 */
export interface UseChromeVisibilityOptions {
  /** `true` sob movimento reduzido: as barras **nunca** somem (A8, J5). */
  readonly reduced: boolean;
  /** Desliga o efeito inteiro — para teste e para quem não monta o chrome. */
  readonly ativo?: boolean;
}

export interface ChromeVisibility {
  readonly estado: ChromeState;
  /** Cancelado em qualquer rolagem — é isso que impede o piscar (D9). */
  readonly notificarRolagem: () => void;
  readonly notificarNavegou: () => void;
  readonly notificarMenu: (aberto: boolean) => void;
  /** O foco entrou/saiu das barras (A8, J6). */
  readonly notificarFoco: (dentro: boolean) => void;
}

export function useChromeVisibility({
  reduced,
  ativo = true,
}: UseChromeVisibilityOptions): ChromeVisibility {
  const [estado, setEstado] = useState<ChromeState>(ESTADO_INICIAL);

  // Refs, não estado: o listener e o temporizador precisam ler o estado atual
  // sem depender da identidade dele — senão o efeito se recriaria a cada
  // mudança e o `rAF` cancelaria o agendamento no meio.
  const estadoRef = useRef<ChromeState>(ESTADO_INICIAL);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const ativoRef = useRef(ativo);
  ativoRef.current = ativo;

  const ultimaYRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const montadoRef = useRef(true);

  const despacha = useCallback((evento: ChromeEvent) => {
    if (!montadoRef.current) return;
    // Sob movimento reduzido, o sumiço simplesmente não existe (A8): os dois
    // eventos que o produzem são ignorados, e com eles o custo de re-renderizar
    // o shell a cada rolagem. Os demais (foco, menu, navegação) continuam
    // alimentando a máquina — a fixação por foco vale nos dois perfis.
    if (reducedRef.current && (evento.type === 'rolou' || evento.type === 'parou')) return;
    const proximo = chromeReducer(estadoRef.current, evento);
    if (proximo === estadoRef.current) return;
    estadoRef.current = proximo;
    setEstado(proximo);
  }, []);

  const notificarRolagem = useCallback(() => {
    despacha({ type: 'rolou', delta: 0, scrollY: window.scrollY });
  }, [despacha]);

  const notificarNavegou = useCallback(() => {
    ultimaYRef.current = 0;
    despacha({ type: 'navegou' });
  }, [despacha]);

  const notificarMenu = useCallback(
    (aberto: boolean) => {
      despacha(aberto ? { type: 'menu-abriu' } : { type: 'menu-fechou' });
    },
    [despacha],
  );

  const notificarFoco = useCallback(
    (dentro: boolean) => {
      despacha({ type: 'focou', dentro });
    },
    [despacha],
  );

  // --- listener de rolagem -------------------------------------------------
  useEffect(() => {
    if (!ativo) return;
    montadoRef.current = true;
    ultimaYRef.current = window.scrollY;

    const tratar = () => {
      rafRef.current = null;
      const y = window.scrollY;
      const delta = y - ultimaYRef.current;
      ultimaYRef.current = y;
      despacha({ type: 'rolou', delta, scrollY: y });
    };

    const onScroll = () => {
      // Coalescer: um `rAF` por quadro, mesmo com dezenas de eventos.
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(tratar);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [ativo, despacha]);

  // --- temporizador de inatividade -----------------------------------------
  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Nada para agendar: movimento reduzido (A8), no topo (J3), menu aberto (J7)
    // ou foco dentro das barras (J6).
    if (!ativo || reduced || !estado.visivel || estado.noTopo || estado.preso || estado.foco) return;

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      despacha({ type: 'parou', aposMs: IDLE_HIDE_MS });
    }, IDLE_HIDE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ativo, despacha, estado, reduced]);

  // --- movimento reduzido ligando no meio da sessão ------------------------
  //
  // Bug real que este efeito fecha: se o `prefers-reduced-motion` mudar para
  // `reduce` **enquanto a barra está escondida**, sem este efeito ela ficaria
  // escondida — o sumiço só voltaria no próximo evento de rolagem, e a usuária
  // ficaria sem a ação principal exatamente no modo em que mais precisa dela
  // (A8).
  useEffect(() => {
    if (!reduced || !montadoRef.current) return;
    const atual = estadoRef.current;
    if (atual.visivel && atual.noTopo && !atual.preso && !atual.foco) return;
    // Preserva o que **prende** (painel aberto, foco dentro) e devolve o resto ao
    // início: o reset não pode desprender um painel que está na tela.
    const proximo: ChromeState = { ...ESTADO_INICIAL, preso: atual.preso, foco: atual.foco };
    estadoRef.current = proximo;
    setEstado(proximo);
  }, [reduced]);

  // --- unmount --------------------------------------------------------------
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      // `montadoRef` é lido pelo `despacha`: sem ele, um `rAF` ou timeout que
      // sobreviver chamaria `setState` numa árvore desmontada.
      montadoRef.current = false;
    };
  }, []);

  return { estado, notificarRolagem, notificarNavegou, notificarMenu, notificarFoco };
}