# Análise do Spec Flutter+Rust — Capacidades, Gaps e Ordem de Escrita

> Gerada pelo **spec-driven-development** skill a partir de `plano-desktop-flutter-rust.md`,
> do estado atual do código (`packages/*`, `src/core/*`, `src/components/views/`,
> `desktop/context-desktop/`) e dos specs visuais existentes.

---

## 1. Capability Map — Módulos da Migração Flutter+Rust

Ordem de build determinada por dependências (sem ciclos direcionais).

| Build | Módulo | Responsabilidade | Depende de | Fonte TS existente | Esforço |
|---|---|---|---|---|---|
| **0** | Contrato (DDL + backup v2 + golden files) | Schema SQL, formato JSON v2, fixtures de paridade | — | `migrations/user.ts`, `backupSchema.ts` | Médio |
| **1a** | `cecistudy-domain` | Entidades, invariantes, factories, capabilities, prefixos | — | `packages/domain/src/core/domain/*` (8 arquivos) | Médio |
| **1b** | `cecistudy-data` | SQLite driver, migrações, repositórios CRUD, backup export/import | 1a | `packages/data`, `src/lib/db/*`, `exportImport.ts` | Alto |
| **1c** | `cecistudy-content` | Abrir `.db` catálogo (somente leitura) | — | `src/lib/db/catalogDb.ts`, `src/lib/templeData.ts` | Baixo |
| **1d** | `cecistudy-sync` | SyncEngine, merge LWW, provider GitHub (reqwest) | 1b | `packages/sync/*` (engine, merge, stamp, provider) | Alto |
| **1e** | `cecistudy-integrations` | Google Calendar OAuth, mapeamento, conflitos | 1b | Nenhum (greenfield) | Alto |
| **1f** | `cecistudy-app` | Casos de uso (application layer) — única superfície p/ Flutter | 1a+1b+1c+1d+1e | `src/core/application/use-cases/*` (5 arquivos) | Médio |
| **1g** | `cecistudy-ffi` | Bridge `flutter_rust_bridge` — bindings Dart↔Rust | 1f | Nenhum (greenfield) | Médio |
| **2** | Flutter shell + Home | Casca Flutter, sidebar, topbar, navegação, Home | 1g | `src/desktop/` (33 arquivos React) + React rebuild visual | Alto |
| **3a** | Flutter Faculdade | Master-detail disciplinas | 2 | `src/desktop/CourseMasterList*`, `CourseDetailPane*` | Médio |
| **3b** | Flutter Perfil & Settings | Perfil, stickers, config, updater | 2 | `src/components/views/PerfilView.tsx` | Médio |
| **4** | Flutter Calendário | Grade semanal drag/resize, recorrência, GC | 2+1e | `src/desktop/calendar/` (13 arquivos) + `src/lib/schedule.ts` | Muito Alto |
| **5** | Flutter Conhecimento | Docs/blocks, grafo interativo, inbox | 2+1b | `src/desktop/KnowledgeGraphScreen*`, `InboxScreen*` | Alto |
| **6** | Flutter Marketing | Studio editorial, canais, publicações | 2+1b+4 | Nenhum UI existente (greenfield visual) | Alto |
| **7** | Flutter Projetos/TCC | Árvore acadêmica, editor paginado, ABNT, DOCX | 2+1b+4+5 | `src/desktop/ProjectsScreen*` | Muito Alto |
| **8** | Flutter Estudos | Pomodoro, flashcards, leituras, questões, sessões | 2+1b | `src/components/estudos/*`, `StudyFocusScreen.tsx` | Médio |
| **9** | Sync P2P + Criptografia | WebRTC/Nostr, credenciais, integridade | 1d | `packages/sync/src/pairing.ts` (pausado) | Muito Alto |
| **10** | Empacotamento desktop | Build Win/mac/Linux, notificações, auto-update | 2–8 | `desktop/src-tauri/*`, `.github/workflows/release-desktop.yml` | Médio |
| **11** | Migração dados antigos | Tauri→Flutter (export→import) | 1b+10 | Nenhum (procedimento manual documentado) | Baixo |

