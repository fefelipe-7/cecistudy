# To-do: Gestão de TCC e captura de link (SPEC-012)

> Spec: [`../spec-tcc.md`](../spec-tcc.md) · decisão de dono de dado:
> [`ADR-010`](../../docs/decisoes/ADR-010-referencia-e-dono-do-dado-bibliografico.md)
> Espelho de grupo: [`SPEC-M-016`](../../docs/specs/mobile/SPEC-M-016-gestao-de-tcc-e-captura-de-link.md)
>
> **Regra de ouro:** cada fase fecha com `npm run lint` + `npm run test` +
> `node .github/scripts/check-boundaries.mjs` verdes. Só a **F2** mexe em
> `SCHEMA_VERSION` (**21 → 22**, `packages/data/src/schema.ts:13`) e na base
> nativa (`USER_SCHEMA_VERSION` **3 → 4**, `src/lib/db/migrations/user.ts:17`).
> Fase que não é a F2 não bumpa nada.

## Mapa de acompanhamento

| Fase | Entrega | Natureza | Estado |
|---|---|---|---|
| **F0** | correções imediatas (3 bugs + testes + AGENTS.md) | backend + UI pontual | ✅ 2026-10-08 |
| **F1** | domínio `thesis.ts` + datas em `common.ts` + 51 testes | backend | ✅ 2026-10-08 |
| **F2** | migração 22 ponta a ponta: payload, coleções, SQLite, sync, backup, dreno | backend/persistência | ✅ 2026-10-08 |
| **F3** | shell da tela: hero + navegação + 5 abas + abas vazias | frontend (UX/UI) | ✅ 2026-10-08 |
| **F4** | aba capítulos: lista, arrastar, calendário, lembretes, notificação→aba, busca | frontend + backend | ✅ 2026-10-08 — F4.5/F4.8 fechadas; verificação `[V]` vai na F10.4 |
| **F5** | aba escrita: logs, metas, semana, conquistas | frontend | ✅ 2026-10-08 |
| **F6** | aba orientação: pendências e reuniões | frontend | ✅ 2026-10-09 |
| **F7** | aba leituras: referências ABNT + enriquecimento por DOI | frontend + backend | 🟡 2026-10-09 — F7.1-7.4 entregues; F7.5/F7.6 após F8 |
| **F8** | captura de link: camadas 1-2 + Android | frontend + nativo | 🟡 2026-10-09 — F8.1-8.6 no código; nativo não compilado aqui |
| **F9** | Share Extension iOS (condicional ao spike) | nativo | — |
| **F10** | documentação e entrega | docs | — |

**Progresso:** 7/11 fases ✅ (F0–F6). **F7 e F8 em 🟡**.

**Baseline (antes da F0):** lint 0 · test 1288/117 · boundaries 0.
**F0:** 1299/118 · **F1:** 1350/119 · **F2:** 1360/119 · **F3:** 1367/119 ·
**F4:** **1391/119** — a falha que apareceu aqui **não era do TCC**: era o bug de
fuso do `fsrs.ts` (`src/lib/fsrs.ts` derivava `daysBetween`/`due` de
`toISOString()`, UTC, em vez da data civil local). **Corrigida nesta sessão**
(`fsrs.ts` + `contextActions.ts` via `dateBR`, com teste de regressão).
**F5:** **1400/119** · lint 0 · boundaries 0 (a suíte verde voltou com a correção
do fuso + os 5 testes da aba escrita + os 2 de catálogo da F5.4; os goldens do
estado vazio foram regenerados com aprovação, por causa da troca de stickers).
`TccView.test` agora tem **27 testes**.
**F6:** **1405/119** · lint 0 · boundaries 0 (+4 testes da aba orientação em
`TccView.test` → **31**; +1 no domínio: reunião `cancelada` não gera lembrete).
A F6.3 não escreve nada: a reunião `agendada` já entra no calendário (F4.5) e no
plano de lembretes (F4.6) por derivação — o que faltava era o caminho de escrita
para criá-la, e ele nasceu aqui (`MeetingSheet`).
Os números vêm do comando, nunca de memória.

---

## F0 — Correções imediatas (sem schema) ✅

- [x] **F0.1** `TccView.tsx` — toggle de capítulo imutável (`map` + objeto novo).
  *Não é cosmético:* `stableKey` é `JSON.stringify` (`packages/sync/src/stamp.ts:83-89`)
  — objeto anterior e novo serializando igual = stamp sem bump = mudança que não
  propaga para o outro dispositivo. Gate verificado quebrando de propósito (1 teste falhou).
- [x] **F0.2** prazo com `formatDateBR` (`src/lib/dateBR.ts`), nunca ISO cru.
  Dado legado fora de `YYYY-MM-DD` volta como veio (não quebra, não adivinha).
- [x] **F0.3** confirmação ao concluir com capítulo pendente (D4) — `Modal`
  reutilizado; o app não tinha componente de confirmação.
- [x] **F0.4** `src/components/tcc/__tests__/TccView.test.tsx` — **11 testes** com o
  `MobileAppProvider` de verdade (o caminho usado em produção), sem mock de contexto.
- [x] **F0.5** `AGENTS.md:47` — `SCHEMA_VERSION` **21** real + ponteiro para a migração 22.

**Gate:** lint 0 · test 1299/118 · boundaries 0.

---

## F1 — Base do domínio ✅

- [x] **F1.1** `ids.ts` — `EntityPrefix` ganhou `thc`/`thr`/`thm`/`tts`/`twl`.
- [x] **F1.2** datas civis extraídas para `common.ts`; `internship.ts` importa e
  reexporta (importadores existentes não mudaram; `thesis` não depende de `internship`).
- [x] **F1.3** barris (`packages/domain/.../index.ts`, `src/types/index.ts`) exportam `thesis`.
- [x] **F1.4** `src/types/thesis.ts` — stub de compat com re-export **relativo**.
- [x] **F1.5** `thesis.ts` + **51 testes**: seletores (`thesisProgress`,
  `nextThesisDeadline`, `weekWords`), `reorderSiblings` (INV-T2),
  `buildThesisLinkIndex` (INV-T4), `formatAbnt` (6 tipos, negrito no lugar certo,
  `s.d.` nunca inventado), `validateRef`, `normalizeUrl`, `extractFirstUrl`,
  `isValidUrl`.
  - *Aprendizado:* barrel `export *` **não tolera colisão de nomes** —
    `planSave`/`planDelete` genéricos colidiam com os de `internship.ts` (TS2308).
    A porta de escrita do TCC nasce na camada de aplicação (§9.5), como no Estágio.
  - *Bug que o teste pegou:* deletar de `searchParams` durante a iteração pula
    entradas (`fbclid` escapava).
  - *Nota ADR-010:* `ThesisReference` fino; dado bibliográfico no
    `ThesisReferenceData` que o `ReadingItem` carrega na F7. `Requiredness`
    importado de `projects.ts`, não redefinido.

**Gate:** lint 0 · test 1350/119 · boundaries 0 · `rg "new Date\(|Date\.now" thesis.ts` vazio.

