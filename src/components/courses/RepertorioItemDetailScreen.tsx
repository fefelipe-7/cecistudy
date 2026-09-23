import React, { useMemo, useState } from 'react';
import {
  BookMarked,
  BookOpen,
  ExternalLink,
  FileText,
  Lightbulb,
  Paperclip,
  Sparkles,
  User,
} from 'lucide-react';
import { Mascote } from '../ui/Mascote';
import { TagList } from '../ui/TagList';
import { ReaderModeModal } from '../widgets/ReaderModeModal';
import { useMobileApp } from '@/context/mobileApp';
import { useCourseRepertorio } from '../wizards/useCourseRepertorio';
import { CATALOG_BOOK_PREFIX, INTERDISCIPLINARY_PREFIX, ARTICLE_PREFIX } from '../../lib/courseRepertorio';

type ItemKind =
  | 'concept'
  | 'author'
  | 'reading'
  | 'material'
  | 'cat-book'
  | 'inter-book'
  | 'article';

const kindOf = (id: string): ItemKind => {
  if (id.startsWith('con-')) return 'concept';
  if (id.startsWith('aut-')) return 'author';
  if (id.startsWith('m-')) return 'material';
  if (id.startsWith(CATALOG_BOOK_PREFIX)) return 'cat-book';
  if (id.startsWith(INTERDISCIPLINARY_PREFIX)) return 'inter-book';
  if (id.startsWith(ARTICLE_PREFIX)) return 'article';
  return 'reading';
};

interface CatalogWorkDetail {
  id: string;
  title: string;
  author: string;
  badge: string;
}

interface CatalogSource {
  books: { id: string; title: string; author: string }[];
  interdisciplinary: { id: string; title: string; author: string }[];
  articles: { id: string; title: string; author: string }[];
}

/** Resolve a obra do catálogo pelo id nos datasets carregados (catálogo leve). */
function catalogWorkDetail(
  id: string,
  catalog: CatalogSource | null,
  kind: ItemKind
): CatalogWorkDetail | undefined {
  const byId = (list?: { id: string; title: string; author: string }[]) => list?.find((w) => w.id === id);
  if (kind === 'cat-book' || kind === 'inter-book') {
    const book = byId(catalog?.books) ?? byId(catalog?.interdisciplinary);
    if (book) {
      return {
        ...book,
        badge: kind === 'inter-book' ? 'livro complementar' : 'livro (catálogo)',
      };
    }
  }
  const article = byId(catalog?.articles);
  if (article && kind === 'article') {
    return { ...article, badge: 'artigo (catálogo)' };
  }
  return undefined;
}

const isCatalogKind = (kind: ItemKind | null): kind is 'cat-book' | 'inter-book' | 'article' =>
  kind === 'cat-book' || kind === 'inter-book' || kind === 'article';

const KIND_LABELS: Record<ItemKind, string> = {
  concept: 'conceito-chave',
  author: 'autor fundamental',
  reading: 'leitura',
  material: 'material',
  'cat-book': 'livro do catálogo',
  'inter-book': 'livro complementar',
  article: 'artigo do catálogo',
};

