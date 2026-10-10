import React from 'react';

interface StepProgressProps {
  steps: string[];
  current: number;
}

/**
 * Mapa de passos do wizard: uma linha contínua com o quanto já andou, e uma
 * pastilha com o nome do passo.
 *
 * Aqui já houve três versões. As bolinhas numeradas saíram porque eram um
 * terceiro contador de "onde estou" ao lado do "N de M" e da lista `aria-current`
 * do header. A linha segui segmentada — mas da uma leitura de "botão", e a
 * linha do texto repetia o que a pastilha já diz.
 *
 * Agora a linha é **contínua**: um trilho claro com o preenchimento rosa por
 * cima, o que importa é *quanto* já andou e não em qual botão. O nome do passo
 * vai na pastilha, encostado na ponta da barra — o olho vai lá primeiro, e o
 * "N de M" do header segue sendo o contador (a `aria-current` dos passos também
 * mora no header, na `ol` sr-only — SPEC-008 F4.7).
 */
export const StepProgress: React.FC<StepProgressProps> = ({ steps, current }) => {
  const ratio = (current / Math.max(steps.length - 1, 1)) * 100;

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={current + 1}
      aria-label={`passo ${current + 1} de ${steps.length}: ${steps[current]}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-[3px] flex-1 rounded-full bg-ceci-border-subtle overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-ceci-brand transition-[width] duration-500 ease-out"
            style={{ width: `${ratio}%` }}
          />
        </div>
        <span className="shrink-0 rounded-full bg-surface-rose border border-ceci-border-brand px-2.5 py-1 text-[11px] font-semibold text-ceci-brand-strong">
          {steps[current]}
        </span>
      </div>
    </div>
  );
};