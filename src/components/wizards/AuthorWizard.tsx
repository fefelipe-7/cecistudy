import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  FieldLabel,
  ReviewCard,
  SelectField,
  TagInput,
  TextArea,
  TextInput,
} from './wizardFields';

export const AuthorWizard: React.FC = () => {
  const { approaches, handleAddAuthor, closeWizard, showToast } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [lifespan, setLifespan] = useState('');
  const [approachId, setApproachId] = useState('');
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [majorWorks, setMajorWorks] = useState<string[]>([]);

  const approachName = approaches.find((a) => a.id === approachId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'autor-nome',
      title: 'nome',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>nome do autor</FieldLabel>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: aaron beck"
              autoFocus
            />
          </div>
          <div>
            <FieldLabel>lifespan (opcional)</FieldLabel>
            <TextInput
              value={lifespan}
              onChange={(e) => setLifespan(e.target.value)}
              placeholder="ex: 1921–2021"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'autor-bio',
      title: 'biografia',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>biografia / contribuição</FieldLabel>
            <TextArea
              rows={6}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="conte um pouco sobre o autor e a obra dele..."
            />
          </div>
          <SelectField
            label="abordagem (opcional)"
            value={approachId}
            onChange={setApproachId}
            options={approaches.map((a) => ({ value: a.id, label: a.name }))}
            emptyMessage="ainda não há abordagens registradas."
          />
        </div>
      ),
    },
    {
      id: 'autor-obras',
      title: 'obras & ideias',
      content: (
        <div className="space-y-5">
          <TagInput
            label="obras principais"
            tags={majorWorks}
            onChange={setMajorWorks}
            placeholder="ex: terapia cognitiva da depressão"
            emptyMessage="não precisa preencher tudo ♡"
          />
          <TagInput
            label="conceitos-chave"
            tags={keyConcepts}
            onChange={setKeyConcepts}
            placeholder="ex: tríade cognitiva"
          />
        </div>
      ),
    },
    {
      id: 'autor-revisar',
      title: 'revisar',
      content: (
        <div className="space-y-3">
          <p className="text-xs font-medium text-ceci-secondary">
            confere se está tudo certinho antes de guardar:
          </p>
          <ReviewCard
            rows={[
              { label: 'autor', value: name.trim() },
              { label: 'lifespan', value: lifespan.trim() || '—' },
              { label: 'biografia', value: bio.trim() },
              { label: 'abordagem', value: approachName || 'sem abordagem' },
              { label: 'obras principais', value: majorWorks.length ? majorWorks.join(' · ') : 'sem obras' },
              { label: 'conceitos-chave', value: keyConcepts.length ? keyConcepts.join(' · ') : 'sem conceitos' },
            ]}
          />
        </div>
      ),
    },
  ];

  const handleSave = () => {
    handleAddAuthor({
      id: 'aut-' + Date.now(),
      name: name.trim(),
      bio: bio.trim() || 'autor estudado na minha jornada de psicologia.',
      lifespan: lifespan.trim() || undefined,
      approachId: approachId || undefined,
      keyConcepts,
      majorWorks,
    });
    hapticSuccess();
    closeWizard();
    showToast('autor guardado no cantinho ♡');
  };

  return (
    <WizardScaffold
      title="novo autor"
      icon={<UserCheck className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={name.trim().length > 0}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel="guardar autor ♡"
    />
  );
};
