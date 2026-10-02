# Tarefas: Sistema unificado de transições e montagem de telas (SPEC-007)

> Spec: [`docs/specs/SPEC-007-sistema-unificado-de-transicoes-e-montagem-de-telas.md`](../docs/specs/SPEC-007-sistema-unificado-de-transicoes-e-montagem-de-telas.md)
> Origem: auditoria exaustiva de 2026-09 de todas as `NavScreen` + todos os `motion.*`/`AnimatePresence`
> do app, cruzada com pesquisa de padrões atuais (framer-motion 13 / WebView iOS).
>
> **Relação com SPEC-002:** esta spec completa a Slice D dela (nunca feita) e adiciona
> o contrato único de direção, a montagem previsível e a acessibilidade. Onde as duas se
> sobrepõem, **SPEC-007 prevalece**; a SPEC-002 é marcada concluída no Slice F.
>
> **Gate por slice (obrigatório, AGENTS.md):** `npm run lint` + `npm run test`.
> `node .github/scripts/check-boundaries.mjs` ao tocar `src/shells`/`src/overlays`.
> `npm run build` ao fim de cada slice que muda wiring de tela.
>
> **Regra de edição (AGENTS.md):** sempre via `edit` tool — proibido bulk-write com
> PowerShell (incidente 2026-08 corrompeu 9 views com U+FFFD).

---

## Bugs que esta fase fecha (marcados na spec como §2.2)

| # | Bug | Arquivo | Slice |
|---|---|---|---|
| **B1** | `termHistory` não tem transição nenhuma (nem entrada nem saída) | `navigationEngine.ts:342-343, 537-581` | B |
| **B2** | `gestureX` do gesto de borda é apagado antes de lido | `EdgeSwipeBack.tsx:86` → `navigationEngine.ts:345` | B |
| **B3** | 3 `layoutId` órfãos (sem elemento de origem) | `CourseDetailView.tsx:104,114,122` | B |
| **B4** | `knowledge-graph`/`projects`/`inbox` declarados e sem render — caem na aba base | `packages/navigation/src/types.ts:73-78` | B |
| **B5** | `classNote`/`repertorioItem` compartilham o `slideKey` do curso (remonta a sub-tab) | `navigationEngine.ts:537-581` | B |

---

## Slice A — O contrato `NavIntent` (fundação, baixo risco) ✅

**Entrega:** `src/lib/motion/` novo, **puro** (sem React, sem DOM, sem import de
framer-motion além de tipos) com `tokens.ts`, `intent.ts`, `profile.ts`, `variants.ts`,
`index.ts`. `src/lib/motion.ts` vira **re-export + depreciação** — nada quebra ainda.

**Gate do slice:** `npm run lint` ✅ + `npm run test` ✅ (**101 arquivos / 1042 testes**,
-era 98/987) + `npm run build` ✅.

- [x] **A.1** `src/lib/motion/tokens.ts` — `PARALLAX`, `SHADE_MAX_OPACITY`, `BASE_D`, `EASE`, `BASE_T`
  - Acceptance: todos os números da spec §5.1 presentes e comentados
  - Verify: `npm run lint`
  - Files: `src/lib/motion/tokens.ts`

- [x] **A.2** `src/lib/motion/intent.ts` — `NavKind`, `NavIntent`, `deriveIntent` (prefixo-comum),
  `setMotionIntent`/`consumeMotionIntent` (intent **inteiro**, nunca sobrescrito)
  - Acceptance: classifica `none`/`push`/`pop`/`tab`/`replace`; `dir` = ±1/0
  - Verify: `npm run lint` + testes de tabela (**18 testes**)
  - Files: `src/lib/motion/intent.ts`
  - **Nota:** `screenIdentity` ignora payload volátil (`quiz-play.state`, `quiz-result.answers`)
    — deep-equal daria `replace` onde houve só troca de payload dentro da mesma tela.

