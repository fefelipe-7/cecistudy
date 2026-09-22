# Backup & Sync – Spec Consolidada

## 1. Visão geral
Backup manual v2 + sincronização via GitHub como storage dumb. Contrato cross-língua em `cecistudy-rust/contracts/backup-v2-spec.md`.

## 2. Estado atual
* Envelope `cecistudy-user-backup` v2 em `packages/data/src/exportImport.ts`
* Export físico em `src/lib/exportFile.ts` – web download, nativo Filesystem + Share
* Import via `DataClientProvider` com validação Zod
* Sync GitHub em `packages/sync/src/providers/github.ts` – arquivo único `cecistudy/sync-package.json` com CAS por sha
* UI: `DataSection.tsx` + `GithubSyncCard.tsx` + `SyncScreen.tsx` pausado
* OTA mobile ok, desktop separado

## 3. Limitações
Segurança PAT sem criptografia, arquivo único, UX de config manual, P2P pausado, UI inconsistente desktop.

## 4. Fases de implementação

### Fase 1 – UX base
* Preview de import com versão/schema/contagem de coleções
* Lista de backups locais no nativo
* Mensagens por plataforma

### Fase 2 – Segurança e qualidade
* Criptografia opcional do backup com senha derivada
* GithubSyncCard com histórico e status detalhado

### Fase 3 – Integração plataforma
* OAuth Device Code para GitHub
* Adaptar UI desktop (novo, Flutter+Rust)

### Fase 4 – Documentação
* Guia usuário e ops

## 5. Critérios de aceite
`npm run lint` + `npm run test` + `npm run build` verdes. Contrato v2 preservado.
