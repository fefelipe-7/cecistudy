import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Library } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { TOAST } from '../../lib/copy';
import {
  buildAuthorSuggestions,
  findCatalogMatches,
  findMyReadingMatches,
  type CatalogWorkRef,
} from '../../lib/readingMatching';
import { loadNativeLibraryDataset } from '../../lib/catalogLibrary';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  FieldHint,
  FieldLabel,
  ReviewCard,
  TextInput,
} from './wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { Picker } from '../ui/Picker';
import { AuthorSuggestInput } from '../ui/AuthorSuggestInput';

const TYPES: { value: ReadingType; label: string; emoji?: string }[] = [
  { value: 'livro', label: 'livro', emoji: '📖' },
  { value: 'artigo', label: 'artigo', emoji: '📄' },
  { value: 'capitulo', label: 'capítulo', emoji: '📑' },
  { value: 'pdf', label: 'pdf', emoji: '🗂️' },
];

const STATUS: { value: ReadingStatus; label: string; emoji?: string }[] = [
  { value: 'lendo', label: 'lendo', emoji: '📚' },
  { value: 'nao_iniciado', label: 'quero ler', emoji: '🌱' },
  { value: 'concluido', label: 'concluído', emoji: '✅' },
];

export const ReadingWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    courses,
    readings,
    authors,
    wizardCourseId,
    handleAddReading,
    handleUpdateReading,
    handleAddAuthor,
    closeWizard,
    openEditCourse,
    showToast,
  } = useMobileApp();
  const editingReading = editing?.kind === 'reading'
    ? readings.find((r) => r.id === editing.id)
    : undefined;

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(editingReading?.title ?? '');
  const [author, setAuthor] = useState(editingReading?.author ?? '');
  const [type, setType] = useState<ReadingType>(editingReading?.type ?? 'livro');
  // §5.5: cadastro ≠ progresso — total começa vazio e páginas lidas em zero
  const [totalPages, setTotalPages] = useState(
    editingReading?.totalPages ? String(editingReading.totalPages) : ''
  );
  const [courseId, setCourseId] = useState(
    editingReading?.courseId ?? (wizardCourseId || courses[0]?.id || '')
  );
  const [status, setStatus] = useState<ReadingStatus>(editingReading?.status ?? 'nao_iniciado');

  // Acervo da biblioteca (web = facade lazy; nativo = catálogo SQLite) p/
  // sugerir obras que já fazem parte do acervo quando o título bate.
  const [catalogWorks, setCatalogWorks] = useState<CatalogWorkRef[]>([]);
  useEffect(() => {
    let cancelled = false;
    const toRefs = (
      books: { id: string; nome: string; autor: string }[]
    ): CatalogWorkRef[] =>
      books.map((b) => ({ id: b.id, title: b.nome, author: b.autor }));
    void loadNativeLibraryDataset()
      .then((dataset) => {
        if (cancelled) return;
        if (dataset) {
          setCatalogWorks([
            ...toRefs(dataset.catalogBooks),
            ...toRefs(dataset.interdisciplinaryBooks),
          ]);
          return;
        }
        return import('../../data/books').then((facade) => {
          if (!cancelled) {
            setCatalogWorks([...toRefs(facade.catalogBooks), ...toRefs(facade.interdisciplinaryBooks)]);
          }
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const titleTrimmed = title.trim();
  const myMatches = useMemo(
    () =>
      editing?.kind === 'reading'
        ? findMyReadingMatches(titleTrimmed, readings, editing.id)
        : findMyReadingMatches(titleTrimmed, readings),
    [readings, titleTrimmed, editing]
  );
  const catalogMatches = useMemo(
    () => findCatalogMatches(titleTrimmed, catalogWorks),
    [catalogWorks, titleTrimmed]
  );

  const authorSuggestions = useMemo(
    () =>
      buildAuthorSuggestions({
        authors,
        readings,
        catalogWorks: catalogMatches,
      }),
    [authors, readings, catalogMatches]
  );

  const handleCreateAuthor = (name: string) => {
    handleAddAuthor({
      id: 'aut-' + Date.now(),
      name,
      bio: '',
      keyConcepts: [],
      majorWorks: [],
    });
    showToast(TOAST.authorSaved);
  };

  const adoptMyReading = (readingId: string) => {
    const match = readings.find((r) => r.id === readingId);
    if (!match) return;
    setTitle(match.title);
    setAuthor(match.author);
    setType(match.type);
    setTotalPages(match.totalPages ? String(match.totalPages) : '');
    setCourseId(match.courseId ?? courseId);
    setStatus(match.status);
    hapticSuccess();
    showToast('preenchemos com os dados da sua estante ♡');
  };

  const adoptCatalogWork = (workId: string) => {
    const match = catalogWorks.find((w) => w.id === workId);
    if (!match) return;
    setTitle(match.title);
    setAuthor((prev) => prev || match.author);
    hapticSuccess();
    showToast('dados do acervo preenchidos ♡');
  };

  const createCourseInline = () => {
    showToast(TOAST.courseRegistered);
    openEditCourse();
  };

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'leitura-obra',
      title: 'obra',
      headline: 'qual obra você vai ler?',
      subtitle: 'título e autor — se a obra já está no acervo da biblioteca, usamos os dados.',
      content: (
        <div className="space-y-4">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="título da obra ou artigo — ex: a interpretação dos sonhos"
            autoFocus
          />

          {myMatches.length > 0 && (
            <div className="rounded-2xl border border-ceci-border-brand bg-surface-rose px-4 py-3 space-y-2">
              <p className="text-[11px] font-semibold text-ceci-brand-strong">
                essa obra já está na sua estante ♡
              </p>
              {myMatches.slice(0, 3).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => adoptMyReading(r.id)}
                  className="w-full flex items-center gap-2 text-left bg-surface-default rounded-xl border border-ceci-border-subtle px-3 py-2.5 hover:bg-surface-muted tap-interactive cursor-pointer transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-ceci-brand-strong shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-ceci-primary line-clamp-1">{r.title}</span>
                    <span className="block text-[10px] text-ceci-secondary">
                      {r.author || 'autor não informado'} · já cadastrada
                    </span>
                  </span>
                  <span className="text-[10px] font-bold text-ceci-academic-strong shrink-0">usar essa</span>
                </button>
              ))}
            </div>
          )}

          {catalogMatches.length > 0 && (
            <div className="rounded-2xl border border-ceci-border-academic bg-surface-blue px-4 py-3 space-y-2">
              <p className="text-[11px] font-semibold text-ceci-academic-strong">
                tem no acervo da biblioteca ✦
              </p>
              {catalogMatches.slice(0, 3).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => adoptCatalogWork(w.id)}
                  className="w-full flex items-center gap-2 text-left bg-surface-default rounded-xl border border-ceci-border-subtle px-3 py-2.5 hover:bg-surface-muted tap-interactive cursor-pointer transition-colors"
                >
                  <Library className="w-4 h-4 text-ceci-academic-strong shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-ceci-primary line-clamp-1">{w.title}</span>
                    <span className="block text-[10px] text-ceci-secondary">{w.author || 'autor não informado'}</span>
                  </span>
                  <span className="text-[10px] font-bold text-ceci-academic-strong shrink-0">usar dados</span>
                </button>
              ))}
            </div>
          )}

          <AuthorSuggestInput
            value={author}
            onChange={setAuthor}
            suggestions={authorSuggestions}
            onCreateAuthor={handleCreateAuthor}
            placeholder="autor — ex: freud"
          />
        </div>
      ),
    },
    {
      id: 'leitura-formato',
      title: 'formato',
      headline: 'qual o formato e o tamanho?',
      subtitle: 'o tipo da obra e o total de páginas, para acompanhar o progresso depois.',
      content: (
        <div className="space-y-5">
          <ChoiceCardGrid
            label="tipo"
            options={TYPES}
            value={type}
            onChange={(v) => setType(v)}
          />
          <div>
            <FieldLabel>total de páginas (opcional)</FieldLabel>
            <TextInput
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="ex: 200"
            />
            <FieldHint>sem esse número, não dá para calcular a porcentagem de leitura.</FieldHint>
          </div>
        </div>
      ),
    },
    {
      id: 'leitura-contexto',
      title: 'contexto',
      headline: 'onde essa leitura se encaixa?',
      subtitle: 'a disciplina é opcional; o status mostra onde essa leitura está na sua jornada.',
      content: (
        <div className="space-y-5">
          <Picker
            label="disciplina (opcional)"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
            createLabel="criar matéria agora"
            onCreate={createCourseInline}
          />
          <ChoiceCardGrid
            label="status"
            options={STATUS}
            value={status}
            onChange={(v) => setStatus(v)}
          />
        </div>
      ),
    },
    {
      id: 'leitura-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      subtitle: 'confere os dados — o progresso de leitura você atualiza a qualquer hora.',
      content: (
        <ReviewCard
          rows={[
            { label: 'obra', value: title.trim() },
            { label: 'autor', value: author.trim() || 'autor não informado' },
            { label: 'tipo', value: type },
            { label: 'páginas', value: totalPages ? `${totalPages} páginas` : 'total a descobrir' },
            { label: 'disciplina', value: courseName || 'sem disciplina' },
            { label: 'status', value: status },
          ]}
        />
      ),
    },
  ];

  const handleSave = () => {
    if (editingReading) {
      handleUpdateReading({
        ...editingReading,
        title: title.trim(),
        author: author.trim() || 'autor não informado',
        courseId: courseId || undefined,
        type,
        totalPages: parseInt(totalPages) || editingReading.totalPages,
        status,
      });
      hapticSuccess();
      closeWizard();
      showToast('leitura atualizada ♡');
      return;
    }
    handleAddReading({
      id: 'r-' + Date.now(),
      title: title.trim(),
      author: author.trim() || 'autor não informado',
      courseId: courseId || undefined,
      type,
      totalPages: parseInt(totalPages) || undefined,
      readPages: 0,
      status,
      highlights: [],
    });
    hapticSuccess();
    closeWizard();
    showToast('leitura guardada na estante ♡');
  };

  return (
    <WizardScaffold
      title={editing ? 'editar leitura' : 'nova leitura'}
      icon={<BookOpen className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      mascote="reading-curious"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={title.trim().length > 0}
      blockedReason="dê um título à obra para continuar"
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar leitura ♡'}
    />
  );
};

type ReadingType = 'livro' | 'artigo' | 'capitulo' | 'pdf';
type ReadingStatus = 'nao_iniciado' | 'lendo' | 'concluido';
