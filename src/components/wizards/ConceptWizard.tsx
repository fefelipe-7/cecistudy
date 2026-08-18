import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  FieldLabel,
  ReviewCard,
  TextArea,
  TextInput,
} from './wizardFields';
import { PillGroupMulti } from '../ui/PillGroupMulti';
import { Picker } from '../ui/Picker';
import { TagField } from '../ui/TagField';

export const ConceptWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const { approaches, authors, courses, concepts, wizardCourseId, handleAddConcept, handleUpdateConcept, closeWizard, showToast } = useApp();
  const editingConcept = editing?.kind === 'concept'
    ? concepts.find((c) => c.id === editing.id)
    : undefined;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(editingConcept?.name ?? '');
  const [definition, setDefinition] = useState(editingConcept?.definition ?? '');
  const [approachId, setApproachId] = useState(editingConcept?.approachId ?? '');
  const [authorIds, setAuthorIds] = useState<string[]>(editingConcept?.authorIds ?? []);
  const [courseIds, setCourseIds] = useState<string[]>(
    editingConcept?.courseIds.length ? editingConcept.courseIds : wizardCourseId ? [wizardCourseId] : []
  );
  const [tags, setTags] = useState<string[]>(editingConcept?.tags ?? []);

  const approachName = approaches.find((a) => a.id === approachId)?.shortName ?? 'sem abordagem';
  const authorsNames = authors.filter((x) => authorIds.includes(x.id)).map((x) => x.name).join(' · ');
  const coursesNames = courses.filter((x) => courseIds.includes(x.id)).map((x) => x.name).join(' · ');

  const steps: WizardStep[] = [
    {
      id: 'conceito-nome',
      title: 'conceito',
      headline: 'qual é o conceito?',
      content: (
        <div className="space-y-4">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="nome do conceito — ex: tríade cognitiva"
            autoFocus
          />
          <div>
            <FieldLabel>definição</FieldLabel>
            <TextArea
              rows={4}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="o que é esse conceito?"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'conceito-contexto',
      title: 'contexto',
      headline: 'onde esse conceito se encaixa?',
      content: (
        <div className="space-y-4">
          <Picker
            label="abordagem (opcional)"
            value={approachId}
            onChange={setApproachId}
            options={approaches.map((x) => ({ value: x.id, label: x.shortName || x.name }))}
            placeholder="sem abordagem"
            emptyMessage="ainda não há abordagens registradas."
          />
          <PillGroupMulti
            label="autores relacionados"
            variant="rose"
            options={authors.map((x) => ({ value: x.id, label: x.name }))}
            value={authorIds}
            onChange={setAuthorIds}
          />
          <PillGroupMulti
            label="disciplinas"
            variant="rose"
            options={courses.map((x) => ({ value: x.id, label: x.name }))}
            value={courseIds}
            onChange={setCourseIds}
          />
          <TagField
            tags={tags}
            onChange={setTags}
            placeholder="tags do conceito (ex: ansiedade)"
            emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
          />
        </div>
      ),
    },
    {
      id: 'conceito-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'conceito', value: name.trim() },
            { label: 'definição', value: definition.trim() || 'sem definição' },
            { label: 'abordagem', value: approachName },
            { label: 'autores', value: authorsNames || '—' },
            { label: 'disciplinas', value: coursesNames || '—' },
            { label: 'tags', value: tags.join(' · ') || '—' },
          ]}
        />
      ),
    },
  ];

  const handleSave = () => {
    const payload = {
      name: name.trim(),
      definition: definition.trim(),
      approachId: approachId || undefined,
      authorIds,
      courseIds,
      tags,
    };
    if (editingConcept) {
      handleUpdateConcept({ ...editingConcept, ...payload });
      hapticSuccess();
      closeWizard();
      showToast('conceito atualizado ♡');
      return;
    }
    handleAddConcept({ id: 'con-' + Date.now(), ...payload });
    hapticSuccess();
    closeWizard();
    showToast('conceito guardado no cantinho ♡');
  };

  return (
    <WizardScaffold
      title={editing ? 'editar conceito' : 'novo conceito'}
      icon={<Sparkles className="w-3.5 h-3.5" />}
      iconClass="bg-amber-bg border-amber-border text-amber-text"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={name.trim().length > 0}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar conceito ♡'}
    />
  );
};