import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { Mascote } from '../ui/Mascote';
import { isCardDue } from '../../lib/fsrs';
import { ReviewSession } from '../flashcards/ReviewSession';

/**
 * Tela dedicada de revisão de flashcards. Wrapper fino: liga o contexto
 * (`handleReviewFlashcard`, `handleUpdateFlashcard`, wizard e gestão) ao
 * `ReviewSession` (que implementa o loop Anki / 3D / undo).
 */
export const StudyRevisarScreen: React.FC = () => {
  const { flashcards, profile, handleReviewFlashcard, handleUpdateFlashcard, openWizard, openManageItem } =
    useMobileApp();

  const dueCards = useMemo(() => flashcards.filter((c) => isCardDue(c)), [flashcards]);

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4">
      {flashcards.length === 0 ? (
        <div className="rounded-2xl p-6 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-4">
          <Mascote expression="review-card" className="w-14 h-14 mx-auto" decorative />
          <div>
            <h3 className="font-display font-bold text-base text-ceci-primary">ainda não tem flashcard</h3>
            <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
              bora criar o primeiro pra revisar no seu ritmo ♡
            </p>
          </div>
          <button
            onClick={() => openWizard('flashcard')}
            className="mx-auto flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> criar flashcard
          </button>
        </div>
      ) : (
        <>
          <ReviewSession
            allCards={flashcards}
            dueCards={dueCards}
            profileName={profile?.name ?? ''}
            onGrade={handleReviewFlashcard}
            onRestore={handleUpdateFlashcard}
            onManage={(id) => openManageItem('flashcard', id)}
          />
          <button
            onClick={() => openWizard('flashcard')}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand cursor-pointer"
          >
            <Plus className="w-4 h-4" /> novo flashcard
          </button>
        </>
      )}
    </div>
  );
};

export default StudyRevisarScreen;