import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Barra de ação fixa na base da tela, renderizada via portal no `<body>`.
 *
 * Escapa da árvore de transforms das camadas (slide com o freeze `translateY`,
 * overlays com scale/fade): o rodapé fica pinado ao viewport mesmo durante o
 * push/pop, em vez de "pular" junto com o conteúdo congelado da tela que sai.
 * A marcação é o mesmo padrão repetido antigamente (canvas translúcido + borda
 * superior + sombra suave) — centraliza o wrapper para as 6 telas que o usam.
 */
export const FixedBottomBar: React.FC<React.PropsWithChildren> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed bottom-0 inset-x-0 z-[45] bg-canvas/95 backdrop-blur-md border-t border-ceci-border-subtle shadow-[0_-8px_24px_rgba(var(--shadow-rgb),0.06)]">
      {children}
    </div>,
    document.body
  );
};