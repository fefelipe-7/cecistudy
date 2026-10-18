# To-do: Performance do cecistudy (spec-performance.md)

> Spec: [`../spec-performance.md`](../spec-performance.md) (v1.0, 08/10/2026).
> Antecessor executado: [`perf-plan.md`](./perf-plan.md) (PERF-001, arquivada) — sub-contextos,
> chunks lazy e manualChunks já vêm daí.
> **Regra de ouro:** cada fase fecha com `npm run lint` + `npm run test` +
> `node .github/scripts/check-boundaries.mjs` verdes. Nenhuma fase muda o formato
> persistido: `SCHEMA_VERSION` fica **22** a fase inteira (a F5 muda o caminho de
> escrita, não o formato). Ao tocar conteúdo do catálogo:
> `npm run content:build && npm run db:verify && npm run content:check`.

**Progresso:** 7/10 fases — **F0..F6 e F9 concluídas em 2026-10-10**. Gate
`npm run verify` verde a cada fase (última contagem: 1520 testes / 132
arquivos). Restam: **F7** (conteúdo/bundle), **F8** (contextos por profiler) e
**F10** (validação final/flags — depende de medição em device). Nota: o gate
ganhou um passo `verify:contract` (`contracts/verify-schema.mjs`, artefato da
ADR-008) adicionado fora desta sessão — está verde e integrado ao `verify`.

**Ordem:** gate → instrumentação → boot → prefetch → canvas → persistência →
sync → conteúdo/bundle → contextos → validação. Cada fase é um commit isolado e
reversível (spec §12); o maior risco de dado é a F5 — é a única fase que toca
escrita de banco, e por isso vem depois de ter instrumentação no ar.

---

## Baseline real (auditado em 2026-10-10, 6 varreduras de código)

O código vence a spec: o baseline do §3 dela está desatualizado em dois pontos
graves. Números reais, com o comando que produziu cada um:

| Métrica | Spec §3 alega | Real (2026-10-10) | Comando |
|---|---:|---:|---|
| Erros TypeScript | 96 em 21 arquivos | **0** (tsc verde, 1069 arquivos) | `npm run lint` |
| Testes | 115 | **1455 pass / 122 arquivos, 0 falhas** | `npm run test` |
| Boundary check | passa | **verde** | `node .github/scripts/check-boundaries.mjs` |
| JS/CSS no `dist` | ~18,07 MiB | **18,07 MiB** (122 arquivos) | `Get-ChildItem dist -Recurse -Include *.js,*.css \| Measure-Object Length -Sum` |
| Catálogo | ~20,9 MB | **19,95 MiB** (`public/assets/databases/cecistudy_catalog.db`) | disco |
| Chunk de questões | ~4,4 MB | **4,39 MiB** (`bancoQuestoes-CCdRHTP9.js`; JSON fonte 4,98 MiB) | disco |
| Chunk "Three.js" | ~2,5 MB | **2,44 MiB** (`ThreeDPaper-DtUwI6bh.js` — 4 HTML com engine inlined 4×) | disco |
| Splash | 1.600 / 7.000 ms | **1600 / 7000 ms** (`BootSplash.tsx:11-12`) | código |
| Debounce de persistência | 200 ms | **200 ms** (`useSqliteState.ts:25`) | código |
| Intervalo de sync | 30 min | **30 min inline + `setTimeout` de 1,5 s pós-mudança** (`DataClientProvider.tsx:1080,1087`) | código |
| Loaders pré-carregados | 27 | **27** (`SharedScreenLayers.tsx:84-112`) | código |
| Fontes | — | **103 arquivos, 1,37 MiB; 51 `.woff2` + 52 `.woff` duplicados** | disco |

### Correções à spec antes de implementar (drift natureza I — o texto mente)

- **Fase 0 da spec está obsoleta:** não há 96 erros TS nem testes quebrados a
  corrigir. Sobrevive dela só a criação dos scripts (`typecheck`, `verify` etc.,
  §8.4) e a documentação de toolchain.
- **§2.2 menciona `Promise.all` como problema — não existe:** o boot é um
  `for...await` sequencial com `try/catch` por passo (`bootPreload.ts:179-187`).
  O defeito real é **serialização** (uma etapa de 2 s atrasa as demais) e
  **falha silenciosa** (`console.warn` em `bootPreload.ts:182-183`), não o efeito
  cascata.