### Diagrama de dependências (DAG)

```
Contrato (0)
  └─► domain (1a)
        └─► data (1b) ──► sync (1d)
        │                 ──► integrations (1e) ──► app (1f) ──► ffi (1g)
        └─► content (1c) ─┘                         │
                                                     ▼
                                          Flutter shell + Home (2)
                                              │    │    │
                                              ▼    ▼    ▼
                                         3a  3b  4  5  8
                                              │    │  │
                                              ▼    ▼  ▼
                                           6  7 (dependem de calendar+conhecimento)
                                                              │
                                                              ▼
                                                    P2P+Crypto (9), Empacotamento (10)
```

---

## 2. Análise de Completude por Módulo

### Legenda
- **✅ Completo** — spec detalhada, entidades + factories + invariantes definidos
- **🟡 Parcial** — tipo/factory definido mas faltam comportamentos, regras de negócio ou UI
- **🔴 Ausente** — não existe spec (só menção genérica no plano)

### 2.1 Contrato de Dados (Fase 0)

| Item | Status | Detalhe |
|---|---|---|
| DDL do banco da usuária (`.sql` versionado) | 🔴 Ausente | Hoje em `migrations/user.ts` (TS); precisa ser extraído para `.sql` canônico |
| Formato backup v2 (spec formal) | 🟡 Parcial | `backupSchema.ts` (Zod) existe mas não como spec formal; `serde` Rust precisa espelhar campo a campo |
| Golden files (fixtures JSON) | 🔴 Ausente | Nenhum fixture gerado; a seção 4 do plano pede mas não define |
| Matriz de capabilities (portada) | 🟡 Parcial | `capabilities.ts` existe em TS; precisa spec de como o Rust a mantém em paridade |
| Regras de merge LWW | 🟡 Parcial | `stamp.ts`/`merge.ts` existem; precisa formalizar fixtures de teste cross-língua |

### 2.2 `cecistudy-domain` (Fase 1a)

| Módulo | Tipos | Factories | Invariantes | Testes | Status |
|---|---|---|---|---|---|
| `calendar.ts` | ✅ 8 interfaces + 2 enums | 🟡 `createResponsibility` só; faltam `createEvent`, `createOccurrence` | 🟡 `CommitmentLevel` definido mas sem validação de transições de status | ✅ Bate 1:1 com spec | 🟡 |
| `knowledge.ts` | ✅ 7 interfaces + 3 enums | 🟡 `createDocument`, `createRelation`; faltam `createBlock`, `createSuggestion` | 🔴 Sem máquina de estados (Suggestion/Relation status transitions) | ✅ Existente | 🟡 |
| `marketing.ts` | ✅ 6 interfaces + 2 enums | 🟡 `createContentBase` só; faltam os demais | 🔴 Sem transições de `EditorialStatus` formalizadas | ✅ Existente | 🟡 |
| `projects.ts` | ✅ 5 interfaces + 3 enums + constantes | ✅ `createProject`, `canAddProject`, `activeProjectCount` | ✅ Limite de 5 projetos ativos | ✅ Existente | ✅ |
| `workspace.ts` | ✅ 2 interfaces + 2 enums | ✅ `createWorkspace` | 🔴 Sem validação de isolamento | ✅ Existente | 🟡 |
| `capabilities.ts` | ✅ 2 tipos + interface | ✅ `capabilityFor` | ✅ Matriz `DEFAULT_CAPABILITIES` (18 entradas) | ✅ Existente | ✅ |
| `ids.ts` | ✅ `EntityPrefix` (23 prefixos) | ✅ `makeId`, `prefixOf` | ✅ Prefixo + timestamp + counter + random | ✅ Existente | ✅ |
| `common.ts` | ✅ `Platform`, `EntityId` | — | — | — | ✅ |

### 2.3 `cecistudy-data` (Fase 1b)

