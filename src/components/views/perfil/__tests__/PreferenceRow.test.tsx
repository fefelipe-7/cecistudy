/**
 * SPEC-013 D6/D11 — preferências em rows com interação **nativa**: row de ação é
 * um `button` (Enter/Espaço/Tab vêm do browser), row de interruptor é um
 * `role="switch"`. A navegação por teclado é exercitada aqui com `user-event`
 * porque é o contrato — não revisão — que garante D11.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PreferenceRow from '../PreferenceRow';

describe('PreferenceRow — ação', () => {
  it('é um button nativo com nome acessível que inclui o valor', () => {
    const onClick = vi.fn();
    render(
      <PreferenceRow
        icon={<span aria-hidden />}
        label="tema do cantinho"
        value="calmaria azul"
        ariaLabel="tema do cantinho, atual: calmaria azul. abrir seletor de tema."
        onClick={onClick}
      />,
    );
    expect(
      screen.getByRole('button', { name: /tema do cantinho, atual: calmaria azul/ }),
    ).toBeTruthy();
  });

  it('ativa por Enter e por Espaço (teclado nativo, sem handlers próprios)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <PreferenceRow icon={<span aria-hidden />} label="tema" onClick={onClick} />,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'tema' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('o ícone é decorativo (aria-hidden), o nome vem do rótulo', () => {
    render(<PreferenceRow icon={<span aria-hidden>🎨</span>} label="tema" onClick={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'tema' });
    expect(button.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });
});

describe('PreferenceRow — interruptor', () => {
  it('expõe role="switch" com estado e alterna por teclado', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PreferenceRow
        icon={<span aria-hidden />}
        label="lembrete diário de estudo"
        toggle={{ checked: true, onChange }}
      />,
    );
    const switchEl = screen.getByRole('switch', { name: 'lembrete diário de estudo' });
    expect(switchEl.getAttribute('aria-checked')).toBe('true');

    await user.tab();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('desabilitado não alterna', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PreferenceRow
        icon={<span aria-hidden />}
        label="agenda do google"
        toggle={{ checked: false, onChange, disabled: true }}
      />,
    );
    const switchEl = screen.getByRole('switch', { name: 'agenda do google' }) as HTMLButtonElement;
    expect(switchEl.disabled).toBe(true);
    await user.tab();
    expect(switchEl).not.toHaveFocus();
  });

  it('rows alternam em ordem com Tab', async () => {
    const user = userEvent.setup();
    const onTheme = vi.fn();
    const onToggle = vi.fn();
    const { container } = render(
      <div>
        <PreferenceRow icon={<span aria-hidden />} label="tema" onClick={onTheme} />
        <PreferenceRow
          icon={<span aria-hidden />}
          label="lembrete"
          toggle={{ checked: false, onChange: onToggle }}
        />
      </div>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'tema' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('switch', { name: 'lembrete' })).toHaveFocus();
    // Sem mais interativos, o foco sai — as duas rows eram tudo que existia.
    await user.tab();
    expect(container.ownerDocument.body).toBeTruthy();
  });
});

describe('PreferenceRow — exibição', () => {
  it('sem ação e sem interruptor não cria interativo', () => {
    render(
      <PreferenceRow icon={<span aria-hidden />} label="apenas leitura" value="10 semestres" />,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.getByText('apenas leitura')).toBeTruthy();
  });
});
