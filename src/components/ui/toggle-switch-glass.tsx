import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BASE_D, BASE_T, EASE, getTransition } from '@/lib/motion';

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
  sm: { trackWidth: 51, trackHeight: 31, knobWidth: 27, knobHeight: 21, knobMargin: 2, indicatorWidth: 2, indicatorHeight: 9, indicatorOffset: 11, circleSize: 7 },
  md: { trackWidth: 60, trackHeight: 33, knobWidth: 35, knobHeight: 24, knobMargin: 2.5, indicatorWidth: 2, indicatorHeight: 10, indicatorOffset: 12, circleSize: 8 },
  lg: { trackWidth: 80, trackHeight: 36, knobWidth: 47, knobHeight: 30, knobMargin: 3, indicatorWidth: 2, indicatorHeight: 13, indicatorOffset: 15.5, circleSize: 10.5 },
};

const colorThemes = {
  default: {
    light: { active: '#26BF4D', inactive: 'hsl(0, 0%, 90%)' },
    dark: { active: '#26BF4D', inactive: 'hsl(0, 0%, 25%)' },
  },
  brand: {
    light: { active: '#D4617C', inactive: 'hsl(0, 0%, 90%)' },
    dark: { active: '#AF465F', inactive: 'hsl(0, 0%, 25%)' },
  },
  success: {
    light: { active: 'hsl(142, 76%, 36%)', inactive: 'hsl(0, 0%, 90%)' },
    dark: { active: 'hsl(142, 76%, 30%)', inactive: 'hsl(0, 0%, 25%)' },
  },
  warning: {
    light: { active: 'hsl(38, 92%, 50%)', inactive: 'hsl(0, 0%, 90%)' },
    dark: { active: 'hsl(38, 92%, 45%)', inactive: 'hsl(0, 0%, 25%)' },
  },
  danger: {
    light: { active: 'hsl(0, 84%, 60%)', inactive: 'hsl(0, 0%, 90%)' },
    dark: { active: 'hsl(0, 84%, 50%)', inactive: 'hsl(0, 0%, 25%)' },
  },
  purple: {
    light: { active: 'hsl(271, 91%, 65%)', inactive: 'hsl(0, 0%, 90%)' },
    dark: { active: 'hsl(271, 91%, 55%)', inactive: 'hsl(0, 0%, 25%)' },
  },
  cyan: {
    light: { active: 'hsl(187, 85%, 53%)', inactive: 'hsl(0, 0%, 90%)' },
    dark: { active: 'hsl(187, 85%, 43%)', inactive: 'hsl(0, 0%, 25%)' },
  },
};

// Limiar de velocidade para arrastar-e-soltar ligar/desligar (comportamento do Settings.app)
const VELOCITY_THRESHOLD = 200;

export interface ToggleSwitchProps {
  className?: string;
  isActive?: boolean;
  onChange?: (isActive: boolean) => void;
  darkMode?: boolean;
  glassEffect?: boolean;
  size?: ToggleSize;
  colorTheme?: ToggleColorTheme;
  /** Rótulo acessível (`aria-label`) — o botão é o próprio `role="switch"`. */
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
  const [isPressed, setIsPressed] = useState(false);
  const [showSweep, setShowSweep] = useState(false);
  const [sweepDirection, setSweepDirection] = useState<'left' | 'right'>('right');
  const trackRef = useRef<HTMLDivElement | null>(null);
  const velocityRef = useRef(0);

  const shouldReduceMotion = useReducedMotion();

  const { trackWidth, trackHeight, knobWidth, knobHeight, knobMargin, indicatorWidth, indicatorHeight, indicatorOffset, circleSize } = sizeConfig[size];

  const calculateTravel = () => {
    return trackWidth - knobWidth - knobMargin * 2;
  };

  const motionX = useMotionValue(initialIsActive ? calculateTravel() : 0);

