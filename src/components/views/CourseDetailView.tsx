import React, { useState } from 'react';
import {
  UserCheck,
  Clock,
  FileText,
  Sparkles,
  CheckCircle2,
  Plus,
  BookOpen,
  AlertCircle,
  MessageSquare,
  Timer,
  ClipboardList,
  BookMarked
} from 'lucide-react';
import { CourseIcon } from '../ui/CourseIcon';
import { ClassNoteModal } from '../courses/ClassNoteModal';
import { ClassNoteListItem } from '../courses/ClassNoteListItem';
import { useApp } from '../../context/AppContext';
import {
  Course,
  ClassNote,
  Exam,
  Task,
  PsychologyConcept,
  PsychologyAuthor,
  ReadingItem,
  MaterialItem,
  InternshipLog,
  WizardFlow
} from '../../types';

interface CourseDetailViewProps {
  course: Course;
  classes: ClassNote[];
  exams: Exam[];
  tasks: Task[];
  concepts: PsychologyConcept[];
  authors: PsychologyAuthor[];
  readings: ReadingItem[];
  materials: MaterialItem[];
  internshipLogs?: InternshipLog[];
  onToggleExam: (examId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  classes,
  exams,
  tasks,
  concepts,
  authors,
  readings,
  materials,
  onToggleExam,
  onToggleTask,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'aulas' | 'repertorio'>('info');
  const [selectedClassNote, setSelectedClassNote] = useState<ClassNote | null>(null);
  const { openWizard, openCompose } = useApp();

  // Filter items specific to this course
  const courseClasses = classes.filter((c) => c.courseId === course.id);
  const courseExams = exams.filter((e) => e.courseId === course.id);
  const courseTasks = tasks.filter((t) => t.disciplineId === course.id);
  const courseReadings = readings.filter((r) => r.courseId === course.id);
  const courseMaterials = materials.filter((m) => m.courseId === course.id);

  // Concepts related to this course
  const courseConcepts = concepts.filter(
    (c) => c.courseIds && c.courseIds.includes(course.id)
  );

  // Authors related to this course concepts or class notes
  const relatedAuthorIds = new Set<string>();
  courseConcepts.forEach((c) => c.authorIds?.forEach((a) => relatedAuthorIds.add(a)));
  courseClasses.forEach((cl) => cl.authorIds?.forEach((a) => relatedAuthorIds.add(a)));
  const courseAuthors = authors.filter((a) => relatedAuthorIds.has(a.id));

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-1 relative">

      {/* Top Navigation & Header directly on canvas */}
      <div className="space-y-3 px-1">
        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-ceci-border-default"
            style={{ backgroundColor: `${course.color}20` }}
          >
            <CourseIcon icon={course.icon} className="w-7 h-7" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h1 className="font-display text-2xl font-bold text-ceci-primary leading-tight">
              {course.name}
            </h1>

            <p className="text-xs font-semibold text-ceci-secondary flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-ceci-brand-strong" />
              <span>{course.professor}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3.5 px-1">
        {[
          { type: 'session', icon: Timer, label: 'anotar estudo', accent: 'bg-surface-blue text-ceci-academic-strong border-ceci-border-academic' },
          { type: 'exam', icon: ClipboardList, label: 'anotar prova', accent: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand' },
          { type: 'concept', icon: BookMarked, label: 'anotar conceito', accent: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand' },
          { type: 'class', icon: FileText, label: 'anotar aula', accent: 'bg-surface-muted text-ceci-primary border-ceci-border-default' },
        ].map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.type}
              onClick={() =>
                btn.type === 'class'
                  ? openCompose(course.id)
                  : openWizard(btn.type as WizardFlow, course.id)
              }
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-ceci-border-default hover:border-ceci-border-brand text-left tap-interactive hover:shadow-md active:scale-95 cursor-pointer shadow-sm"
            >
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${btn.accent}`}>
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span className="text-xs font-semibold text-ceci-primary leading-snug">{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Sub-Tabs Bar */}
      <div className="border-b border-ceci-border-default px-1">
        <div className="flex items-center justify-between gap-2">
          {[
            { id: 'info', label: 'informações', badge: null },
            { id: 'aulas', label: 'aulas & avaliações', badge: courseClasses.length + courseExams.length },
            { id: 'repertorio', label: 'repertório & conteúdo', badge: courseConcepts.length + courseReadings.length },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'info' | 'aulas' | 'repertorio')}
                className={`pb-3 text-xs font-semibold relative tap-interactive cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'text-ceci-primary font-bold'
                    : 'text-ceci-tertiary hover:text-ceci-primary'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSel ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand' : 'bg-surface-muted text-ceci-tertiary'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {isSel && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ceci-primary rounded-full animate-in fade-in duration-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: INFORMAÇÕES DA MATÉRIA (Clean, inline layout without nested cards) */}
      {/* ==================================================================== */}
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in duration-200 px-1">

          {/* Badges: código, dias de aula, obrigatória/complementar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-ceci-border-default text-ceci-primary">
              {course.code || 'PSI-300'}
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-ceci-primary border border-ceci-border-default">
              <Clock className="w-3 h-3 text-ceci-academic-strong" />
              <span>{course.schedule || 'Semanal'}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-rose text-ceci-brand-strong rounded-full text-[11px] font-semibold border border-ceci-border-brand">
              <span>{course.category === 'complementar' ? 'complementar' : 'obrigatória'}</span>
            </span>
          </div>

          {/* Ementa / Descrição (Inline Accent Block) */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-ceci-brand-strong" />
              <span>o que essa disciplina ensina</span>
            </h3>
            <div className="border-l-3 border-ceci-brand-strong pl-3.5 py-1 text-xs text-ceci-text-soft leading-relaxed font-medium bg-gradient-to-r from-surface-rose/70 to-transparent rounded-r-xl">
              {course.description ||
                'estudo detalhado das estruturas clínicas, semiologia psiquiátrica, modelo de compreensão comportamental e práticas de diagnóstico em psicologia.'}
            </div>
          </div>

          {/* Dados Universitários Grid (Inline divided section) */}
          <div className="space-y-2.5">
            <h3 className="font-display font-bold text-sm text-ceci-primary">
              detalhes acadêmicos
            </h3>

            <div className="border-y border-ceci-border-default py-3 grid grid-cols-2 gap-y-3.5 gap-x-4">
              <div>
                <span className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider block">Sala & Local</span>
                <p className="font-semibold text-xs text-ceci-primary mt-0.5">{course.room || 'Bloco C - Sala 204'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider block">Horário Semanal</span>
                <p className="font-semibold text-xs text-ceci-primary mt-0.5">{course.schedule || 'Segunda 08:00 - 11:30'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider block">Docente Responsável</span>
                <p className="font-semibold text-xs text-ceci-primary mt-0.5">{course.professor}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider block">Frequência Registrada</span>
                <p className="font-bold text-xs text-success-deep mt-0.5">92% (2 ausências)</p>
              </div>
            </div>
          </div>

          {/* Fórmulas de Avaliação / Pesos (Inline divided list) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-ceci-primary">
                como você é avaliada
              </h3>
              <span className="text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
                média mínima: 7,0
              </span>
            </div>

            <div className="divide-y divide-ceci-border-default/70 border-t border-ceci-border-default">
              <div className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ceci-brand-strong" />
                  <span className="font-semibold text-ceci-primary">prova teórica i (p1)</span>
                </div>
                <span className="font-bold text-ceci-primary bg-surface-muted px-2 py-0.5 rounded border border-ceci-border-default">peso 35%</span>
              </div>

              <div className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ceci-academic-strong" />
                  <span className="font-semibold text-ceci-primary">estudo de caso / trabalho (p2)</span>
                </div>
                <span className="font-bold text-ceci-primary bg-surface-muted px-2 py-0.5 rounded border border-ceci-border-default">peso 40%</span>
              </div>

              <div className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success-deep" />
                  <span className="font-semibold text-ceci-primary">atividades práticas / fichamentos</span>
                </div>
                <span className="font-bold text-ceci-primary bg-surface-muted px-2 py-0.5 rounded border border-ceci-border-default">peso 25%</span>
              </div>
            </div>
          </div>

          {/* Horário de Atendimento e Monitoria (Inline callout) */}
          <div className="pl-3.5 py-2.5 border-l-2 border-ceci-academic-strong space-y-1">
            <h4 className="font-display font-bold text-xs text-ceci-academic-strong flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-ceci-academic-strong" />
              <span>atendimento & monitoria</span>
            </h4>
            <p className="text-xs text-ceci-secondary leading-relaxed">
              Quartas-feiras das 14:00 às 15:30 na Sala dos Professores (Bloco C). Dúvidas sobre seminários podem ser enviadas por e-mail institucional.
            </p>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: AULAS & AVALIAÇÕES (Inline Journal & Exam List)              */}
      {/* ==================================================================== */}
      {activeTab === 'aulas' && (
        <div className="space-y-6 animate-in fade-in duration-200 px-1">
          
          {/* Section A: Próximas Avaliações */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-ceci-brand-strong" />
                <span>próximas avaliações & provas</span>
              </h3>
              <span className="text-[11px] font-semibold text-ceci-tertiary">
                {courseExams.length} anotadas
              </span>
            </div>

            {courseExams.length > 0 ? (
              <div className="divide-y divide-ceci-border-default/70 border-y border-ceci-border-default">
                {courseExams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => onToggleExam(exam.id)}
                    className="py-3 flex items-start justify-between cursor-pointer group transition-colors"
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
                          {exam.date}
                        </span>
                        <span className="text-[10px] font-semibold text-ceci-secondary">
                          {exam.weight}
                        </span>
                      </div>

                      <h4 className={`font-display font-bold text-sm text-ceci-primary ${exam.completed ? 'line-through text-ceci-tertiary' : ''}`}>
                        {exam.title}
                      </h4>

                      {exam.topics && exam.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {exam.topics.map((tp, idx) => (
                            <span key={idx} className="text-[9px] text-ceci-secondary bg-surface-muted px-2 py-0.2 rounded border border-ceci-border-default">
                              {tp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <CheckCircle2 className={`w-5 h-5 ${exam.completed ? 'text-success-deep fill-success-deep/10' : 'text-ceci-faded'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ceci-tertiary py-2">
                ainda não tem prova anotada para esta disciplina.
              </p>
            )}
          </div>

          {/* Section B: Diário de Aulas / Registros (Editorial list with dividers) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-ceci-academic-strong" />
                <span>diário de aulas</span>
              </h3>
<button
                onClick={() => openCompose(course.id)}
                className="text-xs font-bold text-ceci-brand-strong hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>nova aula</span>
              </button>
            </div>

            {courseClasses.length > 0 ? (
              <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
                {courseClasses.map((cl) => (
                  <ClassNoteListItem
                    key={cl.id}
                    note={cl}
                    onClick={() => setSelectedClassNote(cl)}
                    showExtras
                  />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <FileText className="w-6 h-6 text-ceci-faded mx-auto" />
                <p className="text-xs font-semibold text-ceci-primary">ainda não tem aula anotada</p>
                <button
                  onClick={() => openCompose(course.id)}
                  className="px-3.5 py-1.5 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong rounded-full text-xs font-bold cursor-pointer"
                >
                  anotar primeira aula
                </button>
              </div>
            )}
          </div>

          {/* Section C: Tarefas & Trabalhos */}
          {courseTasks.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-deep" />
                <span>tarefas & entregas pendentes</span>
              </h3>

              <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
                {courseTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onToggleTask(t.id)}
                    className="py-2.5 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="space-y-0.5 pr-2">
                      <p className={`font-semibold text-ceci-primary ${t.completed ? 'line-through text-ceci-tertiary' : ''}`}>
                        {t.title}
                      </p>
                      {t.dueDate && (
                        <span className="text-[10px] text-ceci-tertiary">prazo: {t.dueDate}</span>
                      )}
                    </div>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${t.completed ? 'text-success-deep' : 'text-ceci-faded'}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: REPERTÓRIO & CONTEÚDO (Inline Glossary & Author list)        */}
      {/* ==================================================================== */}
      {activeTab === 'repertorio' && (
        <div className="space-y-6 animate-in fade-in duration-200 px-1">
          
          {/* Section A: Conceitos Relacionados */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ceci-brand-strong" />
              <span>conceitos-chave da disciplina</span>
            </h3>

            {courseConcepts.length > 0 ? (
              <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
                {courseConcepts.map((concept) => (
                  <div key={concept.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-sm text-ceci-primary">
                        {concept.name}
                      </h4>
                      {concept.tags?.[0] && (
                        <span className="text-[9px] font-bold bg-surface-rose text-ceci-brand-strong px-2 py-0.5 rounded-full border border-ceci-border-brand">
                          {concept.tags[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ceci-secondary leading-relaxed">
                      {concept.definition}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ceci-tertiary py-2">
                ainda não tem conceito ligado a esta disciplina.
              </p>
            )}
          </div>

          {/* Section B: Autores Fundamentais */}
          {courseAuthors.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-ceci-academic-strong" />
                <span>autores fundamentais</span>
              </h3>

              <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
                {courseAuthors.map((author) => (
                  <div key={author.id} className="py-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-200 text-ceci-academic-strong font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {author.name.charAt(0)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-ceci-primary">
                          {author.name}
                        </h4>
                        <span className="text-[10px] text-ceci-tertiary">{author.lifespan}</span>
                      </div>
                      <p className="text-xs text-ceci-secondary leading-relaxed">
                        {author.bio}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section C: Leituras & Bibliografia Recomendada */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-beige-700" />
              <span>leituras & bibliografia recomendada</span>
            </h3>

            {courseReadings.length > 0 || courseMaterials.length > 0 ? (
              <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
                {courseReadings.map((reading) => (
                  <div key={reading.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-ceci-primary">{reading.title}</h5>
                      <p className="text-[11px] text-ceci-tertiary">por {reading.author}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-success-deep bg-surface-mint-soft px-2.5 py-1 rounded-full border border-ceci-border-academic">
                      {reading.readPages || 0} / {reading.totalPages || 100} pág
                    </span>
                  </div>
                ))}

                {courseMaterials.map((mat) => (
                  <div key={mat.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <h5 className="font-semibold text-ceci-primary">{mat.title}</h5>
                      <p className="text-[10px] text-ceci-tertiary uppercase">{mat.type} • {mat.author}</p>
                    </div>
                    <span className="text-[10px] font-bold text-ceci-academic-strong bg-surface-blue px-2 py-0.5 rounded border border-ceci-border-academic">
                      PDF
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ceci-tertiary py-2">
                ainda não tem leitura vinculada a esta disciplina.
              </p>
            )}
          </div>

        </div>
      )}

      {/* Modal View for Selected Class Note */}
      <ClassNoteModal
        note={selectedClassNote}
        onClose={() => setSelectedClassNote(null)}
      />

    </div>
  );
};
