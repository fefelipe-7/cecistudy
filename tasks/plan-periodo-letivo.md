# Implementation Plan: Período letivo (`AcademicTerm`) e progressão de semestre

> Spec: [`docs/specs/SPEC-005-periodo-letivo-e-progressao-de-semestre.md`](../docs/specs/SPEC-005-periodo-letivo-e-progressao-de-semestre.md)
> Tasks: [`tasks/todo-periodo-letivo.md`](./todo-periodo-letivo.md)
> Criado: 2026-09-27

## Overview

O cecistudy não tem progressão de semestre: `UserProfile.semester` é um número
decorativo que não filtra nada, não arquiva nada e sofre ping-pong de sync (o
perfil é singleton com LWW do objeto inteiro). Esta entrega introduz
**`AcademicTerm`** como entidade de domínio com status
(`planejado → ativo → encerrado`), faz `Course.termId` ser a única associação
direta (todo o resto herda por `courseId`), e entrega o **assistente de virar
semestre** — um `WizardFlow` de 4 passos montado sobre o `WizardScaffold` que já
existe.

Escopo decidido: **MVP sem Rust**. A paridade Rust (task 24 da spec) é fase
separada, com spec própria, antes de `cecistudy-ffi`.

## Architecture Decisions

| Decisão | Rationale |
|---|---|
| `AcademicTerm` em `packages/domain` (`term.ts`) | É regra de negócio pura e compartilhada; o pacote não pode depender de React/Capacitor (`check-boundaries.mjs`). |
| Só `Course` ganha `termId`; filhas herdam por `courseId` | 6 colunas + 6 índices + 6 caminhos de `normalize.ts` a menos, e zero divergência possível entre `termId` do curso e o das filhas (spec §D3). |
| `academicTerms` é `array` com LWW por registro | Singleton perderia o histórico quando dois dispositivos fechassem períodos diferentes (spec §D7). |
| `profile.semester` vira **derivado**, não some | O campo continua no tipo/`data_json` (compat com golden files e `payload.rs:248`) mas **não é lido**; `@deprecated` aponta para `resolveActiveTerm`. Mata o ping-pong sem quebrar o contrato. |
| Nenhum ponteiro "qual período estou vendo" persistido | O período ativo é derivado da lista (`status === 'ativo'`, desempate por `statusTransitionAt`). Nada mutável por dispositivo = nada para conflitar. |
| Virada = rollover por cabeçalho, nunca update em lote | O `SyncIndex` carimba por registro; o estado misto durante a convergência é detectável pela invariante de órfãos (spec §D5). |
| Wizard é `WizardFlow` + `WIZARD_REGISTRY` | A tela cheia de wizard já existe (`WizardScaffold`: contador de passo, rascunho, `saveMinimal`, confirmação de descarte, foco). Novo wizard = 1 linha no registry. |
| Filtros de período são derivados no consumo (`src/lib/termScope.ts`) | Espelha o padrão de `workspaceId`; `DataClientProvider` expõe coleções cruas. |
| Migração 17→18 determinística (`'2026-01-01'` como fallback, nunca `Date.now()`) | Golden files precisam ser reprodutíveis. |

## Execution order (fases e checkpoints)

A ordem segue o grafo de dependências: domínio puro (sem contrato) → contrato de
persistência (risco alto, falha cedo) → contexto/actions → navegação → views →
wizard → CI/docs.

```
F1 Domínio puro ─────────► CP1  lint + test
   term.ts (invariantes) · exports · rollover (application) · termScope · Course.*Id

F2 Contrato ──────────────► CP2  lint + test + boundaries
   SCHEMA_VERSION 18 + MIGRATIONS[18] · Zod · collections · persistentData
   dataClient · stamp · empty · DataClientProvider · dataActions

F3 Navegação ─────────────► CP3  lint + test + boundaries
   WizardFlow 'semester' · NavScreen termHistory · hash/stack/derive · back · header

F4 SQLite + contrato canônico ► CP4  lint + test + schema:verify + goldens
   academic_term + course_term · passo 3 · normalize · schema.sql · verify-schema

F5 Correções F1–F4 ──────► CP5  lint + test
   perfil derivado · totalSemesters editável · copy dual-scope · import legado

F6 Recorte nas views ─────► CP6  lint + test + build
   Home/Faculdade/Perfil/Detalhe/Busca por período

F7 Wizard ────────────────► CP7  lint + test + build
   SemesterWizard (4 passos) · carta de fechamento · histórico · desfazer · confete

F8 CI + docs ─────────────► CP8  lint + test
   verify-schema no CI · .context/* · AGENTS.md
```

## Risks and Mitigations

| Risco | Impacto | Mitigração |
|---|---|---|
| `SCHEMA_VERSION` 17→18 quebra backup/import | Alto | `MIGRATIONS[18]` idempotente + determinística; Zod tolerante (`.nullish()`/`.default`); teste com o fixture real `legacy_payload.v1.json` (sem `semester`). |
| Colisão do array `COLLECTIONS` (posição congelada por teste) | Alto | Anexar `academicTerms` **no fim** (posição 24); não reordenar as 23. |
| `verify-schema.mjs` acusa drift pré-existente (D9: `schema.ts` diz `USER_SCHEMA_VERSION = 1`, `user.ts` diz `2`) | Médio | Resolver D9 **antes** da task de DDL, senão o sinal é falso. |
| Quebrar 12 pontos de leitura de `profile.semester` | Médio | `useActiveTerm()` único + `grep` limpo como critério de aceite; migração mantém o campo em sincronia por escrita. |
| `user.ts` passo 1/2 já aplicados em installs | Alto | Nunca editar passos já aplicados — só **acrescentar** o passo 3. |
| Goldens divergentes | Médio | Regerar com `GOLDEN_WRITE=1` / `MIGRATION_WRITE=1` e rodar em modo verify. |
| Rust divergente (registry `[CollectionSpec; 23]` → 24) | Baixo (aceito) | `ci.yml` não roda `cargo`; merge não fica vermelho. Registrado como Fase 10. |

## Parallelization Opportunities

- **Seguro:** testes de slices já implementados; documentação (F8).
- **Sequencial:** migração de esquema → coleções → `dataClient` → provider →
  actions. Qualquer reordenação quebra a cadeia.
- **Coordenação:** o contrato (`schema.ts` + `schema.sql`) deve ser fechado antes
  de F5/F6, que leem `academicTerms`.

## Definition of Done (task-level)

Toda task é concluída quando:
1. `npm run lint` (tsc) verde.
2. `npm run test` verde (baseline atual: 724 testes).
3. `node .github/scripts/check-boundaries.mjs` verde (quando toca `packages/*`).
4. Critérios de aceite da task conferidos no teste correspondente.
5. Sem corrupção de encoding (nenhum `\uFFFD`) nos arquivos tocados.
