# plano consolidado — cecistudy desktop flutter + rust

> Análise consolidada de 6 skills especializados sobre `plano-desktop-flutter-rust.md`.
> Data: 2026-09-10

---

## ⚠️ Status de implementação (2026-09-11)

> **Este documento é a consulta de planejamento; a FONTE DE VERDADE de status é
> `01-task-breakdown-flutter-rust.md`** (numeração e checklist diferentes — ver reconciliação lá).

- **Fase 0 (contrato): 5/5 ✅** — `contracts/{schema.sql, backup-v2-spec.md, golden/*, verify-schema.mjs}`.
- **Fase 1 (núcleo Rust): 20/23 ✅** — workspace + `cecistudy-common/domain/data/sync/content/app`.
  Implementado nos commits `5ee35fb`→`bf9790a` (gate: clippy -D warnings ✓, fmt ✓, 116 testes ✓).
  Pendentes: módulos de domínio `calendar/knowledge/marketing/projects/internship` (só workspace+capabilities),
  validação de paridade full e `cecistudy-ffi`.
- **Fase 2+ (Flutter): 🔲 não iniciada** — exige FFI (1.22) concluído.
- **Próximo passo real:** terminar o porte de domínio (`calendar.rs`, `knowledge.rs`, `marketing.rs`,
  `projects.rs`, `internship.rs`) e depois `cecistudy-ffi` (1.22) para destravar a Fase 2.

---

## sumário executivo

**O que é:** abandonar Tauri + React no desktop. Novo desktop = Flutter (apresentação) + Rust (domínio, dados, sync, integrações). Mobile (React + Capacitor) continua como está.

**Veredito geral:** a visão arquitetural é sólida e bem fundamentada. Porém, o spec **subestima significativamente** a superfície de porte (o `src/lib/*` com ~5.5k LOC e 30+ módulos não é inventariado), e **9 telas Flutter** não têm spec nenhuma. Existem **12 preocupações transversais** não endereçadas. A maior�oria dos riscos é mitigável com o processo certo — e o processo está definido abaixo.

