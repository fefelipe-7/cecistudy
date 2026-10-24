import React, { useState } from 'react';
import { CalendarClock, GraduationCap, MapPin } from 'lucide-react';
import { CourseIcon } from '../ui/CourseIcon';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { SwipeableTabPanel, useTabPager } from '../ui/SwipeableTabPanel';
import { useDataClientCourses } from '@/context/DataClientProvider';
import { formatCourseSchedule, formatShortDate, getTodaySchedule } from '../../lib/schedule';
import { Course } from '../../types';
import { CourseCreateMenu } from '../courses/detail/CourseCreateMenu';
import { CourseInfoContent } from '../courses/detail/CourseInfoContent';
import { CourseAulasContent } from '../courses/detail/CourseAulasContent';
import { CourseRepertorioContent } from '../courses/detail/CourseRepertorioContent';

interface CourseDetailViewProps {
  course: Course;
}

type DetailTab = 'info' | 'aulas' | 'repertorio';

const TAB_ORDER: DetailTab[] = ['info', 'aulas', 'repertorio'];

/** Nome legível da aba — o `aria-label` do painel mostra isto, não o id cru. */
const TAB_LABEL: Record<DetailTab, string> = {
  info: 'informações',
  aulas: 'aulas',
  repertorio: 'repertório',
};

/**
 * Detalhe da disciplina (mobile): hero compacto com contexto (horário/sala),
 * botão de novo registro que expande menu e 3 sub-tabs navegáveis por toque
 * **ou arrasto contínuo** (o conteúdo acompanha o dedo com resistência elástica).
 *
 * A transição entre sub-tabs usa o preset `stepVariants` (SPEC-007) — a mesma
 * física curta e local usada nos passos de wizard e nas questões do quiz, em vez
 * das três tabelas locais que existiam (48px / 48px / 40px).
 */
export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const { classes, exams, courses } = useDataClientCourses();

  const courseClasses = classes.filter((c) => c.courseId === course.id);
  const courseExams = exams.filter((e) => e.courseId === course.id);

  const courseColor = course.color || '#B94862';

  /** Chip "do agora" — hoje tem aula? senão a próxima prova no radar. */
  const nowChip = (() => {
    const hasClassToday = getTodaySchedule(courses, new Date()).some(
      (s) => s.course.id === course.id,
    );
    if (hasClassToday) return { Icon: GraduationCap, label: 'hoje tem aula ♡' };
    const next = courseExams
      .filter((e) => !e.completed)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    return next
      ? { Icon: CalendarClock, label: `próxima prova ${formatShortDate(next.date)}` }
      : null;
  })();

  const pager = useTabPager<DetailTab>({
    tabIds: TAB_ORDER,
    active: activeTab,
    onChange: setActiveTab,
  });
  const goToTab = pager.goTo;

  const contextBits = [
    formatCourseSchedule(course.schedule),
    course.room,
    course.category === 'complementar' ? 'complementar' : 'obrigatória',
  ].filter(Boolean);

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4 pb-24 relative">
      {/* Capinha da disciplina — canto afetuoso com a cor da matéria */}
      <div className="px-1 pt-1">
        {/* Sem `layoutId`: não há elemento de origem no grid da faculdade, então
            a "magic motion" card → detalhe nunca rodava — só custava o registro
            de projection node a cada render (SPEC-007 bug B3). Se a usuária
            quiser shared-element de verdade, é um Slice próprio, com origem. */}
        <div
          className="rounded-[26px] border border-ceci-border-subtle shadow-sm p-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, var(--color-surface-default) 0%, ${courseColor}1A 100%)`,
            borderLeftWidth: 4,
            borderLeftColor: courseColor,
          }}
        >
          <div className="relative flex items-start gap-3.5">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-ceci-border-default"
              style={{ backgroundColor: `${courseColor}26` }}
            >
              <CourseIcon icon={course.icon} className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ceci-primary leading-snug tracking-tight">
                {course.name}
              </h2>
              <p className="text-[11px] font-medium text-ceci-secondary flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-1">
                <MapPin className="w-3 h-3 text-ceci-muted shrink-0" />
                {contextBits.map((bit, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <span aria-hidden className="text-ceci-muted">
                        ·
                      </span>
                    )}
                    <span>{bit}</span>
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>

          {nowChip && (
            <div className="relative mt-3.5 flex items-center gap-2 min-w-0">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-ceci-primary shrink-0"
                style={{ backgroundColor: `${courseColor}26` }}
              >
                <nowChip.Icon className="w-3.5 h-3.5" />
                {nowChip.label}
              </span>
            </div>
          )}

          {/* fitinha da matéria */}
          <div
            aria-hidden
            className="absolute bottom-0 left-5 right-5 h-[3px] rounded-full"
            style={{ background: courseColor }}
          />
        </div>
      </div>

      {/* Sub-tabs + conteúdo deslizável */}
      <UnderlineTabBar
        tabs={[
          { id: 'info', label: 'informações' },
          {
            id: 'aulas',
            label: 'aulas',
            badge: courseClasses.length + courseExams.length,
          },
          { id: 'repertorio', label: 'repertório' },
        ]}
        active={activeTab}
        onChange={(v) => goToTab(v as DetailTab)}
        className="px-1"
      />

      {/* Sub-tabs + conteúdo deslizável */}
      <div className="px-1">
        <SwipeableTabPanel active={activeTab} pager={pager} label={TAB_LABEL[activeTab]}>
          {activeTab === 'info' && (
            <CourseInfoContent course={course} onGoToHistory={() => goToTab('aulas')} />
          )}
          {activeTab === 'aulas' && <CourseAulasContent course={course} />}
          {activeTab === 'repertorio' && <CourseRepertorioContent course={course} />}
        </SwipeableTabPanel>
      </div>

      {/* Novo registro — botão único que expande menu */}
      <CourseCreateMenu courseId={course.id} variant="floating" />
    </div>
  );
};
