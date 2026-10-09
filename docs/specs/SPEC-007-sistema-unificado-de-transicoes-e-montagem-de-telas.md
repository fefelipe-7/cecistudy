# Spec: Sistema unificado de transições e montagem de telas

> Unificar toda a animação de entrada/saída e a montagem de telas do cecistudy em
> **um único sistema**, dirigido por um contrato de "intenção de navegação"
> (`NavIntent`) e por tokens de movimento — cobrindo as 5 abas principais, todas as
> sub-telas empilhadas, os wizards, os overlays, o header, a bottom-nav e o gesto de
> borda (iOS).
>
> Origem: auditoria exaustiva de 2026-09 (inventário de todas as `NavScreen` + todos
> os `motion.*`/`AnimatePresence` do app) cruzada com pesquisa de padrões atuais de
> transição em framer-motion 13 / WebView iOS.
>
> **Status: proposta para implementação. Slices A→F.**
>
> **Relação com SPEC-002** (`docs/specs/SPEC-002-motion-navegacao-e-espacamento.md`):
> aquela spec entregou o espaçamento vertical (Slice A), a estabilidade da base em
> overlay (Slice B) e o motion direcional (Slice C). A **Slice D dela nunca foi feita**
> (tokens divergentes no quiz, springs inline, footers `fixed`). Esta spec **não
> substitui** a SPEC-002: ela **completa a Slice D** e adiciona o que faltava
> (montagem, acessibilidade, o contrato único de direção, a correção de 3 bugs reais).
> Onde as duas se sobrepõem, **esta spec prevalece**; a SPEC-002 deve ser marcada como
> concluída ao fim do Slice F.

---

## 1. Objetivo

1. **Um sistema só.** Toda entrada, saída e montagem de tela passa por **um contrato**
   (`NavIntent`) e **uma fábrica de variantes** (`screenVariants`), lidos de **um lugar
   só**. Hoje existem **cinco físicas de "push" diferentes** e ~20 durações/easings
   inline fora dos tokens.
2. **Cada tela sabe para onde está indo, sempre.** A direção (push / pop / tab /
   troca-no-mesmo-nivel) deixa de ser um escalar adivinhado pelo `stack.length` e passa
   a ser **derivada da prefixo-comum das duas pilhas** — o que elimina de raiz a
   classe de bugs "a tela que sai foi para o lado errado".
3. **A montagem é previsível.** Quantas camadas ficam montadas, o que remonta, o que
   congela, e o que é regra única (não mais ternário de 9 níveis com casos esquecidos).
4. **Acessibilidade de verdade.** Camadas saindo/enterrando fora da ordem de tabulação
   (`inert`), foco movido no layout-effect (não no fim da animação), opção de
   movimento no Perfil, gesto desativado sob `prefers-reduced-motion`.

## 2. Problema (diagnóstico da auditoria)

### 2.1 O que já funciona (manter)

- **Um único ponto de entrada/saída de tela**: nenhuma das ~30 views declara animação
  própria de entrada. 100% do movimento de tela vem de `SlideScreen`
  (`src/shells/SlideScreen.tsx:42-60`) ou do `motion.div` de overlay
  (`src/shells/MobileAppShell.tsx:226-238`). Isso é a maior força do desenho atual.
- **Freeze de saída** (`SlideScreen.tsx:30-39` + `src/lib/scroll.ts:11-20`): a tela que
  sai vira `fixed` na posição exata e translada pelo scroll capturado — congela
  pixel-a-pixel. É uma solução elegante para scroll de documento e **não deve ser
  jogada fora**.
- **Camadas separadas**: slide × overlay × header × bottom-nav, todas com
  `initial={false}` (sem animação no primeiro paint).
- `MotionConfig reducedMotion="user"` já montado nos dois clientes
  (`src/App.tsx:23`, `apps/mobile/src/app/main.tsx:33`).
- `apps/mobile` **não duplica nada de motion** — é a mesma árvore, o mesmo
  `MobileAppProvider`, o mesmo `MobileAppShell`. Zero divergência de transição entre os
  dois clientes (únicas diferenças: `preloadScreenChunks()` síncrono e `StrictMode`).

### 2.2 Bugs reais (⚠️ corrigir, não são questão de gosto)

| # | Bug | Evidência | Impacto |
|---|---|---|---|
| **B1** | **`termHistory` não tem transição nenhuma** — nem entrada nem saída. Não há caso para `termHistory` em `slideBaseKey` (`navigationEngine.ts:537-581`), então ele cai no `tab-perfil-<rev>`. E como a pilha é `[perfil, wizard semester, termHistory]`, o guard `isOverlayChange` (`navigationEngine.ts:342-343`) faz `navigationRevision` **não** bumpar ⇒ `slideKey` não muda ⇒ o `SlideScreen` não remonta. | `navigationEngine.ts:342-343, 537-581` | Ao abrir o histórico de semestres, o wizard some com fade e a tela **aparece crua**. Ao voltar, o wizard dá fade-in de novo. |
| **B2** | **`gestureX` do gesto de borda é apagado antes de ser lido.** `EdgeSwipeBack.tsx:86` faz `setNavMotionContext(-1, dragX)` e só depois chama `onBack()`; `setStack` roda `setNavMotionContext(dir)` **sem** `gestureX` (`navigationEngine.ts:345`) → reseta para `0`. | `EdgeSwipeBack.tsx:86` → `navigationEngine.ts:345` | O keyframe `x: [gestureX, endX]` (`motion.ts:135`) **sempre** parte de `0`. O comentário do código promete "sem salto de continuidade" e não acontece. O teste `motion.test.ts:11-13` não pega isso porque chama `setNavMotionContext` direto. |
| **B3** | **3 `layoutId` órfãos** — `course-hero`, `course-icon-bg`, `course-title` em `CourseDetailView.tsx:104,114,122` **não têm elemento de origem** em lugar nenhum do app. | grep em `src/` só acha essas 3 linhas | A "magic motion" do card → detalhe nunca roda; sobra custo de registration de projection node a cada render. |
| **B4** | **3 `NavScreen.kind` declarados e sem render** — `knowledge-graph`, `projects`, `inbox` (`packages/navigation/src/types.ts:73-78`) não têm caso em nenhum dispatcher. | — | Se alguém pushear um deles, **caem silenciosamente na aba base**. Falha silenciosa. |

### 2.3 Dívida de consistência (o que "unificar" significa aqui)

**Cinco físicas de push diferentes:**

