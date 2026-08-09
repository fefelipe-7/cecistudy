import React, { useState } from 'react';
import { X, Check, BookOpen, FileText, Brain, HeartHandshake, Sparkles, Plus } from 'lucide-react';
import { Course } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onAddTask: (task: any) => void;
  onAddClassNote: (note: any) => void;
  onAddReading: (reading: any) => void;
  onAddFlashcard: (card: any) => void;
  onAddConcept: (concept: any) => void;
  onAddInternshipLog: (log: any) => void;
}

type QuickType = 'task' | 'class' | 'reading' | 'flashcard' | 'concept' | 'internship';

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  courses,
  onAddTask,
  onAddClassNote,
  onAddReading,
  onAddFlashcard,
  onAddConcept,
  onAddInternshipLog,
}) => {
  const [activeType, setActiveType] = useState<QuickType>('task');

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourseId, setTaskCourseId] = useState(courses[0]?.id || '');
  const [taskCategory, setTaskCategory] = useState<'leitura' | 'trabalho' | 'revisao' | 'estagio' | 'outro'>('leitura');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [classTitle, setClassTitle] = useState('');
  const [classCourseId, setClassCourseId] = useState(courses[0]?.id || '');
  const [classSummary, setClassSummary] = useState('');

  const [readingTitle, setReadingTitle] = useState('');
  const [readingAuthor, setReadingAuthor] = useState('');
  const [readingPages, setReadingPages] = useState('200');

  const [flashcardQuestion, setFlashcardQuestion] = useState('');
  const [flashcardAnswer, setFlashcardAnswer] = useState('');

  const [conceptName, setConceptName] = useState('');
  const [conceptDef, setConceptDef] = useState('');

  const [internshipActivity, setInternshipActivity] = useState('');
  const [internshipHours, setInternshipHours] = useState('4');
  const [internshipNotes, setInternshipNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'task') {
      if (!taskTitle.trim()) return;
      onAddTask({
        id: 't-' + Date.now(),
        title: taskTitle.trim(),
        disciplineId: taskCourseId,
        category: taskCategory,
        dueDate: taskDueDate || new Date().toISOString().split('T')[0],
        completed: false,
        priority: 'media'
      });
      setTaskTitle('');
    } else if (activeType === 'class') {
      if (!classTitle.trim()) return;
      onAddClassNote({
        id: 'cl-' + Date.now(),
        courseId: classCourseId,
        title: classTitle.trim(),
        number: Math.floor(Math.random() * 5) + 9,
        date: new Date().toISOString().split('T')[0],
        summary: classSummary.trim() || 'Anotações da aula.',
        fullNotes: classSummary.trim() || 'Anotações registradas rapidamente no cecistudy ♡',
        conceptIds: [],
        authorIds: [],
        materials: [],
        hasQuestions: false
      });
      setClassTitle('');
      setClassSummary('');
    } else if (activeType === 'reading') {
      if (!readingTitle.trim()) return;
      onAddReading({
        id: 'r-' + Date.now(),
        title: readingTitle.trim(),
        author: readingAuthor.trim() || 'Autor não informado',
        courseId: courses[0]?.id,
        type: 'livro',
        totalPages: parseInt(readingPages) || 200,
        readPages: 0,
        status: 'lendo',
        highlights: []
      });
      setReadingTitle('');
      setReadingAuthor('');
    } else if (activeType === 'flashcard') {
      if (!flashcardQuestion.trim() || !flashcardAnswer.trim()) return;
      onAddFlashcard({
        id: 'f-' + Date.now(),
        courseId: courses[0]?.id,
        question: flashcardQuestion.trim(),
        answer: flashcardAnswer.trim(),
        timesReviewed: 0
      });
      setFlashcardQuestion('');
      setFlashcardAnswer('');
    } else if (activeType === 'concept') {
      if (!conceptName.trim()) return;
      onAddConcept({
        id: 'con-' + Date.now(),
        name: conceptName.trim(),
        definition: conceptDef.trim() || 'Conceito de Psicologia registrado no meu caderno.',
        authorIds: [],
        courseIds: [courses[0]?.id || 'c1'],
        tags: ['Psicologia', 'Conceito']
      });
      setConceptName('');
      setConceptDef('');
    } else if (activeType === 'internship') {
      if (!internshipActivity.trim()) return;
      onAddInternshipLog({
        id: 'ilog-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        hours: parseFloat(internshipHours) || 4,
        activity: internshipActivity.trim(),
        supervisionNotes: internshipNotes.trim() || 'Supervisão registrada com sucesso.',
        reflections: 'Reflexão registrada no diário do cecistudy.'
      });
      setInternshipActivity('');
      setInternshipNotes('');
    }

    onClose();
  };

  const typeOptions: { id: QuickType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'task', label: 'Tarefa', icon: Check },
    { id: 'class', label: 'Aula / Nota', icon: FileText },
    { id: 'reading', label: 'Leitura', icon: BookOpen },
    { id: 'flashcard', label: 'Flashcard', icon: Brain },
    { id: 'concept', label: 'Conceito', icon: Sparkles },
    { id: 'internship', label: 'Estágio', icon: HeartHandshake },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[rgba(40,30,30,0.18)] backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FFFCF8] rounded-t-[28px] sm:rounded-3xl border border-[#E8DEDB] shadow-xl overflow-hidden p-5 sm:p-6 text-[#40383A]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1E9E6] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#FFF4F7] flex items-center justify-center text-[#EA718F] text-sm font-bold border border-[#FFD1DC]">
              ♡
            </span>
            <div>
              <h3 className="font-serif-display font-bold text-lg text-[#40383A]">
                Novo Registro no Cantinho
              </h3>
              <p className="text-xs text-[#6F6568]">O que você quer adicionar agora?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#6F6568] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSel = activeType === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveType(opt.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all min-h-[36px] ${
                  isSel
                    ? 'bg-[#EA718F] text-white shadow-2xs'
                    : 'bg-white text-[#6F6568] border border-[#E8DEDB] hover:bg-[#FFF4F7]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeType === 'task' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Título da Tarefa</label>
                <input
                  type="text"
                  placeholder="Ex: Ler capítulo 4 de Psicopatologia"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#716A70] mb-1">Disciplina</label>
                  <select
                    value={taskCourseId}
                    onChange={(e) => setTaskCourseId(e.target.value)}
                    className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#716A70] mb-1">Categoria</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as any)}
                    className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  >
                    <option value="leitura">Leitura 📚</option>
                    <option value="trabalho">Trabalho / Trabalho Acadêmico 📝</option>
                    <option value="revisao">Revisão 🧠</option>
                    <option value="estagio">Estágio 🩺</option>
                    <option value="outro">Outro ✨</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Data Limite (Prazo)</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                />
              </div>
            </>
          )}

          {activeType === 'class' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Título da Aula</label>
                <input
                  type="text"
                  placeholder="Ex: Aula 09 - Transtornos de Ansiedade e Tag"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Disciplina</label>
                <select
                  value={classCourseId}
                  onChange={(e) => setClassCourseId(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Resumo / Principais Anotações</label>
                <textarea
                  rows={3}
                  placeholder="Escreva os pontos fundamentais discutidos em sala..."
                  value={classSummary}
                  onChange={(e) => setClassSummary(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                />
              </div>
            </>
          )}

          {activeType === 'reading' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Título da Obra / Artigo</label>
                <input
                  type="text"
                  placeholder="Ex: A Interpretação dos Sonhos ou Artigo sobre TCC"
                  value={readingTitle}
                  onChange={(e) => setReadingTitle(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#716A70] mb-1">Autor</label>
                  <input
                    type="text"
                    placeholder="Ex: Aaron Beck, Freud"
                    value={readingAuthor}
                    onChange={(e) => setReadingAuthor(e.target.value)}
                    className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#716A70] mb-1">Total de Páginas</label>
                  <input
                    type="number"
                    value={readingPages}
                    onChange={(e) => setReadingPages(e.target.value)}
                    className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === 'flashcard' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Pergunta / Frente do Card</label>
                <input
                  type="text"
                  placeholder="Ex: O que é a Tríade Cognitiva da Depressão?"
                  value={flashcardQuestion}
                  onChange={(e) => setFlashcardQuestion(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Resposta / Verso do Card</label>
                <textarea
                  rows={3}
                  placeholder="Explique a resposta de forma simples e clara..."
                  value={flashcardAnswer}
                  onChange={(e) => setFlashcardAnswer(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  required
                />
              </div>
            </>
          )}

          {activeType === 'concept' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Nome do Conceito de Psicologia</label>
                <input
                  type="text"
                  placeholder="Ex: Pensamentos Automáticos ou Transferência"
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Definição Acadêmica / Pessoal</label>
                <textarea
                  rows={3}
                  placeholder="Escreva a definição com suas palavras..."
                  value={conceptDef}
                  onChange={(e) => setConceptDef(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                />
              </div>
            </>
          )}

          {activeType === 'internship' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Atividade de Estágio Realizada</label>
                <input
                  type="text"
                  placeholder="Ex: Acolhimento na Triagem da Clínica Escola"
                  value={internshipActivity}
                  onChange={(e) => setInternshipActivity(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-[#716A70] mb-1">Horas</label>
                  <input
                    type="number"
                    value={internshipHours}
                    onChange={(e) => setInternshipHours(e.target.value)}
                    className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#716A70] mb-1">Notas da Supervisão</label>
                  <input
                    type="text"
                    placeholder="Orientação da supervisora..."
                    value={internshipNotes}
                    onChange={(e) => setInternshipNotes(e.target.value)}
                    className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8AFC0]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1E9E6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-[#6F6568] hover:bg-[#FAF7F2] transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-[#EA718F] hover:bg-[#D85B78] text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Registro</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
