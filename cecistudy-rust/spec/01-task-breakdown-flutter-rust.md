# Task Breakdown — cecistudy Desktop (Flutter + Rust)

> Breakdown detalhado do plano de migração Tauri→Flutter+Rust.
> Gerado a partir do spec `plano-desktop-flutter-rust.md` + varredura do codebase.
> Escopo: packages/domain + data + sync + contracts → Rust; UI → Flutter.

---

## Status de implementação (atualizado 2026-09-12)

**Fase 0 (contrato): 5/5 ✅ · Fase 1 (núcleo Rust): 21/23 ✅ · Fases 2+ (Flutter): 🔲**

> Ajustado por auditoria do workspace em 2026-09-12: a marcação anterior **"20/23" superestimava o
> real** — os módulos de domínio `calendar/knowledge/marketing/projects/internship` **não foram
> portados** (só `workspace.rs` + `capabilities.rs` existiam em `cecistudy-domain`). Contagem corrigida
> para **17/23** (16 tarefas plenas + `F1.17` content parcial conforme desvio abaixo) — e depois
> **reconduzida a 21/23** com o porting **R2** (F1.3–F1.6, gate verde, 162 testes; ver "Implementado").
> `cecistudy-ffi` (1.21) e a validação de paridade full (1.22) seguem pendentes.

> **Decisões de direção (2026-09-12, definidas pela usuária):**
> - **Desktop novo NÃO usa nada do React/JS como base** — domínio é implementado **spec-first** a partir
>   de `contracts/` (schema.sql canônico + golden fixtures + backup-v2-spec). Os pacotes TS servem apenas
>   como **oráculo de paridade** via golden files (formato idêntico), jamais como base de design/estrutura.
> - **Data crate deve ser alinhada a entidades tipadas** (o desvio `data_json` abaixo deixa de ser aceito —
>   vira trabalho recorrente **R1**). Forma dos structs vem do `schema.sql`, não do TS.
> - Desktop React visual **cancelado como produto**; `src/desktop/` fica como legado até o Flutter+Rust substituir.
> - SEP-001 C.1/C.6 **encerrados como superseded** (ver `tasks/todo.md` Fase C).

Implementado (commits `5ee35fb`→`bf9790a`; gate hoje verde: `cargo clippy -D warnings` ✓ ·
`cargo fmt --check` ✓ · **162 testes** ✓ — não 116):
- **Fase 0 completa** — `contracts/{schema.sql, backup-v2-spec.md, golden/*, verify-schema.mjs}`.
  Golden: 24 coleções (empty + sample) + 2 `full_backup` + 13 fixtures de migração v1→v13.
- **Fase 1 (21/23):** workspace; `cecistudy-common` (id/time/error/json/platform);
  `cecistudy-domain` (`workspace` + `capabilities` + **R2**: `calendar`, `knowledge`, `marketing`,
  `projects`, `internship`); `cecistudy-data` (schema 13, migrações,
  backup v2, payload, repositórios tipados — R1); `cecistudy-sync` (stamp, merge, provider/github);
  `cecistudy-content` (CatalogDb + queries); `cecistudy-app` (use cases + testes).
- **Desvios vs. plano (box — dois MUDAM de status com as decisões acima):**
  - `common/ids` vivem em crate própria `cecistudy-common` (não em `domain/src/common.rs`) — **aceito**.
  - `cecistudy-data` usa **coleções genéricas `data_json`** (não os 14 structs tipados de `entities/`);
    migrações num **único `migrations.rs`** (não `migrations/m001..m013`). → **NÃO aceito para o formato**:
    entra o **rework R1** (entidades tipadas a partir do `schema.sql`; `migrations.rs` único pode permanecer).
  - `cecistudy-content` expõe `CatalogDb::open_read_only` (não `CatalogDatabase::open`) — ver **R3**.

Pendente na Fase 1 (**F1.21, F1.22** + extras **R3/R4**):
- **R1** (rework, entidades tipadas do `schema.sql`) **concluído** (2026-09-12): **R1a**
  `cecistudy-domain::entity` (22 coleções + round-trip golden) ✅; **R1b** fronteira tipada de
  repositórios (`cecistudy-data::collections::Collection`, load/save tipados) ✅; **R1c** import/apply
  tipado de backup (`typed_payload`/`import_backup_typed`; sync permanece level-formato)
  ✅. Paridade plena + remoção do `data_json` exposto → **R4**.
- **R2** (F1.3–F1.6) **concluído** (gate verde, **162 testes**; spec-first a partir do breakdown +
  `desktop/spec/05-modulos-greenfield.md` + `schema.sql`, sem base TS — `packages/domain/src` só tem
  `index.ts`): módulos de domínio `calendar` (1.3), `knowledge` (1.4), `marketing` (1.5), `projects`
  (1.6) + `internship` (extra, não numerado no breakdown, shape vindo do `schema.sql`).
  Incluiu fix de paridade R1 latente: `Profile.categoryXp` (golden `empty/profile.json`).
- `cecistudy-ffi` (F1.21) — porta de entrada da Fase 2 (bridge `flutter_rust_bridge`).
- Validação de paridade full (F1.22 — `parity-test.sh`/`parity-report.md` ainda não existem).
- **R3** — superfície do `cecistudy-content` (`CatalogDb::open_read_only`).
- `cecistudy-integrations` (Google Calendar) — ainda não existe (fora do escopo 23).

> **Numeramento:** este breakdown (origem) numera 1.13=stamp, 1.16=engine, 1.17–1.18=content,
> 1.19–1.20=app+use cases. O plano consolidado (`PLANO-CONSOLIDADO-FLUTTER-RUST.md`) numera
> diferente (stamp=1.17 … app=1.21). Os commits usam o consolidado em sync/content
> (`F1.17`–`F1.20`) mas o app como `F1.19–F1.20` (origem). Veja a reconciliação no fim deste doc.

---

## 0. Resumo executivo

**O que é:**
- Criar um workspace Rust (`cecistudy-rust/`) com 7 crates
- Criar um app Flutter (`apps/desktop-flutter/`) que se comunica com Rust via `flutter_rust_bridge`
- Mantém `packages/*.ts` intactos (mobile não muda)
- Remove `desktop/` (Tauri 2) e `apps/desktop` (React) ao final

**Entidades totais a portar (TS→Rust):** ~35 entidades de domínio, ~25 schemas de backup, 13 migrações, 1 engine de sync, 1 provider.

**Riscos críticos (ordenados):**
1. Paridade de contrato (Rust↔TS diverge silenciosamente) — golden files obrigatórios
2. TCC (editor paginado + DOCX + ABNT) — projeto de editor independente
3. Dualidade de domínio (TS+Rust manutenção indefinida) — custo consciente

---

## 1. Grafo de dependências completo

### 1.1 Rust crates (dependências internas)

```
cecistudy-ffi (única porta de entrada Flutter)
    └── cecistudy-app (casos de uso)
            ├── cecistudy-domain (entidades + invariantes)
            ├── cecistudy-data (SQLite + migrações + backup)
            │       └── cecistudy-domain
            ├── cecistudy-content (catálogo .db read-only)
            └── cecistudy-integrations (Google Calendar)
                    └── cecistudy-domain
cecistudy-sync (independente — depende de cecistudy-domain)
```

### 1.2 Flutter ↔ Rust bridge

```
Flutter screens/widgets
    └── flutter_rust_bridge (generated bindings)
            └── cecistudy-ffi (Dart→Rust API surface)
                    └── cecistudy-app
```

### 1.3 Módulos TS → Rust (o que cada crate consome)

| Rust crate | Consome de TS | Arquivos TS mapeados |
|---|---|---|
| `cecistudy-domain` | `packages/domain` | `common.ts`, `ids.ts`, `workspace.ts`, `calendar.ts`, `knowledge.ts`, `marketing.ts`, `projects.ts`, `capabilities.ts` |
| `cecistudy-data` | `packages/data` | `schema.ts` (DDL+13 migrações), `backupSchema.ts` (Zod→serde), `persistentData.ts`, `exportImport.ts`, `dataClient.ts` |
| `cecistudy-sync` | `packages/sync` | `stamp.ts`, `merge.ts`, `engine.ts`, `provider.ts`, `providers/github.ts` |
| `cecistudy-content` | `content/` + `src/lib/db/catalogDb.ts` | Abrir `.db` SQLite do catálogo (read-only) |
| `cecistudy-integrations` | (novo — não existe em TS) | Google Calendar API (OAuth, sync, conflitos) |
| `cecistudy-app` | `AppContext.tsx` (casos de uso) | Orquestra domain+data+sync+content+integrations |
| `cecistudy-ffi` | (novo — ponte Flutter↔Rust) | Serializa structs Rust → Dart via frb |

### 1.4 Dependências entre fases

```
Fase 0 (contrato)
  │
  ├─── Fase 1a: cecistudy-domain ──────────────────────┐
  │         │                                          │
  │         ├─── Fase 1b: cecistudy-data ──────────┐   │
  │         │         │                            │   │
  │         │         ├─── Fase 1c: cecistudy-content │  │
  │         │         │                            │   │
  │         ├─── Fase 1d: cecistudy-sync ──────────┤   │
  │         │                                      │   │
  │         ├─── Fase 1e: cecistudy-integrations ──┘   │
  │         │                                          │
  │         └─── Fase 1f: cecistudy-app ───────────────┘
  │                   │
  │                   └─── Fase 1g: cecistudy-ffi
  │                             │
  └─── Fase 2: Flutter skeleton + bridge
              │
              └─── Fase 3: módulo por módulo
                          │
                          └─── Fase 4: interop mobile
                                    │
                                    └─── Fase 6: empacotamento
                                              │
                                              └─── Fase 7: migração
```

---

## 2. Fase 0 — Congelar o contrato (sem código de produto)

