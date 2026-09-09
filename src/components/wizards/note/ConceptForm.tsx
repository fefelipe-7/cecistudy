// Wizard "transformar nota" — formulário de conceito (MOD-001 / B.5).
import React from 'react';
import type { PsychologyApproach, PsychologyAuthor, Course } from '../../../types';
import { Picker } from '../../ui/Picker';
import { PillGroupMulti } from '../../ui/PillGroupMulti';
import { TagField } from '../../ui/TagField';
import { FieldLabel, TextArea, TextInput } from '../wizardFields';

interface ConceptFormProps {
  name: string;
  onNameChange: (v: string) => void;
  definition: string;
  onDefinitionChange: (v: string) => void;
  approaches: PsychologyApproach[];
  approachId: string;
  onApproachIdChange: (v: string) => void;
  authors: PsychologyAuthor[];
  authorIds: string[];
  onAuthorIdsChange: (ids: string[]) => void;
  courses: Course[];
  courseIds: string[];
  onCourseIdsChange: (ids: string[]) => void;
  tags: string[];
  onTagsChange: (t: string[]) => void;
}

const ConceptForm: React.FC<ConceptFormProps> = ({
  name,
  onNameChange,
  definition,
  onDefinitionChange,
  approaches,
  approachId,
  onApproachIdChange,
  authors,
  authorIds,
  onAuthorIdsChange,
  courses,
  courseIds,
  onCourseIdsChange,
  tags,
  onTagsChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={name}
      onChange={(e) => onNameChange(e.target.value)}
      placeholder="nome do conceito"
      autoFocus
    />
    <div>
      <FieldLabel>definição</FieldLabel>
      <TextArea
        rows={4}
        value={definition}
        onChange={(e) => onDefinitionChange(e.target.value)}
        placeholder="o que é esse conceito?"
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
    <PillGroupMulti
      variant="rose"
      label="autores relacionados"
      options={authors.map((x) => ({ value: x.id, label: x.name }))}
      value={authorIds}
      onChange={onAuthorIdsChange}
    />
    <PillGroupMulti
      variant="rose"
      label="disciplinas"
      options={courses.map((x) => ({ value: x.id, label: x.name }))}
      value={courseIds}
      onChange={onCourseIdsChange}
    />
    <TagField
      tags={tags}
      onChange={onTagsChange}
      placeholder="tags do conceito (ex: ansiedade)"
      emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
    />
  </div>
);

export default ConceptForm;