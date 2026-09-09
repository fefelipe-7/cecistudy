# Plano de Implementação — Reestruturação de Estágio v3

**Spec base:** `spec-estagio-novo.md` (v3)
**Estado atual:** código em transição — `InternshipLogLegacy` + entidades novas (`InternshipCase`, `InternshipSession`, `Supervision`, `Intervision`) sem formulários + `SupervisionNotebook` separado.
**Objetivo:** unificar tudo em `InternshipLog` (renomeado de `InternshipLogLegacy`) como fonte única, com campos adicionados, vínculos derivados e UI revisada.

---

## Diagnóstico do estado atual

O código está num ponto intermediário entre a abordagem anterior (entidades normalizadas novas) e o que a spec v3 propõe (evolução do `InternshipLog` existente). Resumo:

| O que existe hoje | O que a spec v3 quer | Caminho |
|---|---|---|
| `InternshipLogLegacy` (renomeado de `InternshipLog`) | `InternshipLog` (nome original, campos adicionados) | Renomear de volta + adicionar campos |
| `InternshipCase`, `InternshipSession`, `Supervision`, `Intervision` (tipos novos, sem forms) | Nada disso — "visão por caso" é derivada de `patient` | **Remover** os 4 tipos novos + state + providers |
| `SupervisionNotebook` (CRUD completo, tela separada) | Absorvido em `InternshipLog` tipo `supervisao`/`intervisao` | Migrar dados → remover tipo |
| `phase` e `prepChecklist` no wizard (passo "fase & preparação") | `phase` derivado, `prepChecklist` fora do wizard | Remover passo do wizard, calcular fase em runtime |
| `InternshipDiaryView` com barra decorativa do ciclo + filtro por fase | Barra e filtro removidos; bloco de pendências no lugar | Substituir |
| `SupervisionView` como tela com CRUD próprio | Filtro sobre `InternshipLog` tipo supervisão, reaproveitando `InternshipLogCard` | Reescrever como vista filtrada |
| Aba "diário" + "supervisão" | 3 abas: "diário", "por paciente", "supervisão" | Adicionar aba "por paciente" |
| Wizard 4 passos (com ciclo) | Wizard 3 passos (sem ciclo) + passo novo de vínculo em supervisão | Reestruturar steps |

---

## Fase 1 — Limpeza: remover entidades novas que não serão usadas

**Risco:** baixo. Nenhum formulário cria essas entidades; o `InternshipLogCard` já tem fallback para `InternshipLogLegacy`.

### Passo 1.1: Remover tipos novos de `src/types/internship.ts`

- Deletar as interfaces `InternshipCase`, `InternshipSession`, `Supervision` (entidade nova, não `SupervisionNotebook`), `Intervision`, `InternshipGoals`, `HourType`
- Manter: `InternshipLogType`, `InternshipPhase`, `InternshipLogLegacy` (por enquanto)
- Manter `SupervisionNotebook` (será migrada na Fase 3)

### Passo 1.2: Remover state dos tipos novos em `src/data/empty.ts`

- Remover `internshipCases`, `internshipSessions`, `supervisions`, `intervisions` de `EmptyDatabase`
- Remover `internshipGoals` de `emptyProfile`
- Manter `supervisionNotebook` (migrado na Fase 3)

### Passo 1.3: Limpar `packages/data/src/dataClient.ts`

- Remover `internshipCases`, `internshipSessions`, `supervisions`, `intervisions` de `ArrayCollectionKey`
- Remover setters correspondentes de `DataClientSetters`

### Passo 1.4: Limpar `packages/data/src/persistentData.ts`

- Remover `internshipCases`, `internshipSessions`, `supervisions`, `intervisions` de `PersistedStateSnapshot`
- Remover mapeamentos em `readDatabaseFromState`

### Passo 1.5: Limpar `src/context/AppContext.tsx`

- Remover getters/setters dos 4 tipos novos
- Remover de `snapshotFromState` e `deleteManagedItem`

### Passo 1.6: Limpar `src/lib/entityOps.ts`

