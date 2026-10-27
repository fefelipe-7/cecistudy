// Gate de tokens de movimento (SPEC-007 §D6 / user story 1).
//
// Regras:
// - **Varia** token literal (`duration: 0.18`, `stiffness: 400`, `ease: 'easeInOut'`,
//   `ease: [0.4, 0, 0.2, 1]`) fora de `src/lib/motion/`.
// - **Não** varia referência a token (`ease: EASE.standard`, `ease: IOS_EASE`,
//   `transition: getTransition(...)`, `...BASE_T`) — usar o token é o objetivo.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = 'src';
/** Só os tokens de movimento decidem transição — o resto fica de fora. */
const EXEMPT_FILES: string[] = [];
const EXEMPT_DIRS = ['src/lib/motion/'];

/**
 * Ocorrências inline conhecidas. Este arquivo é um **ratchet**: só pode encolher.
 * Cada slice que limpa um ponto remove a linha daqui.
 *
 * Gerado por `audit-inline-tokens.mjs` (SPEC-007 Slice D).
 *
 * 2026-10-24: o passe do Biome mudou a quebra de linha de vários arquivos e os
 * números do ratchet acompanharam — nenhum literal entrou ou saiu.
 */
const KNOWN_INLINE: Record<string, number[]> = {
  // Long-press no FAB (2026-10): prop `onLongPress`, `usePressGesture` e
  // `data-phase` entraram acima dos literais — os números de linha do
  // ratchet acompanham (os literais em si não mudaram; o gate é o mesmo).
  'src/components/ui/floating-action-menu.tsx': [71, 72, 74, 75, 88, 99],
  // A curva do `ease` foi tokenizada (`IOS_EASE`): o `duration` continua
  // literal porque 0.18s não é `BASE_D.navBar` (0.24) nem `BASE_D.micro`
  // (0.12) — trocar de token aqui mudaria a entrada da barra sem medição.
  'src/components/ui/bottom-nav-bar.tsx': [32, 64, 87, 88],
  'src/components/courses/detail/CourseCreateMenu.tsx': [78, 117],
  'src/components/flashcards/Card3D.tsx': [8, 102],
  'src/components/flashcards/CardBaúEnvelope.tsx': [34, 52],
  // SPEC-M-028 F3: o par do container transform entrou em volta do hero e do
  // card do grupo, e os literais deslocaram — os números do ratchet acompanham
  // (os literais em si não mudaram; o gate é o mesmo).
  'src/components/quizzes/QuizGroupDetail.tsx': [66, 91],
  // spec-performance F4: os componentes migraram para o loop controlado
  // (useDitherLoop) e os literais deslocaram — os números de linha do ratchet
  // acompanham (os literais em si não mudaram; o gate é o mesmo).
  'src/components/ui/dither-growth.tsx': [99, 100],
  'src/components/ui/dither-revenue.tsx': [77, 78],
  // `EdgeSwipeBack` saiu do ratchet: os dois springs literais do cancelamento
  // viraram `BASE_T.gesture`, o token dono do gesto de borda (SPEC-007 D8).
  // Ratchet só encolhe.
  // SPEC-015: o pager de abas migrou para `ui/SwipeableTabPanel.tsx`, que usa
  // os tokens do sistema — as duas entradas do `CourseDetailView` saíram do
  // ratchet porque o literal deixou de existir lá (ratchet só encolhe).
  'src/components/views/home/rows.tsx': [31],
  'src/components/views/StreakView.tsx': [37, 129],
  // SPEC-M-028 F4: o seletor de grupos passou a usar `Reveal` e perdeu o
  // `motion.button` de entrada — o literal saiu junto (ratchet só encolhe).
  // SPEC-018 F5: os imports da voz entraram no topo do arquivo e os literais
  // deslocaram uma linha — os números do ratchet acompanham (os literais em si
  // não mudaram; o gate é o mesmo).
  'src/components/quizzes/QuizLoadingScreen.tsx': [77],
  'src/components/quizzes/QuizResultScreen.tsx': [73],
  'src/components/ui/AnimatedNumber.tsx': [12],
  // F7.3: a saída da splash usa `BASE_D.overlay * 1000` (token). O `duration: 2.2`
  // da flutuação contínua da mascote é dívida pré-existente, deslocada uma linha
  // pelo `import` do token.
  'src/components/ui/BootSplash.tsx': [145],
  // SPEC-012 F3.5: `aria-valuetext` entrou acima do literal — o número de linha
  // do ratchet acompanha (o literal em si não mudou; o gate é o mesmo).
  'src/components/ui/ProgressBar.tsx': [36],
  'src/components/ui/SegmentedControl.tsx': [72],
  'src/components/views/NoteTransformWizard.tsx': [57],
  'src/components/wizards/FlashcardWizard.tsx': [197],
  'src/components/wizards/note/fieldsFor.tsx': [173],
};

