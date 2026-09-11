import React, { useEffect, useMemo, useState } from 'react';
import { BookMarked, Quote, User } from 'lucide-react';
import type { TempleAuthor } from '../../../types';
import { getTempleAuthors } from '../../../lib/templeData';
import { MarkdownBlock } from './MarkdownBlock';
import {
  TempleBackButton,
  TempleChip,
  TempleEmptyState,
  TempleIntroCard,
  TempleLead,
  TempleLoading,
  TempleNeutralBadge,
  TempleSearchInput,
  TempleSectionCard,
} from './TempleShared';

type SortMode = 'acervo' | 'az';

/** Seções da ficha exibidas em destaque logo após a identificação. */
const HIGHLIGHT_SECTIONS = new Set(['a grande ideia']);

export const AuthorsScreen: React.FC = () => {
  const [authors, setAuthors] = useState<TempleAuthor[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('acervo');
  const [selected, setSelected] = useState<TempleAuthor | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await getTempleAuthors();
      if (!alive) return;
      setAuthors(list);
      const unique = [...new Set(list.flatMap((a) => a.families ?? []))];
      setFamilies(unique);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    let base = authors;
    if (family) base = base.filter((a) => (a.families ?? []).includes(family));
    if (q)
      base = base.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.fullName ?? '').toLowerCase().includes(q) ||
          (a.aliases ?? []).some((al) => al.toLowerCase().includes(q))
      );
    if (sortMode === 'az') return [...base].sort((a, b) => a.name.localeCompare(b.name));
    return base; // ordem canônica do acervo
  }, [authors, q, family, sortMode]);

  /** agrupamento A–Z */
  const grouped = useMemo(() => {
    if (sortMode !== 'az') return null;
    const map = new Map<string, TempleAuthor[]>();
    for (const a of filtered) {
      const letter = a.name[0]?.toUpperCase() ?? '#';
      const list = map.get(letter) ?? [];
      list.push(a);
      map.set(letter, list);
    }
    return [...map.entries()];
  }, [filtered, sortMode]);

  // ---- ficha do autor ----
  if (selected) {
    return (
      <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4 pb-1 relative">
        <TempleBackButton
          onClick={() => setSelected(null)}
          label="voltar aos autores"
          ariaLabel="voltar para a lista de autores"
        />

        {/* cabeçalho */}
        <div className="bg-surface-default rounded-2xl p-5 space-y-3 shadow-2xs border border-ceci-border-default">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0 [&_svg]:w-6 [&_svg]:h-6">
              <User />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold font-display text-ceci-primary leading-tight">
                {selected.name}
              </h1>
              {selected.fullName && selected.fullName !== selected.name && (
                <p className="text-xs text-ceci-secondary">{selected.fullName}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(selected.families ?? []).map((f) => (
                  <span
                    key={f}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand"
                  >
                    {f}
                  </span>
                ))}
                {(selected.born || selected.died) && (
                  <TempleNeutralBadge>
                    {[selected.born, selected.died].filter(Boolean).join(' – ')}
                  </TempleNeutralBadge>
                )}
              </div>
            </div>
          </div>

          {selected.oneLiner && (
            <TempleLead accent="brand" icon={<Quote />}>
              {selected.oneLiner}
            </TempleLead>
          )}

          {(selected.mainWork || selected.origin) && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {selected.mainWork && (
                <div className="rounded-xl bg-surface-subtle border border-ceci-border-subtle p-3">
                  <dt className="text-[10px] uppercase tracking-wider font-bold text-ceci-secondary">
                    obra principal sugerida
                  </dt>
                  <dd className="text-xs text-ceci-primary mt-0.5 leading-relaxed">{selected.mainWork}</dd>
                </div>
              )}
              {selected.origin && (
                <div className="rounded-xl bg-surface-subtle border border-ceci-border-subtle p-3">
                  <dt className="text-[10px] uppercase tracking-wider font-bold text-ceci-secondary">
                    origem
                  </dt>
                  <dd className="text-xs text-ceci-primary mt-0.5 leading-relaxed line-clamp-3">{selected.origin}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* seções da ficha */}
        <div className="space-y-3">
          {selected.sections.map((section) => (
            <TempleSectionCard
              key={section.title}
              title={section.title}
              accent="brand"
              highlighted={HIGHLIGHT_SECTIONS.has(section.title.toLowerCase())}
            >
              <MarkdownBlock source={section.body} />
            </TempleSectionCard>
          ))}
        </div>
      </div>
    );
  }

  // ---- lista ----
  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-1 relative">
      <TempleIntroCard
        accent="brand"
        icon={<User />}
        title={loading ? 'autores' : `${authors.length} autores do acervo`}
        subtitle="quem é quem na história da psicologia"
      />

      <TempleSearchInput value={query} onChange={setQuery} label="procurar autor" placeholder="procurar autor…" />

      {/* Filtro por família */}
      {!loading && families.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto scrollbar-none px-1 pb-1"
          role="group"
          aria-label="filtrar por família teórica"
        >
          <TempleChip label="todas as famílias" active={family === null} onClick={() => setFamily(null)} />
          {families.map((f) => (
            <TempleChip
              key={f}
              label={f.toLowerCase()}
              active={family === f}
              onClick={() => setFamily(f === family ? null : f)}
            />
          ))}
        </div>
      )}

      {/* Ordenação */}
      {!loading && (
        <div className="flex gap-2 px-1">
          {(
            [
              ['acervo', 'ordem do acervo'],
              ['az', 'a – z'],
            ] as Array<[SortMode, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSortMode(value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                sortMode === value
                  ? 'bg-surface-muted text-beige-700 border border-ceci-border-strong shadow-xs'
                  : 'bg-surface-default text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted'
              }`}
              aria-pressed={sortMode === value}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading && <TempleLoading label="carregando autores…" />}

      {/* Lista */}
      {!loading && sortMode === 'acervo' && (
        <div className="space-y-2.5 px-1">
          {filtered.map((author) => (
            <AuthorRow key={author.id} author={author} onOpen={() => setSelected(author)} />
          ))}
        </div>
      )}

      {!loading && grouped && (
        <div className="space-y-4 px-1">
          {grouped.map(([letter, list]) => (
            <div key={letter}>
              <h2 className="text-xs font-bold text-ceci-secondary uppercase tracking-wider mb-2 px-1">
                {letter}
              </h2>
              <div className="space-y-2.5">
                {list.map((author) => (
                  <AuthorRow key={author.id} author={author} onOpen={() => setSelected(author)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <TempleEmptyState message="nenhum autor com esse nome ♡" />
      )}
    </div>
  );
};

const AuthorRow: React.FC<{ author: TempleAuthor; onOpen: () => void }> = ({ author, onOpen }) => (
  <button
    onClick={onOpen}
    className="w-full text-left bg-surface-default rounded-[18px] px-4 py-3 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs card-lift press-card cursor-pointer group flex items-center justify-between gap-2"
  >
    <div className="min-w-0 pr-1">
      <h3 className="text-sm font-semibold text-ceci-primary font-display truncate group-hover:text-ceci-brand-strong transition-colors">
        {author.name}
      </h3>
      <p className="text-xs text-ceci-secondary truncate">
        {(author.families ?? [])[0] ?? ''}
        {author.born || author.died
          ? `${(author.families ?? []).length > 0 ? ' · ' : ''}${[author.born, author.died].filter(Boolean).join('–')}`
          : ''}
      </p>
    </div>
    <BookMarked className="w-4 h-4 text-ceci-muted group-hover:text-ceci-brand-strong transition-colors shrink-0" />
  </button>
);
