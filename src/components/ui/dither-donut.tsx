import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasSetup } from '@/lib/useCanvasSetup';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  smoothstep,
  hash,
  hexToRgba,
  drawRoundedWedge,
  CHART_PASTELS,
  buildDemoDonutPeriods,
  formatCount,
  type ChartTheme,
  type DonutPeriod,
  type DonutSegment,
} from '@/lib/ditherChart';

const DEMO_PERIODS = buildDemoDonutPeriods();

export interface DitherDonutChartProps {
  theme?: ChartTheme;
  compact?: boolean;
  className?: string;
  /** Segmentos (fatias) do donut. Se `periods` for passado, ele manda. */
  data?: DonutSegment[];
  /** Períodos com seletor (ex.: semana / mês). */
  periods?: DonutPeriod[];
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Rótulo central (padrão: soma). */
  totalLabel?: string;
  formatValue?: (n: number) => string;
}

/** Donut dithered com hover em fatia e lista interativa — canvas + framer-motion. */
export const DitherDonutChart: React.FC<DitherDonutChartProps> = ({
  theme = 'light',
  compact = false,
  className,
  data: dataProp,
  periods,
  title = 'tempo por área',
  subtitle = 'onde seu tempo foi',
  icon = <Users className="w-4 h-4" />,
  totalLabel = 'total',
  formatValue = formatCount,
}) => {
  const [periodIndex, setPeriodIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { canvasRef, rect, isVisible, reducedMotion } = useCanvasSetup();

  const usingPeriods = periods !== undefined || dataProp === undefined;
  const activePeriod = (periods ?? DEMO_PERIODS)[periodIndex];

  const segments: DonutSegment[] = useMemo(() => {
    const base = dataProp ?? activePeriod.data;
    return base.map((s, i) => ({
      ...s,
      color: s.color ?? CHART_PASTELS[i % CHART_PASTELS.length],
    }));
  }, [dataProp, activePeriod]);

  const { shares, total } = useMemo(() => {
    const sum = segments.reduce((acc, s) => acc + s.value, 0) || 1;
    return { shares: segments.map((s) => s.value / sum), total: segments.reduce((acc, s) => acc + s.value, 0) };
  }, [segments]);

  const timeRef = useRef(0);
  const requestRef = useRef<number | undefined>(undefined);
  const morphStartTimeRef = useRef<number>(0);
  const fromSharesRef = useRef<number[]>([]);
  const targetSharesRef = useRef<number[]>([]);
  const dispSharesRef = useRef<number[]>([]);

  const hoverRef = useRef(hoverIndex);
  useEffect(() => {
    hoverRef.current = hoverIndex;
  }, [hoverIndex]);

  useEffect(() => {
    if (dispSharesRef.current.length === 0) {
      dispSharesRef.current = [...shares];
      fromSharesRef.current = [...shares];
      targetSharesRef.current = [...shares];
    } else {
      fromSharesRef.current = [...dispSharesRef.current];
      targetSharesRef.current = [...shares];
      morphStartTimeRef.current = performance.now();
    }
  }, [shares]);

  useEffect(() => {
    const draw = () => {
      if (!isVisible.current) {
        requestRef.current = requestAnimationFrame(draw);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width: logW, height: logH } = rect.current;
      if (logW === 0 || logH === 0) {
        requestRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += reducedMotion ? 0 : 0.02;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const logicalSize = 200;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale((logW * dpr) / logicalSize, (logH * dpr) / logicalSize);

      let t = 0;
      if (reducedMotion) {
        t = 1;
      } else if (morphStartTimeRef.current > 0) {
        t = (performance.now() - morphStartTimeRef.current) / 500;
        if (t > 1) t = 1;
      } else {
        t = 1;
      }

      const e = 1 - Math.pow(2, -10 * t);
      for (let i = 0; i < targetSharesRef.current.length; i++) {
        dispSharesRef.current[i] = fromSharesRef.current[i] + (targetSharesRef.current[i] - fromSharesRef.current[i]) * e;
      }

      let startAngle = -Math.PI / 2;
      const gap = 0.07;
      const currentHover = hoverRef.current;

      for (let i = 0; i < dispSharesRef.current.length; i++) {
        const share = dispSharesRef.current[i];
        if (share === 0) continue;

        const sweep = share * Math.PI * 2;
        const aStart = startAngle + gap / 2;
        let aEnd = startAngle + sweep - gap / 2;

        if (aEnd < aStart) aEnd = aStart;

        ctx.save();
        const isHovered = currentHover === i;
        const isAnyHovered = currentHover !== null;

        if (isHovered) {
          const mid = (aStart + aEnd) / 2;
          ctx.translate(Math.cos(mid) * 6, Math.sin(mid) * 6);
        }

        ctx.beginPath();
        drawRoundedWedge(ctx, 100, 100, 55, 86, aStart, aEnd, 6);
        ctx.clip();

        ctx.globalAlpha = isHovered ? 1.0 : isAnyHovered ? 0.3 * 0.72 : 0.72;
        ctx.fillStyle = segments[i].color as string;

        if (isHovered) {
          ctx.shadowColor = hexToRgba(segments[i].color as string, 0.55);
          ctx.shadowBlur = 5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        const cell = 4.6;
        const t2 = timeRef.current;
        for (let x = 14; x <= 186; x += cell) {
          for (let y = 14; y <= 186; y += cell) {
            const dx = x - 100;
            const dy = y - 100;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 55 - cell || dist > 86 + cell) continue;

            let a = Math.atan2(dy, dx);
            let normalizedA = a - aStart;
            while (normalizedA < 0) normalizedA += Math.PI * 2;
            while (normalizedA >= Math.PI * 2) normalizedA -= Math.PI * 2;
            if (normalizedA > aEnd - aStart) continue;

            const fullness = smoothstep(0.62, 1.0, (dist - 55) / (86 - 55));
            const waveRaw = reducedMotion
              ? 0
              : Math.sin(dist * 0.1 - t2) + Math.sin(a * 3 + t2 * 1.5) + Math.sin(dx * 0.05 + dy * 0.05 + t2 * 2);
            const wave = smoothstep(-1.5, 1.5, waveRaw);
            const jitter = hash(x, y);

            const size = cell * ((isHovered ? 0.46 : 0.34) + 0.36 * fullness + 0.26 * wave) * (0.78 + 0.42 * jitter);

            ctx.fillRect(x - size / 2, y - size / 2, size, size);
          }
        }

        ctx.restore();
        startAngle += sweep;
      }

      ctx.restore();
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [theme, reducedMotion, segments]);

  if (compact) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <div className="relative w-[130px] h-[130px]">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
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

        {usingPeriods && (
          <div
            className={cn(
              'flex items-center p-1 rounded-full border text-xs font-medium',
              theme === 'dark' ? 'bg-neutral-800 border-neutral-700' : 'bg-surface-subtle border-ceci-border-default'
            )}
          >
            {(periods ?? DEMO_PERIODS).map((p, idx) => (
              <button
                key={p.label}
                onClick={() => {
                  setPeriodIndex(idx);
                  setHoverIndex(null);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-full transition-all cursor-pointer',
                  periodIndex === idx
                    ? 'bg-ceci-primary text-white'
                    : theme === 'dark'
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-ceci-secondary hover:text-ceci-primary'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Centro: donut + total */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-[180px] h-[180px] shrink-0">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatedNumber
              value={total}
              className={cn('font-display text-2xl font-bold tracking-tight', theme === 'dark' ? 'text-white' : 'text-ceci-primary')}
              format={formatValue}
            />
            <span className={cn('text-[10px] mt-0.5', theme === 'dark' ? 'text-neutral-400' : 'text-ceci-secondary')}>
              {totalLabel}
            </span>
          </div>
        </div>

        {/* Lista de segmentos */}
        <div className="flex-1 w-full space-y-2">
          {segments.map((seg, idx) => {
            const pct = Math.round(shares[idx] * 100);
            const isHovered = hoverIndex === idx;

            return (
              <div
                key={seg.label}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className={cn(
                  'flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border',
                  isHovered
                    ? theme === 'dark'
                      ? 'bg-white/10 border-white/20'
                      : 'bg-surface-subtle border-ceci-border-default'
                    : 'border-transparent'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs font-medium truncate">{seg.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <AnimatedNumber
                    value={seg.value}
                    className={cn('font-semibold tabular-nums', theme === 'dark' ? 'text-neutral-300' : 'text-ceci-primary')}
                    format={formatValue}
                  />
                  <span
                    className={cn(
                      'text-[10px] w-8 text-right font-mono',
                      theme === 'dark' ? 'text-neutral-500' : 'text-ceci-muted'
                    )}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};