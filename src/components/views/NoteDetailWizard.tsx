import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { LooseNote } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from '../wizards/WizardScaffold';
import {
  ChipPicker,
  FieldLabel,
  MultiChipPicker,
  ReviewCard,
  SelectField,
  TextArea,
  TextInput,
} from '../wizards/wizardFields';

const CATEGORY_OPTIONS: { value: LooseNote['category']; label: string; emoji?: string }[] = [
  { value: 'reflexão', label: 'reflexão', emoji: '🌷' },
  { value: 'estudo', label: 'estudo', emoji: '📚' },
  { value: 'ideia', label: 'ideia', emoji: '💡' },
  { value: 'lembrete', label: 'lembrete', emoji: '⏰' },
];

export const NoteDetailWizard: React.FC = () => {
  const {
    focusedNote,
    courses,
    concepts,
    authors,
    approaches,
    materials,
    updateLooseNote,
    closeNoteDetail,
    closeAllNoteScreens,
    openNoteTransform,
    showToast,
  } = useApp();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LooseNote['category']>('reflexão');
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState('');
  const [conceptIds, setConceptIds] = useState<string[]>([]);
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [approachIds, setApproachIds] = useState<string[]>([]);
  const [materialIds, setMaterialIds] = useState<string[]>([]);

  useEffect(() => {
    if (!focusedNote) return;
    setTitle(focusedNote.title);
    setCategory(focusedNote.category);
    setContent(focusedNote.content);
    setCourseId(focusedNote.courseId ?? '');
    setConceptIds(focusedNote.conceptIds ?? []);
    setAuthorIds(focusedNote.authorIds ?? []);
    setApproachIds(focusedNote.approachIds ?? []);
    setMaterialIds(focusedNote.materialIds ?? []);
  }, [focusedNote]);

  const courseName = useMemo(
    () => courses.find((c) => c.id === courseId)?.name ?? '',
    [courses, courseId]
  );
  const conceptNames = useMemo(
    () => concepts.filter((c) => conceptIds.includes(c.id)).map((c) => c.name),
    [concepts, conceptIds]
  );
  const authorNames = useMemo(
    () => authors.filter((a) => authorIds.includes(a.id)).map((a) => a.name),
    [authors, authorIds]
  );
  const approachNames = useMemo(
    () => approaches.filter((a) => approachIds.includes(a.id)).map((a) => a.shortName || a.name),
    [approaches, approachIds]
  );
  const materialNames = useMemo(
    () => materials.filter((m) => materialIds.includes(m.id)).map((m) => m.title),
    [materials, materialIds]
  );

  if (!focusedNote) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-xs text-ceci-secondary">essa nota não foi encontrada.</p>
        <button
          onClick={closeNoteDetail}
          className="px-4 py-2 bg-ceci-primary text-white rounded-full text-xs font-bold cursor-pointer"
        >
          voltar
        </button>
      </div>
    );
  }

  const steps: WizardStep[] = [
    {
      id: 'identificacao',
      title: 'identificação',
      headline: 'vamos dar uma cara pra essa nota.',
      content: (
        <div className="space-y-4">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="título da nota"
            autoFocus
          />
          <ChipPicker
            label="categoria"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
          />
          <div>
            <FieldLabel>conteúdo</FieldLabel>
            <TextArea
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="escreva o que você quer guardar..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'vinculos',
      title: 'vínculos',
      headline: 'o que essa nota tem a ver com o cantinho?',
      content: (
        <div className="space-y-5">
          <SelectField
            label="matéria relacionada"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="nenhuma matéria por enquanto"
            emptyMessage="ainda não há matérias cadastradas."
          />

          <div className="space-y-2">
            {concepts.length > 0 ? (
              <MultiChipPicker
                label="conceitos"
                options={concepts.map((c) => ({ value: c.id, label: c.name }))}
                values={conceptIds}
                onChange={setConceptIds}
              />
            ) : (
              <span className="text-[11px] text-ceci-tertiary">ainda não há conceitos no cantinho.</span>
            )}
          </div>

          <div className="space-y-2">
            {authors.length > 0 ? (
              <MultiChipPicker
                label="autores"
                options={authors.map((a) => ({ value: a.id, label: a.name }))}
                values={authorIds}
                onChange={setAuthorIds}
              />
            ) : (
              <span className="text-[11px] text-ceci-tertiary">ainda não há autores no cantinho.</span>
            )}
          </div>

          <div className="space-y-2">
            {approaches.length > 0 ? (
              <MultiChipPicker
                label="abordagens"
                options={approaches.map((a) => ({ value: a.id, label: a.shortName || a.name }))}
                values={approachIds}
                onChange={setApproachIds}
              />
            ) : (
              <span className="text-[11px] text-ceci-tertiary">ainda não há abordagens registradas.</span>
            )}
          </div>

          <div className="space-y-2">
            {materials.length > 0 ? (
              <MultiChipPicker
                label="materiais"
                options={materials.map((m) => ({ value: m.id, label: m.title }))}
                values={materialIds}
                onChange={setMaterialIds}
              />
            ) : (
              <span className="text-[11px] text-ceci-tertiary">ainda não há materiais guardados.</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <div className="space-y-3">
          <ReviewCard
            rows={[
              { label: 'título', value: title.trim() },
              { label: 'categoria', value: category },
              {
                label: 'conteúdo',
                value: content.trim() ? `${content.trim().slice(0, 80)}${content.trim().length > 80 ? '…' : ''}` : '—',
              },
              { label: 'matéria', value: courseName },
              { label: 'conceitos', value: conceptNames.join(' · ') },
              { label: 'autores', value: authorNames.join(' · ') },
              { label: 'abordagens', value: approachNames.join(' · ') },
              { label: 'materiais', value: materialNames.join(' · ') },
            ]}
          />
          <button
            onClick={() => {
              persistEdits();
              openNoteTransform(focusedNote.id);
            }}
            className="w-full text-center text-xs font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand py-3 rounded-2xl cursor-pointer transition-colors hover:bg-ceci-border-brand/60"
          >
            transformar essa nota em outra coisa →
          </button>
        </div>
      ),
    },
  ];

  const persistEdits = () => {
    if (!focusedNote) return;
    updateLooseNote(focusedNote.id, {
      title: title.trim() || focusedNote.title,
      category,
      content: content.trim(),
      courseId: courseId || undefined,
      conceptIds,
      authorIds,
      approachIds,
      materialIds,
    });
  };

  const canNext = step === 0 ? title.trim().length > 0 || content.trim().length > 0 : true;

  const handleSave = () => {
    persistEdits();
    hapticSuccess();
    closeNoteDetail();
    showToast('nota guardada com carinho ♡');
  };

  return (
    <WizardScaffold
      title="detalhes da nota"
      icon={<FileText className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      onSave={handleSave}
      onClose={closeNoteDetail}
      saveLabel="guardar nota ♡"
    />
  );
};