- **§4.3 chama o chunk de "Three.js" — `three` não é dependência npm:** são 4
  HTMLs de ~616 KB cada com o engine embutido via `?raw`
  (`src/shaders/3d-paper/sources/*.html`, importados por `ThreeDPaper.tsx:3-6`),
  **duplicando o engine 4× no mesmo chunk**. O trabalho real é desduplicar as
  variantes, não "remover three do bundle".
- **O que a spec trata como futuro e JÁ existe** (não recriar):
  cache quente TTL 30 min (`bootPreload.ts:22`), dedup por promise memoizada
  (`bootPreload.ts:92-109`), prefetch pós-splash em `requestIdleCallback`
  (`bootPreload.ts:199-214`), telas com estado vazio + retry próprio
  (`QuizCategorySelector.tsx:230`, `FamilyDetailView.tsx:21`), hook de canvas
  compartilhado `useCanvasSetup` com IntersectionObserver + `visibilitychange` +
  DPR cap 2 + ResizeObserver + cleanup (`src/lib/useCanvasSetup.ts`),
  EdgeSwipeBack correto (não instala em pointer fino, `EdgeSwipeBack.tsx:41-42`),
  reduced-motion global sem violadores, `content-visibility` em 1 ponto
  (`ExploreSection.tsx:16`), sync manual com preview (`GithubSyncCard.tsx:135-162`).
- **Fase 9 da spec (navegação/gesto) já está quase toda entregue:** restam só
  teste de lazy/preload e a decisão de preservação de telas na pilha.

---

## F0 — Gate único e toolchain (resíduo real da Fase 0 da spec)

- [x] **F0.1** `package.json`: criar scripts `typecheck` (alias do `tsc --noEmit`),
  `test:ci` (`vitest run --reporter=dot`), `check:boundaries`,
  `build:web` (`vite build`), `build:mobile`
  (`npm run build --workspace=apps/mobile`) e `verify` (todos em sequência) —
  spec §8.4. A entrada `verify` vira o gate de PR.
  - *Accept:* `npm run verify` passa do zero em ambiente limpo. **Feito: exit 0
    em 2026-10-10** (typecheck verde · 1455 testes · boundaries OK · build web
    8,1 s · build mobile 6,7 s). `ci.yml` agora chama `npm run verify` —
    **nunca executou nesta máquina** (GitHub bloqueado por TLS); validar no
    primeiro PR.
- [x] **F0.2** Toolchain documentado no `AGENTS.md` do app: contrato Node 22
  (`.nvmrc` + `engines >= 22`), npm 10.x no CI, dev em Node 26 + npm 12
  (warning de `localStorage` tratado em `vitest.setup.ts`).
- [x] **F0.3** §3 da `spec-performance.md` atualizado com os números reais
  medidos (96 erros → 0; 115 testes → 1455), com nota de proveniência e a
  explicação do ZIP corrompido do baseline original.
- [x] **F0.4** Baseline reproduzível gerado: `dist` removido, `npm run
  build:web` medido (18,0 MiB JS · 120 arquivos · entrada crítica 799 KB raw /
  ~253 KB gzip), salvo em `artifacts/bundle-report.json` (geração manual
  documentada; script do pipeline é a F7.6). Build mobile também verde
  (18,88 MB JS em `apps/mobile/dist`).

**Verificação:** gates verdes; `npm run verify` é uma única entrada.

---

## F1 — Instrumentação (spec Fase 1)

- [x] **F1.1** `src/lib/performance/perfMarks.ts` criado com a API da spec
  (`mark`, `measure`, `recordEvent`, `flushDevMetrics`) + `traceAsync`
  (span assíncrono com finally) e `FrameStats`. No-op em produção (lê
  `import.meta.env.DEV` por chamada); registro próprio independente da User
  Timing API. Módulo puro — sem react/Capacitor/packages (boundary verde).
- [x] **F1.2** Marcas ligadas nos pontos que existem hoje: `app-entry-start`
  e `theme-ready` (`src/main.tsx`), `app-entry-start` (entry mobile),
  `first-screen-mounted` (`MobileAppShell`, cobre os dois entrys),
  `interactive-ready` + flush (`BootSplash`), `boot-critical-start/end` +
  `critical-boot-duration` (`runBootPreload` — hoje o span inteiro é crítico),
  `first-route-chunk` (passo `views`), `sqlite-hydration` (`getUserDb`),
  `catalog-request` (`getCatalogApproaches/Questions`), `persist-write`
  (`useSqliteState`), `sync-cycle` (`performSync`).
  **As marcas deferred/opportunistic nascem na F2**, quando os grupos existem.
  Nota: no cliente mobile o tema vem da hidratação do provider — o passo
  `theme` do boot é matéria da F2.
