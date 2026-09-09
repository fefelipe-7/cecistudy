# Spec v3 — Estágio, Supervisão e Intervisão (cecistudy)

**Base:** análise do código real (`InternshipDiaryView.tsx`, `InternshipWizard.tsx`, `InternshipLogCard.tsx`, `SupervisionView.tsx`, `AppContext.tsx`, `types.ts`, `entityOps.ts`, `contextActions.ts`) + design system existente (`packages/design-tokens`, `src/components/ui`).

**Diferença em relação à spec v2 anterior:** aquela spec propunha entidades novas (`InternshipCase`, `Supervision`, `Intervision`) sem ver o código. Depois de ler o projeto, boa parte do que eu queria "criar" já existe — `patient`, `sessionNumber`, `approach`, `orientations`, `doubts`, `nextSteps`, `ManageSurface` com long-press universal, `status: completo/incompleto` derivado. Esta spec substitui a anterior e parte do código real, propondo **evolução**, não reescrita.

---

## 1. Diagnóstico (código + prints confrontados)

| Sintoma visto na print | Causa real no código |
|---|---|
| Reflexão "sem reflexões" salva mesmo com fase "refletir" marcada | Não é bug de UI — `InternshipWizard.tsx:434` tem fallback: `reflections.trim() \|\| 'reflexão registrada no diário do cecistudy.'`. O app inventa uma frase quando o campo fica vazio. |
| Ciclo de formação nunca reflete nada | `phase` é um campo de formulário (`InternshipWizard.tsx` `cycleStep`) só do tipo `estagio`. Não é derivado de nada, não muda depois de salvo. |
| Card "0 supervisões" sem contexto | `InternshipDiaryView.tsx:66` conta `supervision.length` (do `SupervisionNotebook[]`), que é uma lista **totalmente desconectada** dos `InternshipLog` do tipo `atendimento_clinico`. |
| "Caderno de supervisão" vazio e sem relação com o diário | Confirmado: `SupervisionNotebook` (tela separada) e `InternshipLog` tipo `supervisao`/`intervisao` (dentro do diário) são **dois sistemas paralelos** registrando a mesma coisa conceitual, sem se falarem. |
| Tipo "outro 🔥" fora do ciclo de 5 fases | `estagioSteps` inclui `cycleStep`; o tipo `outro` também usa `estagioSteps` (mesmo fallback), então ganha uma fase que não faz sentido pra um registro avulso. |
| Filtro por fase não corresponde à realidade do dia a dia | `filteredLogs = internshipLogs.filter(l => l.phase === phase)` — só filtra estágio genérico; atendimentos e supervisões (que não têm `phase`) somem desse filtro sem aviso. |

**Duas questões estruturais a resolver, nesta ordem:**
1. **Unificar `SupervisionNotebook` com `InternshipLog` tipo `supervisao`/`intervisao`.** Hoje existem dois lugares pra registrar a mesma coisa.
2. **Tirar o ciclo de fases do formulário e realocá-lo como estado derivado**, calculado a partir de dados reais (reflexão preenchida, supervisão vinculada) — mesmo princípio que `contextActions.ts` já usa pra `status: 'completo' | 'incompleto'`.

---

## 2. Mudanças de modelo de dados (`src/types.ts`)

### 2.1 Remover o fallback de reflexão fake

```diff
- reflections: reflections.trim() || 'reflexão registrada no diário do cecistudy.',
+ reflections: reflections.trim(),
```
`InternshipWizard.tsx`, dentro de `buildLog()`. `reflections` já é `string` obrigatório em `InternshipLog` — manter assim, mas permitir vazio de verdade (`''`), não fabricar texto.

### 2.2 Unificar supervisão/intervisão num único fluxo

Hoje há duas fontes de verdade:
- `InternshipLog` com `type: 'supervisao' | 'intervisao'` (campos: `supervisor`, `topics`, `orientations`, `doubts`, `nextSteps`)
- `SupervisionNotebook` (campos: `supervisor`, `questions`, `beforeNotes`, `afterNotes`, `selfAssessment`, `nextSteps`)

