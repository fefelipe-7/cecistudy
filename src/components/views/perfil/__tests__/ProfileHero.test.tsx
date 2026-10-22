/**
 * SPEC-013 D5/D11 — o hero responde "eu sou" com um único `h1`, e a edição de
 * identidade é um sheet com estado sujo. Estes testes fixam o caso de borda do
 * nome vazio (§7), a degradação de universidade/frase e o fluxo do sheet
 * (guardar, descartar, validar).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileHero from '../ProfileHero';
import ProfileEditSheet from '../ProfileEditSheet';
import type { ProfileIdentity } from '../../../../lib/profileViewModel';

const identity = (over: Partial<ProfileIdentity> = {}): ProfileIdentity => ({
  displayName: 'ceci',
  subtitle: 'Psicologia · USP',
  quote: 'um passo por vez',
  photoUrl: undefined,
  initials: 'C',
  level: 4,
  title: 'caminhante',
  ...over,
});

describe('ProfileHero', () => {
  it('usa o nome como h1 único e mostra curso · universidade e nível', () => {
    render(
      <ProfileHero
        identity={identity()}
        onEdit={vi.fn()}
        onPickPhoto={vi.fn()}
        onRemovePhoto={vi.fn()}
      />,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('ceci');
    expect(screen.getByText('Psicologia · USP')).toBeTruthy();
    expect(screen.getByText(/nível 4 · caminhante/)).toBeTruthy();
  });

  it('com nome vazio convida ao onboarding (nunca h1 em branco)', () => {
    render(
      <ProfileHero
        identity={identity({ displayName: '   ' })}
        onEdit={vi.fn()}
        onPickPhoto={vi.fn()}
        onRemovePhoto={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('como quer ser chamada?');
  });

  it('sem universidade, oferece o link de preenchimento que abre a edição', () => {
    const onEdit = vi.fn();
    render(
      <ProfileHero
        identity={identity({ subtitle: '' })}
        onEdit={onEdit}
        onPickPhoto={vi.fn()}
        onRemovePhoto={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'adicione sua universidade' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('sem foto mostra as iniciais e o botão de câmera; com foto, o remover', () => {
    const onPickPhoto = vi.fn();
    const onRemovePhoto = vi.fn();
    const { rerender } = render(
      <ProfileHero
        identity={identity()}
        onEdit={vi.fn()}
        onPickPhoto={onPickPhoto}
        onRemovePhoto={onRemovePhoto}
      />,
    );
    expect(screen.queryByRole('button', { name: 'remover foto de perfil' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'trocar foto de perfil' }));
    expect(onPickPhoto).toHaveBeenCalledTimes(1);

    rerender(
      <ProfileHero
        identity={identity({ photoUrl: 'data:image/png;base64,AAAA' })}
        onEdit={vi.fn()}
        onPickPhoto={onPickPhoto}
        onRemovePhoto={onRemovePhoto}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'remover foto de perfil' }));
    expect(onRemovePhoto).toHaveBeenCalledTimes(1);
  });

  it('sem frase, usa o placeholder editorial (não deixa caixa vazia)', () => {
    render(
      <ProfileHero
        identity={identity({ quote: '  ' })}
        onEdit={vi.fn()}
        onPickPhoto={vi.fn()}
        onRemovePhoto={vi.fn()}
      />,
    );
    expect(screen.getByText(/um cantinho para organizar a rotina/)).toBeTruthy();
  });
});

describe('ProfileEditSheet', () => {
  const initial = {
    name: 'ceci',
    university: 'USP',
    dailyQuote: 'um passo por vez',
    // `SPEC-C-014 D8`: o interruptor viaja com a edição de identidade.
    nomeAutorizado: false,
  };

  it('só habilita guardar quando algo mudou e o nome está preenchido', () => {
    const onSave = vi.fn();
    render(<ProfileEditSheet open onClose={vi.fn()} initial={initial} onSave={onSave} />);
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: 'maria' } });
    expect(save.disabled).toBe(false);

    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith({
      name: 'maria',
      university: 'USP',
      dailyQuote: 'um passo por vez',
      nomeAutorizado: false,
    });
  });

  it('nome vazio bloqueia o salvar e mostra o convite no lugar do erro frio', () => {
    render(<ProfileEditSheet open onClose={vi.fn()} initial={initial} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: '   ' } });
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getByText('como quer ser chamada?')).toBeTruthy();
  });

  it('fechar com alterações pendentes pede confirmação antes de descartar', () => {
    const onClose = vi.fn();
    render(<ProfileEditSheet open onClose={onClose} initial={initial} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: 'maria' } });

    fireEvent.click(screen.getByRole('button', { name: 'cancelar' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/alterações não guardadas/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'descartar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // `SPEC-C-014` D8 — o interruptor do tratamento por nome
  // -------------------------------------------------------------------------
  it('o interruptor do nome começa desligado e a explicação usa o nome digitado', () => {
    render(<ProfileEditSheet open onClose={vi.fn()} initial={initial} onSave={vi.fn()} />);
    // Fechado por padrão: a voz chama de "você" até ela autorizar.
    const toggle = screen.getByRole('switch', { name: 'me chamar pelo nome' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    // A explicação diz **o que muda**, com o nome que está no campo.
    expect(screen.getByText(/eu te chamo de ceci/)).toBeTruthy();
  });

  it('ligar o interruptor suja o rascunho e grava a autorização', () => {
    const onSave = vi.fn();
    render(<ProfileEditSheet open onClose={vi.fn()} initial={initial} onSave={onSave} />);
    fireEvent.click(screen.getByRole('switch', { name: 'me chamar pelo nome' }));
    // Só o interruptor já é mudança: guardar não pode exigir que ela redigite o nome.
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ nomeAutorizado: true, name: 'ceci' }),
    );
  });

  it('nome vazio nunca salva autorização, mesmo com o interruptor ligado', () => {
    const onSave = vi.fn();
    render(<ProfileEditSheet open onClose={vi.fn()} initial={initial} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('switch', { name: 'me chamar pelo nome' }));
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    // O nome vazio trava o salvar por si — a autorização nunca chega sozinha.
    expect(save.disabled).toBe(true);
  });

  it('sem alterações, fechar é imediato', () => {
    const onClose = vi.fn();
    render(<ProfileEditSheet open onClose={onClose} initial={initial} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
