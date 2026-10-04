// Constantes e helpers do wizard "transformar nota" (MOD-001 / B.5).
// Extraídos de `NoteTransformWizard.tsx`: rótulos de destinos, opções de
// categoria/prioridade/tipo e pequenos utilitários.

import React from 'react';
import {
  FileText,
  CheckCircle2,
  ClipboardList,
  Brain,
  Timer,
  HeartHandshake,
  Sparkles,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import type { NoteTargetType, Task, InternshipLogType, MaterialItem } from '../../../types';

type IconType = React.ComponentType<{ className?: string }>;

/** Os três destinos principais (§5.11) — o resto fica em "mais opções". */
export const MAIN_TARGET_TYPES: NoteTargetType[] = ['task', 'flashcard', 'class'];

export const TARGETS: {
  type: NoteTargetType;
  label: string;
  caption: string;
  Icon: IconType;
  accent: string;
}[] = [
  { type: 'task', label: 'tarefa', caption: 'prazo ou atividade', Icon: CheckCircle2, accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong' },
  { type: 'flashcard', label: 'flashcard', caption: 'pergunta & resposta', Icon: Brain, accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong' },
  { type: 'class', label: 'aula', caption: 'anotação de aula no diário', Icon: FileText, accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong' },
  { type: 'exam', label: 'prova / avaliação', caption: 'avaliação que vale nota', Icon: ClipboardList, accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong' },
  { type: 'session', label: 'sessão de estudo', caption: 'foco no cantinho', Icon: Timer, accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong' },
  { type: 'internship', label: 'estágio', caption: 'registro de campo', Icon: HeartHandshake, accent: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong' },
  { type: 'concept', label: 'conceito', caption: 'conceito psicológico', Icon: Sparkles, accent: 'bg-status-warning-surface border-status-warning-border text-status-warning-strong' },
  { type: 'author', label: 'autor', caption: 'estudado na jornada', Icon: UserCheck, accent: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong' },
  { type: 'material', label: 'material', caption: 'livro, artigo ou link', Icon: BookOpen, accent: 'bg-surface-muted border-ceci-border-default text-ceci-secondary' },
];

export const MORE_TARGETS = TARGETS.filter((t) => !MAIN_TARGET_TYPES.includes(t.type));

export const TASK_CATEGORIES: { value: Task['category']; label: string; emoji?: string }[] = [
  { value: 'leitura', label: 'leitura', emoji: '📚' },
  { value: 'trabalho', label: 'trabalho', emoji: '📝' },
  { value: 'revisao', label: 'revisão', emoji: '🧠' },
  { value: 'estagio', label: 'estágio', emoji: '🩺' },
  { value: 'outro', label: 'outro', emoji: '✨' },
];

export const PRIORITIES: { value: Task['priority']; label: string; emoji?: string }[] = [
  { value: 'baixa', label: 'baixa', emoji: '🌱' },
  { value: 'media', label: 'média', emoji: '⚖️' },
  { value: 'alta', label: 'alta', emoji: '🔥' },
];

/**
 * Tipos de registro que o celular oferece.
 *
 * `atendimento_clinico` não está aqui, e a ausência é a regra: §4.8 linha 471 da
 * spec referencial é `[D]` — "Só desktop. A camada clínica não sincroniza para o
 * mobile." O botão de registro clínico saiu do wizard em `SPEC-M-013` `D1`, e o
 * tipo saiu do union em `D2`.
 *
 * O que o celular mostra de um atendimento é a **projeção** de quatro campos, que
 * vem do desktop; ela não é editável aqui, e por isso não é um item deste menu.
 */
export const INTERNSHIP_TYPES: { value: InternshipLogType; label: string; emoji?: string }[] = [
  { value: 'estagio', label: 'estágio', emoji: '🏫' },
  { value: 'supervisao', label: 'supervisão', emoji: '🧑‍🏫' },
  { value: 'intervisao', label: 'intervisão', emoji: '👥' },
  { value: 'outro', label: 'outro', emoji: '✨' },
];

export const MATERIAL_TYPES: { value: MaterialItem['type']; label: string; emoji?: string }[] = [
  { value: 'artigo', label: 'artigo', emoji: '📄' },
  { value: 'livro', label: 'livro', emoji: '📖' },
  { value: 'pdf', label: 'pdf', emoji: '📎' },
  { value: 'link', label: 'link', emoji: '🔗' },
  { value: 'slides', label: 'slides', emoji: '📽️' },
];

export const today = () => new Date().toISOString().split('T')[0];

export const truncate = (s: string, max = 80) =>
  s.length > max ? `${s.slice(0, max)}…` : s;