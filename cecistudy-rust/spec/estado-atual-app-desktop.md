# Estado atual do app desktop — cecistudy ♡

> **Varredura completa do desktop** — como o app está hoje (stack nova Flutter+Rust) e como
> deveria ser, traduzindo as docs da era React/Tauri para a arquitetura atual.
> Gerado em **2026-09-16** a partir de varredura de código real (3 agentes paralelos +
> verificação no disco). É o documento de base; os docs legados seguem abaixo como histórico.

---

## 0. Resumo executivo (TL;DR)

- O **desktop novo** é **Flutter (UI) + Rust (domínio/dados/sync/content/app)**, spec-first a
  partir de `cecistudy-rust/contracts/` (schema.sql + golden + backup-v2-spec). **Não usa nada
  do React/JS como base** (decisão 2026-09-12).
- O **desktop legado** (Tauri 2 + React, `apps/desktop` + `src/desktop/`) **continua vivo e
  empacotado** hoje: `desktop/src-tauri` aponta para `frontendDist: "../../apps/desktop/dist"` e o
  CI `release-desktop.yml` builda esse cliente React. É a **referência visual** da era React.
- O núcleo Rust está em **Fase 1 (21/23)** com gate verde: `cargo clippy --all-targets --all-features -- -D warnings` ✓ · `cargo fmt --check` ✓ · **162 testes** ✓.
  - **7 crates**: `common, domain, data, content, sync, app, ffi`. `cecistudy-integrations` não existe.
  - `cecistudy-ffi` **já existe como stub** (crate no workspace), faltando gerar bindings FRB. A AGENTS do workspace ainda diz "não existe" — **desvio de doc**.
- **Fase 2+ (UI Flutter) não está integrada**: `apps/desktop-flutter/` é um **scaffold visual
  dummy** (sidebar, 5 abas, telas placeholder, main.dart com contador) — sem bridge, sem state, sem `flutter_rust_bridge`.
- Pendências Rust: **R3** (naming `cecistudy-content`), **R4** (paridade full + remover `data_json`
  da superfície pública), **R5** (`cecistudy-ffi` bindings), **R6** (UI Flutter), **R7** (integrations/Google Calendar).

---

## 1. Arquitetura atual — três camadas na árvore

| Camada | O que é | Onde vive | Status |
|---|---|---|---|
| **Plataforma compartilhada** | Todo o produto (mobile-first), usado pelo web/PWA, mobile e pelo desktop legado | `src/`, `packages/*`, `apps/mobile`, `apps/desktop` | ✅ vivo (React, "era React") |
| **Desktop legado Tauri+React** | Wrapper Tauri que empacota o cliente React de `apps/desktop` | `desktop/` (src-tauri) + `apps/desktop` + `src/desktop/` | ✅ vivo (referência; a ser substituído) |
| **Desktop novo Flutter+Rust** | Núcleo Rust (dono de lógica/dados) + UI Flutter (apresentação) | `cecistudy-rust/` + `apps/desktop-flutter/` | 🔶 em construção (Rust Fase 1; UI dummy) |

### 1.1 Princípio organizador (spec macro)
> **Rust é dono de domínio, dados, sync, integrações externas e regras de capacidade. Flutter só
> desenha o que o Rust já decidiu e serve — nunca decide sozinho se algo pode ser visto, criado,
> editado ou apagado.** (`plano-desktop-flutter-rust.md`)

### 1.2 Decisões registradas (2026-09-12)
- Desktop novo **NÃO usa React/JS como base**; domain/data **spec-first** a partir de `contracts/`.
- Os pacotes TS (`packages/*`) são apenas **oráculo de paridade** via golden files (formato idêntico).
- Data crate **alinhada a entidades tipadas** (forma vem do `schema.sql`, não do TS) — **R1 concluído**.
- `cecistudy-ffi` é a ponte (`flutter_rust_bridge`) e `cecistudy-app` a **única superfície** p/ FFI.

---

## 2. Varredura do núcleo Rust (`cecistudy-rust/`)

### 2.1 Workspace Cargo
- `resolver = "2"`, `edition = "2024"`, `rust-version = "1.98"` (fixado em `rust-toolchain.toml`).
- `[workspace.dependencies]`: `thiserror`, `serde` (derive/rc), `serde_json`, `ryu`,
  `unicode-normalization`, `uuid` (v4+serde), `reqwest` (blocking/json/rustls-tls), `base64`, `mockito`.