> **Objetivo:** Extrair DDL, formalizar backup v2, criar golden files.
> **Critério de saída:** Testes de paridade cross-língua passam (TS → JSON → Rust → JSON = idêntico).
> **Risco:** 🔴 Alto — fundação de todo o projeto; erro aqui propaga para todas as fases.

### Tarefas

#### 0.1 — Extrair DDL para SQL versionado
- **Escopo:** XS (1-2 arquivos)
- **Dependências:** Nenhuma
- **Arquivos tocados:** `content/schemas/user.ddl.sql` (novo)
- **Aceitação:**
  - [x] DDL do `migrations/user.ts` traduzido para PostgreSQL/SQLite `.sql` numerado
  - [x] Versão do DDL indexada (ex.: `user_schema_001.sql`)
  - [x] O `schema.ts` do TS e o `.sql` descrevem a mesma estrutura
- **Verificação:** Script que compara as chaves de `emptyDatabase()` vs tabelas do DDL

#### 0.2 — Escrever spec formal do backup v2
- **Escopo:** S (1-2 arquivos)
- **Dependências:** Nenhuma
- **Arquivos tocados:** `desktop/spec/backup-v2-spec.md` (novo), `desktop/spec/backup-v2-schema.json` (novo, JSON Schema)
- **Aceitação:**
  - [x] JSON Schema que espelha campo a campo o Zod de `backupSchema.ts`
  - [x] Cada coleção documentada com: nome, tipo, campos obrigatórios, campos pass-through
  - [x] Documento de "campos legados" (o que `.passthrough()` preserva)
- **Verificação:** Validador JSON Schema rejeita payloads inválidos que o Zod rejeita

#### 0.3 — Criar golden files de paridade
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 0.1, 0.2
- **Arquivos tocados:** `desktop/spec/golden/` (diretório novo)
- **Aceitação:**
  - [x] Fixture JSON para cada coleção (courses, classes, tasks, exams, authors, concepts, readings, flashcards, materials, internshipLogs, supervision, tcc, stickers, sessions, streakData, reminder, looseNotes, savedBookIds, bookmarkedCourseIds, readingProgress, questions, techniques, quizSessions, onboarding, syncIndex)
  - [x] Fixture "mínimo" (banco vazio com defaults)
  - [x] Fixture "cheio" (cada coleção com 2-3 itens variados)
  - [x] Fixture "edge cases" (ids com prefixos variados, strings com acentos, datas ISO, etc.)
- **Verificação:** Script Node que lê os fixtures e valida contra o Zod

#### 0.4 — Criar teste de round-trip TS→JSON→Rust→JSON
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 0.3
- **Arquivos tocados:** `desktop/spec/parity-test.sh` (novo, placeholder — Rust não existe ainda)
- **Aceitação:**
  - [x] Script descreve o protocolo: (1) TS serializa fixture → JSON, (2) Rust desserializa → re-serializa → JSON, (3) compara byte-a-byte
  - [x] Script é executável (mas falha "Rust not ready" até Fase 1)
- **Verificação:** Com a Fase 1 concluída, o script passa

#### 0.5 — Definir lista canônica de coleções sincronizáveis
- **Escopo:** XS (1 arquivo)
- **Dependências:** Nenhuma
- **Arquivos tocados:** `desktop/spec/syncable-collections.md` (novo)
- **Aceitação:**
  - [x] Lista das 16 record collections + 7 single collections + 2 set collections (de `stamp.ts`)
  - [x] Documentado: por que `approaches` e `questions` são EXCLUÍDAS do sync
  - [x] Referência cruzada com `RECORD_COLLECTION_KEYS`, `SINGLE_COLLECTION_KEYS`, `SET_COLLECTION_KEYS` do `stamp.ts`

---

## 3. Fase 1 — Núcleo Rust (sem UI)

> **Objetivo:** 7 crates Rust funcionando, com testes unitários, batendo golden files.
> **Critério de saída:** `cargo test` verde em todos os crates; golden files round-trip idêntico ao TS.
> **Risco:** 🔴 Alto — base de tudo; testes de paridade são o gate.

### 3.1 Workspace e infraestrutura

#### 1.0 — Criar workspace Cargo e crate `cecistudy-domain`
- **Escopo:** S (3-5 arquivos)
- **Dependências:** Fase 0 completa
- **Arquivos tocados:** `cecistudy-rust/Cargo.toml`, `cecistudy-rust/crates/cecistudy-domain/Cargo.toml`, `cecistudy-rust/crates/cecistudy-domain/src/lib.rs`
- **Aceitação:**
  - [x] Workspace com `members = ["crates/*"]`
  - [x] `cecistudy-domain` compila com `cargo check`
  - [x] `cargo test` roda (mesmo vazio)
- **Verificação:** `cargo build --workspace` sem erros

#### 1.1 — Portar `common.ts` e `ids.ts`
- **Escopo:** XS (2 arquivos)
- **Dependências:** 1.0
- **Arquivos tocados:** `crates/cecistudy-domain/src/common.rs`, `crates/cecistudy-domain/src/ids.rs`
- **Aceitação:**
  - [x] `EntityId = String` (alias)
  - [x] `Platform` enum (`Desktop`, `Mobile`)
  - [x] `EntityPrefix` enum com todas as variantes
  - [x] `make_id(prefix) -> EntityId` gera IDs no mesmo formato (`prefix-base36-counter36-random`)
  - [x] Teste: `make_id` gera prefixos válidos
  - [x] Teste: `prefix_of` extrai o prefixo corretamente
- **Verificação:** IDs gerados pelo Rust são intercambiáveis com IDs do TS

### 3.2 Crate `cecistudy-domain` — módulos de entidade

#### 1.2 — Portar `workspace.ts`
- **Escopo:** XS (1 arquivo)
- **Dependências:** 1.1
- **Arquivos tocados:** `crates/cecistudy-domain/src/workspace.rs`
- **Aceitação:**
  - [x] `WorkspaceKind`, `DefaultModule` enums
  - [x] `WorkspaceSettings`, `Workspace` structs (Serialize/Deserialize)
  - [x] `create_workspace(input) -> Workspace`
  - [x] Teste: criação com defaults corretos
- **Verificação:** JSON serializado é idêntico ao TS

#### 1.3 — Portar `calendar.ts` ✅ (R2, 2026-09-12)
- **Escopo:** S (1 arquivo)
- **Dependências:** 1.1
- **Arquivos tocados:** `crates/cecistudy-domain/src/calendar.rs`
- **Aceitação:**
  - [x] 7 structs: `CalendarEvent`, `RecurrenceRule`, `Occurrence`, `Subtask`, `Responsibility`, `PlanningBlock`, `ExecutionRecord`
  - [x] 3 enums: `CommitmentLevel`, `CalendarItemStatus`, `ModuleOrigin`
  - [x] `SourceRef` struct
  - [x] `create_responsibility(input) -> Responsibility`
  - [x] Todos os campos opcionais com `Option<T>`
  - [x] Teste: serialização/deserialização preserva `Option` fields
- **Verificação:** Fixture golden file do calendar round-trip

#### 1.4 — Portar `knowledge.ts` ✅ (R2, 2026-09-12)
- **Escopo:** S (1 arquivo)
- **Dependências:** 1.1
- **Arquivos tocados:** `crates/cecistudy-domain/src/knowledge.rs`
- **Aceitação:**
  - [x] 6 structs: `Block`, `Document`, `Relation`, `Suggestion`, `AssociationPolicy`, `LearningState`
  - [x] 6 enums (a spec diz "7" mas nomeia 6 — portados os 6 nomeados): `BlockType`, `RelationKind`, `RelationProvenance`, `SuggestionType`, `SuggestionStatus`, `LearningDimension`
  - [x] `create_document`, `create_relation` factories
  - [x] `meta: Option<serde_json::Value>` para `Block.meta`
  - [x] Teste: round-trip com `Record<string, unknown>` (serde_json::Value)
- **Verificação:** Fixture golden file do knowledge round-trip

#### 1.5 — Portar `marketing.ts` ✅ (R2, 2026-09-12)
- **Escopo:** S (1 arquivo)
- **Dependências:** 1.1
- **Arquivos tocados:** `crates/cecistudy-domain/src/marketing.rs`
- **Aceitação:**
  - [x] 7 structs: `PositioningProfile`, `ContentIdea`, `ContentBase`, `ChannelVariant`, `Publication`, `MetricSnapshot`, `StrategicInsight`
  - [x] 2 enums: `Channel`, `EditorialStatus`
  - [x] `create_content_base` factory
  - [x] `body: Option<serde_json::Value>` para `ChannelVariant.body`
  - [x] Teste: serialização preserva variant JSON
- **Verificação:** Fixture golden file do marketing round-trip

#### 1.6 — Portar `projects.ts` ✅ (R2, 2026-09-12)
- **Escopo:** S (1 arquivo)
- **Dependências:** 1.1
- **Arquivos tocados:** `crates/cecistudy-domain/src/projects.rs`
- **Aceitação:**
  - [x] 6 structs: `Project`, `AcademicNode`, `Output`, `Reference`, `Citation`
  - [x] 7 enums (a spec diz "5" mas nomeia 7 — portados os 7 nomeados): `ProjectType`, `ProjectStatus`, `AcademicNodeKind`, `Requiredness`, `OutputFormat`, `CitationProfile`, `ReferenceType`
  - [x] `MAX_ACTIVE_PROJECTS = 5` const
  - [x] `active_project_count`, `can_add_project`, `create_project` functions
  - [x] `create_project` gera árvore TCC padrão (4 capítulos)
  - [x] Teste: `can_add_project` com 0, 4, 5 projetos ativos
- **Verificação:** Fixture golden file do projects round-trip

