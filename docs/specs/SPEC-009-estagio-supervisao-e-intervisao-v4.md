# SPEC-009 · Estágio, supervisão e intervisão v4

> Prefixo: `SPEC-` (numeração local do app) · Onde vive: `cecistudy/docs/specs/`
> Status: proposta
> App afetado: mobile (cecistudy ♡)
> Origem: [`spec-referencial-workspace-academico.md`](../../../spec-referencial-workspace-academico.md) §4.8 **[D]** (camada acadêmica inteira, com a camada clínica **[A]-1**), §1.5 **[D]** (persistência), §1.1 **[D]** (as réguas não mentem), §3.2, §4.4 **[D]**
> Decisões: D1..D19
> Espelha: [`SPEC-M-013`](../../../docs/specs/mobile/SPEC-M-013-estagio-supervisao-e-intervisao-v4.md) (cópia de grupo)
> Supersede: — (não substitui `SPEC-005` nem `SPEC-008`; o escopo é o módulo Estágio, que não tem spec)
> Depende de: `SPEC-005` (período letivo, para escopo de curso), `SPEC-008` (entradas e navegação)
> Data: 2026-10-05
> Autor do diagnóstico: leitura de código, com gate executado (§1.1)

---

## A1 · decisão de produto (2026-10-05)

> **A1 · A camada clínica do Estágio fica no mobile? → SIM.** Decidido pelo produto.
>
> **Decisão de `@felipe ferreira`, 2026-10-05: o mobile **mantém** a camada
> clínica.** A regra nova mais recente prevalece sobre a anterior: a §4.8 **[D]**
> regra 1 ("Só desktop") **fica superada** por esta decisão, no escopo do módulo
> Estágio do mobile.
>
> **Consequência que a decisão assume, e que fica registrada:**
>
> - A [`SPEC-M-008`](../../../docs/specs/mobile/SPEC-M-008-lista-fechada-da-camada-clinica.md)
>   precisa **declarar supersedência parcial**: os 6 itens listados abaixo ficam
>   implementados no mobile. A `SPEC-M-008` continua valendo para todo o resto
>   (a lista fechada do que sincroniza, a exclusão da IA, a camada do desktop).
> - O débito **C14** do grupo fica **aberto**: dado de paciente real sincroniza
>   e entra no envelope de backup do mobile por escolha de produto, não por
>   esquecimento. Ele deixa de ser um bug e passa a ser uma dívida **declarada**,
>   e precisa aparecer com essa marca em
>   [`docs/analise/matriz-paridade.md`](../../../docs/analise/matriz-paridade.md).
> - **Correção da spec referencial é da dona do produto.** A §8 da
>   [`spec-referencial-workspace-academico.md`](../../../spec-referencial-workspace-academico.md)
>   precisa receber a pergunta A1 e a §4.8 a marca correspondente. **Esta spec não
>   edita o referencial** — o `AGENTS.md` da raiz diz que ele tem dono humano.
>
> **Histórico do conflito, preservado:** a §4.8 **[D]** regra 1 diz *"Só desktop. A
> camada clínica não sincroniza para o mobile"*, e a linha 461 diz *"**Mobile:**
> camada acadêmica completa; da clínica, apenas a projeção mínima acima"*. A
> `SPEC-M-008` `D2` já tinha optado por esses campos **sairem** do
> `InternshipLog` do mobile, e é ela que fecha o débito **C14**. Este documento foi
> escrito para manter a camada clínica no mobile, e por isso **colidia** com as duas.
> A colisão foi registrada como `A1` antes de qualquer código depender dela, e foi
> resolvida **por quem tem o produto**, não por agente.
>
> **Itens que a decisão libera** (estavam bloqueados enquanto A1 não existia):
>
> | # | Item liberado | Onde nesta spec |
> |---|---|---|
> | 1 | `patientAge`, `theme`, `approach`, `interventionNotes`, `observations` **gravados no mobile** | §5.1 |
> | 2 | `latestAge` e `latestApproach` em `DerivedCase` | §5.2 |
> | 3 | card do paciente com idade e chip de abordagem | §9.5 |
> | 4 | hero da tela do caso com idade e abordagem; linha do tempo com tema | §9.7 |
> | 5 | `PatientPicker` preenchendo idade e abordagem | §9.9 |
> | 6 | a pendência **"sem reflexão"** de `atendimento_clinico` no mobile | §4.3, §9.3 |

---

## 0. Resumo

**Problema.** O estágio funciona no caminho feliz, mas tem bugs reais — a aba
pacientes **quebra a tela inteira**, as datas aparecem um dia antes, o vínculo
sessão ↔ supervisão fica inconsistido nos dois sentidos, e a UI não mostra metade do
que o wizard coleta. A supervisão tem **duas portas de criação** com comportamentos
diferentes, e o caderno de supervisão legado tem uma migração que **nunca executou**.

**O que esta spec entrega.**

1. Uma **fonte única** para o vínculo sessão ↔ supervisão (`discussedLogIds`), com
   estados derivados e sem escrita duplicada.
2. Um **módulo de domínio puro e testável** em `packages/domain` para datas, estados,
   pendências, casos e estatísticas — hoje espalhados e divergentes entre telas.
3. **Migração 20** (`SCHEMA_VERSION` 19 → 20): converte vínculos antigos, drena o
   caderno de supervisão legado e conserta as chaves de persistência.
4. **UI redesenhada**: tela de estágio com 3 abas, cards por tipo, pendências
   clicáveis, meta de horas opcional, tela de caso em tela cheia, aba de supervisão
   unificada e wizard mais curto.
5. **Plano em PRs pequenos**, com testes e critérios de aceite.

**Fora do escopo** (§15): desktop Rust (`cecistudy-rust/`), encerrar caso, alerta de
paciente parado, exportação de horas.

**Regras de ouro herdadas do `AGENTS.md` do app:** regra de negócio nova vai em
`packages/*` (nunca em `AppContext`); tokens `ceci-*` (nunca hex em `className`); copy
pt-BR, minúscula, calorosa; nunca chamar a usuária de "Ceci"; `SCHEMA_VERSION` só
bumpa quando o **formato persistido** muda.

---

## 1. Estado em 2026-10-05

### 1.1 O que já foi corrigido (hotfix, com gate)

Este bloco existe para que ninguém reaplique o que já está feito, e para registrar o
número do gate. Executado nesta máquina em **2026-10-05**.

| ID | Correção | Arquivo | Gate |
|---|---|---|---|
| **F1** | Desestruturação de `caseData` movida **depois** do guard; prop tipada `DerivedCase \| null`; o modal só é renderizado com caso selecionado | `src/components/internship/InternshipCaseDetail.tsx:13-18`, `src/components/views/InternshipDiaryView.tsx:189-193` | `src/components/internship/__tests__/InternshipCaseDetail.test.tsx` (6 casos) |
| **U2** | 5 plurais `"sessãoões"`/`"reflexãoões"`/`"supervisãoões"` → `pluralPt` | `InternshipCaseCard.tsx`, `InternshipCaseDetail.tsx`, `InternshipDiaryView.tsx:118` | `src/lib/__tests__/pluralPt.test.ts` |
| **F4** | `new Date(date).toLocaleDateString('pt-BR')` → `formatDateBR` (quebra a string, sem `Date`) em 6 arquivos | `InternshipLogCard.tsx`, `InternshipCaseCard.tsx`, `InternshipCaseDetail.tsx`, `InternshipWizard.tsx`, `SupervisionView.tsx`, `InternshipDiaryView.tsx` | `src/lib/__tests__/dateBR.test.ts` |
| **F4** | Filtro de semana do diário passa a comparar `DateKey` (`inWeek`), sem mistura de UTC com local | `InternshipDiaryView.tsx:30-42` | `dateBR.test.ts` (`inWeek`, `weekStartKey`) |
| **F5** | `toISOString().slice(0,10)` (UTC) → `localDateKey` / `todayKeyLocal` | `InternshipSection.tsx:67`, `src/lib/schedule.ts:191,206-208` | `dateBR.test.ts` |
| **F2** | O guard `discussedLogIds.length > 0` impedia desvincular — desmarcar todas as caixas não limpava o vínculo. Sincronização extraída e deduplicada | `InternshipWizard.tsx:578-610` | coberto por `D3` (§3) e §12 |
| **F3** | `case 'internship'` era **uma linha** e não limpava o vínculo: apagar a supervisão deixava `supervisionLogId` órfão (a sessão contava como supervisionada para sempre), e apagar a sessão deixava id órfão em `discussedLogIds` | `src/lib/entityOps.ts:146-167` | `src/lib/__tests__/entityOps.test.ts` (+4 casos) |

**Gate medido depois do hotfix:**

| Gate | Antes | Depois |
|---|---|---|
| `npm run lint` (`tsc --noEmit`) | 0 erro | 0 erro |
| `npm run test` (vitest) | 106 arquivos · **1112** testes | 109 arquivos · **1138** testes |
| `node .github/scripts/check-boundaries.mjs` | `OK` | `OK` |

**O gate do F1 foi verificado quebrado de propósito:** com a desestruturação de volta
antes do guard, os 3 casos que passam `caseData={null}` reproduzem
`TypeError: Cannot destructure property 'patientLabel' of 'caseData' as it is null` —
o erro exato do crash de produção.

**O que o hotfix NÃO resolveu, de propósito:** o vínculo continua gravado nos dois
lados (§3 `D3`), as escritas continuam sendo N por salvamento, horas agendadas
continuam somando e o caderno legado continua sem drenar. Cada um desses exige
decisão de modelo, e é o que a spec entrega.

### 1.2 Helpers criados no hotfix (obrigatórios para a §7)

| Arquivo | Funções | Por que existe |
|---|---|---|
| `src/lib/dateBR.ts` | `localDateKey`, `todayKeyLocal`, `formatDateBR`, `formatDateShortBR`, `dateKeyOrdinal`, `addDaysKey`, `weekStartKey`, `inWeek`, `isScheduledDate` | `new Date('2026-08-26')` é **UTC 00:00**, e em São Paulo (UTC−3) `toLocaleDateString('pt-BR')` mostra **25/08**. A data civil tem de ser lida como string. |
| `src/lib/pluralPt.ts` | `pluralPt`, `pluralWordPt` | `{palavra}{n !== 1 ? 'ões' : ''}` concatena "ões" na palavra já flexionada e produz "sessãoões". Em pt-BR o plural não é derivável por sufixo confiável. |

O destino dos dois é `packages/domain` (§7). Enquanto lá não moram, eles são glue de
apresentação — e é por isso que ficaram em `src/lib`, sem passar pelo gate de
fronteiras.

---

## 2. Diagnóstico (código real, lido em 2026-10-05)

Cada linha cita `caminho:linha` do app, relativo a `cecistudy/`. `✅` = corrigido no
hotfix (§1.1). `⚠` = não reproduzido em app rodando; vem de leitura e precisa de
confirmação antes da fase 3.

### 2.1 Funcional

