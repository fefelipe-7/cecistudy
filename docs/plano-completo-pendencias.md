# Plano Completo de Pendências — cecistudy ♡

> **Propósito:** mapear e executar TODOS os planos de implementação não concluídos, features
> implementadas pela metade e débito técnico identificados no projeto. Criado do zero a partir
> de varredura paralela por agentes (2026-09-04).
>
> **Fonte dos achados:** `tasks/plan.md` (Fase C) · `docs/archive/specs/` · `.context/backlog.md` ·
> `.context/docs/plano-estagio-v3.md` · `docs/archive/desktop-context/` ·
> `cecistudy-rust/spec/` · `docs/*` · varredura de stubs/features pela metade no código.
>
> **Nota sobre work-in-progress:** este plano NÃO substitui `tasks/plan.md`/`tasks/todo.md`
> (refatoração MOD-001/HAR-001/SEP-001, ~90% concluída). Ele é complementar: a **Fase C** do
> plano antigo (separação mobile/desktop) é aqui absorvida e aprofundada na **Fase 1**.

---

## 0. Capability Map

> Mapa de módulos, dependências e ordem de build (spec-driven-development — Phase 0).
> `DEP-SEP` destrava entregas independentes; `ESTAGIO` e `STUBS` destravam qualidade de
> superfície; greenfield (MKT/CAL/DOC/SYNC/ENGINE) depende das fundações.

| Módulo id | Responsabilidade | Depende de | Status |
|---|---|---|---|
| `sep` | Concluir separação mobile/desktop (Fase C + 10.5) | — | Em progresso |
| `estagio` | Reestruturar estágio v3 (unificar em `InternshipLog`) | `sep` (trivial) | Em transição |
| `stubs` | Remover features pela metade / dead code / copy "em breve" | `sep` | Vários |
| `techdebt` | QA pendente (validação de formulários, datas, onboarding) | — | Vários |
| `testes` | Cobrir gaps críticos + infra de cobertura | `sep` | Vários |
| `mkt` | Studio de Marketing (UI sobre domain pronto) | `sep` | Greenfield |
| `cal` | Calendário como domínio (Event/Responsibility/PlanningBlock) | `sep` | Greenfield |
| `doc` | Documents & Blocks (editor paginado) | `estagio?(não)` `cal?(recebe rota)` | Greenfield |
| `sync-p2p` | Transporte de sync dispositivo-a-dispositivo | `sep` | Stub |
| `engine` | Advanced Engines (context/knowledge packets) | `sep` | Greenfield |

**Build order (foco executável):**
`sep → test-stubs → estagio → stubs → techdebt → testes → [mkt | cal | doc | sync-p2p | engine]`

---

## 1. Fase 1 — Concluir a Separação Mobile/Desktop (`sep`)

> **Estado:** Fases 0–10.1 da separação feitas. `DesktopSidebar`/screens/`useDesktopApp` migrados.
> Pendente: Fase C (C.1–C.7) do `tasks/plan.md` + Fase 10.5 (overlays/providers) que o
> `07-estado-execucao.md` diz "feito" mas o código **não tem** (`src/overlays/SharedOverlays.tsx`
> é o único; não há `MobileOverlays`/`DesktopOverlays`).
>
> **Atualizado 2026-09 (limpeza do legado):** o desktop React/Tauri foi **removido por completo**
> (`desktop/`, `apps/desktop/`, `src/desktop/` não existem mais). Os T-1.x que descreviam a remoção
> (T-1.5/T-1.6) foram **executados**; T-1.8 (Desacoplar `DesktopAppProvider`) ficou **superseded**.
> As features "desktop" das Fases 3/8 (marketing/calendar/projects) ficam **canceladas** como
> produto React — habitam o plano Flutter+Rust (`cecistudy-rust/spec/`).
>
> **Gate principal:** `npm run lint` + `npm run test` + `npm run build` + builds `apps/*` +
> `node .github/scripts/check-boundaries.mjs`.

### T-1.1 Mover overlays para cada app (10.3 / C.7)
- **Acceptance:** `apps/mobile/src/overlays/MobileOverlays.tsx` existe; `src/overlays/SharedOverlays.tsx` removido; cada shell renderiza seus overlays. (Overlays desktop encerrados com o legado — 2026-09.)
- **Verify:** `npm run lint` + `npm run test` + builds `apps/*` + `check-boundaries`
- **Files:** `apps/*/src/overlays/*`, `src/shells/*AppShell.tsx`, `src/overlays/`

