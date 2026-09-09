import React, { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDesktopApp } from '@/context/desktopApp';
import { Panel } from '../components/ui/Panel';
import { ViewFallback, SlideContent, OverlayContent } from '../../shells/SharedScreenLayers';
import { HomeScreen } from './HomeScreen';

// Desktop (master-detail da faculdade) — import dinâmico (chunk separado, não
// entra no bundle mobile; este arquivo é exclusivo da casca desktop).
const loadSplitLayout = () =>
  import('../layouts/SplitLayout').then((m) => ({ default: m.SplitLayout }));
const loadCourseMasterList = () =>
  import('../components/CourseMasterList').then((m) => ({ default: m.CourseMasterList }));
const loadCourseDetailPane = () =>
  import('../components/CourseDetailPane').then((m) => ({ default: m.CourseDetailPane }));
const loadCalendarScreen = () =>
  import('./CalendarScreen').then((m) => ({ default: m.CalendarScreen }));

// Telas dedicadas desktop (painéis sobrepostos) — resolvidas aqui a partir do
// DesktopSessionState, já que a camada compartilhada não conhece o desktop.
const loadKnowledgeGraphScreen = () =>
  import('../components/KnowledgeGraphScreen').then((m) => ({ default: m.KnowledgeGraphScreen }));
const loadProjectsScreen = () =>
  import('../components/ProjectsScreen').then((m) => ({ default: m.ProjectsScreen }));
const loadInboxScreen = () =>
  import('../components/InboxScreen').then((m) => ({ default: m.InboxScreen }));

const SplitLayout = lazy(loadSplitLayout);
const CourseMasterList = lazy(loadCourseMasterList);
const CourseDetailPane = lazy(loadCourseDetailPane);
const CalendarScreen = lazy(loadCalendarScreen);
const KnowledgeGraphScreen = lazy(loadKnowledgeGraphScreen);
const ProjectsScreen = lazy(loadProjectsScreen);
const InboxScreen = lazy(loadInboxScreen);

/** Crossfade sutil da pane de detalhe no master-detail desktop. */
const DetailPaneFade: React.FC<{ paneKey: string; children: React.ReactNode }> = ({
  paneKey,
  children,
}) => (
  <AnimatePresence mode="popLayout" initial={false}>
    <motion.div
      key={paneKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.14, ease: 'easeIn' } }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

/** Placeholder da pane de detalhe quando nenhuma disciplina está selecionada. */
const DesktopDetailPlaceholder = () => (
  <Panel
    dashed
    className="min-h-[320px] flex flex-col items-center justify-center gap-2 p-8 text-center"
  >
    <span className="text-3xl" aria-hidden>🌷</span>
    <p className="font-display font-semibold text-ceci-primary">sua grade aparece aqui</p>
    <p className="text-xs text-ceci-secondary max-w-[240px]">
      escolha uma disciplina na lista ao lado para ver aulas, avaliações e repertório ♡
    </p>
  </Panel>
);

/** Monta a pane master-detail da faculdade (só desktop, só na sub-tab disciplinas). */
function buildDesktopFaculdade(
  app: ReturnType<typeof useDesktopApp>,
): React.ReactNode {
  if (app.subTabFaculdade === 'calendario') return <CalendarScreen />;
  if (app.subTabFaculdade !== 'disciplinas') return null;
  return (
    <SplitLayout
      master={<CourseMasterList />}
      detail={
        <DetailPaneFade paneKey={app.focusedCourse?.id ?? 'empty'}>
          {app.focusedCourse ? (
            <CourseDetailPane course={app.focusedCourse} />
          ) : (
            <DesktopDetailPlaceholder />
          )}
        </DetailPaneFade>
      }
    />
  );
}

/**
 * SlideContent com a composição desktop: painéis sobrepostos (grafo/projetos/inbox)
 * resolvidos do DesktopSessionState, senão a home dedicada + master-detail faculdade.
 */
export const DesktopSlideContent: React.FC = () => {
  const app = useDesktopApp();

  if (app.isKnowledgeGraphOpen) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <KnowledgeGraphScreen />
      </Suspense>
    );
  }
  if (app.isProjectsOpen) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <ProjectsScreen />
      </Suspense>
    );
  }
  if (app.isInboxOpen) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <InboxScreen />
      </Suspense>
    );
  }

  return (
    <SlideContent
      desktopHome={<HomeScreen />}
      desktopFaculdade={buildDesktopFaculdade(app)}
    />
  );
};

/** Overlay desktop — mesma lógica da camada compartilhada. */
export const DesktopOverlayContent: React.FC = () => <OverlayContent />;

/** Pré-carrega os chunks desktop (master-detail da faculdade). */
export function preloadDesktopScreenChunks(): void {
  [loadSplitLayout, loadCourseMasterList, loadCourseDetailPane, loadCalendarScreen].forEach(
    (load) => void load().catch(() => {}),
  );
}
