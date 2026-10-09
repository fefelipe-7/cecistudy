# SPEC-012 · Gestão de TCC (mobile) e captura de links pelo iPhone

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **proposta** — 17 das 20 perguntas respondidas em 2026-10-08 (ver §14)
> App afetado: mobile (React/TS + Capacitor); contratos Rust/desktop afetados em §9.4
> Depende de: SPEC-009 (padrão "uma escrita por ação", vínculo com fonte única), SPEC-010 (padrão hero), SPEC-M-014 (leitura unificada)
> Decisões de grupo: ADR-010 (dono do dado bibliográfico)
> Espelha no grupo: SPEC-M-016
> Supersede: — (a spec arquivada `docs/archive/desktop-context/Especificação do módulo de TCC do cecistudy.md` continua sendo a visão do **desktop**; esta spec é o recorte mobile)
> Data: 2026-10-07 · **Revisada em 2026-10-08** (ver §17)

## Como ler as marcas de decisão

| Marca | Significado |
|---|---|
| `[D]` | Decidido pelo Felipe nesta conversa (2026-10-07) |
| `[P]` | **Proposta** minha, com alternativa rejeitada registrada. Precisa de aprovação |
| `[?]` | **Pergunta aberta**: não decidi por você; está na §14 com as opções |
| `[V]` | **Não verificado**: afirmação sobre iOS/ferramentas que eu não consegui confirmar. Vira tarefa da Fase 0 |

Tudo que está marcado `[V]` ou `[?]` é ambiguidade tratada de forma explícita: nada foi preenchido com suposição silenciosa.

## Aviso de numeração

O arquivo nasceu como `SPEC-011`, mas **`SPEC-011` já existe**
(`docs/specs/SPEC-011-estagio-completar-registro-passo-a-passo.md`, entregue
2026-10-07, espelhada como `SPEC-M-015` no grupo). Esta spec é **`SPEC-012`** no
mobile e **`SPEC-M-016`** no grupo. Nenhum arquivo precisa ser renomeado: o nome
do arquivo é `spec-tcc.md` e só o número no título mudou.

---

## 1. Contexto e diagnóstico (como o TCC funciona hoje)

### 1.1 Mapa do que existe

| Camada | Arquivo | O que faz |
|---|---|---|
| Tipo | `src/types/profile.ts` (`TccData`) | Objeto único: `title`, `advisor`, `field`, `problemStatement`, `objectives[]`, `status` (`em_andamento` \| `revisao` \| `concluido`), `chapters[]` (`title`, `completed`, `dueDate?`), `references[]` (string) |
| Seed | `src/data/empty.ts` (`emptyTcc`) | Tudo vazio; app começa do zero |
| Persistência | `packages/data/src/collections.ts` | `{ key: 'tcc', kind: 'singleton', table: 'thesis_project', syncable: true }` |
| SQLite nativo | `src/lib/db/normalize.ts` (`saveTcc`) | Apaga e reinsere `thesis_project`/`thesis_chapter`/`thesis_reference` a cada save; os dados completos ficam em `data_json` |
| Contrato Rust | `cecistudy-rust/contracts/schema.sql` + `contracts/golden/collections/{sample,empty}/tcc.json` | `thesis_project` com `CHECK (id = 1)`; `thesis_chapter` e `thesis_reference` **sem id** |
| Tela | `src/components/views/TccView.tsx` (171 linhas) | Cabeçalho compacto, resumo, cronograma de capítulos (toque marca/desmarca), referências em texto |
| Edição | `src/components/tcc/EditTccModal.tsx` (267 linhas) | **Um** modal bottom-sheet com todos os campos; um único "guardar tcc" |
| Ação | `src/context/dataActions.ts` (`handleUpdateTcc`) | `setTcc(updated)` — substitui o objeto inteiro |
| Navegação | `src/context/navigationEngine.ts` (`openTccScreen`, `openEditTcc`), `src/lib/headerConfig.ts` | Tela `{ kind: 'tcc' }` empilhada sobre a aba `estudos`; modal separado |
| Entradas | `EstudosView.tsx` (card "meu tcc" com `% dos capítulos`), `PerfilView.tsx` (linha "capítulos do tcc") | Só leem `chapters` |
| Calendário | `src/lib/schedule.ts` (bloco "TCC") | Capítulo com `dueDate` vira bloco; `id = tcc-ch-${índice}`; `entryRef: 'tccChapter'` |
| Conquistas | `src/lib/stickers.ts` | `tcc-created`, `tcc-done`, `tcc-chapters-done` (só contam título/status/capítulos) |
| Backup/sync | `packages/data/src/backupSchema.ts`, `packages/sync/src/stamp.ts` | `tcc` é `syncable` e singleton |

### 1.2 Problemas encontrados (F = finding)

| ID | Problema | Evidência | Consequência |
|---|---|---|---|
| **F1** | **Mutação direta do estado** ao marcar capítulo | `TccView.tsx`: `handleToggleChapter` copia o array (`[...tcc.chapters]`) mas faz `updatedChapters[index].completed = !…` no **mesmo objeto** do capítulo | O array é novo, mas o objeto do capítulo é compartilhado com o estado anterior. Qualquer comparação por referência (memo, desfazer, diff) vê o valor antigo já alterado. Bug latente, não visível hoje |
| **F2** | Capítulos identificados por **índice** | `schedule.ts` usa `tcc-ch-${ci}`; `EditTccModal` usa `key={idx}` | Reordenar ou apagar um capítulo muda o id de todos os seguintes; um vínculo futuro (calendário, lembrete, leitura) aponta para o capítulo errado |
| **F3** | Prazo exibido cru | `TccView.tsx`: `prazo: {ch.dueDate}` mostra `2026-10-01` | Foge da regra do AGENTS (data civil via `formatDateBR`, nunca string ISO na UI) |
| **F4** | `status` do TCC independe dos capítulos | `status` é escolhido manualmente no modal | Dá para marcar "concluído" com 0/5 capítulos (e a conquista `tcc-done` dispara) |
| **F5** | Capítulo só tem título, check e prazo | `TccData['chapters']` | Não há "escrevendo / em revisão", nem meta de palavras, nem nota, nem seção |
| **F6** | **Referências são texto solto** | `references: string[]` | Sem vínculo com `ReadingItem`; sem estrutura (autor/ano/DOI); sem formatação ABNT garantida; sem status (candidata / lida / citada) |
| **F7** | Leitura não sabe que é "do TCC" | `ReadingItem` (`entity.ts`) tem `url` e `type: 'artigo'`, mas nenhum campo/relação com o TCC | Artigo lido não vira referência; referência não leva ao artigo |
| **F8** | Sem orientação | `advisor` é string única | Nada de reuniões, decisões, pendências, "próximos passos" |
| **F9** | Sem acompanhamento de escrita | — | Só se mede "capítulo pronto ou não". Escrita parcial é invisível; conquistas só premiam o fim |
| **F10** | Sem prazos do trabalho inteiro nem lembretes | `notifications.ts` só tem lembrete diário e semanal de aula (`syncClassReminders`) | Entrega final, banca e prazo de capítulo não avisam |
| **F11** | Edição em **um modal gigante** | `EditTccModal.tsx` | Mexer em um capítulo exige abrir tudo; "cancelar" descarta tudo; ruim em tela pequena |
| **F12** | Tela fora do padrão hero | `TccView` abre com cabeçalho compacto `rounded-2xl` com ícone de 40px (mesmo padrão que o Estágio tinha antes da SPEC-010) | Parece menos importante que Home/Faculdade/Estágio |
| **F13** | Sync por **objeto inteiro** | `tcc` é singleton com `stamps` por coleção (LWW) | Edição no mobile e no desktop em capítulos diferentes: um sobrescreve o outro. Coleções de array têm LWW por registro + tombstones |
| **F14** | **Dois modelos paralelos** | `packages/domain/src/core/domain/projects.ts` (`Project`, `AcademicNode`, `Output`, `Reference`, `Citation`, `MAX_ACTIVE_PROJECTS = 5`) e `TccData` não se conhecem | O desktop já pensa em "projeto"; o mobile tem um singleton incompatível. Migrar depois fica caro se nada for preparado agora |
| **F15** | Sem testes do TCC | Existem testes de `stickers`, `schedule`, `collections`, golden; não encontrei teste de `TccView`, `EditTccModal` nem `handleUpdateTcc` | Refatorar sem rede |
| **F16** | Drift de documentação | `AGENTS.md` diz `SCHEMA_VERSION` 20; o código (`packages/data/src/schema.ts`) está em **21** | A próxima migração é a **22**. Atualizar o AGENTS junto |
| **F17** | Nenhum receptor de link externo | Não há `appUrlOpen` nem `CFBundleURLTypes` no `Info.plist`; `@capacitor/app` já é dependência (usado só para `backButton`) | A captura pelo compartilhar (§8) parte do zero no lado nativo |

### 1.3 O que já está bom e deve ser preservado

- Tom e copy (pt-BR minúsculo, caloroso, nunca chamar a usuária de "Ceci").
- Toque no capítulo para marcar como pronto (rápido, gostoso).
- Mascotes `research-tcc` e `writing-flow`.
- Integração com calendário (camada "TCC") e conquistas existentes.
- Fluxo de leitura unificado (SPEC-M-014): `ReadingItem`, `ReadingSession`, `ReadingHighlight`, `ReaderModeModal`.

---

## 2. Objetivo, escopo e não-objetivos

**Objetivo.** Transformar "meu tcc" de uma ficha com checklist em um **painel de gestão do trabalho**: saber onde estou, o que vence, o que li e posso citar, o que a orientadora pediu e quanto escrevi. E tornar o ato de guardar um artigo da web quase instantâneo.

**Escopo da v1 `[D]`** (as quatro prioridades escolhidas):

1. Cronograma e prazos com lembretes.
2. Leituras e artigos ligados às referências ABNT.
3. Reuniões e pendências da orientação.
4. Acompanhamento da escrita (metas, palavras, sessões).

Mais: **captura de link pelo compartilhar do iPhone** (§8) e a base de dados "Project-ready" (§4).

**Não-objetivos (fora desta spec):**

- Editor de texto do TCC, DOCX, round-trip, versões, conformidade institucional, IA (continuam na spec do desktop).
- Vários TCCs/projetos no mobile `[D]` (um TCC; o modelo só fica preparado).
- Colaboração/compartilhar com a orientadora.
- Android Share Target (anotado em §8.8 como extensão barata; só entra se você pedir).

---

## 3. Decisões

### D1 · Um TCC no mobile, com modelo "Project-ready" `[D]`

- **Decisão.** O TCC continua único. Cada registro novo carrega `thesisId` (constante `'tcc-main'` hoje) que mapeia 1:1 para `Project.id` quando o mobile adotar `Project`. Os capítulos já usam a forma de `AcademicNode` (`kind`, `requiredness`, `parentId`, `position`).
- **Alternativas rejeitadas.** (a) Migrar já para `Project` + `Output` — descartado por você. (b) Manter tudo dentro do singleton — descartado por F2/F13 (ids por índice e sync por objeto inteiro).

### D2 · Capítulos e referências saem do singleton e viram coleções com id `[P]`

- **Decisão.** `tcc` (singleton, chave mantida por compatibilidade) fica só com os dados do trabalho (título, orientadora, área, problema, objetivos, status, prazos). Novas coleções `array`, `syncable`: `thesisChapters`, `thesisReferences`, `thesisMeetings`, `thesisTasks`, `thesisWritingLogs`.
- **Justificativa.** Resolve F2 (id estável) e F13 (LWW por registro com tombstone). É o mesmo caminho que `readingSessions`/`readingHighlights` tomaram na SPEC-M-014.
- **Alternativa rejeitada.** Dar `id` aos itens **dentro** do singleton: corrige F2, mas F13 continua, e cada nova entidade (reuniões, pendências, escrita) incharia o `data_json` do singleton.
- **Custo assumido.** Mexe em `COLLECTIONS`, `backupSchema`, `persistentData`, `dataClient`, `stamp`, SQLite, contrato Rust e goldens (§9). É a maior parte do trabalho técnico.

