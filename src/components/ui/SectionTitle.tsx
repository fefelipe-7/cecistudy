import React from 'react';

/** Título de seção padronizado (label uppercase + ícone, com ação opcional à direita). */
export const SectionTitle: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, children, action }) => (
  <div className="flex items-center justify-between border-b border-ceci-border-default pb-2">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xs font-bold text-ceci-primary font-display uppercase tracking-wider">
        {children}
      </h2>
    </div>
    {action}
  </div>
);

export default SectionTitle;
