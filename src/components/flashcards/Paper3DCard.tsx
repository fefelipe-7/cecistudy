import { lazy, Suspense, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import '@/shaders/threeui.css';

const ThreeDPaper = lazy(async () => {
  const m = await import('@/shaders/3d-paper/ThreeDPaper');
  return { default: m.ThreeDPaper };
});

export interface Paper3DCardProps {
  /** Conteúdo da pergunta (face da frente). */
  front: ReactNode;
  /** Conteúdo da resposta (face do verso). */
  back: ReactNode;
  /** Estado do flip: true revela a resposta (chip do verso). */
  flipped?: boolean;
  /** Acessibilidade: rótulo do palco. */
  ariaLabel?: string;
  className?: string;
  /** Classes extras do chip da pergunta. */
  frontClassName?: string;
  /** Classes extras do chip da resposta. */
  backClassName?: string;
}

/**
 * Card 3D em Three.js (ThreeUI `ThreeDPaper` nocturne): o papel de vidro
 * translúcido vira a SUPERFÍCIE do cartão — o usuário arrasta para girar o
 * papel (interação nativa da cena, sandbox do iframe). As faces Q&A flutuam
 * em chips de vidro por cima, cruzando com o `flipped`. O `Paper3DCard`
 * carrega o shader de forma lazy (chunk separado — ~2,5 MB de HTML raw),
 * então o bundle principal não incha.
 */
export const Paper3DCard: React.FC<Paper3DCardProps> = ({
  front,
  back,
  flipped = false,
  ariaLabel,
  className,
  frontClassName,
  backClassName,
}) => (
  <div
    className={cn('relative aspect-[3/4] select-none overflow-hidden rounded-2xl', className)}
    data-testid="paper3d-card"
    data-flipped={flipped ? 'true' : 'false'}
  >
    {/* palco da cena Three.js (shader-frame) — o papel vira arrastando */}
    <div className="shader-frame absolute inset-0" role="group" aria-label={ariaLabel ?? 'cartão de estudo 3D'}>
      <Suspense
        fallback={
          <div className="absolute inset-0" style={{ backgroundColor: '#08080a' }} aria-busy="true" />
        }
      >
        <ThreeDPaper variant="original" />
      </Suspense>
    </div>

    {/* chip da pergunta (face da frente) */}
    <div
      aria-hidden={flipped || undefined}
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center p-6 pointer-events-none transition-opacity duration-200',
        flipped ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div
        className={cn(
          'w-full max-w-[15.5rem] rounded-3xl bg-canvas/90 backdrop-blur-md border border-white/40 shadow-lg p-5 text-center',
          frontClassName
        )}
      >
        {front}
      </div>
    </div>

    {/* chip da resposta (face do verso) */}
    <div
      aria-hidden={!flipped || undefined}
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center p-6 pointer-events-none transition-opacity duration-200',
        flipped ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className={cn(
          'w-full max-w-[15.5rem] rounded-3xl bg-canvas/90 backdrop-blur-md border border-white/40 shadow-lg p-5 text-center',
          backClassName
        )}
      >
        {back}
      </div>
    </div>
  </div>
);

export default Paper3DCard;