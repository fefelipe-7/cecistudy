import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { UserProfile, DynamicHeaderConfig } from '../types';
import { CourseIcon } from './ui/CourseIcon';
import { HeaderActionMenu } from './ui/HeaderActionMenu';
import { BookmarkToggle } from './ui/BookmarkToggle';
import { EASE, headerSwapVariants } from '../lib/motion';
import { resolveScrolledState } from '../lib/headerScrollState';
import { useMotionProfile } from '../components/motion/MotionProfileProvider';
import { useDataClientApp } from '../context/DataClientProvider';
import { useActiveTerm } from '../lib/termScope';

interface HeaderNavProps {
  profile: UserProfile;
  onNavigateToPerfil: () => void;
  headerConfig?: DynamicHeaderConfig | null;
  /** Direção da navegação (push=1, pop=-1, troca de tab=0) — sincroniza a troca brand↔detail. */
  direction?: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  profile,
  onNavigateToPerfil,
  headerConfig,
  direction = 0,
}) => {
  // Estado longo ↔ curto com histerese (`headerScrollState.ts`): um limiar
  // único fazia o header alternar entre os dois estados quando a rolagem
  // parava perto dele — momentum fracionário e rubber-band cruzavam o
  // limiar repetidamente com a tela parada. A zona morta entre os dois
  // limiares garante que, parando em qualquer ponto, o estado não mude.
  const [scrolled, setScrolled] = useState(() => resolveScrolledState(false, window.scrollY));
  const motionProfile = useMotionProfile();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled((prev) => resolveScrolledState(prev, window.scrollY));
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

  // Badge do semestre: o **período ativo** manda (SPEC-005 §D4), não o contador
  // legado do perfil. Lê direto do data client para não abrir mais um prop.
  const { academicTerms } = useDataClientApp();
  const activeTermOrdinal = useActiveTerm(academicTerms)?.ordinal;

  return (
    <motion.header
      initial={motionProfile.reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
      animate={
        motionProfile.reduced
          ? { opacity: 1, transition: { duration: motionProfile.d.micro, ease: EASE.standard } }
          : {
              opacity: 1,
              y: 0,
              transition: { duration: motionProfile.d.navBar, ease: EASE.standard },
            }
      }
      exit={
        motionProfile.reduced
          ? { opacity: 0, transition: { duration: motionProfile.d.micro, ease: EASE.exit } }
          : {
              opacity: 0,
              y: -10,
              transition: { duration: motionProfile.d.navBar, ease: EASE.exit },
            }
      }
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
                    ariaLabel={
                      headerConfig.isBookmarked ? 'remover dos favoritos' : 'favoritar disciplina'
                    }
                  />
                )}

                {/* Custom Right Action (e.g. Quick Add or Action button) */}
                {headerConfig.rightActions}

                {/* Contextual action menu (telas auxiliares) */}
                {headerConfig.actions && <HeaderActionMenu actions={headerConfig.actions} />}
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
                      {activeTermOrdinal ?? profile.semester}º sem
                    </span>
                  </div>
                  {!scrolled && (
                    <p className="text-xs text-ceci-secondary hidden sm:block transition-colors duration-300 mt-0.5">
                      {formattedDate} • {profile.university}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
