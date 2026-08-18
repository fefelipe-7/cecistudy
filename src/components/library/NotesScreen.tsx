import React, { useState } from 'react';
import {
  FileText,
  Search,
  X,
  Check,
  Copy,
  Trash2,
  Pencil,
  Wand2,
  BookOpen,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { CATEGORY_BADGE, formatNoteDate } from './notes';
import { Kitty } from '../ui/Kitty';
import { PillGroup } from '../ui/PillGroup';
import { ManageSurface } from '../ui/ManageSurface';
import { copyToClipboard } from '../../lib/utils';
import type { LooseNote, Course, PsychologyConcept, PsychologyAuthor } from '../../types';

interface NotesScreenProps {
  looseNotes: LooseNote[];
  onAddNote: (note: LooseNote) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (noteId: string) => void;
  onTransformNote: (noteId: string) => void;
  courses: Course[];
  concepts: PsychologyConcept[];
  authors: PsychologyAuthor[];
  isCreatingNote: boolean;
  setIsCreatingNote: (v: boolean) => void;
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  looseNotes,
  onAddNote,
  onDeleteNote,
  onEditNote,
  onTransformNote,
  courses,
  concepts,
  authors,
  isCreatingNote,
  setIsCreatingNote,
}) => {
  const [noteSearchTerm, setNoteSearchTerm] = useState('');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState('todas');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<LooseNote['category']>('reflexão');

  const filteredNotes = looseNotes.filter((note) => {
    const matchesCategory =
      noteCategoryFilter === 'todas' || note.category === noteCategoryFilter;
    const matchesSearch =
      !noteSearchTerm ||
      note.title.toLowerCase().includes(noteSearchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(noteSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const courseName = (id?: string) => courses.find((c) => c.id === id)?.name ?? '';
  const conceptNames = (ids: string[] = []) =>
    concepts.filter((c) => ids.includes(c.id)).map((c) => c.name).slice(0, 3);
  const authorNames = (ids: string[] = []) =>
    authors.filter((a) => ids.includes(a.id)).map((a) => a.name).slice(0, 3);

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 relative">
      {/* Counter badge (voltado para o header detail) */}
      <div className="flex items-center justify-end pt-1 px-1">
        <span className="text-xs font-semibold text-ceci-secondary bg-white px-3 py-1 rounded-full border border-ceci-border-default">
          {looseNotes.length} {looseNotes.length === 1 ? 'nota salva' : 'notas salvas'}
        </span>
      </div>

      {/* Screen Title Banner */}
      <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-ceci-primary leading-tight">
              suas notas avulsas
            </h1>
            <p className="text-xs text-ceci-secondary">
              rascunhos transitórios — podem virar aulas, tarefas, conceitos e mais ♡
            </p>
          </div>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ceci-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={noteSearchTerm}
            onChange={(e) => setNoteSearchTerm(e.target.value)}
            placeholder="pesquisar em suas notas..."
            className="w-full bg-white border border-ceci-border-default rounded-2xl pl-10 pr-8 py-2.5 text-xs text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500 shadow-2xs"
          />
          {noteSearchTerm && (
            <button
              onClick={() => setNoteSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ceci-tertiary hover:text-ceci-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-1">
        <PillGroup
          variant="brand"
          value={noteCategoryFilter}
          onChange={setNoteCategoryFilter}
          options={[
            { value: 'todas', label: 'todas' },
            { value: 'reflexão', label: 'reflexões' },
            { value: 'estudo', label: 'estudo' },
            { value: 'ideia', label: 'ideias' },
            { value: 'lembrete', label: 'lembretes' },
          ]}
        />
      </div>

      {/* New Note Form */}
      {isCreatingNote && (
        <div className="bg-white rounded-[22px] p-4 border border-ceci-border-brand bg-surface-rose/30 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-ceci-border-brand/60 pb-2">
            <h3 className="text-xs font-bold text-ceci-primary font-display uppercase tracking-wider">
              criar nova nota avulsa
            </h3>
            <button
              onClick={() => setIsCreatingNote(false)}
              className="text-ceci-tertiary hover:text-ceci-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="título da nota (ex: reflexão sobre acolhimento)"
              className="w-full bg-white border border-ceci-border-default rounded-xl px-3 py-2 text-xs font-semibold text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-medium text-ceci-secondary">categoria:</span>
              <PillGroup
                variant="brand"
                value={newNoteCategory}
                onChange={(v) => setNewNoteCategory(v)}
                options={(['reflexão', 'estudo', 'ideia', 'lembrete'] as const).map((cat) => ({ value: cat, label: cat }))}
              />
            </div>

            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="escreva o conteúdo da sua nota aqui..."
              rows={4}
              className="w-full bg-white border border-ceci-border-default rounded-xl p-3 text-xs text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setIsCreatingNote(false);
                setNewNoteTitle('');
                setNewNoteContent('');
              }}
              className="px-3.5 py-1.5 text-xs text-ceci-secondary hover:bg-ceci-border-default/40 rounded-xl cursor-pointer"
            >
              cancelar
            </button>
            <button
              onClick={() => {
                if (newNoteContent.trim()) {
                  const newNote: LooseNote = {
                    id: `note-${Date.now()}`,
                    title: newNoteTitle.trim() || 'Nota sem título',
                    content: newNoteContent.trim(),
                    category: newNoteCategory,
                    date: new Date().toISOString(),
                  };
                  onAddNote(newNote);
                  setNewNoteTitle('');
                  setNewNoteContent('');
                  setIsCreatingNote(false);
                }
              }}
              className="px-4 py-1.5 text-xs font-bold bg-ceci-brand-strong text-white rounded-xl hover:bg-ceci-brand-hover cursor-pointer shadow-2xs"
            >
              guardar nota
            </button>
          </div>
        </div>
      )}

      {/* List of Notes */}
      <div className="space-y-3">
        {filteredNotes.map((note) => {
          const cName = courseName(note.courseId);
          const cons = conceptNames(note.conceptIds);
          const auths = authorNames(note.authorIds);
          const hasLinks = Boolean(cName) || cons.length > 0 || auths.length > 0;
          return (
            <ManageSurface
              key={note.id}
              kind="looseNote"
              id={note.id}
              className="bg-white rounded-[20px] p-4 border border-ceci-border-default hover:border-ceci-border-brand tap-interactive space-y-2.5 shadow-2xs flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-ceci-border-subtle pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_BADGE[note.category]}`}>
                      {note.category}
                    </span>
                    <h3 className="font-bold font-display text-xs text-ceci-primary truncate">
                      {note.title}
                    </h3>
                  </div>

                  <span className="text-[10px] text-ceci-tertiary shrink-0 font-medium">
                    {formatNoteDate(note.date)}
                  </span>
                </div>

                <p className="text-xs text-ceci-primary leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>

                {hasLinks && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {cName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-blue border border-ceci-border-academic text-[10px] font-semibold text-ceci-academic-strong">
                        <BookOpen className="w-3 h-3" />
                        {cName}
                      </span>
                    )}
                    {cons.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-bg border border-amber-border text-[10px] font-semibold text-amber-text"
                      >
                        <Sparkles className="w-3 h-3" />
                        {name}
                      </span>
                    ))}
                    {auths.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted border border-ceci-border-default text-[10px] font-semibold text-ceci-secondary"
                      >
                        <UserCheck className="w-3 h-3" />
                        {name}
                      </span>
                    ))}
                    {note.conceptIds && note.conceptIds.length > 3 && (
                      <span className="text-[10px] text-ceci-tertiary font-medium">
                        +{note.conceptIds.length - 3} conceitos
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-ceci-border-subtle/60">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEditNote(note.id)}
                    className="text-[11px] text-ceci-secondary hover:text-ceci-brand-strong flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface-rose transition-colors cursor-pointer"
                    title="editar nota"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>editar</span>
                  </button>
                  <button
                    onClick={() => onTransformNote(note.id)}
                    className="text-[11px] text-ceci-brand-strong hover:text-ceci-brand-strong flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface-rose transition-colors cursor-pointer font-semibold"
                    title="transformar em outra entidade"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>transformar em...</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      void copyToClipboard(`${note.title}\n${note.content}`).then((ok) => {
                        if (ok) {
                          setCopiedNoteId(note.id);
                          setTimeout(() => setCopiedNoteId(null), 2000);
                        }
                      });
                    }}
                    className="text-[11px] text-ceci-tertiary hover:text-ceci-brand-strong flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface-rose transition-colors cursor-pointer"
                    title="copiar texto da nota"
                  >
                    {copiedNoteId === note.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success-deep" />
                        <span className="text-success-deep font-bold">copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="text-[11px] text-ceci-tertiary hover:text-ceci-brand-strong flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface-rose transition-colors cursor-pointer"
                    title="excluir nota"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>excluir</span>
                  </button>
                </div>
              </div>
            </ManageSurface>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="bg-white rounded-[22px] p-8 text-center border border-dashed border-ceci-border-default space-y-2">
            <Kitty expression="curiosa" className="w-14 h-14 mx-auto" decorative />
            <p className="text-xs font-bold text-ceci-primary">nenhuma nota encontrada</p>
            <p className="text-xs text-ceci-secondary">
              {noteSearchTerm || noteCategoryFilter !== 'todas'
                ? 'tente ajustar seus filtros de busca.'
                : 'use a ação "nova nota avulsa" (menu ⋯ no topo) para guardar sua primeira nota.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};