### D3 · O vínculo leitura ↔ referência tem **fonte única** `[P]`

- **Decisão.** O vínculo vive só em `ThesisReference.readingId`. `ReadingItem` **não** ganha campo "é do TCC". "Pro TCC?" é **derivado** (`buildThesisLinkIndex`), igual ao que a SPEC-009 fez com `discussedLogIds`.
- **Alternativa rejeitada.** Flag `forThesis` no `ReadingItem` + `readingId` na referência: reintroduz exatamente o problema F2/F3 da SPEC-009 (dois lados escritos, desincronizam).

### D4 · Status do TCC deixa de ser independente `[P]`

- **Decisão.** `status` continua editável, mas marcar `concluido` com capítulos pendentes pede confirmação ("ainda tem 2 capítulos sem pronto — concluir mesmo assim?"). A conquista `tcc-done` passa a exigir **status concluído E nenhum capítulo obrigatório pendente**.
- **Alternativa rejeitada.** Derivar `status` 100% dos capítulos: tira o controle da usuária (ex.: "em revisão" depende da orientadora, não dos capítulos).

### D5 · Edição por partes, não por modal único `[P]`

- **Decisão.** O `EditTccModal` encolhe para **"dados do trabalho"** (título, orientadora, área, status, problema, objetivos, prazos). Capítulo, referência, reunião, pendência e sessão de escrita têm **sheet própria**, com salvamento por ação.
- **Alternativa rejeitada.** Edição inline em tudo: difícil de acertar alvo de toque em listas longas no iPhone.

### D6 · Captura de link: estratégia em camadas `[P]`, condicionada à Fase 0 `[V]`

- **Decisão.** Três níveis, do que funciona sempre ao que depende de verificação: (1) colar link dentro do app; (2) atalho do iOS (Shortcuts) + URL scheme `cecistudy://`; (3) **Share Extension nativa** (a experiência exata que você descreveu). `[D]` Felipe quer **extensão e atalho**: o atalho **permanece** como reserva mesmo que a extensão funcione (é o que sobra se a assinatura da extensão falhar numa renovação). A Fase 0 decide se o nível 3 é viável. Detalhes na §8.
- **Q3 `[D]` (com ressalva `[?]` Q3b).** Você respondeu "sim, ficamos na fase 1 e 2 (ficar sem extensão)". Li como: **não pagar a conta Apple Developer**; se a Fase 0 mostrar que a extensão não roda no SideStore gratuito, **ficamos só com as camadas 1 e 2** (colar link + atalho). Essa leitura é a única compatível com você ter escolhido o script de CI da extensão (Q16) e pedido extensão + atalho. Se a intenção era **desistir da extensão desde já**, a Fase 0, a Fase 6 e a §8.7 saem da spec (Q3b).
- **Alternativa rejeitada.** Prometer só a extensão nativa: com sideload gratuito, App Group e limite de App IDs são riscos reais `[V]`; se falhar, a feature inteira cai.

### D7 · Metadados do artigo são enriquecidos **depois** de salvar `[P]`

- **Decisão.** Salvar é instantâneo (só URL + título provisório + escolhas). O app busca título/autores/ano/DOI em segundo plano na próxima abertura (`enrichStatus`).
- **Alternativa rejeitada.** Buscar a página antes de salvar: a tela de captura esperaria rede e deixaria de ser "bem rápida".

---

## 4. Modelo de dados

> Datas civis: `DateKey` (`YYYY-MM-DD`, fuso local). Proibido `new Date('YYYY-MM-DD')` e `toISOString().slice(0,10)`. Usar `toDateKey`/`formatDateBR`/`todayKey` do domínio (regra do AGENTS, SPEC-009).
> Timestamps de auditoria (`createdAt`/`updatedAt`) são ISO e **nunca** são gerados dentro de migração.
> IDs: `makeId('thc')`, `makeId('thr')` etc. (`packages/domain/src/core/domain/ids.ts`). **Não** usar `'x-' + Date.now()` (hoje o `ReadingWizard` faz isso).

Arquivo novo: `packages/domain/src/core/domain/thesis.ts`. Stubs de compat em `src/types/thesis.ts` com re-export **relativo** (`export * from '../../packages/domain/src/core/domain/thesis'`). `packages/*` não importa `react`/`@capacitor/*`.

### 4.1 `ThesisProject` (singleton `tcc`, chave mantida)

```ts
export const THESIS_ID = 'tcc-main' as const;

export interface ThesisProject {
  workspaceId?: string;
  id: typeof THESIS_ID;                 // ← vira Project.id depois
  title: string;
  advisor: string;                       // nome; contato fica em meetings/notes
  field: string;
  problemStatement: string;
  objectives: string[];
  status: 'em_andamento' | 'revisao' | 'concluido';
  // novos
  deliveryDate?: DateKey;                // entrega final
  defenseDate?: DateKey;                 // banca
  wordGoalTotal?: number;                // meta total de palavras (opcional)
  weeklyWordGoal?: number;               // meta semanal (opcional)
  reminderPrefs: ThesisReminderPrefs;    // §6.4
  // REMOVIDOS do singleton (migram na MIGRATIONS[22]): chapters, references
}
```

### 4.2 `ThesisChapter` (coleção `thesisChapters`)

```ts
export type ChapterStage = 'a_fazer' | 'escrevendo' | 'em_revisao' | 'pronto';

export interface ThesisChapter {
  id: EntityId;                          // 'thc-…'
  workspaceId?: string;
  thesisId: typeof THESIS_ID;
  parentId?: EntityId;                   // seção dentro de capítulo (v1: no máx. 2 níveis)
  position: number;                      // ordem entre irmãos
  title: string;
  kind: 'preatextual' | 'capitulo' | 'secao' | 'postextual' | 'opcional'; // = AcademicNodeKind
  requiredness: 'obrigatorio' | 'recomendado' | 'opcional' | 'oculto' | 'nao_aplicavel'; // = Requiredness
  stage: ChapterStage;                   // `completed` deixa de existir; pronto === stage 'pronto'
  dueDate?: DateKey;
  wordGoal?: number;
  wordCount?: number;                    // total atual informado pela usuária
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

- `completed` (boolean antigo) é **derivado**: `stage === 'pronto'`. O toque rápido na lista alterna `pronto ↔ escrevendo`; o estágio completo se escolhe na sheet.
- v1 só expõe `kind: 'capitulo' | 'secao'` na UI; os demais valores existem para casar com `AcademicNode` do desktop.

### 4.3 `ThesisReference` (coleção `thesisReferences`)

```ts
export type RefType = 'artigo' | 'livro' | 'capitulo' | 'site' | 'tese' | 'outro';
export type RefStatus = 'candidata' | 'lida' | 'citada' | 'descartada';

export interface RefAuthor { family: string; given?: string; }   // "SILVA", "Ana"

export interface ThesisReference {
  id: EntityId;                          // 'thr-…'
  workspaceId?: string;
  thesisId: typeof THESIS_ID;
  readingId?: EntityId;                  // FONTE ÚNICA do vínculo (D3)
  type: RefType;
  status: RefStatus;
  authors: RefAuthor[];
  title: string;
  subtitle?: string;
  container?: string;                    // periódico, livro, site
  publisher?: string;
  place?: string;
  edition?: string;
  year?: string;
  volume?: string;
  issue?: string;
  pages?: string;                        // "1-15"
  doi?: string;
  url?: string;
  accessedOn?: DateKey;                  // obrigatório para ABNT online
  chapterIds?: EntityId[];               // onde pretende usar/ usou
  note?: string;
  manualText?: string;                   // se preenchido, VENCE o texto gerado (importado da lista antiga)
  createdAt: string;
  updatedAt: string;
}
```

- **Texto final** = `manualText ?? formatAbnt(ref)`. Nunca se persiste o texto gerado (evita ficar velho quando um campo muda).
- Referências antigas (string) entram com `type: 'outro'`, `status: 'citada'`, `manualText = string original`, para **nada mudar** na lista que ela já montou.

### 4.4 `ThesisMeeting` e `ThesisTask` (orientação)

```ts
export type MeetingStatus = 'agendada' | 'realizada' | 'cancelada';

export interface ThesisMeeting {
  id: EntityId; workspaceId?: string; thesisId: typeof THESIS_ID;
  date: DateKey; time?: string;          // "HH:mm" 24h local
  mode: 'presencial' | 'online' | 'mensagem';
  status: MeetingStatus;                 // 'agendada' vai ao calendário e gera lembrete (Q5)
  summary?: string;                      // preenchido quando vira 'realizada'
  decisions: string[];
  createdAt: string; updatedAt: string;
}
// Não existe `nextMeetingDate`: "agendar a próxima" cria OUTRA ThesisMeeting
// (status 'agendada') na mesma escrita. A reunião é a fonte única do evento.

export type TaskStatus = 'aberta' | 'em_andamento' | 'resolvida' | 'arquivada';

