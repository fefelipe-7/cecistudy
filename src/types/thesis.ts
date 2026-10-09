// Stub de compat (SPEC-012 F1.4). O TCC é **regra de domínio**, não glue de
// apresentação: o dono é `packages/domain`, e este arquivo só reexporta para os
// importadores existentes (`from '../../types'`) não mudarem de um dia para outro.
//
// Por que existiu aqui: entre 2026-10-07 (spec) e a fase 1 da spec, os tipos
// do TCC viviam em `src/types/profile.ts` (`TccData`). Viraram domínio quando o
// módulo `thesis` entrou, e a regra é uma só (fonte única).
//
// **Regra de ouro:** o re-export é **relativo**. Nunca `@/packages/...` — o
// alias `@/*` resolve `./src/*` primeiro e **não** cai em `./packages/*`, então
// compila no `tsc` e quebra no Vite.

export * from '../../packages/domain/src/core/domain/thesis';
