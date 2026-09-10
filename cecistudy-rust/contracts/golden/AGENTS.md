# Golden files (F0.4) — cecistudy

Paridade **byte-a-byte** entre TypeScript (web/mobile) e Rust (desktop) sobre os dados
persistidos. Todos os arquivos são **canonical JSON v1**
(`cecistudy-rust/docs/canonical-json-v1.md`): chaves alfabéticas, strings NFC, números
ECMAScript `Number::toString` (sem `.0`), arrays na ordem original.

| Arquivo | Conteúdo |
|---|---|
| `full_backup.empty.json` | envelope BackupV2 do estado zerado (exportedAt fixo) |
| `full_backup.sample.json` | envelope BackupV2 do estado cênico (`src/data/fixtures/goldenSample.ts`) |
| `collections/empty/<collection>.json` | payload de cada coleção do estado vazio |
| `collections/sample/<collection>.json` | payload de cada coleção do estado cênico |

## Regenerar (sempre que `goldenSample.ts` ou o schema mudar)

```bash
GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts
```

Depois **revise o diff** — os arquivos são o contrato dos testes de paridade Rust
(`cecistudy-rust/tests/golden_parity_test.rs`, Fase 1).

## Contrato relacionado

- Envelope/payload: `cecistudy-rust/contracts/backup-v2-spec.md`
- Versões: `SCHEMA_VERSION`/`USER_SCHEMA_VERSION` em `packages/data/src/schema.ts`
  (refletidas no header de `cecistudy-rust/contracts/schema.sql`).
- Chaves do payload = `buildBackupData` de `packages/data/src/persistentData.ts`
  (banco persistido **menos** bancos estáticos `approaches`/`questions`).

> ⚠️ Nunca editar um golden na mão sem regenerar — diff deve vir só da fonte.