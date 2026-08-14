import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  ChipPicker,
  FieldLabel,
  ReviewCard,
  SelectField,
  TextInput,
} from './wizardFields';

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

export const ReadingWizard: React.FC = () => {
  const { courses, wizardCourseId, handleAddReading, closeWizard, showToast } = useApp();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<ReadingType>('livro');
  const [totalPages, setTotalPages] = useState('200');
  const [courseId, setCourseId] = useState(wizardCourseId || courses[0]?.id || '');
  const [status, setStatus] = useState<ReadingStatus>('lendo');

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'leitura-obra',
      title: 'obra',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>título da obra / artigo</FieldLabel>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: a interpretação dos sonhos"
              autoFocus
            />
          </div>
          <div>
            <FieldLabel>autor</FieldLabel>
            <TextInput
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="ex: freud"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'leitura-formato',
      title: 'formato',
      content: (
        <div className="space-y-5">
          <ChipPicker
            label="tipo"
            options={TYPES}
            value={type}
            onChange={setType}
          />
          <div>
            <FieldLabel>total de páginas</FieldLabel>
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
      content: (
        <div className="space-y-5">
          <SelectField
            label="disciplina (opcional)"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
          />
          <ChipPicker
            label="status"
            options={STATUS}
            value={status}
            onChange={setStatus}
          />
        </div>
      ),
    },
    {
      id: 'leitura-revisar',
      title: 'revisar',
      content: (
        <div className="space-y-3">
          <p className="text-xs font-medium text-ceci-secondary">
            confere se está tudo certinho antes de guardar:
          </p>
          <ReviewCard
            rows={[
              { label: 'obra', value: title.trim() },
              { label: 'autor', value: author.trim() || 'autor não informado' },
              { label: 'tipo', value: type },
              { label: 'páginas', value: `${totalPages || '200'} páginas` },
              { label: 'disciplina', value: courseName || 'sem disciplina' },
              { label: 'status', value: status },
            ]}
          />
        </div>
      ),
    },
  ];

  const handleSave = () => {
    handleAddReading({
      id: 'r-' + Date.now(),
      title: title.trim(),
      author: author.trim() || 'autor não informado',
      courseId: courseId || undefined,
      type,
      totalPages: parseInt(totalPages) || 200,
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
      title="nova leitura"
      icon={<BookOpen className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={title.trim().length > 0}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel="guardar leitura ♡"
    />
  );
};

type ReadingType = 'livro' | 'artigo' | 'capitulo' | 'pdf';
type ReadingStatus = 'nao_iniciado' | 'lendo' | 'concluido';
