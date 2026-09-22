import React from 'react';
import { BookOpen } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { MaterialItem, ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  ReviewCard,
  TextInput,
} from './wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { TagField } from '../ui/TagField';
import { CourseSelect } from './CourseSelect';
import { MATERIAL_TYPES } from './note/constants';

interface MaterialValues {
  title: string;
  type: MaterialItem['type'];
  author: string;
  courseId: string;
  url: string;
  tags: string[];
}

export const MaterialWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const { courses, materials, wizardCourseId, handleAddMaterial, handleUpdateMaterial, closeWizard, showToast } = useMobileApp();
  const editingMaterial = editing?.kind === 'material'
    ? materials.find((m) => m.id === editing.id)
    : undefined;

  const { values, patch, step, setStep } = useWizardForm<MaterialValues>({
    initial: {
      title: editingMaterial?.title ?? '',
      type: editingMaterial?.type ?? 'artigo',
      author: editingMaterial?.author ?? '',
      courseId: editingMaterial?.courseId ?? (wizardCourseId || courses[0]?.id || ''),
      url: editingMaterial?.url ?? '',
      tags: editingMaterial?.tags ?? [],
    },
    editing: !!editingMaterial,
  });
  const { title, type, author, courseId, url, tags } = values;

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'material-obra',
      title: 'material',
      headline: 'que material você quer guardar?',
      subtitle: 'título, tipo e autor(a) — o essencial para achar o material depois.',
      content: (
        <div className="space-y-4">
          <TextInput
            value={title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="título do material — ex: manual diagnóstico e estatístico"
            autoFocus
          />
          <ChoiceCardGrid label="tipo" options={MATERIAL_TYPES} value={type} onChange={(v) => patch({ type: v })} />
          <TextInput
            value={author}
            onChange={(e) => patch({ author: e.target.value })}
            placeholder="autor(a)"
          />
        </div>
      ),
    },
    {
      id: 'material-contexto',
      title: 'contexto',
      headline: 'onde esse material se encaixa?',
      subtitle: 'disciplina, link e tags ajudam a encontrar o material na biblioteca ♡',
      content: (
        <div className="space-y-4">
          <CourseSelect
            value={courseId}
            onChange={(v) => patch({ courseId: v })}
            label="disciplina (opcional)"
            optional
          />
          <TextInput
            value={url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="link (se houver)"
          />
          <TagField
            tags={tags}
            onChange={(v) => patch({ tags: v })}
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
      subtitle: 'confere os dados antes de guardar o material.',
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
      blockedReason="dê um título para o material"
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar material ♡'}
    />
  );
};