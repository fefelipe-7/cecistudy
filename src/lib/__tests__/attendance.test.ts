import { describe, it, expect } from 'vitest';
import {
  applyAttendanceAction,
  attendanceStats,
  DEFAULT_CLASS_HOURS,
  DEFAULT_MIN_ATTENDANCE_PCT,
  migrateLegacyAttendance,
  recordHoursForCourse,
  removeAttendanceRecord,
  sortAttendanceRecords,
  updateAttendanceRecord,
  upsertPresenceForClassNote,
} from '../attendance';
import type { AttendanceRecord, Course } from '../../types';

const baseCourse = (over: Partial<Course> = {}): Course => ({
  id: 'c1',
  name: 'Psicopatologia I',
  professor: 'Ana',
  semester: '6º semestre',
  schedule: [{ day: 1, start: '09:00', end: '10:40' }],
  color: '#FFD3DD',
  icon: 'Brain',
  ...over,
});

describe('recordHoursForCourse', () => {
  it('deriva horas do slot com término', () => {
    expect(recordHoursForCourse(baseCourse(), '2026-09-14')).toBeCloseTo(1.67);
  });

  it('usa a duração padrão quando o slot não tem término', () => {
    const c = baseCourse({ schedule: [{ day: 1, start: '19:00' }] });
    expect(recordHoursForCourse(c, '2026-09-14')).toBe(DEFAULT_CLASS_HOURS);
  });

  it('usa a duração padrão quando não há aula nesse dia', () => {
    expect(recordHoursForCourse(baseCourse(), '2026-09-17')).toBe(DEFAULT_CLASS_HOURS);
  });
});

describe('attendanceStats', () => {
  it('retorna null sem frequência ou sem total configurado', () => {
    expect(attendanceStats(undefined)).toBeNull();
    expect(attendanceStats({ total: 0, minPct: 75, records: [] })).toBeNull();
  });

  it('ok quando margem positiva e percentual ok', () => {
    const stats = attendanceStats({
      total: 12,
      minPct: 75,
      records: [
        { id: 'r1', date: '2026-09-07', status: 'falta' },
        { id: 'r2', date: '2026-09-08', status: 'falta' },
        { id: 'r3', date: '2026-09-10', status: 'presente', noteId: 'cl-1' },
      ],
      baseAttended: 7,
    });
    expect(stats).not.toBeNull();
    expect(stats!.attended).toBe(8);
    expect(stats!.absences).toBe(2);
    expect(stats!.realized).toBe(10);
    expect(stats!.pct).toBe(80);
    expect(stats!.maxAbsences).toBe(3);
    expect(stats!.margin).toBe(1);
    expect(stats!.status).toBe('ok');
  });

  it('canceladas não contam como faltas nem como realizadas', () => {
    const stats = attendanceStats({
      total: 12,
      minPct: 75,
      records: [{ id: 'r1', date: '2026-09-07', status: 'cancelada' }],
      baseAttended: 4,
    });
    expect(stats!.cancelled).toBe(1);
    expect(stats!.absences).toBe(0);
    expect(stats!.realized).toBe(4);
  });

  it('limite quando a margem chega a zero', () => {
    const presents: AttendanceRecord[] = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      status: 'presente',
    }));
    const records: AttendanceRecord[] = [
      ...presents,
      { id: 'f1', date: '2026-02-01', status: 'falta' },
      { id: 'f2', date: '2026-02-02', status: 'falta' },
      { id: 'f3', date: '2026-02-03', status: 'falta' },
    ];
    const stats = attendanceStats({ total: 12, minPct: 75, baseAttended: 0, records });
    expect(stats!.absences).toBe(3);
    expect(stats!.margin).toBe(0);
    expect(stats!.status).toBe('limite');
  });

  it('estourou quando faltas excedem a margem', () => {
    const records: AttendanceRecord[] = [
      { id: 'r1', date: '2026-02-01', status: 'falta' },
      { id: 'r2', date: '2026-02-02', status: 'falta' },
      { id: 'r3', date: '2026-02-03', status: 'falta' },
      { id: 'r4', date: '2026-02-04', status: 'falta' },
    ];
    const stats = attendanceStats({ total: 12, minPct: 75, baseAttended: 8, records });
    expect(stats!.margin).toBe(-1);
    expect(stats!.status).toBe('estourou');
  });

  it('atencao quando percentual cai abaixo do mínimo mas a margem ainda é positiva', () => {
    const stats = attendanceStats({
      total: 30,
      minPct: 75,
      baseAttended: 0,
      records: [
        ...Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, date: `2026-03-${String(i + 1).padStart(2, '0')}`, status: 'presente' as const })),
        ...Array.from({ length: 4 }, (_, i) => ({ id: `f${i}`, date: `2026-04-${String(i + 1).padStart(2, '0')}`, status: 'falta' as const })),
      ],
    });
    expect(stats!.realized).toBe(14);
    expect(stats!.pct).toBe(71);
    expect(stats!.margin).toBe(3);
    expect(stats!.status).toBe('atencao');
  });

  it('ok mesmo com percentual 0 quando nenhuma aula foi realizada ainda', () => {
    const stats = attendanceStats({ total: 12, minPct: 75, baseAttended: 0, records: [] });
    expect(stats!.pct).toBe(0);
    expect(stats!.margin).toBe(3);
    expect(stats!.status).toBe('ok');
  });
});

