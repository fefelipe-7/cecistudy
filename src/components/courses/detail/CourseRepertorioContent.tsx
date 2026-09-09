import React from 'react';
import { BookOpen, Sparkles, UserCheck } from 'lucide-react';
import { Mascote } from '../../ui/Mascote';
import { TagList } from '../../ui/TagList';
import { ManageSurface } from '../../ui/ManageSurface';
import { useMobileApp } from '@/context/mobileApp';
import { Course } from '../../../types';

interface CourseRepertorioContentProps {
  course: Course;
}

/** Conteúdo da tab "repertório & conteúdo" — compartilhado entre mobile e desktop. */
export const CourseRepertorioContent: React.FC<CourseRepertorioContentProps> = ({ course }) => {
  const { concepts, authors, readings, materials, classes } = useMobileApp();

  const courseConcepts = concepts.filter((c) => c.courseIds && c.courseIds.includes(course.id));
  const relatedAuthorIds = new Set<string>();
  courseConcepts.forEach((c) => c.authorIds?.forEach((a) => relatedAuthorIds.add(a)));
  classes
    .filter((cl) => cl.courseId === course.id)
    .forEach((cl) => cl.authorIds?.forEach((a) => relatedAuthorIds.add(a)));
  const courseAuthors = authors.filter((a) => relatedAuthorIds.has(a.id));
  const courseReadings = readings.filter((r) => r.courseId === course.id);
  const courseMaterials = materials.filter((m) => m.courseId === course.id);

  return (
    <div className="space-y-6">
      {/* Conceitos-chave */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ceci-brand-strong" />
          <span>conceitos-chave da disciplina</span>
          <span className="text-[11px] font-semibold text-ceci-tertiary">{courseConcepts.length}</span>
        </h3>

        {courseConcepts.length > 0 ? (
          <div className="space-y-2">
            {courseConcepts.map((concept) => (
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
        <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-ceci-academic-strong" />
          <span>autores fundamentais</span>
          <span className="text-[11px] font-semibold text-ceci-tertiary">{courseAuthors.length}</span>
        </h3>

        {courseAuthors.length > 0 ? (
          <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
            {courseAuthors.map((author) => (
              <ManageSurface
                key={author.id}
                kind="author"
                id={author.id}
                className="py-3 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-blue-200 text-ceci-academic-strong font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
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
        <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-beige-700" />
          <span>leituras & bibliografia recomendada</span>
        </h3>

        {courseReadings.length > 0 || courseMaterials.length > 0 ? (
          <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
            {courseReadings.map((reading) => (
              <ManageSurface
                key={reading.id}
                kind="reading"
                id={reading.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <h5 className="font-bold text-ceci-primary">{reading.title}</h5>
                  <p className="text-[11px] text-ceci-tertiary">por {reading.author}</p>
                </div>
                <span className="text-[10px] font-semibold text-success-deep bg-surface-mint-soft px-2.5 py-1 rounded-full border border-ceci-border-academic shrink-0">
                  {reading.readPages || 0} / {reading.totalPages ?? '—'} pág
                </span>
              </ManageSurface>
            ))}

            {courseMaterials.map((mat) => (
              <ManageSurface
                key={mat.id}
                kind="material"
                id={mat.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <h5 className="font-semibold text-ceci-primary">{mat.title}</h5>
                  <p className="text-[10px] text-ceci-tertiary uppercase">
                    {mat.type} • {mat.author}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-ceci-academic-strong bg-surface-blue px-2 py-0.5 rounded border border-ceci-border-academic shrink-0">
                  PDF
                </span>
              </ManageSurface>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ceci-tertiary py-2 flex items-center gap-1.5">
            <Mascote expression="reading-curious" className="w-6 h-6 shrink-0" decorative />
            ainda não tem leitura vinculada a esta disciplina.
          </p>
        )}
      </div>
    </div>
  );
};
