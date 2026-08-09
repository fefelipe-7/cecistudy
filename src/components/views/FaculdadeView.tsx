import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar as CalendarIcon,
  FileCheck2,
  Clock,
  Plus,
  Sparkles,
  User,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Course, ClassNote, Exam, SubTabFaculdade } from '../../types';

interface FaculdadeViewProps {
  courses: Course[];
  classes: ClassNote[];
  exams: Exam[];
  initialSubTab?: SubTabFaculdade;
  selectedCourseId?: string;
  onOpenQuickAdd: () => void;
  onToggleExam: (examId: string) => void;
}

export const FaculdadeView: React.FC<FaculdadeViewProps> = ({
  courses,
  classes,
  exams,
  initialSubTab = 'disciplinas',
  selectedCourseId,
  onOpenQuickAdd,
  onToggleExam,
}) => {
  const [subTab, setSubTab] = useState<SubTabFaculdade>(initialSubTab);
  const [activeCourseFilter, setActiveCourseFilter] = useState<string | null>(selectedCourseId || null);
  const [selectedClass, setSelectedClass] = useState<ClassNote | null>(null);

  const filteredClasses = activeCourseFilter
    ? classes.filter((c) => c.courseId === activeCourseFilter)
    : classes;

  const filteredExams = activeCourseFilter
    ? exams.filter((e) => e.courseId === activeCourseFilter)
    : exams;

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-16 animate-in fade-in duration-300">
      
      {/* Top Header Label & Title (Exact Image 3) */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-xs text-[#82787A] font-medium uppercase tracking-wide">Faculdade</p>
          <h1 className="font-serif-display text-2xl sm:text-3xl text-[#40383A] font-bold mt-0.5 tracking-tight">
            6º semestre
          </h1>
        </div>
        <button
          onClick={() => setSubTab('calendario')}
          className="w-10 h-10 rounded-2xl bg-white border border-[#E8DEDB] flex items-center justify-center text-[#82787A] hover:bg-[#FAF7F2] transition-colors shadow-2xs"
          title="Ver calendário"
        >
          <CalendarIcon className="w-5 h-5 text-[#82787A]" />
        </button>
      </div>

      {/* Hero Card: Seu semestre em um só lugar */}
      <div className="journal-card p-6 bg-gradient-to-br from-[#FFEAF0]/80 via-white to-[#FFF7EC]/60 border border-[#FFD4E0] relative overflow-hidden space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#CE5373] uppercase tracking-wider bg-white/90 px-3 py-1 rounded-full border border-[#FFD4E0] shadow-2xs">
              Semestre 2026.2 ♡
            </span>
            <span className="text-xs text-[#6B5E62] font-semibold bg-white/70 px-2.5 py-1 rounded-full border border-[#F0E6E3]">Psicologia</span>
          </div>

          <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#3D3336] mt-2">
            Seu semestre em um só lugar
          </h2>
          <p className="text-xs text-[#6B5E62] mt-1 leading-relaxed">
            Disciplinas, aulas, tarefas e provas organizados com leveza e carinho.
          </p>
        </div>

        {/* Micro Pills Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-white/90 text-[#3D3336] px-3.5 py-1 rounded-full font-semibold border border-[#FFD4E0]">
            5 disciplinas
          </span>
          <span className="text-xs bg-[#FFEAF0] text-[#CE5373] px-3.5 py-1 rounded-full font-semibold border border-[#FFD4E0]">
            2 provas próximas
          </span>
          <span className="text-xs bg-[#E6F0F7] text-[#33627E] px-3.5 py-1 rounded-full font-semibold border border-[#CEE1EF]">
            3 tarefas da semana
          </span>
        </div>

        {/* Circular Progress Box */}
        <div className="p-4 rounded-2xl bg-white/90 border border-[#FFD4E0] flex items-center gap-4 shadow-2xs">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="19" stroke="#FFEAF0" strokeWidth="4" fill="transparent" />
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke="#E26D8B"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={120}
                strokeDashoffset={120 - (120 * 0.62)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-serif-display font-bold text-xs text-[#CE5373]">62%</span>
          </div>

          <div>
            <h3 className="font-serif-display font-bold text-sm text-[#3D3336]">Ritmo bonito de estudo ✨</h3>
            <p className="text-xs text-[#6B5E62] mt-0.5 leading-relaxed">
              Psicopatologia e Social conduzindo seu progresso com consistência.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'disciplinas', label: 'Disciplinas', icon: BookOpen },
          { id: 'aulas', label: 'Diário de Aulas', icon: FileCheck2 },
          { id: 'avaliacoes', label: 'Avaliações', icon: AlertCircle },
          { id: 'calendario', label: 'Calendário', icon: CalendarIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = subTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as SubTabFaculdade)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSel
                  ? 'bg-[#2D2628] text-white shadow-2xs'
                  : 'bg-white text-[#5C5255] border border-[#E8E1D9] hover:bg-[#FAF7F2]'
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
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif-display text-lg font-bold text-[#2D2628]">Grade de Disciplinas</h2>
            <button
              onClick={() => setSubTab('calendario')}
              className="text-xs text-[#8C3B50] hover:underline font-semibold"
            >
              Ver calendário completo →
            </button>
          </div>

          <div className="space-y-3">
            {/* Course 1: Rose Border Accent */}
            <div
              onClick={() => {
                setActiveCourseFilter('c1');
                setSubTab('aulas');
              }}
              className="journal-card p-5 bg-white border border-[#E8E1D9] border-l-4 border-l-[#8C3B50] cursor-pointer hover:border-[#8C3B50] transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#2D2628]">
                    Psicopatologia
                  </h3>
                  <p className="text-xs text-[#5C5255] mt-0.5">Profa. Helena Matos • 7 de 12 aulas</p>
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#FAF4F5] text-[#8C3B50] px-2.5 py-1 rounded-md border border-[#E6C8CF]">
                  Amanhã 09:00
                </span>
              </div>

              <p className="text-xs text-[#5C5255]">1 Leitura Obrigatória • Prova em 12/08</p>

              {/* Progress */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E1D9]">
                  <div className="h-full bg-[#8C3B50] rounded-full" style={{ width: '70%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5C5255] pt-1">
                  <span>Módulo Atual: Conceituação TCC</span>
                  <span className="font-semibold text-[#8C3B50] flex items-center gap-0.5">
                    Acessar aulas <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>

            {/* Course 2: Slate Border Accent */}
            <div
              onClick={() => {
                setActiveCourseFilter('c2');
                setSubTab('aulas');
              }}
              className="journal-card p-5 bg-white border border-[#E8E1D9] border-l-4 border-l-[#2C5263] cursor-pointer hover:border-[#2C5263] transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#2D2628]">
                    Psicologia Social
                  </h3>
                  <p className="text-xs text-[#5C5255] mt-0.5">Prof. André Vidal • 6 de 10 aulas</p>
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#F3F7F9] text-[#2C5263] px-2.5 py-1 rounded-md border border-[#C7DCDE]">
                  Amanhã 14:00
                </span>
              </div>

              <p className="text-xs text-[#5C5255]">Seminário Científico • Grupo 03</p>

              {/* Progress */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E1D9]">
                  <div className="h-full bg-[#2C5263] rounded-full" style={{ width: '60%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5C5255] pt-1">
                  <span>Módulo Atual: Influência Social</span>
                  <span className="font-semibold text-[#2C5263] flex items-center gap-0.5">
                    Acessar aulas <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>

            {/* Course 3: Amber Border Accent */}
            <div
              onClick={() => {
                setActiveCourseFilter('c3');
                setSubTab('aulas');
              }}
              className="journal-card p-5 bg-white border border-[#E8E1D9] border-l-4 border-l-[#825538] cursor-pointer hover:border-[#825538] transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#2D2628]">
                    Avaliação Psicológica
                  </h3>
                  <p className="text-xs text-[#5C5255] mt-0.5">Profa. Camila Nogueira • 4 de 9 aulas</p>
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#FAF6F0] text-[#825538] px-2.5 py-1 rounded-md border border-[#E7D8C4]">
                  Quinta-feira
                </span>
              </div>

              <p className="text-xs text-[#5C5255]">2 Materiais de Estudo de Casos</p>

              {/* Progress */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E1D9]">
                  <div className="h-full bg-[#825538] rounded-full" style={{ width: '45%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5C5255] pt-1">
                  <span>Módulo Atual: Testes de Personalidade</span>
                  <span className="font-semibold text-[#825538] flex items-center gap-0.5">
                    Acessar aulas <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* SUBTAB 2: AULAS */}
      {subTab === 'aulas' && (
        <div className="space-y-3">
          {filteredClasses.map((cl) => (
            <div
              key={cl.id}
              onClick={() => setSelectedClass(cl)}
              className="rounded-[24px] p-5 bg-white border border-[#E8DEDB] shadow-sm hover:border-[#EA718F] cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-[#82787A]">
                <span className="font-semibold text-[#EA718F]">Aula {cl.number}</span>
                <span>{cl.date}</span>
              </div>

              <h3 className="font-serif-display font-bold text-base text-[#40383A]">
                {cl.title}
              </h3>

              <p className="text-xs text-[#6F6568] line-clamp-2 leading-relaxed">
                {cl.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: AVALIAÇÕES */}
      {subTab === 'avaliacoes' && (
        <div className="rounded-[28px] p-6 bg-white border border-[#E8DEDB] shadow-sm space-y-4">
          <h2 className="font-serif-display text-lg font-bold text-[#40383A]">
            Avaliações & Provas
          </h2>

          <div className="space-y-3">
            {filteredExams.map((ex) => (
              <div
                key={ex.id}
                onClick={() => onToggleExam(ex.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  ex.completed
                    ? 'bg-[#FAF5EF] border-[#E8DEDB] text-[#82787A] line-through'
                    : 'bg-white border border-[#E8DEDB] hover:border-[#EA718F]'
                }`}
              >
                <div>
                  <h3 className="font-semibold text-sm text-[#40383A]">{ex.title}</h3>
                  <p className="text-xs text-[#6F6568] mt-0.5">Data: {ex.date} · Peso {ex.weight}</p>
                </div>
                <CheckCircle2 className={`w-5 h-5 ${ex.completed ? 'text-[#5B8C67]' : 'text-[#C4B9BB]'}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: CALENDÁRIO */}
      {subTab === 'calendario' && (
        <div className="rounded-[28px] p-6 bg-white border border-[#E8DEDB] shadow-sm space-y-4">
          <h2 className="font-serif-display text-lg font-bold text-[#40383A]">
            Calendário Acadêmico · 2026.2
          </h2>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-[#82787A] py-2">
            <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
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
                      ? 'bg-[#EA718F] text-white shadow-xs'
                      : hasEvent
                      ? 'bg-[#FFE7ED] text-[#B94763] font-bold'
                      : 'bg-[#FAF7F2] text-[#40383A]'
                  }`}
                >
                  <span>{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Card 3: Sua semana acadêmica (Exact Image 3) */}
      <div className="rounded-[28px] p-6 bg-white border border-[#E8DEDB] shadow-sm space-y-3">
        <span className="text-xs text-[#82787A] font-semibold tracking-wide uppercase">Próximos eventos</span>
        
        <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#40383A]">
          Sua semana acadêmica
        </h2>
        
        <p className="text-xs text-[#6F6568]">
          O suficiente para você se localizar sem virar um dashboard corporativo.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF5EF] border border-[#E8DEDB]">
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Entrega de fichamento</h3>
              <p className="text-[11px] text-[#6F6568] mt-0.5">Psicologia Social · segunda-feira</p>
            </div>
            <span className="text-xs font-semibold text-[#EA718F] bg-white px-2.5 py-1 rounded-full border border-[#FFD1DC]">
              11/08
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF5EF] border border-[#E8DEDB]">
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Supervisão de estágio</h3>
              <p className="text-[11px] text-[#6F6568] mt-0.5">Registrar aprendizados e dúvidas</p>
            </div>
            <span className="text-xs font-semibold text-[#32677F] bg-white px-2.5 py-1 rounded-full border border-[#CDE6F2]">
              13/08
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
