# Spec: Repertório da disciplina — conceitos, autores e bibliografia

> **Status: implementada (2026-09-21).** Gate full verde: `npm run lint` + `npm run test`
> (724 testes) + `npm run build`. Fluxo wizard → detalhe → `EditCourseModal` persiste e
> reflete os vínculos; migração 14 / round-trip cobertos por testes.

> Vínculo real entre a aba **repertório** do detalhe de uma disciplina e os dados
> que o app já tem: conceitos/autores (banco pessoal + acervo/templo) e livros,
> artigos e leituras (catálogo estático + leituras pessoais). O usuário escolhe
> itens no wizard de criação e edita pela própria seção do detalhe.

## Objetivo

Hoje as seções "conceitos-chave", "autores fundamentais" e "leituras & bibliografia
recomendada" do `CourseRepertorioContent` são **derivadas por convenção** (links
indiretos via `concept.courseIds`, `reading.courseId`, `material.courseId` e autores que
"aparecem" por transitividade dos conceitos/anotações) — sem nenhum vínculo explícito
armazenado na própria `Course`. A usuária não consegue dizer "estes são os conceitos e
autores-chave desta disciplina" nem "esta é a bibliografia recomendada" escolhendo do
acervo/templo ou do catálogo.

Esta spec propõe **vínculos explícitos no `Course`** (`conceptIds`, `authorIds`,
`bibliographyIds`) resolvidos por prefixo, com um **seletor de catálogo reutilizável**
(banco pessoal + acervo ✦ + catálogo de livros/artigos), editável no wizard de criação e
na própria seção de repertório do detalhe. Onde hoje a UI já resolve por convenção
(conceito → `courseIds`, leitura → `courseId`), os vínculos explícitos se somam como
fonte da verdade, preservando os vínculos legados na renderização (união).

## User Stories / Critérios de aceite

1. **Criar disciplina com repertório.** "Como usuária, ao criar uma disciplina eu quero
   já poder vincular conceitos-chave, autores fundamentais e leituras recomendadas — do
   que eu tenho e do acervo — sem ter que editar depois."
   - Aceite: no `CourseWizard`, há um passo opcional "repertório" com 3 grupos;
     conceitos/autores navegam o banco pessoal + acervo ✦ (mesmo fluxo do
     `useAcervoTheory`), leituras navegam leituras/materiais pessoais + catálogo
     (`cat-*`/`inter-*`/`art-*`); salvar persiste `conceptIds`/`authorIds`/
     `bibliographyIds` via `handleAddCourse`.

2. **Editar repertório pelo detalhe.** "Como usuária, abrindo uma disciplina eu quero
   adicionar/remover conceitos, autores e leituras diretamente nas seções, e ver só o
   que é daquela disciplina."
   - Aceite: cada seção do `CourseRepertorioContent` tem ação de gerenciar
     (adicionar/remover) usando o mesmo seletor; mudanças persistem via
     `handleUpdateCourse`; as seções renderizam os itens dos vínculos explícitos +
     itens legados (união, deduplicada).

3. **Itens do templo e do catálogo ficam disponíveis.** "Como usuária, eu quero
   escolher um conceito/autor do templo (acervo) e um livro do catálogo como
   bibliografia, sem precisar saber se ele é 'meu' ou do catálogo."
   - Aceite: o seletor agrupa "pessoal" e "acervo ✦"/"catálogo"; conceito/autor do
     acervo é adotado no banco pessoal (id `con-`/`aut-` + timestamp, idempotente por
     nome normalizado — mesmo fluxo do `adoptAcervoConcept`/`adoptAcervoAuthor`);
     livro/artigo do catálogo guarda o id do catálogo (`cat-*`/`inter-*`/`art-*`)
     resolvido por prefixo na renderização.

## Comandos

Gate exigido após qualquer mudança (ver AGENTS.md):
- `npm run lint` — typecheck (`tsc --noEmit`).
- `npm run test` — Vitest (jsdom). Foco desta spec: `src/lib/__tests__/courseRepertorio.test.ts`,
  `src/lib/__tests__/repertorioOptions.test.ts`, migração em `exportImport.test.ts`.
- `npm run build` — Vite → `dist/`.
- `node .github/scripts/check-boundaries.mjs` — obrigatório ao tocar `packages/*`
  (esta spec **não** toca `packages/*` — ver seção Boundaries).