  // Mola de gesto (SPEC-007 §D5) — sob movimento reduzido o knob usa o valor
  // cru, sem mola: a posição salta, que é o mesmo que `{ duration: 0 }`.
  const springX = useSpring(motionX, { ...BASE_T.gesture });

  useEffect(() => {
    setIsActive(initialIsActive);
    const newX = initialIsActive ? calculateTravel() : 0;
    motionX.set(newX);
  }, [initialIsActive]);

  function getBackgroundColor() {
    const theme = colorThemes[colorTheme];
    const mode = darkMode ? theme.dark : theme.light;
    return isActive ? mode.active : mode.inactive;
  }

  function triggerSweep(direction: 'left' | 'right') {
    if (shouldReduceMotion) return;
    setSweepDirection(direction);
    setShowSweep(true);
    setTimeout(() => setShowSweep(false), 150);
  }

  // Pointer events para toque + mouse
  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return;
    setIsPressed(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerUp() {
    setIsPressed(false);
  }

  function handlePointerCancel() {
    setIsPressed(false);
  }

  function handleComponentClick() {
    if (disabled || isDragging) return;

    const newState = !isActive;
    setIsActive(newState);

    const newX = newState ? calculateTravel() : 0;
    motionX.set(newX);

    // Micro-varredura de brilho
    triggerSweep(newState ? 'right' : 'left');

    onChange(newState);
  }

  function handleDragStart() {
    if (disabled) return;
    setIsDragging(true);
    velocityRef.current = 0;
  }

  function handleDrag(_event: unknown, info: { delta: { x: number }; velocity: { x: number } }) {
    if (disabled) return;
    const maxTravel = calculateTravel();
    const currentX = motionX.get() + info.delta.x;
    const clampedX = Math.max(0, Math.min(currentX, maxTravel));
    motionX.set(clampedX);
    velocityRef.current = info.velocity.x;
  }

  function handleDragEnd() {
    if (disabled) {
      setIsDragging(false);
      return;
    }
    const maxTravel = calculateTravel();
    const currentX = motionX.get();
    const velocity = velocityRef.current;

    // Alternância por velocidade (comportamento real do Settings.app)
    let newState: boolean;
    if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
      // toque rápido — decide pela direção da velocidade
      newState = velocity > 0;
    } else {
      // arrasto lento — decide pela posição
      newState = currentX > maxTravel / 2;
    }

    if (newState !== isActive) {
      triggerSweep(newState ? 'right' : 'left');
    }

    setIsActive(newState);
    const finalX = newState ? maxTravel : 0;
    motionX.set(finalX);
    onChange(newState);

    setTimeout(() => setIsDragging(false), 10);
  }

  const trackStyle = {
    width: `${trackWidth}px`,
    height: `${trackHeight}px`,
  };

