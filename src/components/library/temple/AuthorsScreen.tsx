import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookMarked, Loader2, Quote, Search, User } from 'lucide-react';
import type { TempleAuthor } from '../../../types';
import { getTempleAuthors } from '../../../lib/templeData';
import { MarkdownBlock } from './MarkdownBlock';

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
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm font-semibold text-ceci-brand-strong hover:text-ceci-primary transition-colors cursor-pointer px-1 py-2"
          aria-label="voltar para a lista de autores"
        >
          <ArrowLeft className="w-4 h-4" /> voltar aos autores
        </button>

        {/* cabeçalho */}
        <div className="bg-white rounded-[24px] p-5 space-y-3 shadow-2xs border border-ceci-border-default">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-ceci-border-default flex items-center justify-center text-beige-700 shrink-0">
              <User className="w-6 h-6" />
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
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-muted text-ceci-secondary border border-ceci-border-subtle">
                    {[selected.born, selected.died].filter(Boolean).join(' – ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {selected.oneLiner && (
            <div className="bg-surface-blue border border-ceci-border-academic rounded-[18px] p-3.5 flex items-start gap-2.5">
              <Quote className="w-4 h-4 text-ceci-academic-strong shrink-0 mt-0.5" />
              <p className="text-xs text-ceci-primary leading-relaxed">{selected.oneLiner}</p>
            </div>
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
            <section
              key={section.title}
              className={`rounded-[22px] p-4 border shadow-2xs ${
                HIGHLIGHT_SECTIONS.has(section.title.toLowerCase())
                  ? 'bg-surface-rose border-ceci-border-brand'
                  : 'bg-white border-ceci-border-default'
              }`}
            >
              <h2
                className={`text-xs uppercase tracking-wider font-bold mb-2 ${
                  HIGHLIGHT_SECTIONS.has(section.title.toLowerCase())
                    ? 'text-ceci-brand-strong'
                    : 'text-ceci-secondary'
                }`}
              >
                {section.title}
              </h2>
              <MarkdownBlock source={section.body} />
            </section>
          ))}
        </div>
      </div>
    );
  }

  // ---- lista ----
  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-1 relative">
      {/* Intro */}
      <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-surface-muted border border-ceci-border-default flex items-center justify-center text-beige-700 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-ceci-primary leading-tight">
              {loading ? 'autores' : `${authors.length} autores do acervo`}
            </h1>
            <p className="text-xs text-ceci-secondary">
              quem é quem na história da psicologia — fichas para consultar com calma
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative px-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ceci-tertiary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="procurar autor…"
          className="w-full bg-white border border-ceci-border-default rounded-2xl pl-11 pr-4 py-3 text-sm text-ceci-primary placeholder:text-ceci-muted focus:border-ceci-border-brand focus:outline-none shadow-2xs"
          aria-label="procurar autor"
        />
      </div>

      {/* Filtro por família */}
      {!loading && families.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-1 pb-1" role="group" aria-label="filtrar por família teórica">
          <FilterChip label="todas as famílias" active={family === null} onClick={() => setFamily(null)} />
          {families.map((f) => (
            <FilterChip key={f} label={f.toLowerCase()} active={family === f} onClick={() => setFamily(f === family ? null : f)} />
          ))}
        </div>
      )}

      {/* Ordenação */}
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
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              sortMode === value
                ? 'bg-surface-muted text-beige-700 border border-ceci-border-strong shadow-xs'
                : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted'
            }`}
            aria-pressed={sortMode === value}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-ceci-secondary">
          <Loader2 className="w-4 h-4 animate-spin" /> carregando autores…
        </div>
      )}

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
        <div className="text-center py-8">
          <p className="text-sm text-ceci-secondary">nenhum autor com esse nome ♡</p>
        </div>
      )}
    </div>
  );
};

const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
      active
        ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand shadow-xs'
        : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-rose'
    }`}
  >
    {label}
  </button>
);

const AuthorRow: React.FC<{ author: TempleAuthor; onOpen: () => void }> = ({ author, onOpen }) => (
  <button
    onClick={onOpen}
    className="w-full text-left bg-white rounded-[18px] px-4 py-3 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs card-lift press-card cursor-pointer group flex items-center justify-between gap-2"
  >
    <div className="min-w-0 pr-1">
      <h3 className="text-sm font-semibold text-ceci-primary font-display truncate group-hover:text-beige-700 transition-colors">
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
