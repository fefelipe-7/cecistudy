import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  BookOpen,
  Brain,
  Sparkles,
  User,
  GraduationCap,
  ListChecks,
  ClipboardList,
  FileText,
  Landmark,
  Clock,
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Mascote } from './ui/Mascote';
import { PillGroup } from './ui/PillGroup';
import { SearchRow } from './SearchRow';
import { usePersistentState } from '../lib/usePersistentState';
import {
  groupResults,
  pushRecent,
  search,
  type RankedResult,
  type SearchEntry,
  type SearchType,
} from '../lib/searchLogic';
import {
  Course,
  ClassNote,
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  ReadingItem,
  Task,
  Exam,
  LooseNote,
  NavTab,
} from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  classes: ClassNote[];
  authors: PsychologyAuthor[];
  concepts: PsychologyConcept[];
  approaches: PsychologyApproach[];
  readings: ReadingItem[];
  tasks: Task[];
  exams: Exam[];
  looseNotes: LooseNote[];
  onNavigate: (tab: NavTab, subTab?: string, targetId?: string) => void;
  onOpenNoteDetail: (noteId: string) => void;
  onOpenCourseDetail: (courseId: string) => void;
}

/** Item pesquisável + legenda de exibição + navegação de destino. */
interface SearchItem {
  entry: SearchEntry;
  subtitle: string;
  go: () => void;
}

const TYPE_ICON: Record<SearchType, React.ReactNode> = {
  concept: <Sparkles className="w-4 h-4" />,
  author: <User className="w-4 h-4" />,
  course: <GraduationCap className="w-4 h-4" />,
  class: <Brain className="w-4 h-4" />,
  reading: <BookOpen className="w-4 h-4" />,
  approach: <Landmark className="w-4 h-4" />,
  task: <ListChecks className="w-4 h-4" />,
  exam: <ClipboardList className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
};

/** Corta com "…" só quando passa do limite (antes grudava sempre). */
const ellipsis = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;

