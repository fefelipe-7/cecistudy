import { describe, it, expect } from 'vitest';
import { COURSE_COLORS, COURSE_EMOJIS, COURSE_ICON_OPTIONS, isEmojiIcon } from '../courseOptions';
import { COURSE_ICON_COMPONENTS } from '../../components/ui/CourseIcon';

describe('COURSE_COLORS (SPEC-004)', () => {
  it('oferece 18 cores únicas', () => {
    expect(COURSE_COLORS).toHaveLength(18);
    expect(new Set(COURSE_COLORS).size).toBe(18);
  });

  it('preserva as 7 cores históricas', () => {
    for (const legacy of ['#E97891', '#B94862', '#609FB8', '#4A879F', '#8BC7A2', '#AD9986', '#BD913C']) {
      expect(COURSE_COLORS).toContain(legacy);
    }
  });

  it('espelha as escalas @theme (hex do index.css, sem alias CSS)', () => {
    const theming = [
      '#F596AA', '#E97891', '#D85F79', '#B94862',
      '#83BCD0', '#609FB8', '#4A879F', '#396D82',
      '#8BC7A2', '#5A9F76', '#43805B',
      '#E8C36D', '#BD913C',
      '#E89189', '#D97A72', '#A8514B',
      '#AD9986', '#756354',
    ];
    expect(COURSE_COLORS).toEqual(theming);
  });

  it('todos os hex são válidos (7 dígitos, uppercase)', () => {
    for (const c of COURSE_COLORS) expect(c).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('COURSE_ICON_OPTIONS (SPEC-004)', () => {
  it('cobre os 16 valores resolvíveis no mapa de ícones', () => {
    const values = COURSE_ICON_OPTIONS.map((o) => o.value);
    expect(values).toHaveLength(16);
    for (const v of values) {
      expect(COURSE_ICON_COMPONENTS).toHaveProperty(v);
    }
    // não há valores repetidos
    expect(new Set(values).size).toBe(16);
  });

  it('todos com label e emoji de affordance', () => {
    for (const o of COURSE_ICON_OPTIONS) {
      expect(o.label).toBeTruthy();
      expect(o.emoji).toBeTruthy();
    }
  });
});

describe('COURSE_EMOJIS (SPEC-004)', () => {
  it('catálogo não-vazio, único e sem vazios', () => {
    expect(COURSE_EMOJIS.length).toBeGreaterThan(30);
    expect(new Set(COURSE_EMOJIS).size).toBe(COURSE_EMOJIS.length);
    for (const e of COURSE_EMOJIS) expect(e.trim()).toBeTruthy();
  });

  it('cada emoji é reconhecido como emoji por isEmojiIcon', () => {
    for (const e of COURSE_EMOJIS) expect(isEmojiIcon(e)).toBe(true);
  });
});

describe('isEmojiIcon', () => {
  it('verdadeiro para emoji salvo; falso para nome Lucide/vazio', () => {
    expect(isEmojiIcon('🧠')).toBe(true);
    expect(isEmojiIcon('Brain')).toBe(false);
    expect(isEmojiIcon('')).toBe(false);
    expect(isEmojiIcon(undefined)).toBe(false);
  });
});