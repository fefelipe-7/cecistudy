"use client";

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';

import { ContextualBarMenu } from '@/components/ui/ContextualBarMenu';
import { EASE } from '@/lib/motion';
import { CHROME_FADE_IN, CHROME_FADE_OUT } from '@/lib/chromeVisibility';
import type { ContextualBarModel } from '@/lib/contextualBar';
import { hapticSelection } from '@/lib/haptics';
import type { HeaderAction } from '@/types';
import { cn } from '@/lib/utils';

/**
 * As duas barras (SPEC-M-019).
 *
 * ```text
 *   [ ← voltar ]   [ ⋯  nova anotação de aula ]
 *   h-14           flex-1 · shrink-0
 * ```
 *
 * ## Regras que o componente respeita e não reimplementa
 *
 * - **Visibilidade** é da máquina de `src/lib/chromeVisibility.ts`. Aqui só se
 *   lê. O `⋯` e a cápsula não sabem nada de rolagem.
 * - **`inert` quando oculta** (D2). Opacidade zero sozinha deixa o botão no
 *   percurso de foco e na árvore de acessibilidade — o original proíbe os dois
 *   (§10.2) e proíbe invisível interceptando toque (§8.4).
 * - **Só `opacity` no wrapper** (D3). Um `transform` aqui viraria containing
 *   block do `fixed` interno — está escrito em
 *   `src/shells/MobileAppShell.tsx:292-296`.
 * - **As duas barras compartilham um estado** (D11). Uma fonte, um instante.
 * - **Sem recognizer** (A7). Clique é clique.
 */

export interface ContextualBarsProps {
  /** Modelo derivado. `null` = barra ausente; nada é montado. */
  readonly model: ContextualBarModel | null;
  /** `performBack` do shell — **não** `goBack` cru (SPEC-M-018 A2). */
  readonly onBack: () => void;
  readonly onRunAction: (action: HeaderAction) => void;
  /** Estado da máquina de visibilidade. */
  readonly visivel: boolean;
  readonly inert: boolean;
  /** Avisa a máquina: o menu abriu/fechou, para as barras ficarem presas (D8). */
  readonly onMenuChange?: (aberto: boolean) => void;
  /**
   * Avisa a máquina que o foco de teclado entrou/saiu das barras (A8, J6).
   *
   * O foco é detectado **aqui** porque é o componente que tem o DOM; a máquina
   * não conhece evento nenhum.
   */
  readonly onFocusChange?: (dentro: boolean) => void;
  readonly className?: string;
}

