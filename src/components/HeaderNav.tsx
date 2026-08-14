import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  ArrowLeft,
  Bookmark,
  Plus
} from 'lucide-react';
import { UserProfile, DynamicHeaderConfig } from '../types';
import { CourseIcon } from './ui/CourseIcon';
import { HeaderActionMenu } from './ui/HeaderActionMenu';
import { fadeSlide } from '../lib/motion';

interface HeaderNavProps {
  profile: UserProfile;
  onOpenSearch: () => void;
  onOpenQuickAdd?: () => void;
  onNavigateToPerfil: () => void;
  headerConfig?: DynamicHeaderConfig | null;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  profile,
  onOpenSearch,
  onOpenQuickAdd,
  onNavigateToPerfil,
  headerConfig,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const todayDateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const formattedDate = todayDateStr.toLowerCase();

  const isDetailMode = !!(headerConfig && (headerConfig.title || headerConfig.onBack));

  return (
    <header
      className={`sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle px-3.5 sm:px-4 transition-all duration-300 ease-in-out ${
        scrolled
          ? 'pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 shadow-xs'
          : 'pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(0.875rem+env(safe-area-inset-top,0px))] pb-3 sm:pb-3.5'
      }`}
    >
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        <AnimatePresence mode="wait" initial={false}>
        {isDetailMode ? (
          /* ================================================================ */
          /* DYNAMIC DETAIL HEADER MODE (replaces standard brand header)      */
          /* ================================================================ */
          <motion.div
            key="detail"
            variants={fadeSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center justify-between w-full"
          >
            {/* Left Section: Back Button + Icon + Title & Code */}
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              {headerConfig.onBack && (
                <button
                  onClick={headerConfig.onBack}
                  className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:border-ceci-border-brand flex items-center justify-center text-ceci-primary shadow-2xs hover:bg-surface-rose transition-all cursor-pointer shrink-0 active:scale-95"
                  title="Voltar"
                  aria-label="voltar"
                >
                  <ArrowLeft className="w-4 h-4 text-ceci-primary" />
                </button>
              )}

              {headerConfig.icon && (
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/80 shadow-2xs"
                  style={{ backgroundColor: `${headerConfig.color || '#B94862'}20` }}
                >
                  {headerConfig.icon && <CourseIcon icon={headerConfig.icon} />}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-display font-bold text-sm sm:text-base text-ceci-primary truncate leading-tight">
                    {headerConfig.title}
                  </h2>
                  {headerConfig.code && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white px-2 py-0.2 rounded-full border border-ceci-border-default text-ceci-primary shrink-0 shadow-2xs">
                      {headerConfig.code}
                    </span>
                  )}
                </div>

                {headerConfig.subtitle && (
                  <p className="text-[11px] text-ceci-secondary font-medium truncate leading-tight">
                    {headerConfig.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right Section: Inline Actions (Moved directly into the Header!) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Bookmark Toggle */}
              {headerConfig.onToggleBookmark && (
                <button
                  onClick={headerConfig.onToggleBookmark}
                  className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                    headerConfig.isBookmarked
                      ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
                      : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
                  }`}
                  title={headerConfig.isBookmarked ? 'Remover dos favoritos' : 'Favoritar disciplina'}
                  aria-label={headerConfig.isBookmarked ? 'remover dos favoritos' : 'favoritar disciplina'}
                >
                  <Bookmark
                    className={`w-4 h-4 ${headerConfig.isBookmarked ? 'fill-ceci-brand-strong' : ''}`}
                  />
                </button>
              )}

              {/* Custom Right Action (e.g. Quick Add or Action button) */}
              {headerConfig.rightActions}

              {/* Contextual action menu (telas auxiliares) */}
              {headerConfig.actions && <HeaderActionMenu actions={headerConfig.actions} />}

              {/* Quick Add Button if rightActions/actions not passed */}
              {!headerConfig.rightActions && !headerConfig.actions && onOpenQuickAdd && (
                <button
                  onClick={onOpenQuickAdd}
                  className="bg-ceci-primary hover:bg-ceci-primary-hover text-white px-3 py-1.5 rounded-2xl font-display font-bold text-xs shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Nova anotação ou tarefa"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anotação</span>
                </button>
              )}

              {/* Quick Search */}
              <button
                onClick={onOpenSearch}
                className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:border-ceci-border-brand flex items-center justify-center text-ceci-primary shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Buscar no curso"
                aria-label="buscar no cantinho"
              >
                <Search className="w-4 h-4 text-ceci-secondary" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* ================================================================ */
          /* STANDARD BRAND HEADER MODE                                        */
          /* ================================================================ */
          <motion.div
            key="brand"
            variants={fadeSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center justify-between w-full gap-2 sm:gap-3"
          >
            {/* Brand / Logo */}
            <div className="flex items-center gap-2.5">
              <div
                onClick={onNavigateToPerfil}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigateToPerfil();
                  }
                }}
                aria-label="ver meu espaço"
                className={`rounded-full bg-surface-rose border-2 border-ceci-border-brand flex items-center justify-center text-ceci-primary font-display font-bold shadow-2xs cursor-pointer transition-all duration-300 ${
                  scrolled ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-lg hover:scale-105'
                }`}
                title="ver meu espaço"
              >
                C
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-display text-ceci-primary tracking-tight font-bold transition-all duration-300 ${
                      scrolled ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
                    }`}
                  >
                    cecistudy
                  </span>
                  <span className="text-ceci-brand text-xs sm:text-sm animate-pulse">♡</span>
                  <span
                    className={`bg-surface-blue text-ceci-academic-strong rounded-full font-medium border border-ceci-border-academic transition-all duration-300 ${
                      scrolled ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
                    }`}
                  >
                    {profile.semester}º sem
                  </span>
                </div>
                {!scrolled && (
                  <p className="text-xs text-ceci-secondary hidden sm:block transition-all duration-300 mt-0.5">
                    {formattedDate} • {profile.university}
                  </p>
                )}
              </div>
            </div>

            {/* Center Search Trigger */}
            <button
              onClick={onOpenSearch}
              className={`flex-1 max-w-sm hidden md:flex items-center gap-2 bg-white/90 hover:bg-white text-ceci-secondary px-3.5 rounded-full border border-ceci-border-default shadow-2xs transition-all duration-300 cursor-pointer ${
                scrolled ? 'py-1 text-[11px] min-h-[32px]' : 'py-2 text-xs min-h-[40px]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-ceci-tertiary shrink-0" />
              <span className="truncate">buscar conceitos, autores (freud, beck...), aulas...</span>
              <kbd className="ml-auto text-[10px] bg-surface-muted px-1.5 py-0.5 rounded text-ceci-tertiary border border-ceci-border-default">
                ⌘K
              </kbd>
            </button>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile Search Button */}
              <button
                onClick={onOpenSearch}
                className={`md:hidden rounded-full text-ceci-primary bg-white border border-ceci-border-default hover:bg-surface-rose transition-all flex items-center justify-center cursor-pointer ${
                  scrolled ? 'w-8 h-8' : 'w-10 h-10'
                }`}
                title="buscar"
                aria-label="buscar"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Mood Badge */}
              <button
                onClick={onNavigateToPerfil}
                className={`hidden sm:flex items-center gap-1.5 bg-surface-rose border border-ceci-border-brand hover:border-rose-300 text-ceci-brand-strong px-3 rounded-full font-medium shadow-2xs transition-all duration-300 cursor-pointer ${
                  scrolled ? 'py-1 text-[11px] min-h-[32px]' : 'py-1.5 text-xs min-h-[40px]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate max-w-[130px]">{profile.avatarMood}</span>
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </header>
  );
};
