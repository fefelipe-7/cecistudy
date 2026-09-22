# Spec: Motion de navegação + espaçamento vertical (quase-nativo)

> Plano para evoluir as animações de navegação do cecistudy para um comportamento
> "quase nativo" (iOS/Android) e eliminar os vãos verticais em excesso em telas
> auxiliares (ex.: sub-tabs do detalhe da disciplina). Origem: auditoria de UI/UX
> de 2026-09 sobre `src/lib/motion.ts`, `src/shells/*`, `EdgeSwipeBack` e quiz/wizards.

> **Status (2026-09): Slice A ✅ · Slice B ✅ · Slice C ✅ (gates verdes: lint + 727 testes + build).**
> Slices D (footers fixed, quiz eases, springs) pendentes.

## Objetivo

1. **Motion coerente e nativo-feeling.** Transições de push/pop/tab, header, bottom-nav,
   gesto de borda e wizards devem seguir UMA metáfora única, dirigida por **tokens de
   movimento** (`src/lib/motion.ts`), com `prefers-reduced-motion` respeitado em todos os
   pontos. Hoje há springs/easings soltos (~11 pontos) e metáforas misturadas (ease
   "Material" no quiz, fade+scale genérico no push em vez de movimento direcional).
2. **Fim do vão vertical em excesso.** Telas auxiliares empilhadas sobre uma aba
   (detalhe de disciplina, notas, templo, quiz, study…) reservam **80px** do `main`
   para a bottom-nav **mesmo com a barra escondida**, somando aos paddings próprios
   das views (ex.: `CourseDetailView` `pb-24` + main `pb-[calc(5rem+…)]` = ~176px de
   espaço morto abaixo do conteúdo).
3. **Base não remonta ao abrir/fechar overlay.** Abrir compose/wizard/detalhe de nota
   bumpa `navigationRevision`, mudando o `slideKey` da tela-base → a view de baixo
   desmonta/remonta (perde estado local, ex.: a sub-tab ativa do `CourseDetailView`
   volta para "informações").

## User Stories / Critérios de aceite

1. **Espaço vertical correto.** "Como usuária, em qualquer tela auxiliar (detalhe da
   disciplina, notas, templo) não quero rolar e encontrar uma faixa gigante de nada
   abaixo do conteúdo; quero só o respiro que existe por causa dos botões fixos."
   - Aceite: com a bottom-nav escondida, o `main` usa padding pequeno (`pb-6`);
     a reserva de 80px só existe quando a barra está visível (topo = tab).
   - Aceite: cada view auxiliar mantém o próprio clearance apenas quando tem botão
     fixo (ex.: `CourseDetailView` mantém respiro para a FAB).
2. **Overlay não destrói a base.** "Como usuária, se estou na sub-tab 'aulas' da
   disciplina e anoto uma aula (overlay), ao fechar eu quero voltar exatamente para
   onde estava, com a mesma sub-tab ativa."
   - Aceite: pushes/pops de overlay (compose/composeDetails/wizard/noteDetail/
     noteTransform) **não** mudam o `slideKey`; a camada de slide fica intacta.
3. **Push/pop com direção e parallax.** "Como usuária, quando abro uma tela sinto o
   movimento de empilhar; quando volto, a tela anterior já está lá embaixo e o gesto
   de borda acompanha meu dedo."
   - Aceite: `screenVariants` direcionais (slide + parallax + dim da tela anterior
     no pop), com tab = crossfade curto (mantido). Slices intermediárias não quebram
     o comportamento atual de fade+scale.
4. **Tokens sem exceção.** "Como usuária, não percebo que cada fluxo 'dança' com uma
   física diferente."
   - Aceite: nenhum `spring`/`ease`/`duration` inline divergente dos tokens em
     `src/lib/motion.ts`; reduz-motion cobrindo header, quiz e FAB.

## Comandos