**Números-chave:**
- **68 tarefas** em 7 fases
- **~130–185 arquivos** tocados
- **~10–14 semanas** (1 dev full-time)
- **27 specs** necessários (9 telas sem spec + 12 cross-cutting + foundation)
- **0 bloqueadores** — 8 dúvidas fechadas (ver [parte ix](#parte-ix--decis%C3%A3o-fechada-d1---invent%C3%A1rio-srclib--rust--))

---

## parte i — diagnóstico do estado atual vs spec

### 1. O que o spec acerta

| Afirmação do spec | Status no código | Avaliação |
|---|---|---|
| `packages/domain` tem entidades completas (calendar, knowledge, marketing, projects, capabilities) | ✅ Confirmado — 6 módulos de domínio bem estruturados | Correto |
| `capabilities.ts` já tem a matriz `{entity, platform, canView, canCreate, canEdit, canDelete, projection}` | ✅ Confirmado | Correto — a peça mais importante existe |
| Tauri (`desktop/src-tauri/src/lib.rs`) não tem lógica — só plugins | ✅ Confirmado — 18 linhas | Correto |
| `packages/sync` tem protocolo com `SyncManifest`/`SyncPackage`, merge LWW, provider GitHub | ✅ Confirmado | Correto |
| Pipeline de catálogo em Node gera `.db` SQLite somente-leitura | ✅ Confirmado | Correto — reaproveitado sem mudança |
| Sync P2P (WebRTC/Trystero) está pausado | ✅ Confirmado | Correto |

### 2. O que o spec subestima ou ignora

| Gap | Severidade | Detalhamento |
|---|---|---|
| **`src/lib/*` não inventariado** | 🔴 Crítico | O spec lista os `packages/domain` (~3.5k LOC) mas **ignora** `src/lib/*` (~5.5k LOC, 30+ módulos) que contém a lógica de uso real: `taskLogic.ts`, `streak.ts`, `celebrate.ts`, `schedule.ts`, `quizGrading.ts`, `pomodoro.ts`, `exportImport.ts`, `ota.ts`, `routing.ts`, etc. `cecistudy-app` (casos de uso) não pode ser construído sem inventariar isso. |
| **Migrações são closures JS** | 🔴 Crítico | 13 migrações em `packages/data/src/schema.ts` incluem `migrateDatabase` com lógica JS (ex: `parseLegacySchedule` importado de `src/lib/schedule.ts` — **fora do boundary de packages**). "Extrair DDL para .sql" ≠ "portar migrações"; é preciso fixtures v1→v13 + runner de teste. |
| **Serialização canônica** | 🔴 Crítico | `tieBreak` compara strings `JSON.stringify` (ordenação UTF-16), `contentHash` usa FNV-1a sobre code-units UTF-16, `localeCompare` para sorting — **nenhum mapeia limpo para Rust** `serde_json`/`String::Ord`. Risco #1 real. Precisa de spec "canonical JSON v1" + test vectors **antes** de qualquer crate. |
| **Matriz de capacidades incompleta** | 🟡 Alto | `capabilities.ts` cobre **9 entidades novas** (calendar, knowledge, marketing, projects, etc.) mas as entidades legadas (course, task, exam, classNote, flashcard, reading, etc.) **não têm linhas** — viola o princípio "Rust decide" em toda tela existente. |
| **`packages/application` é um wrapper de 136 LOC** | 🟡 Alto | A lógica de caso de uso real vive em `AppContext.tsx` (1884 linhas) e `src/lib/*`. O spec assume que "portar packages" é suficiente; não é. |
| **OAuth desktop não endereçado** | 🟡 Alto | Web usa popup GIS (Google Identity Services) que não existe em desktop nativo. Desktop precisa de OAuth installed-app + keyring para armazenar tokens — completamente não abordado. |
| **Mobile USER_DB nunca foi shipped** | 🟢 Info | O DDL mobile é projeção, não compat contract — o BackupV2 JSON é o único contrato duro. Isso é bom (flexibilidade) mas precisa ser explícito. |
| **Theming/temas** | 🟡 Médio | 10 temas no mobile; o spec não menciona quantos serão portados para desktop nem como o `ThemeController` funcionará no Flutter. |

### 3. lacunas de especificação

#### 3.1 Telas Flutter sem spec (9 de 16)

| Tela | Complexidade | O que falta |
|---|---|---|
| Home | ●● | Layout desktop, quick stats grid, module shortcuts |
| Faculdade | ●● | Master-detail layout, schedule picker |
| Estudos | ●● | Timer layout, flashcard 3D flip, histórico |
| Biblioteca | ●●● | Master-LIB (acervo + reader), lazy loading de catálogo |
| Perfil | ●● | Seções, dither charts, personalização |
| Templo | ●●● | Master-detail de exploração, MarkdownBlock |
| Onboarding | ●● | Fluxo adaptado para desktop |
| Wizards/Compose | ●●● | Formulários multi-step em painel central |
| Quiz | ●● | Seletor, jogo, resultado |

#### 3.2 Módulos desktop novos sem UI spec (4)

| Módulo | Complexidade | Estado |
|---|---|---|
| Calendário (drag/resize) | ●●● | React tem 13 arquivos como referência; precisa de spec Flutter |
| Conhecimento (grafo) | ●●● | React é stub circular; grafo interativo = greenfield |
| Marketing (studio) | ●●● | 100% greenfield |
| Projetos/TCC (árvore + editor) | ●●● | Maior blue-sky; React é stub |

#### 3.3 Preocupações transversais não endereçadas (12)

1. **Gerenciamento de estado Flutter** (Riverpod vs Bloc — recomendação: Riverpod 3.x)
2. **Navegação Flutter** (Navigator aninhado + auto_route vs Router 2.0)
3. **Sistema de temas** (10 temas → Flutter ThemeExtension)
4. **Acessibilidade** (teclado-first, screen readers, focus management)
5. **Tratamento de erros** (padrão Rust `thiserror` → Flutter toast/acolhedor)
6. **Estados de loading** (skeleton, shimmer, optimistic updates)
7. **Comportamento offline** (Rust SQLite local = offline por padrão)
8. **Internacionalização** (pt-BR only, mas estrutura para futuro)
9. **Padrões de animação** (framer-motion → Flutter)
10. **Theming desktop** (quais temas liberar no MVP)
11. **Notificações Flutter** (`flutter_local_notifications`)
12. **Auto-update** (mesmo mecanismo GitHub Releases que Tauri usa hoje)

---

## parte ii — arquitetura proposta (com ajustes)

### 4. Estrutura de repositório (ajustada)

```
cecistudy-rust/                      (novo workspace Cargo)
├── contracts/                       ← NOVO: contrato compartilhado
│   ├── schema.sql                   DDL canônico (versão numerada)
│   ├── backup-v2-spec.md            Spec formal do formato JSON
│   ├── golden/                      Fixtures JSON para teste de paridade
│   │   ├── full_backup.json
│   │   ├── courses.json
│   │   ├── tasks.json
│   │   └── ...
│   └── AGENTS.md                    Regras de contrato cross-língua
│
├── crates/
│   ├── cecistudy-common/            IDs, timestamps, erros compartilhados
│   ├── cecistudy-domain/            entidades + invariantes + máquinas de estado
│   ├── cecistudy-data/              SQLite (rusqlite single-writer), migrações, repositórios
│   ├── cecistudy-content/           acesso ao catálogo .db (somente-leitura)
│   ├── cecistudy-sync/              protocolo, merge LWW, provider GitHub
│   ├── cecistudy-integrations/      Google Calendar (OAuth installed-app, sync, conflitos)
│   ├── cecistudy-app/               casos de uso — única superfície para FFI
│   └── cecistudy-ffi/               bridge flutter_rust_bridge
│
├── docs/
│   ├── architecture.md
│   ├── domain-port-guide.md         mapeamento TS → Rust por entidade
│   ├── sync-protocol.md
│   └── canonical-json-v1.md         spec de serialização canônica
│
├── tests/
│   ├── golden_parity_test.rs        teste de paridade cross-língua
│   └── migration_runner_test.rs     teste de migrações com fixtures v1→v13
│
└── Cargo.toml                       workspace manifest

apps/desktop-flutter/               (substitui desktop/ e apps/desktop)
├── AGENTS.md                        regras Flutter
├── lib/
│   ├── main.dart
│   ├── app.dart                     MaterialApp + tema + rotas
│   ├── bridge/                      bindings FRB geradas
│   │   ├── domain_bridge.dart       conexão + streams por módulo
│   │   └── capabilities.dart        capabilityFor(entity) → gate de UI
│   ├── core/
│   │   ├── theme/                   ThemeExtension<CecistudyTokens> + <DesktopTokens>
│   │   ├── navigation/              auto_route config + módulo Navigator
│   │   └── widgets/                 PaperCard, CuteBadge, Pill, Modal, etc.
│   ├── state/
│   │   ├── module/                  providers por módulo (home, faculdade, etc.)
│   │   ├── session/                 sessionProvider (DesktopSessionState)
│   │   ├── theme/                   themeProvider (resolve temas → ThemeData)
│   │   └── ui/                      families efêmeras
│   ├── features/
│   │   ├── shell/                   sidebar, topbar, statusbar, switcher
│   │   ├── home/
│   │   ├── faculdade/
│   │   ├── estudos/
│   │   ├── biblioteca/
│   │   ├── calendario/
│   │   ├── conhecimento/
│   │   ├── marketing/
│   │   ├── projetos/
│   │   ├── inbox/
│   │   ├── perfil/
│   │   └── shared/                  modais, wizards, compose
│   └── design_tokens/               conversão dos tokens CSS → Dart constants
├── test/
└── pubspec.yaml
```

### 5. Decisões de arquitetura (com justificativa)

| Decisão | Escolha | Justificativa |
|---|---|---|
| **Bridge** | `flutter_rust_bridge` com surface híbrida | Typed commands para operações simples + JSON opaco para dados pesados. Não gerar 25+ structs FRB — manter a fronteira fina. |
| **SQLite driver** | `rusqlite` (single-writer) | Não `sqlx` — o desktop é app local, não precisa de async/connection pool. Mais simples e previsível. |
| **State management Flutter** | Riverpod 3.x | Encaixa no modelo "Rust decide, Flutter desenha" — providers observáveis consomem streams do bridge. |
| **Navegação** | Navigator aninhado + auto_route | Sidebar = módulo ativo; cada módulo tem seu próprio Navigator stack; push de telas secundárias. |
| **Contrato canônico** | Canonical JSON v1 (spec própria) | Antes de código: definir regras de serialização que TS e Rust produzem idênticas. |
| **Capacidades** | Estender matrix para TODAS as entidades | Não só as 9 novas — course, task, exam, etc. também precisam de rows para "Rust decide". |

### 6. Riscos avaliados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| TS e Rust divergem no contrato e quebram sync silenciosamente | Alta | Crítico | Golden files obrigatórios desde Fase 0; CI gate; canonical JSON spec |
| `src/lib/*` (~5.5k LOC) é maior que esperado para porte | Alta | Alto | Inventariar completo antes de Fase 1; decidir o que vai para Rust vs fica no Flutter |
| TCC (editor paginado + DOCX + ABNT) é projeto do tamanho de um editor | Média | Crítico | Tratar como trilha própria; 5 fases de MVP; não pular pra funcionalidades pós-MVP |
| OAuth desktop (installed-app + keyring) é complexo | Média | Alto | Prototipar cedo na Fase 1; usar `oauth2` crate + keyring |
| `flutter_rust_bridge` pode ter Limitações | Baixa | Alto | Validar na Fase 2 antes de investir em todas as telas |
| Duas implementações do domínio (Rust + TS) por tempo indefinido | Alta | Médio | Aceitar como custo consciente; reavaliar depois que desktop estiver estável |

---

## parte iii — plano de implementação (68 tarefas, 7 fases)

### Fase 0 — Congelar o contrato (5 tarefas, ~3–5 dias)

> **Objetivo:** estabelecer o contrato compartilhado antes de qualquer código de produto.
> **Gate:** golden files passam em ambos os lados (TS + Rust).

| # | Tarefa | Aceitação | Verificação | Escopo |
|---|---|---|---|---|
| 0.1 | **Extrair DDL canônico** — consolidar `packages/data/src/schema.ts` (CREATE TABLEs) + 13 migrações em `contracts/schema.sql` versionado | Arquivo `.sql` com todas as tabelas na versão atual; migrations numeradas v1→v13 com fixtures | `sqlite3 < schema.sql` cria banco válido | M |
| 0.2 | **Especificar backup v2** — documentar formalmente o formato JSON de backup/sync a partir de `backupSchema.ts` (Zod) | Doc `backup-v2-spec.md` com envelope, campos por coleção, tipos, nullable, defaults | Revisão humana | S |
| 0.3 | **Implementar canonical JSON v1** — spec de serialização que garante TS `JSON.stringify` ≡ Rust `serde_json` (ordenção de chaves, normalização de strings, timestamps ISO 8601, arrays ordenados) | Doc `canonical-json-v1.md` + função `canonicalize()` em TS e Rust | Testes round-trip idênticos | M |
| 0.4 | **Criar golden fixtures** — gerar JSONs de cada coleção + `full_backup.json` a partir de estado vazio + estado com dados de teste | Arquivos em `contracts/golden/`; ts test que serializa → compara; rust test idem | `npm run test -- golden` + `cargo test --test golden_*` passam | M |
| 0.5 | **Definir matrizes de capacidade completas** — estender `capabilities.ts` para TODAS as entidades (course, task, exam, classNote, flashcard, reading, studySession, material, internshipLog, tcc, sticker, quizSession) com rows `{entity, 'desktop', canView, canCreate, canEdit, canDelete, projection}` | Tabela completa em `capabilities.ts` + `capabilities.rs` | Testes de paridade | S |

**Checkpoint Fase 0:** Contrato congelado. Golden files passam em TS. Spec de canonical JSON v1 aprovada. Matriz de capacidades cobre todas as entidades.

---

### Fase 1 — Núcleo Rust, sem UI (23 tarefas, ~2–3 semanas)

> **Objetivo:** portar todo o domínio, dados, sync e conteúdo para Rust.
> **Gate:** testes de golden-file batem entre TS e Rust; `cargo test` verde.

#### 1A — Fundação (3 tarefas, paralelizáveis)

| # | Tarefa | Arquivos | Depende |
|---|---|---|---|
| 1.1 | Setup workspace Cargo + crate `cecistudy-common` (EntityId newtype, timestamps ISO 8601, erros base com `thiserror`) | `Cargo.toml`, `common/src/lib.rs` | — |
| 1.2 | Setup crate `cecistudy-domain` vazio + módulo `common` | `domain/Cargo.toml`, `domain/src/lib.rs` | 1.1 |
| 1.3 | Setup `rustfmt.toml` + `clippy.toml` + CI gate (`cargo clippy -- -D warnings` + `cargo fmt --check`) | configs | — |

#### 1B — Portar domínio (8 tarefas, **paralelizáveis** após 1.2)

| # | Tarefa | Entidades | Referência TS | Complexidade |
|---|---|---|---|---|
| 1.4 | `calendar.rs` | CalendarEvent, RecurrenceRule, Occurrence, Responsibility, Subtask, PlanningBlock, ExecutionRecord, CommitmentLevel, CalendarItemStatus | `packages/domain/src/core/domain/calendar.ts` | ●●● |
| 1.5 | `knowledge.rs` | Document, Block, Relation, Suggestion, AssociationPolicy, LearningState | `knowledge.ts` | ●●● |
| 1.6 | `marketing.rs` | PositioningProfile, ContentIdea, ContentBase, ChannelVariant, Publication, MetricSnapshot, StrategicInsight | `marketing.ts` | ●●● |
| 1.7 | `projects.rs` | Project, AcademicNode, Output, Reference, Citation | `projects.ts` | ●● |
| 1.8 | `workspace.rs` + `capabilities.rs` | Workspace, PlatformCapability, capabilityFor() | `workspace.ts`, `capabilities.ts` | ●● |
| 1.9 | `internship.rs` | InternshipLog, case tracking | `internship.ts` | ● |
| 1.10 | `common.rs` | Platform, EntityId, makeId() | `common.ts`, `ids.ts` | ● |
| 1.11 | **Portar lógica de `src/lib/*`** — inventariar e decidir o que vai para Rust: `taskLogic.ts`, `streak.ts`, `celebrate.ts`, `schedule.ts`, `quizGrading.ts`, `pomodoro.ts`, `exportImport.ts` | Novos módulos no domain/data | `src/lib/*` (~5.5k LOC) | ●●● |

> ⚠️ **Tarefa 1.11 é a mais crítica e subestimada.** O spec não a lista. É preciso inventariar os 30+ módulos de `src/lib/*`, classificar (domínio → Rust, apresentação → Flutter, indeciso → decidir), e portar a lógica pura.

#### 1C — Dados (5 tarefas, sequenciais)

| # | Tarefa | Arquivos | Depende |
|---|---|---|---|
| 1.12 | Setup crate `cecistudy-data` + conexão SQLite via `rusqlite` | `data/Cargo.toml`, `data/src/lib.rs` | 1.1 |
| 1.13 | Portar 13 migrações do TS (1→13) como Rust functions + fixtures de teste | `data/src/migrations/`, `tests/fixtures/` | 0.1, 1.12 |
| 1.14 | Implementar repositórios (CRUD por entidade) | `data/src/repositories/` | 1.13 |
| 1.15 | Implementar backup export/import (serde JSON) | `data/src/backup.rs` | 0.2, 0.3, 1.14 |
| 1.16 | Testes de paridade golden-file (Rust serializa → compara com fixture) | `tests/golden_parity_test.rs` | 0.4, 1.15 |

#### 1D — Sync (3 tarefas, sequenciais)

| # | Tarefa | Arquivos | Depende |
|---|---|---|---|
| 1.17 | Portar `stamp.rs` (revisão monotônica, CAS por SHA) | `sync/src/stamp.rs` | 1.1 |
| 1.18 | Portar `merge.rs` (LWW merge com funções puras) | `sync/src/merge.rs` | 1.17 |
| 1.19 | Provider GitHub via `reqwest` (HTTP simples) | `sync/src/providers/github.rs` | 1.18 |

#### 1E — Conteúdo + App + FFI (4 tarefas, sequenciais)

| # | Tarefa | Arquivos | Depende |
|---|---|---|---|
| 1.20 | Crate `cecistudy-content` — abrir `.db` do catálogo, queries read-only | `content/src/lib.rs` | — |
| 1.21 | Crate `cecistudy-app` — casos de uso que orquestram domain+data+sync+content | `app/src/lib.rs` | 1.14, 1.18, 1.20 |
| 1.22 | Crate `cecistudy-ffi` — surface FFI via `flutter_rust_bridge` (comando+híbrido) | `ffi/src/api.rs` | 1.21 |
| 1.23 | `cecistudy-integrations` — Google Calendar (OAuth installed-app, mapeamento ID, sync bidirecional, conflitos) | `integrations/src/` | 1.21 |

**Checkpoint Fase 1:** `cargo test` verde. Golden files passam. FFI surface definida. Todos os módulos de domínio portados.

---

### Fase 2 — Bridge + esqueleto Flutter (8 tarefas, ~1–2 semanas)

> **Objetivo:** validar o pipeline ponta a ponta antes de investir em telas.
> **Gate:** app mínimo abre, lê catálogo, lê/escreve no banco, renderiza Home.

| # | Tarefa | Aceitação | Depende |
|---|---|---|---|
| 2.1 | Setup Flutter desktop (Linux/macOS/Windows) + `flutter_rust_bridge` | `flutter run -d linux` abre janela | 1.22 |
| 2.2 | Gerar bindings Dart a partir de `cecistudy-ffi` | `bridge/` gerado, sem erros | 2.1 |
| 2.3 | Theme engine: `CecistudyTokens` + `DesktopTokens` como ThemeExtension | Tokens CSS traduzidos para Dart; tema aplica corretamente | — |
| 2.4 | Shell desktop: sidebar + topbar + statusbar + workspace switcher | Layout renderiza, navegação por módulo funciona | 2.3 |
| 2.5 | Conectar bridge: ler perfil + cursos do banco Rust via FFI | Dados aparecem na Home | 2.2, 2.4 |
| 2.6 | Command palette (⌘K) | Abre, busca, navega | 2.4 |
| 2.7 | Context inspector (painel direito colapsável) | Renderiza conteúdo por módulo | 2.4 |
| 2.8 | Testes de paridade E2E: export do TS → import no Rust → export novamente → JSON idêntico | Teste automatizado passa | 1.16, 2.5 |

**Checkpoint Fase 2:** App mínimo funcional. Bridge validada. Paridade E2E confirmada. Pronto para investir em telas.

---

### Fase 3 — Portar módulo por módulo (22 tarefas, ~6–8 semanas)

> **Ordem:** simples → complexo, com tracks independentes para Calendário e TCC.

#### Track A: Telas que portam o app atual (13 tarefas)

| # | Tarefa | Complexidade | Depende |
|---|---|---|---|
| 3.1 | **Home** — saudação, quick stats, module shortcuts, attention section | ●● | 2.5 |
| 3.2 | **Faculdade** — master-detail (lista + detail com tabs info/aulas/repertório) | ●● | 3.1 |
| 3.3 | **CourseDetail** — info, aulas (ClassNoteListItem), repertório | ●● | 3.2 |
| 3.4 | **Estudos** — timer pomodoro, flashcards, leituras, histórico | ●● | 3.1 |
| 3.5 | **Biblioteca** — master-LIB (acervo + reader), favoritos, notas avulsas, templo | ●●● | 3.1 |
| 3.6 | **Templo** — conceitos (12 chunks), autores, técnicas, comparações | ●●● | 3.5 |
| 3.7 | **Perfil** — journey summary, timeline, stickers, personalização, backup/import | ●● | 3.1 |
| 3.8 | **Estágio** — diário com casos, supervisão | ●● | 3.2 |
| 3.9 | **Onboarding** — fluxo multi-step adaptado para desktop | ●● | 2.5 |
| 3.10 | **Wizards/Compose** — formulários multi-step (nota, tarefa, prova, sessão) | ●●● | 3.2 |
| 3.11 | **Quiz** — seletor, jogo, resultado, explicações | ●● | 3.4 |
| 3.12 | **Inbox** — sugestões com ações | ●● | 3.1 |
| 3.13 | **Perfil/settings** — tema, lembretes, sync status, OTA | ●● | 3.7 |

#### Track B: Calendário (independente, 5 tarefas)

| # | Tarefa | Complexidade | Depende |
|---|---|---|---|
| 3.14 | **Calendário MVP** — grade semanal (dias × horários), visualização | ●●● | 2.5 |
| 3.15 | **Drag/resize** — mover/redimensionar eventos com snap 30min | ●●● | 3.14 |
| 3.16 | **Recorrência** — `RecurrenceRule` visualização + edição | ●●● | 3.15 |
| 3.17 | **Integração Faculdade** — eventos de aula aparecem no calendário | ●● | 3.14, 3.2 |
| 3.18 | **Google Calendar** — camada de import/sync + conflitos | ●●● | 1.23, 3.14 |

#### Track C: Projetos/TCC (independente, 4 tarefas)

| # | Tarefa | Complexidade | Depende |
|---|---|---|---|
| 3.19 | **Projetos** — lista (limite 5 ativos) + árvore acadêmica editável | ●●● | 2.5 |
| 3.20 | **Editor paginado (M-DOC)** — PageCanvas, blocos (paragraph/heading/list), paginação | ●●● | 3.19 |
| 3.21 | **Citações + referências** — picker, inserção (Autor, ano, p. X), nota de rodapé | ●●● | 3.20 |
| 3.22 | **Export DOCX/ABNT** — gerador + VersionCompareView (diff visual) | ●●● | 3.21 |

#### Track D: Conhecimento + Marketing (paralelo, 2 tarefas)

| # | Tarefa | Complexidade | Depende |
|---|---|---|---|
| 3.23 | **Conhecimento** — grafo interativo (pan/zoom) + lista + detail + inbox de sugestões | ●●● | 2.5 |
| 3.24 | **Marketing** — studio completo (positioning, ideias, variantes por canal, métricas) | ●●● | 2.5 |

**Checkpoint Fase 3:** Todas as telas funcionais. Cada módulo testado individualmente.

---

### Fase 4 — Interoperabilidade real (3 tarefas, ~1 semana)

> **Objetivo:** desktop novo fala com mobile atual via backup + GitHub sync.

| # | Tarefa | Aceitação |
|---|---|---|
| 4.1 | Export/import de backup entre desktop antigo (Tauri) e novo (Flutter+Rust) | Usuária exporta no antigo → importa no novo → dados intactos |
| 4.2 | Provider GitHub em Rust — compatibilidade completa com mobile | Sync bidirecional funcional entre desktop Rust e mobile TS |
| 4.3 | Testes de integração cross-plataforma | CI roda testes em TS + Rust + compara |

**Checkpoint Fase 4:** Interoperabilidade validada. Desktop novo lê/escreve dados do mobile.

---

### Fase 5 — Sync P2P (não bloqueante, adiável)

> **Status:** pausado no mobile hoje. Não é pré-requisito de lançamento.
> Pode ser implementado depois que o desktop estiver estável.

---

### Fase 6 — Empacotamento (5 tarefas, ~1 semana)

> **Objetivo:** build distribuível + limpar código antigo.

| # | Tarefa | Aceitação |
|---|---|---|
| 6.1 | Build Flutter desktop (Linux/macOS/Windows) — CI pipeline | Binários gerados para as 3 plataformas |
| 6.2 | Notificações (`flutter_local_notifications`) | Lembrete diário funciona no desktop |
| 6.3 | Auto-update (GitHub Releases, mesmo mecanismo que Tauri) | Versão nova notifica e instala |
| 6.4 | CI completa: lint + test + golden files + build Flutter | Pipeline verde |
| 6.5 | Remover `desktop/` (Tauri) e `apps/desktop` (React) | Repositório limpo, só Flutter+Rust |

---

### Fase 7 — Migração de quem já usa o desktop antigo (2 tarefas)

| # | Tarefa | Aceitação |
|---|---|---|
| 7.1 | Documentar fluxo: export backup no antigo → import no novo | Doc claro, testado |
| 7.2 | Validar migração com dados reais (se houver usuária) | Dados intactos pós-migração |

---

## parte iv — rotação de trabalho e paralelismo

### Mapa de paralelismo

```
Fase 0 (contrato) ─────────────────────────────────────────────────┐
  0.1 DDL + 0.2 Backup spec + 0.3 Canonical JSON ── PARALELOS ──┘
  0.4 Golden fixtures + 0.5 Capacidades ── sequenciais após anteriores
                                                                    │
Fase 1 (Rust core) ────────────────────────────────────────────────┤
  1.1-1.3 Fundação ─── PARALELOS ──────────────────────────────────┤
  1.4-1.10 Domínio ── 7 PORTES PARALELOS (após 1.2) ──────────────┤
  1.11 Inventário src/lib/* ── CRÍTICO, PARALELO COM DOMÍNIO ──────┤
  1.12-1.16 Dados ── sequenciais ──────────────────────────────────┤
  1.17-1.19 Sync ── sequenciais, após 1.1 ────────────────────────┤
  1.20-1.23 Conteúdo/App/FFI/Integrations ── sequenciais ─────────┤
                                                                    │
Fase 2 (bridge + Flutter skeleton) ────────────────────────────────┤
  2.1-2.8 ── maioria sequencial, 2.3 Theme paralelo ─────────────┤
                                                                    │
Fase 3 (telas) ───────────────────────────────────────────────────┤
  Track A: Home → Faculdade → Estudos → Biblioteca → ... (seq) ───┤
  Track B: Calendário ── INDEPENDENTE ────────────────────────────┤
  Track C: TCC/Projetos ── INDEPENDENTE ─────────────────────────┤
  Track D: Conhecimento + Marketing ── INDEPENDENTE ─────────────┤
                                                                    │
Fase 4-7 (interop/migration/packaging) ── sequenciais ────────────┘
```

### Caminhos críticos

1. **Contrato (Fase 0)** → **Domínio Rust (1.4–1.10)** → **Dados (1.12–1.16)** → **Bridge (2.1–2.5)** → **Primeira tela (3.1)**
2. **Canonical JSON (0.3)** → **Golden fixtures (0.4)** → **Testes de paridade (1.16, 2.8)**
3. **`src/lib/*` inventário (1.11)** → **Decisão Rust vs Flutter** → **App crate (1.21)**

---

## parte v — decisões resolvidas (2026-09-10)

> ✅ **Todas as 8 decisões foram fechadas com a usuária.** Ver [parte ix](#parte-ix--decis%C3%A3o-fechada-d1---invent%C3%A1rio-srclib--rust--). Não existem mais bloqueadores.

| # | Dúvida | Decisão | Resumo |
|---|---|---|---|
| 1 | Inventário `src/lib/*` | **Portar TUDO puro → Rust** (~22 arquivos, ~2.800 LOC). UI fica no Flutter, hooks viraram wrappers | D1 |
| 2 | Canonical JSON v1 | **Chaves ordenadas + ISO 8601 UTC + floats fixos + arrays preservam ordem** | D2 |
| 3 | OAuth desktop | **Installed-app flow + keyring do OS** (`oauth2` + `keyring` crates) | D3 |
| 4 | Temas MVP | **2 temas**: Rosa Claro + Clean. Restante depois | D4 |
| 5 | Bridge | **Híbrido**: FRB para commands + FFI raw JSON para operações simples | D5 |
| 6 | Editor TCC | **Do zero, MVP gradual** (paragraph/heading/list → table/image/quote → equation/citation) | D6 |
| 7 | Capacidades legadas | **Adicionar ao desktop, sem tocar no mobile** | D7 |
| 8 | Rebuild React | **Parar tudo, NÃO usar como referência** — Flutter do zero | D8 |

> **Nota arquitetural:** com D1 decidido ("tudo puro → Rust"), o caminho crítico #3 da parte iv muda de "Inventário → Decisão → App" para **direto**: inventário já feito, decisão tomada, segue ao porte.

---

## parte vi — contexto e setup do workspace

### Arquivos de regras necessários (antes da primeira sessão)

| Arquivo | Propósito | Status |
|---|---|---|
| `cecistudy-rust/AGENTS.md` | Regras Rust (cargo, convenções, boundary) | **Novo** |
| `apps/desktop-flutter/AGENTS.md` | Regras Flutter (dart, widget conventions) | **Novo** |
| `cecistudy-rust/contracts/AGENTS.md` | Regras de contrato cross-língua | **Novo** |
| `.context/desktop-rust.md` | Contexto global arquitetura Rust | **Novo** |
| `.context/desktop-flutter.md` | Contexto global Flutter | **Novo** |
| `.context/contract-parity.md` | Regras de paridade cross-língua | **Novo** |
| `cecistudy-rust/docs/domain-port-guide.md` | Mapeamento TS → Rust por entidade | **Novo** |
| `AGENTS.md` (root) | Atualizar com seção desktop-rust | **Atualizar** |

### Skills novas

| Skill | Propósito |
|---|---|
| `rust-domain-port` | Guia passo-a-passo para portar entidade TS → Rust |
| `flutter-bridge-design` | Como desenhar surface FFI para nova tela |
| `contract-parity-test` | Como escrever golden files e testes cross-língua |
| `migration-interop` | Como lidar com backup export/import entre desktops |

---

## parte vii — primeiros 10 slices verticais (críticos)

| Slice | Fase | O que entrega | Custo estimado |
|---|---|---|---|
| 1 | 0 | DDL extraído + canonical JSON spec + fixtures | 2 dias |
| 2 | 0 | Golden files + testes de paridade em TS | 1 dia |
| 3 | 1 | Workspace Rust + common + domain (1 entidade) | 2 dias |
| 4 | 1 | Todas as entidades de domínio portadas | 5 dias |
| 5 | 1 | Data crate + migrações + 1 repositório | 3 dias |
| 6 | 1 | Sync crate + golden test Rust | 2 dias |
| 7 | 2 | Flutter skeleton + shell + theme | 3 dias |
| 8 | 2 | Bridge + Home funcional (dados do Rust → tela) | 2 dias |
| 9 | 3 | Faculdade master-detail completa | 3 dias |
| 10 | 3 | Estudos (timer + flashcards) | 3 dias |

**Caminho crítico total: ~26 dias** (contando apenas sequenciais; paralelismo reduz para ~18 dias calendário).

---

## parte viii — referências e documentos gerados

Os subagentes geraram documentos detalhados em:

| Documento | Localização | Conteúdo |
|---|---|---|
| Análise arquitetural | `docs/architecture/flutter-rust-analysis.md` | Gaps, riscos, decisões, primeiro slice vertical |
| Análise de spec | `desktop/spec/FLUTTER-RUST-SPEC-ANALYSIS.md` | Capability map, completude, 27 specs necessários |
| Task breakdown | `desktop/spec/01-task-breakdown-flutter-rust.md` | 68 tarefas com dependências e aceitação |
| Estratégia incremental | `desktop/spec/20-incremental-implementation-strategy.md` | 10 slices, rollback, contract-first |
| Análise UI/UX | (neste documento, seção designsystem) | Theme translation, screen inventory, navegação |
| Context engineering | (neste documento, seção contexto) | Rules files, packing, anti-patterns |

---

## parte ix — decisões fechadas (2026-09-10)

Todas as 8 dúvidas abertas foram resolvidas. **Não restam bloqueadores antes de código.**

### D1 — Inventário src/lib/* → Rust ✅

**Decisão:** portar TUDO que é lógica pura para Rust (~22 arquivos, ~2.800 LOC).

| Categoria | Arquivos | LOC | Destino |
|---|---|---|---|
| **Alto impacto (>100 LOC)** | `schedule.ts` (533), `contextActions.ts` (478), `streak.ts` (210), `stickers.ts` (139), `swipe.ts` (133), `homeMeta.ts` (121) | ~1.614 | Rust |
| **Médio impacto (20–100 LOC)** | `readingMatching.ts` (86), `otaLogic.ts` (83), `internshipCases.ts` (79), `gcalLogic.ts` (60), `acervoBridge.ts` (59), `useWizardDraft.ts` (55), `utils.ts` (44), `internshipPreview.ts` (44), `catalogLibrary.ts` (44) | ~554 | Rust |
| **Baixo impacto (<40 LOC)** | `migrations.ts` (32), `noteLogic.ts` (27), `quizLogic.ts` (26), `review.ts` (24), `internshipCycle.ts` (19), `profileMeta.ts` (18), `taskLogic.ts` (13) | ~159 | Rust |
| **UI/presentation** | `copy.ts` (204), `ditherChart.ts` (193), `motion.ts` (165), `useLongPress.ts` (123), `celebrate.ts` (84), `useCanvasSetup.ts` (79), `courseOptions.ts` (21) | ~870 | Flutter |
| **Bridge/infra** | `db/*`, `ota.ts`, `notifications.ts`, `gcal.ts`, `storage.ts`, `platform.ts`, etc. | ~2.500+ | Reescrito em Rust+Flutter (não portado) |
| **Stubs re-export** | `routing.ts`, `quizStack.ts`, `sync/*`, etc. | ~50 | Eliminados (lógica vai pros crates) |

**Exceção:** `useWizardDraft.ts` — lógica pura vai pro Rust; o hook vira wrapper fino no Flutter.

### D2 — Canonical JSON v1 ✅

**Decisão:** chaves ordenadas alfabeticamente + timestamps ISO 8601 UTC + floats com precisão fixa + arrays mantêm ordem original.

Especificação:
- **Chaves:** todas ordenadas alfabeticamente (recursivo em objetos aninhados)
- **Timestamps:** ISO 8601 UTC (`2026-09-10T15:30:00.000Z`)
- **Floats:** precisão fixa (serde: `serde_json::to_string` com `f64`; TS: `JSON.stringify` com `Number.toFixed` se necessário)
- **Arrays:** mantêm ordem original (não ordenar — ordem é intencional em blocos,.SubItems, etc.)
- **Strings:** UTF-8 normalizado (NFC)
- **Null/optionais:** `#[serde(skip_serializing_if = "Option::is_none")]` no Rust; `undefined` → ausente no JSON

**Teste de paridade:** função `canonicalize(obj) → string` em TS e Rust; mesmos fixtures produzem strings idênticas.

### D3 — OAuth desktop ✅

**Decisão:** installed-app flow + keyring do OS.

| Componente | Implementação |
|---|---|
| **Auth flow** | `oauth2` crate (Rust) — client_id público, redirect `http://localhost:{port}` ou custom scheme `cecistudy://` |
| **Armazenamento de token** | `keyring` crate (Rust) — Secret Service/libsecret (Linux), Keychain (macOS), Credential Manager (Windows) |
| **Refresh** | Automático antes de expirar; silencioso para o Flutter |
| **Revogação** | Disconnect Google → limpa keyring + revoga token via Google API |

**Dependências Rust:** `oauth2`, `keyring`, `reqwest` (HTTP), `serde` (token response).

### D4 — Temas desktop MVP ✅

**Decisão:** 2 temas no MVP — Rosa Claro (padrão) + Clean (branco neutro).

| Tema | Canvas | Surface | Uso |
|---|---|---|---|
| **Rosa Claro** | `#FFF9F0` (papel quente) | `#FFFDF8` | Padrão — identidade cecistudy |
| **Clean** | `#FFFFFF` (branco puro) | `#FFFFFF` | Neutro — foco em produtividade |

Desbloquear Sépia, Noturno e outros 6 temas **depois** que o desktop estiver funcional. A infraestrutura de `ThemeController` + `ThemeExtension` já suporta N temas — só falta mapear as cores.

### D5 — Bridge Flutter↔Rust ✅

**Decisão:** híbrido — `flutter_rust_bridge` para surface principal + ponte manual para operações simples.

| Camada | Ferramenta | Quando usar |
|---|---|---|
| **FRB (flutter_rust_bridge)** | Codegen de bindings Dart | Comandos de domínio complexos: CRUD de entidades, queries com filtros, sync, backup, capacidades |
| **FFI raw + JSON** | `dart:ffi` + `dart:convert` | Operações simples: status, config, init, health check, versão |

**Motivo:** FRB é produtivo para a surface principal (~30-50 comandos); ponte manual evita overhead de codegen para operações triviais.

### D6 — Editor paginado TCC ✅

**Decisão:** do zero, MVP gradual.

| Fase | Funcionalidade | Complexidade |
|---|---|---|
| **MVP** | Paragraph + heading + list + bold/italic | ●● |
| **MVP+** | Table + image + quote + code block | ●●● |
| **Full** | Equation (LaTeX) + reference picker + citation inline | ●●●● |

**Coração técnico:** `TextPainter` para medir blocos → cálculo de overflow → empurrar para próxima página → `PageCanvas` virtualizado (só páginas visíveis).

**Não usar flutter_quill** — API incompatível com `AcademicNode` e modelo de blocos do spec.

### D7 — Capacidades legadas ✅

**Decisão:** adicionar rows ao desktop **sem tocar no mobile**.

Entidades que receberão rows na matriz (desktop only):

| Entidade | canView | canCreate | canEdit | canDelete | projection |
|---|---|---|---|---|---|
| `course` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `task` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `exam` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `classNote` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `flashcard` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `reading` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `studySession` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `material` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `internshipLog` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `tcc` | ✅ | ✅ | ✅ | ✅ | `rich` |
| `sticker` | ✅ | ❌ | ❌ | ❌ | `standard` |
| `quizSession` | ✅ | ✅ | ✅ | ✅ | `standard` |

Mobile mantém como está (sem consulta de capacidades). Nenhuma mudança no TS.

### D8 — Rebuild React desktop ✅

**Decisão:** parar completamente.shell/navegação/faculdade do React **não serão usados como referência visual** — Flutter será feito do zero com base no design system (`--ds-*` tokens) e na spec `cecistudy-desktop-shell.json`.

Trabalho já feito no React (shell, navegação, faculdade) fica no repositório como histórico mas **não é portado**.

---

## parte x — plano final (sem bloqueadores)

Com todas as 8 decisões fechadas, o plano está pronto para implementação. Resumo das implicações:

| Decisão | Impacto no plano |
|---|---|
| **D1: Tudo puro → Rust** | Fase 1 ganha tarefa 1.11 (inventário src/lib) com escopo expandido. `cecistudy-app` agora orquestra ~2.800 LOC adicionais de lógica pura. |
| **D2: Canonical JSON** | Fase 0 ganha spec formal + função `canonicalize()` em TS e Rust + test vectors. |
| **D3: OAuth installed-app** | Fase 1 tarefa 1.23 (`cecistudy-integrations`) ganha deps `oauth2` + `keyring`. |
| **D4: 2 temas MVP** | Fase 2 tarefa 2.3 simplificada — mapear só Rosa Claro + Clean. |
| **D5: Híbrido FRB+manual** | Fase 2 tarefa 2.2 usa FRB para comandos principais + FFI raw para init/status. |
| **D6: Editor do zero** | Track C (TCC) ganha fases de MVP incrementais ao invés de tentar tudo de uma vez. |
| **D7: Capacidades desktop-only** | Fase 0 tarefa 0.5 adiciona rows sem tocar no TS mobile. |
| **D8: Do zero, sem referência React** | Elimina dependência do rebuild React. Flutter segue design system + shell.json. |

**Próximo passo:** Fase 0 — extrair DDL, escrever canonical JSON v1 spec, criar golden files, estender matriz de capacidades.
