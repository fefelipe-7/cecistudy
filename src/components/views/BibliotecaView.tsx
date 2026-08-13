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
import { LooseNote, INITIAL_NOTES } from '../library/notes';
import { usePersistentState } from '../../lib/usePersistentState';
import { useApp } from '../../context/AppContext';

export const BibliotecaView: React.FC = () => {
  const { openQuickAdd } = useApp();
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

  // Dedicated Notes Screen
  const [isNotasScreenOpen, setIsNotasScreenOpen] = useState(false);
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
  if (isNotasScreenOpen) {
    return (
      <NotesScreen
        looseNotes={looseNotes}
        onAddNote={(note) => setLooseNotes((prev) => [note, ...prev])}
        onDeleteNote={(id) => setLooseNotes((prev) => prev.filter((n) => n.id !== id))}
        onBack={() => setIsNotasScreenOpen(false)}
      />
    );
  }

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-1 animate-in fade-in duration-300 relative">

      {/* 1. Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <span className="text-xs text-[#6D6366] font-medium lowercase tracking-wide flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#E97891]" /> biblioteca & repertório
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-[#40383A] font-bold mt-0.5 tracking-tight">
            minhas coleções ♡
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openQuickAdd}
            className="w-10 h-10 rounded-2xl bg-white border border-[#E9DFDC] hover:border-[#FFD3DD] flex items-center justify-center text-[#40383A] shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Adicionar obra ou fichamento"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Simple Navigation Card "suas notas" */}
      <button
        onClick={() => setIsNotasScreenOpen(true)}
        className="w-full text-left bg-white rounded-[22px] p-4 border border-[#E9DFDC] hover:border-[#FFD3DD] shadow-2xs transition-all hover:shadow-xs active:scale-[0.99] cursor-pointer group flex items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF5F7] border border-[#FFD3DD] flex items-center justify-center text-[#B94862] group-hover:bg-[#B94862] group-hover:text-white transition-colors shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#40383A] font-display group-hover:text-[#B94862] transition-colors">
                suas notas
              </h2>
              <span className="text-[10px] font-extrabold text-[#B94862] bg-[#FFF5F7] px-2 py-0.5 rounded-full border border-[#FFD3DD]">
                {looseNotes.length} {looseNotes.length === 1 ? 'nota' : 'notas'}
              </span>
            </div>
            <p className="text-xs text-[#6D6366] mt-0.5 truncate">
              anotações rápidas e pensamentos avulsos guardados no app
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#B94862] group-hover:translate-x-1 transition-transform shrink-0" />
      </button>

      {/* 3. Search Bar + Filter Toggle Button */}
      <div className="space-y-3 px-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#918689] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="pesquisar por obra, autor, Beck, Freud, TCC..."
              className="w-full bg-white border border-[#E9DFDC] rounded-2xl pl-10 pr-8 py-3 text-xs text-[#40383A] placeholder-[#BEB4B6] focus:outline-none focus:border-[#E97891] shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#918689] hover:text-[#40383A] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-3.5 py-3 rounded-2xl border flex items-center gap-2 transition-all cursor-pointer shadow-2xs text-xs font-bold ${
              hasActiveFilters
                ? 'bg-[#40383A] text-white border-[#40383A]'
                : 'bg-white text-[#6D6366] border-[#E9DFDC] hover:bg-[#FAF8F5]'
            }`}
            title="Abrir filtros"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#E97891] animate-pulse" />
            )}
          </button>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-in fade-in duration-200">
            <span className="text-[11px] font-bold text-[#918689] mr-1">filtros ativos:</span>

            {activeCategory !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FFF5F7] text-[#B94862] border border-[#FFD3DD] rounded-full text-[11px] font-semibold">
                categoria: {activeCategory}
                <button onClick={() => setActiveCategory('todos')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeStatus !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F3F9FC] text-[#396D82] border border-[#CEE7F0] rounded-full text-[11px] font-semibold">
                status: {activeStatus}
                <button onClick={() => setActiveStatus('todos')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EAF5ED] text-[#2D6A4F] border border-[#CEE7F0] rounded-full text-[11px] font-semibold">
                tag: {selectedTag}
                <button onClick={() => setSelectedTag(null)} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FAF8F5] text-[#40383A] border border-[#E9DFDC] rounded-full text-[11px] font-semibold">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={resetAllFilters}
              className="text-[11px] font-bold text-[#B94862] hover:underline ml-1 cursor-pointer flex items-center gap-0.5"
            >
              <RotateCcw className="w-3 h-3" />
              limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* INLINE SECTION 1: REPERTÓRIO & LEITURAS RECOMENDADAS               */}
      {/* ==================================================================== */}
      {filteredTrendingBooks.length > 0 && (
        <div className="space-y-3 pt-2 px-1 border-t border-[#E9DFDC]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#B94862]" />
              <h2 className="font-display font-bold text-base text-[#40383A]">
                repertório & leituras recomendadas
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#B94862] bg-[#FFF5F7] px-2.5 py-0.5 rounded-full border border-[#FFD3DD]">
              bagagem extra
            </span>
          </div>

          <p className="text-xs text-[#6D6366] leading-relaxed">
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
                    className="w-full h-[145px] sm:h-[155px] rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden shadow-xs border border-black/5 group-hover:shadow-md group-hover:-translate-y-1 transition-all"
                    style={{ backgroundColor: book.coverColor }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 border-r border-black/10" />

                    <div className="pl-1.5 flex items-center justify-between">
                      <span className="text-[8px] font-extrabold uppercase bg-white/90 text-[#40383A] px-1.5 py-0.5 rounded shadow-2xs line-clamp-1">
                        {book.badge || 'Livro'}
                      </span>
                      {isSaved && (
                        <Bookmark className="w-3.5 h-3.5 fill-[#40383A] text-[#40383A]" />
                      )}
                    </div>

                    <div className="pl-1.5 my-auto">
                      <p className="font-display font-bold text-[11px] sm:text-[12px] text-[#40383A] line-clamp-3 leading-tight">
                        {book.title}
                      </p>
                    </div>

                    <div className="pl-1.5">
                      <p className="text-[9px] font-semibold text-[#40383A]/80 line-clamp-1">
                        {book.author}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-display font-bold text-xs text-[#40383A] line-clamp-1 group-hover:text-[#B94862] transition-colors">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-[#918689] line-clamp-1">
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
        <div className="space-y-4 pt-4 px-1 border-t border-[#E9DFDC]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#2D6A4F]" />
              <h2 className="font-display font-bold text-base text-[#40383A]">
                testes, escalas & avaliação clínica
              </h2>
            </div>
            <span className="text-[11px] text-[#918689]">
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
        <div className="space-y-4 pt-4 px-1 border-t border-[#E9DFDC]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#B94862]" />
              <h2 className="font-display font-bold text-base text-[#40383A]">
                autores & grandes obras
              </h2>
            </div>
            <span className="text-[11px] text-[#918689]">
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
        <div className="space-y-4 pt-4 px-1 border-t border-[#E9DFDC]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#396D82]" />
              <h2 className="font-display font-bold text-base text-[#40383A]">
                conceitos-chave & fichamentos
              </h2>
            </div>
            <span className="text-[11px] text-[#918689]">
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
        <div className="space-y-4 pt-4 px-1 border-t border-[#E9DFDC]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#756354]" />
              <h2 className="font-display font-bold text-base text-[#40383A]">
                abordagens & correntes da psicologia
              </h2>
            </div>
            <span className="text-[11px] text-[#918689]">
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
        <div className="space-y-4 pt-4 px-1 border-t border-[#E9DFDC]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#8C7338]" />
              <h2 className="font-display font-bold text-base text-[#40383A]">
                coleções de bagagem complementar
              </h2>
            </div>
            <span className="text-[11px] text-[#918689]">
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
        <div className="py-12 text-center space-y-3 px-1 border-t border-[#E9DFDC]">
          <BookOpen className="w-8 h-8 text-[#BEB4B6] mx-auto" />
          <h3 className="font-display font-bold text-base text-[#40383A]">
            nenhuma coleção ou obra encontrada
          </h3>
          <p className="text-xs text-[#6D6366] max-w-xs mx-auto">
            nenhum resultado para a combinação de filtros selecionada.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 bg-[#FFF5F7] border border-[#FFD3DD] text-[#B94862] rounded-full text-xs font-bold cursor-pointer"
          >
            limpar filtros
          </button>
        </div>
      )}

      {/* Floating Action Button (+) */}
      <button
        onClick={openQuickAdd}
        className="fixed bottom-20 right-5 sm:right-8 z-30 w-12 h-12 rounded-full bg-[#40383A] hover:bg-[#2D2728] text-white shadow-lg flex items-center justify-center transition-transform active:scale-90 cursor-pointer border border-white/20"
        title="Novo registro na biblioteca"
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
