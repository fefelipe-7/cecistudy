import React from 'react';
import {
  X,
  BookOpen,
  Brain,
  HeartHandshake,
  Timer,
  ClipboardList,
  UserCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Kitty } from './ui/Kitty';
import { QuickType } from '../types';
import { cn } from '../lib/utils';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chamado ao escolher um tipo — o AppShell empurra o wizard (ou a composição, no caso de aula). */
  onPick: (type: QuickType) => void;
}

const TYPE_OPTIONS: {
  type: QuickType;
  label: string;
  caption: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  {
    type: 'class',
    label: 'aula / nota',
    caption: 'anotação de aula',
    Icon: FileText,
    accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
  },
  {
    type: 'task',
    label: 'tarefa',
    caption: 'prazo ou atividade',
    Icon: CheckCircle2,
    accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
  },
  {
    type: 'exam',
    label: 'prova / avaliação',
    caption: 'vale nota',
    Icon: ClipboardList,
    accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong',
  },
  {
    type: 'flashcard',
    label: 'flashcard',
    caption: 'pergunta & resposta',
    Icon: Brain,
    accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong',
  },
  {
    type: 'reading',
    label: 'livro / leitura',
    caption: 'obra ou artigo',
    Icon: BookOpen,
    accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
  },
  {
    type: 'session',
    label: 'sessão de estudo',
    caption: 'foco no cantinho',
    Icon: Timer,
    accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong',
  },
  {
    type: 'internship',
    label: 'estágio',
    caption: 'registro de campo',
    Icon: HeartHandshake,
    accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
  },
  {
    type: 'author',
    label: 'autor',
    caption: 'estudado na jornada',
    Icon: UserCheck,
    accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong',
  },
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onPick }) => (
  <Modal
    open={isOpen}
    onClose={onClose}
    position="bottom"
    className="w-full max-w-lg bg-canvas rounded-t-[28px] sm:rounded-[24px] border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary"
  >
    {/* Header */}
    <div className="flex items-center justify-between border-b border-ceci-border-subtle pb-3 mb-4">
      <div className="flex items-center gap-2">
        <Kitty expression="curiosa" className="w-8 h-8 shrink-0" decorative />
        <div>
          <h3 className="font-display font-bold text-lg text-ceci-primary">
            novo registro no cantinho
          </h3>
          <p className="text-xs text-ceci-secondary">escolhe o que você quer criar</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="touch-target p-1.5 rounded-full hover:bg-surface-muted text-ceci-secondary transition-colors cursor-pointer"
        aria-label="fechar"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Grade de tipos — cada toque abre o wizard em tela cheia */}
    <div className="grid grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
      {TYPE_OPTIONS.map((opt) => {
        const Icon = opt.Icon;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => {
              onPick(opt.type);
              onClose();
            }}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-ceci-border-default hover:border-ceci-border-brand text-left tap-interactive active:scale-95 cursor-pointer shadow-2xs min-h-[64px]"
          >
            <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', opt.accent)}>
              <Icon className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-ceci-primary leading-tight">
                {opt.label}
              </span>
              <span className="block text-[10px] text-ceci-tertiary leading-tight mt-0.5">
                {opt.caption}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  </Modal>
);