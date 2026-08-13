import React from 'react';
import {
  Brain,
  FileText,
  GraduationCap,
  HeartHandshake,
  Sparkles,
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
};

const COURSE_ICON_COLOR: Record<string, string> = {
  Brain: 'text-[#B94862]',
  FileText: 'text-[#396D82]',
  Sparkles: 'text-[#756354]',
  Users: 'text-[#2D6A4F]',
  HeartHandshake: 'text-[#8C7338]',
  GraduationCap: 'text-[#B94862]',
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