## Estrutura de pastas / arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/types/entity.ts` | `Course`: + `conceptIds?`, `authorIds?`, `bibliographyIds?: string[]` (c. 25–46) |
| `src/lib/courseRepertorio.ts` **(novo)** | Resolver puro prefix-aware: `resolveCourseRepertorio(course, entities)` + `COURSE_REPERTORY_PREFIXES` |
| `src/lib/repertorioOptions.ts` **(novo)** | Builder de opções do seletor: banco pessoal + acervo/templo + catálogo (merge + `filterNewNames`) |
| `src/components/ui/CatalogMultiSelect.tsx` **(novo)** | Seletor reutilizável (busca cross-source, grupos pessoal/acervo/catálogo, prefix-aware) |
| `src/components/wizards/useCourseRepertorio.ts` **(novo)** | Hook do passo: options × seleção × `resolveIds` (reusa `useAcervoTheory` p/ conceitos/autores) |
| `src/components/wizards/CourseWizard.tsx` | Novo passo "repertório" entre o passo de estilo/detalhes e o resumo; salvar com os 3 arrays |
| `src/components/courses/detail/CourseRepertorioContent.tsx` | Trocar derivação local por `resolveCourseRepertorio` (união) + ações "adicionar/gerenciar" por seção |
| `src/components/courses/EditCourseModal.tsx` | Área "repertório" usando o `CatalogMultiSelect` (segunda via de edição) |
| `src/context/dataActions.ts` | `handleAddCourse`/`handleUpdateCourse` já são genéricos (`{...c}`) — sem mudança estrutural; verificar repasse do novo campo |
| `packages/data/src/schema.ts` | `SCHEMA_VERSION` 13 → **14** + `MIGRATIONS[14]` (backfill dos arrays) |
| `src/lib/db/migrations/user.ts` | (Sugestão futura/opcional) junction `course_repertoire_link` espelhando `class_note_link` (c. 56–62) — **não é gate desta spec** (ver Navegação & persistência) |
| `src/components/utils/index.ts` / barrels | Re-exportar p/ Wizards quando necessário |

## Modelo de dados proposto

### `Course` (adicione após `type?`/antes de `description?` em `src/types/entity.ts:25`)

```ts
/** Vínculos explícitos de repertório (opcionais; legado continua valendo na renderização). */
conceptIds?: string[];
authorIds?: string[];
bibliographyIds?: string[]; // leituras/materiais pessoais (`r-`/`m-`) + catálogo (`cat-`/`inter-`/`art-`)
```

Arrays opcionais (default `undefined`); persistência e export/import toleram ausência.
**Não alteram `SCHEMA_VERSION`?** — **Sim, alteram**: o formato persistido de `Course`
ganha 3 chaves novas. Convenção do projeto (AGENTS.md + `schema.ts`): bump de
persisted-format → `SCHEMA_VERSION` 13 → **14** com

```ts
MIGRATIONS[14] = (db) => ({
  ...db,
  courses: (db.courses ?? []).map((c) => ({
    ...c,
    conceptIds: c.conceptIds ?? [],
    authorIds: c.authorIds ?? [],
    bibliographyIds: c.bibliographyIds ?? [],
  })),
});
```

(Seguir a ordem/estilo de `MIGRATIONS[12]` em `packages/data/src/schema.ts:34-163`.)
Zod em `src/lib/backupSchema.ts` usa `.passthrough()` — backups antigos continuam
importáveis; o round-trip cobre os novos campos automaticamente.

### Resolução por prefixo (fonte única em `src/lib/courseRepertorio.ts`)

| Prefixo | Entidade / fonte | Onde vive |
|---|---|---|
| `con-…` | Conceito pessoal (`PsychologyConcept`, entidade do usuário) | banco pessoal |
| `aut-…` | Autor pessoal (`PsychologyAuthor`) | banco pessoal |
| `r-…` | `ReadingItem` (leituras pessoais, `'r-' + Date.now()` — `ReadingWizard.tsx:314`, `SupervisionView.tsx:33`) | banco pessoal |
| `m-…` | `MaterialItem` (materiais pessoais) | banco pessoal |
| `cat-…` | `CatalogBook` (`src/data/books/index.ts:85`) | catálogo estático |
| `inter-…` | `InterdisciplinaryBook` (`index.ts:105`) | catálogo estático |
| `art-…` | `Article` (`index.ts:125`) | catálogo estático |

**Não** se armazena id do templo no `Course`: conceito/autor do templo é **adotado**
para o banco pessoal antes de vincular (mesmo fluxo `useAcervoTheory` + `adoptAcervoConcept`
/`adoptAcervoAuthor` em `dataActions.ts:309-330`), mantendo o conjunto de ids armazenados
homogêneo e a renderização simples por prefixo. (Alternativa "referência direta ao templo"
fica como Open Question — implicaria resolver `TempleConcept`/`TempleAuthor` no render e
mudar `ClassNoteDetailWizard`.)

