import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseIconPicker } from '../CourseIconPicker';
import { EmailSlider } from '../EmailSlider';
import { COURSE_EMOJIS } from '@/lib/courseOptions';

describe('CourseIconPicker (SPEC-004)', () => {
  it('chama onChange com o emoji clicado', () => {
    let picked = '';
    render(<CourseIconPicker value="" onChange={(v) => (picked = v)} />);
    const emoji = COURSE_EMOJIS[0];
    fireEvent.click(screen.getByRole('button', { name: `emoji ${emoji}` }));
    expect(picked).toBe(emoji);
  });

  it('chama onChange com o nome Lucide clicado', () => {
    let picked = '';
    render(<CourseIconPicker value="" onChange={(v) => (picked = v)} />);
    fireEvent.click(screen.getByRole('button', { name: 'ícone psicologia' }));
    expect(picked).toBe('Brain');
  });

  it('marca o emoji ativo com aria-pressed', () => {
    render(<CourseIconPicker value="🌸" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'emoji 🌸' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'emoji 🧠' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('marca o ícone ativo com aria-pressed', () => {
    render(<CourseIconPicker value="Brain" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'ícone psicologia' }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('EmailSlider (SPEC-004)', () => {
  it('digita número e sincroniza o slider', () => {
    let v: number | undefined;
    render(<EmailSlider value={v} onChange={(n) => (v = n)} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '66' } });
    expect(v).toBe(66);
  });

  it('digitação livre no input numérico devolve undefined quando vazio', () => {
    let v: number | undefined;
    render(<EmailSlider value={66} onChange={(n) => (v = n)} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(v).toBeUndefined();
  });

  it('valor exibido espelha o informado', () => {
    render(<EmailSlider value={33} onChange={() => {}} />);
    const spin = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(spin.value).toBe('33');
  });
});