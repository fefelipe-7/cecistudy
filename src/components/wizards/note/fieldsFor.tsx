// Registry dos campos por destino do "transformar nota" (MOD-001 / Fase 2).
// Cada destino (`NoteTargetType`) declara: passo de formulário, linhas de
// revisão e regra de validade — o `NoteTransformWizard` só monta os passos
// (`formStep`/`reviewStep`) a partir daqui, sem switch gigante.
import type { ReactNode } from 'react';
import type {
  ClassNote,
  Course,
  Exam,
  Flashcard,
  InternshipLog,
  InternshipLogType,
  LooseNote,
  MaterialItem,
  NoteTargetType,
  PsychologyApproach,
  PsychologyAuthor,
  PsychologyConcept,
  StudySession,
  Task,
} from '../../../types';
import { buildClassNoteFromNote, noteFirstLine } from '../../../lib/noteLogic';
import { initCard } from '../../../lib/fsrs';
import { today, truncate } from './constants';
import ClassForm from './ClassForm';
import TaskForm from './TaskForm';
import ExamForm from './ExamForm';
import FlashcardForm from './FlashcardForm';
import SessionForm from './SessionForm';
import InternshipForm from './InternshipForm';
import ConceptForm from './ConceptForm';
import AuthorForm from './AuthorForm';
import MaterialForm from './MaterialForm';

/** Todos os campos editáveis do transformar-nota num objeto só. */
export interface TransformValues {
  title: string;
  courseId: string;
  content: string;
  // aula
  classNumber: number;
  classDate: string;
  // tarefa
  taskCategory: Task['category'];
  priority: Task['priority'];
  dueDate: string;
  // prova
  examDate: string;
  examWeight: string;
  topics: string[];
  // flashcard
  question: string;
  answer: string;
  conceptId: string;
  // sessão
  sessionTopic: string;
  sessionDate: string;
  duration: number;
  // estágio
  activity: string;
  internshipType: InternshipLogType;
  internshipDate: string;
  hours: number;
  reflections: string;
  // conceito
  conceptName: string;
  definition: string;
  approachId: string;
  authorIds: string[];
  courseIds: string[];
  tags: string[];
  // autor
  authorName: string;
  bio: string;
  keyConcepts: string[];
  majorWorks: string[];
  // material
  materialTitle: string;
  materialAuthor: string;
  materialType: MaterialItem['type'];
  url: string;
  materialTags: string[];
}

/** Leituras externas que os campos precisam (listas + seletores prontos). */
export interface TransformLookups {
  courseSelect: ReactNode;
  courseName: string;
  conceptOptions: { value: string; label: string }[];
  resolveIds: (ids: string[]) => string[];
  approaches: PsychologyApproach[];
  authors: PsychologyAuthor[];
  courses: Course[];
  concepts: PsychologyConcept[];
}

export interface TransformContext {
  v: TransformValues;
  patch: (p: Partial<TransformValues>) => void;
  lookups: TransformLookups;
}

export interface TargetFieldConfig {
  stepId: string;
  headline: string;
  subtitle: string;
  render: (ctx: TransformContext) => ReactNode;
  review: (ctx: TransformContext) => { label: string; value: string }[];
  valid: (v: TransformValues) => boolean;
  /**
   * Constrói o rascunho da nova entidade a partir dos valores e persiste via
   * actions (o "draftFor" da Fase 3). Retorna a navegação pós-save para a tela
   * final "abrir item criado" — o wizard apaga a nota, celebra e mostra o
   * `created`, sem switch.
   */
  save: (ctx: TransformSaveContext) => { onOpen?: () => void };
}

/** Handlers de persistência + navegação que o `save` de cada destino usa. */
export interface TransformSaveActions {
  addClassNote: (note: ClassNote) => void;
  addTask: (task: Task) => void;
  addExam: (exam: Exam) => void;
  addFlashcard: (card: Flashcard) => void;
  addSession: (session: StudySession) => void;
  addInternshipLog: (log: InternshipLog) => void;
  addConcept: (concept: PsychologyConcept) => void;
  addAuthor: (author: PsychologyAuthor) => void;
  addMaterial: (material: MaterialItem) => void;
  openComposeDetails: (id: string) => void;
  gotoTab: (tab: 'faculdade' | 'home') => void;
}