export function ContextualBars({
  model,
  onBack,
  onRunAction,
  visivel,
  inert,
  onMenuChange,
  onFocusChange,
  className,
}: ContextualBarsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const optionsRef = useRef<HTMLButtonElement>(null);

  if (!model) return null;
  const { plan } = model;

  const principal = model.primary[0] ?? null;
  const mostrarOpcoes = plan.hasOptionsButton;
  const PrincipalIcon = principal?.Icon;

  // A entrada é mais lenta que a saída pelo motivo que o app já escreveu para
  // `screenExit` (`tokens.ts:30-35`): a entrada é o que a usuária pediu; a saída
  // é limpeza que ela quer longe.
  const fade = visivel
    ? { opacity: 1, transition: { duration: CHROME_FADE_IN, ease: EASE.standard } }
    : {
        opacity: 0,
        transition: { duration: CHROME_FADE_OUT, ease: EASE.exit },
      };

  const fecharMenu = () => {
    setMenuOpen(false);
    optionsRef.current?.focus?.();
    onMenuChange?.(false);
  };

  /**
   * Sair do foco **para dentro** das barras não é sair: o `blur` dispara a cada
   * troca de filho (`Tab` da cápsula para o `⋯`), e tratar isso como saída
   * desprenderia as barras no meio da navegação por teclado. Por isso a checagem
   * de contenção em `relatedTarget` (J6).
   */
  const aoSairDoFoco = (e: React.FocusEvent<HTMLDivElement>) => {
    const destino = e.relatedTarget as Node | null;
    if (destino && e.currentTarget.contains(destino)) return;
    onFocusChange?.(false);
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={fade}
        // `inert` sai do DOM da acessibilidade e do tab order (D2). React 19
        // aceita como prop booleana; sem ele o botão segue focável invisível.
        inert={inert}
        className={cn(
          // **Centralizada** (A9 de 2026-10-18: o par deixa de ser preso à
          // ponta). Centrado, o conjunto fica no meio da largura e o alvo não
          // muda de lugar entre telas — a âncora que A4 procurava era a
          // estabilidade, e ela não depende da borda.
          'fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40',
          // `pointer-events-none` no wrapper, `auto` nas barras: a faixa ao redor
          // não pode interceptar toque do conteúdo (mesmo padrão de
          // `src/components/BottomNav.tsx:81-82`).
          'flex items-center justify-center px-3 pointer-events-none lg:hidden',
          className,
        )}
        data-testid="contextual-bars"
        data-visivel={visivel ? 'sim' : 'nao'}
      >
        {/* As duas barras são irmãs — gap fixo entre elas, não duas camadas. */}
        <div
          className="pointer-events-auto flex items-center gap-2 max-w-[calc(100vw-1.5rem)]"
          // `focus`/`blur` no contêiner pegam qualquer filho (ambos borbulham no
          // React) — uma barra que some debaixo do foco perde o próximo `Tab`.
          onFocus={() => onFocusChange?.(true)}
          onBlur={aoSairDoFoco}
        >
          {/* Barra 1 — voltar. `shrink-0`: ela nunca encolhe, é o que garante que
              a barra de ação é a que cede espaço em tela estreita (A6, R7). */}
          <button
            type="button"
            onClick={onBack}
            aria-label="voltar para a tela anterior"
            title="voltar"
            className={cn(
              'h-14 shrink-0 rounded-full border shadow-floating liquid-glass-nav',
              'flex items-center gap-2 pl-4 pr-5 cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-2',
              'transition-transform duration-150 active:scale-[0.98]',
            )}
            data-testid="contextual-bar-voltar"
          >
            <ArrowLeft className="w-5 h-5 shrink-0 text-ceci-primary" aria-hidden />
            <span className="text-sm font-semibold text-ceci-primary whitespace-nowrap">
              voltar
            </span>
          </button>

          {/* Barra 2 — ação. `flex-1 min-w-0`: é a que encolhe e trunca. */}
          <div
            className={cn(
              'h-14 flex-1 min-w-0 flex items-center rounded-full',
              'border shadow-floating liquid-glass-pill overflow-hidden',
            )}
            data-testid="contextual-bar-acao"
          >
            {mostrarOpcoes && (
              <button
                ref={optionsRef}
                type="button"
                onClick={() => {
                  const aberto = !menuOpen;
                  setMenuOpen(aberto);
                  onMenuChange?.(aberto);
                }}
                aria-label="mais ações desta tela"
                aria-expanded={menuOpen}
                title="mais ações"
                className={cn(
                  'h-full w-14 shrink-0 grid place-items-center cursor-pointer',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-2',
                  'transition-transform duration-150 active:scale-[0.98]',
                )}
                data-testid="contextual-bar-options"
              >
                <MoreHorizontal className="w-5 h-5 text-ceci-primary" aria-hidden />
              </button>
            )}

            {principal && (
              <button
                type="button"
                onClick={() => onRunAction(principal)}
                aria-label={`${principal.ariaLabel ?? principal.label} — ação principal`}
                title={principal.label}
                className={cn(
                  'h-full flex-1 min-w-0 flex items-center gap-2.5 px-4 cursor-pointer',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-2',
                  'transition-transform duration-150 active:scale-[0.98]',
                )}
                data-testid="contextual-bar-capsule"
              >
                {PrincipalIcon && (
                  <PrincipalIcon className="w-5 h-5 shrink-0 text-ceci-brand-strong" aria-hidden />
                )}
                <span className="text-sm font-semibold text-ceci-brand-strong truncate">
                  {principal.label}
                </span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* O painel tem o próprio `AnimatePresence` por dentro — não há o que
          envolver aqui. `selectedPrimaryId` é a ação em uso: como só há uma
          primária, "escolher" é executar. */}
      <ContextualBarMenu
        open={menuOpen}
        primary={model.primary}
        secondary={model.secondary}
        selectedPrimaryId={model.plan.defaultPrimaryId}
        onSelectPrimary={(id) => {
          const alvo = model.primary.find((a) => a.id === id);
          if (alvo) {
            hapticSelection();
            fecharMenu();
            onRunAction(alvo);
          }
        }}
        onRunSecondary={(action) => {
          fecharMenu();
          onRunAction(action);
        }}
        onClose={fecharMenu}
        returnFocusTo={optionsRef}
      />
    </>
  );
}

export default ContextualBars;