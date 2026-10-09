import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InternshipLogCard } from '../InternshipLogCard';
import type { InternshipLog } from '../../types';

// SPEC-011 §8.1/D1: o botão contextual do card — aparece só com pendência,
// some quando o registro está completo ou agendado (§7), e o de supervisão
// abre o wizard com o vínculo do registro (D7). O contexto é mockado no
// padrão de `SemesterWizard.test.tsx` para observar as chamadas.

const openWizard = vi.fn();
const openManageItem = vi.fn();
const handleSaveInternshipLog = vi.fn();

vi.mock('@/context/mobileApp', () => ({
  useMobileApp: () => ({
    openManageItem,
    handleAddTask: vi.fn(),
    handleAddReading: vi.fn(),
    handleAddSession: vi.fn(),
    openWizard,
    handleSaveInternshipLog,
  }),
}));

const HOJE = '2026-10-07';

const clinicoVazio: InternshipLog = {
  id: 'at-1',
  type: 'atendimento_clinico',
  date: '2026-10-01',
  hours: 1,
  activity: 'sessão 1 · M. S.',
  reflections: '',
};

const clinicoCompleto: InternshipLog = {
  ...clinicoVazio,
  reflections: 'fiz reverberação',
  theme: 'ansiedade',
  approach: 'TCC',
  interventionNotes: 'reestruturação cognitiva',
  observations: 'vínculo firme',
};

const supervisao: InternshipLog = {
  id: 'sup-1',
  type: 'supervisao',
  date: '2026-10-05',
  hours: 1,
  activity: 'supervisão',
  reflections: '',
  supervisor: 'dra. A',
  discussedLogIds: ['at-1'],
};

/** Todos os botões cujo nome acessível começa com "adicionar", em texto. */
const nomesAdicionar = () =>
  screen.queryAllByRole('button', { name: /^adicionar/ }).map((b) => b.textContent?.trim());

const renderCard = ({ log, allLogs = [log] }: { log: InternshipLog; allLogs?: InternshipLog[] }) =>
  render(<InternshipLogCard log={log} today={HOJE} allLogs={allLogs} />);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('InternshipLogCard — botão de completar (SPEC-011 §8.1, D1)', () => {
  it('registro com pendência mostra "adicionar reflexões" e abre o modal', () => {
    renderCard({ log: clinicoVazio });
    fireEvent.click(screen.getByRole('button', { name: 'adicionar reflexões' }));
    expect(
      screen.getByRole('heading', { name: 'o que mais tem pra anotar?' })
    ).toBeInTheDocument();
  });

  it('salvar no modal grava pelo caminho do contexto (D3→D9)', () => {
    renderCard({ log: clinicoVazio });
    fireEvent.click(screen.getByRole('button', { name: 'adicionar reflexões' }));
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    fireEvent.change(screen.getByPlaceholderText('anota do seu jeito…'), {
      target: { value: 'gostei da supervisão' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'salvar e seguir' }));
    expect(handleSaveInternshipLog).toHaveBeenCalledTimes(1);
    expect(handleSaveInternshipLog).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'at-1', reflections: 'gostei da supervisão' })
    );
  });

  it('card sem pendência não mostra o botão de completar (§8.1)', () => {
    renderCard({ log: clinicoCompleto });
    // o único "adicionar" de um card completo é o de supervisão (D7)
    expect(nomesAdicionar()).toEqual(['adicionar supervisão']);
  });

  it('registro agendado não mostra nenhum botão contextual (§7)', () => {
    renderCard({ log: { ...clinicoVazio, date: '2026-10-20' } });
    expect(nomesAdicionar()).toEqual([]);
    expect(screen.getByText('agendado · em 13 dias')).toBeInTheDocument();
  });

  it('supervisão vinculada fecha o botão de supervisão (D3/D7)', () => {
    renderCard({ log: clinicoCompleto, allLogs: [clinicoCompleto, supervisao] });
    expect(screen.queryByRole('button', { name: 'adicionar supervisão' })).not.toBeInTheDocument();
    expect(screen.getByText('supervisionada')).toBeInTheDocument();
  });

  it('registro de estágio completo não mostra o botão', () => {
    renderCard({
      log: {
        ...clinicoVazio,
        id: 'es-1',
        type: 'estagio',
        reflections: 'anotei',
        theme: 'clínica do luto',
        approach: 'humanista',
        interventionNotes: 'escuta ativa',
        observations: 'paciente engajou',
      },
    });
    expect(nomesAdicionar()).toEqual([]);
  });

  it('estágio com só reflexões mostra o próximo campo pendente (D13)', () => {
    renderCard({ log: { ...clinicoVazio, id: 'es-1', type: 'estagio', reflections: 'anotei' } });
    expect(screen.getByRole('button', { name: 'adicionar tema' })).toBeInTheDocument();
  });

  it('intervisão/outro também ganham o botão de completar (D10)', () => {
    renderCard({ log: { ...clinicoVazio, id: 'iv-1', type: 'intervisao' } });
    expect(screen.getByRole('button', { name: 'adicionar reflexões' })).toBeInTheDocument();
    cleanup();
    renderCard({ log: { ...clinicoVazio, id: 'ou-1', type: 'outro' } });
    expect(screen.getByRole('button', { name: 'adicionar reflexões' })).toBeInTheDocument();
  });

  it('registro de supervisão nunca tem botão de completar (I4/D7)', () => {
    renderCard({ log: supervisao, allLogs: [supervisao] });
    expect(nomesAdicionar()).toEqual([]);
  });
});

