# Plano: separação de camadas de armazenamento no dispositivo (SPEC-M-024)

> Spec que rege: [`../docs/specs/mobile/SPEC-M-024-separacao-de-camadas-de-armazenamento-no-dispositivo.md`](../docs/specs/mobile/SPEC-M-024-separacao-de-camadas-de-armazenamento-no-dispositivo.md)
> Espelho de grupo: [`../../docs/specs/mobile/SPEC-M-024-separacao-de-camadas-de-armazenamento-no-dispositivo.md`](../../docs/specs/mobile/SPEC-M-024-separacao-de-camadas-de-armazenamento-no-dispositivo.md)
> To-do: [`todo-armazenamento-dispositivo.md`](todo-armazenamento-dispositivo.md)
> Data: 2026-10-23

## Regras do plano

1. **Uma fase por vez.** Cada fase fecha com o gate verde, não com "quase".
2. **Nenhuma fase sobe `SCHEMA_VERSION`.** O valor mora no código
   (`packages/data/src/schema.ts:13`). Mudar schema de usuário exige passo de
   migração novo e entrada em `MIGRATIONS` — só se a fase exigir.
3. **Gate do ciclo de edição:** `npm run verify:fast` (typecheck + testes +
   boundary + voz + contrato). **Gate completo:** `npm run verify`. Rodar
   `npm run check:boundaries` **antes** de tocar `packages/*`, `src/shells` ou
   `src/overlays`.
4. **Deleção só com prova.** Símbolo só sai depois de `rg` mostrar zero
   chamador — não por parecer morto.
5. **Um commit por tarefa**, citando a decisão (`D7`, `D3`, `D4`, ...).

## Ordem e por quê

```
Fase 0  camadas de código (D1 D7)        risco: baixo
Fase 1  catálogo se auto-atualiza (D3)   risco: baixo
Fase 2  criptografia dos dados do user   (D4)   risco: médio
Fase 3  backup/restore sem login (D5)    risco: baixo
Fase 4  gates de não-limpeza (D2 D6)     risco: médio ← checkpoint
```

Fase 0 primeiro porque é a fundação: sem a separação de namespaces, nada mais
fica provável de quem é dono de quê. Fase 4 é o checkpoint: é onde provamos que
boot/OTA nunca apagam dados do usuário e que `resetApp` nunca toca o fixo.

---

## Fase 0 · Camadas de armazenamento (D1, D7)

**Entrega:** `src/lib/storageLayers.ts` com namespaces `appStorage` e
`userStorage`; dados do usuário no `localStorage` usam chaves
`cecistudy_user_<coleção>`; nada de comportamento muda ainda.

### T0.1 · Criar `src/lib/storageLayers.ts` (D1)

- **Arquivos:** `src/lib/storageLayers.ts` (novo).
- **O que muda:** exporta `appStorage` e `userStorage`, cada um com `get`,
  `set`, `remove` (mesma assinatura de `storage.ts`). `appStorage` lê/grava em
  chaves `cecistudy_app_<chave>` (reservado para dados fixos, ainda não usado);
  `userStorage` lê/grava em `cecistudy_user_<chave>` (dados do usuário).
- **Aceite:** `appStorage` e `userStorage` existem e têm `get`/`set`/`remove`;
  importar o módulo não quebra o bundle.
- **Verificação:** `npm run lint` (typecheck) + `npm run test` (suíte inteira).
- **Depende de:** —
- **Tamanho:** S

### T0.2 · Isolar chaves de usuário no localStorage da web (D7)

- **Arquivos:** `src/lib/storage.ts` (prefixo já é `cecistudy_`); ajustar
  chamadores de `useSqliteState`/`usePersistentState` para usar `userStorage`
  com sufixo `_user_` quando for dado do usuário.
- **O que mudar:** dados do usuário gravados no `localStorage` passam a ter
  chave `cecistudy_user_<coleção>` (ex.: `cecistudy_user_profile`);
  dados fixos, se algum dia entrarem no `localStorage`, usam `cecistudy_app_`.