/** Ficha de um item do repertório da disciplina, empilhada sobre o curso. */
export const RepertorioItemDetailScreen: React.FC = () => {
  const {
    focusedRepertorioItemId: itemId,
    focusedCourse,
    concepts,
    authors,
    readings,
    materials,
    handleUpdateReadingPages,
    closeRepertorioItem,
  } = useMobileApp();
  const { catalog } = useCourseRepertorio();
  const [readingOpen, setReadingOpen] = useState(false);

  const kind = itemId ? kindOf(itemId) : null;
  const course = focusedCourse;

  const concept = useMemo(
    () => (kind === 'concept' ? concepts.find((c) => c.id === itemId) : undefined),
    [kind, itemId, concepts]
  );
  const author = useMemo(
    () => (kind === 'author' ? authors.find((a) => a.id === itemId) : undefined),
    [kind, itemId, authors]
  );
  const reading = useMemo(
    () => (kind === 'reading' ? readings.find((r) => r.id === itemId) : undefined),
    [kind, itemId, readings]
  );
  const material = useMemo(
    () => (kind === 'material' ? materials.find((m) => m.id === itemId) : undefined),
    [kind, itemId, materials]
  );
  const catalogWork =
    isCatalogKind(kind) ? catalogWorkDetail(itemId ?? '', catalog, kind) : undefined;

  const isCatalog = isCatalogKind(kind);
  const missing =
    (kind === 'concept' && !concept) ||
    (kind === 'author' && !author) ||
    (kind === 'reading' && !reading) ||
    (kind === 'material' && !material) ||
    (isCatalog && !catalogWork);

  if (missing) {
    return (
      <div className="px-5 py-12 text-center space-y-4">
        <Mascote expression="no-results" className="w-16 h-16 mx-auto" decorative />
        <p className="text-xs font-semibold text-ceci-primary">esse item não está mais aqui</p>
        <button
          onClick={closeRepertorioItem}
          className="px-4 py-2 bg-ceci-primary text-ceci-on-primary rounded-full text-xs font-bold cursor-pointer"
        >
          voltar para a matéria
        </button>
      </div>
    );
  }

  const heroTitle = isCatalog
    ? catalogWork?.title ?? 'obra do catálogo'
    : kind === 'concept'
      ? concept?.name ?? 'conceito'
      : kind === 'author'
        ? author?.name ?? 'autor'
        : kind === 'reading'
          ? reading?.title ?? 'leitura'
          : material?.title ?? 'material';

  const heroSubtitle = isCatalog
    ? catalogWork?.author
      ? `por ${catalogWork.author}`
      : ''
    : kind === 'author'
      ? author?.lifespan ?? ''
      : kind === 'reading'
        ? reading?.author
          ? `de ${reading.author}`
          : ''
        : '';

  return (
    <div className="px-4 pb-32 space-y-5">
      {/* Hero do item — cor da disciplina como detalhe lateral */}
      <section className="relative overflow-hidden rounded-[28px] border border-ceci-border-default bg-surface-default p-4 pl-5 space-y-3">
        <span
          aria-hidden
          className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full"
          style={{ background: course?.color ?? '#D85F79' }}
        />
        <div className="flex items-center justify-between gap-2 flex-wrap pr-1">
          <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
            {kind ? KIND_LABELS[kind] : 'repertório'}
          </span>
          <span className="text-[11px] font-medium text-ceci-tertiary">
            {course?.name ?? 'repertório da disciplina'}
          </span>
        </div>

        <div className="flex items-start gap-3 pr-1">
          <div className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center shrink-0">
            <KindIcon kind={kind} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-ceci-primary leading-tight">
              {heroTitle}
            </h2>
            {heroSubtitle ? (
              <p className="text-[11px] font-medium text-ceci-tertiary mt-0.5">{heroSubtitle}</p>
            ) : null}
          </div>
        </div>
      </section>

      {kind === 'concept' && concept && (
        <>
          {concept.definition ? (
            <DetailSection label="definição">
              <p className="text-xs text-ceci-secondary leading-relaxed bg-surface-muted p-3.5 rounded-2xl border border-ceci-border-subtle">
                {concept.definition}
              </p>
            </DetailSection>
          ) : null}
          {concept.tags && concept.tags.length > 0 ? (
            <DetailSection label="palavras-chave">
              <TagList tags={concept.tags} size="sm" />
            </DetailSection>
          ) : null}
          {concept.courseIds && concept.courseIds.length > 0 ? (
            <DetailSection label="aparece nas disciplinas">
              <p className="text-xs text-ceci-secondary leading-relaxed">
                {concept.courseIds.length} disciplina{concept.courseIds.length > 1 ? 's' : ''} ligada
                {concept.courseIds.length > 1 ? 's' : ''} a este conceito.
              </p>
            </DetailSection>
          ) : (
            <Tip>ligue este conceito a mais disciplinas para ele continuar por perto ♡</Tip>
          )}
        </>
      )}

      {kind === 'author' && author && (
        <>
          {author.bio ? (
            <DetailSection label="sobre">
              <p className="text-xs text-ceci-secondary leading-relaxed bg-surface-muted p-3.5 rounded-2xl border border-ceci-border-subtle">
                {author.bio}
              </p>
            </DetailSection>
          ) : null}
          {author.keyConcepts && author.keyConcepts.length > 0 ? (
            <DetailSection label="conceitos-chave">
              <TagList tags={author.keyConcepts} size="sm" />
            </DetailSection>
          ) : null}
          {author.majorWorks && author.majorWorks.length > 0 ? (
            <DetailSection label="principais obras">
              <ul className="space-y-2">
                {author.majorWorks.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-ceci-secondary bg-surface-muted p-2.5 rounded-xl border border-ceci-border-subtle"
                  >
                    <BookMarked className="w-3.5 h-3.5 mt-0.5 text-ceci-academic shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}
        </>
      )}

      {kind === 'reading' && reading && (
        <DetailSection label="sua leitura">
          <div className="space-y-3">
            <div className="bg-surface-muted p-3.5 rounded-2xl border border-ceci-border-subtle space-y-1">
              <p className="text-xs text-ceci-secondary leading-relaxed">{reading.author}</p>
              <p className="text-[11px] font-semibold text-ceci-tertiary uppercase">
                {reading.status}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReadingOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-ceci-primary text-ceci-on-primary text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform"
            >
              <BookOpen className="w-4 h-4" />
              continuar lendo
            </button>
          </div>
        </DetailSection>
      )}

      {kind === 'material' && material && (
        <>
          <DetailSection label="material">
            <div className="bg-surface-muted p-3.5 rounded-2xl border border-ceci-border-subtle space-y-2">
              <p className="text-xs font-semibold text-ceci-academic-strong uppercase">
                {material.type}
              </p>
              <p className="text-xs text-ceci-secondary leading-relaxed">por {material.author}</p>
            </div>
          </DetailSection>
          {material.url ? (
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong text-xs font-bold cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              abrir material
            </a>
          ) : null}
        </>
      )}

      {isCatalog && catalogWork && (
        <>
          <DetailSection label="obra do catálogo">
            <div className="bg-surface-muted p-3.5 rounded-2xl border border-ceci-border-subtle space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ceci-academic-strong bg-surface-blue px-2.5 py-1 rounded-full border border-ceci-border-academic">
                <BookOpen className="w-3.5 h-3.5" />
                {catalogWork.badge}
              </span>
              <p className="text-xs text-ceci-secondary leading-relaxed">por {catalogWork.author}</p>
            </div>
          </DetailSection>
          <Tip>encontrou esta obra no catálogo — que tal adicionar aos seus materiais? ♡</Tip>
        </>
      )}

      {readingOpen && reading && (
        <ReaderModeModal
          isOpen={readingOpen}
          onClose={() => setReadingOpen(false)}
          reading={reading}
          onUpdateProgress={(readingId, newPages) => handleUpdateReadingPages(readingId, newPages)}
        />
      )}
    </div>
  );
};

const DetailSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <section className="space-y-1.5">
    <h3 className="font-display font-bold text-xs text-ceci-primary tracking-wide">{label}</h3>
    {children}
  </section>
);

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-ceci-tertiary leading-relaxed flex items-start gap-1.5 bg-surface-rose p-3 rounded-2xl border border-ceci-border-brand">
    <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ceci-brand-strong" />
    <span>{children}</span>
  </p>
);

const KindIcon: React.FC<{ kind: ItemKind | null; className?: string }> = ({ kind, className }) => {
  const cls = className ?? 'w-5 h-5';
  switch (kind) {
    case 'concept':
      return <Lightbulb className={cls} />;
    case 'author':
      return <User className={cls} />;
    case 'material':
      return <Paperclip className={cls} />;
    case 'reading':
      return <BookOpen className={cls} />;
    default:
      return <FileText className={cls} />;
  }
};