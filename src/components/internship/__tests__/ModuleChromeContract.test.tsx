import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StepProgress } from '../../wizards/StepProgress';
import { NextStepList } from '../NextStepRow';
import type { InternshipLog } from '../../../types';

afterEach(cleanup);

// SPEC-010 D6: contrato de apresentação dos componentes puros do módulo.

const log = { type: 'supervisao', nextStepLinks: [] } as unknown as InternshipLog;

describe('contrato D6 (I3/I4)', () => {
  it('StepProgress expõe role="progressbar" e aria-valuenow', () => {
    render(<StepProgress steps={['contexto', 'sessão', 'revisão']} current={1} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemin', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
  });

  it('linha simples: mostra o passo atual por extenso, sem bolinha numerada', () => {
    const { container } = render(<StepProgress steps={['a', 'b']} current={0} />);
    // o label abaixo da linha diz em que passo a usuária está
    expect(screen.getByText('a')).toBeInTheDocument();
    // sem a bolinha com o número: nada além do label descreve o passo como '1'
    expect(container.textContent).not.toContain('1');
    // o `aria-current` dos passos pertence à lista sr-only do header (SPEC-008 F4.7)
    expect(container.querySelector('[aria-current]')).toBeNull();
  });

  it('I3: rótulos de próximos passos duplicados não disparam chave duplicada', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <NextStepList
        steps={['ligar pra supervisora', 'ligar pra supervisora']}
        log={log}
        exists={() => true}
        onConvert={() => {}}
      />
    );
    const keyWarnings = error.mock.calls.filter((c) => String(c[0]).includes('key'));
    expect(keyWarnings).toHaveLength(0);
    error.mockRestore();
  });

  it('I4: botões do NextStepRow têm alvo ≥44px (w-11 h-11)', () => {
    render(
      <NextStepList steps={['um']} log={log} exists={() => true} onConvert={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
    for (const b of buttons) expect(b.className).toContain('w-11');
  });
});