| # | Problema | Onde | Sev. |
|---|---|---|---|
| ✅ **F1** | **A aba pacientes derrubava a tela inteira.** `InternshipCaseDetail` desestruturava `caseData` antes do `if (!isOpen) return null`, e a view passava `selectedCase!` — que é `null` enquanto nada está selecionado. O `TypeError` era capturado pelo `ErrorBoundary` da raiz (`src/App.tsx:24`), sem boundary local | `InternshipCaseDetail.tsx:15,17` · `InternshipDiaryView.tsx:26,191` | alta |
| **F2** | Vínculo gravado nos **dois** lados e só no wizard: `supervisionLogId` na sessão e `discussedLogIds` na supervisão. Salvar uma supervisão com `n` sessões marcadas fazia `1 + n` escritas sequenciais, sem lote. O guard `discussedLogIds.length > 0` impedia desvincular (✅ o guard foi removido; a fonte única é `D3`) | `InternshipWizard.tsx:578-617` · `dataActions.ts:407,499` | alta |
| ✅ **F3** | Apagar supervisão deixava `supervisionLogId` órfão → a sessão contava como supervisionada **para sempre**, porque a pendência é derivada de `!log.supervisionLogId`. Apagar atendimento deixava id órfão em `discussedLogIds`. `case 'internship'` era uma linha, contra os vizinhos que fazem cascata (`case 'concept'`, `entityOps.ts:158-160`) | `entityOps.ts:146-147` · `internshipCases.ts:73` | alta |
| ✅ **F4** | Datas um dia antes em UTC−3. `new Date('2026-08-26')` é UTC 00:00 → `25/08`. Também nos filtros de semana: `new Date(l.date) >= start` comparava data UTC com `Date` local. Três estilos concorrentes no mesmo domínio: `localDateKey` (local), `toISOString().slice(0,10)` (UTC) e `new Date(string)` (UTC) | `InternshipLogCard.tsx:30-33` · `InternshipCaseCard.tsx:34` · `InternshipCaseDetail.tsx:12,56` · `InternshipWizard.tsx:157,264,349,420,520` · `SupervisionView.tsx:141` · `InternshipDiaryView.tsx:13-19,34,42-47` | alta |
| ✅ **F5** | "Agendado" decidido por `toISOString().slice(0,10)` (UTC): depois das 21h locais, hoje virava "amanhã" e o registro do dia aparecia como agendado | `InternshipSection.tsx:67` · `schedule.ts:191` | média |
| **F6** | Registros **agendados** (data futura) entram em horas totais, horas da semana, pendências e stickers. Três somas independentes do mesmo dado: `InternshipDiaryView.tsx:28` (sem filtro), `:33-35` (só `>= start`, **sem limite superior**), `PerfilView.tsx:219`, `FaculdadeView.tsx:63` | 4 arquivos | média |
| **F7** | Intervisão some da aba supervisão e do contador: filtram só `type === 'supervisao'`. Registros de intervisão **são gravados** (o wizard aceita, `InternshipWizard.tsx:27`) e **não têm tela** | `SupervisionView.tsx:48` · `InternshipDiaryView.tsx:53,120` | média |
| ⚠ **F8** | A migração do caderno lê `db.supervisionNotebook`, mas a chave **contratual é `supervision`** — declarada 5 vezes de forma independente (`schema.ts:226`, `schema.ts:269`, `collections.ts:106`, `backupSchema.ts:311`, `normalize.ts:529`). Como **nada jamais escreve** `supervisionNotebook`, `migrateSupervisionNotebook` é **no-op em toda execução real**: é código morto com teste verde (`migrations.test.ts:19-43`). E os logs migrados não recebem `workspaceId` (`migrations.ts:15-30`, 15 campos explícitos, sem `workspaceId`) | `DataClientProvider.tsx:669-671` · `migrations.ts:15-30` | alta |
| **F9** | Pendências derivadas **por caso**, e `deriveCases` filtra na entrada: só `atendimento_clinico` **com `patient` preenchido** (`internshipCases.ts:39-40`). Um atendimento sem iniciais **não aparece** em nenhuma pendência, em nenhum badge, em nenhum contador | `internshipCases.ts:39-40,72-73` · `InternshipDiaryView.tsx:57-58` · `PerfilView.tsx:220-223` | média |
| **F10** | Duas portas para criar supervisão: o form inline do `SupervisionView` (sem `discussedLogIds`, `activity` fixo `"supervisão"`, `hours: 0` fixo, decide novo vs edição pelo **prefixo do id** `sup-`) e o wizard (grava horas reais). Uma supervisão criada pelo form inline nasce **sempre sem vínculo** | `SupervisionView.tsx:10-23,50-62,86-131` | média |
| **F11** | Próximos passos viram tarefa/leitura/foco a cada toque, sem lembrar que já viraram → duplicatas | `SupervisionView.tsx:26-41` | baixa |
| **F12** | "Transformar nota em estágio" salva horas com `parseInt` (perde `1,5 h`) e usa o mesmo parse de data do `F4` | `InternshipForm.tsx` · `fieldsFor.tsx` | baixa |
| **F13** | `AGENTS.md:47` diz `SCHEMA_VERSION = 18`; o código está em **19** (`packages/data/src/schema.ts:12`). É o débito **C3** do grupo. A migração desta spec é a **20** | `AGENTS.md:47` | doc |

### 2.2 Achados novos desta auditoria (não estavam no diagnóstico original)

| # | Problema | Onde | Sev. |
|---|---|---|---|
| ⚠ **F14** | **Três chaves para a mesma entidade.** O hook usa `'internship'` (`DataClientProvider.tsx:456`), o registry usa `'internshipLogs'` (`collections.ts:105`). `'internship'` **não é chave de registry**, então `isUserCollectionKey('internship')` é `false` e, no nativo, `internshipLogs` **nunca chega à tabela SQLite `internship`** — cai em Preferences sob `'internship'`. E o import legado (`legacyImport.ts:61,87`) escreve a tabela a partir de `'internshipLogs'`. **O import escreve numa tabela que o hook nunca lê.** O único gate que pegaria (`collections.test.ts:48-55`) não testa `'internship'` | `DataClientProvider.tsx:456` · `collections.ts:105,130,136-138` · `useSqliteState.ts:54,88-92` · `legacyImport.ts:61,87` | **alta** |
| **F15** | **`MIGRATIONS[16]` não é determinística**: usa `new Date().toISOString().slice(0,10)` como `due` de fallback (`schema.ts:347`), contra o invariante declarado em `schema.ts:396-399`. Reimportar o mesmo backup duas vezes dá payloads diferentes | `schema.ts:347` | média |
| **F16** | `supervision` **nunca entra no payload** de backup/sync: não está em `persistentData.ts:66,99` nem em `empty.ts:82,118`. A ausência é **institucionalizada por teste** (`collections.test.ts:131-137`). O dado da tabela `supervision_notebook` é inerte | `persistentData.ts` · `empty.ts` | média |
| **F17** | `migrateDatabase` **engole versão faltante em silêncio**: `if (!migration) continue` (`schema.ts:468`). Não há buraco hoje (2..19 é contíguo), mas a guarda transforma erro futuro de digitação em perda de dado | `schema.ts:466-469` | média |
| **F18** | O golden **embute um órfão como estado canônico**: `supervisionLogId: 'ilog-3'` quando `ilog-3` **não existe** no fixture (`goldenSample.ts:314`, array tem só `ilog-1` e `ilog-2`). Espelhado em `cecistudy-rust/contracts/golden/full_backup.sample.json:1` e `collections/sample/internshipLogs.json:1`. Os dois lados concordam no erro, então **o gate de paridade não tem como detectá-lo** | `goldenSample.ts:314` | média |
| **F19** | Código morto **com suíte viva**: `derivedPhase` (`internshipCycle.ts:15`) só tem_definition e teste — nenhum `.tsx` importa. `PHASE_LABEL` (`InternshipLogCard.tsx:6-12`) e `log.phase` também não têm consumidor | `internshipCycle.ts` · `InternshipLogCard.tsx:6-12` | baixa |
| **F20** | `selectDiaryPreview` tem **10 casos de teste** (`internshipPreview.test.ts`) e **nenhuma view a usa** — `InternshipSection.tsx:66-74` reimplementa a mesma lógica inline, com chave UTC. A lógica testada e a de produção são diferentes | `internshipPreview.ts` · `InternshipSection.tsx:66-74` | média |
| **F21** | "sem supervisão" usa `status-danger-*` (vermelho), contra o tom neutro de pendência | `InternshipCaseDetail.tsx:83-85` | baixa |
| **F22** | `InternshipLogCard` renderiza `log.reflections &&` **sem `trim`**: reflexão só com espaços renderiza um bloco vazio | `InternshipLogCard.tsx:74` | baixa |
| **F23** | `lastSessionDate` é a última posição **após ordenar por `sessionNumber`**, não a maior data. Sessão 1 em 2027 e sessão 2 em 2026 → "última sessão" mostra 2026 | `internshipCases.ts:62-71` | média |
| **F24** | Duplicação de mapa de rótulos: `InternshipLogCard.tsx:14-20` e `internshipPreview.ts:39-45` definem o mesmo `TYPE_LABEL`; o comentário do segundo diz "evita duplicação" e o primeiro não o importa | 2 arquivos | baixa |

### 2.3 UI

| # | Problema |
|---|---|
| **U1** | `InternshipLogCard` mostra só título, reflexões, dúvidas, próximos passos, checklist legado e notas legadas. **Nunca renderiza**: `patient`, `sessionNumber`, `patientAge`, `theme`, `approach`, `interventionNotes`, `observations`, `supervisor`, `topics`, `orientations`, `beforeNotes`, `afterNotes`, `selfAssessment`, `discussedLogIds`. Um `atendimento_clinico` mostra 6 dos 13 campos que o wizard pede |
| **U2** | Plural quebrado em 5 lugares ✅ |
| **U3** | Diário é lista plana: sem filtro por tipo, sem agrupamento, sem separar agendados. Reflexão vazia simplesmente não aparece — sem convite para completar |
| **U4** | Pílulas de pendência **não são clicáveis**. O card de resumo traz "supervisões" como número solto, sem ação |
| **U5** | Detalhe do paciente é um modal baixo: sem barra de progresso, sessões não tocáveis, sem "+ nova sessão", e o `selectedCase` guarda o **objeto**, não a chave — então o snapshot fica velho depois de editar |
| **U6** | Wizard: resumo obrigatório em todo tipo; passo "discutidos" usa `<input type="checkbox">` nativo; o passo "reflexão" da supervisão mistura antes/depois e autoavaliação sob a pergunta "como foi essa experiência?"; paciente é texto livre — `"M. S."` e `"MS"` viram dois casos |
| **U7** | Sem meta de horas (só total). Header ainda diz **"estágio 2.0"**. Gráfico semanal aparece com 1 semana de dado |

---

## 3. Decisões fechadas

Cada decisão traz a alternativa descartada e a consequência, para ser revertida com
consciência.

### D1 · Só mobile (React/TS) agora

**Decisão.** Esta spec entrega o mobile. O desktop Rust (`cecistudy-rust/`) ganha spec
própria depois.
**Alternativa descartada.** Escrever as duas no mesmo PR, já que o golden de
`internshipLogs` é compartilhado (`cecistudy-rust/contracts/golden/collections/sample/internshipLogs.json:1`).
**Consequência.** O golden fica divergente até a fase R4 (§15), e a regeneração
precisa de aprovação explícita (§6.5).

### D2 · Meta de horas opcional, um total único

**Decisão.** `profile.internshipGoalHours?: number`. Sem meta por tipo.
**Alternativa descartada.** Meta por tipo (`estagio` / `atendimento_clinico` /
`supervisão` separados).
**Consequência.** Metas por tipo exigiriam saber a regra da faculdade, que **não está
no app** — e essa regra é `[A]` (§4.8 linha 463). Um total único cobre 90% do uso e
dá para evoluir sem migração.

### D3 · Fonte única do vínculo: `discussedLogIds`

**Decisão.** O vínculo vive **só** na supervisão/intervisão, em `discussedLogIds`.
`supervisionLogId` deixa de ser escrito e é removido pela migração 20. "Supervisionada"
passa a ser **derivado**.
**Alternativa descartada.** Manter os dois lados em sincronia, como hoje.
**Consequência.** Elimina a classe inteira de bugs `F2`/`F3`, porque passa a haver
**um** lugar para ficar inconsistente em vez de dois. Em troca, "supervisionada" deixa
de ser um booleano consultável por `O(1)` e vira uma busca no índice — o que é
irrelevante para o volume de um estágio. **Esta decisão é o que torna o hotfix de
`F3` provisório:** ele é o piso de integridade enquanto o modelo antigo existe em
disco.

### D4 · Sessão pode ser discutida em várias supervisões (N:N derivado)

**Decisão.** Uma sessão pode aparecer em duas supervisões, e ambas são listadas em
"discutida em".
**Alternativa descartada.** 1:1, com um único `supervisionLogId` — que é o modelo
atual.
**Consequência.** Preserva histórico: na prática clínica o mesmo caso volta várias
vezes, e 1:1 perderia o histórico de quais supervisões discutiram o quê.

### D5 · Só `supervisao` fecha a pendência "sem supervisão"