| Item | Status | Detalhe |
|---|---|---|
| SQLite driver (rusqlite/sqlx) | 🔴 Ausente | Hoje `@capacitor-community/sqlite` no mobile, `localStorage` no desktop |
| Migrações `.sql` | 🔴 Ausente | Hoje em `migrations/user.ts` (TS numerado); precisa extrair para `.sql` |
| Repositórios CRUD por entidade | 🔴 Ausente | Hoje em `AppContext` (React) — `setCourses`, `setTasks`, etc. são setters atômicos |
| Backup export/import (serde) | 🔴 Ausente | Hoje `exportImport.ts` (TS); Rust precisa `serde` espelhando `backupSchema.ts` |
| Testes de paridade com TS | 🔴 Ausente | Golden files da Fase 0 + testes cross-língua |

### 2.4 `cecistudy-content` (Fase 1c)

| Item | Status | Detalhe |
|---|---|---|
| Abrir `.db` SQLite catálogo | 🔴 Ausente no Rust | Hoje `catalogDb.ts` (query JS); pipeline Node gera o `.db` |
| Query autores/conceitos/técnicas/questões | 🔴 Ausente | Definido em `catalogDb.ts` |
| Loader dual (web = facades, native = `.db`) | 🟡 Parcial | Precisa decisão: Flutter lê `.db` direto (padrão nativo) ou tem facade |

### 2.5 `cecistudy-sync` (Fase 1d)

| Item | Status | Detalhe |
|---|---|---|
| `SyncEngine` (compare-and-swap, checkRevision) | 🟡 Parcial | `engine.ts` (122 linhas) existe em TS; precisa port |
| `mergeSyncedDatabases` (LWW determinístico) | 🟡 Parcial | `merge.ts` existe em TS; precisa port |
| `stamp.ts` (revisão monotônica) | 🟡 Parcial | Existe em TS |
| `SyncProvider` interface | 🟡 Parcial | `provider.ts` + `providers/` existem |
| GitHub provider via `reqwest` | 🔴 Ausente no Rust | Hoje `providers/github.ts` (HTTP simples) |
| Testes de paridade | 🔴 Ausente | Precisa fixtures cross-língua |

### 2.6 `cecistudy-integrations` (Fase 1e) — GREENFIELD

| Item | Status | Detalhe |
|---|---|---|
| Google Calendar OAuth | 🔴 Ausente | Nenhum código hoje (Tauri antigo não tinha) |
| Mapeamento ID evento cecistudy ↔ Google | 🔴 Ausente | Especificado na seção 6 do plano |
| Sync bidirecional | 🔴 Ausente | Regras definidas: editável se criado no cecistudy; read-only se importado |
| Detecção/resolução de conflitos | 🔴 Ausente | Flutter recebe opções (`manter_cecistudy`, `manter_google`, `combinar_campos`); lógica no Rust |
| Preservação de versões em conflito | 🔴 Ausente | |

### 2.7 `cecistudy-app` (Fase 1f)

| Item | Status | Detalhe |
|---|---|---|
| Casos de uso `workspace` | 🟡 Parcial | `workspace.ts` (TS) — `createWorkspaceUseCase` |
| Casos de uso `calendar` | 🟡 Parcial | `calendar.ts` (TS) — `planResponsibility`, `scheduleEvent` |
| Casos de uso `knowledge` | 🟡 Parcial | `knowledge.ts` (TS) — `addRelation`, `acceptSuggestion`, `rejectSuggestion` |
| Casos de uso `marketing` | 🟡 Parcial | `marketing.ts` (TS) — `createContentBaseUseCase`, `approve/rejectChannelVariant` |
| Casos de uso `projects` | 🟡 Parcial | `projects.ts` (TS) — `createProjectUseCase`, limite 5 |
| **Faltam:** | 🔴 Ausente | Casos de uso para Faculdade, Estudos, Biblioteca, Perfil — não existem em `use-cases/` |
| **Faltam:** | 🔴 Ausente | Casos de uso de domínio legacy (Course, Task, Exam, ClassNote, Flashcard, etc.) — vivem em `AppContext` sem formalização |