export interface ThesisTask {
  id: EntityId; workspaceId?: string; thesisId: typeof THESIS_ID;
  title: string;
  origin: 'orientadora' | 'minha';       // quem pediu
  meetingId?: EntityId;                  // reunião de origem (opcional)
  chapterId?: EntityId;                  // capítulo relacionado (opcional)
  dueDate?: DateKey;
  status: TaskStatus;
  createdAt: string; updatedAt: string;
}
```

### 4.5 `ThesisWritingLog` (escrita)

```ts
export interface ThesisWritingLog {
  id: EntityId; workspaceId?: string; thesisId: typeof THESIS_ID;
  date: DateKey;
  chapterId?: EntityId;
  words: number;                         // palavras ESCRITAS na sessão (≥ 0; pode ser 0 se só revisou)
  minutes?: number;
  note?: string;
  createdAt: string; updatedAt?: string;
}
```

- `ThesisChapter.wordCount` é o total informado; o log é o **delta**. Salvar um log com capítulo escolhido soma `words` ao `wordCount` do capítulo **na mesma escrita** (uma atualização de estado, regra "uma escrita por ação").
- Total do trabalho = soma de `wordCount` dos capítulos folha (derivado, não persistido).

### 4.6 Extensões em tipos existentes

- `ReadingItem`: **nenhum campo de vínculo com o TCC** (D3). Único campo novo `[D]` (Q13): `enrichStatus?: 'pendente' | 'ok' | 'falhou'` (ausente = não se aplica / nada a buscar). É estado de enriquecimento, **não** vínculo, então não fere D3. Campo opcional: não exige transformação de dados na `MIGRATIONS[22]`; `backupSchema` é `passthrough`; verificar se o golden de leitura (`contracts/golden`) lista campos e regerar só se listar (§9.4). A leitura vinda de link usa `type: 'artigo'` ou `type: 'livro'` (§8.5).
- `StickerCondition` (`src/types/profile.ts`): novas condições opcionais `thesis-words` (min), `thesis-meetings` (min), `thesis-refs-cited` (min). `tcc-chapters-done` passa a contar `stage === 'pronto'`.

### 4.7 Selectors puros (domínio)

`thesisProgress(chapters)`, `nextThesisDeadline(thesis, chapters, tasks, today)`, `daysToDelivery`, `weekWords(logs, weekStartKey)`, `buildThesisLinkIndex(refs)` → `{ byReadingId, citedCount, candidateCount }`, `chapterTree(chapters)`. Todos recebem `today: DateKey` por parâmetro (nenhum lê relógio dentro).

---

## 5. Telas e fluxos

Padrões obrigatórios: **um `HeroCard`** no topo (SPEC-010: eyebrow "tcc", serifa, mascote, `rounded-[26px]`, ação primária **no hero**), **um** `PillGroup` como filtro/aba por tela, tokens semânticos (`text-ceci-primary`, `bg-surface-rose`…; nunca hex em classe), alvo de toque ≥ 44px, copy pt-BR minúscula e calorosa.

### 5.1 `TccView` (reescrita)

**Hero** (conteúdo muda com o estado, identidade fixa):

| Estado | Título | Frase | Ação primária |
|---|---|---|---|
| sem TCC (`title` vazio) | "meu tcc" | "um título, uma pergunta e o caminho vai se desenhando" | "bora começar?" → sheet de dados do trabalho |
| com TCC | o título do trabalho (2 linhas, truncado) | resumo: `{n} de {m} capítulos prontos • entrega em {X} dias` (ou "sem data de entrega ainda") | "registrar escrita" → sheet de sessão |

**Abas** (`PillGroup`, uma só): `visão geral` · `capítulos` · `leituras` · `orientação` · `escrita`. Estado de aba é local (não vai para `NavScreen`; não bumpa schema).

#### Aba "visão geral"
1. Cartão **"próximo prazo"** (`nextThesisDeadline`): capítulo, pendência, reunião ou entrega; mostra `formatDateBR` e "em N dias"; atrasado vira `StatusChip` de alerta (copy: "passou do prazo, bora reorganizar?").
2. Cartão **progresso**: barra de capítulos prontos + palavras totais vs. meta (se houver meta).
3. Cartão **esta semana**: palavras escritas / meta semanal, sessões, pendências abertas.
4. Cartão **problema e objetivos** (o conteúdo que já existe hoje).
5. Se nada tem prazo: `EmptyState` com mascote `writing-flow` e botão "definir entrega".

#### Aba "capítulos"
- Lista em árvore (capítulo → seções). Cada linha: `CompletionToggle`, título, `StatusChip` do estágio, prazo (`formatDateBR`), barra fina de palavras se houver meta.
- **Toque na linha** abre a sheet do capítulo; **toque no toggle** alterna `pronto ↔ escrevendo` com `showToast('capítulo guardado ♡')` só ao concluir (comportamento atual preservado).
- Botão "adicionar capítulo" no fim da lista.
- **Reordenar `[D]` (Q6): arrastar E mover para cima/baixo.** Arrastar pela **alça** (ícone de 6 pontos à direita; nunca a linha inteira, para não brigar com o scroll nem com o toque que abre a sheet) usando `Reorder` do `framer-motion` (já é dependência, ^13; **sem biblioteca nova**) com `useDragControls` e `dragListener={false}` na linha. "Mover para cima/baixo" nos três pontinhos é a alternativa **acessível** (leitor de tela, quem prefere não arrastar) e também o caminho para mover entre posições distantes. Regras: arrastar reordena **só entre irmãos do mesmo `parentId`**; mudar de pai se faz na sheet (campo "dentro de"). Ao soltar, uma única escrita reindexa `position` dos irmãos (0…n-1); soltar na mesma posição não escreve. Háptico leve ao pegar e ao soltar. Respeita `prefers-reduced-motion` (sem animação de deslocamento). `[V]` conferir na implementação que o `Reorder` funciona dentro da lista em scroll da tela e que não conflita com o gesto de voltar do iOS.
- Sheet do capítulo: título, tipo (capítulo/seção), estágio (`SegmentedControl`), prazo (`input type=date`), meta de palavras, palavras atuais, nota, referências vinculadas (lista, tocar abre a referência), remover (confirmação; referências só perdem o `chapterIds`).
- **Registro livre `[D]` (Q7):** o sistema **não sugere nem semeia** capítulos. A lista nasce vazia e ela monta do jeito que achar melhor (títulos livres, capítulos e seções, na ordem que quiser). Nada de "modelo de TCC", nem estrutura padrão do `createProject` do desktop. Estado vazio: mascote `writing-flow` + um botão "adicionar o primeiro capítulo".
- Sheet do capítulo ganha o campo **"dentro de"** (nenhum / outro capítulo) para aninhar uma seção; no máximo 2 níveis na v1.

#### Aba "leituras"
- Filtro secundário em chips (não é segunda aba): `todas` · `candidatas` · `lidas` · `citadas`.
- Card de referência: autor (SOBRENOME), título, ano, `StatusChip`, ícone de link se há `readingId`.
- Toque abre a sheet da referência: campos estruturados, **prévia ABNT** (com negrito no que a norma pede), botão **copiar** (texto puro), botão **abrir leitura** (se há `readingId`) e **abrir link** (se há `url`), status, capítulos onde será usada, nota.
- Cabeçalho da aba: "lista de referências (abnt)" com ação **"copiar tudo"** em ordem alfabética (regra ABNT: ordem alfabética de sobrenome).
- Ação "nova referência": três caminhos — `a partir de uma leitura` (escolhe da estante), `colar link/DOI` (cria candidata e enriquece), `preencher à mão`.
- Banner de qualidade, não bloqueante: referências com campo obrigatório ABNT faltando mostram "faltam: ano, local" (diagnóstico, nunca impede salvar).

#### Aba "orientação"
- Seção **pendências** (abertas primeiro, vencidas no topo): toque no check marca `resolvida`; sheet com título, origem (orientadora/minha), capítulo, prazo, status.
- Seção **reuniões**: duas ações no topo, **"agendar reunião"** (data, hora opcional, modo) e **"registrar o que foi conversado"** (resumo, decisões). Lista: `agendada` primeiro (a mais próxima no topo), depois `realizada` (mais recente primeiro); `cancelada` fica recolhida.
- Reunião `agendada` **vai para o calendário e gera lembrete** `[D]` (Q5): aparece no calendário do app (derivado, §6.2), agenda notificações locais (§6.3) e pode ir à agenda do celular (§6.6, `[?]` Q5c). Ao chegar o dia, o cartão pergunta "aconteceu? registrar o que foi conversado".
- Registrar o que foi conversado transforma a reunião em `realizada` e abre **"gerar pendências a partir das decisões"**: cada decisão marcada vira `ThesisTask(origin: 'orientadora', meetingId)` na **mesma escrita**. Há também **"agendar a próxima"**, que cria uma nova `ThesisMeeting` `agendada` na mesma escrita (§4.4).
- Recorrência ("toda quinta") **fora da v1** (Q5b); cada reunião é registrada individualmente.
- A próxima reunião agendada aparece na visão geral (cartão "próximo prazo").

#### Aba "escrita"
- Hero da aba não existe (o hero é único por tela): usa cartões.
- Cartão semana: barra de palavras vs. `weeklyWordGoal`, sequência de dias com escrita (reaproveita o conceito de `streakData`, sem criar streak novo).
- Lista de sessões recentes; "registrar escrita" (também é a ação do hero): capítulo, palavras escritas, minutos, nota.
- Se não houver metas: texto "metas são opcionais — defina quando quiser" com atalho para "dados do trabalho". **Nenhum** valor de meta é pré-preenchido: as metas começam **vazias** e ela define `[D]` (Q8).

### 5.2 Sheet "dados do trabalho" (ex-`EditTccModal`)

Campos: título, orientadora, área, situação, problema, objetivos, entrega, banca, meta total, meta semanal, lembretes (§6.4). Salvar = uma escrita no singleton. Cancelar descarta só esta sheet. A conclusão do TCC (`concluido`) segue D4.

### 5.3 Pontos de entrada existentes

- `EstudosView` (card "meu tcc"): `{pct}% dos capítulos` passa a usar `thesisProgress`; abaixo, "entrega em N dias" quando houver.
- `PerfilView` (linha "capítulos do tcc"): mesma fonte.
- `headerConfig.ts`: título "meu tcc"; ação do header "editar tcc" → "dados do trabalho".
- `GlobalSearchModal` (filtro `tcc`) `[D]` (Q9): indexa **capítulos** (título e nota), **referências** (título, autores, texto manual) e **pendências** (título). Cada resultado abre a aba certa do TCC (mesmo roteamento do §6.5). Reuniões **não** entram na v1 (não foram pedidas). `[V]` ainda não verifiquei como o filtro `tcc` funciona hoje; na implementação, estender o índice existente em vez de criar outro.

### 5.4 Estados e acessibilidade

- Vazio por aba, com mascote e um único botão.
- Erros de salvar: `showToast` com texto caloroso e a ação ficar disponível de novo; **nunca** perder o que foi digitado na sheet.
- `aria-label` em ícones, `CompletionToggle` com `label` descritivo (já é o padrão), foco visível, `prefers-reduced-motion` respeitado (motion segue a SPEC-002/007).
- Valores numéricos (`words`, `wordGoal`): `inputMode="numeric"`, rejeita negativo; vazio = não informado (≠ 0).

---

## 6. Prazos e lembretes

### 6.1 Fonte única de tempo

Prazos vivem **nas entidades** (`dueDate`, `deliveryDate`, `defenseDate`, `ThesisMeeting.date`). O calendário **deriva**; nada de prazo duplicado.

### 6.2 Calendário (`src/lib/schedule.ts`)

- Bloco "TCC" passa a vir de `ThesisChapter.dueDate`, `ThesisTask.dueDate`, `ThesisMeeting.date` (qualquer status exceto `cancelada`; com `time` vira bloco com hora), `deliveryDate` e `defenseDate`.
- `id` do bloco = `tcc-${tipo}-${entityId}` (acaba com o índice, F2). `entryRef`: `'tccChapter' | 'tccTask' | 'tccMeeting' | 'tccMilestone'`.
- O contrato do calendário do desktop (`calendar.ts`, `ModuleOrigin: 'tcc'`) **não muda**.

### 6.3 Lembretes locais

Função pura `planThesisReminders(state, today, prefs): PlannedNotification[]` (testável, sem Capacitor) + adaptador `syncThesisReminders(plan)` em `src/lib/notifications.ts`, no padrão de `syncClassReminders` (cancela a faixa e reagenda). Faixa de ids própria: `THESIS_REMINDER_BASE`/`THESIS_REMINDER_RANGE`, **sem colidir** com `CLASS_REMINDER_BASE/RANGE` (conferir os valores atuais no arquivo na hora de implementar).

| Gatilho | Quando (padrão) | Texto (exemplo) |
|---|---|---|
| Prazo de capítulo | 7 dias antes, 1 dia antes, no dia às 09:00 | "cecistudy ♡ o capítulo X vence amanhã" |
| Pendência com prazo | 1 dia antes e no dia | "cecistudy ♡ pendência da orientação: …" |
| Reunião (`agendada`) | véspera às 18:00 e 1 h antes (se houver `time`); sem `time`, só a véspera e às 09:00 do dia | "cecistudy ♡ reunião com {orientadora} hoje às 14:00" |
| Entrega / banca | 30, 14, 7, 1 dia antes | "cecistudy ♡ faltam 7 dias para a entrega" |

- Só agenda **futuro**; item `pronto`/`resolvida`/passado não gera lembrete.
- iOS mantém no máximo **64** notificações locais pendentes `[V]`: o plano ordena por data e corta no teto (mais próximos primeiro) e reagenda a cada abertura do app.
- Permissão: reutiliza `ensureNotificationPermission`; recusa não é erro (a aba mostra "ativar lembretes" uma vez).
- Reagendar em: salvar/editar/remover qualquer entidade com data, mudar preferências, abrir o app.
- Sideload com Apple ID gratuito **não** tem push remoto, e não precisa: tudo é notificação local.

### 6.4 Preferências

```ts
export interface ThesisReminderPrefs {
  enabled: boolean;                      // padrão: false até a usuária ativar (permissão)
  chapterDaysBefore: number[];           // padrão [7, 1, 0]
  milestoneDaysBefore: number[];         // padrão [30, 14, 7, 1]
  time: string;                          // "HH:mm", padrão "09:00"
  meetingEve: boolean;                   // padrão true (véspera 18:00)
  meetingMinutesBefore: number[];        // padrão [60]
}
```

### 6.5 Toque na notificação `[D]` (Q10)

Tocar na notificação abre **direto a aba certa** do TCC (e, quando faz sentido, o item).

- **Hoje não existe** listener de `localNotificationActionPerformed` (só `backButton` e OTA têm `addListener`); é código novo.
- Cada `PlannedNotification` carrega `extra: { thesis: { tab: ThesisTab, entityId?: EntityId } }` (`tab` ∈ `visao | capitulos | leituras | orientacao | escrita`). Prazo de capítulo → `capitulos` + id; pendência/reunião → `orientacao` + id; entrega/banca → `visao`.
- `NavScreen` do TCC ganha parâmetros opcionais: `{ kind: 'tcc'; tab?: ThesisTab; focusId?: EntityId }` (mudança de `NavScreen` **não** bumpa schema, regra do AGENTS). `TccView` lê o parâmetro uma vez para escolher a aba inicial e rolar/realçar o item (`focusId`), e ignora se o id não existe mais (item removido: cai na aba, sem erro).
- **Partida a frio:** o listener é registrado cedo (no bootstrap, fora de componente) e guarda o toque pendente até o app estar pronto (dados hidratados); só então navega. Sem isso o toque que abre o app do zero se perde.
- Vale para iOS e Android (mesmo plugin). Teste unitário do roteamento (função pura `routeFromNotificationExtra`) e verificação manual da partida a frio.

### 6.6 Agenda do celular (calendário do sistema) `[?]` Q5c

Q5 diz "vai para o calendário". O app já tem dois calendários: o **interno** (derivado, §6.2: sempre) e a **agenda do celular** via `@capacitor/calendar` (`src/lib/calendar.ts`, hoje só por ação explícita em tarefa/prova, eventos de **dia inteiro**). Proposta `[P]`: o calendário interno é sempre; na sheet de reunião há um interruptor **"também na agenda do celular"** (padrão **desligado** até a Q5c ser respondida).

- Para reunião com hora é preciso **evento com horário** (não "dia inteiro") e alarme; `createCalendarEvent` precisa de uma variante com `startAt/endAt` (duração padrão 1 h, editável).
- **Achado F18 `[V]`:** `calendar.ts` faz `new Date('YYYY-MM-DD')`, que interpreta como **UTC** (a regra do AGENTS proíbe isso); em fuso negativo como o do Brasil (UTC−3) o evento de dia inteiro pode cair no dia anterior. Corrigir ao estender (usar `parseDateKey`/componentes locais) e cobrir com teste.
- Editar/cancelar a reunião precisa atualizar/remover o evento do sistema: guardar `deviceEventId?` na reunião só se a Q5c for "sim" (campo opcional; senão não existe). Sem esse id, o app **não** consegue apagar o evento antigo.

---

## 7. Referências ABNT

### 7.1 Formatador puro

`formatAbnt(ref, opts): Segment[]` em `thesis.ts`, onde `Segment = { text: string; bold?: boolean }`. A UI renderiza negrito; a cópia usa `toPlainText(segments)`.

Regras implementadas (NBR 6023, resumo; a regra de autores foi decidida em Q11; o restante **deve ser conferido com o manual da instituição** se ela tiver um):

| Tipo | Modelo |
|---|---|
| Artigo de periódico | `SOBRENOME, Nome. Título: subtítulo. **Periódico**, local, v. X, n. Y, p. A-B, ano. DOI/Disponível em: URL. Acesso em: D mês. AAAA.` |
| Livro | `SOBRENOME, Nome. **Título**: subtítulo. ed. Local: Editora, ano.` |
| Capítulo de livro | `SOBRENOME, Nome. Título do capítulo. In: SOBRENOME, Nome (org.). **Título do livro**. Local: Editora, ano. p. A-B.` |
| Site / matéria | `SOBRENOME, Nome. Título. **Site**, ano. Disponível em: URL. Acesso em: D mês. AAAA.` |
| Tese/dissertação | `SOBRENOME, Nome. **Título**. Ano. Tipo (grau) — Instituição, local, ano.` |
| Outro | usa `manualText`; sem texto, mostra os campos soltos |

Decisões do formatador, todas explícitas e configuráveis:

- Autores `[D]` (Q11): até **3** listados; a partir de 4, primeiro autor + "et al.". A opção `listAllAuthors` existe no formatador (desligada) só como válvula; o manual da faculdade não foi enviado e **não** é assumido que haja regra além desta.
- Sobrenome em **CAIXA ALTA**, com preposições ("de", "da") tratadas pelo campo `family` já separado, **nunca** adivinhadas por heurística no formatador.
- Meses abreviados em pt-BR (`jan., fev., mar., abr., maio, jun., jul., ago., set., out., nov., dez.`).
- `accessedOn` ausente em fonte online: não inventa data; marca "faltam: acesso" no diagnóstico.
- Ordenação da lista: por `family` do primeiro autor, comparação sem acento (`localeCompare('pt-BR', { sensitivity: 'base' })`); empates por ano e título.
- Ano sem confirmação: `s.d.` só se a usuária marcar; senão fica faltando.

### 7.2 Diagnóstico não bloqueante

`validateRef(ref): MissingField[]` por tipo (ex.: artigo exige autor, título, periódico, ano; v./n./p. recomendados). Mostra "faltam: …" e nunca impede salvar.

### 7.3 Enriquecimento a partir de URL/DOI

`parseCitationMeta(html, url): Partial<ThesisReference>` e `mapCrossrefWork(json): Partial<ThesisReference>` em `src/lib` (a rede fica no adaptador). Ordem de confiança:

0. **DOI `[D]` (Q12):** se há DOI (digitado, na URL `doi.org/…`, ou lido de `citation_doi` da página), consulta a **API pública do Crossref** (`GET https://api.crossref.org/works/<doi>`), que devolve título, autores (já separados em sobrenome/nome), periódico, ano, volume, número, páginas e editora em formato estruturado. É **mais confiável** que raspar a página, porque os autores já vêm separados (o que o §7.3 evita adivinhar). Só cobre o que foi registrado com DOI no Crossref (a maioria dos artigos de periódico; **pouco** para livros e sites). Envia só o DOI (nenhum dado da usuária). `[V]` limites de uso e a convenção de identificação (parâmetro `mailto`) do Crossref: conferir a documentação na implementação; tratar erro/limite como `falhou` sem bloquear.
1. Metatags `citation_title`, `citation_author` (várias), `citation_journal_title`, `citation_publication_date` / `citation_date`, `citation_volume`, `citation_issue`, `citation_firstpage`/`citation_lastpage`, `citation_doi` (formato Highwire, usado por periódicos e repositórios).
2. JSON-LD `ScholarlyArticle`/`Article`.
3. `og:title`, `<title>`; autor ausente fica vazio.

