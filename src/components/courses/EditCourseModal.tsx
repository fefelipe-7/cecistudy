import React, { useEffect, useState } from 'react';
import { Brain, FileText, Sparkles, Users, HeartHandshake, GraduationCap, type LucideIcon } from 'lucide-react';
import { Course } from '../../types';
import { Modal } from '../ui/Modal';
import { ColorSwatchPicker } from '../ui/ColorSwatchPicker';
import { COURSE_ICON_OPTIONS } from '../../lib/courseOptions';

interface EditCourseModalProps {
  isOpen: boolean;
  course: Course | undefined;
  onClose: () => void;
  onSave: (updated: Course) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  FileText,
  Sparkles,
  Users,
  HeartHandshake,
  GraduationCap,
};

const COURSE_ICONS: { name: string; Icon: LucideIcon }[] = COURSE_ICON_OPTIONS.map((o) => ({
  name: o.value,
  Icon: ICON_MAP[o.value] ?? Brain,
}));

const inputClass =
  'w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

export const EditCourseModal: React.FC<EditCourseModalProps> = ({ isOpen, course, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [semester, setSemester] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState('#E97891');
  const [icon, setIcon] = useState('Brain');
  const [progress, setProgress] = useState('0');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && course) {
      setName(course.name);
      setCode(course.code || '');
      setProfessor(course.professor);
      setSemester(course.semester);
      setSchedule(course.schedule);
      setRoom(course.room || '');
      setColor(course.color);
      setIcon(course.icon);
      setProgress(String(course.progress));
      setDescription(course.description || '');
    }
  }, [isOpen, course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    if (!name.trim()) return;
    onSave({
      ...course,
      name: name.trim(),
      code: code.trim(),
      professor: professor.trim(),
      semester: semester.trim(),
      schedule: schedule.trim(),
      room: room.trim(),
      color,
      icon,
      progress: Math.max(0, Math.min(100, parseInt(progress) || 0)),
      description: description.trim(),
    });
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-[24px] border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary">
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
              <label className={labelClass}>horário</label>
              <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)} className={inputClass} placeholder="ex: segunda 09:00 - 12:00" />
            </div>

            <div>
              <label className={labelClass}>sala</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className={inputClass} placeholder="ex: bloco c" />
            </div>
            <div>
              <label className={labelClass}>progresso (%)</label>
              <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>cor da matéria</label>
            <ColorSwatchPicker value={color} onChange={setColor} size="sm" />
          </div>

          <div>
            <label className={labelClass}>ícone da matéria</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COURSE_ICONS.map(({ name: iconName, Icon }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center tap-interactive cursor-pointer active:scale-95 ${
                    icon === iconName
                      ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
                      : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
                  }`}
                  aria-label={`ícone ${iconName}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
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
              className="bg-rose-500 hover:bg-ceci-brand-strong text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer"
            >
              guardar alterações
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};