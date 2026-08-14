import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';

const STEPS = ['nota da aula', 'conteúdo da aula'] as const;

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

  const toggleId = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const Chip = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
        selected
          ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand shadow-2xs'
          : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-rose'
      }`}
    >
      {label}
    </button>
  );

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
    });
    closeComposeDetails();
    showToast('aula completa no diário ♡');
  };

  return (
    <div className="min-h-[70vh] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={closeComposeDetails}
            className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="voltar"
            aria-label="voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1 className="font-display font-bold text-sm text-ceci-primary truncate">
            detalhes da aula
          </h1>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[14px] text-xs font-bold bg-ceci-brand-strong hover:bg-ceci-brand-hover text-white shadow-2xs transition-all active:scale-95 min-h-[44px] cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>salvar</span>
          </button>
        </div>
      </div>

      {/* Progresso do wizard */}
      <div className="flex items-center gap-2 pt-3">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              step === i
                ? 'bg-ceci-primary text-white shadow-2xs'
                : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-rose'
            }`}
          >
            {i + 1} · {s}
          </button>
        ))}
      </div>

      {/* Corpo */}
      <div className="pt-4 space-y-4">
        {step === 0 && (
          <>
            <div>
              <label className="block text-xs font-medium text-ceci-secondary mb-1">título da aula</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Aula sobre transtornos de ansiedade"
                className="w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2.5 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ceci-secondary mb-1">número da aula</label>
                <input
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2.5 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ceci-secondary mb-1">data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2.5 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ceci-secondary mb-1">anotações da aula</label>
              <textarea
                rows={8}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="os pontos principais discutidos em sala..."
                className="w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-3 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none leading-relaxed"
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-ceci-secondary">conceitos abordados</label>
              <div className="flex flex-wrap gap-1.5">
                {concepts.length === 0 && (
                  <span className="text-[11px] text-ceci-tertiary">ainda não há conceitos no cantinho.</span>
                )}
                {concepts.map((c) => (
                  <Chip
                    key={c.id}
                    selected={conceptIds.includes(c.id)}
                    onClick={() => toggleId(conceptIds, setConceptIds, c.id)}
                    label={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-ceci-secondary">abordagens presentes</label>
              <div className="flex flex-wrap gap-1.5">
                {approaches.length === 0 && (
                  <span className="text-[11px] text-ceci-tertiary">ainda não há abordagens registradas.</span>
                )}
                {approaches.map((a) => (
                  <Chip
                    key={a.id}
                    selected={approachIds.includes(a.id)}
                    onClick={() => toggleId(approachIds, setApproachIds, a.id)}
                    label={a.shortName || a.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-ceci-secondary">autores citados</label>
              <div className="flex flex-wrap gap-1.5">
                {authors.length === 0 && (
                  <span className="text-[11px] text-ceci-tertiary">ainda não há autores no cantinho.</span>
                )}
                {authors.map((a) => (
                  <Chip
                    key={a.id}
                    selected={authorIds.includes(a.id)}
                    onClick={() => toggleId(authorIds, setAuthorIds, a.id)}
                    label={a.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-ceci-secondary">materiais de apoio</label>
              <div className="flex flex-wrap gap-1.5">
                {materials.length === 0 && (
                  <span className="text-[11px] text-ceci-tertiary">ainda não há materiais guardados.</span>
                )}
                {materials.map((m) => (
                  <Chip
                    key={m.id}
                    selected={materialIds.includes(m.id)}
                    onClick={() => toggleId(materialIds, setMaterialIds, m.id)}
                    label={m.title}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-white rounded-2xl border border-ceci-border-default px-4 py-3 shadow-2xs">
              <div>
                <p className="text-xs font-bold text-ceci-primary">ficou com dúvidas?</p>
                <p className="text-[11px] text-ceci-secondary">marca aqui para revisar depois</p>
              </div>
              <button
                onClick={() => setHasQuestions(!hasQuestions)}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                  hasQuestions ? 'bg-ceci-brand-strong' : 'bg-ceci-border-default'
                }`}
                aria-label={hasQuestions ? 'tem dúvidas' : 'sem dúvidas'}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-all ${
                    hasQuestions ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navegação do wizard */}
      <div className="flex items-center justify-between gap-2 pt-5 mt-auto">
        <button
          onClick={() => setStep(0)}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>passo 1</span>
        </button>

        {step === 0 ? (
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-primary-hover text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer"
          >
            <span>conteúdo da aula</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-ceci-brand-strong text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>salvar detalhes</span>
          </button>
        )}
      </div>
    </div>
  );
};