import React, { useState } from 'react';
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronRight,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Course,
  ClassNote,
  Exam,
  Task,
  SubTabFaculdade,
  PsychologyConcept,
  PsychologyAuthor,
  ReadingItem,
  MaterialItem,
  InternshipLog,
} from '../../types';
import { CourseDetailView } from './CourseDetailView';

interface FaculdadeViewProps {
  courses: Course[];
  classes: ClassNote[];
  exams: Exam[];
  tasks: Task[];
  concepts?: PsychologyConcept[];
  authors?: PsychologyAuthor[];
  readings?: ReadingItem[];
  materials?: MaterialItem[];
  internshipLogs?: InternshipLog[];
  initialSubTab?: SubTabFaculdade;
  selectedCourseId?: string;
  focusedCourseId?: string | null;
  onSelectCourse?: (courseId: string | null) => void;
  onOpenQuickAdd: () => void;
  onToggleExam: (examId: string) => void;
  onToggleTask?: (taskId: string) => void;
}

export const FaculdadeView: React.FC<FaculdadeViewProps> = ({
  courses,
  classes,
  exams,
  tasks,
  concepts = [],
  authors = [],
  readings = [],
  materials = [],
  internshipLogs = [],
  initialSubTab = 'disciplinas',
  selectedCourseId,
  focusedCourseId,
  onSelectCourse,
  onOpenQuickAdd,
  onToggleExam,
  onToggleTask = () => {},
}) => {
  const [subTab, setSubTab] = useState<SubTabFaculdade>(initialSubTab);
  const [selectedClass, setSelectedClass] = useState<ClassNote | null>(null);
  const [internalFocusedCourseId, setInternalFocusedCourseId] = useState<string | null>(selectedCourseId || null);

  const activeFocusedId = focusedCourseId !== undefined ? focusedCourseId : internalFocusedCourseId;

  const handleSetFocusedCourse = (id: string | null) => {
    if (onSelectCourse) {
      onSelectCourse(id);
    }
    setInternalFocusedCourseId(id);
  };

  const focusedCourse = courses.find((c) => c.id === activeFocusedId);

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
        onBack={() => handleSetFocusedCourse(null)}
        onToggleExam={onToggleExam}
        onToggleTask={onToggleTask}
        onOpenQuickAdd={onOpenQuickAdd}
      />
    );
  }

  const filteredClasses = classes;
  const filteredExams = exams;

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-xs text-[#6D6366] font-medium lowercase tracking-wide">faculdade</p>
          <h1 className="font-display text-2xl sm:text-3xl text-[#40383A] font-bold mt-0.5 tracking-tight">
            6º semestre
          </h1>
        </div>
        <button
          onClick={() => setSubTab('calendario')}
          className="w-10 h-10 rounded-2xl bg-white border border-[#E9DFDC] flex items-center justify-center text-[#6D6366] hover:bg-[#FAF8F5] transition-colors shadow-2xs cursor-pointer"
          title="ver calendário"
        >
          <CalendarIcon className="w-5 h-5 text-[#6D6366]" />
        </button>
      </div>

      {/* Inline Semester Summary Badges */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-xs bg-[#FFF5F7] text-[#B94862] px-3 py-1 rounded-full font-semibold border border-[#FFD3DD]">
          {courses.length} disciplinas
        </span>
        <span className="text-xs bg-white text-[#40383A] px-3 py-1 rounded-full font-semibold border border-[#E9DFDC]">
          {exams.filter((e) => !e.completed).length} provas próximas
        </span>
        <span className="text-xs bg-[#F3F9FC] text-[#396D82] px-3 py-1 rounded-full font-semibold border border-[#CEE7F0]">
          {tasks.filter((t) => !t.completed).length} tarefas pendentes
        </span>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'disciplinas', label: 'disciplinas', icon: BookOpen },
          { id: 'aulas', label: 'diário de aulas', icon: FileCheck2 },
          { id: 'avaliacoes', label: 'avaliações', icon: AlertCircle },
          { id: 'calendario', label: 'calendário', icon: CalendarIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = subTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as SubTabFaculdade)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSel
                  ? 'bg-[#40383A] text-white shadow-xs'
                  : 'bg-white text-[#6D6366] border border-[#E9DFDC] hover:bg-[#FAF8F5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: DISCIPLINAS */}
      {subTab === 'disciplinas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-base font-bold text-[#40383A]">grade de disciplinas</h2>
            <button
              onClick={() => setSubTab('calendario')}
              className="text-xs text-[#B94862] hover:underline font-semibold cursor-pointer"
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
                  onClick={() => handleSetFocusedCourse(course.id)}
                  className="rounded-[24px] p-5 bg-white border border-[#E9DFDC] cursor-pointer hover:border-[#FFD3DD] transition-all space-y-3 shadow-[0_2px_8px_rgba(64,56,58,0.04)] hover:shadow-md group"
                  style={{ borderLeftWidth: '4px', borderLeftColor: course.color || '#B94862' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#6D6366] uppercase tracking-wider bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E9DFDC]">
                          {course.code || 'PSI-300'}
                        </span>
                        <h3 className="font-display text-lg font-bold text-[#40383A] group-hover:text-[#B94862] transition-colors">
                          {course.name}
                        </h3>
                      </div>
                      <p className="text-xs text-[#6D6366] mt-1">
                        {course.professor} • {courseClassCount} aulas anotadas
                      </p>
                    </div>

                    <span className="text-[10px] font-bold tracking-wider lowercase bg-[#FFF5F7] text-[#B94862] px-2.5 py-1 rounded-full border border-[#FFD3DD] shrink-0">
                      {course.room || 'Bloco C'}
                    </span>
                  </div>

                  <p className="text-xs text-[#6D6366] line-clamp-1">
                    {course.schedule || 'Semanal'} • {nextExam ? `Prova em ${nextExam.date}` : 'Sem provas pendentes'}
                  </p>

                  <div className="space-y-1 pt-1">
                    <div className="w-full h-1.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E9DFDC]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${course.progress || 50}%`, backgroundColor: course.color || '#B94862' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6D6366] pt-1">
                      <span>progresso: {course.progress || 50}%</span>
                      <span className="font-semibold text-[#B94862] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
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
          <h2 className="font-display text-base font-bold text-[#40383A] px-1">
            diário de aulas registradas
          </h2>
          <div className="divide-y divide-[#E9DFDC] border-y border-[#E9DFDC] px-1">
            {filteredClasses.map((cl) => (
              <div
                key={cl.id}
                onClick={() => setSelectedClass(cl)}
                className="py-3.5 space-y-1 cursor-pointer group hover:bg-[#FAF8F5]/50 rounded-lg px-1 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-[#918689]">
                  <span className="font-bold text-[#B94862] text-[11px]">aula {cl.number}</span>
                  <span>{cl.date}</span>
                </div>

                <h3 className="font-display font-bold text-sm text-[#40383A] group-hover:text-[#B94862] transition-colors">
                  {cl.title}
                </h3>

                <p className="text-xs text-[#6D6366] line-clamp-2 leading-relaxed">
                  {cl.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: AVALIAÇÕES (Inline divide-list directly on page background) */}
      {subTab === 'avaliacoes' && (
        <div className="space-y-3 px-1">
          <h2 className="font-display text-base font-bold text-[#40383A]">
            avaliações & provas
          </h2>

          <div className="divide-y divide-[#E9DFDC] border-y border-[#E9DFDC]">
            {filteredExams.map((ex) => (
              <div
                key={ex.id}
                onClick={() => onToggleExam(ex.id)}
                className={`py-3 flex items-center justify-between cursor-pointer transition-colors ${
                  ex.completed ? 'opacity-60 line-through' : ''
                }`}
              >
                <div>
                  <h3 className="font-bold text-xs text-[#40383A]">{ex.title}</h3>
                  <p className="text-[11px] text-[#6D6366] mt-0.5">data: {ex.date} · peso {ex.weight}</p>
                </div>
                <CheckCircle2 className={`w-5 h-5 ${ex.completed ? 'text-[#2D6A4F]' : 'text-[#BEB4B6]'}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: CALENDÁRIO */}
      {subTab === 'calendario' && (
        <div className="space-y-3 px-1">
          <h2 className="font-display text-base font-bold text-[#40383A]">
            calendário acadêmico · 2026.2
          </h2>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-[#918689] py-1 border-b border-[#E9DFDC]">
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
                      ? 'bg-[#E97891] text-white shadow-2xs font-bold'
                      : hasEvent
                      ? 'bg-[#FFF5F7] text-[#B94862] font-bold border border-[#FFD3DD]'
                      : 'bg-[#FAF8F5] text-[#40383A]'
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
      <div className="space-y-2.5 pt-3 border-t border-[#E9DFDC] px-1">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#40383A]">
            sua semana acadêmica
          </h2>
          <span className="text-[11px] text-[#918689] font-medium">próximos eventos</span>
        </div>

        <div className="divide-y divide-[#E9DFDC] border-y border-[#E9DFDC]">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-[#40383A]">entrega de fichamento</h3>
              <p className="text-[11px] text-[#6D6366] mt-0.5">psicologia social · segunda-feira</p>
            </div>
            <span className="text-[11px] font-bold text-[#B94862] bg-[#FFF5F7] px-2.5 py-0.5 rounded-full border border-[#FFD3DD]">
              11/08
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-[#40383A]">supervisão de estágio</h3>
              <p className="text-[11px] text-[#6D6366] mt-0.5">registrar aprendizados e dúvidas</p>
            </div>
            <span className="text-[11px] font-bold text-[#396D82] bg-[#F3F9FC] px-2.5 py-0.5 rounded-full border border-[#CEE7F0]">
              13/08
            </span>
          </div>
        </div>
      </div>

      {/* Modal View for Selected Class Note */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[28px] border border-[#E9DFDC] shadow-2xl p-6 space-y-4 text-[#40383A] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E9DFDC] pb-3">
              <span className="text-xs font-bold text-[#B94862] bg-[#FFF5F7] px-2.5 py-0.5 rounded-full border border-[#FFD3DD]">
                Aula {selectedClass.number} • {selectedClass.date}
              </span>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-xs text-[#918689] hover:text-[#40383A] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-[#40383A]">
                {selectedClass.title}
              </h3>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#918689]">Resumo</span>
              <p className="text-xs text-[#6D6366] leading-relaxed bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2EBE8]">
                {selectedClass.summary}
              </p>
            </div>

            <button
              onClick={() => setSelectedClass(null)}
              className="w-full bg-[#40383A] text-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
            >
              fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