---

## F2 — Migração 22 ponta a ponta [backend/persistência]

> **Por que esta fase é una e atômica.** O plano original splitava "payload" e
> "base nativa" em duas fases — o split era falso, por três razões mecânicas:
>
> 1. `normalize.ts:647` tem `const unhandled: never = key`: coleção nova em
>    `COLLECTIONS` sem `case` em `saveCollection` **quebra o `tsc`**.
> 2. As tabelas `thesis_meeting`/`thesis_task`/`thesis_writing_log` **não
>    existem** nativamente sem o passo 4 — `INSERT` falharia em dispositivo.
> 3. **O dreno tem que vir junto** (senão há perda aparente de dado no primeiro
>    boot pós-22): `migrateDatabase` tem **um** chamador no repositório inteiro
>    (`packages/data/src/exportImport.ts:110`, import de backup). Nem a
>    hidratação web (localStorage) nem a nativa (`data_json`) passam por ela.
>    Sem dreno, `tcc` hidrata com a forma antiga, `thesisChapters` nasce `[]`,
>    e os capítulos somem da tela — sem erro e sem aviso (achado A1, §17.2).

- [x] **F2.1** `packages/data/src/schema.ts` — `SCHEMA_VERSION` 21 → **22** +
  `MIGRATIONS[22]` (pura, determinística, idempotente, **nenhum `Date` dentro**;
  molde: 20 em `:481-545`, 21 em `:546-566`):
  1. idempotência: se `thesisChapters` já é array, retorna sem mudar;
  2. `tcc.chapters[i]` → `ThesisChapter` com id determinístico `thc-${i+1}`,
     `stage = completed ? 'pronto' : 'a_fazer'`, `dueDate` só se casar
     `^\d{4}-\d{2}-\d{2}$` (senão descartado e listado em `migrationNotes`),
     timestamps = string fixa `'1970-01-01T00:00:00.000Z'`;
  3. `tcc.references[i]` (string) → **`ReadingItem` legado** com `rawCitation`
     (ADR-010) **+** `ThesisReference` fino apontando para ele (`status: 'citada'`);
  4. `tcc` perde `chapters`/`references`; ganha `id: 'tcc-main'`,
     `reminderPrefs` padrão;
  5. seeds: `thesisMeetings`/`thesisTasks`/`thesisWritingLogs` = `[]`.
- [x] **F2.2** `src/types/profile.ts` — `TccData` sai de cena; o tipo do
  singleton passa a ser `ThesisProject` (domínio, via barrel `@/types`).
  `StickerCondition` ganha `thesis-words`/`thesis-meetings`/`thesis-refs-cited`
  (opcionais) — uso real na F5.
- [x] **F2.3** `src/data/empty.ts` — `emptyTcc: ThesisProject` (**metas
  ausentes**, nada semeado, INV-T6/T7) + as 5 chaves em `EmptyDatabase` e
  `emptyDatabase()` como `[]`.
- [x] **F2.4** `packages/data/src/collections.ts:91-130` — 5 entradas **no fim**
  (a ordem é a de hidratação/import legado, comentário em `:117-126`):
  `thesisChapters`→`thesis_chapter`, `thesisReferences`→`thesis_reference`,
  `thesisMeetings`→`thesis_meeting`, `thesisTasks`→`thesis_task`,
  `thesisWritingLogs`→`thesis_writing_log`, todas `kind: 'array'`, `syncable`.
- [x] **F2.5** `packages/data/src/persistentData.ts` + `packages/data/src/dataClient.ts`
  — as 5 chaves na snapshot, nos repositórios, nos setters e no `applyDatabase`.
  - *Correção do plano anterior:* **`tcc` continua em `SINGLE_COLLECTION_KEYS`**
    (`packages/sync/src/stamp.ts:45`) — singleton fica singleton, só emagrecece.
    Quem sai de algum lugar são os capítulos/referências, que nunca foram
    coleção própria.
- [x] **F2.6** `packages/data/src/backupSchema.ts` — **duas** edições, não uma:
  1. `tccSchema` (`:153-167`): **remover `chapters`/`references` obrigatórios**
     (`:165-166`) — sem isso o `tcc` migrado reprova o import e o "backup
     restaurado" nunca aparece (achado A3);
  2. schemas zod das 5 coleções no schema raiz (`:357-390`) — cada item exige
     `id`, `thesisId`, `createdAt`, `updatedAt`.
- [x] **F2.7** `packages/sync/src/stamp.ts:15-38` — 5 chaves em
  `RECORD_COLLECTION_KEYS` (LWW por registro + tombstone, o que resolve o F13).
- [x] **F2.8** `src/lib/db/migrations/user.ts` + `migrations.ts` —
  `USER_SCHEMA_VERSION` 3 → **4**, passo 4 no padrão de `READING_TABLES_SQL`
  (`:367-394`): recria `thesis_chapter`/`thesis_reference` com `id TEXT PRIMARY
  KEY` + `data_json` (+ colunas de consulta `position`, `due_date`, `stage`,
  `status`, `reading_id`) e cria as 3 tabelas novas com índice por
  `thesis_id`/`date`. `DROP TABLE IF EXISTS` + `CREATE` num **único `exec`**
  (o runner não abre transação por passo, `migrations.ts:55-62` — um exec
  atômico é a garantia disponível). Sem perda: as duas tabelas são write-only,
  a leitura vem de `data_json` (`normalize.ts:678-681`).
  - *Homônimos resolvidos:* o `USER_SCHEMA_VERSION` **1** de
    `packages/data/src/schema.ts:16` (cabeçalho do backup, `exportImport.ts:56`)
    **não bumpa** — ele versiona o formato de export legado, que não muda.
- [x] **F2.9** `src/lib/db/normalize.ts` — `saveTcc` (`:295-322`) para de gravar
  capítulos/referências; 5 `case` novos em `saveCollection` (`:418-652`).
  `loadCollection` default (`:700-707`) já lê array genérico por tabela — conferir.
- [x] **F2.10** `src/lib/db/userDb.ts:66-114` — 5 tabelas na lista de reset.
  O comentário `:104-107` registra o dado que "ressuscitou" quando `deck` e
  `academic_term` ficaram de fora — **não repetir**.
- [x] **F2.11** **O dreno do boot** — `src/context/DataClientProvider.tsx`:
  - *Molde:* reparo one-shot `:441-448` (schedule legado) e `ensureActiveTerm`
    `:504-525`. **Não serve:** `applyDatabase` — nunca roda no boot.
  - *Design:* efeito com dependência em `tcc`; guarda `Array.isArray(tcc.chapters)`
    (forma legada). Chama **`migrateDatabase(21, snapshot)`** — o mesmo código
    testado do import, uma regra um lugar — e aplica o resultado com `setRaw`
    por coleção (dreno é hidratação, não carimba). Escreve as coleções
    **primeiro** e reescreve o `tcc` **por último** (o `tcc` sem `chapters` é o
    marcador de "dreno completo" e desarma a guarda).
  - *Prova contra corrida:* a hidratação nativa é assíncrona e pode resolver
    `thesisChapters = []` **depois** do dreno (tabela recém-criada vazia),
    zerando o que foi drenado. Mitigação: o resultado do dreno fica num `ref`
    e um efeito em `thesisChapters` restaura se o estado zerou na mesma sessão
    de boot. Na F2 também há teste simulando essa ordem.
  - *Por que efeito e não interceptor de load:* o `useSqliteState` é tri-modal
    (web síncrono, nativo assíncrono); o efeito cobre os dois sem tocar o hook
    compartilhado.