export interface TransformSaveContext {
  v: TransformValues;
  note: LooseNote;
  actions: TransformSaveActions;
}

/**
 * Valores iniciais ao abrir o transformar-nota para uma nota: pré-preenche
 * cada destino a partir do título/conteúdo/vínculos (pura e testável).
 */
export function hydrateTransform(
  focusedNote: LooseNote,
  courses: Course[],
  classes: ClassNote[]
): TransformValues {
  const course = focusedNote.courseId || courses[0]?.id || '';
  const t = focusedNote.title;
  const c = focusedNote.content;
  const fallback = t || noteFirstLine(c);

  const nextNums = classes
    .filter((cl) => cl.courseId === course)
    .map((cl) => cl.number || 0);

  return {
    title: t,
    courseId: course,
    content: c,
    classNumber: (nextNums.length ? Math.max(...nextNums) : 0) + 1,
    classDate: '',
    taskCategory: 'leitura',
    priority: 'media',
    dueDate: '',
    examDate: '',
    examWeight: '1,0',
    topics: [],
    question: fallback,
    answer: c,
    conceptId: focusedNote.conceptIds?.[0] ?? '',
    sessionTopic: fallback,
    sessionDate: '',
    duration: 30,
    activity: fallback,
    internshipType: 'estagio',
    internshipDate: '',
    hours: 1,
    reflections: c,
    conceptName: fallback,
    definition: c,
    approachId: focusedNote.approachIds?.[0] ?? '',
    authorIds: focusedNote.authorIds ?? [],
    courseIds: focusedNote.courseId ? [focusedNote.courseId] : [],
    tags: [],
    authorName: fallback,
    bio: c,
    keyConcepts: [],
    majorWorks: [],
    materialTitle: fallback,
    materialAuthor: '',
    materialType: 'artigo',
    url: '',
    materialTags: [],
  };
}

