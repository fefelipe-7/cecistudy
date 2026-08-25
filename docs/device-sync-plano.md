# Sincronização entre dispositivos (pareamento P2P) — plano e status

> Plano da Fase Sync: transferir os dados do cantinho entre celular ↔ PC **sem
> servidor central** e **sem armazenamento em nuvem**, mantendo tudo local.
> Status atual: **Fase S1 concluída** · **Fase S3 concluída (UI montada)** ·
> **Fase S2 PAUSADA** — falta só o transporte WebRTC; ponto de encaixe único em
> `src/lib/sync/transport-bridge.ts`.

---

## 1. Decisões de produto (acordadas)

| Decisão | Escolha |
|---|---|
| Signaling (handshake WebRTC) | **Trystero** — usa infra pública (Nostr por padrão no pacote atual) só para a apresentação inicial. Dados nunca passam por lá; o tráfego real é P2P direto (WebRTC DataChannel, criptografado via DTLS). |
| Direção | **Bidirecional com merge** (LWW determinístico), não cópia simples. |
| Conflito | **Escolha explícita na tela**: antes de aplicar, mostra preview do merge (`+X ~Y −Z` de cada lado) e pede confirmação. O merge em si é automático e simétrico. |
| Leitura do QR no celular | ~~`@capacitor-mlkit/barcode-scanner`~~ **bloqueado nesta rede (npm 403)** → **plano B adotado**: `@capacitor/camera` (já é dependência sincronizada nos nativos) + `jsqr` para decodificar a foto do QR. Vantagem: **nenhum plugin nativo novo** = não exige rebuild de IPA/APK para o escaneio funcionar. |

## 2. Arquitetura

```
CELULAR (Capacitor)                    PC (desktop Tauri / web)
  AppContext                            AppContext (mesmo bundle)
     │ getSyncPayloadJson()                │ getSyncPayloadJson()
     ▼                                     ▼
  SyncEngine ◄── merge determinístico ──► SyncEngine (mesma função pura)
     │                                     │
     └───────── Trystero (nostr relay) ────┘   ← só o handshake
     │                                     │
     └──────── WebRTC DataChannel ─────────┘   ← dados reais (P2P direto)
```

- **Fluxo:** Perfil → "sincronizar entre dispositivos" (tela empilhada `#/perfil/sincronizar`).
  1. Um lado vira **host**: gera código curto (ex.: `8F4K-29A`) + QR.
  2. Outro lado **escaneia** (câmera+jsQR) ou digita o código.
  3. Conectados, ambos trocam snapshots simultaneamente (payload = backup JSON v2).
  4. Cada lado roda `mergeSyncedDatabases(local, remote)` — função **pura e
     determinística**: ambos chegam ao mesmo resultado sem negociar.
  5. Preview com stats → confirmação → `applyDatabase(merged)` nos dois lados.

## 3. Modelo de merge (implementado na S1)

Os timestamps NÃO vivem nas entidades — vivem num **índice paralelo**
(`SyncIndex`) mantido automaticamente pela camada de persistência:

```ts
interface SyncIndex {
  stamps: Record<string, number>;                      // coleção → última alteração
  records: Record<string, Record<string, number>>;      // [coleção][id] → última alteração
  tombstones: Record<string, Record<string, number>>;   // [coleção][id] → deleção propagável
}
```

Regras:
- **Coleções de registros** (`RECORD_COLLECTION_KEYS`: courses, classes, tasks,
  exams, authors, concepts, readings, flashcards, materials, internshipLogs,
  supervision, sessions, techniques, quizSessions, looseNotes, questions) →
  LWW **por registro**; tombstone mais recente que o registro vence (deleção
  ganha); registro editado depois da deleção sobrevive.
- **Valores únicos** (`SINGLE_COLLECTION_KEYS`: profile, tcc, stickers,
  streakData*, reminder, onboarding, readingProgress) → LWW pelo stamp da coleção.
  *streakData.activeDays na prática faz união.
