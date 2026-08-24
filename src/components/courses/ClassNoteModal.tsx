import React from 'react';
import { Pencil, Trash2, Paperclip, HelpCircle } from 'lucide-react';
import { ClassNote } from '../../types';
import { Modal } from '../ui/Modal';
import { StarRating } from '../ui/StarRating';
import { useApp } from '../../context/AppContext';

interface ClassNoteModalProps {
  note: ClassNote | null;
  onClose: () => void;
}

export const ClassNoteModal: React.FC<ClassNoteModalProps> = ({ note, onClose }) => {
  const { editManagedItem, openManageItem, concepts, authors } = useApp();
  if (!note) return null;

  const noteConcepts = (note.conceptIds ?? [])
    .map((id) => concepts.find((c) => c.id === id))
    .filter(Boolean);
  const noteAuthors = (note.authorIds ?? [])
    .map((id) => authors.find((a) => a.id === id))
    .filter(Boolean);

  const handleEdit = () => {
    onClose();
    editManagedItem('class', note.id);
  };

  const handleDelete = () => {
    onClose();
    openManageItem('class', note.id);
  };

  return (
    <Modal
      open={!!note}
      onClose={onClose}
      className="w-full max-w-sm bg-white rounded-[28px] border border-ceci-border-default shadow-2xl p-6 space-y-4 text-ceci-primary max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between border-b border-ceci-border-default pb-3">
        <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
          aula {note.number} • {note.date}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-ceci-tertiary hover:text-ceci-primary font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-display font-bold text-lg text-ceci-primary">
            {note.title}
          </h3>
          {note.rating ? <StarRating value={note.rating} size="sm" /> : null}
        </div>
        {note.hasQuestions && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-ceci-academic-strong bg-surface-blue px-2 py-0.5 rounded-full border border-ceci-border-academic">
            <HelpCircle className="w-3 h-3" /> ficou com dúvida nessa aula ♡
          </span>
        )}
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">resumo da aula</span>
        <p className="text-xs text-ceci-secondary leading-relaxed bg-surface-muted p-3 rounded-2xl border border-ceci-border-subtle">
          {note.summary}
        </p>
      </div>

      {note.fullNotes && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">anotações detalhadas</span>
          <div className="text-xs text-ceci-primary leading-relaxed whitespace-pre-line bg-surface-rose p-3 rounded-2xl border border-ceci-border-brand/60">
            {note.fullNotes}
          </div>
        </div>
      )}

      {(noteConcepts.length > 0 || noteAuthors.length > 0) && (
        <div className="space-y-2 pt-1">
          {noteConcepts.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">conceitos ligados</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {noteConcepts.map((c) => (
                  <span key={c!.id} className="text-[11px] font-semibold text-ceci-primary bg-surface-muted px-2.5 py-1 rounded-full border border-ceci-border-default">
                    {c!.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {noteAuthors.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">autores citados</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {noteAuthors.map((a) => (
                  <span key={a!.id} className="text-[11px] font-semibold text-ceci-academic-strong bg-surface-blue px-2.5 py-1 rounded-full border border-ceci-border-academic">
                    {a!.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {note.materials && note.materials.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">materiais anexos</span>
          <ul className="space-y-1.5">
            {note.materials.map((m, i) => (
              <li key={i} className="text-xs text-ceci-primary bg-surface-muted p-2.5 rounded-xl border border-ceci-border-subtle flex items-start gap-2">
                <Paperclip className="w-3.5 h-3.5 text-ceci-academic-strong shrink-0 mt-0.5" />
                <span className="break-words">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-1.5 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" /> editar aula
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 text-red-700 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> excluir
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-ceci-primary text-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
      >
        fechar anotação
      </button>
    </Modal>
  );
};
