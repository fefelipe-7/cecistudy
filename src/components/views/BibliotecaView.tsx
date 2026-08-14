import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  MaterialItem,
  Course,
  SubTabBiblioteca,
  ReadingItem,
} from '../../types';
import {
  initialContextCollections,
  initialTrendingBooks,
  CollectionBook,
} from '../../data/libraryData';
import { ReaderModeModal } from '../widgets/ReaderModeModal';
import { InlineCollectionBlock } from '../library/InlineCollectionBlock';
import { BookDetailModal } from '../library/BookDetailModal';
import { LibraryFilterModal } from '../library/LibraryFilterModal';
import { NotesScreen } from '../library/NotesScreen';
import { TempleScreen } from '../library/TempleScreen';
import { LooseNote, INITIAL_NOTES } from '../library/notes';
import { usePersistentState } from '../../lib/usePersistentState';
import { useApp } from '../../context/AppContext';

export const BibliotecaView: React.FC = () => {
  const { openQuickAdd, isNotesScreenOpen, openNotesScreen, isCreatingLooseNote, setIsCreatingLooseNote, isTempleScreenOpen, openTemple } = useApp();
  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeStatus, setActiveStatus] = useState<string>('todos');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Detail & Modal States
  const [selectedBook, setSelectedBook] = useState<CollectionBook | null>(null);
  const [readerReading, setReaderReading] = useState<ReadingItem | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [savedBookIds, setSavedBookIds] = usePersistentState<string[]>('savedBookIds', [
    'bk-1', 'bk-5', 'bk-9', 'tr-1', 'tr-3', 'bk-33'
  ]);

  // Dedicated Notes Screen (aberta via pilha de navegação — header detail)
  const [looseNotes, setLooseNotes] = usePersistentState<LooseNote[]>('looseNotes', INITIAL_NOTES);

  // Popular quick tags available in the filter modal or search
  const availableTags = [
    'TCC & Cognição',
    'Psicanálise',
    'Finanças Comportamentais',
    'Don Norman',
    'BFP Bateria',
    'Hábitos',
    'Viktor Frankl',
    'Kahneman'
  ];

  const toggleSaveBook = (bookId: string) => {
    setSavedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleOpenReaderForBook = (book: CollectionBook) => {
    const readingObj: ReadingItem = {
      id: book.id,
      title: book.title,
      author: book.author,
      type: 'livro',
      totalPages: book.totalPages,
      readPages: book.readPages,
      status: book.status === 'para_ler' ? 'nao_iniciado' : book.status,
      highlights: book.quote ? [book.quote] : ['A essência do estudo da psicologia reside na observação compassiva e analítica.'],
    };
    setReaderReading(readingObj);
    setIsReaderOpen(true);
    setSelectedBook(null);
  };

  const resetAllFilters = () => {
    setActiveCategory('todos');
    setActiveStatus('todos');
    setSelectedTag(null);
    setSearchTerm('');
  };

  const hasActiveFilters =
    activeCategory !== 'todos' ||
    activeStatus !== 'todos' ||
    selectedTag !== null ||
    searchTerm.trim() !== '';

  // Filter collections by search term and filter selections
  const filteredCollections = initialContextCollections.filter((col) => {
    const matchesCategory =
      activeCategory === 'todos' ||
      (activeCategory === 'autores' && col.blockCategory === 'autores') ||
      (activeCategory === 'conceitos' && col.blockCategory === 'conceitos') ||
      (activeCategory === 'abordagens' && col.blockCategory === 'abordagens') ||
      (activeCategory === 'multidisciplinar' && col.blockCategory === 'multidisciplinar') ||
      (activeCategory === 'testes' && col.blockCategory === 'testes') ||
      (activeCategory === 'salvos' && col.books.some((b) => savedBookIds.includes(b.id))) ||
      (activeCategory === 'em_leitura' && col.books.some((b) => b.status === 'lendo'));

    const matchesStatus =
      activeStatus === 'todos' ||
      col.books.some((b) => b.status === activeStatus);

    const matchesTag =
      !selectedTag ||
      col.books.some((b) =>
        b.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()))
      );

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      col.title.toLowerCase().includes(searchLower) ||
      col.subtitle.toLowerCase().includes(searchLower) ||
      col.books.some(
        (b) =>
          b.title.toLowerCase().includes(searchLower) ||
          b.author.toLowerCase().includes(searchLower) ||
          b.tags.some((t) => t.toLowerCase().includes(searchLower))
      );

    return matchesCategory && matchesStatus && matchesTag && matchesSearch;
  });

  // Filter loose trending books by search term and filters
  const filteredTrendingBooks = initialTrendingBooks.filter((b) => {
    if (activeStatus !== 'todos' && b.status !== activeStatus) return false;
    if (activeCategory === 'salvos' && !savedBookIds.includes(b.id)) return false;
    if (activeCategory === 'em_leitura' && b.status !== 'lendo') return false;
    if (selectedTag && !b.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()))) return false;

    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      b.title.toLowerCase().includes(searchLower) ||
      b.author.toLowerCase().includes(searchLower) ||
      b.tags.some((t) => t.toLowerCase().includes(searchLower))
    );
  });

  // Category specific slices for inline sections
  const testCollections = filteredCollections.filter((c) => c.blockCategory === 'testes');
  const authorCollections = filteredCollections.filter((c) => c.blockCategory === 'autores');
  const multidisciplinaryCollections = filteredCollections.filter((c) => c.blockCategory === 'multidisciplinar');
  const conceptCollections = filteredCollections.filter((c) => c.blockCategory === 'conceitos');
  const approachCollections = filteredCollections.filter((c) => c.blockCategory === 'abordagens');

  // Dedicated Screen View for "Suas Notas"
  if (isNotesScreenOpen) {
    return (
      <NotesScreen
        looseNotes={looseNotes}
        onAddNote={(note) => setLooseNotes((prev) => [note, ...prev])}
        onDeleteNote={(id) => setLooseNotes((prev) => prev.filter((n) => n.id !== id))}
        isCreatingNote={isCreatingLooseNote}
        setIsCreatingNote={setIsCreatingLooseNote}
      />
    );
  }

  // Dedicated Screen View for "Templo de Conhecimento"
  if (isTempleScreenOpen) {
    return <TempleScreen />;
  }

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-1 relative">

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

      {/* Simple Navigation Card "suas notas" */}
      <button
        onClick={openNotesScreen}
        className="w-full text-left bg-white rounded-[22px] p-4 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs tap-interactive hover:shadow-xs active:scale-[0.99] cursor-pointer group flex items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong group-hover:bg-ceci-brand-strong group-hover:text-white transition-colors shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-ceci-primary font-display group-hover:text-ceci-brand-strong transition-colors">
                suas notas
              </h2>
              <span className="text-[10px] font-extrabold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
                {looseNotes.length} {looseNotes.length === 1 ? 'nota' : 'notas'}
              </span>
            </div>
            <p className="text-xs text-ceci-secondary mt-0.5 truncate">
              anotações rápidas e pensamentos avulsos guardados no app
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-ceci-brand-strong group-hover:translate-x-1 transition-transform shrink-0" />
      </button>

      {/* 3. Search Bar + Filter Toggle Button */}
      <div className="space-y-3 px-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ceci-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="pesquisar por obra, autor, Beck, Freud, TCC..."
              className="w-full bg-white border border-ceci-border-default rounded-2xl pl-10 pr-8 py-3 text-xs text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ceci-tertiary hover:text-ceci-primary cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-3.5 py-3 rounded-2xl border flex items-center gap-2 tap-interactive cursor-pointer shadow-2xs text-xs font-bold ${
              hasActiveFilters
                ? 'bg-ceci-primary text-white border-ceci-primary'
                : 'bg-white text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
            }`}
            title="abrir filtros"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-in fade-in duration-200">
            <span className="text-[11px] font-bold text-ceci-tertiary mr-1">filtros aplicados:</span>

            {activeCategory !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand rounded-full text-[11px] font-semibold">
                categoria: {activeCategory}
                <button onClick={() => setActiveCategory('todos')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeStatus !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic rounded-full text-[11px] font-semibold">
                status: {activeStatus}
                <button onClick={() => setActiveStatus('todos')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-mint-soft text-success-deep border border-ceci-border-academic rounded-full text-[11px] font-semibold">
                tag: {selectedTag}
                <button onClick={() => setSelectedTag(null)} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-muted text-ceci-primary border border-ceci-border-default rounded-full text-[11px] font-semibold">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={resetAllFilters}
              className="text-[11px] font-bold text-ceci-brand-strong hover:underline ml-1 cursor-pointer flex items-center gap-0.5"
            >
              <RotateCcw className="w-3 h-3" />
              esquecer filtros
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* INLINE SECTION 1: REPERTÓRIO & LEITURAS RECOMENDADAS               */}
      {/* ==================================================================== */}
      {filteredTrendingBooks.length > 0 && (
        <div className="space-y-3 pt-2 px-1 border-t border-ceci-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ceci-brand-strong" />
              <h2 className="font-display font-bold text-base text-ceci-primary">
                repertório & leituras recomendadas
              </h2>
            </div>
            <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
              bagagem extra
            </span>
          </div>

          <p className="text-xs text-ceci-secondary leading-relaxed">
            obras de finanças comportamentais, design de experiência, literatura e decisão para enriquecer sua visão clínica.
          </p>

          {/* Horizontal Bookshelf directly on canvas */}
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
            {filteredTrendingBooks.map((book) => {
              const isSaved = savedBookIds.includes(book.id);
              return (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="w-[145px] sm:w-[160px] cursor-pointer group shrink-0 space-y-2"
                >
                  <div
                    className="w-full h-[145px] sm:h-[155px] rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden shadow-xs border border-black/5 card-lift"
                    style={{ backgroundColor: book.coverColor }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 border-r border-black/10" />

                    <div className="pl-1.5 flex items-center justify-between">
                      <span className="text-[8px] font-extrabold uppercase bg-white/90 text-ceci-primary px-1.5 py-0.5 rounded shadow-2xs line-clamp-1">
                        {book.badge || 'livro'}
                      </span>
                      {isSaved && (
                        <Bookmark className="w-3.5 h-3.5 fill-ceci-primary text-ceci-primary" />
                      )}
                    </div>

                    <div className="pl-1.5 my-auto">
                      <p className="font-display font-bold text-[11px] sm:text-[12px] text-ceci-primary line-clamp-3 leading-tight">
                        {book.title}
                      </p>
                    </div>

                    <div className="pl-1.5">
                      <p className="text-[9px] font-semibold text-ceci-primary/80 line-clamp-1">
                        {book.author}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-display font-bold text-xs text-ceci-primary line-clamp-1 group-hover:text-ceci-brand-strong transition-colors">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-ceci-tertiary line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* INLINE SECTION 2: TESTES & INSTRUMENTOS PSICOLÓGICOS               */}
      {/* ==================================================================== */}
      {(activeCategory === 'todos' || activeCategory === 'testes') && testCollections.length > 0 && (
        <div data-section="testes" className="space-y-4 pt-4 px-1 border-t border-ceci-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-success-deep" />
              <h2 className="font-display font-bold text-base text-ceci-primary">
                testes, escalas & avaliação clínica
              </h2>
            </div>
            <span className="text-[11px] text-ceci-tertiary">
              {testCollections.length} coleções
            </span>
          </div>

          <div className="space-y-6">
            {testCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* INLINE SECTION 3: AUTORES DA PSICOLOGIA                              */}
      {/* ==================================================================== */}
      {(activeCategory === 'todos' || activeCategory === 'autores') && authorCollections.length > 0 && (
        <div data-section="autores" className="space-y-4 pt-4 px-1 border-t border-ceci-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-ceci-brand-strong" />
              <h2 className="font-display font-bold text-base text-ceci-primary">
                autores & grandes obras
              </h2>
            </div>
            <span className="text-[11px] text-ceci-tertiary">
              {authorCollections.length} coleções
            </span>
          </div>

          <div className="space-y-6">
            {authorCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* INLINE SECTION 4: CONCEITOS-CHAVE & FICHAMENTOS                    */}
      {/* ==================================================================== */}
      {(activeCategory === 'todos' || activeCategory === 'conceitos') && conceptCollections.length > 0 && (
        <div data-section="conceitos" className="space-y-4 pt-4 px-1 border-t border-ceci-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ceci-academic-strong" />
              <h2 className="font-display font-bold text-base text-ceci-primary">
                conceitos-chave & fichamentos
              </h2>
            </div>
            <span className="text-[11px] text-ceci-tertiary">
              {conceptCollections.length} coleções
            </span>
          </div>

          <div className="space-y-6">
            {conceptCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* INLINE SECTION 5: ABORDAGENS DA PSICOLOGIA                           */}
      {/* ==================================================================== */}
      {(activeCategory === 'todos' || activeCategory === 'abordagens') && approachCollections.length > 0 && (
        <div data-section="abordagens" className="space-y-4 pt-4 px-1 border-t border-ceci-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-beige-700" />
              <h2 className="font-display font-bold text-base text-ceci-primary">
                abordagens & correntes da psicologia
              </h2>
            </div>
            <span className="text-[11px] text-ceci-tertiary">
              {approachCollections.length} coleções
            </span>
          </div>

          <div className="space-y-6">
            {approachCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* INLINE SECTION 6: BAGAGEM MULTIDISCIPLINAR COMPLETA                  */}
      {/* ==================================================================== */}
      {(activeCategory === 'todos' || activeCategory === 'multidisciplinar') && multidisciplinaryCollections.length > 0 && (
        <div data-section="multidisciplinar" className="space-y-4 pt-4 px-1 border-t border-ceci-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-gold" />
              <h2 className="font-display font-bold text-base text-ceci-primary">
                coleções de bagagem complementar
              </h2>
            </div>
            <span className="text-[11px] text-ceci-tertiary">
              {multidisciplinaryCollections.length} coleções
            </span>
          </div>

          <div className="space-y-6">
            {multidisciplinaryCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty Filter State */}
      {filteredCollections.length === 0 && filteredTrendingBooks.length === 0 && (
        <div className="py-12 text-center space-y-3 px-1 border-t border-ceci-border-default">
          <BookOpen className="w-8 h-8 text-ceci-faded mx-auto" />
          <h3 className="font-display font-bold text-base text-ceci-primary">
            nenhuma coleção ou obra encontrada
          </h3>
          <p className="text-xs text-ceci-secondary max-w-xs mx-auto">
            nenhum resultado com esses filtros. que tal afrouxar um pouco?
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong rounded-full text-xs font-bold cursor-pointer"
          >
            limpar filtros
          </button>
        </div>
      )}

      {/* Floating Action Button (+) */}
      <button
        onClick={openQuickAdd}
        className="fixed bottom-20 right-5 sm:right-8 z-30 w-12 h-12 rounded-full bg-ceci-primary hover:bg-ceci-primary-hover text-white shadow-lg flex items-center justify-center transition-transform active:scale-90 cursor-pointer border border-white/20"
        title="novo registro na biblioteca"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Filter Modal / Drawer */}
      <LibraryFilterModal
        isOpen={isFilterModalOpen}
        activeCategory={activeCategory}
        activeStatus={activeStatus}
        selectedTag={selectedTag}
        availableTags={availableTags}
        onCategoryChange={setActiveCategory}
        onStatusChange={setActiveStatus}
        onTagChange={setSelectedTag}
        onReset={resetAllFilters}
        onClose={() => setIsFilterModalOpen(false)}
      />

      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          isSaved={savedBookIds.includes(selectedBook.id)}
          onClose={() => setSelectedBook(null)}
          onToggleSave={() => toggleSaveBook(selectedBook.id)}
          onOpenReader={() => handleOpenReaderForBook(selectedBook)}
        />
      )}

      {/* Reader Mode Modal */}
      <ReaderModeModal
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        reading={readerReading}
      />

    </div>
  );
};