- Remover `InternshipCase`, `InternshipSession`, `Supervision`, `Intervision` de `ManagedDB`
- Remover `HourType`, `InternshipGoals` das imports

### Passo 1.7: Simplificar `src/components/InternshipLogCard.tsx`

- Remover discriminação por tipo (`isCase`, `isSession`, `isSupervision`, `isIntervision`)
- Props voltam a ser `log: InternshipLogLegacy` (único tipo)
- Remover blocos condicionais dos tipos novos

### Passo 1.8: Limpar testes

- `entityOps.test.ts`: remover mocks dos tipos novos
- `exportImport.test.ts`: remover enums/isolated dos tipos novos
- `dataClient.test.ts`: remover mocks
- `contextActions.test.ts`: remover tipos novos

### Verificação
```
npm run lint
npm run test
```

---

## Fase 2 — Renomear `InternshipLogLegacy` → `InternshipLog`

**Risco:** baixo (rename mecânico), mas atinge muitos arquivos.

### Passo 2.1: Rename em `src/types/internship.ts`

- `InternshipLogLegacy` → `InternshipLog`
- Manter `type InternshipLogLegacy = InternshipLog` como alias temporário (deprecated) para não quebrar imports internos que ainda não foram atualizados

### Passo 2.2: Atualizar imports em todos os arquivos

Arquivos que importam `InternshipLogLegacy`:
- `src/components/InternshipLogCard.tsx`
- `src/components/views/FaculdadeView.tsx`
- `src/components/views/InternshipDiaryView.tsx`
- `src/components/views/SupervisionView.tsx`
- `src/components/wizards/InternshipWizard.tsx`
- `src/lib/internshipPreview.ts`
- `src/lib/entityOps.ts`
- `src/context/AppContext.tsx`
- `src/lib/persistentData.ts` (via `readDatabaseFromState`)
- `src/components/views/PerfilView.tsx`
- `src/components/views/CourseDetailView.tsx`
- Testes: `entityOps.test.ts`, `exportImport.test.ts`, `internshipPreview.test.ts`

### Passo 2.3: Atualizar chave de persistência

- Renomear `internshipLogsLegacy` → `internshipLogs` em `EmptyDatabase`
- Adicionar migração no `MIGRATIONS` (renomear chave)
- Atualizar todas as referências no `AppContext`

### Passo 2.4: Remover alias temporário

Depois de confirmar que nenhum arquivo usa mais `InternshipLogLegacy`, remover o type alias.

### Verificação
```
npm run lint
npm run test
```

---

## Fase 3 — Unificar `SupervisionNotebook` em `InternshipLog`

**Risco:** médio. Requer migração de dados, CRUD unificado e reescrita de `SupervisionView`.

### Passo 3.1: Adicionar campos novos em `InternshipLog`

Em `src/types/internship.ts`, adicionar ao `InternshipLog`:

```ts
// campos absorvidos de SupervisionNotebook (relevantes para type supervisao/intervisao)
beforeNotes?: string;
afterNotes?: string;
selfAssessment?: {
  confidence?: string;
  limits?: string;
  themes?: string;
};

// vínculo sessão ↔ supervisão
supervisionLogId?: string;       // em logs tipo atendimento_clinico
discussedLogIds?: string[];      // em logs tipo supervisao/intervisao
```

### Passo 3.2: Migrar dados de `SupervisionNotebook[]` → `InternshipLog[]`

Criar função de migração em `src/lib/migrations.ts` (ou adicionar ao `MIGRATIONS` existente):

```ts
function migrateSupervisionNotebook(logs: InternshipLog[], notebooks: SupervisionNotebook[]): InternshipLog[] {
  const migrated = notebooks.map(nb => ({
    id: nb.id,
    type: 'supervisao' as const,
    date: nb.date,
    hours: 0,
    activity: 'supervisão',
    reflections: '',
    supervisor: nb.supervisor,
    topics: nb.questions,        // questions → topics
    orientations: undefined,
    doubts: undefined,
    nextSteps: nb.nextSteps,
    beforeNotes: nb.beforeNotes,
    afterNotes: nb.afterNotes,
    selfAssessment: nb.selfAssessment,
    createdAt: nb.date,
    updatedAt: nb.date,
  }));
  return [...logs, ...migrated];
}
```

