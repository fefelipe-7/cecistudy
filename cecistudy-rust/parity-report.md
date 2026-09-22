# Parity Report

**Generated:** 2026-09-12

## Cargo tests

- ✅ `cargo test --workspace` passed (162 tests total)

### Test results per crate

- `cecistudy-common`: 23 passed
- `cecistudy-domain`: 14 passed
- `cecistudy-data`: 1 passed
- `cecistudy-content`: 7 passed
- `cecistudy-sync`: 25 passed
- `cecistudy-app`: 3 passed
- `golden_parity_test`: 5 passed
- `migration_parity_test`: 2 passed
- `repositories_test`: 28 passed
- `collections_test`: 20 passed
- `backup_roundtrip_test`: 4 passed
- `domain_parity_test`: 30 passed

## Golden parity

- `cecistudy-common::tests::golden_parity_test::golden_files_sao_canonical_v1_no_rust` ✅
- All golden files in `contracts/golden/` are canonical JSON v1 compliant (TS ↔ Rust)

## Notes

- R4 scope: parity full validation (F1.22) + removal of public `data_json` exposure is **partially addressed** by typed `Collection` frontier (R1b). Generic repositories remain internal; public API now prefers typed load/save via `Collection`.
- Next step: hide generic `load_collection`/`save_collection` from public exports or deprecate them, and ensure `parity-test.sh` is Windows-friendly (PowerShell).
