# Estratégia de Implementação Incremental — Flutter + Rust Desktop

> Análise de viabilidade e plano de fatias verticais seguras para a migração do desktop
> de Tauri+React para Flutter+Rust, respeitando o contrato de dados compartilhado com o
> mobile (React+Capacitor). (pt-BR)

## 0. Premissas

1. **O Tauri não tem lógica.** `desktop/src-tauri/src/lib.rs` são 18 linhas de plugin registration — zero lógica de domínio para migrar.
2. **Toda lógica de domínio já existe em TypeScript** (`packages/domain`, `packages/data`, `packages/sync`). O Rust porta isso, não inventa.
3. **O mobile não muda.** `packages/*` (TS) continuam para React+Capacitor. Rust é adição, não substituição.
4. **A união perigosa é o contrato de dados.** Se Rust e TS divergirem num campo opcional, sync quebra silenciosamente. Golden files são gate obrigatório.
5. **Flutter compila nativo para desktop (Windows/macOS/Linux).** Não é WebView. Rust roda via FFI (`flutter_rust_bridge`).

---

## 1. Mapa de Risco

| Risco | Severidade | Quando se valida | Mitigation |
|---|---|---|---|
| **R1: Contract parity TS↔Rust diverge silenciosamente** | 🔴 Crítico | Fase 0+1 | Golden files: mesmos fixtures JSON → mesmo output em ambos os lados. Todo PR que muda schema atualiza os dois. |
| **R2: flutter_rust_bridge não entrega ou gera overhead inaceitável** | 🔴 Crítico | Fase 2 (slice inicial) | Primeira fatia valida FFI pura (read/write de 1 registro). Se falhar, o projeto para aqui. |
| **R3: SQLite schema TS≠Rust** | 🟡 Alto | Fase 1 | Extrair DDL para `.sql` compartilhado. TS e Rust leem o mesmo arquivo. |
| **R4: Sync merge diverge (LWW determinístico)** | 🟡 Alto | Fase 1 | Portar `stamp.ts`/`merge.ts` como funções puras Rust. Testar com os mesmos fixtures JSON do TS. |
| **R5: Flutter desktop build/CI quebra** | 🟢 Médio | Fase 2+6 | CI separada para Flutter desktop. Não bloqueia mobile. |
| **R6: Catálogo (.db) leitura incorreta** | 🟢 Médio | Fase 1 | `cecistudy-content` abre o `.db` gerado pelo pipeline Node — schema já é SQLite estável. |
| **R7: Google Calendar OAuth em Rust** | 🟢 Baixo | Fase 3 (módulo) | Implementação isolada em `cecistudy-integrations`. Não afeta其他 módulos. |
| **R8: Dual maintenance TS↔Rust** | 🟡 Custo | Contínuo | Aceitar conscientemente. Reavaliar quando desktop estiver estável (possível unificação via Rust no mobile). |

---

## 2. Estratégia de Fatias Verticais

### Princípio: Contract-First → Risk-First → Vertical-First

```
Fase 0: Congelar contrato (sem código de produto)
  ↓  (valida R1, R3, R4)
Fase 1: Núcleo Rust puro (sem UI, sem FFI)
  ↓  (valida R1完全, R4完全)
Fase 2: Bridge + Flutter mínimo
  ↓  (valida R2)
Fase 3: Módulo por módulo
  ↓  (valida R7 quando chegar em Calendar)
Fase 4: Interoperabilidade real
  ↓  (valida sync TS↔Rust)
Fase 6: Empacotamento + corte do Tauri
```

Cada fase tem **fatias internas** detalhadas abaixo.

---

## 3. Fase 0 — Congelar o Contrato (Sem Código de Produto)

### Objetivo
Extrair a verdade canônica para formato compartilhável e criar golden files que servem como gate de paridade cross-língua.

### Fatias

#### Fase 0.1 — Extrair DDL para `.sql` versionado
- **O quê:** Pegar `src/lib/db/migrations/user.ts` (319 linhas de `CREATE TABLE`) e exportar como `contracts/user-schema-v1.sql`.
- **Por quê:** Rust e TS precisam ler o MESMO DDL. Hoje o DDL está hardcoded num módulo TS.
- **Aceitação:** `contracts/user-schema-v1.sql` existe, é idêntico ao DDL de `user.ts`, e pode ser `cat` puro (sem lógica TS).
- **Rollback:** deletar o arquivo (nada mudou no código existente).

