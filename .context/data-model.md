# Modelo de Dados

> Entidades de `src/types.ts`, relações, convenções de id, persistência e seeds. (pt-BR)

## 1. Fontes

- **Tipos:** `src/types.ts` (fonte da verdade).
- **Seeds:** `src/data/initialData.ts` e `src/data/libraryData.ts`.

## 2. Entidades (em `types.ts`)

| Entidade | Campos-chave | Relações |
|---|---|---|
| `UserProfile` | name, semester, totalSemesters, university, targetCareer, dailyQuote, stickersCollected | — |
| `Course` | id, name, code, professor, semester, schedule, room, color, icon, progress, description | — (pai de classes/exams/tasks/readings/materials) |
| `ClassNote` | id, courseId, title, number, date, summary, fullNotes, conceptIds[], authorIds[], materials[], hasQuestions, **rating** (1–5 estrelas, opcional) | `courseId`, `conceptIds`, `authorIds` |
| `Task` | id, title, disciplineId, classId, dueDate, completed, priority, category | `disciplineId`→Course, `classId`→ClassNote |
| `Exam` | id, courseId, title, date, weight, topics[], completed, grade | `courseId` |
| `StudySession` | id, courseId, topic, date, durationMinutes, notes | `courseId` |
| `ReadingItem` | id, title, author, courseId, type, totalPages, readPages, status, highlights[] | `courseId` |
| `Flashcard` | id, conceptId, courseId, question, answer, lastReviewed, easeFactor, timesReviewed | `conceptId`, `courseId` |
| `PsychologyConcept` | id, name, definition, approachId, authorIds[], courseIds[], tags[] | `approachId`, `authorIds`, `courseIds` |
| `PsychologyAuthor` | id, name, bio, lifespan, approachId, keyConcepts[], majorWorks[], imageUrl | `approachId` |
| `PsychologyApproach` | id, name, shortName, description, foundingAuthors[], color | — |
| `MaterialItem` | id, title, type, author, courseId, url, tags[], addedAt | `courseId` |
| `InternshipLog` | id, date, hours, activity, supervisionNotes, reflections, conceptIds[] | `conceptIds` |
| `TccData` | title, advisor, field, problemStatement, objectives[], status, chapters[], references[] | — |
| `Sticker` | id, name, emoji, description, unlocked, unlockedAt, category | — |
| `StreakData` | `activeDays: string[]` (YYYY-MM-DD, fuso local) — dias com ≥1 ação que conta para a streak | derivado: `streakStats`/`currentWeekProgress` (lógica em `src/lib/streak.ts`) |

### Tipos de navegação
- `NavTab`: `'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil'`
- `SubTab*` por área: `SubTabFaculdade` (disciplinas/aulas/avaliacoes/calendario),
  `SubTabEstudos` (sessoes/leituras/flashcards/questoes/revisoes),
  `SubTabBiblioteca` (materiais/autores/conceitos/abordagens/mapa).
  O **Perfil não tem sub-tabs** (página única inline).
- `DynamicHeaderConfig`: config do header dinâmico (default/detail).

## 3. Convenções de ID (prefixos em seeds)

| Prefixo | Entidade | Exemplo |
|---|---|---|
| `c` | Course | `c1`, `c2` |
| `cl-` | ClassNote | `cl-1`, `cl-2` |
| `t` / `task_` | Task | `t1`, `task_<timestamp>` |
| `e` | Exam | `e1` |
| `ss-` | StudySession | `ss-1` |
| `r` | ReadingItem | `r1` |
| `f` | Flashcard | `f1` |
| `con-` | PsychologyConcept | `con-1` |
| `aut-` | PsychologyAuthor | `aut-1` |
| `app-` | PsychologyApproach | `app-1` |
| `m` | MaterialItem | `m1` |
| `ilog-` | InternshipLog | `ilog-1` |
| `st-` | Sticker | `st-1` |
| `bk-` | CollectionBook (libraryData) | `bk-1` |
| `tr-` | TrendingBook (libraryData) | `tr-1` |
| `col-` | ContextCollection (libraryData) | `col-beck` |

**Ao criar via QuickAdd:** os ids usam `Date.now()` com prefixo (`t-`, `cl-`, `r-`, `f-`, `con-`, `ilog-`).

## 4. Persistência (dual)

- **Web/PWA** → `localStorage` (síncrono); **nativo** → `@capacitor/preferences` (assíncrono).
  Camada única em `src/lib/storage.ts`; chaves com prefixo **`cecistudy_`**
  (ex.: `cecistudy_courses`, `cecistudy_tasks`).
- Adicionadas via `usePersistentState(key, initialValue)` em `AppContext.tsx` — a chave vai sem
  o prefixo (o hook/storage adicionam).
