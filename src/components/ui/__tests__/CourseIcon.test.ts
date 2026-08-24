import { describe, expect, it } from 'vitest';
import {
  COURSE_ICON_NAMES,
} from '../CourseIcon';
import type { CourseIconName } from '../../../types';

const ALL_ICON_NAMES: readonly CourseIconName[] = [
  'Brain',
  'FileText',
  'Sparkles',
  'Users',
  'HeartHandshake',
  'GraduationCap',
  'Landmark',
  'Flame',
  'Target',
  'Trophy',
  'Clock',
  'BookOpen',
  'History',
];

describe('CourseIcon', () => {
  it('cobre exatamente todos os nomes da união CourseIconName', () => {
    expect(COURSE_ICON_NAMES.slice().sort()).toEqual(ALL_ICON_NAMES.slice().sort());
  });

  it('resolve os ícones usados nas telas de estudo do header (P2: Clock/BookOpen/History)', () => {
    for (const icon of ['Clock', 'BookOpen', 'History'] as const) {
      expect(COURSE_ICON_NAMES).toContain(icon);
    }
  });

  it('não tem nomes duplicados no mapa', () => {
    expect(new Set(COURSE_ICON_NAMES).size).toBe(COURSE_ICON_NAMES.length);
  });
});