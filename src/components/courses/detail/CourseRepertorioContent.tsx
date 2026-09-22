import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Sparkles, UserCheck } from 'lucide-react';
import { Mascote } from '../../ui/Mascote';
import { TagList } from '../../ui/TagList';
import { ManageSurface } from '../../ui/ManageSurface';
import { CatalogMultiSelect } from '../../ui/CatalogMultiSelect';
import { useMobileApp } from '@/context/mobileApp';
import { useCourseRepertorio } from '../../wizards/useCourseRepertorio';
import { resolveCourseRepertorio, type RepertorioBibliographyItem } from '../../../lib/courseRepertorio';
import type { Course } from '../../../types';

interface CourseRepertorioContentProps {
  course: Course;
}

type SheetKind = 'conceitos' | 'autores' | 'bibliografia' | null;

/** Lista de bibliografia: badge de origem por tipo de item. */
function bibliographyBadge(item: RepertorioBibliographyItem): { label: string; tone: 'success' | 'academic' } {
  switch (item.kind) {
    case 'reading':
      return { label: 'minha leitura', tone: 'success' };
    case 'material':
      return { label: 'material', tone: 'academic' };
    case 'cat-book':
    case 'inter-book':
      return { label: 'livro (catálogo)', tone: 'academic' };
    case 'article':
      return { label: 'artigo (catálogo)', tone: 'academic' };
  }
}