- **Sets** (`savedBookIds`, `bookmarkedCourseIds`) → união.
- **Empate de timestamp** → desempate simétrico por serialização (`tieBreak`)
  — ambos os dispositivos convergem sempre.
- **Bancos estáticos** (`approaches`, catálogo de questions) ficam fora do
  merge (re-semeados sob demanda).
- Coleções em Preferences (`reminder`, `onboarding`) não são carimbadas em cada
  edição — caem no desempate simétrico se divergirem (aceitável v1).

## 4. Feito (Fase S1 — concluída e testada)

| Arquivo | O que tem |
|---|---|
| `src/types.ts` | Interface `SyncIndex`. |
| `src/lib/sync/stamp.ts` | Puro: `emptySyncIndex`, `applyStampChange` (carimba criados/alterados, gera tombstones de removidos), `mergeIndexes`, `tieBreak`, listas `RECORD/SINGLE/SET_COLLECTION_KEYS`. |
| `src/lib/sync/merge.ts` | `mergeSyncedDatabases(local, remote)` → `{ merged, local: {added,updated,removed}, remote }` — determinístico e simétrico. |
| `src/lib/useStampedState.ts` | Hook que envolve `useSqliteState` e devolve `{ value, set, setRaw }`. `set` carimba o SyncIndex a cada mudança; `setRaw` não carimba (import/hidratação/sync). |
| `src/context/AppContext.tsx` | ~21 coleções migradas para `useStampedState`; `syncIndex` persistido em `useSqliteState('syncIndex')`; `applyDatabase` agora usa setters raw + aplica `db.syncIndex`; navegação da tela de sync (`isSyncScreenOpen/openSyncScreen/closeSyncScreen`, `getSyncPayloadJson()`, `applySyncedDatabase()`). |
| `src/data/schema.ts` | `SCHEMA_VERSION` 9→10; `MIGRATIONS[10]` garante `syncIndex` default. |
| `src/data/empty.ts` + `seeds.ts` | `EmptyDatabase.syncIndex` + defaults. |
| `src/lib/persistentData.ts` | `PersistedStateSnapshot.syncIndex` + passthrough no `readDatabaseFromState` (entra no backup/export). |
| `src/lib/backupSchema.ts` | Schema Zod opcional `syncIndex` (backups antigos seguem válidos). |
| `src/lib/exportImport.ts` | `BackupV2.schemaVersion` (top-level) + **migração real no import** via `migrateDatabase` (recusa versão futura). |
| `src/types.ts` / `routing.ts` / `AppContext` | `NavScreen { kind:'sync' }`, rota `#/perfil/sincronizar` (parse/serialize/rebuild). |
| Testes | `src/lib/sync/__tests__/stamp.test.ts` + `merge.test.ts` (união, LWW, tombstone vs edição, sets/streak, stats, simetria). Suite completa: 43 arquivos / 396 testes verdes + lint verde. |

## 5. Pendente — Fase S2 (transporte) · PAUSADA

> ⚠️ **Correção importante:** as dependências **já estão instaladas** nesta
> máquina (`trystero@0.25.3`, `qrcode`, `jsqr`). Só o pacote
> `@capacitor-mlkit/barcode-scanner` foi bloqueado (npm 403) — e ele **não é
> mais necessário** (plano B: `@capacitor/camera` + `jsqr`, já implementado na
> S3). Ou seja, a S2 não depende de baixar nada; pode ser feita em qualquer rede.

### O que a S3 já entregou (pronto e testado)