### 2.8 `cecistudy-ffi` (Fase 1g) — GREENFIELD

| Item | Status | Detalhe |
|---|---|---|
| `flutter_rust_bridge` config | 🔴 Ausente | Nenhuma experiência prévia documentada |
| Bindings gerados por entidade | 🔴 Ausente | |
| Tratamento de erros cross-boundary | 🔴 Ausente | |
| Async bridge (dados pesados) | 🔴 Ausente | |

### 2.9 Telas Flutter — O que NÃO está no spec

O plano menciona as seguintes telas na seção 3 (estrutura de repo) mas **nenhuma tem spec**:

| Tela | Menção no plano | Spec detalhada | O que falta |
|---|---|---|---|
| **Home** | `lib/screens/home` | 🔴 Nenhuma | Layout, widgets, dados exibidos, ações rápidas, métricas, "meta do dia", streak |
| **Faculdade** | `lib/screens/faculdade` | 🔴 Nenhuma | Master-detail disciplinas, grade semanal, aulas/avaliações, diário de estágio |
| **Estudos** | (subentendido em `screens/`) | 🔴 Nenhuma | Pomodoro, flashcards, leituras, questões, sessões, estatísticas |
| **Biblioteca** | (subentendido) | 🔴 Nenhuma | Catálogo, templo, conceitos/autores/técnicas, artigos, coleções, filtros |
| **Perfil** | `lib/screens/perfil` | 🔴 Nenhuma | Métricas reais, timeline, streak, stickers, preferências, updater, sync |
| **Calendário** | `lib/screens/calendario` | 🔴 Nenhuma (especificação TS existe) | Grade semanal desktop, drag/resize, recorrência, camadas, Google Calendar |
| **Conhecimento** | `lib/screens/conhecimento` | 🔴 Nenhuma | Grafo interativo, editor de blocos, inbox, relações |
| **Marketing** | `lib/screens/marketing` | 🔴 Nenhuma | Studio completo: posicionamento, ideias, fluxo editorial, canais, métricas |
| **Projetos/TCC** | `lib/screens/projetos` | 🔴 Nenhuma | Árvore acadêmica, editor paginado, citações ABNT, exportação DOCX |

---

## 3. Gaps do Spec por Fase

### Fase 0 — Congelar o Contrato

| O que o plano diz | O que falta |
|---|---|
| "Extrair DDL para `.sql` versionado" | Não define: (a) como numerar, (b) como testar equivalência com `migrations/user.ts`, (c) quem mantém a versão canônica |
| "Formalizar backup v2 como spec" | Não define o formato v2 (JSON envelope? campos? versão de protocolo? como tratar campos adicionados/removidos?) |
| "Golden files" | Não define: quantos, quais coleções, como gerar, como rodar o teste cross-língua |
| "Testes de paridade" | Não define: framework de teste Rust (rstest? proptest?), como rodar em CI, quem gera os fixtures |

**Aceite sugerido para Fase 0:**
- [ ] `schema.sql` extraído com 100% das tabelas de `migrations/user.ts` (verificado por diff estrutural)
- [ ] `backup-v2-spec.md` formaliza envelope JSON, campos por entidade, versionamento
- [ ] ≥1 golden file por coleção (tasks, courses, classes, exams, flashcards, readings, sessions, internship, tcc, stickers, concepts, authors, approaches, techniques, questions)
- [ ] Teste `cargo test` que: lê golden file → deserializa com `serde` → serializa de volta → compara JSON (round-trip idêntico)
- [ ] Teste `cargo test` que: compara output Rust com output TS (mesma entrada → mesmo JSON)

### Fase 1 — Núcleo Rust (sem UI)