- `[profile.release]`: `lto = "thin"`, `strip = true`.
- **Members (7)**: `common, domain, data, content, sync, app, ffi` (confirmado no `Cargo.toml`).
  `cecistudy-integrations` **não está** no workspace.

### 2.2 Contrato cross-língua (`contracts/`)
| Item | Status | Detalhe |
|---|---|---|
| `schema.sql` | ✅ | DDL canônico user+catalog; `SCHEMA_VERSION = 13`; `USER_SCHEMA_VERSION = 1`; ~48 tabelas |
| `backup-v2-spec.md` | ✅ | Formato `cecistudy-user-backup` (`formatVersion`, `userSchemaVersion`, `schemaVersion`, `catalogRelease`, `exportedAt`) |
| `golden/` | ✅ | 24 coleções (empty + sample) + 2 `full_backup` + 13 fixtures de migração v1→v13 |
| `verify-schema.mjs` | ✅ | Compara `schema.sql` vs `packages/data/src/schema.ts`; usa `node:sqlite` (Node 22+) |
| `golden/AGENTS.md` | ✅ | Regras de paridade (chaves alfabéticas, NFC, arrays preservando ordem) |

### 2.3 Crates (detalhe por crate)
| Crate | Status | Conteúdo |
|---|---|---|
| `cecistudy-common` | ✅ | Base: `error.rs`, `id.rs` (uuid v4), `time.rs` (ISO 8601), `json.rs` (`canonicalize`), `platform.rs`; `tests/golden_parity_test.rs` |
| `cecistudy-domain` | ✅ | `workspace`, `capabilities`, **`entity.rs` (22+ entidades tipadas, R1a)**, `calendar/knowledge/marketing/projects/internship` (R2, spec-first); `tests/entity_roundtrip_test.rs` |
| `cecistudy-data` | ✅ | `schema.rs` (aplica DDL), `connection.rs` (`UserDb` single-writer WAL; `CatalogDb` read-only), `migrations.rs` (13 migrações, espelho TS), `backup.rs` (envelope v2), `payload.rs` (validação por coleção), `repositories/` (read+write), **`collections.rs` (fronteira tipada `Collection`, R1b)** |
| `cecistudy-content` | ✅ | `CatalogDb::open_read_only` (ver **R3**); queries de catálogo (abordagens, questões 3.002, obras, conceitos 225, autores 139, técnicas 136, comparisons 130) |
| `cecistudy-sync` | ✅ | `stamp.rs` (SyncIndex, record/single/set), `merge.rs` (LWW), `provider.rs` (+ `providers/github.rs` via reqwest), protocolo `SYNC_PROTOCOL_VERSION=1` |
| `cecistudy-app` | ✅ | `App` (open, in_memory, verify, open_catalog, capability_for) + use_cases `backup/profile/calendar/courses/tasks/sync` |
| `cecistudy-ffi` | 🔶 **stub** | `Cargo.toml` com `flutter_rust_bridge = "2"` + metadata `[package.metadata.flutter_rust_bridge]`; `src/lib.rs` (`Ffi::open_app` placeholder), `src/api.rs` (`ping()`) |

> ⚠️ **Desvio real:** `Cargo.lock` **não contém `flutter_rust_bridge`** — há artefatos no
> `target/`, então o crate já rodou build, mas a dependência FRB não está resolvida no lock.

### 2.4 Testes e gate
- Contagem real por crate: common 15 · domain 24 · data 63 · content 7 · sync 30 · app 23 = **162 testes**.
- Gate: `cargo clippy --all-targets --all-features -- -D warnings` + `cargo fmt --check` + `cargo test`.
- **`parity-report.md` está defasado** (distribuição por arquivo não bate com a estrutura atual —
  cita `domain_parity_test` 30 / `collections_test` 20 / `golden_parity_test` 5; no código são
  `entity_roundtrip_test`, `collections_test` 5, `golden_parity_test` 1 — o total 162 continua correto).
- **`parity-test.sh` é bash-only** — não é Windows-friendly (próximo passo: versão PowerShell).

### 2.5 Docs do workspace (`cecistudy-rust/docs/`)
- ✅ só `canonical-json-v1.md`.
- ⬜ **ausentes**: `architecture.md`, `domain-port-guide.md`, `sync.md` (a AGENTS já sinaliza).

---

## 3. Varredura do desktop legado (era React — vivo e de pé)

