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
      className="w-full max-w-sm bg-white rounded-[28px] border border-[#E9DFDC] shadow-2xl p-6 space-y-4 text-[#40383A] animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between border-b border-[#E9DFDC] pb-3">
        <span className="text-xs font-bold text-[#B94862] bg-[#FFF5F7] px-2.5 py-0.5 rounded-full border border-[#FFD3DD]">
          Aula {note.number} • {note.date}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-[#918689] hover:text-[#40383A] font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div>
        <h3 className="font-display font-bold text-lg text-[#40383A]">
          {note.title}
        </h3>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#918689]">Resumo da Aula</span>
        <p className="text-xs text-[#6D6366] leading-relaxed bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2EBE8]">
          {note.summary}
        </p>
      </div>

      {note.fullNotes && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#918689]">Anotações Detalhadas</span>
          <div className="text-xs text-[#40383A] leading-relaxed whitespace-pre-line bg-[#FFF5F7] p-3 rounded-2xl border border-[#FFD3DD]/60">
            {note.fullNotes}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full bg-[#40383A] text-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
      >
        fechar anotação
      </button>
    </Modal>
  );
};