### T-1.2 Remover `ScreenLayers.tsx`, animações diretas no shell (C.2 / 10.4)
- **Acceptance:** `src/shells/ScreenLayers.tsx` deletado; o shell mobile usa transições próprias (`MobileAppShell`/`SharedScreenLayers`). (O shell desktop foi removido com o legado — 2026-09.)
- **Verify:** `npm run test` + builds; swipe-back (Fase 13) continua funcionando.
- **Files:** `src/shells/ScreenLayers.tsx` (deletar), `MobileAppShell.tsx`

### T-1.3 Zerar imports de `useApp` em views (C.3)
- **Acceptance:** zero `useApp` em `src/components/views/**` e `src/shells/**`; tudo via `useMobileApp` (o `useDesktopApp` foi removido com o legado — 2026-09).
- **Verify:** `npm run test` + grep `useApp`
- **Files:** `src/components/views/**`, `src/context/mobileApp.ts`, `src/context/desktopApp.ts`

### T-1.4 Manter `useApp` só para testes; esvaziar facade `AppContext` (C.4 + 10.5)
- **Acceptance:** `AppContext.tsx` é só facade; `useApp` exportado apenas p/ compat de testes (`appProviders.test.tsx` continua verde).
- **Verify:** `npm run test` (todos verdes)
- **Files:** `src/context/AppContext.tsx`

### T-1.5 Remover `isDesktop` de `src/App.tsx` e `src/shells/*` (C.5)
- **Acceptance:** `src/App.tsx` é web mobile-only; `isDesktop` só em `src/lib/platform.ts`.
- **Verify:** `npm run build` + grep `isDesktop`
- **Files:** `src/App.tsx`, `src/shells/*`
- **Status (2026-09):** executado — `src/lib/platform.ts` foi **removido** com o legado desktop.

### T-1.6 Remover `src/desktop/` legado (C.6)
- **Acceptance:** `src/desktop/` removido (componentes migrados para `apps/desktop`); boundary verde.
- **Verify:** `node .github/scripts/check-boundaries.mjs`
- **Files:** `src/desktop/`
- **Status (2026-09):** executado — `src/desktop/`, `apps/desktop/` e `desktop/` **removidos por completo**.

### T-1.7 Tornar `MobileAppProvider` real (extrair estado mobile)
- **Acceptance:** `apps/mobile/src/MobileAppProvider.tsx` deixa de ser facade puro; navigation/quick-actions state mobile extraído (verbo comentado "será extraído aqui nas próximas fases").
- **Verify:** `npm run test` + build mobile
- **Files:** `apps/mobile/src/MobileAppProvider.tsx`, `apps/mobile/src/*`

### T-1.8 Desacoplar `DesktopAppProvider` do `useMobileApp`
- **Acceptance:** `DesktopAppProvider` carrega seu próprio valor base a partir de `DataClient`/`AppBaseContext`, sem ler via `useMobileApp()` (seam da refatoração 10.5).
- **Verify:** `npm run test` (`appProviders`/`desktopSession`) + builds
- **Files:** `apps/desktop/src/DesktopAppProvider.tsx`, `src/context/appContexts.ts`
- **Status (2026-09):** **superseded** — `apps/desktop` foi removido com o legado desktop.

### T-1.9 Limpar `packages/application` (stub)
- **Acceptance:** `packages/application` deixa de re-exportar `src/core/application/use-cases`; contém use-cases reais ou é consolidador.
- **Verify:** `npm run lint` + `check-boundaries` + `npm run test`
- **Files:** `packages/application`

**Checkpoint 1:** `npm run lint` + `npm run test` + `npm run build` + builds `apps/*` + `check-boundaries` **todos verdes**. Revisão humana antes de avançar. ✅

---

## 2. Fase 2 — Reestruturação de Estágio v3 (`estagio`)

> **Estado:** o `plano-estagio-v3.md` está "em transição" mas as Fases 1–2 já parecem avançadas
> (tipos novos removidos de `src/types/internship.ts` — só resta `SupervisionNotebook`).
> **Verificar o estado real antes de executar** (confiar no código, não no doc). Plano executor:
> `.context/docs/plano-estagio-v3.md` (9 fases) já detalha cada passo → referenciar.