**Decisão.** `supervised` exige uma `supervisao` (não `intervisao`). Intervisão aparece
como chip secundário "discutida em intervisão", e a sessão **continua** pendente de
supervisão.
**Alternativa descartada.** Tratar intervisão como equivalente.
**Consequência.** Supervisão é obrigação acadêmica; intervisão é complemento. **Muda
o significado de dados já vinculados a uma intervisão** (§6.3): essas sessões voltam a
aparecer como pendência, com o chip preservando a informação. Precisa de nota de
versão.

### D6 · Intervisão na mesma aba da supervisão, com filtro

**Decisão.** Uma aba "supervisão" com `todas · supervisão · intervisão`. Rótulo da aba:
"supervisão".
**Alternativa descartada.** Quarta aba "intervisão".
**Consequência.** Mesma estrutura de dados e de card; separar duplica tela. Filtro sem
estado persistido (§9.6).

### D7 · Agendado é `date > hoje` (local)

**Decisão.** `date > hoje` é agendado. Não conta em horas, pendências, stickers nem
gráfico, e aparece numa seção "próximos". Hoje conta como feito.
**Alternativa descartada.** Um campo `status` persistido (`agendado`/`feito`).
**Consequência.** Resolve `F5`/`F6` **sem campo novo** — a data já diz. O preço: editar
a data de um registro de hoje para amanhã o faz "sumir" das horas, e isso é o
comportamento correto, mas precisa ficar visível na UI (chip "agendado").

### D8 · Paciente continua texto, com chave normalizada

**Decisão.** Sem entidade `InternshipCase`. O agrupamento é por
`normalizePatientKey(patient)`: NFD, sem diacríticos, minúsculas, só `[a-z0-9]`.
**Alternativa descartada.** Tabela de pacientes, com id próprio.
**Consequência.** Menos migração e menos risco; a normalização resolve o problema real
(typo), não o de identidade. `"José P."` e `"Jose P."` caem no mesmo caso (`josep`).

### D9 · Atendimento novo exige iniciais; legado vai para "sem iniciais"

**Decisão.** Campo obrigatório com picker. Atendimentos antigos **sem** iniciais formam
o grupo `orphans`, com ação para completar **registro a registro**.
**Alternativa descartada.** Migrar os órfãos para um paciente sintético.
**Consequência.** `F9` é resolvido sem apagar dado: `patient` é opcional no tipo, e um
atendimento sem paciente é um caso que ninguém digitou. Órfãos **nunca** são
renomeados em bloco — podem ser pessoas diferentes.

### D10 · Resumo (`activity`) é opcional

**Decisão.** Vazio salva com `suggestTitle(log)`.
**Alternativa descartada.** Resumo obrigatório (o que é hoje).
**Consequência.** Era a maior fricção do wizard. Título gerado é **rótulo**, não
conteúdo inventado — a reflexão nunca é fabricada (`D11`).

### D11 · Reflexão nunca é fabricada

**Decisão.** Vazio fica `''`. "Pendente de reflexão" vale só para
`atendimento_clinico` e `estagio`.
**Alternativa descartada.** Preencher com um placeholder para não ficar vazio na lista.
**Consequência.** Supervisão já tem "o que ficou combinado", então gerar pendência ali
é ruído. O risco oposto — texto automático parecendo conteúdo da usuária — é pior.

### D12 · Fase do ciclo some da UI

**Decisão.** `phase` e `prepChecklist` ficam no tipo **só** para leitura de dados
antigos; o checklist legado continua legível no card. `derivedPhase` vira
`@deprecated`.
**Alternativa descartada.** Exibir a fase no card.
**Consequência.** A fase nunca refletiu nada (diagnóstico da v3, `internshipCycle.ts`).
`derivedPhase` (`F19`) é código morto com teste vivo: sai na fase 9 (§13).

### D13 · Pendências em tom neutro, e somem quando zeradas

**Decisão.** `status-warning`, nunca `status-danger`; bloco inteiro some em zero.
**Alternativa descartada.** Vermelho, como `InternshipCaseDetail.tsx:83-85` faz hoje.
**Consequência.** Evita ansiedade de checklist. Fixa `F21`.

### D14 · Sem alerta "paciente parado há N semanas" na v1

**Decisão.** Fica no backlog (§15).
**Alternativa descartada.** Mostrar o alerta com `lastSessionDate`.
**Consequência.** Sem status "encerrado", o alerta incomodaria para sempre.

### D15 · Tela do caso em tela cheia empilhada

**Decisão.** `NavScreen internshipCase`, não modal.
**Alternativa descartada.** Continuar no `Modal` de `InternshipCaseDetail.tsx`.
**Consequência.** Ganha deep-link e swipe-back. Custa um item no vetor de navegação
(§8.3). **A nota sobre `U5`:** a ordem invertida da linha do tempo não é defeito do
modal antigo; a decisão aqui é mais recente primeiro, e vale daqui em diante.

### D16 · Abas com deep-link

**Decisão.** `#/faculdade/estagio/diario`, `.../pacientes`, `.../pacientes/{patientKey}`,
`.../supervisao`. A aba ativa vive no estado de navegação.
**Alternativa descartada.** `useState` local (o que existe hoje).
**Consequência.** Voltar do caso ou do wizard reabre na mesma aba. A rota já tem base:
`packages/navigation/src/hash.ts` reconhece `#/faculdade/estagio/diario`
(`internshipDiary: true`).

### D17 · Próximo passo "vira" uma única vez, com vínculo persistido

**Decisão.** `nextStepLinks: { step, kind, entityId, createdAt }[]`.
**Alternativa descartada.** Marcar no texto, ou deixar converter de novo.
**Consequência.** Corrige `F11`. Se a entidade ligada for apagada, o vínculo é
tratado como inexistente e os botões voltam (`E20`).

### D18 · Horas: 0–24 por registro, passo 0,25, pt-BR

**Decisão.** `0 ≤ hours ≤ 24`, exibido "1,5 h".
**Alternativa descartada.** Aceitar qualquer número (o `parseInt` de hoje perde `1,5`).
**Consequência.** Corrige `F12` e evita lixo de digitação.

### D19 · O hotfix é piso de integridade, não destino

**Decisão.** O que foi corrigido em 2026-10-05 (§1.1) fica no histórico como
`@deprecated` onde `D3` substitui a regra, e o comentário aponta a spec.
**Alternativa descartada.** Reverter o hotfix e esperar a fase 4.
**Consequência.** O app para de quebrar **antes** das 9 fases terminarem. Regra sem gate
é dívida (`SPEC-M-013` `D5`, via `SPEC-C-004`).

### D20 · O mobile mantém a camada clínica do Estágio

**Decisão (produto, `@felipe ferreira`, 2026-10-05).** Os campos `patient`, `patientAge`,
`sessionNumber`, `theme`, `approach`, `interventionNotes`, `observations` e a reflexão do
atendimento **continuam gravados e visíveis no mobile**, e a tela do caso por paciente
existe no app. É a resposta de **A1**.
**Alternativa descartada.** A §4.8 **[D]** regra 1 ("só desktop"), que a
[`SPEC-M-008`](../../../docs/specs/mobile/SPEC-M-008-lista-fechada-da-camada-clinica.md)
`D2` tinha escolhido antes.
**Consequência — e ela é o preço, dito na cara:**
1. A `SPEC-M-008` precisa declarar **supersedência parcial** (os 6 itens de A1).
2. O débito **C14** fica **aberto e declarado**: dado de paciente real sincroniza e entra
   no envelope de backup do mobile. Deixa de ser bug e vira dívida escolhida — e precisa
   da marca `C14-declarada` na
   [`matriz-paridade.md`](../../../docs/analise/matriz-paridade.md).
3. A **Correção da spec referencial é da dona do produto**: §4.8 precisa da marca nova e a
   §8 precisa da pergunta. Esta spec **não** edita o referencial.
4. O que a decisão **não** afrouxa: as invariantes da §4.6 continuam valendo. Reflexão
   nunca é fabricada (`I4`), o paciente continua sendo iniciais normalizadas (`D8`) e
   `patientLooksFull` continua avisando sem bloquear (`E22`).

---

## 4. Regras de negócio (normativas)

### 4.1 Datas

`DateKey = string` no formato `YYYY-MM-DD`, em fuso **local**. **Nunca**
`new Date(dateKey)`. Sempre os helpers de §7. `hoje = todayKeyLocal()`.

### 4.2 Estados derivados de um registro

Nada disto é persistido.

| Estado | Definição |
|---|---|
| `scheduled` | `log.date > hoje` |
| `done` | `log.date <= hoje` |
| `reflectionExpected` | `type ∈ {atendimento_clinico, estagio}` |
| `reflected` | `log.reflections.trim() !== ''` |
| `supervised` | existe log `supervisao` cujo `discussedLogIds` contém o id **e** essa supervisão já aconteceu (`date <= hoje`) |
| `intervised` | idem, com `intervisao` |
| `supervisionIds` | ids das supervisões que discutiram a sessão, ordenados por data |

Supervisão **agendada** não supervisiona ainda (`E2`).

### 4.3 Pendências

Contadas **por registro**, não por caso. Somente registros `done`.

```
semReflexao    = done ∧ reflectionExpected ∧ ¬reflected
semSupervisao  = done ∧ type = atendimento_clinico ∧ ¬supervised
```

> A pendência vale para **os dois** tipos. Ela existiu bloqueada por A1 e foi liberada
> por D20: com a camada clínica no mobile (D20), a reflexão do atendimento é
> conteúdo que a usuária escreve e lê no aparelho.

### 4.4 Horas

```
horasFeitas = Σ hours dos done
horasSemana = Σ hours dos done da semana corrente (segunda a domingo, local)
```
Agendados **nunca** somam (`D7`).

### 4.5 Caso (paciente)

Grupo de atendimentos `done` ou agendados com a mesma `normalizePatientKey(patient)`.
Rótulo exibido = iniciais do atendimento **mais recente** do grupo.
Atendimentos sem iniciais formam o grupo especial `orphans` (`patientKey = ''`).

```
progresso = sessõesSupervisionadas / sessõesFeitas   →  0 quando sessõesFeitas = 0
```

### 4.6 Invariantes (aplicadas por `sanitizeLog`, §7.1)

- **I1** `discussedLogIds` só existe em `supervisao`/`intervisao`.
- **I2** `discussedLogIds` só aponta para `atendimento_clinico` existentes.
- **I3** sem duplicatas e sem auto-referência.
- **I4** `reflections` nunca recebe texto automático.
- **I5** `0 ≤ hours ≤ 24`.
- **I6** `date` é `DateKey` válida.
- **I7** `type` sempre definido (legado → `'estagio'`).
- **I8** `selfAssessment` com os 3 campos vazios é removido.
- **I9** (suave) sessão dentro de supervisão com data posterior à da supervisão é
  permitida; o wizard mostra aviso.

---

## 5. Modelo de dados

### 5.1 `InternshipLog` (`src/types/internship.ts`)

```ts
export interface InternshipNextStepLink {
  /** Texto exato do próximo passo no momento da conversão. */
  step: string;
  kind: 'task' | 'reading' | 'session';
  entityId: string;
  createdAt: string; // ISO
}

export interface InternshipLog {
  // --- inalterados ---
  id: string;
  workspaceId?: string;
  type: InternshipLogType;
  date: string;
  hours: number;
  activity: string;
  reflections: string;
  conceptIds?: string[];
  referenceIds?: string[];

  // --- camada clínica (liberado por D20) ---
  patient?: string;
  sessionNumber?: number;
  patientAge?: string;        // 
  theme?: string;             // 
  approach?: string;          // 
  interventionNotes?: string; // 
  observations?: string;      // 

  supervisor?: string;
  topics?: string[];
  orientations?: string;
  doubts?: string;
  nextSteps?: string[];
  beforeNotes?: string;
  afterNotes?: string;
  selfAssessment?: { confidence?: string; limits?: string; themes?: string };
  discussedLogIds?: string[];

  // --- legado (só leitura de dados antigos) ---
  /** @deprecated D12 */
  phase?: InternshipPhase;
  /** @deprecated D12 — continua exibido se existir */
  prepChecklist?: string[];
  supervisionNotes?: string;
  /** @deprecated D3 — lido só pela migração 20; nunca escrito */
  supervisionLogId?: string;

  // --- novo ---
  /** @deprecated D17 — só em supervisao/intervisao */
  nextStepLinks?: InternshipNextStepLink[];
}
```

