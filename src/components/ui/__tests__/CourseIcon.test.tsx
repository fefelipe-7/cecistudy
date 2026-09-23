import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  COURSE_ICON_NAMES,
  CourseIcon,
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
  'Lightbulb',
  'User',
  'Wrench',
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

describe('CourseIcon rendering (SPEC-004 emoji)', () => {
  it('rende emoji salvo como texto (não como SVG)', () => {
    const { container } = render(<CourseIcon icon="🧠" className="w-5 h-5" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('🧠');
    expect(span?.className).toContain('inline-flex');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('rende nome Lucide como ícone SVG quando é chave do mapa', () => {
    const { container } = render(<CourseIcon icon="Brain" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('rende fallback GraduationCap para valor desconhecido/vazio', () => {
    const { container, rerender } = render(<CourseIcon icon="" />);
    expect(container.querySelector('svg')).not.toBeNull();
    rerender(<CourseIcon icon={undefined} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('marca o emoji como aria-hidden (puramente decorativo)', () => {
    const { container } = render(<CourseIcon icon="🌸" />);
    expect(container.querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('não quebra com emoji composto com variation selector', () => {
    const write = String.fromCodePoint(0x270d, 0xfe0f); // ✍ + selector
    const { container } = render(<CourseIcon icon={write} className="w-6 h-6" />);
    expect(container.querySelector('span')?.textContent).toBe(write);
  });
});