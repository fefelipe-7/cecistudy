import { cn } from '@/lib/utils';

export type RatingQuality = 0 | 1 | 2 | 3;

export interface RatingOption {
  quality: RatingQuality;
  /** Rótulo pt-BR minúsculo (ex.: "esqueci"). */
  label: string;
  /** Próximo vencimento impresso (ex.: "3d", "1sem") — opcional. */
  interval?: string;
}

export interface RatingBarProps {
  /** 4 opções (esqueci/custei/lembrei/fácil). Ordem = quality. */
  options: RatingOption[];
  /** Dispara a avaliação com a qualidade escolhida (0..3). */
  onGrade: (quality: RatingQuality) => void;
  disabled?: boolean;
  className?: string;
}

/** Padrão de opções quando o chamador não calcula intervalos (ex.: preview). */
export const DEFAULT_RATING_OPTIONS: RatingOption[] = [
  { quality: 0, label: 'esqueci', interval: 'agora' },
  { quality: 1, label: 'custei', interval: '10m' },
  { quality: 2, label: 'lembrei', interval: '1d' },
  { quality: 3, label: 'fácil', interval: '1sem' },
];

const QUALITY_STYLES: Record<RatingQuality, string> = {
  0: 'text-status-danger-strong bg-status-danger-surface border-status-danger-border',
  1: 'text-ceci-secondary bg-surface-muted border-ceci-border-default',
  2: 'text-status-success-on bg-status-success border-status-success-strong hover:bg-status-success-strong',
  3: 'text-ceci-on-primary bg-ceci-brand border-ceci-brand-strong hover:bg-ceci-brand-strong',
};

/**
 * Barra de avaliação estilo Anki: 4 botões com o próximo vencimento impresso e
 * foco visível (alvo ≥52px, teclado nativo). Os botões são ações (não toggles) —
 * cada toque aplica o veredito e avança a fila.
 */
export const RatingBar: React.FC<RatingBarProps> = ({ options, onGrade, disabled, className }) => (
  <div role="group" aria-label="avaliar sua resposta" className={cn('grid grid-cols-4 gap-2', className)}>
    {options.map((opt) => (
      <button
        key={opt.quality}
        type="button"
        disabled={disabled}
        onClick={() => onGrade(opt.quality)}
        aria-label={opt.interval ? `${opt.label} · volta em ${opt.interval}` : opt.label}
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 min-h-[52px] text-[11px] font-bold border shadow-xs transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand-strong',
          QUALITY_STYLES[opt.quality]
        )}
      >
        <span>{opt.label}</span>
        {opt.interval && (
          <span aria-hidden="true" className="text-[9px] opacity-80 font-semibold">
            {opt.interval}
          </span>
        )}
      </button>
    ))}
  </div>
);

export default RatingBar;