- [x] **F2.12** Contexto fino: `dataActions.ts` + `AppContext.tsx` +
  `sharedAppValue.ts` — expõem as 5 coleções + handlers mínimos no padrão
  "uma escrita por ação" (`setThesisChapters(prev => planSave(prev, draft))`
  na camada de handler, molde `handleSaveInternshipLog:570-577`).
  As **duas cópias** de `snapshotFromState` (`DataClientProvider.tsx:795-802`
  e `:821-828`) ganham as chaves — sem as duas, backup e sync saem incompletos.
- [x] **F2.13** Consumidores existentes verdes (mínimo para compilar; a UI de
  verdade é a F3+): `TccView` (lê `thesisChapters`, toggle por **id**),
  `EditTccModal` (recebe capítulos/referências e salva por coleção — temporário
  até a F3/F7 substituírem por sheets), `EstudosView`/`PerfilView` (progresso de
  `thesisChapters`), `stickers.ts` (`stage === 'pronto'`, D4), `schedule.ts`
  (bloco por `entityId`, não por índice — mata o F2 de índice duplo).
- [x] **F2.14** `src/data/fixtures/goldenSample.ts` + contrato:
  `cecistudy-rust/contracts/schema.sql` (DDL espelhado) + goldens
  (`registry.json`, 10 arquivos de coleção, `full_backup.*`, `legacy_payload.v22.json`).
  **Regerar goldens exige aprovação** (SPEC-005; o "siga" desta conversa cobre).
  Por ADR-009, o contrato do Rust é do mobile; o desktop não é tocado.
- [x] **F2.15** Testes: fixture de backup `schema 21` com TCC **com capítulos e
  referências** (o gate atual tem `tcc` vazio — não cobre o caminho);
  idempotência da 22; round-trip export/import com as 5 coleções;
  `collections.test.ts` (lista congelada + `kind`), `dataClient.test.ts`,
  `stickers.test.ts` (baseState novo), `userDb.test.ts` (base v3 → passo 4 →
  capítulos preservados; reset com as 5), `exportImport.test.ts`, golden regen.

**Gate:** lint 0 · test verde · boundaries 0 · nenhum `new Date(` na 22 ·
`Select-String U+FFFD` vazio nos tocados.

**Resultado (2026-10-08):** lint 0 · boundaries 0 · **1360 testes / 119 arquivos**
(baseline 1288/117). Evidências e correções de rumo:

- **Migração 22** (`packages/data/src/schema.ts`): 5 testes de comportamento
  (capítulos→`thc-N` com `stage`, referência legada→`ReadingItem`+`rawCitation`
  +`ThesisReference` fina, singleton sem `chapters` com `id`/`reminderPrefs`,
  idempotência, época fixa) + gate "sem `new Date(`" via `MIGRATIONS[22].toString()`.
  O fixture `legacy_payload.v22.json` e os goldens foram regerados com
  `MIGRATION_WRITE=1`/`GOLDEN_WRITE=1` (aprovado pelo "siga"; precedente SPEC-005).
- **Dreno verificado de ponta a ponta**: teste sema `localStorage` com `tcc`
  legado **antes** do provider montar (chave com prefixo `cecistudy_`,
  `storage.ts:5`) e espera os capítulos drenados na tela + o singleton reescrito
  sem `chapters` **após o write-through** (debounce 200ms — a asserção usa
  `waitFor`, não afirma de imediato). O dreno reusa `migrateDatabase(21, …)` —
  o mesmo código do import, uma regra um lugar.
- **Passo 4 verificado em SQLite real** (driver sql.js, o mesmo caminho do
  nativo): base em v3 com tcc legado → passo 4 → `data_json` intacto, tabela
  recriada aceita `id`+`data_json`, reabrir não re-dropa. Reset limpa as 5
  sem ressurreição.
- **Correção do plano:** `tcc` **continua** em `SINGLE_COLLECTION_KEYS`
  (`stamp.ts:45`) — o plano anterior dizia que saía; singleton fica singleton.
  O `USER_SCHEMA_VERSION` **1** do payload (`packages/data/src/schema.ts:16`)
  **não bumpou** — versiona o export legado, que não mudou.
- **Deliberadamente adiado** (registrado, não esquecido): o editor de
  referências do `EditTccModal` saiu na transição e volta na **F7** (sheet ABNT
  de verdade); o toggle da view usa o setter exposto pelo provider — os
  handlers por entidade ("uma escrita por ação") chegam com as sheets da F3+.
- **ADR-009/ADR-008:** os goldens do mobile fisicamente moram em
  `cecistudy-rust/contracts/golden/` (o gate lê dali) e foram regerados. Os
  testes de paridade **cargo** daquele workspace ficam fora de sync —
  consequência assumida: o workspace está marcado para remoção (ADR-008) e o
  contrato dele passou a ser do mobile (ADR-009, pendência 0.1 do roadmap).
- **Achado pré-existente:** 19 arquivos de `src` (HomeView, FaculdadeView,
  EstudosView…) já vinham com **BOM UTF-8** do repositório — não é desta fase;
  limpeza é task própria (não misturar com feature).

---

## F3 — Shell da tela: hero + navegação + 5 abas [frontend/UX-UI]

> Padrão obrigatório: **SPEC-010** (hero) + design tokens semânticos + copy
> pt-BR minúscula e calorosa. A tela do TCC hoje é o padrão pré-SPEC-010
> condenado (`rounded-2xl`, ícone 40px, `rounded-[26px]` = 0 ocorrências).

- [x] **F3.1** `packages/navigation/src/types.ts:67` — `{ kind: 'tcc'; tab?:
  ThesisTab; focusId?: EntityId }` (precedente `internshipDiary` `:58`).
  `hash.ts`/`slideKeys`/`navigationEngine` encaminham `tab`/`focusId`.
  **Estado de aba no `NavScreen`, não local** — o Q10 (toque na notificação)
  exige, e a SPEC-009 D16 já provou o contrário com o Estágio.
- [x] **F3.2** `HeroCard` no topo, **um** por tela (SPEC-010 D1/D3):

  | estado | `title` | `summary` | ação primária | mascote |
  |---|---|---|---|---|
  | sem tcc | `meu tcc` | "um título, uma pergunta e o caminho vai se desenhando" | `bora começar?` → sheet dados | `research-tcc` |
  | com tcc | **o número**: `4 de 7 capítulos` | próximo prazo: `entrega em 12 dias` (ou "sem data de entrega ainda") | `registrar escrita` → sheet sessão | `research-tcc` |

  - *O título do trabalho **desce** para o primeiro card da visão geral*
    (`text-base`, `line-clamp-2`): `HeroCard` dá `max-w-[92%]` ao resumo contra um
    mascote de 64px (`HeroCard.tsx:62,66`), e título de TCC passa de 60
    caracteres — serifa de 30px em 2 linhas gasta a identidade no documento mais
    variável da usuária.