- Executar uma única vez na primeira abertura pós-update
- Depois da migração, setar `supervisionNotebook: []` para não re-migrar

### Passo 3.3: Atualizar `AppContext.tsx`

- Remover state `supervisionNotebook`
- Remover `addSupervision`, `updateSupervision`, `deleteSupervision`
- Atualizar `applyDatabase` para incluir a migração one-shot
- Atualizar tipo do context value (remover campos de supervisionNotebook)

### Passo 3.4: Atualizar `src/data/empty.ts`

- Remover `supervisionNotebook` de `EmptyDatabase`

### Passo 3.5: Atualizar `packages/data/src/dataClient.ts`

- Remover `supervisionNotebook` de `ArrayCollectionKey` e `DataClientSetters`

### Passo 3.6: Atualizar `packages/data/src/persistentData.ts`

- Remover `supervisionNotebook` de snapshot e leitura

### Passo 3.7: Deletar `src/types/internship.ts` (o tipo `SupervisionNotebook`)

- Depois que todas as referências migrarem, remover a interface

### Passo 3.8: Atualizar `src/lib/entityOps.ts`

- Remover `SupervisionNotebook` de `ManagedDB`

### Passo 3.9: Atualizar testes

- `entityOps.test.ts`, `exportImport.test.ts`, `contextActions.test.ts`: migrar mocks de `SupervisionNotebook` para `InternshipLog` tipo `supervisao`

### Verificação
```
npm run lint
npm run test
```

---

## Fase 4 — Lógica derivada: `deriveCases()` e `derivedPhase()`

**Risco:** baixo. Funções puras, sem side effects.

### Passo 4.1: Criar `src/lib/internshipCycle.ts`

```ts
import type { InternshipLog, InternshipPhase } from '../types';

export function derivedPhase(log: InternshipLog): InternshipPhase {
  if (log.type === 'supervisao' || log.type === 'intervisao') return 'supervisionar';
  if (log.reflections?.trim()) return 'refletir';
  return 'registrar';
}
```

### Passo 4.2: Criar `src/lib/internshipCases.ts`

```ts
import type { InternshipLog } from '../types';

export interface DerivedCase {
  patientKey: string;
  patientLabel: string;
  logs: InternshipLog[];
  totalHours: number;
  lastSessionDate: string;
  pendingReflection: number;
  pendingSupervision: number;
}

export function deriveCases(logs: InternshipLog[]): DerivedCase[] {
  // Filtrar apenas atendimento_clinico com patient preenchido
  // Agrupar por patient.trim().toLowerCase()
  // Ordenar logs por sessionNumber ou data
  // Calcular pendências
}
```

### Passo 4.3: Atualizar `src/lib/contextActions.ts`

- O `status` de `'internship'` (linha ~335) agora considera `discussedLogIds`/`supervisionLogId` além de `reflections`

### Passo 4.4: Criar testes para as funções puras

- `src/lib/__tests__/internshipCycle.test.ts`: testar `derivedPhase` com todos os tipos
- `src/lib/__tests__/internshipCases.test.ts`: testar `deriveCases` com cenários variados (vazio, um paciente, vários, com/sem pendências)

### Verificação
```
npm run test
```

---

## Fase 5 — Atualizar `InternshipWizard.tsx`

**Risco:** médio-alto. Mudanças na UX do wizard.

### Passo 5.1: Remover passo `cycleStep` para tipos `estagio` e `outro`

- Remover o step `estagio-fase` (phase grid + prepChecklist)
- Remover state `phase` e `prepChecklist`
- Remover `phase: phase ?? undefined` e `prepChecklist` de `buildLog()`
- Tipos `estagio` e `outro` ficam com 3 passos: essencial → reflexão → revisar

### Passo 5.2: Remover fallback de reflexão fake