#### Fase 0.2 — Formalizar backup v2 como spec
- **O quê:** Criar `contracts/backup-spec.md` documentando o shape completo de `PersistedDatabase` (todas as 25+ coleções, campos obrigatórios vs opcionais, tipos). Extrair de `packages/data/src/backupSchema.ts` e `src/data/empty.ts`.
- **Aceitação:** spec documenta cada coleção com tipos, presence/optionality, e exemplos JSON.
- **Rollback:** deletar o arquivo.

#### Fase 0.3 — Criar golden fixtures
- **O quê:** Criar `contracts/fixtures/` com JSONs de cada coleção (mínimo 1 item realista por coleção + 1 vazio). Usar o `emptyDatabase()` como base e popular com dados que cubram todos os campos.
- **Aceitação:** Fixture `golden-db.json` serializa um `PersistedDatabase` completo; `golden-stamp.json` serializa um `SyncIndex` com registros, tombstones e stamps.
- **Rollback:** deletar diretório.

#### Fase 0.4 — Teste de paridade TS
- **O quê:** Escrever teste em `packages/data/src/__tests__/golden.test.ts` que lê os fixtures, passa pelo `backupDataSchema` (Zod), e garante round-trip (serialize → deserialize → serialize = idêntico).
- **Aceitação:** `npm run test` passa com o golden test.
- **Rollback:** remover o teste.

#### Fase 0.5 — Documentar capacidades como spec formal
- **O quê:** Criar `contracts/capabilities-spec.md` espelhando `packages/domain/src/core/domain/capabilities.ts` — matriz `{entity, platform, canView, canCreate, canEdit, canDelete, projection}`.
- **Aceitação:** spec lista todas as 18 entradas da matriz padrão.
- **Rollback:** deletar.

**Custo estimado:** 1-2 dias. Zero código de produto alterado.

---

## 4. Fase 1 — Núcleo Rust (Sem UI, Sem FFI)

### Objetivo
Portar toda lógica de domínio, dados e sync para Rust como crates independentes, validados por testes que batem com os golden files da Fase 0.

### Estrutura do workspace Cargo

```
cecistudy-rust/
├── Cargo.toml           (workspace)
├── contracts/           (copiado do root contracts/)
│   ├── user-schema-v1.sql
│   └── fixtures/
├── crates/
│   ├── cecistudy-domain/
│   ├── cecistudy-data/
│   ├── cecistudy-content/
│   ├── cecistudy-sync/
│   ├── cecistudy-integrations/   (futuro)
│   └── cecistudy-app/
```

### Fatias

#### Fase 1.1 — Workspace + crate domain (entidades puras)
- **O quê:** Criar workspace Cargo. Crate `cecistudy-domain` com:
  - `common.rs` — `EntityId`, `Platform`
  - `ids.rs` — `makeId(prefix)` (porta de `ids.ts`)
  - `capabilities.rs` — `PlatformCapability`, `capabilityFor()`, `DEFAULT_CAPABILITIES`
  - `workspace.rs` — `Workspace`, `WorkspaceKind`, `WorkspaceSettings`
- **Aceitação:** `cargo test` passa. Structs usam `serde::Serialize + Deserialize`. `capabilityFor("document", "desktop")` retorna `canView: true, projection: "rich"`.
- **Rollback:** `git rm -r cecistudy-rust/crates/cecistudy-domain` + remove do workspace.

#### Fase 1.2 — Domain: calendar
- **O quê:** `calendar.rs` — `CalendarEvent`, `RecurrenceRule`, `Occurrence`, `Responsibility`, `Subtask`, `PlanningBlock`, `ExecutionRecord`, `CommitmentLevel`, `CalendarItemStatus`, `ModuleOrigin`, `SourceRef`. Porta literal de `calendar.ts` (118 linhas).
- **Aceitação:** Structs + enums + `createResponsibility()` funciona como o TS. Testes unitários.
- **Rollback:** remover o arquivo.

