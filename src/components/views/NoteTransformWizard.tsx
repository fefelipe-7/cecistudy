import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  ClipboardList,
  Brain,
  Timer,
  HeartHandshake,
  Sparkles,
  UserCheck,
  BookOpen,
  Wand2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type {
  NoteTargetType,
  LooseNote,
  Task,
  InternshipLogType,
  MaterialItem,
} from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { buildClassNoteFromNote, noteFirstLine } from '../../lib/noteLogic';
import { WizardScaffold, type WizardStep } from '../wizards/WizardScaffold';
import {
  DateInput,
  FieldLabel,
  ReviewCard,
  TextArea,
  TextInput,
} from '../wizards/wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { PillGroupMulti } from '../ui/PillGroupMulti';
import { Picker } from '../ui/Picker';
import { TagField } from '../ui/TagField';

type IconType = React.ComponentType<{ className?: string }>;

const TARGETS: { type: NoteTargetType; label: string; caption: string; Icon: IconType; accent: string }[] = [
  { type: 'class', label: 'aula', caption: 'anotação de aula no diário', Icon: FileText, accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong' },
  { type: 'task', label: 'tarefa', caption: 'prazo ou atividade', Icon: CheckCircle2, accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong' },
  { type: 'exam', label: 'prova / avaliação', caption: 'avaliação que vale nota', Icon: ClipboardList, accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong' },
  { type: 'flashcard', label: 'flashcard', caption: 'pergunta & resposta', Icon: Brain, accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong' },
  { type: 'session', label: 'sessão de estudo', caption: 'foco no cantinho', Icon: Timer, accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong' },
  { type: 'internship', label: 'estágio', caption: 'registro de campo', Icon: HeartHandshake, accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong' },
  { type: 'concept', label: 'conceito', caption: 'conceito psicológico', Icon: Sparkles, accent: 'bg-amber-bg border-amber-border text-amber-text' },
  { type: 'author', label: 'autor', caption: 'estudado na jornada', Icon: UserCheck, accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong' },
  { type: 'material', label: 'material', caption: 'livro, artigo ou link', Icon: BookOpen, accent: 'bg-surface-muted border-ceci-border-default text-ceci-secondary' },
];

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

const INTERNSHIP_TYPES: { value: InternshipLogType; label: string; emoji?: string }[] = [
  { value: 'estagio', label: 'estágio', emoji: '🏫' },
  { value: 'atendimento_clinico', label: 'atendimento clínico', emoji: '🛋️' },
  { value: 'supervisao', label: 'supervisão', emoji: '🧑‍🏫' },
  { value: 'intervisao', label: 'intervisão', emoji: '👥' },
  { value: 'outro', label: 'outro', emoji: '✨' },
];

const MATERIAL_TYPES: { value: MaterialItem['type']; label: string; emoji?: string }[] = [
  { value: 'artigo', label: 'artigo', emoji: '📄' },
  { value: 'livro', label: 'livro', emoji: '📖' },
  { value: 'pdf', label: 'pdf', emoji: '📎' },
  { value: 'link', label: 'link', emoji: '🔗' },
  { value: 'slides', label: 'slides', emoji: '📽️' },
];

const today = () => new Date().toISOString().split('T')[0];

const truncate = (s: string, max = 80) => (s.length > max ? `${s.slice(0, max)}…` : s);

export const NoteTransformWizard: React.FC = () => {
  const {
    focusedNote,
    courses,
    concepts,
    authors,
    approaches,
    materials,
    classes,
    handleAddClassNote,
    handleAddTask,
    handleAddExam,
    handleAddFlashcard,
    handleAddSession,
    handleAddInternshipLog,
    handleAddConcept,
    handleAddAuthor,
    handleAddMaterial,
    deleteLooseNote,
    closeAllNoteScreens,
    openComposeDetails,
    showToast,
  } = useApp();

  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<NoteTargetType | null>(null);

  // ---- campos compartilhados (preenchidos a partir da nota) ----
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [content, setContent] = useState('');

  // aula
  const [classNumber, setClassNumber] = useState(1);
  const [classDate, setClassDate] = useState('');

  // tarefa
  const [taskCategory, setTaskCategory] = useState<Task['category']>('leitura');
  const [priority, setPriority] = useState<Task['priority']>('media');
  const [dueDate, setDueDate] = useState('');

  // prova
  const [examDate, setExamDate] = useState('');
  const [examWeight, setExamWeight] = useState('1,0');
  const [topics, setTopics] = useState<string[]>([]);

  // flashcard
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [conceptId, setConceptId] = useState('');

  // sessão
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [duration, setDuration] = useState(30);

  // estágio
  const [activity, setActivity] = useState('');
  const [internshipType, setInternshipType] = useState<InternshipLogType>('estagio');
  const [internshipDate, setInternshipDate] = useState('');
  const [hours, setHours] = useState(1);
  const [reflections, setReflections] = useState('');

  // conceito
  const [conceptName, setConceptName] = useState('');
  const [definition, setDefinition] = useState('');
  const [approachId, setApproachId] = useState('');
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // autor
  const [authorName, setAuthorName] = useState('');
  const [bio, setBio] = useState('');
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [majorWorks, setMajorWorks] = useState<string[]>([]);

  // material
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialAuthor, setMaterialAuthor] = useState('');
  const [materialType, setMaterialType] = useState<MaterialItem['type']>('artigo');
  const [url, setUrl] = useState('');
  const [materialTags, setMaterialTags] = useState<string[]>([]);

  useEffect(() => {
    if (!focusedNote) return;
    const course = focusedNote.courseId || courses[0]?.id || '';
    const t = focusedNote.title;
    const c = focusedNote.content;
    const fallback = t || noteFirstLine(c);

    setTitle(t);
    setCourseId(course);
    setContent(c);

    const nextNums = classes
      .filter((cl) => cl.courseId === course)
      .map((cl) => cl.number || 0);
    setClassNumber((nextNums.length ? Math.max(...nextNums) : 0) + 1);
    setClassDate('');

    setTaskCategory('leitura');
    setPriority('media');
    setDueDate('');

    setExamDate('');
    setExamWeight('1,0');
    setTopics([]);

    setQuestion(fallback);
    setAnswer(c);
    setConceptId(focusedNote.conceptIds?.[0] ?? '');

    setSessionTopic(fallback);
    setSessionDate('');
    setDuration(30);

    setActivity(fallback);
    setInternshipType('estagio');
    setInternshipDate('');
    setHours(1);
    setReflections(c);

    setConceptName(fallback);
    setDefinition(c);
    setApproachId(focusedNote.approachIds?.[0] ?? '');
    setAuthorIds(focusedNote.authorIds ?? []);
    setCourseIds(focusedNote.courseId ? [focusedNote.courseId] : []);
    setTags([]);

    setAuthorName(fallback);
    setBio(c);
    setKeyConcepts([]);
    setMajorWorks([]);

    setMaterialTitle(fallback);
    setMaterialAuthor('');
    setMaterialType('artigo');
    setUrl('');
    setMaterialTags([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, focusedNote]);

  const courseName = useMemo(
    () => courses.find((x) => x.id === courseId)?.name ?? '',
    [courses, courseId]
  );

  if (!focusedNote) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-xs text-ceci-secondary">essa nota não foi encontrada.</p>
        <button
          onClick={closeAllNoteScreens}
          className="px-4 py-2 bg-ceci-primary text-white rounded-full text-xs font-bold cursor-pointer"
        >
          voltar
        </button>
      </div>
    );
  }

  const courseSelect = (
    <Picker
      label="disciplina"
      value={courseId}
      onChange={setCourseId}
      options={courses.map((x) => ({ value: x.id, label: x.name }))}
      placeholder="nenhuma disciplina"
      emptyMessage="ainda não há disciplinas cadastradas."
    />
  );

  const pickerStep: WizardStep = {
    id: 'tipo',
    title: 'transformar em',
    headline: 'em que essa nota vira?',
    content: (
      <div className="space-y-3">
        <p className="text-[11px] text-ceci-tertiary leading-relaxed">
          suas notas são rascunhos transitórios — escolhe para onde essa vai.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {TARGETS.map((opt) => {
            const Icon = opt.Icon;
            return (
              <button
                key={opt.type}
                onClick={() => {
                  setTarget(opt.type);
                  setStep(1);
                }}
                className="w-full flex flex-col items-start gap-2 p-3.5 rounded-[20px] bg-white border border-ceci-border-default hover:border-ceci-border-brand text-left transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                <span className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${opt.accent}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span>
                  <span className="block font-display font-bold text-xs text-ceci-primary leading-tight">
                    {opt.label}
                  </span>
                  <span className="block text-[10px] text-ceci-secondary mt-0.5 leading-snug">
                    {opt.caption}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    ),
  };

  const reviewStep = (rows: { label: string; value: string }[]): WizardStep => ({
    id: 'revisar',
    title: 'revisar',
    headline: 'confere se está tudo certinho ♡',
    content: <ReviewCard rows={rows} />,
  });

  const formStep = (id: string, headline: string, content: React.ReactNode): WizardStep => ({
    id,
    title: 'detalhes',
    headline,
    content,
  });

  const targetSteps = (): WizardStep[] => {
    switch (target) {
      case 'class':
        return [
          formStep(
            'aula',
            'como essa aula fica registrada?',
            <div className="space-y-4">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="título da aula"
                autoFocus
              />
              {courseSelect}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>número da aula</FieldLabel>
                  <TextInput
                    type="number"
                    value={classNumber}
                    onChange={(e) => setClassNumber(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <FieldLabel>data</FieldLabel>
                  <DateInput value={classDate} onChange={(e) => setClassDate(e.target.value)} />
                </div>
              </div>
            </div>
          ),
          reviewStep([
            { label: 'aula', value: title.trim() },
            { label: 'disciplina', value: courseName },
            { label: 'número', value: String(classNumber || 1) },
            { label: 'conteúdo', value: truncate(content.trim()) },
          ]),
        ];
      case 'task':
        return [
          formStep(
            'tarefa',
            'o que você precisa fazer?',
            <div className="space-y-4">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="título da tarefa"
                autoFocus
              />
              <ChoiceCardGrid
                label="categoria"
                options={TASK_CATEGORIES}
                value={taskCategory}
                onChange={(v) => setTaskCategory(v)}
              />
              <ChoiceCardGrid
                label="prioridade"
                options={PRIORITIES}
                value={priority}
                onChange={(v) => setPriority(v)}
              />
              {courseSelect}
              <div>
                <FieldLabel>prazo</FieldLabel>
                <DateInput value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          ),
          reviewStep([
            { label: 'tarefa', value: title.trim() },
            { label: 'categoria', value: taskCategory },
            { label: 'prioridade', value: priority },
            { label: 'disciplina', value: courseName },
            { label: 'prazo', value: dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : 'sem prazo' },
          ]),
        ];
      case 'exam':
        return [
          formStep(
            'prova',
            'vamos registrar essa avaliação.',
            <div className="space-y-4">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="título da prova"
                autoFocus
              />
              {courseSelect}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>data</FieldLabel>
                  <DateInput value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>peso</FieldLabel>
                  <TextInput
                    value={examWeight}
                    onChange={(e) => setExamWeight(e.target.value)}
                    placeholder="ex: 40% da nota"
                  />
                </div>
              </div>
              <TagField
                tags={topics}
                onChange={setTopics}
                placeholder="tópicos da prova (ex: transtornos de ansiedade)"
                emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
              />
            </div>
          ),
          reviewStep([
            { label: 'prova', value: title.trim() },
            { label: 'disciplina', value: courseName },
            { label: 'data', value: examDate ? new Date(examDate).toLocaleDateString('pt-BR') : 'a confirmar' },
            { label: 'peso', value: examWeight.trim() || '1,0' },
            { label: 'tópicos', value: topics.length ? topics.join(' · ') : 'sem tópicos' },
          ]),
        ];
      case 'flashcard':
        return [
          formStep(
            'flashcard',
            'pergunta & resposta de estudo.',
            <div className="space-y-4">
              <TextInput
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="pergunta do cartão"
                autoFocus
              />
              <div>
                <FieldLabel>resposta</FieldLabel>
                <TextArea
                  rows={5}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="resposta (o conteúdo da sua nota)"
                />
              </div>
              {courseSelect}
              <Picker
                label="conceito (opcional)"
                value={conceptId}
                onChange={setConceptId}
                options={concepts.map((x) => ({ value: x.id, label: x.name }))}
                placeholder="sem conceito"
                emptyMessage="ainda não há conceitos no cantinho."
              />
            </div>
          ),
          reviewStep([
            { label: 'pergunta', value: question.trim() },
            { label: 'resposta', value: truncate(answer.trim(), 120) },
            { label: 'disciplina', value: courseName },
            { label: 'conceito', value: concepts.find((x) => x.id === conceptId)?.name ?? 'sem conceito' },
          ]),
        ];
      case 'session':
        return [
          formStep(
            'sessão',
            'como ficou essa sessão de foco?',
            <div className="space-y-4">
              <TextInput
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                placeholder="tópico da sessão"
                autoFocus
              />
              {courseSelect}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>data</FieldLabel>
                  <DateInput value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>duração (min)</FieldLabel>
                  <TextInput
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ),
          reviewStep([
            { label: 'tópico', value: sessionTopic.trim() },
            { label: 'disciplina', value: courseName },
            { label: 'data', value: sessionDate ? new Date(sessionDate).toLocaleDateString('pt-BR') : 'hoje' },
            { label: 'duração', value: `${duration || 0} min` },
          ]),
        ];
      case 'internship':
        return [
          formStep(
            'estágio',
            'registro do campo de estágio.',
            <div className="space-y-4">
              <TextInput
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="o que aconteceu (atividade/evento)"
                autoFocus
              />
              <ChoiceCardGrid
                label="tipo"
                options={INTERNSHIP_TYPES}
                value={internshipType}
                onChange={(v) => setInternshipType(v)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>data</FieldLabel>
                  <DateInput value={internshipDate} onChange={(e) => setInternshipDate(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>horas</FieldLabel>
                  <TextInput
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>reflexões</FieldLabel>
                <TextArea
                  rows={4}
                  value={reflections}
                  onChange={(e) => setReflections(e.target.value)}
                  placeholder="reflexões sobre o registro"
                />
              </div>
            </div>
          ),
          reviewStep([
            { label: 'atividade', value: activity.trim() },
            { label: 'tipo', value: internshipType.replace('_', ' ') },
            { label: 'data', value: internshipDate ? new Date(internshipDate).toLocaleDateString('pt-BR') : 'hoje' },
            { label: 'horas', value: `${hours || 0}h` },
            { label: 'reflexões', value: truncate(reflections.trim()) },
          ]),
        ];
      case 'concept':
        return [
          formStep(
            'conceito',
            'que conceito nasce daqui?',
            <div className="space-y-4">
              <TextInput
                value={conceptName}
                onChange={(e) => setConceptName(e.target.value)}
                placeholder="nome do conceito"
                autoFocus
              />
              <div>
                <FieldLabel>definição</FieldLabel>
                <TextArea
                  rows={4}
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="o que é esse conceito?"
                />
              </div>
              <Picker
                label="abordagem (opcional)"
                value={approachId}
                onChange={setApproachId}
                options={approaches.map((x) => ({ value: x.id, label: x.shortName || x.name }))}
                placeholder="sem abordagem"
                emptyMessage="ainda não há abordagens registradas."
              />
              <PillGroupMulti variant="rose"
                label="autores relacionados"
                options={authors.map((x) => ({ value: x.id, label: x.name }))}
                value={authorIds}
                onChange={setAuthorIds}
              />
              <PillGroupMulti variant="rose"
                label="disciplinas"
                options={courses.map((x) => ({ value: x.id, label: x.name }))}
                value={courseIds}
                onChange={setCourseIds}
              />
              <TagField
                tags={tags}
                onChange={setTags}
                placeholder="tags do conceito (ex: ansiedade)"
                emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
              />
            </div>
          ),
          reviewStep([
            { label: 'conceito', value: conceptName.trim() },
            { label: 'definição', value: truncate(definition.trim()) },
            { label: 'abordagem', value: approaches.find((x) => x.id === approachId)?.shortName ?? 'sem abordagem' },
            { label: 'autores', value: authors.filter((x) => authorIds.includes(x.id)).map((x) => x.name).join(' · ') },
            { label: 'disciplinas', value: courses.filter((x) => courseIds.includes(x.id)).map((x) => x.name).join(' · ') },
            { label: 'tags', value: tags.join(' · ') },
          ]),
        ];
      case 'author':
        return [
          formStep(
            'autor',
            'quem é esse autor pra você?',
            <div className="space-y-4">
              <TextInput
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="nome do autor"
                autoFocus
              />
              <div>
                <FieldLabel>bio / contribuição</FieldLabel>
                <TextArea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="o que você quer lembrar dele(a)?"
                />
              </div>
              <Picker
                label="abordagem (opcional)"
                value={approachId}
                onChange={setApproachId}
                options={approaches.map((x) => ({ value: x.id, label: x.shortName || x.name }))}
                placeholder="sem abordagem"
                emptyMessage="ainda não há abordagens registradas."
              />
              <TagField
                tags={keyConcepts}
                onChange={setKeyConcepts}
                placeholder="conceitos-chave"
                emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
              />
              <TagField
                tags={majorWorks}
                onChange={setMajorWorks}
                placeholder="obras principais"
                emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
              />
            </div>
          ),
          reviewStep([
            { label: 'autor', value: authorName.trim() },
            { label: 'bio', value: truncate(bio.trim()) },
            { label: 'abordagem', value: approaches.find((x) => x.id === approachId)?.shortName ?? 'sem abordagem' },
            { label: 'conceitos-chave', value: keyConcepts.join(' · ') },
            { label: 'obras', value: majorWorks.join(' · ') },
          ]),
        ];
      case 'material':
        return [
          formStep(
            'material',
            'que material você quer guardar?',
            <div className="space-y-4">
              <TextInput
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                placeholder="título do material"
                autoFocus
              />
              <ChoiceCardGrid
                label="tipo"
                options={MATERIAL_TYPES}
                value={materialType}
                onChange={(v) => setMaterialType(v)}
              />
              <TextInput
                value={materialAuthor}
                onChange={(e) => setMaterialAuthor(e.target.value)}
                placeholder="autor(a)"
              />
              {courseSelect}
              <TextInput
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="link (se houver)"
              />
              <TagField
                tags={materialTags}
                onChange={setMaterialTags}
                placeholder="tags do material"
                emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
              />
            </div>
          ),
          reviewStep([
            { label: 'material', value: materialTitle.trim() },
            { label: 'tipo', value: materialType },
            { label: 'autor', value: materialAuthor.trim() || '—' },
            { label: 'disciplina', value: courseName },
            { label: 'link', value: url.trim() || '—' },
            { label: 'tags', value: materialTags.join(' · ') },
          ]),
        ];
      default:
        return [];
    }
  };

  const steps: WizardStep[] = [pickerStep, ...(target ? targetSteps() : [])];

  const canNext = target === null ? false : step === 1 ? validateForm() : true;

  function validateForm(): boolean {
    switch (target) {
      case 'class':
        return title.trim().length > 0 || content.trim().length > 0;
      case 'task':
        return title.trim().length > 0;
      case 'exam':
        return title.trim().length > 0;
      case 'flashcard':
        return question.trim().length > 0;
      case 'session':
        return sessionTopic.trim().length > 0;
      case 'internship':
        return activity.trim().length > 0;
      case 'concept':
        return conceptName.trim().length > 0;
      case 'author':
        return authorName.trim().length > 0;
      case 'material':
        return materialTitle.trim().length > 0;
      default:
        return false;
    }
  }

  const handleSave = () => {
    if (!focusedNote || !target) return;
    const label = TARGETS.find((t) => t.type === target)?.label ?? '';

    switch (target) {
      case 'class': {
        const cn = buildClassNoteFromNote(focusedNote, {
          title,
          courseId,
          number: classNumber || 1,
        });
        const withDate = { ...cn, date: classDate || today() };
        handleAddClassNote(withDate);
        deleteLooseNote(focusedNote.id);
        hapticSuccess();
        closeAllNoteScreens();
        openComposeDetails(withDate.id);
        showToast('nota transformada em aula ♡');
        return;
      }
      case 'task':
        handleAddTask({
          id: 't-' + Date.now(),
          title: title.trim(),
          disciplineId: courseId || undefined,
          category: taskCategory,
          dueDate: dueDate || today(),
          completed: false,
          priority,
        });
        break;
      case 'exam':
        handleAddExam({
          id: 'e-' + Date.now(),
          courseId: courseId || 'c1',
          title: title.trim(),
          date: examDate || today(),
          weight: examWeight.trim() || '1,0',
          topics,
          completed: false,
        });
        break;
      case 'flashcard':
        handleAddFlashcard({
          id: 'f-' + Date.now(),
          conceptId: conceptId || undefined,
          courseId: courseId || undefined,
          question: question.trim(),
          answer: answer.trim() || content,
          timesReviewed: 0,
        });
        break;
      case 'session':
        handleAddSession({
          id: 'ss-' + Date.now(),
          courseId: courseId || undefined,
          topic: sessionTopic.trim(),
          date: sessionDate || today(),
          durationMinutes: Math.max(1, duration || 1),
          notes: content.trim() || undefined,
        });
        break;
      case 'internship':
        handleAddInternshipLog({
          id: 'ilog-' + Date.now(),
          type: internshipType,
          date: internshipDate || today(),
          hours: Math.max(0, hours || 0),
          activity: activity.trim(),
          reflections: reflections.trim() || content,
          conceptIds: focusedNote.conceptIds,
        });
        break;
      case 'concept':
        handleAddConcept({
          id: 'con-' + Date.now(),
          name: conceptName.trim(),
          definition: definition.trim() || content,
          approachId: approachId || undefined,
          authorIds,
          courseIds,
          tags,
        });
        break;
      case 'author':
        handleAddAuthor({
          id: 'aut-' + Date.now(),
          name: authorName.trim(),
          bio: bio.trim() || content,
          approachId: approachId || undefined,
          keyConcepts,
          majorWorks,
        });
        break;
      case 'material':
        handleAddMaterial({
          id: 'm-' + Date.now(),
          title: materialTitle.trim(),
          type: materialType,
          author: materialAuthor.trim() || '—',
          courseId: courseId || undefined,
          url: url.trim() || undefined,
          tags: materialTags,
          addedAt: new Date().toISOString(),
        });
        break;
    }

    deleteLooseNote(focusedNote.id);
    hapticSuccess();
    closeAllNoteScreens();
    showToast(`nota transformada em ${label} ♡`);
  };

  return (
    <WizardScaffold
      title="transformar nota"
      icon={<Wand2 className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      hideNext={target === null}
      onSave={handleSave}
      onClose={closeAllNoteScreens}
      saveLabel={target ? `transformar em ${TARGETS.find((t) => t.type === target)?.label ?? ''} ♡` : 'guardar ♡'}
    />
  );
};