### 3.1 Tauri
- `desktop/src-tauri` — wrapper **sem lógica de domínio**: só registra plugins
  `notification`, `updater`, `process`.
- `tauri.conf.json` aponta `frontendDist: "../../apps/desktop/dist"`, `devUrl: http://localhost:3000`,
  janela 1180×780 (min 420×720), identifier `ceci.study.desktop`, updater minisign
  (`releases/latest/download/latest.json`).
- `desktop/README.md` está **defasado**: diz "mesmo bundle web (`dist/`)" mas o config já aponta
  para `apps/desktop/dist`.

### 3.2 Cliente React desktop (`apps/desktop`)
- **Entrypoint próprio** `src/app/main.tsx` → `DesktopAppProvider` → `DesktopAppShell` + `DesktopOverlays`.
- `DesktopAppProvider.tsx`: DataClientProvider + DesktopShellInner + DesktopUpdateSection +
  DesktopSessionProvider.
- `DesktopSessionProvider.tsx` / `session/types.ts`: **`DesktopSessionState` canônico**
  (persistido em `desktopSession`; importado type-only pelo `AppContext`).
- `desktopNavigation.ts` = `useNavigationEngine` (pilha própria).
- `vite.config.ts` (alias `@`→`src`, build → `apps/desktop/dist`).
- Testes: `nav-independence.test.tsx`, `desktopSession.test.tsx`.

### 3.3 Componentes/estado compartilhados (`src/`)
- `src/desktop/` — **37 arquivos vivos**: `screens/{HomeScreen,DesktopScreenLayers,CalendarScreen}`,
  `components/{DesktopSidebar (349 linhas), DesktopTopbar, WorkspaceSwitcher, InboxScreen,
  KnowledgeGraphScreen, ProjectsScreen, ContextInspector, CommandPalette, CourseMasterList,
  CourseDetailPane, DesktopUpdateSection, calendar/*, ui/*}`, `layouts/SplitLayout.tsx`,
  `styles/desktop-tokens.css` (`--ds-*`), `lib/{sidebarBadges, screenTransition}`.
- `src/shells/`: `MobileAppShell`, `DesktopAppShell`, `SharedScreenLayers` (lazy), `SlideScreen`.
- `src/context/`: `appContexts.ts` (4 contextos), `DataClientProvider.tsx`, `shellNavContexts.ts`,
  `navigationEngine.ts`, `sharedAppValue.ts`, `workspaceActions.ts`, `dataActions.ts`,
  facades `useMobileApp()`/`useDesktopApp()`. **`useApp()` deletado** — zero ocorrências.
- `src/overlays/`: `MobileOverlays` + `DesktopOverlays` + `OverlaysContent` (C.7 pendente por desvio vitest).
- `isDesktop` só existe em `src/lib/platform.ts` + `src/lib/notifications.ts`.

> **Conclusão da varredura:** a separação mobile/desktop da era React está **muito mais avançada**
> que os docs antigos sugerem (`useApp` morto, shells/pilhas/entrypoints independentes,
> `DesktopSessionState` canônico fora do `AppContext`, Tauri empacotando o cliente React próprio).

---

## 4. Varredura do desktop novo Flutter (`apps/desktop-flutter/`)

- **Estado real no disco:** existe o scaffold de projeto Flutter (android/ios/linux/macos/windows/web).
- `lib/`:
  - `main.dart` — ainda com o **template de contador** `MyHomePage` + "cecistudy desktop shell ready ♡".
  - `widgets/shell/desktop_shell.dart` — sidebar colapsável (72/240px), topbar, **5 telas** master-detail.
  - `screens/{home,faculdade,estudos,biblioteca}_screen.dart` — placeholders com dados dummy
    (stat cards + 3 cursos hardcoded).
  - `widgets/command_palette.dart` — placeholder.
  - `theme/app_theme.dart` — `CeciColors` + `CeciTheme.light()` (Material 3) — **valores antigos**
    (`#FFF5F7`, `#40383A`, `#D85F79`), com drift vs token atual (`index.css`).
  - `lib/bridge/` e `lib/state/` — **vazios** (sem bindings, sem Riverpod/Bloc).
- **Sem `flutter_rust_bridge` configurado** (não está no `pubspec.yaml`).
- `README.md` admite: "próximos passos: 1. flutter create; 2. configurar flutter_rust_bridge;
  3. implementar skeleton de navegação + Home".

