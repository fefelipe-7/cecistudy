import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CompleteLogModal } from '../CompleteLogModal';
import { TEXTO_NAO_RESPONDER, type CampoPendencia } from '../../../lib/internshipCases';
import type { InternshipLog } from '../../../types';

// SPEC-011 §8 e §7: o modal sequencial "completar registro" — toggles de escolha
// persistida (D11, todos ligados por padrão), "desisti da ideia" não grava nada,
// texto vazio avança sem gravar, desligar um campo vazio grava o auto-texto do
// "não vou responder" (D12) e desmarcar tudo vai direto à confirmação (D8).
// O modal é puro (props só), então renderiza sem provider.

const logClinico = (over: Partial<InternshipLog> = {}): InternshipLog => ({
  id: 'at-1',
  type: 'atendimento_clinico',
  date: '2026-10-01',
  hours: 1,
  activity: 'sessão 1 · M. S.',
  reflections: '',
  ...over,
});

const CINCO_CAMPOS = ['reflexões', 'tema', 'abordagem', 'intervenções', 'impressões clínicas'];

const renderModal = (over: Partial<InternshipLog> = {}) => {
  const log = logClinico(over);
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(<CompleteLogModal open log={log} onClose={onClose} onSave={onSave} />);
  return { onClose, onSave };
};

afterEach(() => {
  cleanup();
});

describe('CompleteLogModal — seleção de campos (SPEC-011 D11)', () => {
  it('todos os cinco switches começam ligados num registro vazio', () => {
    renderModal();
    for (const nome of CINCO_CAMPOS) {
      expect(screen.getByRole('switch', { name: nome })).toBeChecked();
    }
  });

  it('campos preenchidos continuam listados, mas saem da fila ao continuar', () => {
    renderModal({ reflections: 'já anotei' });
    expect(screen.getAllByRole('switch')).toHaveLength(5);
    expect(screen.getByRole('switch', { name: 'reflexões' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    expect(screen.getByText('campo 1 de 4')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'tema' })).toBeInTheDocument();
  });

  it('campo declinado antes abre desligado; religar liga o toggle', () => {
    renderModal({
      reflections: TEXTO_NAO_RESPONDER.reflexoes,
      declinedFields: ['reflexoes'] as CampoPendencia[],
    });
    const reflexoes = screen.getByRole('switch', { name: 'reflexões' });
    expect(reflexoes).not.toBeChecked();
    fireEvent.click(reflexoes);
    expect(reflexoes).toBeChecked();
  });
});

describe('CompleteLogModal — I3: "desisti da ideia" não grava (§8.2)', () => {
  it('pular todos os campos chega na confirmação sem chamar onSave', () => {
    const { onClose, onSave } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    expect(screen.getByText('campo 1 de 5')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'desisti da ideia' }));
    expect(screen.getByText('campo 2 de 5')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    for (const esperado of ['campo 3 de 5', 'campo 4 de 5', 'campo 5 de 5']) {
      fireEvent.click(screen.getByRole('button', { name: 'desisti da ideia' }));
      expect(screen.getByText(esperado)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    }
    fireEvent.click(screen.getByRole('button', { name: 'desisti da ideia' }));
    expect(screen.getByText('nada mudou por aqui — tudo certo ♡')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('CompleteLogModal — salvar e seguir (§7)', () => {
  it('grava o texto do campo no registro e avança', () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    fireEvent.change(screen.getByPlaceholderText('anota do seu jeito…'), {
      target: { value: 'gostei da supervisão' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'salvar e seguir' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'at-1', reflections: 'gostei da supervisão' })
    );
    expect(screen.getByText('campo 2 de 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'tema' })).toBeInTheDocument();
  });

  it('texto só espaços avança sem gravar', () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    fireEvent.change(screen.getByPlaceholderText('anota do seu jeito…'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'salvar e seguir' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('campo 2 de 5')).toBeInTheDocument();
  });

  it('confirmação conta os campos salvos e "concluir" fecha', () => {
    const { onClose, onSave } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    fireEvent.change(screen.getByPlaceholderText('anota do seu jeito…'), {
      target: { value: 'texto da usuária' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'salvar e seguir' }));
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'desisti da ideia' }));
    }
    expect(screen.getByText('registro atualizado com 1 campo ♡')).toBeInTheDocument();
    expect(onSave).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'concluir' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('CompleteLogModal — declinar grava o auto-texto (SPEC-011 D12)', () => {
  it('desligar um campo vazio e continuar grava o auto-texto e tira da fila', () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByRole('switch', { name: 'tema' }));
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'at-1',
        theme: TEXTO_NAO_RESPONDER.tema,
        declinedFields: ['tema'],
      })
    );
    expect(screen.getByText('campo 1 de 4')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'reflexões' })).toBeInTheDocument();
  });

  it('desmarcar os cinco e continuar grava os cinco auto-textos (D8 via D12)', () => {
    const { onSave } = renderModal();
    for (const nome of CINCO_CAMPOS) {
      fireEvent.click(screen.getByRole('switch', { name: nome }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'at-1',
        reflections: TEXTO_NAO_RESPONDER.reflexoes,
        theme: TEXTO_NAO_RESPONDER.tema,
        approach: TEXTO_NAO_RESPONDER.abordagem,
        interventionNotes: TEXTO_NAO_RESPONDER.intervencoes,
        observations: TEXTO_NAO_RESPONDER.impressoes,
        declinedFields: ['reflexoes', 'tema', 'abordagem', 'intervencoes', 'impressoes'],
      })
    );
    expect(screen.getByText('registro atualizado com 5 campos ♡')).toBeInTheDocument();
  });

  it('religar um campo declinado grava a limpeza do auto-texto (D12)', () => {
    const { onSave } = renderModal({
      reflections: TEXTO_NAO_RESPONDER.reflexoes,
      declinedFields: ['reflexoes'] as CampoPendencia[],
    });
    fireEvent.click(screen.getByRole('switch', { name: 'reflexões' }));
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const arg = onSave.mock.calls[0][0] as InternshipLog;
    expect(arg.reflections).toBe('');
    expect(arg.declinedFields).toBeUndefined();
  });

  it('desmarcar sem cambiar nada não grava (continuar sem mudança)', () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'desisti da ideia' }));
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('CompleteLogModal — fechar sem gravar (§7)', () => {
  it('"agora não" chama onClose sem gravar nada', () => {
    const { onClose, onSave } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'agora não' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('CompleteLogModal — restrição por tipo (SPEC-011 D10, I4)', () => {
  it('estágio/intervisão/outro oferecem os 5 switches; supervisão não oferece nenhum', () => {
    for (const tipo of ['estagio', 'intervisao', 'outro'] as InternshipLog['type'][]) {
      cleanup();
      renderModal({ type: tipo });
      expect(screen.getAllByRole('switch')).toHaveLength(5);
    }
    cleanup();
    renderModal({ type: 'supervisao' });
    expect(screen.queryAllByRole('switch')).toHaveLength(0);
  });
});