| O que o plano diz | O que falta |
|---|---|
| "Portar cecistudy-domain" | Não define: como tratar factories duplicadas (TS já tem `createResponsibility`); como testar invariantes em Rust (proptest? serde round-trip?) |
| "Portar cecistudy-data" | Não define: (a) qual driver (rusqlite vs sqlx — async? sync?), (b) como mapear `AppContext` setters para repositórios, (c) como testar CRUD |
| "Portar cecistudy-sync" | Não define: (a) como portar `mergeSyncedDatabases` (função complexa com testes), (b) como mockar GitHub API em Rust, (c) async runtime |
| "Portar cecistudy-content" | Não define: (a) como Flutter lê o `.db` (via Rust? direto?), (b) como testar queries |
| "Golden files batem entre TS e Rust" | Não define CI pipeline para rodar ambos os lados |

**Aceite sugerido para Fase 1:**
- [ ] `cargo test` passa em todos os crates
- [ ] Para cada entidade em `domain`: tipo Rust + factory + ≥1 teste de invariante
- [ ] Para cada repositório em `data`: CRUD testado com SQLite in-memory
- [ ] Sync engine: ≥5 testes de merge LWW com fixtures compartilhados
- [ ] Content: query ao `.db` catálogo retorna dados consistentes
- [ ] Backup: round-trip export→import→export idêntico

### Fase 2 — Bridge + Esqueleto Flutter

| O que o plano diz | O que falta |
|---|---|
| "flutter_rust_bridge gerando bindings" | Não define: (a) como configurar FRB, (b) estrutura do projeto Flutter, (c) como o Rust é compilado (static lib? cdylib?), (d) como atualizar bindings |
| "App mínimo: abre catálogo, lê/escreve banco, renderiza Home" | Não define: (a) como é a Home, (b) como o Flutter consome o bridge, (c) gerenciamento de estado Flutter |

**Aceite sugerido para Fase 2:**
- [ ] `flutter run -d linux` abre janela e mostra lista de disciplinas lidas do catálogo
- [ ] Criação de tarefa via bridge persiste no SQLite e aparece na UI
- [ ] Hot-reload funciona (atualização de UI sem reiniciar Rust)
- [ ] `flutter_rust_bridge generate` roda sem erro

### Fases 3–7 — Portar Módulos

Nenhuma fase tem spec de UI Flutter. O plano diz "portar módulo por módulo" mas não define:
- Layout de cada tela (wireframe, componentes, estados)
- Como o Flutter consome a capacidade (consulta `capabilityFor` antes de renderizar botões)
- Estados de loading/empty/error
- Interações específicas (drag/resize no calendário, editor de blocos, etc.)

---

## 4. Cross-cutting Concerns — O que o Spec NÃO Endereça

### 4.1 Design System / Theming → Flutter

**Gap total.** O design system em `src/index.css` (@theme) define tokens de cor, tipografia, radius, sombras. O spec não menciona:
- Como portar tokens Tailwind → `ThemeData` do Flutter
- Se o Flutter usa Material Design, custom theme, ou sistema próprio
- Se `design-tokens` package (TS) gera tokens para Flutter também
- Hierarquia de sombras, radius, padding específica do cecistudy

**Spec necessária:** `flutter-theme-spec.md`

### 4.2 State Management no Flutter

**Gap total.** O spec menciona `Riverpod ou Bloc` no diretório `lib/state/` mas não decide:
- Qual state manager (Riverpod? Bloc?GetX?)
- Como o estado se divide: (a) dados do Rust via bridge = "server state", (b) UI efêmera = "client state"
- Como resolver o padrão `useApp()` do React no Flutter (provider? riverpod? inherited widget?)
- Cache de dados do Rust no Flutter (quando re-fetch? invalidation?)

**Spec necessária:** `flutter-state-management-spec.md`

### 4.3 Navegação Flutter

**Gap parcial.** O spec define "navegação" como módulo mas não define:
- Router Flutter (go_router? AutoRoute? navigator 2.0?)
- Deep linking (se aplicável no desktop)
- Transições de tela (o rebuild React definiu `computeDesktopSlideKey` e `desktopScreenVariants` — como portar?)
- Como a pilha `NavScreen[]` do React se mapeia para navegação Flutter

**Spec necessária:** `flutter-navigation-spec.md`

### 4.4 Acessibilidade

