import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  FieldLabel,
  ReviewCard,
  TextInput,
} from './wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { Picker } from '../ui/Picker';

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
    wizardCourseId,
    handleAddReading,
    handleUpdateReading,
    closeWizard,
    openEditCourse,
    showToast,
  } = useApp();
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

  const createCourseInline = () => {
    showToast('cadastre a matéria — quando voltar, ela aparece aqui ♡');
    openEditCourse();
  };

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'leitura-obra',
      title: 'obra',
      headline: 'qual obra você vai ler?',
      content: (
        <div className="space-y-4">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="título da obra ou artigo — ex: a interpretação dos sonhos"
            autoFocus
          />
          <TextInput
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="autor — ex: freud"
          />
        </div>
      ),
    },
    {
      id: 'leitura-formato',
      title: 'formato',
      headline: 'qual o formato e o tamanho?',
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
          </div>
        </div>
      ),
    },
    {
      id: 'leitura-contexto',
      title: 'contexto',
      headline: 'onde essa leitura se encaixa?',
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
