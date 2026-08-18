import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';
import { StarRating } from '../ui/StarRating';
import { WizardScaffold, type WizardStep } from '../wizards/WizardScaffold';
import { DateInput, FieldLabel, TextArea, TextInput } from '../wizards/wizardFields';
import { PillGroupMulti } from '../ui/PillGroupMulti';
import { ToggleRow } from '../ui/ToggleRow';

export const ClassNoteDetailWizard: React.FC = () => {
  const {
    classes,
    concepts,
    approaches,
    authors,
    materials,
    wizardNoteId,
    handleUpdateClassNote,
    closeComposeDetails,
    showToast,
  } = useApp();

  const note = useMemo(
    () => classes.find((c) => c.id === wizardNoteId) ?? null,
    [classes, wizardNoteId]
  );

  const [step, setStep] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState<number>(1);
  const [date, setDate] = useState('');
  const [summary, setSummary] = useState('');
  const [conceptIds, setConceptIds] = useState<string[]>([]);
  const [approachIds, setApproachIds] = useState<string[]>([]);
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const [hasQuestions, setHasQuestions] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setNumber(note.number ?? 1);
    setDate(note.date || new Date().toISOString().split('T')[0]);
    setSummary(note.fullNotes ?? note.summary);
    setConceptIds(note.conceptIds ?? []);
    setApproachIds(note.approachIds ?? []);
    setAuthorIds(note.authorIds ?? []);
    setMaterialIds(note.materials ?? []);
    setHasQuestions(!!note.hasQuestions);
    setRating(note.rating ?? 0);
  }, [note]);

  if (!note) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-xs text-ceci-secondary">essa anotação não foi encontrada.</p>
        <button
          onClick={closeComposeDetails}
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
      headline: 'vamos dar um nome pra essa aula.',
      content: (
        <div className="space-y-4">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex.: transtornos de ansiedade"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>número da aula</FieldLabel>
              <TextInput
                type="number"
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <FieldLabel>data</FieldLabel>
              <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'anotacoes',
      title: 'anotações',
      headline: 'o que você quer guardar da aula?',
      content: (
        <TextArea
          rows={12}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="os pontos principais discutidos em sala..."
        />
      ),
    },
    {
      id: 'teoria',
      title: 'teoria',
      headline: 'que teorias apareceram na aula?',
      content: (
        <div className="space-y-5">
          <PillGroupMulti
            label="conceitos abordados"
            variant="rose"
            options={concepts.map((c) => ({ value: c.id, label: c.name }))}
            value={conceptIds}
            onChange={setConceptIds}
          />

          <PillGroupMulti
            label="abordagens presentes"
            variant="rose"
            options={approaches.map((a) => ({ value: a.id, label: a.shortName || a.name }))}
            value={approachIds}
            onChange={setApproachIds}
          />
        </div>
      ),
    },
    {
      id: 'referencias',
      title: 'referências',
      headline: 'quais autores e materiais sustentam?',
      content: (
        <div className="space-y-5">
          <PillGroupMulti
            label="autores citados"
            variant="rose"
            options={authors.map((a) => ({ value: a.id, label: a.name }))}
            value={authorIds}
            onChange={setAuthorIds}
          />

          <PillGroupMulti
            label="materiais de apoio"
            variant="rose"
            options={materials.map((m) => ({ value: m.id, label: m.title }))}
            value={materialIds}
            onChange={setMaterialIds}
          />
        </div>
      ),
    },
    {
      id: 'avaliacao',
      title: 'avaliação',
      headline: 'como foi essa aula pra você?',
      content: (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-ceci-border-default px-4 py-4 shadow-2xs space-y-2">
            <p className="text-xs font-bold text-ceci-primary">sua avaliação da aula</p>
            <p className="text-[11px] text-ceci-secondary">ajuda a classificar melhor as aulas no seu diário.</p>
            <StarRating value={rating} onChange={setRating} showLabel />
          </div>

          <ToggleRow
            label="ficou com dúvidas?"
            description="marca aqui para revisar depois"
            checked={hasQuestions}
            onChange={() => setHasQuestions(!hasQuestions)}
            className="bg-white rounded-2xl border border-ceci-border-default px-4 py-3 shadow-2xs"
          />
        </div>
      ),
    },
  ];

  const canNext = step === 0 ? title.trim().length > 0 : true;

  const handleSave = () => {
    hapticSuccess();
    handleUpdateClassNote({
      ...note,
      title: title.trim() || note.title,
      number: number || note.number,
      date: date || note.date,
      summary: summary.trim() || note.summary,
      fullNotes: summary.trim() || note.fullNotes,
      conceptIds,
      approachIds,
      authorIds,
      materials: materialIds,
      hasQuestions,
      rating: rating || undefined,
    });
    closeComposeDetails();
    showToast('aula completa no diário ♡');
  };

  return (
    <WizardScaffold
      title="detalhes da aula"
      icon={<FileText className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      onSave={handleSave}
      onClose={closeComposeDetails}
      saveLabel="concluir & guardar ♡"
    />
  );
};