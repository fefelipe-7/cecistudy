import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ClipboardList, FileText, Plus, Timer } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { WizardFlow } from '../../../types';

interface CourseCreateMenuProps {
  courseId: string;
  /**
   * floating = botão redondo fixo no canto inferior direito (mobile).
   * inline = botão discreto no fluxo da página (desktop).
   */
  variant?: 'floating' | 'inline';
}

const ACTIONS = [
  { type: 'class', icon: FileText, label: 'anotar aula' },
  { type: 'exam', icon: ClipboardList, label: 'nova prova' },
  { type: 'session', icon: Timer, label: 'registrar estudo' },
  { type: 'reading', icon: BookOpen, label: 'registrar leitura' },
] as const;

/**
 * Botão único que expande o menu de registros rápidos da disciplina
 * (substitui a antiga barra de pills horizontais).
 */
export const CourseCreateMenu: React.FC<CourseCreateMenuProps> = ({
  courseId,
  variant = 'floating',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { openWizard, openCompose } = useMobileApp();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const pick = (type: (typeof ACTIONS)[number]['type']) => {
    setIsOpen(false);
    if (type === 'class') openCompose(courseId);
    else openWizard(type as WizardFlow, courseId);
  };

  return (
    <div ref={rootRef} className={variant === 'floating' ? 'fixed bottom-6 right-5 z-40' : 'relative'}>
      {/* Menu expansível */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={
              variant === 'floating'
                ? 'absolute bottom-14 right-0 origin-bottom-right'
                : 'absolute right-0 top-10 z-50 origin-top-right'
            }
          >
            <div
              role="menu"
              aria-label="registros rápidos da disciplina"
              className="flex flex-col items-end gap-1 rounded-2xl bg-surface-default border border-ceci-border-default shadow-floating p-1.5"
            >
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.type}
                    role="menuitem"
                    onClick={() => pick(action.type)}
                    className="flex items-center gap-2.5 w-full pl-2 pr-3 py-2 rounded-xl text-left hover:bg-surface-rose active:scale-95 transition cursor-pointer whitespace-nowrap"
                  >
                    <span className="w-7 h-7 rounded-full bg-surface-muted border border-ceci-border-default flex items-center justify-center shrink-0 text-ceci-brand-strong">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-ceci-primary">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gatilho */}
      <motion.button
        onClick={() => setIsOpen((s) => !s)}
        aria-label={isOpen ? 'fechar menu de registros' : 'abrir menu de registros'}
        aria-expanded={isOpen}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={
          variant === 'floating'
            ? 'w-12 h-12 rounded-full bg-ceci-brand-strong text-white shadow-brand flex items-center justify-center tap-interactive active:scale-95 cursor-pointer border border-ceci-border-brand/40'
            : 'flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-ceci-brand-strong text-white shadow-xs cursor-pointer active:scale-95'
        }
      >
        <Plus className={variant === 'floating' ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
        {variant === 'inline' && (
          <span className="text-[11px] font-bold">novo registro</span>
        )}
      </motion.button>
    </div>
  );
};
