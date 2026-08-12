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
  Filter,
  Check,
  RotateCcw,
  FileText,
  ArrowLeft,
  Copy,
  Trash2,
  StickyNote,
  Tag
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
  authors?: PsychologyAuthor[];
  concepts?: PsychologyConcept[];
  approaches?: PsychologyApproach[];
  materials?: MaterialItem[];
  courses?: Course[];
  initialSubTab?: SubTabBiblioteca;
  initialSelectedId?: string;
  onOpenQuickAdd: () => void;
}

export const BibliotecaView: React.FC<BibliotecaViewProps> = ({
  onOpenQuickAdd,
}) => {
  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>('todos'); // 'todos', 'autores', 'conceitos', 'abordagens', 'multidisciplinar', 'testes', 'salvos', 'em_leitura'
  const [activeStatus, setActiveStatus] = useState<string>('todos'); // 'todos', 'lendo', 'concluido', 'para_ler'
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Detail & Modal States
  const [selectedBook, setSelectedBook] = useState<CollectionBook | null>(null);
  const [readerReading, setReaderReading] = useState<ReadingItem | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [savedBookIds, setSavedBookIds] = useState<string[]>([
    'bk-1', 'bk-5', 'bk-9', 'tr-1', 'tr-3', 'bk-33'
  ]);

  // Dedicated Notes Screen & Loose Notes State (suas notas)
  const [isNotasScreenOpen, setIsNotasScreenOpen] = useState(false);
  const [noteSearchTerm, setNoteSearchTerm] = useState('');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState('todas');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const [looseNotes, setLooseNotes] = useState([
    {
      id: 'note-1',
      title: 'Reflexão sobre TCC',
      content: 'Considerações sobre o vínculo terapêutico na clínica comportamental. Importante enfatizar a empatia e escuta ativa no primeiro acolhimento.',
      category: 'reflexão',
      date: 'Hoje, 11:30'
    },
    {
      id: 'note-2',
      title: 'Anotação de estudo sobre Skinner',
      content: 'Diferença conceitual entre reforço negativo (remoção de estresse/aversivo) e punição positiva (apresentação de aversivo).',
      category: 'estudo',
      date: 'Ontem, 16:45'
    },
    {
      id: 'note-3',
      title: 'Ideia para mapa conceitual',
      content: 'Mapear autores da Psicanálise x Gestalt x TCC em uma linha do tempo comparativa.',
      category: 'ideia',
      date: '10 de Ago'
    }
  ]);

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'reflexão' | 'estudo' | 'ideia' | 'lembrete'>('reflexão');
  const [isCreatingNote, setIsCreatingNote] = useState(false);

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
    // Category match
    const matchesCategory =
      activeCategory === 'todos' ||
      (activeCategory === 'autores' && col.blockCategory === 'autores') ||
      (activeCategory === 'conceitos' && col.blockCategory === 'conceitos') ||
      (activeCategory === 'abordagens' && col.blockCategory === 'abordagens') ||
      (activeCategory === 'multidisciplinar' && col.blockCategory === 'multidisciplinar') ||
      (activeCategory === 'testes' && col.blockCategory === 'testes') ||
      (activeCategory === 'salvos' && col.books.some((b) => savedBookIds.includes(b.id))) ||
      (activeCategory === 'em_leitura' && col.books.some((b) => b.status === 'lendo'));

    // Book status match inside collection
    const matchesStatus =
      activeStatus === 'todos' ||
      col.books.some((b) => b.status === activeStatus);

    // Tag match
    const matchesTag =
      !selectedTag ||
      col.books.some((b) =>
        b.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()))
      );

    // Search term match
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

  // Stats calculation
  const totalBooksCount = initialContextCollections.reduce((acc, c) => acc + c.books.length, 0) + initialTrendingBooks.length;
  const currentlyReadingCount = initialTrendingBooks.filter(b => b.status === 'lendo').length + 3;

  // Dedicated Screen View for "Suas Notas"
  if (isNotasScreenOpen) {
    const filteredNotes = looseNotes.filter((note) => {
      const matchesCategory =
        noteCategoryFilter === 'todas' || note.category === noteCategoryFilter;
      const matchesSearch =
        !noteSearchTerm ||
        note.title.toLowerCase().includes(noteSearchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(noteSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return (
      <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 animate-in fade-in duration-300 relative">
        {/* Header with Back button */}
        <div className="flex items-center justify-between gap-3 pt-1 px-1">
          <button
            onClick={() => setIsNotasScreenOpen(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#B94862] hover:bg-[#FFF5F7] px-3 py-1.5 rounded-xl border border-[#FFD3DD] transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>voltar para biblioteca</span>
          </button>

          <span className="text-xs font-semibold text-[#6D6366] bg-white px-3 py-1 rounded-full border border-[#E9DFDC]">
            {looseNotes.length} {looseNotes.length === 1 ? 'nota salva' : 'notas salvas'}
          </span>
        </div>

        {/* Screen Title Banner */}
        <div className="bg-white rounded-[24px] p-5 border border-[#E9DFDC] space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F7] border border-[#FFD3DD] flex items-center justify-center text-[#B94862] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-[#40383A] leading-tight">
                suas notas avulsas
              </h1>
              <p className="text-xs text-[#6D6366]">
                espaço exclusivo para anotações rápidas, reflexões e lembretes soltos
              </p>
            </div>
          </div>
        </div>

        {/* Search & Action Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#918689] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={noteSearchTerm}
              onChange={(e) => setNoteSearchTerm(e.target.value)}
              placeholder="pesquisar em suas notas..."
              className="w-full bg-white border border-[#E9DFDC] rounded-2xl pl-10 pr-8 py-2.5 text-xs text-[#40383A] placeholder-[#BEB4B6] focus:outline-none focus:border-[#E97891] shadow-2xs"
            />
            {noteSearchTerm && (
              <button
                onClick={() => setNoteSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#918689] hover:text-[#40383A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsCreatingNote(!isCreatingNote)}
            className="bg-[#B94862] hover:bg-[#A03B52] text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreatingNote ? 'fechar' : 'nova nota'}</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
          {[
            { id: 'todas', label: 'todas' },
            { id: 'reflexão', label: 'reflexões' },
            { id: 'estudo', label: 'estudo' },
            { id: 'ideia', label: 'ideias' },
            { id: 'lembrete', label: 'lembretes' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setNoteCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                noteCategoryFilter === cat.id
                  ? 'bg-[#B94862] text-white shadow-2xs'
                  : 'bg-white text-[#6D6366] border border-[#E9DFDC] hover:border-[#FFD3DD]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* New Note Form */}
        {isCreatingNote && (
          <div className="bg-white rounded-[22px] p-4 border border-[#FFD3DD] bg-[#FFF5F7]/30 space-y-3 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#FFD3DD]/60 pb-2">
              <h3 className="text-xs font-bold text-[#40383A] font-display uppercase tracking-wider">
                criar nova nota avulsa
              </h3>
              <button
                onClick={() => setIsCreatingNote(false)}
                className="text-[#918689] hover:text-[#40383A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="título da nota (ex: Reflexão sobre acolhimento)"
                className="w-full bg-white border border-[#E9DFDC] rounded-xl px-3 py-2 text-xs font-semibold text-[#40383A] placeholder-[#BEB4B6] focus:outline-none focus:border-[#E97891]"
              />

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-[#6D6366]">categoria:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {(['reflexão', 'estudo', 'ideia', 'lembrete'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewNoteCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize cursor-pointer transition-all ${
                        newNoteCategory === cat
                          ? 'bg-[#B94862] text-white'
                          : 'bg-white text-[#6D6366] border border-[#E9DFDC]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="escreva o conteúdo da sua nota aqui..."
                rows={4}
                className="w-full bg-white border border-[#E9DFDC] rounded-xl p-3 text-xs text-[#40383A] placeholder-[#BEB4B6] focus:outline-none focus:border-[#E97891] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setIsCreatingNote(false);
                  setNewNoteTitle('');
                  setNewNoteContent('');
                }}
                className="px-3.5 py-1.5 text-xs text-[#6D6366] hover:bg-[#E9DFDC]/40 rounded-xl cursor-pointer"
              >
                cancelar
              </button>
              <button
                onClick={() => {
                  if (newNoteContent.trim()) {
                    const newNote = {
                      id: `note-${Date.now()}`,
                      title: newNoteTitle.trim() || 'Nota sem título',
                      content: newNoteContent.trim(),
                      category: newNoteCategory,
                      date: 'Hoje, agora',
                    };
                    setLooseNotes([newNote, ...looseNotes]);
                    setNewNoteTitle('');
                    setNewNoteContent('');
                    setIsCreatingNote(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold bg-[#B94862] text-white rounded-xl hover:bg-[#A03B52] cursor-pointer shadow-2xs"
              >
                salvar nota
              </button>
            </div>
          </div>
        )}

        {/* List of Notes */}
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-[20px] p-4 border border-[#E9DFDC] hover:border-[#FFD3DD] transition-all space-y-2.5 shadow-2xs flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-[#F2EBE8] pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      note.category === 'reflexão'
                        ? 'bg-[#FFF5F7] text-[#B94862] border border-[#FFD3DD]'
                        : note.category === 'estudo'
                        ? 'bg-[#F3F9FC] text-[#396D82] border border-[#CEE7F0]'
                        : note.category === 'ideia'
                        ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                        : 'bg-[#FAF8F5] text-[#6D6366] border border-[#E9DFDC]'
                    }`}>
                      {note.category}
                    </span>
                    <h3 className="font-bold font-display text-xs text-[#40383A] truncate">
                      {note.title}
                    </h3>
                  </div>

                  <span className="text-[10px] text-[#918689] shrink-0 font-medium">
                    {note.date}
                  </span>
                </div>

                <p className="text-xs text-[#40383A] leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F2EBE8]/60">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${note.title}\n${note.content}`);
                    setCopiedNoteId(note.id);
                    setTimeout(() => setCopiedNoteId(null), 2000);
                  }}
                  className="text-[11px] text-[#6D6366] hover:text-[#B94862] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#FFF5F7] transition-colors cursor-pointer"
                  title="Copiar texto da nota"
                >
                  {copiedNoteId === note.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span className="text-[#2D6A4F] font-bold">copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>copiar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setLooseNotes(looseNotes.filter((n) => n.id !== note.id))}
                  className="text-[11px] text-[#918689] hover:text-[#B94862] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#FFF5F7] transition-colors cursor-pointer"
                  title="Excluir nota"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>excluir</span>
                </button>
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="bg-white rounded-[22px] p-8 text-center border border-dashed border-[#E9DFDC] space-y-2">
              <StickyNote className="w-8 h-8 text-[#BEB4B6] mx-auto" />
              <p className="text-xs font-bold text-[#40383A]">nenhuma nota encontrada</p>
              <p className="text-xs text-[#6D6366]">
                {noteSearchTerm || noteCategoryFilter !== 'todas'
                  ? 'tente ajustar seus filtros de busca.'
                  : 'clique em "+ nova nota" acima para registrar sua primeira nota avulsa.'}
              </p>
            </div>
          )}
        </div>
      </div>
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
            onClick={onOpenQuickAdd}
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

        {/* Active Filter Badges (Shown ONLY when a filter is applied by user) */}
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
                  {/* Book Cover Container */}
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

                  {/* Title & info under cover */}
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
        onClick={onOpenQuickAdd}
        className="fixed bottom-20 right-5 sm:right-8 z-30 w-12 h-12 rounded-full bg-[#40383A] hover:bg-[#2D2728] text-white shadow-lg flex items-center justify-center transition-transform active:scale-90 cursor-pointer border border-white/20"
        title="Novo registro na biblioteca"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Filter Modal / Drawer */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[28px] border border-[#E9DFDC] shadow-2xl p-6 space-y-5 text-[#40383A] animate-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E9DFDC] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#B94862]" />
                <h3 className="font-display font-bold text-base text-[#40383A]">
                  filtrar acervo & coleções
                </h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#E9DFDC] text-[#6D6366] flex items-center justify-center cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Section 1: Categoria da Coleção */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#918689] uppercase tracking-wider block">
                categoria da obra / coleção
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'todos', label: 'Todas as categorias' },
                  { id: 'autores', label: 'Autores & Obras' },
                  { id: 'conceitos', label: 'Conceitos-Chave' },
                  { id: 'abordagens', label: 'Abordagens Terapêuticas' },
                  { id: 'testes', label: 'Testes & Escalas' },
                  { id: 'multidisciplinar', label: 'Bagagem Complementar' },
                  { id: 'salvos', label: 'Salvos ♡' },
                  { id: 'em_leitura', label: 'Em Leitura 📖' },
                ].map((cat) => {
                  const isSel = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSel
                          ? 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862] font-bold'
                          : 'bg-[#FAF8F5] border-[#E9DFDC] text-[#40383A] hover:bg-white'
                      }`}
                    >
                      <span className="line-clamp-1">{cat.label}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-[#B94862] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Status de Leitura */}
            <div className="space-y-2 pt-2 border-t border-[#E9DFDC]/70">
              <span className="text-[11px] font-bold text-[#918689] uppercase tracking-wider block">
                status de leitura
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'lendo', label: 'Lendo atualmente' },
                  { id: 'concluido', label: 'Lidos' },
                  { id: 'para_ler', label: 'Não iniciados' },
                ].map((st) => {
                  const isSel = activeStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setActiveStatus(st.id)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#40383A] text-white border-[#40383A]'
                          : 'bg-white border-[#E9DFDC] text-[#6D6366] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Tags / Temas Rápidos */}
            <div className="space-y-2 pt-2 border-t border-[#E9DFDC]/70">
              <span className="text-[11px] font-bold text-[#918689] uppercase tracking-wider block">
                filtrar por tema / autor específico
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isSel = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isSel ? null : tag)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#B94862] text-white border-[#B94862]'
                          : 'bg-[#FAF8F5] text-[#40383A] border-[#E9DFDC] hover:bg-white'
                      }`}
                    >
                      {tag} {isSel && '✕'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-[#E9DFDC] flex items-center gap-2">
              <button
                onClick={resetAllFilters}
                className="px-4 py-2.5 rounded-2xl border border-[#E9DFDC] text-[#6D6366] text-xs font-bold hover:bg-[#FAF8F5] cursor-pointer"
              >
                limpar tudo
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 bg-[#40383A] text-white py-2.5 rounded-2xl text-xs font-bold shadow-2xs hover:bg-[#2D2728] cursor-pointer"
              >
                aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

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
/* INLINE COLLECTION BLOCK (Clean Editorial Display Without Nested Cards)     */
/* -------------------------------------------------------------------------- */

interface InlineCollectionBlockProps {
  collection: ContextCollection;
  savedBookIds: string[];
  onSelectBook: (book: CollectionBook) => void;
}

const InlineCollectionBlock: React.FC<InlineCollectionBlockProps> = ({
  collection,
  savedBookIds,
  onSelectBook,
}) => {
  return (
    <div className="space-y-3">
      {/* Title with left raspberry accent border directly on page canvas */}
      <div className="border-l-3 border-[#B94862] pl-3.5 space-y-0.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-[#40383A] leading-tight">
            {collection.title}
          </h3>
          <span className="text-[10px] font-semibold text-[#918689] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E9DFDC]">
            {collection.books.length} obras
          </span>
        </div>
        <p className="text-xs text-[#6D6366] leading-relaxed">
          {collection.subtitle}
        </p>
      </div>

      {/* Books horizontal shelf */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
        {collection.books.map((book) => {
          const isSaved = savedBookIds.includes(book.id);
          const progressPercent = Math.round((book.readPages / book.totalPages) * 100);

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="group/book relative w-[105px] sm:w-[115px] h-[145px] sm:h-[155px] rounded-2xl p-2.5 flex flex-col justify-between shrink-0 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden border border-black/5 select-none"
              style={{ backgroundColor: book.coverColor }}
            >
              {/* Realistic Spine Line */}
              <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 border-r border-black/10 backdrop-blur-3xs" />

              <div className="pl-2 flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider bg-white/90 text-[#40383A] px-1.5 py-0.5 rounded shadow-2xs line-clamp-1 max-w-[70px]">
                  {book.badge || 'Livro'}
                </span>
                {isSaved && (
                  <Bookmark className="w-3 h-3 fill-[#40383A] text-[#40383A]" />
                )}
              </div>

              <div className="pl-2 my-auto">
                <p className="font-display font-bold text-[11px] sm:text-[12px] leading-tight text-[#40383A] line-clamp-3">
                  {book.title}
                </p>
              </div>

              <div className="pl-2 space-y-1">
                <p className="text-[9px] font-semibold text-[#40383A]/80 line-clamp-1">
                  {book.author}
                </p>

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
/* BOOK DETAIL MODAL                                                          */
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