  // Transição de pressão estilo UIKit (rápida, sem quique)
  const pressTransition = getTransition({ duration: BASE_D.micro, ease: EASE.standard });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'relative block cursor-pointer touch-none overflow-visible border-0 bg-transparent p-0',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleComponentClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerUp}
      data-name={isActive ? 'Toggle-On' : 'Toggle-Off'}
    >
      {/* Trilho */}
      <motion.div
        ref={trackRef}
        className="relative z-0 h-full w-full rounded-full"
        style={trackStyle}
        animate={{
          backgroundColor: getBackgroundColor(),
          boxShadow: isPressed ? '0 0 0 2px rgba(0,0,0,0.08)' : '0 0 0 0px rgba(0,0,0,0)',
        }}
        transition={getTransition({ duration: BASE_D.micro, ease: EASE.standard })}
        data-name="Track"
      >
        {/* Brilho interno do trilho (efeito vidro) */}
        {glassEffect && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15)',
            }}
          />
        )}

        {/* Indicador LIGADO: traço vertical | à esquerda */}
        <motion.div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            left: `${indicatorOffset}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${indicatorWidth}px`,
            height: `${indicatorHeight}px`,
          }}
          animate={{
            opacity: isActive ? 1 : 0,
          }}
          transition={{ duration: BASE_D.micro }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '100px',
            }}
          />
        </motion.div>

        {/* Indicador DESLIGADO: círculo ○ à direita */}
        <motion.div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            right: `${indicatorOffset}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${circleSize}px`,
            height: `${circleSize}px`,
          }}
          animate={{
            opacity: isActive ? 0 : 0.5,
          }}
          transition={{ duration: BASE_D.micro }}
        >
          <div
            className="rounded-full"
            style={{
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              border: `${Math.max(1.5, circleSize * 0.15)}px solid`,
              borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)',
            }}
          />
        </motion.div>

        {/* Varredura micro de brilho */}
        {showSweep && !shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              height: '2px',
              top: '50%',
              marginTop: '-1px',
              background: 'rgba(255,255,255,0.5)',
            }}
            initial={{
              width: '0%',
              left: sweepDirection === 'right' ? '10%' : '90%',
              opacity: 0,
            }}
            animate={{
              width: '80%',
              left: sweepDirection === 'right' ? '10%' : '10%',
              opacity: [0, 0.7, 0],
            }}
            transition={{ duration: BASE_D.micro, ease: EASE.standard }}
          />
        )}
      </motion.div>

      {/* Botão (knob) */}
      <motion.div
        className="absolute rounded-full z-20 cursor-grab active:cursor-grabbing"
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: calculateTravel() }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          x: shouldReduceMotion ? motionX : springX,
          width: `${knobWidth}px`,
          height: `${trackHeight - knobMargin * 2}px`,
          top: `${knobMargin}px`,
          left: `${knobMargin}px`,
          overflow: 'visible',
        }}
        animate={{
          scale: isDragging ? 1.25 : 1,
          boxShadow: isDragging
            ? '0 12px 40px -8px rgba(0, 0, 0, 0.35), 0 6px 16px -4px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        transition={pressTransition}
        data-name="Knob"
      >
        {/* Base do knob — pílula neumórfica 3D */}
        <motion.div
          className="w-full h-full rounded-full relative overflow-hidden"
          animate={{
            backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.08)' : '#FAFAFA',
          }}
          transition={{ duration: BASE_D.micro, ease: EASE.standard }}
          style={{
            backdropFilter: isDragging ? 'blur(32px) brightness(1.1)' : 'blur(0px)',
            WebkitBackdropFilter: isDragging ? 'blur(32px) brightness(1.1)' : 'blur(0px)',
            boxShadow: isDragging
              ? '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(255, 255, 255, 0.12), inset 0 -2px 8px rgba(0, 0, 0, 0.1), inset 0 2px 8px rgba(255, 255, 255, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 -4px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Brilho superior — curvatura para o efeito 3D */}
          <div
            className="absolute top-0 left-[10%] w-[80%] h-[45%] rounded-t-full pointer-events-none"
            style={{
              background: isDragging
                ? 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 40%, transparent 100%)',
            }}
          />
          {/* Brilho secundário — leve nas bordas */}
          <div
            className="absolute top-[5%] left-[15%] w-[70%] h-[25%] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)',
              filter: 'blur(2px)',
            }}
          />
          {/* Sombra inferior — profundidade 3D */}
          <div
            className="absolute bottom-0 left-0 w-full h-[40%] rounded-b-full pointer-events-none"
            style={{
              background: isDragging
                ? 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)',
            }}
          />
        </motion.div>
        {/* Aro de vidro externo — só aparece ao arrastar */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            opacity: isDragging ? 1 : 0,
          }}
          transition={{ duration: BASE_D.micro }}
          style={{
            border: '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: 'inset 0 0 12px -2px rgba(255, 255, 255, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
          }}
        />
      </motion.div>
    </button>
  );
}