#### Fase 1.3 — Domain: knowledge + marketing + projects
- **O quê:** Portar `knowledge.ts`, `marketing.ts`, `projects.ts` em 3 arquivos separados.
  - `knowledge.rs`: `Document`, `Block`, `Relation`, `Suggestion`, `AssociationPolicy`, `LearningState` + factory functions.
  - `marketing.rs`: `PositioningProfile`, `ContentIdea`, `ContentBase`, `ChannelVariant`, `Publication`, `MetricSnapshot`, `StrategicInsight` + `createContentBase()`.
  - `projects.rs`: `Project`, `AcademicNode`, `Output`, `Reference`, `Citation`, `canAddProject()`, `createProject()`.
- **Aceitação:** Todos os tipos portados. `createProject("tcc")` gera árvore padrão com 4 capítulos. `canAddProject` limita a 5 ativos. Testes unitários.
- **Rollback:** remover arquivos.

#### Fase 1.4 — Domain: serializar golden fixtures em Rust
- **O quê:** Teste de integração que desserializa `contracts/fixtures/golden-db.json` em structs Rust e re-serializa — output idêntico ao input (round-trip).
- **Aceitação:** `cargo test golden_round_trip` passa. Campo a campo, o JSON bate.
- **Rollback:** remover o teste.

#### Fase 1.5 — Crate data: SQLite + migrações
- **O quê:** Crate `cecistudy-data` com:
  - `schema.rs` — DDL carregado de `contracts/user-schema-v1.sql` (compilado via `include_str!`).
  - `migrations.rs` — `SCHEMA_VERSION = 13`, `MIGRATIONS` (porta de `schema.ts`). Sequent migrator.
  - `connection.rs` — Wrapper `rusqlite::Connection` com WAL mode.
  - `repository.rs` — Traits `Repository<T>` com `find_all`, `find_by_id`, `save`, `delete`.
  - `models.rs` — Structs de persistência (colunas normalizadas + `data_json`), espelhando o DDL.
- **Aceitação:** Abre um SQLite novo, aplica o DDL, insere e lê um `Course`. Round-trip com `data_json` preserva campos legados.
- **Rollback:** remover crate.

#### Fase 1.6 — Crate data: backup export/import
- **O quê:** `backup.rs` — `export_backup(db) -> BackupPayload`, `import_backup(json, db)`. Validação serde (equivalente ao Zod). Migração de versão (porta de `MIGRATIONS` do TS).
- **Aceitação:** `import_backup(golden-db.json)` → `export_backup()` = JSON idêntico. Migração de versão N→N+1 funciona.
- **Rollback:** remover módulo.

#### Fase 1.7 — Crate data: sync index + merge
- **O quê:** `sync_index.rs` + `merge.rs` — porta de `stamp.ts` e `merge.ts` como funções puras:
  - `applyStampChange`, `recordTs`, `tombstoneTs`, `mergeIndexes`, `tieBreak`, `maxStamp`
  - `mergeSyncedDatabases`, `mergeRecordCollection`, `pickLww`
- **Aceitação:** Mesmos fixtures TS produzem mesmo resultado Rust. Testes de merge com:
  - Dois bancos idênticos → merge = idêntico
  - Local tem registro extra → merge mantém
  - Local deletou, remote editou → tombstone vence
  - Timestamps iguais → `tieBreak` determinístico
- **Rollback:** remover módulos.

#### Fase 1.8 — Crate sync: protocolo + provider GitHub
- **O quê:** `cecistudy-sync` com:
  - `protocol.rs` — `SyncManifest`, `SyncPackage`, `SyncProvider` trait, `SyncProviderError`, `hashContent` (FNV-1a).
  - `engine.rs` — `SyncEngine` (porta de `engine.ts`): `inspect`, `pullAndMerge`, `push`.
  - `providers/github.rs` — `GitHubSyncProvider` (porta de `github.ts`): usa `reqwest` em vez de `fetch`.
- **Aceitação:** `hashContent("hello")` = mesmo valor do TS. `SyncEngine` com mock provider: pull+merge+push funciona.
- **Rollback:** remover crate.

#### Fase 1.9 — Crate content: leitura do catálogo
- **O quê:** `cecistudy-content` — abre o `.db` do catálogo (`public/assets/databases/`) como somente-leitura. Queries para abordagens, questões, obras, conceitos, autores, técnicas.
- **Aceitação:** Abre `cecistudy_conceitos.db`, lista 225 conceitos. Abre `cecistudy_questoes.db`, conta 3002 questões.
- **Rollback:** remover crate.

