import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasSetup } from '@/lib/useCanvasSetup';
import {
  smoothstep,
  hash,
  DEMO_REVENUE_VARIANTS,
  formatShortDate,
  formatCount,
  type ChartTheme,
  type RevenueVariant,
} from '@/lib/ditherChart';

export interface RevenueLineChartProps {
  theme?: ChartTheme;
  compact?: boolean;
  className?: string;
  /** Série única de valores — exibe sem seletor. */
  data?: number[];
  /** Rótulos do eixo x (opcional). */
  labels?: string[];
  /** Variantes com seletor (ex.: esta semana / semana passada). */
  variants?: RevenueVariant[];
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Unidade usada no tooltip/label (ex.: 'min'). */
  unitLabel?: string;
  /** Cor da linha (hex como dado). Default: brand no light, branco no dark. */
  color?: string;
}

/** Linha com área dithered (tendência) — canvas + framer-motion. */
export const RevenueLineChart: React.FC<RevenueLineChartProps> = ({
  theme = 'light',
  compact = false,
  className,
  data: dataProp,
  labels,
  variants,
  title = 'sua evolução',
  subtitle = 'minutos de foco ao longo do tempo',
  icon = <Activity className="w-4 h-4" />,
  unitLabel = '',
  color,
}) => {
  const [variantIndex, setVariantIndex] = useState(0);
  const { canvasRef, rect, isVisible, reducedMotion } = useCanvasSetup();

  const usingVariants = variants !== undefined || dataProp === undefined;
  const activeVariant = (variants ?? DEMO_REVENUE_VARIANTS)[variantIndex];

  const data = dataProp ?? activeVariant.data;
  const lineColor = color ?? (theme === 'dark' ? '#FFFFFF' : '#D85F79');

  const labelsX = useMemo(
    () => labels ?? data.map((_, i) => formatShortDate(data.length - 1 - i)),
    [labels, data]
  );

  const targetDataRef = useRef(data);
  const fromDataRef = useRef(data);
  const morphStartTimeRef = useRef(0);

  useEffect(() => {
    fromDataRef.current = targetDataRef.current;
    targetDataRef.current = data;
    morphStartTimeRef.current = performance.now();
  }, [data]);

  useEffect(() => {
    let req: number;
    let time = 0;

    const draw = () => {
      if (!isVisible.current) {
        req = requestAnimationFrame(draw);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width: w, height: h } = rect.current;
      if (w === 0 || h === 0) {
        req = requestAnimationFrame(draw);
        return;
      }

      time += reducedMotion ? 0 : 0.02;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const prog = reducedMotion ? 1 : Math.min(1, (performance.now() - morphStartTimeRef.current) / 500);
      const e = 1 - Math.pow(2, -10 * prog);

      const points = data.length;
      if (points < 2) {
        ctx.restore();
        req = requestAnimationFrame(draw);
        return;
      }

      const maxVal = Math.max(...data, ...fromDataRef.current) * 1.2;
      const stepX = w / (points - 1);
      const cell = Math.max(2, Math.round(w / 200));

      // Linha
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const target = targetDataRef.current[i];
        const from = fromDataRef.current[i];
        const val = from + (target - from) * e;

        const x = i * stepX;
        const y = h - (val / maxVal) * h;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = lineColor;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Área dithered abaixo da linha
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();

      ctx.save();
      ctx.clip();

      ctx.fillStyle = lineColor;

      for (let x = 0; x <= w; x += cell) {
        for (let y = 0; y <= h; y += cell) {
          const jx = x + cell / 2;
          const jy = y + cell / 2;
          const jit = hash(jx, jy);

          const gradientFalloff = Math.max(0, 1 - jy / h);
          const waveRaw = reducedMotion
            ? 0
            : Math.sin(jx * 0.05 + time) + Math.sin(jy * 0.05 + time * 0.7);
          const mod = smoothstep(-1.5, 1.5, waveRaw);

          const sz = cell * (0.3 * gradientFalloff + 0.3 * mod) * (0.8 + 0.4 * jit);
          if (sz > 0) {
            ctx.fillRect(x + (cell - sz) / 2, y + (cell - sz) / 2, sz, sz);
          }
        }
      }

      ctx.restore();
      ctx.restore();
      req = requestAnimationFrame(draw);
    };

    req = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(req);
  }, [theme, reducedMotion, lineColor, data]);

  const canvasBlock = (
    <div
      className={cn(
        'relative w-full h-[120px] rounded-xl overflow-hidden',
        theme === 'dark' ? 'bg-neutral-800' : 'bg-surface-muted'
      )}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );

  if (compact) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2">
        <div className="relative w-full h-[120px]">{canvasBlock}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full rounded-[24px] p-5 border shadow-sm transition-colors',
        theme === 'dark'
          ? 'bg-neutral-900 border-neutral-700 text-white'
          : 'bg-white border-ceci-border-default text-ceci-primary',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-2 rounded-xl',
              theme === 'dark'
                ? 'bg-white/10 text-white'
                : 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand'
            )}
          >
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-bold">{title}</h4>
            <p className={cn('text-[11px]', theme === 'dark' ? 'text-neutral-400' : 'text-ceci-secondary')}>{subtitle}</p>
          </div>
        </div>

        {usingVariants && (
          <div
            className={cn(
              'flex items-center p-1 rounded-full border text-xs font-medium',
              theme === 'dark' ? 'bg-neutral-800 border-neutral-700' : 'bg-surface-subtle border-ceci-border-default'
            )}
          >
            {(variants ?? DEMO_REVENUE_VARIANTS).map((v, idx) => (
              <button
                key={v.label}
                onClick={() => setVariantIndex(idx)}
                className={cn(
                  'px-2.5 py-1 rounded-full transition-all cursor-pointer',
                  variantIndex === idx
                    ? 'bg-ceci-primary text-white'
                    : theme === 'dark'
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-ceci-secondary hover:text-ceci-primary'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {canvasBlock}

      {/* Rótulos do eixo x */}
      {labelsX.length > 0 && (
        <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-mono opacity-60">
          {[0, Math.floor(labelsX.length * 0.5), labelsX.length - 1].map((idx) => (
            <span key={idx}>{labelsX[idx]}</span>
          ))}
        </div>
      )}

      {/* Resumo */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-ceci-border-subtle">
        <span className={cn('text-[11px]', theme === 'dark' ? 'text-neutral-400' : 'text-ceci-secondary')}>
          {subtitle}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lineColor }} />
          <span className={cn('text-xs font-semibold tabular-nums', theme === 'dark' ? 'text-white' : 'text-ceci-primary')}>
            {formatCount(data.reduce((a, b) => a + b, 0))}
            {unitLabel ? ` ${unitLabel}` : ''}
          </span>
        </span>
      </div>
    </div>
  );
};