`patient` e `sessionNumber` **não** estão bloqueados: iniciais, data e duração estão
na lista fechada da §4.8 **[D]** regra 2.

### 5.2 `DerivedCase` (§7.2)

```ts
interface DerivedCase {
  patientKey: string;
  patientLabel: string;        // do atendimento mais recente (data, depois sessão)
  logs: InternshipLog[];       // done + agendados; por sessão nº, depois data (asc)
  doneLogs: InternshipLog[];
  scheduledLogs: InternshipLog[];
  totalHours: number;          // só done
  sessionsDone: number;
  sessionsSupervised: number;
  progress: number;            // 0–100; 0 se sessionsDone = 0
  pendingReflection: number;
  pendingSupervision: number;
  lastSessionDate?: DateKey;   // maior data done (⚠ não a última por sessão — F23)
  nextScheduledDate?: DateKey;
  latestAge?: string;          // 
  latestApproach?: string;     // 
}
```

Ordenação: `lastSessionDate` desc. Casos **só** com agendados vão antes (são os
próximos), por `nextScheduledDate` asc.

### 5.3 Perfil

```ts
// src/types/profile.ts → UserProfile
/** Meta total de horas de estágio. undefined = sem meta. Inteiro 1–5000. */
internshipGoalHours?: number;
```

Opcional ⇒ não exige backfill. `userProfileSchema`
(`packages/data/src/backupSchema.ts:22-30`) é `passthrough`, então o campo atravessa
sem alteração — **verificado**.

### 5.4 Campos aposentados

| Artefato | Destino |
|---|---|
| `supervisionLogId` | Removido dos dados pela migração 20; o tipo mantém o campo `@deprecated` por uma versão (import de backup antigo) |
| `SupervisionNotebook` | Só tipo de leitura da migração |
| `src/lib/internshipCycle.ts` (`derivedPhase`) | `@deprecated`, sem uso na UI; removido na fase 9 |
| `PHASE_LABEL` (`InternshipLogCard.tsx:6-12`) | Removido na fase 9 |

---

## 6. Migração 20

`SCHEMA_VERSION = 20` (`packages/data/src/schema.ts:12`). `MIGRATIONS[20]` é **função
pura** (`data => data`), **idempotente** e tolerante a coleção ausente.

```ts
20: (data) => {
  const logs = clone(asArray(data.internshipLogs));
  const byId = new Map(logs.map((l) => [l.id, l]));

  // 1. type obrigatório (I7)
  for (const l of logs) l.type ??= 'estagio';

  // 2. drenar caderno legado (data.supervision; e data.supervisionNotebook por
  //    tolerância, porque foi a chave que o código leu por engano — F8)
  const legacy = [...asArray(data.supervision), ...asArray(data.supervisionNotebook)];
  for (const nb of legacy) {
    if (byId.has(nb.id)) continue;              // idempotência
    const log = legacyNotebookToLog(nb);       // §7.1
    logs.push(log); byId.set(log.id, log);
  }

  // 3. supervisionLogId → discussedLogIds (D3)
  for (const l of logs) {
    if (l.supervisionLogId === undefined) continue;
    const sup = byId.get(l.supervisionLogId);
    if (sup && (sup.type === 'supervisao' || sup.type === 'intervisao')
           && l.type === 'atendimento_clinico') {
      sup.discussedLogIds = uniq([...(sup.discussedLogIds ?? []), l.id]);
    }
    delete l.supervisionLogId;                  // vínculo órfão é descartado
  }

  // 4. higiene de discussedLogIds (I1–I3) e selfAssessment (I8)
  for (const l of logs) {
    if (l.type === 'supervisao' || l.type === 'intervisao') {
      const ids = uniq(l.discussedLogIds ?? []).filter(
        (id) => id !== l.id && byId.get(id)?.type === 'atendimento_clinico'
      );
      if (ids.length) l.discussedLogIds = ids; else delete l.discussedLogIds;
    } else {
      delete l.discussedLogIds;
    }
    if (l.selfAssessment && !hasAny(l.selfAssessment)) delete l.selfAssessment;
  }

  // 5. chave mantida vazia: backupDataSchema exige o array (backupSchema.ts:311)
  return { ...data, internshipLogs: logs, supervision: [] };
}
```

`legacyNotebookToLog` (§7.1) é a **mesma função** usada pelo `drainLegacySupervision` —
uma regra, um lugar.

### 6.1 Efeito esperado em dados reais (nota de versão obrigatória)

- Sessões que estavam vinculadas a uma **intervisão** deixam de contar como
  supervisionadas (`D5`) e reaparecem como pendência, com o chip "discutida em
  intervisão" preservando a informação.
- Sessões vinculadas a uma supervisão **apagada** deixam de contar (órfão descartado).

### 6.2 Drenagem no boot — e por que ela é obrigatória

`applyDatabase` **não é o boot**: os únicos chamadores são `resetApp`
(`DataClientProvider.tsx:709`), `completeOnboarding` (`:730`), `importData` (`:756`) e
`applySyncedDatabase` (`:779`, `:803`). O boot é `src/lib/bootPreload.ts`.

E o dado legado real está em **dois** lugares que ninguém lê junto:

| Onde | Como foi escrito | Quem lê hoje |
|---|---|---|
| Chave `supervision` em Preferences | `importLegacyCollections` (`userDb.ts:38` → `legacyImport.ts:61`), que itera `USER_COLLECTION_KEYS` | **ninguém** |
| Tabela SQLite `supervision_notebook` | `legacyImport.ts:87` → `normalize.ts:529-541` | **ninguém** |

Então `drainLegacySupervision()` entra em `DataClientProvider`, no caminho de boot:
lê o armazenamento legado, converte com `legacyNotebookToLog`, grava em
`internshipLogs` e esvazia o legado. **Idempotente por id.** Também corrigir
`applyDatabase` para ler `db.supervision` (além de `supervisionNotebook`) e remover a
chave depois de migrar.

### 6.3 `F14` — a divergência de chave, e por que **não** é hotfix

`DataClientProvider.tsx:456` usa `'internship'`; `collections.ts:105` declara
`'internshipLogs'`. Consertar a chave **hoje** órfã os dados de quem já usa o app no
Android, porque o estado atual está em `Preferences['internship']`. Por isso `F14` é da
**fase 3**, junto da migração: corrigir a chave e drenar o lugar antigo no mesmo PR, com
o mesmo backup.

### 6.4 Backup, sync e golden

- **Backup/import:** backups com `schemaVersion ≤ 19` passam pela cadeia e recebem a
  20. `internshipLogSchema` é `passthrough` (`backupSchema.ts:124-131`), então
  `nextStepLinks` atravessa sem mudança.
- **Sync (LWW por registro):** como o vínculo vive só na supervisão, não há mais
  divergência entre dois registros editados em aparelhos diferentes. Conflito residual:
  dois aparelhos editando a mesma supervisão → vence o mais recente.
- **Golden:** `src/data/fixtures/goldenSample.ts:314` e
  `cecistudy-rust/contracts/golden/**` contêm `supervisionLogId` **apontando para um id
  inexistente** (`F18`). Regenerar exige **aprovação explícita**
  (`AGENTS.md:73`). A regeneração vai num **PR separado e sinalizado**, porque o golden
  é o oráculo de paridade do Rust.

### 6.5 Correções de migração em arquivo (F15, F16, F17)

| ID | Correção |
|---|---|
| `F15` | `MIGRATIONS[16]` deixa de usar `new Date()`: o `due` de fallback passa a ser derivado dos dados, não do relógio. Migração determinística é pré-requisito de reimportar o mesmo backup duas vezes |
| `F16` | Decidir se `supervision` entra no payload (`persistentData.ts`, `empty.ts`) ou sai do registry. Enquanto a coleção existe, ela fica **declarada**; sair do registry é o fim do legado, e é decisão de fase |
| `F17` | `migrateDatabase` passa a **falhar** em versão faltante, em vez de `continue` silencioso. Um buraco é perda de dado |

---

## 7. Camada de domínio (`packages/domain`)

Arquivo novo: `packages/domain/src/core/domain/internship.ts`, exportado como
`calendar.ts`. Sem `react`, sem `@capacitor/*`, sem `__TAURI__` — gate
`check-boundaries.mjs`.

`src/lib/internshipCases.ts` vira **stub de compat** com re-export por caminho
**relativo** (`../../packages/domain/src/core/domain/internship`), nunca `@/packages/...`
(`AGENTS.md:18-21`).

**Toda função é pura e recebe `today` por parâmetro** — nada de `new Date()` escondido.
E `src/lib/dateBR.ts` (§1.2) é **movido para cá** nesta fase: a data civil é regra de
domínio, não glue.

### 7.1 API

| Função | Assinatura | Comportamento |
|---|---|---|
| `toDateKey` | `(d: Date) => DateKey` | `YYYY-MM-DD` com getters locais |
| `todayKey` | `(now = new Date()) => DateKey` | `toDateKey(now)` |
| `addDays` | `(k, n) => DateKey` | `new Date(y, m-1, d+n)` local; nunca parse ISO |
| `weekStartKey` | `(k) => DateKey` | Segunda da semana de `k` |
| `formatDateBR` / `formatDateShortBR` | `(k) => string` | Quebra a string; entrada inválida volta como veio |
| `dateKeyOrdinal` | `(k) => number` | Inteiro para ordenar; inválida = `-Infinity` |
| `inWeek` | `(k, weekStart) => boolean` | `[weekStart, weekStart+7)` |
| `isScheduled` / `isDone` | `(log, today) => boolean` | `date > today` / `date <= today` |
| `normalizePatientKey` | `(raw?) => string` | NFD, sem diacríticos, minúsculas, só `[a-z0-9]`. `"M. S."`, `"ms"`, `" M.S "` → `"ms"`; `"João P."` → `"joaop"`; `undefined` e `".."` → `""` |
| `formatPatientLabel` | `(raw?) => string` | `trim` + colapsa espaços internos; não altera pontuação |
| `buildLinkIndex` | `(logs, today) => LinkIndex` | `Map<atendimentoId, {supervisionIds; intervisionIds}>` a partir de `discussedLogIds`, ignorando id inexistente e supervisão ainda agendada; listas por data |
| `statusOf` | `(log, index, today) => LogStatus` | §4.2 |
| `computePendencies` | `(logs, today) => { noReflection; noSupervision }` | Listas de **ids** |
| `computeStats` | `(logs, today) => InternshipStats` | `{ doneHours, weekHours, doneCount, clinicalDoneCount, scheduledCount, nextScheduled?, weeklySeries: number[8], weeksWithData }`; série do mais antigo ao mais novo, só `done` |
| `deriveCases` | `(logs, today) => { cases; orphans }` | §5.2 |
| `nextSessionNumber` | `(c?) => number` | `max(sessionNumber) + 1`; 1 sem sessões numeradas |
| `groupByWeek` | `(logs, today) => LogGroup[]` | §9.3 |
| `suggestTitle` | `(log) => string` | §9.3 |
| `sanitizeLog` | `(log, all) => InternshipLog` | `I1..I8`; `trim`; `hours` clamp (NaN → 0); poda `nextStepLinks` cujo `step` não está mais em `nextSteps`; preenche `activity` vazio com `suggestTitle`; **nunca toca em `reflections`** |
| `planSave` | `(logs, draft) => InternshipLog[]` | `sanitizeLog` + substitui por id ou anexa. **Única escrita**; sem efeito colateral |
| `planDelete` | `(logs, id) => InternshipLog[]` | Remove o log e retira o id de todo `discussedLogIds` |
| `planRenamePatient` | `(logs, fromKey, toLabel) => { logs; merged }` | Reescreve `patient`; `''` rejeitado; `merged` = a chave nova já existia |
| `planSetPatient` | `(logs, ids, label) => InternshipLog[]` | Define iniciais de registros **específicos**; `''` rejeitado. Única forma de completar órfãos |
| `planLinkNextStep` | `(log, step, kind, entityId, nowIso) => InternshipLog` | Acrescenta vínculo, substituindo o do mesmo `step` |
| `legacyNotebookToLog` | `(nb: SupervisionNotebook) => InternshipLog` | Mapeamento do passo 2 da §6, reusado pela migração e pelo drain. **`workspaceId: nb.workspaceId ?? DEFAULT_WORKSPACE_ID`** — corrige `F8` |

