import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
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
import { TempleLoading } from '../library/temple/TempleShared';
import { ArticleCard } from '../library/ArticleCard';
import { ArticleDetailModal } from '../library/ArticleDetailModal';
import { MixedCollectionBlock } from '../library/MixedCollectionBlock';
import { ManageSurface } from '../ui/ManageSurface';
import { useMobileApp } from '@/context/mobileApp';
import { useDataClientCourses, useDataClientKnowledge } from '@/context/DataClientProvider';
import { useKnowledgeActions, useNavValue } from '@/context/shellNavContexts';
import { useLibraryFilters } from './biblioteca/useLibraryFilters';
import { MyMaterialsSection } from './biblioteca/MyMaterialsSection';
import { ExploreSections, LibraryModals } from './biblioteca/ExploreSections';

// B.4 — sub-telas da biblioteca (notas/templo/famílias/abordagens) só carregam
// quando o modo da aba as monta: cada uma vira chunk próprio sob Suspense.
const loadNotesScreen = () => import('../library/NotesScreen').then((m) => ({ default: m.NotesScreen }));
const loadTempleScreen = () => import('../library/TempleScreen').then((m) => ({ default: m.TempleScreen }));
const loadConceptsScreen = () => import('../library/temple/ConceptsScreen').then((m) => ({ default: m.ConceptsScreen }));
const loadAuthorsScreen = () => import('../library/temple/AuthorsScreen').then((m) => ({ default: m.AuthorsScreen }));
const loadTechniquesScreen = () => import('../library/temple/TechniquesScreen').then((m) => ({ default: m.TechniquesScreen }));
const loadComparisonRouteView = () => import('./biblioteca/ComparisonRouteView').then((m) => ({ default: m.ComparisonRouteView }));
const loadFamiliesView = () => import('./FamiliesView').then((m) => ({ default: m.FamiliesView }));
const loadFamilyDetailView = () => import('./FamilyDetailView').then((m) => ({ default: m.FamilyDetailView }));
const loadApproachDetailView = () => import('./ApproachDetailView').then((m) => ({ default: m.ApproachDetailView }));
const NotesScreen = lazy(loadNotesScreen);
const TempleScreen = lazy(loadTempleScreen);
const ConceptsScreen = lazy(loadConceptsScreen);
const AuthorsScreen = lazy(loadAuthorsScreen);
const TechniquesScreen = lazy(loadTechniquesScreen);
const ComparisonRouteView = lazy(loadComparisonRouteView);
const FamiliesView = lazy(loadFamiliesView);
const FamilyDetailView = lazy(loadFamilyDetailView);
const ApproachDetailView = lazy(loadApproachDetailView);

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

export const BibliotecaView: React.FC<BibliotecaViewProps> = ({ mode = 'library', familyId, approachId, comparisonSlug }) => {
  const { looseNotes, savedBookIds, readingProgress, concepts, authors } = useDataClientKnowledge();
  const { courses } = useDataClientCourses();
  const { addLooseNote, deleteLooseNote, toggleSaveBook, updateReadingProgress } = useKnowledgeActions();
  const {
    openNotesScreen,
    isCreatingLooseNote,
    setIsCreatingLooseNote,
    openTemple,
    openNoteDetail,
    openNoteTransform,
    openApproach,
  } = useNavValue();

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
  const savedSet = useMemo(() => new Set(savedBookIds), [savedBookIds]);
  const filter = useLibraryFilters({ library, savedBookIds: savedSet, readingProgress });
  const { savedBooks, readingBooks, availableTags } = filter;
  if (mode === 'notes') {
    return (
      <Suspense fallback={null}>
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
      </Suspense>
    );
  }

  // Dedicated Screen View for "Templo de Conhecimento"
  if (mode === 'temple') {
    return (
      <Suspense fallback={null}>
        <TempleScreen />
      </Suspense>
    );
  }

  // Seções internas do templo (conceitos / autores / técnicas)
  if (mode === 'conceitos') {
    return (
      <Suspense fallback={<TempleLoading label="carregando conceitos…" />}>
        <ConceptsScreen />
      </Suspense>
    );
  }
  if (mode === 'autores') {
    return (
      <Suspense fallback={<TempleLoading label="carregando autores…" />}>
        <AuthorsScreen />
      </Suspense>
    );
  }
  if (mode === 'tecnicas') {
    return (
      <Suspense fallback={<TempleLoading label="carregando técnicas…" />}>
        <TechniquesScreen />
      </Suspense>
    );
  }
  if (mode === 'comparacoes') {
    return (
      <Suspense fallback={<TempleLoading label="carregando comparações…" />}>
        <ComparisonRouteView comparisonSlug={comparisonSlug} />
      </Suspense>
    );
  }

  // Dedicated Screen View for "Famílias de Psicoterapias"
  if (mode === 'families') {
    return (
      <Suspense fallback={null}>
        <FamiliesView />
      </Suspense>
    );
  }

  // Dedicated Screen View for a Família específica
  if (mode === 'family' && familyId) {
    return (
      <Suspense fallback={<TempleLoading label="carregando família…" />}>
        <FamilyDetailView familyId={familyId} />
      </Suspense>
    );
  }

  // Dedicated Screen View for a Abordagem específica (página de leitura)
  if (mode === 'approach' && approachId) {
    return (
      <Suspense fallback={<TempleLoading label="carregando abordagem…" />}>
        <ApproachDetailView approachId={approachId} />
      </Suspense>
    );
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
            className="w-10 h-10 rounded-2xl bg-surface-default border border-ceci-border-default hover:border-ceci-border-brand flex items-center justify-center text-ceci-primary shadow-2xs tap-interactive active:scale-95 cursor-pointer"
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
        savedBookIds={savedSet}
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
        savedBookIds={savedSet}
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