#### 1.7 — Portar `capabilities.ts`
- **Escopo:** XS (1 arquivo)
- **Dependências:** 1.1
- **Arquivos tocados:** `crates/cecistudy-domain/src/capabilities.rs`
- **Aceitação:**
  - [x] `CapabilityEntity`, `Projection` enums
  - [x] `PlatformCapability` struct
  - [x] `DEFAULT_CAPABILITIES` array (18 entries: 9 entities × 2 platforms)
  - [x] `capability_for(entity, platform, matrix) -> Option<PlatformCapability>`
  - [x] Teste: `capability_for('document', Platform::Desktop)` retorna `canCreate: true, projection: 'rich'`
- **Verificação:** Matriz idêntica ao TS

### 3.3 Crate `cecistudy-data`

#### 1.8 — Setup crate `cecistudy-data` com dependências
- **Escopo:** S (2-3 arquivos)
- **Dependências:** 1.0, 1.2-1.7
- **Arquivos tocados:** `crates/cecistudy-data/Cargo.toml`, `crates/cecistudy-data/src/lib.rs`
- **Aceitação:**
  - [x] Dependências: `rusqlite` (ou `sqlx`), `serde`, `serde_json`, `thiserror`
  - [x] Re-exporta `cecistudy-domain` para convenience
  - [x] `cargo check` verde
- **Verificação:** Compila sem erros

#### 1.9 — Portar schema de entidades com serde
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 1.8
- **Arquivos tocados:** `crates/cecistudy-data/src/entities/` (diretório novo: `profile.rs`, `course.rs`, `class_note.rs`, `task.rs`, `exam.rs`, `reading.rs`, `flashcard.rs`, `material.rs`, `internship.rs`, `sticker.rs`, `session.rs`, `technique.rs`, `quiz.rs`, `loose_note.rs`)
- **Aceitação:**
  - [x] Cada entidade de `types.ts` tem um struct Rust equivalente
  - [x] `#[derive(Serialize, Deserialize, Clone, Debug)]` em todas
  - [x] `#[serde(default)]` em campos opcionais (compatibilidade com backups antigos)
  - [x] Enums com `#[serde(rename_all = "snake_case")]` para serialização idêntica
  - [x] Teste: cada entidade serializa para JSON idêntico ao fixture TS correspondente
- **Verificação:** Script de paridade passa para todas as entidades

#### 1.10 — Portar DDL e migrações
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 1.9, 0.1
- **Arquivos tocados:** `crates/cecistudy-data/src/migrations/` (diretório novo: `mod.rs`, `m001_initial.rs`, `m002_techniques.rs`, ... `m013_internship_rename.rs`)
- **Aceitação:**
  - [x] 13 migrações numeradas, idênticas ao `schema.ts`
  - [x] `SCHEMA_VERSION = 13` const
  - [x] `migrate_database(from_version, data) -> Option<Record>` (mesma semântica)
  - [x] Migração 9 (schedule string → slots) parseia o mesmo formato
  - [x] Migração 12 (workspaceId) idêntica
  - [x] Teste: migração de v1→v13 em dados de teste
  - [x] Teste: versão futura retorna None
- **Verificação:** Round-trip migração TS→Rust produce o mesmo output

#### 1.11 — Portar backup schema com serde
- **Escopo:** M (2-3 arquivos)
- **Dependências:** 1.9, 0.2
- **Arquivos tocados:** `crates/cecistudy-data/src/backup.rs`
- **Aceitação:**
  - [x] `BackupV2` struct (format, formatVersion, userSchemaVersion, schemaVersion, catalogRelease, exportedAt, payload)
  - [x] `backup_data_schema()` ou equivalente (validação deserialization)
  - [x] Coleções opcionais com `#[serde(default)]`
  - [x] `.passthrough()` via `serde_json::Value` para campos legados
  - [x] `preview_backup(json) -> Option<BackupPreview>`
  - [x] `import_app_database(json) -> Option<PersistedDatabase>` (valida + migra)
  - [x] `build_backup_payload(db) -> BackupV2`
  - [x] Teste: fixtures golden files passam pela validação Rust
  - [x] Teste: payload inválido é rejeitado
- **Verificação:** Mesmos fixtures que o TS rejeita são rejeitados pelo Rust

#### 1.12 — Implementar SQLite repository
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 1.9, 1.10
- **Arquivos tocados:** `crates/cecistudy-data/src/db.rs` (novo), `crates/cecistudy-data/src/repositories/` (diretório novo)
- **Aceitação:**
  - [x] `UserDatabase` struct com `rusqlite::Connection`
  - [x] `open(path) -> Result<UserDatabase>` (cria tabelas se não existirem)
  - [x] CRUD por coleção: `get_all<T>`, `get_by_id<T>`, `upsert<T>`, `remove<T>`, `replace_all<T>`
  - [x] `apply_migrations(&mut self) -> Result<()>` no boot
  - [x] `read_database() -> PersistedDatabase` (snapshot completo)
  - [x] `write_database(db: &PersistedDatabase) -> Result<()>` (batch write)
  - [x] Teste: round-trip write→read preserva todos os campos
- **Verificação:** `cargo test` verde; fixture golden file persistido e recuperado idêntico

### 3.4 Crate `cecistudy-sync`

#### 1.13 — Portar `stamp.ts`
- **Escopo:** S (1 arquivo)
- **Dependências:** 1.9
- **Arquivos tocados:** `crates/cecistudy-sync/src/stamp.rs`
- **Aceitação:**
  - [x] `SyncIndex` struct (stamps, records, tombstones)
  - [x] `RECORD_COLLECTION_KEYS`, `SINGLE_COLLECTION_KEYS`, `SET_COLLECTION_KEYS` arrays
  - [x] `empty_sync_index() -> SyncIndex`
  - [x] `apply_stamp_change(prev, key, old_value, new_value, now) -> StampChangeResult`
  - [x] `record_ts`, `tombstone_ts`, `tie_break`, `merge_indexes`, `max_stamp`
  - [x] `tie_break` usa serialização JSON estável (mesmo resultado nos dois lados)
  - [x] Teste: todos os fixtures de `stamp.test.ts` passam
- **Verificação:** 17 testes portados do TS passam

#### 1.14 — Portar `merge.ts`
- **Escopo:** M (1 arquivo)
- **Dependências:** 1.13, 1.9
- **Arquivos tocados:** `crates/cecistudy-sync/src/merge.rs`
- **Aceitação:**
  - [x] `merge_synced_databases(local, remote) -> MergeResult`
  - [x] LWW por registro com tombstones
  - [x] LWW por coleção para singles
  - [x] União para sets
  - [x] Streak merge por união
  - [x] `diff_stats` para local/remote
  - [x] Ordenação estável por id
  - [x] Teste: fixture de merge do TS passa no Rust
  - [x] Teste: empate de timestamp → tie_break idêntico
- **Verificação:** Mesmo input → mesmo output nos dois lados

#### 1.15 — Portar `provider.ts` e `providers/github.ts`
- **Escopo:** S (2 arquivos)
- **Dependências:** 1.9
- **Arquivos tocados:** `crates/cecistudy-sync/src/provider.rs`, `crates/cecistudy-sync/src/providers/github.rs`
- **Aceitação:**
  - [x] `SyncManifest`, `SyncPackage`, `RemotePackage` structs
  - [x] `SyncProvider` trait (get_manifest, download_package, upload_package)
  - [x] `SyncProviderError` enum
  - [x] `hash_content(input) -> String` (FNV-1a 32-bit)
  - [x] `GitHubSyncProvider` implementa `SyncProvider` via `reqwest`
  - [x] CAS via `sha` no upload
  - [x] Teste: `hash_content` idêntico ao TS
- **Verificação:** Hash gerado é o mesmo em TS e Rust

#### 1.16 — Portar `engine.ts` → `use_cases/sync.rs`
> **Nota:** implementado como `crates/cecistudy-app/src/use_cases/sync.rs` (porta no
> `cecistudy-app`, não crate separado `cecistudy-sync/src/engine.rs`).

- **Escopo:** M (1 arquivo)
- **Dependências:** 1.13, 1.14, 1.15
- **Arquivos tocados:** `crates/cecistudy-app/src/use_cases/sync.rs`
- **Aceitação:**
  - [x] `SyncEngine` struct (provider, deps)
  - [x] `SyncCheckpoint`, `SyncEngineDeps`, `SyncPreview` structs
  - [x] `inspect()`, `needs_upload()`, `pull_and_merge()`, `push()`
  - [x] Teste: lógica de revisão monotônica
  - [x] Teste: `needs_upload` com stamps variados
- **Verificação:** Lógica de sync idêntica ao TS

### 3.5 Crate `cecistudy-content`

#### 1.17 — Setup crate `cecistudy-content`
- **Escopo:** S (2-3 arquivos)
- **Dependências:** 1.0
- **Arquivos tocados:** `crates/cecistudy-content/Cargo.toml`, `crates/cecistudy-content/src/lib.rs`
- **Aceitação:**
  - [x] Dependência: `rusqlite` (read-only)
  - [x] `CatalogDatabase` struct com `open(path)` — **desvio:** implementado como `CatalogDb::open_read_only`
        (equivalente funcional; nome difere do plano — aceitar ou renomear na revisão)
  - [x] Sem escrita — só queries
- **Verificação:** Abre o `.db` do catálogo sem erros

#### 1.18 — Implementar queries do catálogo
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 1.17
- **Arquivos tocados:** `crates/cecistudy-content/src/queries/` (diretório novo)
- **Aceitação:**
  - [x] Queries para: abordagens, questões, obras, conceitos, autores, técnicas
  - [x] Structs de retorno tipados
  - [x] Teste: abre o `.db` embutido e conta registros (espera 3002 questões, 225 conceitos, etc.)
- **Verificação:** Contagens batem com `catalog.manifest.json`

