import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  User,
  Sparkles,
  Search,
  Plus,
  ChevronRight,
  Bookmark,
  X,
  SlidersHorizontal,
  TrendingUp,
  BrainCircuit,
  Compass,
  RotateCcw,
  FileText,
  Landmark,
  Newspaper,
  Brain,
} from 'lucide-react';
import {
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  TempleComparison,
  MaterialItem,
  Course,
  SubTabBiblioteca,
  TempleSection,
} from '../../types';
import {
  initialContextCollections,
  initialTrendingBooks,
  CollectionBook,
  ContextCollection,
} from '../../data/libraryData';
import {
  psychotherapyCollections as staticPsychotherapyCollections,
  complementaryCollections as staticComplementaryCollections,
  articleGroups as staticArticleGroups,
  catalogBooks as staticCatalogBooks,
  mixedCollections as staticMixedCollections,
  Article,
  MixedCollection,
} from '../../data/books';
import type { LibraryDataset } from '../../data/books/curate';
import { loadNativeLibraryDataset } from '../../lib/catalogLibrary';

/** Fonte do acervo: facade estático; no nativo, troca pelo catálogo SQLite. */
const staticLibrary: LibraryDataset = {
  catalogBooks: staticCatalogBooks,
  interdisciplinaryBooks: [],
  articles: [],
  psychotherapyCollections: staticPsychotherapyCollections,
  complementaryCollections: staticComplementaryCollections,
  articleGroups: staticArticleGroups,
  mixedCollections: staticMixedCollections,
};
import { InlineCollectionBlock } from '../library/InlineCollectionBlock';
import { Mascote } from '../ui/Mascote';
import { TagChip } from '../ui/TagChip';
import { BookDetailModal } from '../library/BookDetailModal';
import { LibraryFilterModal } from '../library/LibraryFilterModal';
import { NotesScreen } from '../library/NotesScreen';
import { TempleScreen } from '../library/TempleScreen';
import { ConceptsScreen } from '../library/temple/ConceptsScreen';
import { AuthorsScreen } from '../library/temple/AuthorsScreen';
import { TechniquesScreen } from '../library/temple/TechniquesScreen';
import { ComparisonsScreen } from '../library/temple/ComparisonsScreen';
import { ComparisonDetailScreen } from '../library/temple/ComparisonDetailScreen';
import { TempleEmptyState, TempleLoading } from '../library/temple/TempleShared';
import { getTempleComparison } from '../../lib/templeData';
import { FamiliesView } from './FamiliesView';
import { FamilyDetailView } from './FamilyDetailView';
import { ApproachDetailView } from './ApproachDetailView';
import { ArticleCard } from '../library/ArticleCard';
import { ArticleDetailModal } from '../library/ArticleDetailModal';
import { MixedCollectionBlock } from '../library/MixedCollectionBlock';
import { ManageSurface } from '../ui/ManageSurface';
import { useMobileApp } from '@/context/mobileApp';
import { useLibraryFilters } from './biblioteca/useLibraryFilters';
import { MyMaterialsSection } from './biblioteca/MyMaterialsSection';
import { ExploreSections, LibraryModals } from './biblioteca/ExploreSections';

export type BibliotecaViewMode =
  | 'library'
  | 'notes'
  | 'temple'
  | TempleSection
  | 'families'
  | 'family'
  | 'approach';

