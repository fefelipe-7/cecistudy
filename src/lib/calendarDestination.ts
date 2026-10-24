// Destino de um item do calendário (SPEC-024 D4/I2): o toque abre a **entidade
// real**, nunca uma tela nova. Fonte única para Home e tela de calendário.
import type { CalendarEntry } from './schedule';
import type { Exam } from '../types';
import type { NavigationValue } from '../context/navigationEngine';

type EntryNav = Pick<
  NavigationValue,
  'openCourseDetail' | 'openTccScreen' | 'openInternshipDiary' | 'openStudy' | 'openManageItem'
>;

export const destinationForEntry = (
  entry: CalendarEntry,
  nav: EntryNav,
  exams: Exam[],
): (() => void) | null => {
  const { ref } = entry;
  switch (ref.kind) {
    case 'class':
      return () => nav.openCourseDetail(ref.id);
    case 'exam': {
      const courseId = exams.find((e) => e.id === ref.id)?.courseId;
      return courseId ? () => nav.openCourseDetail(courseId) : null;
    }
    case 'task':
      // SPEC-024 D19: a tarefa abre o **gerenciar** dela, com ou sem disciplina
      // — sem isso, tarefa com prazo e sem disciplina não respondia ao toque.
      return () => nav.openManageItem('task', ref.id);
    case 'chapter':
      return () => nav.openTccScreen('capitulos', ref.id);
    case 'thesisTask':
    case 'meeting':
      return () => nav.openTccScreen('orientacao', ref.id);
    case 'milestone':
      return () => nav.openTccScreen('visao');
    case 'internship':
      return () => nav.openInternshipDiary();
    case 'session':
      return () => nav.openStudy('historico');
  }
};