**Proposta:** manter `InternshipLog` tipo `supervisao`/`intervisao` como fonte única, absorvendo o que há de bom em `SupervisionNotebook` (auto-avaliação, antes/depois) que hoje falta no log:

```ts
// adição em InternshipLog, só relevante quando type = 'supervisao' | 'intervisao'
beforeNotes?: string;     // o que levou pra conversa (existia só em SupervisionNotebook)
afterNotes?: string;      // o que ficou combinado (existia só em SupervisionNotebook)
selfAssessment?: {
  confidence?: string;
  limits?: string;
  themes?: string;
};
```

`SupervisionView.tsx` deixa de ser uma tela com estado próprio (`supervision: SupervisionNotebook[]`) e passa a ser um **filtro sobre `internshipLogs`** (`type === 'supervisao' || type === 'intervisao'`), reaproveitando o card já existente em `InternshipLogCard.tsx` (que já tem exatamente os campos `supervisor`, `topics`, `orientations`, `doubts`, `nextSteps` renderizados).

**Migração de dado:** `SupervisionNotebook[]` existentes viram `InternshipLog[]` tipo `supervisao` na primeira abertura pós-update — mapeamento direto de campo (`questions` → `topics`, resto preservado). Isso elimina duplicação de tela e de conceito sem perder nenhum dado já registrado.

### 2.3 Vínculo leve entre atendimentos do mesmo paciente (sem nova entidade)

Não é preciso criar `InternshipCase`. `patient` (iniciais) e `sessionNumber` já existem em `InternshipLog`. A "visão por caso" é **derivada**, calculada em memória:

```ts
// src/lib/internshipCases.ts (novo arquivo, função pura)
export interface DerivedCase {
  patientKey: string;          // patient.trim().toLowerCase() — chave de agrupamento
  patientLabel: string;        // patient original, como exibir
  logs: InternshipLog[];       // ordenados por sessionNumber ou data
  totalHours: number;
  lastSessionDate: string;
  pendingReflection: number;   // quantos logs desse paciente têm reflections vazio
  pendingSupervision: number;  // quantos logs desse paciente ainda não têm supervisionLogId
}

export function deriveCases(logs: InternshipLog[]): DerivedCase[] { /* agrupa por patient */ }
```

Isso é intencionalmente **não persistido como entidade própria** — reduz risco de migração e mantém uma única fonte de verdade (`internshipLogs`). Se no futuro for necessário editar metadados do caso (ex.: status "encerrado"), aí sim vale promover a um registro real; por ora, é cedo pra isso.

### 2.4 Vínculo sessão ↔ supervisão (substitui `phase` como sinalizador de progresso)

```ts
// adição em InternshipLog, tipo atendimento_clinico
supervisionLogId?: string;   // id de um InternshipLog tipo supervisao/intervisao que discutiu esta sessão
```

E, no lado da supervisão:
```ts
// adição em InternshipLog, tipo supervisao/intervisao
discussedLogIds?: string[];  // ids de InternshipLog (atendimento_clinico) discutidos nesta supervisão
```

Ao salvar uma supervisão com `discussedLogIds` preenchido, o app atualiza `supervisionLogId` nos logs referenciados (mesmo padrão de "efeito colateral coordenado" que `entityOps.ts` já usa para `conceptIds`, ver linha ~150 do arquivo).

### 2.5 `phase` deixa de ser perguntado no wizard

Campo continua existindo em `InternshipLog` (`phase?: InternshipPhase`) só para não quebrar dados antigos — mas `cycleStep` sai do `InternshipWizard.tsx`. Fase deixa de ser escolhida manualmente; vira função pura calculada por registro:

```ts
// src/lib/internshipCycle.ts (novo)
export function derivedPhase(log: InternshipLog): InternshipPhase {
  if (log.type === 'supervisao' || log.type === 'intervisao') return 'supervisionar';
  if (log.reflections?.trim()) return 'refletir';
  return 'registrar';
  // 'preparar' e 'entregar' não são mais estados por-registro — ver seção 4.2
}
```