#### Fase 1.10 — Crate app: façade mínima
- **O quê:** `cecistudy-app` — orquestra domain+data+sync+content. Expõe `AppService` com:
  - `init_db(path) -> Result<()>`
  - `list_courses() -> Vec<Course>`
  - `save_course(course) -> Result<()>`
  - `export_backup() -> Result<String>`
  - `import_backup(json) -> Result<()>`
  - `sync_pull() -> Result<MergeResult>`
  - `sync_push() -> Result<()>`
  - `list_concepts() -> Vec<TempleConcept>` (lê do .db)
- **Aceitação:** `cargo test` passa. `AppService` abre DB, salva curso, exporta backup, importa de volta,sync round-trip.
- **Rollback:** remover crate.

**Custo estimado:** 2-3 semanas. Validates R1, R3, R4 completamente.

---

## 5. Fase 2 — Bridge + Flutter Mínimo

### Objetivo
Provar que `flutter_rust_bridge` funciona ponta a ponta: Flutter chama Rust, Rust devolve dados, Flutter renderiza. Menor superfície possível.

### Fatias

#### Fase 2.1 — Bootstrap Flutter desktop
- **O quê:** Criar `apps/desktop-flutter/` com `flutter create`. Configurar build para Linux (esta máquina). Hello world.
- **Aceitação:** `flutter run -d linux` abre janela com "Hello cecistudy".
- **Rollback:** deletar diretório.

#### Fase 2.2 — Integrar cecistudy-rust via flutter_rust_bridge
- **O quê:** Adicionar `flutter_rust_bridge` ao projeto. Configurar `bridge_generated.dart` a partir de `cecistudy-app`. Gerar bindings.
- **Aceitação:** `flutter_rust_bridge_codegen generate` produz `bridge_generated.dart`. Compila sem erros.
- **Rollback:** remover integração.

#### Fase 2.3 — Primeira chamada FFI: init_db + list_courses
- **O quê:** Expor `AppService::init_db` e `AppService::list_courses` via FFI. Flutter abre DB vazio, lista cursos (0), escreve 1 curso via Rust.
- **Aceitação:** Tela mostra "0 disciplinas". Após ação, mostra 1 disciplina. Dados persistidos no SQLite.
- **Rollback:** remover features.

#### Fase 2.4 — Ler catálogo (read-only)
- **O quê:** Expor `AppService::list_concepts` (lê do .db embutido). Flutter renderiza lista simples de 225 conceitos.
- **Aceitação:** Tela mostra conceitos do catálogo. Scroll funciona. Dados batem com o `.db`.
- **Rollback:** remover features.

#### Fase 2.5 — Backup round-trip via bridge
- **O quê:** Expor `export_backup` e `import_backup`. Flutter: botão "exportar" gera JSON, botão "importar" aplica.
- **Aceitação:** Exportar → JSON válido. Importar → dados restaurados. Round-trip idêntico.
- **Rollback:** remover features.

**Custo estimado:** 1-2 semanas. Validates R2 completely.

---

## 6. Fase 3 — Módulo por Módulo

### Ordem: complexidade crescente, risco decrescente

Cada módulo segue o padrão:
1. Expor operações Rust via `cecistudy-app`
2. Gerar bindings FFI
3. Implementar tela Flutter
4. Testar round-trip com mobile (via export/import)

#### Fase 3.1 — Home (saudação + métricas)
- **Rust:** `list_tasks_today()`, `streak_count()`, `list_exams_upcoming()`
- **Flutter:** Tela equivalente à `HomeView.tsx`
- **Custo:** 2-3 dias

#### Fase 3.2 — Faculdade (disciplinas + detalhe)
- **Rust:** CRUD completo de `Course`, `ClassNote`, `Exam`, `Task`
- **Flutter:** Grade de disciplinas, CourseDetail
- **Custo:** 3-4 dias

#### Fase 3.3 — Estudos (pomodoro + flashcards + leituras)
- **Rust:** CRUD `StudySession`, `Flashcard`, `ReadingItem`
- **Flutter:** Timer, cards, lista de leitura
- **Custo:** 3-4 dias

