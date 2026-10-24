/**
 * SPEC-013 D3/D11 — quatro métricas acionáveis, cada uma um `button` com rótulo
 * completo para leitor de tela, e o estado vazio convidativo (§7). Nenhuma
 * `div role="button"`.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressPulse from '../ProgressPulse';
import type { ProfilePulse } from '../../../../lib/profileViewModel';

const pulse = (over: Partial<ProfilePulse> = {}): ProfilePulse => ({
  studyTimeMinutes: 75,
  studyTimeLabel: '1h 15min',
  pagesRead: 50,
  tasksCompleted: 3,
  tasksTotal: 5,
  examsPending: 2,
  ...over,
});

const renderPulse = (over: Partial<ProfilePulse> = {}) => {
  const handlers = {
    onOpenSessions: vi.fn(),
    onOpenReadings: vi.fn(),
    onOpenTasks: vi.fn(),
    onOpenExams: vi.fn(),
  };
  render(<ProgressPulse pulse={pulse(over)} {...handlers} />);
  return handlers;
};

describe('ProgressPulse', () => {
  it('cada métrica navega para a sua tela', () => {
    const h = renderPulse();
    fireEvent.click(screen.getByRole('button', { name: /estudados/ }));
    fireEvent.click(screen.getByRole('button', { name: /páginas lidas/ }));
    fireEvent.click(screen.getByRole('button', { name: /tarefas concluídas/ }));
    fireEvent.click(screen.getByRole('button', { name: /provas pendentes/ }));
    expect(h.onOpenSessions).toHaveBeenCalledTimes(1);
    expect(h.onOpenReadings).toHaveBeenCalledTimes(1);
    expect(h.onOpenTasks).toHaveBeenCalledTimes(1);
    expect(h.onOpenExams).toHaveBeenCalledTimes(1);
  });

  it('zero métricas mostra o convite, não quatro zeros frios', () => {
    render(
      <ProgressPulse
        pulse={pulse({
          studyTimeMinutes: 0,
          studyTimeLabel: '0min',
          pagesRead: 0,
          tasksCompleted: 0,
          tasksTotal: 0,
          examsPending: 0,
        })}
        onOpenSessions={vi.fn()}
        onOpenReadings={vi.fn()}
        onOpenTasks={vi.fn()}
        onOpenExams={vi.fn()}
      />,
    );
    expect(screen.getByText(/comece anotando uma sessão de estudo/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /provas pendentes/ })).toBeNull();
  });

  it('provas pendentes = 0 não usa tom de atenção', () => {
    renderPulse({ examsPending: 0 });
    const exams = screen.getByRole('button', { name: /0 provas pendentes/ });
    expect(exams.className).not.toContain('status-warning');
  });
});
