"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IOS_EASE } from "@/lib/motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePressGesture } from "@/lib/usePressGesture";
import { hapticTap } from "@/lib/haptics";

export type FloatingActionMenuProps = {
  options: {
    label: string;
    onClick: () => void;
    Icon?: React.ReactNode;
  }[];
  className?: string;
  /** Ação do pressionamento prolongado (ex.: abrir a busca global). */
  onLongPress?: () => void;
};

const FloatingActionMenu = ({
  options,
  className,
  onLongPress,
}: FloatingActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Toque curto abre o menu de atalhos; segurar dispara a ação alternativa.
  // A máquina de estados garante "um gesto físico, no máximo um resultado":
  // o click que o navegador sintetiza depois do pressed longo é engolido,
  // então a busca não abre junto com o menu.
  const { phase, handlers } = usePressGesture({
    onPress: toggleMenu,
    onLongPress: () => {
      setIsOpen(false);
      hapticTap();
      onLongPress?.();
    },
  });

  return (
    <div className={cn("fixed bottom-8 right-8 z-50", className)}>
      <Button
        {...handlers}
        data-phase={phase}
        aria-label={isOpen ? 'fechar menu de atalhos' : 'abrir menu de atalhos (segure para buscar)'}
        aria-expanded={isOpen}
        className="liquid-glass-fab w-11 h-11 rounded-full hover:brightness-110 active:scale-95 data-[phase=pressing]:scale-90 shadow-brand tap-interactive cursor-pointer border transition-[filter,transform] duration-200"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Plus className="w-6 h-6 text-ceci-on-brand" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 10, y: 10 }}
            transition={{ duration: 0.22, ease: IOS_EASE, delay: 0.05 }}
            className="absolute bottom-12 right-0 mb-2"
          >
            <div className="flex flex-col items-end gap-2">
              {options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.2,
                    ease: IOS_EASE,
                    delay: index * 0.03,
                  }}
                >
                  <Button
                    onClick={() => {
                      option.onClick();
                      setIsOpen(false);
                    }}
                    size="sm"
                    className="flex items-center gap-2 bg-ceci-brand-strong hover:bg-ceci-brand-hover text-ceci-on-brand shadow-brand-soft border border-ceci-border-brand/30 rounded-xl cursor-pointer whitespace-nowrap font-medium text-xs"
                  >
                    {option.Icon}
                    <span>{option.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionMenu;
export { FloatingActionMenu };
