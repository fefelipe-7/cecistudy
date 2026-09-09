// Wizard "transformar nota" — formulário de material (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
import type { MaterialItem } from '../../../types';
import { ChoiceCardGrid } from '../../ui/ChoiceCardGrid';
import { TagField } from '../../ui/TagField';
import { TextInput } from '../wizardFields';
import { MATERIAL_TYPES } from './constants';

interface MaterialFormProps {
  title: string;
  onTitleChange: (v: string) => void;
  type: MaterialItem['type'];
  onTypeChange: (v: MaterialItem['type']) => void;
  author: string;
  onAuthorChange: (v: string) => void;
  courseSelect: ReactNode;
  url: string;
  onUrlChange: (v: string) => void;
  tags: string[];
  onTagsChange: (t: string[]) => void;
}

const MaterialForm: React.FC<MaterialFormProps> = ({
  title,
  onTitleChange,
  type,
  onTypeChange,
  author,
  onAuthorChange,
  courseSelect,
  url,
  onUrlChange,
  tags,
  onTagsChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      placeholder="título do material"
      autoFocus
    />
    <ChoiceCardGrid
      label="tipo"
      options={MATERIAL_TYPES}
      value={type}
      onChange={onTypeChange}
    />
    <TextInput
      value={author}
      onChange={(e) => onAuthorChange(e.target.value)}
      placeholder="autor(a)"
    />
    {courseSelect}
    <TextInput
      value={url}
      onChange={(e) => onUrlChange(e.target.value)}
      placeholder="link (se houver)"
    />
    <TagField
      tags={tags}
      onChange={onTagsChange}
      placeholder="tags do material"
      emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
    />
  </div>
);

export default MaterialForm;