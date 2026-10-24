// SPEC-024 D3/D5: agenda de 14 dias, mês navegável e painel do dia com `+`.
// O teste usa o `MobileAppProvider` de verdade (o caminho de produção), como o
// `TccView.test.tsx`.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../../context/mobileApp';
import { useDataClientCourses } from '../../../context/DataClientProvider';
import { CalendarScreen } from '../CalendarScreen';
import CalendarMonth from '../faculdade/CalendarMonth';
import { addDaysKey, todayKeyLocal } from '../../../lib/dateBR';
import type { CalendarEntry } from '../../../lib/schedule';
import type { Task, ThesisChapter, ThesisProject } from '../../../types';

afterEach(cleanup);

let chaptersSnapshot = '';

const task = (id: string, dueDate: string): Task =>
  ({
    id,
    title: `tarefa ${id}`,
    category: 'outro',
    priority: 'media',
    completed: false,
    dueDate,
  }) as Task;

const chapter = (id: string, title: string, dueDate: string): ThesisChapter =>
  ({
    id,
    thesisId: 'tcc-main',
    position: 0,
    title,
    kind: 'capitulo',
    requiredness: 'obrigatorio',
    stage: 'escrevendo',
    dueDate,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  }) as ThesisChapter;

const thesisWithTitle = (): ThesisProject =>
  ({
    id: 'tcc-main',
    title: 'luto e escuta clínica',
    advisor: 'Helena Duarte',
    status: 'em_andamento',
  }) as ThesisProject;

const Seed = ({ chapters, thesis }: { chapters: ThesisChapter[]; thesis?: ThesisProject }) => {
  const { openCalendar, setThesisChapters, handleUpdateTcc } = useMobileApp();
  const { setTasks } = useDataClientCourses();
  useEffect(() => {
    chaptersSnapshot = JSON.stringify(chapters);
    setTasks([task('t-1', addDaysKey(todayKeyLocal(), 3))]);
    if (thesis) handleUpdateTcc(thesis);
    setThesisChapters(chapters);
    openCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

describe('CalendarScreen (SPEC-024 D3/D5)', () => {
  it('I4 — montar a tela não escreve: o dado semeado continua igual', () => {
    const chapters = [chapter('thc-1', 'revisão de literatura', addDaysKey(todayKeyLocal(), 2))];
    render(
      <MobileAppProvider>
        <Seed chapters={chapters} />
        <CalendarScreen />
      </MobileAppProvider>,
    );

    // a agenda de 14 dias mostra a tarefa e o capítulo, uma vez cada
    expect(screen.getAllByText('tarefa t-1')).toHaveLength(1);
    expect(screen.getAllByText('revisão de literatura')).toHaveLength(1);
    expect(JSON.stringify(chapters)).toBe(chaptersSnapshot);
  });

  it('D5 — o `+` do dia abre as portas que existem, e a reunião só com TCC', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    fireEvent.click(screen.getByLabelText('adicionar item neste dia'));
    expect(screen.getByText('pendência')).toBeTruthy();
    expect(screen.getByText('prova')).toBeTruthy();
    expect(screen.queryByText('reunião do tcc')).toBeNull();
  });

  it('D5 — com TCC a porta de reunião aparece', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} thesis={thesisWithTitle()} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    fireEvent.click(screen.getByLabelText('adicionar item neste dia'));
    expect(screen.getByText('reunião do tcc')).toBeTruthy();
  });
});

describe('CalendarMonth (SPEC-024 D6)', () => {
  const entry = (date: string): CalendarEntry => ({
    id: `e-${date}`,
    date,
    kind: 'tarefa',
    layer: 'faculdade',
    title: 'antiga',
    ref: { kind: 'task', id: 't1' },
  });

  it('I10 — o dia 5 de dezembro não marca o dia 5 de janeiro', () => {
    render(
      <CalendarMonth
        year={2027}
        month={1}
        entries={[entry('2026-12-05')]}
        today="2027-01-10"
        selected={null}
        onShift={() => {}}
        onToday={() => {}}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByLabelText('dia 5')).toBeTruthy();
    expect(screen.queryByLabelText('dia 5, tem itens')).toBeNull();
    // e o dia certo do mês seguinte aparece marcado
    expect(screen.getByLabelText('dia 10')).toBeTruthy();
  });

  it('marca o dia do mês visível que tem item', () => {
    render(
      <CalendarMonth
        year={2027}
        month={1}
        entries={[entry('2027-01-05')]}
        today="2027-01-10"
        selected={null}
        onShift={() => {}}
        onToday={() => {}}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByLabelText('dia 5, tem itens')).toBeTruthy();
  });
});