describe('applyAttendanceAction', () => {
  it('cria frequência e registra presente em data nova', () => {
    const updated = applyAttendanceAction(baseCourse(), { status: 'presente' }, '2026-09-14');
    expect(updated.attendance).toBeDefined();
    expect(updated.attendance!.total).toBe(0);
    expect(updated.attendance!.minPct).toBe(DEFAULT_MIN_ATTENDANCE_PCT);
    expect(updated.attendance!.records).toHaveLength(1);
    const r = updated.attendance!.records[0];
    expect(r.status).toBe('presente');
    expect(r.date).toBe('2026-09-14');
    expect(r.hours).toBeCloseTo(1.67);
    expect(r.id.startsWith('ar-')).toBe(true);
  });

  it('upsert por data: muda o status mantendo o registro', () => {
    let c = applyAttendanceAction(baseCourse(), { status: 'presente' }, '2026-09-14');
    const id = c.attendance!.records[0].id;
    c = applyAttendanceAction(c, { status: 'falta' }, '2026-09-14');
    expect(c.attendance!.records).toHaveLength(1);
    expect(c.attendance!.records[0].id).toBe(id);
    expect(c.attendance!.records[0].status).toBe('falta');
  });

  it('falta desvincula a nota vinculada', () => {
    let c = applyAttendanceAction(baseCourse(), { status: 'presente', noteId: 'cl-9' }, '2026-09-14');
    expect(c.attendance!.records[0].noteId).toBe('cl-9');
    c = applyAttendanceAction(c, { status: 'cancelada' }, '2026-09-14');
    expect(c.attendance!.records[0].noteId).toBeUndefined();
  });
});

describe('upsertPresenceForClassNote', () => {
  it('vincula presença à anotação em data nova (anotou = esteve presente)', () => {
    const updated = upsertPresenceForClassNote(baseCourse(), { id: 'cl-1', date: '2026-09-14' });
    expect(updated.attendance!.records).toHaveLength(1);
    expect(updated.attendance!.records[0].status).toBe('presente');
    expect(updated.attendance!.records[0].noteId).toBe('cl-1');
  });

  it('atualiza o noteId num registro da mesma data', () => {
    let c = applyAttendanceAction(baseCourse(), { status: 'presente' }, '2026-09-14');
    c = upsertPresenceForClassNote(c, { id: 'cl-1', date: '2026-09-14' });
    expect(c.attendance!.records).toHaveLength(1);
    expect(c.attendance!.records[0].noteId).toBe('cl-1');
  });

  it('não faz nada sem data', () => {
    const c = upsertPresenceForClassNote(baseCourse(), { id: 'cl-1', date: '' });
    expect(c.attendance).toBeUndefined();
  });
});

describe('update/remove/sort records', () => {
  const courseWithRecords = (): Course =>
    applyAttendanceAction(baseCourse(), { status: 'presente' }, '2026-09-14');

  it('edita um campo do registro (horas)', () => {
    const c = courseWithRecords();
    const id = c.attendance!.records[0].id;
    const updated = updateAttendanceRecord(c, id, { hours: 2.5 });
    expect(updated.attendance!.records[0].hours).toBe(2.5);
  });

  it('remove um registro', () => {
    const c = courseWithRecords();
    const id = c.attendance!.records[0].id;
    const updated = removeAttendanceRecord(c, id);
    expect(updated.attendance!.records).toHaveLength(0);
  });

  it('ordena do mais recente para o mais antigo', () => {
    const sorted = sortAttendanceRecords([
      { id: 'a', date: '2026-09-01', status: 'presente' },
      { id: 'b', date: '2026-09-21', status: 'falta' },
      { id: 'c', date: '2026-09-10', status: 'cancelada' },
    ]);
    expect(sorted.map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('migrateLegacyAttendance', () => {
  it('converte o par {attended,total} do shape legado', () => {
    const attendance = migrateLegacyAttendance({ attended: 8, total: 12 });
    expect(attendance).toEqual({
      total: 12,
      minPct: DEFAULT_MIN_ATTENDANCE_PCT,
      baseAttended: 8,
      records: [],
    });
  });

  it('ignora quando não há total', () => {
    expect(migrateLegacyAttendance({ attended: 3 })).toBeUndefined();
    expect(migrateLegacyAttendance(undefined)).toBeUndefined();
  });
});