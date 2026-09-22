import React from 'react';
import {
  BookOpen,
  HelpCircle,
  Paperclip,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Mascote } from '../ui/Mascote';
import { StarRating, RATING_LABELS } from '../ui/StarRating';
import { CourseIcon } from '../ui/CourseIcon';
import { FixedBottomBar } from '../ui/FixedBottomBar';
import { useMobileApp } from '@/context/mobileApp';
import { formatShortDate } from '../../lib/schedule';

/** Perguntas-guia da reflexão (não são persistidas — são um convite à revisão). */
const REFLECTION_PROMPTS = [
  'o que desta aula você quer levar para a revisão?',
  'se alguém te pedisse o resumo em uma frase, o que você responderia?',
  'como essa aula conversa com o que você já sabia dessa área?',
  'tem uma aplicação prática que você quer experimentar?',
];

/**
 * Detalhe full-screen de uma aula (`#/faculdade/:courseId/aula/:classNoteId`),
 * empilhado sobre o curso da matéria. Substitui o antigo ClassNoteModal: abre
 * tudo na tela, com hero da disciplina, reflexão guiada e avaliação interativa.
 */
export const ClassNoteDetailScreen: React.FC = () => {
  const {
    focusedClassNote: note,
    focusedCourse: course,
    concepts,
    authors,
    handleUpdateClassNote,
    editManagedItem,
    openManageItem,
    closeClassNoteDetail,
  } = useMobileApp();

  if (!note) {
    return (
      <div className="px-5 py-12 text-center space-y-4">
        <Mascote expression="no-results" className="w-16 h-16 mx-auto" decorative />
        <p className="text-xs font-semibold text-ceci-primary">essa anotação não está mais aqui</p>
        <button
          onClick={closeClassNoteDetail}
          className="px-4 py-2 bg-ceci-primary text-ceci-on-primary rounded-full text-xs font-bold cursor-pointer"
        >
          voltar para a matéria
        </button>
      </div>
    );
  }

  const noteConcepts = (note.conceptIds ?? [])
    .map((id) => concepts.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const noteAuthors = (note.authorIds ?? [])
    .map((id) => authors.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a);
  const materials = note.materials ?? [];

  const handleRate = (value: number) => {
    handleUpdateClassNote({ ...note, rating: value });
  };

  return (
    <div className="px-4 pb-32 space-y-5">
      {/* Hero da aula — cor da disciplina como detalhe lateral */}
      <section className="relative overflow-hidden rounded-[28px] border border-ceci-border-default bg-surface-default p-4 pl-5 space-y-3">
        <span
          aria-hidden
          className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full"
          style={{ background: course?.color ?? '#D85F79' }}
        />
        <div className="flex items-center justify-between gap-2 flex-wrap pr-1">
          <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
            aula {note.number} • {formatShortDate(note.date)}
          </span>
          <span className="text-[11px] font-medium text-ceci-tertiary">
            {course?.name ?? 'anotação de aula'}
          </span>
        </div>

        <div className="flex items-start gap-3 pr-1">
          <div className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center shrink-0">
            <CourseIcon icon={course?.icon} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-ceci-primary leading-tight">
              {note.title}
            </h2>
            {course?.code ? (
              <p className="text-[11px] font-medium text-ceci-tertiary mt-0.5">{course.code}</p>
            ) : null}
          </div>
        </div>

        {note.hasQuestions && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ceci-academic-strong bg-surface-blue px-2 py-0.5 rounded-full border border-ceci-border-academic">
            <HelpCircle className="w-3 h-3" /> ficou com dúvida nessa aula ♡
          </span>
        )}
      </section>

      {/* Resumo da aula */}
      {note.summary ? (
        <section className="space-y-1.5">
          <SectionLabel icon={<BookOpen className="w-3.5 h-3.5" />}>resumo da aula</SectionLabel>
          <p className="text-xs text-ceci-secondary leading-relaxed bg-surface-muted p-3.5 rounded-2xl border border-ceci-border-subtle">
            {note.summary}
          </p>
        </section>
      ) : null}

      {/* Anotações detalhadas */}
      {note.fullNotes ? (
        <section className="space-y-1.5">
          <SectionLabel>anotações detalhadas</SectionLabel>
          <div className="paper-texture text-xs text-ceci-primary leading-relaxed whitespace-pre-line p-4 rounded-[20px] border border-ceci-border-brand/40 bg-surface-rose">
            {note.fullNotes}
          </div>
        </section>
      ) : null}

      {/* Reflexão guiada — um convite do cecinho, sem criar dados novos */}
      <section className="rounded-[24px] bg-surface-rose border border-ceci-border-brand/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mascote expression="supervision-reflect" className="w-8 h-8 shrink-0" decorative />
          <div>
            <p className="text-xs font-bold text-ceci-brand-strong flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> hora de refletir
            </p>
            <p className="text-[11px] text-ceci-secondary">continue em diálogo com o que estudou</p>
          </div>
        </div>
        <ul className="space-y-1.5">
          {REFLECTION_PROMPTS.map((prompt) => (
            <li key={prompt} className="flex items-start gap-2 text-xs text-ceci-primary leading-relaxed">
              <span aria-hidden className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ceci-brand shrink-0" />
              {prompt}
            </li>
          ))}
        </ul>
      </section>

      {/* Conceitos ligados */}
      {noteConcepts.length > 0 ? (
        <section className="space-y-1.5">
          <SectionLabel>conceitos ligados</SectionLabel>
          <div className="flex items-center gap-1.5 flex-wrap">
            {noteConcepts.map((c) => (
              <span
                key={c.id}
                className="text-[11px] font-semibold text-ceci-primary bg-surface-muted px-2.5 py-1 rounded-full border border-ceci-border-default"
              >
                {c.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Autores citados */}
      {noteAuthors.length > 0 ? (
        <section className="space-y-1.5">
          <SectionLabel>autores citados</SectionLabel>
          <div className="flex items-center gap-1.5 flex-wrap">
            {noteAuthors.map((a) => (
              <span
                key={a.id}
                className="text-[11px] font-semibold text-ceci-academic-strong bg-surface-blue px-2.5 py-1 rounded-full border border-ceci-border-academic"
              >
                {a.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Materiais anexos */}
      {materials.length > 0 ? (
        <section className="space-y-1.5">
          <SectionLabel>materiais anexos</SectionLabel>
          <ul className="space-y-1.5">
            {materials.map((m, i) => (
              <li
                key={i}
                className="text-xs text-ceci-primary bg-surface-muted p-2.5 rounded-xl border border-ceci-border-subtle flex items-start gap-2"
              >
                <Paperclip className="w-3.5 h-3.5 text-ceci-academic-strong shrink-0 mt-0.5" />
                <span className="break-words">{m}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Avaliação — interativa e persistida */}
      <section className="rounded-[24px] border border-ceci-border-default bg-surface-default p-4 space-y-2">
        <p className="text-xs font-bold text-ceci-primary">como foi a aula?</p>
        <StarRating value={note.rating ?? 0} onChange={handleRate} showLabel />
        {note.rating ? (
          <p className="text-[11px] text-ceci-tertiary">{RATING_LABELS[note.rating]}</p>
        ) : (
          <p className="text-[11px] text-ceci-tertiary">
            tocando nas estrelas você guarda sua avaliação ♡
          </p>
        )}
      </section>

      {/* Barra de ações fixa */}
      <FixedBottomBar>
        <div className="max-w-md sm:max-w-xl mx-auto flex gap-2 px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={() => editManagedItem('class', note.id)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong py-2.5 rounded-2xl text-xs font-bold cursor-pointer active:scale-95 transition-transform"
          >
            <Pencil className="w-3.5 h-3.5" /> editar aula
          </button>
          <button
            onClick={() => openManageItem('class', note.id)}
            aria-label="excluir aula"
            className="flex items-center justify-center gap-1.5 bg-status-danger-surface border border-status-danger-border text-status-danger-strong py-2.5 px-4 rounded-2xl text-xs font-bold cursor-pointer active:scale-95 transition-transform"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </FixedBottomBar>
    </div>
  );
};

/** Rótulo de seção padrão do detalhe (uppercase leve, tom do cantinho). */
const SectionLabel: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({
  children,
  icon,
}) => (
  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
    {icon}
    {children}
  </span>
);