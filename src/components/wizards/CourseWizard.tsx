import React, { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { Course, CourseScheduleSlot } from '../../types';
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { FieldHint, FieldLabel, ReviewCard, TextInput } from './wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { ColorSwatchPicker } from '../ui/ColorSwatchPicker';
import { SchedulePicker } from '../ui/SchedulePicker';
import { CourseIconPicker } from '../ui/CourseIconPicker';
import { EmailSlider } from '../ui/EmailSlider';
import { formatCourseSchedule } from '../../lib/schedule';
import {
  buildAttendanceFromHours,
  classesFromHours,
  hoursPerClassFromSchedule,
} from '../../lib/attendance';
import { CatalogMultiSelect } from '../ui/CatalogMultiSelect';
import { useCourseRepertorio } from './useCourseRepertorio';

const CATEGORY_OPTIONS: Array<{ value: string; label: string; emoji: string }> = [
  { value: 'obrigatoria', label: 'obrigatória', emoji: '📘' },
  { value: 'optativa', label: 'optativa', emoji: '📗' },
  { value: 'estagio', label: 'estágio', emoji: '🧩' },
  { value: 'tcc', label: 'tcc', emoji: '📝' },
  { value: 'extra', label: 'extra', emoji: '🎨' },
];

interface CourseValues {
  name: string;
  code: string;
  professor: string;
  semester: string;
  schedule: CourseScheduleSlot[];
  room: string;
  description: string;
  color: Course['color'];
  icon: string;
  conceptIds: string[];
  authorIds: string[];
  bibliographyIds: string[];
  category?: Course['category'];
  minGrade?: number;
  officeHours?: string;
  totalHours?: number;
  hoursDone?: number;
  minPct?: number;
}

export const CourseWizard: React.FC = () => {
  const { profile, handleAddCourse, closeWizard, showToast } = useMobileApp();
  const { values, patch, step, setStep } = useWizardForm<CourseValues>({
    initial: {
      name: '',
      code: '',
      professor: '',
      semester: profile.semester ? `${profile.semester}º sem` : '',
      schedule: [],
      room: '',
      description: '',
      color: '#E97891',
      icon: 'Brain',
      conceptIds: [],
      authorIds: [],
      bibliographyIds: [],
      category: undefined,
      minGrade: undefined,
      officeHours: undefined,
      totalHours: undefined,
      hoursDone: undefined,
      minPct: 75,
    },
  });
  const { name, code, professor, semester, schedule, room, description, color, icon } = values;
  const [sheetOpen, setSheetOpen] = useState<'conceitos' | 'autores' | 'bibliografia' | null>(null);
  const { conceptOptions, authorOptions, bibliographyOptions, resolveIds } = useCourseRepertorio();

  const classPreview = values.totalHours
    ? `≈ ${classesFromHours(values.totalHours, schedule)} aulas de ${hoursPerClassFromSchedule(schedule)}h`
    : null;

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'curso-basico',
      title: 'matéria',
      headline: 'qual é a nova matéria do seu semestre?',
      subtitle: 'começa pelo nome — código e semestre ajudam a organizar depois.',
      content: (
        <div className="space-y-4">
          <TextInput value={name} onChange={(e) => patch({ name: e.target.value })} placeholder="ex: psicopatologia ii" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>código</FieldLabel>
              <TextInput value={code} onChange={(e) => patch({ code: e.target.value })} placeholder="ex: PSI-202" />
              <FieldHint>o código da matéria na grade, se tiver.</FieldHint>
            </div>
            <div>
              <FieldLabel>semestre</FieldLabel>
              <TextInput value={semester} onChange={(e) => patch({ semester: e.target.value })} placeholder="ex: 6º sem" />
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
          <TextInput value={professor} onChange={(e) => patch({ professor: e.target.value })} placeholder="ex: profa. mariana santos" />
          <div>
            <FieldLabel>dias e horários</FieldLabel>
            <SchedulePicker value={schedule} onChange={(v) => patch({ schedule: v })} />
            <FieldHint>marcar os dias de aula ajuda a montar sua agenda da semana.</FieldHint>
          </div>
          <TextInput value={room} onChange={(e) => patch({ room: e.target.value })} placeholder="ex: bloco c • sala 2" />
        </div>
      ),
    },
    {
      id: 'curso-frequencia',
      title: 'frequência & requisitos',
      headline: 'define a carga horária e os requisitos da matéria.',
      subtitle: 'em horas mesmo — eu converto para aulas pelo seu horário. tudo opcional ♡',
      content: (
        <div className="space-y-5">
          <EmailSlider
            label="carga horária total (h)"
            value={values.totalHours}
            onChange={(v) => patch({ totalHours: v })}
            min={1}
            max={360}
            step={1}
          />
          <EmailSlider
            label="horas já feitas (h)"
            value={values.hoursDone}
            onChange={(v) => patch({ hoursDone: v === undefined ? undefined : Math.min(v, values.totalHours ?? v) })}
            min={0}
            max={Math.max(values.totalHours ?? 1, 1)}
            step={1}
          />
          <div className="rounded-2xl bg-surface-rose border border-ceci-border-brand px-4 py-3 text-xs text-ceci-brand-strong font-semibold">
            {classPreview ? (
              <span aria-live="polite">{classPreview} com o seu horário</span>
            ) : (
              <span>
                informe a carga horária e eu mostro quantas aulas dá com seu horário ✨
                {schedule.length === 0 && ' (sem horário, considerei aulas de 2h)'}
              </span>
            )}
          </div>
          <div>
            <FieldLabel>frequência mínima (%)</FieldLabel>
            <EmailSlider
              value={values.minPct}
              onChange={(v) => patch({ minPct: v })}
              min={0}
              max={100}
              step={5}
            />
            <FieldHint>define quantas aulas você precisa estar presente — o padrão é 75%.</FieldHint>
          </div>
          <ChoiceCardGrid<string>
            label="categoria"
            options={CATEGORY_OPTIONS}
            value={values.category ?? ''}
            onChange={(v) => patch({ category: (v || undefined) as Course['category'] })}
          />
          <div>
            <FieldLabel>média mínima (0–10)</FieldLabel>
            <EmailSlider
              value={values.minGrade}
              onChange={(v) => patch({ minGrade: v })}
              min={0}
              max={10}
              step={0.5}
            />
            <FieldHint>para passar — se não lembrar agora, deixe vazio ♡</FieldHint>
          </div>
          <TextInput
            value={values.officeHours ?? ''}
            onChange={(e) => patch({ officeHours: e.target.value || undefined })}
            placeholder="atendimento: ex, quartas 14h–16h, sala 203"
          />
          <FieldHint>horário de atendimento/monitoria do professor — opcional.</FieldHint>
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
            <ColorSwatchPicker value={color} onChange={(v) => patch({ color: v })} />
          </div>
          <CourseIconPicker value={icon} onChange={(v) => patch({ icon: v })} />
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
          <TextInput value={description} onChange={(e) => patch({ description: e.target.value })} placeholder="ex: estudo das bases da psicopatologia e das manifestações clínicas." />
        </div>
      ),
    },
    {
      id: 'curso-repertorio',
      title: 'repertório',
      headline: 'quais conceitos, autores e leituras combinam com ela?',
      subtitle: 'deixa aqui o repertório inicial da disciplina — dá para ajustar depois ♡',
      content: (
        <div className="space-y-4">
          <CatalogMultiSelect
            open={sheetOpen === 'conceitos'}
            onClose={() => setSheetOpen(null)}
            title="conceitos-chave"
            options={conceptOptions}
            value={values.conceptIds}
            onChange={(v) => patch({ conceptIds: resolveIds(v) })}
            emptyMessage="ainda não tem conceito parecido por aqui ♡"
          />
          <button type="button" onClick={() => setSheetOpen('conceitos')} className="w-full bg-surface-input rounded-2xl px-4 py-4 text-sm text-left text-ceci-primary border border-transparent focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors">
            {values.conceptIds.length
              ? `${values.conceptIds.length} conceito${values.conceptIds.length === 1 ? '' : 's'} vinculado${values.conceptIds.length === 1 ? '' : 's'}`
              : 'escolher conceitos-chave...'}
          </button>

          <CatalogMultiSelect
            open={sheetOpen === 'autores'}
            onClose={() => setSheetOpen(null)}
            title="autores fundamentais"
            options={authorOptions}
            value={values.authorIds}
            onChange={(v) => patch({ authorIds: resolveIds(v) })}
            emptyMessage="ainda não tem autor parecido por aqui ♡"
          />
          <button type="button" onClick={() => setSheetOpen('autores')} className="w-full bg-surface-input rounded-2xl px-4 py-4 text-sm text-left text-ceci-primary border border-transparent focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors">
            {values.authorIds.length
              ? `${values.authorIds.length} autor${values.authorIds.length === 1 ? '' : 'es'} vinculado${values.authorIds.length === 1 ? '' : 's'}`
              : 'escolher autores fundamentais...'}
          </button>

          <CatalogMultiSelect
            open={sheetOpen === 'bibliografia'}
            onClose={() => setSheetOpen(null)}
            title="leituras & bibliografia"
            options={bibliographyOptions}
            value={values.bibliographyIds}
            onChange={(v) => patch({ bibliographyIds: v })}
            emptyMessage="ainda não tem leitura parecida por aqui ♡"
          />
          <button type="button" onClick={() => setSheetOpen('bibliografia')} className="w-full bg-surface-input rounded-2xl px-4 py-4 text-sm text-left text-ceci-primary border border-transparent focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors">
            {values.bibliographyIds.length
              ? `${values.bibliographyIds.length} leitura${values.bibliographyIds.length === 1 ? '' : 's'} vinculada${values.bibliographyIds.length === 1 ? '' : 's'}`
              : 'escolher leituras e bibliografia...'}
          </button>
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
            {
              label: 'frequência',
              value: values.totalHours
                ? `${values.totalHours}h no total${values.hoursDone ? ` • ${values.hoursDone}h já feitas` : ''} • ${classPreview ?? ''} • mínimo ${values.minPct ?? 75}%`
                : 'a definir',
            },
            {
              label: 'requisitos',
              value: [
                values.category && CATEGORY_OPTIONS.find((o) => o.value === values.category)?.label,
                values.minGrade !== undefined && values.minGrade > 0 ? `média mínima ${values.minGrade}` : null,
                values.officeHours?.trim() ? `atendimento: ${values.officeHours.trim()}` : null,
              ]
                .filter(Boolean)
                .join(' • ') || 'sem requisitos',
            },
            { label: 'visual', value: `${icon} • cor ${color}` },
            {
              label: 'repertório',
              value: `${values.conceptIds.length} conceito${values.conceptIds.length === 1 ? '' : 's'} • ${values.authorIds.length} autor${values.authorIds.length === 1 ? '' : 'es'} • ${values.bibliographyIds.length} leitura${values.bibliographyIds.length === 1 ? '' : 's'}`,
            },
          ]}
        />
      ),
    },
  ], [code, color, conceptOptions, authorOptions, bibliographyOptions, description, icon, name, professor, room, schedule, semester, sheetOpen, values.authorIds, values.bibliographyIds, values.conceptIds, values.category, values.minGrade, values.officeHours, values.totalHours, values.hoursDone, values.minPct, classPreview]);

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
      category: values.category,
      minGrade: values.minGrade || undefined,
      officeHours: values.officeHours?.trim() || undefined,
      color,
      icon,
      description: description.trim() || undefined,
      attendance: buildAttendanceFromHours({
        totalHours: values.totalHours,
        hoursDone: values.hoursDone,
        minPct: values.minPct ?? 75,
        schedule,
      }),
      conceptIds: values.conceptIds,
      authorIds: values.authorIds,
      bibliographyIds: values.bibliographyIds,
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
