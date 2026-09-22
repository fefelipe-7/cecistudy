# Plano de Implementação: Stickers v2 — correção, catálogo de 80 e XP/nível

> Spec: `.context/spec-stickers-v2.md` (aprovado 2026-09-12). Plano separado do
> `tasks/plan.md` (refatoração MOD/HAR/SEP — intocado).
> **Gate por tarefa:** `npm run lint` + `npm run test`; nas tarefas de UI também `npm run build`.

## Overview

Corrigir o sistema de conquistas do app em 4 frentes (ordem do spec §7): (1) tornar **todos
os 39 tipos de condição** funcionais em `isConditionMet` (hoje 21 nunca desbloqueiam) e
corrigir a fonte de dados de `questions-created`/`questions-mastered` (banco estático →
`quizSessions` real da usuária); (2) expandir o catálogo de 45 para **80 stickers (20 por
categoria)** com raridade explícita; (3) barra de progresso nos cards bloqueados
("7/15 tarefas"); (4) **XP / níveis / títulos** por categoria e geral, com XP retroativo
único e celebração de level-up.

## Architecture Decisions

- **`rarity` explícita em `StickerDefinition`** (em vez de derivar XP do `min`) — XP vira
  tabela fixa (`XP_BY_RARITY`), auditável sticker a sticker (spec §5.1).
- **`categoryXp?` opcional em `UserProfile`** — retrocompatível, sem migração de banco
  (`backupSchema` já faz passthrough); `SCHEMA_VERSION` não muda.
- **XP retroativo determinístico:** ausência de `categoryXp` = perfil antigo → conceder XP
  dos stickers já desbloqueados uma vez no boot (janela silenciosa); presença = já concedido.
- **`stickerState` exposto via contexto** (decisão A): `SharedAppValue` → `AppContextValue`
  → `useMobileApp()` — fonte única de verdade para a barra de progresso.
- **`questions` sai do `StickerState`**; entra `quizSessions` (IDs únicos por `questionId`).
- **`reading-in-progress`** usa `status === 'lendo'` (literal confirmado, `entity.ts:113`).

## Task List

### Fase 1 — Lógica de desbloqueio correta (spec §§1–2)

- [x] **T1.1** `isConditionMet` completo + `currentValueFor`
  - **Description:** implementar os 21 `case`s faltantes, corrigir `streak-week`/
    `streak-month` (precedência), `flashcard-streak`/`techniques-explored` (hardcode →
    `condition.min`), trocar `questions-created`/`questions-mastered` para `quizSessions`
    (IDs únicos), adicionar `quizSessions` ao `StickerState` e criar `currentValueFor`.
  - **Acceptance:**
    - Todos os 39 tipos de `StickerCondition` têm `case` no switch (zero caem só em `default`).
    - `questions-created`/`questions-mastered` contam IDs únicos de `quizSessions`; `questions` removido do `StickerState`.
    - `streak-week`/`streak-month`/`techniques-explored` respeitam `condition.min`; `flashcard-streak` usa `min` do catálogo.
    - `currentValueFor` cobre as condições com `min` (booleanas retornam 0).
  - **Verify:** `npm run lint` + `npm run test` (testes expandidos em `stickers.test.ts`).
  - **Files:** `src/lib/stickers.ts`, `src/lib/__tests__/stickers.test.ts`
  - **Dependencies:** nenhuma
  - **Estimated scope:** Medium (2 arquivos, mudança densa)

- [x] **T1.2** Repassar `quizSessions` no `sharedAppValue`
  - **Description:** incluir `quizSessions` no literal `state` do `useEffect` de stickers e na lista de dependências.
  - **Acceptance:** stickers de quiz (`questions-created`/`questions-mastered`) desbloqueiam com base em sessões reais.
  - **Verify:** `npm run lint` + `npm run test`.
  - **Files:** `src/context/sharedAppValue.ts`
  - **Dependencies:** T1.1
  - **Estimated scope:** XS (1 arquivo)

### ✅ Checkpoint 1 (Fase 1)
- [ ] `npm run lint` + `npm run test` verdes; grep confirma zero tipo sem `case` em `isConditionMet`.
- [ ] Demo manual: dados de teste com quiz/leitura/prova desbloqueiam os stickers antes mortos.

---

### Fase 2 — Catálogo de 80 (spec §3)