#### Fase 3.4 — Biblioteca (catálogo + notas avulsas)
- **Rust:** `list_catalog_books()`, CRUD `LooseNote`, `MaterialItem`, `PsychologyAuthor/Concept`
- **Flutter:** Shelves, cards, busca
- **Custo:** 3-4 dias

#### Fase 3.5 — Perfil + Settings
- **Rust:** CRUD `UserProfile`, `Sticker`, `StreakData`, `ReminderSettings`
- **Flutter:** Tela de perfil, personalização
- **Custo:** 2 dias

#### Fase 3.6 — Calendário (MVP grade)
- **Rust:** CRUD `CalendarEvent`, `RecurrenceRule`, `Occurrence`
- **Flutter:** Grade semanal, drag/resize
- **Custo:** 5-7 dias (complexo: drag interaction, recorrência)

#### Fase 3.7 — Calendário (recorrência completa)
- **Rust:** Engine de recorrência (daily/weekly/monthly + count/end)
- **Flutter:** Edição de regras, preview de ocorrências
- **Custo:** 3-4 dias

#### Fase 3.8 — Conhecimento (Docs)
- **Rust:** CRUD `Document`, `Block`, `Relation`, `Suggestion`
- **Flutter:** Grafo visual + editor de blocos
- **Custo:** 5-7 dias (grafo visual é complexo)

#### Fase 3.9 — Marketing
- **Rust:** CRUD `PositioningProfile`, `ContentIdea`, `ContentBase`, `ChannelVariant`, `Publication`
- **Flutter:** Studio completo
- **Custo:** 4-5 dias

#### Fase 3.10 — Projetos/TCC (MVP 1: projetos + árvore)
- **Rust:** CRUD `Project`, `AcademicNode` (sem editor de documento ainda)
- **Flutter:** Lista de projetos + árvore acadêmica
- **Custo:** 3-4 dias

#### Fase 3.11 — Projetos/TCC (MVP 2: editor de blocos)
- **Rust:** CRUD `Document` (já existe em Conhecimento), `Block`
- **Flutter:** Editor paginado simples
- **Custo:** 4-5 dias

#### Fase 3.12 — Projetos/TCC (MVP 3: referências + ABNT)
- **Rust:** CRUD `Reference`, `Citation`, formatação ABNT
- **Flutter:** Inserção de citações, preview ABNT
- **Custo:** 5-7 dias (ABNT é complexo)

#### Fase 3.13 — Projetos/TCC (MVP 4: export DOCX)
- **Rust:** Geração DOCX (crate `docx-rs` ou similar)
- **Flutter:** Botão export + preview
- **Custo:** 3-4 dias

#### Fase 3.14 — Google Calendar (auth + sync)
- **Rust:** OAuth flow, mapeamento ID, sync bidirecional, conflito
- **Flutter:** Apenas UI de conflito (manter_cecistudy / manter_google)
- **Custo:** 5-7 dias

**Custo estimado total Fase 3:** 6-8 semanas.

---

## 7. Fase 4 — Interoperabilidade Real

### Fatias

#### Fase 4.1 — Export mobile → import desktop
- **O quê:** Usuária exporta backup no app antigo (React+Capacitor) → importa no Flutter desktop. Usar exatamente a rotina validada na Fase 0/1.
- **Aceitação:** Backup gerado pelo React é lido corretamente pelo Rust. Todos os dados aparecem.
- **Custo:** 1-2 dias (já testado, mas precisa de UI).

#### Fase 4.2 — Sync via GitHub provider
- **O quê:** Desktop usa `GitHubSyncProvider` em Rust para sync com mobile. Mesmo repo, mesmo path.
- **Aceitação:** Editar no desktop → sync → ver no mobile. Editar no mobile → sync → ver no desktop. Merge LWW funciona.
- **Custo:** 2-3 dias.

#### Fase 4.3 — Validação cross-platform
- **O quê:** Bateria de testes manuais + automatizados que provam round-trip completo: desktop→sync→mobile→sync→desktop.
- **Aceitação:** Todos os dados preservados. Nenhum campo perdido. Tombstones respeitados.
- **Custo:** 1-2 dias.

**Custo estimado:** 1 semana.

---

## 8. Fase 6 — Empacotamento + Corte do Tauri

### Fatias