> ⚠️ **Desalinhamento de docs:** os docs dizem "Fase 2 não iniciada", mas **existe um scaffold
> visual dummy** em `apps/desktop-flutter/`. O "próximo salto real" é o `cecistudy-ffi` (R5).

---

## 5. Como o app é hoje vs docs da era React (tradução)

### 5.1 Mapa das docs legadas → destino atual

| Doc / Spec (era React) | O que descrevia | Destino hoje |
|---|---|---|
| `plano-desktop-flutter-rust.md` (raiz) | Spec macro: abandonar Tauri+React; Flutter+Rust | **Ativo** — a arquitetura em execução |
| `desktop/spec/01-task-breakdown-flutter-rust.md` | Breakdown de tarefas (Fases 0–7) | **Fonte de verdade de status** (ver §7) |
| `desktop/spec/PLANO-CONSOLIDADO-FLUTTER-RUST.md` | Consulta de planejamento (numeração diferente) | ✅ atual |
| `desktop/spec/FLUTTER-RUST-SPEC-ANALYSIS.md` | Capability map + ordem de build | ✅ atual |
| `desktop/spec/flutter-ui-architecture.md` | R6: UI Flutter greenfield | ✅ atual |
| `desktop/spec/20-incremental-implementation-strategy.md` | Fatias verticais + riscos R1–R8 | ✅ atual |
| `docs/architecture/flutter-rust-analysis.md` | Gap analysis do porte | ✅ atual |
| `desktop/context-desktop/PLANO-IMPLEMENTACAO.md` | Plano mestre F0–F12 (desktop React) | 🧟 **superseded** — histórico da era React |
| `desktop/context-desktop/ROADMAP-FUNCIONALIDADES-DESKTOP.md` | 12 módulos, 230 funcionalidades (75✅/155⬜) | 🧟 **superseded** — as 155 ⬜ passaram para o plano Flutter |
| `desktop/context-desktop/REBUILD-DESKTOP-CAPABILITY-MAP.md` | Rebuild visual React | 🧟 **superseded** (visual React cancelado) |
| `desktop/context-desktop/Blueprint/Arquitetura técnica/contexto geral` | Visão de 4 domínios | 🧟 legado (conceitual) |
| `desktop/context-desktop/Especificação Calendário/Marketing/TCC` | Specs conceituais fechadas | 🧟 legado, mas **entidades portadas ao Rust (R2)** |
| `desktop/context-desktop/separacao-interface/00–07` | Separação mobile/desktop | ⚠️ parcialmente superseded (07 = atual até Fase 10) |
| `desktop/spec/00-relatorio-varredura.md`, `07-separacao-navegacao.md`, `SPEC-VISUAL-01/02` | Specs da separação + refinos visuais | 🧟 legado (referência visual) |
| `desktop/LAYOUT-SPEC.md` + `cecistudy-desktop-shell.json` | Layout spec + tokens `--ds-*` | 🧟 legado (tokens ainda vivos no React `src/desktop/styles/desktop-tokens.css`) |
| `desktop/README.md` | Wrapper Tauri | ⚠️ defasado (config já aponta `apps/desktop/dist`) |

### 5.2 Features da era React → stack nova (o que já virou Rust e o que falta na UI)

| Módulo (era React) | Entidades/funcionalidades da era React | **No Rust hoje** | **UI nova (Flutter)** |
|---|---|---|---|
| Shell & Nav | Sidebar, Topbar, WorkspaceSwitcher, CommandPalette, ContextInspector, SplitLayout | `Workspace`/`capabilities` (domain) | R6 (skeleton existe em `desktop-flutter`) |
| Home | Saudação, meta do dia, ações rápidas, streak | use_cases `profile/tasks/calendar` | R6 |
| Faculdade | Grade de disciplinas, master-detail, class notes | entidades `Course/ClassNote/Task/Exam` + use_cases | R6 |
| Estudos | Pomodoro, flashcards, leituras, questões | entidades `StudySession/Flashcard/ReadingItem` + catálogo | R6 |
| Biblioteca | Catálogo, templo, notas avulsas, filtros | `cecistudy-content` (catálogo .db) | R6 |
| Perfil | Métricas, stickers, lembrete, updater | `Profile/Sticker/StreakData/Reminder` | R6 |
| Calendário | Grade, recorrência, blocos/timer, camadas | `calendar.rs` (domain, R2) | Módulo 4 (Flutter) |
| Base de Conhecimento | Grafo, editor de blocos, inbox | `knowledge.rs` (domain, R2) | Módulo 5 (Flutter) |
| Marketing Studio | Pipeline editorial, canais, publicações | `marketing.rs` (domain, R2) | Módulo 6 (Flutter) |
| Projetos/TCC | Árvore acadêmica, editor paginado, ABNT, DOCX | `projects.rs` (domain, R2) | Módulo 7 (Flutter) |
| Estágio | Diário de casos, supervisão | `internship.rs` (domain, R2) | R6 |
| Sync Engine | Manifesto, stamps, merge LWW, GitHub | `cecistudy-sync` ✅ completo | — (usado via FFI) |
| Integrações (Google Cal) | OAuth, bidirecional, conflitos | **`cecistudy-integrations` NÃO existe** (R7) | Módulo 4 (Flutter) |

