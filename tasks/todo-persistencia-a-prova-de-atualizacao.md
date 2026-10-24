# To-do: persistência a prova de atualização e reinstalação (SPEC-M-026)

> Spec: [`../../docs/specs/mobile/SPEC-M-026-persistencia-a-prova-de-atualizacao-e-reinstalacao.md`](../../docs/specs/mobile/SPEC-M-026-persistencia-a-prova-de-atualizacao-e-reinstalacao.md)
> Substitui: [`todo-armazenamento-dispositivo.md`](todo-armazenamento-dispositivo.md)
> **Regra de ouro:** cada fase fecha com `npm run verify:fast` verde. Se
> `npm run typecheck` falhar por dívida de outra spec, registre e rode as
> etapas restantes — não conserte fora do escopo.
> **Ordem:** parar a perda (F0) → dono do dado (F1) → catálogo (F2) → cifra
> (F3) → backup (F4) → sync (F5).

**Progresso:** 2/6 fases (F0 e F1 fechadas; F0.1 depende de aparelho).

**Critério de conclusão da spec:** o app sobrevive a (a) OTA, (b) reinstalação
com snapshot local, (c) reinstalação com export manual em aparelho novo, sem
perder dado da usuária e sem esconder conteúdo fixo.

---

## F0 — Parar a perda silenciosa (D3, D9, I1)

- [ ] **F0.1** Reproduzir no aparelho: forçar erro de leitura de uma coleção e
      confirmar que a coleção é zerada. Este é o teste que valida A1 fora do
      laboratório. **Pendente: exige aparelho.**
- [x] **F0.2** `useSqliteState`: hidratação com três estados; `falhou` não marca
      hidratado e não libera o write-through. Registrar em `getStorageHealth()`.
      Feito: `catch` no lugar do `finally`, `reportStorageHealth(key, e)`.
- [x] **F0.3** `completeOnboarding`: gravar só o perfil, sem
      `applyDatabase(emptyDatabase())`.
- [x] **F0.4** Regra nova em `.github/scripts/check-boundaries.mjs`: nenhum
      arquivo fora de `resetApp` chama `clearUserData`, `localStorage.clear` ou
      `Preferences.clear`. Feito com `maxOccurrences` (ratchet por arquivo).
- [x] **F0.5** Testes: `src/lib/__tests__/useSqliteState.erro.test.ts`,
      `src/context/__tests__/onboarding.naoApaga.test.tsx`. Ambos verificados
      contra o código antigo: falham quando a correção é revertida.

Arquivos: `src/lib/useSqliteState.ts`, `src/context/DataClientProvider.tsx`,
`.github/scripts/check-boundaries.mjs`, `src/lib/storageLayers.ts`.

**Gate:** `npm run test` + `npm run check:boundaries`.

---

## F1 — Dono do dado, migração e transação (D1, D13, D2)

- [x] **F1.1** `storageLayers.ts`: remover a cifra XOR e a `appStorage`. Feito
      **apagando**, não renomeando: `appStorage` nunca teve consumidor e o
      prefixo `cecistudy_` já é o namespace do aparelho em `storage.ts` — criar
      `deviceStorage` seria um segundo nome para a mesma coisa.
      `getStorageHealth()` exposto.
- [x] **F1.2** Mover para `cecistudy_user_` as chaves de usuária que hoje vivem
      em `cecistudy_`: `onboarding`, `reminder`, `syncCheckpoint`,
      `githubSyncConfig`. Feito por parâmetro `namespace` em
      `usePersistentState` (padrão `'device'`). `deviceId`, tema, hash do
      catálogo e último preload ficam no prefixo do aparelho.
- [x] **F1.3** Migração de prefixo (nativo e web): feita **preguiçosa**, na
      primeira leitura da chave, sem varredura de boot. A chave antiga **não** é
      removida — some no `resetApp`. Remover exigiria confirmação de escrita, e
      uma chave morta custa bytes.
- [x] **F1.4** `runUserMigrations`: `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK` por
      passo; snapshot lógico (dump de todas as tabelas em JSON) antes do primeiro
      passo pendente, em `Directory.Data/backups/pre-migracao.json`. Snapshot que
      falha **impede** a migração. Arquivo único, sobrescrito — sem rotação.
- [x] **F1.5** Testes: `src/lib/__tests__/storageLayers.prefixo.test.ts`,
      `src/lib/db/__tests__/migrations.transacao.test.ts`. O teste de atomicidade
      insere linha antes do passo 4 e confere que ela sobrevive ao `ROLLBACK`;
      falha se a transação for removida (verificado).

Arquivos: `src/lib/storageLayers.ts`, `src/lib/storage.ts`,
`src/lib/db/migrations.ts`, `src/lib/usePersistentState.ts`.

**Gate:** `npm run verify:fast` + abrir o app nativo já instalado e confirmar
que nenhuma preferência antiga sumiu (onboarding não reabre, lembrete continua).

---

## F2 — Catálogo: conferir contra o manifesto e nunca devolver vazio (D4, D5, I6)

- [ ] **F2.1** `catalogDb.ts`: comparar `assets/databases/version.json`
      (`contentHash`) com `catalog_release.content_hash` da cópia local; copiar
      quando ausente ou diferente. Substituir a comparação atual (`:94-111`).
- [ ] **F2.2** Verificação pós-cópia: `PRAGMA integrity_check` + contagem das
      tabelas do manifesto. Em divergência persistente, registrar
      `catalogSkewHash` e não recopiar até o manifesto mudar.
- [ ] **F2.3** `getCatalogStatus()` e exposição em Configurações → Sobre.
- [ ] **F2.4** `templeData.ts` e `catalogLibrary.ts`: cair para as facades JS
      quando `getCatalogDb()` devolve `null`; parar de memorizar `[]` em
      `authorsCache` e irmãos.