---

## 3. Backend — resumo das mudanças por arquivo

| Arquivo | Mudança |
|---|---|
| `src/types.ts` | Adicionar campos da seção 2.2/2.4 em `InternshipLog`. Deprecar `SupervisionNotebook` (manter tipo só para leitura de migração). |
| `src/components/wizards/InternshipWizard.tsx` | Remover `cycleStep` e `phase`/`prepChecklist` do form. Remover fallback de reflexão (2.1). Adicionar passo de seleção de `discussedLogIds` no fluxo de supervisão/intervisão (multi-select dos atendimentos ainda sem `supervisionLogId`). Adicionar `beforeNotes`/`afterNotes`/`selfAssessment` ao fluxo de supervisão. |
| `src/components/views/SupervisionView.tsx` | Passa a filtrar `internshipLogs` em vez de `supervision`. Reaproveita `InternshipLogCard`. Arquivo fica bem menor. |
| `src/components/views/InternshipDiaryView.tsx` | Remove barra decorativa do ciclo (linhas 118–137). Adiciona nova visão "por paciente" (seção 4.2). Cards de resumo passam a mostrar pendências reais (seção 4.4). |
| `src/lib/internshipCases.ts` | **Novo.** Função pura `deriveCases()`. |
| `src/lib/internshipCycle.ts` | **Novo.** Função pura `derivedPhase()`, usada só para badge visual, não mais persistida por escolha manual. |
| `src/context/AppContext.tsx` | Migração one-shot de `SupervisionNotebook[]` → `InternshipLog[]` na leitura do banco (ver 2.2). Remover `addSupervision`/`updateSupervision`/`deleteSupervision` depois da migração — passam a usar `handleAddInternshipLog`/`handleUpdateInternshipLog`/o delete genérico via `entityOps`. |
| `src/lib/entityOps.ts` | Nenhuma mudança necessária — `case 'internship'` já cobre delete corretamente. |
| `src/lib/contextActions.ts` | `status` de `'internship'` (linha ~335) passa a considerar `discussedLogIds`/`supervisionLogId` além de `reflections`, para refletir progresso real no menu de ações (long-press). |

---

## 4. UI/UX

Todos os componentes abaixo já existem no design system (`src/components/ui`) e são reaproveitados — nenhum componente novo de baixo nível é necessário, só composição nova.

### 4.1 Header e navegação — mudança mínima

Mantém o header atual (ícone `HeartHandshake`, título, botão "+ anotar" com `openWizard('internship')`) — já está bom e consistente com o resto do app.

A troca é nas sub-abas. Hoje: `diário` / `supervisão` (estado local `tab`, `UnderlineTabBar` já usado). Proposta: manter o mesmo componente `UnderlineTabBar`, mas com 3 opções em vez de 2:

```tsx
const TABS = [
  { key: 'diario', label: 'diário', Icon: HeartHandshake },
  { key: 'pacientes', label: 'por paciente', Icon: Users },   // NOVA
  { key: 'supervisao', label: 'supervisão', Icon: Compass },  // agora inclui intervisão
] as const;
```

`supervisão` deixa de abrir uma tela com formulário próprio (`SupervisionView` como está hoje) e passa a listar `internshipLogs` filtrados por tipo, usando `InternshipLogCard` — visualmente idêntico ao card de atendimento, só que com os campos de supervisão já implementados. Menos código, mais consistência visual entre abas.

### 4.2 Aba "diário" — o que sai e o que entra

**Sai:**
- A barra decorativa do ciclo (`1 preparar → 2 registrar → ...`) — linhas 118–137 de `InternshipDiaryView.tsx`. Não tem clique, não reflete nada, ocupa espaço fixo no topo de toda visita à tela.
- O filtro por fase (`PHASES` pills) — porque fase deixa de ser campo escolhido manualmente.

