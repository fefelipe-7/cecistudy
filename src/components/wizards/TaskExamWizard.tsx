import React, { useMemo, useState } from 'react';
import { ClipboardList, CheckCircle2, Sparkles, CalendarPlus2 } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { Task, Exam, ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { TOAST } from '../../lib/copy';
import { createTaskCalendarEvent, createExamCalendarEvent } from '../../lib/calendar';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { Toggle } from '../ui/Toggle';
import {
  DateField,
  DateInput,
  Field,
  ReviewCard,
  TextInput,
} from './wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { Picker } from '../ui/Picker';
import { TagField } from '../ui/TagField';

interface TaskExamWizardProps {
  /** Quando definido, pula a escolha entre tarefa e prova (vindo do picker). */
  preset?: 'task' | 'exam';
  /** Quando presente, hidrata o formulário para editar um item existente. */
  editing?: ManagedItem | null;
}

const TASK_CATEGORIES: { value: Task['category']; label: string; emoji?: string }[] = [
  { value: 'leitura', label: 'leitura', emoji: '📚' },
  { value: 'trabalho', label: 'trabalho', emoji: '📝' },
  { value: 'revisao', label: 'revisão', emoji: '🧠' },
  { value: 'estagio', label: 'estágio', emoji: '🩺' },
  { value: 'outro', label: 'outro', emoji: '✨' },
];

const PRIORITIES: { value: Task['priority']; label: string; emoji?: string }[] = [
  { value: 'baixa', label: 'baixa', emoji: '🌱' },
  { value: 'media', label: 'média', emoji: '⚖️' },
  { value: 'alta', label: 'alta', emoji: '🔥' },
];

const today = () => new Date().toISOString().split('T')[0];

export const TaskExamWizard: React.FC<TaskExamWizardProps> = ({ preset, editing }) => {
  const {
    courses,
    tasks,
    exams,
    wizardCourseId,
    handleAddTask,
    handleAddExam,
    handleUpdateTask,
    handleUpdateExam,
    closeWizard,
    openEditCourse,
    showToast,
  } = useMobileApp();
  const editingTask = editing?.kind === 'task' ? tasks.find((t) => t.id === editing.id) : undefined;
  const editingExam = editing?.kind === 'exam' ? exams.find((e) => e.id === editing.id) : undefined;
  const initialKind: 'task' | 'exam' | null =
    editing?.kind === 'task' ? 'task' : editing?.kind === 'exam' ? 'exam' : preset ?? null;
  const [kind, setKind] = useState<'task' | 'exam' | null>(initialKind);
  const [step, setStep] = useState(0);
  const [courseId, setCourseId] = useState(
    editingTask?.disciplineId ?? editingExam?.courseId ?? (wizardCourseId || courses[0]?.id || '')
  );

  // tarefa
  const [taskTitle, setTaskTitle] = useState(editingTask?.title ?? '');
  const [taskCategory, setTaskCategory] = useState<Task['category']>(editingTask?.category ?? 'leitura');
  const [taskDueDate, setTaskDueDate] = useState(editingTask?.dueDate ?? '');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>(editingTask?.priority ?? 'media');
  const [addToAgenda, setAddToAgenda] = useState(false);

  // prova
  const [examTitle, setExamTitle] = useState(editingExam?.title ?? '');
  const [examDate, setExamDate] = useState(editingExam?.date ?? '');
  const [examWeight, setExamWeight] = useState(editingExam?.weight ?? '1,0');
  const [examTopics, setExamTopics] = useState<string[]>(editingExam?.topics ?? []);

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  /** Criação contextual de matéria (§4.1): abre o cadastro e avisa que ela aparece aqui ao voltar. */
  const createCourseInline = () => {
    showToast(TOAST.courseRegistered);
    openEditCourse();
  };

  /** Toggle de agenda agora vive na revisão (§5.3): opção posterior, não etapa para todos. */
  const agendaRow = (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ceci-border-default bg-surface-default px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ceci-primary">marcar no Google Agenda</p>
        <p className="text-[11px] text-ceci-secondary">opcional — só se fizer sentido</p>
      </div>
      <Toggle
        checked={addToAgenda}
        onChange={() => setAddToAgenda((prev) => !prev)}
        label="adicionar ao Google Agenda"
      />
    </div>
  );

  const choiceStep: WizardStep = {
    id: 'tipo',
    title: 'tipo',
    headline: 'o que você quer registrar agora?',
    subtitle: 'tarefa é um compromisso com prazo; prova é avaliação que vale nota, com data e peso.',
    content: (
      <div className="space-y-3">
        <button
          onClick={() => {
            setKind('task');
            setStep(0);
          }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-surface-default border-2 border-ceci-border-default hover:border-ceci-border-brand text-left transition active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <span className="w-12 h-12 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </span>
          <span>
            <span className="block font-display font-bold text-base text-ceci-primary">tarefa</span>
            <span className="block text-xs text-ceci-secondary mt-0.5 leading-snug">
              um compromisso, prazo ou atividade para fazer
            </span>
          </span>
        </button>
        <button
          onClick={() => {
            setKind('exam');
            setStep(0);
          }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-surface-default border-2 border-ceci-border-default hover:border-ceci-border-academic text-left transition active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <span className="w-12 h-12 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong shrink-0">
            <ClipboardList className="w-6 h-6" />
          </span>
          <span>
            <span className="block font-display font-bold text-base text-ceci-primary">
              prova / avaliação pontuada
            </span>
            <span className="block text-xs text-ceci-secondary mt-0.5 leading-snug">
              avaliação que vale nota, com data e peso
            </span>
          </span>
        </button>
      </div>
    ),
  };

  const taskSteps: WizardStep[] = [
    {
      id: 'tarefa-titulo',
      title: 'tarefa',
      headline: 'o que você precisa fazer?',
      subtitle: 'anota numa frase — disciplina, prazo e foco vêm nos próximos passos, e tudo pode ficar vazio ♡',
      content: (
        <div className="space-y-2">
          <TextInput
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="ex: ler capítulo 4 de psicopatologia"
            autoFocus
          />
        </div>
      ),
    },
    {
      id: 'tarefa-categoria',
      title: 'categoria & foco',
      headline: 'como essa tarefa se encaixa no seu dia?',
      subtitle: 'a categoria organiza o plano e a prioridade mostra onde começar.',
      content: (
        <div className="space-y-5">
          <ChoiceCardGrid
            label="categoria"
            options={TASK_CATEGORIES}
            value={taskCategory}
            onChange={(v) => setTaskCategory(v)}
          />
          <ChoiceCardGrid
            label="prioridade"
            options={PRIORITIES}
            value={taskPriority}
            onChange={(v) => setTaskPriority(v)}
          />
        </div>
      ),
    },
    {
      id: 'tarefa-prazo',
      title: 'disciplina & prazo',
      headline: 'qual disciplina e quando precisa estar pronta?',
      subtitle: 'a disciplina conecta a tarefa ao cantinho; sem prazo também é um estado válido ♡',
      content: (
        <div className="space-y-4">
          <Picker
            label="disciplina"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
            createLabel="criar matéria agora"
            onCreate={createCourseInline}
          />
          <DateField
            label="data limite (prazo)"
            value={taskDueDate}
            onChange={setTaskDueDate}
            placeholder="sem prazo é um estado válido ♡"
          />
        </div>
      ),
    },
    {
      id: 'tarefa-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      subtitle: 'se algo estiver fora, é só voltar e ajustar antes de guardar.',
      content: (
        <div className="space-y-3">
          <ReviewCard
            rows={[
              { label: 'tarefa', value: taskTitle.trim() },
              { label: 'categoria', value: taskCategory },
              { label: 'disciplina', value: courseName },
              { label: 'prazo', value: taskDueDate ? new Date(taskDueDate).toLocaleDateString('pt-BR') : 'sem prazo definido' },
              { label: 'prioridade', value: taskPriority },
            ]}
          />
          {!editing && agendaRow}
        </div>
      ),
    },
  ];

  const examSteps: WizardStep[] = [
    {
      id: 'prova-titulo',
      title: 'prova',
      headline: 'vamos começar com o básico da avaliação.',
      subtitle: 'título e data da prova — disciplina e peso vêm no próximo passo.',
      content: (
        <div className="space-y-4">
          <Field label="título da prova" hint="como essa avaliação aparece no seu plano — ex: prova teórica ii">
            <TextInput
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="ex: prova teórica ii — transtornos de ansiedade"
              autoFocus
            />
          </Field>
          <Field label="data da prova" hint="se ainda não souber, pode confirmar depois — sem data também vale ♡">
            <DateInput value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </Field>
        </div>
      ),
    },
    {
      id: 'prova-contexto',
      title: 'disciplina & peso',
      headline: 'qual disciplina e quanto vale?',
      subtitle: 'a disciplina conecta a prova ao cantinho; o peso mostra quanto ela vale na nota final.',
      content: (
        <div className="space-y-4">
          <Picker
            label="disciplina"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
            createLabel="criar matéria agora"
            onCreate={createCourseInline}
          />
          <Field label="peso" hint="ex: 40% da nota, 1,0 ou 10 pontos — como fizer mais sentido.">
            <TextInput
              value={examWeight}
              onChange={(e) => setExamWeight(e.target.value)}
              placeholder="ex: 40% da nota"
            />
          </Field>
        </div>
      ),
    },
    {
      id: 'prova-topicos',
      title: 'tópicos',
      headline: 'o que vai cair nessa prova?',
      subtitle: 'lista os assuntos para preparar a revisão — pode deixar vazio e completar depois ♡',
      content: (
        <TagField
          tags={examTopics}
          onChange={setExamTopics}
          placeholder="ex: pensamentos automáticos"
          emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
        />
      ),
    },
    {
      id: 'prova-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      subtitle: 'revisa os dados e, se quiser, marca a prova no Google Agenda.',
      content: (
        <div className="space-y-3">
          <ReviewCard
            rows={[
              { label: 'prova', value: examTitle.trim() },
              { label: 'disciplina', value: courseName },
              { label: 'data', value: examDate ? new Date(examDate).toLocaleDateString('pt-BR') : 'a confirmar' },
              { label: 'peso', value: examWeight.trim() || '1,0' },
              { label: 'tópicos', value: examTopics.length ? examTopics.join(' · ') : 'ainda sem tópicos' },
            ]}
          />
          {!editing && agendaRow}
        </div>
      ),
    },
  ];

  const steps = kind === null ? [choiceStep] : kind === 'task' ? taskSteps : examSteps;
  const stepsForEdit = editing ? steps.filter((s) => s.id !== 'agenda') : steps;

  const canNext =
    kind === null
      ? false
      : kind === 'task'
        ? taskTitle.trim().length > 0
        : examTitle.trim().length > 0;
  const blockedReason =
    kind === null
      ? undefined
      : kind === 'task'
        ? 'preencha o título da tarefa para continuar'
        : 'preencha o título da prova para continuar';

  const handleSave = async () => {
    if (editingTask && kind === 'task') {
      handleUpdateTask(editingTask.id, {
        title: taskTitle.trim(),
        disciplineId: courseId,
        category: taskCategory,
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
      });
      hapticSuccess();
      closeWizard();
      showToast('tarefa atualizada ♡');
      return;
    }
    if (editingExam && kind === 'exam') {
      handleUpdateExam({
        ...editingExam,
        courseId: courseId || editingExam.courseId,
        title: examTitle.trim(),
        date: examDate || undefined,
        weight: examWeight.trim() || '1,0',
        topics: examTopics,
      });
      hapticSuccess();
      closeWizard();
      showToast('prova atualizada ♡');
      return;
    }
    if (kind === 'task') {
      handleAddTask({
        id: 't-' + Date.now(),
        title: taskTitle.trim(),
        disciplineId: courseId,
        category: taskCategory,
        dueDate: taskDueDate || undefined,
        completed: false,
        priority: taskPriority,
      });
      if (addToAgenda && taskDueDate) {
        const ok = await createTaskCalendarEvent(taskTitle.trim(), courseName, taskDueDate);
        if (ok) {
          showToast('tarefa salva e marcada na sua agenda ♡');
        } else {
          showToast('tarefa salva no app — não consegui marcar na agenda ♡');
        }
        hapticSuccess();
        closeWizard();
        return;
      }
    } else {
      handleAddExam({
        id: 'e-' + Date.now(),
        courseId: courseId || 'c1',
        title: examTitle.trim(),
        date: examDate || today(),
        weight: examWeight.trim() || '1,0',
        topics: examTopics,
        completed: false,
      });
      if (addToAgenda) {
        const ok = await createExamCalendarEvent(examTitle.trim(), courseName, examDate || today());
        if (ok) {
          showToast('prova salva e marcada na sua agenda ♡');
        } else {
          showToast('prova salva no app — não consegui marcar na agenda ♡');
        }
        hapticSuccess();
        closeWizard();
        return;
      }
    }
    hapticSuccess();
    closeWizard();
    showToast(kind === 'task' ? 'tarefa guardada no plano ♡' : 'prova anotada no cantinho ♡');
  };

  return (
    <WizardScaffold
      steps={stepsForEdit}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      blockedReason={blockedReason}
      hideNext={kind === null}
      onSave={handleSave}
      onClose={closeWizard}
      title={
        editing
          ? kind === 'exam'
            ? 'editar prova'
            : 'editar tarefa'
          : kind === null
            ? 'novo registro'
            : kind === 'exam'
              ? 'nova prova / avaliação'
              : 'nova tarefa'
      }
      subtitle={kind === null ? 'prova ou atividade?' : undefined}
      icon={
        kind === 'exam' ? (
          <ClipboardList className="w-3.5 h-3.5" />
        ) : kind === 'task' ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )
      }
      iconClass={
        kind === 'exam'
          ? 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong'
          : 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
      }
      saveLabel={editing ? 'guardar alterações ♡' : kind === 'task' ? 'guardar tarefa ♡' : 'guardar prova ♡'}
    />
  );
};
