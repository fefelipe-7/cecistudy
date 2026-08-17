import React from 'react';
import { ClassNote } from '../../types';
import { Modal } from '../ui/Modal';

interface ClassNoteModalProps {
  note: ClassNote | null;
  onClose: () => void;
}

export const ClassNoteModal: React.FC<ClassNoteModalProps> = ({ note, onClose }) => {
  if (!note) return null;

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
        <h3 className="font-display font-bold text-lg text-ceci-primary">
          {note.title}
        </h3>
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

      <button
        onClick={onClose}
        className="w-full bg-ceci-primary text-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
      >
        fechar anotação
      </button>
    </Modal>
  );
};
