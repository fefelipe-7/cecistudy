import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls, type Variants } from 'framer-motion';
import { getTransition, prefersReducedMotion } from '@/lib/motion';
import { MapPin } from 'lucide-react';
import { CourseIcon } from '../ui/CourseIcon';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { useMobileApp } from '@/context/mobileApp';
import { formatCourseSchedule } from '../../lib/schedule';
import {
  canStartTabSwipe,
  shouldIgnorePanTarget,
  swipeTabDelta,
} from '../../lib/swipe';
import { Course } from '../../types';
import { CourseCreateMenu } from '../courses/detail/CourseCreateMenu';
import { CourseInfoContent } from '../courses/detail/CourseInfoContent';
import { CourseAulasContent } from '../courses/detail/CourseAulasContent';
import { CourseRepertorioContent } from '../courses/detail/CourseRepertorioContent';

interface CourseDetailViewProps {
  course: Course;
}

type DetailTab = 'info' | 'aulas' | 'repertorio';

const TAB_ORDER: DetailTab[] = ['info', 'aulas', 'repertorio'];

/** Slide direcional entre tabs (a direção segue o gesto/toque). */
const tabVariants: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -48 : 48, opacity: 0 }),
};

/**
 * Detalhe da disciplina (mobile): hero compacto com contexto (horário/sala),
 * botão de novo registro que expande menu e 3 sub-tabs navegáveis por toque
 * **ou arrasto contínuo** (o conteúdo acompanha o dedo com resistência elástica).
 */
export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [direction, setDirection] = useState(1);
  const dragControls = useDragControls();
  const { classes, exams } = useMobileApp();

  const courseClasses = classes.filter((c) => c.courseId === course.id);
  const courseExams = exams.filter((e) => e.courseId === course.id);

  const goToTab = (next: DetailTab, dir?: number) => {
    if (next === activeTab) return;
    setDirection(
      dir ?? (TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(activeTab) ? 1 : -1)
    );
    setActiveTab(next);
  };

  const stepTab = (delta: -1 | 1) => {
    const idx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= TAB_ORDER.length) return;
    goToTab(TAB_ORDER[nextIdx], delta);
  };

  /** Engaja o drag só para toque válido (fora da borda de voltar e de campos). */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    if (!canStartTabSwipe(e.clientX)) return;
    if (shouldIgnorePanTarget(e.target)) return;
    dragControls.start(e);
  };

  const handleDragEnd = (_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const delta = swipeTabDelta(info.offset.x, info.velocity.x);
    if (delta !== 0) stepTab(delta);
  };

  const contextBits = [
    formatCourseSchedule(course.schedule),
    course.room,
    course.category === 'complementar' ? 'complementar' : 'obrigatória',
  ].filter(Boolean);

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4 pb-24 relative">
      {/* Hero compacto — acento na cor da matéria */}
<div className="px-1 pt-1">
         <motion.div
           layoutId="course-hero"
           className="rounded-xl bg-white border border-ceci-border-default p-3.5 flex items-center gap-3 shadow-sm"
           style={{ borderLeftWidth: '4px', borderLeftColor: course.color || '#B94862' }}
         >
           <motion.span
             layoutId="course-icon-bg"
             className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
             style={{ backgroundColor: `${course.color}20` }}
           >
             <CourseIcon icon={course.icon} className="w-5 h-5" />
           </motion.span>
           <div className="min-w-0 space-y-1">
             <motion.h2
               layoutId="course-title"
               className="font-display text-base font-bold text-ceci-primary leading-tight"
             >
               {course.name}
             </motion.h2>
             <p className="text-[11px] font-medium text-ceci-secondary flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
               <MapPin className="w-3 h-3 text-ceci-muted shrink-0" />
               {contextBits.map((bit, i) => (
                 <React.Fragment key={i}>
                   {i > 0 && <span aria-hidden className="text-ceci-muted">·</span>}
                   <span>{bit}</span>
                 </React.Fragment>
               ))}
             </p>
           </div>
         </motion.div>
       </div>

      {/* Sub-tabs + conteúdo deslizável */}
      <UnderlineTabBar
        tabs={[
          { id: 'info', label: 'informações' },
          {
            id: 'aulas',
            label: 'aulas',
            badge: courseClasses.length + courseExams.length,
          },
          { id: 'repertorio', label: 'repertório' },
        ]}
        active={activeTab}
        onChange={(v) => goToTab(v as DetailTab)}
        className="px-1"
      />

{/* Sub-tabs + conteúdo deslizável */}
      <motion.div
        onPointerDownCapture={handlePointerDown}
        style={{ touchAction: 'pan-y' }}
        className="px-1"
      >
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={prefersReducedMotion()
              ? { duration: 0.08 }
              : { type: 'spring', stiffness: 380, damping: 36 }}
            drag={prefersReducedMotion() ? false : 'x'}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={prefersReducedMotion() ? 0 : 0.14}
            onDragEnd={handleDragEnd}
            role="tabpanel"
            aria-label={`aba ${activeTab}`}
          >
            {activeTab === 'info' && <CourseInfoContent course={course} />}
            {activeTab === 'aulas' && <CourseAulasContent course={course} />}
            {activeTab === 'repertorio' && <CourseRepertorioContent course={course} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Novo registro — botão único que expande menu */}
      <CourseCreateMenu courseId={course.id} variant="floating" />
    </div>
  );
};