- Nome de autor vem como "Sobrenome, Nome" ou "Nome Sobrenome": só separa quando há vírgula; sem vírgula **não adivinha** e deixa o campo para ela conferir (status "conferir autores").
- DOI: normaliza (remove `https://doi.org/`, `doi:`; minúsculas) antes de consultar; DOI inválido não consulta nada.
- Resultado do Crossref **preenche só campos vazios** e marca o que veio de lá (`fonte: 'crossref'`) para ela conferir; nunca sobrescreve o que ela digitou.
- Offline: fica `pendente` e tenta de novo na próxima abertura (no máximo 3 tentativas, depois `falhou`).
- Falha de rede ou página sem metadados: `enrichStatus = 'falhou'`, mantém URL e título provisório; nunca apaga o que ela digitou.
- Em WebView, `fetch` cross-origin sofre CORS: usar `CapacitorHttp` (nativo) `[V]` e confirmar na Fase 0/1; no web puro, enriquecimento fica desligado.

---

## 8. Captura de link pelo compartilhar do iPhone

### 8.1 O que você pediu

Achar um artigo → **Compartilhar** → aparecer **cecistudy** → uma tela rápida pergunta (a) **leitura ou artigo** e (b) **é pro TCC?** → ao salvar, a tela **e o app** fecham.

### 8.2 Limites reais do iOS (leia antes de aprovar)

1. **Um app não consegue fechar a si mesmo no iOS.** O que "fecha" é a **folha da Share Extension**, que se descarta sozinha e devolve você ao Safari. Se a captura precisar **abrir o app**, ele fica aberto até você trocar de app. Só a extensão entrega o "fecha tudo". `[V]` (comportamento documentado do iOS; confirmo na Fase 0 no aparelho dela).
2. **Share Extension** é um **target nativo** (Swift/SwiftUI) separado do app web/Capacitor. Não existe como fazê-la só em React.
3. Para passar o dado da extensão ao app é preciso um **App Group** (container compartilhado). A Ceci instala por **SideStore** com **Apple ID gratuito** `[D]` (Q4). O que as fontes que consultei (2026-10-07) indicam e o que continua sem confirmação:
   - **Confirmado em fontes públicas:** conta gratuita assina por **7 dias**, permite **3 apps** ativos e **10 App IDs novos por semana**; o SideStore conta como um dos 3 apps (então cecistudy + SideStore = 2 de 3).
   - **Indício forte, não garantia:** o SideStore **reassina o app junto com as extensões** e, segundo o relato de um projeto que publica IPA para SideStore, também provisiona o App Group; o próprio relato diz que só dá para confirmar instalando com o Apple ID da pessoa `[V]`.
   - **Extensão consome App ID:** cecistudy (1) + extensão (1) = **2 de 10** por semana `[V]` (a conta exata no aparelho dela entra na Fase 0).
   - Na instalação o SideStore pergunta se **mantém as extensões**: tem de escolher **"Keep App Extensions"**; se tirar, a extensão some `[V]`.
   - Reassinatura muda bundle id e possivelmente o id do group, então o código **não pode fixar** o id do group: lê em tempo de execução `[V]`.
4. O CI (`release.yml`) gera IPA **sem assinatura** quando não há `IOS_TEAM_ID` (para sideload). Um target novo precisa ser **embutido** no IPA e passar nessa esteira; isso é testável no CI.

**Consequência:** a v1 da captura é entregue em **camadas** (D6); a camada 3 só entra se a Fase 0 passar.

### 8.3 Camada 1 — colar link dentro do app (sem nada nativo)

- Botão "guardar link" no hub de leitura e na aba "leituras" do TCC. Lê o texto colado, valida URL, abre a **mesma sheet de captura** (§8.6).
- iOS pergunta permissão de colar do clipboard (iOS 16+); a sheet também aceita colagem manual no campo.
- Funciona sempre, em qualquer forma de instalação.

### 8.4 Camada 2 — Atalho do iOS + URL scheme (sem Share Extension)

1. **Registrar o esquema** `cecistudy://` em `ios/App/App/Info.plist` (`CFBundleURLTypes`; hoje **não há**).
2. **Receber a URL** com `@capacitor/app` (`appUrlOpen`) em um `captureLink` central (também usado pelas outras camadas).
3. **Atalho (Shortcuts)** "guardar no cecistudy": aceita **URLs** da Folha de Compartilhamento (aparece em "Compartilhar → guardar no cecistudy"), usa **"Escolher do Menu"** para tipo (artigo/leitura) e TCC (sim/não), e abre `cecistudy://captura?u=<url>&k=artigo&t=1`.
4. O app recebe, **salva direto** (as escolhas já foram feitas no atalho; sem segunda pergunta), mostra "prontinho ♡" e **permanece aberto** (ver §8.2 item 1).

- Formato do link (todos os parâmetros são URL-encoded): `u` (URL, obrigatório), `k` (`artigo`\|`leitura`), `t` (`1`\|`0`), `x` (id de idempotência opcional, gerado pelo atalho).
- O atalho é instalado uma vez (link do iCloud do atalho). Não depende de App Group nem de extensão. Vale para qualquer instalação **desde que o app tenha o esquema**.

### 8.5 O que a captura cria (as duas camadas e a extensão)

A ação `captureLink(input)` é **uma escrita** (regra "uma escrita por ação"):

| Escolha | Efeito |
|---|---|
| artigo, pro TCC | `ReadingItem` (`type: 'artigo'`, `sourceKind: 'custom'`, `url`, `status: 'nao_iniciado'`) **+** `ThesisReference` (`status: 'candidata'`, `readingId`, `url`, `type: 'artigo'`) |
| artigo, não TCC | só `ReadingItem` |
| leitura (livro), pro TCC | `ReadingItem` (`type: 'livro'`, `status: 'nao_iniciado'`, `url`) **+** `ThesisReference` (`type: 'livro'`, `status: 'candidata'`, `readingId`) |
| leitura (livro), não TCC | só `ReadingItem` (`type: 'livro'`) |

