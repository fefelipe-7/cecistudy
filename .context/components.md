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
| `QuickAddModal.tsx` | Form "novo registro" (6 tipos) | `isOpen`, `onClose`, `courses`, `initialType`, `onAdd*` | ✅ |
| `GlobalSearchModal.tsx` | Busca global (⌘K) | `isOpen`, `onClose`, `courses/classes/authors/…`, `onNavigate` | ✅ |

> **Nota:** `QuickAddModal` usa `(task: any)` etc. nos callbacks — deveria usar os tipos
> reais de `types.ts` (ver backlog).

---

## `src/components/ui/` — primitivas

| Arquivo | Propósito | Status |
|---|---|---|
| `button.tsx` | Button com variantes (CVA) + `asChild` (Radix Slot) | ✅ |
| `bottom-nav-bar.tsx` | Barra de navegação animada (pill ativa) | ✅ (via BottomNav) |
| `floating-action-menu.tsx` | Menu FAB "+" com opções animadas | ✅ (via BottomNav) |

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
| `ContinueReadingWidget.tsx` | Card "continuar de onde parou" | ⚠️ **import morto** em `EstudosView` (importado, nunca renderizado) |
| `FeaturedChallengeWidget.tsx` | Card de desafio de saúde mental | 🧟 **morto** (nunca importado) |
| `MoodSelectorWidget.tsx` | Seletor de mood com rostos SVG | 🧟 **morto** (nunca importado) |
| `ReaderModeModal.tsx` | Modo leitura (temas papel/sépia/noturno, progresso) | ✅ (Estudos + Biblioteca) |

---

## `src/lib/`

| Arquivo | Propósito |
|---|---|
| `utils.ts` | `cn()` — junta `clsx` + `tailwind-merge` |

---

## Resumo de ações de higiene (backlog)

- 🧹 Remover/decidir o destino de `ContinueReadingWidget` (ou usá-lo), `FeaturedChallengeWidget`,
  `MoodSelectorWidget` (dead code).
- 🧹 Substituir `any` dos callbacks do `QuickAddModal` pelos tipos reais.
- 🧹 Extrair padrão de overlay de modal para um componente reutilizável.
- 🧹 Unificar o modal de anotação de aula duplicado em `FaculdadeView` e `CourseDetailView`.