Em `buildLog()`:
```diff
- reflections: reflections.trim() || 'reflexão registrada no diário do cecistudy.',
+ reflections: reflections.trim(),
```

### Passo 5.3: Adicionar campos novos ao form de supervisão/intervisão

Novo passo entre "contexto profissional" e "reflexão": **"atendimentos discutidos"**

- Multi-select de `InternshipLog[]` tipo `atendimento_clinico`
- Lista pré-filtrada: pendentes primeiro (sem `supervisionLogId`), depois os já discutidos colapsados
- Usa padrão visual similar ao `TagField` mas com checkboxes (componente novo leve ou composição de `CompletionToggle` + scroll)
- State: `discussedLogIds: string[]`

No passo de reflexão, adicionar:
- `TextArea` para `beforeNotes` ("o que levou pra conversa")
- `TextArea` para `afterNotes` ("o que ficou combinado")
- Seção `selfAssessment` com 3 `TextArea` opcionais (confiança, limites, temas)

### Passo 5.4: Atualizar `buildLog()` para incluir campos novos

```ts
discussedLogIds: discussedLogIds.length ? discussedLogIds : undefined,
beforeNotes: beforeNotes.trim() || undefined,
afterNotes: afterNotes.trim() || undefined,
selfAssessment: hasSelfAssessment ? { confidence, limits, themes } : undefined,
```

### Passo 5.5: Atualizar passo de revisão

`ReviewCard` ganha linha:
```ts
{ label: 'atendimentos discutidos', value: discussedLogIds.length ? `${discussedLogIds.length} sessões` : '—' }
```

### Passo 5.6: Efeito colateral ao salvar supervisão

Ao salvar um `InternshipLog` tipo `supervisao`/`intervisao` com `discussedLogIds` preenchido:
- Para cada id em `discussedLogIds`, setar `supervisionLogId` no log correspondente
- Usar `handleUpdateInternshipLog` ou acesso direto ao state (mesmo padrão de `entityOps.ts`)

### Passo 5.7: Atualizar draft e tipos internos

- `InternshipDraft` ganha campos: `discussedLogIds`, `beforeNotes`, `afterNotes`, `selfAssessment`
- `useWizardDraft` continua funcionando (mesmo key `'internship'`)

### Passo 5.8: Pré-preenchimento do wizard (aba "por paciente")

- Quando aberto do detalhe de um paciente, pré-preencher `patient` via draft inicial
- `useWizardDraft` já suporta `load()` → merge com defaults

### Verificação
```
npm run lint
npm run test
npm run build
```

---

## Fase 6 — Atualizar `InternshipDiaryView.tsx`

**Risco:** médio. Mudanças visuais significativas.

### Passo 6.1: Remover barra decorativa do ciclo

- Remover o bloco `CYCLE.map(...)` (linhas ~118-137)
- Remover a explicação "cada registro vira um passo do ciclo"

### Passo 6.2: Remover filtro por fase

- Remover array `PHASES` e state `phase`
- Remover pills de filtro por fase
- A lista mostra todos os logs sem filtro (ou com filtro por tipo, se necessário)

### Passo 6.3: Adicionar bloco de pendências

No lugar da barra decorativa, renderizar um bloco `Card` condicional:

```tsx
const semReflexao = internshipLogs.filter(l => l.type !== 'supervisao' && l.type !== 'intervisao' && !l.reflections?.trim()).length;
const semSupervisao = internshipLogs.filter(
  l => l.type === 'atendimento_clinico' && !l.supervisionLogId
).length;

if (semReflexao > 0 || semSupervisao > 0) {
  // renderizar Card com pills clicáveis
}
```

Cada pill ao ser tocada aplica um filtro temporário na lista (state local `pendingFilter`).

### Passo 6.4: Atualizar cards de resumo

Trocar o terceiro card de "supervisões" para "atendimentos clínicos":
```ts
const clinicalCount = internshipLogs.filter(l => l.type === 'atendimento_clinico').length;
```

### Passo 6.5: Atualizar terceira aba

