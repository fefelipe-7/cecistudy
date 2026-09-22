import React from 'react';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { ComposeMode } from '@/lib/composeLogic';

interface ComposeModeSwitchProps {
  mode: ComposeMode;
  onChange: (mode: ComposeMode) => void;
}

/** Alternância "nota solta ♡ / aula 📚" — a cara da folha muda com o modo. */
export const ComposeModeSwitch: React.FC<ComposeModeSwitchProps> = ({ mode, onChange }) => (
  <SegmentedControl
    variant="primary"
    ariaLabel="tipo de nota"
    className="w-full [&>button]:flex-1 [&>button]:text-center"
    options={[
      { value: 'avulsa', label: 'nota solta ♡' },
      { value: 'aula', label: 'aula 📚' },
    ]}
    value={mode}
    onChange={onChange}
  />
);