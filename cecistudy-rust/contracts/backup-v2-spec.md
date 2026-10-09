# Backup v2 — spec do contrato (cecistudy)

> Formato canônico **`cecistudy-user-backup`** (v2) para exportação/importação,
> migração e sincronização entre web/mobile (TypeScript) e desktop (Rust).
> Contrato **duro**: o payload é a fonte da verdade para o que o Rust importa/exporta.
>
> Fonte da verdade no código: `packages/data/src/exportImport.ts` (envelope),
> `packages/data/src/persistentData.ts` (payload), `packages/data/src/backupSchema.ts`
> (validação Zod), `packages/data/src/schema.ts` (versões/migrações).
> Lands: `cecistudy-rust/contracts/golden/` (fixtures). Status: **aprovada** (2026-09-10).

## 1. Envelope

Um backup v2 é um único objeto JSON:

```jsonc
{
  "format": "cecistudy-user-backup",
  "formatVersion": 1,
  "userSchemaVersion": 1,
  "schemaVersion": 13,            // opcional em backups antigos; presente desde v2
  "catalogRelease": null,         // sempre null: catálogo NÃO é embutido no backup
  "exportedAt": "2026-09-10T12:00:00.000Z", // ISO 8601 UTC
  "payload": { /* coleções da §2 */ }
}
```

| Campo | Tipo | Regras |
|---|---|---|
| `format` | `string` | fixo `cecistudy-user-backup`. Outro → rejeitado. |
| `formatVersion` | `number` | fixo `1`. Outro → rejeitado. |
| `userSchemaVersion` | `number` | versão do schema da usuária (≠ catálogo). `1`. |
| `schemaVersion` | `number?` | versão do schema de dados no export. `null`/ausente = backup antigo (sem migração). Presente e **> atual** → rejeitado (app desatualizado); **< atual** → migração §4. |
| `catalogRelease` | `string \| null` | sempre `null` aqui. Identifica o release do catálogo quando um dia existir. |
| `exportedAt` | `string` | ISO 8601 UTC do export. **Não** é fonte de LWW. |
| `payload` | `object` | coleções da §2. Coleções ausentes são toleradas (default). |

## 2. Payload — coleções

`buildBackupData` = banco persistido **menos os bancos estáticos** `approaches`/`questions`
(catálogos embutidos, re-semeados sob demanda — exportá-los inflaria o arquivo ~2 MB).

Todas as coleções são **opcionais** no envelope (`backupDataSchema.partial()`); quando
presentes são validadas por forma (Zod, `.passthrough()` preserva campos legados):

| Coleção (`payload.<key>`) | Elemento | Campos validados (forma mínima) |
|---|---|---|
| `profile` | objeto | `name, semester, totalSemesters, university, targetCareer, dailyQuote, stickersCollected` |
| `courses` | array | `id, name, professor, semester, schedule[{day 0-6, start, end?}], color, icon` |
| `classes` | array | `id, courseId, title, number, date, summary` |
| `tasks` | array | `id, title, completed, priority, category` |
| `exams` | array | `id, courseId, title, date, weight, topics[], completed` |
| `authors` | array | `id, name, bio` |
| `concepts` | array | `id, name, definition, authorIds[], courseIds[], tags[]` |
| `readings` | array | `id, title, author, type, status` |
| `flashcards` | array | `id, question, answer` |
| `materials` | array | `id, title, type, author, tags[], addedAt` |
| `internshipLogs` | array | `id, type, date, hours, activity, reflections` |
| `supervision` | array | legado (type `SupervisionNotebook`, Fase 12): `id, date, questions[], conceptIds[], referenceIds[], nextSteps[]` |
| `tcc` | objeto | `title, advisor, field, problemStatement, objectives[], status, chapters[{title, completed, dueDate?}], references[]` |
| `stickers` | array | `id, name, emoji, description, unlocked, category` |
| `sessions` | array | `id, topic, date, durationMinutes` |
| `streakData` | objeto | `activeDays[]` |
| `reminder` | objeto | `enabled, time` |
| `looseNotes` | array | `id, title, content, category, date` |
| `savedBookIds` | array de string | ids de obras favoritas (catálogo) |
| `bookmarkedCourseIds` | array de string | favoritos de disciplinas |
| `readingProgress` | record<string, number> | `{ bookId: páginas lidas }` |
| `techniques` | array | `id, name, description` |
| `quizSessions` | array | `id, config{...}, answers[{questionId, userAnswer, correct, timeMs, question}], startedAt, finishedAt, totalTimeMs, correctCount, totalCount, scorePct, createdAt` |
| `onboarding` | objeto | `completed` |
| `syncIndex` | objeto opcional | `{stamps?, records?, tombstones?}` (ver §5) |

### 2.1 Invariantes

- Campos **não listados** na tabela, se presentes, passam intactos (`.passthrough()`).
- `approaches`/`questions` **nunca** são exportados nem lidos do payload.
- Caso uma coleção presente falhe a validação → backup inteiro rejeitado (nunca parcial).

## 3. Import (roteiro)

1. `JSON.parse` — falha → `null`.
2. `format === 'cecistudy-user-backup'` e `formatVersion === 1` — senão → `null`.
3. `payload` é objeto — senão → `null`.
4. `schemaVersion`:
   - ausente → sem migração;
   - `> SCHEMA_VERSION` → `null` (app desatualizado);
   - `< SCHEMA_VERSION` → `migrateDatabase(schemaVersion, payload)`; migração falha → `null`.
5. Validação Zod `backupDataSchema.safeParse(payload)` — falha → `null`.
6. `{ ...emptyDatabase(), ...validated.data }`. Apps antigos recebem defaults das
   coleções ausentes.

Um backup **nunca** se aplica parcialmente (não substitui o estado antes da validação).

## 4. Migrações de schema (`MIGRATIONS`)

As `MIGRATIONS` do `packages/data/src/schema.ts` são **closures sobre o payload JSON** (não
SQL). Uma migração `i` (índice 1..13) transforma payloads da versão `i` até `i+1`; a sequência
inteira eleva o backup até a versão atual. Detalhes de cada passo vivem no código —
esta spec referencia **obrigatoriamente** via fixtures de migração v1→v13 nas golden.

## 5. `syncIndex` (carimbos de sincronização)

`stamps`/`records`/`tombstones` mapeiam `coleção` → `(registro → epoch ms)` da última
alteração por dispositivo. Não são timestamps nas entidades — vivem num mapa paralelo
mantido pela camada de persistência (`useStampedState`). Viajam no backup como campo
opcional (backups antigos não o têm). Regras de merge/LWW são do pacote `sync` (Fase Sync).

## 6. Serialização física

- Arquivo persistido como **JSON compacto, UTF-8, sem BOM** (`JSON.stringify`).
- Para **comparação/determinismo** (testes, content hash de sync) usar o
  **Canonical JSON v1** — ver `cecistudy-rust/docs/canonical-json-v1.md`.
- Golden fixtures que implementam/verificam este contrato em
  `cecistudy-rust/contracts/golden/` (byte-a-byte iguais em TS e Rust).

## 7. Compatibilidade

- **v2** (deste contrato) ↔ **v1** (formato `cecistudy-user-backup` antigo): `importAppDatabase`
  aceita envelopes sem `userSchemaVersion`/`catalogRelease` e com `schemaVersion` antigo
  (migra). Rugos: backups **futuros** são recusados.
- O catálogo (questões/abordagens/templo) tem **release próprio** e não participa do backup.