const QUICK_TAGS: { value: string; label: string; emoji: string }[] = [
  { value: 'ansiedade', label: 'ansiedade', emoji: '💭' },
  { value: 'aaron beck', label: 'aaron beck', emoji: '🧠' },
  { value: 'freud', label: 'freud', emoji: '🛋️' },
  { value: 'tcc', label: 'tcc', emoji: '📝' },
  { value: 'depressão', label: 'depressão', emoji: '🌧️' },
  { value: 'htp', label: 'htp', emoji: '🎨' },
  { value: 'acolhimento', label: 'acolhimento', emoji: '🤗' },
  { value: 'vygotsky', label: 'vygotsky', emoji: '👥' },
];

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  courses,
  classes,
  authors,
  concepts,
  approaches,
  readings,
  tasks,
  exams,
  looseNotes,
  onNavigate,
  onOpenNoteDetail,
  onOpenCourseDetail,
}) => {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = usePersistentState<string[]>('recentSearches', []);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  // Foca o campo ao abrir (o Modal foca o painel; a busquinha quer o teclado já aberto).
  useEffect(() => {
    if (!isOpen) return;
    setActiveKey(null);
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  const items = useMemo<SearchItem[]>(() => {
    const list: SearchItem[] = [];
    concepts.forEach((c) =>
      list.push({
        entry: {
          id: `concept:${c.id}`,
          title: c.name,
          body: c.definition,
          tags: c.tags,
          type: 'concept',
          badge: 'conceito',
        },
        subtitle: ellipsis(c.definition, 70),
        go: () => onNavigate('biblioteca', 'conceitos', c.id),
      })
    );
    authors.forEach((a) =>
      list.push({
        entry: {
          id: `author:${a.id}`,
          title: a.name,
          body: a.bio,
          tags: a.keyConcepts,
          type: 'author',
          badge: 'autor',
        },
        subtitle: ellipsis(a.bio, 70),
        go: () => onNavigate('biblioteca', 'autores', a.id),
      })
    );
    courses.forEach((co) =>
      list.push({
        entry: {
          id: `course:${co.id}`,
          title: co.name,
          body: `${co.professor} ${co.description ?? ''}`,
          tags: co.code ? [co.code] : [],
          type: 'course',
          badge: 'disciplina',
        },
        subtitle: `prof.ª ${co.professor} • ${co.semester}`,
        go: () => onNavigate('faculdade', 'disciplinas', co.id),
      })
    );
    classes.forEach((cl) =>
      list.push({
        entry: {
          id: `class:${cl.id}`,
          title: cl.title,
          body: `${cl.summary} ${cl.fullNotes ?? ''}`,
          tags: [],
          type: 'class',
          badge: 'aula',
        },
        subtitle: `aula ${cl.number} • ${ellipsis(cl.summary, 60)}`,
        go: () => onOpenCourseDetail(cl.courseId),
      })
    );
    readings.forEach((r) =>
      list.push({
        entry: {
          id: `reading:${r.id}`,
          title: r.title,
          body: r.author,
          tags: [],
          type: 'reading',
          badge: 'leitura',
        },
        subtitle: `${r.author ? `por ${r.author} • ` : ''}${
          r.status === 'concluido' ? 'concluído' : 'em leitura'
        }`,
        go: () => onNavigate('estudos', 'leituras', r.id),
      })
    );
    approaches.forEach((app) =>
      list.push({
        entry: {
          id: `approach:${app.id}`,
          title: app.name,
          body: app.description,
          tags: [app.shortName],
          type: 'approach',
          badge: 'abordagem',
        },
        subtitle: ellipsis(app.description, 70),
        go: () => onNavigate('biblioteca', 'abordagens', app.id),
      })
    );
    tasks.forEach((t) =>
      list.push({
        entry: {
          id: `task:${t.id}`,
          title: t.title,
          body: `${t.category} ${t.priority}`,
          tags: [t.category, t.priority],
          type: 'task',
          badge: 'tarefa',
        },
        subtitle: `${t.category} • ${t.dueDate ? fmtDate(t.dueDate) : 'sem prazo'}${
          t.completed ? ' • concluída' : ''
        }`,
        go: () =>
          t.disciplineId ? onOpenCourseDetail(t.disciplineId) : onNavigate('home'),
      })
    );
    exams.forEach((e) =>
      list.push({
        entry: {
          id: `exam:${e.id}`,
          title: e.title,
          body: `peso ${e.weight} ${e.topics.join(' ')}`,
          tags: e.topics,
          type: 'exam',
          badge: 'prova',
        },
        subtitle: `${e.date ? fmtDate(e.date) : 'a confirmar'} • peso ${e.weight}`,
        go: () =>
          e.courseId ? onOpenCourseDetail(e.courseId) : onNavigate('faculdade', 'disciplinas'),
      })
    );
    looseNotes.forEach((n) =>
      list.push({
        entry: {
          id: `note:${n.id}`,
          title: n.title || n.content.slice(0, 60),
          body: n.content,
          tags: [],
          type: 'note',
          badge: 'nota',
        },
        subtitle: ellipsis(n.content, 70),
        go: () => onOpenNoteDetail(n.id),
      })
    );
    return list;
  }, [
    concepts,
    authors,
    courses,
    classes,
    readings,
    approaches,
    tasks,
    exams,
    looseNotes,
    onNavigate,
    onOpenNoteDetail,
    onOpenCourseDetail,
  ]);

  const byId = useMemo(() => new Map(items.map((it) => [it.entry.id, it])), [items]);

  const ranked: RankedResult[] = useMemo(
    () => search(items.map((it) => it.entry), query),
    [items, query]
  );
  const sections = useMemo(() => groupResults(ranked), [ranked]);

  // Ativo sempre válido; Enter cai no 1º quando nada destacado.
  useEffect(() => {
    setActiveKey(null);
  }, [query]);

  useEffect(() => {
    if (!activeKey) return;
    rowRefs.current.get(activeKey)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeKey]);

  const select = (key: string) => {
    const item = byId.get(key);
    if (!item) return;
    setRecents((prev) => pushRecent(prev, query));
    item.go();
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (ranked.length === 0) return;
      e.preventDefault();
      const ids = ranked.map((r) => r.id);
      const idx = activeKey ? ids.indexOf(activeKey) : -1;
      const next =
        e.key === 'ArrowDown'
          ? ids[(idx + 1 + ids.length) % ids.length]
          : ids[(idx - 1 + ids.length) % ids.length];
      setActiveKey(next);
    } else if (e.key === 'Enter') {
      if (ranked.length === 0) return;
      e.preventDefault();
      const fallback = ranked[0]?.id;
      if (activeKey ?? fallback) select((activeKey ?? fallback) as string);
    }
  };

  const runSuggestion = (tag: string) => {
    setQuery(tag);
    inputRef.current?.focus();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      position="top"
      className="w-full max-w-2xl bg-canvas rounded-3xl border border-ceci-border-default shadow-2xl overflow-hidden text-ceci-primary"
    >
      {/* Barra de busca */}
      <div className="p-4 border-b border-ceci-border-subtle flex items-center gap-3 bg-surface-default">
        <Search className="w-5 h-5 text-ceci-brand-soft shrink-0" />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          role="combobox"
          aria-expanded={ranked.length > 0}
          aria-controls="cecistudy-search-list"
          aria-activedescendant={activeKey ? `search-option-${activeKey}` : undefined}
          aria-label="buscar no cantinho"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="buscar no cantinho… (tarefas, aulas, beck, tcc…)"
          className="w-full bg-transparent text-sm sm:text-base focus:outline-none placeholder:text-ceci-faded text-ceci-primary"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="limpar busca"
            className="touch-target p-1 rounded-full hover:bg-surface-muted text-ceci-faded shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onClose}
          className="text-xs bg-surface-muted hover:bg-surface-subtle text-ceci-primary px-3 py-1.5 rounded-xl font-medium transition-colors min-h-[36px] shrink-0"
        >
          fechar
        </button>
      </div>

      {/* Vazio: recentes + sugestões */}
      {!query && (
        <div className="p-5">
          {recents.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold lowercase tracking-wider text-ceci-tertiary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  buscas recentes
                </p>
                <button
                  onClick={() => setRecents([])}
                  className="text-[11px] font-semibold text-ceci-tertiary hover:text-ceci-brand-strong transition-colors min-h-[32px] px-2"
                >
                  limpar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => runSuggestion(r)}
                    className="cute-badge max-w-full truncate"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs font-semibold lowercase tracking-wider text-ceci-tertiary mb-2.5">
            sugestões rápidas no cecistudy ♡
          </p>
          <PillGroup
            value={'' as string}
            onChange={(v) => runSuggestion(String(v))}
            options={QUICK_TAGS}
            className="justify-center sm:justify-start"
          />
          <div className="mt-6 pt-4 border-t border-ceci-border-subtle text-center text-xs text-ceci-secondary">
            busca em tudo que você anota: tarefas, provas, aulas, notas, leituras e disciplinas ♡
          </div>
        </div>
      )}

      {/* Resultados agrupados */}
      {query && (
        <div
          id="cecistudy-search-list"
          role="listbox"
          aria-label="resultados da busca"
          className="max-h-[60vh] overflow-y-auto p-3"
        >
          {ranked.length === 0 ? (
            <div className="p-8 text-center text-ceci-secondary">
              <Mascote expression="no-results" className="w-16 h-16 mx-auto mb-2" decorative />
              <p className="font-display text-base text-ceci-primary mb-1">
                nada por aqui com “{query.trim()}”…
              </p>
              <p className="text-xs mb-4">mas que tal tentar uma dessas? ♡</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {QUICK_TAGS.slice(0, 4).map((t) => (
                  <button key={t.value} onClick={() => runSuggestion(t.value)} className="cute-badge">
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            sections.map((section) => (
              <section key={section.key} aria-label={section.label}>
                <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
                  {section.label} · {section.items.length}
                </p>
                {section.items.map((item) => (
                  <SearchRow
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    titleRanges={item.titleRanges}
                    subtitle={byId.get(item.id)?.subtitle ?? ''}
                    badge={item.badge}
                    icon={TYPE_ICON[item.type]}
                    selected={activeKey === item.id}
                    onSelect={() => select(item.id)}
                    onHover={() => setActiveKey(item.id)}
                    registerRef={(id, el) => {
                      if (el) rowRefs.current.set(id, el);
                      else rowRefs.current.delete(id);
                    }}
                  />
                ))}
              </section>
            ))
          )}
        </div>
      )}
    </Modal>
  );
};