#### Fase 6.1 — Build Flutter desktop (3 plataformas)
- **O quê:** Configurar CI para `flutter build linux/windows/macos`. Gerar instaladores.
- **Aceitação:** Binários geram para as 3 plataformas. App abre e funciona.
- **Custo:** 2-3 dias.

#### Fase 6.2 — Notificações + auto-update
- **O quê:** `flutter_local_notifications` para lembrete diário. Auto-update via GitHub Releases (mesmo mecanismo do Tauri).
- **Aceitação:** Lembrete dispara no horário. Atualização baixa e aplica.
- **Custo:** 2-3 dias.

#### Fase 6.3 — Migrar usuárias existentes
- **O quê:** Documentar fluxo: exportar no Tauri → importar no Flutter. Script auxiliar opcional.
- **Aceitação:** Fluxo documentado e testado. Uma usuária consegue migrar sozinha.
- **Custo:** 1 dia.

#### Fase 6.4 — Remover Tauri + apps/desktop
- **O quê:** Deletar `desktop/` (Tauri) e `apps/desktop` (React). Atualizar CI.
- **Aceitação:** Build mobile continua funcionando. Build desktop novo funciona.
- **Custo:** 1 dia.

**Custo estimado:** 1 semana.

---

## 9. Estratégia de Rollback por Fase

### Fase 0: Sem risco
- Arquivos novos em `contracts/`. Código existente não alterado. Deletar = rollback.

### Fase 1: Sem risco
- Diretório novo `cecistudy-rust/`. Código TS existente não alterado. Deletar = rollback.

### Fase 2: Baixo risco
- `apps/desktop-flutter/` é diretório novo. `desktop/` (Tauri) continua intacto.
- Se Flutter não funcionar, Tauri continua sendo o desktop.

### Fase 3: Médio risco (por módulo)
- Cada módulo é uma adição incremental. Se um módulo falhar, os anteriores continuam.
- **Rollback por módulo:** remover a tela Flutter, manter o Rust (útil para outras telas).
- **Rollback total:** voltar ao Tauri (não removido até Fase 6).

### Fase 4: Baixo risco
- Sync é feature adicional. Se não funcionar, export/import manual continua.

### Fase 6: ALTO risco (irreversível)
- **NÃO remover Tauri até:**
  1. Flutter desktop compila e roda nas 3 plataformas
  2. Todos os módulos implementados
  3. Sync com mobile validado
  4. Pelo menos 1 usuária migrou com sucesso
- **Rollback:** `git revert` da remoção. Tauri volta a existir.

---

## 10. Feature Flags / Build-Time Switches

### Durante o desenvolvimento

```rust
// Rust: feature flags do Cargo
[features]
default = ["desktop"]
desktop = []
mobile-compat = []  // compatibilidade com mobile
```

```dart
// Flutter: constantes de build
const kPlatform = String.fromEnvironment('PLATFORM', defaultValue: 'desktop');
const kEnableCalendar = true;  // toggle por módulo
```

### Coexistência Tauri ↔ Flutter

```bash
# Build do Tauri (continua funcionando)
cd desktop && npm run build

# Build do Flutter (novo)
cd apps/desktop-flutter && flutter build linux

# São binários independentes — não conflitam
```

### Switch de default (quando Flutter estiver pronto)

```yaml
# CI: .github/workflows/release-desktop.yml
# Trocar o default de Tauri para Flutter
strategy:
  matrix:
    include:
      - runner: ubuntu-latest
        build: flutter  # era: tauri
```

---

## 11. Resumo: Primeiras 10 Fatias Verticais

| # | Fatia | Fase | O que entrega | Critério de aceite | Custo |
|---|---|---|---|---|---|
| 1 | Extrair DDL para `.sql` | 0.1 | Contrato compartilhado | SQL puro, idêntico ao TS | 0.5 dia |
| 2 | Golden fixtures + teste TS | 0.3+0.4 | Fixture JSON + round-trip test | `npm run test` passa | 0.5 dia |
| 3 | Domain Rust: common+ids+capabilities | 1.1 | Primeiro crate compila | `cargo test` passa, serde funciona | 1 dia |
| 4 | Domain Rust: calendar | 1.2 | Calendário portado | Structs + factory + testes | 1 dia |
| 5 | Domain Rust: knowledge+marketing+projects | 1.3 | 3 módulos portados | Todos os tipos + factories + testes | 2 dias |
| 6 | Data Rust: SQLite + backup round-trip | 1.5+1.6 | Persistência funcional | Open→write→read→export→import→compare | 2 dias |
| 7 | Sync Rust: merge + GitHub provider | 1.7+1.8 | Sync completa em Rust | Golden fixtures batem, merge determinístico | 2 dias |
| 8 | Flutter: bootstrap + primeira FFI | 2.1-2.3 | App abre, lê/escreve DB | Tela mostra dados reais do Rust | 2 dias |
| 9 | Flutter: Home + Faculdade | 3.1+3.2 | 2 telas funcionais | Dados persistem, navega funciona | 5 dias |
| 10 | Export/import mobile↔desktop | 4.1 | Interoperabilidade | Backup TS é lido pelo Rust, vice-versa | 1 dia |