**Fica, sem mudança:**
- Cards de resumo (3 colunas) — mas com conteúdo revisado, ver 4.4.
- `DitherGrowthChart` de horas por semana — o gráfico em si está correto (dado real, calculado certo em `weeklySeries`); mantém.
- Lista de `InternshipLogCard`, usando `ManageSurface` (long-press já funciona) — sem mudança de interação.

**Entra — bloco de pendências, no lugar onde hoje fica o ciclo decorativo:**

Usa `Card` + ícone + `PillGroup` (variant `rose`, tamanho `sm`) para cada pendência, cada pill clicável leva direto ao registro/paciente relevante:

```
┌─────────────────────────────────────────┐
│  ⚠ pendências                            │
│                                           │
│  [3 sem reflexão]  [2 sem supervisão]    │
│  [M.S. há 3 semanas sem novo registro]   │
└─────────────────────────────────────────┘
```

Cálculo:
```ts
const semReflexao = internshipLogs.filter(l => !l.reflections?.trim()).length;
const semSupervisao = internshipLogs.filter(
  l => l.type === 'atendimento_clinico' && !l.supervisionLogId
).length;
```
Se todas as contagens forem zero, o bloco inteiro some (não mostra "0 pendências" — silêncio é a melhor UI aqui, evita ansiedade de checklist vazio de propósito).

Cada pill, ao ser tocada, aplica um filtro temporário na lista abaixo (reaproveita o padrão de `PillGroup` já usado no filtro de fase, só que agora filtrando por condição derivada, não por campo salvo).

### 4.3 Nova aba "por paciente"

Lista de cards, um por `DerivedCase` (seção 2.3), usando o mesmo `Card` base do resto do app:

```
┌─────────────────────────────────────────┐
│  M. S. · 28 anos                    ●●●○ │ ← ProgressBar mini (sessões supervisionadas/total)
│  4 sessões · 12h · abordagem: TCC        │
│  última sessão: 26/08                    │
│                                           │
│  ⚠ 1 sessão sem reflexão                 │
└─────────────────────────────────────────┘
```

- `ProgressBar` (componente já existente) usado de forma compacta pra indicar `sessões com supervisionLogId / total sessões` — reaproveita o padrão visual de progresso do app inteiro (mesma barra usada em cursos/leituras), em vez de inventar um indicador novo.
- Toque no card abre uma visão de detalhe: lista dos `InternshipLog` daquele paciente em ordem de `sessionNumber`, cada um com badge de estado (refletida/supervisionada) — usa `CompletionToggle` (componente já existente, mesmo círculo verde de check usado em tarefas) como indicador visual não-clicável (`onChange` omitido) para "refletida" e "supervisionada".
- Botão "+ nova sessão com M.S." no topo do detalhe — abre `InternshipWizard` com `patient` pré-preenchido (via draft inicial, reaproveitando `useWizardDraft` que já existe).

Estado vazio (nenhum atendimento clínico registrado ainda): mesma `Mascote` + mensagem no padrão das outras telas (`expression="field-prepare"`).

### 4.4 Cards de resumo revisados

Hoje: `horas totais` / `esta semana` / `supervisões` (contagem solta de `SupervisionNotebook`).

Proposta — mesma grade 3 colunas, mesmo componente visual, conteúdo trocado:

| Card 1 | Card 2 | Card 3 |
|---|---|---|
| horas totais (igual hoje) | esta semana (igual hoje) | **atendimentos com paciente vinculado** (`internshipLogs.filter(type === 'atendimento_clinico').length`) — substitui "supervisões", que agora é redundante com a aba de supervisão. |

Mantém a mesma estrutura visual (`rounded-2xl p-3 bg-white border ... text-center`) — só troca o dado do terceiro card pra algo que gera curiosidade de abrir a aba "por paciente", em vez de um número solto sem ação associada.

### 4.5 Wizard — remoção do passo de ciclo, adição do vínculo de supervisão

