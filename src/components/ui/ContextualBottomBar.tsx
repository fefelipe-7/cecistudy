import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE } from '@/lib/motion';
import { useMotionProfile } from '@/components/motion/MotionProfileProvider';
import { hapticTap } from '@/lib/haptics';
import type { ContextBarAction, ContextBarConfig } from '@/lib/contextBarConfig';

/**
 * Barra inferior contextual — rodapé das telas **auxiliares**.
 *
 * Layout (SPEC-021): duas peças de vidro pura (`liquid-glass-nav`), igual
 * tamanho, centralizadas na base da tela:
 *
 *   [ ação principal (ícone + rótulo + setinha ↑) ]   [ voltar ← ]
 *
 * - A peça da esquerda exibe a ação principal selecionada. Quando há mais de
 *   uma candidata, a setinha expande a peça para cima, mostrando as outras.
 * - A peça da direita exibe "voltar" + seta; toque **sempre** navega de volta.
 * - Sem ação principal candidata: só a peça de "voltar", centralizada.
 *
 * Comportamento de scroll (SPEC-022 D4): as barras abrem fixas na base da
 * tela. Ao rolar para baixo, dão fade out curto até sumir; ao rolar para
 * cima, dão fade in curto e reaparecem. **Invisível é inerte**: não recebe
 * toque e não é anunciada. Trocar de tela reabre a barra visível.
 *
 * Geometria (SPEC-022 D5): a altura da peça, o gap e a folga da base moram
 * nos tokens `--contextual-bar-*` de `src/index.css` — o mesmo lugar de onde
 * o conteúdo tira o espaço que reserva.
 *
 * Nada de pressão longa, nada de gesto de segurar.
 */

export interface ContextualBottomBarProps {
  config: ContextBarConfig | null;
  onBack: () => void;
  /** Chamado quando a ação falha (SPEC-022 D10) — a casca mostra o aviso. */
  onError?: (error: unknown) => void;
}

/**
 * Fade de scroll (SPEC-022 D4).
 *
 * O estado é **real**: a versão anterior guardava a opacidade num `useRef` e
 * só a lia no render, então o fade nunca acontecia — e, como a barra nunca é
 * desmontada, o valor atravessava telas: a barra podia **abrir invisível**,
 * sumir sozinha num re-render alheio e não voltar.
 *
 * A troca de contexto zera o estado **por derivação** (`fade.key !== key`),
 * sem `useEffect`: a barra nova já nasce visível, no mesmo render.
 */
const useScrollFade = (contextKey: string) => {
  const [fade, setFade] = useState<{ key: string; hidden: boolean }>({
    key: contextKey,
    hidden: false,
  });
  const lastScrollYRef = useRef(window.scrollY);
  const keyRef = useRef(contextKey);
  keyRef.current = contextKey;

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const current = window.scrollY;
        const prev = lastScrollYRef.current;
        if (current !== prev) {
          // rolando para baixo: sumir. rolando para cima: reaparecer.
          setFade({ key: keyRef.current, hidden: current > prev });
        }
        lastScrollYRef.current = current;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return fade.key === contextKey ? fade.hidden : false;
};

/**
 * Quanto o teclado virtual empurra a tela (SPEC-022 D11).
 *
 * A barra é `fixed` e o app abre o teclado em modo `Native`
 * (`src/lib/native.ts:19`), o que **redimensiona** o WebView: a viewport de
 * layout encurta e a barra, ancorada na base, sobe por cima do conteúdo —
 * inclusive do campo que a usuária está editando. A `visualViewport` diz
 * quanto da janela está realmente visível; a diferença é o tanto que o
 * teclado tomou.
 *
 * Sem `visualViewport` (WebView antigo), o valor é 0 e a barra fica como
 * estava — degradação segura.
 */
const useKeyboardInset = () => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const read = () => {
      const taken = window.innerHeight - vv.height - vv.offsetTop;
      setInset(taken > 0 ? Math.round(taken) : 0);
    };
    read();
    vv.addEventListener('resize', read);
    vv.addEventListener('scroll', read);
    return () => {
      vv.removeEventListener('resize', read);
      vv.removeEventListener('scroll', read);
    };
  }, []);

  return inset;
};