| Arquivo | Conteúdo |
|---|---|
| `src/components/sync/SyncScreen.tsx` | UI completa do fluxo, lazy-loaded (`SyncScreen` chunk próprio): escolha de papel → host (QR real via `qrcode` + código `XXX-XXX` + "gerar outro código") → join (escanear QR ou digitar) → connecting → preview com stats `+/~/−` → done/error/unavailable. |
| `src/lib/sync/pairing.ts` | Código curto (alfabeto sem ambíguos), `formatPairCode`, `generatePairCode`, QR `cecistudy://sync?v=1&c=CODE&n=nome`. Testado. |
| `src/lib/sync/scanQr.ts` | Escaneio via `Camera.getPhoto` + decodificação local com `jsqr` (funciona nativo e web, sem plugin novo). |
| `src/lib/sync/transport-bridge.ts` | **PONTO ÚNICO DE ENCAIXE da S2**: interface `SyncTransport { connect(code), exchange(payload), close() }`; `resolveSyncTransport()` hoje devolve `null` → a tela mostra "a conexão está sendo preparada". |
| `src/shells/ScreenLayers.tsx` | Branch `app.isSyncScreenOpen` → `<SyncScreen />` (slide layer, ambas as shells). |
| `src/components/views/PerfilView.tsx` | Botão "sincronizar entre dispositivos" no card "seus dados". |

### Como retomar a S2 (só isso falta)

1. Criar `src/lib/sync/channel.ts` implementando `SyncTransport`:
   - `await import('trystero')` (raiz = estratégia **nostr**; o subpath
     `trystero/mqtt` do 0.25.x é shim de deprecação sem export).
   - `joinRoom({ appId: 'cecistudy-sync' }, 'sync-' + code)`; actions
     `makeAction<string>('meta')` e `makeAction<string>('payload')`;
     `onPeerJoin`/`getPeers()`/`leave()`; timeout ~60 s.
   - Payloads grandes são chunkados pelo próprio trystero.
2. Em `transport-bridge.ts`: trocar `resolveSyncTransport()` para devolver o
   canal real. **Nada na UI muda** — os estados preview/applying/done já estão
   renderizados; o engine conecta `getSyncPayloadJson()` (contexto) →
   `transport.exchange(...)` → `importAppDatabase(json)` (validação Zod +
   migração) → `mergeSyncedDatabases(local, remote)` → confirmação →
   `applySyncedDatabase(merged)` + toast/confete.
3. TURN (follow-up): `rtcConfig.iceServers` no config do trystero para NATs
   restritivos (ex.: Open Relay/Metered). Hoje só STUN default.

### Follow-ups (pós-S2)
- Estratégia signaling alternativa (@trystero-p2p/mqtt/torrent) se nostr estiver
  bloqueado na rede da usuária.
- Delta sync (enviar só mudanças) — hoje vai o snapshot completo (~100 KB–poucos MB).
- Testes E2E reais entre dispositivos (relay Nostr precisa de internet aberta;
  esta máquina de dev tem bloqueios).

## 6. Gotchas registrados
- `@capacitor-mlkit/barcode-scanner`: npm 403 nesta rede — **não é mais
  necessário** (escaneio via `@capacitor/camera` + `jsqr`, local).
- `useStampedState` guarda espelho do valor em ref; `applyDatabase` DEVE usar
  os setters `*Raw` (senão o banco aplicado seria re-carimbado como "mudança
  local" e ganharia do outro dispositivo injustamente).
- O efeito de boot que normaliza `Course.schedule` legado foi blindado
  (`every(Array.isArray) ? prev : ...`) para não bumpar o stamp a cada boot.
- Backup/import antigos (sem `schemaVersion`) continuam entrando só com validação
  Zod — migração só roda quando a versão está presente no payload.
- Enquanto `resolveSyncTransport()` devolver `null`, escolher qualquer papel na
  SyncScreen e tentar conectar mostra o estado "unavailable" — comportamento
  esperado até a S2 entrar.
- Gate de verificação final da S1+S3: `npm run lint` ✓ · `npm run test`
  (44 arquivos / 401 testes) ✓ · `npm run build` ✓ (chunk próprio `SyncScreen`).