### Regra de renderização (união com legado)

`CourseRepertorioContent` passa a usar `resolveCourseRepertorio(course, entities)`:

- **conceitos** = `conceptIds` resolvidos ∪ conceitos com `concept.courseIds.includes(course.id)` (**legado**);
- **autores** = `authorIds` resolvidos ∪ autores dos conceitos/anotações da disciplina (**legado** — derivação atual `CourseRepertorioContent.tsx:18-23`);
- **bibliografia** = `bibliographyIds` resolvidos (`r-`/`m-`/`cat-`/`inter-`/`art-`) ∪ `ReadingItem`/`MaterialItem` com `courseId === course.id` (**legado**).

Dedup por id. Helper puro, sem React (testável).

## UI/UX

- **Seletor reutilizável `CatalogMultiSelect`**: bottom-sheet (primitiva `Modal` +
  pattern do `Picker`), com `TempleSearchInput`-like (busca `normalizeText` de
  `readingMatching.ts:10`), grupos "pessoal" e "acervo ✦"/"catálogo", badges de origem,
  prefix-aware. Reusa `PillGroupMulti` (`src/components/ui/PillGroupMulti.tsx:96-187`,
  `searchThreshold` 8) para o modo multi-select in-line.
- **Passo "repertório"** no `CourseWizard`: após `curso-estilo`/detalhes, antes de
  `curso-resumo`; 3 grupos (conceitos-chave / autores fundamentais / leituras
  recomendadas); conceitos/autores via `useCourseRepertorio` (reusa `useAcervoTheory`),
  leituras via `repertorioOptions` (catálogo + pessoal). Salvamento
  (`handleAddCourse`) recebe `{...values, conceptIds, authorIds, bibliographyIds}`.
- **Ações nas seções** de `CourseRepertorioContent`: botão "+ adicionar" +
  `ManageSurface` (long-press remove — mesmo padrão do restante do app).
  Persiste com `handleUpdateCourse`.
- **`EditCourseModal`**: nova área "repertório & conteúdo" com o mesmo seletor
  (segunda via; fonte: `EditCourseModal.tsx:155` no `OverlaysContent`).
- **Copy**: pt-BR minúsculo, acolhedor ("que conceitos contam nessa disciplina?",
  "adicionar autores fundamentais ♡", "guardar repertório"). Tokens semânticos
  (`text-ceci-primary`, `bg-surface-rose`, `border-ceci-border-brand`) — sem hex em
  classes.

## Navegação & persistência

- **Sem nova rota/NavScreen**: o passo vive dentro do wizard existente
  (`{kind:'wizard'; type:'course'}` — `packages/navigation/src/types.ts:57`,
  `WizardRouter`/`registry`), e a edição pelo detalhe usa o mesmo modal bottom-sheet
  (não empilha tela). Nenhuma mudança em `packages/navigation/src/hash.ts` nem em
  `SCHEMA_VERSION` por navegação (regra: UI/nav nunca bump).
- **Persistência**: novos campos persistem via `usePersistentState`/`localStorage` web
  e `@capacitor/preferences` nativo (o `data_json` nativo guarda a entidade completa —
  `src/lib/db/migrations/user.ts:5-7` — então nada de DDL novo para persistir; o
  junction `course_repertoire_link` é evolução futura, fora do gate).
- **Export/import/backup**: campos entram no snapshot (`readDatabaseFromState`) e no
  schema Zod (.passthrough) — round-trip preservado.

## Plano de implementação (tasks)

> Ordem por dependência; ~arquivos/gates por task. Cada task termina com o gate rodando.

1. **TASK-1 — Camada de dados (fundação).**
   - `src/types/entity.ts`: + 3 campos em `Course`.
   - `packages/data/src/schema.ts`: `SCHEMA_VERSION` 13→14 + `MIGRATIONS[14]`.
   - Gate: lint + test (extender `exportImport.test.ts` com migração 14) + build.
2. **TASK-2 — Resolver puro + opções.**
   - `src/lib/courseRepertorio.ts` (prefixos + `resolveCourseRepertorio` união/dedup).
   - `src/lib/repertorioOptions.ts` (merge pessoal + acervo/templo + catálogo;
     `filterNewNames` idempotência).
   - Gate: lint + **novos testes** (`courseRepertorio.test.ts`, `repertorioOptions.test.ts`).
