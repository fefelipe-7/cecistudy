import React, { useEffect, useState } from 'react';
import { Course, CourseScheduleSlot } from '../../types';
import { Modal } from '../ui/Modal';
import { ColorSwatchPicker } from '../ui/ColorSwatchPicker';
import { SchedulePicker } from '../ui/SchedulePicker';
import { CourseIconPicker } from '../ui/CourseIconPicker';
import { EmailSlider } from '../ui/EmailSlider';
import { formatCourseSchedule } from '../../lib/schedule';
import { buildAttendanceFromHours, hoursFromClasses, hoursPerClassFromSchedule } from '../../lib/attendance';
import { CatalogMultiSelect } from '../ui/CatalogMultiSelect';
import { useCourseRepertorio } from '../wizards/useCourseRepertorio';

const CATEGORIES: Array<Course['category']> = [
  'obrigatoria',
  'complementar',
  'optativa',
  'estagio',
  'tcc',
  'extra',
];
const CATEGORY_LABELS: Record<Course['category'], string> = {
  obrigatoria: 'obrigatória',
  complementar: 'complementar',
  optativa: 'optativa',
  estagio: 'estágio',
  tcc: 'tcc',
  extra: 'extra',
};

interface EditCourseModalProps {
  isOpen: boolean;
  course: Course | undefined;
  onClose: () => void;
  onSave: (updated: Course) => void;
}