- [x] **A.3** `src/lib/motion/profile.ts` — `MotionProfile` + `resolveProfile(reduced)`
  - Acceptance: perfil cheio (durações base) e perfil reduzido (só fade, sem dim, sem `x`)
  - Verify: `npm run lint` + testes (**11 testes**)
  - Files: `src/lib/motion/profile.ts`
  - **Nota:** a largura **não** mora no perfil (é fato de layout, muda com resize) —
    quem a aplica é `createScreenTargets(width, profile)`.

- [x] **A.4** `src/lib/motion/variants.ts` — `createScreenTargets(width, profile)` +
  `createScreenVariants` + presets `step`/`tab`/`overlay`/`chrome`/`toast`/`listItem` + `staggerFor`
  - Acceptance: `exit` = espelho de `enter` (`x = -dir * W`); `pop` com gesto parte de `gestureX`;
    `opacity: 1` nos alvos de push/pop (push **não** faz fade)
  - Verify: `npm run lint` + testes (**26 testes**)
  - Files: `src/lib/motion/variants.ts`

- [x] **A.5** `src/lib/motion/index.ts` — **única** superfície pública + `src/lib/motion.ts`
  como shim de compatibilidade re-exportando tudo
  - Acceptance: nenhum importador existente quebra; `motion.ts` fica só com re-exports + legado
  - Verify: `npm run lint` + `npm run test` (suíte inteira verde, +55 testes)
  - Files: `src/lib/motion/index.ts`, `src/lib/motion.ts`

- [x] **A.6** Testes do Slice A — **55 testes** em 3 arquivos
  - `src/lib/__tests__/motion/intent.test.ts` (18)
  - `src/lib/__tests__/motion/profile.test.ts` (11)
  - `src/lib/__tests__/motion/variants.test.ts` (26)
  - **Regressão coberta:** `c1 → c2` classifica `replace` (mesmo comprimento de pilha, então
    a direção-por-`stack.length` errava) e `wizard semester → termHistory` classifica `push`
    (era `none`, causa do bug B1)
  - Verify: `npm run test -- src/lib/__tests__/motion/`
  - Files: `src/lib/__tests__/motion/*.test.ts`

### Bugs encontrados pelos testes do próprio Slice A

Os testes do slice pagaram o custo de testar antes de propagar:

- 🐛 **`toFixed(3)` destruía a precisão dos steps.** `(0.03 × 0.75).toFixed(3)` = `0.022`,
  não `0.0225` (0.0225 não é exatamente representável em float) — e a partir daí
  **todo** token do perfil reduzido ficava levemente errado. Removido o arredondamento.
- 🐛 **`behind(0)` devolvia `-0`** (`-0 * PARALLAX * W`) → `translateX(-0px)` e quebra
  igualdade por `Object.is`. Guardado: `depth === 0 ? 0 : …`.