- **Aceite:** `rg "cecistudy_user_" src --glob '!*.test.*'` encontra as chaves
  de usuário; nenhuma chave de dado fixo usa `cecistudy_user_`.
- **Verificação:** `npm run verify:fast`.
- **Depende de:** T0.1
- **Tamanho:** M

**Gate da fase:** `npm run verify:fast`.

---

## Fase 1 · Catálogo se auto-atualiza (D3)

**Entrega:** `catalogDb.ts` compara `content_hash` do `catalog_release` do `.db`
armazenado com o do bundle; se divergir, re-copia com `overwrite: true`.

### T1.1 · Comparar `content_hash` no bootstrap do catálogo (D3)

- **Arquivos:** `src/lib/db/catalogDb.ts` (`bootstrapCatalogDb`).
- **O que muda:** após `copyFromAssets`, ler `catalog_release` do `.db` armazenado
  e do `.db` no bundle/assets; se o hash divergir (ou banco ausente/corrompido),
  `copyFromAssets({ overwrite: true })`. Em qualquer falha, retornar `null` e
  deixar o facade JS assumir (web) ou retornar vazio (nativo) com aviso no
  console.
- **Aceite:** `getCatalogRelease()` retorna o `content_hash` do banco armazenado;
  teste com hash diferente dispara re-cópia.
- **Verificação:** `npm run test -- src/lib/db/__tests__/catalogDb.test.ts`
  (criar se não existir).
- **Depende de:** T0.1 (namespaces já existem, embora não usados aqui)
- **Tamanho:** M

**Gate da fase:** `npm run verify:fast`.

---

## Fase 2 · Criptografia dos dados do usuário (D4)

**Entrega:** SQLite do usuário cifrado (`encrypted: true`) no nativo; `localStorage`
da web cifra o JSON antes de gravar com chave em memória.

### T2.1 · Ativar criptografia no SQLite nativo (D4)

- **Arquivos:** `src/lib/db/driver.ts` (`createNativeSqliteDriver`),
  `src/lib/db/catalogDb.ts` (opcional, se o catálogo também for cifrado — não:
  catálogo é público, somente-leitura; deixa `encrypted: false`).
- **O que muda:** `createConnection` e `open` do usuário usam `encrypted: true`
  com chave derivada de segredo do dispositivo. Se a chave não estiver
  disponível, o driver degrada para `null` e o app usa o caminho legado.
- **Aceite:** `encrypted: true` no driver do usuário; teste unitário com driver
  simulado confirma que a chave é passada.
- **Verificação:** `npm run verify:fast`.
- **Depende de:** T0.1
- **Tamanho:** M

### T2.2 · Cifrar JSON do `localStorage` na web (D4)

- **Arquivos:** `src/lib/storage.ts` (`setSync`/`getSync`).
- **O que muda:** ao gravar no `localStorage`, cifrar o valor com uma chave
  mantida em memória (variável de módulo, não persistida). Ao ler, decifrar. Se
  não houver chave, gravar/ler texto claro com aviso (primeiro acesso sem chave
  = gerar chave em memória).
- **Aceite:** teste de round-trip: `setSync` seguido de `getSync` retorna o
  valor original; o valor bruto no `localStorage` não é legível como texto claro.
- **Verificação:** `npm run test -- src/lib/__tests__/storage.test.ts`
- **Depende de:** T2.1
- **Tamanho:** M

**Gate da fase:** `npm run verify:fast`.

---

## Fase 3 · Backup/restore sem login (D5)

**Entrega:** tela de exportação/importação de backup (BackupV2 já existe) e
opção de backup em nuvem via `packages/sync` (desativada por padrão).

### T3.1 · Tela de exportar/importar backup do usuário (D5)

- **Arquivos:** novo componente/view (ex.: `src/components/views/BackupView.tsx`),
  reusando `exportData`/`importAppDatabase` de
  `packages/data/src/exportImport.ts`.
