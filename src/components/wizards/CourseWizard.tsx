import React, { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { Course, CourseScheduleSlot } from '../../types';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { FieldHint, FieldLabel, ReviewCard, TextInput } from './wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { ColorSwatchPicker } from '../ui/ColorSwatchPicker';
import { SchedulePicker } from '../ui/SchedulePicker';
import { formatCourseSchedule } from '../../lib/schedule';
import { COURSE_ICON_OPTIONS } from '../../lib/courseOptions';

export const CourseWizard: React.FC = () => {
  const { profile, handleAddCourse, closeWizard, showToast } = useMobileApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [semester, setSemester] = useState(() => (profile.semester ? `${profile.semester}º sem` : ''));
  const [schedule, setSchedule] = useState<CourseScheduleSlot[]>([]);
  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<Course['color']>('#E97891');
  const [icon, setIcon] = useState<string>('Brain');
  const [step, setStep] = useState(0);

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'curso-basico',
      title: 'matéria',
      headline: 'qual é a nova matéria do seu semestre?',
      subtitle: 'começa pelo nome — código e semestre ajudam a organizar depois.',
      content: (
        <div className="space-y-4">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: psicopatologia ii" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>código</FieldLabel>
              <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="ex: PSI-202" />
              <FieldHint>o código da matéria na grade, se tiver.</FieldHint>
            </div>
            <div>
              <FieldLabel>semestre</FieldLabel>
              <TextInput value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="ex: 6º sem" />
              <FieldHint>em qual período ela está.</FieldHint>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'curso-detalhes',
      title: 'professor & horários',
      headline: 'adicione os detalhes da disciplina para organizar o dia.',
      subtitle: 'professor, dias e horários e sala — tudo opcional, pode completar depois ♡',
      content: (
        <div className="space-y-4">
          <TextInput value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="ex: profa. mariana santos" />
          <div>
            <FieldLabel>dias e horários</FieldLabel>
            <SchedulePicker value={schedule} onChange={setSchedule} />
            <FieldHint>marcar os dias de aula ajuda a montar sua agenda da semana.</FieldHint>
          </div>
          <TextInput value={room} onChange={(e) => setRoom(e.target.value)} placeholder="ex: bloco c • sala 2" />
        </div>
      ),
    },
    {
      id: 'curso-estilo',
      title: 'visual',
      headline: 'dê uma cara ao seu cantinho de estudos.',
      subtitle: 'cor e ícone dão à matéria uma identidade no app — escolha o que combina.',
      content: (
        <div className="space-y-5">
          <div>
            <FieldLabel>cor</FieldLabel>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>
          <ChoiceCardGrid
            label="ícone"
            options={COURSE_ICON_OPTIONS}
            value={icon}
            onChange={setIcon}
          />
        </div>
      ),
    },
    {
      id: 'curso-resumo',
      title: 'resumo',
      headline: 'o que essa matéria busca desenvolver?',
      subtitle: 'uma frase sobre o foco da disciplina — opcional, dá para voltar depois.',
      content: (
        <div className="space-y-2">
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex: estudo das bases da psicopatologia e das manifestações clínicas." />
        </div>
      ),
    },
    {
      id: 'curso-revisar',
      title: 'revisar',
      headline: 'confere e salva a matéria no seu cantinho ♡',
      subtitle: 'confere os dados antes de guardar — se algo faltar, é só voltar.',
      content: (
        <ReviewCard
          rows={[
            { label: 'matéria', value: name.trim() || 'sem nome' },
            { label: 'código', value: code.trim() || 'sem código' },
            { label: 'professor', value: professor.trim() || 'a definir' },
            { label: 'horário', value: formatCourseSchedule(schedule) || 'a definir' },
            { label: 'sala', value: room.trim() || 'a definir' },
            { label: 'semestre', value: semester.trim() || 'a definir' },
          ]}
        />
      ),
    },
  ], [code, color, description, icon, name, professor, room, schedule, semester]);

  const canNext = name.trim().length > 0;

  const handleSave = () => {
    if (!name.trim()) return;
    handleAddCourse({
      id: `course_${Date.now()}`,
      name: name.trim(),
      code: code.trim() || undefined,
      professor: professor.trim() || 'a definir',
      semester: semester.trim() || 'semestre livre',
      schedule: schedule.length ? schedule : [],
      room: room.trim() || undefined,
      color,
      icon,
      description: description.trim() || undefined,
    });
    showToast('matéria adicionada ao seu cantinho ♡');
    closeWizard();
  };

  return (
    <WizardScaffold
      title="nova matéria"
      subtitle="organize sua faculdade no estilo do app"
      icon={<BookOpen className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      blockedReason="dê um nome para a matéria"
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel="guardar matéria ♡"
    />
  );
};
