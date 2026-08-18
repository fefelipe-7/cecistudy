import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import {
  ReviewCard,
  TextArea,
  TextInput,
} from './wizardFields';
import { Picker } from '../ui/Picker';
import { TagField } from '../ui/TagField';

export const AuthorWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const { approaches, authors, handleAddAuthor, handleUpdateAuthor, closeWizard, showToast } = useApp();
  const editingAuthor = editing?.kind === 'author'
    ? authors.find((a) => a.id === editing.id)
    : undefined;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(editingAuthor?.name ?? '');
  const [bio, setBio] = useState(editingAuthor?.bio ?? '');
  const [lifespan, setLifespan] = useState(editingAuthor?.lifespan ?? '');
  const [approachId, setApproachId] = useState(editingAuthor?.approachId ?? '');
  const [keyConcepts, setKeyConcepts] = useState<string[]>(editingAuthor?.keyConcepts ?? []);
  const [majorWorks, setMajorWorks] = useState<string[]>(editingAuthor?.majorWorks ?? []);

  const approachName = approaches.find((a) => a.id === approachId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'autor-nome',
      title: 'nome',
      headline: 'quem é esse autor?',
      content: (
        <div className="space-y-4">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="nome do autor — ex: aaron beck"
            autoFocus
          />
          <TextInput
            value={lifespan}
            onChange={(e) => setLifespan(e.target.value)}
            placeholder="lifespan (opcional) — ex: 1921–2021"
          />
        </div>
      ),
    },
    {
      id: 'autor-bio',
      title: 'biografia',
      headline: 'conta um pouco sobre ele.',
      content: (
        <div className="space-y-4">
          <TextArea
            rows={6}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="a biografia e a contribuição dele para a psicologia..."
          />
          <Picker
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
      headline: 'quais obras e ideias são dele?',
      content: (
        <div className="space-y-5">
          <TagField
            label="obras principais"
            tags={majorWorks}
            onChange={setMajorWorks}
            placeholder="ex: terapia cognitiva da depressão"
            emptyMessage="não precisa preencher tudo ♡"
          />
          <TagField
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
      headline: 'confere se está tudo certinho ♡',
      content: (
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
      ),
    },
  ];

  const handleSave = () => {
    if (editingAuthor) {
      handleUpdateAuthor({
        ...editingAuthor,
        name: name.trim(),
        bio: bio.trim() || 'autor estudado na minha jornada de psicologia.',
        lifespan: lifespan.trim() || undefined,
        approachId: approachId || undefined,
        keyConcepts,
        majorWorks,
      });
      hapticSuccess();
      closeWizard();
      showToast('autor atualizado ♡');
      return;
    }
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
      title={editing ? 'editar autor' : 'novo autor'}
      icon={<UserCheck className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={name.trim().length > 0}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar autor ♡'}
    />
  );
};