- **Q1 resolvida `[D]`:** "leitura" = link de **livro** (ou algo do tipo) que ela quer ler: registra como `ReadingItem` `type: 'livro'` "pra ler"; "artigo" = `type: 'artigo'`. Os dois podem ou não ser ligados ao TCC. **Nenhum tipo novo** em `ReadingItem.type` e **nenhuma mudança de schema** por causa disso. Expectativa honesta: páginas de livro (loja, Google Livros) raramente trazem metadados bibliográficos; o enriquecimento tende a trazer só título (`og:title`), e autor/ano/editora ficam para ela completar (status "conferir").
- Título provisório: o título da página quando a fonte entrega (a Safari entrega); senão o **host** (`exemplo.org`). Autor: `'autor não informado'` (mesmo texto do `ReadingWizard`).
- `enrichStatus: 'pendente'` marca para o enriquecimento (§7.3) e fica **guardado no próprio `ReadingItem`** `[D]` (Q13, §4.6). Transições: `pendente → ok | falhou`; a UI da leitura mostra "buscando dados…" e, se `falhou`, "não consegui buscar, preencha à mão". Livros e sites tendem a ficar `ok` só com o título.
- **Normalização de URL** (`normalizeUrl`, pura): minúsculas no host, remove `#fragmento`, parâmetros `utm_*`/`fbclid`/`gclid`, barra final; mantém o resto. **Dedupe** por URL normalizada: se já existe leitura com a mesma URL, não cria outra; mostra "esse link já estava guardado ♡" com ação "abrir".
- Sem `courseId` na captura (a usuária associa depois, se quiser).

### 8.6 Tela de captura (a "tela rápida")

Uma única sheet, **dois controles e um botão**:

```
┌──────────────────────────────────┐
│  guardar no cecistudy ♡          │
│  {título da página}              │
│  {host}                          │
│                                  │
│  é um…   ( artigo ) ( leitura )  │  ← leitura = livro pra ler
│  é pro tcc?   ( sim ) ( não )    │  ← SegmentedControl (padrão: ver Q2)
│                                  │
│  [        guardar  ♡        ]    │
└──────────────────────────────────┘
```

- "leitura" tem subtítulo discreto "livro pra ler" para não confundir com artigo.
- Sem campos de texto, sem teclado: **dois toques e guardar**.
- Padrões `[D]` (Q2): **"pro TCC?" começa em "sim"**; "é um…" começa em "artigo". Nada é "lembrado" entre capturas (comportamento previsível). Ela só toca em "não" quando for exceção.
- Toque em guardar: `hapticSuccess()`, grava, e a sheet fecha. Na extensão nativa, `completeRequest` devolve à Safari.
- A mesma UI existe em duas implementações: **web/React** (camadas 1-2) e **SwiftUI** (camada 3). Os textos e a ordem dos controles ficam em uma tabela única `CAPTURE_COPY` para não divergirem (no Swift, um `.strings`/constantes espelhadas e conferidas por teste de snapshot manual).

### 8.7 Camada 3 — Share Extension nativa (condicionada à Fase 0 `[V]`)

**Alvo Xcode** `ShareExtension` em `ios/App/App.xcodeproj` (ponto de partida: `ios/App/App/` tem `AppDelegate.swift`, `SceneDelegate.swift`, `NativeNavigation/`; o app usa Swift Package Manager em `CapApp-SPM`).

- `Info.plist` da extensão: `NSExtensionPointIdentifier = com.apple.share-services`; ativação por regra de dicionário `NSExtensionActivationSupportsWebURLWithMaxCount = 1` e `NSExtensionActivationSupportsWebPageWithMaxCount = 1` (**não** usar `TRUEPREDICATE`: a Apple rejeita; e restringe a aparição só a páginas/URLs).
- Lê a URL com `NSItemProvider.loadItem(forTypeIdentifier: UTType.url.identifier)`; o título vem do `attributedContentText`/`attributedTitle` do `NSExtensionItem` (Safari preenche) e, se vazio, usa o host.
- UI em SwiftUI via `UIHostingController`, espelhando §8.6; salvar = acrescenta **um item à fila** e chama `extensionContext.completeRequest(returningItems: nil)`.
- **Fila compartilhada** (`CaptureInbox`): arquivo JSON no container do **App Group**, escrito com `NSFileCoordinator` (evita corrida entre extensão e app). Item:

```json
{ "id": "uuid", "url": "https://…", "title": "…", "kind": "artigo|leitura",
  "thesis": true, "createdAt": "2026-10-07T14:03:00-03:00", "source": "share-extension" }
```

- **Plugin Capacitor local** `CaptureInbox` (Swift, no target do app) com `drain()` → devolve e **limpa só os ids entregues** após o JS confirmar (`ack(ids)`). Sem `ack`, nada se perde.
- No JS: ao iniciar e em `appStateChange → active`, `drain()` → `captureLink` por item → `ack`. **Idempotente** por `id` e por URL normalizada (§8.5).
- O app **não precisa abrir** para salvar: o item entra quando ela abrir o app. Isso é o que dá o "fecha tudo".
- Group id lido em runtime (do `Info.plist`/entitlement), **nunca** fixo no código `[V]`.
- Se o aparelho/conta **não permitir** App Group (Fase 0 falhar), a camada 3 **é cancelada** e ficamos com as camadas 1-2. Registrar o resultado na §15.

#### 8.7.1 Sem Mac: como construir e testar a extensão `[D]`

O Felipe **não tem Mac** (resposta desta conversa); então **nada** de Xcode local. Tudo roda no **runner macOS do GitHub Actions** (`release.yml` já builda o IPA lá). Consequências, tratadas explicitamente:

1. **Criar o alvo da extensão sem abrir o Xcode.** Um alvo novo exige editar `ios/App/App.xcodeproj/project.pbxproj` (frágil à mão). Duas opções; **escolhida: A `[D]` (Q16)**:
   - **(A) Script de CI com `xcodeproj` (Ruby/CocoaPods)** que adiciona o alvo, os arquivos Swift, o `Info.plist`, os entitlements e o "Embed App Extensions" ao projeto; o resultado é commitado.
   - **(B) XcodeGen** (`project.yml` descrevendo app + extensão) gerando o `.xcodeproj` no CI; o projeto Capacitor atual teria de ser expresso no `project.yml`.
   - **Decisão `[D]` (Q16): A, script no GitHub Actions.** Preserva o projeto Capacitor como está. Alternativa rejeitada: B (XcodeGen) por exigir reescrever a descrição do projeto inteiro. O script é versionado (`.github/scripts/`), **idempotente** (rodar duas vezes não duplica o alvo) e roda **antes** do `xcodebuild`; o `.xcodeproj` modificado é artefato do CI e/ou commitado após revisão (decidir na Fase 0).
2. **Sem depurar no aparelho.** Cada rodada é: push → CI gera IPA (unsigned, com a extensão embutida) → baixa → instala no SideStore dela → testa. Para não ficar às cegas, a extensão e o plugin escrevem um **log de diagnóstico** (últimos 50 eventos) no container do App Group, e o app tem uma tela escondida "diagnóstico da captura" que o mostra (sem expor nada além de ids, horários e códigos de erro).
3. **Quem testa é ela.** A Fase 0 precisa do iPhone dela por alguns minutos por rodada (instalar/atualizar pelo SideStore e tentar compartilhar uma página). Planejar **no máximo 3 rodadas** antes de decidir.
4. **Critério de parada:** se na 3ª rodada o App Group **ou** a extensão ainda não funcionarem, a camada 3 é **arquivada** e ficam as camadas 1-2 (atalho + colar).
5. O IPA do CI sai **sem assinatura**; quem assina é o SideStore no aparelho. Não precisa de secrets Apple.

### 8.8 Android: receber link pelo compartilhar `[D]` (Q14)

O APK já existe e **não depende** da Fase 0 nem de limites da Apple, então entra junto das camadas 1-2 (Fase 3).

- **Manifesto** (`android/app/src/main/AndroidManifest.xml`): na `MainActivity` (hoje `singleTask`, só com o filtro `MAIN/LAUNCHER`) acrescentar um `intent-filter` `ACTION_SEND` + `CATEGORY_DEFAULT` + `mimeType="text/plain"`. Aparece como **cecistudy** na folha de compartilhar do Android.
- **Receber:** em `MainActivity` (`onCreate` e `onNewIntent`, necessário porque é `singleTask`), ler `Intent.EXTRA_TEXT` (e `EXTRA_SUBJECT`/título quando houver) e entregar ao JS por um **plugin Capacitor local** com evento `shareReceived` + método `getPendingShare()` (para a **partida a frio**: o JS pergunta o que chegou antes de estar pronto).
- **Extrair a URL:** o Android costuma mandar texto livre ("Título da matéria https://…"). `extractFirstUrl(text)` (função pura, testada) pega a **primeira** URL `http(s)`; o resto vira título provisório se não houver título melhor. Sem URL válida: toast "não achei um link nesse texto" e nada é criado.
- **UX:** o app vem para a frente **direto na sheet de captura** (§8.6, mesmos dois controles, "pro TCC?" em **sim**). Ao **guardar**, chama `App.minimizeApp()` (`@capacitor/app`, só Android) para **voltar ao app anterior**, que é a aproximação mais próxima do "fecha tudo" no Android. `[V]` confirmar o comportamento de `minimizeApp` na versão usada (^8.1.1) e que não fecha o app indevidamente.
- Mesmo `captureLink` (§8.5) e mesma deduplicação. Se o app **já estava aberto** em outra tela, a sheet sobe por cima e, ao guardar, o app minimiza (sem perder o lugar).
- **Fora desta spec:** compartilhar **PDF/arquivo** (não só link) e `ACTION_SEND_MULTIPLE`.

### 8.9 Segurança e privacidade

- A extensão **não** acessa rede nem lê dados do app; só grava na fila.
- URL é tratada como **dado**: validar `http`/`https`; recusar `javascript:`, `file:`, `data:`; limitar tamanho (2 048 caracteres).
- O enriquecimento só faz `GET` da URL guardada; sem cookies da usuária; timeout curto (8 s); nunca bloqueia a UI.

---

## 9. Persistência, migração e contratos

### 9.1 Migração `MIGRATIONS[22]` (TS, pura e idempotente)

Regras herdadas da SPEC-009 (F15/F17): **sem `Date` dentro de migração**, determinística, versão faltante é erro.

1. Se `data.thesisChapters` já existe → retorna sem mudar (idempotência).
2. Cada `tcc.chapters[i]` vira `ThesisChapter` com **id determinístico** `thc-${i + 1}`, `position = i`, `kind: 'capitulo'`, `requiredness: 'obrigatorio'`, `stage = completed ? 'pronto' : 'a_fazer'`, `dueDate` preservado **somente se** casa `^\d{4}-\d{2}-\d{2}$` (senão descartado e listado em `migrationNotes`), `createdAt`/`updatedAt` = o **`tcc` carimbo/`SyncIndex` existente se houver, senão string fixa** `'1970-01-01T00:00:00.000Z'` (determinismo; nunca "agora").
3. Cada `tcc.references[i]` vira `ThesisReference` com `id = thr-${i + 1}`, `type: 'outro'`, `status: 'citada'`, `title` = a própria string (limite 200 caracteres), `manualText` = string original.
4. `tcc` perde `chapters` e `references`; ganha `id: 'tcc-main'`, `reminderPrefs` padrão (§6.4), prazos vazios.
5. Seeds: `thesisMeetings`, `thesisTasks`, `thesisWritingLogs` = `[]`.
6. `SCHEMA_VERSION` 21 → **22**. **Só** em `packages/data/src/schema.ts` (com re-export em `src/data/schema.ts`). Mudança de `NavScreen` **não** bumpa.
7. `emptyTcc` e o seed em `src/data/empty.ts` acompanham; `usePersistentState` ganha as chaves novas.

