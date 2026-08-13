import React, { useState } from 'react';
import {
  Building2,
  UserCheck,
  Clock,
  FileText,
  Sparkles,
  CheckCircle2,
  Plus,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { CourseIcon } from '../ui/CourseIcon';
import { ClassNoteModal } from '../courses/ClassNoteModal';
import { ClassNoteListItem } from '../courses/ClassNoteListItem';
import {
  Course,
  ClassNote,
  Exam,
  Task,
  PsychologyConcept,
  PsychologyAuthor,
  ReadingItem,
  MaterialItem,
  InternshipLog
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
  onBack: () => void;
  onToggleExam: (examId: string) => void;
  onToggleTask: (taskId: string) => void;
  onOpenQuickAdd: () => void;
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
  onBack,
  onToggleExam,
  onToggleTask,
  onOpenQuickAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'aulas' | 'repertorio'>('info');
  const [selectedClassNote, setSelectedClassNote] = useState<ClassNote | null>(null);

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
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-1 animate-in fade-in duration-300 relative">

      {/* Top Navigation & Header directly on canvas */}
      <div className="space-y-3 px-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B94862] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>voltar às disciplinas</span>
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[#E9DFDC]"
            style={{ backgroundColor: `${course.color}20` }}
          >
            <CourseIcon icon={course.icon} className="w-7 h-7" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-[#E9DFDC] text-[#40383A]">
                {course.code || 'PSI-300'}
              </span>
              <span className="text-[11px] font-semibold text-[#B94862]">
                {course.semester || '6º Semestre'}
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold text-[#40383A] leading-tight">
              {course.name}
            </h1>

            <p className="text-xs font-semibold text-[#6D6366] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#B94862]" />
              <span>{course.professor}</span>
            </p>
          </div>
        </div>

        {/* Pill Badges Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E9DFDC]">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#40383A] border border-[#E9DFDC]">
            <Building2 className="w-3 h-3 text-[#B94862]" />
            <span>{course.room || 'Bloco C - Sala 204'}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#40383A] border border-[#E9DFDC]">
            <Clock className="w-3 h-3 text-[#396D82]" />
            <span>{course.schedule || 'Segunda 08:00'}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFF5F7] text-[#B94862] rounded-full text-[11px] font-semibold border border-[#FFD3DD]">
            <span>Obrigatória • 72h</span>
          </span>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar */}
      <div className="border-b border-[#E9DFDC] px-1">
        <div className="flex items-center justify-between gap-2">
          {[
            { id: 'info', label: 'Informações', badge: null },
            { id: 'aulas', label: 'Aulas & Avaliações', badge: courseClasses.length + courseExams.length },
            { id: 'repertorio', label: 'Repertório & Conteúdo', badge: courseConcepts.length + courseReadings.length },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'info' | 'aulas' | 'repertorio')}
                className={`pb-3 text-xs font-semibold relative transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'text-[#40383A] font-bold'
                    : 'text-[#918689] hover:text-[#40383A]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSel ? 'bg-[#FFF5F7] text-[#B94862] border border-[#FFD3DD]' : 'bg-[#FAF8F5] text-[#918689]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {isSel && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#40383A] rounded-full animate-in fade-in duration-200" />
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
          
          {/* Ementa / Descrição (Inline Accent Block) */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm text-[#40383A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#B94862]" />
              <span>Ementa & Objetivos da Disciplina</span>
            </h3>
            <div className="border-l-3 border-[#B94862] pl-3.5 py-1 text-xs text-[#524B4D] leading-relaxed font-medium bg-gradient-to-r from-[#FFF5F7]/70 to-transparent rounded-r-xl">
              {course.description ||
                'Estudo detalhado das estruturas clínicas, semiologia psiquiátrica, modelo de compreensão comportamental e práticas de diagnóstico em Psicologia.'}
            </div>
          </div>

          {/* Dados Universitários Grid (Inline divided section) */}
          <div className="space-y-2.5">
            <h3 className="font-display font-bold text-sm text-[#40383A]">
              Detalhes Acadêmicos
            </h3>

            <div className="border-y border-[#E9DFDC] py-3 grid grid-cols-2 gap-y-3.5 gap-x-4">
              <div>
                <span className="text-[10px] font-bold text-[#918689] uppercase tracking-wider block">Sala & Local</span>
                <p className="font-semibold text-xs text-[#40383A] mt-0.5">{course.room || 'Bloco C - Sala 204'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#918689] uppercase tracking-wider block">Horário Semanal</span>
                <p className="font-semibold text-xs text-[#40383A] mt-0.5">{course.schedule || 'Segunda 08:00 - 11:30'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#918689] uppercase tracking-wider block">Docente Responsável</span>
                <p className="font-semibold text-xs text-[#40383A] mt-0.5">{course.professor}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#918689] uppercase tracking-wider block">Frequência Registrada</span>
                <p className="font-bold text-xs text-[#2D6A4F] mt-0.5">92% (2 ausências)</p>
              </div>
            </div>
          </div>

          {/* Fórmulas de Avaliação / Pesos (Inline divided list) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#40383A]">
                Critérios de Avaliação
              </h3>
              <span className="text-[11px] font-semibold text-[#B94862] bg-[#FFF5F7] px-2.5 py-0.5 rounded-full border border-[#FFD3DD]">
                Média Mínima: 7,0
              </span>
            </div>

            <div className="divide-y divide-[#E9DFDC]/70 border-t border-[#E9DFDC]">
              <div className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B94862]" />
                  <span className="font-semibold text-[#40383A]">Prova Teórica I (P1)</span>
                </div>
                <span className="font-bold text-[#40383A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E9DFDC]">Peso 35%</span>
              </div>

              <div className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#396D82]" />
                  <span className="font-semibold text-[#40383A]">Estudo de Caso / Trabalho (P2)</span>
                </div>
                <span className="font-bold text-[#40383A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E9DFDC]">Peso 40%</span>
              </div>

              <div className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                  <span className="font-semibold text-[#40383A]">Atividades Práticas / Fichamentos</span>
                </div>
                <span className="font-bold text-[#40383A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E9DFDC]">Peso 25%</span>
              </div>
            </div>
          </div>

          {/* Horário de Atendimento e Monitoria (Inline callout) */}
          <div className="pl-3.5 py-2.5 border-l-2 border-[#396D82] space-y-1">
            <h4 className="font-display font-bold text-xs text-[#396D82] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#396D82]" />
              <span>atendimento & monitoria</span>
            </h4>
            <p className="text-xs text-[#6D6366] leading-relaxed">
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
              <h3 className="font-display font-bold text-sm text-[#40383A] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B94862]" />
                <span>Próximas Avaliações & Provas</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#918689]">
                {courseExams.length} cadastradas
              </span>
            </div>

            {courseExams.length > 0 ? (
              <div className="divide-y divide-[#E9DFDC]/70 border-y border-[#E9DFDC]">
                {courseExams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => onToggleExam(exam.id)}
                    className="py-3 flex items-start justify-between cursor-pointer group transition-colors"
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#B94862] bg-[#FFF5F7] px-2 py-0.5 rounded-full border border-[#FFD3DD]">
                          {exam.date}
                        </span>
                        <span className="text-[10px] font-semibold text-[#6D6366]">
                          {exam.weight}
                        </span>
                      </div>

                      <h4 className={`font-display font-bold text-sm text-[#40383A] ${exam.completed ? 'line-through text-[#918689]' : ''}`}>
                        {exam.title}
                      </h4>

                      {exam.topics && exam.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {exam.topics.map((tp, idx) => (
                            <span key={idx} className="text-[9px] text-[#6D6366] bg-[#FAF8F5] px-2 py-0.2 rounded border border-[#E9DFDC]">
                              {tp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <CheckCircle2 className={`w-5 h-5 ${exam.completed ? 'text-[#2D6A4F] fill-[#2D6A4F]/10' : 'text-[#BEB4B6]'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#918689] py-2">
                Nenhuma avaliação cadastrada para esta disciplina ainda.
              </p>
            )}
          </div>

          {/* Section B: Diário de Aulas / Registros (Editorial list with dividers) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#40383A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#396D82]" />
                <span>Diário de Aulas Registradas</span>
              </h3>
              <button
                onClick={onOpenQuickAdd}
                className="text-xs font-bold text-[#B94862] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>nova aula</span>
              </button>
            </div>

            {courseClasses.length > 0 ? (
              <div className="divide-y divide-[#E9DFDC] border-y border-[#E9DFDC]">
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
                <FileText className="w-6 h-6 text-[#BEB4B6] mx-auto" />
                <p className="text-xs font-semibold text-[#40383A]">Ainda não há registros de aula</p>
                <button
                  onClick={onOpenQuickAdd}
                  className="px-3.5 py-1.5 bg-[#FFF5F7] border border-[#FFD3DD] text-[#B94862] rounded-full text-xs font-bold cursor-pointer"
                >
                  anotar primeira aula
                </button>
              </div>
            )}
          </div>

          {/* Section C: Tarefas & Trabalhos */}
          {courseTasks.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display font-bold text-sm text-[#40383A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                <span>Tarefas e Entregas Pendentes</span>
              </h3>

              <div className="divide-y divide-[#E9DFDC] border-y border-[#E9DFDC]">
                {courseTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onToggleTask(t.id)}
                    className="py-2.5 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="space-y-0.5 pr-2">
                      <p className={`font-semibold text-[#40383A] ${t.completed ? 'line-through text-[#918689]' : ''}`}>
                        {t.title}
                      </p>
                      {t.dueDate && (
                        <span className="text-[10px] text-[#918689]">prazo: {t.dueDate}</span>
                      )}
                    </div>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${t.completed ? 'text-[#2D6A4F]' : 'text-[#BEB4B6]'}`} />
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
            <h3 className="font-display font-bold text-sm text-[#40383A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B94862]" />
              <span>Conceitos-Chave da Disciplina</span>
            </h3>

            {courseConcepts.length > 0 ? (
              <div className="divide-y divide-[#E9DFDC] border-y border-[#E9DFDC]">
                {courseConcepts.map((concept) => (
                  <div key={concept.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-sm text-[#40383A]">
                        {concept.name}
                      </h4>
                      {concept.tags?.[0] && (
                        <span className="text-[9px] font-bold bg-[#FFF5F7] text-[#B94862] px-2 py-0.5 rounded-full border border-[#FFD3DD]">
                          {concept.tags[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6D6366] leading-relaxed">
                      {concept.definition}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#918689] py-2">
                Nenhum conceito associado diretamente ainda.
              </p>
            )}
          </div>

          {/* Section B: Autores Fundamentais */}
          {courseAuthors.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display font-bold text-sm text-[#40383A] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#396D82]" />
                <span>Autores Fundamentais</span>
              </h3>

              <div className="divide-y divide-[#E9DFDC] border-y border-[#E9DFDC]">
                {courseAuthors.map((author) => (
                  <div key={author.id} className="py-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#BFDDED] text-[#396D82] font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {author.name.charAt(0)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-[#40383A]">
                          {author.name}
                        </h4>
                        <span className="text-[10px] text-[#918689]">{author.lifespan}</span>
                      </div>
                      <p className="text-xs text-[#6D6366] leading-relaxed">
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
            <h3 className="font-display font-bold text-sm text-[#40383A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#756354]" />
              <span>Leituras & Bibliografia Recomendada</span>
            </h3>

            {courseReadings.length > 0 || courseMaterials.length > 0 ? (
              <div className="divide-y divide-[#E9DFDC] border-y border-[#E9DFDC]">
                {courseReadings.map((reading) => (
                  <div key={reading.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-[#40383A]">{reading.title}</h5>
                      <p className="text-[11px] text-[#918689]">Autor: {reading.author}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-[#2D6A4F] bg-[#EAF5ED] px-2.5 py-1 rounded-full border border-[#CEE7F0]">
                      {reading.readPages || 0} / {reading.totalPages || 100} pág
                    </span>
                  </div>
                ))}

                {courseMaterials.map((mat) => (
                  <div key={mat.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <h5 className="font-semibold text-[#40383A]">{mat.title}</h5>
                      <p className="text-[10px] text-[#918689] uppercase">{mat.type} • {mat.author}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#396D82] bg-[#F3F9FC] px-2 py-0.5 rounded border border-[#CEE7F0]">
                      PDF
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#918689] py-2">
                Nenhuma leitura vinculada a esta disciplina.
              </p>
            )}
          </div>

        </div>
      )}

      {/* 4. Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FFFCF8] via-[#FFFCF8]/95 to-transparent z-30 pointer-events-none">
        <div className="max-w-md sm:max-w-xl mx-auto pointer-events-auto">
          <button
            onClick={onOpenQuickAdd}
            className="w-full bg-[#40383A] hover:bg-[#2D2728] text-white py-3.5 rounded-2xl font-display font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer border border-white/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Anotação ou Tarefa da Matéria</span>
          </button>
        </div>
      </div>

      {/* Modal View for Selected Class Note */}
      <ClassNoteModal
        note={selectedClassNote}
        onClose={() => setSelectedClassNote(null)}
      />

    </div>
  );
};
