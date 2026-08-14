import React, { useState } from 'react';
import {
  FileText,
  Search,
  X,
  Plus,
  Check,
  Copy,
  Trash2,
  StickyNote,
} from 'lucide-react';
import { LooseNote, CATEGORY_BADGE } from './notes';
import { copyToClipboard } from '../../lib/utils';

interface NotesScreenProps {
  looseNotes: LooseNote[];
  onAddNote: (note: LooseNote) => void;
  onDeleteNote: (id: string) => void;
  isCreatingNote: boolean;
  setIsCreatingNote: (v: boolean) => void;
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  looseNotes,
  onAddNote,
  onDeleteNote,
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

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 animate-in fade-in duration-300 relative">
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
              espaço exclusivo para anotações rápidas, reflexões e lembretes soltos
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

        <button
          onClick={() => setIsCreatingNote(!isCreatingNote)}
          className="bg-ceci-brand-strong hover:bg-ceci-brand-hover text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreatingNote ? 'fechar' : 'nova nota'}</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
        {[
          { id: 'todas', label: 'todas' },
          { id: 'reflexão', label: 'reflexões' },
          { id: 'estudo', label: 'estudo' },
          { id: 'ideia', label: 'ideias' },
          { id: 'lembrete', label: 'lembretes' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setNoteCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              noteCategoryFilter === cat.id
                ? 'bg-ceci-brand-strong text-white shadow-2xs'
                : 'bg-white text-ceci-secondary border border-ceci-border-default hover:border-ceci-border-brand'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* New Note Form */}
      {isCreatingNote && (
        <div className="bg-white rounded-[22px] p-4 border border-ceci-border-brand bg-surface-rose/30 space-y-3 shadow-2xs animate-in fade-in duration-200">
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
              placeholder="título da nota (ex: Reflexão sobre acolhimento)"
              className="w-full bg-white border border-ceci-border-default rounded-xl px-3 py-2 text-xs font-semibold text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-medium text-ceci-secondary">categoria:</span>
              <div className="flex gap-1.5 flex-wrap">
                {(['reflexão', 'estudo', 'ideia', 'lembrete'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewNoteCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize cursor-pointer transition-all ${
                      newNoteCategory === cat
                        ? 'bg-ceci-brand-strong text-white'
                        : 'bg-white text-ceci-secondary border border-ceci-border-default'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
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
                    date: 'Hoje, agora',
                  };
                  onAddNote(newNote);
                  setNewNoteTitle('');
                  setNewNoteContent('');
                  setIsCreatingNote(false);
                }
              }}
              className="px-4 py-1.5 text-xs font-bold bg-ceci-brand-strong text-white rounded-xl hover:bg-ceci-brand-hover cursor-pointer shadow-2xs"
            >
              salvar nota
            </button>
          </div>
        </div>
      )}

      {/* List of Notes */}
      <div className="space-y-3">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="bg-white rounded-[20px] p-4 border border-ceci-border-default hover:border-ceci-border-brand transition-all space-y-2.5 shadow-2xs flex flex-col justify-between group"
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
                  {note.date}
                </span>
              </div>

              <p className="text-xs text-ceci-primary leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ceci-border-subtle/60">
              <button
                onClick={() => {
                  void copyToClipboard(`${note.title}\n${note.content}`).then((ok) => {
                    if (ok) {
                      setCopiedNoteId(note.id);
                      setTimeout(() => setCopiedNoteId(null), 2000);
                    }
                  });
                }}
                className="text-[11px] text-ceci-secondary hover:text-ceci-brand-strong flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface-rose transition-colors cursor-pointer"
                title="Copiar texto da nota"
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
                title="Excluir nota"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>excluir</span>
              </button>
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="bg-white rounded-[22px] p-8 text-center border border-dashed border-ceci-border-default space-y-2">
            <StickyNote className="w-8 h-8 text-ceci-faded mx-auto" />
            <p className="text-xs font-bold text-ceci-primary">nenhuma nota encontrada</p>
            <p className="text-xs text-ceci-secondary">
              {noteSearchTerm || noteCategoryFilter !== 'todas'
                ? 'tente ajustar seus filtros de busca.'
                : 'clique em "+ nova nota" acima para registrar sua primeira nota avulsa.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
