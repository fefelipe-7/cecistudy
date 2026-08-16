import React from 'react';
import { GraduationCap, PencilLine, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../ui/ProgressBar';
import { Kitty } from '../ui/Kitty';

/** Tela cheia do meu TCC — visualização + botão de edição (criar/manter). */
export const TccView: React.FC = () => {
  const { tcc, openEditTcc, handleUpdateTcc, showToast } = useApp();

  const hasTcc = tcc.title.trim().length > 0;
  const chaptersDone = tcc.chapters.filter((ch) => ch.completed).length;
  const chaptersTotal = tcc.chapters.length;
  const statusLabel =
    tcc.status === 'concluido' ? 'concluído' : tcc.status === 'revisao' ? 'em revisão' : 'em andamento';

  const handleToggleChapter = (index: number) => {
    const updatedChapters = [...tcc.chapters];
    updatedChapters[index].completed = !updatedChapters[index].completed;
    handleUpdateTcc({ ...tcc, chapters: updatedChapters });
    if (updatedChapters[index].completed) showToast('capítulo guardado ♡');
  };

  return (
    <div className="space-y-4 pb-1">
      {/* Cabeçalho da tela */}
      <div className="flex items-center justify-between gap-3 rounded-[24px] p-4 bg-white border border-ceci-border-default shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-ceci-primary leading-tight">
              meu tcc
            </h2>
            <p className="text-[11px] text-ceci-secondary">plantando e cuidando do seu trabalho ♡</p>
          </div>
        </div>
        <button
          onClick={openEditTcc}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-ceci-brand-strong text-white px-3.5 py-2 rounded-xl text-xs font-medium shadow-2xs transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <PencilLine className="w-3.5 h-3.5" />
          {hasTcc ? 'editar tcc' : 'criar tcc'}
        </button>
      </div>

      {!hasTcc ? (
        <div className="rounded-[24px] p-8 bg-white border border-ceci-border-default shadow-sm text-center space-y-3">
          <Kitty expression="curiosa" className="w-16 h-16 mx-auto" decorative />
          <h3 className="font-display font-bold text-lg text-ceci-primary">
            ainda não tem tcc
          </h3>
          <p className="text-xs text-ceci-secondary leading-relaxed max-w-xs mx-auto">
            que tal começar a plantar o seu trabalho de conclusão? um título, uma pergunta e
            o caminho vai se desenhando com carinho.
          </p>
          <button
            onClick={openEditTcc}
            className="mt-2 inline-flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-primary-hover text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            <PencilLine className="w-4 h-4" />
            bora começar?
          </button>
        </div>
      ) : (
        <>
          {/* Resumo do trabalho */}
          <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-3">
            <div className="border-b border-ceci-border-subtle pb-3 space-y-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand">
                tcc • {statusLabel}
              </span>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ceci-primary leading-snug">
                {tcc.title}
              </h2>
              <p className="text-xs text-ceci-secondary">
                orientadora: <span className="font-semibold text-ceci-primary">{tcc.advisor || '—'}</span>
                {tcc.field && <> • área: {tcc.field}</>}
              </p>
            </div>

            <div className="bg-surface-muted p-4 rounded-2xl border border-ceci-border-default space-y-3 text-xs">
              {tcc.problemStatement && (
                <div>
                  <p className="font-semibold text-ceci-primary mb-1">problema de pesquisa:</p>
                  <p className="text-ceci-secondary leading-relaxed">{tcc.problemStatement}</p>
                </div>
              )}
              {tcc.objectives.length > 0 && (
                <div>
                  <p className="font-semibold text-ceci-primary mb-1">objetivos:</p>
                  <ul className="list-disc pl-4 space-y-1 text-ceci-secondary">
                    {tcc.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Cronograma de capítulos */}
          <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ceci-primary">
                cronograma de capítulos
              </h3>
              <span className="text-[11px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
                {chaptersDone}/{chaptersTotal}
              </span>
            </div>

            <ProgressBar value={chaptersTotal ? Math.round((chaptersDone / chaptersTotal) * 100) : 0} />

            {tcc.chapters.length > 0 ? (
              <div className="space-y-2 pt-1">
                {tcc.chapters.map((ch, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleChapter(idx)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer tap-interactive ${
                      ch.completed
                        ? 'bg-surface-blue/60 border-ceci-border-academic text-ceci-academic-strong'
                        : 'bg-white border-ceci-border-default hover:border-ceci-border-brand'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`w-5 h-5 ${ch.completed ? 'text-success-leaf' : 'text-ceci-faded'}`} />
                      <span className={`text-xs font-medium ${ch.completed ? 'line-through text-ceci-tertiary' : 'text-ceci-primary'}`}>
                        {ch.title}
                      </span>
                    </div>
                    {ch.dueDate && (
                      <span className="text-[10px] text-ceci-secondary">prazo: {ch.dueDate}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ceci-secondary bg-surface-muted border border-ceci-border-subtle rounded-2xl p-4 text-center flex items-center justify-center gap-2">
                <Kitty expression="pensativa" className="w-7 h-7 shrink-0" decorative />
                ainda não tem capítulos no cronograma — edite o tcc para adicionar os primeiros ♡
              </p>
            )}
          </div>

          {/* Referências */}
          {tcc.references.length > 0 && (
            <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-3">
              <h3 className="font-display font-bold text-base text-ceci-primary">
                referências utilizadas (abnt)
              </h3>
              <div className="space-y-1.5 text-xs text-ceci-secondary">
                {tcc.references.map((ref, idx) => (
                  <p key={idx} className="bg-surface-muted p-2.5 rounded-xl border border-ceci-border-default font-mono text-[11px] text-ceci-primary">
                    {ref}
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};