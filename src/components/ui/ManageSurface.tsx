import React from 'react';
import type { ManagedItemKind } from '../../types';
import { useApp } from '../../context/AppContext';
import { useLongPress } from '../../lib/useLongPress';

interface ManageSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  kind: ManagedItemKind;
  id: string;
  /** Ação do toque normal (o long-press abre o menu editar/excluir no lugar). */
  onTap?: () => void;
}

/**
 * Card/linha que responde a long-press (mobile) ou clique com botão direito
 * (desktop) abrindo o menu universal de editar/excluir. O toque normal chama
 * `onTap` normalmente.
 */
export const ManageSurface: React.FC<ManageSurfaceProps> = ({
  kind,
  id,
  onTap,
  children,
  ...rest
}) => {
  const { openManageItem } = useApp();
  const handlers = useLongPress({
    onLongPress: () => openManageItem(kind, id),
    onClick: onTap,
  });
  return (
    <div {...handlers} {...rest}>
      {children}
    </div>
  );
};