- **O que mudar:** botão "Exportar backup" gera arquivo JSON (BackupV2) com
  apenas dados do usuário; botão "Importar backup" lê o arquivo e aplica via
  `applyDatabase`. Dados fixos nunca entram no payload (já excluídos por
  `persistentData.ts:55`).
- **Aceite:** exportar produz arquivo válido; importar restaura dados do usuário;
  `approaches`/`questions` não aparecem no payload exportado.
- **Verificação:** `npm run test -- src/components/views/__tests__/BackupView.test.tsx`
  (criar).
- **Depende de:** T0.1
- **Tamanho:** L

### T3.2 · Opção de backup em nuvem via sync (desligada por padrão) (D5)

- **Arquivos:** `packages/sync` (motor já existe), tela de configurações.
- **O que mudar:** interruptor "Backup em nuvem" desligado por padrão; ao ligar,
  o motor de sync envia/recebe o backup. Não exige login.
- **Aceite:** o interruptor existe e começa desligado; ligá-lo não quebra o
  typecheck nem os testes.
- **Verificação:** `npm run verify:fast`.
- **Depende de:** T3.1
- **Tamanho:** M

**Gate da fase:** `npm run verify:fast`.

---

## Fase 4 · Gates de não-limpeza (D2, D6) — checkpoint

**Entrega:** testes que provam que boot/OTA nunca apagam dados do usuário e que
`resetApp` nunca toca dados fixos.

### T4.1 · Teste: `resetApp` nunca apaga dados fixos (D2)

- **Arquivos:** `src/lib/__tests__/resetAppFixo.test.ts` (novo).
- **O que muda:** teste afirma que, após `resetApp`, `approaches`/`questions` e
  catálogo não são zerados (ou que `clearUserData` não remove tabelas de
  `appStorage`).
- **Aceite:** teste passa; `rg "clearUserData" src --glob '!*.test.*'` só
  aparece em `DataClientProvider.tsx:908` (caminho explícito do usuário).
- **Verificação:** `npm run test -- src/lib/__tests__/resetAppFixo.test.ts`
- **Depende de:** T0.1
- **Tamanho:** S

### T4.2 · Teste: migrações e boot nunca reduzem linhas de usuário (D6)

- **Arquivos:** `src/lib/__tests__/migrationsNaoApagamUsuario.test.ts` (novo).
- **O que mudar:** teste afirma que `runUserMigrations` e o boot nunca executam
  `DELETE`/`DROP` em tabelas de usuário nem reduzem contagem de linhas.
- **Aceite:** teste passa; o único `DROP TABLE` do projeto (`migrations/user.ts:411-413`)
  é do passo 4 (TCC), controlado e versionado.
- **Verificação:** `npm run test -- src/lib/__tests__/migrationsNaoApagamUsuario.test.ts`
- **Depende de:** T0.1
- **Tamanho:** S

**Gate da fase + checkpoint:** `npm run verify` verde. **Mostrar o resultado
dos testes para a dona antes de considerar a spec entregue** — é a fase que
prova que OTA/reinstalação não quebram dados do usuário.

---

## Item aberto (não bloqueia nenhuma fase)

**Gerenciamento de chave de criptografia (D4).** Se o usuário perder a chave do
dispositivo, os dados cifrados são inacessíveis. Falta decidir: (a) aviso claro
na tela de backup; (b) exportação de backup não cifrada como cópia de
segurança. **Decisão da dona**, não do agente. Enquanto não decidir, T2.1/T2.2
implementam a cifra com chave em memória e avisam no console.

## Débito que este plano não paga

- **C2** (`USER_SCHEMA_VERSION` duplicada): mexe em `packages/data`. Não tocar.
- **C10** (`packages/design-tokens` morto): fora de escopo.
- **Backup automático contínuo:** só exportação manual e sync opcional (D5).
- **Criptografia de dados fixos do app:** são públicos, somente-leitura, do
  bundle.