### 7.2 `groupByWeek`

`{ id: 'upcoming' | weekStartKey; label: string; hours: number; logs: InternshipLog[] }[]`

1. `upcoming` (rótulo "próximos") com os agendados, data asc; `hours = 0`, não exibido.
2. Depois, uma entrada por semana com `done`, da mais recente à mais antiga. Rótulos:
   "esta semana" · "semana passada" · `{dd/mm} – {dd/mm}`.
3. Dentro da semana: data desc, empate por `sessionNumber` desc, depois id.

### 7.3 `suggestTitle`

| Tipo | Título |
|---|---|
| `atendimento_clinico` | `"sessão {n} · {iniciais}"`; sem número: `"atendimento · {iniciais}"`; sem iniciais: `"atendimento clínico"` |
| `supervisao` | `"supervisão com {supervisor}"` ou `"supervisão"` |
| `intervisao` | `"intervisão com {grupo}"` ou `"intervisão"` |
| `estagio` | `"dia de estágio"` |
| `outro` | `"registro de campo"` |

---

## 8. Estado, ações e navegação

### 8.1 Ações (`src/context/dataActions.ts`)

Todas chamam `packages/domain` — **nada de regra no contexto** — e fazem **uma**
atualização de estado por ação (`setInternshipLogs(prev => planX(prev, ...))`),
eliminando as N escritas de `F2`.

| Ação | Uso |
|---|---|
| `handleSaveInternshipLog(draft)` | Wizard (novo e edição). `handleAddInternshipLog` e `handleUpdateInternshipLog` viram wrappers finos (usados por `NoteTransformWizard`, `QuickAdd`) e também passam por `sanitizeLog` |
| `handleDeleteInternshipLog(id)` | `entityOps` passa a usar `planDelete`. Apagar atendimento limpa ids órfãos; apagar supervisão "des-supervisiona" por derivação |
| `handleRenamePatient(fromKey, toLabel)` | Menu "corrigir iniciais" |
| `handleSetPatient(ids, label)` | Botão "adicionar iniciais" dos órfãos |
| `handleConvertNextStep(logId, step, kind)` | Cria a entidade e grava o vínculo **na mesma atualização**; recusa se já existe vínculo válido |
| `handleSetInternshipGoal(hours)` | `hours` é número ou `undefined`; `undefined` remove a chave |

### 8.2 Consumidores que passam a usar o domínio

| Arquivo | Mudança |
|---|---|
| `src/components/views/PerfilView.tsx` | `totalInternshipHours` passa a `computeStats(...).doneHours`; `deriveCases` com a nova assinatura (hoje repete a derivação em `:219-223`, com o mesmo filtro cego de `F9`) |
| `src/lib/stickers.ts` | `internship-hours` usa `doneHours`; `internship-logs` conta só `done` (`F6`). Atualizar os testes de sticker |
| `src/lib/schedule.ts` | `upcomingEvents` recebe `today` por parâmetro (hoje cria o próprio `new Date()` em `:191`, o que impede teste) |
| `src/components/views/faculdade/InternshipSection.tsx` | `todayKeyLocal()` + `isScheduled`; **usa `selectDiaryPreview`** em vez da reimplementação inline (`F20`) |
| `src/lib/contextActions.ts` (`case 'internship'`) | `status = completo` quando o próprio registro não tem pendência (`¬reflectionExpected ∨ reflected`) e, se clínico `done`, `supervised`; senão `incompleto`. Ação recomendada continua "continuar registro" |
| `src/components/wizards/note/{InternshipForm,fieldsFor}.tsx`, `NoteTransformWizard.tsx` | `hours` aceita decimal (`parseFloat`, passo 0,25) e data via helpers (`F12`) |

### 8.3 Navegação (`packages/navigation`)

```ts
type InternshipTab = 'diario' | 'pacientes' | 'supervisao';
| { kind: 'internshipDiary'; tab?: InternshipTab; focusLogId?: string }
| { kind: 'internshipCase'; patientKey: string }   // '' = grupo "sem iniciais"
```

| Rota | Tela |
|---|---|
| `#/faculdade/estagio/diario` | Diário (já existe, `hash.ts`) |
| `#/faculdade/estagio/pacientes` | Aba pacientes |
| `#/faculdade/estagio/pacientes/{patientKey}` | Tela do caso; `patientKey` vazio usa o literal `sem-iniciais` |
| `#/faculdade/estagio/supervisao` | Aba supervisão |

Alterar `packages/navigation/src/{types,hash}.ts`,
`src/lib/__tests__/routing.test.ts`, `src/lib/headerConfig.ts` (título = iniciais;
ações "nova sessão" e "corrigir iniciais") e `src/shells/SharedScreenLayers.tsx`
(render de `internshipCase`).

**Não bumpa `SCHEMA_VERSION`** — navegação não é dado persistido (`AGENTS.md:47`).
Swipe-back usa o `EdgeSwipeBack` existente. Respeitar "shared UI não brancha por
plataforma".

### 8.4 Seed do wizard

`openWizard(type, courseId?)` não aceita pré-preenchimento. Adicionar, ao lado de
`wizardCourseId`, o estado `wizardSeed` em `navigationEngine.ts` e a ação:

```ts
interface InternshipWizardSeed {
  kind?: InternshipLogType;
  patient?: string;
  sessionNumber?: number;
  patientAge?: string;      // 
  approach?: string;        // 
  date?: DateKey;
  discussedLogIds?: string[];
  editId?: string;
  startAtStep?: 'tipo' | 'essencial' | 'contexto' | 'discutidos' | 'reflexao' | 'combinados';
}
```

Regras: `wizardSeed` é limpo em `closeWizard`. **Com seed, o wizard não lê nem grava
rascunho** (`draftKey` indefinido), para o seed não ser sobrescrito pelo rascunho
antigo — e o rascunho existente fica **intacto**. Sem seed, o comportamento atual de
rascunho (`wizard_draft_internship`) continua.

---

## 9. UI/UX

### 9.1 Princípios e tokens

- Só tokens: superfícies `bg-surface-default | muted | rose | blue`; bordas
  `border-ceci-border-default | subtle | brand | academic`; texto `text-ceci-primary |
  secondary | tertiary`; status `status-success-*` e `status-warning-*`. Hex só como
  valor de dado (`accentColor` do gráfico, como hoje). **Evitar `status-danger-*`** (`D13`).
- Identidade por tipo: `estagio`/`atendimento_clinico` = rosa; `supervisao`/`intervisao`
  = azul (já usado no `SupervisionView.tsx:137`); `outro` = neutro. Ícones: `HeartHandshake`,
  `Stethoscope`, `Compass`, `Users`, `Sparkles`.
- Cards `rounded-2xl p-4 shadow-2xs`; alvos ≥ 44 px; conteúdo ≥ 12 px; rótulos de
  bloco 10 px `uppercase`.
- Movimento: entrada com `opacity 0→1` + `y 6→0` em ~180 ms; expansão por altura
  animada; respeitar redução de movimento pelos utilitários de `@/lib/motion`.
- Vazio: mascote `field-prepare` (diário), `listening-hello` (pacientes),
  `supervision-reflect` (supervisão).
- Validar em rosa-claro e noturno no mínimo.

### 9.2 Estrutura da tela

- Título de **"estágio 2.0"** para **"estágio"** (`U7`).
- `UnderlineTabBar` com badge: diário = sem reflexão, supervisão = sessões sem
  supervisão, pacientes sem badge. Badge some em zero.
- "+ anotar" abre o wizard no tipo da aba: diário → escolha de tipo; pacientes →
  `atendimento_clinico`; supervisão → `supervisao`.
- A aba ativa vive no estado de navegação (`D16`).
- **Um `useMemo` por `[internshipLogs, today]`** calcula `stats`, pendências, índice e
  casos, e passa por props. As abas **não recalculam** — hoje cada uma soma o mesmo
  dado de um jeito (`F6`).

### 9.3 Aba "diário"

**a) Resumo** (3 cards, `grid-cols-3 gap-2`): horas feitas (`doneHours`, com
`AnimatedNumber`), esta semana (`weekHours`), atendimentos (`clinicalDoneCount`). Toque
no 1º card abre o `GoalSheet`. Com meta: `ProgressBar` (`min(100, feitas/meta×100)`) e
"faltam 157,5 h" ou "meta batida ♡". **Sem projeção de prazo** — evita promessa falsa.

**b) `GoalSheet`** (`Modal position="bottom"`): campo numérico com ajuda "quantas horas
seu estágio pede no total? dá pra mudar quando quiser"; guardar / remover meta (só se
existir) / cancelar. Valida inteiro 1–5000, erro inline. Foco automático; Enter salva.

**c) Pendências** (`PendencyBar`): **some inteira** quando não há pendência (`D13`).
Cada chip é `button` com `aria-pressed`; toque ativa o filtro, toque de novo limpa.
Chip ativo = preenchido; inativo = contorno. Haptic leve.

**d) Gráfico** `DitherGrowthChart` com `weeklySeries` (só `done`), renderizado apenas
se `weeksWithData >= 2` (`U7`).

**e) Filtros** (`PillGroup size="sm" variant="rose"`): todos · campo · clínico ·
supervisão. Combina com o filtro de pendência. Com filtro ativo, banner "mostrando {n}
{sem reflexão|sem supervisão} · limpar".

**f) Lista** = `groupByWeek`. Cabeçalho: rótulo + "· 6 h" quando > 0.
`text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary`. "próximos" primeiro.

**g) Vazios.** Sem registro: mascote + "ainda não tem registro de estágio — que tal
anotar o primeiro? ♡". Filtro sem resultado: "nada por aqui com esse filtro" + "limpar
filtros".

### 9.4 Card de registro v2

`ManageSurface` continua (long-press = menu). Toque simples expande/recolhe
(`aria-expanded`, altura animada). **Um card aberto por vez.**

Anatomia recolhida: badge de tipo · data · horas · título · linha de meta · chips · `⋯`.

| Tipo | Linha de meta | Chips recolhidos | Ao expandir |
|---|---|---|---|
| `estagio` / `outro` | — | `estagio`: reflexão ok (success) ou sem reflexão · adicionar (warning, clicável → wizard em `reflexao`); `outro`: nenhum | reflexões, dúvidas, próximos passos, checklist legado, notas legadas |
| `atendimento_clinico`  | `{iniciais} · sessão {n} · {idade}` + tema ( itens 1, 2) | reflexão (ok/pendente), supervisão (com a data da última, ou warning), intervisão (azul, só se `intervised`) | : tema, abordagem, intervenções, impressões. Sempre: reflexões, "discutida em": linhas `{data} · {supervisor}` → aba supervisão com `focusLogId` |
| `supervisao` / `intervisao` | com `{supervisor}` (ou "grupo") | `{n} sessão/sessões discutida(s)`; até 3 chips de `topics` + "+N" | todos os temas, antes (neutro) e depois (rosa), orientações, dúvidas, próximos passos (`NextStepRow`), autoavaliação (3 mini blocos), sessões discutidas → tela do caso |

**Variante agendado** (`D7`): `border-dashed`, `bg-surface-muted`, chip "agendado ·
amanhã" / "em {n} dias" / "{dd/mm}" (> 14 dias). **Sem chips de pendência.** Ao tocar,
expande só com "ainda não aconteceu — dá pra completar depois ♡" e o botão editar.

Componentes extraídos (`src/components/internship/`): `LogTypeBadge`, `StatusChip`
(`success | warning | info | muted`, ícone 12 px + texto, **nunca só cor**), `FieldBlock`,
`NextStepRow`, `DiscussedList`.