- [x] **F3.3** Abas em **`UnderlineTabBar`** (rola horizontal, tem `badge`),
  **não** `PillGroup` (quebra linha: ~370px em 358px úteis; e SPEC-010 D7 diz
  que `PillGroup` é filtro). 5 abas: `visão geral` · `capítulos` · `leituras` ·
  `orientação` · `escrita`. Badge opcional de pendências na aba orientação.
- [x] **F3.4** Remover: cabeçalho compacto (`TccView.tsx:28-47`), título
  duplicado (`:75-77`), botão redundante (`:40-46`); ação do header
  (`headerConfig.ts:147-158`) vira secundária (o hex cru `#D85F79` sai).
- [x] **F3.5** Promoções de componente: `StatusChip`
  (`src/components/internship/StatusChip.tsx`) → `src/components/ui/`;
  `ProgressBar` ganha `aria-valuetext` ("4 de 7 capítulos prontos").
- [x] **F3.6** Sheet "dados do trabalho" (ex-`EditTccModal` encolhido, D5):
  título, orientadora, área, situação, problema, objetivos (molde `TagField`),
  **entrega**, **banca**, meta total, meta semanal, lembretes. A conclusão
  segue D4 (confirmação da F0.3 reaproveitada).
- [x] **F3.7** Abas vazias com `EmptyState` (mascote + **um** botão) — cada aba
  ganha conteúdo de verdade na fase própria; aqui elas existem e navegam.
- [x] **F3.8** Teste de componente: um `hero-card` só; ação primária só no hero;
  `tab`/`focusId` no `NavScreen` (deep-link); `focusId` inexistente cai na aba
  sem erro; toque de notificação roteado (função pura `routeFromNotificationExtra`).

**Gate:** lint 0 · test verde · boundaries 0 ·
`rg "rounded-\[26px\]" src/components/views/TccView.tsx` (ou no hero) ≥ 1 ·
nenhum hex em `className`.

**Resultado (2026-10-08):** lint 0 · boundaries 0 · **1367 testes / 119 arquivos**
(+7 da F2). `TccView.test` agora tem **18 testes** (hero único nas trocas de aba,
deep-link por `openTccScreen(tab)`, `focusId` inexistente degradando, sem tcc =
sem abas e sem segunda ação primária, `rawCitation` na aba leituras, metas
persistindo vazio ≠ zero). Correções de rumo e aprendizados:

- **Bug real pego pelo gate:** o hero calculava "dias para o prazo" subtraindo
  `dateKeyOrdinal` — inteiro `YYYYMMDD`, feito para comparar, não subtrair
  (`20261201 - 20261008` = 1193, não 54). O aviso já estava no docstring do
  `dayNumber` de `common.ts`; aconteceu mesmo assim. Nasceu o helper puro
  **`daysBetween`** (`common.ts`, reexportado por `internship` → `dateBR`) com
  teste de regressão que atravessa mês/ano/fevereiro.
