import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { MaterialItem, ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  ReviewCard,
  TextInput,
} from './wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { Picker } from '../ui/Picker';
import { TagField } from '../ui/TagField';

const MATERIAL_TYPES: { value: MaterialItem['type']; label: string; emoji?: string }[] = [
  { value: 'artigo', label: 'artigo', emoji: '📄' },
  { value: 'livro', label: 'livro', emoji: '📖' },
  { value: 'pdf', label: 'pdf', emoji: '🗂️' },
  { value: 'link', label: 'link', emoji: '🔗' },
  { value: 'slides', label: 'slides', emoji: '📽️' },
];

export const MaterialWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const { courses, materials, wizardCourseId, handleAddMaterial, handleUpdateMaterial, closeWizard, showToast } = useApp();
  const editingMaterial = editing?.kind === 'material'
    ? materials.find((m) => m.id === editing.id)
    : undefined;

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(editingMaterial?.title ?? '');
  const [type, setType] = useState<MaterialItem['type']>(editingMaterial?.type ?? 'artigo');
  const [author, setAuthor] = useState(editingMaterial?.author ?? '');
  const [courseId, setCourseId] = useState(
    editingMaterial?.courseId ?? (wizardCourseId || courses[0]?.id || '')
  );
  const [url, setUrl] = useState(editingMaterial?.url ?? '');
  const [tags, setTags] = useState<string[]>(editingMaterial?.tags ?? []);

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'material-obra',
      title: 'material',
      headline: 'que material você quer guardar?',
      content: (
        <div className="space-y-4">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="título do material — ex: manual diagnóstico e estatístico"
            autoFocus
          />
          <ChoiceCardGrid label="tipo" options={MATERIAL_TYPES} value={type} onChange={(v) => setType(v)} />
          <TextInput
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="autor(a)"
          />
        </div>
      ),
    },
    {
      id: 'material-contexto',
      title: 'contexto',
      headline: 'onde esse material se encaixa?',
      content: (
        <div className="space-y-4">
          <Picker
            label="disciplina (opcional)"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
          />
          <TextInput
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="link (se houver)"
          />
          <TagField
            tags={tags}
            onChange={setTags}
            placeholder="tags do material"
            emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
          />
        </div>
      ),
    },
    {
      id: 'material-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'material', value: title.trim() },
            { label: 'tipo', value: type },
            { label: 'autor', value: author.trim() || '—' },
            { label: 'disciplina', value: courseName || 'sem disciplina' },
            { label: 'link', value: url.trim() || '—' },
            { label: 'tags', value: tags.join(' · ') || '—' },
          ]}
        />
      ),
    },
  ];

  const handleSave = () => {
    const payload = {
      title: title.trim(),
      type,
      author: author.trim() || 'autor não informado',
      courseId: courseId || undefined,
      url: url.trim() || undefined,
      tags,
    };
    if (editingMaterial) {
      handleUpdateMaterial({ ...editingMaterial, ...payload });
      hapticSuccess();
      closeWizard();
      showToast('material atualizado ♡');
      return;
    }
    handleAddMaterial({ id: 'm-' + Date.now(), addedAt: new Date().toISOString(), ...payload });
    hapticSuccess();
    closeWizard();
    showToast('material guardado no cantinho ♡');
  };

  return (
    <WizardScaffold
      title={editing ? 'editar material' : 'novo material'}
      icon={<BookOpen className="w-3.5 h-3.5" />}
      iconClass="bg-surface-muted border-ceci-border-default text-ceci-secondary"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={title.trim().length > 0}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar material ♡'}
    />
  );
};