`NextStepRow` mostra o texto + 3 botões (tarefa/leitura/foco); após converter, vira
chip "virou tarefa ✓" e os 3 desabilitam. Se a entidade ligada não existir mais, os
botões voltam (`E20`).

### 9.5 Aba "pacientes" ⚠ itens 3, 6

Lista de `InternshipCaseCard` v2, na ordem de `deriveCases`. Linha de contexto:
"{n} pacientes · {m} sessões feitas".

```
M. S. · 28 anos                [TCC]     ›
4 sessões · 12 h · última 26/08
▓▓▓▓▓▓▓▓░░░░  3 de 4 supervisionadas
[1 sem reflexão]  [1 sem supervisão]
próxima sessão: 02/09
```

| Elemento | Regra |
|---|---|
| Iniciais + idade  | `patientLabel` em `font-display font-bold`; `latestAge` ao lado, omitido se vazio |
| Chip de abordagem  | `latestApproach`, até 14 caracteres; omitido se vazio |
| Linha de números | `{n} sessões · {horas} h · última {dd/mm}`. Sem sessão feita: "primeira sessão agendada · {dd/mm}" |
| Barra | `ProgressBar`, `bg-status-success` em 100%; "{x} de {y} supervisionadas"; `aria-label` repete. oculta se `sessionsDone = 0` |
| Pendências | `StatusChip` warning, só se > 0 |
| Próxima sessão | `text-[11px] text-ceci-secondary` |
| Toque | Abre `internshipCase`; alvo = card inteiro |

Cartão final "sem iniciais" (warning) quando `orphans.length > 0`: "{n} atendimentos sem
iniciais — toque pra completar". Sem busca na v1 (§15).

### 9.6 Aba "supervisão"

`SupervisionView` **deixa de ter estado, formulário e `emptyEntry`**. Vira vista
filtrada de `internshipLogs` (`supervisao` + `intervisao`) que reaproveita o card v2.

1. `SegmentedControl`: todas · supervisão · intervisão. Sem estado persistido.
2. Faixa "pra levar", só se houver sessão sem supervisão: chips por paciente (levam à
   tela do caso) e "levar pra próxima" → wizard com `kind: 'supervisao'` **sem
   pré-seleção** (com muitas pendentes, marcar tudo seria errado; a seleção é feita no
   passo "discutidos"). Para pré-selecionar por paciente, usa-se o botão da tela do caso.
3. Lista: agendadas primeiro ("próximas"), depois data desc.
4. `focusLogId`: rola até o card, expande e aplica `ring-2 ring-ceci-border-academic`
   por 1,2 s; sem animação se movimento reduzido.
5. "+ anotar" abre o wizard em `supervisao`; editar = `⋯` → wizard com `editId`.
   **Não existe mais formulário inline** (`F10`).
6. Vazio: mascote `supervision-reflect` + "ainda não tem supervisão anotada — que tal
   registrar a próxima? ♡".

### 9.7 Tela do caso (`InternshipCaseView`) ⚠ itens 4, 6

Tela cheia empilhada (`D15`), alimentada por `patientKey` lendo o estado **vivo** — o que
corrige o snapshot velho de `U5`. Se o `patientKey` deixar de existir, faz back e mostra
toast "esse paciente não tem mais sessões".

`headerConfig`: voltar, título = iniciais, `HeaderActionMenu` com "nova sessão" e
"corrigir iniciais".

Corpo: hero (iniciais, `latestAge`, `latestApproach` ; 3 mini cards — sessões
feitas, horas, supervisionadas x/y; `ProgressBar`) → pendências do caso com filtro local
(`todas · sem reflexão · sem supervisão`, só se houver) → linha do tempo **mais recente
primeiro** → barra de ações fixa.

- Linha do tempo: trilho `border-l border-ceci-border-subtle`; nó = círculo de 28 px
  com o número da sessão (ou relógio, se agendada). Cada item é o card com
  `variant="inCase"` (esconde badge e linha de iniciais). Agendadas no topo, com
  rótulo "próxima".
- Barra: primário "+ nova sessão com {iniciais}" → seed com `kind`, `patient`,
  `sessionNumber: nextSessionNumber(case)`, `patientAge`, `approach` , `date: hoje`;
  secundário "levar pendentes pra supervisão" (só se `pendingSupervision > 0`) → seed com
  `discussedLogIds`.
- "corrigir iniciais": sheet com o campo preenchido, ajuda "só iniciais, sem nome
  completo ♡". Ao digitar, se a chave normalizada colidir com outro caso, o botão vira
  "juntar com {outro}". Vazio bloqueado. Executa `handleRenamePatient`.
- Caso `patientKey = ''`: sem hero de progresso, título "sem iniciais", e cada linha tem
  "adicionar iniciais" para **aquele registro** (com `PatientPicker`), porque órfãos
  podem ser pessoas diferentes e **nunca** são renomeados em bloco (`D9`).

### 9.8 Copy

Todas as strings em `src/lib/copy.ts`, agrupadas em `internship.*`. Helpers:
`pluralPt` (já existe, §1.2) e `formatHoursBR(n)`.

| Chave | Texto |
|---|---|
| `headerTitle` / `headerSubtitle` | estágio / campo, supervisão e entregas ♡ |
| `tabs` | diário · pacientes · supervisão |
| `goalCta` / `goalOf` / `goalLeft` / `goalDone` | definir meta · de {n} h · faltam {n} h · meta batida ♡ |
| `pendTitle` | pendências |
| `pendReflection` / `pendSupervision` | {n} sem reflexão · {n} sem supervisão |
| `pendBanner` / `pendClear` | mostrando {n} {tipo} · limpar |
| `filterAll/Field/Clinical/Supervision` | todos · campo · clínico · supervisão |
| `groupUpcoming/ThisWeek/LastWeek` | próximos · esta semana · semana passada |
| `scheduledChip` | agendado · amanhã / em {n} dias / {dd/mm} |
| `scheduledHint` | ainda não aconteceu — dá pra completar depois ♡ |
| `reflectionOk` / `reflectionAdd` | reflexão ok · sem reflexão · adicionar |
| `supervised` / `notSupervised` / `intervised` | supervisionada · sem supervisão · discutida em intervisão |
| `discussedCount` | {n} sessão discutida / {n} sessões discutidas |
| `stepConverted` | virou tarefa ✓ · virou leitura ✓ · virou foco ✓ |
| `emptyDiary` | ainda não tem registro de estágio — que tal anotar o primeiro? ♡ |
| `emptyPatients` | nenhum paciente por aqui ainda — anote um atendimento clínico e ele aparece aqui ♡ |
| `emptySupervision` | ainda não tem supervisão anotada — que tal registrar a próxima? ♡ |
| `emptyFilter` | nada por aqui com esse filtro |
| `orphanCard` | {n} atendimentos sem iniciais — toque pra completar |
| `patientHint` | só iniciais, sem nome completo ♡ |
| `patientLooksFull` | isso parece um nome completo — iniciais protegem o paciente |
| `patientDuplicate` | já existe "{x}" — usar esse? |
| `sessionDuplicate` | já existe a sessão {n} de {x} (dá pra salvar assim mesmo) |
| `futureDate` | essa data ainda não chegou — vai ficar como agendado ♡ |
| `afterSupervisionDate` | essa sessão é depois da data da supervisão |
| `caseGone` | esse paciente não tem mais sessões |
| `saved` / `savedScheduled` / `savedEdit` | registro guardado ♡ · agendado ♡ · registro atualizado ♡ |
| `savedSupervision` | supervisão guardada · {n} {sessão/sessões} ligada(s) ♡ |
| `deletedConfirm` | apagar esse registro? {se supervisão com sessões: as sessões voltam a ficar sem supervisão} |

### 9.9 Wizard v4

Continua no `WizardScaffold` + `useWizardForm`. Resumo opcional (`D10`), nenhum texto
fabricado (`D11`), **uma única** chamada `handleSaveInternshipLog`, aceita seed (§8.4),
`hours` aceita vírgula e decimal.

| # | `estagio` / `outro` | `atendimento_clinico`  | `supervisao` / `intervisao` |
|---|---|---|---|
| 1 | essencial: título (opcional), data, horas | essencial: paciente, sessão nº, data, horas, título (opcional) | essencial: título (opcional), data, horas, supervisora/grupo |
| 2 | reflexão ("como foi pra você?"; `outro`: "anotações") | contexto: idade, tema/queixa, abordagem, intervenções  | preparo: temas, "o que você levou", dúvidas |
| 3 | revisar | reflexão: impressões clínicas + reflexão  | discutidos: seletor de sessões |
| 4 | — | — | revisar |
| 5 | — | — | combinados: orientações, "o que ficou combinado", próximos passos |
| 6 | — | — | autoavaliação (opcional, com "pular") + "como você saiu dessa conversa?" (grava em `reflections`) |
| 7 | — | — | revisar |

**Validação mínima** (habilita "próximo" e "guardar só o essencial"):

| Tipo | Obrigatório | Mensagem |
|---|---|---|
| `atendimento_clinico` | iniciais do paciente | "coloque as iniciais do paciente" |
| demais | nada (data padrão = hoje) | — |

**Passo essencial.**

- **Horas:** `TextInput inputMode="decimal"`, aceita "1,5" e "1.5"; atalhos `PillGroup`
  (1 · 2 · 3 · 4 · 6 h); clamp 0–24 com erro inline "até 24 h por registro". Vazio = 0.
- **Data:** `DateInput`, padrão hoje.
- **Título:** placeholder = `suggestTitle` do estado atual; vazio salva o sugerido.
- **Supervisora/grupo:** `TextInput` + até 3 atalhos com os últimos valores distintos já
  usados no mesmo tipo.

**`PatientPicker`** (atendimento). 1) `PillGroup` com pacientes existentes (mais recente
primeiro, até 8; excedente atrás de "ver todos") + "+ novo". 2) "+ novo" revela
`TextInput` com `patientHint`; `formatPatientLabel` ao sair. 3) Se a chave normalizada
colidir com um caso existente: aviso `patientDuplicate` com botão que troca para o
existente. Se parecer nome completo (≥ 2 palavras com ≥ 3 letras, ou > 12 caracteres):
aviso `patientLooksFull`, **não bloqueia**. 4) Ao escolher existente, e **somente se o
campo ainda estiver vazio**, preenche `sessionNumber = nextSessionNumber(caso)`,
`patientAge`  e `approach` . 5) Sessão nº duplicada: `sessionDuplicate`, **não
bloqueia**.

**`DiscussedLogsPicker`** (supervisão/intervisão).

- Mostra **só atendimentos feitos** (agendado não pode ser discutido).
- Filtro por paciente no topo quando houver > 1.
- Seções: "nesta supervisão" (só em edição, sempre visível e marcado), "sem supervisão
  ainda" (`¬supervised`), "já discutidas antes" (recolhida, com contagem). Em intervisão
  a regra é a mesma (`D5`).
- Linha com checkbox **customizado** (`role="checkbox"`, 44 px — **não** o
  `<input type="checkbox">` nativo): `sessão 3 · M.S. · 26/08` + tema em `line-clamp-1`;
  ícone de aviso e `afterSupervisionDate` quando a sessão é posterior à data da supervisão
  (`I9`, não bloqueia).
- Cabeçalho de paciente na seção, com "marcar todas" / "desmarcar".
- Contador fixo "{n} selecionadas". A lista rola com a página.
- Vazio: "nenhum atendimento feito ainda — quando anotar sessões, elas aparecem aqui ♡";
  o passo pode ser pulado.

**Revisar.** `ReviewCard` só com linhas preenchidas, mais: "título (sugerido)" se vazio;
"reflexão: ainda não — dá pra adicionar depois" em warning (nunca gravada como texto);
"seessões discutidas: {n}".

**Salvar.** Monta o `InternshipLog` → `handleSaveInternshipLog` → `hapticSuccess` → fecha
→ toast (`saved`, `savedScheduled`, `savedEdit` ou `savedSupervision`). Volta para a tela
de origem. `onSaveMinimal` ("guardar só o essencial por enquanto ♡") disponível do passo
2 em diante quando a validação mínima passa.

**Edição.** Abre preenchido; `seed.startAtStep` posiciona o passo inicial. Edição nunca
lê nem grava rascunho.