- [x] **T2.1** `StickerRarity` + catálogo reescrito
  - **Description:** adicionar `type StickerRarity` em `types/profile.ts`; reescrever
    `STICKER_CATALOG` para as 80 entradas (tabelas §3.1–3.4) com campo `rarity`;
    adicionar `stickerDefinitionFor(id)`.
  - **Acceptance:** catálogo com 80 stickers, exatamente 20 por categoria; ids `st-1..st-45`
    mantidos; novos (`st-*a/*b/*c`) entram bloqueados via `mergeCatalogWithProgress`;
    descrição do st-23 = "pratique 5 questões diferentes".
  - **Verify:** `npm run lint` + `npm run test` (ajustar `stickers.test.ts` para 80: contagem,
    `mergeCatalogWithProgress` com progresso parcial); `npm run build`.
  - **Files:** `src/types/profile.ts`, `src/data/stickerCatalog.ts`, `src/lib/__tests__/stickers.test.ts`
  - **Dependencies:** T1.1
  - **Estimated scope:** Medium (1 rewrite de dados + 2 ajustes)

### ✅ Checkpoint 2 (Fase 2)
- [ ] Testes verdes com 80; progresso persistido antigo preservado (st-1..st-45).
- [ ] Review humano das descrições de humor antes de seguir.

---

### Fase 3 — Barra de progresso (spec §4)

- [x] **T3.1** Expor `stickerState` no contexto
  - **Description:** `SharedAppValue.stickerState` (montado no `useSharedAppValue`),
    `AppContextValue.stickerState`, repasse em `buildAppContextValue(shared.stickerState)`.
  - **Acceptance:** `useMobileApp().stickerState` acessível; sem duplicar a montagem do snapshot.
  - **Verify:** `npm run lint` + `npm run test`.
  - **Files:** `src/context/sharedAppValue.ts`, `src/context/AppContext.tsx`
  - **Dependencies:** Checkpoint 2
  - **Estimated scope:** Small (2 arquivos)

- [x] **T3.2** ProgressBar nos cards bloqueados
  - **Description:** na `StickersView`, card bloqueado com `'min' in condition` mostra
    `<ProgressBar>` (valor clampado 0–100) + `cur/min`; condições booleanas seguem sem barra.
  - **Acceptance:** cada card bloqueado com alvo numérico mostra progresso real; sem regressão
    no card desbloqueado.
  - **Verify:** `npm run lint` + `npm run test` + `npm run build`; manual `npm run dev`
    (`?platform=web`, perfil → stickers).
  - **Files:** `src/components/views/StickersView.tsx`
  - **Dependencies:** T3.1
  - **Estimated scope:** Small (1 arquivo)

### ✅ Checkpoint 3 (Fase 3)
- [ ] Verificação visual: barras condizem com o estado real; contador 0/80 no estado vazio.

---

### Fase 4 — XP / níveis / títulos (spec §5)

- [x] **T4.1** `src/lib/levels.ts` (novo)
  - **Description:** `XP_BY_RARITY`, `LEVEL_THRESHOLDS` (10), `GENERAL_THRESHOLDS`
    (`LEVEL_THRESHOLDS.map(t => t * 4)`), `levelFor`, `xpToNextLevel`, `categoryXpOrDefault`,
    `CATEGORY_TITLES` (10 por categoria, §5.5) e `GENERAL_TITLES` (§5.6).
  - - **Acceptance:** level 1 em 0 XP; level 2 em 50; level n exato nos thresholds; maxlevel
    acima de 1948; titles indexados corretamente.
  - **Verify:** `npm run lint` + `npm run test` (novo `levels.test.ts`: boundaries 49/50,
    116/117, 1947/1948, 1949+, fallback do `categoryXpOrDefault`).
  - **Files:** `src/lib/levels.ts`, `src/lib/__tests__/levels.test.ts`
  - **Dependencies:** Checkpoint 2 (`StickerRarity`)
  - **Estimated scope:** Medium (2 arquivos)

- [x] **T4.2** `categoryXp` no perfil
  - **Description:** `UserProfile.categoryXp?: Record<Sticker['category'], number>` e
    `emptyProfile.categoryXp` zerado (4 chaves).
  - **Acceptance:** perfis novos nascem com as 4 chaves zeradas; perfis antigos (sem o campo)
    não quebram nada (helper com fallback); round-trip de export/import preserva `categoryXp`.
  - **Verify:** `npm run lint` + `npm run test` (round-trip em `exportImport.test.ts`).
  - **Files:** `src/types/profile.ts`, `src/data/empty.ts`
  - **Dependencies:** T4.1
  - **Estimated scope:** Small (2–3 arquivos)

