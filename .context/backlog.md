# Backlog / Pontos de Melhoria

> Débito técnico e oportunidades, priorizados. (pt-BR)
> **Escopo atual:** documentação + correções estruturais antes de novas features.
> Ver seção "Plano de refatoração (fases)" abaixo para o roadmap em execução.

## Priorização

- 🔴 Alta · 🟡 Média · 🟢 Baixa

---

## 🔴 1. Hex hardcoded em vez de tokens semânticos
Os componentes usam `text-[#40383A]`, `bg-[#FFF5F7]`, `border-[#FFD3DD]`… em massa,
apesar de o design system (`src/index.css`) já definir aliases semânticos (`ceci-primary`,
`surface-rose`, `border-brand`…).
**Ação:** migrar gradualmente para os tokens; padronizar busca/edits de UI.

## 🔴 2. `App.tsx` monolítico
417 linhas com todo o estado global + handlers + persistência + modais.
**Resolvido (Fase 3.1):** `App.tsx` virou wrapper fino (`AppProvider` → `AppShell`); todo o
estado + handlers + navegação + header dinâmico moram em `src/context/AppContext.tsx`.

## 🔴 3. Props drilling intenso
Views recebem dezenas de props e callbacks em cascata.
**Resolvido (Fase 3.1):** as 5 views principais (`Home`, `Faculdade`, `Estudos`, `Biblioteca`,
`Perfil`) consomem `useApp()` sem props. Modais/nav ainda recebem props do `AppShell` (1 nível).

## 🟡 4. Dead code
- `ContinueReadingWidget` — importado em `EstudosView` mas **nunca renderizado**.
- `FeaturedChallengeWidget` e `MoodSelectorWidget` — definidos, **nunca importados**.
**Ação:** usar, remover ou mover para um local claro.

## 🟡 5. Dependências mortas
`@google/genai`, `express`, `dotenv`, `@types/express` eram declaradas sem uso (backend
Gemini/AI Studio planejado, **descartado**).
**Resolvido (Fase 4.0):** deps removidas; `package.json` com `"name": "cecistudy"`; removidos
`metadata.json`, `.env.example`, bloco `DISABLE_HMR` do `vite.config.ts` e `bun.lock`.

## 🟡 6. Estado não persistido inconsistente
`savedBookIds` e `looseNotes` (BibliotecaView) ficavam em `useState` local, sem `localStorage`.
**Resolvido (Fase 3.2):** ambos persistidos via `usePersistentState`. Demais dados dummy das
views (HomeView, MoodCalendar) ainda a derivar do estado/seeds.

## 🟡 7. Modais duplicados
Overlay `fixed inset-0 z-50 bg-black/40 backdrop-blur-xs` repetido em ~4 lugares.
Modal de anotação de aula duplicado em `FaculdadeView` e `CourseDetailView`.
**Ação:** criar componente `Modal` reutilizável; unificar o de anotação.

## 🟡 8. Tipagem fraca no QuickAddModal
Callbacks `onAddTask: (task: any) => void` etc. usam `any`.
**Ação:** tipar com as interfaces de `types.ts`.

## 🟡 9. Dados dummy hardcoded nas views
Aulas de hoje, progresso semanal, stats de estudo (25min/08 cartões), eventos do
calendário são literais nas views em vez de derivados do estado.
**Ação:** derivar de dados reais ou mover para seeds.

## 🟢 10. Sem testes
`bun run lint` = apenas `tsc --noEmit`. Nenhum framework de testes configurado.
**Ação:** adicionar Vitest + testes de unidade/componente.

## 🟢 11. Robustez / UX
- `alert()` usado para feedback (trocar por toast/snackbar).
- `body` bg definido em 3 lugares (index.html, index.css, App.tsx) — centralizar.
- Sem `ErrorBoundary` / estados de loading.
- Alguns botões sem `aria-label` (acessibilidade).

## 🟢 12. ReaderModeModal com conteúdo fictício
O modo leitura usa `sampleExcerpt` fixo em vez do conteúdo real do `ReadingItem`.
**Ação:** conectar a dados reais quando houver backend/conteúdo.

## 🟢 13. Dados da biblioteca paralelos
`CollectionBook`/`ContextCollection` (`libraryData.ts`) são separados de `ReadingItem`
e não persistidos. Unificar o modelo evita divergência.

---

## Plano de refatoração (fases)

> Roadmap de correções estruturais a executar **antes** de novas features.
> Status por item: `[ ]` pendente · `[x]` concluído.

### Fase 1 — Correções & fundações (baixo risco)
- [x] **1.1** Corrigir **violação das Regras de Hooks** no `ReaderModeModal` (`if (!isOpen) return null` antes dos `useState` — quebra ao abrir o modo leitura). Mover hooks acima do early return.
- [x] **1.2** Extrair `usePersistentState` de `App.tsx` para `src/lib/usePersistentState.ts`.
- [x] **1.3** Criar primitivas reutilizáveis: `Card`, `Modal`, `PillTabBar`, `IconButton`, `ProgressBar` (em `src/components/ui/`).
- [x] **1.4** Centralizar resolvedor de ícones de curso em `src/components/ui/CourseIcon.tsx` (eliminar `renderIcon`/`renderCourseIcon` duplicados).