**Rascunho.** Sem seed e sem edição, continua `wizard_draft_internship`. `isDirty` passa
a considerar qualquer campo de conteúdo, não só título e reflexão.

**Data futura** (`D7`): aparece o aviso `futureDate` no passo essencial, e os passos de
conteúdo ficam opcionais com "dá pra preencher depois"; o toast final é `savedScheduled`.

### 9.10 Acessibilidade, movimento e temas

- Abas com `role="tablist"` (já no `UnderlineTabBar`); chips de filtro `aria-pressed`;
  card expansível `aria-expanded` + `aria-controls`; barras de progresso com
  `role="progressbar"` e texto equivalente; checkbox customizado `role="checkbox"` +
  `aria-checked`.
- **Não depender só de cor:** todo estado tem ícone e texto.
- Foco: ao abrir sheet/modal, foco no primeiro campo; ao fechar, volta ao gatilho.
  Navegação de teclado em todos os controles.
- Alvos ≥ 44 × 44 px (incluindo `⋯`, checkbox e chips clicáveis).
- Movimento reduzido: sem ring animado, sem altura animada.
- Toasts em região `aria-live="polite"`.
- Contraste dos chips warning/success e do estado agendado nos 10 temas, com atenção a
  noturno e neon.
- Fonte grande: os 3 mini cards do resumo quebram em linha de texto sem truncar números.

---

## 10. Casos de borda (comportamento normativo)

| ID | Situação | Comportamento |
|---|---|---|
| `E1` | Editar um registro feito para data futura | Vira agendado: sai de horas, pendências, stickers e gráfico; não bloqueia. Se estava em `discussedLogIds`, o vínculo é mantido mas ignorado nas contagens até a data chegar |
| `E2` | Supervisão agendada com sessões marcadas | Não conta como `supervised` até `date <= hoje`. Preparo permitido |
| `E3` | Apagar atendimento que foi discutido | `planDelete` retira o id; a supervisão passa a mostrar N−1 |
| `E4` | Apagar supervisão | As sessões ligadas voltam a "sem supervisão" **sem nenhuma outra limpeza**. A confirmação avisa |
| `E5` | Corrigir iniciais para chave que já existe | Mostra "juntar com X"; ao confirmar, todos os atendimentos viram o rótulo do caso destino (o mais recente vence). **Uma atualização só** |
| `E6` | Número de sessão repetido | Aviso não bloqueante; ordem por data resolve a exibição |
| `E7` | Data inválida/vazia (import antigo) | Cai no grupo "sem data" (último), conta como `done` para horas, sem pendência de agendado. O wizard sempre exige data válida |
| `E8` | `hours = 0` | Permitido; o card **omite** a parte das horas |
| `E9` | Horas com vírgula ("1,5") | Aceita e normaliza para 1.5. Acima de 24 → erro inline |
| `E10` | Virar o dia com o app aberto | `useTodayKey()` (novo hook) recalcula em `visibilitychange`/foco e por timer na meia-noite local; as listas reagrupam sem recarregar |
| `E11` | Muitos registros (> 300) | Lista renderiza as 4 semanas mais recentes + "ver semanas anteriores" (+8 por toque). Derivações O(n) em **um** `useMemo` |
| `E12` | Import de backup `schemaVersion ≤ 19` com `supervisionLogId` | A cadeia chega à 20 e converte (§6) |
| `E13` | Dois aparelhos editam o mesmo registro | LWW por registro. O vínculo vive só na supervisão, então não há divergência entre registros |
| `E14` | Caso só com sessões agendadas | Aparece no topo, sem barra de progresso, com "primeira sessão agendada" |
| `E15` | "José P." e "Jose P." | Mesma chave (`josep`); rótulo = o do atendimento mais recente |
| `E16` | Texto muito longo | `break-words`; recolhido usa `line-clamp`; sem limite duro |
| `E17` | Abrir wizard com seed havendo rascunho | Seed prevalece; o rascunho antigo fica intacto e volta quando abrir sem seed |
| `E18` | `type` desconhecido (versão futura) | Cai na variante `outro`; nunca quebra a lista |
| `E19` | Próximo passo editado após virar tarefa | `sanitizeLog` poda o vínculo (o texto mudou); os botões voltam; a tarefa criada **não** é apagada |
| `E20` | Entidade ligada ao próximo passo foi apagada | Vínculo tratado como inexistente; botões voltam |
| `E21` | Falha ao converter próximo passo | Atualização única: ou cria entidade + vínculo, ou nada; toast "não deu certo, tenta de novo" |
| `E22` | Iniciais que parecem nome completo | Aviso suave, nunca bloqueia nem altera o texto |
| `E23` | Meta menor que as horas já feitas | Permitida; mostra "meta batida ♡" e barra cheia |
| `E24` | Sem rede | Tudo é local; nada nesta spec depende de rede |
| `E25` | Dado legado `supervision` presente no boot | `drainLegacySupervision` converte uma vez e esvazia; segunda execução não faz nada |

---

## 11. Impacto por arquivo

### 11.1 Novos

| Arquivo | Conteúdo |
|---|---|
| `packages/domain/src/core/domain/internship.ts` + `__tests__/internship.test.ts` | §7 inteiro |
| `src/hooks/useTodayKey.ts` | `E10` |
| `src/components/internship/{LogTypeBadge,StatusChip,FieldBlock,NextStepRow,DiscussedList,PendencyBar,SummaryCards,GoalSheet,WeekGroup,PatientPicker,DiscussedLogsPicker,RenamePatientSheet}.tsx` | Peças da UI |
| `src/components/views/InternshipCaseView.tsx` | §9.7 |
| `src/lib/__tests__/{pluralPt,dateBR}.test.ts` | **Já prontos** (§1.1) |
| `src/components/internship/__tests__/InternshipCaseDetail.test.tsx` | **Já pronto** (§1.1) |

### 11.2 Alterados

| Arquivo | Mudança |
|---|---|
| `src/types/internship.ts`, `src/types/profile.ts` | §5.1, §5.3 |
| `packages/data/src/schema.ts` | `SCHEMA_VERSION = 20`, `MIGRATIONS[20]`, `F15`, `F17` |
| `packages/data/src/collections.ts` | Comentário de `supervision` (continua legada), `F14` |
| `packages/data/src/backupSchema.ts` | `internshipGoalHours` **já é aceito** (`passthrough`, §5.3) |
| `src/context/DataClientProvider.tsx` | `drainLegacySupervision`; `applyDatabase` lê `db.supervision`; chave do hook `F14` |
| `src/lib/migrations.ts` | Delega para `legacyNotebookToLog` do domínio |
| `src/context/dataActions.ts` | Ações da §8.1 |
| `src/lib/entityOps.ts` | `case 'internship'` usa `planDelete` (a cascata provisória de `F3` sai) |
| `src/lib/contextActions.ts` | Status do registro (§8.2) |
| `src/lib/stickers.ts` | Só registros `done` |
| `src/lib/schedule.ts` | `upcomingEvents` recebe `today` |
| `src/lib/internshipPreview.ts` | Consome `todayKeyLocal`; passa a ser usada de verdade (`F20`) |
| `src/lib/internshipCases.ts` | Vira stub que reexporta o domínio (caminho relativo) |
| `src/lib/internshipCycle.ts` | `@deprecated` (remoção na fase 9) |
| `src/lib/dateBR.ts` | **Move** para `packages/domain` (§7) |
| `src/lib/copy.ts`, `src/lib/headerConfig.ts` | §9.8, §8.3 |
| `packages/navigation/src/{types,hash}.ts`, `src/lib/__tests__/routing.test.ts` | §8.3 |
| `src/context/navigationEngine.ts`, `src/context/AppContext.tsx` (só tipos), `shellNavContexts.ts` | `wizardSeed`, `openInternshipWizard`, telas novas |
| `src/shells/SharedScreenLayers.tsx` | Render de `internshipCase` |
| `src/components/views/InternshipDiaryView.tsx` | Reescrito (§9.2–9.3) |
| `src/components/views/SupervisionView.tsx` | Vista filtrada, sem estado/form (§9.6) |
| `src/components/InternshipLogCard.tsx` | v2 (§9.4) |
| `src/components/internship/InternshipCaseCard.tsx`, `InternshipCaseDetail.tsx` | Card v2; `CaseDetail` **removido** (substituído pela tela do caso) |
| `src/components/views/faculdade/InternshipSection.tsx` | §9.2 |
| `src/components/views/PerfilView.tsx` | Usa o domínio (§8.2) |
| `src/components/wizards/InternshipWizard.tsx` | §9.9 |
| `src/components/wizards/note/{InternshipForm,fieldsFor}.tsx`, `NoteTransformWizard.tsx` | Horas decimais, data local (`F12`) |
| `src/data/fixtures/goldenSample.ts`, `cecistudy-rust/contracts/golden/**` | Regeneração **com aprovação** (§6.4) |
| `AGENTS.md` do app | `SCHEMA_VERSION` de 18 para **20** (`F13`, fecha **C3**); descrever o novo fluxo |

---

## 12. Testes

**Gate de cada PR:** `npm run lint` + `npm run test`; e
`node .github/scripts/check-boundaries.mjs` quando tocar `packages/*`, `src/shells` ou
`src/overlays`.

**Fuso:** os testes de data rodam com `process.env.TZ = 'America/Sao_Paulo'` e
`vi.setSystemTime`.

### 12.1 Domínio (`internship.test.ts`)

- **Datas:** `toDateKey` às 23:30 locais não vira o dia seguinte;
  `formatDateBR('2026-08-26') === '26/08/2026'` (regressão `F4`, **já coberta**);
  `addDays` atravessa mês, ano e ano bissexto; `weekStartKey` de domingo devolve a
  segunda anterior; `inWeek` inclui a segunda e exclui a segunda seguinte.
- **`normalizePatientKey`:** `"M. S."`, `"ms"`, `" M.S "` iguais; acentos; `".."` e
  `undefined` → `""`.