### 3.6 Crate `cecistudy-app`

#### 1.19 — Setup crate `cecistudy-app` (casos de uso)
- **Escopo:** S (2-3 arquivos)
- **Dependências:** 1.8-1.18
- **Arquivos tocados:** `crates/cecistudy-app/Cargo.toml`, `crates/cecistudy-app/src/lib.rs`
- **Aceitação:**
  - [x] Depende de todos os crates anteriores
  - [x] `App` struct que orquestra domain+data+sync+content
  - [x] `cargo check` verde
- **Verificação:** Compila sem erros

#### 1.20 — Implementar use cases básicos
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 1.19
- **Arquivos tocados:** `crates/cecistudy-app/src/use_cases/` (diretório novo: `mod.rs`, `profile.rs`, `courses.rs`, `tasks.rs`, `calendar.rs`, `backup.rs`, `sync.rs`)
- **Aceitação:**
  - [x] `get_profile`, `update_profile`
  - [x] `list_courses`, `create_course`, `update_course`, `delete_course`
  - [x] `list_tasks`, `create_task`, `toggle_task`, `delete_task`
  - [x] `get_calendar_events`, `create_event`, `update_event`
  - [x] `export_backup`, `import_backup`
  - [x] `sync_push`, `sync_pull`
  - [x] Cada use case delega para data+domain, não contém lógica própria
  - [x] Teste: cada use case com dados mockados (23 testes inline com `UserDb` em memória)
- **Verificação:** `cargo test` verde

### 3.7 Crate `cecistudy-ffi`

#### 1.21 — Setup `cecistudy-ffi` com flutter_rust_bridge
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 1.20
- **Arquivos tocados:** `crates/cecistudy-ffi/Cargo.toml`, `crates/cecistudy-ffi/src/lib.rs`
- **Aceitação:**
  - [ ] Depende de `cecistudy-app`
  - [ ] `flutter_rust_bridge` configurado
  - [ ] Structs exportadas com `#[frb]` (ou equivalente)
  - [ ] `cargo check` verde
- **Verificação:** Bridge gera bindings Dart sem erros

### 3.8 Checkpoint Fase 1

#### 1.22 — Validar paridade completa TS↔Rust
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 1.0-1.21
- **Arquivos tocados:** `desktop/spec/parity-test.sh` (atualizar)
- **Aceitação:**
  - [ ] Script de paridade passa para todos os golden files
  - [ ] `cargo test --workspace` verde (todos os crates)
  - [ ] `cargo clippy --workspace` sem warnings
  - [ ] Documento `desktop/spec/parity-report.md` com resultado
- **Verificação:** 100% de paridade confirmada

---

## 4. Fase 2 — Bridge + Esqueleto Flutter

> **Objetivo:** App Flutter mínimo que abre, lê catálogo, lê/escreve banco, renderiza Home.
> **Critério de saída:** `flutter run -d linux` mostra Home com dados reais do banco Rust.
> **Risco:** 🟡 Médio — pipeline ponta a ponta; se Fase 1 está sólida, é mais mecânico.

### Tarefas

#### 2.1 — Criar projeto Flutter desktop
- **Escopo:** S (3-5 arquivos)
- **Dependências:** Fase 1 completa, Flutter SDK instalado
- **Arquivos tocados:** `apps/desktop-flutter/` (diretório novo com `pubspec.yaml`, `lib/main.dart`, etc.)
- **Aceitação:**
  - [ ] `flutter create` com target linux/macos/windows
  - [ ] `flutter run -d linux` abre janela vazia
  - [ ] `flutter_rust_bridge` adicionado ao `pubspec.yaml`
- **Verificação:** App compila e roda

#### 2.2 — Configurar flutter_rust_bridge e gerar bindings
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 2.1, 1.21
- **Arquivos tocados:** `apps/desktop-flutter/lib/bridge/` (novo), `crates/cecistudy-ffi/src/lib.rs`
- **Aceitação:**
  - [ ] `flutter_rust_bridge_codegen` gera bindings Dart a partir das APIs Rust
  - [ ] Dart consegue chamar função Rust simples (ex.: `greet()`)
  - [ ] Bridge compila sem erros
- **Verificação:** `flutter run` mostra resultado de chamada Rust

#### 2.3 — Expor API de catálogo via FFI
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 2.2, 1.18
- **Arquivos tocados:** `crates/cecistudy-ffi/src/lib.rs`
- **Aceitação:**
  - [ ] `open_catalog(path) -> CatalogHandle`
  - [ ] `get_question_count(handle) -> usize`
  - [ ] `get_concept_count(handle) -> usize`
  - [ ] `get_approach_list(handle) -> Vec<ApproachSummary>`
  - [ ] Re-gerar bindings Dart
- **Verificação:** Dart recebe dados reais do `.db`

#### 2.4 — Expor API de banco do usuário via FFI
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 2.2, 1.12
- **Arquivos tocados:** `crates/cecistudy-ffi/src/lib.rs`, `crates/cecistudy-ffi/src/database.rs` (novo)
- **Aceitação:**
  - [ ] `open_database(path) -> DatabaseHandle`
  - [ ] `get_profile(handle) -> UserProfileDto`
  - [ ] `upsert_profile(handle, profile)`
  - [ ] `get_courses(handle) -> Vec<CourseDto>`
  - [ ] `upsert_course(handle, course)`
  - [ ] `delete_course(handle, id)`
  - [ ] `get_tasks(handle) -> Vec<TaskDto>`
  - [ ] `toggle_task(handle, id)`
  - [ ] Re-gerar bindings Dart
- **Verificação:** Dart cria/le/edita dados no SQLite

#### 2.5 — Expor API de sync via FFI
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 2.2, 1.16
- **Arquivos tocados:** `crates/cecistudy-ffi/src/lib.rs`, `crates/cecistudy-ffi/src/sync.rs` (novo)
- **Aceitação:**
  - [ ] `sync_inspect(handle, config) -> SyncStatus`
  - [ ] `sync_push(handle, config) -> SyncResult`
  - [ ] `sync_pull(handle, config) -> SyncResult`
  - [ ] Re-gerar bindings Dart
- **Verificação:** Dart consegue push/pull de dados

#### 2.6 — Criar esqueleto Flutter (shell + navegação)
- **Escopo:** M (5-8 arquivos)
- **Dependências:** 2.1
- **Arquivos tocados:** `apps/desktop-flutter/lib/` (shell.dart, navigation.dart, theme.dart, screens/home_screen.dart)
- **Aceitação:**
  - [ ] Shell com sidebar fixa (desktop ≥ lg) + container alargado
  - [ ] Navegação por estado (equivalente ao `NavScreen` do TS)
  - [ ] Tema baseado em tokens do `index.css` (cores cecistudy, fontes Inter/JetBrains)
  - [ ] `HomeScreen` com layout mínimo
- **Verificação:** App navega entre abas, tema coerente

#### 2.7 — Conectar HomeScreen ao banco Rust
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 2.4, 2.6
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/home_screen.dart`, `apps/desktop-flutter/lib/state/` (novo)
- **Aceitação:**
  - [ ] Home lê profile do banco Rust via FFI
  - [ ] Home mostra nome, semestre, saudação
  - [ ] Tasks do dia listadas
  - [ ] Courses do semestre listados
  - [ ] Dados persistem entre reinícios (SQLite no disco)
- **Verificação:** `flutter run` mostra dados reais; fechar e reabrir preserva

### 4.1 Checkpoint Fase 2

#### 2.8 — Validar pipeline ponta a ponta
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 2.1-2.7
- **Arquivos tocados:** `desktop/spec/e2e-test.md`
- **Aceitação:**
  - [ ] `flutter run -d linux` abre, mostra Home com dados
  - [ ] Criar course via FFI → aparece na UI
  - [ ] Criar task via FFI → aparece na UI
  - [ ] Sync push → dados no GitHub
  - [ ] Sync pull em outra instância → dados idênticos
  - [ ] Backup export/import funciona
- **Verificação:** Documento com resultado do E2E

---

## 5. Fase 3 — Portar módulo por módulo

> **Objetivo:** Todas as telas do desktop funcionando em Flutter.
> **Critério de saída:** Cada módulo tem UI equivalente ao React + dados do Rust.
> **Risco:** 🟡 Médio a 🔴 Alto (Calendário e TCC são os mais complexos).

### 5.1 Módulos simples (ordem por complexidade crescente)

#### 3.1 — Home completa
- **Escopo:** M (3-5 arquivos)
- **Dependências:** Fase 2 completa
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/home/` (novo)
- **Aceitação:**
  - [ ] Saudação contextual (hora do dia)
  - [ ] Meta do dia (tarefas + provas fundidas, máx. 3)
  - [ ] Ações rápidas (foco, revisar)
  - [ ] Ritmo compacto (streak, sessões)
  - [ ] Streak visual (fogo)
- **Verificação:** Layout idêntico ao React; dados do Rust

#### 3.2 — Faculdade (grade de disciplinas + detalhe)
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.1
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/faculdade/` (novo: list, detail, class_note_card)
- **Aceitação:**
  - [ ] Grid de disciplinas (cards com cor/ícone)
  - [ ] Detalhe da disciplina (info, aulas, repertório)
  - [ ] Lista de anotações de aula
  - [ ] Criar/editar/disciplina
  - [ ] Criar/editar anotação de aula
  - [ ] Quick add (FAB → modal)
  - [ ] Search (⌘K)
  - [ ] Deep link por courseId
- **Verificação:** CRUD completo; busca funciona; deep link funciona

#### 3.3 — Estudos (sessões, leituras, flashcards, quiz)
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.2
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/estudos/` (novo: focus_screen, readings, flashcards, quiz)
- **Aceitação:**
  - [ ] Timer pomodoro (iniciar/pausar/reiniciar)
  - [ ] Sessões de estudo (histórico, criar)
  - [ ] Leituras (progresso, status)
  - [ ] Flashcards (revisão, drag)
  - [ ] Quiz (seletor → play → resultado)
  - [ ] Lembrete diário (notificações desktop)