**Total primeiras 10 fatias:** ~16 dias (~3 semanas).

---

## 12. Checklist de Validação por Fase

### Fase 0 ✓
- [ ] `contracts/user-schema-v1.sql` existe e é idêntico ao DDL TS
- [ ] `contracts/fixtures/golden-db.json` cobre todas as 25+ coleções
- [ ] `npm run test` passa com golden round-trip test
- [ ] `contracts/capabilities-spec.md` documenta matriz completa

### Fase 1 ✓
- [ ] `cargo test` passa (todos os crates)
- [ ] `golden_round_trip` test: fixtures TS → structs Rust → JSON idêntico
- [ ] `merge_deterministic` test: mesmos inputs → mesmos outputs em TS e Rust
- [ ] `hash_content` test: FNV-1a em Rust = FNV-1a em TS
- [ ] SQLite: open → DDL → insert → read → export → import → compare
- [ ] Sync engine: pullAndMerge + push com mock provider

### Fase 2 ✓
- [ ] `flutter run -d linux` abre janela
- [ ] `flutter_rust_bridge` gera bindings sem erro
- [ ] init_db → list_courses retorna 0
- [ ] save_course → list_courses retorna 1
- [ ] export_backup → JSON válido
- [ ] import_backup do golden → dados corretos

### Fase 3 ✓ (por módulo)
- [ ] Operações CRUD completas via FFI
- [ ] Tela renderiza dados reais
- [ ] Dados persistem entre reinícios
- [ ] Round-trip com mobile (export/import) funciona

### Fase 4 ✓
- [ ] Backup do React é lido pelo Rust
- [ ] Sync GitHub funciona: desktop→mobile e mobile→desktop
- [ ] Merge LWW preserva dados dos dois lados

### Fase 6 ✓
- [ ] Build Linux/macOS/Windows funciona
- [ ] Notificações disparam
- [ ] Auto-update baixa e aplica
- [ ] Tauri removido sem quebrar mobile

---

## 13. Decisões Recomendadas

| Decisão | Recomendação | Justificativa |
|---|---|---|
| **Parar rebuild visual React** | Sim, parar agora em `calendario/conhecimento/marketing/projetos` | Já serão redesenhados em Flutter. `shell/navegação/faculdade` servem de referência visual. |
| **flutter_rust_bridge** | Sim, usar | Rust concentra toda lógica. Flutter só desenha. FFI é a ponte natural. |
| **Ordem de módulos** | Home→Faculdade→Estudos→Biblioteca→Calendário→Conhecimento→Marketing→TCC | Complexidade crescente, permite validar Flutter com telas simples primeiro. |
| **Remoção do Tauri** | Só na Fase 6, após validação completa | Rollback viável até o último momento. |

---

## 14. Dependências Técnicas Necessárias

### Rust
- `rusqlite` ou `sqlx` (SQLite)
- `serde` + `serde_json` (serialização)
- `reqwest` (HTTP para GitHub sync)
- `thiserror` (erros tipados)
- `chrono` (datas)
- `docx-rs` (export DOCX, Fase 3.13)

### Flutter Desktop
- Flutter 3.x com suporte desktop
- `flutter_rust_bridge` ^2.x
- `riverpod` ou `bloc` (estado efêmero)
- `go_router` (navegação Flutter)

### Build
- Rust toolchain (já disponível nesta máquina Linux)
- Flutter SDK (precisa instalar)
- CI: GitHub Actions com matrix (ubuntu/macos/windows)
