import React from 'react';
import { cn } from '../../lib/utils';

import welcomeWave from '../../assets/mascote/welcome-wave.webp';
import listeningHello from '../../assets/mascote/listening-hello.webp';
import focusReady from '../../assets/mascote/focus-ready.webp';
import readingCurious from '../../assets/mascote/reading-curious.webp';
import libraryShelf from '../../assets/mascote/library-shelf.webp';
import writingNote from '../../assets/mascote/writing-note.webp';
import reviewCard from '../../assets/mascote/review-card.webp';
import quizReady from '../../assets/mascote/quiz-ready.webp';
import correctSoft from '../../assets/mascote/correct-soft.webp';
import tryAgain from '../../assets/mascote/try-again.webp';
import emptyInvite from '../../assets/mascote/empty-invite.webp';
import doneCalm from '../../assets/mascote/done-calm.webp';
import celebrateSmall from '../../assets/mascote/celebrate-small.webp';
import classReady from '../../assets/mascote/class-ready.webp';
import fieldPrepare from '../../assets/mascote/field-prepare.webp';
import supervisionReflect from '../../assets/mascote/supervision-reflect.webp';
import connectionLink from '../../assets/mascote/connection-link.webp';
import researchTcc from '../../assets/mascote/research-tcc.webp';
import writingFlow from '../../assets/mascote/writing-flow.webp';
import boundariesCare from '../../assets/mascote/boundaries-care.webp';
import syncWait from '../../assets/mascote/sync-wait.webp';
import loadingPatient from '../../assets/mascote/loading-patient.webp';
import noResults from '../../assets/mascote/no-results.webp';
import pauseKind from '../../assets/mascote/pause-kind.webp';

export const MASCOTE_EXPRESSIONS = {
  'welcome-wave': welcomeWave,
  'listening-hello': listeningHello,
  'focus-ready': focusReady,
  'reading-curious': readingCurious,
  'library-shelf': libraryShelf,
  'writing-note': writingNote,
  'review-card': reviewCard,
  'quiz-ready': quizReady,
  'correct-soft': correctSoft,
  'try-again': tryAgain,
  'empty-invite': emptyInvite,
  'done-calm': doneCalm,
  'celebrate-small': celebrateSmall,
  'class-ready': classReady,
  'field-prepare': fieldPrepare,
  'supervision-reflect': supervisionReflect,
  'connection-link': connectionLink,
  'research-tcc': researchTcc,
  'writing-flow': writingFlow,
  'boundaries-care': boundariesCare,
  'sync-wait': syncWait,
  'loading-patient': loadingPatient,
  'no-results': noResults,
  'pause-kind': pauseKind,
} as const;

export type MascoteExpression = keyof typeof MASCOTE_EXPRESSIONS;

interface MascoteProps {
  expression: MascoteExpression;
  className?: string;
  /** Texto alternativo (acessibilidade). Quando só decoração, use `decorative`. */
  alt?: string;
  decorative?: boolean;
}

/** Mascotinha do cantinho — uma expressão por situação (empty states, modais, saudação). */
export const Mascote: React.FC<MascoteProps> = ({
  expression,
  className,
  alt,
  decorative,
}) => (
  <img
    src={MASCOTE_EXPRESSIONS[expression]}
    alt={decorative ? '' : (alt ?? 'mascote do cantinho')}
    aria-hidden={decorative || undefined}
    className={cn('select-none', className)}
    draggable={false}
  />
);