- **Verificação:** Pomodoro funciona; quiz completa sem crash

#### 3.4 — Biblioteca (catálogo + filtros + templo)
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.3
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/biblioteca/` (novo: catalog, filters, temple, books, notes)
- **Aceitação:**
  - [ ] "Meus materiais" (notas, continuar lendo, salvos)
  - [ ] "Explorar" (coleções colapsáveis)
  - [ ] Detalhe de livro (capa, progresso, lombada)
  - [ ] Filtros (modal)
  - [ ] Templo (conceitos, autores, técnicas, abordagens)
  - [ ] Notas avulsas (criar, editar, categorizar)
  - [ ] Busca do catálogo (SQLite read-only)
- **Verificação:** Catálogo do `.db` aparece; filtros funcionam; detalhe abre

#### 3.5 — Perfil (métricas, timeline, config)
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.1
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/perfil/` (novo)
- **Aceitação:**
  - [ ] Resumo da jornada (métricas reais derivadas do banco)
  - [ ] Timeline
  - [ ] Streak
  - [ ] Stickers
  - [ ] Personalização (temas, lembrete)
  - [ ] Export/import de backup
  - [ ] Sync config
  - [ ] Card de atualização (OTA desktop via GitHub Releases)
- **Verificação:** Métricas reais; backup export/import funciona

### 5.2 Módulos avançados (domain-driven)

#### 3.6 — Calendário: domínio + grade
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.1, 1.3 (domain calendar)
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/calendario/` (novo: calendar_grid, event_card, create_event)
- **Aceitação:**
  - [ ] Grade semanal desktop (drag/resize de blocos)
  - [ ] Eventos do banco Rust (CalendarEvent)
  - [ ] Criar/editar evento
  - [ ] Cores por origem (faculdade, tcc, estudos, etc.)
  - [ ] Responsabilidades (Subtask, PlanningBlock)
  - [ ] ExecutionRecord (registro do que aconteceu)
- **Verificação:** Grade renderiza; eventos persistem

#### 3.7 — Calendário: recorrência
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.6
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/calendario/recurrence.dart` (novo)
- **Aceitação:**
  - [ ] `RecurrenceRule` (daily, weekly, monthly)
  - [ ] `Occurrence` (instâncias com overrides)
  - [ ] Criar evento recorrente
  - [ ] Editar ocorrência individual (override)
  - [ ] Cálculo de ocorrências futuras
- **Verificação:** Evento semanal aparece em todos os dias; override funciona

#### 3.8 — Calendário: integração com Faculdade
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.6, 3.2
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/calendario/` (atualizar)
- **Aceitação:**
  - [ ] `Course.schedule` → eventos automáticos no calendário
  - [ ] Provas → eventos com `level: obrigatorio`
  - [ ] Tarefas com `dueDate` → eventos
  - [ ] Ao criar prova/tarefa, avisa conflito de horário
- **Verificação:** Criar disciplina com horário → grade mostra aulas

#### 3.9 — Calendário: blocos de planejamento + timer
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.7
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/calendario/planning.dart` (novo)
- **Aceitação:**
  - [ ] `PlanningBlock` (tempo reservado para responsabilidade)
  - [ ] Drag de bloco na grade
  - [ ] `ExecutionRecord` (registro do que aconteceu vs planejado)
  - [ ] Timer integrado (bloco ativo = sessão de foco)
- **Verificação:** Planejar → executar → registro batido

#### 3.10 — Calendário: camadas visuais
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.8
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/calendario/layers.dart` (novo)
- **Aceitação:**
  - [ ] Camadas: aulas, responsabilidades, eventos externos
  - [ ] Toggle de visibilidade por camada
  - [ ] Cores consistentes por origem
  - [ ] Semi-transparência para sobreposições
- **Verificação:** Camadas independentes; toggle funciona

#### 3.11 — Calendário: Google Calendar (integração)
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.6, 1.0
- **Arquivos tocados:** `crates/cecistudy-integrations/` (novo), `apps/desktop-flutter/lib/screens/calendario/gcal.dart`
- **Aceitação:**
  - [ ] `cecistudy-integrations` crate com OAuth flow
  - [ ] Mapeamento de ID (cecistudy ↔ Google)
  - [ ] Sync bidirecional
  - [ ] Eventos importados = somente leitura no cecistudy
  - [ ] Eventos criados no cecistudy = editáveis nos dois lados
  - [ ] Flutter recebe eventos já resolvidos
  - [ ] Flutter mostra comandos simples para conflito
- **Verificação:** Criar evento no cecistudy → aparece no Google Calendar

#### 3.12 — Calendário: resolução de conflitos
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.11
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/calendario/conflicts.dart` (novo)
- **Aceitação:**
  - [ ] Detecção de conflito (mesmo evento editado nos dois lados)
  - [ ] UI de resolução: `manter_cecistudy`, `manter_google`, `combinar_campos`
  - [ ] Preservação de versões em conflito
  - [ ] Lógica de resolução no Rust, Flutter só mostra opções
- **Verificação:** Conflito detectado e resolvido corretamente

#### 3.13 — Calendário: sugestões inteligentes
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.7, 3.8
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/calendario/suggestions.dart` (novo)
- **Aceitação:**
  - [ ] Sugere blocos de estudo para responsabilidades sem planejamento
  - [ ] Sugere revisão periódica
  - [ ] Detecta sobrecarga (muitas responsabilidades no mesmo dia)
  - [ ] Sugestões vêm do Rust (lógica), Flutter só renderiza
- **Verificação:** Sugestões aparecem; sobrecarga detectada

#### 3.14 — Conhecimento (grafo + editor de blocos)
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.1, 1.4 (domain knowledge)
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/conhecimento/` (novo: graph, editor, blocks, inbox)
- **Aceitação:**
  - [ ] Lista de Documents
  - [ ] Editor de blocos (paragraph, heading, list, table, image, quote, code, equation, reference, note)
  - [ ] Grafo de Relations (visual)
  - [ ] Inbox de Suggestions (curadoria)
  - [ ] LearningState por conceito
  - [ ] AssociationPolicy (block/reject)
  - [ ] Tags e áreas
- **Verificação:** Criar documento com blocos; relations aparecem no grafo

#### 3.15 — Marketing (studio completo)
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.1, 1.5 (domain marketing)
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/marketing/` (novo: positioning, ideas, calendar, publications)
- **Aceitação:**
  - [ ] PositioningProfile (identidade, propósito, pilares, público)
  - [ ] ContentIdea → ContentBase → ChannelVariant (pipeline editorial)
  - [ ] Calendar editorial (grades por canal)
  - [ ] Publications (publicações agendadas/realizadas)
  - [ ] MetricSnapshot (métricas por publicação)
  - [ ] StrategicInsight (insights estratégicos)
  - [ ] Kanban de status editorial
- **Verificação:** Pipeline ideia→publicação funciona; métricas registradas

#### 3.16 — Projetos/TCC: projetos + árvore acadêmica
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.1, 1.6 (domain projects)
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/projetos/` (novo: list, tree)
- **Aceitação:**
  - [ ] Lista de projetos (máx 5 ativos)
  - [ ] Criar projeto (tipos: tcc, artigo, etc.)
  - [ ] Árvore acadêmica (AcademicNode)
  - [ ] TCC: 4 capítulos obrigatórios pré-criados
  - [ ] Status (ativo, pausado, concluído, arquivado)
  - [ ] Badge color
- **Verificação:** Criar TCC → árvore aparece; limite de 5 respeitado

#### 3.17 — Projetos/TCC: modelo interno de documento
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.16, 1.4 (knowledge Document)
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/projetos/editor.dart` (novo)
- **Aceitação:**
  - [ ] Cada nó da árvore vincula a um `Document` (knowledge)
  - [ ] Edição de blocos dentro do nó
  - [ ] Navegação árvore ↔ conteúdo
  - [ ] Salvar automaticamente
- **Verificação:** Editar "Introdução" → conteúdo persiste

#### 3.18 — Projetos/TCC: editor paginado
- **Escopo:** XL (8+ arquivos)
- **Dependências:** 3.17
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/projetos/paged_editor/` (novo)
- **Aceitação:**
  - [ ] Editor com paginação (estilo processador de texto)
  - [ ] Preview de página
  - [ ] Navegação por página
  - [ ] Formatação básica (negrito, itálico, listas, títulos)
  - [ ] Inserção de imagens/tabelas
  - [ ] Zoom e scroll
- **Verificação:** Documento com 5+ páginas; paginação funciona