const inputClass =
  'w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  course,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [semester, setSemester] = useState('');
  const [schedule, setSchedule] = useState<CourseScheduleSlot[]>([]);
  const [room, setRoom] = useState('');
  const [color, setColor] = useState('#E97891');
  const [icon, setIcon] = useState('Brain');
  const [minGrade, setMinGrade] = useState('7');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Course['category']>('obrigatoria');
  const [officeHours, setOfficeHours] = useState('');
  const [attHours, setAttHours] = useState('');
  const [attHoursDone, setAttHoursDone] = useState('');
  const [attendanceMinPct, setAttendanceMinPct] = useState('75');
  const [conceptIds, setConceptIds] = useState<string[]>([]);
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [bibliographyIds, setBibliographyIds] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState<'conceitos' | 'autores' | 'bibliografia' | null>(null);
  const { conceptOptions, authorOptions, bibliographyOptions, resolveIds } = useCourseRepertorio();

  useEffect(() => {
    if (isOpen && course) {
      setName(course.name);
      setCode(course.code || '');
      setProfessor(course.professor);
      setSemester(course.semester);
      setSchedule(Array.isArray(course.schedule) ? course.schedule : []);
      setRoom(course.room || '');
      setColor(course.color);
      setIcon(course.icon);
      setMinGrade(String(course.minGrade ?? 7));
      setDescription(course.description || '');
      setCategory(course.category ?? 'obrigatoria');
      setOfficeHours(course.officeHours || '');
      const emptySchedule: CourseScheduleSlot[] = [];
      const rawSchedule = Array.isArray(course.schedule) ? course.schedule : emptySchedule;
      const att = course.attendance;
      const hpc = hoursPerClassFromSchedule(att?.totalHours ? rawSchedule : emptySchedule);
      if (att?.totalHours && att.totalHours > 0) {
        setAttHours(String(att.totalHours));
        setAttHoursDone(String(att.baseHoursDone ?? 0));
      } else if (att && att.total > 0) {
        setAttHours(String(Math.round(att.total * hpc)));
        setAttHoursDone(String(Math.round(hoursFromClasses(att.baseAttended ?? 0, rawSchedule))));
      } else {
        setAttHours('');
        setAttHoursDone('');
      }
      setAttendanceMinPct(String(att?.minPct ?? 75));
      setConceptIds(course.conceptIds ?? []);
      setAuthorIds(course.authorIds ?? []);
      setBibliographyIds(course.bibliographyIds ?? []);
    }
  }, [isOpen, course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    if (!name.trim()) return;
    const totalHours = parseFloat(String(attHours).replace(',', '.')) || 0;
    const hoursDone = parseFloat(String(attHoursDone).replace(',', '.')) || 0;
    const minPct = Math.max(0, Math.min(100, parseInt(attendanceMinPct) || 75));
    const built = buildAttendanceFromHours({
      totalHours: totalHours > 0 ? totalHours : undefined,
      hoursDone: hoursDone > 0 ? hoursDone : undefined,
      minPct,
      schedule: Array.isArray(schedule) ? schedule : [],
    });
    onSave({
      ...course,
      name: name.trim(),
      code: code.trim(),
      professor: professor.trim(),
      semester: semester.trim(),
      schedule: Array.isArray(schedule) ? schedule : [],
      room: room.trim(),
      color,
      icon,
      minGrade: Math.max(0, Math.min(10, parseFloat(minGrade.replace(',', '.'))) || 0),
      description: description.trim(),
      category,
      officeHours: officeHours.trim() || undefined,
      attendance: built
        ? { ...built, records: course.attendance?.records ?? [] }
        : undefined,
      conceptIds,
      authorIds,
      bibliographyIds,
    });
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary">
        <div className="flex items-center justify-between border-b border-ceci-border-subtle pb-3 mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-ceci-primary">editar matéria</h3>
            <p className="text-xs text-ceci-secondary">ajuste os detalhes da disciplina</p>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-full hover:bg-surface-muted text-ceci-secondary transition-colors cursor-pointer"
            aria-label="fechar"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>nome da matéria</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required placeholder="ex: psicopatologia i" />
            </div>

            <div>
              <label className={labelClass}>código</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="ex: PSI-300" />
            </div>
            <div>
              <label className={labelClass}>professor(a)</label>
              <input type="text" value={professor} onChange={(e) => setProfessor(e.target.value)} className={inputClass} placeholder="ex: profa. mariana" />
            </div>

            <div>
              <label className={labelClass}>semestre</label>
              <input type="text" value={semester} onChange={(e) => setSemester(e.target.value)} className={inputClass} placeholder="ex: 6º semestre" />
            </div>
            <div>
              <label className={labelClass}>categoria</label>
              <select value={category ?? ''} onChange={(e) => setCategory(e.target.value as Course['category'])} className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>dias e horários</label>
              <SchedulePicker value={schedule} onChange={setSchedule} />
            </div>

            <div>
              <label className={labelClass}>sala</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className={inputClass} placeholder="ex: bloco c" />
            </div>
            <div>
              <label className={labelClass}>média mínima (0–10)</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={minGrade}
                onChange={(e) => setMinGrade(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>atendimento & monitoria</label>
              <input type="text" value={officeHours} onChange={(e) => setOfficeHours(e.target.value)} className={inputClass} placeholder="ex: quartas, 14h - 15h30, sala dos professores" />
            </div>

            <div className="col-span-2 space-y-4">
              <div>
                <label className={labelClass}>carga horária total (h)</label>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={attHours}
                  onChange={(e) => setAttHours(e.target.value)}
                  className={inputClass}
                  placeholder="ex: 66"
                />
                {attHours && Number(attHours) > 0 && (
                  <p className="mt-1 text-[11px] text-ceci-tertiary">
                    ≈ {Math.max(1, Math.round(Number(attHours) / hoursPerClassFromSchedule(Array.isArray(schedule) ? schedule : [])))} aulas de {hoursPerClassFromSchedule(Array.isArray(schedule) ? schedule : [])}h
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>horas já feitas (h)</label>
                <input
                  type="number"
                  min={0}
                  max={Math.max(Number(attHours) || 1, 1)}
                  value={attHoursDone}
                  onChange={(e) =>
                    setAttHoursDone(
                      String(Math.min(Math.max(0, Number(e.target.value) || 0), Math.max(Number(attHours) || 1, 1)))
                    )
                  }
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>mínimo de presença (%)</label>
                <input type="number" min={0} max={100} value={attendanceMinPct} onChange={(e) => setAttendanceMinPct(e.target.value)} className={inputClass} placeholder="75" />
                <p className="mt-1 text-[11px] text-ceci-tertiary">
                  deixe a carga horária vazia para não registrar frequência em horas.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>cor da matéria</label>
            <ColorSwatchPicker value={color} onChange={setColor} size="sm" />
          </div>

          <div>
            <label className={labelClass}>ícone da matéria</label>
            <CourseIconPicker value={icon} onChange={setIcon} />
          </div>

          <div>
            <label className={labelClass}>descrição</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="um resumo do que a matéria aborda..."
            />
          </div>

          <div className="border-t border-ceci-border-subtle pt-4">
            <label className={labelClass}>repertório</label>
            <div className="space-y-2">
              <CatalogMultiSelect
                open={sheetOpen === 'conceitos'}
                onClose={() => setSheetOpen(null)}
                title="conceitos-chave"
                options={conceptOptions}
                value={conceptIds}
                onChange={(v) => setConceptIds(resolveIds(v))}
                emptyMessage="ainda não tem conceito parecido por aqui ♡"
              />
              <CatalogMultiSelect
                open={sheetOpen === 'autores'}
                onClose={() => setSheetOpen(null)}
                title="autores fundamentais"
                options={authorOptions}
                value={authorIds}
                onChange={(v) => setAuthorIds(resolveIds(v))}
                emptyMessage="ainda não tem autor parecido por aqui ♡"
              />
              <CatalogMultiSelect
                open={sheetOpen === 'bibliografia'}
                onClose={() => setSheetOpen(null)}
                title="leituras & bibliografia"
                options={bibliographyOptions}
                value={bibliographyIds}
                onChange={(v) => setBibliographyIds(v)}
                emptyMessage="ainda não tem leitura parecida por aqui ♡"
              />
              <button type="button" onClick={() => setSheetOpen('conceitos')} className="w-full bg-surface-input rounded-xl px-3.5 py-3 text-sm text-left text-ceci-primary border border-ceci-border-default hover:border-ceci-border-brand focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 cursor-pointer transition-colors">
                {conceptIds.length
                  ? `${conceptIds.length} conceito${conceptIds.length === 1 ? '' : 's'} vinculado${conceptIds.length === 1 ? '' : 's'}`
                  : 'escolher conceitos-chave...'}
              </button>
              <button type="button" onClick={() => setSheetOpen('autores')} className="w-full bg-surface-input rounded-xl px-3.5 py-3 text-sm text-left text-ceci-primary border border-ceci-border-default hover:border-ceci-border-brand focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 cursor-pointer transition-colors">
                {authorIds.length
                  ? `${authorIds.length} autor${authorIds.length === 1 ? '' : 'es'} vinculado${authorIds.length === 1 ? '' : 's'}`
                  : 'escolher autores fundamentais...'}
              </button>
              <button type="button" onClick={() => setSheetOpen('bibliografia')} className="w-full bg-surface-input rounded-xl px-3.5 py-3 text-sm text-left text-ceci-primary border border-ceci-border-default hover:border-ceci-border-brand focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 cursor-pointer transition-colors">
                {bibliographyIds.length
                  ? `${bibliographyIds.length} leitura${bibliographyIds.length === 1 ? '' : 's'} vinculada${bibliographyIds.length === 1 ? '' : 's'}`
                  : 'escolher leituras e bibliografia...'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ceci-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              cancelar
            </button>
            <button
              type="submit"
              className="bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer"
            >
              guardar alterações
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};