Aba `supervisao` agora inclui intervisão (já era assim, mas confirmar que o filtro cobre `type === 'supervisao' || type === 'intervisao'`).

### Passo 6.6: Adicionar terceira aba "por paciente"

- `UnderlineTabBar` com 3 tabs: `diario`, `pacientes`, `supervisao`
- Estado local `tab` atualizado
- Nova aba renderiza lista de `DerivedCase` (seção 4.3 da spec)

### Verificação
```
npm run lint
npm run test
```

---

## Fase 7 — Aba "por paciente": lista + detalhe

**Risco:** médio. Componente novo (mas usando primitivas existentes).

### Passo 7.1: Criar componente `InternshipCaseCard`

Em `src/components/internship/InternshipCaseCard.tsx`:

- `Card` com padding, borderRadius 20px
- Topo: iniciais do paciente + idade (se disponível) + `ProgressBar` mini (supervisionadas/total)
- Meio: "N sessões · Xh · abordagem: {approach}"
- Base: "última sessão: DD/MM" + badge de pendência (se houver)
- Toque abre detalhe do caso

### Passo 7.2: Criar componente `InternshipCaseDetail`

Em `src/components/internship/InternshipCaseDetail.tsx`:

- Header com nome do paciente + botão voltar
- Lista de `InternshipLog` daquele paciente (ordenados por `sessionNumber` ou data)
- Cada item usa `InternshipLogCard` + `CompletionToggle` (não-clicável) para indicar:
  - ✓ refletida (tem `reflections` preenchido)
  - ✓ supervisionada (tem `supervisionLogId`)
- Botão "+ nova sessão com {iniciais}" no topo → abre `InternshipWizard` com `patient` pré-preenchido
- Estado vazio: `Mascote` expression `field-prepare` + mensagem

### Passo 7.3: Integrar na `InternshipDiaryView`

- Aba `pacientes` renderiza lista de `InternshipCaseCard` derivada de `deriveCases(internshipLogs)`
- Toque no card empilha detalhe (usar padrão de navegação existente ou state local)

### Passo 7.4: Criar testes

- Testar `InternshipCaseCard` com dados mock
- Testar `InternshipCaseDetail` com lista de logs

### Verificação
```
npm run lint
npm run test
```

---

## Fase 8 — Reescrever `SupervisionView.tsx`

**Risco:** médio. Reescrita significativa, mas o resultado é mais simples.

### Passo 8.1: Transformar em vista filtrada

`SupervisionView` deixa de ter CRUD próprio. Passa a:
- Filtrar `internshipLogs` por `type === 'supervisao' || type === 'intervisao'`
- Renderizar cada item com `InternshipLogCard`
- Usar `ManageSurface` para long-press (edit/delete via `entityOps`)
- Estado vazio: `Mascote` expression `supervision-reflect`

### Passo 8.2: Adicionar card de resumo no topo

- Total de supervisões/intervisões registradas
- Total de atendimentos discutidos (soma de `discussedLogIds.length`)
- Última supervisão registrada

### Passo 8.3: Simplificar o componente

O arquivo deve ficar com ~80-100 linhas (hoje tem 214). Sem form inline, sem state de edição, sem CRUD próprio.

### Passo 8.4: Atualizar imports

- Remover `SupervisionNotebook` (já migrado na Fase 3)
- Usar `internshipLogs` do contexto

### Verificação
```
npm run lint
npm run test
```

---

## Fase 9 — Ajustes finais e integração

**Risco:** baixo. Polish e consistência.

### Passo 9.1: Atualizar `src/lib/internshipPreview.ts`

- Selecionar preview para FaculdadeView usando os campos novos
- Considerar `discussedLogIds` no status derivado

### Passo 9.2: Atualizar `PerfilView.tsx`

- Calcular total de horas a partir de `internshipLogs` (já faz)
- Verificar se há referências a `SupervisionNotebook` ou tipos novos

### Passo 9.3: Atualizar `CourseDetailView.tsx`

- Verificar se há referências a tipos removidos

### Passo 9.4: Atualizar `ManageDataModal.tsx`

