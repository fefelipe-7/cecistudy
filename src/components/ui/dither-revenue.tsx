import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasSetup } from '@/lib/useCanvasSetup';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  clamp,
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

  const total = useMemo(() => data.reduce((a, b) => a + b, 0), [data]);
  const maxVal = useMemo(() => Math.max(3, ...data) * 1.15, [data]);
  const avg = useMemo(
    () => (data.length > 0 ? Math.round(total / data.length) : 0),
    [data, total]
  );

  const tickFractions = [1, 2 / 3, 1 / 3, 0];
  const ticks = [Math.round(maxVal), Math.round(maxVal * (2 / 3)), Math.round(maxVal / 3), 0];
  const tickTopPct = (f: number) => (1 - f) * 100;
  const gridLineColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(64, 56, 58, 0.07)';

  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const targetX = useSpring(0, { stiffness: 650, damping: 42, mass: 0.5 });
  const targetY = useSpring(0, { stiffness: 650, damping: 42, mass: 0.5 });

  const handlePointer = (e: React.PointerEvent) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const r = wrapper.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const { width: w, height: h } = rect.current;
    if (w === 0 || h === 0) return;
    const t = clamp(x / w, 0, 1);
    const idx = Math.round(t * (data.length - 1));
    setScrubIndex(idx);
    targetX.set((data.length > 1 ? idx / (data.length - 1) : 0.5) * w);
    const curveY = h - (data[idx] / maxVal) * h;
    targetY.set(curveY);
  };
  const handlePointerLeave = () => setScrubIndex(null);

  const xPos = useTransform(targetX, (v) => `${v}px`);
  const yPos = useTransform(targetY, (v) => `${v}px`);

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
      // clip da área dithered encerrado

      // Linhas de grade horizontais alinhadas aos rótulos do eixo y.
      ctx.fillStyle = gridLineColor;
      tickFractions.forEach((f) => {
        const gy = (1 - f) * h;
        ctx.fillRect(0, gy, w, 1);
      });

      // Linha tracejada da média com legenda.
      const avgY = h - (avg / maxVal) * h;
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(216, 95, 121, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, avgY);
      ctx.lineTo(w, avgY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (avgY > 14) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(64,56,58,0.85)';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${formatCount(avg)} ${unitLabel}`, w - 4, avgY - 3);
      }

      ctx.restore();
      req = requestAnimationFrame(draw);
    };

    req = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(req);
  }, [theme, reducedMotion, lineColor, data, maxVal, avg, gridLineColor, unitLabel]);

  const canvasBlock = (
    <div
      className={cn(
        'relative w-full h-[120px] rounded-xl overflow-hidden',
        'bg-surface-muted'
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
        'relative w-full rounded-2xl p-5 border shadow-sm transition-colors',
        'bg-surface-default border-ceci-border-default text-ceci-primary',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-2 rounded-xl',
              'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand'
            )}
          >
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-bold">{title}</h4>
            <div className="flex items-baseline gap-2.5 mt-0.5">
              <AnimatedNumber
                value={total}
                className="font-display font-bold text-2xl tracking-tight tabular-nums"
                format={(n) => formatCount(n)}
              />
              <span
                className={cn(
                  'flex items-center gap-1 text-[11px] font-semibold',
                  'text-ceci-secondary'
                )}
              >
                <span
                  className="w-3.5 border-t border-dashed inline-block"
                  style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.6)' : '#D85F79' }}
                />
                média {formatCount(avg)}
              </span>
            </div>
            <p className={cn('text-[11px]', 'text-ceci-secondary')}>{subtitle}</p>
          </div>
        </div>

        {usingVariants && (
          <div
            className={cn(
              'flex items-center p-1 rounded-full border text-xs font-medium',
              'bg-surface-subtle border-ceci-border-default'
            )}
          >
            {(variants ?? DEMO_REVENUE_VARIANTS).map((v, idx) => (
              <button
                key={v.label}
                onClick={() => setVariantIndex(idx)}
                className={cn(
                  'px-2.5 py-1 rounded-full transition cursor-pointer',
                  variantIndex === idx
                    ? 'bg-ceci-primary text-ceci-on-primary'
                    : 'text-ceci-secondary hover:text-ceci-primary'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2.5 items-start">
        <div className="relative w-8 h-[120px] shrink-0">
          {tickFractions.map((f, i) => (
            <span
              key={i}
              className={cn(
                'absolute right-1 text-[10px] font-mono leading-none',
                'text-ceci-muted'
              )}
              style={{ top: `${tickTopPct(f)}%`, transform: 'translateY(-50%)' }}
            >
              {formatCount(ticks[i])}
            </span>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div
            ref={wrapperRef}
            className={cn(
              'relative h-[120px] rounded-xl overflow-hidden touch-none cursor-crosshair',
              'bg-surface-muted'
            )}
            onPointerMove={handlePointer}
            onPointerLeave={handlePointerLeave}
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
            {scrubIndex !== null && data[scrubIndex] !== undefined && (
              <>
                <motion.div
                  className={cn(
                    'absolute top-0 bottom-0 w-px pointer-events-none z-10',
                    'bg-ceci-brand'
                  )}
                  style={{ left: xPos }}
                />
                <motion.div
                  className={cn(
                    'absolute w-3 h-3 rounded-full border-2 shadow-floating pointer-events-none z-20',
                    'bg-ceci-brand border-surface-default'
                  )}
                  style={{ left: xPos, top: yPos, marginLeft: -6, marginTop: -6 }}
                />
                <motion.div
                  className={cn(
                    'absolute px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-floating border pointer-events-none z-30',
                    'bg-ceci-primary text-ceci-on-primary border-ceci-primary'
                  )}
                  style={{ left: xPos, top: yPos, transform: 'translate(-50%, calc(-100% - 12px))' }}
                >
                  <div
                    className={cn('text-[10px] uppercase', 'text-ceci-on-primary/70')}
                  >
                    {labelsX[scrubIndex]}
                  </div>
                  <div>
                    {formatCount(data[scrubIndex])}
                    {unitLabel ? ` ${unitLabel}` : ''}
                  </div>
                </motion.div>
              </>
            )}
          </div>
          {labelsX.length > 0 && (
            <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-mono opacity-60">
              {[0, Math.floor(labelsX.length * 0.5), labelsX.length - 1].map((idx) => (
                <span key={idx}>{labelsX[idx]}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};