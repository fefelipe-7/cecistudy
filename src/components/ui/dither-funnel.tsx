import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasSetup } from '@/lib/useCanvasSetup';
import {
  smoothstep,
  hash,
  CHART_PASTELS,
  DEMO_FUNNEL_VARIANTS,
  formatCount,
  type ChartTheme,
  type FunnelStage,
  type FunnelVariant,
} from '@/lib/ditherChart';

export interface DitherFunnelChartProps {
  theme?: ChartTheme;
  compact?: boolean;
  className?: string;
  /** Etapas do funil. Se `variants` for passado, ele manda. */
  stages?: FunnelStage[];
  /** Variantes com seletor (ex.: agora / semestre passado). */
  variants?: FunnelVariant[];
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  formatValue?: (n: number) => string;
}

/** Funil dithered de etapas (conversão/jornada) — canvas + framer-motion. */
export const DitherFunnelChart: React.FC<DitherFunnelChartProps> = ({
  theme = 'light',
  compact = false,
  className,
  stages: stagesProp,
  variants,
  title = 'sua jornada',
  subtitle = 'do começo ao que você já revisou',
  icon = <Layers className="w-4 h-4" />,
  formatValue = formatCount,
}) => {
  const [variantIndex, setVariantIndex] = useState(0);
  const { canvasRef, rect, isVisible, reducedMotion } = useCanvasSetup();

  const usingVariants = variants !== undefined || stagesProp === undefined;
  const activeVariant = (variants ?? DEMO_FUNNEL_VARIANTS)[variantIndex];

  const stages: FunnelStage[] = useMemo(() => {
    const base = stagesProp ?? activeVariant.stages;
    return base.map((s, i) => ({
      ...s,
      color: s.color ?? CHART_PASTELS[i % CHART_PASTELS.length],
    }));
  }, [stagesProp, activeVariant]);

  const targetDataRef = useRef(stages);
  const fromDataRef = useRef(stages);
  const morphStartTimeRef = useRef(0);

  useEffect(() => {
    fromDataRef.current = targetDataRef.current;
    targetDataRef.current = stages;
    morphStartTimeRef.current = performance.now();
  }, [stages]);

  useEffect(() => {
    let req: number;
    let lastFrame = 0;
    let time = 0;

    const draw = (now: number) => {
      req = requestAnimationFrame(draw);
      if (!isVisible.current) return;
      if (now - lastFrame < 33) return; // ~30fps — funil é quase estático
      lastFrame = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width: w, height: h } = rect.current;
      if (w === 0 || h === 0) return;

      time += reducedMotion ? 0 : 0.02;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const prog = reducedMotion ? 1 : Math.min(1, (performance.now() - morphStartTimeRef.current) / 500);
      const e = 1 - Math.pow(2, -10 * prog);

      const count = stages.length;
      const rowH = (h - (count - 1) * 6) / count;
      const cell = Math.max(2, Math.round(w / 200));
      const t2 = time;

      for (let i = 0; i < count; i++) {
        const target = targetDataRef.current[i];
        const from = fromDataRef.current[i];
        const val = from.value + (target.value - from.value) * e;

        const stageW = (val / (stages[0]?.value || 1)) * w;
        const yTop = i * (rowH + 6);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, yTop, stageW, rowH);
        ctx.clip();

        ctx.globalAlpha = 0.85;
        ctx.fillStyle = target.color as string;

        for (let bx = 0; bx <= Math.ceil(stageW); bx += cell) {
          for (let by = Math.floor(yTop); by <= Math.ceil(yTop + rowH); by += cell) {
            const jx = bx + cell / 2;
            const jy = by + cell / 2;
            const jit = hash(jx, jy);

            const waveRaw = reducedMotion
              ? 0
              : Math.sin(jx * 0.05 + t2) + Math.sin(jy * 0.05 + t2 * 0.7);
            const mod = smoothstep(-1.5, 1.5, waveRaw);

            const sz = cell * (0.35 + 0.35 * mod) * (0.8 + 0.4 * jit);
            ctx.fillRect(bx + (cell - sz) / 2, by + (cell - sz) / 2, sz, sz);
          }
        }
        ctx.restore();
      }

      ctx.restore();
    };

    req = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(req);
  }, [stages, reducedMotion, theme]);

  if (compact) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2">
        <div className="relative w-full h-[140px] flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full pointer-events-none" />
        </div>
      </div>
    );
  }

  const firstValue = stages[0]?.value || 1;

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
            {(variants ?? DEMO_FUNNEL_VARIANTS).map((v, idx) => (
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

      {/* Funil */}
      <div
        className={cn(
          'relative w-full h-[140px] rounded-xl overflow-hidden',
          theme === 'dark' ? 'bg-neutral-800' : 'bg-surface-muted'
        )}
      >
        <canvas ref={canvasRef} className="w-full h-full pointer-events-none" />
      </div>

      {/* Etapas */}
      <div className="flex flex-col gap-2 mt-4">
        {stages.map((stage, idx) => {
          const pct = Math.round((stage.value / firstValue) * 100);
          return (
            <div key={stage.label} className="flex items-center gap-2.5">
              <span
                className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span className="flex-1 text-xs font-medium truncate">{stage.label}</span>
              <span className="text-xs font-semibold tabular-nums">{formatValue(stage.value)}</span>
              <span
                className={cn(
                  'text-[10px] w-10 text-right font-mono',
                  theme === 'dark' ? 'text-neutral-500' : 'text-ceci-muted'
                )}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};