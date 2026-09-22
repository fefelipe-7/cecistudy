# cecistudy-rust — AGENTS

> Núcleo desktop (Rust) do cecistudy. Regras de workspace Cargo, convenções e
> contrato cross-língua. Mobile (TS) continua em `src/`/`packages/`.

## Comandos & Verificação
- `cargo build` · `cargo test` · `cargo fmt` · `cargo clippy`.
- **Gate obrigatório:** `cargo clippy --all-targets --all-features -- -D warnings`
  + `cargo fmt --check` + `cargo test`. Em mudanças que tocam contrato:
  re-rodar os testes de paridade TS (`GOLDEN_WRITE=1` só p/ regenerar) e o
  `crates/cecistudy-common/tests/golden_parity_test.rs`.
- Ferramenta: Node 22+ (não usar `sqlite3` CLI — pode não existir; usar
  `node:sqlite`/`verify-schema.mjs`).

## Estrutura
```
cecistudy-rust/            ← workspace Cargo (resolver 2)
├── contracts/             ← CONTRATO (fonte da verdade, cross-língua)
│   ├── schema.sql         DDL canônico user+catalog (versionado no header)
│   ├── backup-v2-spec.md  formato `cecistudy-user-backup`
│   ├── golden/            fixtures canonical JSON v1 (gerados pelo TS)
│   └── verify-schema.mjs  valida schema.sql
├── crates/
│   ├── cecistudy-common/  ids, timestamps, erros, canonicalize() ── BASE
│   ├── cecistudy-domain/  entidades + invariantes (porta de packages/domain)
│   ├── cecistudy-data/    SQLite (rusqlite single-writer), migrações, repos
│   ├── cecistudy-content/ catálogo .db read-only
│   ├── cecistudy-sync/    stamp/merge LWW + provider GitHub
│   ├── cecistudy-app/     casos de uso (única superfície p/ FFI)
│   ├── cecistudy-ffi/     bridge flutter_rust_bridge  🔲 planejado (não existe)
│   └── cecistudy-integrations/ Google Calendar (OAuth installed-app) 🔲 planejado (não existe)
├── docs/                  canonical-json-v1.md ✅ (architecture, domain-port-guide, sync AINDA não existem)
├── crates/*/tests/        golden_parity_test.rs (common), migration_parity_test.rs (data),
│                         repositories_test.rs, backup_roundtrip_test.rs (via cargo)
└── Cargo.toml
```

> **Status (2026-09-12):** workspace + `common/domain/data/content/sync/app` implementados
> (Fase 1, **21/23**). `cecistudy-ffi` e `cecistudy-integrations` ainda **não existem** — são os
> próximos passos (ver `spec/01-task-breakdown-flutter-rust.md`). `cecistudy-common`
> **continua a existir** como crate-base (ids/timestamps/erros/canonicalize) — NÃO foi absorvido;
> módulos de domínio `calendar/knowledge/marketing/projects/internship` **portados** (R2, spec-first);
> `cecistudy-data` migrado a **entidades tipadas** (R1 — forma via `schema.sql`) com fronteira tipada
> de load/save, embora ainda exponha `data_json` (remoção na superfície = **R4**; content renome =
> **R3**). Gate atual: `cargo clippy -D warnings` ✓ · `cargo fmt --check` ✓ ·
> **162 testes** ✓.
>
> ⚠️ **Diretriz 2026-09-12:** o desktop novo **NÃO usa nada do React/JS como base** — implementar
> domain/data **spec-first** a partir de `contracts/` (schema.sql + golden + backup-v2-spec). Os pacotes
> TS (`packages/*`) são só **oráculo de paridade** via golden files; não copiar estrutura do TS.

## Regras
- **crates NUNCA importam Flutter/React.** FFI (bridge) só em `cecistudy-ffi`/`cecistudy-app`.
- **Contrato duro:** após Fase 0, o que vale é `contracts/` — mudanças exigem
  regenerar golden + re-validar nos dois lados (nunca só num lado).
- **Canonical JSON v1** é a serialização de comparação/hash (ver `docs/canonical-json-v1.md`);
  backups usam `backup-v2-spec.md`. Nunca comparar JSON "cru" (`serde_json::to_string`
  não é canônico).
- **SQLite:** `rusqlite` single-writer; migrações embutidas no cronograma do schema.sql.
- `rust-toolchain.toml` fixa a toolchain 1.98; não subir manualmente sem CI alinhado.
- Estilo: `rustfmt.toml` (100 col, 2 spaces) + clippy sem warnings.