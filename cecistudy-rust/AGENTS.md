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
│   ├── cecistudy-integrations/ Google Calendar (OAuth installed-app)
│   ├── cecistudy-app/     casos de uso (única superfície p/ FFI)
│   └── cecistudy-ffi/     bridge flutter_rust_bridge
├── docs/                  architecture, domain-port-guide, sync, canonical-json
├── tests/                 golden_parity_test.rs, migration_runner_test.rs
└── Cargo.toml
```

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