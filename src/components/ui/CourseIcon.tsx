import React from 'react';
import {
  BookOpen,
  Brain,
  Clock,
  FileText,
  Flame,
  GraduationCap,
  HeartHandshake,
  History,
  Landmark,
  Lightbulb,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { CourseIconName } from '../../types';

const COURSE_ICON_MAP: Record<CourseIconName, LucideIcon> = {
  Brain,
  FileText,
  Sparkles,
  Users,
  HeartHandshake,
  GraduationCap,
  Landmark,
  Flame,
  Target,
  Trophy,
  Clock,
  BookOpen,
  History,
  Lightbulb,
  User,
  Wrench,
};

/** Mapa nome → componente (para pickers de ícone, ex.: EditCourseModal). */
export const COURSE_ICON_COMPONENTS: Record<string, LucideIcon> = COURSE_ICON_MAP;

const COURSE_ICON_COLOR: Record<CourseIconName, string> = {
  Brain: 'text-ceci-brand-strong',
  FileText: 'text-ceci-academic-strong',
  Sparkles: 'text-beige-700',
  Users: 'text-success-deep',
  HeartHandshake: 'text-gold',
  GraduationCap: 'text-ceci-brand-strong',
  Landmark: 'text-ceci-brand-strong',
  Flame: 'text-rose-500',
  Target: 'text-ceci-academic-strong',
  Trophy: 'text-ceci-brand-strong',
  Clock: 'text-ceci-academic-strong',
  BookOpen: 'text-beige-700',
  History: 'text-ceci-brand-strong',
  Lightbulb: 'text-ceci-academic-strong',
  User: 'text-beige-700',
  Wrench: 'text-success-deep',
};

/** Nomes de ícones resolvíveis (ordem estável p/ testes). */
export const COURSE_ICON_NAMES: readonly CourseIconName[] = [
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

interface CourseIconProps {
  icon?: string;
  className?: string;
}

export const CourseIcon: React.FC<CourseIconProps> = ({
  icon,
  className = 'w-4 h-4',
}) => {
  const Icon = COURSE_ICON_MAP[icon as CourseIconName] ?? GraduationCap;
  const color = COURSE_ICON_COLOR[icon as CourseIconName] ?? COURSE_ICON_COLOR.GraduationCap;
  return <Icon className={`${color} ${className}`} />;
};