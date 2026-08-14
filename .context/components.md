# Inventário de Componentes

> Inventário por arquivo: propósito, props, dependências e **status** (usado/morto). (pt-BR)

**Legenda de status:**
- ✅ **Usado** — importado e renderizado em algum fluxo.
- ⚠️ **Import morto** — importado mas não renderizado.
- 🧟 **Morto** — definido, porém não importado em lugar nenhum.

---

## `src/App.tsx` — raiz
Dono de todo o estado global (`usePersistentState`) + navegação + modais. Orquestra as views.
**Status:** ✅ raiz da aplicação.

---

## `src/components/` — globais

| Arquivo | Propósito | Props principais | Status |
|---|---|---|---|
| `HeaderNav.tsx` | Header dinâmico (brand ou detail) | `profile`, `headerConfig`, `onOpenSearch`, `onOpenQuickAdd`, `onNavigateToPerfil` | ✅ |
| `BottomNav.tsx` | Barra inferior + FAB | `activeTab`, `onChangeTab`, `onOpenQuickAddWithType` | ✅ |
| `QuickAddModal.tsx` | Form "novo registro" (9 tipos, incl. prova/estágio/autor) | `isOpen`, `onClose`, `courses`, `initialType`, `presetCourseId`, `onAdd*` | ✅ |
| `GlobalSearchModal.tsx` | Busca global (⌘K) | `isOpen`, `onClose`, `courses/classes/authors/…`, `onNavigate` | ✅ |

---

## `src/components/ui/` — primitivas

| Arquivo | Propósito | Status |
|---|---|---|
| `button.tsx` | Button com variantes (CVA) + `asChild` (Radix Slot) | ✅ |
| `bottom-nav-bar.tsx` | Barra de navegação animada (pill ativa) | ✅ (via BottomNav) |
| `floating-action-menu.tsx` | Menu FAB "+" com opções animadas | ✅ (via BottomNav) |
| `Card.tsx` · `Modal.tsx` · `PillTabBar.tsx` · `IconButton.tsx` · `ProgressBar.tsx` | Primitivas reutilizáveis | ✅ |
| `CourseIcon.tsx` | Resolvedor de ícones de curso (Brain, FileText, Sparkles…) | ✅ |
| `SwipeTabPager.tsx` | Pager horizontal estilo Instagram: trilho top-level entre as 5 abas (colunas `data-pager-scroll` com scroll próprio) ou aninhado nas sub-abas (`mode='nested'`, com `onEdgeOverscroll` que propaga para a aba principal nas bordas) | ✅ (App.tsx + Faculdade/Estudos/Perfil) |
| `SwipeBack.tsx` | Swipe-back da borda esquerda (estilo iOS) em telas auxiliares: curso, notas/templo e mood; chama `onClose` ao passar do limiar | ✅ (Faculdade/Biblioteca/App) |
| `HeaderActionMenu.tsx` | Menu "⋯" de ações contextuais do header detail | ✅ (HeaderNav) |
| `Toast.tsx` | Feedback toast (ex.: salvar/copiar) | ✅ (AppShell) |
| `ErrorBoundary.tsx` | Fallback acolhedor quando uma view quebra (voltar à home) | ✅ (App) |

---

## `src/components/courses/` — disciplina

| Arquivo | Propósito | Status |
|---|---|---|
| `ClassNoteModal.tsx` · `ClassNoteListItem.tsx` | Modal + item de anotação de aula (compartilhados Faculdade/CourseDetail). Item com `data-target={note.id}` (deep-link focado da busca) | ✅ |
| `EditCourseModal.tsx` | Editar detalhes da matéria (nome, cor, ícone, progresso…) | ✅ (header → menu) |

---

## `src/components/library/` — biblioteca

| Arquivo | Propósito | Status |
|---|---|---|
| `InlineCollectionBlock.tsx` · `BookDetailModal.tsx` · `LibraryFilterModal.tsx` | Bloco de coleção, detalhe de livro, filtros | ✅ |
| `NotesScreen.tsx` | Tela de notas avulsas (aberta via pilha `#/biblioteca/notas`) | ✅ |
| `notes.ts` | Tipos/seed de notas avulsas (`LooseNote`, `CATEGORY_BADGE`) | ✅ |

---

## `src/components/views/`

| Arquivo | Propósito | Status |
|---|---|---|
| `HomeView.tsx` | Home: saudação, meta do dia, métricas, progresso semanal, plano de ação | ✅ |
| `FaculdadeView.tsx` | Grade de disciplinas, diário de aulas, avaliações, calendário | ✅ |
| `CourseDetailView.tsx` | Detalhe de disciplina (info/aulas/repertório) + ação inferior | ✅ (via Faculdade) |
| `EstudosView.tsx` | Study corner: timer pomodoro, flashcards, leituras | ✅ |
| `BibliotecaView.tsx` | Catálogo + filtros + coleções + notas avulsas + modais (book/reader/filter) | ✅ |
| `PerfilView.tsx` | Jornada, stickers, estágio, TCC, personalização | ✅ |
| `EstadoDeEspiritoView.tsx` | Registro de mood do dia (presets, energia, intenção, reflexão) | ✅ |

---

## `src/components/widgets/`

| Arquivo | Propósito | Status |
|---|---|---|
| `StudyStatsWidget.tsx` | Ofensiva de estudos + velocidade de leitura (sparkline) | ✅ (PerfilView) |
| `MoodCalendarWidget.tsx` | Calendário de humor mensal | ✅ (PerfilView) |
| `ReaderModeModal.tsx` | Modo leitura (temas papel/sépia/noturno, progresso) | ✅ (Estudos + Biblioteca) |

---

## `src/lib/`

| Arquivo | Propósito |
|---|---|
| `utils.ts` | `cn()` — junta `clsx` + `tailwind-merge`; `copyToClipboard()` com fallback p/ webview Capacitor |
| `routing.ts` | Roteamento hash → pilha (`parseRoute`, `routeToStack`, `stackToHash`, `DEFAULT_SUB_TAB`) — testado por vitest |

---

## Resumo de ações de higiene (backlog)

- 🧹 `ContinueReadingWidget`, `FeaturedChallengeWidget`, `MoodSelectorWidget` foram **removidos**
  (Fase 4.1 — dead code).
- 🧹 Callbacks do `QuickAddModal` já tipados com as interfaces de `types.ts` (sem `any`).
- 🧹 Extrair padrão de overlay de modal para um componente reutilizável.
- 🧹 Unificar o modal de anotação de aula duplicado em `FaculdadeView` e `CourseDetailView`.