- Chaves usadas: `profile`, `courses`, `classes`, `tasks`, `exams`, `authors`, `concepts`,
  `approaches`, `readings`, `flashcards`, `materials`, `internship`, `tcc`, `stickers`,
  `sessions`, `reminder` (`{enabled, time}` — lembrete diário),
  `savedBookIds`, `looseNotes` (BibliotecaView), `bookmarkedCourseIds` (favoritos de disciplinas),
  `streakData` (`{activeDays}` — dias ativos da streak, derivados em `src/lib/streak.ts`),
  `composePrefs` (`{mode, courseId}` — última escolha do quick capture: aula vs. avulsa),
  `readingProgress` (`{bookId: páginas lidas}` — registrado no modal do livro).
- ⚠️ **Não persistidos** (estado local de view): `systemSuggestions` (HomeView),
  catálogo `CollectionBook` (BibliotecaView).

## 5. Seeds (`initialData.ts`)

- 5 disciplinas (Psicopatologia I, Avaliação Psicológica II, TCC, Psicologia Social, Estágio).
- 4 anotações de aula, 5 tarefas, 3 avaliações, 4 abordagens, 4 autores, 5 conceitos,
  4 leituras, 4 flashcards, 3 materiais, 2 registros de estágio, TCC completo, 8 stickers,
  2 sessões de estudo.
- Streak: `initialStreakData = { activeDays: [] }` (começa vazia; dias ativos entram pelas ações).

## 6. Catálogo da biblioteca (`libraryData.ts`)

- Interfaces próprias: `CollectionBook`, `ContextCollection`.
- `initialTrendingBooks`: 6 obras complementares.
- `initialContextCollections`: 8 coleções (autores, conceitos, abordagens, testes, multidisciplinar).
- `CollectionBook` inclui `coverColor`, `accentColor`, `totalPages/readPages` (**opcionais** —
  livros do catálogo não trazem contagem), `status`, `description`, `quote`, `tags`, `courseName`.
- ⚠️ Este dataset é **paralelo** ao `ReadingItem` de `types.ts` — a biblioteca usa seus próprios
  tipos e não é persistida (estado local da view).

### 6.1 Catálogo de livros e artigos (`src/data/books/`)

Módulo novo de dados **estáticos** (não persistidos) com o acervo completo da biblioteca:
- **Fonte bruta:** `library/books/` (JSONs originais + zip; backup mantido fora de `src/`).
- **JSONs copiados para `src/data/books/`**: `catalogo_livros_portugues.json` (150 livros de
  psicoterapia), `livros_interdisciplinares_100.json` (100 livros, extraído do zip) e
  `artigos_150.json` (150 artigos).
- **Tipos** (`src/data/books/types.ts`): `CatalogBook`, `InterdisciplinaryBook`, `Article`,
  `ArticleGroup`, `BookCategoryMeta`.
- **Metadados de categoria** (`src/data/books/families.ts`): `PSYCHOTHERAPY_FAMILIES` (10 famílias)
  e `INTERDISCIPLINARY_AREAS` (10 áreas) — label, subtítulo, ícone e cores de capa (hex como dado).
- **Facade** (`src/data/books/index.ts`): arrays tipados `catalogBooks` (`cat-*`),
  `interdisciplinaryBooks` (`inter-*`), `articles` (`art-*`) + coleções curadas
  `psychotherapyCollections` e `complementaryCollections` (10 × 10) prontas para a UI
  (`ContextCollection`, blockCategories `psicoterapias`/`complementar`) + `articleGroups` (10 grupos
  por família). Favoritos reutilizam `savedBookIds` (prefixos de id distintos, sem colisão).
- ⚠️ **Filtro de edição brasileira:** `catalogBooks` exclui obras marcadas
  `[sem edição brasileira confirmada]` (título original em inglês sem edição nacional) — restam 12
  livros em famílias 01/02/07/10, e `psychotherapyCollections` só gera coleção para famílias com obras.
- **Categorias mistas** (`mixedCollections`): coleções curadas que misturam livros (catálogo +
  bagagem complementar) e artigos por tema (`MixedCollection` = `{books, articles}`) — renderizadas
  por `MixedCollectionBlock` em shelves.
- `tsconfig.json` usa `"resolveJsonModule": true` para importar os JSONs.

## 7. Boas práticas ao mexer em dados

- Ao adicionar entidade nova, criar interface em `types.ts` + seed em `initialData.ts`
  + estado persistido em `AppContext.tsx` (se for global).
- Respeitar os prefixos de id e as chaves de relação existentes.
- Não duplicar dados entre `ReadingItem` e `CollectionBook` sem documentar a intenção.
