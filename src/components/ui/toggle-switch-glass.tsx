// Interruptor de vidro leve (SPEC-M-028 F6/F7).
//
// A versão anterior usava 8 nós `motion`, `useSpring` (física JS no main thread),
// animação de `backgroundColor`/`boxShadow` (propriedades que forçam paint,
// não vão para o compositor) e `backdrop-filter: blur` + várias
// `box-shadow: inset` — paint caríssimo no WebView nativo (iOS WKWebView e
// Android WebView). Isso travava toda tela que tem um toggle (perfil, estágio,
// TCC, wizards...).
//
// Esta versão:
// - mantém exatamente a mesma API (`ToggleSwitch` props, `Toggle` wrapper);
// - usa um único nó `motion` (o knob) — track e indicadores são divs estáticos;
// - anima apenas `transform` (x) e `opacity` (propriedades do compositor);
// - substitui `useSpring` por tween curto (sem física JS a cada frame);
// - remove `backdrop-filter` e `box-shadow: inset` múltiplos (paint leve);
// - o gesto de arrasto continua funcionando via `drag` do framer-motion.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BASE_D, EASE } from '@/lib/motion/tokens';
import { useMotionProfile } from '@/components/motion/MotionProfileProvider';

// Limiar de velocidade para arrastar-e-soltar ligar/desligar (comportamento do Settings.app)
const VELOCITY_THRESHOLD = 200;

// Tempo da varredura micro de brilho (ms). Não anima no main thread: é um CSS keyframe curto.
const SWEEP_MS = 150;

export type ToggleSize = 'sm' | 'md' | 'lg';

export type ToggleColorTheme =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'cyan';

const sizeConfig = {
  sm: { trackWidth: 51, trackHeight: 31, knobWidth: 27, knobHeight: 21, knobMargin: 2 },
  md: { trackWidth: 60, trackHeight: 33, knobWidth: 35, knobHeight: 24, knobMargin: 2.5 },
  lg: { trackWidth: 80, trackHeight: 36, knobWidth: 47, knobHeight: 30, knobMargin: 3 },
} as const;

const colorThemes = {
  default: { light: { active: '#26BF4D', inactive: 'hsl(0, 0%, 90%)' }, dark: { active: '#26BF4D', inactive: 'hsl(0, 0%, 25%)' } },
  brand: { light: { active: '#D4617C', inactive: 'hsl(0, 0%, 90%)' }, dark: { active: '#AF465F', inactive: 'hsl(0, 0%, 25%)' } },
  success: { light: { active: 'hsl(142, 76%, 36%)', inactive: 'hsl(0, 0%, 90%)' }, dark: { active: 'hsl(142, 76%, 30%)', inactive: 'hsl(0, 0%, 25%)' } },
  warning: { light: { active: 'hsl(38, 92%, 50%)', inactive: 'hsl(0, 0%, 90%)' }, dark: { active: 'hsl(38, 92%, 45%)', inactive: 'hsl(0, 0%, 25%)' } },
  purple: { light: { active: 'hsl(271, 91%, 65%)', inactive: 'hsl(0, 0%, 90%)' }, dark: { active: 'hsl(271, 91%, 55%)', inactive: 'hsl(0, 0%, 25%)' } },
  cyan: { light: { active: 'hsl(187, 85%, 53%)', inactive: 'hsl(0, 0%, 90%)' }, dark: { active: 'hsl(187, 85%, 43%)', inactive: 'hsl(0, 0%, 25%)' } },
} as const;