> ⚠️ **Capacidades:** a matriz `capabilities` em `packages/domain` cobre as **9 entidades novas**
> (documento, relation, project, etc.) mas **as entidades legadas (course, task, exam, classNote,
> flashcard, reading…) não têm linha** na matriz — viola o princípio "Rust decide" nas telas
> existentes. Pendência transversal registrada no consolidado.

---

## 6. Stack atual — quadro geral (pacotes TS × Rust × Flutter)

| Camada | TS (mobile/oráculo) | Rust (desktop core) | Flutter (desktop UI) |
|---|---|---|---|
| Domínio | `packages/domain` (7 módulos) | `cecistudy-domain` (+ `entity.rs`) | — |
| Aplicação | `packages/application` + `src/core/application` | `cecistudy-app` (use_cases) | — |
| Dados | `packages/data` (schema 13, backup v2, Zod) | `cecistudy-data` (SQLite, migrações, col. tipadas) | — |
| Sync | `packages/sync` (stamp/merge/engine/provider) | `cecistudy-sync` | — |
| Catálogo | `src/lib/db/catalogDb.ts` + `content/` pipeline | `cecistudy-content` | — |
| Contrato | `packages/contracts` (canonical JSON v1) | `contracts/` (schema.sql + golden) | — |
| Navegação | `packages/navigation` | — | plano (Riverpod; unused hoje) |
| **Ponte** | — | **`cecistudy-ffi` (stub, R5)** | `lib/bridge/` (vazio) |
| Integrações | `packages/domain/ports` (interface) | **`cecistudy-integrations` (não existe, R7)** | — |

---

## 7. Status oficial dos próximos passos (R0→R7)

> **Fonte de verdade de status:** `desktop/spec/01-task-breakdown-flutter-rust.md` (§ "Próximos passos").

| Etapa | Descrição | Status real |
|---|---|---|
| **R0** | Higiene rápida (docs vs `.db`, import morto `isDesktop` em `DesktopAppShell.tsx:9`, numerais de testes) | 🔶 pendente |
| **R1** | Data → entidades tipadas (R1a entidades / R1b collections / R1c payload+apply) | ✅ **concluído** (formato via `schema.sql`) |
| **R2** | Módulos de domínio faltantes (calendar/knowledge/marketing/projects/internship) | ✅ **concluído** (spec-first; 162 testes) |
| **R3** | Content naming (`CatalogDb::open_read_only` → `CatalogDatabase::open`) | ⬜ pendente |
| **R4** | Paridade full (F1.22) + remover `data_json` da superfície pública | ⬜ pendente (parity-test.sh hoje não é Windows-friendly; parity-report defasado) |
| **R5** | `cecistudy-ffi` (F1.21) — bridge flutter_rust_bridge sobre `App` | 🔶 stub criado; **faltam bindings FRB** |
| **R6** | Fase 2 — UI Flutter greenfield (skeleton + bridge + primeiras telas) | 🔶 scaffold dummy em `apps/desktop-flutter`; **sem bridge** |
| **R7** | `cecistudy-integrations` (Google Calendar) | ⬜ não existe (não-bloqueante) |

> **Fase 0 (contrato) = 5/5 ✅ · Fase 1 (núcleo Rust) = 21/23 ✅ · Fases 2+ (Flutter) = 🔲/parcial.**
> Bloqueio para a Fase 2 = R4 → R5 (`cecistudy-ffi`).

---

## 8. Achados / desvios (docs × código real)

1. **`cecistudy-ffi` existe como stub** mas AGENTS.md (raiz e workspace) e breakdown dizem
   "🔲 não existe" — **doc desatualizado**. O `Cargo.lock` não resolve a dep `flutter_rust_bridge`.
