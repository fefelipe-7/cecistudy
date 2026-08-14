import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';
import { StarRating } from '../ui/StarRating';
import { IOS_EASE } from '../../lib/motion';

const STEPS = [
  { key: 'identificacao', label: 'identificação', hint: 'dá um nome e localiza a aula no tempo' },
  { key: 'anotacoes', label: 'anotações', hint: 'o conteúdo que você quer guardar da aula' },
  { key: 'teoria', label: 'teoria', hint: 'conceitos e abordagens que apareceram na aula' },
  { key: 'referencias', label: 'referências', hint: 'autores e materiais que sustentam o conteúdo' },
  { key: 'avaliacao', label: 'avaliação', hint: 'como foi essa aula para você?' },
] as const;

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

  const isLastStep = step === STEPS.length - 1;
  const canContinue = step === 0 ? title.trim().length > 0 : true;

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

  const inputClass =
    'w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2.5 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500';

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

          <span className="w-9 h-9 shrink-0" aria-hidden />
        </div>

        {/* Progresso (não interativo — fluxo linear) */}
        <div className="max-w-md sm:max-w-xl mx-auto pt-3">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? 'bg-ceci-brand-strong' : 'bg-ceci-border-default'
                }`}
              />
            ))}
          </div>
          <div className="flex items-baseline gap-2 pt-2">
            <p className="text-[11px] font-semibold text-ceci-brand-strong lowercase">
              passo {step + 1} de {STEPS.length} · {STEPS[step].label}
            </p>
          </div>
          <p className="text-[11px] text-ceci-secondary pt-0.5">{STEPS[step].hint}</p>
        </div>
      </div>

      {/* Corpo — um passo por vez */}
      <div className="pt-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: IOS_EASE }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ceci-secondary mb-1.5">título da aula</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex.: transtornos de ansiedade"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ceci-secondary mb-1.5">número da aula</label>
                    <input
                      type="number"
                      value={number}
                      onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ceci-secondary mb-1.5">data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <label className="block text-xs font-medium text-ceci-secondary mb-1.5">anotações da aula</label>
                <textarea
                  rows={12}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="os pontos principais discutidos em sala..."
                  className="w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-3 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none leading-relaxed"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
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
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
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
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-ceci-border-default px-4 py-4 shadow-2xs space-y-2">
                  <p className="text-xs font-bold text-ceci-primary">como foi essa aula?</p>
                  <p className="text-[11px] text-ceci-secondary">sua avaliação ajuda a classificar melhor as aulas.</p>
                  <StarRating value={rating} onChange={setRating} showLabel />
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
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegação linear */}
      <div className="flex items-center justify-between gap-2 pt-6 mt-auto">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>voltar</span>
        </button>

        {isLastStep ? (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-ceci-brand-strong text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>concluir & guardar</span>
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canContinue}
            className="flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-primary-hover text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>continuar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