**Gap total.** Nenhuma menção a:
- Semântica (ScreenReader, Semantics widget)
- Contraste WCAG no tema Flutter
- Teclado/navegação por focus
- Tamanhos mínimos de toque (44px)

**Spec necessária:** `flutter-accessibility-spec.md` (pode ser curta se herdar do design system)

### 4.5 Internacionalização

**Gap total.** App é pt-BR mas não menciona:
- `flutter_localizations` / `intl`
- Arquivos `.arb`
- Strings hardcoded vs centralizadas

**Spec necessária:** `flutter-i18n-spec.md` (provavelmente "manter strings hardcoded em pt-BR como hoje")

### 4.6 Error Handling Patterns

**Gap total.** Não define:
- Como erros Rust são comunicados ao Flutter (panic? Result? error codes?)
- UI de erros (toast? modal? snackbar?)
- Retry patterns
- Offline behavior (o app funciona sem sync?)

**Spec necessária:** `flutter-error-handling-spec.md`

### 4.7 Loading States

**Gap total.** Não define:
- Skeleton screens
- Progress indicators
- Lazy loading de dados pesados (catálogo tem ~7MB de conceitos)

**Spec necessária:** Pode ser parte da spec por módulo

### 4.8 Offline Behavior

**Gap parcial.** O app é offline-first (SQLite local) mas não define:
- Como o Flutter lida com dados não sincronizados
- Indicador visual de status de sync
- Conflict resolution UX (quando sync encontra divergência)

### 4.9 Notificações (Flutter side)

**Gap total.** O spec menciona `flutter_local_notifications` na Fase 6 mas não define:
- Lembrete diário (port de `notifications.ts` — timer JS desktop vs plugin nativo)
- Permissões
- Agendamento

### 4.10 Auto-update (Flutter side)

**Gap parcial.** Menciona "mesmo mecanismo de GitHub Releases" mas não define:
- `flutter_updater` ou equivalente
- Manifesto JSON (hoje `latest.json` para Tauri)
- Assinatura de builds

### 4.11 Testes Flutter

**Gap total.** Não define:
- Widget tests vs integration tests
- Como testar bridge Rust↔Flutter
- Coverage expectations
- CI pipeline para Flutter (Linux, macOS, Windows)

### 4.12 Empacotamento & Distribuição

**Gap parcial.** Fase 6 menciona "Build Flutter desktop" mas não define:
- Targets (Windows: MSIX? NSIS? macOS: DMG? Linux: AppImage/DEB?)
- Code signing
- CI pipeline (GitHub Actions com Flutter SDK?)
- Tamanho do bundle

---

## 5. Ordem Recomendada de Escrita de Specs

### Bloco 1 — Fundação (antes de qualquer código)

| # | Spec | Prioridade | Dependências |
|---|---|---|---|
| 1 | **`flutter-state-management-spec.md`** | P0 | Decisão de framework |
| 2 | **`flutter-theme-spec.md`** | P0 | Tokens existentes |
| 3 | **`flutter-navigation-spec.md`** | P0 | Pilha NavScreen existente |
| 4 | **`flutter-error-handling-spec.md`** | P1 | — |
| 5 | **`flutter-accessibility-spec.md`** | P1 | — |
| 6 | **`flutter-i18n-spec.md`** | P2 | (provavelmente "não muda") |

### Bloco 2 — Contrato de dados (Fase 0 do plano)

| # | Spec | Prioridade | Dependências |
|---|---|---|---|
| 7 | **`schema-sql-canonical.md`** | P0 | `migrations/user.ts` |
| 8 | **`backup-v2-spec.md`** | P0 | `backupSchema.ts` |
| 9 | **`golden-files-spec.md`** | P0 | Specs 7+8 |

### Bloco 3 — Módulos Rust (Fase 1)

