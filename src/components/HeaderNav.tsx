import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile, DynamicHeaderConfig } from '../types';
import { CourseIcon } from './ui/CourseIcon';
import { HeaderActionMenu } from './ui/HeaderActionMenu';
import { BookmarkToggle } from './ui/BookmarkToggle';
import { headerSwapVariants } from '../lib/motion';

interface HeaderNavProps {
  profile: UserProfile;
  onOpenSearch: () => void;
  onNavigateToPerfil: () => void;
  headerConfig?: DynamicHeaderConfig | null;
  /** Direção da navegação (push=1, pop=-1, troca de tab=0) — sincroniza a troca brand↔detail. */
  direction?: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  profile,
  onOpenSearch,
  onNavigateToPerfil,
  headerConfig,
  direction = 0,
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
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' } }}
      className={`sticky top-0 z-40 liquid-glass-nav border-b border-b-[color:var(--color-glass-hairline)] px-3.5 sm:px-4 transition-[padding,box-shadow,background-color,border-color] duration-300 ease-in-out ${
        scrolled
          ? 'pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 shadow-sm'
          : 'pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(0.875rem+env(safe-area-inset-top,0px))] pb-3 sm:pb-3.5'
      }`}
    >
      <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Troca concorrente (popLayout): o header sai e entra JUNTOS, em tempo com o slide
            das telas — antes era mode="wait" (sequencial), que piscava fora de sincronia. */}
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        {isDetailMode ? (
          /* ================================================================ */
          /* DYNAMIC DETAIL HEADER MODE (replaces standard brand header)      */
          /* ================================================================ */
          <motion.div
            key="detail"
            custom={direction}
            variants={headerSwapVariants}
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
                  className="w-9 h-9 rounded-2xl bg-surface-default border border-ceci-border-default hover:border-ceci-border-brand flex items-center justify-center text-ceci-primary shadow-2xs hover:bg-surface-rose tap-interactive cursor-pointer shrink-0 active:scale-95"
                  title="voltar"
                  aria-label="voltar"
                >
                  <ArrowLeft className="w-4 h-4 text-ceci-primary" />
                </button>
              )}

              {headerConfig.icon && (
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border border-[color:var(--color-glass-pill-border)] shadow-2xs"
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
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-surface-default px-2 py-0.2 rounded-full border border-ceci-border-default text-ceci-primary shrink-0 shadow-2xs">
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
                <BookmarkToggle
                  active={headerConfig.isBookmarked}
                  onToggle={headerConfig.onToggleBookmark}
                  size="md"
                  label="favoritar disciplina"
                  activeLabel="remover dos favoritos"
                  ariaLabel={headerConfig.isBookmarked ? 'remover dos favoritos' : 'favoritar disciplina'}
                />
              )}

              {/* Custom Right Action (e.g. Quick Add or Action button) */}
              {headerConfig.rightActions}

              {/* Contextual action menu (telas auxiliares) */}
              {headerConfig.actions && <HeaderActionMenu actions={headerConfig.actions} />}

              {/* Quick Search */}
              <button
                onClick={onOpenSearch}
                className="w-9 h-9 rounded-2xl bg-surface-default border border-ceci-border-default hover:border-ceci-border-brand flex items-center justify-center text-ceci-primary shadow-2xs tap-interactive cursor-pointer active:scale-95"
                title="buscar no cantinho"
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
            custom={direction}
            variants={headerSwapVariants}
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
                className={`rounded-full bg-surface-rose border-2 border-ceci-border-brand flex items-center justify-center text-ceci-primary font-display font-bold shadow-2xs cursor-pointer transition-colors duration-300 overflow-hidden ${
                  scrolled ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-lg hover:scale-105'
                }`}
                title="ver meu espaço"
              >
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={`foto de ${profile.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  'C'
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-display text-ceci-primary tracking-tight font-bold transition-colors duration-300 ${
                      scrolled ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
                    }`}
                  >
                    cecistudy
                  </span>
                  <span className="text-ceci-brand text-xs sm:text-sm animate-pulse">♡</span>
                  <span
                    className={`bg-surface-blue text-ceci-academic-strong rounded-full font-medium border border-ceci-border-academic transition-colors duration-300 ${
                      scrolled ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
                    }`}
                  >
                    {profile.semester}º sem
                  </span>
                </div>
                {!scrolled && (
                  <p className="text-xs text-ceci-secondary hidden sm:block transition-colors duration-300 mt-0.5">
                    {formattedDate} • {profile.university}
                  </p>
                )}
              </div>
            </div>

            {/* Center Search Trigger */}
            <button
              onClick={onOpenSearch}
              className={`flex-1 max-w-sm hidden md:flex items-center gap-2 bg-[color:var(--color-glass-pill-start)] backdrop-blur-sm text-ceci-secondary px-3.5 rounded-full border border-[color:var(--color-glass-pill-border)] shadow-2xs transition-colors duration-300 cursor-pointer ${
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
                className={`md:hidden rounded-full text-ceci-primary bg-surface-default border border-ceci-border-default hover:bg-surface-rose tap-interactive flex items-center justify-center cursor-pointer ${
                  scrolled ? 'w-8 h-8' : 'w-10 h-10'
                }`}
                title="buscar"
                aria-label="buscar"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