- 🐛 **O perfil reduzido **omitia** `x`** em `enter`/`exit`/`behind`. Se a tela parasse a
  meio caminho em `x=400` e o perfil virasse reduzido, omitir `x` deixaria o transform
  **travado** onde estava. Agora `x: 0` é sempre explícito (é a mesma classe do bug
  documentado em framer#380).


---

## Slice B — `setStack` emite `NavIntent` (fecha B1, B2, B3, B5) ✅

⚠️ **Ask first:** mexe no contrato de `slideKey` (núcleo de navegação). O contrato de
`navigationRegression.test.tsx` foi **estendido**, nunca quebrado.

**Gate do slice:** `npm run lint` ✅ + `npm run test` ✅ (**102 arquivos / 1075 testes**,
 Slice A fechou em 1042) + `npm run build` ✅ + `check-boundaries` ✅.

- [x] **B.1** `setStack` deriva `NavIntent` e chama `setMotionIntent` **uma vez**,
  preservando `gestureX`/`fromGesture` quando o gesto já escreveu neste tick (**fecha B2**)
  - Acceptance: `EdgeSwipeBack` → `onBack()` → `setStack` → `exit` preserva `gestureX`
  - Files: `src/context/navigationEngine.ts:337-360`, `src/components/ui/EdgeSwipeBack.tsx`
  - `EdgeSwipeBack` ganhou `gesturePopIntent(dragX, reduced)` em vez de
    `setNavMotionContext(-1, dragX)` — e **não** ganhou plumbing de pilha (é UI
    compartilhada; o gesto só sabe que vai ocorrer um pop e onde o dedo soltou).

- [x] **B.2** `navDirection` (state) passa a ser derivado de `deriveIntent(...).dir`
  - Acceptance: uma fonte só
  - Files: `src/context/navigationEngine.ts`
  - Nota: `navDirection` continua no tipo público (3 consumidores no shell). Migrar
    os consumidores para `intent` éSlice C (quando o `SlideScreen` passa a ler o perfil).

- [x] **B.3** `slideBaseKeyOf` / `overlayKeyOf` / `slideTopOf` / `slideLayerChanged` em
  `src/context/slideKeys.ts` —ternário de 20 níveis virou `switch` puro e testável
  (**fecha B1 e B5**)
  - Acceptance: `perfil → wizard semester → termHistory` muda a camada; `classNote` e
    `repertorioItem` têm `slideKey` próprio (a sub-tab do curso **persiste**)
  - Files: `src/context/slideKeys.ts` (novo), `src/context/navigationEngine.ts`
  - **`isOverlayChange` foi substituído pela regra real**: "o `slideBaseKey` mudou?"
    em vez do proxy "nenhum dos dois topos é overlay". O proxy quebrava em B1.

- [x] **B.4** `UNKNOWN_SLIDE_KINDS` + `useUnknownSlideKindWarning` — kind sem tela vira
  log de dev, não queda silenciosa na aba base (**fecha B4**)
  - Files: `src/context/slideKeys.ts`, `src/shells/SharedScreenLayers.tsx`
  - No-op em produção (quem empilha kind sem UI é bug de código, não da usuária).

- [x] **B.5** Remover os 3 `layoutId` órfãos (**fecha B3**)
  - Acceptance: `course-hero`/`course-icon-bg`/`course-title` fora do repo
  - Files: `src/components/views/CourseDetailView.tsx:99-156`

- [x] **B.6** Reescrever `motion.test.ts` para o contrato `NavIntent` (7 testes)
  - ⚠️ **Única quebra de teste deliberada da spec.** As asserções sobre o shape legado
    (`'18%'`, `'-5%'`, `[0, ≥220]`) foram substituídas pelo contrato
    (`gesturePopIntent`, canal de direção, regressão do `gestureX`).
  - Files: `src/lib/__tests__/motion.test.ts`

- [x] **B.7** Gate do Slice B + testes novos
  - `src/lib/__tests__/motion/slideKeys.test.ts` — **26 testes**
  - `navigationRegression.test.tsx` — **+2 regressões** (overlay sobre disciplina, B1)

### Gap do SPEC-002 que o Slice B descobriu

O guard `isOverlayChange` da SPEC-002 Slice B **só funcionava quando a base era uma
aba**. Abrir um compose *a partir do detalhe de uma disciplina* trocava a
`slideKey` de `course-c1` para `tab-faculdade` e **remontava a tela de baixo**
(perdendo a sub-tab ativa). O teste de regressão existente não pegava porque usava
`[tab] → [tab, compose]`, onde as duas chaves coincidem por acaso.

Corrigido com `slideTopOf(stack)`: a camada de slide é identificada pelo **topo
não-overlay** da pilha, não pelo topo cru. A `slideKey` no engine também passou a
usar `slideTopOf` (não `currentScreen`), senão o mesmo bug voltava por outro lado.

### Bug encontrado pelos testes do próprio Slice B

🐛 **Meu `slideLayerChanged` inicial estava errado** (usava o topo cru, então
`[faculdade, c1] → [faculdade, c1, compose]` acusava mudança). Os testes pegaram
na hora e levaram à descoberta do gap do SPEC-002 acima.

### Dívida registrada (não executada aqui)

- `screenKey` (o outro ternário de 20 níveis, `navigationEngine.ts:487-528`) é
  **produzido e exposto mas nunca consumido** pelo shell. Converter para o mesmo
  `switch` é mecânico, mas é public-API — deferido para um slice de limpeza.


---

## Slice C — `SlideScreen` consome o perfil (física real da pilha)

### C.1 — Transição de tela de tela cheia, com o `NavIntent` ✅

**Gate:** `npm run lint` ✅ + `npm run test` ✅ (102 / 1075) + `npm run build` ✅ + `check-boundaries` ✅

- [x] **C.1a** `MotionProfileProvider` + `useMotionProfile()` em `src/components/motion/`
  - `MotionConfig reducedMotion` como **piso de segurança**; a verdade é o perfil.
    **Sem branch em `NODE_ENV`** (a doc do Motion sugere, mas isso torna o caminho
    reduzido não testável em dev).
  - Montado **dentro do shell** (`MobileAppShell` → `MobileAppShellInner`), então os
    dois clientes (web e `apps/mobile`) ganham sem mexer nos entrypoints — e o
    onboarding, que também anima, fica coberto.
  - `data-motion="reduced"|"full"` na raiz = seam de teste + hook de CSS (F).
  - Files: `src/components/motion/MotionProfileProvider.tsx` (novo), `src/shells/MobileAppShell.tsx`

- [x] **C.1b** `SlideScreen` usa `createScreenVariants(width, profile)` e recebe o
  `NavIntent` completo (não o escalar `direction`)
  - `push` entra da direita **cheia** (antes: 18%), `pop` sai para a direita cheia
    **partindo do ponto onde o dedo soltou** (B2 visível pela primeira vez),
    `tab`/`replace` são crossfade curto — inclusive ao trocar de disciplina, que
    antes caía no mesmo "fade de tab".
  - Largura medida 1× no mount + `resize` (nunca lida no `pointermove`, que é o frame).
  - Mantido o **freeze de saída** intacto (`SlideScreen.tsx` + `src/lib/scroll.ts`).
  - Files: `src/shells/SlideScreen.tsx`, `src/shells/MobileAppShell.tsx`,
    `src/context/navigationEngine.ts` (`navIntent` no contexto), `src/context/AppContext.tsx` (tipo)

- [x] **C.1c** `navIntent` vai para o estado **e** para o canal
  - O `intent` presente chega **por prop** (o React re-renderiza a instância presente);
    o canal de módulo fica só para o `exit`, cujas props estão congeladas.
  - Duas escotilhas, **uma** derivação. Antes: `navDirection` (state) + `motionCtx`
    (módulo) derivados em lugares diferentes.

- [x] **C.1d** `screenVariants` legado marcado `@deprecated` (o `SlideScreen` já
  migrou — não há mais duas verdades de movimento). `setNavMotionContext` idem.

- [x] **C.2** Header: `headerSwapVariants` virou crossfade **curto (0.1s)**
  (anti-padrão 11: header e tela não animam a mesma coisa — com o slide agora de
  tela cheia, um crossfade de 0.26s virava borrão de sinal duplo); mount/unmount
  do header agora usa o perfil (**antes eram 0.2/0.15 hardcoded, sem reduz-motion**)
  - Files: `src/components/HeaderNav.tsx`, `src/lib/motion.ts`

- [x] **C.3** Bottom-nav retipada com o perfil (`chrome.d.navBar` + `EASE`),
  mantendo **só opacity** — ver "Decisão rejeitada" abaixo
  - Files: `src/shells/MobileAppShell.tsx:254-282`

### C.4 — A base como camada separada (`behind(depth)`) ⏸️ **ADIADO — decisão consciente**

O modelo de profundidade (§D3: `x = -depth * PARALLAX * W`) está **pronto e
testado** em `createScreenTargets`, mas **inerte**: `SlideContent` renderiza a aba
base **ou** a auxiliar na **mesma** `SlideScreen` (`SharedScreenLayers.tsx:275-312`),
então só há **uma** camada montada e `depth` é sempre `0`.

Ativar exige **separar a base em camada própria**:
- dividir o dispatcher de `SlideContent` em "conteúdo base" e "conteúdo auxiliar";
- renderizar os dois em `ScreenLayer`s separados, cada um com sua key;
- **reconciliar com o freeze de saída** (`SlideScreen.tsx:30-39` + `lib/scroll.ts`),
  que é peça load-bearing e foi testada e aprovada.

**Decisão:** não é Feature-Flag-able com segurança (meia implementação fica
*pior* que nenhuma: a base continuaria desmontando). Fica como slice próprio,
**depois** de D e E, com QA manual dedicado. O ganho — parallax de verdade na tela
de baixo — é real, mas é um ganho *estético*; o que já chegou em C.1 (slide
direcional de tela cheia, gesto com continuidade, `replace` correto) é o que resolve
a maior parte da sensação de "web app".

### Decisão rejeitada: bottom-nav deslizando para fora

A pesquisa recomenda a barra sair com `y: 72`. **Rejeitado** — o próprio código
documenta a armadilha em `MobileAppShell.tsx`: um `transform` no wrapper da barra
vira *containing block* do `fixed` interno e o nav deixa de se posicionar na
viewport (regra do CSS Transforms L1: qualquer `transform` ≠ `none` cria containing
block para descendentes `fixed`). Fazer a barra deslizar exigiria animar o `y` de
**dentro** do elemento `fixed`, não do wrapper. Registrado aqui para não virar
"melhoria" errada depois.

### Ganho de medição do Slice C

Baseline do começo da implementação: **987 testes / 98 arquivos**. Agora:
**1075 testes / 102 arquivos** (+88), com lint, build e fronteiras verdes.


---

## Slice D — Consolidar presets e zerar a dívida inline

### D.1 — As 5 físicas de "push" → 4 presets nomeados ✅

**Gate:** lint ✅ + `npm run test` ✅ (103 / 1077) + `check-boundaries` ✅

- [x] **D.1** `stepVariants` (40px, 0.24/0.16) substitui as 3 tabelas locais
  - Antes: wizard `48px`/0.26 · sub-tab do curso `±48`/spring · quiz `40px`/0.3 — **3 físicas**
  - Agora: os três usam `stepVariants` de `src/lib/motion/variants.ts`
  - Rótulos normalizados para `initial`/`animate`/`exit` (o curso usava
    `enter`/`center`/`exit`, que não é o padrão do Motion)
  - Files: `src/components/wizards/WizardScaffold.tsx`,
    `src/components/views/CourseDetailView.tsx`, `src/components/quizzes/QuizPlayer.tsx`

### D.2 — Gate de grep (torna a história #1 **verificável**) ✅

- [x] **D.6** `src/lib/__tests__/motion/noInlineTokens.test.ts` — **ratchet**
  - Viola: literal numérico (`duration: 0.18`, `stiffness: 400`, `ease: 'easeInOut'`,
    `ease: [0.4, 0, 0.2, 1]`) fora de `src/lib/motion/`
  - **Não** viola: referência a token (`ease: EASE.standard`, `ease: IOS_EASE`) —
    usar o token é justamente o objetivo
  - Dois testes: (1) nada novo; (2) **nada em `KNOWN_INLINE` já limpo** — a lista só
    pode encolher, senão alguém "reseta" o gate
  - Dois detalhes que makes o gate confiável:
    - **ignora comentários** (preservando contagem de linhas) — gate que dispara em
      prosa é gate que as pessoas desabilitam;
    - `src/lib/motion.ts` (shim legado) é isento: ele **é** o módulo de token antigo,
      não é dívida inline
  - **Baseline: 44 literais em 25 arquivos** (era 46/27 — os 2 removidos foram o
    `QuizPlayer` e um falso positivo meu em comentário)

### D.3 — Limpeza dos 44 literais ⏸️ **PENDENTE** (deixa o ratchet para o próximo passo)

Lista exata em `KNOWN_INLINE` (com número de linha). Ordem sugerida por
ganho/risco:

1. **`floating-action-menu.tsx:40-44`** — o **conflito** `ease:'easeInOut'` +
   `type:'spring'` no mesmo objeto (configuração contraditória, não só feio)
2. `EdgeSwipeBack.tsx:96,103` — spring do gesto ×2 → `BASE_T.gesture` (e respeitar
   `profile.t.gesture`, que no perfil reduzido é tween)
3. `bottom-nav-bar.tsx` — 4 pontos (o `ease` da linha 36 replica `IOS_EASE` literalmente)
4. quiz (5 arquivos) — easings Material `[0.4,0,0.2,1]` → `EASE.standard`
5. `Card3D`/`CardBaúEnvelope`/`AnimatedNumber`/`ProgressBar`/`SegmentedControl`/
   `dither-*` — springs → `BASE_T`/`BASE_D`; `width` → `scaleX` onde couber
6. resto: `CourseCreateMenu`, `NoteTransformWizard`, `fieldsFor`, `FlashcardWizard`,
   `WizardScaffoldHeader`, `QuizLoadingScreen`, `StreakView`, `BootSplash`,
   `home/rows.tsx`, `CourseDetailView:188-189`

- [ ] **D.3** Cada ponto limpo remove a linha de `KNOWN_INLINE` (o 2º teste cobra isso)
- [ ] **D.4** `layout` → `layout="position"` (`home/rows.tsx:28,78`)
- [ ] **D.5** Regra nova em `check-boundaries.mjs`: um só import specifier de motion
  (`framer-motion`). Hoje já é verdade (só `framer-motion@13` instalado; o `motion@12`
  citado no `AGENTS.md` é drift), mas a regra protege contra dois runtimes com
  contextos de presença separados — o `exit` quebraria em silêncio
- [ ] **D.7** Remover import morto de `motion`/`AnimatePresence` em `NotesScreen.tsx:20`

### D.5 — Migração final do shim `src/lib/motion.ts`

Ainda exporta `IOS_EASE`, `IOS_EASE_OUT`, `iOS_SPRING`, `OVERLAY_FADE`,
`PUSH_DURATION`, `PUSH_EXIT_DURATION`, `TAB_DURATION`, `getTransition`,
`screenVariants` (deprecated), `overlayVariants`, `sheetVariants`, `fadeSlide`,
`headerSwapVariants`. Quando D.3 terminar, tudo o que sobrar migra para
`src/lib/motion/` e o arquivo vira re-export puro (ou é deletado, se os importadores
migraram). **Só então** a regra `check-boundaries` de import único pode ser valida.


---

## Slice E — Acessibilidade

- [ ] **E.1** `inert={!isPresent || !isTop}` + `aria-hidden` nas camadas não-topo/saindo
  (hoje a de saída é focalizável por ~180 ms)
  - Files: `src/shells/SlideScreen.tsx`

- [ ] **E.2** Foco vai para o container da tela nova (`tabIndex={-1}` +
  `focus({ preventScroll: true })`) em `useLayoutEffect` — **nunca** em `onAnimationComplete`
  - Files: `src/shells/SlideScreen.tsx`

- [ ] **E.3** Gesto de borda e drag-to-dismiss **desabilitados** sob `reduced`
  (WCAG 2.3.3 — movimento por interação)
  - Files: `src/components/ui/EdgeSwipeBack.tsx`, `src/components/ui/Modal.tsx:119-131`

- [ ] **E.4** `shouldIgnoreTarget` (`swipe.ts:52-56`) garante WCAG 2.5.8 (24px): o gesto
  não dispara quando o toque começou em controle interativo

- [ ] **E.5** `aria-live` no container novo para anunciar a troca de tela

- [ ] **E.6** Testes de `ScreenLayer` (camada saindo tem `inert`; foco vai p/ a nova)
  - Files: `src/lib/__tests__/motion/ScreenLayer.test.tsx`

- [ ] **E.7** Gate do Slice E + QA Q12

---

## Slice F — Toggle de movimento no Perfil + correção de doc drift

- [ ] **F.1** Preferência `motionPref: 'sistema' | 'reduzido' | 'completo'`
  - `usePersistentState` com chave nova **e seed `'sistema'`** em `src/data/empty.ts`
    (mesma classe de `reminder`/`onboarding` — **NÃO** bumpa `SCHEMA_VERSION`, AGENTS.md)
  - Files: `src/data/empty.ts`, `src/context/`

- [ ] **F.2** `MotionProfileProvider` acima do shell: `resolveProfile` +
  `MotionConfig reducedMotion={reduced ? 'always' : 'never'}` (**sem** branch em `NODE_ENV`)
  + `<div data-motion="reduced"|"full">` na raiz (**seam de teste** + hook CSS)

- [ ] **F.3** UI em Perfil → personalização (3 opções, pt-BR minúsculo)

- [ ] **F.4** Reescrever `.context/animations.md` (está desatualizado) e corrigir o drift em
  `AGENTS.md` / `.context/architecture.md`:
  - remover `VIEW_PULINHO` (não existe no repo)
  - corrigir `AnimatePresence mode="popLayout"` da camada de tela → `sync`
  - corrigir `motion@12` → `framer-motion@13` (só `framer-motion` está instalado)

- [ ] **F.5** Marcar SPEC-002 como concluída (a Slice D dela é este Slice D)

- [ ] **F.6** Gate do Slice F + QA Q9

---

## Slice G (opcional) — Núcleo imperativo do `ScreenLayer`

Só depois de A→F verdes, e só se a sensação de "salto" continuar em QA manual.

- [ ] **G.1** Trocar o mutable de módulo por `AnimatePresence custom={intent}` + `usePresenceData()`
- [ ] **G.2** `x` como `MotionValue` por camada + `animate()` imperativo (elimina a classe de
  "children stuck" e dá continuidade exata gesto↔exit)

---

## Matriz de QA manual (rodar a partir do Slice C)

| # | Cenário | Esperado |
|---|---|---|
| Q1 | Abrir/fechar detalhe de disciplina, sub-telas e histórico | push entra da direita, pop sai p/ a direita com parallax atrás |
| Q2 | Trocar de disciplina `c1 → c2` (não pilha) | crossfade curto, **sem** empurrão de tela cheia |
| Q3 | `#/perfil/semestre` → histórico → voltar | transição em ambos os sentidos (B1) |
| Q4 | Anotação dentro do detalhe de disciplina | camada própria; a sub-tab do curso **persiste** ao voltar (B5) |
| Q5 | Gesto de borda: arrastar e soltar antes do limiar | spring de volta, sem pulo |
| Q6 | Gesto de borda: arrastar além do limiar e soltar | a tela **continua de onde o dedo soltou** (B2) |
| Q7 | Tocar 5 telas rápido em sequência | nenhum elemento preso no DOM, nenhum transform travado |
| Q8 | Tela rolada → abrir outra → voltar | freeze pixel-a-pixel (sem regressão do `lib/scroll.ts`) |
| Q9 | Perfil → toggle "reduzido" | tudo vira fade curto, **sem** parallax, **gesto de borda desabilitado** |
| Q10 | Wizard: 5 passos + fechar | overlay entra/sai; passos deslizam 40px; base não remonta |
| Q11 | Bottom-nav: base ↔ tela auxiliar | barra sai com `y` (não vira fantasma) |
| Q12 | Teclado: `Tab` repetido durante um pop | nunca cai na tela que está saindo (E) |
| Q13 | App nativo (iOS) — mesmo gesto pelo plugin nativo | idêntico ao web |
| Q14 | Chunk lento: abrir tela cold (2G throttling) | skeleton **dentro** da animação, sem tela crua |

---

## Dívida registrada (não executada aqui)

| Item | Onde | Nota |
|---|---|---|
| `packages/navigation/src/derive.ts` é duplicata **morta** de `navigationEngine` (fora de sync) | `packages/navigation/src/derive.ts:95-186` | Se `deriveIntent` ficar puro, promovê-lo a `packages/navigation` é `packages/*` ⇒ **ask first** |
| `knowledge-graph`/`projects`/`inbox` declarados e sem UI | `packages/navigation/src/types.ts:73-78` | Código morto de desktop. Remover ou implementar (decisão de produto) |
| Preload engole falha de chunk | `SharedScreenLayers.tsx:124` | Skeleton infinito sem UI de erro |
| Doc drift (`VIEW_PULINHO`, `popLayout`, `motion@12`) | `AGENTS.md`, `.context/architecture.md`, `.context/animations.md` | Slice F |
