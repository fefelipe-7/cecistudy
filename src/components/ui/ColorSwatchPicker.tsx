import React from 'react';
import { cn } from '@/lib/utils';
import { COURSE_COLORS } from '@/lib/courseOptions';

interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
  swatches?: string[];
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Seletor de cor por swatches redondos (cores são dados → style, não tokens).
 * Padrão único de cor de matéria no app (CourseWizard + EditCourseModal).
 */
export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  value,
  onChange,
  swatches = COURSE_COLORS,
  size = 'md',
  className,
}) => {
  const swatchSize = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  return (
    <div className={cn('flex items-center gap-2.5 flex-wrap', className)}>
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          aria-label={`cor ${c}`}
          className={cn(
            'rounded-full transition-all cursor-pointer active:scale-95',
            swatchSize,
            value === c ? 'ring-2 ring-ceci-primary ring-offset-2 scale-105' : 'hover:scale-105'
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
};