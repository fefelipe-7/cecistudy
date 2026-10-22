import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../../context/mobileApp';
import { ContextualBottomBar } from '../../ui/ContextualBottomBar';
import { TccView } from '../../views/TccView';
import { ThesisChapter, ThesisProject } from '../../../types';
import type { ThesisTab } from '../../../../packages/navigation/src/types';

/**
 * A barra contextual executa a **mesma** função que a tela (SPEC-022 D1).
 *
 * Este teste é a trava do defeito reportado: na aba de capítulos, a ação
 * "adicionar capítulo" da barra abria a **edição completa do TCC** (o wizard
 * da ficha) em vez da sheet de capítulo. Aqui, a barra abre a sheet — e o
 * wizard não abre.
 *
 * O teste usa o `MobileAppProvider` de verdade (o caminho usado em produção).
 */

const tccBase = (): ThesisProject => ({
  id: 'tcc-main',
  title: 'luto e escuta clínica na psicoterapia do idoso',
  advisor: 'Helena Duarte',
  field: 'Psicologia Clínica',
  problemStatement: '',
  objectives: [],
  status: 'em_andamento',
  reminderPrefs: {
    enabled: false,
    chapterDaysBefore: [7, 1, 0],
    milestoneDaysBefore: [30, 14, 7, 1],
    time: '09:00',
    meetingEve: true,
    meetingMinutesBefore: [60],
  },
});

const capitulo = (): ThesisChapter => ({
  id: 'cap-1',
  thesisId: 'tcc-main',
  title: 'introdução',
  kind: 'capitulo',
  stage: 'a_fazer',
  position: 0,
  requiredness: 'obrigatorio',
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
});

/** A barra real, montada com a config que o motor calcula para a tela. */
const Barra = () => {
  const { contextBarConfig } = useMobileApp();
  return <ContextualBottomBar config={contextBarConfig} onBack={() => {}} />;
};

const Seed = ({ tab }: { tab: ThesisTab }) => {
  const { handleUpdateTcc, setThesisChapters, openTccScreen } = useMobileApp();
  useEffect(() => {
    handleUpdateTcc(tccBase());
    setThesisChapters([capitulo()]);
    openTccScreen(tab);
    // Semeia uma vez por montagem: o provider é real e o efeito roda uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const renderTcc = (tab: ThesisTab) =>
  render(
    <MobileAppProvider>
      <Seed tab={tab} />
      <TccView />
      <Barra />
    </MobileAppProvider>,
  );

afterEach(cleanup);

describe('barra contextual do TCC (SPEC-022 D1)', () => {
  it('aba de capítulos: a ação abre a folha de capítulo, não a edição do tcc', async () => {
    renderTcc('capitulos');

    const acao = await screen.findByTestId('contextual-bar-primary');
    expect(acao).toHaveTextContent('adicionar capítulo');

    fireEvent.click(acao);

    // A folha de capítulo abriu…
    await waitFor(() => {
      expect(document.getElementById('cap-titulo')).not.toBeNull();
    });
    // …e a edição completa do TCC (o wizard da ficha) **não** abriu: o campo
    // de título do trabalho é o do wizard.
    expect(document.querySelector('input[placeholder^="ex: a reestruturação"]')).toBeNull();
  });

  it('aba de visão geral: a barra mostra só "voltar" (o herói é o dono da primária)', async () => {
    renderTcc('visao');
    await waitFor(() => {
      expect(screen.getByTestId('contextual-bar-back')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('contextual-bar-primary')).toBeNull();
  });

  it('aba de orientação: a barra oferece as duas ações da aba', async () => {
    renderTcc('orientacao');
    const acao = await screen.findByTestId('contextual-bar-primary');
    expect(acao).toHaveTextContent('agendar reunião');

    // A segunda candidata só aparece quando a setinha expande (SPEC-022 D6).
    expect(screen.queryByTestId('contextual-bar-expanded')).toBeNull();
    fireEvent.click(screen.getByTestId('contextual-bar-expand'));
    const painel = await screen.findByTestId('contextual-bar-expanded');
    expect(painel).toHaveTextContent('adicionar pendência');
  });
});
