# Spec: MOD-001 — Modularização

## Objective
Quebrar os arquivos grandes da aplicação em componentes e módulos menores, coesos e reutilizáveis, seguindo o princípio de responsabilidade única. Reduzir a complexidade cognitiva de cada arquivo para facilitar manutenção, testes e navegação do código.

## Scope

### Arquivos-alvo (por tamanho e complexidade)

| Arquivo | Linhas | Estratégia de quebra |
|---|---|---|
| `src/context/AppContext.tsx` | ~2687 | Extrair handlers por domínio em hooks/arquivos separados |
| `src/components/views/BibliotecaView.tsx` | ~1116 | Extrair seções como componentes independentes |
| `src/components/views/NoteTransformWizard.tsx` | ~940 | Extrair cada passo do wizard como componente |
| `src/components/views/PerfilView.tsx` | ~691 | Extrair cada seção como componente |
| `src/components/views/FaculdadeView.tsx` | ~627 | Extrair grade, diário, calendário |
| `src/components/views/HomeView.tsx` | ~464 | Extrair seções de conteúdo |
| `src/data/psicoterapiaApproaches.ts` | ~5361 | Dividir por família/domínio em múltiplos arquivos |
| `src/types.ts` | ~1013 | Agrupar tipos por domínio em sub-arquivos |

## Tech Stack
React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 · framer-motion · @capacitor (nativo)

## Commands
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint` (=`tsc --noEmit`)
- Dev: `npm run dev`

## Project Structure (após refatoração)

```
src/
  context/
    AppContext.tsx                  → wrapper fino (provider)
    appActions.ts                   ← NOVO: handlers de navegação + modais
    dataActions.ts                  ← NOVO: CRUD de entidades (courses, classes, tasks, exams)
    studyActions.ts                 ← NOVO: sessions, flashcards, readings, streak
    libraryActions.ts               ← NOVO: savedBooks, looseNotes, bookmarks
    profileActions.ts               ← NOVO: profile, onboarding, reset, export/import
    syncActions.ts                  ← NOVO: sync engine, backup/restore
    uiActions.ts                    ← NOVO: search modal, quick add, toasts
    AppContext.tsx                  → apenas state + providers (sem handlers pesados)
  data/
    psicoterapia/                   ← NOVO: dir por família
      fam-01-psicanalise.ts
      fam-02-cognitivo-comportamental.ts
      ...
      index.ts                      → re-export concatenerado (ou lazy)
    types/                          ← NOVO: tipos por domínio
      entity.ts
      navigation.ts
      library.ts
      study.ts
      profile.ts
      quiz.ts
      temple.ts
  components/
    views/
      HomeView.tsx                  → shell + seções importadas de ./home/
      home/                         ← NOVO: sub-componentes da home
        GreetingSection.tsx
        AttentionSection.tsx
        ActionButtons.tsx
        StudyRhythm.tsx
        PlanOfAction.tsx
      FaculdadeView.tsx             → shell + sub-componentes
      faculdade/
        CourseGrid.tsx
        ClassNotesList.tsx
        ExamsList.tsx
        CalendarSection.tsx
      BibliotecaView.tsx            → shell + sub-componentes
      biblioteca/
        MyMaterialsSection.tsx
        ExploreSection.tsx
        CollectionsSection.tsx
        NotesSection.tsx
        TempleSection.tsx
      PerfilView.tsx                → shell + sub-componentes
      perfil/
        ProfileOverview.tsx
        JourneyMetrics.tsx
        StreakSection.tsx
        InternshipSection.tsx
        TccSection.tsx
        StickersSection.tsx
        PersonalizationSection.tsx
      NoteTransformWizard.tsx       → shell + steps
      wizards/
        note/
          StepIdentification.tsx
          StepNotes.tsx
          StepTheory.tsx
          StepReferences.tsx
          StepEvaluation.tsx
          StepNavigation.tsx
```

## Code Style
- Cada novo arquivo/componente: 100–250 linhas máximo.
- Nomes de arquivo: kebab-case para componentes, camelCase para utilitários.
- Export nomeado (sem default exports).
- Componentes de seção: PascalCase, ex.: `GreetingSection.tsx`.
- Hooks de ação: camelCase com sufixo `Actions`, ex.: `dataActions.ts`.
- Importar sempre de `@/` (alias Vite).
- Usar tokens semânticos do design system (`ceci-*`, `surface-*`, `border-*`), nunca hex raw em classNames.
- Seguem copy pt-BR minúscula conforme `copy-and-voice.md`.

## Testing Strategy
- Testes existentes continuam verdes (480 testes).
- Novos testes para cada hook de ação extraído (testar handlers isolados).
- Testes de integração das views permanecem em `src/__tests__/`.
- Cada módulo extraído deve ter seu arquivo de teste colocado ao lado (`*.test.ts`).

## Boundaries
- **Always:** Manter `useApp()` como facade durante a transição; não quebrar imports existentes.
- **Ask first:** Mudar exports de `AppContext.tsx` (afeta todos os consumidores).
- **Never:** Remover `AppContext.tsx` nesta fase; apenas reduzir seu tamanho extraindo handlers.
- **Never:** Alterar comportamento visual ou lógico — só reorganizar código.
- **Never:** Importar `react`, `@capacitor/*`, `__TAURI__` em `packages/*`.

## Success Criteria
1. Nenhum arquivo em `src/` com mais de 400 linhas (exceto `types.ts` agrupado).
2. `AppContext.tsx` reduzido para ≤ 800 linhas.
3. `BibliotecaView.tsx` ≤ 400 linhas após extração de seções.
4. `NoteTransformWizard.tsx` ≤ 300 linhas após extração de steps.
5. `PerfilView.tsx` ≤ 350 linhas após extração de seções.
6. `psicoterapiaApproaches.ts` dividido em ≤ 5 arquivos de ≤ 1200 linhas cada.
7. `src/types.ts` ≤ 400 linhas após divisão em sub-arquivos.
8. Todos os 480 testes passam.
9. `npm run build` verde.
10. `npm run lint` verde (`tsc --noEmit`).
11. `node .github/scripts/check-boundaries.mjs` verde.

## Open Questions
- O padrão de extração será hooks de ação (`*Actions.ts`) ou módulos de serviço (`*Service.ts`)?
  → Decisão: hooks de ação que consumem `useApp()` e retornam funções, mantendo o padrão atual.
- `psicoterapiaApproaches.ts` será dividido em arquivos estáticos ou carregado lazy?
  → Decisão: arquivos estáticos por família com `index.ts` de re-export (consistente com `libraryData.ts`).
- A divisão de `types.ts` será em diretório `src/types/` ou arquivos em `src/`?
  → Decisão: diretório `src/types/` com `index.ts` barrel.

## Dependencies
- Fase 10 (separação mobile/desktop) depende desta fase (AppContext menor = mais fácil de quebrar).
- Har-001 (hardcoded) é independente, mas ambos reduzem complexidade.
