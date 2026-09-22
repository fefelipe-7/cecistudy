# EST-003 — Qualidade, Integração & Sequenciamento

> Plano de QA/integração que valida a conformidade de **EST-001** (correção do
> QuizPlayer) e **EST-002** (sessão de foco full-screen preto em landscape) com as
> regras do repositório, define o plano de testes e a ordem de implementação.
>
> **Data:** 2026-09-15 · **Escopo:** nenhum código-fonte editado (spec-only).
> **Gate de validação dos planos:** `npm run lint` + `npm run test` +
> `node .github/scripts/check-boundaries.mjs` · **Build:** `npm run build`

---

## Índice

| Seção | Conteúdo |
|---|---|
| [1. Regras de boundary](#1-regras-de-boundary-aplicadas) | Resumo exato do script e checks por arquivo |
| [2. Lógica pura nova](#2-onde-mora-a-lógica-pura-nova) | Recomendação concreta por módulo |
| [3. Baseline de verificação](#3-baseline-de-verificação) | Resultados reais dos comandos |
| [4. Plano de testes](#4-plano-de-testes) | Arquivos novos/expandidos e casos |
| [5. Sequenciamento](#5-sequenciamento-a1--a2--b1--b2) | A1→A2→B1→B2 com gates |
| [6. Riscos & mitigações](#6-riscos--mitigações) | Rebuild, GitHub, syncHash, Tauri |

---

## 1. Regras de boundary aplicadas

Fonte: `.github/scripts/check-boundaries.mjs` (scan de imports **estáticos**; `import('...')`
dinâmico é permitido — vira chunk separado). O script devolve **0 = OK / 1 = violação**.

### 1.1 Regras relevantes

1. **`packages/*` nunca importam `react`, `@capacitor/*`, `__TAURI__`/`window.__TAURI__`**
   (checks `packages/domain|sync|data|application|contracts|design-tokens|navigation`,
   via `forbiddenContent`). Qualquer lógica pura nova que entrar em `packages/*` precisa
   importar **apenas types/tipos puros** (import type de `../../../src/types/*` é aceito —
   ver `packages/navigation/src/types.ts:7-14`).
2. **Shared UI não brancha por plataforma** (`isDesktop`, `isMobile`,
   `Capacitor.isNativePlatform`, `__TAURI__`, `window.__TAURI__`) — aplica a
   `src/components`, `src/shells/SharedScreenLayers.tsx`, `src/overlays/MobileOverlays.tsx`,
   `src/overlays/DesktopOverlays.tsx`, `src/overlays/OverlaysContent.tsx` (via
   `forbiddenContent`). **`src/lib` está FORA dessa lista.**
3. **Camada mobile** (`src/App.tsx`, `src/shells/SharedScreenLayers.tsx`, `apps/mobile`) não
   importa estaticamente `src/desktop`, `apps/desktop`, `desktop-tokens`, `desktopApp`, etc.
4. **`src/lib`** não importa estaticamente `apps/desktop`, `desktopSessionState`,
   `DesktopAppProvider`, `useDesktopSession` (testes em `src/lib/__tests__` isentos).
5. **Tipos de navegação** (`NavTab`, `SubTab*`, `NavScreen`, `StudyScreen`) só são
   declarados em `packages/navigation` — stubs (`src/lib/routing.ts`, `src/types/*`)
   re-exportam.

### 1.2 Checks específicos por arquivo

| Arquivo (EST) | Regras aplicáveis | Conclusão |
|---|---|---|
| `src/components/quizzes/QuizPlayer.tsx` (EST-001) | Está sob `src/components` → **regra 2** vale. Também é alvo da regra 3 (mobile produto) e não pode importar desktop. | O arquivo já importa só `framer-motion`, `lucide-react`, `./QuizExplanationOverlay`, `../lib/utils`, types — **não introduza `isDesktop`/Capacitor aqui**. |
| `src/components/estudos/StudyFocusScreen.tsx` (EST-002) | Está sob `src/components` → **regra 2 vale**. **Regra de ouro do EST-002:** `screen.orientation.lock`, detecção de desktop e fallback **não podem aparecer como token `isDesktop`/`__TAURI__` neste arquivo**. | Acoplar a detecção em `src/lib` (fora da regra 2) e consumir por função; **CSS media `orientation: landscape` + `100dvh`** como camada visual (não branca por plataforma). |
| `src/shells/SharedScreenLayers.tsx` (ambos) | Alvo direto das regras 2 e 3. | EST-002 introduz **rota `#/estudos/foco`** (já existe: `studyScreen: 'focus'`, `STUDY_SCREEN_SLUGS` em `packages/navigation/src/hash.ts:84-89`); renderização fica no mesmo bloco `focusedStudyScreen === 'focus'` — **sem novo import** aqui se a screen nova for `StudyFocusScreen`. |
| `src/lib/headerConfig.ts` (estável) | Regra 4 (não importar desktop). Já usa `lucide-react` — **não é candidato a packages** (icons são React). | Manter em `src/lib`; sem mudança para EST-001/EST-002. Já testado (`headerConfig.test.ts`). |
| Lógica pura nova (quiz/timer) | **Regra 1** se morar em `packages/*`; re-export via stub com **caminho relativo** (`export * from '../../packages/application/src/...'`), **nunca `@/packages/...`**. | Compat stubs re-exportam a partir de `src/lib/*` (ver §2). |

---

## 2. Onde mora a lógica pura nova

### 2.1 Padrão vigente (confirmado no código)

- `packages/navigation/` é o dono da pilha/rota (stack/hash/derive) e `src/lib/routing.ts` +
  `src/lib/quizStack.ts` são **stubs** que re-exportam com caminho relativo.
- Testes de lógica de packages são escritos em `src/lib/__tests__/*.test.ts` importando do
  **stub** (ex.: `quizStack.test.ts` → `import ... from '../quizStack'`), porque o
  `vitest.config.ts` só inclui `src/**/*.test.{ts,tsx}` e `apps/**/*.test.{ts,tsx}` —
  **testes dentro de `packages/*` não seriam descobertos**.
- A aplicação válida: `filterQuestionPool`/`buildQuizPool` já vivem em `src/lib/quizLogic.ts`
  (puro, sem React).

### 2.2 Recomendações (concretas)

| Módulo novo | Onde colocar (canônico) | Stub re-export | Teste |
|---|---|---|---|
| **Máquina de estados do quiz** (`QuizPlayState` transitions: `applyAnswer` → append + `questionStartTime`; `advanceQuestion` → `currentIdx+1` + novo `questionStartTime`; `finishQuiz` → payload de resultado; `withAnswer`/não readicionar `syncHash`) | `packages/application/src/quiz/playState.ts` (puro; import type de `../../../src/types/quiz`) | `src/lib/quizPlayState.ts` → `export * from '../../packages/application/src/quiz/playState'` | `src/lib/__tests__/quizPlayState.test.ts` |
| **Timer/pomodoro** (tick, pause/resume, reset, ciclo foco→pausa curta→foco até pausa longa, guarda parcial em `minutes>0`) | `packages/application/src/focus/timer.ts` (puro, sem `setInterval` — recebe `elapsedSecs`/`now` por argumento e retorna estado) | `src/lib/focusTimer.ts` → re-export relativo | `src/lib/__tests__/focusTimer.test.ts` |
| `src/lib/headerConfig.ts` | **Não mexer** (faz parte da UI de header sob `src/components/`; icons `lucide-react` impedem ida a packages) | — | já coberto |

> **Guia de decisão:** o timer do foco **deve** virar função pura (testável sem fake timer
> de relógio real) e morar em `packages/application` conforme AGENTS.md (lógica de
> use-case/domínio nova vai em `packages/domain`/`packages/application`; `src/lib` só re-exporta
> via stub). O componente `StudyFocusScreen` continua dono apenas da **orquestração**
> (`useEffect`/`setTimeout` para ticar e backdrop de orientação).

---

## 3. Baseline de verificação

Baseline **real** rodado nesta sessão (2026-09-15, máquina local Windows, sem edição de arquivos):

| Comando | Resultado |
|---|---|
| `npm run lint` (`tsc --noEmit`) | ✅ **0 erros** |
| `node .github/scripts/check-boundaries.mjs` | ✅ **OK: fronteiras respeitadas.** |
| `npm run test` (vitest, jsdom) | ✅ **78 arquivos / 667 testes passando** (`Duration 46.06s`). Warning experimental de `localStorage` do Node 26 é esperado (tratado em `vitest.setup.ts`). |

Gate do PR após cada etapa: **lint 0 · boundary OK · todos os testes acima do baseline**
(667 + novos). `npm run build` deve permanecer verde ao final.

---

## 4. Plano de testes

### 4.1 (a) Unidade pura — máquina de estados do quiz
**Arquivo novo:** `src/lib/__tests__/quizPlayState.test.ts` (importa de `../quizPlayState`)

- `applyAnswer`: append na `answers` + novo `questionStartTime`; calcula `correct` comparando
  `userAnswer` com `gabarito`; preserva `pool`/`config`/`currentIdx`/`startTime`.
- `advanceQuestion`: incrementa `currentIdx`; não altera `answers`; não chama `syncHash`
  (função pura — sem efeito colateral). Verifica que `currentIdx` não passa do fim do pool.
- `finishQuiz(pool, answers, config, startTime)`: devolve `{answers, config, startTime,
  correctCount, totalCount}` com `correctCount` correto.
- Guard: `applyAnswer` em idx final ainda funciona (sem estouro).

### 4.2 (b) Componente QuizPlayer
**Arquivo expandido:** `src/components/quizzes/__tests__/QuizPlayer.test.tsx` (hoje 3 testes)

- Seleção de opção **mostra feedback correto/errado em até ~300 ms** (fake timers:
  `vi.advanceTimersByTime(350)` → overlay `continuar` visível; `bg-green-50`/`bg-red-50` na
  opção selecionada).
- Explicação aparece após selecionar (mesmo teste acima já cobre; adicionar caso **questão sem
  `explanation`** → fallback `'sem explicação disponível'`).
- `onAdvance` avança; **última questão chama `onFinish`** com `correctCount`/`totalCount`.
- Opções ficam `disabled` após selecionar; segunda resposta na mesma questão **não**
  re-chama `onAnswer` (guard `if (selectedOption) return`).
- Formatação do timer `(questionTimeMs/1000).toFixed(1)` (com fake timers avançando 1000 ms).

### 4.3 (c) Estado do timer/pomodoro puro
**Arquivo novo:** `src/lib/__tests__/focusTimer.test.ts`

- `tick` decrementa/retorna estado sem side-effect (puro, recebe `now`).
- `pause`/`resume` preservam `timeLeft`.
- `reset(mins)` zera no preset; guarda `elapsed` correto.
- Ciclo completo: `foco → pausa curta → foco → … → pausa longa` após 4º ciclo (se o plano
  EST-002 adotar pomodoro clássico; senão, máquina de estados simples foco/descanso).
- Guarda **parcial** em `elapsedSeconds >= 60` (minutos completos `Math.max(1, floor(e/60))`).

### 4.4 (d) Roteamento
**Arquivos expandidos:** `src/lib/__tests__/routing.test.ts` + `src/lib/__tests__/quizStack.test.ts`

- **Não degradável no meio da jogada:** `stackToHash([..., quiz-play])` → `#/estudos/quiz/play` e
  back/`popstate` NÃO reseta para categoria (o roteador degrada apenas em reload/URL antiga —
  `parseRoute('#/estudos/quiz/play')` → `{quizCategory:true}` é comportamento de deep-link,
  não do fluxo interno). Teste de round-trip `#/estudos/quiz/play` incluído no caso de
  `stackToHash`.
- **`#/estudos/foco`**: `parseRoute` → `{tab:'estudos', studyScreen:'focus'}`;
  `routeToStack` → `[{tab estudos}, {kind:'study', screen:'focus'}]`; `stackToHash` → `#/estudos/foco`
  (já testado em `routing.test.ts:73,387,445` — manter verde e adicionar `#/estudos/quiz/play`).
- **Não readicionar `syncHash` em `updateQuizPlayState`**: guard por regressão documentado no
  teste de `navigationEngine` (ou reviewer check) — `updateQuizPlayState` segue sem `syncHash`
  (`navigationEngine.ts:1086-1100`).

---

## 5. Sequenciamento (A1 → A2 → B1 → B2)

```
A1 ─► A2 ─► B1 ─► B2
(layout)  (fluxo+testes)  (timer puro)  (focus landscape + orientação)
```

### A1 — QuizPlayer: espaçamento (`pb-44`) e layout do fluxo resposta/explicação
- **Escopo:** `src/components/quizzes/QuizPlayer.tsx` — ajustar `pb-44` + altura/overflow para o
  overlay de explicação (footer fixo não sobrepõe a última opção); sem mudança de lógica.
- **Gate:** `npm run lint` + `npm run test` (QuizPlayer.test.tsx já existente permanece verde).

### A2 — QuizPlayer: fluxo funcional + testes (EST-001 completo)
- **Dep:** A1.
- **Escopo:** centralizar transições em `packages/application/src/quiz/playState.ts` + stub
  `src/lib/quizPlayState.ts`; `SharedScreenLayers.tsx` consome via `updateQuizPlayState`
  **sem syncHash**; novos casos de teste §4.1 e §4.2.
- **Gate:** `npm run lint` + `npm run test` (novos testes) + `npm run build` +
  `node .github/scripts/check-boundaries.mjs`.

### B1 — Timer/pomodoro puro (EST-002, parte de estado)
- **Dep:** nenhum forte (pode ir em paralelo com A2, mas por segurança roda depois de A2 no
  mesmo bundle).
- **Escopo:** `packages/application/src/focus/timer.ts` + stub `src/lib/focusTimer.ts` +
  testes §4.3. `StudyFocusScreen` passa a usar a máquina pura (orquestração continua com
  `useEffect`).
- **Gate:** `npm run lint` + `npm run test` + `check-boundaries` (packages/application:

```
não pode importar react/@capacitor/__TAURI__).
```

### B2 — Focus full-screen preto em LANDSCAPE + orientação (EST-002, parte visual)
- **Dep:** B1.
- **Escopo:** visual full-screen preto (`100dvh`, media query `orientation: landscape`),
  timer gigante; `screen.orientation.lock('landscape')` via helper em `src/lib/orientation.ts`
  (com try/catch e no-op se API ausente); **plugin nativo de orientação fica como fase futura
  (rebuild no CI)**.
- **Desktop/Tauri:** degrade gracioso — `isDesktop` NÃO pode entrar em `src/components`
  (regra 2); uso de CSS `dvh` + media query garante comportamento igual em web/mobile/desktop;
  no desktop o lock de orientação é no-op (helper em `src/lib` retorna sem erro).
- **Gate:** `npm run lint` + `npm run test` + `npm run build` + `check-boundaries` (verificar
  que **nenhum token** `isDesktop`/`__TAURI__` aparece em `src/components`,
  `src/shells/SharedScreenLayers.tsx`).

---

## 6. Riscos & mitigações

| Risco | Nível | Mitigação |
|---|---|---|
| **Rebuild nativo impossível aqui** (Windows, sem SDK/Xcode) — EST-002 afirma "plugin nativo de orientação como fase futura com rebuild no CI" | Alto | Manter **web-first**: `screen.orientation.lock` (web/Capacitor webview) + fallback CSS `orientation: landscape`; plugin nativo só em milestone de CI, nunca nesta máquina. |
| **GitHub bloqueado** (api/cdn = 000) — EST-002 pode querer lib de orientação | Alto | **Não buscar libs novas que exijam rede GitHub.** `screen.orientation` e `fullscreen` são APIs nativas (zero dep). Plugin nativo (quando existir) entra por `@capacitor/*` via npm (npm/PyPI OK) e rebuild em CI. |
| **`syncHash` readicionado no `updateQuizPlayState`** — regressão do P0/F1 (quiz trava) | Alto | Regra expressa no plano: `updateQuizPlayState` (navigationEngine.ts:1086) segue **sem** `syncHash`. Teste de regressão documentado (review + teste de estado puro). |
| **Tauri desktop herda o mesmo bundle web** — foco landscape pode "quebrar" a janela desktop | Médio | EST-002 degrada **desde o início**: orientação via media query/`dvh` (não branca por plataforma), helper de `src/lib/orientation.ts` no-op em desktop; pode reusar `isDesktop` **só fora de `src/components`** (`src/lib/platform.ts:36` é o lugar certo). |
| **Testes em `packages/*` não descobertos pelo vitest** (include só `src/**` + `apps/**`) | Baixo | Testes de lógica de packages moram em `src/lib/__tests__/` importando do **stub** (padrão `quizStack.test.ts`). |
| **`packages/application` re-exporta `src/core` hoje** (inversão legada) | Baixo | Arquivo novo **standalone** em `packages/application/src/...` não conflita com o `index.ts` existente; stub usa caminho relativo (`../../packages/application/src/...`), nunca `@/packages/...`. |
| **Overlap A1/A2 com PlayState** | Baixo | A1 é só layout (sem lógica); A2 introduz a máquina pura. Sequência explícita evita rework. |

---

## Anexo — arquivos tocados por EST-001/EST-002 (conformidade esperada)

```
EST-001:
  src/components/quizzes/QuizPlayer.tsx                      (layout + fluxo; sem isDesktop)
  src/shells/SharedScreenLayers.tsx                          (callbacks via updateQuizPlayState, sem syncHash)
  packages/application/src/quiz/playState.ts  [novo]         (máquina pura)
  src/lib/quizPlayState.ts                    [novo, stub]   (re-export relativo)
  src/lib/__tests__/quizPlayState.test.ts     [novo]         (§4.1)
  src/components/quizzes/__tests__/QuizPlayer.test.tsx       (expandir §4.2)

EST-002:
  src/lib/focusTimer.ts                       [novo, stub]   (re-export relativo)
  src/lib/orientation.ts                      [novo]         (screen.orientation.lock + fallback)
  packages/application/src/focus/timer.ts     [novo]         (máquina pura de timer)
  src/lib/__tests__/focusTimer.test.ts        [novo]         (§4.3)
  src/components/estudos/StudyFocusScreen.tsx                 (visual full-screen preto + orquestração)
  src/lib/__tests__/routing.test.ts                           (expandir §4.4, #/estudos/quiz/play)
  src/lib/__tests__/quizStack.test.ts                         (expandir §4.4, não degradável)
```