export interface ToggleSwitchProps {
  className?: string;
  isActive?: boolean;
  onChange?: (isActive: boolean) => void;
  darkMode?: boolean;
  glassEffect?: boolean;
  size?: ToggleSize;
  colorTheme?: ToggleColorTheme;
  label?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({
  className = '',
  isActive: initialIsActive = false,
  onChange = () => {},
  darkMode = false,
  glassEffect = true,
  size = 'md',
  colorTheme = 'brand',
  label,
  disabled = false,
}: ToggleSwitchProps) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isDragging, setIsDragging] = useState(false);
  const [showSweep, setShowSweep] = useState(false);
  const sweepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profile = useMotionProfile();

  const { trackWidth, trackHeight, knobWidth, knobHeight, knobMargin } = sizeConfig[size];

  const calculateTravel = (): number => trackWidth - knobWidth - knobMargin * 2;

  // Mantém o knob sincronizado quando o valor vindo de fora muda (ex.: outro lugar desliga).
  useEffect(() => {
    setIsActive(initialIsActive);
  }, [initialIsActive]);

  useEffect(() => {
    return () => {
      if (sweepTimerRef.current) clearTimeout(sweepTimerRef.current);
    };
  }, []);

  const theme = colorThemes[colorTheme];
  const mode = darkMode ? theme.dark : theme.light;

  const trackClass = cn(
    'relative block shrink-0 overflow-visible rounded-full border-0 bg-transparent p-0',
    disabled && 'cursor-not-allowed opacity-50',
  );

  const knobClass = cn(
    'absolute rounded-full z-20 cursor-grab active:cursor-grabbing',
    isDragging ? 'scale-125' : 'scale-100',
    disabled && 'cursor-not-allowed',
    'will-change-transform contain-paint',
  );

  const handleComponentClick = useCallback(() => {
    if (disabled || isDragging) return;
    const next = !isActive;
    setIsActive(next);
    triggerSweep(next ? 'right' : 'left');
    onChange(next);
  }, [disabled, isDragging, isActive, onChange]);

  const triggerSweep = useCallback((direction: 'left' | 'right') => {
    if (showSweep) return;
    setShowSweep(true);
    if (sweepTimerRef.current) clearTimeout(sweepTimerRef.current);
    sweepTimerRef.current = setTimeout(() => setShowSweep(false), SWEEP_MS);
  }, [showSweep]);

  const handleDragStart = useCallback(() => {
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragEnd = useCallback(
    (_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (disabled) {
        setIsDragging(false);
        return;
      }
      const maxTravel = calculateTravel();
      const currentX = Math.max(0, Math.min(info.offset.x, maxTravel));
      const velocity = Math.abs(info.velocity.x);

      let next: boolean;
      if (velocity > VELOCITY_THRESHOLD) {
        next = info.velocity.x > 0;
      } else {
        next = currentX > maxTravel / 2;
      }

      if (next !== isActive) {
        triggerSweep(next ? 'right' : 'left');
      }

      setIsActive(next);
      setTimeout(() => setIsDragging(false), 10);
      onChange(next);
    },
    [disabled, isActive, onChange, triggerSweep, calculateTravel],
  );

  const knobX = isDragging ? 0 : isActive ? calculateTravel() : 0;
  // Durante o arrasto, o `drag` do framer-motion controla `x`. No snap final,
  // `animate` move via tween curto (compositor, sem física JS).
  const knobTransition = {
    duration: profile.d.micro,
    ease: EASE.enter,
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={label}
      disabled={disabled}
      onClick={handleComponentClick}
      data-name={isActive ? 'Toggle-On' : 'Toggle-Off'}
      className={cn(
        'relative block cursor-pointer touch-none overflow-visible border-0 bg-transparent p-0',
        disabled && 'cursor-not-allowed opacity-50',
        'active:scale-95',
        className,
      )}
    >
      {/* Trilho — estático, sem motion. */}
      <div
        className={trackClass}
        style={{
          width: `${trackWidth}px`,
          height: `${trackHeight}px`,
          backgroundColor: isActive ? mode.active : mode.inactive,
          borderRadius: `${trackHeight / 2}px`,
          transition: `background-color ${profile.d.micro}s ease-out`,
        }}
      >
        {/* Indicador LIGADO: traço vertical à esquerda. */}
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            left: `${knobMargin + 2}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${Math.max(2, knobHeight * 0.3)}px`,
            height: `${knobHeight * 0.7}px`,
            opacity: isActive ? 1 : 0,
            transition: `opacity ${profile.d.micro}s ease-out`,
            color: '#FFFFFF',
          }}
          aria-hidden
        >
          ✓
        </div>

        {/* Indicador DESLIGADO: círculo à direita. */}
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            right: `${knobMargin + 2}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${knobHeight * 0.55}px`,
            height: `${knobHeight * 0.55}px`,
            borderRadius: '50%',
            opacity: isActive ? 0 : 0.5,
            transition: `opacity ${profile.d.micro}s ease-out`,
            border: `${Math.max(1.5, knobHeight * 0.15)}px solid`,
            borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)',
          }}
          aria-hidden
        />

        {/* Varredura micro de brilho — CSS keyframe curto, sem JS por frame. */}
        {showSweep && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              height: '2px',
              top: '50%',
              marginTop: '-1px',
              background: 'rgba(255,255,255,0.5)',
              animation: `sweep ${SWEEP_MS}ms ease-out`,
              left: '10%',
              width: '80%',
              opacity: isActive ? 1 : 0,
            }}
          />
        )}
      </div>

      {/* Botão (knob) — único nó `motion`, anima apenas `transform` (compositor). */}
      <motion.div
        className={knobClass}
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: calculateTravel() }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          x: knobX,
          width: `${knobWidth}px`,
          height: `${knobHeight}px`,
          top: `${knobMargin}px`,
          left: `${knobMargin}px`,
          backgroundColor: '#FAFAFA',
          borderRadius: '50%',
          boxShadow:
            '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 -4px 8px rgba(0, 0, 0, 0.06), inset 0 2px 8px rgba(255, 255, 255, 0.3)',
          transition: `transform ${profile.d.micro}s ease-out`,
        }}
        animate={{ x: isActive ? calculateTravel() : 0, scale: isDragging ? 1.25 : 1 }}
        transition={knobTransition}
        data-name="Knob"
      />
    </button>
  );
}
