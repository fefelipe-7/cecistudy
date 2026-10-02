import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardScaffold, type WizardStep } from '../WizardScaffold';

const steps: WizardStep[] = [
  { id: 's1', title: 'identificação', headline: 'quem é essa aula?', content: <p>passo um</p> },
  { id: 's2', title: 'anotações', headline: 'o que anotou?', content: <p>passo dois</p> },
  { id: 's3', title: 'revisão', headline: 'confere?', content: <p>passo três</p> },
];

const renderWizard = (over: Partial<React.ComponentProps<typeof WizardScaffold>> = {}) =>
  render(
    <WizardScaffold
      title="anotar aula"
      icon={<span />}
      steps={steps}
      step={0}
      onStepChange={vi.fn()}
      onSave={vi.fn()}
      onClose={vi.fn()}
      {...over}
    />,
  );

/**
 * F4.7 (parte compartilhada): o contador "2 de 4" é um `span` único com
 * `aria-label` — ele informa *quantos*, não *qual*. Quem chega no meio de um
 * passo (por teclado, por leitor de tela) não descobre em que passo está. A
 * correção é uma lista de passos acessível com `aria-current="step"`, mais o
 * foco indo para a pergunta do passo novo — sem isso, trocar de passo deixa o
 * foco num elemento que saiu do DOM.
 */
describe('WizardScaffold — a11y dos passos (SPEC-008 F4.7)', () => {
  it('expõe a lista de passos com aria-current no passo atual', () => {
    renderWizard();
    const current = screen.getByRole('listitem', { current: 'step' });
    expect(current.textContent).toBe('identificação');
    // os outros dois existem na lista, mas sem `aria-current`
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('aria-current acompanha o passo', () => {
    renderWizard({ step: 2 });
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toBe('revisão');
  });

  it('move o foco para a pergunta ao trocar de passo', async () => {
    function Harness() {
      const [step, setStep] = useState(0);
      return (
        <WizardScaffold
          title="anotar aula"
          icon={<span />}
          steps={steps}
          step={step}
          onStepChange={setStep}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );
    }
    render(<Harness />);
    expect(document.activeElement).not.toBe(screen.getByRole('heading', { level: 2 }));

    fireEvent.click(screen.getByText('continuar'));

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'o que anotou?' })),
    );
  });

  it('não rouba o foco ao abrir (passo 0)', () => {
    renderWizard();
    expect(document.activeElement).not.toBe(screen.getByRole('heading', { level: 2 }));
  });
});
