// Wizard "transformar nota" — formulário de autor (MOD-001 / B.5).
import React from 'react';
import type { PsychologyApproach } from '../../../types';
import { Picker } from '../../ui/Picker';
import { TagField } from '../../ui/TagField';
import { FieldLabel, TextArea, TextInput } from '../wizardFields';

interface AuthorFormProps {
  name: string;
  onNameChange: (v: string) => void;
  bio: string;
  onBioChange: (v: string) => void;
  approaches: PsychologyApproach[];
  approachId: string;
  onApproachIdChange: (v: string) => void;
  keyConcepts: string[];
  onKeyConceptsChange: (t: string[]) => void;
  majorWorks: string[];
  onMajorWorksChange: (t: string[]) => void;
}

const AuthorForm: React.FC<AuthorFormProps> = ({
  name,
  onNameChange,
  bio,
  onBioChange,
  approaches,
  approachId,
  onApproachIdChange,
  keyConcepts,
  onKeyConceptsChange,
  majorWorks,
  onMajorWorksChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={name}
      onChange={(e) => onNameChange(e.target.value)}
      placeholder="nome do autor"
      autoFocus
    />
    <div>
      <FieldLabel>bio / contribuição</FieldLabel>
      <TextArea
        rows={4}
        value={bio}
        onChange={(e) => onBioChange(e.target.value)}
        placeholder="o que você quer lembrar dele(a)?"
      />
    </div>
    <Picker
      label="abordagem (opcional)"
      value={approachId}
      onChange={onApproachIdChange}
      options={approaches.map((x) => ({ value: x.id, label: x.shortName || x.name }))}
      placeholder="sem abordagem"
      emptyMessage="ainda não há abordagens registradas."
    />
    <TagField
      tags={keyConcepts}
      onChange={onKeyConceptsChange}
      placeholder="conceitos-chave"
      emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
    />
    <TagField
      tags={majorWorks}
      onChange={onMajorWorksChange}
      placeholder="obras principais"
      emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
    />
  </div>
);

export default AuthorForm;