3. **TASK-3 — Componente `CatalogMultiSelect`** (bottom-sheet, busca, grupos,
   `PillGroupMulti`/`Picker`/`TempleSearchInput`). Gate: lint + test + teste de componente básico.
4. **TASK-4 — Passo no `CourseWizard`** (`useCourseRepertorio` + step "repertório"
   + repasse no `handleSave`). Gate: lint + test + build.
5. **TASK-5 — `CourseRepertorioContent` real** (troca pelo resolver + ações
   add/gerenciar por seção, `handleUpdateCourse`). Gate: lint + test + build.
6. **TASK-6 — `EditCourseModal`** (área repertório com o mesmo seletor) + passada final
   manual (wizard → detalhe → editar → persistência/export). Gate: full (lint + test + build + boundary se tocar `packages/*`).

## Testes

- `src/lib/__tests__/courseRepertorio.test.ts` — resolução por prefixo
  (con/aut/r/m/cat/inter/art), união com legado (`concept.courseIds`,
  `reading.courseId`), dedup, curso sem vínculos → vazio.
- `src/lib/__tests__/repertorioOptions.test.ts` — merge pessoal+acervo/catálogo,
  `filterNewNames`, idempotência de adoção (nome normalizado);
  `CatalogMultiSelect` teste básico de render/seleção.
- `src/lib/__tests__/exportImport.test.ts` — `MIGRATIONS[14]` backfill + round-trip
  (backup antigo sem campos importa; novo exporta os campos).
- Mantém o padrão Vitest/jsdom existente (`src/lib/__tests__/*`, `vitest.config.ts`).

## Boundaries (per `.github/scripts/check-boundaries.mjs` + AGENTS.md)

- **always (obrigatório):** rodar `npm run lint` + `npm run test` após cada mudança;
  `node .github/scripts/check-boundaries.mjs` ao tocar `packages/*`; `npm run build`
  antes de finalizar.
- **ask first:** mover a lógica de resolução/opções para `packages/domain` (seria o
  "canônico" por AGENTS.md, mas hoje `Course` vive em `src/types/entity.ts` e os
  loaders (`catalogLibrary`/`templeData`/catálogo) ficam em `src/` — mantemos `src/lib`
  para evitar refatoração de camada fora de escopo; **decidido como Open Question**).
- **never:** `packages/*` não podem importar `react`, `@capacitor/*`, `__TAURI__`;
  compartilhado/`src/shells`/`src/overlays` não brancham por plataforma
  (`isMobile`/`Capacitor.isNativePlatform`); sem hex raw em classes; sem emojis fora do
  padrão de copy.

## Success Criteria

- A aba repertório de uma disciplina existente (criada antes desta spec) continua
  mostrando conceitos/leituras vinculados pelo caminho legado **e** os novos vínculos.
- Criar uma disciplina com o passo "repertório" persiste e reabre com os itens; editar
  pelo detalhe e pelo `EditCourseModal` refletem na seção.
- Backups antigos importam; backup novo exporta e importa com os campos; migração 14
  roda sem perda.
- Gate verde: `npm run lint` + `npm run test` + `npm run build` (+ boundary se houver
  toque em `packages/*`).

## Open Questions

1. ~~**Referência direta ao templo vs adoção?**~~ → **Decidido (2026-09-21): adoção no
   banco pessoal** (uniforme com `useAcervoTheory`/`ClassNoteDetailWizard`). Conceito/autor
   do acervo é adotado (`con-`/`aut-` + timestamp, idempotente) antes de vincular.
   Referência direta ao templo fica descartada por ora — se a usuária quiser isso futuramente,
   exigiria resolver `TempleConcept`/`TempleAuthor` no render e dividir IDs por origem.
2. ~~**Livro do catálogo vira `ReadingItem`?**~~ → **Decidido (2026-09-21): vínculo
   estático** com `cat-*`/`inter-*`/`art-*` (recomendada). Ação "começar a acompanhar"
   (criar `ReadingItem` com `courseId`) permanece como follow-up fora do escopo.
3. **`Course` em `packages/domain`?** Migração de camada (canônica por AGENTS.md) é
   refatoração fora do escopo desta spec.
4. **Duplicidade de fonte conceitos** (`Course.conceptIds` × `Concept.courseIds`): a
   proposta usa `Course` como autoritativa e espelha em `concept.courseIds` ao vincular
   (mesmo helper); confirmar que nada mais grava `courseIds` por fora (busca/`ConceptWizard`).
5. **Junction `course_repertoire_link` nativo** (espelho de `class_note_link`): adiar até
   a primeira build nativa publicada exigir migração numerada (hoje `user.ts:10-12`
   permite mudança livre de shape).