Reimportar backup antigo (`schema ≤ 21`) passa pela cadeia 2…22 sem perda: as listas antigas entram com a **forma exata de antes**.

### 9.2 Coleções (`packages/data/src/collections.ts`)

Acrescentar **no fim** de `COLLECTIONS` (a ordem do array é a ordem de hidratação/import legado; o comentário do próprio arquivo manda entrar no fim):

```ts
{ key: 'thesisChapters',     kind: 'array', table: 'thesis_chapter',     syncable: true },
{ key: 'thesisReferences',   kind: 'array', table: 'thesis_reference',   syncable: true },
{ key: 'thesisMeetings',     kind: 'array', table: 'thesis_meeting',     syncable: true },
{ key: 'thesisTasks',        kind: 'array', table: 'thesis_task',        syncable: true },
{ key: 'thesisWritingLogs',  kind: 'array', table: 'thesis_writing_log', syncable: true },
```

- **Q15 `[D]`: reaproveitar** as tabelas nativas `thesis_chapter` e `thesis_reference` (hoje projeções do singleton **sem id**: `thesis_id, position, title, completed, due_date` e `thesis_id, position, reference`). Viram tabelas de `array` com `id`/`data_json`, na forma das demais coleções (ex.: `study_session`). Como o SQLite não troca a chave de uma tabela existente, a migração nativa **recria** as duas (§9.3).
- `stamp.ts` (índice de sync) e `backupSchema.ts` (zod `passthrough`) recebem as chaves; `persistentData.ts`/`dataClient.ts` (setters/hidratação) idem.
- `collections.test.ts` tem a **contagem exata** das coleções: atualizar.

### 9.3 SQLite nativo (`src/lib/db/`)

> **Correção ao que eu tinha escrito antes:** o código diz (`migrations/user.ts`) que *toda* mudança de tabela é um **passo novo numerado** e que passo aplicado **nunca é editado**; `deck` foi o passo 2 e leitura o passo 3. Não vale a regra "adicionar tabela não bumpa" que eu citei: **bumpa**.

- **`USER_SCHEMA_VERSION` 3 → 4** (passo 4 em `src/lib/db/migrations.ts`, espelhado em `migrations/user.ts`). É a versão **da base nativa**, distinta de `SCHEMA_VERSION` do payload (21 → 22).
- **Passo 4** (idempotente, em transação): (1) `DROP TABLE IF EXISTS thesis_chapter` e `thesis_reference` e **recria** com `id TEXT PRIMARY KEY`, `thesis_id TEXT`, colunas de consulta (`position`, `parent_id`, `due_date`, `stage` / `status`, `reading_id`) e `data_json TEXT NOT NULL`; (2) `CREATE TABLE IF NOT EXISTS` de `thesis_meeting`, `thesis_task`, `thesis_writing_log` com índices por `thesis_id`/`date`. Pode dropar sem perda porque essas duas tabelas são **projeções** do payload (a verdade está em `data_json`), mas ver a verificação `[V]` abaixo.
- **Lista de reset:** acrescentar as 5 tabelas ao array de `src/lib/db/userDb.ts` (o que apaga tudo no reset). O próprio arquivo registra que `deck`/`academic_term` faltaram ali e o dado "ressuscitou"; **não repetir**.
- `saveTcc` deixa de gravar capítulos/referências (passam a ser coleções); novos `save*`/`load*` por coleção no padrão existente (`saveCollection`, uma transação por coleção).
- `[V]` **Caminho de migração do payload nativo:** confirmar na implementação onde o payload lido de `thesis_project.data_json` (forma antiga, com `chapters`/`references` dentro) passa por `MIGRATIONS[22]` **antes** do primeiro `save`, e que o passo 4 do DDL roda **antes** de qualquer gravação nas tabelas novas. Teste: base nativa em `USER_SCHEMA_VERSION 3` com TCC com capítulos → abrir → capítulos e referências preservados.
- DDL idêntico em `cecistudy-rust/contracts/schema.sql` (§9.4).

### 9.4 Contrato Rust/desktop

- `contracts/schema.sql` (recriar `thesis_chapter`/`thesis_reference` com `id`+`data_json`, criar as 3 tabelas novas), `contracts/golden/collections/{sample,empty}/tcc.json` e novos goldens por coleção.
- O desktop é **spec-first a partir de `contracts/`** e o TS é oráculo via golden (AGENTS). **Regerar os goldens exige aprovação explícita** da dona do produto (foi assim na SPEC-005).
- Sem alterar o workspace Rust nesta spec (nenhum crate), igual à SPEC-005; deixar **issue/tarefa** em `cecistudy-rust/spec/01-task-breakdown-flutter-rust.md` para o domínio `thesis`.
- Alinhamento com `Project`/`AcademicNode`/`Reference` do domínio: documentar a tabela de equivalência (§4) em `packages/domain` como comentário de contrato.

### 9.5 Camada de domínio e use-cases

- Regras em `packages/domain/src/core/domain/thesis.ts` (+ testes). Use-cases em `packages/application/src/thesis/` (`saveThesis`, `saveChapter`, `deleteChapter`, `saveReference`, `linkReadingToThesis`, `saveMeeting`(+tarefas), `saveTask`, `logWriting`, `captureLink`). Cada um devolve um **plano** (`planSave`/`planDelete`, como no Estágio) aplicado em **uma** atualização de estado.
- `src/context/dataActions.ts` e `AppContext.tsx` ficam **finos** (AGENTS: não adicionar regra de negócio no contexto). Views consomem via `useMobileApp()`/sub-contextos.

---

## 10. Correções imediatas (independentes do resto)

| # | Correção | Onde |
|---|---|---|
| C1 | Parar de mutar o capítulo no toggle (criar novo objeto): `chapters.map((c, i) => i === index ? { ...c, completed: !c.completed } : c)` | `TccView.tsx` (F1) |
| C2 | Formatar prazo com `formatDateBR` | `TccView.tsx` (F3) |
| C3 | Confirmação ao concluir com capítulos pendentes | modal/handler (F4, D4) |
| C4 | Corrigir `AGENTS.md`: `SCHEMA_VERSION` 21 → 22 após a migração; citar SPEC-011 | docs (F16) |
| C5 | Teste cobrindo C1 (referência do objeto anterior **não** muda) | `src/lib/__tests__/` (F15) |

C1–C3 podem sair **antes** da Fase 1 como um PR pequeno; não mudam schema.

---

## 11. Plano de implementação (fases)

| Fase | Entrega | Depende de | Risco |
|---|---|---|---|
| **0 · Spike iOS via CI** (≈1–2 dias; sem Mac, ver §8.7.1) | Em um aparelho real, com a **mesma forma de instalação da Ceci** (SideStore + Apple ID gratuito, VPN do SideStore ligada): app mínimo + Share Extension "olá" + App Group; verificar (a) extensão instala, (b) App Group aceito, (c) quantos App IDs consome, (d) fila lida pelo app, (e) folha fecha e volta à Safari. **Resultado vai para a §15.** | aparelho + Apple ID | **Decide a camada 3** |
| **1 · Base** | C1–C5, `thesis.ts`, `MIGRATIONS[22]`, coleções, **`USER_SCHEMA_VERSION` 4 (passo 4 SQLite)**, backup, goldens (com aprovação), `ReadingItem.enrichStatus`, `TccView` com hero + abas vazias, sheet "dados do trabalho" | — | Médio (mexe em persistência/contratos) |
| **2 · Capítulos e prazos** | Aba capítulos (**registro livre, arrastar + mover**), sheet do capítulo, calendário por id, `planThesisReminders` + `syncThesisReminders`, preferências, **toque na notificação → aba certa (§6.5)**, busca global (§5.3) | Fase 1 | Médio (limite de 64 notificações; gesto de arrastar) |
| **3 · Leituras ↔ referências** | `ThesisReference`, `formatAbnt`/`validateRef`, aba leituras, vincular leitura existente, **camadas 1 e 2** da captura (`captureLink`, URL scheme, atalho), **Android Share Target (§8.8)**, enriquecimento (Crossref por DOI + metatags) | Fases 1-2 | Médio (ABNT, CORS, Android nativo) |
| **4 · Orientação** | Reuniões **agendadas (calendário + lembrete)** e realizadas, pendências, "decisões → pendências", "agendar a próxima", agenda do celular (§6.6, conforme Q5c) | Fase 2 | Baixo |
| **5 · Escrita** | Logs, metas, aba escrita, conquistas novas | Fase 1 | Baixo |
| **6 · Share Extension iOS** (condicional à Fase 0 e a Q3b) | Alvo nativo, plugin `CaptureInbox`, CI, guia de instalação | Fase 0 verde + Fase 3 | Alto |

Cada fase fecha com o **gate**: `npm run lint` + `npm run test` (+ `node .github/scripts/check-boundaries.mjs` se mexer em `packages/*`, `src/shells`, `src/overlays`).

---

## 12. Critérios de aceite (verificáveis)

**Dados e migração**
- [ ] `npm run test -- src/lib/__tests__/migrationFixtures.test.ts` passa com fixtures de backup `schema 21` contendo TCC com capítulos e referências; resultado tem ids `thc-1…`/`thr-1…`.
- [ ] A migração é idempotente: aplicar duas vezes dá o mesmo resultado (teste).
- [ ] Nenhum `new Date(` dentro de `MIGRATIONS[22]` (`rg "new Date\(" packages/data/src/schema.ts` não aponta o bloco 22).
- [ ] Round-trip de backup export → import preserva todas as coleções novas (`exportImport.test.ts`).
- [ ] `collections.test.ts` com a nova contagem; `dataClient.test.ts` com os novos setters.

**Domínio**
- [ ] `formatAbnt`: tabela de testes para os 6 tipos, autores 1/2/3/4+, sem ano, online sem acesso, acentos e preposições (`localeCompare` pt-BR).
- [ ] `thesisProgress`/`nextThesisDeadline`/`weekWords` recebem `today` por parâmetro; nenhum lê o relógio (`rg "new Date\(|Date.now" packages/domain/src/core/domain/thesis.ts` sem resultado).
- [ ] `buildThesisLinkIndex`: leitura sem referência ⇒ "não é do TCC"; referência com `readingId` ⇒ "é do TCC"; **sem** campo espelhado no `ReadingItem`.
- [ ] `planThesisReminders`: só futuro, respeita teto de 64, ids dentro da faixa e sem colisão com aulas.
- [ ] `normalizeUrl` e `captureLink`: dedupe por URL; link inválido (`javascript:`, `file:`) recusado.
- [ ] `parseCitationMeta`: fixtures HTML com metatags Highwire, JSON-LD e só `og:title`.

**UI**
- [ ] `TccView` abre com **um** `HeroCard`; ação primária só no hero; **um** `PillGroup` por tela; `rg "rounded-\[26px\]" src/components/views/TccView.tsx` presente (ou no componente do hero).
- [ ] Nenhum hex em classe nos arquivos novos; `rg "#[0-9a-fA-F]{3,6}" src/components/tcc` só em `style={{}}`.
- [ ] Marcar/desmarcar capítulo não altera o objeto anterior (teste C5).
- [ ] Prazo aparece como `dd/mm/aaaa` (teste de render com `2026-10-01` ⇒ `01/10/2026`).
- [ ] Teste de componente para: criar TCC do zero, adicionar capítulo, marcar pronto, vincular leitura, registrar escrita, concluir TCC com capítulo pendente (aparece confirmação).

