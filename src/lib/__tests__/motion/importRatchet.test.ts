// Gate de import de motion (SPEC-M-027 D22 / I1).
//
// Regra: componente fala com `@/lib/motion`, não com `framer-motion`. Quem pode
// importar o runtime direto é só quem **dona** a presença: `src/lib/motion/`
// (tokens, variantes), `src/shells/` (AnimatePresence), os entrypoints
// (`MotionConfig`) e o próprio provider.
//
// Este arquivo é um **ratchet**: a lista `KNOWN` só pode encolher. Arquivo novo
// importando `framer-motion` direto reprova — e entrada de `KNOWN` que já não
// importa também reprova (senão a lista mente sobre a dívida).
//
// Linha de base medida em 2026-10-24: 47 arquivos importam `framer-motion` no
// repo; 37 fora das exceções. `vendor-motion` = 152.830 B / 50.760 B gzip
// (`artifacts/bundle-report.json`). Números envelhecem; o comando é a fonte.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = ['src', 'apps'];

/** Quem dona a presença/transição pode falar com o runtime. */
const ALLOWED_DIRS = ['src/lib/motion/', 'src/shells/'];
const ALLOWED_FILES = [
  'src/lib/motion.ts', // shim legado: só re-exporta
  'src/App.tsx', // monta `MotionConfig`
  'apps/mobile/src/app/main.tsx', // monta `MotionConfig`
  'src/components/motion/MotionProfileProvider.tsx', // é o provider
];

/** Dívida conhecida: importa `framer-motion` direto. Só encolhe. */
const KNOWN = [
  'src/components/courses/detail/CourseCreateMenu.tsx',
  'src/components/flashcards/Card3D.tsx',
  'src/components/flashcards/CardBaúEnvelope.tsx',
  'src/components/HeaderNav.tsx',
  'src/components/internship/CompleteLogModal.tsx',
  'src/components/library/NotesScreen.tsx',
  'src/components/quizzes/QuizCategorySelector.tsx',
  'src/components/quizzes/QuizExplanationOverlay.tsx',
  'src/components/quizzes/QuizGroupDetail.tsx',
  'src/components/quizzes/QuizGroupSelector.tsx',
  'src/components/quizzes/QuizLoadingScreen.tsx',
  'src/components/quizzes/QuizPlayer.tsx',
  'src/components/quizzes/QuizResultScreen.tsx',
  'src/components/ui/AnimatedNumber.tsx',
  'src/components/ui/BootSplash.tsx',
  'src/components/ui/bottom-nav-bar.tsx',
  'src/components/ui/ContextualBottomBar.tsx',
  'src/components/ui/dither-growth.tsx',
  'src/components/ui/dither-revenue.tsx',
  'src/components/ui/EdgeSwipeBack.tsx',
  'src/components/ui/floating-action-menu.tsx',
  'src/components/ui/Modal.tsx',
  'src/components/ui/ProgressBar.tsx',
  'src/components/ui/SegmentedControl.tsx',
  'src/components/ui/SwipeableTabPanel.tsx',
  'src/components/ui/Toast.tsx',
  'src/components/ui/toggle-switch-glass.tsx',
  'src/components/views/EstudosView.tsx',
  'src/components/views/home/AttentionSection.tsx',
  'src/components/views/home/QuickActions.tsx',
  'src/components/views/home/rows.tsx',
  'src/components/views/OnboardingScreen.tsx',
  'src/components/views/StreakView.tsx',
  'src/components/views/TccView.tsx',
  'src/components/wizards/FlashcardWizard.tsx',
  'src/components/wizards/WizardScaffoldHeader.tsx',
  'src/components/wizards/WizardScaffold.tsx',
];

const FRAMER = /from\s+['"]framer-motion['"]/;
const SECOND_RUNTIME = /from\s+['"]motion\/react['"]/;

const collect = (dir: string, out: string[]) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      collect(p, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const norm = p.split(path.sep).join('/');
    if (ALLOWED_DIRS.some((d) => norm.includes(d))) continue;
    if (ALLOWED_FILES.includes(norm)) continue;
    if (FRAMER.test(fs.readFileSync(p, 'utf8'))) out.push(norm);
  }
};

const offenders = ROOTS.flatMap((root) => {
  const out: string[] = [];
  collect(root, out);
  return out;
}).sort();

describe('gate de import de motion (SPEC-M-027 D22)', () => {
  it('nenhum arquivo novo importa framer-motion direto', () => {
    const unexpected = offenders.filter((file) => !KNOWN.includes(file));
    expect(
      unexpected,
      'Estes arquivos importam `framer-motion` direto. Use `@/lib/motion` ' +
        '(tokens, variantes, `useMotionProfile`). Se for dívida pré-existente, ' +
        'a lista é fechada — não acrescente.',
    ).toEqual([]);
  });

  it('ratchet: nenhuma entrada de KNOWN já foi limpa (a lista só encolhe)', () => {
    const stale = KNOWN.filter((file) => !offenders.includes(file));
    expect(
      stale,
      'Estes arquivos não importam mais `framer-motion` direto — remova a ' +
        'entrada de KNOWN (o arquivo migrou para `@/lib/motion`).',
    ).toEqual([]);
  });

  it('não existe um segundo runtime de animação (motion/react)', () => {
    const second: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules') continue;
          walk(p);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        if (SECOND_RUNTIME.test(fs.readFileSync(p, 'utf8'))) {
          second.push(p.split(path.sep).join('/'));
        }
      }
    };
    ROOTS.forEach(walk);
    expect(second, 'Dois runtimes = dois contextos de presença. Use framer-motion 13.').toEqual(
      [],
    );
  });
});
