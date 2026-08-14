import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  FieldLabel,
  MultiChipPicker,
  ReviewCard,
  SelectField,
  TagInput,
  TextArea,
  TextInput,
} from './wizardFields';

export const ConceptWizard: React.FC = () => {
  const {
    courses,
    approaches,
    authors,
    wizardCourseId,
    handleAddConcept,
    closeWizard,
    showToast,
  } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [definition, setDefinition] = useState('');
  const [tags, setTags] = useState<string[]>(['Psicologia', 'Conceito']);
  const [courseIds, setCourseIds] = useState<string[]>(
    wizardCourseId ? [wizardCourseId] : []
  );
  const [approachId, setApproachId] = useState<string>('');
  const [authorIds, setAuthorIds] = useState<string[]>([]);

  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? id;
  const approachName = approaches.find((a) => a.id === approachId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'conceito-nome',
      title: 'nome',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>nome do conceito</FieldLabel>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: pensamentos automáticos"
              autoFocus
            />
          </div>
          <TagInput
            label="tags para encontrar depois"
            tags={tags}
            onChange={setTags}
            placeholder="ex: ansiedade"
          />
        </div>
      ),
    },
    {
      id: 'conceito-definicao',
      title: 'definição',
      content: (
        <div className="space-y-2">
          <FieldLabel>definição acadêmica / pessoal</FieldLabel>
          <TextArea
            rows={7}
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="escreva a definição com suas palavras..."
          />
        </div>
      ),
    },
    {
      id: 'conceito-conexoes',
      title: 'conexões',
      content: (
        <div className="space-y-5">
          <MultiChipPicker
            label="disciplinas"
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            values={courseIds}
            onChange={setCourseIds}
          />
          <SelectField
            label="abordagem (opcional)"
            value={approachId}
            onChange={setApproachId}
            options={approaches.map((a) => ({ value: a.id, label: a.name }))}
            emptyMessage="ainda não há abordagens registradas."
          />
          <MultiChipPicker
            label="autores relacionados"
            options={authors.map((a) => ({ value: a.id, label: a.name }))}
            values={authorIds}
            onChange={setAuthorIds}
          />
        </div>
      ),
    },
    {
      id: 'conceito-revisar',
      title: 'revisar',
      content: (
        <div className="space-y-3">
          <p className="text-xs font-medium text-ceci-secondary">
            confere se está tudo certinho antes de guardar:
          </p>
          <ReviewCard
            rows={[
              { label: 'conceito', value: name.trim() },
              { label: 'definição', value: definition.trim() },
              { label: 'disciplinas', value: courseIds.length ? courseIds.map(courseName).join(' · ') : 'sem disciplina' },
              { label: 'abordagem', value: approachName || 'sem abordagem' },
              { label: 'autores', value: authorIds.length ? authors.filter((a) => authorIds.includes(a.id)).map((a) => a.name).join(' · ') : 'sem autores' },
              { label: 'tags', value: tags.join(' · ') },
            ]}
          />
        </div>
      ),
    },
  ];

  const handleSave = () => {
    handleAddConcept({
      id: 'con-' + Date.now(),
      name: name.trim(),
      definition: definition.trim() || 'conceito registrado no meu caderno.',
      approachId: approachId || undefined,
      authorIds,
      courseIds: courseIds.length ? courseIds : [wizardCourseId || courses[0]?.id || 'c1'],
      tags,
    });
    hapticSuccess();
    closeWizard();
    showToast('conceito guardado no cantinho ♡');
  };

  return (
    <WizardScaffold
      title="novo conceito"
      icon={<Sparkles className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={name.trim().length > 0}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel="guardar conceito ♡"
    />
  );
};
