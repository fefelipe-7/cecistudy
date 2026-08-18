import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasSetup } from '@/lib/useCanvasSetup';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  clamp,
  smoothstep,
  formatShortDate,
  buildDemoGrowthRanges,
  formatCount,
  type ChartTheme,
  type GrowthRange,
} from '@/lib/ditherChart';

const DEMO_RANGES = buildDemoGrowthRanges();

export interface DitherGrowthChartProps {
  theme?: ChartTheme;
  compact?: boolean;
  className?: string;
  /** Séries para o seletor de período (ex.: 7d / 30d). Se ausente, usa ranges demo. */
  ranges?: GrowthRange[];
  /** Série única — exibe sem seletor. */
  data?: number[];
  /** Rótulos do eixo x (opcional). */
  dates?: string[];
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Prefixo do valor grande (ex.: '+'). */
  valuePrefix?: string;
  /** Rótulo de tendência (ex.: '+14%'). Se ausente, calcula do primeiro→último ponto. */
  trendLabel?: string;
  /** Unidade usada no tooltip (ex.: 'min'). */
  unitLabel?: string;
  /** Cor de destaque (hex como dado). Default: brand no light, branco no dark. */
  accentColor?: string;
}

/** Gráfico de crescimento (área dithered) com scrub interativo — canvas + framer-motion. */
export const DitherGrowthChart: React.FC<DitherGrowthChartProps> = ({
  theme = 'light',
  compact = false,
  className,
  ranges,
  data: dataProp,
  dates: datesProp,
  title = 'crescimento de estudos',
  subtitle = 'sua constância em números',
  icon = <TrendingUp className="w-5 h-5" />,
  valuePrefix = '',
  trendLabel,
  unitLabel = '',
  accentColor,
}) => {
  const [rangeIndex, setRangeIndex] = useState(0);
  const { canvasRef, rect, isVisible, reducedMotion } = useCanvasSetup();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const usingRanges = ranges !== undefined || dataProp === undefined;
  const activeRange = (ranges ?? DEMO_RANGES)[rangeIndex];

  const data = dataProp ?? activeRange.data;
  const dates = datesProp ?? activeRange.dates ?? data.map((_, i) => formatShortDate(data.length - 1 - i));

  const total = useMemo(() => data.reduce((a, b) => a + b, 0), [data]);
  const maxVal = useMemo(() => Math.max(3, ...data), [data]);

  const dotColor = accentColor ?? (theme === 'dark' ? '#FFFFFF' : '#D85F79');
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(64, 56, 58, 0.04)';

  const computedTrend = useMemo(() => {
    if (data.length < 2) return null;
    const first = data[0];
    const last = data[data.length - 1];
    if (first === 0) return last > 0 ? 100 : 0;
    return Math.round(((last - first) / first) * 100);
  }, [data]);
  const finalTrend = trendLabel ?? (computedTrend !== null ? `${computedTrend > 0 ? '+' : ''}${computedTrend}%` : undefined);
  const trendUp = computedTrend === null ? true : computedTrend >= 0;

  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const targetX = useSpring(0, { stiffness: 650, damping: 42, mass: 0.5 });
  const targetY = useSpring(0, { stiffness: 650, damping: 42, mass: 0.5 });

  const timeRef = useRef(0);
  const requestRef = useRef<number | undefined>(undefined);
  const pointerPosRef = useRef({ x: -100, y: -100 });
  const pointerActiveRef = useRef(false);

  const fromDataRef = useRef<number[]>([]);
  const fromMaxRef = useRef(maxVal);
  const targetDataRef = useRef(data);
  const targetMaxRef = useRef(maxVal);
  const morphStartTimeRef = useRef(0);

  useEffect(() => {
    fromDataRef.current = targetDataRef.current.map((_, i) => targetDataRef.current[i]);
    fromMaxRef.current = targetMaxRef.current;

    targetDataRef.current = data;
    targetMaxRef.current = maxVal;

    if (fromDataRef.current.length !== targetDataRef.current.length) {
      const len = targetDataRef.current.length;
      const old = fromDataRef.current;
      fromDataRef.current = Array(len)
        .fill(0)
        .map((_, i) => {
          const t = len > 1 ? i / (len - 1) : 0;
          const oldIdx = Math.round(t * (old.length - 1));
          return old[oldIdx];
        });
    }

    morphStartTimeRef.current = performance.now();
  }, [data, maxVal]);

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

      const { width: w, height: h } = rect.current;
      if (w === 0 || h === 0) {
        requestRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += reducedMotion ? 0 : 0.03;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cell = Math.max(3, Math.round(w / 180));

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      let prog = 0;
      if (reducedMotion) {
        prog = 1;
      } else if (morphStartTimeRef.current > 0) {
        prog = (performance.now() - morphStartTimeRef.current) / 460;
        if (prog > 1) prog = 1;
      } else {
        prog = 1;
      }

      const curMax = fromMaxRef.current + (targetMaxRef.current - fromMaxRef.current) * prog;
      const curData = targetDataRef.current.map((v, i) => fromDataRef.current[i] + (v - fromDataRef.current[i]) * prog);

      const px = pointerPosRef.current.x;
      const py = pointerPosRef.current.y;
      const isActive = pointerActiveRef.current;
      const t2 = timeRef.current;

      for (let x = 0; x < w; x += cell) {
        const t = x / w;
        const exactIdx = t * (curData.length - 1);
        const i0 = Math.floor(exactIdx);
        const i1 = Math.min(i0 + 1, curData.length - 1);
        const frac = exactIdx - i0;
        const val = curData[i0] + (curData[i1] - curData[i0]) * frac;

        const headroom = 0.16 * h;
        const plotH = h - headroom;
        const curveY = h - plotH * (val / curMax);

        for (let y = h; y >= 0; y -= cell) {
          ctx.fillStyle = gridColor;
          ctx.fillRect(x + 1, y + 1, cell - 1, cell - 1);

          if (y < curveY) continue;

          const dx = x - px;
          const dy = y - py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let glow = 0;
          if (isActive && !reducedMotion) {
            const rad = h * 0.35;
            glow = 1 - smoothstep(0, rad, dist);
          }

          const shimmer = reducedMotion ? 0 : Math.sin(y * 0.1 - t2 * 2) * 0.07;

          ctx.fillStyle = dotColor;
          const sz = cell * (0.7 + shimmer + glow * 0.3);
          const alpha = 0.6 + glow * 0.4;
          ctx.globalAlpha = alpha;

          const offset = (cell - sz) / 2;
          ctx.fillRect(x + offset, y + offset, sz, sz);
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [theme, reducedMotion, dotColor, gridColor]);

  const handlePointer = (e: React.MouseEvent | React.PointerEvent) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const r = wrapper.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    pointerPosRef.current = { x, y };
    pointerActiveRef.current = true;

    const { width: w, height: h } = rect.current;

    const t = clamp(x / w, 0, 1);
    const idx = Math.round(t * (data.length - 1));
    setScrubIndex(idx);

    const actualT = data.length > 1 ? idx / (data.length - 1) : 0.5;
    targetX.set(actualT * w);

    const val = data[idx];
    const headroom = 0.16 * h;
    const plotH = h - headroom;
    const curveY = h - plotH * (val / maxVal);
    targetY.set(curveY);
  };

  const handlePointerLeave = () => {
    pointerActiveRef.current = false;
    setScrubIndex(null);
  };

  const xPos = useTransform(targetX, (x) => `${x}px`);
  const yPos = useTransform(targetY, (y) => `${y}px`);

  if (compact) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <div className="relative w-full h-[120px]">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>
    );
  }

  const ticks = [maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33), 0];
  const dateLabels = [
    dates[0],
    dates[Math.floor(dates.length * 0.25)],
    dates[Math.floor(dates.length * 0.5)],
    dates[Math.floor(dates.length * 0.75)],
    dates[dates.length - 1],
  ];

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2.5 rounded-2xl',
              theme === 'dark'
                ? 'bg-white/10 text-white'
                : 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand'
            )}
          >
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-bold">{title}</h4>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={total}
                className={cn('font-display text-2xl font-bold tracking-tight', theme === 'dark' ? 'text-white' : 'text-ceci-primary')}
                format={(n) => `${valuePrefix}${formatCount(n)}`}
              />
              {finalTrend !== undefined && (
                <span
                  className={cn(
                    'text-xs font-semibold flex items-center gap-0.5',
                    trendUp ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  )}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> {finalTrend}
                </span>
              )}
            </div>
            <p className={cn('text-xs', theme === 'dark' ? 'text-neutral-400' : 'text-ceci-secondary')}>{subtitle}</p>
          </div>
        </div>

        {/* Seletor de período */}
        {usingRanges && (
          <div
            className={cn(
              'flex items-center p-1 rounded-full border text-xs font-medium',
              theme === 'dark' ? 'bg-neutral-800 border-neutral-700' : 'bg-surface-subtle border-ceci-border-default'
            )}
          >
            {(ranges ?? DEMO_RANGES).map((r, idx) => (
              <button
                key={r.label}
                onClick={() => setRangeIndex(idx)}
                className={cn(
                  'px-3 py-1 rounded-full transition-all cursor-pointer',
                  rangeIndex === idx
                    ? 'bg-ceci-primary text-white shadow-xs'
                    : theme === 'dark'
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-ceci-secondary hover:text-ceci-primary'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Etapa principal */}
      <div className="flex gap-3 items-start">
        {/* Ticks do eixo y */}
        <div className="relative w-7 h-[180px] shrink-0">
          {ticks.map((tick, i) => (
            <span
              key={i}
              className={cn(
                'absolute right-0 text-[10px] font-mono',
                theme === 'dark' ? 'text-neutral-500' : 'text-ceci-muted'
              )}
              style={{ top: `${(i / 3) * 82 + 8}%`, transform: 'translateY(-50%)' }}
            >
              {formatCount(tick)}
            </span>
          ))}
        </div>

        {/* Canvas do gráfico */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div
            ref={wrapperRef}
            className={cn(
              'relative h-[180px] touch-none cursor-crosshair overflow-hidden rounded-xl',
              theme === 'dark' ? 'bg-neutral-800' : 'bg-surface-muted'
            )}
            onPointerMove={handlePointer}
            onPointerLeave={handlePointerLeave}
          >
            <div
              className={cn(
                'absolute inset-0 border-t border-b border-dashed pointer-events-none',
                theme === 'dark' ? 'border-white/10' : 'border-ceci-border-default'
              )}
            />
            <canvas ref={canvasRef} className="w-full h-full block" />

            {scrubIndex !== null && (
              <>
                <motion.div
                  className={cn(
                    'absolute top-0 bottom-0 w-px pointer-events-none z-10',
                    theme === 'dark' ? 'bg-white/70' : 'bg-ceci-brand'
                  )}
                  style={{ left: xPos }}
                />
                <motion.div
                  className={cn(
                    'absolute w-3 h-3 -ml-[6px] -mt-[6px] rounded-full border-2 shadow-lg pointer-events-none z-20',
                    theme === 'dark' ? 'bg-white border-neutral-800' : 'bg-ceci-brand border-white'
                  )}
                  style={{ left: xPos, top: yPos }}
                />
                <motion.div
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-full mb-3 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-floating border pointer-events-none z-30',
                    theme === 'dark'
                      ? 'bg-neutral-900 text-white border-white/20'
                      : 'bg-ceci-primary text-white border-ceci-primary'
                  )}
                  style={{ left: xPos, top: yPos }}
                >
                  <div className={cn('text-[10px] uppercase', theme === 'dark' ? 'text-neutral-400' : 'text-ceci-muted')}>
                    {dates[scrubIndex]}
                  </div>
                  <div>
                    {valuePrefix}
                    {formatCount(data[scrubIndex])}
                    {unitLabel ? ` ${unitLabel}` : ''}
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Datas do eixo x */}
          <div className={cn('flex justify-between items-center mt-2 px-1 text-[10px] font-mono opacity-60')}>
            {dateLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};