| Sistema | Onde | Distância | Duração | Easing |
|---|---|---|---|---|
| Tela (slide) | `motion.ts:97-140` | `18%` / `-14%` + `scale 0.99` | 0.24 / 0.18 | `IOS_EASE_OUT` / `IOS_EASE` |
| Overlay | `motion.ts:143-156` | `scale 0.985` + `y 6` | 0.18 / 0.14 | `IOS_EASE_OUT` / `easeIn` |
| Sub-tab do curso | `CourseDetailView.tsx:29-33` | `48px` | spring 380/36 | — |
| Passo de wizard | `WizardScaffold.tsx:63-67` | `48px` | 0.26 / 0.16 | `IOS_EASE` / `easeIn` |
| Questão do quiz | `QuizPlayer.tsx:124-128` | `40px` | 0.3 / 0.2 | `IOS_EASE_OUT` / `IOS_EASE` |

**~20 pontos com `duration`/`ease`/`spring` inline**, fora de `src/lib/motion.ts`:
`bottom-nav-bar.tsx:36` (replica `IOS_EASE` literalmente), `:66,88` (springs 400/34,
380/30), `floating-action-menu.tsx:39-45` ( **`ease:'easeInOut'` e `type:'spring'` no mesmo
objeto — conflito**), `CardBaúEnvelope.tsx:34,52`, `Card3D.tsx:8`, `AnimatedNumber.tsx:12`,
`ProgressBar.tsx:29`, `SegmentedControl.tsx:67`, `StreakView.tsx:124`,
`dither-*.tsx:79,95`, `EdgeSwipeBack.tsx:93,100`, `CourseDetailView.tsx:190-197`,
`home/rows.tsx:31,80` (4ª curva de easing), `HeaderNav.tsx:57-60` (0.2/0.15 hardcoded,
**sem reduz-motion**), `QuizResultScreen.tsx:61`, `QuizExplanationOverlay.tsx:23,32`,
`QuizCategorySelector.tsx:98` (ease Material `[0.4,0,0.2,1]`),
`WizardScaffoldHeader.tsx:75`, `OnboardingScreen.tsx:111,133,174,223,268,369`
(sem `transition`).

**O canal de direção é frágil.** `navDirection` tem **3 consumidores**, todos no shell
(`MobileAppShell.tsx:174,216,217`) — nenhuma view consegue ler. E o canal de verdade
(`motionCtx`, `motion.ts:72-83`) é um **mutable de módulo** com semântica de
"consumir uma vez", o que gera o bug B2.

**Dispatcher com 9 ternários** (`SharedScreenLayers.tsx:134-293` slide + `:299-327`
overlay): sem registro, sem erro para kind não mapeado (B4), e `termHistory` é tratado
na cadeia de *slide* enquanto o pai dela é um *overlay* (B1).

**Montagem:** nenhuma virtualização; ~20 `Suspense` independentes com fallback
`ViewSkeleton` (`SharedScreenLayers.tsx:77`) — uma entrada de tela **anima um
esqueleto** quando o chunk carrega tarde, e `preloadScreenChunks` engole o erro
(`.catch(() => {})` em `:124`) → skeleton infinito sem UI de erro.

**Acessibilidade ausente:** a camada que sai fica ~180ms no DOM **sem `inert`**, ou
seja, focalizável por Tab durante o fade. O foco nunca é movido para a tela nova.

**Documentação desatualizada:** `AGENTS.md`/`.context/architecture.md` citam
`VIEW_PULINHO` e `AnimatePresence mode="popLayout"` na camada de tela; **nenhum dos dois
existe** — a camada de tela usa `sync` (default) e não existe `VIEW_PULINHO` no repo.
`.context/animations.md` precisa ser reescrita no Slice F.

---

## 3. Problema deravel — por que o modelo atual trava

O sistema atual tem **três camadas de abstração diferentes** para a mesma ideia:

1. `screenVariants` (declarativo, `custom` = escalar 0/1/-1)
2. `motionCtx` (mutable de módulo, consumido 1×)
3. `swipeX` + classe `fixed` no `SlideScreen` (imperativo, com freeze de scroll)

E a direção é **inferida** de `next.length > prev.length`, o que é correto apenas para
push/pop e **errado** para trocar de curso (`#/faculdade/c1` → `#/faculdade/c2`): mesmo
tamanho, mesmo tab ⇒ `dir = 0` ⇒ **crossfade em vez de push lateral**. É o tipo de
coisa que ninguém nota até alguém navegar rápido entre disciplinas.

A unificação precisa de um **contrato** (`NavIntent`), não de mais tokens.

---

## 4. Decisões de arquitetura

### D1 — Um contrato de intenção, não um escalar

`NavIntent` é derivado da **prefixo-comum** das duas pilhas (é uma pilha, então a
classificação é exata e total):

```ts
// src/lib/motion/intent.ts
export type NavKind = 'none' | 'push' | 'pop' | 'tab' | 'replace';

export interface NavIntent {
  readonly kind: NavKind;
  /** +1 = indo mais fundo · -1 = voltando · 0 = lateral/mesmo nível */
  readonly dir: -1 | 0 | 1;
  readonly fromDepth: number;
  readonly toDepth: number;
  /** Offset (px) onde o gesto de borda soltou — só no pop gesture. */
  readonly gestureX: number;
  readonly fromGesture: boolean;
  readonly reduced: boolean;
}

export function deriveIntent(
  prev: readonly NavScreen[],
  next: readonly NavScreen[],
  opts?: { gestureX?: number; fromGesture?: boolean; reduced?: boolean },
): NavIntent { /* … longest common prefix … */ }
```

Classificação:

| condição | `kind` | `dir` |
|---|---|---|
| pilhas idênticas | `none` | `0` |
| `next` é prefixo de `prev` | `pop` | `-1` |
| `prev` é prefixo de `next` | `push` | `+1` |
| mesmo `tab` raiz, ramo diferente (`c1`→`c2`) | `replace` | `0` |
| tab raiz diferente (reset da pilha) | `tab` | `0` |

`replace` é o ganho novo: trocar de disciplina vira **crossfade curto** (o certo) em vez
de animar como se fosse tab.

### D2 — A direção de entrada e a de saída são o **mesmo** `dir`, com sinal trocado

Uma única verdade resolve o problema difícil ("a tela que sai vai para onde?"):

```
entering.x = +dir * W        exiting.x = -dir * W
```

| | quem entra (topo) | quem sai (topo) |
|---|---|---|
| push (`dir=+1`) | de `+W` (direita) | para `-W` (esquerda) |
| pop (`dir=--1`) | de `-W` (esquerda) | para `+W` (direita) |

### D3 — **Posição é função da profundidade** (parallax de camada, sem stage absoluto)

