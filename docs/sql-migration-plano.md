# Plano de implementação — SQLite + catálogo modular

> Plano conciso e acionável derivado de `docs/sql-migration.md`, confrontado com o código atual.
> **Status: ✅ Fases A–F implementadas (2026-08-23).** Gate: `npm run lint` + `npm run test`
> (341 testes) + `npm run build` + `db:verify` + `content:check` verdes.
>
> **Histórico:** a camada `src/lib/db/` original nunca chegou a ser commitada — só existiu na
> máquina que gerou o primeiro `.db`. Em 2026-08-23 ela foi **reconstruída do zero**: DDL do
> catálogo extraído do próprio `cecistudy_catalog.db`, superfície das APIs deduzida dos
> scripts consumidores e schema da usuária reescrito conforme este plano. A rebuild do
> catálogo corrigiu um drift de hash (as fontes haviam evoluído após a build de 20/08):
> manifesto e banco agora consistentes (`0bc2a5d7bf06…`).

## 0. Verificação do diagnóstico no código atual

| Proposta do doc | Estado atual | Confirmado |
|---|---|---|
| Coleções em chaves `cecistudy_*` independentes, sem transação | 25 `usePersistentState` em `AppContext.tsx` (profile…looseNotes) | Sim |
| Questões: JSON monolítico no estado | `bancoQuestoes.ts` (745 q) → seed lazy no estado persistido `questions` | Sim |
| Abordagens: ~1.1MB gerado em TS | `psicoterapiaApproaches.ts` (97), via `scripts/build-psicoterapia.mjs` de `library/cecistudy_base_psicoterapias/entregas/` | Sim (já há pipeline, não relacional) |
| Livros/artigos paralelos a `ReadingItem` | `libraryData.ts` + `src/data/books/` (150+100+150, facade `index.ts`) | Sim |
| Backup JSON versionado + Zod | `exportImport.ts` + `backupSchema.ts` + `schema.ts` (SCHEMA_VERSION 7) | Sim (base a preservar) |
| Preferences como banco do domínio nativo | `storage.ts` dual; `@capacitor/preferences` guarda TODO o domínio | Sim |

## 1. Decisões confirmadas

1. **Plugin:** `@capacitor-community/sqlite` (comunitário). **Sem FTS5 na v1** — FTS fica para uma
   fase futura (busca unificada) e não bloqueia a migração.
2. **Web/PWA:** continua sendo JSON (`usePersistentState`/`localStorage`). **SQLite é nativo-only**;
   `sql.js` (wasm) é usado em **scripts Node e testes vitest** (mesma interface de driver). O web
   NÃO muda de comportamento.
3. **Fonte de `content/`:** builder converte as fontes existentes (`bancoQuestoes.ts`,
   `psicoterapiaApproaches.ts`/`psicoterapiaFamilies.ts`, `src/data/books/*.json` + `families.ts`) —
   sem reescrever conteúdo à mão. O facade web (`books/index.ts`) continua a fonte da verdade das
   obras na web; o catálogo SQLite replica o mapeamento de forma determinística (testado via hash).
4. **Escopo:** implementar A→F de uma vez, mas com fases verificáveis. **Biblioteca (obras) entra no
   catálogo agora** (tabela `work`), mas a troca de consumo da `BibliotecaView` para o catálogo no
   nativo fica como follow-up documentado (a view segue usando o facade JS também no nativo — já é
   embutido).
5. **Sem sync/cripto na v1:** backup local (`exportImport.ts` v2) continua a proteção; SQLCipher e
   nuvem ficam para depois.
6. **Backup:** v2 (`cecistudy-user-backup`) **somente** — sem import do formato JSON v7 antigo. O
   catálogo não é exportado (release próprio); só IDs preservados.

## 2. O que foi implementado

### Fase A — Fundação: drivers + migrações + repositórios
- `src/lib/db/driver.ts` — interface `SqlDriver`/`SqlRow`/`SqlValue`/`RunResult` +
  `createNativeSqliteDriver(database, setup?)` (import dinâmico do plugin; **browser-safe**).
- `src/lib/db/sqlJsDriver.ts` — `createSqlJsDriver()` (Node/vitest; `exportDb()`). **Não entra no
  bundle** (ninguém no app importa).
- `src/lib/db/migrations/user.ts` — `USER_SCHEMA_VERSION = 1` + schema normalizado completo
  (profile, course+course_schedule, class_note+class_note_link, task+task_link,
  assessment+assessment_topic, study_session, flashcard, quiz_session+quiz_answer, reading+
  reading_highlight, reading_progress, author, concept+concept_course+concept_author, material,
  technique, note+note_link, internship+internship_concept+internship_topic, thesis_project+
  thesis_chapter+thesis_reference, achievement+user_achievement, saved_catalog_item, streak,
  activity_event, schema_migrations, legacy_import_map + índices). **Sem foreign keys** — o modelo
  é save por coleção independente (uma transação por coleção); índices cobrem as buscas.
- `src/lib/db/migrations.ts` — runner numerado + `runUserMigrations` + `getAppliedVersion`.
- `src/lib/db/normalize.ts` — `USER_COLLECTION_KEYS` (21), `saveCollection`/`loadCollection`/
  `loadAllCollections`; `Course.schedule` → `course_schedule`; relações em join tables; conteúdo
  livre em JSON; `activity_event` para tasks concluídas e sessions; `saved_catalog_item`
  compartilhado (`book`/`course`) com escopo por tipo.