2. **`apps/desktop-flutter/` já tem scaffold visual dummy** — docs dizem "Fase 2 não iniciada".
3. **`parity-test.sh` é bash-only** — não roda em Windows/PowerShell direto.
4. **`data_json` ainda na superfície pública** (`repositories::load_collection/save_collection`
   re-exportados) — R4 não concluído.
5. **`CatalogDb` duplicado** no nome/assinatura: `cecistudy-data::connection::CatalogDb` (test only)
   vs `cecistudy-content::CatalogDb` — R3 prevê renome.
6. **`parity-report.md` defasado** (distribuição de testes não bate com a estrutura atual; total 162 ok).
7. **Docs ausentes no workspace Rust**: `architecture.md`, `domain-port-guide.md`, `sync.md`.
8. **Drift de tokens Flutter**: `apps/desktop-flutter/lib/theme/app_theme.dart` usa valores antigos
   (`#40383A`/`#FFF5F7`/`#D85F79`); o `index.css` atual usa valores aquecidos
   (`#3B3233`/`#FFF9F0`/`#D4617C`).
9. **`desktop/README.md` defasado** (frontendDist já é `apps/desktop/dist`).
10. **`docs/architecture/flutter-rust-analysis.md`** aponta o gap do porte: `src/lib/*` (~5,5k LOC,
    30+ módulos) — `cecistudy-app` cobre os use-cases básicos; o restante (streak, schedule, quiz,
    pomodoro, ota, export, etc.) segue pendente de inventário para o Rust.

---

## 9. O que precisa ser decidido / aberto

- **Ordem de execução (confirmada):** R0 → R3 → R4 → R5 → R6 → R7. `cecistudy-integrations` ao final.
- **Decisões transversais sem spec (ver `FLUTTER-RUST-SPEC-ANALYSIS.md`):** state management Flutter
  (Riverpod escolhido por ADR), navegação Flutter, theme spec, acessibilidade, i18n, error handling,
  loading/offline, notificações, auto-update, empacotamento/distribuição, CI Flutter, testes Flutter.
- **Matriz de capacidades incompleta** para entidades legadas.
- **Reuso dos 10 temas do mobile** no desktop e do `desktop-tokens.css` → Flutter.
- **Migração de usuárias** do desktop Tauri → Flutter (export/import validado na Fase 0/1).

---

## 10. Anexo — comandos e gates

### Rust (`cecistudy-rust/`)
```
cargo build · cargo test · cargo fmt · cargo clippy
gate: cargo clippy --all-targets --all-features -- -D warnings
      cargo fmt --check
      cargo test                     # 162 testes
paridade: GOLDEN_WRITE=1 (só p/ regenerar) + crates/cecistudy-common/tests/golden_parity_test.rs
schema:   node contracts/verify-schema.mjs (Node 22+; sem CLI sqlite3)
```

### Raiz (TS)
```
npm run lint · npm run test · npm run build
node .github/scripts/check-boundaries.mjs   # gate de imports mobile/desktop/packages
```
> ⚠️ Não tocar os crates Rust via `npm run lint` — o gate Rust é `cargo`.

---

## 11. Docs de referência (mapa do "como deve ser")

| Documento | Papel |
|---|---|
| `plano-desktop-flutter-rust.md` | Spec macro (princípio, fases, riscos, decisões em aberto) |
| `desktop/spec/01-task-breakdown-flutter-rust.md` | **Fonte de verdade de status** (breakdown + reconciliação) |
| `desktop/spec/PLANO-CONSOLIDADO-FLUTTER-RUST.md` | Consulta de planejamento consolidada |
| `desktop/spec/FLUTTER-RUST-SPEC-ANALYSIS.md` | Gap/specs transversais + ordem de escrita |
| `desktop/spec/flutter-ui-architecture.md` | Arquitetura da UI Flutter (R6) |
| `desktop/spec/20-incremental-implementation-strategy.md` | Fatias verticais + riscos R1–R8 |
| `desktop/spec/00-relatorio-varredura.md` | Relatório-base da varredura (legado) |
| `cecistudy-rust/AGENTS.md` | Regras do workspace Rust + gate |
| `cecistudy-rust/contracts/*` | Contrato cross-língua (schema, backup, golden) |
| `cecistudy-rust/docs/canonical-json-v1.md` | Serialização canônica (paridade) |