A posição de descanso de uma camada é `x = -depth * PARALLAX * W`. Consequências
grátis: a tela-base **não tem enter/exit em push/pop** — ela só anima
`frente → atrás` e `atrás → frente`; pilha de 3 (`perfil → wizard → histórico`) funciona
sem caso especial; e **o `dir` só importa para a camada do topo**.

> ⚠️ **Decisão explícita: manter o scroll de documento.** A pesquisa recomenda um stage
> `position:relative; overflow:hidden` com filhos `position:absolute; inset:0`. Isso
> exigiria converter o app inteiro para um container de scroll — mexendo no padding de
> 20+ views, nos footers `fixed` de quiz/wizard e invalidando o freeze de saída
> (`SlideScreen.tsx:30-39`, `lib/scroll.ts:11-20`) que é uma das melhores peças do
> código atual. **O ganho do modelo de profundidade é mantido; a troca de modelo de
> scroll, não.** O custo aceito é não poder garantir "nada de `position:fixed` dentro de
> `motion`" por construção — o que se resolve pela regra da Slice D (§8).

### D4 — `prefers-reduced-motion` é um **perfil resolvido**, não um multiplicador

`MotionConfig reducedMotion="user"` desabilita transform mas **mantém opacity** ⇒ o push
vira "slide instantâneo + fade de 260ms", pior que os dois. Reduzido tem de ser **um
conjunto de variantes diferente** (só fade, ~150ms), *e* um escalonamento de durações.
Uma única fonte: `resolveProfile(reduced) => { d, t, screen, step, overlay, … }`.

`MotionConfig reducedMotion` fica como **piso de segurança** para componente que
esqueça o perfil. E **não** ramificar em `NODE_ENV` (a doc do Motion sugere isso; com
o toggle no Perfil temos um switch real, testável em dev).

### D5 — Tween na navegação, spring só onde há gesto/física

Spring baseado em **duração** ignora velocidade herdada por design (o Motion zera
`velocity` em `spring.ts`) ⇒ um toque no meio do push reinicia visivelmente. Push/pop,
tab, step e overlay são **tween com bezier custom**. **Spring de física** fica só no
gesto de borda, no drag-to-dismiss, na bottom-nav e no FAB — o que é interrompível ou
acoplado a física.

Regras de curva: **easeOut na entrada** (o objeto desacelera ao chegar), **easeIn na
saída** (acelera ao sair). Espelhar entrada/saída é o que faz "a mesma coisa saindo".

### D6 — Consolidação dos 5 sistemas de push em **5 presets nomeados**

Não é "um sistema só" no sentido de tudo igual — é **uma fonte só**, com 5 presets
declarados e documentados. Forçar o step de wizard a ter a mesma física do push de tela
seria errado (passo é curto e local; tela é longa e espacial).

| preset | uso | x | duração |
|---|---|---|---|
| `screen` | camadas da pilha | `±100%` da largura | 0.26 entra / 0.18 sai |
| `overlay` | compose/wizards/nota-detalhe | `scale .985` + `y 6` | 0.18 / 0.14 |
| `step` | sub-tab de curso, passo de wizard, questão de quiz | `±40px` | 0.24 / 0.16 |
| `tab` | troca de aba (pares) | nenhum (fade) | 0.14 |
| `chrome` | header, bottom-nav, FAB | y/opacity | spring |

---

## 5. Modelo de movimento

### 5.1 Tokens (`src/lib/motion/tokens.ts` — substitui `src/lib/motion.ts`)

```ts
/** Razão de parallax de uma camada coberta, como fração da largura. */
export const PARALLAX = 0.28;

export const BASE_D = {
  screenEnter: 0.26,  // camada do topo entrando em push/pop
  screenExit:  0.18,  // camada do topo saindo (deliberadamente mais curto)
  screenRest:  0.30,  // assentando no parallax frente/trás
  shade:       0.26,  // dim sobre a camada coberta
  replace:     0.16,  // troca no mesmo nível / step
  tab:         0.14,  // troca de aba
  overlay:     0.18,  // scrim + painel de overlay
  sheet:       0.28,
  step:        0.24,  // sub-tab / passo de wizard
  stepExit:    0.16,
  listItem:    0.18,
  listStagger: 0.03,
  navBar:      0.24,
  fab:         0.22,
  toast:       0.20,
  micro:       0.12,  // toggle, checkbox
} as const;

export const EASE = {
  enter:      [0.16, 1, 0.30, 1],  // desacelera forte ao chegar
  exit:       [0.40, 0, 1, 1],     // acelera ao sair (espelho da entrada)
  standard:   [0.40, 0, 0.20, 1],  // Material 3 "standard"
  emphasized: [0.20, 0, 0, 1],
} as const;

export const BASE_T = {
  /** Só aqui a velocidade importa: gesto de borda e drag-to-dismiss. */
  gesture: { type: 'spring', stiffness: 700, damping: 50, mass: 0.8 },
  navBar:  { type: 'spring', stiffness: 600, damping: 40, mass: 0.8 },
  fab:     { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  sheet:   { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 },
} as const;
```