- [ ] **F2.5** `release.yml`: excluir `assets/databases/*.db` do zip do OTA e
      falhar o release se ainda houver `.db` no zip.
- [ ] **F2.6** Testes: `src/lib/db/__tests__/catalogManifest.test.ts`,
      `src/lib/__tests__/templeFallback.test.ts`.

Arquivos: `src/lib/db/catalogDb.ts`, `src/lib/templeData.ts`,
`src/lib/catalogLibrary.ts`, `.github/workflows/release.yml`,
`src/components/views/perfil/` (Sobre).

**Gate:** `npm run db:verify` + `npm run test` + `find dist -name '*.db'
-size +1M` vazio depois de `npm run build:web`.

---

## F3 — Senha da usuária, modo sem senha e backup do SO (D6, D12)

- [ ] **F3.1** Tela de escolha no primeiro uso: criar senha ou seguir sem senha,
      com a consequência escrita na própria escolha.
- [ ] **F3.2** `driver.ts`/`userDb.ts`: `setEncryptionSecret({ passphrase })` antes
      de `createConnection` quando há senha e `isSecretStored()` é falso (repetir
      lança); segredo aleatório explicitamente marcado como "só neste aparelho"
      quando não há. Base existente com segredo do aparelho migra no lugar, sem
      exportar e importar.
- [ ] **F3.3** Troca de senha via `changeEncryptionSecret`, sem reexportar o
      banco.
- [ ] **F3.4** Banco ilegível (segredo perdido): detectar com
      `isDatabaseEncrypted`, explicar, **não apagar**, oferecer import de backup.
- [ ] **F3.5** Android: `dataExtractionRules` + `fullBackupContent` excluindo
      `databases/` e o arquivo do segredo SQLCipher.
- [ ] **F3.6** Teste de que a senha nunca é gravada em claro e de que o modo sem
      senha não tenta abrir banco de outro aparelho.

Arquivos: `src/lib/db/driver.ts`, `src/lib/db/userDb.ts`,
`src/components/views/perfil/`, `android/app/src/main/AndroidManifest.xml`,
`android/app/src/main/res/xml/`.

**Gate:** `npm run verify:fast` + teste em aparelho: instalar, criar senha,
matar o app, reabrir (sem prompt), e conferir `adb` que o banco está cifrado.

---

## F4 — Backup em três destinos e restauração sem perda (D7, D8, D14)

- [ ] **F4.1** Snapshot local em `Directory.Data/backups/`, rotação de três,
      disparado no boot depois da hidratação e antes de migração.
- [ ] **F4.2** Export manual reaproveita `BackupV2` e `encryptBackup`; nada de
      formato paralelo.
- [ ] **F4.3** `importAppDatabase`: recusar backup com coleção faltando e
      devolver a lista; aplicar em transação; snapshot de segurança antes;
      desfazer depois.
- [ ] **F4.4** Backup leva `schemaVersion` e `userSchemaVersion`; import recusa
      versão futura e versão ambígua.
- [ ] **F4.5** Boot com base vazia e snapshot recente abre restauração em vez
      do onboarding.
- [ ] **F4.6** Testes: `packages/data/src/__tests__/importIncompleto.test.ts`,
      teste de rotação do snapshot.
- [ ] **F4.7** Incluir no payload as coleções do Conhecimento — `workspaces`,
      `relations`, `suggestions`, `associationPolicies`, `projects`, `outputs`
      (A15). Hoje elas vivem só em Preferences
      (`src/context/DataClientProvider.tsx:727-749`) e **não** estão em
      `PersistedStateSnapshot` nem no backup: reinstalar apaga o que ela criou.
      Exige bump de `SCHEMA_VERSION`, entrada em `MIGRATIONS`, `backupSchema` e
      seed em `empty.ts`.

Arquivos: `packages/data/src/exportImport.ts`, `src/lib/exportFile.ts`,
`src/lib/backupLocal.ts` (novo), `src/components/views/perfil/ProfileDataMaintenance.tsx`,
`src/context/DataClientProvider.tsx`.

**Gate:** `npm run verify:fast` + teste em aparelho: exportar, desinstalar,
reinstalar, importar, conferir contagem por coleção antes e depois.

---

## F5 — Identidade do repositório e token (D10, D11)

- [ ] **F5.1** `datasetId` gerado no primeiro uso, gravado no payload e em
      `cecistudy/dataset.json`.
- [ ] **F5.2** Push recusa `datasetId` diferente do marcador; primeiro push
      escreve o marcador; repositório sem marcador pede confirmação explícita.
- [ ] **F5.3** PAT cifrado com a senha da usuária; nuvem desabilitada e
      explicada no modo sem senha.
- [ ] **F5.4** Testes: `packages/sync/src/__tests__/datasetId.test.ts`,
      teste de configuração de sync cifrada.

Arquivos: `packages/sync/src/provider.ts`,
`packages/sync/src/providers/github.ts`, `src/lib/githubRepoSetup.ts`,
`src/context/DataClientProvider.tsx`.

**Gate:** `npm run verify:fast` + dois aparelhos apontando para o mesmo
repositório: o segundo recusa antes de escrever.

---

## Pendências declaradas que não entram aqui

| Pendência | Dono |
|---|---|
| Unificar `USER_SCHEMA_VERSION` (`1` vs `4`, débito C2) | `SPEC-M-004` |
| Persistência do desktop (mesma investigação, outro contrato) | spec própria, ADR-009 |
| Apagar o `.db` do catálogo e servir tudo das facades | decisão da dona do produto; candidata a spec |
| Teste em aparelho de cada fase | gate de release, não de PR |