### Tasks executáveis (ordenadas, gate = lint+test a cada fase)
- **T-2.1** Confirmar remoção total dos tipos novos (`InternshipCase/Session/Supervision/Intervision`, `HourType`, `InternshipGoals`): grep por cada um em todo `src/` + `packages/`.
  - Acceptance: zero ocorrências desses tipos.
  - Verify: grep + `npm run lint` + `npm run test`
- **T-2.2** Renomear `InternshipLogLegacy` → `InternshipLog` (com alias temporário + migração de chave `internshipLogsLegacy`→`internshipLogs`, se aplicável). *Doc plano-estagio-v3 Fase 2.*
- **T-2.3** Unificar `SupervisionNotebook` → `InternshipLog` (campos novos + migração one-shot + remoção do tipo/state/CRUD). *Doc Fase 3.*
- **T-2.4** Criar `src/lib/internshipCycle.ts` (`derivedPhase`) e `src/lib/internshipCases.ts` (`deriveCases`) + testes. *Doc Fase 4.*
- **T-2.5** Atualizar `InternshipWizard` (3 passos, campo "atendimentos discutidos", salvar `supervisionLogId`). *Doc Fase 5.*
- **T-2.6** Atualizar `InternshipDiaryView` (remover ciclo/filto, bloco de pendências, aba "por paciente"). *Doc Fases 6–7.*
- **T-2.7** Reescrever `SupervisionView` como vista filtrada. *Doc Fase 8.*
- **T-2.8** Ajustes finais (preview, Perfil, ManageDataModal, docs, `SCHEMA_VERSION`). *Doc Fase 9.*

**Checkpoint 2:** estágio v3 completo; backup/restore botão "carregar exemplos/resetar" válida `internshipLogs`; `check-boundaries` verde. ✅

---

## 3. Fase 3 — Feature stubs & features pela metade (`stubs`)

> Estado real confirmado por varredura. Cada item é independente (ordem por impacto).

### T-3.1 Marketing: montar UI sobre o domínio pronto (porta de entrada do `mkt`)
- **Estado (2026-09):** **cancelado como produto React** — a UI desktop foi removida com o legado. O domínio (`packages/domain/src/core/domain/marketing.ts`) permanece; a UI passa para o plano Flutter+Rust (`cecistudy-rust/spec/`).
- **Acceptance:** screen `MarketingScreen` (mobile ou desktop-novo) consumindo os use-cases; nav item ativo; CPF/Canal variant visíveis.
- **Verify:** `npm run lint` + `npm run test` + build mobile
- **Files:** — (legado `apps/desktop/`/`src/desktop/screens/MarketingScreen.tsx` removidos)
- **Scope:** esse é o começo do `mkt` (ver Fase 8). **Decisão de produto** necessária antes (positioning profile vazio?).

### T-3.2 Synchronizer P2P: implementar o transporte (`sync-p2p` — ver Fase 8)
- **Estado:** `resolveSyncTransport()` retorna `null` (`packages/sync/src/transport-bridge.ts`); UI completa (`SyncScreen`), pairing/QR puros testados.
- **Acceptance:** transporte real no `resolveSyncTransport`; `SyncScreen` sai de "em breve".
- **Verify:** `npm run test` (sync: pairing/engine/merge)
- **Files:** `packages/sync/src/transport-bridge.ts`, `src/lib/sync/channel.ts` (criar)
- **Nota:** transporte network (Trystero/nostr) é decisão de arquitetura → **abrir antes de implementar**.

### T-3.3 Projects: árvore acadêmica + editor paginado visual
- **Estado (2026-09):** a UI desktop (`src/desktop/components/ProjectsScreen.tsx`) foi **removida** com o legado. CRUD de projetos/outputs no domain permanece; UI passa para o plano Flutter+Rust.
- **Acceptance:** editor visual paginado renderiza seções; árvore configurável navegável.
- **Verify:** build + testes de projeto
- **Files:** — (legado `src/desktop/components/ProjectsScreen.tsx` removido)
- **Nota:** depende do `doc` (Fase 8) para o editor de blocos; se `doc` não estiver pronto, implementar um editor mínimo local.