export const ContextualBottomBar: React.FC<ContextualBottomBarProps> = ({
  config,
  onBack,
  onError,
}) => {
  const profile = useMotionProfile();
  const reduced = profile.reduced;

  // Todos os hooks rodam em toda renderização; o `config` nulo só decide o
  // que é renderizado, nunca se os hooks rodam (Rules of Hooks).
  const contextKey = config?.contextKey ?? '';
  const hidden = useScrollFade(contextKey);
  const keyboardInset = useKeyboardInset();

  /**
   * A expansão é derivada do contexto (SPEC-022 D6): trocar de tela fecha,
   * sem `useEffect` e sem quadro extra. Antes o `expandedActionId` era um
   * estado solto e a expansão "vazava" de uma tela para outra.
   */
  const [expanded, setExpanded] = useState<{ key: string; id: string } | null>(null);
  const expandedId = expanded && expanded.key === contextKey ? expanded.id : null;

  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  // Trocar de contexto destrava a barra: a ação que estava em andamento
  // pertencia à tela anterior.
  useEffect(() => {
    busyRef.current = false;
    setBusy(false);
  }, [contextKey]);

  const runAction = useCallback(
    (action: ContextBarAction) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      void (async () => {
        try {
          await action.onSelect();
        } catch (error) {
          // Falhou: a casca avisa (SPEC-022 D10) — silêncio leria como
          // "app travado".
          onError?.(error);
        } finally {
          busyRef.current = false;
          setBusy(false);
        }
      })();
    },
    [onError],
  );

  const handleSelectPrimary = useCallback(
    (action: ContextBarAction) => {
      setExpanded(null);
      hapticTap();
      runAction(action);
    },
    [runAction],
  );

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpanded((prev) =>
        prev?.id === id && prev.key === contextKey ? null : { key: contextKey, id },
      );
      hapticTap();
    },
    [contextKey],
  );

  const primaryActions = config?.primaryActions ?? [];
  const primary = primaryActions[0] ?? null;
  const hasMultiple = primaryActions.length > 1;
  const Icon = primary?.Icon;
  const expandedOpen = primary != null && expandedId === primary.id;

  return (
    /**
     * A entrada e a saída usam o **mesmo envelope da barra de abas**
     * (`navBar`, fade + subida): assim as duas peças de vidro nunca ficam
     * sobrepostas na base da tela durante a troca (SPEC-022 D9).
     *
     * A opacidade do **fade de scroll** mora na peça de dentro: são dois
     * opacidades que se multiplicam, e não uma disputa pelo mesmo atributo.
     */
    <AnimatePresence initial={false}>
      {config ? (
        <motion.div
          key="contextual-bar-host"
          data-testid="contextual-bar-host"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: profile.d.navBar, ease: EASE.standard }}
          // O teclado virtual encolhe a janela; a barra sobe junto com o
          // conteúdo em vez de cobrir o campo focado (D11).
          style={
            keyboardInset > 0
              ? { bottom: `calc(var(--contextual-bar-margin) + ${keyboardInset}px)` }
              : undefined
          }
          className="fixed inset-x-0 bottom-[calc(var(--contextual-bar-margin)+env(safe-area-inset-bottom,0px))] z-30 flex justify-center px-3 pointer-events-none"
        >
          <motion.div
            data-testid="contextual-bar"
            initial={false}
            animate={{ opacity: hidden ? 0 : 1 }}
            transition={{ duration: reduced ? 0 : profile.d.contextBar, ease: EASE.standard }}
            // Invisível é inerte: sem toque e fora da árvore de leitura (D4).
            inert={hidden ? true : undefined}
            className={cn(
              'pointer-events-auto flex items-center justify-center gap-[var(--contextual-bar-gap)]',
              // As peças medem o próprio conteúdo; só encolhem (com o rótulo
              // truncado) quando a soma não cabe na tela.
              'min-w-0 max-w-full',
              hidden && 'pointer-events-none',
            )}
          >
            {/* Peça da esquerda: a ação principal e, quando há outras
                candidatas, a setinha que expande para cima. São **dois botões
                irmãos** — antes a setinha era um `div role="button"` dentro de
                um `<button>` (HTML inválido, e inalcançável por teclado). */}
            {primary && (
              <div className="relative flex items-center min-w-0">
                <div className="liquid-glass-nav border rounded-full flex items-center h-[var(--contextual-bar-height)] max-w-full shadow-floating pl-4 pr-0.5">
                  <motion.button
                    type="button"
                    data-testid="contextual-bar-primary"
                    onClick={() => handleSelectPrimary(primary)}
                    disabled={busy || primary.disabled}
                    aria-label={primary.ariaLabel}
                    aria-busy={busy}
                    animate={{ scale: busy ? 0.99 : 1 }}
                    transition={{ duration: profile.d.pressIn, ease: EASE.emphasized }}
                    className={cn(
                      'flex items-center gap-2 h-full min-w-0 cursor-pointer tap-interactive',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand',
                      busy || primary.disabled
                        ? 'opacity-70 cursor-not-allowed'
                        : 'active:scale-[0.98]',
                    )}
                  >
                    {Icon ? <Icon className="w-4 h-4 shrink-0 text-ceci-primary" /> : null}
                    <span className="truncate text-xs font-semibold text-ceci-primary">
                      {primary.label}
                    </span>
                  </motion.button>

                  {hasMultiple && (
                    <motion.button
                      type="button"
                      data-testid="contextual-bar-expand"
                      onClick={() => handleToggleExpand(primary.id)}
                      aria-label={
                        expandedOpen ? 'ocultar outras ações' : 'ver outras ações principais'
                      }
                      aria-expanded={expandedOpen}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        width: 'var(--contextual-bar-height)',
                        height: 'var(--contextual-bar-height)',
                      }}
                      className={cn(
                        'liquid-glass-nav rounded-full flex items-center justify-center shrink-0',
                        'cursor-pointer tap-interactive focus:outline-none',
                        'focus-visible:ring-2 focus-visible:ring-ceci-brand',
                      )}
                    >
                      <ChevronUp className="w-4 h-4 text-ceci-primary" aria-hidden />
                    </motion.button>
                  )}
                </div>

                {/* Expansão para cima: as outras candidatas. O containing block
                    é a peça (que é `relative`), e o painel alinha pela
                    direita — antes ele resolvia contra o host `fixed` e abria
                    para cima à esquerda, longe da setinha que o abriu. */}
                <AnimatePresence>
                  {hasMultiple && expandedOpen && (
                    <motion.div
                      data-testid="contextual-bar-expanded"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{
                        duration: reduced ? 0 : profile.d.contextMenu,
                        ease: EASE.standard,
                      }}
                      className="absolute bottom-[calc(var(--contextual-bar-height)+8px)] right-0 liquid-glass-nav rounded-2xl shadow-floating p-1 flex flex-col gap-1 pointer-events-auto max-w-[calc(100vw-1.5rem)]"
                    >
                      {primaryActions.slice(1).map((action) => (
                        <motion.button
                          key={action.id}
                          type="button"
                          onClick={() => handleSelectPrimary(action)}
                          disabled={action.disabled}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium',
                            'transition-colors duration-200 cursor-pointer tap-interactive focus:outline-none',
                            'focus-visible:ring-2 focus-visible:ring-ceci-brand',
                            'bg-transparent text-ceci-primary hover:bg-surface-muted',
                            action.disabled ? 'opacity-45 cursor-not-allowed' : '',
                          )}
                        >
                          {action.Icon ? (
                            <action.Icon className="w-4 h-4 shrink-0 text-ceci-brand" />
                          ) : null}
                          <span className="flex-1 truncate">{action.label}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Peça da direita: "voltar" + seta — sempre navega. */}
            <motion.button
              type="button"
              data-testid="contextual-bar-back"
              onClick={onBack}
              aria-label="voltar para a tela anterior"
              className={cn(
                'liquid-glass-nav border rounded-full flex items-center gap-2 pointer-events-auto cursor-pointer tap-interactive',
                'h-[var(--contextual-bar-height)] shadow-floating px-4 shrink-0',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand',
                'transition-[filter] duration-200 active:scale-[0.98]',
              )}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-xs font-semibold text-ceci-primary">voltar</span>
              <ChevronLeft className="w-4 h-4 shrink-0 text-ceci-primary" aria-hidden />
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
