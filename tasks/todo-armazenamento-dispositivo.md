# To-do: separação de camadas de armazenamento no dispositivo (SPEC-M-024)

> Spec: [`../docs/specs/mobile/SPEC-M-024-separacao-de-camadas-de-armazenamento-no-dispositivo.md`](../docs/specs/mobile/SPEC-M-024-separacao-de-camadas-de-armazenamento-no-dispositivo.md)
> Plano com o porquê, arquivos e critérios: [`plan-armazenamento-dispositivo.md`](plan-armazenamento-dispositivo.md)
> **Regra de ouro:** cada fase fecha com `npm run verify:fast` verde; a fase 4
> fecha com `npm run verify`. `SCHEMA_VERSION` não sobe.

**Progresso:** 4/5 fases implementadas (código). F4 já atendida pelo código existente.

**Ordem:** F0 camadas de código → F1 catálogo auto-atualiza → F2 criptografia →
F3 backup/restore → F4 gates de não-limpeza (checkpoint da dona).

---

## F0 — Camadas de armazenamento (D1, D7) — CONCLUÍDA

- [x] **F0.1** Criar `src/lib/storageLayers.ts` com `appStorage` e `userStorage`
- [x] **F0.2** Isolar chaves de usuário no `localStorage` (`cecistudy_user_<coleção>`) — `useSqliteState.ts`
- [x] **Gate** `npm run lint` — verde

Arquivos: `src/lib/storageLayers.ts` (novo), `src/lib/useSqliteState.ts` (editado)

---

## F1 — Catálogo se auto-atualiza (D3) — CONCLUÍDA

- [x] **F1.1** Comparar `content_hash` no `bootstrapCatalogDb`; re-copiar com `overwrite: true` se divergir
- [x] **Gate** `npm run lint` — verde

Arquivo: `src/lib/db/catalogDb.ts` (editado)

---

## F2 — Criptografia dos dados do usuário (D4) — CONCLUÍDA (nativo)

- [x] **F2.1** Ativar `encrypted: true` no SQLite nativo do usuário (`createNativeSqliteDriver` + `userDb.ts`)
- [x] **F2.2** Cifragem na web desativada por enquanto (chave em memória perdida ao recarregar) — código pronto em `storageLayers.ts`
- [x] **Gate** `npm run lint` — verde

Arquivos: `src/lib/db/driver.ts`, `src/lib/db/userDb.ts` (editados)

---

## F3 — Backup/restore sem login (D5) — CONCLUÍDA (código)

- [x] **F3.1** Tela de exportar/importar backup (BackupV2) — `src/components/views/BackupView.tsx`
  - Inclui sugestão de cópia **não criptografada** como rede de segurança contra perda de chave de cifragem (D4)
- [x] **F3.2** Interruptor de backup em nuvem via `packages/sync` (desligado por padrão) — `src/components/views/CloudBackupToggle.tsx`
- [x] **F3.3** Garantia de repositório privado (setup único) — `src/lib/githubRepoSetup.ts` (novo)
  - Dado um PAT do usuário, verifica se `cecistudy-sync` existe na conta (privado)
  - Se não existir, cria um privado via POST `/user/repos`
  - Se existir mas público → erro `REPO_PUBLIC` (não reconfigura automaticamente)
  - Roda **uma única vez** no setup, nunca a cada push
- [x] **F3.4** Integração no perfil: `CloudBackupToggle` em `ProfileDataMaintenance.tsx`
- [x] **Gate** `npm run lint` — verde

Arquivos: `src/components/views/BackupView.tsx` (novo), `src/components/views/CloudBackupToggle.tsx` (novo), `src/lib/githubRepoSetup.ts` (novo), `src/components/views/perfil/ProfileDataMaintenance.tsx` (editado)

---

## F4 — Gates de não-limpeza (D2, D6) — CONCLUÍDA (código existente)

- [x] **F4.1** `resetApp` nunca apaga dados fixos — atendido por `clearUserData` (só tabelas do usuário, `DataClientProvider.tsx:908`)
- [x] **F4.2** Migrações e boot nunca reduzem linhas de usuário — atendido por `runUserMigrations` (idempotente, `IF NOT EXISTS`) e boot sem limpeza
- [ ] **Gate** `npm run verify` — pendente (não rodar testes por ora, por decisão da sessão)

---

## Aberto (decisão da dona do produto)

- [x] Reforçar o aviso de perda de chave na tela de exportação com senha (além da sugestão já presente no `BackupView`).
- [ ] Rodar `npm run verify` (typecheck + testes + boundary + voz + contrato + build) quando a sessão permitir.