- **Correção do plano (F3.4):** o hex do `headerConfig` (`#D85F79`) **fica** —
  é valor de dado para o ícone do header dinâmico, o mesmo padrão de
  `internshipDiary` e de todas as telas; a regra anti-hex vale para `className`.
  A ação "editar tcc" do header também fica (precedente: o diário tem "nova
  anotação" no header convivendo com a ação do hero).
- **Ratchet de motion é sensível a linha:** `aria-valuetext` entrou acima do
  literal do `ProgressBar` e o `noInlineTokens` falhou dos dois lados (novo
  literal na linha nova + entrada `KNOWN_INLINE` órfã). Atualizado para `[36]`
  com comentário — custo de manutenção do gate, não dívida nova.
- **Assinatura de `openTccScreen(tab?, focusId?)` quebrou o `EstudosView`**
  (`onClick={openTccScreen}` entregaria MouseEvent como aba) — envolvido em
  `() => openTccScreen()`.
- **Hero honesto:** a ação é "editar dados"/"bora começar?" (a sheet existe);
  **"registrar escrita" ativa na F5**, quando a sheet de sessão existir. O
  toggle de preferências de lembrete também fica para a F4.6, com o motor —
  interruptor sem motor é UI mentindo.
- **Vocabulário de mascote é fechado:** `reading-cozy` não existe; a aba
  leituras vazia usa `reading-curious`.
- `StatusChip` promovido a `src/components/ui/` com stub de re-export no
  caminho antigo (importadores do Estágio não mudaram).
- A aba **capítulos** já é funcional (lista + toggle da F2, agora dentro da
  aba); **leituras** lista as referências com `rawCitation`; **orientação** e
  **escrita** são placeholders honestos apontando para o que existe, e ganham
  conteúdo nas F6 e F5.

---

## F4 — Aba capítulos: lista, arrastar, prazos, lembretes [frontend + backend]

- [x] **F4.1** Lista em árvore (capítulo → seção, máx. 2 níveis): seções
  colapsáveis numeradas (`01`, `02`…). Linha: `CompletionToggle` (alvo **44px**
  — hoje mede 24px, `CompletionToggle.tsx:24`) + título + `StatusChip` do
  estágio (`a fazer`/`escrevendo`/`em revisão`/`pronto` — nunca só cor) +
  prazo `formatDateBR` + menu.
  - Toque no toggle: `pronto ↔ escrevendo`, `hapticTap()` e
    `showToast('capítulo guardado ♡')` **com `ToastAction` "desfazer"**
    (`Toast.tsx:31-35` — o botão não some com o timeout de 8s).
  - Toque na linha: abre a sheet do capítulo.
- [x] **F4.2** Reordenar **arrastando E mover cima/baixo** (Q6):
  - Arrastar pela alça que é **`<button data-no-swipe>`** com `dragListener={false}`
    + `useDragControls` + `touch-none` — o molde exato já existe em
    `Modal.tsx:119-148`; `swipe.ts:18-19` já ignora `button`, o que mata o
    conflito com o gesto de voltar do iOS. Sem biblioteca nova.
  - "Mover para cima/baixo" dentro da sheet do capítulo (acessível, e o caminho
    para posições distantes).
  - Regra: reordena só entre irmãos do mesmo `parentId`; mudar de pai é na sheet
    (campo "dentro de"); soltar na mesma posição não escreve (`reorderSiblings`
    já testado na F1). Anúncio `role="status"` ("movido para a posição 2 de 5").
- [x] **F4.3** Sheet do capítulo: título, tipo (capítulo/seção), estágio
  (`SegmentedControl`), prazo (`input type=date`), meta de palavras, palavras
  atuais, nota, "dentro de", remover (com confirmação — referências só perdem
  o `chapterIds`).
- [x] **F4.4** Registro livre (Q7): a lista nasce **vazia**, nenhum código
  semeia. Empty state: mascote `writing-flow` + "adicionar o primeiro capítulo".
  *Divergência registrada:* `createProject` (`projects.ts:96-103`) semeia 4
  capítulos — nenhum código do TCC o chama; a divergência fica escrita (D7 da
  SPEC-M-016).
- [x] **F4.5** Calendário por **id** (2026-10-08): o caminho real é o
  calendário do app, `CalendarMonth` → `eventsForMonth`, **não** o
  `buildCalendarWeek` (projeção desktop, código morto). Entregue:
  - `schedule.ts`: `CalendarEvent.kind` ganhou `'tcc'` + `tccTab`/`tccFocusId`;
    `thesisEventsForMonth(thesis, chapters, meetings, tasks, month, year)` puro
    (sem relógio — data civil dos campos), ids `tcc-<tipo>-<entityId>`
    (`tcc-chapter-`/`tcc-task-`/`tcc-meeting-`/`tcc-milestone-`), **por id, nunca
    por índice**. Capítulo pronto é `return` (mesma regra de `nextThesisDeadline`);
    pendência `resolvida`/`arquivada` e reunião não `agendada` ficam de fora.
  - `CalendarMonth` mescla os eventos do TCC via `useMemo` e dá badge próprio
    (`kind === 'tcc'`); `FaculdadeView` lê as coleções do `useDataClientApp` e
    roteia `kind === 'tcc'` → `openTccScreen(tccTab, tccFocusId)`.
  - *Divergência registrada:* o plano citava `entryRef`; a implementação carrega
    o destino em `tccTab`/`tccFocusId`, que é o que `openTccScreen` consome —
    mesma intenção (abrir a aba certa no item certo), sem camada de indireção.
  - *Achado A2 continua aberto:* `buildCalendarWeek` segue código morto — esta
    fase **não o estendeu** nem o ligou (usou o caminho vivo); removê-lo é
    limpeza separada.
- [x] **F4.6** Lembretes: `planThesisReminders(state, today, prefs)` (puro, já
  esboçado no domínio) + `syncThesisReminders` no padrão de
  `syncClassReminders` (`notifications.ts:96-127` — cancela a faixa e reagenda).
  Faixa própria **3000..3199** (`CLASS_REMINDER_BASE=2000`/`RANGE=200`
  ocupa 2000-2199, `DAILY_REMINDER_ID=1001`). Gatilhos: capítulo 7/1/0 dias,
  pendência 1/0, reunião véspera + 1h (sem hora: véspera + 09:00), entrega/banca
  30/14/7/1. Só futuro; ordena por data e corta no teto de 64 do iOS.
  `reminderPrefs` na sheet de dados (§6.4).
- [x] **F4.7** Toque na notificação → **aba certa** (Q10): listener de
  `localNotificationActionPerformed` registrado **no bootstrap** (fora de
  componente), fila de toque pendente até os dados hidratarem (partida a
  frio), `extra: { thesis: { tab, entityId } }`, `routeFromNotificationExtra`
  pura com teste.
- [x] **F4.8** Busca global (Q9) (2026-10-08): `SearchType` ganhou
  `'thesisChapter' | 'thesisReference' | 'thesisTask'`; `SECTION_OF` mapeia os
  três para uma seção `tcc` (label `tcc`) e `SECTION_ORDER` a põe logo após
  `provas`. `GlobalSearchModal` recebe `thesisChapters/thesisReferences/
  thesisTasks` + `onOpenTccScreen` e constrói as entradas (capítulo por
  título/nota; referência resolve o título pelo `readingId` no `ReadingItem`;
  pendência por título) — cada uma abre `openTccScreen(tab, focusId)`, o mesmo
  roteamento da notificação (capítulo→`capitulos`, referência→`leituras`,
  pendência→`orientacao`). `OverlaysContent` passa as props do `app`.
- [x] **F4.9** Visão geral ganha conteúdo real: cartão "próximo prazo"
  (`nextThesisDeadline` + `StatusChip` overdue: "passou do prazo, bora
  reorganizar?"), progresso, esta semana, problema e objetivos (colapsável),
  título do trabalho no primeiro card.

**Gate:** lint 0 · test verde · boundaries 0 · teste do `reorderSiblings` na UI ·
`rg "introdução|referencial teórico" src packages` vazio em seeds.

**Resultado (2026-10-08, parcial — sessão interrompida, continua em outra
máquina):** lint 0 · boundaries 0 · **1386 testes / 119 arquivos** (+19 da F3).
`TccView.test` agora tem **22 testes**; `thesis.test` (domínio), **67**.

**Entregue (F4.1, F4.2, F4.3, F4.4, F4.6, F4.7, F4.9):**

- **Domínio** (`packages/domain/.../thesis.ts`): `orderChaptersForRender`
  (árvore + órfãs no fim), `commitFlatOrder` (ordem visual → posições entre
  irmãos; nada mudou devolve a mesma referência), `moveChapter`,
  `planThesisReminders` (§6.3 completo: gatilhos, só futuro, ordenado, teto de
  64, faixa 3000-3199, `now` por parâmetro com default explícito),
  `routeFromNotificationExtra` (defensivo: extra inválido → null). +7 testes
  de domínio, incluindo regressão com datas atravessando mês/fevereiro.
- **Adaptador** (`notifications.ts`): `syncThesisReminders`/`cancelThesisReminders`
  no padrão de `syncClassReminders` — cancela a faixa e refaz o plano; desligado
  ou sem permissão só cancela (nunca fica lembrete órfão). Efeito de
  reagendamento no `sharedAppValue.ts` (boot + qualquer coleção com data muda).
- **`ChapterSheet`** (`src/components/tcc/ChapterSheet.tsx`, novo): CRUD completo
  com **uma escrita por ação** — ler vivo por id (sem cópia congelada, bug `U5`
  da SPEC-009), mover subir/descer, remover com confirmação (referências só
  perdem `chapterIds`), sem título não escreve.
- **Aba capítulos** (`TccView.tsx`): linha = toggle 44px + título + `StatusChip`
  do estágio + prazo + **alça de arrastar** (`Reorder` do framer-motion,
  `dragListener={false}` + `useDragControls`, alça é `button data-no-swape` —
  o edge-swipe do iOS já ignora `button`); soltar na mesma posição não escreve;
  anúncio `role="status"` da nova posição; **toque na linha abre a sheet**
  (comportamento mudou de propósito — antes alternava).
- **Toggle com desfazer** (F4.1): toast de 8s com `ToastAction` que devolve o
  snapshot inteiro.
- **D5 fechada**: `EditTccModal` emagreceu para "dados do trabalho" — editor de
  capítulos saiu (a sheet é dona), `onSave` é **uma** escrita no singleton.
  Ganhou o **interruptor de lembretes** (F4.6: `reminderPrefs.enabled` via
  `checkbox`; desligado é o default §6.4).
- **Listener do toque** (`MobileAppShell.tsx`): `localNotificationActionPerformed`
  no bootstrap; navegação não depende de dado hidratado (o `focusId` removido
  degrada na própria tela), então a "fila pendente" da spec se mostrou
  desnecessária — decisão registrada, não omitida.

**Correções e aprendizados da sessão:**

- *O plano é puro, o teste tem que ser também:* o `now` do teste de lembretes
  era 12:00 e invalidava gatilhos "no dia" às 09:00 — a função estava certa.
  Corrigido para 08:00, com comentário explicando a semântica.
- *O toast não é renderizado nos testes de componente* (a `Toast` vive na casca,
  que não existe no render de teste) — o teste do "sem título" prova o
  **não-escrito** (sheet continua aberta, sem capítulo na lista), não o texto.
- *`'em revisão'` existe em dois lugares* (option do SegmentedControl em saída
  animada + StatusChip da linha): asserção com `getAllByText`.
- *Gate de semeadura refinado:* `rg "introdução|referencial teórico"` acerta
  banco de questões, conteúdo de psicoterapia, templo e o fixture golden
  (contrato, não seed). A forma precisa é
  `rg "introdução|referencial teórico" src/data/empty.ts src/components/tcc src/components/views/TccView.tsx -g "!*__tests__*"`
  → vazio (verificado). O comentário do `TccView` citava as palavras
  proibidas (falso positivo) — reescrito, igual ao caso do F1 com `new Date(`.

**Fechamento da F4 (2026-10-08):** F4.5 e F4.8 entregues; a fase fecha com
**+3 testes** em `schedule.test.ts` (projeção, destino por id, exclusão de
pronto/resolvida/cancelada) e **+2** em `GlobalSearchModal.test.tsx` (pendência
e capítulo roteando pela aba certa). O que **não** é código de F4 e continua na
fila:

1. **Verificações no aparelho (`[V]`, F10.4):** `Reorder` dentro da lista com
   scroll no iOS; `extra` sobrevive ao agendamento nativo (senão o toque cai
   na visão geral — fallback já defensivo); teto de 64 notificações; e agora
   também o toque no evento `tcc` do calendário abrindo a aba certa no aparelho.
2. **"Esta semana" na visão geral** (F4.9 remanescente): depende do
   `weekWords` sobre `thesisWritingLogs` — entrega natural junto da F5.
3. **`buildCalendarWeek` (Achado A2):** segue código morto. Removê-lo (ou
   ligá-lo) é limpeza separada, fora do escopo da F4.

---

## F5 — Aba escrita [frontend]

- [x] **F5.1** Cartão semana: `weekWords` vs `weeklyWordGoal` (`ProgressBar` com
  `aria-valuetext`), sequência de dias com escrita (reaproveita `streakData`,
  sem criar streak novo), sessões recentes.
- [x] **F5.2** "Registrar escrita" (ação primária do hero): sheet com capítulo,
  palavras escritas (`inputMode="numeric"`, rejeita negativo, vazio = não
  informado ≠ 0 — molde `GoalCta` `InternshipDiaryView.tsx:437-453`), minutos, nota.
  Salvar um log soma `words` ao `wordCount` do capítulo **na mesma escrita**.
- [x] **F5.3** Metas começam **vazias** (Q8): "metas são opcionais — defina
  quando quiser" com atalho para a sheet de dados. Nenhum valor pré-preenchido.
- [x] **F5.4** Conquistas: `tcc-done` exige concluído **e** nenhum capítulo
  obrigatório pendente (D4); `thesis-words`, `thesis-meetings`,
  `thesis-refs-cited` (condições criadas na F2.2, uso aqui);
  `tcc-chapters-done` conta `stage === 'pronto'`.
  - **Condições prontas desde a F2.2** em `src/lib/stickers.ts`, e agora com
    entrada no catálogo. Decisão tomada em 2026-10-08 (confirmada pela dona do
    produto): **trocar 3 ids de estágio redundantes por TCC**, preservando a
    invariante **80/20** e a curva de raridade de `.context/spec-stickers-v2.md`
    (`st-34b` broto → `st-36b` `thesis-words` ≥5000; `st-35b` raiz → `st-37d`
    `thesis-meetings` ≥5; `st-34d` copa → `st-37e` `thesis-refs-cited` ≥10). O
    estágio segue coberto por `st-34`/`st-34c`, `st-35`/`st-4b`/`st-35c` e
    `st-4c`; o progresso persistido dos ids removidos é preservado por
    `mergeCatalogWithProgress` (não some). Os goldens do estado vazio
    (`full_backup.empty.json` + `collections/empty/stickers.json`) foram
    regenerados **com aprovação explícita** (`GOLDEN_WRITE=1`).

**Gate:** lint 0 · test verde · teste do `emptyThesis` (metas ausentes).

**Resultado (F5, 2026-10-08):** lint 0 · boundaries 0 · **1400/119**.
Entregue:

- **`WritingLogSheet`** (`src/components/tcc/WritingLogSheet.tsx`, novo): sessão
  de escrita com capítulo (opcional), palavras, minutos e nota. Salvar é **uma**
  ação: o log entra em `thesisWritingLogs` e, havendo capítulo com `words > 0`, o
  `wordCount` dele sobe na mesma escrita (`D5`; molde do `ChapterSheet.remove`).
  `parseCount`: vazio/negativo/não-inteiro = não informado (≠ 0); salvar sem
  palavras avisa ("quantas palavras você escreveu? pode ser 0 ♡") e não escreve.
- **Aba escrita** (`TccView.tsx`): cartão "esta semana" (`weekWords` vs.
  `weeklyWordGoal`, `aria-valuetext` "N de M palavras esta semana"; sem meta, o
  convite da F5.3 + atalho "definir metas"), sequência de dias escrita
  (`computeStreak` sobre as datas dos logs, sem streak nova), e lista de sessões
  recentes (data civil `formatDateBR` + capítulo + nota).
- **"Esta semana" na visão geral** (F4.9 remanescente): o mesmo cartão, que
  fecha o item 2 do fechamento da F4.
- **Hero:** a ação primária com TCC passou de "editar dados" para **"registrar
  escrita"** (abre a sheet); os dados do trabalho continuam na ação do header e
  no atalho "definir metas". Nenhum teste dependia do rótulo antigo.
- **5 testes novos** em `TccView.test.tsx` (F5.1, F5.2 com soma do `wordCount`,
  "vazio ≠ zero", F5.3 e o rótulo do hero).
- **F5.4 (conquistas):** 3 entradas do catálogo trocadas por TCC
  (`src/data/stickerCatalog.ts`), `spec-stickers-v2.md` atualizada, 2 testes em
  `stickers.test.ts` (catálogo + desbloqueio real) e goldens do estado vazio
  regenerados com aprovação.

---

## F6 — Aba orientação [frontend] ✅

- [x] **F6.1** Pendências: abertas primeiro, vencidas no topo; toque no check =
  `resolvida`; sheet com título, origem (orientadora/minha), capítulo, prazo, status.
- [x] **F6.2** Reuniões: "agendar reunião" (data, hora opcional, modo) e
  "registrar o que foi conversado" (resumo, decisões). Lista: `agendada`
  primeiro (mais próxima no topo), `realizada` depois, `cancelada` recolhida.
- [x] **F6.3** Reunião `agendada` **vai ao calendário e gera lembrete** (Q5) —
  calendário interno, derivado (F4.5), nunca prazo duplicado.
- [x] **F6.4** "Registrar o que foi conversado" vira `realizada` e abre
  "gerar pendências a partir das decisões": cada decisão marcada vira
  `ThesisTask(origin: 'orientadora', meetingId)` **na mesma escrita**;
  "agendar a próxima" cria outra `ThesisMeeting` `agendada` na mesma escrita.
- [x] **F6.5** Fora da v1 (decidido): recorrência (Q5b) e agenda do celular
  (Q5c). Quando a agenda entrar: exige `deviceEventId` guardado (sem ele o
  app não apaga o evento do sistema) e o **F18 corrigido** —
  `src/lib/calendar.ts:17-18` faz `new Date(event.startDate)` (UTC), que em
  `America/Sao_Paulo` joga o evento de dia inteiro para o dia anterior;
  corrigir com `parseDateKey` + teste em UTC−3.

**Gate:** lint 0 · test verde · reunião agendada gera lembrete com e sem `time`;
`cancelada` não. ✅ (2026-10-09)

---

## F7 — Aba leituras e referências ABNT [frontend + backend] 🟡

> ADR-010: o dado bibliográfico mora no `ReadingItem` (dono Biblioteca); o
> `ThesisReference` é o ato de citar. `formatAbnt` é puro e já existe (F1).
>
> **Estado 2026-10-09:** F7.1..F7.4 entregues (gate verde, 1417 testes). F7.5
> (enriquecimento) e F7.6 (dedupe ao colar link-DOI) ficam para depois de F8 —
> dependem de `@capacitor/http` e do fluxo de colar link que a F8 cria.

- [x] **F7.1** `src/types/entity.ts:170-192` — `ReadingItem` ganha os campos
  estruturados (todos opcionais, `backupSchema` é passthrough `:101-107`,
  **sem** transformação na migração): `authors: RefAuthor[]`, `year?`,
  `container?`, `publisher?`, `place?`, `edition?`, `volume?`, `issue?`,
  `pages?`, `doi?`, `accessedOn?`, `refType?`, `rawCitation?` + `enrichStatus?`
  ('pendente' | 'ok' | 'falhou'; ausente = nada a buscar — Q13).
- [x] **F7.2** UI da aba: filtro **único** `PillGroup size="sm" variant="rose"`
  (`todas`·`candidatas`·`lidas`·`citadas`); cartão com `SOBRENOME, I.` em
  `font-display`, título na citação `line-clamp-2`, `StatusChip` de estado,
  ícone de link quando `url`; "copiar tudo" em ordem alfabética
  (`localeCompare('pt-BR', {sensitivity:'base'})`) + `hapticSuccess()` +
  `showToast('lista copiada ♡')`; "nova referência" (botão de adicionar).
- [x] **F7.3** Sheet da referência: prévia ABNT ao vivo em `font-mono` com
  negrito dos `Segment`, copiar (texto puro), campos estruturados da obra,
  tipo abnt, ano, autores ("Sobrenome, Nome; …"), periódico/site/editora,
  editora/lugar, volume/número/páginas, doi, acesso, link, citação à mão,
  status (`SegmentedControl`), capítulos onde será usada, nota. "Nova
  referência": a partir de uma leitura da estante (dedupe por `readingId`).
  **Fora v1 (adiado):** "colar link-DOI" e "preencher à mão" — a F8 cria o
  fluxo de link, e preencher à mão precisa de decisão de onde nasce a leitura
  (F8.5).
- [x] **F7.4** Diagnóstico **não bloqueante**: `validateRef` → "falta: ano,
  local" em `text-[11px] text-status-warning-strong` com `role="status"` — no
  cartão e na sheet.
- [ ] **F7.5** Enriquecimento (Q12): `src/lib/parseCitationMeta.ts` — ordem de
  confiança: **Crossref por DOI** (autores já separados; só o DOI sai da
  máquina) → metatags Highwire → JSON-LD → `og:title`. Preenche **só campo
  vazio**, nunca sobrescreve o que ela digitou; offline fica `pendente`,
  máx. 3 tentativas, depois `falhou` (nunca apaga nada).
  - `@capacitor/http` **não** está em `package.json` — instalar (resolve CORS
    no nativo; no web puro, enriquecimento fica desligado).
  - Autor sem vírgula: **não adivinha** sobrenome — deixa "conferir autores".
- [ ] **F7.6** Dedupe: `normalizeUrl` (F1) como chave; link já guardado mostra
  "esse link já estava guardado ♡" com ação "abrir" — nunca duplica.

**Gate:** lint 0 · test verde · boundaries 0 · `formatAbnt`/`validateRef`
ligados em produção (F7.2/F7.3) · filtros com teste. `mapCrossrefWork` com
fixtures fica junto do F7.5. ✅ (2026-10-09, F7.1..F7.4)

---

## F8 — Captura de link: camadas 1-2 + Android [frontend + nativo] 🟡

> **Estado 2026-10-09:** F8.1..F8.6 entregues no código. O gate web passou
> (lint 0 · test verde · boundaries 0). **Os arquivos nativos (iOS/Android)
> foram escritos mas NÃO compilados** — esta máquina não tem JDK/SDK/Xcode
> (`AGENTS.md`). O `appUrlOpen` do iOS depende do `SceneDelegateProxy` do
> Capacitor (já presente) e do `CFBundleURLTypes` novo; o Android depende do
> plugin local `ShareTargetPlugin` + `registerPlugin` no `onCreate`.
> A Share Extension (F9) segue condicional ao spike.

- [x] **F8.1** `captureLink(input)` — **uma escrita por ação** (§8.5): artigo pro
  TCC cria `ReadingItem` **+** `ThesisReference` juntos; sem TCC, só
  `ReadingItem`; leitura = `type: 'livro'`. Título provisório do `og:title` ou
  host; autor `'autor não informado'` (mesmo texto do `ReadingWizard:316`);
  `enrichStatus: 'pendente'`. → `packages/domain/src/core/domain/thesis.ts:962`.
- [x] **F8.2** Sheet de captura (§8.6): dois controles e um botão, **sem
  teclado** — `SegmentedControl` "é um… artigo/leitura" (leitura = "livro pra
  ler") e "é pro tcc? sim/não" (**padrão: sim**, Q2; nada é "lembrado").
  `labelledBy` obrigatório (`Modal.tsx:17,109`). Alça/fechar pelo padrão do
  `Modal`. Ao guardar: `hapticSuccess()` + toast.
  → `src/components/capture/CaptureLinkSheet.tsx`.
- [x] **F8.3** Camada 1 (sempre funciona): botão "guardar link" no hub de
  leitura e na aba leituras → mesma sheet.
  → `src/components/leitura/ReadingHubScreen.tsx`, `TccView.tsx`.
- [x] **F8.4** Camada 2: `ios/App/App/Info.plist` ganha `CFBundleURLTypes` com
  `cecistudy://`; `appUrlOpen` de `@capacitor/app` em `src/lib/captureLink.ts`
  (`subscribeCaptureDeepLink`); `cecistudy://captura?u=<url>&k=…&t=…&x=<id>`
  salva **direto** (`parseCaptureDeepLink`), mostra "prontinho ♡" e o app
  **permanece aberto** (só a extensão fecha tudo — §8.2). Host:
  `src/shells/CaptureHost.tsx`.
- [x] **F8.5** Android (Q14): `AndroidManifest.xml` — `intent-filter`
  `ACTION_SEND` + `text/plain` na `MainActivity`. `MainActivity.java` +
  `ShareTargetPlugin.java` (plugin local `shareReceived` + `getPendingShare()`,
  partida a frio, `registerPlugin` no `onCreate`/`onNewIntent`).
  `extractFirstUrl` pega a primeira URL de texto livre; sem URL: "não achei um
  link nesse texto". Ao guardar: `minimizeAfterCapture()` (só Android,
  `App.minimizeApp()`) — `[V]` comportamento da ^8.1.1.
- [x] **F8.6** Segurança: `isValidUrl` (recusa `javascript:`/`file:`/`data:`,
  limite 2048), URL tratada como dado, sem cookies, timeout 8s, nunca bloqueia a UI.

**Gate:** lint 0 · test verde · boundaries 0 · `extractFirstUrl` (título+URL,
só URL, sem URL, duas URLs) · `appUrlOpen` com mock não duplica o mesmo link ·
`MinimizeApp` **fora de `src/components`** (regra do boundaries: shared UI não
brancha por plataforma). ✅ web (2026-10-09); nativo **não compilado aqui**.

---

## F9 — Share Extension iOS [nativo, condicional ao spike]

> Só entra se o spike passar. Sem Mac: tudo via runner macOS do GitHub Actions.
> Decidido (Q3b): tentar a extensão; se o SideStore gratuito não permitir,
> **arquivar** e ficar com as camadas 1-2. Máximo **3 rodadas** de teste.

- [ ] **F9.1** Spike F0 (CI): app mínimo + extensão "olá" + App Group, IPA
  unsigned, instalado do mesmo jeito que ela instala (SideStore + Apple ID
  gratuito). Verifica: extensão instala, App Group aceito, quantos App IDs
  consome, fila lida pelo app, a folha fecha e volta ao Safari. Resultado na
  §15 da spec.
- [ ] **F9.2** Script de CI em `.github/scripts/` com `xcodeproj` (Ruby),
  **idempotente** (rodar 2× não duplica o alvo), que adiciona o alvo
  `ShareExtension` a `ios/App/App.xcodeproj` (367 linhas, **zero** phase de
  Copy Files hoje), os arquivos Swift, `Info.plist` com
  `NSExtensionActivationSupportsWebURLWithMaxCount=1` (**não**
  `TRUEPREDICATE`), entitlements e o "Embed App Extensions". Decidido: Q16,
  script no GitHub Actions, resultado commitado.
- [ ] **F9.3** UI SwiftUI espelhando a sheet de captura (mesmos textos via
  `CAPTURE_COPY` compartilhada); salva um item na fila
  (`CaptureInbox`: JSON no container do App Group, `NSFileCoordinator`) e
  `completeRequest` devolve ao Safari — **o app nem abre**; é isso o "fecha tudo".
- [ ] **F9.4** Plugin Capacitor local `CaptureInbox` (Swift): `drain()` devolve
  e `ack(ids)` limpa **só o que foi confirmado** — sem `ack`, nada se perde.
  No JS: `drain()` no bootstrap e em `appStateChange → active`, `captureLink`
  por item, `ack`. Idempotente por id e por URL normalizada.
- [ ] **F9.5** Group id lido **em runtime** (reassinação do SideStore reescreve
  ids — nunca fixo no código). Log de diagnóstico (50 eventos) + tela escondida
  no app. `release.yml:293-309` usa `CODE_SIGNING_ALLOWED=NO` — o IPA unsigned
  precisa embutir a extensão nesse caminho (testável no CI).

**Gate:** CI gera IPA com a extensão embutida · 3 rodadas no aparelho dela ·
resultado na §15; se falhar, arquivar com as camadas 1-2 entregues.

---

## F10 — Documentação e entrega [docs]

- [ ] **F10.1** `AGENTS.md` do mobile — `SCHEMA_VERSION` 22, `SPEC-012`, regra
  "um vínculo, uma fonte" com o caso do dado bibliográfico (ADR-010).
- [ ] **F10.2** Spec migra para `docs/specs/SPEC-012-gestao-de-tcc.md` com o
  cabeçalho no formato do grupo; §14/§17 já refletindo o que foi entregue.
- [ ] **F10.3** `SPEC-M-016` (espelho de grupo) atualizada com o estado real de
  cada invariante; pendências da ADR-010 no `roadmap.md` conferidas.
- [ ] **F10.4** `docs/manual-tests.md` — partida a frio da notificação, captura
  no aparelho, reorder no scroll (iOS), os itens `[V]` da §15 resolvidos ou
  re-datados.
- [ ] **F10.5** Tarefa no breakdown Rust (`cecistudy-rust/spec/01-task-breakdown-flutter-rust.md`,
  domínio `thesis`) registrando o contrato novo — o desktop é spec-first a
  partir de `contracts/` e não é tocado por esta spec (ADR-009).

**Gate:** índices de specs/ADRs batem com `Get-ChildItem … | Measure-Object` ·
varredura U+FFFD limpa.

---

## Verificação de baseline (rodar antes de cada fase)

```bash
npm run lint
npm run test
node .github/scripts/check-boundaries.mjs
```

**Testes que a F2 vai quebrar (congelados hoje):**
`collections.test.ts:93-121` (lista literal + ordem) · `goldenFixtures.test.ts:84-126`
(registry + 10 arquivos + full_backups) · `migrationFixtures.test.ts:132-142`
(loop 2..22 exige `legacy_payload.v22.json`) · `exportImport.test.ts:65-72,189,378` ·
`dataClient.test.ts:81` · `userDb.test.ts:154-163,276-287` ·
`stickers.test.ts:27,114-116,216-219,290,298,340` · `goldenSample.ts:332-342` ·
`schedule.test.ts` (assinatura do bloco TCC muda).

**Decisões que travam o escopo** (respondidas pela dona do produto, 2026-10-08):
5 abas mantidas (são as 4 prioridades da §2 + síntese) · arrastar **e** mover ·
registro livre · metas vazias · busca global sim · toque na notificação abre a
aba certa · Android sim · `enrichStatus` no `ReadingItem` · extensão só se o
spike passar (camadas 1-2 sempre) · agenda do celular e recorrência **fora** da v1.