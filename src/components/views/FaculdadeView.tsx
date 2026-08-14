import React, { useState } from 'react';
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronRight,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { SubTabFaculdade, ClassNote } from '../../types';
import { CourseDetailView } from './CourseDetailView';
import { ClassNoteModal } from '../courses/ClassNoteModal';
import { ClassNoteListItem } from '../courses/ClassNoteListItem';
import { PillTabBar } from '../ui/PillTabBar';
import { useApp } from '../../context/AppContext';

export const FaculdadeView: React.FC = () => {
  const {
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
    focusedCourseId,
    openCourseDetail,
    handleToggleExam,
    handleToggleTask,
  } = useApp();

  const [selectedClass, setSelectedClass] = useState<ClassNote | null>(null);

  const focusedCourse = courses.find((c) => c.id === focusedCourseId);

  // If a course detail is active, render CourseDetailView
  if (focusedCourse) {
    return (
      <CourseDetailView
        course={focusedCourse}
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

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-1">
      
      {/* Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">faculdade</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ceci-primary font-bold mt-0.5 tracking-tight">
            6º semestre
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
      <PillTabBar
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
              onClick={() => setSubTab('calendario')}
              className="text-xs text-ceci-brand-strong hover:underline font-semibold cursor-pointer"
            >
              ver calendário completo →
            </button>
          </div>

          <div className="space-y-3">
            {courses.map((course) => {
              const courseClassCount = classes.filter((c) => c.courseId === course.id).length;
              const nextExam = exams.find((e) => e.courseId === course.id && !e.completed);

              return (
                <div
                  key={course.id}
                  onClick={() => openCourseDetail(course.id)}
                  className="rounded-[24px] p-5 bg-white border border-ceci-border-default cursor-pointer hover:border-ceci-border-brand card-lift press-card space-y-3 shadow-sm group"
                  style={{ borderLeftWidth: '4px', borderLeftColor: course.color || '#B94862' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-ceci-secondary uppercase tracking-wider bg-surface-muted px-2 py-0.5 rounded-md border border-ceci-border-default">
                          {course.code || 'PSI-300'}
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

                  <p className="text-xs text-ceci-secondary line-clamp-1">
                    {course.schedule || 'semanal'} • {nextExam ? `prova em ${nextExam.date}` : 'sem provas pendentes'}
                  </p>

                  <div className="space-y-1 pt-1">
                    <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden border border-ceci-border-default">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${course.progress || 50}%`, backgroundColor: course.color || '#B94862' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ceci-secondary pt-1">
                      <span>progresso: {course.progress || 50}%</span>
                      <span className="font-semibold text-ceci-brand-strong flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        abrir disciplina <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
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
              <div
                key={ex.id}
                onClick={() => handleToggleExam(ex.id)}
                className={`py-3 flex items-center justify-between cursor-pointer transition-colors ${
                  ex.completed ? 'opacity-60 line-through' : ''
                }`}
              >
                <div>
                  <h3 className="font-bold text-xs text-ceci-primary">{ex.title}</h3>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">data: {ex.date} · peso {ex.weight}</p>
                </div>
                <CheckCircle2 className={`w-5 h-5 ${ex.completed ? 'text-success-deep' : 'text-ceci-faded'}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: CALENDÁRIO */}
      {subTab === 'calendario' && (
        <div className="space-y-3 px-1">
          <h2 className="font-display text-base font-bold text-ceci-primary">
            calendário acadêmico · 2026.2
          </h2>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-ceci-tertiary py-1 border-b border-ceci-border-default">
            <div>d</div><div>s</div><div>t</div><div>q</div><div>q</div><div>s</div><div>s</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const isToday = day === 8;
              const hasEvent = day === 12 || day === 25;

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
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-ceci-primary">entrega de fichamento</h3>
              <p className="text-[11px] text-ceci-secondary mt-0.5">psicologia social · segunda-feira</p>
            </div>
            <span className="text-[11px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
              11/08
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-ceci-primary">supervisão de estágio</h3>
              <p className="text-[11px] text-ceci-secondary mt-0.5">anotar aprendizados e dúvidas</p>
            </div>
            <span className="text-[11px] font-bold text-ceci-academic-strong bg-surface-blue px-2.5 py-0.5 rounded-full border border-ceci-border-academic">
              13/08
            </span>
          </div>
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