- [x] **T4.3** Concessão de XP + level-up + retroativo + celebração
  - **Description:** no `useEffect` de stickers (`sharedAppValue`): somar
    `XP_BY_RARITY[def.rarity]` em `categoryXp[sticker.category]` por desbloqueio novo;
    detectar level-up (categoria e geral) comparando `levelFor` antes/depois; retroativo único
    no boot quando `categoryXp` ausente (silencioso); `celebrationKind 'level-up'` em
    `celebrate.ts` (`burstFromCenter` + `sideCannons`); toast de nível alcançado.
  - **Acceptance:** desbloqueio soma XP correto por rarity; nível sobe e celebra (fora da
    janela de boot); perfil legado recebe retro no boot em silêncio e o campo passa a existir;
    sem loop de efeito (perfis com XP concedido não re-concedem).
  - **Verify:** `npm run lint` + `npm run test`; `npm run build`.
  - **Files:** `src/context/sharedAppValue.ts`, `src/lib/celebrate.ts`
  - **Dependencies:** T4.2, T3.1
  - **Estimated scope:** Medium (2 arquivos)

- [x] **T4.4** UI de nível (perfil + StickersView)
  - **Description:** `StickersSection` ganha badge de nível geral + título (recebe `profile` de
    `PerfilView`); `StickersView` mostra por categoria `nv. X · <título>` +
    `ProgressBar` até o próximo nível.
  - **Acceptance:** badge no perfil reflete nível geral; blocos da StickersView mostram
    nível/título por categoria + barra até o próximo nível.
  - **Verify:** `npm run lint` + `npm run test` + `npm run build`; manual no dev.
  - **Files:** `src/components/views/perfil/StickersSection.tsx`,
    `src/components/views/PerfilView.tsx`, `src/components/views/StickersView.tsx`
  - **Dependencies:** T4.3, T3.2
  - **Estimated scope:** Medium (3 arquivos)

### ✅ Checkpoint Final
- [ ] `npm run lint` + `npm run test` + `npm run build` verdes.
- [ ] Contagem na StickersView: 80 stickers (20/categoria); "0/80" no estado vazio.
- [ ] Fluxo manual end-to-end: cumprir condição → sticker desbloqueia (confete+toast) → XP
      somado → nível sobe com celebração de level-up.
- [ ] Review humano do spec e dos textos de humor antes de merge.

## Risks and Mitigations

| Risco | Impacto | Mitigação |
|---|---|---|
| `questions-*` muda de semântica ("criadas" → "respondidas") | Médio | Descrição do st-23 já renomeada no catálogo; docs/backlog atualizados na T2.1 |
| XP retroativo "estoura" níveis no boot | Baixo | Janela de boot silencia celebração; UI apenas reflete; regra de 1x (campo passa a existir) evita re-concessão |
| IDs removidos/renomeados no catálogo perdem progresso persistido | Alto | `mergeCatalogWithProgress` preserva entradas fora do catálogo; manter ids `st-1..st-45`; teste de segurança mantém legacy |
| Testes e fixtures que assumem 45 stickers | Médio | `makeStickers()` já é dinâmico; ajustar contagens de `stickers.test.ts` na mesma change da T2.1; conferir `golden/sample` (delta de `stickersCollected` é perfil, não catálogo) |
| Escrita duplicada de snapshot do `StickerState` (UI vs fixo) | Baixo | Decisão A: montagem única em `sharedAppValue`, exposta via contexto |
| Catálogo reescrito com emojis/acentos (UTF-8) | Alto | Editar via `edit`/`write` (nunca PowerShell); checagem de `\x{FFFD}` + `npm run lint` após a T2.1 |
| `categoryXp` ignorado em export/import se schema fechar | Médio | `backupSchema` já é passthrough; teste de round-trip na T4.2 fecha a garantia |
| Golden de backup (TS → Rust) | Médio | `emptyProfile` + catálogo 45→80 mudam o snapshot: regenerado com `GOLDEN_WRITE=1`. **Follow-up no workspace Rust** (paridade `cecistudy-rust`) quando a `data` crate for alinhada — fora deste plano |

## Open Questions (resolvidas — ver spec §"Decisões resolvidas")

- st-13c → "hiperfoco ativado" · st-37c → mantém "TCC em trio" · progresso → opção A
  (contexto) · XP retroativo → sim, único no boot · arquivos → `.context/spec-stickers-v2.md`
  + `tasks/plan-stickers.md`.

## Observações de integração

- **Fontes finais da verdade:** `src/types/profile.ts` (Sticker/UserProfile) e
  `src/lib/stickers.ts` (lógica) — nada em `packages/*` muda; `check-boundaries.mjs` não é
  necessário aqui.
- **`useStampedState`/SQLite/backup:** `stickers` e `profile` já sincronizados; novo campo
  opcional viaja junto (stamp é por coleção).
- **Desbloqueios retroativos (Fase 1):** primeira abertura pós-update vai desbloquear as 22
  conquistas hoje mortas que a usuária já mereceu — silencioso (janela de boot), conforme
  comportamento atual de `sharedAppValue`.