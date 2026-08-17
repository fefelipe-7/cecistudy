import React from 'react';
import {
  Brain,
  FileText,
  Flame,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Sparkles,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

const COURSE_ICON_MAP: Record<string, LucideIcon> = {
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
};

const COURSE_ICON_COLOR: Record<string, string> = {
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
};

interface CourseIconProps {
  icon?: string;
  className?: string;
}

export const CourseIcon: React.FC<CourseIconProps> = ({
  icon,
  className = 'w-4 h-4',
}) => {
  const Icon = COURSE_ICON_MAP[icon || ''] ?? GraduationCap;
  const color = COURSE_ICON_COLOR[icon || ''] ?? COURSE_ICON_COLOR.GraduationCap;
  return <Icon className={`${color} ${className}`} />;
};