### T-3.4 Calendário desktop: implementar o menu "⋯" (mais opções)
- **Estado (2026-09):** **cancelado como produto React** — a UI desktop de calendário (`src/desktop/components/calendar/`) foi **removida** com o legado; o domínio de calendário dos planos segue no Rust (módulo `calendar` portado).
- **Acceptance:** menu com ações reais (ex.: nova tarefa/reunião, filtros).
- **Verify:** build + teste manual
- **Files:** — (legado `src/desktop/components/calendar/CalendarScreen.tsx` removido)

### T-3.5 ApproachDetailView: conectar "conceitos e técnicas" em vez de "chegam em breve"
- **Estado:** `ApproachDetailView.tsx:200-203` mostra placeholder; authors ok, conceitos/técnicas não vinculados.
- **Acceptance:** lista conceitos/técnicas do templo para a abordagem (via `openApproach`/temple data).
- **Verify:** `npm run test` (templeData) + build
- **Files:** `src/components/views/ApproachDetailView.tsx`

### T-3.6 ReaderModeModal: remover parágrafo fictício residual
- **Estado:** `ReaderModeModal.tsx:137-142` renderiza parágrafo hardcoded incondicional (backlog #12).
- **Acceptance:** parágrafo fictício removido; exibe só conteúdo real (chapters/highlights/fallback honesto).
- **Verify:** `npm run lint` + `npm run test`
- **Files:** `src/components/widgets/ReaderModeModal.tsx`

### T-3.7 TempleScreen: remover toast "em breve: famílias ♡" morto/enganoso
- **Estado:** `TempleScreen.tsx:36` toast morto (o card já navega para `FamiliesView` completa); `:93` else inalcançável.
- **Acceptance:** card famílias sem toast enganoso; fallback limpo.
- **Verify:** `npm run lint` + `npm run test`
- **Files:** `src/components/library/TempleScreen.tsx`

### T-3.8 Remover estado morto `subTabEstudos`
- **Estado:** `subTabEstudos`/`setSubTabEstudos` nunca lidos/ chamados (`AppContext.tsx:628`); conceito de sub-tab de estudos virou telas dedicadas.
- **Acceptance:** removido de ctx/types/routing; sem desync.
- **Verify:** `npm run lint` + `npm run test`
- **Files:** `src/context/AppContext.tsx`, `src/types/navigation.ts`

### T-3.9 Remover ponte nativa órfã `native-navigation.ts`
- **Estado:** `src/navigation/native-navigation.ts` é bridge Capacitor com uso 100% comentado; edge-swipe-back real é JS (Fase 13).
- **Acceptance:** arquivo removido (ou reativado se usado).
- **Verify:** `npm run lint` + `npm run test` + build
- **Files:** `src/navigation/native-navigation.ts` (deletar)

### T-3.10 HomeView: derivar "aulas de hoje" e "assuntos a estudar" do estado
- **Estado:** ainda dummy (backlog #9/B3). `TodayClasses`/`AttentionSection` renderizam dados simulados.
- **Acceptance:** dados reais do estado (classes/tasks/exams) com fuso local; empty state acolhedor quando vazio.
- **Verify:** `npm run lint` + `npm run test` + `npm run build`
- **Files:** `src/components/views/home/*`

### T-3.11 Estudos sub-aba "leituras/quizzes" — confirmar telas dedicadas (não reverter)
- **Estado (verificado):** as sub-actions do EstudosView já abrem telas reais (`StudyLeiturasScreen`, quiz, TCC). **Não é stub** — apenas garantir no mapa que `subTabEstudos` removido (T-3.8) não quebra rota.
- **Acceptance:** nenhuma regressão; build verde.

**Checkpoint 3:** zero "em breve ♡" enganoso em features implementadas; HomeView real; dead code removido. ✅

---

## 4. Fase 4 — QA pendente & tech debt (`techdebt`)

> Itens de `docs/manual-findings.md` / `docs/manual-tests.md` e follow-ups das Fases 12/13/21.

### T-4.1 Validação visível em formulários (P2)
- **Estado:** formulários vazios de matéria/prova/atendimento bloqueiam **sem mensagem** (manual-tests 5.2).
- **Acceptance:** wizard mostra erro inline no campo/step quando bloqueado (mensagem acolhedora).
- **Verify:** teste manual dos 3 fluxos + build
- **Files:** `CourseWizard`, `TaskExamWizard`, `InternshipWizard` (validação/step)

### T-4.2 Botão contextual "criar disciplina" no wizard (P2)
- **Estado:** `TaskExamWizard` informa que não há disciplinas, mas não oferece criar (manual-tests 5.3).
- **Acceptance:** CTA "criar disciplina" a partir do wizard sem disciplina.
- **Verify:** teste manual + build
- **Files:** `src/components/wizards/TaskExamWizard.tsx`

### T-4.3 Permissões web como info (não toggle desabilitado) (P3/F9)
- **Estado:** switches de permissão aparecem desabilitados na web (manual-tests 5.7).
- **Acceptance:** na web, exibir como informação (badge "nativo") sem affordance de toggle.
- **Verify:** teste manual web + build
- **Files:** onboarding/permissions

### T-4.4 Padronizar "sem data" em transformações (`NoteTransformWizard`)
- **Estado:** follow-up Fase 21 — `examDate`/`sessionDate`/`internshipDate` ainda usam `|| today()`.
- **Acceptance:** `undefined` em vez de `today()` quando sem data, no fluxo completo de transformação.
- **Verify:** `npm run test` + manual
- **Files:** `src/components/views/NoteTransformWizard.tsx`

### T-4.5 Revisar conquista de onboarding disparada com banco vazio (P2)
- **Estado:** `🌷 cantinho organizado ♡` desbloqueia mesmo com dado nenhum (manual-findings R1).
- **Acceptance:** decisão de produto tomada (celebrar só com conteúdo real, ou manter como onboarding e documentar).
- **Verify:** manual
- **Files:** stickers/unlock logic

### T-4.6 Documentar estratégia de busca da Biblioteca (P3/F10)
- **Acceptance:** doc de decisão (item vs coleção) criado.
- **Verify:** revisão
- **Files:** doc (ex.: `.context/docs/busca-biblioteca.md`)

### T-4.7 ESLint/Prettier como gate (follow-up Fase 12)
- **Acceptance:** `npm run lint` passa a incluir ESLint (não só `tsc`); conta como gate de PR junto dos tests/boundary.
- **Verify:** `npm run lint` + CI verde
- **Files:** `eslint.config.*`, `package.json`, `.github/workflows/ci.yml`

### T-4.8 Bibliotecas dead / vuls (follow-up Fase 12)
- **Estado:** `uuid@7.0.3` transitivo com 3 vulns moderadas; esperar cadeia CLI (não `audit fix --force`).
- **Acceptance:** revisar periodicamente; não forçar.
- **Verify:** `npm audit` (manual)

**Checkpoint 4:** QA findings P2/P3 resolvidos; lint inclui ESLint; docs de decisão presentes. ✅

---

## 5. Fase 5 — Infra e cobertura de testes (`testes`)

> Estado: 67 arquivos / ~546 testes. Cobertura forte em `src/lib`, fraca em componentes/wizards.

### T-5.1 Configurar cobertura com threshold
- **Acceptance:** script `npm run test:coverage` + vitest `coverage.thresholds` razoável (baixo para desbloquear, subir aos poucos).
- **Verify:** `npm run test:coverage` gera relatório
- **Files:** `vitest.config.ts`, `package.json`

### T-5.2 Testes para módulos críticos sem cobertura
- Prioridade: `persistentData.ts`, `backupSchema.ts`, `profileMeta.ts`, `calendar.ts`, `ota.ts`, `catalogLibrary.ts`, `src/lib/db/*` restantes.
- **Acceptance:** testes unitários verdes com casos happy/edge.
- **Verify:** `npm run test`
- **Files:** `src/lib/__tests__/*`

### T-5.3 Testes nos componentes globais mais frágeis
- `QuickAddModal`, `GlobalSearchModal`, `HeaderNav`, `BottomNav`, `ClassNoteModal`, `EditCourseModal`, `NotesScreen`, `TempleScreen`.
- **Acceptance:** testes que renderizam e exercitam interações-chave (não só snapshot).
- **Verify:** `npm run test`
- **Files:** `src/components/**/__tests__/*`

### T-5.4 Testes nos wizards mais complexos
- `TaskExamWizard`, `CourseWizard`, `InternshipWizard`, `NoteTransformWizard`.
- **Acceptance:** percorrem os steps e validam campos obrigatórios (ref. T-4.1).
- **Verify:** `npm run test`
- **Files:** `src/components/wizards/**/__tests__/*`

### T-5.5 `userEvent` em vez de `fireEvent`
- **Acceptance:** interações críticas usam `userEvent` (foco/teclado reais).
- **Verify:** `npm run test`
- **Files:** testes de componentes

### T-5.6 Corrigir dir `__tests` mal nomeado + removê-lo se diagnóstico
- **Estado:** `src/lib/__tests/zzdiag.test.ts` (sem underscore duplo).
- **Acceptance:** removido/movido.
- **Verify:** `npm run test`
- **Files:** `src/lib/__tests/`

### T-5.7 `check-boundaries.test.ts` + `capability.test.ts` (criterios de aceite)
- **Acceptance:** guardas de boundary/capability como testes automatizados na suíte.
- **Verify:** `npm run test`
- **Files:** root tests, `packages/domain`

**Checkpoint 5:** cobertura configurada e gated; os ~10 módulos críticos + componentes top testados. ✅

---

## 6. Fase 6 — Refatorações menores de docs/specs (maturidade)

> Itens de baixa prioridade/risco que melhoram a consistência (opcional, "nice-to-have").

- **T-6.1** Padronizar nomenclatura de arquivos (backlog 2.5, deferido) — *Fluxo: alto churn, avaliar depois das fases críticas.*
- **T-6.2** Unificar modelo de catálogo da biblioteca (`CollectionBook`/`ContextCollection` com `ReadingItem`) (A7/B3).
- **T-6.3** Splittar facade `src/data/books/index.ts` (lazy por coleção/família, 128 kB gzip 1º carregamento) (Fase 12 follow-up).
- **T-6.4** `liquid-glass-nav.md` — efeito Liquid Glass na BottomNav/HeaderNav (LG-1..4) — *decidir se entra no roadmap visual.*
- **T-6.5** `docs/modais-wizards.md` — 13 recomendações (hierarquia long-press, robustez do Modal, simplificação de wizard).
- **T-6.6** Temple: cross-links questão↔conceito↔autor↔técnica + remapear `authorIds` (plano-templo follow-up).
- **T-6.7** `uuid`/deps: manter sob revisão (Fase 4.8).
- **T-6.8** Deep-link nativo (universal links) + validação swipe-back iOS real (Fase 7 pendências).
- **T-6.9** Assinatura de publicação (keystore Android / provisioning iOS) + rodar CI pela 1ª vez + ícones/splash definitivos (Fase 6 pendências).

---

## 7. Fase 7 — Fase C legada (referência) — ver Fase 1

> A Fase C de `tasks/plan.md` (C.1–C.7) é **equivalente** à Fase 1 deste plano. Não duplicar esforço:
> acompanhar pelos T-1.x. Os itens C.1/C.2 já estão materialmente feitos (`DesktopSidebar` migrado,
> `DesktopScreenLayers` existia); com a **limpeza do legado (2026-09)** o desktop React/Tauri foi
> **removido por completo** e os T-1.5/T-1.6 foram executados (T-1.8 superseded).
> **Deixar `tasks/plan.md`/`tasks/todo.md` intactos** (plano de outro trabalho); este doc é o executor.

---

## 8. Fase 8 — Módulos Greenfield (planejados, spec-required) — foco executável

> Estes são features grandes de `cecistudy-rust/spec/` + `docs/archive/desktop-context/`. Cada um
> exige sua própria **spec-driven development** (capability map + spec + plan) antes de codar.
> Aqui ficam mapeados com o ponto de partida; **não** quebrar em tasks até a spec daquele módulo ser
> aprovada. **Nota (2026-09):** as UI "desktop" React foram removidas com o legado — estes módulos
> agora são miras do desktop novo (Flutter+Rust).

| Módulo | Spec/rota de onde vem | Estado | Bloqueado por |
|---|---|---|---|
| `mkt` — Studio de Marketing | `cecistudy-rust/spec/05-...` + `marketing.ts` | domain pronto, 0 UI (T-3.1) | decisão de produto sobre CPF/Canal |
| `cal` — Calendário como domínio | `F7` do PLANO-IMPLEMENTACAO; `schedule.ts` | reusa camada de dados; módulo portado no Rust | `sep` (estado sessão desktop) |
| `doc` — Documents & Blocks | `F5` greenfield | nada | `cal?(rota)`; destrava TCC editor (T-3.3) |
| `sync-p2p` — transporte | `F10` + `transport-bridge.ts` | stub (T-3.2) | decisão de transporte (Trystero/nostr) |
| `engine` — Context Engine | `F11` | nada | `sep`; infra |
| Desktop Biblioteca master-detail | `cecistudy-rust/spec/05` M-LIB | nada | `sep` |
| DOCX/ABNT export (TCC) | `cecistudy-rust/spec/05` M-DOCX | nada | `doc` |
| Desktop Settings/updater window | `cecistudy-rust/spec/04` | nada | `sep` |
| Command Palette agrupado (G5) + `recentItems` (G4) | `cecistudy-rust/spec/03` + sweep GAP | parcial | `sep` |
| Knowledge Graph filtros/focus | `cecistudy-rust/spec/03` | parcial (`KnowledgeGraphScreen` removido com o legado) | `sep` |
| Desktop-aware onboarding | `cecistudy-rust/spec/04` | nada | `sep` |

**Recomendação de ordem dentro da Fase 8 (após Fases 1–5):**
1. `mkt` (menor, domínio pronto) → 2. `cal` → 3. `doc` (destrava TCC/DOCX) → 4. `sync-p2p` → 5. `engine`.

---

## 9. Ordem de execução e dependências (resumo)

```
Fase 1  sep (separação mobile/desktop)          ← NADA bloqueia; fundação
   ↓
Fase 5  testes (pode começar cedo, paralelo)
   ↓
Fase 2  estagio v3
Fase 3  stubs (features pela metade)
Fase 4  techdebt (QA)
   ↓
Checkpoint integração: build raiz+mobile+desktop + boundary
   ↓
Fase 6  refatorações menores (nice-to-have)
Fase 8  greenfield (spec por módulo, um de cada vez)
```

**Paralelização:** Fases 2, 3, 4, 5 são **independentes entre si** depois da Fase 1 (não tocam
os mesmos arquivos na prática) → podem rodar em agentes paralelos. Fase 6 e 8 dependem da base.

---

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Overwrite de plano em progresso | Alto | Este plano fica em arquivo separado; não tocar `tasks/plan.md`/`todo.md` |
| `sep` quebra boundary/tests | Alto | Moves atômicos com gate `lint+test+build+boundary` a cada task |
| Estágio v3: doc desatualizado vs código | Médio | Confirmar estado real por grep antes de executar (T-2.1) |
| Migração `SupervisionNotebook` perde dados | Alto | Migração one-shot + backup; testar criação→migra→verifica |
| Features greenfield grandes (doc/sync) | Médio | Spec-driven antes de codar; não quebrar em tasks cedo demais |
| HomeView derivar dados muda visual | Baixo | Usar tokens; empty states acolhedores |
| Remover `src/desktop/` quebra import escondido | Médio | **Executado (2026-09)** — busca global + `check-boundaries.mjs` como guard |

## 11. Open Questions (precisam de input humano)

- **Q1 — Profile/Canal do Marketing:** qual a jornada mínima de `mkt`? (posicionamento vazio? CPF por canal?)
- **Q2 — Transporte de sync P2P:** Trystero, nostr, ou WebRTC manual? (T-3.2/`sync-p2p`)
- **Q3 — Conquista de onboarding:** celebrar com banco vazio é intencional? (T-4.5)
- **Q4 — Liquid Glass:** entra no roadmap visual agora ou depois? (T-6.4)
- **Q5 — Scope do editor de projetos (T-3.3):** esperar o `doc` (Fase 8) ou editor mínimo próprio primeiro?
- **Q6 — Cobertura mínima de teste:** qual número alvo no threshold do T-5.1 (ex.: 60% linhas)?

---

## Arquivos-fonte de referência
- `tasks/plan.md` + `tasks/todo.md` (Fase C — absorvida na Fase 1)
- `.context/docs/plano-estagio-v3.md` (Fase 2 — executor detalhado)
- `.context/backlog.md` · `.context/docs/liquid-glass-nav.md` · `.context/docs/plano-templo-catalogo.md`
- `docs/archive/desktop-context/PLANO-IMPLEMENTACAO.md` · `ROADMAP-FUNCIONALIDADES-DESKTOP.md` · `separacao-interface/*`
- `cecistudy-rust/spec/*` (00-relatorio-varredura, 01–06, SPEC-VISUAL-*)
- `docs/reconstruction.md` · `docs/auditor.md` · `docs/manual-findings.md` · `docs/manual-tests.md` · `docs/modais-wizards.md`
