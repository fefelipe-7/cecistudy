import React from 'react';

interface SkeletonProps {
  className?: string;
}

/** Bloco base de skeleton: pulse suave com tokens do design system. */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`bg-ceci-border-subtle animate-pulse rounded-lg ${className}`}
  />
);

interface ViewSkeletonProps {
  rows?: number;
}

/** Skeleton genérico de tela com dados: banner + barra de busca + lista de cards. */
export const ViewSkeleton: React.FC<ViewSkeletonProps> = ({ rows = 6 }) => (
  <div
    aria-busy="true"
    aria-label="carregando seu cantinho"
    className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 relative"
  >
    {/* Banner */}
    <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-3 shadow-2xs">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-2/3 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-full" />
        </div>
      </div>
    </div>

    {/* Barra de busca/filtro */}
    <Skeleton className="h-12 rounded-2xl" />

    {/* Lista de cards */}
    <div className="space-y-3 px-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-[22px] p-4 border border-ceci-border-default shadow-2xs flex items-center gap-3"
        >
          <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Skeleton compacto de lista (sem banner/busca) — ex.: abordagens de uma família. */
export const ListSkeleton: React.FC<ViewSkeletonProps> = ({ rows = 6 }) => (
  <div aria-busy="true" aria-label="carregando abordagens" className="space-y-3 px-1">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-[22px] p-4 border border-ceci-border-default shadow-2xs flex items-center gap-3"
      >
        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-1/2 rounded-full" />
          <Skeleton className="h-3 w-3/4 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);