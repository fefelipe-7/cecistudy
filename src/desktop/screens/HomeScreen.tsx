import React, { useMemo } from 'react';
import { useDesktopApp } from '@/context/desktopApp';
import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  CalendarDays,
  FolderKanban,
  BookOpen,
  Megaphone,
  CheckCircle2,
  Flame,
  Sparkles,
} from 'lucide-react';
import { Panel } from '../components/ui/Panel';

type RecentItemKind = 'aula' | 'nota';

/** Card de item recente — memoizado e definido fora do render (skill: sem subcomponente inline). */
const RecentItemCard = React.memo(function RecentItemCard({
  title,
  subtitle,
  kind,
}: {
  title: string;
  subtitle: string;
  kind: RecentItemKind;
}) {
  const Icon = kind === 'aula' ? BookOpen : Sparkles;
  return (
    <div
      className="flex items-center gap-3 rounded-[16px] border bg-surface-default p-3"
      style={{ borderColor: 'var(--ds-border-subtle)' }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
        style={{ background: 'var(--ds-surface-inspector)' }}
      >
        <Icon className="h-4 w-4 text-ceci-secondary" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ceci-primary">{title}</span>
        <span className="block truncate text-xs text-ceci-secondary">{subtitle}</span>
      </span>
    </div>
  );
});

/**
 * Home desktop (primeira tela do dia, baixa densidade) — onde o calor do mobile
 * entra com mais evidência no desktop (JSON: homeScreen). Reusa os mesmos dados
 * do AppContext; não duplica estado. Distinta da HomeView mobile.
 */
export const HomeScreen: React.FC = () => {
  const app = useDesktopApp();
  const { profile, tasks, exams, courses, streakStats, tcc } = app;

  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const upcomingExams = exams.filter((e) => !e.completed).length;
  const streak = streakStats.current;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'bom dia';
    if (h < 18) return 'boa tarde';
    return 'boa noite';
  })();

  // recentItems — derivado em render (useMemo), num único passo, ordenado sem mutar
  // o estado. Combina aulas anotadas e notas avulsas pela data mais recente.
  const recentItems = useMemo(() => {
    const courseName = new Map(app.courses.map((c) => [c.id, c.name]));
    const items: Array<{ id: string; title: string; subtitle: string; kind: RecentItemKind; ts: number }> = [];
    for (const c of app.classes) {
      items.push({
        id: `cl-${c.id}`,
        title: c.title,
        subtitle: courseName.get(c.courseId) ?? 'aula anotada',
        kind: 'aula',
        ts: Date.parse(c.date) || 0,
      });
    }
    for (const n of app.looseNotes) {
      items.push({
        id: `ln-${n.id}`,
        title: n.title,
        subtitle: n.category,
        kind: 'nota',
        ts: Date.parse(n.updatedAt ?? n.date) || 0,
      });
    }
    return [...items].sort((a, b) => b.ts - a.ts).slice(0, 6);
  }, [app.classes, app.looseNotes, app.courses]);

  const quickStats: Array<{ label: string; value: string; icon: LucideIcon; tint: string }> = [
    { label: 'tarefas pendentes', value: String(pendingTasks), icon: CheckCircle2, tint: 'var(--ds-accent)' },
    { label: 'provas à vista', value: String(upcomingExams), icon: CalendarDays, tint: 'var(--ds-status-warning)' },
    { label: 'dias de ofensiva', value: String(streak), icon: Flame, tint: 'var(--ds-domain-estudos)' },
    { label: 'disciplinas', value: String(courses.length), icon: BookOpen, tint: 'var(--ds-info)' },
  ];

  const moduleShortcuts: Array<{
    label: string;
    caption: string;
    icon: LucideIcon;
    domain: string;
    onSelect: () => void;
  }> = [
    {
      label: 'Base de Conhecimento',
      caption: 'biblioteca & templo',
      icon: BookOpen,
      domain: 'var(--ds-domain-conhecimento)',
      onSelect: () => app.handleNavigate('biblioteca'),
    },
    {
      label: 'Calendário',
      caption: 'aulas & avaliações',
      icon: CalendarDays,
      domain: 'var(--ds-domain-calendario)',
      onSelect: () => {
        app.setSubTabFaculdade('calendario');
        app.handleNavigate('faculdade');
      },
    },
    {
      label: 'Projetos & TCC',
      caption: tcc?.title ? tcc.title : 'seu trabalho de conclusão',
      icon: FolderKanban,
      domain: 'var(--ds-domain-tcc)',
      onSelect: () => app.openProjects(),
    },
    {
      label: 'Estudos',
      caption: 'foco, flashcards & leitura',
      icon: Brain,
      domain: 'var(--ds-domain-estudos)',
      onSelect: () => app.handleNavigate('estudos'),
    },
    {
      label: 'Marketing',
      caption: 'divulgação & carreira',
      icon: Megaphone,
      domain: 'var(--ds-domain-marketing)',
      onSelect: () => app.showToast('marketing chega em breve ♡'),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {/* saudação calorosa (único lugar com Plus Jakarta Sans no desktop) */}
      <header className="mb-8">
        <h1 className="font-display font-semibold text-[22px] text-ceci-primary">
          {greeting}, {profile.name || 'ceci'} ☀️
        </h1>
        <p className="mt-1 text-sm text-ceci-secondary">
          resumo do dia — {upcomingExams} evento{upcomingExams === 1 ? '' : 's'} e {pendingTasks} tarefa
          {pendingTasks === 1 ? '' : 's'} pendente{pendingTasks === 1 ? '' : 's'}
        </p>
      </header>

      {/* quick stats — grid 3-4 colunas, cards xl, sem rosa de fundo */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickStats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--ds-border-subtle)', boxShadow: 'var(--ds-elevation-xs)' }}
            >
              <Icon className="mb-2 h-5 w-5" style={{ color: s.tint }} aria-hidden />
              <p className="font-display text-2xl font-semibold text-ceci-primary">{s.value}</p>
              <p className="mt-0.5 text-xs text-ceci-secondary">{s.label}</p>
            </div>
          );
        })}
      </section>

      {/* recentes — lista compacta (radius.lg), sem rosa de fundo */}
      {recentItems.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ceci-muted">
            recentes
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentItems.map((it) => (
              <RecentItemCard key={it.id} title={it.title} subtitle={it.subtitle} kind={it.kind} />
            ))}
          </div>
        </section>
      ) : null}

      {/* atalhos de módulo — barra lateral fina de 3px com a cor de domínio */}
      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ceci-muted">
          módulos
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moduleShortcuts.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.label}
                onClick={m.onSelect}
                aria-label={`abrir ${m.label}`}
                className="flex items-center gap-3 rounded-xl border bg-surface-default p-4 text-left transition-colors hover:bg-surface-muted"
                style={{ borderColor: 'var(--ds-border-subtle)' }}
              >
                <span
                  className="h-10 w-1 rounded-full"
                  style={{ background: m.domain }}
                  aria-hidden
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-muted">
                  <Icon className="h-[18px] w-[18px] text-ceci-secondary" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ceci-primary">{m.label}</span>
                  <span className="block truncate text-xs text-ceci-secondary">{m.caption}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* dica do cecinho — único lugar com o calor do mascote além da saudação */}
      <section className="mt-8">
        <Panel className="p-4">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none" aria-hidden>✨</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ceci-primary">dica do cecinho</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ceci-secondary">
                que tal começar pelos cartões rápidos de revisão? um pouquinho de foco com leveza ♡
              </p>
              <button
                onClick={() => app.openStudy('focus')}
                className="mt-2.5 flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold"
                style={{ background: 'var(--ds-accent-subtle)', color: 'var(--ds-accent-strong)' }}
              >
                <Sparkles className="h-3 w-3" /> bora focar?
              </button>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
};
