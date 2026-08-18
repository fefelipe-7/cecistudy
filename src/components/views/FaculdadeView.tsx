import React, { useState } from 'react';
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronRight,
  FileCheck2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { SubTabFaculdade, ClassNote, Course } from '../../types';
import { CourseDetailView } from './CourseDetailView';
import { ClassNoteModal } from '../courses/ClassNoteModal';
import { ClassNoteListItem } from '../courses/ClassNoteListItem';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { CompletionToggle } from '../ui/CompletionToggle';
import { ManageSurface } from '../ui/ManageSurface';
import { useApp } from '../../context/AppContext';
import {
  eventsForMonth,
  upcomingEvents,
  formatShortDate,
  monthName,
  daysInMonth,
} from '../../lib/schedule';

interface FaculdadeViewProps {
  /** Disciplina em foco (pilha `course`). Quando presente, renderiza o CourseDetailView. */
  course?: Course;
}

export const FaculdadeView: React.FC<FaculdadeViewProps> = ({ course }) => {
  const {
    profile,
    courses,
    classes,
    exams,
    tasks,
    concepts,
    authors,
    readings,
    materials,
    internshipLogs,
    subTabFaculdade: subTab,
    setSubTabFaculdade: setSubTab,
    openCourseDetail,
    openWizard,
    handleToggleExam,
    handleToggleTask,
  } = useApp();

  const [selectedClass, setSelectedClass] = useState<ClassNote | null>(null);

  // If a course detail is active, render CourseDetailView
  if (course) {
    return (
      <CourseDetailView
        course={course}
        classes={classes}
        exams={exams}
        tasks={tasks}
        concepts={concepts}
        authors={authors}
        readings={readings}
        materials={materials}
        internshipLogs={internshipLogs}
        onToggleExam={handleToggleExam}
        onToggleTask={handleToggleTask}
      />
    );
  }

  const filteredClasses = classes;
  const filteredExams = exams;

  // Calendário real (mês atual, eventos de provas/tarefas do mês)
  const now = new Date();
  const calYear = now.getFullYear();
  const calMonth = now.getMonth() + 1;
  const calEvents = eventsForMonth(exams, tasks, calMonth, calYear);
  const todayDay = now.getDate();
  const totalDays = daysInMonth(calYear, calMonth);

  // Próximos eventos da semana acadêmica (derivados de provas/tarefas/estágio)
  const weekEvents = upcomingEvents(exams, tasks, internshipLogs);

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-1">
      
      {/* Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">faculdade</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ceci-primary font-bold mt-0.5 tracking-tight">
            {profile.semester}º semestre
          </h1>
        </div>
        <button
          onClick={() => setSubTab('calendario')}
          className="w-10 h-10 rounded-2xl bg-white border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors shadow-2xs cursor-pointer"
          title="ver calendário"
        >
          <CalendarIcon className="w-5 h-5 text-ceci-secondary" />
        </button>
      </div>

      {/* Inline Semester Summary Badges */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-xs bg-surface-rose text-ceci-brand-strong px-3 py-1 rounded-full font-semibold border border-ceci-border-brand">
          {courses.length} disciplinas
        </span>
        <span className="text-xs bg-white text-ceci-primary px-3 py-1 rounded-full font-semibold border border-ceci-border-default">
          {exams.filter((e) => !e.completed).length} provas próximas
        </span>
        <span className="text-xs bg-surface-blue text-ceci-academic-strong px-3 py-1 rounded-full font-semibold border border-ceci-border-academic">
          {tasks.filter((t) => !t.completed).length} tarefas pendentes
        </span>
      </div>

      {/* Sub-Tabs Navigation */}
      <UnderlineTabBar
        tabs={[
          { id: 'disciplinas', label: 'disciplinas', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { id: 'aulas', label: 'diário de aulas', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
          { id: 'avaliacoes', label: 'avaliações', icon: <AlertCircle className="w-3.5 h-3.5" /> },
          { id: 'calendario', label: 'calendário', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
        ]}
        active={subTab}
        onChange={(id) => setSubTab(id as SubTabFaculdade)}
      />

      {/* SUBTAB 1: DISCIPLINAS */}
      {subTab === 'disciplinas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-base font-bold text-ceci-primary">grade de disciplinas</h2>
            <button
              onClick={() => openWizard('course')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> nova matéria
            </button>
          </div>

          <div className="space-y-3">
            {courses.map((course) => {
              const courseClassCount = classes.filter((c) => c.courseId === course.id).length;
              const nextExam = exams.find((e) => e.courseId === course.id && !e.completed);

              return (
                <ManageSurface
                  key={course.id}
                  kind="course"
                  id={course.id}
                  onTap={() => openCourseDetail(course.id)}
                  className="rounded-[24px] p-5 bg-white border border-ceci-border-default cursor-pointer hover:border-ceci-border-brand card-lift press-card space-y-3 shadow-sm group"
                  style={{ borderLeftWidth: '4px', borderLeftColor: course.color || '#B94862' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-ceci-secondary uppercase tracking-wider bg-surface-muted px-2 py-0.5 rounded-md border border-ceci-border-default">
                          {course.code || 'sem código'}
                        </span>
                        <h3 className="font-display text-lg font-bold text-ceci-primary group-hover:text-ceci-brand-strong transition-colors">
                          {course.name}
                        </h3>
                      </div>
                      <p className="text-xs text-ceci-secondary mt-1">
                        {course.professor} • {courseClassCount} aulas anotadas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ceci-secondary line-clamp-1">
                      {course.schedule || 'horário a definir'} • {nextExam ? `prova em ${nextExam.date}` : 'sem provas pendentes'}
                    </p>
                    <span className="text-[11px] font-semibold text-ceci-brand-strong flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      abrir disciplina <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </ManageSurface>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: AULAS (Inline divide-list directly on page background) */}
      {subTab === 'aulas' && (
        <div className="space-y-2">
          <h2 className="font-display text-base font-bold text-ceci-primary px-1">
            diário de aulas
          </h2>
          <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default px-1">
            {filteredClasses.map((cl) => (
              <ClassNoteListItem
                key={cl.id}
                note={cl}
                onClick={() => setSelectedClass(cl)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: AVALIAÇÕES (Inline divide-list directly on page background) */}
      {subTab === 'avaliacoes' && (
        <div className="space-y-3 px-1">
          <h2 className="font-display text-base font-bold text-ceci-primary">
            avaliações & provas
          </h2>

          <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
            {filteredExams.map((ex) => (
              <ManageSurface
                key={ex.id}
                kind="exam"
                id={ex.id}
                onTap={() => handleToggleExam(ex.id)}
                className={`py-3 flex items-center justify-between cursor-pointer transition-colors ${
                  ex.completed ? 'opacity-60 line-through' : ''
                }`}
              >
                <div>
                  <h3 className="font-bold text-xs text-ceci-primary">{ex.title}</h3>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">data: {ex.date} · peso {ex.weight}</p>
                </div>
                                <CompletionToggle
                  checked={ex.completed}
                  onChange={() => handleToggleExam(ex.id)}
                  label={ex.completed ? `marcar prova "${ex.title}" como pendente` : `marcar prova "${ex.title}" como concluída`}
                />
              </ManageSurface>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: CALENDÁRIO */}
      {subTab === 'calendario' && (
        <div className="space-y-3 px-1">
          <h2 className="font-display text-base font-bold text-ceci-primary">
            calendário acadêmico · {monthName(calYear, calMonth)} {calYear}
          </h2>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-ceci-tertiary py-1 border-b border-ceci-border-default">
            <div>d</div><div>s</div><div>t</div><div>q</div><div>q</div><div>s</div><div>s</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const isToday = day === todayDay;
              const hasEvent = (calEvents.get(day)?.length ?? 0) > 0;

              return (
                <div
                  key={day}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[40px] font-medium ${
                    isToday
                      ? 'bg-rose-500 text-white shadow-2xs font-bold'
                      : hasEvent
                      ? 'bg-surface-rose text-ceci-brand-strong font-bold border border-ceci-border-brand'
                      : 'bg-surface-muted text-ceci-primary'
                  }`}
                >
                  <span>{day}</span>
                  {hasEvent && <span className="w-1 h-1 rounded-full bg-current mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sua semana acadêmica (Inline section) */}
      <div className="space-y-2.5 pt-3 border-t border-ceci-border-default px-1">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ceci-primary">
            sua semana acadêmica
          </h2>
          <span className="text-[11px] text-ceci-tertiary font-medium">próximos eventos</span>
        </div>

        <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
          {weekEvents.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-xs text-ceci-secondary">
                sem eventos próximos anotados. que tal registrar uma prova ou tarefa?
              </p>
            </div>
          )}

          {weekEvents.map((ev) => {
            const evCourse = ev.courseId ? courses.find((c) => c.id === ev.courseId)?.name : undefined;
            const kindLabel = ev.kind === 'prova' ? 'prova' : ev.kind === 'tarefa' ? 'tarefa' : 'estágio';
            return (
              <div key={ev.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-ceci-primary line-clamp-1">{ev.title}</h3>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">
                    {kindLabel}{evCourse ? ` · ${evCourse}` : ''}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand shrink-0">
                  {formatShortDate(ev.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal View for Selected Class Note */}
      <ClassNoteModal
        note={selectedClass}
        onClose={() => setSelectedClass(null)}
      />

    </div>
  );
};