export const FIELDS_FOR: Record<NoteTargetType, TargetFieldConfig> = {
  class: {
    stepId: 'aula',
    headline: 'como essa aula fica registrada?',
    subtitle: 'título da aula e data — o conteúdo da nota vai junto para o diário.',
    render: ({ v, patch, lookups }) => (
      <ClassForm
        value={v.title}
        onChange={(s) => patch({ title: s })}
        courseSelect={lookups.courseSelect}
        classNumber={v.classNumber}
        onClassNumberChange={(n) => patch({ classNumber: n })}
        classDate={v.classDate}
        onClassDateChange={(d) => patch({ classDate: d })}
      />
    ),
    review: ({ v, lookups }) => [
      { label: 'aula', value: v.title.trim() },
      { label: 'disciplina', value: lookups.courseName },
      { label: 'número', value: String(v.classNumber || 1) },
      { label: 'conteúdo', value: truncate(v.content.trim()) },
    ],
    valid: (v) => v.title.trim().length > 0 || v.content.trim().length > 0,
    save: ({ v, note, actions }) => {
      const cn = buildClassNoteFromNote(note, {
        title: v.title,
        courseId: v.courseId,
        number: v.classNumber || 1,
      });
      const withDate = { ...cn, date: v.classDate || today() };
      actions.addClassNote(withDate);
      return { onOpen: () => actions.openComposeDetails(withDate.id) };
    },
  },
  task: {
    stepId: 'tarefa',
    headline: 'o que você precisa fazer?',
    subtitle: 'em que a tarefa se torna: título, categoria e o prazo para entregar.',
    render: ({ v, patch, lookups }) => (
      <TaskForm
        value={v.title}
        onChange={(s) => patch({ title: s })}
        category={v.taskCategory}
        onCategoryChange={(c) => patch({ taskCategory: c })}
        priority={v.priority}
        onPriorityChange={(p) => patch({ priority: p })}
        courseSelect={lookups.courseSelect}
        dueDate={v.dueDate}
        onDueDateChange={(d) => patch({ dueDate: d })}
      />
    ),
    review: ({ v, lookups }) => [
      { label: 'tarefa', value: v.title.trim() },
      { label: 'categoria', value: v.taskCategory },
      { label: 'prioridade', value: v.priority },
      { label: 'disciplina', value: lookups.courseName },
      { label: 'prazo', value: v.dueDate ? new Date(v.dueDate).toLocaleDateString('pt-BR') : 'sem prazo' },
    ],
    valid: (v) => v.title.trim().length > 0,
    save: ({ v, actions }) => {
      actions.addTask({
        id: 't-' + Date.now(),
        title: v.title.trim(),
        disciplineId: v.courseId || undefined,
        category: v.taskCategory,
        dueDate: v.dueDate || undefined,
        completed: false,
        priority: v.priority,
      });
      return { onOpen: () => setTimeout(() => actions.gotoTab(v.courseId ? 'faculdade' : 'home'), 50) };
    },
  },
  exam: {
    stepId: 'prova',
    headline: 'vamos registrar essa avaliação.',
    subtitle: 'título, disciplina, data e peso da avaliação que vale nota.',
    render: ({ v, patch, lookups }) => (
      <ExamForm
        value={v.title}
        onChange={(s) => patch({ title: s })}
        courseSelect={lookups.courseSelect}
        date={v.examDate}
        onDateChange={(d) => patch({ examDate: d })}
        weight={v.examWeight}
        onWeightChange={(w) => patch({ examWeight: w })}
        topics={v.topics}
        onTopicsChange={(t) => patch({ topics: t })}
      />
    ),
    review: ({ v, lookups }) => [
      { label: 'prova', value: v.title.trim() },
      { label: 'disciplina', value: lookups.courseName },
      { label: 'data', value: v.examDate ? new Date(v.examDate).toLocaleDateString('pt-BR') : 'a confirmar' },
      { label: 'peso', value: v.examWeight.trim() || '1,0' },
      { label: 'tópicos', value: v.topics.length ? v.topics.join(' · ') : 'sem tópicos' },
    ],
    valid: (v) => v.title.trim().length > 0,
    save: ({ v, actions }) => {
      actions.addExam({
        id: 'e-' + Date.now(),
        courseId: v.courseId,
        title: v.title.trim(),
        date: v.examDate,
        weight: v.examWeight.trim() || '1,0',
        topics: v.topics,
        completed: false,
      });
      return {};
    },
  },
  flashcard: {
    stepId: 'flashcard',
    headline: 'pergunta & resposta de estudo.',
    subtitle: 'a pergunta fica na frente do card; o conteúdo da sua nota vira a resposta.',
    render: ({ v, patch, lookups }) => (
      <FlashcardForm
        question={v.question}
        onQuestionChange={(s) => patch({ question: s })}
        answer={v.answer}
        onAnswerChange={(s) => patch({ answer: s })}
        courseSelect={lookups.courseSelect}
        conceptId={v.conceptId}
        onConceptIdChange={(id) => patch({ conceptId: lookups.resolveIds([id])[0] })}
        conceptOptions={lookups.conceptOptions}
      />
    ),
    review: ({ v, lookups }) => [
      { label: 'pergunta', value: v.question.trim() },
      { label: 'resposta', value: truncate(v.answer.trim(), 120) },
      { label: 'disciplina', value: lookups.courseName },
      { label: 'conceito', value: lookups.concepts.find((x) => x.id === v.conceptId)?.name ?? 'sem conceito' },
    ],
    valid: (v) => v.question.trim().length > 0,
    save: ({ v, note, actions }) => {
      actions.addFlashcard(
        initCard({
          conceptId: v.conceptId || undefined,
          courseId: v.courseId || undefined,
          question: v.question.trim(),
          answer: v.answer.trim() || v.content,
        })
      );
      return {};
    },
  },
  session: {
    stepId: 'sessão',
    headline: 'como ficou essa sessão de foco?',
    subtitle: 'tópico, data e duração para registrar no histórico de foco.',
    render: ({ v, patch, lookups }) => (
      <SessionForm
        topic={v.sessionTopic}
        onTopicChange={(s) => patch({ sessionTopic: s })}
        courseSelect={lookups.courseSelect}
        date={v.sessionDate}
        onDateChange={(d) => patch({ sessionDate: d })}
        duration={v.duration}
        onDurationChange={(n) => patch({ duration: n })}
      />
    ),
    review: ({ v, lookups }) => [
      { label: 'tópico', value: v.sessionTopic.trim() },
      { label: 'disciplina', value: lookups.courseName },
      { label: 'data', value: v.sessionDate ? new Date(v.sessionDate).toLocaleDateString('pt-BR') : 'hoje' },
      { label: 'duração', value: `${v.duration || 0} min` },
    ],
    valid: (v) => v.sessionTopic.trim().length > 0,
    save: ({ v, actions }) => {
      actions.addSession({
        id: 'ss-' + Date.now(),
        courseId: v.courseId || undefined,
        topic: v.sessionTopic.trim(),
        date: v.sessionDate || today(),
        durationMinutes: Math.max(1, v.duration || 1),
        notes: v.content.trim() || undefined,
      });
      return {};
    },
  },
  internship: {
    stepId: 'estágio',
    headline: 'registro do campo de estágio.',
    subtitle: 'o que aconteceu no campo — atividade, tipo, data e horas.',
    render: ({ v, patch }) => (
      <InternshipForm
        activity={v.activity}
        onActivityChange={(s) => patch({ activity: s })}
        type={v.internshipType}
        onTypeChange={(t) => patch({ internshipType: t })}
        date={v.internshipDate}
        onDateChange={(d) => patch({ internshipDate: d })}
        hours={v.hours}
        onHoursChange={(n) => patch({ hours: n })}
        reflections={v.reflections}
        onReflectionsChange={(s) => patch({ reflections: s })}
      />
    ),
    review: ({ v }) => [
      { label: 'atividade', value: v.activity.trim() },
      { label: 'tipo', value: v.internshipType.replace('_', ' ') },
      { label: 'data', value: v.internshipDate ? new Date(v.internshipDate).toLocaleDateString('pt-BR') : 'hoje' },
      { label: 'horas', value: `${v.hours || 0}h` },
      { label: 'reflexões', value: truncate(v.reflections.trim()) },
    ],
    valid: (v) => v.activity.trim().length > 0,
    save: ({ v, note, actions }) => {
      actions.addInternshipLog({
        id: 'ilog-' + Date.now(),
        type: v.internshipType,
        date: v.internshipDate || today(),
        hours: Math.max(0, v.hours || 0),
        activity: v.activity.trim(),
        reflections: v.reflections.trim() || v.content,
        conceptIds: note.conceptIds,
      });
      return {};
    },
  },
  concept: {
    stepId: 'conceito',
    headline: 'que conceito nasce daqui?',
    subtitle: 'nome e definição do conceito — vínculos com autores e disciplinas são opcionais ♡',
    render: ({ v, patch, lookups }) => (
      <ConceptForm
        name={v.conceptName}
        onNameChange={(s) => patch({ conceptName: s })}
        definition={v.definition}
        onDefinitionChange={(s) => patch({ definition: s })}
        approaches={lookups.approaches}
        approachId={v.approachId}
        onApproachIdChange={(id) => patch({ approachId: id })}
        authors={lookups.authors}
        authorIds={v.authorIds}
        onAuthorIdsChange={(ids) => patch({ authorIds: ids })}
        courses={lookups.courses}
        courseIds={v.courseIds}
        onCourseIdsChange={(ids) => patch({ courseIds: ids })}
        tags={v.tags}
        onTagsChange={(t) => patch({ tags: t })}
      />
    ),
    review: ({ v, lookups }) => [
      { label: 'conceito', value: v.conceptName.trim() },
      { label: 'definição', value: truncate(v.definition.trim()) },
      { label: 'abordagem', value: lookups.approaches.find((x) => x.id === v.approachId)?.shortName ?? 'sem abordagem' },
      { label: 'autores', value: lookups.authors.filter((x) => v.authorIds.includes(x.id)).map((x) => x.name).join(' · ') },
      { label: 'disciplinas', value: lookups.courses.filter((x) => v.courseIds.includes(x.id)).map((x) => x.name).join(' · ') },
      { label: 'tags', value: v.tags.join(' · ') },
    ],
    valid: (v) => v.conceptName.trim().length > 0,
    save: ({ v, actions }) => {
      actions.addConcept({
        id: 'con-' + Date.now(),
        name: v.conceptName.trim(),
        definition: v.definition.trim() || v.content,
        approachId: v.approachId || undefined,
        authorIds: v.authorIds,
        courseIds: v.courseIds,
        tags: v.tags,
      });
      return {};
    },
  },
  author: {
    stepId: 'autor',
    headline: 'quem é esse autor pra você?',
    subtitle: 'nome + uma nota do porquê lembrar dele(a) — o resto fica para depois.',
    render: ({ v, patch, lookups }) => (
      <AuthorForm
        name={v.authorName}
        onNameChange={(s) => patch({ authorName: s })}
        bio={v.bio}
        onBioChange={(s) => patch({ bio: s })}
        approaches={lookups.approaches}
        approachId={v.approachId}
        onApproachIdChange={(id) => patch({ approachId: id })}
        keyConcepts={v.keyConcepts}
        onKeyConceptsChange={(t) => patch({ keyConcepts: t })}
        majorWorks={v.majorWorks}
        onMajorWorksChange={(t) => patch({ majorWorks: t })}
      />
    ),
    review: ({ v, lookups }) => [
      { label: 'autor', value: v.authorName.trim() },
      { label: 'bio', value: truncate(v.bio.trim()) },
      { label: 'abordagem', value: lookups.approaches.find((x) => x.id === v.approachId)?.shortName ?? 'sem abordagem' },
      { label: 'conceitos-chave', value: v.keyConcepts.join(' · ') },
      { label: 'obras', value: v.majorWorks.join(' · ') },
    ],
    valid: (v) => v.authorName.trim().length > 0,
    save: ({ v, actions }) => {
      actions.addAuthor({
        id: 'aut-' + Date.now(),
        name: v.authorName.trim(),
        bio: v.bio.trim() || v.content,
        approachId: v.approachId || undefined,
        keyConcepts: v.keyConcepts,
        majorWorks: v.majorWorks,
      });
      return {};
    },
  },
  material: {
    stepId: 'material',
    headline: 'que material você quer guardar?',
    subtitle: 'título, tipo e de quem é o material — para achar fácil depois.',
    render: ({ v, patch, lookups }) => (
      <MaterialForm
        title={v.materialTitle}
        onTitleChange={(s) => patch({ materialTitle: s })}
        type={v.materialType}
        onTypeChange={(t) => patch({ materialType: t })}
        author={v.materialAuthor}
        onAuthorChange={(s) => patch({ materialAuthor: s })}
        courseSelect={lookups.courseSelect}
        url={v.url}
        onUrlChange={(s) => patch({ url: s })}
        tags={v.materialTags}
        onTagsChange={(t) => patch({ materialTags: t })}
      />
    ),
    review: ({ v, lookups }) => [
      { label: 'material', value: v.materialTitle.trim() },
      { label: 'tipo', value: v.materialType },
      { label: 'autor', value: v.materialAuthor.trim() || '—' },
      { label: 'disciplina', value: lookups.courseName },
      { label: 'link', value: v.url.trim() || '—' },
      { label: 'tags', value: v.materialTags.join(' · ') },
    ],
    valid: (v) => v.materialTitle.trim().length > 0,
    save: ({ v, actions }) => {
      actions.addMaterial({
        id: 'm-' + Date.now(),
        title: v.materialTitle.trim(),
        type: v.materialType,
        author: v.materialAuthor.trim() || '—',
        courseId: v.courseId || undefined,
        url: v.url.trim() || undefined,
        tags: v.materialTags,
        addedAt: new Date().toISOString(),
      });
      return {};
    },
  },
};
