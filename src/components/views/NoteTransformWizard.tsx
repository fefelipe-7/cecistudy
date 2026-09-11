import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Wand2 } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { NoteTargetType, Task, InternshipLogType, MaterialItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { TOAST } from '../../lib/copy';
import { buildClassNoteFromNote, noteFirstLine } from '../../lib/noteLogic';
import { WizardScaffold, type WizardStep } from '../wizards/WizardScaffold';
import { ReviewCard } from '../wizards/wizardFields';
import { useAcervoTheory } from '../wizards/useAcervoTheory';
import { Picker } from '../ui/Picker';
import { TARGETS, MAIN_TARGET_TYPES, MORE_TARGETS, today, truncate } from '../wizards/note/constants';
import ClassForm from '../wizards/note/ClassForm';
import TaskForm from '../wizards/note/TaskForm';
import ExamForm from '../wizards/note/ExamForm';
import FlashcardForm from '../wizards/note/FlashcardForm';
import SessionForm from '../wizards/note/SessionForm';
import InternshipForm from '../wizards/note/InternshipForm';
import ConceptForm from '../wizards/note/ConceptForm';
import AuthorForm from '../wizards/note/AuthorForm';
import MaterialForm from '../wizards/note/MaterialForm';

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
    setActiveTab,
    openEditCourse,
    showToast,
  } = useMobileApp();

  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<NoteTargetType | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  /** Item criado com sucesso — mostra a tela final "abrir item criado" (§5.11). */
  const [created, setCreated] = useState<{ label: string; onOpen?: () => void } | null>(null);
  const { conceptOptions, resolveIds } = useAcervoTheory();

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
      createLabel="criar matéria agora"
      onCreate={() => {
        showToast(TOAST.courseRegistered);
        openEditCourse();
      }}
    />
  );

  const pickerStep: WizardStep = {
    id: 'tipo',
    title: 'transformar em',
    headline: 'em que essa nota vira?',
    subtitle: 'suas notas são rascunhos transitórios — escolhe para onde essa vai.',
    content: (
      <div className="space-y-4">
        {/* três destinos principais (§5.11) */}
        <div className="space-y-2.5">
          {TARGETS.filter((t) => MAIN_TARGET_TYPES.includes(t.type)).map((opt) => {
            const Icon = opt.Icon;
            return (
              <button
                key={opt.type}
                onClick={() => {
                  setTarget(opt.type);
                  setStep(1);
                }}
                className="w-full flex items-center gap-3.5 p-4 rounded-xl bg-surface-default border-2 border-ceci-border-default hover:border-ceci-border-brand text-left transition active:scale-[0.98] cursor-pointer shadow-sm"
              >
                <span className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${opt.accent}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-display font-bold text-sm text-ceci-primary">{opt.label}</span>
                  <span className="block text-[11px] text-ceci-secondary mt-0.5 leading-snug">{opt.caption}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* mais opções — colapsável */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className="w-full py-2.5 text-xs font-bold text-ceci-academic-strong hover:bg-surface-blue/40 rounded-xl transition-colors cursor-pointer"
        >
          {moreOpen ? '− menos opções' : '+ mais opções'}
        </button>
        {moreOpen && (
          <div className="grid grid-cols-2 gap-2.5">
            {MORE_TARGETS.map((opt) => {
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.type}
                  onClick={() => {
                    setTarget(opt.type);
                    setStep(1);
                  }}
                  className="w-full flex flex-col items-start gap-2 p-3.5 rounded-xl bg-surface-default border border-ceci-border-default hover:border-ceci-border-brand text-left transition active:scale-[0.98] cursor-pointer shadow-2xs"
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
        )}
      </div>
    ),
  };

  const reviewStep = (rows: { label: string; value: string }[]): WizardStep => ({
    id: 'revisar',
    title: 'revisar',
    headline: 'confere se está tudo certinho ♡',
    subtitle: 'se algo estiver fora, volta e ajusta aqui antes de transformar.',
    content: (
      <div className="space-y-3">
        <ReviewCard rows={rows} />
        {/* §5.11: explicar o que acontece com a nota original */}
        <p className="text-[11px] text-ceci-tertiary leading-relaxed px-1">
          ao transformar, a nota original sai das suas notas avulsas — o conteúdo vai junto para o novo registro ♡
        </p>
      </div>
    ),
  });

  const formStep = (id: string, headline: string, content: React.ReactNode, subtitle?: string): WizardStep => ({
    id,
    title: 'detalhes',
    headline,
    subtitle,
    content,
  });

  const targetSteps = (): WizardStep[] => {
    switch (target) {
      case 'class':
        return [
          formStep(
            'aula',
            'como essa aula fica registrada?',
            <ClassForm
              value={title}
              onChange={setTitle}
              courseSelect={courseSelect}
              classNumber={classNumber}
              onClassNumberChange={setClassNumber}
              classDate={classDate}
              onClassDateChange={setClassDate}
            />,
            'título da aula e data — o conteúdo da nota vai junto para o diário.'
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
            <TaskForm
              value={title}
              onChange={setTitle}
              category={taskCategory}
              onCategoryChange={setTaskCategory}
              priority={priority}
              onPriorityChange={setPriority}
              courseSelect={courseSelect}
              dueDate={dueDate}
              onDueDateChange={setDueDate}
            />,
            'em que a tarefa se torna: título, categoria e o prazo para entregar.'
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
            <ExamForm
              value={title}
              onChange={setTitle}
              courseSelect={courseSelect}
              date={examDate}
              onDateChange={setExamDate}
              weight={examWeight}
              onWeightChange={setExamWeight}
              topics={topics}
              onTopicsChange={setTopics}
            />,
            'título, disciplina, data e peso da avaliação que vale nota.'
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
            <FlashcardForm
              question={question}
              onQuestionChange={setQuestion}
              answer={answer}
              onAnswerChange={setAnswer}
              courseSelect={courseSelect}
              conceptId={conceptId}
              onConceptIdChange={(v) => setConceptId(resolveIds([v])[0])}
              conceptOptions={conceptOptions}
            />,
            'a pergunta fica na frente do card; o conteúdo da sua nota vira a resposta.'
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
            <SessionForm
              topic={sessionTopic}
              onTopicChange={setSessionTopic}
              courseSelect={courseSelect}
              date={sessionDate}
              onDateChange={setSessionDate}
              duration={duration}
              onDurationChange={setDuration}
            />,
            'tópico, data e duração para registrar no histórico de foco.'
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
            <InternshipForm
              activity={activity}
              onActivityChange={setActivity}
              type={internshipType}
              onTypeChange={setInternshipType}
              date={internshipDate}
              onDateChange={setInternshipDate}
              hours={hours}
              onHoursChange={setHours}
              reflections={reflections}
              onReflectionsChange={setReflections}
            />,
            'o que aconteceu no campo — atividade, tipo, data e horas.'
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
            <ConceptForm
              name={conceptName}
              onNameChange={setConceptName}
              definition={definition}
              onDefinitionChange={setDefinition}
              approaches={approaches}
              approachId={approachId}
              onApproachIdChange={setApproachId}
              authors={authors}
              authorIds={authorIds}
              onAuthorIdsChange={setAuthorIds}
              courses={courses}
              courseIds={courseIds}
              onCourseIdsChange={setCourseIds}
              tags={tags}
              onTagsChange={setTags}
            />,
            'nome e definição do conceito — vínculos com autores e disciplinas são opcionais ♡'
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
            <AuthorForm
              name={authorName}
              onNameChange={setAuthorName}
              bio={bio}
              onBioChange={setBio}
              approaches={approaches}
              approachId={approachId}
              onApproachIdChange={setApproachId}
              keyConcepts={keyConcepts}
              onKeyConceptsChange={setKeyConcepts}
              majorWorks={majorWorks}
              onMajorWorksChange={setMajorWorks}
            />,
            'nome + uma nota do porquê lembrar dele(a) — o resto fica para depois.'
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
            <MaterialForm
              title={materialTitle}
              onTitleChange={setMaterialTitle}
              type={materialType}
              onTypeChange={setMaterialType}
              author={materialAuthor}
              onAuthorChange={setMaterialAuthor}
              courseSelect={courseSelect}
              url={url}
              onUrlChange={setUrl}
              tags={materialTags}
              onTagsChange={setMaterialTags}
            />,
            'título, tipo e de quem é o material — para achar fácil depois.'
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

    /** Cria o item, remove a nota e mostra a tela final (§5.11: "abrir item criado"). */
    const finalize = (onOpen?: () => void) => {
      deleteLooseNote(focusedNote.id);
      hapticSuccess();
      setCreated({ label, onOpen });
      showToast(`nota transformada em ${label} ♡`);
    };

    switch (target) {
      case 'class': {
        const cn = buildClassNoteFromNote(focusedNote, {
          title,
          courseId,
          number: classNumber || 1,
        });
        const withDate = { ...cn, date: classDate || today() };
        handleAddClassNote(withDate);
        finalize(() => openComposeDetails(withDate.id));
        return;
      }
      case 'task': {
        const taskId = 't-' + Date.now();
        handleAddTask({
          id: taskId,
          title: title.trim(),
          disciplineId: courseId || undefined,
          category: taskCategory,
          dueDate: dueDate || undefined,
          completed: false,
          priority,
        });
        finalize(() =>
          setTimeout(() => setActiveTab(courseId ? 'faculdade' : 'home'), 50)
        );
        return;
      }
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

    finalize();
  };

  // ---- tela final de sucesso: "prontinho ♡ abrir item criado" ----
  if (created) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="w-16 h-16 rounded-3xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong">
          <CheckCircle2 className="w-8 h-8" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display font-bold text-xl text-ceci-primary">
            prontinho! sua nota virou {created.label} ♡
          </h2>
          <p className="text-xs text-ceci-secondary leading-relaxed">
            a nota original saiu das avulsas — o conteúdo foi junto.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2 pt-2">
          {created.onOpen && (
            <button
              onClick={() => {
                closeAllNoteScreens();
                created.onOpen?.();
              }}
              className="w-full min-h-[48px] rounded-2xl bg-ceci-brand-strong text-white text-sm font-semibold active:scale-[0.98] transition-transform cursor-pointer"
            >
              abrir item criado
            </button>
          )}
          <button
            onClick={closeAllNoteScreens}
            className="w-full min-h-[44px] rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-secondary text-sm font-semibold active:scale-[0.98] transition-transform cursor-pointer"
          >
            voltar para as notas
          </button>
        </div>
      </div>
    );
  }

  return (
    <WizardScaffold
      title="transformar nota"
      icon={<Wand2 className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      mascote="writing-flow"
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