- **`statusOf`/`computePendencies`:** reflexão só para clínico/estágio (**ou só estágio,
  agendado nunca pendente; supervisão agendada não
  supervisiona; intervisão não fecha pendência mas marca `intervised`; sessão em 2
  supervisões; id órfão ignorado.
- **`computeStats`:** agendados fora de horas; hoje conta; semana começa na segunda;
  `weeklySeries` com 8 posições; `weeksWithData`.
- **`deriveCases`:** agrupa por chave; rótulo do mais recente; `progress`; só agendadas;
  órfãos separados; ordenação; **`lastSessionDate` = maior data, não última por sessão**
  (regressão `F23`).
- **`planSave`/`sanitizeLog`:** nunca altera `reflections`; clamp de horas; título
  sugerido; remove `selfAssessment` vazio; poda `nextStepLinks`; `discussedLogIds` fora de
  supervisão é removido.
- **`planDelete`:** atendimento retira id de supervisões; supervisão some sem tocar
  atendimentos.
- **`planRenamePatient`:** juntar casos; vazio rejeitado; órfãos **não** são renomeados em
  bloco (usar `planSetPatient`).
- **`groupByWeek`:** rótulos, "próximos" primeiro, grupo "sem data".

### 12.2 Migração (`schema.test.ts` / `migrations.test.ts`)

- `supervisionLogId` → `discussedLogIds` (supervisão **e** intervisão); vínculo órfão
  descartado; **idempotência** (rodar 2×); caderno legado de `data.supervision` vira log
  **com `workspaceId`** (regressão `F8`); não duplica por id; `selfAssessment` vazio
  removido; `supervision: []` mantido; backup v19 completo passa pelo `backupSchema`.
- **`F18`:** o golden regenerado **não** contém `supervisionLogId` apontando para id
  inexistente.
- **`F15`:** `MIGRATIONS[16]` é determinística — rodar 2× dá o mesmo payload.
- **`F17`:** versão faltante **falha** em vez de ser pulada.
- **`F14`:** `isUserCollectionKey('internshipLogs') === true` e o hook usa a mesma chave.
- `drainLegacySupervision` (com dado legado simulado): converte uma vez, esvazia o legado,
  segunda execução não faz nada.

### 12.3 Navegação (`routing.test.ts`)

Parse/serialize das 4 rotas; `patientKey` com acento/espaço codificado; `sem-iniciais`;
volta do caso para a aba pacientes.

### 12.4 Componentes (RTL/jsdom)

- `InternshipDiaryView` na aba pacientes não lança com `selectedCase` nulo (**regressão
  `F1`, já coberta**).
- Pendências: chip filtra a lista, segundo toque limpa, bloco some com zero, badge das abas.
- Card: variantes por tipo mostram os campos esperados; "sem reflexão · adicionar" abre o
  wizard em `reflexao`; toque expande, long-press mantém o menu.
- `NextStepRow`: converter uma vez; desabilita; volta se a entidade sumiu.
- Wizard: atendimento exige iniciais; título vazio salva sugerido; reflexão vazia salva
  `''`; vírgula em horas; data futura mostra aviso e toast certo; seed não lê rascunho;
  discutidos mostra pendentes primeiro e pré-marca em edição; **salvar dispara uma única
  atualização**.
- Plural: "1 sessão" / "2 sessões" / "1 reflexão" / "2 reflexões" (regressão `U2`,
  **já coberta**).
- `stickers.test.ts`: horas e contagem só com `done`.

---

## 13. Plano de implementação (PRs)

Cada fase é um PR independente que deixa o app funcional.

| Fase | Entrega | Depende | Aceite resumido |
|---|---|---|---|
| **0** | **FEITA em 2026-10-05** — confirmar `F1`/`F8`, hotfix de `F1`, `F2` (guard), `F3`, `F4`, `F5`, `U2`; helpers `dateBR.ts` e `pluralPt.ts`; 3 arquivos de teste | — | Gate verde: 109 arquivos · 1138 testes |
| **1** | Módulo de domínio + stub + mover `dateBR` para `packages/domain`; consumidores (`PerfilView`, `stickers`, preview, `schedule`) | 0 | Contagens iguais em Perfil, Seção e Diário; testes de §12.1 |
| **2** | Migração 20 + `drainLegacySupervision` + `applyDatabase` + **`F14`** + `F15`/`F16`/`F17` + goldens (commit separado, **com aprovação**) | 1 | Backup v19 importa e converte; idempotência; CI verde |
| **3** | Ações atômicas: `handleSaveInternshipLog`, `planDelete` no `entityOps`, `handleConvertNextStep`, `handleSetInternshipGoal` | 2 | Apagar supervisão/atendimento deixa dados consistentes; **1 escrita por ação** |
| **4** | Navegação: abas com deep-link, rota do caso, `wizardSeed` | 1 | Rotas de §8.3; swipe-back; seed ignora rascunho |
| **5** | UI 1: card v2, resumo + meta, `PendencyBar`, filtros, agrupamento por semana, agendados | 1, 3, 4 | §9.2–9.4 completos em rosa-claro e noturno |
| **6** | UI 2: aba pacientes, tela do caso, aba supervisão (sem form inline) | 4, 5 | §9.5–9.7; `CaseDetail` e form inline removidos |
| **7** | Wizard v4 (`PatientPicker`, `DiscussedLogsPicker`, passos por tipo) | 3, 4 | §9.9; draft/seed corretos |
| **8** | Limpeza: remover `derivedPhase`, `PHASE_LABEL`, `selectDiaryPreview` reimplementado, tipos mortos; atualizar `AGENTS.md` e `.context/*` | 7 | Sem referências a `supervisionLogId` fora da migração e do tipo `@deprecated` |

**As fases 1 e 2 já entregam valor visível** (números coerentes e dado legacy
convertido) mesmo que o resto atrase.

**Sequência alterada em relação ao rascunho original:** a correção do `F14` subiu para a
fase 2, porque ela é a fase que toca a chave de persistência — e misturar duas mudanças
de chave no mesmo PR é como se perde dado.

---

## 14. Critérios de aceite globais

1. Abrir a aba pacientes sem dados e com dados nunca lança erro. **✅ desde 2026-10-05**
2. Um registro de `2026-08-26` aparece como `26/08` em qualquer fuso e em qualquer hora
   do dia. **✅ desde 2026-10-05**
3. Registros com data futura não somam em horas, pendências, stickers nem gráfico, e
   aparecem em "próximos" com chip "agendado".
4. Marcar sessões numa supervisão e salvar faz as sessões ficarem "supervisionadas" **sem
   escrever nenhum outro registro**; desmarcar todas desfaz.
5. Apagar uma supervisão faz as sessões voltarem a "sem supervisão"; apagar uma sessão a
   remove da supervisão. **✅ a segunda direção desde 2026-10-05**
6. Uma sessão pode ser discutida em duas supervisões e mostra ambas em "discutida em".
7. Intervisão aparece na aba supervisão com filtro próprio e **não** fecha a pendência
   de supervisão.
8. Nenhum texto de reflexão é criado automaticamente; reflexão vazia mostra o convite
   "sem reflexão · adicionar".
9. Os contadores de pendência são iguais no Diário, nos badges das abas, na Seção da
   Faculdade e no Perfil.
10. Cada chip de pendência filtra a lista; tocar de novo limpa; zerou, o bloco some.
11. A tela do caso mostra progresso, linha do tempo mais recente primeiro, "+ nova
    sessão" pré-preenchida e "levar pendentes pra supervisão" pré-selecionada
12. "M. S.", "ms" e "M.S" formam um caso; corrigir iniciais para outro caso oferece juntar
    e executa em **uma** atualização.
13. Atendimento sem iniciais aparece em "sem iniciais" e pode receber iniciais **registro
    a registro**.
14. Wizard: só atendimento exige iniciais; título vazio salva o título sugerido; horas
    aceitam vírgula; **uma única escrita** ao salvar; seed não é sobrescrita por rascunho.
15. Meta de horas: definir, editar, remover; barra e "faltam N h" corretos; sem meta não
    aparece nada além de "definir meta".
16. Migração 20 idempotente e backups antigos importam sem perda (exceto vínculos órfãos
    descartados).
17. Sem cores fixas em `className`, copy toda em `copy.ts`, plural via `pluralPt`, alvos
    ≥ 44 px, contraste OK em rosa-claro e noturno.
18. `npm run lint`, `npm run test` e `check-boundaries` verdes em **todos** os PRs.

---

## 15. Fora de escopo, riscos e verificações pendentes

### 15.1 Backlog (decidido não fazer agora)

| Item | Por quê não agora |
|---|---|
| Desktop Rust do estágio (spec própria; paridade R4) | `D1`. Exige ajustar `entity::InternshipLog` e `internship.rs` para `discussed_log_ids`/`next_step_links` e remover `supervision_log_id` |
| Status "encerrado" do caso e alerta de paciente parado | `D14` |
| Busca de pacientes | Volume de um estágio não pede |
| Metas por tipo | `D2` — depende de regra da faculdade, que é `[A]` |
| Exportar relatório de horas (PDF/CSV) | §4.8 linha 442 marca relatórios como **`[P]`** |
| Ligar sessões a leituras/conceitos do Temple direto no card | `SPEC-M-007` decide o reuso; aqui é aditivo |
| Lembrete local de "levar para supervisão" | Requer notificação; fora do recorte |

### 15.2 Riscos

| Risco | Mitigação |
|---|---|
| **`F14` corrige a chave e órfã dado de Android** | É por isso que `F14` é da fase 2, e não do hotfix: chave nova + drenagem do lugar antigo no mesmo PR, com o mesmo backup |
| Migração muda o significado de vínculos antigos a intervisões (`D5`) | Nota de versão + chip "discutida em intervisão" mantém a informação visível |
| Regeneração de golden afeta o oráculo do desktop | PR separado, com aprovação explícita; e `F18` mostra que o golden atual **já** está errado |
| `F16` — decidir se `supervision` fica no registry ou sai | É decisão de fase, não de hotfix; até lá a coleção fica **declarada** |
| Mudança de rota/seed no `navigationEngine` (arquivo grande e central) | Fase 4 isolada, com testes de roteamento primeiro |
| **A1/`D20`** | Decidida: o mobile mantém a camada clínica. A §8 do referencial e a §4.8 precisam da marca nova, **pela dona do produto** |

### 15.3 Verificações pendentes antes da fase 2

| ID | Verificar | Se falhar |
|---|---|---|
| `V1` | Reproduzir `F8` num aparelho com dado real — existe `supervision` salva? | Se não há dado, mantém só o ajuste de `applyDatabase` e registra por quê |
| `V2` | Como a coleção `supervision` é carregada no boot, nativo e web | Define se `drainLegacySupervision` lê Preferences, tabela SQLite, ou as duas |
| `V3` | Onde o dado de Android está hoje: `Preferences['internship']` ou `SQLite internship` | Define a drenagem do `F14` |
| `V4` | Se `useLongPress`/`onTap` do `ManageSurface` convive com expandir o card sem disparar duas vezes | Ajustar o handler |
| `V5` | Nomes e props exatos de `FixedBottomBar`, `HeaderActionMenu`, `AnimatedNumber` | Adaptar os exemplos sem mudar a UX |
| `V6` | `internshipLogSchema` aceitar `nextStepLinks` com `passthrough` — **já verificado** (`backupSchema.ts:124-131`) | Nada |
| `V7` | ~~`A1`~~ respondida em 2026-10-05 (`D20`) | Nada. Registrar a supersedência parcial na `SPEC-M-008` |

---

## 16. Rastreabilidade

| Regra | Onde vira código | Onde é verificada |
|---|---|---|
| `F1` não lança | `InternshipCaseDetail.tsx:13-18` | `InternshipCaseDetail.test.tsx` ✅ |
| `U2` plural | `src/lib/pluralPt.ts` | `pluralPt.test.ts` ✅ |
| `F4` data civil | `src/lib/dateBR.ts` → `packages/domain` | `dateBR.test.ts` ✅ |
| `F5` hoje local | `dateBR.ts`, `InternshipSection.tsx:67`, `schedule.ts:191` | `dateBR.test.ts` ✅ |
| `F3` cascata | `entityOps.ts:146-167` (provisória) | `entityOps.test.ts` ✅ |
| `D3` fonte única | `packages/domain` `planSave`/`planDelete` | fase 3 |
| `D7` agendado | `computeStats` | fase 1 |
| `MIGRATIONS[20]` | `packages/data/src/schema.ts` | fase 2 |
| `F14` chave única | `DataClientProvider.tsx:456`, `collections.ts` | fase 2 |
| `D15` tela do caso | `InternshipCaseView.tsx` | fase 6 |
| `D17` vínculo de passo | `planLinkNextStep` | fase 3 |
| `D20` camada clínica no mobile | §5.1, §9.5, §9.7 | decisão de produto; sem gate próprio |

---

## 17. Reconciliação

Esta spec **não substitui** nenhuma. O módulo Estágio não tinha spec no app; o que
existia era diagnóstico.

| Documento | O que era | O que acontece |
|---|---|---|
| Rascunho "SPEC-009 v4" (2026-10-02, não versionado) | Diagnóstico com `⚠` em `F1` e `F8` | **Confirmado** por leitura de código, com `caminho:linha`. `F1` reproduzido em teste; `F8` confirmado e **ampliado** (o caderno nunca migrou, e os logs não recebem `workspaceId`) |
| Rascunho, §4.1 (camada clínica no mobile) | Proposta, conflitante | **Liberada por `D20`**. A `SPEC-M-008` precisa declarar supersedência parcial |
| Rascunho, §5.1 (`internshipCases` vira stub) | Proposta | Mantida (fase 1) |
| Rascunho, §6.5 (golden) | Proposta | Mantida, com o achado `F18` |
| Rascunho, §11 fase 1 (hotfix) | Proposta | **FEITA** em 2026-10-05 (§1.1), e o plano foi renumerado a partir daí |
| `AGENTS.md:47` (`SCHEMA_VERSION = 18`) | Débito **C3** do grupo | Correção é na fase 8, junto com o resto da documentação |

---

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite
> verificável por comando, está incompleta. Isso é
> [`ADR-004`](../../../docs/decisoes/ADR-004-documentacao-e-decisoes-em-pt-br.md).