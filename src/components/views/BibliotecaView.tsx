import React, { useState } from 'react';
import {
  BookOpen,
  User,
  Sparkles,
  Search,
  Plus,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  X,
  SlidersHorizontal,
  TrendingUp,
  BrainCircuit,
  Compass,
  GraduationCap,
  Tag,
  ArrowRight
} from 'lucide-react';
import {
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  MaterialItem,
  Course,
  SubTabBiblioteca,
  ReadingItem
} from '../../types';
import {
  initialContextCollections,
  initialTrendingBooks,
  ContextCollection,
  CollectionBook
} from '../../data/libraryData';
import { ReaderModeModal } from '../widgets/ReaderModeModal';

interface BibliotecaViewProps {
  authors: PsychologyAuthor[];
  concepts: PsychologyConcept[];
  approaches: PsychologyApproach[];
  materials: MaterialItem[];
  courses: Course[];
  initialSubTab?: SubTabBiblioteca;
  initialSelectedId?: string;
  onOpenQuickAdd: () => void;
}

export const BibliotecaView: React.FC<BibliotecaViewProps> = ({
  initialSubTab = 'autores',
  initialSelectedId,
  onOpenQuickAdd,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<CollectionBook | null>(null);
  const [readerReading, setReaderReading] = useState<ReadingItem | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [savedBookIds, setSavedBookIds] = useState<string[]>(['bk-1', 'bk-5', 'bk-9', 'tr-1', 'tr-3', 'bk-33']);

  // Recent searches list matching reference image
  const [recentTags, setRecentTags] = useState<string[]>([
    'Finanças Comportamentais',
    'Don Norman',
    'BFP Bateria',
    'Hábitos Atômicos',
    'Viktor Frankl',
    'Kahneman'
  ]);

  const removeRecentTag = (tagToRemove: string) => {
    setRecentTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

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

  // Filter collections by search term and filter category
  const filteredCollections = initialContextCollections.filter((col) => {
    const matchesCategory =
      activeFilter === 'todos' ||
      (activeFilter === 'autores' && col.blockCategory === 'autores') ||
      (activeFilter === 'conceitos' && col.blockCategory === 'conceitos') ||
      (activeFilter === 'abordagens' && col.blockCategory === 'abordagens') ||
      (activeFilter === 'multidisciplinar' && col.blockCategory === 'multidisciplinar') ||
      (activeFilter === 'testes' && col.blockCategory === 'testes') ||
      (activeFilter === 'salvos' && col.books.some((b) => savedBookIds.includes(b.id))) ||
      (activeFilter === 'em_leitura' && col.books.some((b) => b.status === 'lendo'));

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

    return matchesCategory && matchesSearch;
  });

  // Filter loose trending books by search term
  const filteredTrendingBooks = initialTrendingBooks.filter((b) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      b.title.toLowerCase().includes(searchLower) ||
      b.author.toLowerCase().includes(searchLower) ||
      b.tags.some((t) => t.toLowerCase().includes(searchLower))
    );
  });

  // Group collections by block context
  const authorCollections = filteredCollections.filter((c) => c.blockCategory === 'autores');
  const conceptCollections = filteredCollections.filter((c) => c.blockCategory === 'conceitos');
  const approachCollections = filteredCollections.filter((c) => c.blockCategory === 'abordagens');
  const multidisciplinaryCollections = filteredCollections.filter((c) => c.blockCategory === 'multidisciplinar');
  const testCollections = filteredCollections.filter((c) => c.blockCategory === 'testes');

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300 relative">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[#918689] lowercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#E97891]" /> biblioteca & repertório
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-[#40383A] font-bold mt-0.5 tracking-tight">
            minhas coleções ♡
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickAdd}
            className="w-10 h-10 rounded-2xl bg-white border border-[#E9DFDC] hover:border-[#FFD3DD] flex items-center justify-center text-[#40383A] shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Adicionar obra"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-[#FFF5F7] border border-[#FFD3DD] flex items-center justify-center text-[#B94862] font-display font-bold text-lg shadow-2xs">
            C
          </div>
        </div>
      </div>

      {/* 2. Search Bar + Filter Icon (Matching Reference Image Header) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#918689] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="pesquisar livros, autores, temas, testes..."
              className="w-full bg-white border border-[#E9DFDC] rounded-2xl pl-10 pr-8 py-3 text-xs text-[#40383A] placeholder-[#BEB4B6] focus:outline-none focus:border-[#E97891] shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#918689] hover:text-[#40383A]"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setActiveFilter(activeFilter === 'todos' ? 'multidisciplinar' : 'todos')}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
              activeFilter !== 'todos'
                ? 'bg-[#40383A] text-white border-[#40383A]'
                : 'bg-white text-[#6D6366] border-[#E9DFDC] hover:bg-[#FAF8F5]'
            }`}
            title="Filtrar por categorias"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Search Tags / Quick Pills (Ref: Recent Search pills in reference image) */}
        {recentTags.length > 0 && !searchTerm && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] text-[#918689] px-0.5 font-medium">
              <span>buscas e atalhos populares</span>
              <button
                onClick={() => setRecentTags([])}
                className="hover:text-[#B94862] transition-colors cursor-pointer"
              >
                limpar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => setSearchTerm(tag)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E9DFDC] hover:border-[#FFD3DD] hover:bg-[#FFF5F7] rounded-full text-[11px] font-medium text-[#40383A] transition-all cursor-pointer shadow-2xs"
                >
                  <span>{tag}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentTag(tag);
                    }}
                    className="text-[#BEB4B6] hover:text-[#B94862]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter Pills Row (All, Autores, Conceitos, Abordagens, Multidisciplinar, Testes, Salvos) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-0.5 pt-1">
          {[
            { id: 'todos', label: 'todos' },
            { id: 'multidisciplinar', label: 'bagagem extra 💡' },
            { id: 'testes', label: 'testes & escalas 📊' },
            { id: 'autores', label: 'autores' },
            { id: 'conceitos', label: 'conceitos' },
            { id: 'abordagens', label: 'abordagens' },
            { id: 'em_leitura', label: 'em leitura 📖' },
            { id: 'salvos', label: 'salvos ♡' },
          ].map((chip) => {
            const isSel = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#40383A] text-white shadow-xs scale-102'
                    : 'bg-white text-[#6D6366] border border-[#E9DFDC] hover:bg-[#FAF8F5]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LOOSE LIST: "BAGAGEM RECOMENDADA & REPERTÓRIO SOLTO" (Ref: Trending Section in Reference Image) */}
      {(activeFilter === 'todos' || activeFilter === 'multidisciplinar') && filteredTrendingBooks.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#B94862]" />
              <h2 className="font-display font-bold text-lg text-[#40383A]">
                repertório & leituras recomendadas
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#918689] bg-[#FFF5F7] px-2.5 py-1 rounded-full border border-[#FFD3DD] text-[#B94862]">
              além da psicologia
            </span>
          </div>

          <p className="text-xs text-[#6D6366] px-1 leading-relaxed">
            obras de finanças comportamentais, design de experiência, literatura e decisão para enriquecer sua visão clínica.
          </p>

          {/* Horizontal Loose Books Carousel Card List (Exact style from Reference Image "Trending This Weeks") */}
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none px-0.5">
            {filteredTrendingBooks.map((book) => {
              const isSaved = savedBookIds.includes(book.id);
              return (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="w-[150px] sm:w-[165px] bg-white rounded-[24px] p-3 border border-[#E9DFDC] hover:border-[#FFD3DD] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between shrink-0 group"
                >
                  {/* Book Cover Container with Soft Gradient/Color */}
                  <div
                    className="w-full h-[140px] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden shadow-2xs border border-black/5"
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
                      <p className="font-display font-bold text-[12px] text-[#40383A] line-clamp-3 leading-tight">
                        {book.title}
                      </p>
                    </div>

                    <div className="pl-1.5">
                      <p className="text-[9px] font-semibold text-[#40383A]/80 line-clamp-1">
                        {book.author}
                      </p>
                    </div>
                  </div>

                  {/* Info below cover (Ref: Title + Author text underneath card in reference image) */}
                  <div className="mt-3 space-y-1">
                    <p className="font-display font-bold text-xs text-[#40383A] line-clamp-1 group-hover:text-[#B94862] transition-colors">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-[#918689] line-clamp-1 font-medium">
                      {book.author}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-[#2D6A4F] bg-[#EAF5ED] px-2 py-0.5 rounded-full">
                        {book.tags[0] || 'Multidisciplinar'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#BEB4B6] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. CONTEXT BLOCKS (Blocos de Contexto Principais) */}

      {/* BLOCO: TESTES & INSTRUMENTOS PSICOLÓGICOS */}
      {(activeFilter === 'todos' || activeFilter === 'testes') && testCollections.length > 0 && (
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#2D6A4F]" />
              <h2 className="font-display font-bold text-lg text-[#40383A]">
                testes, escalas & avaliação clínica
              </h2>
            </div>
            <button
              onClick={() => setActiveFilter('testes')}
              className="text-xs font-semibold text-[#918689] hover:text-[#2D6A4F] transition-colors cursor-pointer"
            >
              ver todos
            </button>
          </div>

          <div className="space-y-5">
            {testCollections.map((col) => (
              <CollectionCard
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
                onToggleSaveBook={toggleSaveBook}
              />
            ))}
          </div>
        </section>
      )}

      {/* BLOCO: AUTORES DA PSICOLOGIA */}
      {(activeFilter === 'todos' || activeFilter === 'autores') && authorCollections.length > 0 && (
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#B94862]" />
              <h2 className="font-display font-bold text-lg text-[#40383A]">
                autores & grandes obras
              </h2>
            </div>
            <button
              onClick={() => setActiveFilter('autores')}
              className="text-xs font-semibold text-[#918689] hover:text-[#B94862] transition-colors cursor-pointer"
            >
              ver todos
            </button>
          </div>

          <div className="space-y-5">
            {authorCollections.map((col) => (
              <CollectionCard
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
                onToggleSaveBook={toggleSaveBook}
              />
            ))}
          </div>
        </section>
      )}

      {/* BLOCO: BAGAGEM MULTIDISCIPLINAR COMPLETA */}
      {(activeFilter === 'todos' || activeFilter === 'multidisciplinar') && multidisciplinaryCollections.length > 0 && (
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#8C7338]" />
              <h2 className="font-display font-bold text-lg text-[#40383A]">
                coleções de bagagem complementar
              </h2>
            </div>
            <button
              onClick={() => setActiveFilter('multidisciplinar')}
              className="text-xs font-semibold text-[#918689] hover:text-[#8C7338] transition-colors cursor-pointer"
            >
              ver todos
            </button>
          </div>

          <div className="space-y-5">
            {multidisciplinaryCollections.map((col) => (
              <CollectionCard
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
                onToggleSaveBook={toggleSaveBook}
              />
            ))}
          </div>
        </section>
      )}

      {/* BLOCO: CONCEITOS-CHAVE & FICHAMENTOS */}
      {(activeFilter === 'todos' || activeFilter === 'conceitos') && conceptCollections.length > 0 && (
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#396D82]" />
              <h2 className="font-display font-bold text-lg text-[#40383A]">
                conceitos-chave & fichamentos
              </h2>
            </div>
            <button
              onClick={() => setActiveFilter('conceitos')}
              className="text-xs font-semibold text-[#918689] hover:text-[#396D82] transition-colors cursor-pointer"
            >
              ver todos
            </button>
          </div>

          <div className="space-y-5">
            {conceptCollections.map((col) => (
              <CollectionCard
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
                onToggleSaveBook={toggleSaveBook}
              />
            ))}
          </div>
        </section>
      )}

      {/* BLOCO: ABORDAGENS DA PSICOLOGIA */}
      {(activeFilter === 'todos' || activeFilter === 'abordagens') && approachCollections.length > 0 && (
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#756354]" />
              <h2 className="font-display font-bold text-lg text-[#40383A]">
                abordagens & correntes da psicologia
              </h2>
            </div>
            <button
              onClick={() => setActiveFilter('abordagens')}
              className="text-xs font-semibold text-[#918689] hover:text-[#756354] transition-colors cursor-pointer"
            >
              ver todos
            </button>
          </div>

          <div className="space-y-5">
            {approachCollections.map((col) => (
              <CollectionCard
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => setSelectedBook(book)}
                onToggleSaveBook={toggleSaveBook}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty Search / Filter State */}
      {filteredCollections.length === 0 && filteredTrendingBooks.length === 0 && (
        <div className="rounded-[28px] p-8 bg-white border border-[#E9DFDC] text-center space-y-3">
          <BookOpen className="w-8 h-8 text-[#BEB4B6] mx-auto" />
          <h3 className="font-display font-bold text-base text-[#40383A]">
            nenhuma coleção ou obra encontrada
          </h3>
          <p className="text-xs text-[#6D6366] max-w-xs mx-auto">
            tente pesquisar por termos como Beck, Freud, BFP, Norman, Kahneman, Frankl ou alterar os filtros.
          </p>
          <button
            onClick={() => {
              setActiveFilter('todos');
              setSearchTerm('');
            }}
            className="px-4 py-2 bg-[#FFF5F7] border border-[#FFD3DD] text-[#B94862] rounded-full text-xs font-bold cursor-pointer"
          >
            limpar filtros
          </button>
        </div>
      )}

      {/* Floating Action Button (+) matching Reference Image */}
      <button
        onClick={onOpenQuickAdd}
        className="fixed bottom-20 right-5 sm:right-8 z-30 w-12 h-12 rounded-full bg-[#40383A] hover:bg-[#2D2728] text-white shadow-lg flex items-center justify-center transition-transform active:scale-90 cursor-pointer border border-white/20"
        title="Novo registro na biblioteca"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

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

/* -------------------------------------------------------------------------- */
/* COLLECTION CARD COMPONENT (Matching Reference Image Design Structure)     */
/* -------------------------------------------------------------------------- */

interface CollectionCardProps {
  collection: ContextCollection;
  savedBookIds: string[];
  onSelectBook: (book: CollectionBook) => void;
  onToggleSaveBook: (bookId: string) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  savedBookIds,
  onSelectBook,
}) => {
  return (
    <div className="rounded-[28px] p-5 sm:p-6 bg-white border border-[#E9DFDC] shadow-[0_4px_16px_rgba(64,56,58,0.04)] hover:border-[#FFD3DD] transition-all relative overflow-hidden group">
      
      {/* Top Meta Header Line (Ref: Avatars left + Book count right) */}
      <div className="flex items-center justify-between text-xs text-[#6D6366] mb-3">
        {/* Left: Readers Avatar Bubble Stack */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5 overflow-hidden">
            {collection.readersAvatars.map((av, idx) => (
              <div
                key={idx}
                className="inline-block h-6 w-6 rounded-full border-2 border-white flex items-center justify-center font-bold text-[9px] shadow-2xs shrink-0"
                style={{ backgroundColor: av.bg, color: av.text }}
              >
                {av.name.charAt(0)}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-[#6D6366]">
            {collection.readersCount} leitores
          </span>
        </div>

        {/* Right: Book Count Tag */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E9DFDC] text-[11px] font-semibold text-[#40383A]">
          <BookOpen className="w-3.5 h-3.5 text-[#918689]" />
          <span>{collection.books.length} livros</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-1">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-[#40383A] tracking-tight group-hover:text-[#B94862] transition-colors">
          {collection.title}
        </h3>
        <p className="text-xs text-[#6D6366] leading-relaxed line-clamp-2">
          {collection.subtitle}
        </p>
      </div>

      {/* Realistic Book Cover Showcase / Gallery (Ref: Lined up book covers) */}
      <div className="mt-5 pt-3 pb-1 border-t border-[#F7F2EF] flex items-end justify-center sm:justify-start gap-2.5 sm:gap-3 overflow-x-auto scrollbar-none px-0.5">
        {collection.books.map((book) => {
          const isSaved = savedBookIds.includes(book.id);
          const progressPercent = Math.round((book.readPages / book.totalPages) * 100);

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="group/book relative w-[105px] sm:w-[115px] h-[145px] sm:h-[155px] rounded-xl p-2.5 flex flex-col justify-between shrink-0 shadow-md hover:shadow-xl hover:-translate-y-2 hover:rotate-1 transition-all duration-200 cursor-pointer overflow-hidden border border-black/5 select-none"
              style={{ backgroundColor: book.coverColor }}
            >
              {/* Realistic Book Spine Effect on Left */}
              <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 border-r border-black/10 backdrop-blur-3xs" />

              {/* Cover Top Badge */}
              <div className="pl-2 flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider bg-white/90 text-[#40383A] px-1.5 py-0.5 rounded shadow-2xs line-clamp-1 max-w-[70px]">
                  {book.badge || 'Livro'}
                </span>
                {isSaved && (
                  <Bookmark className="w-3 h-3 fill-[#40383A] text-[#40383A]" />
                )}
              </div>

              {/* Cover Main Title */}
              <div className="pl-2 my-auto">
                <p className="font-display font-bold text-[11px] sm:text-[12px] leading-tight text-[#40383A] line-clamp-3">
                  {book.title}
                </p>
              </div>

              {/* Cover Bottom Info */}
              <div className="pl-2 space-y-1">
                <p className="text-[9px] font-semibold text-[#40383A]/80 line-clamp-1">
                  {book.author}
                </p>

                {/* Reading Progress Indicator */}
                {book.status === 'lendo' && (
                  <div className="w-full bg-black/10 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[#40383A] h-full rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* BOOK DETAIL MODAL COMPONENT                                                */
/* -------------------------------------------------------------------------- */

interface BookDetailModalProps {
  book: CollectionBook;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onOpenReader: () => void;
}

const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isSaved,
  onClose,
  onToggleSave,
  onOpenReader,
}) => {
  const progressPercent = Math.round((book.readPages / book.totalPages) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-[28px] border border-[#E9DFDC] shadow-2xl overflow-hidden text-[#40383A] space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Cover Preview Header */}
        <div
          className="p-6 text-center relative flex flex-col items-center justify-center space-y-2"
          style={{ backgroundColor: book.coverColor }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#40383A] flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mini Book Cover Card */}
          <div className="w-24 h-32 rounded-xl p-3 bg-white/90 shadow-lg border border-black/10 flex flex-col justify-between text-left relative">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-xl" />
            <span className="pl-1 text-[8px] font-bold uppercase text-[#918689]">
              {book.badge || 'Livro'}
            </span>
            <p className="pl-1 font-display font-bold text-xs leading-tight text-[#40383A] line-clamp-3">
              {book.title}
            </p>
            <p className="pl-1 text-[9px] text-[#6D6366] line-clamp-1">
              {book.author}
            </p>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#40383A] px-2.5 py-0.5 rounded-full shadow-2xs">
            {book.courseName || 'Psicologia'}
          </span>
        </div>

        {/* Modal Content */}
        <div className="px-6 space-y-4 pb-6">
          <div>
            <h3 className="font-display font-bold text-lg text-[#40383A] leading-tight">
              {book.title}
            </h3>
            <p className="text-xs text-[#918689] mt-0.5 font-medium">Por {book.author}</p>
          </div>

          {/* Progress Bar */}
          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E9DFDC] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#40383A]">
                Progresso: {book.readPages} / {book.totalPages} págs
              </span>
              <span className="font-bold text-[#B94862]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#E9DFDC] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#B94862] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Book Description */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#918689] lowercase">resumo da obra</span>
            <p className="text-xs text-[#6D6366] leading-relaxed bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2EBE8]">
              {book.description}
            </p>
          </div>

          {/* Quote Highlight */}
          {book.quote && (
            <div className="p-3 rounded-2xl bg-[#FFF5F7] border-l-4 border-[#E97891] text-xs italic text-[#756354]">
              "{book.quote}"
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onToggleSave}
              className={`p-3 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer min-h-[44px] ${
                isSaved
                  ? 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862]'
                  : 'bg-white border-[#E9DFDC] text-[#6D6366] hover:bg-[#FAF8F5]'
              }`}
              title="Salvar citação/livro"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#B94862]' : ''}`} />
            </button>

            <button
              onClick={onOpenReader}
              className="flex-1 bg-[#40383A] hover:bg-[#2D2728] text-white py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-transform active:scale-98 cursor-pointer min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" />
              <span>abrir no modo leitura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
