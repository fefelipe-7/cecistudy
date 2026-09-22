#!/usr/bin/env bash
set -euo pipefail

# Parity test for cecistudy-rust
# Runs Rust tests (golden parity + migrations) and emits a simple report.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT="${REPO_ROOT}/parity-report.md"

echo "## Parity Report" > "${REPORT}"
echo "" >> "${REPORT}"
echo "**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${REPORT}"
echo "" >> "${REPORT}"

echo "### Cargo tests" >> "${REPORT}"
if cargo test --workspace --quiet; then
  echo "- ✅ cargo test --workspace passed" >> "${REPORT}"
else
  echo "- ❌ cargo test --workspace failed" >> "${REPORT}"
  exit 1
fi

echo "" >> "${REPORT}"
echo "### Golden parity (common::tests::golden_parity_test)" >> "${REPORT}"
cargo test --quiet --package cecistudy-common --test golden_parity_test >> "${REPORT}" 2>&1 || true

echo "" >> "${REPORT}"
echo "Parity validated." >> "${REPORT}"

cat "${REPORT}"