interface BibliotecaViewProps {
  /** Tela derivada da pilha `biblioteca` renderizada no lugar da grade. */
  mode?: BibliotecaViewMode;
  familyId?: string;
  approachId?: string;
  comparisonSlug?: string;
}
const ComparisonRouteView: React.FC<{ comparisonSlug?: string }> = ({ comparisonSlug }) => {
  const { openComparison, closeComparison } = useMobileApp();
  const [focusedComparison, setFocusedComparison] = useState<TempleComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!comparisonSlug) {
      setFocusedComparison(null);
      setLoading(false);
      setError(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(false);
    void getTempleComparison(comparisonSlug)
      .then((comparison) => {
        if (!alive) return;
        setFocusedComparison(comparison);
        setError(!comparison);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setFocusedComparison(null);
        setError(true);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [comparisonSlug]);

  if (!comparisonSlug) return <ComparisonsScreen onOpen={openComparison} />;
  if (loading) return <TempleLoading label="carregando comparação…" />;
  if (error || !focusedComparison) return <TempleEmptyState message="comparação não encontrada ♡" />;
  return <ComparisonDetailScreen comparison={focusedComparison} onBack={closeComparison} />;
};

export const BibliotecaView: React.FC<BibliotecaViewProps> = ({ mode = 'library', familyId, approachId, comparisonSlug }) => {
  const { openNotesScreen, isCreatingLooseNote, setIsCreatingLooseNote, openTemple, looseNotes, addLooseNote, deleteLooseNote, courses, concepts, authors, openNoteDetail, openNoteTransform, savedBookIds, toggleSaveBook, readingProgress, updateReadingProgress, openApproach } = useMobileApp();

  // Detail & Modal States
  const [selectedBook, setSelectedBook] = useState<CollectionBook | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Fase F — nativo lê o acervo do catálogo SQLite (fallback: facade estático).
  const [nativeLibrary, setNativeLibrary] = useState<LibraryDataset | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadNativeLibraryDataset().then((dataset) => {
      if (!cancelled && dataset) setNativeLibrary(dataset);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const library = nativeLibrary ?? staticLibrary;

  // Filtros, status e coleções derivadas do acervo (extraídos p/ `biblioteca/useLibraryFilters`).
  const filter = useLibraryFilters({ library, savedBookIds, readingProgress });
  const { savedBooks, readingBooks, availableTags } = filter;
  if (mode === 'notes') {
    return (
      <NotesScreen
        looseNotes={looseNotes}
        onAddNote={addLooseNote}
        onDeleteNote={deleteLooseNote}
        onEditNote={openNoteDetail}
        onTransformNote={openNoteTransform}
        courses={courses}
        concepts={concepts}
        authors={authors}
        isCreatingNote={isCreatingLooseNote}
        setIsCreatingNote={setIsCreatingLooseNote}
      />
    );
  }

  // Dedicated Screen View for "Templo de Conhecimento"
  if (mode === 'temple') {
    return <TempleScreen />;
  }

  // Seções internas do templo (conceitos / autores / técnicas)
  if (mode === 'conceitos') {
    return <ConceptsScreen />;
  }
  if (mode === 'autores') {
    return <AuthorsScreen />;
  }
  if (mode === 'tecnicas') {
    return <TechniquesScreen />;
  }
  if (mode === 'comparacoes') {
    return <ComparisonRouteView comparisonSlug={comparisonSlug} />;
  }

  // Dedicated Screen View for "Famílias de Psicoterapias"
  if (mode === 'families') {
    return <FamiliesView />;
  }

  // Dedicated Screen View for a Família específica
  if (mode === 'family' && familyId) {
    return <FamilyDetailView familyId={familyId} />;
  }

  // Dedicated Screen View for a Abordagem específica (página de leitura)
  if (mode === 'approach' && approachId) {
    return <ApproachDetailView approachId={approachId} />;
  }

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1 relative">

      {/* 1. Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <span className="text-xs text-ceci-secondary font-medium lowercase tracking-wide flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" /> biblioteca & repertório
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-ceci-primary font-bold mt-0.5 tracking-tight">
            minhas coleções ♡
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openTemple}
            className="w-10 h-10 rounded-2xl bg-white border border-ceci-border-default hover:border-ceci-border-brand flex items-center justify-center text-ceci-primary shadow-2xs tap-interactive active:scale-95 cursor-pointer"
            title="templo de conhecimento"
          >
            <Landmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ZONA 1: MEUS MATERIAIS (acesso pessoal primeiro)                      */}
      {/* ==================================================================== */}
      <MyMaterialsSection
        looseNotesCount={looseNotes.length}
        readingBooks={readingBooks}
        savedBooks={savedBooks}
        readingProgress={readingProgress}
        onOpenNotes={openNotesScreen}
        onSelectBook={setSelectedBook}
      />

      {/* ==================================================================== */}
      {/* ZONA 2: EXPLORAR O ACERVO                                             */}
      {/* ==================================================================== */}
      <ExploreSections
        filter={filter}
        savedBookIds={savedBookIds}
        readingProgress={readingProgress}
        selectedBook={selectedBook}
        selectedArticle={selectedArticle}
        onSelectBook={setSelectedBook}
        onSelectArticle={setSelectedArticle}
        onCloseBook={() => setSelectedBook(null)}
        onCloseArticle={() => setSelectedArticle(null)}
        openApproach={openApproach}
        toggleSaveBook={toggleSaveBook}
        updateReadingProgress={updateReadingProgress}
      />
      <LibraryModals
        filter={filter}
        availableTags={availableTags}
        savedBookIds={savedBookIds}
        readingProgress={readingProgress}
        selectedBook={selectedBook}
        selectedArticle={selectedArticle}
        onCloseBook={() => setSelectedBook(null)}
        onCloseArticle={() => setSelectedArticle(null)}
        toggleSaveBook={toggleSaveBook}
        updateReadingProgress={updateReadingProgress}
      />

    </div>
  );
};
