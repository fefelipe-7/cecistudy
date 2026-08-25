/**
 * Pré-carrega os chunks das views/telas lazy depois do boot (idle).
 * Os caminhos são EXATAMENTE os mesmos dos `lazy()` em `ScreenLayers.tsx`,
 * então o Vite deduplica — aqui só aquecemos o cache do browser para a
 * primeira navegação não mostrar skeleton no meio da transição.
 * Inclui a BibliotecaView (o custo do catálogo estático em idle é aceitável —
 * evita o segundo pulso skeleton→conteúdo na primeira visita à aba) e as telas
 * auxiliares de quiz/sync/wizard + peças desktop.
 */
export function prefetchViewChunks(): void {
  const warm = () => {
    void import('../components/views/HomeView');
    void import('../components/views/FaculdadeView');
    void import('../components/views/CourseDetailView');
    void import('../components/views/EstudosView');
    void import('../components/views/BibliotecaView');
    void import('../components/views/PerfilView');
    void import('../components/views/StreakView');
    void import('../components/views/InternshipDiaryView');
    void import('../components/views/TccView');
    void import('../components/views/ComposeNoteView');
    void import('../components/views/ClassNoteDetailWizard');
    void import('../components/views/NoteDetailWizard');
    void import('../components/views/NoteTransformWizard');
    void import('../components/estudos/StudyFocusScreen');
    void import('../components/estudos/StudyRevisarScreen');
    void import('../components/estudos/StudyLeiturasScreen');
    void import('../components/estudos/StudyHistoricoScreen');
    void import('../components/quizzes/QuizCategorySelector');
    void import('../components/quizzes/QuizPlayer');
    void import('../components/quizzes/QuizLoadingScreen');
    void import('../components/quizzes/QuizResultScreen');
    void import('../components/sync/SyncScreen');
    void import('../components/wizards/WizardRouter');
    void import('../desktop/layouts/SplitLayout');
    void import('../desktop/components/CourseMasterList');
  };

  const ric = (window as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback;
  if (typeof ric === 'function') {
    ric(warm, { timeout: 3000 });
  } else {
    window.setTimeout(warm, 1200);
  }
}