- [x] **F1.3** `FrameStats` no perfMarks (`createFrameStats`/`recordFrame`;
  `null` em produção). Consumo pelos 4 gráficos dithered entra na F4 — o
  aceite da F4 (frames == 0 invisível) usa este contador.
- [x] **F1.4** Documento de baseline criado: `docs/performance/perf-baseline.md`
  — como medir (grupo `[perf]` do console + User Timing), o que está medido
  (bundle/testes/gates, reproduzível) e o que **não** está (TTI real, Android,
  iPhone, saveData — pendência de ambiente sem SDK/browser automatizado, com
  o passo a passo para preencher quando houver device).
- [x] **F1 (teste de contrato)** `src/lib/performance/__tests__/perfMarks.test.ts`
  — 11 testes: nomes exatos das marcas, `measure` sem início não inventa
  número, traceAsync mede rejeição, flush limpa, no-op em produção
  (`vi.stubEnv('DEV', false)`), `createFrameStats` null em produção.
- [x] **F1 (gate)** `npm run verify` exit 0 — **1466 testes** (1455 + 11) /
  123 arquivos; boundaries verde; 2 builds verdes. Ajuste de ratchet: literal
  de movimento do BootSplash moveu de `:121` para `:127` (marcações acima) —
  `noInlineTokens.test.ts` atualizado com comentário, padrão SPEC-012 F3.5.

**Verificação:** `npm run verify` verde; grupo `[perf]` visível no console em
dev ao sair da splash.

---

## F2 — Boot progressivo (spec Fase 2)

- [x] **F2.1** Contrato `BootState`/`BootStepResult` no `bootPreload.ts`
  (`criticalReady`, `deferredReady`, `opportunisticReady`, `steps` por etapa,
  `errors`) — `BootStepId` é o da spec (`theme`, `user-db`, `user-state`,
  `catalog-core`, `catalog-approaches`, `catalog-questions`, `route-prefetch`).
  `BootProgress` (done/total/fraction) foi removido — só consumido pela splash.
- [x] **F2.2** Grupos com dependência real: critical = theme + user-db +
  user-state (no cliente web `theme` = done pois `initTheme` já rodou pré-React;
  `user-db`/`user-state` skipped — hidratação por coleção é pós-mount por
  design, tri-modal); deferred = catalog-core + route-prefetch; opportunistic =
  approaches + questions (skipped na janela quente de 30 min). Grupos rodam com
  `Promise.allSettled` — falha de etapa vira `errors`, não derruba o conjunto.
- [x] **F2.3** Dedup de execução: `runBootPreload` guarda a pipeline em
  `bootRun` — chamadas concorrentes (StrictMode) reutilizam a MESMA promise e
  o `onProgress` mais recente.