**Por que 0.26 s e não os 0.3–0.5 s do iOS:** o app tem 4 abas + 1 perfil e a usuária
**rejeitou explicitamente** transições que fazem esperar (Fase 9 do backlog: "troca de
tela por toque", sem espera). 0.26 s serve a isso; a entrada é o que foi pedido, a saída
é limpeza que a usuária quer longe. Apple's HIG: *"don't make people wait for an
animation to complete before they can do anything"* e *"avoid adding motion to UI
interactions that occur frequently"*.

**Saída mais curta que entrada** (0.18 < 0.26) tem um bônus técnico: a janela em que a
criança que sai fica montada cai pela metade, e essa janela é exatamente onde mora a
família de bugs "children stuck no DOM com `key` trocando rápido demais"
(motion#2023/#2554/#3541).

### 5.2 Perfil reduzido (`src/lib/motion/profile.ts`)

```ts
export type MotionProfile = {
  readonly reduced: boolean;
  readonly d: typeof BASE_D;                 // durações escalonadas (×0.75)
  readonly t: Record<string, Transition>;   // springs colapsam em tweens curtos
  readonly screen: {
    front:    TargetAndTransition;
    behind:   (depth: number) => TargetAndTransition;
    enter:    (intent: NavIntent) => TargetAndTransition;
    exit:     (intent: NavIntent) => TargetAndTransition;
    shade:    (intent: NavIntent) => TargetAndTransition;
  };
};
```

Sob `reduced`: **todo alvo horizontal é 0**, só `opacity` se move (0.15 s), o **dim some
por completo** (não escurece nada) e o gesto de borda / drag-to-dismiss é
**desabilitado** (WCAG 2.3.3 é sobre movimento disparado por interação).

### 5.3 Contrato de variantes (`src/lib/motion/variants.ts`)

```ts
export const createScreenVariants = (width: number) => ({
  /** Descanso de uma camada `depth` níveis abaixo do topo. */
  behind: (depth: number): TargetAndTransition => ({
    x: -depth * PARALLAX * width,
    transition: { duration: BASE_D.screenRest, ease: EASE.standard },
  }),
  front: { x: 0, transition: { duration: BASE_D.screenRest, ease: EASE.standard } },

  enter: (i: NavIntent): TargetAndTransition =>
    i.kind === 'push' || i.kind === 'pop'
      ? { x: i.dir * width, opacity: 1,
          transition: { duration: BASE_D.screenEnter, ease: EASE.enter } }
      : { x: 0, opacity: 0,
          transition: { duration: BASE_D.replace, ease: EASE.standard } },

  /** O espelho de `enter`. Mesmo `dir`, com sinal trocado (D2). */
  exit: (i: NavIntent): TargetAndTransition => {
    if (i.kind === 'pop' && i.fromGesture) {
      // parte do ponto onde o dedo soltou — continuidade real
      return { x: [i.gestureX, i.gestureX + width * 0.4], opacity: [1, 0],
               transition: { duration: BASE_D.screenExit, ease: EASE.exit } };
    }
    if (i.kind === 'push' || i.kind === 'pop') {
      return { x: -i.dir * width, opacity: 1,
               transition: { duration: BASE_D.screenExit, ease: EASE.exit } };
    }
    return { x: 0, opacity: 0,
             transition: { duration: BASE_D.replace, ease: EASE.exit } };
  },

  shade: (i: NavIntent): TargetAndTransition =>
    i.kind === 'push' || i.kind === 'pop'
      ? { opacity: 1, transition: { duration: BASE_D.shade, ease: EASE.standard } }
      : { opacity: 0, transition: { duration: BASE_D.replace, ease: EASE.standard } },
});
```

> ⚠️ **`opacity: 1` nos alvos de push/pop.** Um push **não pode fazer fade** — sumir
> enquanto desliza é o maior sinal de "web app fingindo ser nativo".

### 5.4 Transporte do `intent` (corrige B2)

O `NavIntent` é escrito em **um lugar só**, sincronamente, antes de `setNavigationStack`:

```ts
// src/lib/motion/intent.ts
let current: NavIntent = IDLE_INTENT;
export const setMotionIntent = (i: NavIntent) => { current = i; };
export const consumeMotionIntent = (): NavIntent => {
  const i = current; current = IDLE_INTENT; return i;
};
```

`setStack` passa a fazer **uma** chamada com o intent inteiro (incluindo `gestureX` e
`fromGesture`) — nunca uma segunda chamada que reseta o payload. Ordem obrigatória:

```
EdgeSwipeBack (commit)
  → setMotionIntent({ …derived, gestureX: dragX, fromGesture: true })   ← escreve
  → stateRef.current.onBack() → setStack(next)                          ← NÃO reescreve
  → SlideScreen (destruído) chama screenVariants.exit() → consumeMotionIntent()
```

Isto é, `setStack` **preserva** um intent de gesto já escrito neste tick
(`if (!fromGesture) setMotionIntent(derived)`), em vez de sobrescrever.

**Alternativa futura (não nesta spec):** trocar o mutable por
`AnimatePresence custom={intent}` + `usePresenceData()`. É mais limpo e é a API
canônica, mas exige o núcleo imperativo do `ScreenLayer` (§10 da pesquisa) — risco alto
para o ganho. Fica como Slice G opcional, só depois que A→F estiverem verdes.

---

## 6. Superfícies: o mapa completo

Toda tela do app e o preset que ela recebe. Fonte: auditoria de `NavScreen.kind`
(`packages/navigation/src/types.ts:36-78`) × o dispatcher
(`src/shells/SharedScreenLayers.tsx`).

| Grupo | Telas | Camada | `kind` esperado | Preset |
|---|---|---|---|---|
| **Abas** | home, faculdade, estudos, biblioteca, perfil | slide | `tab` | `tabContent` (fade 0.14) |
| **Detalhe de curso** | `CourseDetailView` | slide (como modo de faculdade) | `push` | `screen` |
| **Sub-telas de curso** | `ClassNoteDetailScreen`, `RepertorioItemDetailScreen` | slide (**hoje compartilham o `slideKey` do curso!**) | `push` | `screen` |
| **Faculdade misc** | `InternshipDiaryView` | slide | `push` | `screen` |
| **Estudos** | `StudyFocusScreen` (`focus`/`revisar`/`leituras`/`historico`), `TccView` | slide | `push` | `screen` |
| **Perfil** | `StreakView`, `SyncScreen`, `Stickers` | slide | `push` | `screen` |
| **Semestre** | `TermHistoryScreen` | slide | `push` | `screen` — **corrige B1** |
| **Biblioteca** | `NotesScreen`, `TempleScreen`, `Concepts/Authors/Techniques/Comparisons`, `Families/Family`, `ApproachDetailView` | slide (modos) | `push` | `screen` |
| **Quiz** | `QuizGroupSelector`, `QuizGroupDetail`, `QuizLoadingScreen`, `QuizPlayer`, `QuizResultScreen` | slide | `push`/`replace` | `screen` (tela) · `step` (questão↔explicação) |
| **Overlays** | `ComposeNoteView`, `ClassNoteDetailWizard`, `NoteDetailWizard`, `NoteTransformWizard` | overlay | `push`/`pop` | `overlay` |
| **Wizards (12)** | task, exam, task-exam, course, flashcard, reading, session, internship, author, concept, material, **semester** | overlay | `push` | `overlay` na entrada · `step` entre passos |
| **Sub-tabs internas** | `CourseDetailView` (3 abas), passos de wizard | dentro da tela | — | `step` (40px, 0.24/0.16) |
| **Header** | brand ↔ detail | chrome | — | `chrome` — **swap instantâneo** (ver §8, anti-padrão 11) |
| **Bottom-nav** | barra + pill + label | chrome, **fora** do stage | — | `chrome` (spring; sai com `y`) |
| **FAB + menu** | | chrome | — | `chrome` (spring) |
| **Modais** | `ui/Modal` (center/top/bottom, drag-to-dismiss) | portal | — | `overlay` + `sheet` |
| **Toasts** | `ui/Toast` | portal | — | `toast` |
| **Listas** | home rows, atenção, grupos do quiz | inline | — | `listItem` + stagger cap |
| **Onboarding** | 6 passos | early-return (sem shell) | — | `step` — **precisa de `AnimatePresence`** (hoje não tem) |
| **BootSplash** | | sibling do shell | — | CSS fade (mantém; fora do sistema) |

### Bug adjacente a registrar

`classNote` e `repertorioItem` **compartilham o `slideKey` do curso**
(`navigationEngine.ts:537-581`) — abrir a anotação dentro do detalhe de disciplina não
troca a camada de slide, então o `CourseDetailView` (que tem sub-tab com estado local
em `useState`, `CourseDetailView.tsx:41-42`) **remonta junto**. É o mesmo mecanismo de
B1. No Slice A, esses kinds passam a ter `slideBaseKey` próprio.

---

## 7. User stories / critérios de aceite

1. **Um lugar só.** "Como usuária, não quero que cada fluxo 'dance' com uma física
   diferente." — *Aceite:* nenhum `duration`/`ease`/`spring`/`stiffness` inline em
   `src/` fora de `src/lib/motion/*`. Verificável por grep (Slice F).

2. **A tela que sai vai para o lado certo.** "Como usuária, quando volto, quero ver a
   tela anterior chegando, não indo embora." — *Aceite:* `screenVariants.exit` recebe um
   `NavIntent` completo e produz `x = -dir * W`; teste unitário para `push`, `pop`,
   `pop` com gesto, `tab`, `replace`.

3. **Continuidade do gesto de borda.** "Como usuária, quando arrasto a borda e solto,
   a tela não pula." — *Aceite:* no pop por gesto, `exit` parte de `x = gestureX`.
   **Teste de regressão novo** (`motion.test.ts`): o caminho
   `EdgeSwipeBack`→`setStack`→`exit` preserva `gestureX` (falha no código atual → B2).

4. **Toda tela entra e sai.** "Como usuária, não quero tela que 'aparece crua'." —
   *Aceite:* `deriveIntent` produz `kind !== 'none'` para todo delta de pilha, **incluindo
   `wizard → termHistory`**; nenhum `NavScreen.kind` mapeado cai no caso base.
   Teste de tabela sobre todos os kinds.

5. **Trocar de disciplina é lateral.** "Como usuária, ao trocar de uma matéria para outra
   quero uma troca limpa, não um empurrão de tela cheia." — *Aceite:* `c1 → c2` produz
   `kind: 'replace'` (crossfade 0.16), não `push`.

6. **Nada de animação mexe com o conteúdo.** "Como usuária, quero ler a tela enquanto
   ela entra." — *Aceite:* nenhuma transição de tela anima `height`/`width`/`top`/
   `margin`/`padding`; só `transform`/`opacity`.

7. **O foco me acompanha.** "Como usuária que uso teclado/leitor de tela, não quero que o
   Tab caia numa tela que está saindo." — *Aceite:* camadas não-topo ou saindo recebem
   `inert` + `aria-hidden`; o foco vai para o container da tela nova em
   `useLayoutEffect` (não em `onAnimationComplete`).

8. **Eu escolho o quanto de movimento.** "Como usuária, se movimento me uncomfortable,
   quero desligar." — *Aceite:* toggle em Perfil → personalização com
   `sistema | reduzido | completo`; persistido; vale para as duas pontas (variantes
   **e** CSS) **e** desabilita o gesto de borda.

9. **Os dois clientes iguais.** "Como usuária, o app no celular e na web têm a mesma
   sensação." — *Aceite:* `apps/mobile` não ganha nenhuma linha de motion próprio
   (garante por grep: `motion` só em `src/`, `apps/mobile` só monta os providers).

10. **Sem ficar preso no meio da animação.** "Como usuária, posso tocar rápido sem a
    tela travar." — *Aceite:* `key` monotônico (nunca string de rota), saída ≤ 0.18 s,
    no máximo 2 camadas montadas, `x` com **um único dono** por camada.

---

## 8. Anti-padrões (o que fica **de propósito** sem animação)

1. **Troca de aba (pares):** sem slide. 140 ms de opacity, ou nada.
2. **Pílula/indicador de sub-tab:** o movimento **do indicador** é o feedback.
3. **Primeiro paint:** `initial={false}` sempre. Cold start não anima slide-in.
4. **Texto e valor de input:** nunca animar `width` de valor, nunca typewriter.
5. **Toggle/checkbox:** `whileTap={{ scale: 0.96 }}` + haptic. Nada mais — são as
   interações mais repetidas do app.
6. **Scroll nativo e sticky header:** o scroll já é o movimento.
7. **Lista longa no load:** stagger **cap em 6 itens**; sem scroll-reveal.
8. **Confete:** já tem gate de reduz-motion; fica **fora** das transições de tela.
9. **`env(safe-area-inset-*)` e `bottom`:** nunca animar inset (é valor de runtime;
   animar = ler layout por frame). Animar `y`.
10. **Header e tela animando a mesma coisa:** o header **troca o conteúdo
    instantaneamente** e deixa a tela fazer o movimento. Crossfade de título **e**
    slide de tela = smear de sinal duplo. (Hoje `headerSwapVariants` faz crossfade
    0.24 s — encurta/instante por trás da tela, ver Slice C.)
11. **Atritos que não custam nada:** fechar um `Modal`, dismissing de toast, refresh de
    pull — **instantâneos**.

---

## 9. Fases (slices)

Cada slice entrega **verde** em `npm run lint` + `npm run test`, e é reversível
isoladamente.

### Slice A — O contrato `NavIntent` (fundação, baixo risco)

**Entrega:** `src/lib/motion/` novo (puro, sem React) com `tokens.ts`, `intent.ts`,
`profile.ts`, `variants.ts`, `index.ts`. `src/lib/motion.ts` vira **re-export +
depreciação** (nada quebra ainda).

- `deriveIntent(prev, next, opts)` por prefixo-comum.
- `resolveProfile(reduced)` com `screen` completo e a variante reduzida.
- `setMotionIntent`/`consumeMotionIntent`Transportando o intent **inteiro**.
- Testes: tabela de todos os pares (push/pop/tab/replace/none) + perfil reduzido.
- **Não toca** `SlideScreen`, `navigationEngine` nem componentes. Risco ≈ 0.

### Slice B — `setStack` emite `NavIntent` (corrige B1 e o `gestureX`)

- `navigationEngine.ts:337-354`: `setStack` deriva `NavIntent` com `deriveIntent` e
  chama `setMotionIntent(...)` **uma vez**; **preserva** `gestureX`/`fromGesture` quando
  o intent do gesto já foi escrito neste tick (B2).
- `setNavMotionContext`/`consumeNavMotionContext` de `motion.ts` viram ponteiros
  deprecated para as novas funções.
- `navDirection` (state) passa a ser derivado de `intent.dir` — 1 fonte só.
- **B1:** `slideBaseKey` ganha casos para `termHistory`, `classNote` e `repertorioItem`
  (§6), e a classificação `isOverlayChange` passa a considerar `termHistory` (que é
  filho de um overlay mas **é** camada de slide).
- ⚠️ **Ask first:** mexe em `slideKey` (núcleo de navegação) — mas o contrato de
  `navigationRegression.test.tsx` **precisa** ser estendido, não quebrado.
- **B3:** remover os 3 `layoutId` órfãos de `CourseDetailView.tsx:104,114,122`
  (ou ligar a origem no grid — decisão: **remover**, o shared-element do card→detalhe
  fica para um Slice próprio se a usuária pedir).
- **B4:** `kind` sem caso no dispatcher passa a log de dev em vez de cair na aba base.

**Gates:** `navigationRegression.test.tsx` estendido com o caso
`perfil → wizard semester → termHistory` (hoje sem transição) e com `classNote`/`repertorioItem`
tendo `slideKey` próprio. `motion.test.ts` **reescrito** para o contrato `NavIntent`
(o teste antigo, que chama `exit()` sem argumento e fixa `'18%'`/`'-5%'`, é
substituído — ver §10).

### Slice C — `SlideScreen` consome o perfil (física real da pilha)

- `SlideScreen` passa a ler `useMotionProfile()` e a_depth_ (`stack.length - 1 - index`)
  em vez de `direction`.
- Aplica o modelo de profundidade (§D3): a camada coberta anima `behind(depth)` com um
  `motion.div` de shade irmão (opacity ≤ 0.14 — orçamento de contraste do WCAG 1.4.3),
  **não** `filter: brightness()`.
- Header: `headerSwapVariants` vira troca **instantânea** (anti-padrão 10) e o
  mount/unmount do header (`HeaderNav.tsx:57-60`) usa os tokens + `getProfile`
  (hoje: 0.2/0.15 hardcoded, **sem** reduz-motion).
- Bottom-nav: `MobileAppShell.tsx:246-264` sai com `y` (o sumiço da barra **é** o sinal
  de que ela não vale aqui) usando `chrome`.
- Mantém o freeze de saída (`SlideScreen.tsx:30-39` + `lib/scroll.ts`) intacto.

**Riscos:** o shade é novo (checar contraste em todas as telas da biblioteca — texto
claro sobre fundo claro). Mitigação: `maxOpacity: 0.14` e nenhuma cor de texto abaixo
de `ceci-secondary` na área coberta.

### Slice D — Consolidação dos 5 presets e fim da dívida inline

- `WizardScaffold.tsx:63-67` + `CourseDetailView.tsx:29-33` + `QuizPlayer.tsx:124-128`
  → `stepVariants` (40px, 0.24/0.16) de `motion/variants.ts`.
- **~20 pontos inline** → tokens: bottom-nav, FAB (**resolver o conflito
  `easeInOut`+`spring`**), `Card3D`, `CardBaúEnvelope`, `ProgressBar`, `AnimatedNumber`,
  `SegmentedControl`, `StreakView`, `dither-*`, `EdgeSwipeBack` (spring do gesto ×2 →
  `BASE_T.gesture`), quiz (ease Material → `IOS_EASE_OUT`), `home/rows.tsx`
  (4ª curva → `EASE.standard`), `WizardScaffoldHeader`, `OnboardingScreen`
  (adicionar `transition`).
- `layout` → `layout="position"` onde for reordenação (`home/rows.tsx:28,78`).
  `ProgressBar`/`AnimatedNumber`/label da nav: `width` → `scaleX`.
- Regra nova em `check-boundaries.mjs`: **um só import specifier de motion**
  (`framer-motion`) em todo o repo — hoje já é verdade (só `framer-motion@13` está
  instalado; `motion@12` citado no `AGENTS.md` é drift), mas a regra protege contra
  alguém instalar `motion` e criar dois runtimes com contextos de presença separados.
  Manter a regra existente de "shared UI não brancha por plataforma".

### Slice E — Acessibilidade

- `inert={!isPresent || !isTop}` + `aria-hidden` nas camadas não-topo/saindo
  (a de saída hoje é focalizável por ~180 ms).
- Foco no container da tela nova (`tabIndex={-1}` + `focus({ preventScroll: true })`)
  em `useLayoutEffect` chaveado no topo — **nunca** em `onAnimationComplete`
  (atrasa o leitor de tela).
- Gesto de borda e drag-to-dismiss **desabilitados** sob `reduced`
  (WCAG 2.3.3 — movimento por interação).
- `shouldIgnoreTarget` (`swipe.ts:52-56`) guaranteeing WCAG 2.5.8 (24px): o gesto não
  dispara quando o toque começou em controle interativo.
- `aria-live` no container novo para anunciar a troca de tela.

### Slice F — Toggle de movimento no Perfil + docs

- Preferência `motionPref: 'sistema' | 'reduzido' | 'completo'`:
  - `usePersistentState` com chave nova **e seed em `src/data/empty.ts`**
    (mesma classe de `reminder`/`onboarding` — **NÃO** bumpa `SCHEMA_VERSION`,
    conforme AGENTS.md).
  - `MotionProfileProvider` acima do shell: `resolveProfile` + `MotionConfig
    reducedMotion={reduced ? 'always' : 'never'}` (sem branch em `NODE_ENV`).
  - `<div data-motion="reduced"|"full">` na raiz = **seam de teste** + hook CSS
    (`[data-motion="reduced"] * { transition-duration: 1ms !important }`).
  - UI em Perfil → personalização (3 opções com rótulo e descrição em pt-BR minúsculo).
- Reescrever `.context/animations.md` (§ atual está desatualizado) e corrigir
  `AGENTS.md` / `.context/architecture.md` (remover `VIEW_PULINHO` e
  `popLayout` da camada de tela; corrigir `motion@12` → `framer-motion@13`).
- Marcar SPEC-002 como concluída (a Slice D dela é este Slice D).

### Slice G (opcional, não necessário) — núcleo imperativo do `ScreenLayer`

Trocar o mutable de módulo por `AnimatePresence custom={intent}` + `usePresenceData()`,
com `x` como `MotionValue` por camada e `animate()` imperativo. Elimina de vez a classe
de "children stuck" e dá continuidade exata gesto↔exit. **Só depois de A→F verdes** e
só se a sensação de "salto" continuar em QA manual.

---

## 10. Modelo de dados / schema

**Sem bump de `SCHEMA_VERSION`** (regra do AGENTS.md: só quando o formato persistido em
`packages/domain|data` muda). Esta spec é UI/motion.

- `motionPref` é **preferência**, não entidade: chave `usePersistentState` nova +
  seed `'sistema'` em `src/data/empty.ts`, mesma classe de `reminder`/`onboarding`.
- `NavIntent`, tokens e perfil são **derivados e efêmeros** (nada persistido).
- Migração de `profile.semester`/nada: fora de escopo.

## 11. Boundaries

**Always**
- `npm run lint` + `npm run test` após **cada** slice; `npm run build` ao fim.
- `node .github/scripts/check-boundaries.mjs` ao tocar `src/shells`/`src/overlays`
  (obrigatório no PR e no release).
- Editar arquivos **só via `edit` tool** (proibido bulk-write com PowerShell —
  incidente 2026-08 que corrompeu 9 views).
- `prefers-reduced-motion` respeitado em **todo** ponto novo.
- Teste novo accompanyando cada correção de bug (B1–B4).

**Ask first**
- Alterar o **contrato** de `slideKey`/`overlayKey`/`screenKey`.
- Mudar a física do gesto de borda (iOS).
- Adicionar `layoutId` compartilhado (card → detalhe) — decisão de produto.
- Mexer no freeze de saída (`SlideScreen.tsx:30-39` / `lib/scroll.ts`).
- Tocar `packages/*` (não previsto; `packages/navigation` tem cópia **morta** de
  `derive.ts` que está fora de sync — ver §12).

**Never**
- Adicionar `react`/`@capacitor/*` em `packages/*`.
- Animar `height`/`width`/`top`/`padding`/`margin`/`env()` em transição de tela.
- Animar `position: fixed` dentro de um `motion` (containing-block trap:
  transform cria containing block para `fixed`; o Motion **deixa**
  `translateX(0px)` após a animação).
- `mode="popLayout"` na camada de tela (nada a refluir; e `popLayout` usa
  `position:absolute` + `anchorX/Y` = exatamente o hazard do offsetParent).
- `mode="wait"` com > 1 filho (o modo só suporta um).
- Reusar uma `key` de camada para outra instância (bug conhecido: children presos).
- Ignorar/reescrever `navigationRegression.test.tsx`.
- `replay` de `usePresence` sem `safeToRemove` (tela antiga presa no DOM).

## 12. Testes

### Contratos que hoje **têm** teste e **não podem** quebrar sem versão explícita

| Arquivo | O que fixa | Ação no Slice B |
|---|---|---|
| `src/lib/__tests__/navigationRegression.test.tsx` | `slideKey` único por revisão; **byte-idêntico** ao abrir/fechar overlay | **Estender** (termHistory, classNote, repertorioItem). SPEC-002 marca este teste como *never-ignore*. |
| `src/lib/__tests__/routing.test.ts` (544) | round-trip hash↔stack de ~40 rotas | Não tocar. `deriveIntent` **não** muda a forma da pilha (só a classificação) — a corretiva de B1 muda a *classificação*, não a pilha. |
| `src/lib/__tests__/quizStack.test.ts` | formas de pilha do quiz | Não tocar. |
| `src/lib/__tests__/swipe.test.ts` (230) | helpers puros de `swipe.ts` | Não renomear `EDGE_WIDTH`/`COMMIT_THRESHOLD`/`shouldIgnoreTarget`/`swipeTabDelta` (o curso e o gesto compartilham). |
| `src/lib/__tests__/headerConfig.test.ts` | `buildHeaderConfig` por kind | Não tocar. |
| `src/lib/__tests__/motion.test.ts` (43) | **shape** de `screenVariants.initial/exit` (`'18%'`, `'-5%'`, `[0,≥220]`) + consumo 1× do contexto | **Reescrever** para o contrato `NavIntent`. É a única quebra de teste deliberada da spec — announced no Slice B. |

### Contratos a **criar**

| Novo | Onde | Fecha |
|---|---|---|
| `deriveIntent` — tabela de todos os pares | `src/lib/__tests__/motion/intent.test.ts` | D1, B4 |
| `resolveProfile` — cheio × reduzido | `…/profile.test.ts` | D4, user story 8 |
| `screenVariants` — `push`/`pop`/`pop`+gesto/`tab`/`replace` | `…/variants.test.ts` | D2, B2 |
| **Regressão B2**: gesto→`setStack`→`exit` preserva `gestureX` | `…/intent.test.ts` | B2 |
| **Regressão B1**: `wizard→termHistory` muda a camada | `navigationRegression.test.tsx` | B1 |
| **Regressão B3**: nenhum `layoutId` órfão | `…/variants.test.ts` (ou lint) | B3 |
| `ScreenLayer`: camada saindo tem `inert`/`aria-hidden`; foco vai p/ a nova | `…/ScreenLayer.test.tsx` | E |
| Toggle: `data-motion="reduced"` + variantes sem `x` | `…/profile.test.tsx` | 8 |
| **Gate de grep**: zero `duration:`/`ease:`/`stiffness:` inline fora de `src/lib/motion/*` | `src/lib/__tests__/motion/noInlineTokens.test.ts` | 1 |

> O teste de grep é o que **torna a story 1 verificável** — sem ele, a dívida inline volta.

### O que **não** é testável em jsdom

Movimento visual real, `getBoundingClientRect` em transição, rAF. Mitigação: as
decisões ficam em `src/lib/motion/*` **puro** (sem React/DOM) — que é a razão de o Slice A
ser o primeiro. E QA manual no device com a matriz do §13.

## 13. Matriz de QA manual (após o Slice C)

| # | Cenário | Esperado |
|---|---|---|
| Q1 | Abrir/fechar detalhe de disciplina, sub-telas e histórico | push entra da direita, pop sai p/ a direita com parallax atrás |
| Q2 | Trocar de disciplina `c1 → c2` (não pilha) | crossfade curto, **sem** empurrão de tela cheia |
| Q3 | `#/perfil/semestre` → histórico → voltar | transição em ambos os sentidos (B1 corrigido) |
| Q4 | Anotação dentro do detalhe de disciplina | camada própria; a sub-tab do curso **persiste** ao voltar |
| Q5 | Gesto de borda: arrastar e soltar antes do limiar | spring de volta, sem pulo |
| Q6 | Gesto de borda: arrastar além do limiar e soltar | a tela **continua de onde o dedo soltou** (B2) |
| Q7 | Tocar 5 telas rápido em sequência | nenhum elemento preso no DOM, nenhum transform travado |
| Q8 | Tela rolada → abrir outra → voltar | freeze pixel-a-pixel (sem regressão do `lib/scroll.ts`) |
| Q9 | Perfil → toggle "reduzido" | tudo vira fade curto, **sem** parallax, **gesto de borda desabilitado** |
| Q10 | Wizard: 5 passos + fechar | overlay entra/sai; passos deslizam 40px; base não remonta |
| Q11 | Bottom-nav: base ↔ tela auxiliar | barra sai com `y` (não vira fantasma) |
| Q12 | Teclado: `Tab` repetido durante um pop | nunca cai na tela que está saindo (E) |
| Q13 | App nativo (iOS) — mesmo gesto pelo plugin nativo | idêntico ao web |
| Q14 | Chunk lento: abrir tela cold (2G throttling) | skeleton **dentro** da animação, sem tela crua; sem skeleton infinito em erro |

## 14. Não-objetivos

- **Não** converter para stage `position:absolute` com container de scroll próprio
  (§D3 — ganho do modelo de profundidade mantido, custo desproporcional).
- **Não** shared-element transition (card → detalhe). Os `layoutId` órfãos são removidos,
  não ligados.
- **Não** voltar ao swipe entre abas (Fase 9 revertida a pedido da usuária).
- **Não** iOS "interactive pop" **pleno** (tela anterior visível + sombra UIKit) — exige
  plugin Capacitor em Swift + rebuild nativo. Esta spec entrega **continuidade do
  transform**, não a transição nativa do sistema.
- **Não** tocar `apps/desktop` (removido) nem o workspace Rust (`cecistudy-rust/`) —
  a UI Flutter não existe ainda; `packages/navigation/src/derive.ts` (cópia morta) fica
  como está, só registrada em §15.

## 15. Dívida registrada (não executada aqui)

| Item | Onde | Nota |
|---|---|---|
| `packages/navigation/src/derive.ts` é **duplicata morta** de `navigationEngine` (já fora de sync) | `packages/navigation/src/derive.ts:95-186` | Se `deriveIntent` ficar puro, Promote-o a `packages/navigation` e apague a cópia de `navigationEngine` — mas isso é `packages/*` ⇒ **ask first**. |
| `knowledge-graph` / `projects` / `inbox` declarados e sem UI | `packages/navigation/src/types.ts:73-78` | Código morto de desktop. Remover ou implementar (decisão de produto). |
| Preload engole falha de chunk | `SharedScreenLayers.tsx:124` | Skeleton infinito sem UI de erro. Corrigir no mesmo PR do Q14, se sair. |
| `NotesScreen.tsx:20` importa `motion`/`AnimatePresence` sem usar | import morto | Remover no Slice D. |
| Doc drift (`VIEW_PULINHO`, `popLayout`, `motion@12`) | `AGENTS.md`, `.context/architecture.md`, `.context/animations.md` | Slice F. |

## 16. Sucesso

- [ ] Um contrato (`NavIntent`) e uma fábrica (`createScreenVariants`); `motion.ts`
      antigo só re-exporta.
- [ ] **B1–B4 corrigidos**, cada um com teste de regressão.
- [ ] `termHistory`, `classNote`, `repertorioItem` com `slideKey` próprio.
- [ ] Zero `duration`/`ease`/`spring` inline fora de `src/lib/motion/*` (gate de grep).
- [ ] Camadas fora do topo com `inert`; foco no `useLayoutEffect`.
- [ ] Toggle de movimento no Perfil funcionando nas duas pontas (variantes + CSS).
- [ ] Q1–Q14 verdes em QA manual (web + iOS).
- [ ] `npm run lint` + `npm run test` + `npm run build` +
      `node .github/scripts/check-boundaries.mjs` verdes ao fim de cada slice.
- [ ] SPEC-002 marcada como concluída; docs de `.context/` sem drift.

---

## Referências

**Código interno (esta auditoria)**
- `src/lib/motion.ts` (tokens + `screenVariants` + `overlayVariants` + `sheetVariants` + `motionCtx`)
- `src/shells/MobileAppShell.tsx:168-264` (4 `AnimatePresence` do shell) · `:212-221` slide · `:224-240` overlay
- `src/shells/SlideScreen.tsx:23-75` · `src/lib/scroll.ts:11-20` (freeze)
- `src/shells/SharedScreenLayers.tsx:109-127` (preload) · `:134-293` / `:299-327` (dispatchers)
- `src/context/navigationEngine.ts:337-354` (`setStack`) · `:487-600` (keys)
- `src/components/ui/EdgeSwipeBack.tsx:75-101` · `src/lib/swipe.ts`
- `src/components/HeaderNav.tsx:57-60,70-254` · `src/components/views/CourseDetailView.tsx:29-33,104-122,182-208`
- `src/components/wizards/WizardScaffold.tsx:63-67,138-170` · `src/components/quizzes/QuizPlayer.tsx:117-128`
- `packages/navigation/src/types.ts:36-78` (`NavScreen`)

**Pesquisa externa (fatos citados)**
- Modos do `AnimatePresence` e o hazard de offsetParent: https://motion.dev/docs/react-animate-presence
- Tabela de mode-por-cenário do Motion: https://motion.dev/examples/react/animate-presence-modes
- `AnimatePresence custom` + `usePresenceData()`: https://motion.dev/docs/react-animate-presence#access-presence-data
- `custom` sobrescreve o do filho: https://sinja.io/blog/direction-aware-animations-in-framer-motion
- Bugs de `key` reutilizado / filhos presos: motion#2023, #2554, #3541, #2618
- Transform (mesmo identidade) cria containing block p/ `fixed`:
  https://github.com/drott/csswg-drafts/commit/12aa3b4d0eeeed87039b1aef599f1886f2e7a197
  · Motion deixa `translateY(0%)` após animar: framer#1117, framer#2201
- Springs de duração zeram a velocidade herdada (fonte do Motion):
  https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/generators/spring.ts
- Só `transform`/`opacity` são compositor-only: https://motion.dev/docs/performance
- `will-change` blur: https://motion.page/docs/sdk/performance
- `height:"auto"` exige medir o DOM: https://github.com/motion/motion/issues/2333
- `MotionConfig reducedMotion` mantém opacity: https://motion.dev/docs/react-motion-config
- Apple's HIG Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- WCAG 2.2 (2.3.3, 2.2.2, 2.3.1, 2.5.7, 2.5.8, 2.4.11, 1.4.3): https://www.w3.org/TR/WCAG22/
- Material Design 3 (durações 0.15/0.2/0.3/0.45/0.5, curvas standard/emphasized)
- `env(safe-area-inset-*)` em WKWebView: WebKit 217754, 236445, ionic-team/capacitor-keyboard#23