### Fase 2 — Desduplicação & splits
- [x] **2.1** Splitar `BibliotecaView.tsx` (1249 → 610 linhas): extrair `InlineCollectionBlock`, `BookDetailModal`, `LibraryFilterModal`, `NotesScreen` para `src/components/library/` (estado `looseNotes` levantado para preservar badge de contagem).
- [x] **2.2** Extrair `ClassNoteModal` e `ClassNoteListItem` (duplicados em Faculdade/CourseDetail) para `src/components/courses/`. Nota: `ExamListItem`/`TaskToggleItem` têm markup muito divergente entre views (HomeView usa `motion` + layouts distintos) — unificar exigiria variantes arriscadas; deixado para revisão futura.
- [x] **2.3** Mover `DailyMoodData`/`QuickType` para `types.ts`; `MOOD_PRESETS` para `src/data/moodPresets.ts`.
- [x] **2.4** Unificar barras de sub-tabs com `PillTabBar` (Faculdade/Estudos/Perfil; CourseDetail usa estilo underline — mantido) e overlays de `ClassNoteModal`/`BookDetailModal`/`LibraryFilterModal` com a primitiva `Modal`.
- [ ] **2.5** Padronizar nomenclatura de arquivos (kebab-case vs PascalCase). **Deferido:** alto churn (renomear ~15 arquivos + imports) e baixo valor; decidir após as fases críticas. `ui/` mantém kebab-case, resto PascalCase.

### Fase 3 — Estado & dados
- [x] **3.1** Contexto de dados / reduzir props drilling: criar `src/context/AppContext.tsx` (`AppProvider` + hook `useApp()`) com todo o estado persistente, handlers e navegação. Views principais (`Home`, `Faculdade`, `Estudos`, `Biblioteca`, `Perfil`) agora consomem `useApp()` sem props; `App.tsx` virou wrapper fino (`AppProvider` → `AppShell`). Modais/nav ainda recebem props do `AppShell` (1 nível).
- [x] **3.2** Persistir `savedBookIds`/`looseNotes` via `usePersistentState` na `BibliotecaView` (chaves `cecistudy_savedBookIds`/`cecistudy_looseNotes`). Dados dummy restantes (HomeView, MoodCalendar) ainda a derivar do estado/seeds.

### Fase 4 — Higiene
- [x] **4.0** Remover completamente o backend/AI Studio: apagar `metadata.json`, `.env.example`,
  `bun.lock`; remover deps `@google/genai`, `express`, `dotenv`, `@types/express`; limpar
  `vite.config.ts` (bloco `DISABLE_HMR`); `"name": "cecistudy"`; `clean` sem `server.js`.
- [x] **4.1** Remover dead code (`ContinueReadingWidget`, `FeaturedChallengeWidget`, `MoodSelectorWidget`).
- [x] **4.2** Tipar callbacks do `QuickAddModal` (eliminar `any`).
- [ ] **4.3** Migrar hex → tokens semânticos (em andamento contínuo).
- [x] **4.4** Centralizar `body` bg (fonte única em `index.css`; removido de `index.html`/`App.tsx`).

### Fase 5 — Roteamento eficiente (implementado)
> **Status: `[x]` implementado (opção 3).** Navegação agora sincroniza um "pathname virtual"
> no `location.hash` com listener `hashchange`, sem adicionar dependência.

**O que foi feito**
- Rotas hash: `#/home`, `#/faculdade`, `#/faculdade/:courseId`, `#/estudos`, `#/biblioteca`,
  `#/perfil`, `#/mood`.
- `AppContext` escuta `hashchange` (aplica a rota ao estado) e as ações de navegação
  (`handleNavigate`, `openCourseDetail`, `closeCourseDetail`, `openMoodView`,
  `closeMoodView`, `handleSaveMood`) sincronizam o `location.hash`.
- Ganhos: deep-link para views e disciplinas (ex.: `#/faculdade/c3`), suporte ao botão
  voltar/avançar do navegador, sem recarregar e mantendo o header dinâmico.
- Lógica `buildRoute`/`parseRoute` validada por teste isolado de roteiro.

**Observações / limites**
- Sub-tabs por view continuam sendo estado local da view (não codificadas na URL). Para
  deep-link a sub-tab granular, seria preciso transformar as views em sub-tab "controlada"
  pelo contexto (trabalho futuro).
- `react-router` (opção 1) não foi usado: adiciona dependência e tem limitações de path
  em PWA estática no Vercel.

### Itens detectados na análise estrutural (fora do backlog original)
- `ReaderModeModal` — Regras de Hooks (ver 1.1).
- Card container `rounded-[24px] …` repetido 11+ vezes + `.journal-card` paralelo → unificar em `Card`.
- Fallbacks literais (`'PSI-300'`, `'Bloco C'`, `progress || 50`) repetidos.
- `lib/utils.ts` só com `cn()` → extrair helpers (data, progresso, ícones).

---

## Sugestão de ordem de execução

1. **Fase 1** (correção de Hooks + fundações) → destrava as próximas fases.
2. **Fase 2** (splits e desduplicação, reusando as primitivas da Fase 1).
3. **Fase 3** (estado/dados: contexto + persistência).
4. **Fase 4** (higiene: dead code, tipagem, tokens, body bg, remoção do AI Studio).
5. **Fase 5** (roteamento eficiente — implementado via `location.hash` + `hashchange`).