- Remover tipos novos do `ManagedDB` (já feito na Fase 1)
- Manter `internshipLogs` e `supervisionNotebook` (até Fase 3)

### Passo 9.5: Atualizar `src/context/AppContext.tsx` — migração one-shot

- No boot, verificar se há `supervisionNotebook` no storage
- Se houver, migrar para `internshipLogs` e limpar a chave
- Registrar no log de migração

### Passo 9.6: Atualizar `packages/data/src/persistentData.ts`

- `SCHEMA_VERSION` pode ser incrementado (opcional, já que a migração é one-shot)
- Se incrementar, adicionar `MIGRATIONS` correspondente

### Passo 9.7: Atualizar documentação

- `.context/data-model.md`: atualizar entidades, removes `SupervisionNotebook`
- `.context/components.md`: atualizar inventário
- `.context/architecture.md`: atualizar se houver mudança de estado
- `.context/backlog.md`: marcar itens resolvidos

### Passo 9.8: Verificar `check-boundaries.mjs`

- Rodar `node .github/scripts/check-boundaries.mjs` para garantir que não houve violação

### Verificação final
```
npm run lint
npm run test
npm run build
node .github/scripts/check-boundaries.mjs
```

---

## Resumo de arquivos afetados por fase

| Fase | Arquivos criados | Arquivos modificados | Arquivos deletados |
|---|---|---|---|
| 1 | — | `types.ts`, `empty.ts`, `dataClient.ts`, `persistentData.ts`, `AppContext.tsx`, `entityOps.ts`, `InternshipLogCard.tsx`, 4 testes | — |
| 2 | — | `types.ts`, `empty.ts`, `AppContext.tsx`, `persistentData.ts`, ~12 arquivos (imports) | — |
| 3 | — | `types.ts`, `empty.ts`, `dataClient.ts`, `persistentData.ts`, `AppContext.tsx`, `entityOps.ts`, 3 testes | `SupervisionNotebook` type |
| 4 | `internshipCycle.ts`, `internshipCases.ts`, 2 testes | `contextActions.ts` | — |
| 5 | — | `InternshipWizard.tsx` | — |
| 6 | — | `InternshipDiaryView.tsx` | — |
| 7 | `InternshipCaseCard.tsx`, `InternshipCaseDetail.tsx` | `InternshipDiaryView.tsx` | — |
| 8 | — | `SupervisionView.tsx` | — |
| 9 | — | `internshipPreview.ts`, `PerfilView.tsx`, docs, `persistentData.ts` | — |

---

## Ordem de execução e dependências

```
Fase 1 (limpeza tipos novos)
  ↓
Fase 2 (rename Legacy → InternshipLog)
  ↓
Fase 3 (unificar SupervisionNotebook)
  ↓
Fase 4 (funções puras: deriveCases, derivedPhase)
  ↓
Fase 5 (atualizar wizard) ← depende de 4
  ↓
Fase 6 (atualizar InternshipDiaryView) ← depende de 4
  ↓
Fase 7 (aba "por paciente") ← depende de 4 e 6
  ↓
Fase 8 (reescrever SupervisionView) ← depende de 3
  ↓
Fase 9 (ajustes finais)
```

Cada fase tem seu gate de verificação (`npm run lint` + `npm run test`). Fases 1-3 são preparação; 4-8 são implementação; 9 é polish.

---

## Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Migração `SupervisionNotebook` perde dados | Alto | Teste manual: criar supervisionNotebook → rodar migração → verificar campos |
| Wizard fica confuso com passo novo de vínculo | Médio | UX simples: lista com checkboxes, pré-ordenada por pendência |
| `deriveCases` agrupa incorretamente (mesmas iniciais, pacientes diferentes) | Médio | Usar `patient.trim().toLowerCase()` como chave; aceitar limitação documentada |
| `phase` derivado não reflete realidade em todos os casos | Baixo | A spec explora isso: fase é só badge visual, não persisted choice |
| Quebra de compatibilidade com dados antigos | Baixo | Migração one-shot no boot; `SCHEMA_VERSION` pode ser incrementado |
