# EST-001 — QuizPlayer: layout, fluxo de resposta e avanço de questões

> Correção do módulo de quiz (tela de questões) — dois defeitos relatados pela
> usuária no app mobile: **(1)** espaço gigante vazio embaixo da pergunta e
> **(2)** o quiz não responde bem (a resposta/explicação não aparece de forma
> fluida e as questões não avançam).
>
> **Data:** 2026-09-15 · **Escopo:** spec-only (nenhum código-fonte editado).
> **Skills:** spec-driven-development, incremental-implementation (problem-statement
> não existe local — `.agents/skills` não a contém; articulação do problema foi
> feita direto).
> **Gate de validação:** `npm run lint` + `npm run test` + `npm run build`
> (+ `node .github/scripts/check-boundaries.mjs` ao tocar `packages/*`).
> **Integração:** complementa o plano de QA **`EST-003-qa-integracao.md`** (§4, §5:
> sequência A1→A2 e módulo puro `packages/application/src/quiz/playState.ts`),
> adicionando a **causa-raiz de remount** descoberta na investigação (ver §2.2).

---

## Índice

| Seção | Conteúdo |
|---|---|
| [1. Problema](#1-problema) | Sintomas do usuário, reframed em critérios |
| [2. Comportamento atual + causa raiz](#2-comportamento-atual--causa-raiz) | Evidências `arquivo:linha` por bug |
| [3. Critérios de aceite](#3-critérios-de-aceite) | Objetivos e mensuráveis |
| [4. Implementação incremental](#4-implementação-incremental) | P1→P5, mudanças por arquivo |
| [5. Casos de borda & riscos](#5-casos-de-borda--riscos) | syncHash, overlay fixed, remount |
| [6. Gate de verificação](#6-gate-de-verificação) | Comandos exatos + baseline |
| [Anexo — arquivos tocados](#anexo--arquivos-tocados) | Conformidade com check-boundaries |

---

## 1. Problema

**Sintoma relatado (usuária, app mobile):** dentro do quiz, ao responder, a tela
da pergunta fica com um **espaço enorme vazio embaixo** (deveria ocupar só o
necessário); o quiz **não responde de verdade**: a resposta/explicação não
aparece de forma fluida e as questões **não avançam**.

**Reframe em critérios verificáveis (o que "pronto" significa):**

| Sintoma | Critério |
|---|---|
| Espaço vazio embaixo | A altura renderizada é proporcional ao conteúdo da questão (sem área morta > 20% da viewport numa pergunta curta) |
| Resposta não aparece | Highlight de correto/errado persiste na opção selecionada e a explicação ("continuar") surge ≤ 350 ms, full-screen e sem corte |
| Não avança | "continuar" avança para a próxima questão; fim do pool chama o resultado |

---

## 2. Comportamento atual + causa raiz

### 2.1 Bug 1 — espaçamento gigante (`QuizPlayer.tsx` — layout)

Cadeia de evidências:

| Evidência | O que mostra |
|---|---|
| `QuizPlayer.tsx:86` — `min-h-[70vh] flex flex-col pb-44` | Força altura mínima de 70vh **e** `pb-44` (176px) mesmo com conteúdo curto |
| `QuizPlayer.tsx:88` — `flex-1 pt-4 overflow-y-auto` | Scroll aninhado: o `flex-1` estica para preencher os 70vh, criando a área morta; a página também rola (duplo scroll) |
| `QuizPlayer.tsx:208` — footer `fixed bottom-0 … z-10` | O rodapé é `fixed` (não ocupa espaço no fluxo) → o `pb-44` reserva espaço para **nada** |
| `QuizPlayer.tsx:91-98` + `:173-180` | **Duas** barras de progresso idênticas no mesmo `motion.div` (a 2ª dentro do card da pergunta) |
| `QuizPlayer.tsx:207` — footer só quando `!showExplanation && selectedOption` | O footer aparece ~300ms e some quando a explicação abre → é um affordance redundante, jamais um layout em fluxo |
| `QuizPlayer.tsx:47` — `correctText` | Código morto (calculado e nunca usado) |

O vão vem do combo `min-h-[70vh]` + área `flex-1` vazia + `pb-44` para um footer
`fixed` que nem está na tela a maior parte do tempo. Padrão repetido em
`QuizGroupSelector.tsx:62`, `QuizResultScreen.tsx:137` e `QuizCategorySelector.tsx:218`
(mesmo anti-padrão, alvo de limpeza futura — fora do escopo aqui).

### 2.2 Bug 2 — não responde / não avança (causa-raiz: **remount a cada `setStack`**)

O `updateQuizPlayState` (usado em **todo** clique de resposta e **todo** avanço)
passa por `setStack`, que **bumpa `navigationRevision`**, e a chave da camada de
slide inclui essa revisão → o `SlideScreen` (e o `QuizPlayer` inteiro, com todo o
estado local) é **desmontado e remontado** a cada resposta/avanço. Consequências:

- `selectedOption` e `showExplanation` (estado **local** do jogador) zeram no
  remount → o highlight some na hora e o `setTimeout(300ms)` original dispara
  num instância já desmontada → **a explicação nunca aparece**.
- Sem o overlay e sem `selectedOption`, o usuário não tem como avançar → **o quiz
  "não avança"**; um segundo toque na mesma questão registra **resposta duplicada**
  (o guard `if (selectedOption) return` não impede, pois `selectedOption` zerou).
- Fabrica o comportamento "não responde de forma fluida": a tela re-anima o
  fade+scale de entrada a cada clique.

Cadeia de evidências (fonte da verdade = código, confirmado nesta sessão):

| Evidência | O que mostra |
|---|---|
| `src/context/navigationEngine.ts:305-314` — `setStack` | Sempre incrementa `navigationRevisionRef` e `setNavigationRevision(revision)` + `navDirection` |
| `navigationEngine.ts:510` — `slideKey = \`${slideBaseKey}-${navigationRevision}\`` | SlideKey muda a cada revisão |
| `src/shells/MobileAppShell.tsx:137` — `<SlideScreen key={app.slideKey}>` | Key mudando ⇒ React **desmonta/remonta** o SlideScreen (e o QuizPlayer) |
| `navigationEngine.ts:1086-1100` — `updateQuizPlayState` | Faz `find('quiz-play')` + `map` + **`setStack(stack)`** (linha 1097) a cada atributo |
| `src/shells/SharedScreenLayers.tsx:180-197` | `onAnswer` e `onAdvance` chamam `updateQuizPlayState` no clique |
| `QuizPlayer.tsx:39-43` — reset em `[currentIdx]` | O elegibilidade de estado local depende da instância NÃO remontar |
| `src/components/quizzes/__tests__/QuizPlayer.test.tsx:63-161` | Testes renderizam o componente **isolado** com `state` estático + mocks → **não exercitam o pai** (`updateQuizPlayState`/`slideKey`) → a lacuna de cobertura que deixou o P0 passar (ver §4.5) |

**O teste isola passa (3/3) mas o bug existe em produção** porque o pai real
(`SharedScreenLayers` + `navigationEngine`) é quem causa o remount — nenhum teste
de componente/contexto cobre esse vínculo hoje.

**Fluxo alvo (após correção):** clique → `onAnswer` → pai atualiza `answers` no
estado do `quiz-play` **sem trocar a slideKey** → jogador re-renderiza mantendo
`selectedOption` → 300ms → overlay de explicação → "continuar" → `onAdvance` →
`currentIdx+1` (mesmo caminho silencioso) → reset local → próxima pergunta.

### 2.3 Agravantes do overlay (explicação "não fluida")

| Evidência | O que mostra |
|---|---|
| `QuizExplanationOverlay.tsx:28` — `fixed inset-0 z-50` | Overlay `fixed` **dentro** de `QuizPlayer` (que está dentro do `overflow-y-auto` da linha 88) |
| `QuizPlayer.tsx:187-194` — wrapper `motion.div key="explanation"` com `scale/y` | Durante a animação o wrapper tem `transform` ⇒ o `fixed` interno resolve para o **wrapper** (não para a viewport) e o overlay "pula"/fica cortado, só assentando no fim |
| `MobileAppShell.tsx:135` — `<motion.div style={{ x: swipeX }}>` e `SlideScreen.tsx:42-59` (`screenVariants` com `scale: 0.985`) | Ancestrais com transform transitório = containing block para `fixed` (mesmo gotcha já documentado no próprio arquivo, `MobileAppShell.tsx:164-165`) |
| `QuizExplanationOverlay.tsx:20-26` — 2º `AnimatePresence mode="wait"` | Animação dupla (wrapper + overlay) para o mesmo elemento — efeito de "não fluida" |
| `QuizPlayer.tsx:99` — `AnimatePresence mode="wait"` com filhos sem keys consistentes | `motion.div key="question"` + um `<AnimatePresence>` **sem key** — mistura de filhos que o `mode="wait"` não diferencia bem |

---

## 3. Critérios de aceite

Objetivos e mensuráveis (todos verificáveis por teste/regex):

- **A.1 (bug 1)** `QuizPlayer.tsx` **não contém** `pb-44` nem `min-h-[70vh]`.
- **A.2 (bug 1)** Existe **uma única** barra de progresso (teste conta elementos
  `renderProgressBar` via `data-testid`, esperado 1).
- **A.3 (bug 1)** Após renderizar uma pergunta curta, a altura do contêiner do
  jogador é proporcional ao conteúdo (sem área morta; verificação visual + layout
  sem `overflow-y-auto` aninhado).
- **B.1 (bug 2)** O jogador **não remonta** na resposta/avanço: um elemento
  âncora (`data-testid="quiz-question"`) criado no 1º render **permanece o mesmo
  nó** no DOM após `onAnswer` (teste de integração com `container.querySelector`
  comparando referência do nó; ou assert de que a borda/estado local persiste).
- **B.2 (bug 2)** Após clicar opção, o feedback correto/errado aparece e a
  explicação com "continuar" surge ≤ 350 ms (fake timers, `advanceTimersByTime(350)`).
- **B.3 (bug 2)** "continuar" chama `onAdvance`; na última questão chama
  `onFinish(answers, config, startTime, correctCount, totalCount)`.
- **B.4 (bug 2)** Duplo toque na mesma questão **não** gera segunda resposta
  (`onAnswer` chamado 1x; `answers` com 1 item no `state` seguinte).
- **B.5 (bug 2 — regressão P0/F1)** `updateQuizPlayState` **continua sem
  `syncHash`** e uma atualização de payload (mesma forma da pilha) **não muda a
  `slideKey`**.
- **B.6** Questão sem `explanation` mostra o fallback `'sem explicação disponível'`.
- **C.1 (módulo puro, alinhado EST-003)** `applyAnswer` / `advanceQuestion` /
  `finishQuiz` puros em `packages/application/src/quiz/playState.ts` + stub +
  testes verdes; **sem `syncHash`** (função pura, sem efeito colateral).

---

## 4. Implementação incremental

Build order: **P1 → P2 → P3 → (P4 ∥ P2) → P5**. Cada passo deixa lint+testes
verdes (regra do incremental-implementation).

### P1 — Layout: remover vão e duplicações (`QuizPlayer.tsx`)

- `:86` → `<div className="flex flex-col">` (remove `min-h-[70vh]` e `pb-44`).
- `:88` → `<div className="pt-4">` (remove `flex-1 overflow-y-auto`; a página
  rola naturalmente e o overlay sai do escopo de overflow).
- `:173-180` → remover a **2ª barra de progresso** (mantém a de topo `:91-98`;
  dar `data-testid="quiz-progress"` à única remanescente para o teste A.2).
- `:47` → remover `correctText` (dead code).
- **Não** tocar em `min-h`/`pb-44` do Grupo/Resultado (fora de escopo; anotar em
  backlog para unificar o padrão).
- **Verificação:** `npm run lint` + teste A.1/A.2 novos; os 3 testes atuais verdes.

### P2 — Overlay: portal + animação única (`QuizPlayer.tsx` + `QuizExplanationOverlay.tsx`)

- `QuizPlayer.tsx`: remover o 2º `AnimatePresence` (`:185-202`) e o wrapper
  `motion.div key="explanation"` (`:187-194`) do fluxo in-flow; renderizar a
  explicação via **`createPortal`**:
  ```tsx
  {showExplanation && createPortal(
    <QuizExplanationOverlay {...} />,
    document.body,
  )}
  ```
  (import: `import { createPortal } from 'react-dom'`).
- `QuizExplanationOverlay.tsx`: remover o `AnimatePresence mode="wait"` interno
  (`:20-26`) e manter **uma única** `motion.div` na raiz (mesmos variants
  `initial/animate`); `fixed inset-0 z-50` como filho direto de `body` ⇒ sem
  containing-block de ancestrais com transform e sem clipping por overflow.
- `QuizPlayer.tsx:207-226`: remover o **footer `fixed`** ("próxima" / "ver
  resultado") — redundante com o "continuar" do overlay, e só aparecia ~300ms.
  > Opção B (se a produto quiser CTA imediato): botão **in-flow** `mt-4`
  > (nunca `fixed`) exibido samecondition — nunca reintroduzir `fixed` aqui.
- **Risco controlado:** portal com `z-50` no body ficará acima do header/bottom
  nav (ambos `z-40`, ver `HeaderNav.tsx:54` e `BottomNav.tsx:71`); durante o
  quiz a bottom nav não é renderizada (`isBottomNavVisible=false`, derive do topo
  `quiz-play`).
- **Verificação:** testes B.2/B.6 (com fake timers) + verificação visual manual.

### P3 — Fluxo/silêncio do pai: `updateQuizPlayState` sem remount (`navigationEngine.ts` + `QuizPlayer.tsx`)

- `navigationEngine.ts`: criar um setter **silencioso** ao lado de `setStack`:
  ```ts
  const setStackSilent = useCallback((next: NavScreen[]) => {
    navigationStackRef.current = next;      // IMPORTANTE: manter ref em dia
    setNavigationStack(next);               // provoca re-render (identidade nova)
    // NÃO toca navDirection / navigationRevision / hash / scroll
  }, []);
  ```
- `updateQuizPlayState` (`:1086-1100`): trocar `setStack(stack)` (`:1097`) por
  `setStackSilent(stack)`. **Manter** o `find('quiz-play')` + `map` atuais e a
  **ausência de `syncHash`** (regressão Fase 21 — não readicionar).
- `QuizPlayer.tsx`: adicionar `answeredRef = useRef(false)` para tornar o guard
  de resposta **idempotente entre renders** (fecha a janela de duplo-toque antes
  do re-render do pai):
  - `handleOptionClick` (`:49-65`): `if (answeredRef.current || selectedOption) return;`
    → `answeredRef.current = true` antes do `onAnswer`.
  - reset no effect `[currentIdx]` (`:39-43`): `answeredRef.current = false`.
- `SharedScreenLayers.tsx`: **sem mudança de contrato** (callbacks continuam
  `onAnswer`/`onAdvance` → `updateQuizPlayState`). Ordem do ternário
  (`focusedStudyScreen` antes de `isQuizPlayOpen`, `:169`/`:176`) é correta por
  construção (`focusedStudyScreen` só é não-nulo com topo `study`) — manter.
- **Verificação:** testes B.1, B.3, B.4, B.5; `npm run test`
  (`src/components/quizzes/__tests__/QuizPlayer.test.tsx`).

### P4 — Máquina de estados pura (alinhado EST-003 §4.1; pode rodar ∥ a P2)

- **Novo** `packages/application/src/quiz/playState.ts` (puro, `import type` de
  `../../../src/types/quiz` — permitido pelas boundaries):
  - `applyAnswer(state, answer)` → `{ ...state, answers: [...state.answers, answer], questionStartTime: Date.now() }`
    (preserva pool/config/currentIdx/startTime; guarda em idx final);
  - `advanceQuestion(state, now)` → `{ ...state, currentIdx: state.currentIdx + 1, questionStartTime: now }`
    (sem tocar answers; sem efeito colateral/`syncHash`);
  - `finishQuiz(state)` → `{ answers, config, startTime, correctCount, totalCount }`.
- **Novo stub** `src/lib/quizPlayState.ts`:
  `export * from '../../packages/application/src/quiz/playState';` (caminho
  **relativo** — nunca `@/packages/...`, regra do AGENTS.md).
- `navigationEngine.ts`/`SharedScreenLayers.tsx` podem passar a consumir as
  funções puras (substituindo as inline de `onAnswer`/`onAdvance`/`onFinish`),
  mantendo a restrição de não `syncHash`.
- **Novo** `src/lib/__tests__/quizPlayState.test.ts` (vitest só descobre
  `src/**` e `apps/**` — testes de packages moram no stub, padrão
  `quizStack.test.ts`).
- **Verificação:** `npm run test -- src/lib/__tests__/quizPlayState.test.ts` +
  `node .github/scripts/check-boundaries.mjs` (packages/application não pode
  importar react/@capacitor/__TAURI__).

### P5 — Expandir testes do componente + gate final

`src/components/quizzes/__tests__/QuizPlayer.test.tsx` (hoje 3 casos) — adicionar:
1. Feedback `bg-green-50`/`bg-red-50` na opção selecionada (fake timers 350ms →
   overlay "continuar"; A.2: única barra via testid).
2. Opções `disabled` após selecionar + guard de duplo toque (B.4).
3. Fallback sem `explanation` (B.6).
4. Formatação do timer `(questionTimeMs/1000).toFixed(1)`.
5. Asserção de **não-remount** (B.1) — se viável sem prover o provider completo,
   cobrir via teste do `stackShape`/`slideKey` (contrato puro de P4) + QA manual.
6. `onFinish` com payload exato nos últimos (B.3).

**Gate:** `npm run lint` + `npm run test` (baseline 78 arquivos / 667 testes —
EST-003) + `npm run build` + `check-boundaries`.

---

## 5. Casos de borda & riscos

| Caso / risco | Nível | Mitigação |
|---|---|---|
| **Reintroduzir `syncHash` em `updateQuizPlayState`** (regressão P0/F1 — quiz trava) | **Alto** | Regra expressa em P3/P4: função segue **sem** `syncHash` (`navigationEngine.ts:1086-1100`); `setStackSilent` não chama hash; teste de estado puro + review no PR |
| **`fixed` dentro de overflow container / ancestrais com transform** | Alto | Overlay sai para `document.body` (portal) → escapa de `overflow-y-auto`, `swipeX` (`MobileAppShell.tsx:135`) e `scale 0.985` (`SlideScreen.tsx`) |
| **Remount global persistindo** (alguém chamar `setStack` em payload update) | Médio | `setStackSilent` escopado a `updateQuizPlayState`; documentar no `navigationEngine` que atualizações de payload NÃO são navegação (não bump revision). Alternativa futura: helper puro `stackShapeChanges` em `packages/navigation` (com teste) generalizando a regra |
| **Duplo toque antes do re-render do pai** | Médio | `answeredRef` (P3) fecha a janela; `onAnswer` append via `[...current.answers, answer]` continua consistente |
| **Perda de `selectedOption`/`showExplanation` em remount** | Alto | Resolvido por P3 (slideKey estável) — sem isso o overlay nunca abre |
| **Questões C/E** (options `["Certo","Errado"]`, gabarito A/B via mapeamento em `bancoQuestoes.ts:36-65`) | Baixo | Não é bug; garantir que a UI mostra 2 botões e o gabarito deriva de `gabarito` (não de `options` correta) |
| **Testes em `packages/*` não descobertos pelo vitest** | Baixo | Testes via stub em `src/lib/__tests__/` (padrão `quizStack.test.ts`, EST-003 §2.1) |
| **`min-h-[70vh]`/`pb-44` repetidos em outros screens de quiz** | Baixo | Fora de escopo; anotar para unificação posterior (Grupo/Resultado/Categoria) |
| **`main` da shell mantém `pb-[calc(5rem+...)]` com `hasTabBase`** (`MobileAppShell.tsx:126-130`) | Médio | Contribui com espaço embaixo em telas empilhadas; mudar é shell-wide e arriscado → **fora de escopo**, registrar no backlog (avaliar `isBottomNavVisible` no padding) |
| **Fake timers vs. interval de 100ms do timer da questão** | Baixo | Usar `vi.advanceTimersByTime(350)`/`advanceTimersByTime(1000)` pontuais; zerar timers no unmount (`useEffect` cleanup já existe; adicionar clear do `setTimeout` de P2) |

---

## 6. Gate de verificação

```bash
npm run lint                                          # tsc --noEmit — 0 erros (baseline confirmado)
npm run test                                          # baseline atual: 78 arquivos / 667 testes (EST-003)
npm run test -- src/components/quizzes/__tests__/QuizPlayer.test.tsx   # hoje 3/3 → expandido (P5)
npm run test -- src/lib/__tests__/quizPlayState.test.ts                # novo (P4)
npm run build                                         # dist/ verde
node .github/scripts/check-boundaries.mjs             # obrigatório ao tocar packages/*
```

**Baseline real desta sessão (spec-only, sem edição):**

| Comando | Resultado |
|---|---|
| `npm run lint` | ✅ 0 erros |
| `npm run test -- src/components/quizzes/__tests__/QuizPlayer.test.tsx` | ✅ 1 arquivo / 3 testes passando |
| Inspeção do banco (`node -e … json`) | ✅ 3002 questões com `alternativas` (MC 2283 + C/E 719 → `["Certo","Errado"]`); mapping em `bancoQuestoes.ts` |

**QA manual obrigatória:** rodar `npm run dev` → Estudos → quiz (grupo real do
banco): (1) responder → highlight persiste + overlay full-screen centrado em
≤350ms; (2) "continuar" avança; (3) última questão mostra resultado; (4) zerar o
app ou usar questão curta para conferir ausência de espaço morto embaixo.

---

## Anexo — arquivos tocados (conformidade boundary)

```
EST-001:
  src/components/quizzes/QuizPlayer.tsx                  (P1 layout, P2 overlay, P3 guard)  — sem isDesktop/Capacitor (regra 2)
  src/components/quizzes/QuizExplanationOverlay.tsx      (P2 portal + animação única)        — idem
  src/context/navigationEngine.ts                        (P3 setStackSilent em updateQuizPlayState) — src/lib/context não são packages
  packages/application/src/quiz/playState.ts     [novo]  (P4 máquina pura; import type de src/types/quiz) — regra 1 (sem react/capacitor/tauri)
  src/lib/quizPlayState.ts                       [novo]  (P4 stub; re-export RELATIVO, nunca @/packages/...)
  src/lib/__tests__/quizPlayState.test.ts        [novo]  (P4)
  src/components/quizzes/__tests__/QuizPlayer.test.tsx   (P5 expandir)

Paralelo/referência: EST-003-qa-integracao.md (§4.1/§4.2/§5 — A1/A2 e módulo puro)
Backlog (fora de escopo): min-h-[70vh]/pb-44 em QuizGroupSelector, QuizResultScreen,
QuizCategorySelector; pb-[5rem] do main com hasTabBase; unificar overlay de explicação com a primitiva Modal.
```