describe('InternshipLogCard — chip de preenchimento (SPEC-011 D13)', () => {
  it('registro vazio mostra "ainda falta preencher cinco" sem clique', () => {
    renderCard({ log: clinicoVazio });
    expect(screen.getByText('ainda falta preencher cinco')).toBeInTheDocument();
  });

  it('registro completo mostra "tudo preenchido"', () => {
    renderCard({ log: clinicoCompleto });
    expect(screen.getByText('tudo preenchido')).toBeInTheDocument();
  });

  it('só falta um campo mostra "falta reflexões"', () => {
    renderCard({
      log: {
        ...clinicoCompleto,
        reflections: '',
      },
    });
    expect(screen.getByText('falta reflexões')).toBeInTheDocument();
  });

  it('supervisão nunca mostra chip de preenchimento (I4)', () => {
    renderCard({ log: supervisao, allLogs: [supervisao] });
    expect(
      screen.queryByText(/^tudo preenchido$|^falta|^ainda falta/)
    ).not.toBeInTheDocument();
  });
});

describe('InternshipLogCard — campos de referência no expandido (SPEC-011 D10/D13)', () => {
  it('campos marcados aparecem vazios com "ainda não anotado ♡"', () => {
    renderCard({ log: clinicoVazio });
    fireEvent.click(screen.getByText('sessão 1 · M. S.'));
    expect(screen.getAllByText('ainda não anotado ♡')).toHaveLength(5);
  });

  it('campo declinado fica oculto no expandido (D11)', () => {
    renderCard({
      log: { ...clinicoVazio, theme: 'não precisou listar o tema', declinedFields: ['tema'] },
    });
    fireEvent.click(screen.getByText('sessão 1 · M. S.'));
    expect(screen.queryByText('não precisou listar o tema')).not.toBeInTheDocument();
    expect(screen.getAllByText('ainda não anotado ♡')).toHaveLength(4);
  });

  it('estágio expandido não mostra a lista de supervisão', () => {
    renderCard({ log: { ...clinicoVazio, id: 'es-1', type: 'estagio' } });
    fireEvent.click(screen.getByText('sessão 1 · M. S.'));
    expect(screen.queryByRole('button', { name: 'adicionar supervisão' })).not.toBeInTheDocument();
    expect(screen.getAllByText('ainda não anotado ♡')).toHaveLength(5);
  });
});

describe('InternshipLogCard — botão de supervisão (SPEC-011 D7)', () => {
  it('abre o wizard de supervisão com o vínculo do registro', () => {
    renderCard({ log: clinicoVazio });
    fireEvent.click(screen.getByRole('button', { name: 'adicionar supervisão' }));
    expect(openWizard).toHaveBeenCalledWith('internship', undefined, {
      kind: 'supervisao',
      discussedLogIds: ['at-1'],
    });
  });
});