**Tipo "estágio" e "outro":** perdem o `cycleStep` (fase + checklist de preparação). Ficam com 3 passos: essencial → reflexão → revisar (hoje têm 4). Reduz fricção, que era exatamente o ponto problemático identificado nas prints.

O checklist de preparação (`prepChecklist`) não é descartado — mas também não faz sentido solto num registro genérico. Fica de fora do escopo desta spec (candidato a viver dentro do detalhe de paciente, seção 4.3, como "preparar próxima sessão", quando essa tela existir de verdade com uso real).

**Tipo "supervisão"/"intervisão":** ganha um passo novo, entre "contexto profissional" e "reflexão", usando `TagField`-like multi-select (mesmo padrão visual de `TagField`, mas selecionando entre `InternshipLog[]` existentes em vez de texto livre):

```
┌─────────────────────────────────────────┐
│  quais atendimentos vocês discutiram?    │
│  (opcional — ajuda a fechar pendências)  │
│                                           │
│  ☐ sessão 3 · M.S. · 26/08               │
│  ☐ sessão 1 · J.P. · 24/08               │
│  ☑ sessão 2 · M.S. · 19/08               │
└─────────────────────────────────────────┘
```
Lista pré-filtrada para mostrar primeiro os atendimentos sem `supervisionLogId` (pendentes), com os já discutidos disponíveis mas colapsados abaixo ("já discutidos anteriormente ▾").

Também ganha, no passo de reflexão, os campos `beforeNotes`/`afterNotes` (absorvidos de `SupervisionNotebook`, seção 2.2) — usando o mesmo `TextArea` já usado em outros lugares do wizard, sem componente novo.

**Revisão final:** `ReviewCard` (componente já usado) ganha a linha `{ label: 'atendimentos discutidos', value: discussedLogIds.length ? `${discussedLogIds.length} sessões` : '—' }`.

### 4.6 Cores e identidade visual — sem mudança

Nenhuma cor nova necessária. Segue os tokens já usados na tela: `surface-rose`/`border-brand` para estágio/atendimento, `surface-blue`/`border-academic` para supervisão — essa distinção rosa/azul já existe e comunica bem a diferença entre "campo clínico" e "orientação profissional"; a nova aba "por paciente" usa a mesma paleta rosa (é uma visão sobre atendimentos, não uma categoria nova).

---

## 5. Fluxo do usuário, ponta a ponta (depois da mudança)

1. Estudante atende M.S. pela 3ª vez → abre wizard, tipo "atendimento clínico" → preenche `patient: "M.S."` → app não pergunta fase, nem finge reflexão se ela deixar em branco.
2. Alguns dias depois, abre o app → vê bloco de pendências: "1 sessão sem reflexão" → toca → vai direto pro registro, adiciona a reflexão que faltava (edição via long-press → `openManageItem`, fluxo que já existe).
3. Vai pra supervisão semanal → registra tipo "supervisão" → no passo novo, marca quais sessões de M.S. foram discutidas → app atualiza automaticamente o vínculo nos 2 lados.
4. Volta pra aba "por paciente" → vê o card de M.S. com a barra de progresso quase cheia (a maioria das sessões já supervisionadas) → sensação de progresso real, porque é derivada de fatos, não de uma fase marcada manualmente.

---

## 6. Ordem de implementação sugerida

1. **2.1** — remover fallback de reflexão fake. Trivial, uma linha, corrige o sintoma mais visível das prints.
2. **2.2** — unificar `SupervisionNotebook` em `InternshipLog`, migrar `SupervisionView` para filtro sobre o mesmo estado. Maior, mas elimina duplicação estrutural.
3. **2.3 + 4.3** — `deriveCases()` + aba "por paciente". Primeira peça de valor visível nova.
4. **2.4 + 4.5** — vínculo sessão↔supervisão no wizard. Depende de (2) e (3) estarem prontos.
5. **2.5 + 4.1/4.2** — remover `cycleStep` do wizard, trocar barra decorativa por bloco de pendências. Por último, porque depende de (4) para as pendências de supervisão fazerem sentido.