Gate após qualquer mudança (AGENTS.md):
- `npm run lint` — typecheck (`tsc --noEmit`).
- `npm run test` — Vitest. Foco desta spec: `src/lib/__tests__/navigationRegression.test.tsx`
  (remount), possíveis testes novos para `setStack` em `navigationEngine`.
- `npm run build` — Vite → `dist/`.
- `node .github/scripts/check-boundaries.mjs` — obrigatório ao tocar `packages/*`
  (esta spec **não** toca `packages/*` — todo o trabalho é em `src/` e `docs/`).

## Estrutura de pastas / arquivos afetados

| Arquivo | Mudança | Slice |
|---|---|---|
| `src/shells/MobileAppShell.tsx` | Padding do `main`: `hasTabBase` → `isBottomNavVisible` (reserva 80px só com barra visível) | A |
| `src/context/navigationEngine.ts` | Remover `hasTabBase` (dead após Slice A) · `setStack` só bumpa `navigationRevision` quando a camada de slide muda (overlays não remontam a base) | A/B |
| `src/context/AppContext.tsx` | Remover `hasTabBase` do tipo `AppContextValue` | A |
| `src/lib/motion.ts` | Tokens novos (parallax/dim/scale de pop, spring de retorno do gesto, easing do quiz) + `screenVariants` direcionais | C |
| `src/components/ui/EdgeSwipeBack.tsx` / `src/lib/swipe.ts` | Gesto com tela anterior empurrada (parallax + dim), seguir o dedo no pop | C |
| `src/components/HeaderNav.tsx` | Usar tokens (`PUSH_DURATION`/`getTransition`), reduz-motion | C |
| `src/components/views/CourseDetailView.tsx`, `NotesScreen`, quiz, wizards | Footers `fixed` sem salto no pop (freeze compatível) | D |
| Quiz (`QuizPlayer`, `QuizResult...`, etc.) | eases `IOS_EASE*`, sem `mode="wait"` no player | D |
| Springs inline (bottom-nav, FAB, Streak, ProgressBar...) | → `iOS_SPRING`/`getTransition`; `width` → `scaleX` | D |

## Diagnóstico (resumo da auditoria 2026-09)

### Padrão atual (bom)
- Tokens centrais em `src/lib/motion.ts` (eases iOS, `iOS_SPRING`, durações).
- Freeze de saída do `SlideScreen` (`usePresence` + `fixed` na posição exata), evitando
  pulo de scroll no push/pop.
- Camadas separadas: slide (push/pop de 1º nível) × overlay (compose/wizard) × header ×
  bottom-nav (fade sincronizado). `MotionConfig reducedMotion="user"` global.
- Gestos: edge-swipe back (web) e plugin nativo iOS; sheet com drag-to-dismiss.

### Problemas (com `arquivo:linha`)
1. **Vão vertical em telas auxiliares (P0, novo desta spec):** `hasTabBase` mantém
   `pb-[calc(5rem+env(safe-area-inset-bottom,0px))]` no `main` mesmo com bottom-nav
   escondida (`MobileAppShell.tsx:179-183` + `navigationEngine.ts:400-403`). Combinado
   ao `pb-24` do `CourseDetailView.tsx:100` gera ~176px de espaço morto nas sub-tabs do
   detalhe da disciplina; `ClassNoteDetailScreen.tsx:69` tem `pb-32`.
2. **Remount da base em overlay (P0):** `setStack` bumpa `navigationRevision` sempre
   (`navigationEngine.ts:316-319`); `slideKey` inclui a revisão (`:547`) → abrir
   compose/wizard/nota desmonta a tela de slide e perde estado (sub-tab ativa, busca…).
3. **Pop sem direção:** `screenVariants` faz fade+scale nos dois sentidos
   (`motion.ts:55-79`); falta parallax/dim da tela anterior.
4. **Footer `fixed` pula no pop** de telas roladas (contido pelo `translateY(-scrollY)`
   do freeze em `SlideScreen.tsx:42-48`) — telas de quiz/wizard com rodapé fixo.