#### 3.19 — Projetos/TCC: referências + ABNT
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.18, 1.6 (domain Reference, Citation)
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/projetos/references.dart` (novo)
- **Aceitação:**
  - [ ] Lista de References (book, article, web, thesis, other)
  - [ ] Criar/editar referência
  - [ ] Inserir Citation no documento (direta/indireta)
  - [ ] Formatação ABNT automática
  - [ ] Locator (página, capítulo)
  - [ ] CitationProfile selection (ABNT, APA, Vancouver, Chicago, custom)
- **Verificação:** Inserir citação → referência formatada ABNT aparece

#### 3.20 — Projetos/TCC: export DOCX
- **Escopo:** L (5-8 arquivos)
- **Dependências:** 3.19
- **Arquivos tocados:** `crates/cecistudy-app/src/use_cases/export_docx.rs` (novo), `apps/desktop-flutter/lib/screens/projetos/export.dart`
- **Aceitação:**
  - [ ] Exportar projeto completo como DOCX
  - [ ] Respeita árvore acadêmica (capítulos, seções)
  - [ ] Referências formatadas na ABNT
  - [ ] Capa e sumário gerados
  - [ ] Download do arquivo
  - [ ] Round-trip: DOCX → abrir no Word → conteúdo correto
- **Verificação:** DOCX gerado abre no LibreOffice/Word com formatação correta

#### 3.21 — Estágio (diário de casos)
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 3.1
- **Arquivos tocados:** `apps/desktop-flutter/lib/screens/estagio/` (novo)
- **Aceitação:**
  - [ ] Lista de InternshipLog (agrupado por caso)
  - [ ] Criar/editar registro (data, horas, atividade, reflexões)
  - [ ] Caderno de supervisão (SupervisionNotebook)
  - [ ] Conceitos vinculados
- **Verificação:** Criar registro; supervisão salva

### 5.3 Checkpoint Fase 3

#### 3.22 — Validação visual completa
- **Escopo:** S (1 arquivo)
- **Dependências:** 3.1-3.21
- **Arquivos tocados:** `desktop/spec/visual-audit.md`
- **Aceitação:**
  - [ ] Cada módulo listado com status (OK / pendente)
  - [ ] Screenshots comparativos (React vs Flutter)
  - [ ] Todos os botões interativos funcionam
  - [ ] Nenhum crash em fluxo normal
  - [ ] Busca global funciona em todas as telas
- **Verificação:** Documento com resultado

---

## 6. Fase 4 — Interoperabilidade com mobile

> **Objetivo:** Desktop e mobile compartilham dados via GitHub sync + backup.
> **Critério de saída:** Export do mobile → import no desktop (e vice-versa) funciona.

### Tarefas

#### 4.1 — Validar compatibilidade de backup
- **Escopo:** S (1-2 arquivos)
- **Dependências:** Fase 1 (golden files), Fase 2 (E2E)
- **Arquivos tocados:** `desktop/spec/interop-test.md`
- **Aceitação:**
  - [ ] Export do mobile (TS) → import no desktop (Rust) → dados idênticos
  - [ ] Export do desktop (Rust) → import no mobile (TS) → dados idênticos
  - [ ] Backups antigos (schema 6) importados corretamente nos dois lados
- **Verificação:** Script de round-trip cross-plataforma

#### 4.2 — Validar compatibilidade de sync
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 4.1, 1.16
- **Arquivos tocados:** `desktop/spec/sync-interop-test.md`
- **Aceitação:**
  - [ ] Push do mobile (TS GitHub provider) → pull no desktop (Rust GitHub provider) → dados mesclados
  - [ ] Push do desktop → pull no mobile → dados mesclados
  - [ ] Edições simultâneas → merge LWW correto
  - [ ] Deleção → tombstone propagado
- **Verificação:** Dois dispositivos sincronizados com dados idênticos

#### 4.3 — Documentar limitações de interoperabilidade
- **Escopo:** XS (1 arquivo)
- **Dependências:** 4.1, 4.2
- **Arquivos tocados:** `desktop/spec/interop-limitations.md`
- **Aceitação:**
  - [ ] Listar o que NÃO sincroniza (catálogo, config de UI efêmera)
  - [ ] Listar o que NÃO é interoperável (entidades novas do desktop sem equivalente mobile)
  - [ ] Estratégia para entidades novas (`.passthrough()` preserva)
- **Verificação:** Documento completo e revisado

---

## 7. Fase 6 — Empacotamento

> **Objetivo:** App desktop instalável (Linux, macOS, Windows) com notificações e auto-update.
> **Critério de saída:** Binário funcional, distribuível via GitHub Releases.

### Tarefas

#### 6.1 — Configurar build Flutter desktop
- **Escopo:** M (3-5 arquivos)
- **Dependências:** Fase 3 completa
- **Arquivos tocados:** `apps/desktop-flutter/linux/`, `apps/desktop-flutter/macos/`, `apps/desktop-flutter/windows/`, `apps/desktop-flutter/pubspec.yaml`
- **Aceitação:**
  - [ ] `flutter build linux` gera binário
  - [ ] `flutter build macos` gera .app
  - [ ] `flutter build windows` gera .exe
  - [ ] Binário roda sem Flutter SDK instalado
- **Verificação:** App instalável em cada plataforma

#### 6.2 — Configurar notificações desktop
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 6.1
- **Arquivos tocados:** `apps/desktop-flutter/lib/services/notifications.dart` (novo)
- **Aceitação:**
  - [ ] `flutter_local_notifications` configurado
  - [ ] Lembrete diário (timer JS → notificação nativa)
  - [ ] Permissão solicitada no boot
- **Verificação:** Notificação aparece no horário agendado

#### 6.3 — Configurar auto-update via GitHub Releases
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 6.1
- **Arquivos tocados:** `apps/desktop-flutter/lib/services/updater.dart` (novo), `.github/scripts/desktop-update-manifest.mjs`
- **Aceitação:**
  - [ ] `flutter_updater` ou equivalente configurado
  - [ ] Busca `latest.json` no GitHub Releases
  - [ ] Baixa e instala nova versão
  - [ ] Chaves minisign configuradas
  - [ ] UI de "atualização disponível" no Perfil
- **Verificação:** Simular nova versão → app atualiza

#### 6.4 — Configurar CI para Flutter desktop
- **Escopo:** M (3-5 arquivos)
- **Dependências:** 6.1
- **Arquivos tocados:** `.github/workflows/release-flutter-desktop.yml` (novo)
- **Aceitação:**
  - [ ] Matrix: ubuntu, macos, windows
  - [ ] Build: `flutter build linux/macos/windows`
  - [ ] Upload: binários no GitHub Release
  - [ ] Trigger: push na main, tag `v*`, workflow_dispatch
- **Verificação:** CI builda sem erros

#### 6.5 — Remover desktop antigo (Tauri + React)
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 6.4 validado, usuárias migradas
- **Arquivos tocados:** `desktop/` (deletar), `apps/desktop/` (deletar)
- **Aceitação:**
  - [ ] `desktop/` (Tauri) removido
  - [ ] `apps/desktop/` (React) removido
  - [ ] `npm run dev:desktop` removido do root `package.json`
  - [ ] `AGENTS.md` atualizado (sem referências ao Tauri)
  - [ ] CI workflows antigos removidos
- **Verificação:** `npm run lint` + `npm run test` + `npm run build` continuam verdes (mobile não afetado)

---

## 8. Fase 7 — Migração de quem usa o desktop antigo

> **Objetivo:** Usuárias do Tauri migram dados para o novo app Flutter.
> **Critério de saída:** Fluxo de migração documentado e testado.

### Tarefas

#### 7.1 — Documentar fluxo de migração
- **Escopo:** XS (1 arquivo)
- **Dependências:** Fase 4 (interop validada)
- **Arquivos tocados:** `desktop/spec/migration-guide.md`
- **Aceitação:**
  - [ ] Passo 1: Exportar backup no app antigo (Tauri)
  - [ ] Passo 2: Abrir novo app Flutter
  - [ ] Passo 3: Importar backup
  - [ ] Passo 4: Verificar dados
  - [ ] Troubleshooting comum
- **Verificação:** Instruções claras e testadas

#### 7.2 — Testar migração com dados reais
- **Escopo:** S (1-2 arquivos)
- **Dependências:** 7.1
- **Arquivos tocados:** `desktop/spec/migration-test-report.md`
- **Aceitação:**
  - [ ] Backup do Tauri importado sem erros
  - [ ] Todos os dados preservados
  - [ ] Nenhuma perda de dados
  - [ ] Sync funciona após migração
- **Verificação:** Relatório de teste

---

## 9. Resumo de tarefas por fase

### Fase 0 — 5 tarefas (0.1-0.5)
| # | Tarefa | Escopo | Risco | Dependências |
|---|--------|--------|-------|--------------|
| 0.1 | Extrair DDL SQL | XS | 🟡 | — |
| 0.2 | Spec backup v2 | S | 🔴 | — |
| 0.3 | Golden files | M | 🔴 | 0.1, 0.2 |
| 0.4 | Teste round-trip | S | 🟡 | 0.3 |
| 0.5 | Lista coleções sync | XS | 🟢 | — |

### Fase 1 — 23 tarefas (1.0-1.22)
| # | Tarefa | Escopo | Risco | Dependências |
|---|--------|--------|-------|--------------|
| 1.0 | Workspace Cargo + crate domain | S | 🟢 | Fase 0 |
| 1.1 | common.rs + ids.rs | XS | 🟢 | 1.0 |
| 1.2 | workspace.rs | XS | 🟢 | 1.1 |
| 1.3 | calendar.rs | S | 🟡 | 1.1 |
| 1.4 | knowledge.rs | S | 🟡 | 1.1 |
| 1.5 | marketing.rs | S | 🟡 | 1.1 |
| 1.6 | projects.rs | S | 🟡 | 1.1 |
| 1.7 | capabilities.rs | XS | 🟢 | 1.1 |
| 1.8 | Crate data setup | S | 🟢 | 1.2-1.7 |
| 1.9 | Entidades serde | M | 🔴 | 1.8 |
| 1.10 | DDL + migrações | M | 🔴 | 1.9, 0.1 |
| 1.11 | Backup schema serde | M | 🔴 | 1.9, 0.2 |
| 1.12 | SQLite repository | L | 🔴 | 1.9, 1.10 |
| 1.13 | stamp.rs | S | 🟡 | 1.9 |
| 1.14 | merge.rs | M | 🔴 | 1.13, 1.9 |
| 1.15 | provider.rs + github.rs | S | 🟡 | 1.9 |
| 1.16 | engine.rs | M | 🟡 | 1.13-1.15 |
| 1.17 | Crate content setup | S | 🟢 | 1.0 |
| 1.18 | Queries catálogo | M | 🟡 | 1.17 |
| 1.19 | Crate app setup | S | 🟢 | 1.8-1.18 |
| 1.20 | Use cases básicos | L | 🟡 | 1.19 |
| 1.21 | FFI setup | M | 🟡 | 1.20 |
| 1.22 | Validação paridade | S | 🔴 | 1.0-1.21 |

### Fase 2 — 8 tarefas (2.1-2.8)
| # | Tarefa | Escopo | Risco | Dependências |
|---|--------|--------|-------|--------------|
| 2.1 | Criar Flutter project | S | 🟢 | Fase 1 |
| 2.2 | flutter_rust_bridge | M | 🟡 | 2.1, 1.21 |
| 2.3 | FFI catálogo | S | 🟢 | 2.2, 1.18 |
| 2.4 | FFI banco usuário | M | 🟡 | 2.2, 1.12 |
| 2.5 | FFI sync | S | 🟢 | 2.2, 1.16 |
| 2.6 | Shell Flutter | M | 🟡 | 2.1 |
| 2.7 | Home conectada | M | 🟡 | 2.4, 2.6 |
| 2.8 | Validação E2E | S | 🟡 | 2.1-2.7 |

### Fase 3 — 22 tarefas (3.1-3.22)
| # | Tarefa | Escopo | Risco | Dependências |
|---|--------|--------|-------|--------------|
| 3.1 | Home completa | M | 🟢 | Fase 2 |
| 3.2 | Faculdade | L | 🟡 | 3.1 |
| 3.3 | Estudos | L | 🟡 | 3.2 |
| 3.4 | Biblioteca | L | 🟡 | 3.3 |
| 3.5 | Perfil | M | 🟢 | 3.1 |
| 3.6 | Calendário: domínio+grade | L | 🔴 | 3.1, 1.3 |
| 3.7 | Calendário: recorrência | M | 🔴 | 3.6 |
| 3.8 | Calendário: integração Faculdade | M | 🟡 | 3.6, 3.2 |
| 3.9 | Calendário: planejamento+timer | M | 🟡 | 3.7 |
| 3.10 | Calendário: camadas visuais | M | 🟡 | 3.8 |
| 3.11 | Calendário: Google Calendar | L | 🔴 | 3.6, 1.0 |
| 3.12 | Calendário: conflitos | M | 🔴 | 3.11 |
| 3.13 | Calendário: sugestões | M | 🟡 | 3.7, 3.8 |
| 3.14 | Conhecimento | L | 🔴 | 3.1, 1.4 |
| 3.15 | Marketing | L | 🟡 | 3.1, 1.5 |
| 3.16 | Projetos: árvore | M | 🟡 | 3.1, 1.6 |
| 3.17 | Projetos: modelo doc | M | 🟡 | 3.16, 1.4 |
| 3.18 | Projetos: editor paginado | XL | 🔴 | 3.17 |
| 3.19 | Projetos: refs+ABNT | L | 🔴 | 3.18, 1.6 |
| 3.20 | Projetos: export DOCX | L | 🔴 | 3.19 |
| 3.21 | Estágio | M | 🟢 | 3.1 |
| 3.22 | Validação visual | S | 🟢 | 3.1-3.21 |

### Fase 4 — 3 tarefas (4.1-4.3)
| # | Tarefa | Escopo | Risco | Dependências |
|---|--------|--------|-------|--------------|
| 4.1 | Compatibilidade backup | S | 🔴 | Fase 1, 2 |
| 4.2 | Compatibilidade sync | S | 🔴 | 4.1, 1.16 |
| 4.3 | Doc limitações | XS | 🟢 | 4.1, 4.2 |

### Fase 6 — 5 tarefas (6.1-6.5)
| # | Tarefa | Escopo | Risco | Dependências |
|---|--------|--------|-------|--------------|
| 6.1 | Build Flutter desktop | M | 🟡 | Fase 3 |
| 6.2 | Notificações | S | 🟢 | 6.1 |
| 6.3 | Auto-update | S | 🟡 | 6.1 |
| 6.4 | CI Flutter desktop | M | 🟡 | 6.1 |
| 6.5 | Remover desktop antigo | S | 🟢 | 6.4, migração |

### Fase 7 — 2 tarefas (7.1-7.2)
| # | Tarefa | Escopo | Risco | Dependências |
|---|--------|--------|-------|--------------|
| 7.1 | Doc migração | XS | 🟢 | Fase 4 |
| 7.2 | Teste migração | S | 🟡 | 7.1 |

---

## 10. Mapa de paralelização

### Paralelizável (mesmo tempo):

**Fase 0:**
- 0.1 (DDL) ∥ 0.2 (spec backup) ∥ 0.5 (lista sync)

**Fase 1 (crates de domínio):**
- 1.2 (workspace) ∥ 1.3 (calendar) ∥ 1.4 (knowledge) ∥ 1.5 (marketing) ∥ 1.6 (projects) ∥ 1.7 (capabilities)
- Todos dependem só de 1.1 (common+ids)

**Fase 1 (crates de dados):**
- 1.13 (stamp) ∥ 1.15 (provider)
- 1.17 (content setup) ∥ 1.18 (queries)

**Fase 3 (módulos independentes):**
- 3.2 (Faculdade) ∥ 3.5 (Perfil)
- 3.14 (Conhecimento) ∥ 3.15 (Marketing) ∥ 3.21 (Estágio)
- 3.6-3.13 (Calendário) ∥ 3.16-3.20 (Projetos/TCC) — trilhas independentes

### Sequencial obrigatório:
- 1.0 → 1.1 → (1.2-1.7) → 1.8 → 1.9 → 1.10/1.11 → 1.12
- 1.13 → 1.14 → 1.16
- 2.1 → 2.2 → (2.3, 2.4, 2.5) → 2.7
- 3.6 → 3.7 → 3.8/3.9/3.10 → 3.11 → 3.12/3.13
- 3.16 → 3.17 → 3.18 → 3.19 → 3.20

---

## 11. Estimativas de esforço

| Fase | Tarefas | Escopo total | Tempo estimado* |
|------|---------|-------------|-----------------|
| 0 | 5 | ~4-5 arquivos | 1-2 dias |
| 1 | 23 | ~35-50 arquivos | 2-3 semanas |
| 2 | 8 | ~15-20 arquivos | 1 semana |
| 3 | 22 | ~60-80 arquivos | 4-6 semanas |
| 4 | 3 | ~3-5 arquivos | 1-2 dias |
| 6 | 5 | ~10-15 arquivos | 1 semana |
| 7 | 2 | ~2-3 arquivos | 1 dia |
| **Total** | **68** | **~130-185 arquivos** | **~10-14 semanas** |

*Estimativa para 1 pessoa dedicada, considerando learning curve Rust/Flutter.

---

## 12. Riscos e mitigações (atualizados por tarefa)

| Tarefa | Risco | Mitigação |
|--------|-------|-----------|
| 0.3 (golden files) | 🔴 Paridade silenciosa | Testes automatizados; rodar nos dois lados antes de qualquer coisa |
| 1.9 (entidades serde) | 🔴 `.passthrough()` TS ≠ `serde_json::Value` Rust | Testar com fixtures que têm campos extras/legados |
| 1.10 (migrações) | 🔴 Migração 9 (schedule) parsing divergente | Testar com fixtures de schedule legado reais |
| 1.12 (SQLite repo) | 🔴 Write batch pode perder dados | Transação; rollback; testes de crash recovery |
| 1.14 (merge) | 🔴 `tie_break` divergente entre TS e Rust | Usar a mesma serialização JSON; testar com empates |
| 1.16 (engine) | 🟡 Provider GitHub pode ter rate limits | Retry com backoff; tratar 403/429 |
| 3.6-3.13 (Calendário) | 🔴 Recorrência + Google Calendar = complexidade alta | MVP primeiro; Google Calendar como trilha separada |
| 3.18 (editor paginado) | 🔴 Projeto do tamanho de um editor de texto | Seguir as 5 fases de MVP; não pular pra funcionalidades pós-MVP |
| 3.20 (DOCX) | 🔴 Round-trip DOCX = complexidade alta | Usar crate maduro (docx-rs); testar com Word real |
| 4.1-4.2 (interop) | 🔴 Dados corrompidos na migração | Golden files + teste automatizado cross-plataforma |

---

## 13. Ordem de implementação recomendada (execução)

### Sprint 1 (Fundação — 2-3 dias)
- [ ] 0.1 Extrair DDL
- [ ] 0.2 Spec backup v2
- [ ] 0.5 Lista coleções sync
- [ ] 0.3 Golden files

### Sprint 2 (Domínio Rust — 1 semana)
- [ ] 1.0 Workspace + crate domain
- [ ] 1.1 common + ids
- [ ] 1.2-1.7 Todos os módulos de domínio (paralelizáveis)
- [ ] 0.4 Teste round-trip (placeholder)

### Sprint 3 (Dados Rust — 1 semana)
- [ ] 1.8 Crate data setup
- [ ] 1.9 Entidades serde
- [ ] 1.10 DDL + migrações
- [ ] 1.11 Backup schema
- [ ] 1.12 SQLite repository

### Sprint 4 (Sync + Content + App — 1 semana)
- [ ] 1.13-1.16 Sync crates
- [ ] 1.17-1.18 Content crate
- [ ] 1.19-1.20 App crate
- [ ] 1.21 FFI crate
- [ ] 1.22 Validação paridade

### Sprint 5 (Flutter skeleton — 1 semana)
- [ ] 2.1-2.2 Projeto Flutter + bridge
- [ ] 2.3-2.5 FFI APIs
- [ ] 2.6-2.7 Shell + Home conectada
- [ ] 2.8 Validação E2E

### Sprint 6 (Módulos simples — 1 semana)
- [ ] 3.1 Home completa
- [ ] 3.2 Faculdade
- [ ] 3.5 Perfil

### Sprint 7 (Módulos médios — 1 semana)
- [ ] 3.3 Estudos
- [ ] 3.4 Biblioteca
- [ ] 3.21 Estágio

### Sprint 8 (Calendário MVP — 1 semana)
- [ ] 3.6 Domínio + grade
- [ ] 3.7 Recorrência
- [ ] 3.8 Integração Faculdade
- [ ] 3.9 Planejamento + timer

### Sprint 9 (Calendário avançado + Conhecimento — 1 semana)
- [ ] 3.10 Camadas visuais
- [ ] 3.14 Conhecimento
- [ ] 3.15 Marketing

### Sprint 10 (TCC/Projetos — 1-2 semanas)
- [ ] 3.16-3.20 Trilha completa TCC

### Sprint 11 (Google Calendar — 1 semana)
- [ ] 3.11-3.13 Google Calendar + conflitos + sugestões

### Sprint 12 (Interop + Empacotamento — 1 semana)
- [ ] 4.1-4.3 Interoperabilidade
- [ ] 6.1-6.4 Build + notificações + auto-update + CI

### Sprint 13 (Migração + Limpeza — 2-3 dias)
- [ ] 7.1-7.2 Migração
- [ ] 6.5 Remover desktop antigo
- [ ] 3.22 Validação visual completa

---

## 14. Checkpoints de validação

| Checkpoint | Gate | O que validar |
|------------|------|---------------|
| CP0 | Fase 0 completa | Golden files existem; spec formalizada |
| CP1 | Fase 1 completa | `cargo test --workspace` verde; paridade TS↔Rust 100% |
| CP2 | Fase 2 completa | `flutter run -d linux` mostra Home com dados reais; CRUD funciona |
| CP3 | Fase 3.5 completa | 5 módulos simples funcionando (Home, Faculdade, Estudos, Biblioteca, Perfil) |
| CP4 | Fase 3.13 completa | Calendário completo (grade, recorrência, Google Calendar, conflitos) |
| CP5 | Fase 3.20 completa | TCC completo (árvore, editor, ABNT, DOCX) |
| CP6 | Fase 3.22 completa | Todos os módulos validados visualmente |
| CP7 | Fase 4 completa | Interop mobile↔desktop validada |
| CP8 | Fase 6 completa | App instalável em 3 plataformas; auto-update funciona |
| CP9 | Fase 7 completa | Migração documentada e testada |

---

## 15. Notas para agentes de implementação

1. **Nunca pular fases.** Cada fase tem um checkpoint que é gate para a próxima.
2. **Golden files são sagrados.** Se um teste de paridade falhar, parar tudo e resolver antes de continuar.
3. **Flutter não decide.** Toda lógica de negócio está no Rust. Flutter só consulta e renderiza.
4. **`.passthrough()` no Rust = `serde_json::Value`.** Não tentar tipar campos desconhecidos.
5. **Migrações são append-only.** Nunca editar uma migração existente; sempre criar nova.
6. **TCC é trilha própria.** Não tratar como "mais uma tela"; seguir as 5 fases de MVP.
7. **Google Calendar é trilha própria.** Não bloquear outros módulos; pode ser implementado depois.

---

## 16. Reconciliação de numeramento (handoff)

Este breakdown (origem, 01-task-breakdown-flutter-rust.md) e o `PLANO-CONSOLIDADO-FLUTTER-RUST.md`
usam **numeração diferente** para a mesma Fase 1. Mapeamento real entre as duas fontes:

| Este doc (origem) | Consolidado | Caminho real | Status |
|---|---|---|---|
| 1.13 stamp.rs | 1.17 | `cecistudy-sync/src/stamp.rs` | ✅ |
| 1.14 merge.rs | 1.18 | `cecistudy-sync/src/merge.rs` | ✅ |
| 1.15 provider.rs + github.rs | 1.19 | `cecistudy-sync/src/provider.rs` + `providers/github.rs` | ✅ |
| 1.16 engine.ts → `use_cases/sync.rs` | 1.21 (dentro do app) | `cecistudy-app/src/use_cases/sync.rs` | ✅ |
| 1.17 content crate setup | 1.20 | `cecistudy-content/` | ✅ |
| 1.18 content queries | 1.20 (dentro) | `cecistudy-content/src/queries/` | ✅ |
| 1.19 app crate setup | 1.21 | `cecistudy-app/` | ✅ |
| 1.20 use cases básicos | 1.21 (dentro) | `cecistudy-app/src/use_cases/` | ✅ |
| 1.21 FFI (flutter_rust_bridge) | 1.22 | `cecistudy-ffi/` | 🔲 (não existe ainda) |
| — | 1.23 Google Calendar | `cecistudy-integrations/` | 🔲 (não existe ainda) |

> **Portas extras já feitas:** além do spec, `cecistudy-app` já implementa `App::open`,
> `App::in_memory`, `App::verify`, `App::open_catalog`, `App::capability_for` (entrypoints
> da superfície FFI do futuro `cecistudy-ffi`).
>
> **Fonte de verdade para status:** este doc (01-task-breakdown-flutter-rust.md).
> O consolidado foi referência de planejamento; a numeração dele não bate com os commits.
8. **Sync P2P não é bloqueador.** GitHub provider resolve interop no dia 1.
9. **Manter `packages/*.ts` intactos.** Mobile não muda nesta fase.
10. **Testar cross-platform.** O mesmo fixture deve produzir o mesmo JSON em TS e Rust.

---

## Próximos passos (atualizado 2026-09-12 — plano de execução decidido)

> **Diretrizes da usuária (2026-09-12):** domínio **spec-first** (sem base React/JS; TS só como oráculo de
> paridade via golden); **entidades tipadas** no data (fonte de forma = `schema.sql`); lote de higiene incluso.
> Foco: **Rust Fase 1 → FFI**.

### R0 — Higiene rápida (1 sessão curta, fora do Rust)
- Reconciliar docs vs `.db`: "técnicas" **136 no `.db`** vs **135** em specs/AGENTS (definir fonte correta).
- Atualizar comentário obsoleto do `catalogDb.ts` (745 → 3002 questões) e outros numerais 745.
- Remover import morto de `isDesktop` em `src/shells/DesktopAppShell.tsx:9` (fecha C.5).
- Debugar numerais de testes repetidos (480/521/566/575) apontando para o número real corrente.

### R1 — Data crate → entidades tipadas (rework decidido 2026-09-12)
Forma dos structs extraída do **`schema.sql`** (DDL canônico do lado do usuário), não do TS.
Sub-passos incrementais (gate cargo em cada um):
- R1a. Definir o módulo de entidades tipadas (ex.: `domain::entity::*`) para as N coleções de usuário
  (profile, courses, class_notes, tasks, exams, sessions, readings, flashcards, concepts, authors,
  approaches, materials, internship_logs, tcc, stickers, streak, quiz_sessions…), com tipos 1:1 ao schema.
- R1b. Refatorar os repositórios **um por um** (coleção por coleção), do genérico `data_json` para o tipo
  específico; testes por repositório (os atuais `repositories_test.rs` evoluem).
- R1c. Refatorar `backup.rs`/`payload` e o merge do `sync` para os tipos (backup-v2-spec continua valendo).
- R1d. **Paridade intacta:** nenhum fixture golden muda de formato (canonical JSON v1); os testes
  `migration_parity_test.rs`/`golden_parity_test.rs` devem seguir verdes em cada sub-passo.
  > `migrations.rs` único pode permanecer (desvio de organização aceito — só o FORMATO muda para tipado).

### R2 — Módulos de domínio faltantes (F1.3–F1.6) — spec-first
`calendar.rs`, `knowledge.rs`, `marketing.rs`, `projects.rs`, `internship.rs` em `cecistudy-domain`.
- Forma/tipos: a partir de `schema.sql` + contrato; **não copiar estrutura do TS**.
- Comportamento/invariantes: definidos e testados **no próprio Rust** (spec → teste → código), com fixture
  golden round-trip por módulo. Para validar compatibilidade, os golden existentes do TS continuam
  como oráculo de formato.
- Aviso: entidades do R1 (tipadas) alimentam estes módulos — fazer R2 **depois** de R1a/R1b.

### R3 — Content naming (F1.17)
Renomear `CatalogDb::open_read_only` → `CatalogDatabase::open` para alinhar ao plano (baixo custo), ou
registrar aceitação explícita — recomendo o rename na execução.

### R4 — Paridade full (F1.22)
Criar `parity-test.sh` + `parity-report.md` + round-trip de **todos** os golden files (hoje: só
`golden_parity_test.rs` em common e `migration_parity_test.rs` em data). Manter como validação de
**formato de contrato** (TS e Rust produzem o mesmo canonical JSON v1), não como dependência de design.

### R5 — `cecistudy-ffi` (F1.21)
Bridge `flutter_rust_bridge` sobre as portas já prontas de `cecistudy-app` (`App::open`, `App::in_memory`,
`App::verify`, `App::open_catalog`, `App::capability_for`). É o gate de entrada da **Fase 2**.

### R6 — Fase 2 (UI Flutter, greenfield)
Skeleton + bridge sobre `cecistudy-ffi` + primeiras telas. **SEM qualquer base React/JS** — o visual segue
a linguagem de design do desktop novo (skills `frontend-design`/`ui-ux-pro-max` para especificar).

### R7 — `cecistudy-integrations` (Google Calendar)
Só depois de R5; não é bloqueador das demais fases.

**Ordem crítica:** R0 → R1 (a→d) → R2 → R3 → R4 → R5 → R6. `cecistudy-integrations` (R7) fica ao final.
**Gate de cada passo:** `cargo clippy --all-targets --all-features -- -D warnings` + `cargo fmt --check`
+ `cargo test` verdes. Não tocar os crates via `npm run lint` (o gate Rust é `cargo`).