- [x] **F2.4** `BootSplash`: sai quando `criticalReady` (não espera
  approaches/questões/chunks profundos); barra = progresso SÓ do grupo crítico
  (`criticalFraction`); `MAX_DISPLAY_MS` mantido como escape **registrando o
  motivo** (`recordEvent('boot-max-display-escape', {elapsed, criticalReady,
  errors})` + warn); `prefers-reducedMotion` agora vem da fonte única
  `src/lib/motion` (antes o BootSplash duplicava a leitura e quebrava em jsdom).
  `MIN_DISPLAY_MS=1600` **mantido** — a redução para ≤500 ms (spec §9) depende
  de medição física pendente (decisão em aberto #5).
- [x] **F2.5** Testes: `bootPreload.test.ts` reescrito (14 testes: plano por
  grupo, BootState, falha não derruba, warm TTL, dedup, abort via signal,
  memoização) + `BootSplash.test.tsx` novo (4 testes com o `runBootPreload`
  REAL e gates por etapa: não sai antes do criticalReady; sai sem esperar
  questões; teto registra o motivo; StrictMode não executa duas vezes).
- [x] **F2 (ratchet)** literal de movimento do BootSplash movido para `:148`
  (reestruturação) — `noInlineTokens.test.ts` atualizado com comentário.

**Verificação:** `npm run verify` verde (1473 testes); splash sai sem o chunk
`bancoQuestoes` (grupo opportunistic pendurado na saída — provado em teste).

---

## F3 — Prefetch por rota, não global (spec Fase 3)

- [x] **F3.1** `SharedScreenLayers.tsx`: `SCREEN_CHUNK_LOADERS` virou
  `Record<ScreenKey, Loader>` (27 chaves explícitas, `export type ScreenKey`);
  `preloadScreenChunks(keys)` aceita **lista explícita** e delega à política —
  não existe mais caminho de produção que varre todos os loaders.
- [x] **F3.2** Chamada global removida dos dois entrypoints:
  `src/App.tsx` (efeito inteiro removido) e `apps/mobile/src/app/main.tsx:24`.
  O chunk da Home vem do boot (`route-prefetch`, grupo deferred).
- [x] **F3.3** `src/lib/performance/screenPrefetch.ts` criado com a política:
  `canPrefetch()` (saveData · effectiveType 2g/slow-2g · documento oculto),
  fila de baixa prioridade com limite 1 (2 somente em 4g comprovada sem
  saveData), `prefetchOnIntent` (fura a fila — navegação iminente), dedup por
  chave com retry após falha/timeout, timeout de 10 s como silêncio,
  `cancelQueuedPrefetches()` na troca de rota. O "quando" é do chamador
  (idle); o "se/quanto/dedup" é daqui.
- [x] **F3.4** Integração com chamadores reais: boot `scheduleIdlePrefetch`
  agora passa por `requestPrefetch` (chaves `screen:biblioteca`/`screen:estudos`
  — casam com as de SharedScreenLayers); `BottomNav` faz prefetch na
  **intenção observável** (`pointerdown` na aba via `aria-label`, sem tocar o
  `bottom-nav-bar` rachetado); `MobileAppShell` cancela a fila na troca de aba.
  Prefetch de `bancoQuestoes`/comparações/ThreeDPaper sem intenção: **não
  existe** (o boot antigo também não fazia; garantido pela política + teste).
- [x] **F3.5** Testes: `screenPrefetch.test.ts` (12 testes: política, dedup,
  limite de concorrência, fila cancelada na troca de rota, timeout silencioso
  com retry, intenção furando fila, sucesso marca carregado).

**Verificação:** `npm run verify` verde; `rg "preloadScreenChunks\(\)"`
retorna vazio em produção (só a assinatura com lista explícita existe).

---

## F4 — Canvas dithered pausável (spec Fase 5)

- [x] **F4.1** Loop controlado no hook compartilhado: novo `useDitherLoop` em
  `src/lib/useCanvasSetup.ts` — a ÚNICA política de animação dos 4 componentes
  (§5.4). `draw(now)` devolve true se precisa animar; inativo **cancela** o RAF
  pendente e não agenda mais nada; (re)ativar = frame imediato (estático se o
  draw não pedir). Os 4 migraram: growth, revenue, funnel, donut.
- [x] **F4.2** Conflito do hook corrigido: IO e `visibilitychange` agora escrevem
  em refs SEPARADAS (`viewportRef`/`documentRef`) e o `isVisible` é o COMBINADO
  (só muda quando o combinado muda) — voltar de aba oculta não reativa mais um
  canvas fora da viewport. **Bug extra encontrado e corrigido:** o ref inicial
  não lia o `document.visibilityState` real — app montado com a aba já em
  background animava até o primeiro evento.
- [x] **F4.3** `prefers-reduced-motion` **para o loop**: garantia DURA no
  `useDitherLoop` (nunca reagenda, mesmo se o draw pedir — RNF-03, não
  convenção). Frame estático por mudança de dado/tema continua.
- [x] **F4.4** Otimizações de desenho: `getContext` UMA vez (`ctxRef` no setup,
  4 componentes); growth sem alocação por frame (buffer `curDataRef` mutado
  in-place, antes `.map` por frame); DPR cap 2 e ResizeObserver já existiam.
  Cache de grade estática/`OffscreenCanvas` ficou como refinamento posterior
  (§5.3) — o loop parado elimina o custo dominante.
- [x] **F4.5** Divergências unificadas: throttle ~30fps do funnel removido;
  clock local ao efeito (revenue/funnel) → `timeRef` sobrevivente; deps do
  efeito de draw extintas (drawRef sempre fresco); shimmer congela com dado
  estável (`needsAnimation = morph || interação`, §5.2). *(se a dona quiser o
  shimmer vivo contínuo, é um `||` a mais em needsAnimation — decisão dela.)*
- [x] **F4.6** Testes: `ditherLoop.test.tsx` (7 testes com o par de hooks REAL):
  draw estável congela; loop segue enquanto pede; oculto antes do mount = zero
  rAF/zero frames; ocultou com pendente = cancelado; reativou = 1 frame
  estático; reduced-motion nunca reagenda (garantia dura); `scheduleFrame`
  idempotente. `FrameStats` (F1.3) conta tudo — em produção é null (zero custo).
- [x] **F4 (ratchet)** literais de growth (`:96-97`) e revenue (`:80-81`)
  atualizados com comentário (migração para o loop controlado).

**Verificação:** `npm run verify` verde; `FrameStats.frames == 0` com canvas
invisível/aba oculta/reduced-motion (provado em teste); smoke dos 4 charts
intacto.

---

## F5 — Fila de escrita SQLite (spec Fase 7) — fase de maior risco

- [x] **F5.1** `src/lib/db/writeQueue.ts` criado: fila por chave de coleção com
  versão monotônica (atribuída pela FILA, não pela instância do hook — remount
  não enfileira "versão 1" depois de "versão 5"), coalescing (só a pendência
  mais nova sobrevive), debounce 200 ms, `flushWriteQueue(key?)`,
  `cancelPendingWrite(key)`, `invalidatePendingWrites()` (reset/import).
  Durabilidade é da fila: `pagehide` e `visibilitychange→hidden` drenam
  globalmente; o unmount de hook não descarta pendência.
- [x] **F5.2** `useSqliteState.ts` adota a fila: o write-through virou
  `enqueueWrite` por mudança de estado (sem cleanup de descarte — o bug do
  unmount); erro retém pendência para retry SEM auto-retry (o caminho de erro
  quase virou loop infinito na primeira versão — pego pelo próprio teste de
  estresse e corrigido: o pump pós-conclusão só dispara pendência
  **estritamente mais nova**).
- [x] **F5.3** Flush: `pagehide`/`visibilitychange` drenam a fila (donos do
  contrato agora são a fila, não cada hook). Unmount com pendência escreve
  mesmo assim — provado em teste.
- [x] **F5.4** Escrita perdida durante a hidratação CORRIGIDA (duas metades):
  (a) `hydrated` virou **estado** — quando a hidratação sinaliza, o write-through
  roda e enfileira a edição feita no intervalo; (b) `dirtyRef` + setter wrapper
  — a hidratação NÃO reverte mais edição em memória (LWW: a edição da usuária
  vence o disco). Provado em teste com `loadCollection` pendurado.
- [x] **F5.5** `resetApp`/`importData` chamam `invalidatePendingWrites()` antes
  de aplicar o novo snapshot (import aguarda o invalidamento; reset dispara
  antes do `applyDatabase`). Com a serialização por versão, o estado final é
  correto mesmo no pior caso; a invalidação é o cinto da spec §7.2.
- [x] **F5.6** Testes (§7.3): `writeQueue.test.ts` (10: debounce, 50
  enfileiramentos → último valor, lenta+rápida não regride, flush ignora
  debounce, erro retém sem auto-retry, flush com falha persistente ≤2
  tentativas SEM loop, cancelPending não toca em andamento, duas coleções sem
  bloqueio mútuo, invalidação aguarda em andamento, versões monotônicas) +
  `useSqliteState.queue.test.ts` (web real: 50 updates → último; unmount não
  perde; flush drena) + `useSqliteState.native.test.ts` (hidratação com edição:
  não revertida e persistida; sem edição: disco aplicado normal).
  `useStampedState` envolve `useSqliteState` — coberto pelo mesmo caminho.

**Verificação:** `npm run verify` verde (nenhuma regressão nos testes
indiretos: TccView, dataClient, engine, exportImport).

---

## F6 — Sync de background estável (spec Fase 8)

- [x] **F6.1** `SYNC_INTERVAL_MS = 30 min` como constante nomeada — o literal
  inline morreu; vive em `src/lib/sync/useBackgroundSyncTriggers.ts`.
- [x] **F6.2** Lifecycle extraído para `useBackgroundSyncTriggers(config, run)`:
  o efeito depende SÓ da configuração; o callback operacional vive em **ref**
  (snapshot mais fresco a cada render — `runRef.current = run`). O provider
  chama `useBackgroundSyncTriggers(githubSyncConfig, syncInBackground)`. O
  efeito antigo dependia de ~30 estados via closures e reinstalava
  timer+listeners a cada mudança de qualquer coleção.
- [x] **F6.3** Trava `inFlight`: abertura (timeout inicial) + `online` + timer
  + `pagehide` nunca concorrem localmente — no máximo UM sync por vez. (O CAS
  via `baseBlobSha` continua protegendo o remoto como antes.)
- [x] **F6.4** `beforeunload` → `pagehide` (o antigo não dispara confiavelmente
  em WebView mobile) — provado por teste que `beforeunload` não é mais ouvido.
- [x] **F6.5** O `setTimeout` de 1,5 s **resolvido por consequência**: com deps
  `[config]`, ele roda UMA vez por ativação da configuração (o "sync ao abrir"
  original) — o sync ~1,5 s após CADA edição era artefato da reinstalação do
  efeito, e morreu com ela. *(Se a dona quiser sync debounced pós-edição como
  feature, é decisão explícita nova — decisão em aberto #3 atualizada.)*
- [x] **F6.6** Testes: `useBackgroundSyncTriggers.test.ts` (6: sem config nada
  roda; sync inicial UMA vez + intervalo sem reinstalar por mudança de estado;
  trava inFlight com sync pendurado; online/pagehide disparam sem beforeunload;
  limpar config remove tudo; StrictMode não duplica).

**Verificação:** `npm run verify` verde; sync manual com preview/aplicar/descartar
intacto (nenhum teste de GithubSyncCard/preview tocado).

---

## F7 — Conteúdo e bundle (spec Fase 4)

- [ ] **F7.1** Banco de questões (4,39 MiB em chunk; 4,98 MiB de JSON fonte):
  particionar por grupo natural (área/domínio) com manifest versionado
  (`version`, `url`, `bytes`, `sha256`); quiz carrega só o grupo; cache por grupo
  no web; no nativo, consulta por grupo com índice em vez de
  `SELECT data_json FROM question` inteiro (`catalogDb.ts:132-137`); validar
  IDs/ordem/filtros com snapshot antes/depois. **Pré-requisito:** sair do boot
  crítico (F2.2).
- [ ] **F7.2** Approaches: sair do boot (hoje passo do boot + seed no provider,
  `bootPreload.ts:54-58`, `DataClientProvider.tsx:494-509`) — índice compacto
  primeiro (chunk de 1,02 MiB hoje), detalhe ao abrir. Autores/comparações já
  têm facade assíncrona (`AuthorsScreen.tsx:4`); falta índice compacto
  (`data/temple/authors.ts:3` importa JSON de 2,09 MiB estático).
- [ ] **F7.3** `ThreeDPaper`: desduplicar o engine das 4 variantes HTML
  (~616 KB cada, `src/shaders/3d-paper/sources/*.html`, importadas juntas por
  `?raw` em `ThreeDPaper.tsx:3-6` — 2,44 MiB no chunk, 4× o mesmo engine).
  Extrair o que é comum, variantes só com o que difere; manter lazy (já é,
  `Paper3DCard.tsx:5-7`); fallback CSS/estático em saveData/aparelho fraco;
  pausa por IO/`visibilitychange` já existe (`ThreeDPaper.tsx:38-55`) — manter.
- [ ] **F7.4** Fontes: eliminar a publicação duplicada `.woff`+`.woff2`
  (52 + 51 arquivos, 1,37 MiB) — manter só `woff2` (suporte universal no
  público do app); revisar pesos por família (Inter 4, Plus Jakarta Sans 5,
  DM Serif 2, JetBrains Mono 1) com justificativa por peso. *(a decisão de
  remover peso é visual — aprovação da dona)*
- [ ] **F7.5** Catálogo nativo (19,95 MiB): consultas paginadas/limitadas por
  domínio no lugar de materialização; índices só para consultas comprovadas;
  versão + checksum para invalidação; migração e fallback para catálogo anterior.
- [ ] **F7.6** Relatório de bundle no pipeline: `artifacts/bundle-report.json`
  com bytes brutos/comprimidos, origem, rota e classificação
  (critical/deferred/opportunistic); falhar CI só nas regressões da spec §10
  (+10% no crítico, chunk crítico > 500 KiB sem anotação, oportunístico no
  entrypoint).
- [ ] **F7.7** Testes de equivalência: quiz com grupos particionados devolve os
  mesmos IDs/ordem/filtros; catálogo nativo e web convergem (golden).

**Verificação:** `npm run verify` verde + `npm run content:build && npm run
db:verify && npm run content:check` verde; chunk de questões não carregado fora
do quiz; `ThreeDPaper` chunk ≤ ~1/3 do atual.

---

## F8 — Contextos por profiler (spec Fase 6)

Estado atual: os 6 sub-contextos existem e são estáveis
(`shellNavContexts.ts:50-55`, fatias memoizadas em `DataClientProvider.tsx:1106-1217`);
as 5 views de tab já migraram. Falta: o agregado e os consumidores.

- [ ] **F8.1** Memoizar o valor agregado: `MobileAppProvider.tsx:45`
  (`buildAppContextValue` chamado sem `useMemo`) e o objeto de
  `useDataClient` (`DataClientProvider.tsx:1335-1488`, literal novo por render).
  Revisar deps dos `useMemo`/`useCallback` existentes.
- [ ] **F8.2** Instrumentação de dev: contador de renders por tela pesada + marca
  de mudança de contexto (F1) + `Profiler` React em cenários controlados
  (spec §6.1: toast, editar curso, streak, tema, push/pop, sync, nota com
  Biblioteca montada). **Medir antes de migrar.**
- [ ] **F8.3** Migrar consumidores por medição — ~63 chamadas de `useMobileApp()`
  restantes. Prioridade pelas telas pesadas: `TccView.tsx:111`,
  `InternshipDiaryView.tsx:59`, `InternshipCaseView.tsx:37`,
  `StudyHistoricoScreen.tsx:22`, `StreakView.tsx:23`, `StickersView.tsx:26`,
  `ComposeNoteView.tsx:52`, `ClassNoteDetailScreen.tsx:40`,
  `ReadingHubScreen.tsx:68`; e os que usam o agregado só para uma ação:
  `RecordEditSheet.tsx:45`, `ClassNoteListItem.tsx:19`, `ManageSurface.tsx:25`,
  `FamiliesView.tsx:8`, `ArticleDetailModal.tsx:26`, `CourseCreateMenu.tsx:32`,
  `TempleScreen.tsx:81`, `SyncScreen.tsx:61`, `TodayClasses.tsx:24`,
  `CourseAttendanceCard.tsx:106`, `ManageDataModal.tsx:97`.
  Callbacks estáveis (`useCallback`), objetos de bundle estáveis (`useMemo`); sem
  `useMemo` às cegas (spec §6.2).
- [ ] **F8.4** Catálogos estáticos fora do valor de contexto de usuário:
  `approaches` (97 itens, ~1 MiB) e `questions` vivem como `useState` no
  provider e viajam no valor agregado (`DataClientProvider.tsx:494,679,1359,1418`) —
  separar (facade/contexto próprio), para mudança de catálogo não invalidar
  telas de domínio. Depende da F7.
- [ ] **F8.5** Testes: ação de um domínio não re-renderiza tela sem dependência
  (medição via `Profiler` em teste); identidade estável onde for contrato;
  import/export, reset, onboarding e sync sem mudança de comportamento.

**Verificação:** `npm run verify` verde; números antes/depois do profiler no
documento de baseline.

---

## F9 — Navegação: só fechar lacunas (spec Fase 9 — já quase toda entregue)

Não reabrir o que está pronto: pilha como fonte de verdade
(`navigationEngine.ts:332-334`, hash espelho `:594-657`), `shouldIgnoreTarget`
(`swipe.ts:27-40`), `EdgeSwipeBack` com `pointer: coarse` + cleanup simétrico
(`EdgeSwipeBack.tsx:41-42,106-115`), congelamento da tela de saída
(`SlideScreen.tsx:34-104`), reduced-motion global sem violadores.

- [x] **F9.1** Teste de lazy/preload criado (lacuna real da auditoria):
  `screenLayersPrefetch.test.ts` (5 testes no nível certo — a LIGAÇÃO com a
  política: lista explícita via `requestPrefetch`, 1 chave = 1 pedido, intenção
  via `prefetchOnIntent`, chave inválida = silêncio; o comportamento da
  política em si é contrato de `screenPrefetch.test.ts`).
- [ ] **F9.2** Preservação de telas na pilha: a política atual é **remontar**
  na volta. Mudar para "manter montada" é decisão de produto — **[A], aberta**.
- [ ] **F9.3** `content-visibility: auto` além de `ExploreSection.tsx`:
  estender só após medir e testar teclado/scroll/acessibilidade — **pendente
  de medição (F1.4)**.
- [x] **F9.4** Regressão de lifecycle (parte automatizável): teste do
  `EdgeSwipeBack` — 20 remontagens com ponteiro coarse instalam/desinstalam
  simetricamente os 4 listeners da janela (zero acúmulo); ponteiro fino não
  instala nada. Salto de scroll/teclado aberto são validação de device (F10.4).

**Verificação:** `npm run verify` verde; suíte de navegação existente
(`routing.test.ts`, `navigationRegression.test.tsx`, `swipe.test.ts`) sem
regressão.

---

## F10 — Validação final, flags e rollback (spec §11-§15)

- [ ] **F10.1** Flags temporárias durante o desenvolvimento
  (`progressiveBoot`, `routePrefetch`, `pausedCanvasLoops`, `queuedSqliteWrites`,
  `stableBackgroundSync`) — ligadas em dev após testes básicos, desligáveis em
  staging, nunca expostas à usuária, removidas após uma versão estável.
- [ ] **F10.2** Rollback exercitado em staging por fase (spec §12: cada fase
  reversível; nunca apagar banco da usuária; migrações aditivas).
- [ ] **F10.3** Métricas antes/depois contra os orçamentos da spec §9
  (`critical-boot-duration` P75 ≤ 800 ms, TTI P75 warm ≤ 1,2 s / cold ≤ 2,5 s,
  espera artificial ≤ 500 ms, 0 RAF invisível, 0 writes concorrentes por chave,
  0 listeners duplicados). P95 real documentado quando hardware impedir a meta.
- [ ] **F10.4** Validação nativa (Android/iOS, teclado, safe area, back/gesto,
  offline/online, background) — pendente de máquina com SDK; registrar o que
  foi validado em simulador web.
- [ ] **F10.5** Remover as flags e atualizar o §3 da spec com o baseline final.

**Verificação:** checklist final da spec §15 fechado item a item.

---

## Decisões em aberto (para a dona do produto — agente não fecha)

| # | Pergunta | Afeta | Marca |
|---|---|---|---|
| 1 | Ativar `strict` no `tsconfig.json`? O tsc está verde **sem** `strict` hoje; a spec proíbe usá-lo para esconder erros, mas ativá-lo pode revelar um lote novo. | F0 | `[A]` |
| 2 | Preservar telas montadas na pilha (memória) vs. remontar na volta (estado de scroll)? | F9 | `[A]` |
| 3 | O sync ~1,5 s após cada edição era acidente das deps largas — **resolvida pela F6** (o sync inicial de 1,5 s roda 1× por ativação da config). Se a dona quiser sync debounced pós-edição, é feature nova explícita. | F6 | **resolvida 2026-10-10** |
| 4 | Fontes: manter os pesos atuais ou subsetting por uso real? (decisão visual) | F7 | `[P]` |
| 5 | `MIN_DISPLAY_MS` da splash: qual o piso visual aceitável? | F2 | `[P]` |
| 6 | Atualizar o §3 da spec (`spec-performance.md`) com o baseline real medido acima? | F0 | **resolvida 2026-10-10** |

---

## Ordem recomendada de commits (spec §16, ajustada ao estado real)

1. `chore: add verify gate and document toolchain` (F0)
2. `test: add performance and boot baseline instrumentation` (F1)
3. `perf: split critical deferred and opportunistic boot` (F2)
4. `perf: replace global screen preload with route-aware prefetch` (F3)
5. `perf: pause dither canvas loops outside viewport` (F4)
6. `perf: serialize sqlite writes per collection` (F5)
7. `perf: stabilize background sync lifecycle` (F6)
8. `perf: partition heavy catalog and question resources` (F7)
9. `perf: migrate profiled consumers to domain bundles` (F8)
10. `test: add navigation lazy and regression coverage` (F9)
11. `chore: remove temporary performance flags` (F10)

Cada commit passa pelo subset relevante de `npm run verify` e não mistura
correção funcional com otimização de runtime.
