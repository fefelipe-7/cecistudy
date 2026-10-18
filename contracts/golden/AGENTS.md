# Golden files (F0.4) — cecistudy

Contrato **byte-a-byte** dos dados persistidos do mobile (`ADR-009`): os testes
de golden e de migração comparam o resultado das implementações TS contra estes
arquivos. Todos são **canonical JSON v1** (`../canonical-json-v1.md`): chaves
alfabéticas, strings NFC, números ECMAScript `Number::toString` (sem `.0`),
arrays na ordem original.

O oráculo Rust que os verificava em paralela (`golden_parity_test.rs`, Fase 1)
é **histórico**: o workspace Flutter+Rust foi removido pela
[`ADR-008`](../../../AGENTS.md), e estes arquivos são, desde F0 0.1, o contrato
do mobile.

| Arquivo | Conteúdo |
|---|---|
| `full_backup.empty.json` | envelope BackupV2 do estado zerado (exportedAt fixo) |
| `full_backup.sample.json` | envelope BackupV2 do estado cênico (`src/data/fixtures/goldenSample.ts`) |
| `canonical_hash_vectors.json` | vetores de canonicalização + SHA-256 com known answers |
| `migrations/NN.json` | payload legado v1 após cada migração, versão a versão |
| `collections/empty/<collection>.json` | payload de cada coleção do estado vazio |
| `collections/sample/<collection>.json` | payload de cada coleção do estado cênico |

## Regenerar (sempre que `goldenSample.ts` ou o schema mudar)

```bash
GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts
MIGRATION_WRITE=1 npm run test -- src/lib/__tests__/migrationFixtures.test.ts
```

Depois **revise o diff** — os arquivos são o contrato dos testes
(`src/lib/__tests__/goldenFixtures.test.ts` e `migrationFixtures.test.ts`).

## Contrato relacionado

- Envelope/payload: `../backup-v2-spec.md`
- Versões: `SCHEMA_VERSION`/`USER_SCHEMA_VERSION` em `packages/data/src/schema.ts`
  (refletidas no header de `../schema.sql`).
- Chaves do payload = `buildBackupData` de `packages/data/src/persistentData.ts`
  (banco persistido **menos** bancos estáticos `approaches`/`questions`).

> ⚠️ Nunca editar um golden na mão sem regenerar — diff deve vir só da fonte.