### Fase B — Catálogo modular (`content/`) + pipeline
- `content/content-data.mjs` (fontes + mapeamento + hash), `content/build-catalog.mjs`,
  `content/check-content.mjs`, `content/diff-content.mjs`, `content/report-content.mjs`,
  `content/catalog-version.json` (release `2026.08.20.1`), `content/last-build.json`.
- Saída: `public/assets/databases/cecistudy_catalog.db` (3 MB) + `version.json` (manifesto com
  hash). O `.db` embutido no bundle nativo via `public/` → `cap sync` (copiado para android/ios).
- `src/lib/db/catalogSchema.ts` (schema do catálogo compartilhado) + `src/lib/db/catalogDb.ts`
  (`createNativeCatalogDriver` com `isDBExists`→`copyFromAssets`→readonly; singleton
  `getCatalogDb()`; `getApproaches`/`getQuestions`/`getReleaseInfo`).
- Scripts npm: `content:build|check|report|diff`, `db:verify`, `db:legacy-import`.

### Fase C — Banco da usuária + import legado
- `src/lib/db/userDb.ts` — `createUserDb(driver, {runLegacyImport})` (boot + migrações + import
  legado uma vez) e singleton `getUserDb()` (null no web).
- `src/lib/db/legacyImport.ts` — `importLegacyCollections(driver, keys, readSource?)` (resolver
  injetável p/ scripts), `hasLegacyImport`, `removeLegacyKeys`.
- `scripts/db-legacy-import.mjs` — dry-run: dump JSON `cecistudy_*` → `cecistudy_user` em arquivo.
- `scripts/db-verify.mjs` — integridade do catálogo embutido + consistência com o manifesto.

### Fase D/E — Integração no app + backup v2
- `src/lib/useSqliteState.ts` — hook de estado persistente: **web delega a `usePersistentState`**;
  nativo hidrata de `userDb`/catálogo e grava write-through serializado por coleção.
- `AppContext.tsx` — chaves de domínio trocadas para `useSqliteState`; `reminder`/`onboarding`
  seguem em Preferences; seeds lazy de questões/abordagens viram **web-only** (nativo lê do
  catálogo); `ensureQuestionsLoaded` consulta o catálogo no nativo; `resetApp` limpa o SQLite +
  chaves legadas; `exportData` async.
- `src/lib/exportImport.ts` — **backup v2** (`cecistudy-user-backup`): `buildBackupPayload` async
  (metadata + payload via `backupDataSchema`), `importAppDatabase` (rejeita formatos antigos),
  `previewBackup`, `exportAppDatabase` (download web / share sheet nativo).
- Testes: `src/lib/db/__tests__/userDb.test.ts` (27 testes: migrações, round-trips por coleção,
  import legado, tabela compartilhada), `exportImport.test.ts` reescrito p/ v2 (15 testes).

## 3. Roadmap resumido

| Ordem | Entrega | Resultado |
|---|---|---|
| A | Drivers + migrações + repositórios | ✅ `src/lib/db/` (driver.ts, sqlJsDriver.ts, migrations.ts, normalize.ts) |
| B | `content/` + builder + catálogo SQLite | ✅ Catálogo embutido (3 MB), verificado (`db:verify`) |
| C | Banco da usuária normalizado | ✅ `cecistudy_user` com **22 coleções** (+ `techniques`) |
| D | Import legado (dry-run + no boot nativo) | ✅ `legacyImport.ts` + limpeza das chaves após import completo |
| E | `useSqliteState` + backup v2 | ✅ Web intacto; nativo hidrata do SQLite com write-through; resetApp limpa a base |
| F | Biblioteca nativa lendo do catálogo | ✅ `catalogDb.ts` + `catalogLibrary.ts`; BibliotecaView usa curadoria compartilhada (`books/curate.ts`); facade estático segue como fallback |

> FTS de busca unificada permanece como follow-up (fora do escopo v1).

## 4. Riscos e adaptações

- **Web/PWA continua intacto:** SQLite é nativo-only; web mantém JSON (`usePersistentState`).
- **FTS5:** adiado (plugin comunitário não garante). Busca unificada fica para depois do modelo
  local estabilizar.
- **Bundle:** `psicoterapiaApproaches.ts`/`bancoQuestoes.ts` continuam lazy no web; no nativo vêm
  do catálogo (mais rápido e menor).
- **Nativo:** plugin SQLite exige nova build nativa (fora do OTA) — alinhar com o próximo release.
- **Obras da biblioteca:** o catálogo já tem `work` (262 obras), mas a `BibliotecaView` segue no
  facade JS também no nativo; a troca é follow-up (F).
- **Migrações:** como `USER_SCHEMA_VERSION = 1` ainda não saiu em build nativa, o schema pode ser
  editado livremente; depois de publicado, mudanças exigem nova migração numerada.

## 5. Preservar do código atual

- `backupSchema.ts` (Zod) valida o `payload` do backup v2.
- `persistentData.ts` (`PersistedDatabase`/`readDatabaseFromState`/`buildBackupData`) como contrato
  do snapshot exportado.
- `scripts/build-psicoterapia.mjs` como referência de geração (o builder de `content/` generaliza o
  padrão "fonte bruta → artefato").
- `SCHEMA_VERSION`/`MIGRATIONS` (`schema.ts`) permanecem no código para compatibilidade de leitura,
  mas o backup v2 não depende deles.