/** Conteúdo da tab "repertório & conteúdo" — união dos vínculos explícitos com o caminho legado. */
export const CourseRepertorioContent: React.FC<CourseRepertorioContentProps> = ({ course }) => {
  const { classes, concepts, authors, readings, materials, handleUpdateCourse } = useMobileApp();
  const { conceptOptions, authorOptions, bibliographyOptions, catalog, resolveIds } = useCourseRepertorio();
  const [sheet, setSheet] = useState<SheetKind>(null);

  const resolved = useMemo(
    () => resolveCourseRepertorio(course, { classes, concepts, authors, readings, materials, catalog }),
    [course, classes, concepts, authors, readings, materials, catalog]
  );

  const patchLinks = (patch: Partial<Pick<Course, 'conceptIds' | 'authorIds' | 'bibliographyIds'>>) => {
    handleUpdateCourse({
      ...course,
      conceptIds: course.conceptIds ?? [],
      authorIds: course.authorIds ?? [],
      bibliographyIds: course.bibliographyIds ?? [],
      ...patch,
    });
  };

  return (
    <div className="space-y-6">
      {/* Conceitos-chave */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-ceci-brand-strong" />
            <span>conceitos-chave da disciplina</span>
            <span className="text-[11px] font-semibold text-ceci-tertiary">{resolved.concepts.length}</span>
          </h3>
          <button
            type="button"
            onClick={() => setSheet('conceitos')}
            aria-label="adicionar conceitos-chave"
            className="w-9 h-9 rounded-2xl border border-ceci-border-brand bg-surface-rose text-ceci-brand-strong flex items-center justify-center tap-interactive cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {resolved.concepts.length > 0 ? (
          <div className="space-y-2">
            {resolved.concepts.map((concept) => (
              <ManageSurface
                key={concept.id}
                kind="concept"
                id={concept.id}
                className="rounded-2xl bg-surface-default border border-ceci-border-default p-3.5 pl-4 space-y-1 relative overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r-full"
                  style={{ background: course.color }}
                />
                <h4 className="font-display font-bold text-sm text-ceci-primary">{concept.name}</h4>
                <p className="text-xs text-ceci-secondary leading-relaxed">{concept.definition}</p>
                {concept.tags && concept.tags.length > 0 && (
                  <TagList tags={concept.tags} size="sm" className="pt-1" />
                )}
              </ManageSurface>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ceci-tertiary py-2 flex items-center gap-1.5">
            <Mascote expression="connection-link" className="w-6 h-6 shrink-0" decorative />
            ainda não tem conceito ligado a esta disciplina.
          </p>
        )}
      </div>

      {/* Autores */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-ceci-academic-strong" />
            <span>autores fundamentais</span>
            <span className="text-[11px] font-semibold text-ceci-tertiary">{resolved.authors.length}</span>
          </h3>
          <button
            type="button"
            onClick={() => setSheet('autores')}
            aria-label="adicionar autores fundamentais"
            className="w-9 h-9 rounded-2xl border border-ceci-border-academic bg-surface-blue text-ceci-academic-strong flex items-center justify-center tap-interactive cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {resolved.authors.length > 0 ? (
          <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
            {resolved.authors.map((author) => (
              <ManageSurface
                key={author.id}
                kind="author"
                id={author.id}
                className="py-3 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-surface-blue text-ceci-academic-strong font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {author.name.charAt(0)}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-sm text-ceci-primary">{author.name}</h4>
                    <span className="text-[10px] text-ceci-tertiary">{author.lifespan}</span>
                  </div>
                  <p className="text-xs text-ceci-secondary leading-relaxed">{author.bio}</p>
                </div>
              </ManageSurface>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ceci-tertiary py-2 flex items-center gap-1.5">
            <Mascote expression="connection-link" className="w-6 h-6 shrink-0" decorative />
            os autores das suas anotações aparecem aqui quando ligados aos conceitos ♡
          </p>
        )}
      </div>

      {/* Leituras & bibliografia */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-ceci-tertiary" />
            <span>leituras & bibliografia recomendada</span>
            <span className="text-[11px] font-semibold text-ceci-tertiary">{resolved.bibliography.length}</span>
          </h3>
          <button
            type="button"
            onClick={() => setSheet('bibliografia')}
            aria-label="adicionar leituras e bibliografia"
            className="w-9 h-9 rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-secondary flex items-center justify-center tap-interactive cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {resolved.bibliography.length > 0 ? (
          <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
            {resolved.bibliography.map((item) => {
              const key = item.kind === 'reading' || item.kind === 'material' ? item.ref.id : item.kind;
              const badge = bibliographyBadge(item);

              if (item.kind === 'reading') {
                return (
                  <ManageSurface key={key} kind="reading" id={item.ref.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <h5 className="font-bold text-ceci-primary">{item.ref.title}</h5>
                        <p className="text-[11px] text-ceci-tertiary">por {item.ref.author}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-status-success-strong bg-status-success-surface px-2.5 py-1 rounded-full border border-ceci-border-academic shrink-0">
                        {badge.label}
                      </span>
                    </div>
                  </ManageSurface>
                );
              }

              if (item.kind === 'material') {
                return (
                  <ManageSurface key={key} kind="material" id={item.ref.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <h5 className="font-semibold text-ceci-primary">{item.ref.title}</h5>
                        <p className="text-[10px] text-ceci-tertiary uppercase">
                          {item.ref.type} • {item.ref.author}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-ceci-academic-strong bg-surface-blue px-2 py-0.5 rounded border border-ceci-border-academic shrink-0">
                        {badge.label}
                      </span>
                    </div>
                  </ManageSurface>
                );
              }

              // ---- obras do catálogo (vínculo estático) ----
              return (
                <div key={key} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <h5 className="font-bold text-ceci-primary">{item.title}</h5>
                    <p className="text-[11px] text-ceci-tertiary">por {item.author}</p>
                  </div>
                  <span className="text-[10px] font-bold text-ceci-academic-strong bg-surface-blue px-2 py-1 rounded-full border border-ceci-border-academic shrink-0">
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-ceci-tertiary py-2 flex items-center gap-1.5">
            <Mascote expression="reading-curious" className="w-6 h-6 shrink-0" decorative />
            ainda não tem leitura vinculada a esta disciplina.
          </p>
        )}
      </div>

      {/* sheets */}
      <CatalogMultiSelect
        open={sheet === 'conceitos'}
        onClose={() => setSheet(null)}
        title="conceitos-chave"
        options={conceptOptions}
        value={course.conceptIds ?? []}
        onChange={(v) => patchLinks({ conceptIds: resolveIds(v) })}
        emptyMessage="ainda não tem conceito parecido por aqui ♡"
      />
      <CatalogMultiSelect
        open={sheet === 'autores'}
        onClose={() => setSheet(null)}
        title="autores fundamentais"
        options={authorOptions}
        value={course.authorIds ?? []}
        onChange={(v) => patchLinks({ authorIds: resolveIds(v) })}
        emptyMessage="ainda não tem autor parecido por aqui ♡"
      />
      <CatalogMultiSelect
        open={sheet === 'bibliografia'}
        onClose={() => setSheet(null)}
        title="leituras & bibliografia"
        options={bibliographyOptions}
        value={course.bibliographyIds ?? []}
        onChange={(v) => patchLinks({ bibliographyIds: v })}
        emptyMessage="ainda não tem leitura parecida por aqui ♡"
      />
    </div>
  );
};