"use client";

import React, { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

import { useMotionProfile } from '@/components/motion/MotionProfileProvider';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { HeaderAction } from '@/types';

/**
 * Painel de opções da barra contextual (SPEC-M-018 D4/D10).
 *
 * ## De onde vem o que está aqui
 *
 * - **Fechamento**: `HeaderActionMenu` já fecha em clique fora (`:15-17`) e em
 *   `Escape` (`:18-20`), com cleanup (`:24-26`). O mesmo contrato, aplicado a um
 *   painel em vez de um dropdown.
 * - **Semântica e foco**: `Modal` (`src/components/ui/Modal.tsx:107-109`) tem o
 *   `role="dialog"` + `aria-modal` + `aria-labelledby`, e guarda/restaura o foco
 *   (`:55-58`). Copiado daqui.
 *
 * ## O que NÃO foi copiado: o focus trap
 *
 * `Modal` cicla `Tab` entre os focáveis do painel (`:69-88`) porque ele é uma
 * janela modal sobre a tela. A barra contextual fica **no rodapé, com a tela
 * inteira acima dela** — prender o teclado ali deixaria a usuária sem volta ao
 * formulário sem passar por três botões. Então o painel é `role="dialog"`
 * **sem** `aria-modal` e **sem** trap: o foco entra, `Tab` segue a ordem natural
 * do documento, e `Escape` fecha (D10).
 *
 * ## Camadas
 *
 * Scrim `z-50`, painel `z-[55]` — acima do chrome (`z-40`) e do overlay
 * (`z-40`), abaixo do `Toast` (`z-[60]`) e do `BootSplash` (`z-[100]`). O
 * `z-40` é compartilhado por header, pílula e overlay; a ordem do DOM desempata,
 * o que não basta para um menu.
 */

export interface ContextualBarMenuProps {
  readonly open: boolean;
  /** Ações do contexto. Já filtradas: seção vazia não é montada (§5.1). */
  readonly primary: readonly HeaderAction[];
  readonly secondary: readonly HeaderAction[];
  /** Id da ação principal em uso, para marcar a seleção. */
  readonly selectedPrimaryId: string;
  readonly onSelectPrimary: (id: string) => void;
  readonly onRunSecondary: (action: HeaderAction) => void;
  readonly onClose: () => void;
  /** Botão que abre o painel — o foco volta para ele ao fechar (I7). */
  readonly returnFocusTo: React.RefObject<HTMLElement>;
}

function Item({
  action,
  selected,
  mode,
  onSelect,
  onRun,
}: {
  action: HeaderAction;
  selected: boolean;
  /** `select` troca a ação principal; `run` executa agora. Não são a mesma coisa. */
  mode: 'select' | 'run';
  onSelect: (id: string) => void;
  onRun: (action: HeaderAction) => void;
}) {
  const Icon = action.Icon;
  const run = () => (mode === 'select' ? onSelect(action.id) : onRun(action));
  // Nome acessível distinto do da cápsula (§10.2): o painel diz o que a entrada
  // **faz** — escolher a ação principal, ou executar agora.
  const rotulo = action.ariaLabel ?? action.label;
  const descricao = mode === 'select' ? `${rotulo} — escolher ação principal` : `${rotulo} — executar agora`;

  return (
    <button
      type="button"
      onClick={run}
      // `aria-pressed` é o padrão do app para estado booleano de controle
      // (`BookmarkToggle.tsx:32`, `PillGroup.tsx:65`). Só a principal é
      // selecionável — uma secundária executa, não troca a seleção.
      aria-pressed={mode === 'select' ? selected : undefined}
      aria-label={descricao}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl cursor-pointer',
        'transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand',
        'text-ceci-primary',
        mode === 'select' && selected ? 'bg-surface-rose' : 'hover:bg-surface-muted',
        action.destructive && 'text-ceci-primary',
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 text-ceci-brand-strong" aria-hidden />}
      <span className="text-sm font-medium truncate flex-1">{action.label}</span>
      {/* Indicador inequívoco de seleção (§5.2) — e `aria-pressed` carrega o
          estado para leitor de tela, que não enxerga o `Check`. */}
      {mode === 'select' && selected && (
        <Check className="w-4 h-4 shrink-0 text-ceci-brand-strong" aria-hidden />
      )}
    </button>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ceci-tertiary">
        {titulo}
      </p>
      {children}
    </div>
  );
}

export function ContextualBarMenu({
  open,
  primary,
  secondary,
  selectedPrimaryId,
  onSelectPrimary,
  onRunSecondary,
  onClose,
  returnFocusTo,
}: ContextualBarMenuProps) {
  const profile = useMotionProfile();
  const panelRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();

  // I7: `Escape` fecha e o foco volta ao botão `⋯`. O `restore` usa o ref que o
  // pai passou — não `document.activeElement`, porque o painel é filho do mesmo
  // botão e o elemento ativo pode já ter sido desmontado.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        returnFocusTo.current?.focus?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, returnFocusTo]);

  // Foco entra no painel quando ele abre — o leitor de tela precisa saber que
  // apareceu uma janela, e o usuário precisa estar dentro dela para o `Tab`
  // seguir a partir dali.
  useEffect(() => {
    if (open) panelRef.current?.focus?.();
  }, [open]);

  const dur = profile.reduced ? profile.d.micro : profile.d.sheet;

  /**
   * Sob movimento reduzido o painel entra e sai sem `exit`, e o
   * `AnimatePresence` desmonta na mesma renderização (§10.3). É também o que
   * permite asseverar o fechamento sem esperar quadro de animação.
   */
  const sair = profile.reduced
    ? undefined
    : {
        opacity: 0,
        y: 8,
        transition: { duration: profile.d.overlay, ease: EASE.exit },
      };
  const sairScrim = profile.reduced
    ? undefined
    : { opacity: 0, transition: { duration: profile.d.overlay, ease: EASE.exit } };
  const semMovimento = profile.reduced ? 0 : 8;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: dur, ease: EASE.standard } }}
            exit={sairScrim}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20"
            data-testid="contextual-bar-scrim"
            aria-hidden
          />
          <motion.div
            key="painel"
            ref={panelRef}
            role="dialog"
            aria-labelledby={tituloId}
            tabIndex={-1}
            initial={{ opacity: 0, y: semMovimento }}
            animate={{ opacity: 1, y: 0, transition: { duration: dur, ease: EASE.enter } }}
            exit={sair}
            className={cn(
              'fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-[55]',
              'mx-auto w-[min(22rem,calc(100vw-1.5rem))]',
              'max-h-[min(70vh,32rem)] overflow-y-auto',
              'rounded-3xl border liquid-glass-nav shadow-floating',
              'focus:outline-none',
            )}
            data-testid="contextual-bar-menu"
          >
            <h2 id={tituloId} className="sr-only">
              ações desta tela
            </h2>
            {primary.length > 0 && (
              <Secao titulo="Ação principal">
                {primary.map((action) => (
                  <Item
                    key={action.id}
                    action={action}
                    mode="select"
                    selected={action.id === selectedPrimaryId}
                    onSelect={onSelectPrimary}
                    onRun={onRunSecondary}
                  />
                ))}
              </Secao>
            )}
            {secondary.length > 0 && (
              <Secao titulo="Outras ações">
                {secondary.map((action) => (
                  <Item
                    key={action.id}
                    action={action}
                    mode="run"
                    selected={action.id === selectedPrimaryId}
                    onSelect={onSelectPrimary}
                    onRun={onRunSecondary}
                  />
                ))}
              </Secao>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ContextualBarMenu;