| # | Spec | Prioridade | Dependências |
|---|---|---|---|
| 10 | **`rust-domain-port-spec.md`** | P0 | `packages/domain/*` |
| 11 | **`rust-data-port-spec.md`** | P0 | Spec 7 |
| 12 | **`rust-sync-port-spec.md`** | P1 | `packages/sync/*` |
| 13 | **`rust-content-spec.md`** | P1 | Pipeline Node |
| 14 | **`rust-integrations-gcal-spec.md`** | P2 | Google OAuth docs |

### Bloco 4 — Telas Flutter (Fases 2–7)

| # | Spec | Prioridade | Depende de | Complexidade |
|---|---|---|---|---|
| 15 | **`flutter-shell-home-spec.md`** | P0 | Bloc 1 + Bridge | Alta |
| 16 | **`flutter-faculdade-spec.md`** | P0 | Spec 15 | Média |
| 17 | **`flutter-perfil-spec.md`** | P1 | Spec 15 | Baixa |
| 18 | **`flutter-estudos-spec.md`** | P1 | Spec 15 | Média |
| 19 | **`flutter-calendario-spec.md`** | P1 | Spec 15 + Integrations | Muito Alta |
| 20 | **`flutter-conhecimento-spec.md`** | P2 | Spec 15 + Data | Alta |
| 21 | **`flutter-biblioteca-spec.md`** | P2 | Spec 15 + Content | Média |
| 22 | **`flutter-marketing-spec.md`** | P2 | Spec 15 + Calendar | Alta |
| 23 | **`flutter-projetos-spec.md`** | P3 | Spec 15 + Knowledge + Calendar | Muito Alta |

### Bloco 5 — Infraestrutura

| # | Spec | Prioridade | Dependências |
|---|---|---|---|
| 24 | **`flutter-packaging-spec.md`** | P2 | Flutter shell pronto |
| 25 | **`flutter-notifications-spec.md`** | P2 | Empacotamento |
| 26 | **`flutter-testing-strategy.md`** | P1 | Bloc 1 |
| 27 | **`flutter-offline-sync-spec.md`** | P1 | Data + Sync |

---

## 6. O que o Plano Faz Bem (manter)

- **Princípio "Rust é dono de domínio, Flutter só desenha"** — excelente separação de responsabilidades
- **Capabilities como contrato de plataforma** — a matriz `canView/canCreate/canEdit/canDelete/projection` é o mecanismo correto
- **Contrato de dados compartilhado (DDL + backup + golden files)** — reconhece o maior risco técnico
- **Fase 0 antes de código** — congelar contrato antes de portar é a ordem certa
- **Google Calendar inteiramente no Rust** — coerente com o princípio geral
- **TCC como trilha própria com fases de MVP** — honesto sobre complexidade
- **Reconhecimento do rebuild visual React como trabalho paralelo** — e a recomendação de parar nos módulos que serão redesenhados em Flutter

---

## 7. Resumo Executivo

| Dimensão | Avaliação |
|---|---|
| **Visão arquitetural** | ✅ Sólida — Rust dono de lógica, Flutter dono de UI, contrato compartilhado |
| **Definição de módulos Rust** | 🟡 Parcial — `domain` e `sync` têm código TS para portar; `data`, `content`, `integrations` são majoritariamente greenfield |
| **Spec de telas Flutter** | 🔴 Ausente — 9 telas mencionadas mas nenhuma com wireframe, componentes ou estados |
| **Cross-cutting concerns** | 🔴 Ausente — theming, state management, navegação, acessibilidade, i18n, error handling, testes |
| **Contrato de dados** | 🟡 Parcial — conceito claro mas falta formalização (DDL, backup v2, golden files) |
| **Aceite por fase** | 🔴 Ausente — nenhuma fase tem critérios testáveis |
| **Estimativa de esforço** | 🔴 Ausente — nenhuma estimativa de tempo/tamanho por módulo |
| **Riscos** | 🟡 Parcial — 5 riscos listados mas sem probabilidades, impacto ou owners |

**Próximo passo recomendado:** Escrever as specs do Bloco 1 (state management, theme, navigation) + Bloco 2 (contrato de dados) antes de qualquer código. Essas 9 specs destravam todas as fases subsequentes.