**Captura**
- [ ] Camada 1: colar URL abre a sheet e "guardar" cria `ReadingItem` (+ `ThesisReference` se pro TCC) em **uma** atualização de estado (teste).
- [ ] Camada 2: abrir `cecistudy://captura?u=…&k=artigo&t=1` cria os registros; reabrir o **mesmo** link não duplica (teste do handler de `appUrlOpen` com mock).
- [ ] Camada 3 (se aprovada na Fase 0): no aparelho, Safari → Compartilhar → cecistudy → 2 toques → guardar; a folha fecha e volta à Safari; ao abrir o app o item está na estante; fila vazia depois do `ack`. Verificação **manual**, registrada em `docs/manual-tests.md`.
- [ ] CI: o IPA unsigned continua sendo gerado com a extensão embutida (`release.yml`).

**Adições desta rodada**
- [ ] Reordenar: teste de `reorderSiblings` (puro): soltar na mesma posição não escreve; reindexa `position` 0…n-1 só entre irmãos; "mover cima/baixo" produz o mesmo resultado que arrastar.
- [ ] Lista de capítulos começa **vazia** e nenhum código semeia capítulos (`rg "introdução|referencial teórico" src packages` sem resultado em seeds).
- [ ] Metas (`wordGoalTotal`/`weeklyWordGoal`) ausentes no estado inicial (teste do `emptyThesis`).
- [ ] Reunião `agendada` aparece no calendário interno com hora e gera lembretes (teste de `planThesisReminders` com `time` e sem `time`); `cancelada` não.
- [ ] Busca global encontra capítulo (título/nota), referência (título/autor) e pendência (título) e abre a aba certa.
- [ ] `routeFromNotificationExtra` leva a `tab`+`focusId` corretos; `focusId` inexistente cai na aba sem erro; teste manual de partida a frio.
- [ ] `mapCrossrefWork`: fixtures JSON (artigo com 1, 3 e 5 autores; sem páginas; sem periódico); não sobrescreve campo preenchido; DOI inválido não consulta.
- [ ] `ReadingItem.enrichStatus`: transições `pendente → ok|falhou`; ausência significa "nada a buscar".
- [ ] SQLite: base em `USER_SCHEMA_VERSION 3` → abrir com passo 4 → capítulos e referências preservados; tabelas novas na lista de reset (teste do reset).
- [ ] Android: `extractFirstUrl` (texto com título + URL, só URL, sem URL, duas URLs); manual: compartilhar do Chrome → sheet → guardar → volta ao app anterior; partida a frio via `getPendingShare()`.
- [ ] `calendar.ts` sem `new Date('YYYY-MM-DD')` (F18) e com teste de dia inteiro em UTC−3.

**Gate geral:** `npm run lint` e `npm run test` verdes.

---

## 13. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| App Group/extensão incompatíveis com Apple ID gratuito `[V]` | Camada 3 inviável | Fase 0 antes de investir; camadas 1-2 já entregam valor |
| Assinatura de 7 dias + limite de 3 apps | Extensão pode contar como app extra `[V]` | Medir na Fase 0; **sem** conta paga `[D]` (Q3): se não couber, só camadas 1-2 |
| Migrar capítulos/referências quebra desktop/golden | Retrabalho no Rust | Aprovação explícita dos goldens; tarefa no breakdown Rust; migração 22 mantém a forma antiga reconstruível |
| Muitas coleções novas (peso de sync/backup) | Complexidade | Coleções pequenas; mesmo padrão de `readingSessions` |
| Recriar tabelas nativas (passo 4) | Perda ou ressurreição de dado | Passo idempotente, tabelas são projeção, lista de reset atualizada, teste com base em `USER_SCHEMA_VERSION 3` |
| Arrastar capítulos em lista com scroll no iOS | Gesto conflita com scroll/voltar | Alça dedicada, `dragListener={false}`, alternativa "mover cima/baixo" sempre disponível |
| Toque na notificação em partida a frio | Toque perdido | Listener no bootstrap com fila pendente (§6.5) |
| Sem Mac: criar/depurar a extensão só via CI | Ciclos lentos (push → CI → instalar → testar); `pbxproj` quebrado só aparece no build | Script `xcodeproj` versionado e idempotente, build de extensão em branch isolado, log de diagnóstico na tela escondida, máximo de 3 rodadas na Fase 0 |
| ABNT varia por instituição | Referência "errada" para a banca | Formatador configurável + `manualText` sempre vence + diagnóstico não bloqueante; validar com o manual dela (Q11) |
| CORS no enriquecimento | Metadados não chegam | `CapacitorHttp` nativo; falha é silenciosa e mantém URL |
| 64 notificações no iOS `[V]` | Lembretes futuros perdidos | Plano ordena por data e reagenda a cada abertura |
| Perda de dados ao trocar `tcc` por coleções | Dado da usuária | Migração pura/idempotente + testes de fixture + backup antes (já existe export) |

---

## 14. Perguntas abertas

> **Fechadas em 2026-10-08.** As perguntas marcadas ✅ foram respondidas pela dona
> do produto. Q3b, Q5b e Q5c foram respondidas nesta rodada. **Não há mais
> pergunta aberta nesta spec.** O que restou são itens `[V]` da §15, que são
> verificação em aparelho, não decisão.

| # | Pergunta | Resposta | Quando |
|---|---|---|---|
| **Q1** | "leitura" vs "artigo" na captura | leitura = link de livro, registra como livro pra ler (`type: 'livro'`); artigo = `type: 'artigo'`; ambos ligáveis ao TCC. Sem tipo novo | 2026-10-07 |
| **Q2** | Padrão de "pro TCC?" | começa sempre em **sim** | 2026-10-07 |
| **Q3** | Como a Ceci instala? | **SideStore**, Apple ID gratuito (ver §8.2 e §15) | 2026-10-07 |
| **Q3b** | Sem extensão se a Fase 0 falhar? | **sim, tentar a extensão e cair nas camadas 1 e 2 se falhar.** A Fase 0 continua existindo e a Fase 6 continua condicional; o atalho permanece como reserva mesmo que a extensão funcione | **2026-10-08** |
| **Q4** | Como a Ceci instala? (confirmação) | **SideStore**, Apple ID gratuito | 2026-10-07 |
| **Q5** | Reunião precisa de lembrete além do prazo? | **sim; vai para o calendário e lembra ela** (§4.4, §6.2, §6.3) | 2026-10-08 |
| **Q5b** | Há reunião **recorrente** ("toda quinta")? | **v1 sem recorrência.** Não foi pedido, e recorrência muda o modelo: cada reunião é registrada individualmente | **2026-10-08** |
| **Q5c** | "Vai para o calendário" inclui a agenda do celular? | **só o calendário interno do app, por enquanto.** A agenda do celular precisa de `deviceEventId` guardado para apagar o evento do sistema (§6.6) e do F18 corrigido; fica com interruptor desligado até lá | **2026-10-08** |
| **Q6** | Reordenar capítulos | **arrastar E mover para cima/baixo** (§5.1). O `[V]` da §5.1 está resolvido: o padrão `dragListener={false}` + `useDragControls` já existe em `src/components/ui/Modal.tsx:119-148`, e o conflito com o gesto de voltar morre se a alça for `<button>`, porque `src/lib/swipe.ts:18-19` já ignora `button` | **2026-10-08** |
| **Q7** | Modelo de capítulos | **registro livre, sem modelo nem semente** (§5.1) | 2026-10-07 |
| **Q8** | Metas de escrita | **começam vazias, ela define** | 2026-10-07 |
| **Q9** | Busca global | **sim**, capítulos, referências e pendências (§5.3) | 2026-10-08 |
| **Q10** | Toque na notificação | **sim**, abre a aba certa (§6.5). Isso **obriga** o estado de aba a ir para o `NavScreen`, fechando a contradição entre a §5.1 e a §6.5 (ver §17) | **2026-10-08** |
| **Q11** | Autores na ABNT | até 3 autores; a partir de 4, primeiro + et al. Restante do formato segue a NBR 6023 até haver manual da faculdade | 2026-10-07 |
| **Q12** | Enriquecer por DOI | **sim, via Crossref** (§7.3). O que muda: sem DOI o autor chega como texto solto ("Silva, Ana Maria" **ou** "Ana Maria Silva") e o formatador **não adivinha** onde termina o sobrenome, então sai ABNT errada; com DOI o Crossref devolve o autor já separado, mais periódico, ano, volume, número e páginas | **2026-10-08** |
| **Q13** | `enrichStatus` | **no `ReadingItem`** (§4.6) | 2026-10-08 |
| **Q14** | Android | **sim, também no Android** (§8.8) | 2026-10-08 |
| **Q15** | Tabelas nativas do TCC | **reaproveitar** (recriar com id; `USER_SCHEMA_VERSION` 3→4, §9.3) | 2026-10-07 |
| **Q16** | Criar o alvo da extensão sem Mac | **script no GitHub Actions** (§8.7.1) | 2026-10-08 |

---

## 15. Apêndice — o que ainda **não** está confirmado `[V]`

Marco aqui o que eu **não** consegui verificar. Cada item vira tarefa da Fase 0 (ou da fase indicada), e o resultado deve ser escrito nesta tabela:

| Item | Como verificar | Resultado |
|---|---|---|
| Conta gratuita + **SideStore** aceita **App Group** | Spike: extensão + app lendo o mesmo container. Indício: um projeto que publica IPA para SideStore relata App Group provisionado, mas diz que só se confirma com o Apple ID da pessoa | _indício favorável; pendente no aparelho dela_ |
| Extensão consome **App ID extra** (esperado: 2 de 10/semana) e **não** conta no limite de 3 apps | Spike: instalar e ver a lista de apps/IDs no SideStore | _fontes indicam que consome App ID; pendente no aparelho_ |
| Instalar escolhendo **"Keep App Extensions"** no SideStore | Spike | _pendente_ |
| Como o **SideStore** trata o **id do group** (reescrita) | Spike: ler o group em runtime e comparar | _pendente_ |
| A folha da extensão **fecha e devolve** à Safari sem abrir o app | Spike no aparelho dela | _pendente_ |
| Teto de **64** notificações locais pendentes no iOS | Teste com 70 agendamentos | _pendente_ |
| `CapacitorHttp` resolve CORS no enriquecimento | Fase 3, teste com 3 sites (SciELO, PMC, um periódico) | _pendente_ |
| `NSExtensionActivationRule` mínima aceita pelo assinador do SideStore | Spike | _pendente_ |
| `App.minimizeApp()` volta ao app anterior no Android (^8.1.1) | Teste manual no §8.8 | _pendente_ |
| `Reorder` (framer-motion) funciona na lista com scroll e sem conflito com o gesto de voltar do iOS | Fase 2, teste no aparelho | _pendente_ |
| Limites de uso do Crossref e convenção `mailto` | Ler a documentação na Fase 3 | _pendente_ |
| Caminho do payload nativo antigo por `MIGRATIONS[22]` antes do primeiro save | Teste do §9.3 | _pendente_ |
| `new Date('YYYY-MM-DD')` em `calendar.ts` desloca o dia em UTC−3 (F18) | Teste de dia inteiro com TZ `America/Bahia` | _pendente_ |
| Alvo da extensão passa no `xcodebuild` **sem assinatura** do CI | Rodar `release.yml` num branch | _pendente_ |

---

## 16. Tarefas

> **O plano executável está em
> [`tasks/todo-gestao-tcc.md`](./tasks/todo-gestao-tcc.md)** — 11 fases, com
> arquivos, critérios e gate por fase. O esqueleto abaixo é o de 2026-10-07 e
> serve de histórico: a Fase 1 da spec virou as fases F0..F3 do to-do, porque a
> auditoria de 2026-10-08 (§17) mostrou que o dreno do boot (A1) é item de fase e
> não verificação.

Esqueleto de 2026-10-07 (`tasks/todo-gestao-tcc.md` supersede):

