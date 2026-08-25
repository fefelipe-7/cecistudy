import React from 'react';

interface SplitLayoutProps {
  /** Painel mestre (lista/navegação) — largura fixa à esquerda. */
  master: React.ReactNode;
  /** Painel de detalhe — flexível, ocupa o resto. */
  detail: React.ReactNode;
  /** Largura do painel mestre em px (default 300). */
  masterWidth?: number;
}

/**
 * Primitiva de layout master-detail do desktop: dois painéis lado a lado,
 * cada um com rolagem própria. A pilha de navegação não muda — é só
 * apresentação (o mobile continua empilhando telas).
 */
export const SplitLayout: React.FC<SplitLayoutProps> = ({
  master,
  detail,
  masterWidth = 300,
}) => (
  <div className="flex w-full items-stretch gap-5">
    <div
      style={{ width: masterWidth }}
      className="shrink-0 min-w-0"
    >
      {master}
    </div>
    <div className="flex-1 min-w-0">{detail}</div>
  </div>
);