5. **Incoerência de física:** springs inline ≠ `iOS_SPRING` (bottom-nav `:36/:66/:89`,
   CourseDetail `CourseDetailView.tsx:192`, Streak `:124`, FAB `floating-action-menu.tsx:39-45`,
   ProgressBar/AnimatedNumber); quiz com eases Material `[0.4,0,0.2,1]` e `mode="wait"`
   (`QuizPlayer.tsx:117-125`).
6. **Header sem reduz-motion** (`HeaderNav.tsx:52-53`, durações hardcoded).
7. **Animações de layout** (`width` em `ProgressBar.tsx:28-29` e `QuizResultScreen.tsx:56-60`)
   em vez de transform-only.

## Plano (fases / slices)

### Slice A — Espaciçamento vertical (P0, baixo risco)
- `MobileAppShell.tsx`: `app.hasTabBase` → `app.isBottomNavVisible` no padding do `main`
  (o `transition-[padding] duration-[220ms]` já existente suaviza a mudança).
- Remover `hasTabBase` de `navigationEngine.ts` (def + value spread) e `AppContext.tsx` (tipo).
- Verificação: sub-tabs do detalhe da disciplina terminam logo após o conteúdo (só o
  respiro da FAB); gates verdes.

### Slice B — Overlay não remonta a base (P0, toca o núcleo de navegação)
- `setStack`: criar `OVERLAY_KINDS = { compose, composeDetails, wizard, noteDetail,
  noteTransform }`; bumpar `navigationRevision` **apenas** quando nenhum dos dois tops
  (antes/depois) é overlay — ou seja, `slideKey` só muda em navegação real da camada 1.
- Teste de regressão: abrir/voltar em overlay mantém o `slideKey` da base.
- Verificação: fechar um wizard/compose volta à sub-tab e ao estado anteriores.

### Slice C — Motion direcional quase-nativo (P1, médio)
- `screenVariants` direcionais: entrada da nova tela desliza + parallax suave; no pop a
  tela anterior revela com parallax/dim (template fino; manter fade+scale como fallback
  reduz-motion). Tab continua crossfade puro.
- Edge-swipe: tela anterior acompanha o dedo (camada extra sem `transform` no wrapper),
  dim começa a 10% do arrastro; spring de retorno vira token.
- Header: usar tokens + `getTransition`.

### Slice D — Consistência e fluidez (P1/P2)
- Footers `fixed` → portal ou compensação no freeze (sem salto no pop).
- Quiz: eases `IOS_EASE*`, player sem `mode="wait"` (crossfade), `scaleX` nas barras.
- Springs → `iOS_SPRING`; `prefersReducedMotion` duplicado consolidado em `motion.ts`.

## Modelo de dados / schema

**Sem mudanças de schema.** Motion/UI não bumpa `SCHEMA_VERSION` (regra do AGENTS.md).
A remoção de `hasTabBase` é só estado derivado de navegação (não persistido).

## Boundaries

- **Always:** rodar `npm run lint` + `npm run test` após cada slice; `npm run build` na
  primeira entrega; manter `prefers-reduced-motion`; editar arquivos só via `edit` tool
  (proibido bulk-write com PowerShell — incidente 2026-08).
- **Ask first:** alterar `slideKey`/`overlayKey`/`screenKey` (núcleo de navegação);
  tocar `packages/*` (não previsto); mudar a física do gesto iOS nativo.
- **Never:** adicionar react/@capacitor em `packages/*`; ignorar o teste
  `navigationRegression.test.tsx`; deixar a base remontando sem feedback visual.

## Sucesso

- Sem vãos >~100px de espaço morto em telas auxiliares roláveis.
- `slideKey` estável ao abrir/fechar overlay (teste verde).
- Nenhum `ease`/`spring` divergente dos tokens; quiz sem gap de `mode="wait"`.
- `npm run lint` + `npm run test` + `npm run build` verdes ao fim de cada slice.