```text
F0  spike-ios-ci [condicional a Q3b]         script xcodeproj + extensão "olá" + app group; IPA unsigned no CI; testar no SideStore dela (máx. 3 rodadas)  → preencher §15
F1a correcoes-c1-c5       PR pequeno (sem schema)
F1b dominio-thesis        thesis.ts + testes (selectors, abnt, link index, url)
F1c migracao-22           schema.ts + fixtures + empty.ts + collections + backup
F1d sqlite-contratos      USER_SCHEMA_VERSION 4 (passo 4) + normalize.ts + userDb reset + schema.sql + goldens (aprovação)
F1e tccview-hero          hero + abas vazias + sheet "dados do trabalho"
F2  capitulos-prazos      aba capítulos (livre, arrastar+mover) + calendário por id + lembretes + toque→aba + busca global
F3  leituras-abnt         refs + formatAbnt + captura camadas 1-2 + Android share target + enriquecimento (Crossref)
F4  orientacao            reuniões agendadas/realizadas (calendário+lembrete) + pendências + agenda do celular (Q5c)
F5  escrita               logs + metas + stickers
F6  share-extension       condicional à F0 (alvo, plugin, CI, guia de instalação)
DOC AGENTS.md             SCHEMA_VERSION 22, SPEC-012, regra "um vínculo, uma fonte"
```

---

## 17. Revisão de 2026-10-08 — auditoria de código

> Esta seção registra o que mudou na spec depois de ler o código. Ela **não**
> substitui os corpos das seções: aponta o que precisa ser corrigido e por quê.
> O plano executável está em
> [`tasks/todo-gestao-tcc.md`](./tasks/todo-gestao-tcc.md) (11 fases) e a decisão
> de dono de dado em
> [`ADR-010`](./../docs/decisoes/ADR-010-referencia-e-dono-do-dado-bibliografico.md).

### 17.1 Achados confirmados contra o código

Os 18 findings (F1..F18) da §1.2 foram confirmados um a um. Números reais:

| Item | Spec diz | Real | Evidência |
|---|---|---|---|
| `SCHEMA_VERSION` | 21 | **21** | `packages/data/src/schema.ts:13` — a spec acertou, `AGENTS.md:47` (diz 20) é que mente |
| `USER_SCHEMA_VERSION` | 3 | **3** na base nativa; e **1**, homônimo, no payload | `src/lib/db/migrations/user.ts:17` · `packages/data/src/schema.ts:16` |
| `TccView.tsx` | 171 linhas | **172** | — |
| `EditTccModal.tsx` | 267 linhas | **268** | — |
| Testes de TCC | nenhum | **nenhum** | e `buildCalendarWeek` também não tem |

### 17.2 Achados que a spec não viu, e que mudam o plano

| # | Achado | Onde | Gravidade |
|---|---|---|---|
| **A1** | **`migrateDatabase` tem um chamador só**, em todo o repositório: `packages/data/src/exportImport.ts:110` (import de backup). A hidratação nativa lê `thesis_project.data_json` **cru** (`normalize.ts:678-681`). Sem um dreno no boot, `thesisChapters` nasce `[]`, o write-through grava `[]` por cima e **capítulos e referências somem sem erro** | §9.3 marca isso como `[V]`; é o **item** da fase, não uma verificação | **Alta** |
| **A2** | **`buildCalendarWeek` é código morto** — `src/lib/schedule.ts:318`, nenhum consumidor. A §6.2 assume que está estendendo; está **ligando**. O id duplo por índice (`tcc-ch-${ci}` em `:390` **e** `tcc-${i}-${key}` + `dataId: String(i)` em `:397,411`) some | §6.2 | **Alta** |
| **A3** | **`tccSchema` exige `chapters` e `references`** — `packages/data/src/backupSchema.ts:165-166`, `z.array(...)` e `stringArray` obrigatórios. O `tcc` migrado sem eles reprova o import e o "backup restaurado" nunca aparece. A §9.2 só menciona "receber as chaves" | §9.2 | **Alta** |
| **A4** | **`EntityPrefix` não tem `'thc'`/`'thr'`** — `packages/domain/src/core/domain/ids.ts:8-34`. `makeId('thc')` **não compila** e nenhuma linha da spec lista o arquivo | §4 | Média |
| **A5** | O runner de migração **não abre transação por passo** — `src/lib/db/migrations.ts:55-62` faz `driver.exec(step.up)` e só depois grava em `schema_migrations`. A §9.3 promete "idempotente, **em transação**" | §9.3 | Média |
| **A6** | **Não existe um único `DROP TABLE`** no repositório inteiro. O passo 4 é o primeiro, e não há teste para o padrão. O `DROP` é seguro: as duas tabelas são **write-only** — nada no app lê `thesis_chapter`/`thesis_reference` | §9.3 | Média |
| **A7** | `normalize.ts:647` tem `const unhandled: never = key` — sem os 5 `case` novos, **`npm run lint` falha**. Coleções e migração não podem ser commits separados | §9.2 | Média |
| **A8** | `src/context/DataClientProvider.tsx` tem **duas cópias** de `snapshotFromState` (`:795-802` e `:821-828`). A §9.2 não lista o arquivo; sem as duas, backup e sync saem sem as coleções novas | §9.2 | Média |
| **A9** | **F1 é pior que cosmético.** Com a mutação em `TccView.tsx:20` e `stableKey = JSON.stringify` sem ordem de chave (`packages/sync/src/stamp.ts:83-89`), o objeto antigo e o novo podem serializar **igual**, o stamp não bumpar e **a mudança não propagar** para o outro dispositivo | F1 · §10 C1 | Média |
| **A10** | **`RECORD_COLLECTION_KEYS` e `COLLECTIONS` já divergem hoje** — `decks` é `kind: 'array'` e não está na lista de records; `stickers` é `array` e está em `SINGLE_COLLECTION_KEYS`. Não há teste que exija paridade entre as duas | §9.2 | Baixa |
| **A11** | `packages/data/src/dataClient.ts:65-81` **já está incompleto** — faltam `decks`, `readingSessions`, `readingHighlights`, `readingBookmarks` | §9.2 | Baixa |
| **A12** | O filtro `tcc` da busca global **não existe**. `SearchType` (`src/lib/searchLogic.ts:7-16`) tem 9 tipos, nenhum de TCC; o `'tcc'` em `GlobalSearchModal.tsx:86` é quick-tag de busca. `SECTION_OF:45-55` é `Record<SearchType,…>` exaustivo | §5.3 `[V]` | Média |
| **A13** | `packages/domain/src/core/domain/projects.ts` é **código órfão** e `createProject:96-103` **semeia 4 capítulos**, contradizendo a Q7. Precisa da nota de divergência, não pode ficar implícito | §5.1 · D1 | Média |
| **A14** | `DateKey`, `toDateKey`, `formatDateBR`, `addDays`, `weekStartKey`, `inWeek` moram **dentro de `internship.ts:47-228`**. Importar de lá amarra TCC a Estágio; extrair para `common.ts` (que já existe) mantém os dois independentes | §4 | Média |

### 17.3 Correções de UI e de navegação

| # | O que muda | Por quê |
|---|---|---|
| **B1** | **Abas em `UnderlineTabBar`, não em `PillGroup`** (§5.1) | `PillGroup.tsx:57` é `flex flex-wrap`: os 5 rótulos somam ~370px em 358px úteis no iPhone 14, quebram linha e fazem o conteúdo abaixo pular a cada troca. E a SPEC-010 D7 diz que `PillGroup` é **filtro** |
| **B2** | **O filtro de "leituras" é o único `PillGroup`** da tela (§5.1) | a §5.1 colocava dois controles de filtro na mesma tela, contra a SPEC-010 D7 |
| **B3** | **Estado de aba no `NavScreen`**, e a §5.1:310 está errada | a §6.5 exige `tab` no `NavScreen` e a Q10 confirmou o toque na notificação. É impossível ter os dois. Precedente: a SPEC-009 D16 tirou o `internshipTab` do `useState` pelo mesmo motivo — a tela empilha sheet, e voltar de um sheet reabre na aba errada |
| **B4** | **O hero leva o número, não o título** (§5.1) | `HeroCard.tsx:62` dá `max-w-[92%]` ao `summary`, deixando 29px livres contra um mascote de 64px (`:66`) — o texto passa por baixo. E título de TCC de psicologia passa de 60 caracteres: serifa de 30px em 2 linhas gasta a identidade visual no documento mais variável da usuária. O título vai para o primeiro card da visão geral, `text-base`, `line-clamp-2` |
| **B5** | `ProgressBar` ganha `aria-valuetext` | a SPEC-010 D6.4 exige; `ProgressBar.tsx:20-23` só tem min/max/now |
| **B6** | `StatusChip` sai de `src/components/internship/` | não é genérico e o TCC precisa dele |
| **B7** | Todo botão da escrita de lista usa `showToast` com **`ToastAction` "desfazer"** (§5.4) | `planSave` sobrescreve e não há histórico; `Toast.tsx:31-35` já aceita ação e o botão não some com o timeout |
| **B8** | Toda escrita de TCC anuncia reordenação com `role="status"` | não existe live region no app |

**Mantidos, como pedido:** as 5 abas (são as 4 prioridades da §2 mais a síntese),
arrastar **e** mover, registro livre, metas vazias, busca global, toque na
notificação abrindo a aba certa, Android no compartilhar, `enrichStatus` no
`ReadingItem`, reaproveitar as tabelas nativas, script de CI para a extensão.

### 17.4 Decisão de grupo que muda a §4.3

A [`ADR-010`](./../docs/decisoes/ADR-010-referencia-e-dono-do-dado-bibliografico.md)
decide que **Referência é dado da Biblioteca** e que o TCC guarda **o ato de
citar**:

| | Dono | O que guarda |
|---|---|---|
| `ReadingItem` + campos bibliográficos estruturados | **Biblioteca** | a obra: autor com sobrenome separado, ano, periódico, editora, local, edição, volume, número, páginas, DOI, acesso, tipo |
| `ThesisReference` | **TCC** | o ato de citar: `readingId`, `status`, `chapterIds`, `note` |

Consequências que a §4.3 e a §4.6 precisam absorver:

1. `ThesisReference` da §4.3 **fica fino** e perde os 20 campos bibliográficos.
2. `ReadingItem` (§4.6) ganha os campos estruturados, além do `enrichStatus` da
   Q13. Todos opcionais, todos com `backupSchema` em `passthrough`
   (`packages/data/src/backupSchema.ts:101-107`) — **nenhuma** transformação na
   `MIGRATIONS[22]`.
3. `formatAbnt` (§7.1) passa a ser função pura do `ReadingItem`, e não da
   referência. Isso a torna reutilizável por qualquer citação do app.
4. A referência antiga, que hoje é `string[]`, entra como `ReadingItem` com
   `rawCitation` preenchido — o `manualText` sobrevive, morando no dono certo.
5. O motivo da decisão: a Q13 já põe o enriquecimento no `ReadingItem`. Se a ABNT
   lesse de uma cópia dentro de `ThesisReference`, o payload do Crossref existiria
   em dois lugares, escritos pelo caminho errado — a mesma classe do F2/F3 que a
   D3 desta spec proíbe.
6. O `Reference` de `projects.ts:60-70` tem `authors: string[]`, e não
   `RefAuthor[]`. Qual das duas formas é a do grupo **não está decidido** e fica
   como pendência de conformidade, porque depende da `SPEC-D-011`.

### 17.5 Recorte por dispositivo: pendência, não resolvida aqui

A spec referencial §3.2, linha 93, marca o TCC no mobile como `[D leitura]`
`[P restante]`. Esta spec coloca escrita, metas, ABNT e agenda de reuniões no
mobile. A ADR-010 decide só o **dono do dado bibliográfico**; a questão de
**recorte de tela por dispositivo** é da `SPEC-C-012` e continua **aberta**, com a
pergunta escrita lá.

### 17.6 Itens `[V]` desta revisão

| Item | Como verificar | Fase |
|---|---|---|
| 5 abas em `UnderlineTabBar` rolando não fica esquisito em iPhone | conferir no aparelho | F4 |
| Reorder com alça dentro de lista com scroll | `touch-action` no eixo vertical durante o drag | F5 |
| `aria-valuetext` do `ProgressBar` é lido corretamente pelo VoiceOver | teste manual | F4 |