// `duration: 0.3` | `stiffness: 400` | `damping: 36` | `mass: 0.9`
const NUMERIC = /\b(duration|stiffness|damping|mass)\s*:\s*[-0-9.]+/;
// `ease: 'easeInOut'` | `ease: "linear"` | `ease: [0.4, 0, 0.2, 1]` — mas NÃO `ease: EASE.x`
const EASING_LITERAL = /\bease\s*:\s*('[^']*'|"[^"]*"|\[[^\]]*\])/;

/**
 * Remove comentários de linha e de bloco, **preservando a contagem de linhas**
 * (um bloco vira as mesmas '\n'). Sem isso, editar um comentário deslocaria todos
 * os números do ratchet e o gate quebraria por motivo errado.
 *
 * Um gate que dispara em **prosa** é um gate que as pessoas desabilitam — e este
 * precisa valer como barreira.
 */
const stripComments = (src: string): string =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const collect = (dir: string, out: Map<string, number[]>) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      collect(p, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const norm = p.split(path.sep).join('/');
    if (EXEMPT_FILES.includes(norm)) return;
    if (EXEMPT_DIRS.some((d) => norm.includes(d))) continue;
    const lines = stripComments(fs.readFileSync(p, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      if (NUMERIC.test(line) || EASING_LITERAL.test(line)) {
        const list = out.get(norm) ?? [];
        list.push(i + 1);
        out.set(norm, list);
      }
    });
  }
};

const found = new Map<string, number[]>();
collect(SRC, found);

describe('gate de tokens de movimento (SPEC-007 §D6)', () => {
  it('nenhuma transição nova com duração/spring/easing literal fora de src/lib/motion/', () => {
    const unexpected: string[] = [];
    for (const [file, lines] of found) {
      const known = KNOWN_INLINE[file] ?? [];
      for (const line of lines) {
        if (!known.includes(line)) unexpected.push(`${file}:${line}`);
      }
    }
    expect(
      unexpected,
      'Tokens de movimento literais novos. Use BASE_D / BASE_T / EASE de ' +
        '`src/lib/motion/`, ou `getTransition(...)` para respeitar o perfil reduzido. ' +
        'Se a dívida é pré-existente eKnown, adicione a linha em KNOWN_INLINE com comentário.',
    ).toEqual([]);
  });

  it('ratchet: nenhum Known já foi limpo (a lista só pode encolher)', () => {
    const stale: string[] = [];
    for (const [file, knownLines] of Object.entries(KNOWN_INLINE)) {
      const actual = found.get(file) ?? [];
      for (const line of knownLines) {
        if (!actual.includes(line)) stale.push(`${file}:${line}`);
      }
    }
    expect(
      stale,
      'Estas entradas de KNOWN_INLINE não encontram mais literal no arquivo — ' +
        'remova-as do ratchet (o slice limpou o ponto).',
    ).toEqual([]);
  });
});
