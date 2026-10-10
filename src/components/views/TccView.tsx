import React, { useMemo, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { CalendarClock, ListChecks, BookOpen, Users, PenLine, GripVertical, Plus, Copy, ExternalLink, Link2 } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { HeroCard } from '../ui/HeroCard';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { ProgressBar } from '../ui/ProgressBar';
import { CompletionToggle } from '../ui/CompletionToggle';
import { EmptyState } from '../ui/EmptyState';
import { StatusChip } from '../ui/StatusChip';
import { SectionTitle } from '../ui/SectionTitle';
import { TagChip } from '../ui/TagChip';
import { PillGroup } from '../ui/PillGroup';
import {
  dateKeyOrdinal,
  daysBetween,
  formatDateBR,
  formatDateShortBR,
  todayKeyLocal,
  weekStartKey,
} from '../../lib/dateBR';
import { computeStreak } from '../../lib/streak';
import { hapticSuccess, hapticTap } from '../../lib/haptics';
import { copyToClipboard, readFromClipboard } from '../../lib/utils';
import {
  abntDataFromReading,
  commitFlatOrder,
  formatAbnt,
  isChapterDone,
  nextThesisDeadline,
  orderChaptersForRender,
  thesisProgress,
  toPlainText,
  validateRef,
  weekWords,
  type ChapterStage,
  type RefStatus,
  type ThesisChapter,
  type ThesisReference,
} from '../../types';
import { ChapterSheet } from '../tcc/ChapterSheet';
import { WritingLogSheet } from '../tcc/WritingLogSheet';
import { TaskSheet } from '../tcc/TaskSheet';
import { MeetingSheet } from '../tcc/MeetingSheet';
import { ReferenceSheet } from '../tcc/ReferenceSheet';
import { CaptureLinkSheet } from '../capture/CaptureLinkSheet';
import type { ThesisTab } from '../../../packages/navigation/src/types';

type LeiturasFilter = 'todas' | 'candidatas' | 'lidas' | 'citadas';

const LEITURAS_FILTERS: { value: LeiturasFilter; label: string }[] = [
  { value: 'todas', label: 'todas' },
  { value: 'candidatas', label: 'candidatas' },
  { value: 'lidas', label: 'lidas' },
  { value: 'citadas', label: 'citadas' },
];

/** Filtro (plural, label de tela) → estado da referência (singular, domínio). */
const FILTER_TO_STATUS: Record<Exclude<LeiturasFilter, 'todas'>, RefStatus> = {
  candidatas: 'candidata',
  lidas: 'lida',
  citadas: 'citada',
};

const TYPE_LABEL: Record<string, string> = {
  livro: 'livro',
  artigo: 'artigo',
  capitulo: 'capítulo',
  pdf: 'pdf',
};

/** Ordem alfabética pt-BR (A→Z) pelo texto ABNT — mesma ordem do "copiar tudo". */
const byAbnt = (a: string, b: string): number =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

/**
 * Tela cheia do meu TCC (SPEC-012 F3): um `HeroCard` + 5 abas em
 * `UnderlineTabBar`.
 *
 * - **Um** hero por tela (SPEC-010 D1/D3): o conteúdo muda com o estado, a
 *   identidade (eyebrow, serifa, mascote, `rounded-[26px]`) é fixa.
 * - Aba mora no **`NavScreen`** (`{ kind: 'tcc'; tab?; focusId? }`), não em
 *   `useState` — deep-link de notificação (Q10) e voltar de sheet reabrem na
 *   aba certa (molde: `SPEC-009 D16`).
 * - `PillGroup` fica reservado a **filtro** (SPEC-010 D7) — entra na aba
 *   leituras na F7.
 */
const TABS: { id: ThesisTab; label: string; icon: React.ReactNode }[] = [
  { id: 'visao', label: 'visão geral', icon: <CalendarClock className="w-3.5 h-3.5" /> },
  { id: 'capitulos', label: 'capítulos', icon: <ListChecks className="w-3.5 h-3.5" /> },
  { id: 'leituras', label: 'leituras', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'orientacao', label: 'orientação', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'escrita', label: 'escrita', icon: <PenLine className="w-3.5 h-3.5" /> },
];

export const TccView: React.FC = () => {
  const {
    tcc,
    thesisChapters,
    thesisReferences,
    thesisMeetings,
    thesisTasks,
    thesisWritingLogs,
    readings,
    setThesisChapters,
    setThesisTasks,
    thesisTab,
    openTccScreen,
    openWizard,
    showToast,
  } = useMobileApp();

  const hasTcc = tcc.title.trim().length > 0;
  const tab = thesisTab ?? 'visao';

  const chaptersDone = thesisChapters.filter(isChapterDone).length;
  const chaptersTotal = thesisChapters.length;
  const progress = thesisProgress(thesisChapters);
  const statusLabel =
    tcc.status === 'concluido' ? 'concluído' : tcc.status === 'revisao' ? 'em revisão' : 'em andamento';

  const today = todayKeyLocal();
  const deadline = hasTcc
    ? nextThesisDeadline(tcc, thesisChapters, thesisTasks, thesisMeetings, today)
    : null;
  const daysToDeadline = deadline ? daysBetween(today, deadline.date) : 0;

  // ---- aba escrita (F5.1/F5.3): tudo derivado; o único dado é o log ----
  const weekStart = weekStartKey(today);
  const wordsThisWeek = weekWords(thesisWritingLogs, weekStart);
  const weeklyGoal = tcc.weeklyWordGoal;
  // Sequência de dias com escrita: reaproveita o mesmo `computeStreak` do
  // `streakData` (dias úteis), sem criar streak nova nem persistir nada.
  const writingStreak = computeStreak(
    thesisWritingLogs.map((l) => l.date),
    today,
  ).current;
  const recentWriting = useMemo(
    () =>
      [...thesisWritingLogs].sort((a, b) =>
        a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
      ),
    [thesisWritingLogs],
  );

  // ---- aba capítulos (F4.1/F4.2): ordem de render, arrastar e sheet ----
  const ordered = useMemo(() => orderChaptersForRender(thesisChapters), [thesisChapters]);
  const [dragOrder, setDragOrder] = useState<ThesisChapter[] | null>(null);
  const [editingChapter, setEditingChapter] = useState<string | 'new' | null>(null);
  const [writingOpen, setWritingOpen] = useState(false);
  // ---- aba orientação (F6): pendências e reuniões ----
  const [taskSheet, setTaskSheet] = useState<string | 'new' | null>(null);
  const [meetingSheet, setMeetingSheet] = useState<
    { id: string | 'new'; intent: 'agendar' | 'registrar' } | null
  >(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  // ---- aba leituras (F7.2): filtro (SPEC-010 D7) e sheet da referência ----
  const [leiturasFilter, setLeiturasFilter] = useState<LeiturasFilter>('todas');
  const [referenceSheet, setReferenceSheet] = useState<string | 'new' | null>(null);
  // ---- captura de link (F8.3): camada 1 dentro do TCC ----
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const dragControls = useDragControls();

  /** Camada 1 da captura (§8.3): lê o clipboard e abre a mesma sheet. */
  const openCapture = async () => {
    const text = await readFromClipboard();
    setCaptureText(text ?? '');
    setCaptureOpen(true);
  };

  const commitDrag = () => {
    const rendered = dragOrder;
    setDragOrder(null);
    if (!rendered) return;
    const committed = commitFlatOrder(thesisChapters, rendered);
    if (committed === thesisChapters) return; // soltou onde estava: não escreve
    setThesisChapters(committed);
    hapticTap();
    const moved = rendered.find(
      (ch, i) => ordered[i]?.id !== ch.id,
    );
    if (moved) {
      const siblings = committed.filter((c) => (c.parentId ?? undefined) === (moved.parentId ?? undefined));
      const pos = siblings.findIndex((c) => c.id === moved.id) + 1;
      setAnnounceText(`capítulo ${moved.title} movido para a posição ${pos} de ${siblings.length}`);
    }
  };

  const stageLabel = (stage: ChapterStage): string =>
    stage === 'a_fazer' ? 'a fazer' : stage === 'em_revisao' ? 'em revisão' : stage;
  const stageTone = (stage: ChapterStage): 'success' | 'warning' | 'muted' =>
    stage === 'pronto' ? 'success' : stage === 'em_revisao' ? 'warning' : 'muted';

  // ---- hero (F3.2): o número no título, o prazo no resumo, a ação primária
  // só aqui. O título do trabalho desce para o primeiro card da visão geral.
  const heroTitle = !hasTcc
    ? 'meu tcc'
    : chaptersTotal > 0
      ? `${chaptersDone} de ${chaptersTotal} capítulos`
      : 'meu tcc';
  const heroSummary = !hasTcc
    ? 'um título, uma pergunta e o caminho vai se desenhando'
    : deadline == null
      ? 'sem data de entrega ainda'
      : deadline.overdue
        ? 'passou do prazo, bora reorganizar?'
        : deadline.kind === 'milestone' && deadline.entityId === 'delivery'
          ? `entrega em ${daysToDeadline} dias`
          : `próximo: ${formatDateShortBR(deadline.date)} · em ${daysToDeadline} dias`;

  const handleToggleChapter = (id: string) => {
    // Imutável de verdade (SPEC-012 F0.1): o capítulo alternado é um objeto
    // novo — `stableKey` do sync é `JSON.stringify` (`packages/sync/src/stamp.ts:83-89`),
    // e objeto anterior e novo serializando igual significavam stamp sem bump.
    const prev = thesisChapters;
    const target = prev.find((ch) => ch.id === id);
    if (!target) return;
    const next: ThesisChapter[] = prev.map((ch) =>
      ch.id === id
        ? { ...ch, stage: (ch.stage === 'pronto' ? 'escrevendo' : 'pronto') as ChapterStage }
        : ch,
    );
    setThesisChapters(next);
    hapticTap();
    if (target.stage !== 'pronto') {
      // Desfazer devolve o snapshot inteiro (F4.1): o toast de 8s é a janela
      // de reversão — botão não some antes (`Toast.tsx:46-48`).
      showToast('capítulo guardado ♡', {
        action: { label: 'desfazer', onClick: () => setThesisChapters(prev) },
      });
    }
  };

  // ---- abas ----

  // Cartão "esta semana" (F5.1/F5.3): palavras vs. meta semanal, sequência de
  // escrita e o atalho para definir metas quando não há nenhuma. Nenhum valor de
  // meta é pré-preenchido (Q8) — sem meta, o texto é o convite.
  //
  // Bater a meta é a única coisa boa que acontece no TCC — e a tela mostrava
  // "1000/500" como se fosse um número neutro. Agora ela celebra: selo
  // "meta batida ♡" e cartão em tom de sucesso.
  const metaBatida = weeklyGoal != null && wordsThisWeek >= weeklyGoal;

  const renderWeekCard = () => (
    <div
      className={`rounded-2xl p-4 border shadow-sm space-y-2 ${
        metaBatida
          ? 'bg-status-success-surface border-status-success-border'
          : 'bg-surface-default border-ceci-border-default'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-ceci-secondary">esta semana</p>
        {metaBatida ? (
          <span className="text-[11px] font-bold text-status-success-strong">meta batida ♡</span>
        ) : weeklyGoal != null ? (
          <p className="text-xs font-bold text-ceci-primary">
            {wordsThisWeek}/{weeklyGoal}
          </p>
        ) : null}
      </div>
      {weeklyGoal != null ? (
        <>
          <ProgressBar
            value={Math.min(100, Math.round((wordsThisWeek / weeklyGoal) * 100))}
            valueText={`${wordsThisWeek} de ${weeklyGoal} palavras esta semana`}
          />
          {metaBatida && wordsThisWeek > weeklyGoal && (
            <p className="text-[11px] text-status-success-strong font-medium">
              {wordsThisWeek - weeklyGoal} palavras acima da meta — bem acima do combinado ♡
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-ceci-secondary leading-relaxed">
          metas são opcionais — defina quando quiser
        </p>
      )}
      {writingStreak > 0 && (
        <p className="text-[11px] font-medium text-ceci-brand-strong">
          {writingStreak === 1
            ? '1 dia seguido escrevendo ♡'
            : `${writingStreak} dias seguidos escrevendo ♡`}
        </p>
      )}
      {weeklyGoal == null && (
        <button
          type="button"
          onClick={() => openWizard('tcc')}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold text-ceci-brand-strong border border-ceci-border-brand bg-surface-rose cursor-pointer tap-interactive"
        >
          definir metas
        </button>
      )}
    </div>
  );

  const renderVisao = () => (
    <div className="space-y-3">
      {/* O título do trabalho mora aqui, não no hero (F3.2): `HeroCard` dá ao
          resumo `max-w-[92%]` contra um mascote de 64px, e serifa de 30px em
          título de 60+ caracteres gastaria a identidade no lugar errado. */}
      <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-2">
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand">
          tcc • {statusLabel}
        </span>
        <h2 className="font-display font-bold text-base text-ceci-primary leading-snug line-clamp-2">
          {tcc.title}
        </h2>
        <p className="text-xs text-ceci-secondary">
          orientadora: <span className="font-semibold text-ceci-primary">{tcc.advisor || '—'}</span>
          {tcc.field && <> • área: {tcc.field}</>}
        </p>
      </div>

      {/* próximo prazo (F3.9 — conteúdo real da visão geral). É o card que pede
          ação: quando o prazo aperta (atrasado ou em até 7 dias), ele ganha o
          tom de alerta para competir com os outros quatro cards cinzas — o olho
          precisa parar nele primeiro. */}
      {deadline && (
        <div
          className={`rounded-2xl p-4 border shadow-sm flex items-center justify-between gap-3 ${
            deadline.overdue
              ? 'bg-status-danger-surface border-status-danger-border'
              : daysToDeadline <= 7
                ? 'bg-status-warning-surface border-status-warning-border'
                : 'bg-surface-default border-ceci-border-default'
          }`}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-ceci-secondary">próximo prazo</p>
            <p className="text-sm font-bold font-display text-ceci-primary truncate">{deadline.title}</p>
            <p className="text-xs text-ceci-secondary">{formatDateBR(deadline.date)}</p>
          </div>
          {deadline.overdue ? (
            <StatusChip tone="warning" label="atrasado" />
          ) : (
            <StatusChip tone="info" label={daysToDeadline === 0 ? 'hoje' : `em ${daysToDeadline} dias`} />
          )}
        </div>
      )}

      {/* progresso */}
      <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-ceci-secondary">progresso dos capítulos</p>
          <p className="text-xs font-bold text-ceci-primary">
            {chaptersDone}/{chaptersTotal}
          </p>
        </div>
        <ProgressBar
          value={progress}
          valueText={`${chaptersDone} de ${chaptersTotal} capítulos prontos`}
        />
      </div>

      {/* esta semana (F4.9 remanescente, entregue na F5): o ritmo de escrita */}
      {renderWeekCard()}

      {/* problema e objetivos (o conteúdo que já existia) */}
      {(tcc.problemStatement || tcc.objectives.length > 0) && (
        <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
          {tcc.problemStatement && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1">
                problema de pesquisa
              </p>
              <p className="text-sm text-ceci-primary leading-relaxed">{tcc.problemStatement}</p>
            </div>
          )}
          {tcc.objectives.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary mb-2">
                objetivos
              </p>
              {/* Numeração em pastilha, não bullet do navegador: é o mesmo
                  tratamento que o objetivo ganha no wizard, e a lista deixa de
                  parecer texto colado. */}
              <ul className="space-y-1.5">
                {tcc.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 shrink-0 mt-0.5 rounded-full bg-surface-rose border border-ceci-border-brand text-[10px] font-bold text-ceci-brand-strong flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-ceci-secondary leading-snug">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCapitulos = () => {
    if (thesisChapters.length === 0) {
      // Registro livre (Q7): a lista nasce vazia e NADA semeia capítulo —
      // sem modelo pronto, sem estrutura padrão. A usuária monta a dela.
      return (
        <EmptyState
          description="a lista nasce vazia: monte os capítulos do jeito que fizer sentido pro seu trabalho ♡"
          actionLabel="adicionar o primeiro capítulo"
          onAction={() => setEditingChapter('new')}
          mascote="writing-flow"
        />
      );
    }

    return (
      <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default shadow-sm space-y-2">
        <Reorder.Group
          axis="y"
          values={dragOrder ?? ordered}
          onReorder={setDragOrder}
          className="space-y-2 list-none"
        >
          {(dragOrder ?? ordered).map((ch) => {
            const done = isChapterDone(ch);
            return (
              <Reorder.Item
                key={ch.id}
                value={ch}
                dragListener={false}
                dragControls={dragControls}
                onDragEnd={commitDrag}
                className="list-none"
              >
                <div
                  onClick={() => setEditingChapter(ch.id)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer tap-interactive ${
                    done
                      ? 'bg-surface-blue/60 border-ceci-border-academic'
                      : 'bg-surface-default border-ceci-border-default hover:border-ceci-border-brand'
                  }`}
                >
                  <CompletionToggle
                    checked={done}
                    onChange={() => handleToggleChapter(ch.id)}
                    label={`capítulo ${ch.title}`}
                    className="!min-h-[44px] !w-11 !h-11 -ml-2"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${done ? 'line-through text-ceci-tertiary' : 'text-ceci-primary'}`}>
                      {ch.title}
                    </p>
                    {ch.dueDate && (
                      <p className="text-[10px] text-ceci-secondary mt-0.5">
                        prazo: {formatDateBR(ch.dueDate)}
                      </p>
                    )}
                  </div>
                  <StatusChip tone={stageTone(ch.stage)} label={stageLabel(ch.stage)} className="!min-h-[28px] !text-[10px] shrink-0" />
                  {/* Alça do arrastar (Q6): é `button` com `data-no-swipe` —
                      o edge-swipe do iOS já ignora `button` (`swipe.ts:18-19`)
                      e o `dragListener={false}` deixa o scroll livre; o drag
                      só pega pelo `dragControls.start` da alça. */}
                  <button
                    type="button"
                    data-no-swipe
                    aria-label={`arrastar capítulo ${ch.title}`}
                    onPointerDown={(e) => dragControls.start(e)}
                    className="shrink-0 w-9 min-h-[44px] flex items-center justify-center text-ceci-tertiary hover:text-ceci-primary touch-none cursor-grab active:cursor-grabbing rounded-xl"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        <button
          type="button"
          onClick={() => setEditingChapter('new')}
          className="w-full flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-semibold text-ceci-brand-strong border border-dashed border-ceci-border-brand bg-surface-rose/50 hover:bg-surface-rose rounded-xl cursor-pointer transition-colors active:scale-[0.99]"
        >
          <Plus className="w-3.5 h-3.5" /> adicionar capítulo
        </button>
        {/* Anúncio de reordenação (a11y, F4.2): quem não arrasta precisa ouvir
            que a lista mudou e para onde. */}
        <div role="status" aria-live="polite" className="sr-only">
          {announceText}
        </div>
      </div>
    );
  };

  const renderLeituras = () => {
    // F7: o dado mora na estante (`readings`, ADR-010); a citação é **derivada**
    // por `abntDataFromReading` + `formatAbnt`. `rawCitation` (à mão) vence.
    const rows = thesisReferences
      .map((ref) => {
        const reading = readings.find((r) => r.id === ref.readingId);
        if (!reading) return null;
        const data = abntDataFromReading(reading);
        return { ref, reading, data, citation: toPlainText(formatAbnt(data)) };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const visiveis = rows.filter((r) => r.ref.status !== 'descartada');
    const selected =
      leiturasFilter === 'todas'
        ? visiveis
        : visiveis.filter((r) => r.ref.status === FILTER_TO_STATUS[leiturasFilter]);
    const filtradas = [...selected].sort((a, b) => byAbnt(a.citation, b.citation));
    const descartadas = rows.length - visiveis.length;

    const copyAll = async () => {
      const text = [...visiveis]
        .sort((a, b) => byAbnt(a.citation, b.citation))
        .map((r) => r.citation)
        .filter(Boolean)
        .join('\n\n');
      if (!text) {
        hapticSuccess();
        showToast('ainda não tem referência pra copiar ♡');
        return;
      }
      const ok = await copyToClipboard(text);
      if (ok) {
        hapticSuccess();
        showToast('lista copiada ♡');
      }
    };

    if (thesisReferences.length === 0) {
      return (
        <div className="space-y-3">
          <EmptyState
            description="artigos e livros que você guardar e citar no tcc aparecem aqui, já no formato abnt ♡"
            actionLabel="nova referência"
            onAction={() => setReferenceSheet('new')}
            mascote="reading-curious"
          />
          <button
            type="button"
            onClick={() => void openCapture()}
            aria-label="guardar link"
            className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full bg-surface-default border border-ceci-border-default text-ceci-secondary text-xs font-semibold cursor-pointer active:scale-[0.98] transition-transform"
          >
            <Link2 className="w-4 h-4" /> guardar link
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
          <SectionTitle
            icon={<BookOpen className="w-3.5 h-3.5" />}
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openCapture()}
                  aria-label="guardar link"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] text-ceci-secondary hover:bg-surface-muted hover:text-ceci-primary transition-colors min-h-[44px] cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" /> guardar link
                </button>
                <button
                  type="button"
                  onClick={() => void copyAll()}
                  aria-label="copiar a lista de referências"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] text-ceci-secondary hover:bg-surface-muted hover:text-ceci-primary transition-colors min-h-[44px] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> copiar tudo
                </button>
                <button
                  type="button"
                  onClick={() => setReferenceSheet('new')}
                  aria-label="nova referência"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong text-[11px] font-semibold transition-transform active:scale-95 min-h-[44px] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> adicionar
                </button>
              </div>
            }
          >
            referências (abnt)
          </SectionTitle>

          <PillGroup<LeiturasFilter>
            variant="rose"
            size="sm"
            value={leiturasFilter}
            onChange={setLeiturasFilter}
            options={LEITURAS_FILTERS}
            label="mostrar"
          />

          {filtradas.length === 0 ? (
            <div className="bg-surface-muted rounded-xl p-5 text-center border border-ceci-border-subtle space-y-2">
              <p className="text-xs text-ceci-secondary leading-relaxed">
                nenhuma {leiturasFilter === 'todas' ? 'referência' : leiturasFilter} por aqui ainda.
              </p>
              {leiturasFilter !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setLeiturasFilter('todas')}
                  className="text-[11px] font-semibold text-ceci-brand-strong hover:underline underline-offset-2 cursor-pointer"
                >
                  ver todas
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtradas.map(({ ref, reading, data, citation }) => {
                const first = data.authors[0];
                const headline = first
                  ? `${first.family.toUpperCase()}, ${first.given ? `${first.given[0]}.` : ''}`
                  : citation
                    .split(/[.;]/)[0]
                    .trim()
                    .slice(0, 42) || 'sem autor';
                const missing = data.rawCitation
                  ? []
                  : validateRef(data).slice(0, 3).map((m) => m.label);
                return (
                  <li key={ref.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setReferenceSheet(ref.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setReferenceSheet(ref.id);
                        }
                      }}
                      aria-label={`referência: ${citation}`}
                      className="bg-surface-muted rounded-xl p-3 border border-ceci-border-default hover:border-ceci-border-brand shadow-xs transition-colors cursor-pointer tap-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-display font-bold text-[13px] text-ceci-primary truncate">
                            {headline}
                          </span>
                          {reading.year && (
                            <span className="text-[11px] text-ceci-secondary shrink-0">{reading.year}</span>
                          )}
                          <TagChip size="sm" variant="neutral" className="shrink-0">
                            {TYPE_LABEL[reading.type] ?? reading.type}
                          </TagChip>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {reading.url && (
                            <span aria-label="com link" className="text-ceci-secondary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void copyToClipboard(citation).then((ok) => {
                                if (ok) {
                                  hapticSuccess();
                                  showToast('referência copiada ♡');
                                }
                              });
                            }}
                            aria-label="copiar esta referência"
                            className="flex items-center text-ceci-secondary hover:text-ceci-brand-strong transition-colors p-1.5 -m-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <StatusChip
                            tone={
                              ref.status === 'citada'
                                ? 'success'
                                : ref.status === 'lida'
                                  ? 'info'
                                  : ref.status === 'descartada'
                                    ? 'muted'
                                    : 'warning'
                            }
                            label={ref.status}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-ceci-primary mt-1 line-clamp-2">{citation}</p>
                      {missing.length > 0 ? (
                        <p role="status" className="text-[11px] text-status-warning-strong mt-1">
                          falta: {missing.join(' · ')}
                        </p>
                      ) : (
                        reading.status === 'lendo' && (
                          <p className="text-[11px] text-ceci-tertiary mt-1">você ainda está lendo esta obra</p>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {descartadas > 0 && (
            <p className="text-[11px] text-ceci-tertiary">{descartadas} descartada{descartadas === 1 ? '' : 's'} fora da lista — abra a referência para revisitar.</p>
          )}
        </div>
      </div>
    );
  };

  // F6 (orientação): pendências e reuniões. Tudo **derivado** do que está nas
  // coleções — reunião `agendada` já entra no calendário e no plano de
  // lembretes pela F4.5/F4.6, sem escrever prazo duplicado aqui.
  const taskOverdue = (dueDate: string | undefined): boolean =>
    dueDate != null && dateKeyOrdinal(dueDate) < dateKeyOrdinal(today);
  const openTasks = thesisTasks
    .filter((t) => t.status !== 'resolvida' && t.status !== 'arquivada')
    .sort((a, b) => {
      const ao = taskOverdue(a.dueDate);
      const bo = taskOverdue(b.dueDate);
      if (ao !== bo) return ao ? -1 : 1; // vencidas no topo
      const ad = a.dueDate ? dateKeyOrdinal(a.dueDate) : Infinity;
      const bd = b.dueDate ? dateKeyOrdinal(b.dueDate) : Infinity;
      if (ad !== bd) return ad - bd;
      return a.createdAt.localeCompare(b.createdAt);
    });
  const closedTasks = thesisTasks.filter(
    (t) => t.status === 'resolvida' || t.status === 'arquivada',
  );
  const meetingsSorted = (status: 'agendada' | 'realizada' | 'cancelada') => {
    const list = thesisMeetings.filter((m) => m.status === status);
    if (status === 'agendada') {
      return list.sort((a, b) =>
        a.date === b.date
          ? (a.time ?? '99:99').localeCompare(b.time ?? '99:99')
          : a.date.localeCompare(b.date),
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date)); // mais recente primeiro
  };
  const agendadas = meetingsSorted('agendada');
  const realizadas = meetingsSorted('realizada');
  const canceladas = meetingsSorted('cancelada');

  const handleToggleTask = (id: string) => {
    setThesisTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'resolvida' ? ('aberta' as const) : ('resolvida' as const),
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    hapticTap();
  };

  const openRegistrar = () => {
    const nearest = agendadas[0];
    setMeetingSheet(
      nearest ? { id: nearest.id, intent: 'registrar' } : { id: 'new', intent: 'registrar' },
    );
  };

  const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const meetingDayTile = (date: string, tone: 'brand' | 'muted') => {
    const day = date.slice(8, 10);
    const month = MESES_CURTOS[Number(date.slice(5, 7)) - 1] ?? '';
    return (
      <span
        className={`shrink-0 w-11 h-11 rounded-2xl border flex flex-col items-center justify-center ${
          tone === 'brand'
            ? 'bg-surface-rose border-ceci-border-brand'
            : 'bg-surface-muted border-ceci-border-subtle'
        }`}
        aria-hidden
      >
        <span
          className={`text-sm font-bold leading-none ${
            tone === 'brand' ? 'text-ceci-brand-strong' : 'text-ceci-secondary'
          }`}
        >
          {day}
        </span>
        <span
          className={`text-[9px] uppercase tracking-wide ${
            tone === 'brand' ? 'text-ceci-brand-strong' : 'text-ceci-tertiary'
          }`}
        >
          {month}
        </span>
      </span>
    );
  };

  const renderTaskRow = (t: (typeof thesisTasks)[number]) => {
    const done = t.status === 'resolvida';
    const overdue = !done && taskOverdue(t.dueDate);
    const chapter = t.chapterId
      ? thesisChapters.find((c) => c.id === t.chapterId)
      : undefined;
    return (
      <div
        key={t.id}
        className={`flex items-center gap-1.5 p-2.5 pr-3 rounded-2xl border card-lift press-card ${
          done
            ? 'bg-surface-muted border-ceci-border-subtle'
            : 'bg-surface-default border-ceci-border-default hover:border-ceci-border-brand'
        }`}
      >
        <CompletionToggle
          checked={done}
          onChange={() => handleToggleTask(t.id)}
          label={`pendência ${t.title}`}
          className="!min-h-[44px] !w-11 !h-11 -ml-1"
        />
        <button
          type="button"
          onClick={() => setTaskSheet(t.id)}
          className="min-w-0 flex-1 text-left cursor-pointer tap-interactive rounded-xl"
        >
          <p
            className={`text-xs font-medium truncate ${
              done ? 'line-through text-ceci-tertiary' : 'text-ceci-primary'
            }`}
          >
            {t.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <TagChip size="sm" variant={t.origin === 'orientadora' ? 'rose' : 'neutral'}>
              {t.origin === 'orientadora' ? 'orientadora' : 'minha'}
            </TagChip>
            {chapter && (
              <span className="text-[10px] text-ceci-secondary truncate max-w-[9rem]">
                {chapter.title}
              </span>
            )}
            {t.dueDate && (
              <span
                className={`text-[10px] ${
                  overdue ? 'text-status-warning-strong font-semibold' : 'text-ceci-secondary'
                }`}
              >
                {formatDateBR(t.dueDate)}
              </span>
            )}
            {t.status === 'em_andamento' && !done && (
              <span className="text-[10px] text-ceci-academic-strong font-semibold">
                em andamento
              </span>
            )}
          </div>
        </button>
        {overdue && (
          <StatusChip tone="warning" label="vencida" className="!min-h-[26px] !text-[10px] shrink-0" />
        )}
      </div>
    );
  };

  const softActionClass =
    'min-h-[44px] px-3 rounded-2xl text-[11px] font-semibold border border-ceci-border-default bg-surface-default text-ceci-primary hover:border-ceci-border-brand hover:bg-surface-muted cursor-pointer tap-interactive press-card';

  const renderOrientacao = () => {
    // Sem nada ainda, o vazio convida (o app sempre abre uma porta, não só informa).
    if (thesisTasks.length === 0 && thesisMeetings.length === 0) {
      return (
        <EmptyState
          mascote="research-tcc"
          description="as conversas com a orientação e o que fica pendente vivem aqui — e cada decisão da reunião pode virar uma pendência sua ♡"
          actionLabel="agendar reunião"
          onAction={() => setMeetingSheet({ id: 'new', intent: 'agendar' })}
          secondaryActionLabel="adicionar pendência"
          onSecondaryAction={() => setTaskSheet('new')}
        />
      );
    }

    return (
      <div className="space-y-5">
        {/* pendências (F6.1): abertas primeiro, vencidas no topo */}
        <section className="space-y-2">
          <SectionTitle
            icon={<ListChecks className="w-4 h-4 text-ceci-brand-strong" />}
            action={
              <button
                type="button"
                onClick={() => setTaskSheet('new')}
                className="flex items-center gap-1 text-[11px] font-semibold text-ceci-brand-strong hover:text-ceci-brand px-2 py-1.5 rounded-full cursor-pointer tap-interactive"
              >
                <Plus className="w-3.5 h-3.5" /> adicionar
              </button>
            }
          >
            pendências
          </SectionTitle>
          {openTasks.length === 0 && closedTasks.length === 0 ? (
            <p className="text-xs text-ceci-secondary leading-relaxed bg-surface-muted rounded-2xl p-3 border border-ceci-border-subtle">
              nada pendente por aqui ♡ o que a orientadora pedir e o que você
              quiser lembrar cabe nesta lista.
            </p>
          ) : (
            <div className="space-y-2">
              {openTasks.map(renderTaskRow)}
              {closedTasks.map(renderTaskRow)}
            </div>
          )}
        </section>

        {/* reuniões (F6.2) */}
        <section className="space-y-2">
          <SectionTitle icon={<Users className="w-4 h-4 text-ceci-brand-strong" />}>
            reuniões
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMeetingSheet({ id: 'new', intent: 'agendar' })}
              className={softActionClass}
            >
              agendar reunião
            </button>
            <button
              type="button"
              onClick={openRegistrar}
              aria-label="registrar o que foi conversado"
              className={softActionClass}
            >
              registrar conversa
            </button>
          </div>

          {agendadas.length === 0 && realizadas.length === 0 && canceladas.length === 0 ? (
            <p className="text-xs text-ceci-secondary leading-relaxed bg-surface-muted rounded-2xl p-3 border border-ceci-border-subtle">
              agende a próxima conversa com a orientação ou registre o que já
              aconteceu — as decisões podem virar pendências.
            </p>
          ) : (
            <div className="space-y-2">
              {agendadas.map((m) => {
                const overdue = taskOverdue(m.date);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMeetingSheet({ id: m.id, intent: 'agendar' })}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-ceci-border-default bg-surface-default hover:border-ceci-border-brand text-left cursor-pointer card-lift press-card tap-interactive"
                  >
                    {meetingDayTile(m.date, overdue ? 'muted' : 'brand')}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ceci-primary truncate">
                        reunião com {tcc.advisor || 'a orientação'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-ceci-secondary">
                          {formatDateBR(m.date)}
                        </span>
                        {m.time && (
                          <span className="text-[10px] text-ceci-secondary">· {m.time}</span>
                        )}
                        <TagChip size="sm" variant="neutral">{m.mode}</TagChip>
                      </div>
                    </div>
                    <StatusChip
                      tone={overdue ? 'warning' : 'info'}
                      label={overdue ? 'passou' : 'agendada'}
                      className="!min-h-[26px] !text-[10px] shrink-0"
                    />
                  </button>
                );
              })}

              {realizadas.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMeetingSheet({ id: m.id, intent: 'registrar' })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-ceci-border-default bg-surface-default hover:border-ceci-border-brand text-left cursor-pointer card-lift press-card tap-interactive"
                >
                  {meetingDayTile(m.date, 'muted')}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ceci-primary truncate">
                      {m.summary || 'reunião realizada'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-ceci-secondary">
                        {formatDateBR(m.date)}
                      </span>
                      {m.decisions.length > 0 && (
                        <span className="text-[10px] text-ceci-secondary">
                          · {m.decisions.length}{' '}
                          {m.decisions.length === 1 ? 'decisão' : 'decisões'}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusChip tone="success" label="realizada" className="!min-h-[26px] !text-[10px] shrink-0" />
                </button>
              ))}

              {canceladas.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelled((v) => !v)}
                    className="text-[11px] text-ceci-secondary hover:text-ceci-primary cursor-pointer"
                  >
                    {showCancelled ? 'esconder' : 'mostrar'} canceladas ({canceladas.length})
                  </button>
                  {showCancelled && (
                    <div className="mt-2 space-y-2">
                      {canceladas.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMeetingSheet({ id: m.id, intent: 'agendar' })}
                          className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-ceci-border-subtle bg-surface-muted text-left cursor-pointer tap-interactive"
                        >
                          {meetingDayTile(m.date, 'muted')}
                          <p className="min-w-0 flex-1 text-xs text-ceci-tertiary line-through truncate">
                            reunião de {formatDateBR(m.date)}
                            {m.time ? ` · ${m.time}` : ''}
                          </p>
                          <StatusChip tone="muted" label="cancelada" className="!min-h-[26px] !text-[10px] shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    );
  };

  // Aba escrita (F5.1/F5.2/F5.3): o cartão da semana, a sequência de escrita e
  // as sessões recentes. Sem sessão ainda, o vazio convida a registrar.
  const renderEscrita = () => (
    <div className="space-y-3">
      {renderWeekCard()}
      {thesisWritingLogs.length === 0 ? (
        <EmptyState
          description="registre suas sessões de escrita e acompanhe o ritmo até a entrega ♡"
          actionLabel="registrar escrita"
          onAction={() => setWritingOpen(true)}
          mascote="writing-flow"
        />
      ) : (
        <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display font-bold text-base text-ceci-primary">sessões recentes</h3>
            <span className="text-[11px] text-ceci-tertiary">
              {recentWriting.length === 1 ? '1 registrada' : `${recentWriting.length} registradas`}
            </span>
          </div>
          <div className="space-y-2">
            {recentWriting.slice(0, 5).map((log) => {
              const chapter = log.chapterId
                ? thesisChapters.find((c) => c.id === log.chapterId)
                : undefined;
              // A data relativa ("hoje", "ontem") responde a pergunta que a
              // pessoa faz ao abrir a tela; a data por extenso fica para o
              // registro antigo, onde a distância já não importa.
              const days = daysBetween(log.date, today);
              const quando =
                days === 0 ? 'hoje' : days === 1 ? 'ontem' : formatDateBR(log.date);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 bg-surface-muted rounded-xl p-3 border border-ceci-border-default"
                >
                  <span className="shrink-0 flex flex-col items-center justify-center w-12 min-h-[44px] rounded-lg bg-surface-default border border-ceci-border-subtle">
                    <span className="font-display font-bold text-sm leading-none text-ceci-primary">
                      {log.words}
                    </span>
                    <span className="text-[9px] text-ceci-tertiary leading-none mt-0.5">palavras</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-ceci-secondary">
                      {quando}
                      {log.minutes != null && ` · ${log.minutes} min`}
                      {chapter ? ` · ${chapter.title}` : ''}
                    </p>
                    {log.note ? (
                      <p className="text-xs text-ceci-primary leading-snug mt-0.5 line-clamp-2">
                        {log.note}
                      </p>
                    ) : (
                      <p className="text-[11px] text-ceci-faded mt-0.5">sem anotação</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const tabContent =
    tab === 'capitulos'
      ? renderCapitulos()
      : tab === 'leituras'
        ? renderLeituras()
        : tab === 'orientacao'
          ? renderOrientacao()
          : tab === 'escrita'
            ? renderEscrita()
            : renderVisao();

  return (
    <div className="space-y-4 pb-1">
      <HeroCard
        eyebrow="tcc"
        title={heroTitle}
        summary={heroSummary}
        expression="research-tcc"
        action={
          hasTcc
            ? {
                label: 'registrar escrita',
                onClick: () => setWritingOpen(true),
                ariaLabel: 'registrar escrita',
              }
            : { label: 'bora começar?', onClick: () => openWizard('tcc'), ariaLabel: 'criar tcc' }
        }
      />

      {!hasTcc ? (
        <EmptyState
          mascote="research-tcc"
          description="comece pelo que dá identidade ao trabalho: um título, quem orienta e a pergunta que ele quer responder. o resto você preenche no caminho ♡"
          actionLabel="começar meu tcc"
          onAction={() => openWizard('tcc')}
        />
      ) : (
        <>
          <UnderlineTabBar
            tabs={TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
            active={tab}
            onChange={(next) => openTccScreen(next)}
          />
          {tabContent}
        </>
      )}

      {/* Sheet do capítulo (D5): uma entidade, uma escrita por ação. */}
      <ChapterSheet
        open={editingChapter !== null}
        chapterId={editingChapter ?? 'new'}
        onClose={() => setEditingChapter(null)}
      />

      {/* Sheet "registrar escrita" (F5.2): ação primária do hero e da aba. */}
      <WritingLogSheet open={writingOpen} onClose={() => setWritingOpen(false)} />

      {/* Sheet da pendência (F6.1): uma entidade, uma escrita por ação. */}
      <TaskSheet
        open={taskSheet !== null}
        taskId={taskSheet ?? 'new'}
        onClose={() => setTaskSheet(null)}
      />

      {/* Sheet da reunião (F6.2/F6.4): agendar ou registrar o que foi conversado. */}
      <MeetingSheet
        open={meetingSheet !== null}
        meetingId={meetingSheet?.id ?? 'new'}
        intent={meetingSheet?.intent ?? 'agendar'}
        onClose={() => setMeetingSheet(null)}
      />

      {/* Sheet da referência (F7.3/ADR-010): a obra mora na estante; aqui se
          cita (status, capítulos, nota) e se completa o dado bibliográfico. */}
      <ReferenceSheet
        open={referenceSheet !== null}
        referenceId={referenceSheet}
        onClose={() => setReferenceSheet(null)}
      />

      {/* Captura de link (F8.2/F8.3): mesma sheet do hub de leitura. */}
      {captureOpen && (
        <CaptureLinkSheet
          open
          initialText={captureText}
          onClose={() => setCaptureOpen(false)}
        />
      )}
    </div>
  );
};
