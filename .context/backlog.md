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
- [x] **4.3** Migrar hex → tokens semânticos (Fase 8-A abaixo).
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

### Fase 6 — Capacitor & patamar de app (implementada)
> **Status: `[x]` implementada.** App de verdade: web/PWA (Vercel) + nativos Android/iOS (Capacitor 8).

**O que foi feito**
- [x] **6.1** Setup Capacitor: deps (`@capacitor/core/cli/android/ios` + status-bar, splash-screen,
  keyboard, haptics, local-notifications, preferences), `capacitor.config.ts`
  (`appId: "ceci.study.app"`, `webDir: "dist"`, splash/statusbar da marca), `cap add android` + `ios`
  (projetos commitados), scripts npm (`cap:sync`, `cap:open:*`, `cap:assets`), `.gitignore` nativo.
- [x] **6.2** Persistência dual: `src/lib/storage.ts` (web `localStorage` síncrono ↔ nativo
  `@capacitor/preferences` assíncrono) + `usePersistentState` async-aware (web sem flash; nativo
  hidrata pós-seed sem sobrescrever dados salvos).
- [x] **6.3** Polimento nativo: safe areas (`env(safe-area-inset-*)` no header/bottom-nav/main),
  `@capacitor/keyboard` (`resizeMode: native`), status bar escura, `src/lib/haptics.ts`
  (toggles de tarefa/prova, salvar mood), splash da marca (`src/lib/native.ts`).
- [x] **6.4** Lembrete diário de estudo via `@capacitor/local-notifications` (`src/lib/notifications.ts`),
  estado `reminderSettings` persistido + UI em Perfil → personalização (toggle + horário, no-op no web).
- [x] **6.5** Ícones/splash: arte-fonte `assets/*.svg` (ícone "C" provisório) → `@capacitor/assets`
  (Android 123 res, iOS AppIcon/Splash, PWA `public/icons/*.webp`) + `public/icon.png`/`icon-192.png`
  + `ic_stat_cecistudy.png` (notificação Android).
- [x] **6.6** CI `.github/workflows/native-build.yml`: Android (ubuntu + JDK 21 + SDK → APK debug,
  artifact) e iOS (macOS runner + Xcode → build unsigned p/ simulador).
- [x] **6.7** Docs `.context/` (arquitetura, guia nativo, storage dual, CI).

**Pendências / próximos passos**
- [ ] **Assinatura para publicação:** Android keystore (`*.jks`, secrets no GH) e iOS
  provisioning/signing (requer conta Apple + Mac). Pipeline de release assinado não configurado.
- [ ] Rodar o workflow do CI pela 1ª vez e confirmar APK/IPA no GitHub Actions.
- [ ] Trocar o ícone/splash provisórios pelos definitivos da marca.

### Fase 7 — Navegação native-first (pilha push/pop) (implementada)
> **Status: `[x]` implementada.** Navegação virou **pilha nativa** (push/pop), pensada para
> Android/iOS (Capacitor); o browser continua só para dev (`npm run dev`).

**O que foi feito**
- [x] **7.1** `NavScreen` (tab/course/notes/mood) em `types.ts`; `AppContext` usa
  `navigationStack` como fonte da verdade; hash é **espelho** (`parseRoute`/`routeToStack`/
  `stackToHash`; listener `hashchange` + `popstate`).
  Derivados do topo: `activeTab`, `focusedCourseId`, `isMoodViewOpen`, `isNotesScreenOpen`,
  `isBottomNavVisible` (bottom nav some em telas auxiliares).
- [x] **7.2** Push/pop: `handleNavigate` (reseta pilha; com `target` empurra curso),
  `openCourseDetail`, `openNotesScreen` (rota `#/biblioteca/notas`), `openMoodView`,
  `goBack`/`closeCourseDetail`/`closeNotesScreen`/`closeMoodView`. Troca de tab reseta o stack.
- [x] **7.3** **Back do Android** via `@capacitor/app` (`App.tsx`): fecha modais → pop da pilha
  → `App.exitApp()` na raiz. **iOS:** `ios.scrollEnabled`; swipe-back via histórico hash + listener
  (testar no device).
- [x] **7.4** **Header de telas auxiliares unificado**: voltar à esquerda + menu `⋯`
  (`HeaderActionMenu`) de ações contextuais à direita. Curso: nova anotação · nova prova ·
  editar matéria (`EditCourseModal` novo). Notas: nova nota avulsa.
- [x] **7.5** `alert()` → **Toast** (`ui/Toast`; timer EstudosView, salvar PerfilView).
  Clipboard com fallback (`copyToClipboard` em `lib/utils.ts`).
- [x] **7.6** **Fontes offline** via `@fontsource/*` (Inter, Plus Jakarta Sans, DM Serif Display,
  JetBrains Mono) importadas no `main.tsx`; removido `<link>` Google Fonts do `index.html`.
- [x] **7.7** `@capacitor/app` adicionado e sincronizado (`npx cap sync`) nos projetos nativos.
- [x] **7.8** Removidos links internos de "voltar" duplicados em `CourseDetailView` e `NotesScreen`
  (o header detail agora cuida do back).

**Observações / limites**
- Sub-tabs por view continuam como estado local da view (não codificadas na URL).
- Deep-link nativo nativo (universal links) fica para depois.
- `swipeBackEnabled` não está tipado no Capacitor 8 (default é `true`); o swipe-back depende do
  histórico hash + listener. Validar no iOS real.

### Fase 8 — Temas A/D/F: tokens, deep-link de busca e testes (implementada)
> **Status: `[x]` implementada.** Foco em consistência visual (tokens), busca & deep-links
> e qualidade/testes. Gate final: `npm run lint` + `npm run test` + `npm run build` verdes.

**8-A — Consistência visual (tokens)**
- [x] **A.1** Enumerados todos os hex hardcoded de classe (`~50 valores distintos`).
- [x] **A.2** Adicionados tokens órfãos ao `@theme` do `index.css`: `surface-paper/sun/mint/
  mint-soft/gold`, `border-mint/peach/gold`, `amber-bg/border/text`, `gold`, `success-deep/leaf`,
  `ceci-faded/primary-hover/ink/brand-hover/brand-soft/text-soft` + sombras `floating-strong`,
  `brand`, `brand-soft`. Muitos "órfãos" já existiam nas escalas (ex.: `#756354`→`beige-700`,
  `#FFB8C7`→`rose-300`, `#C2E8D0`→`green-200`).
- [x] **A.3** Migração mecânica via script (`/tmp/opencode/migrate-tokens.mjs`): zero `-[#hex]`
  de classe restantes em `src/`; `shadow-[...]` → `shadow-sm/floating/brand…`.
  Hex de **dados** (course.color, coverColor, chats da biblioteca em `libraryData.ts`)
  permanecem como valores (usados via `style={{}}`).
  > ⚠️ **Bug corrigido (fix pós-migração):** o mapeamento inicial gerou `border-border-default`
  > em vez de `border-ceci-border-default` — a classe não resolvia e caía em `currentColor`
  > (bordas "pretas"). Corrigido com `fix-border-tokens.mjs` (344 ocorrências em 27 arquivos)
  > e tokens `border-mint/peach/gold` → `ceci-border-*`. Visual idêntico ao original.
- [x] **A.4** Helper classes do `index.css` (`.journal-card`, `.paper-texture`, scrollbar, `body`)
  migradas para `var(--color-*)`/`var(--shadow-*)`.

**8-D — Busca & deep-links (sub-tabs + foco de item)**
- [x] **D.1** Sub-tabs das views (`Faculdade/Estudos/Perfil`) **levantadas para o contexto**
  (`subTabFaculdade/Estudos/Perfil`) — a view consome do `useApp()` em vez de `useState` local.
  Corrige o bug de "sub-tab vinda da busca não muda a view".
- [x] **D.2** Sub-tab codificada na **URL** quando não é a padrão: `#/faculdade/aulas`,
  `#/estudos/leituras`, `#/biblioteca/conceitos`, `#/perfil/stickers` (mantém URLs limpas;
  sub-tab padrão não é serializada). `parseRoute` distingue sub-tab de `courseId` por lista
  conhecida de sub-tabs. Roteamento extraído para **`src/lib/routing.ts`** (testável).
- [x] **D.3** **Deep-link focado:** `targetId` da busca global agora faz `scrollIntoView` +
  destaque (`box-shadow` rosa temporário) no item via `data-target` (ClassNoteListItem) ou
  `data-section` (BibliotecaView: testes/autores/conceitos/abordagens/multidisciplinar).

**8-F — Qualidade & testes**
- [x] **F.1** Infra de testes: `vitest` + `jsdom` + `@testing-library/react` (+ jest-dom) +
  `@vitest/coverage-v8`; `vitest.config.ts` (alias `@`, `globals: false`), `vitest.setup.ts`
  (jest-dom + cleanup), scripts `npm run test` / `npm run test:watch`.
- [x] **F.2** **35 testes** cobrindo: `routing` (parse/routeToStack/stackToHash + round-trip),
  `storage` (prefijo `cecistudy_`, dual, fallback de erro), `utils` (`cn`, clipboard),
  `PillTabBar`, `Modal` (abrir/fechar, Escape, backdrop).
- [x] **F.3** **`@types/react` + `@types/react-dom` instalados** — o projeto rodava com React
  como `any` implícito. Revelou 3 bugs latentes corrigidos: `screenVariants` agora é objeto
  `Variants` com resolvers por variante (tipado via `custom`), `reading.notes` inexistente no
  ReaderModeModal (conteúdo fictício → texto fixo), narrowing de `activeTab` quando o topo da
  pilha não é tab.
- [x] **F.4** **ErrorBoundary** (`ui/ErrorBoundary.tsx`) com fallback acolhedor (voltar à home).
- [x] **F.5** **Acessibilidade:** `aria-label` em botões só-ícone do header (voltar, buscar,
  favoritar), FAB (com `aria-expanded`) e logo; logo com `role="button"`/`tabIndex` + teclado.
- [x] **F.6** **Robustez:** `bookmarkedCourseIds` agora **persistido** via `usePersistentState`
  (favoritos de disciplinas não sumiam ao recarregar).

**Pendências p/ fases futuras**
- EstudosView: sub-tabs `leituras`/`questoes` ainda não renderizam conteúdo (Tema C).
- Dados dummy das views (HomeView, MoodCalendar) a derivar do estado/seeds.
- Unificar catálogo da biblioteca (`CollectionBook`/`ContextCollection`) com `ReadingItem`.
- Expansão dos testes para `QuickAddModal`/`GlobalSearchModal` e cobertura das views.

---

## Fase 9 — Navegação por gestos (implementada e **revertida**)

> **Status: `[x]` revertida.** O swipe entre abas/sub-abas e o swipe-back de borda
> (`SwipeTabPager`/`SwipeBack` em `src/components/ui/`, `src/lib/swipe.ts` + 15 testes)
> foram implementados e depois **removidos** a pedido da usuária (rollback para as fases 7-8).
> Este registro existe para agentes futuros não reimplementarem swipe sem contexto.

**O que foi feito na época**
- Pager horizontal por gestos entre abas e sub-abas (framer-motion) + swipe-back de borda
  para telas auxiliares (curso/notas/templo/mood).
- Helper `isHorizontalPan`/`SWIPE_THRESHOLD`/`shouldIgnorePanTarget` em `src/lib/swipe.ts`.
- `data-swipe-lock` em faixas com scroll horizontal próprio (pills, catálogo) e `TAB_ORDER`
  em `src/lib/routing.ts`.

**Por que foi revertido**
- A usuária preferiu o comportamento anterior: conteúdo termina logo acima da barra inferior
  e troca de tela por toque (sem scroll horizontal entre telas).
- A navegação segue **por pilha nativa** (push/pop, fases 7-8) com hash como espelho.

**Pontos observados (contexto para o futuro)**
- O layout do pager criava vão vertical quando a aba ativa era mais curta que a mais alta
  (corrigido na época com `h-dvh`/`max-h-full` + altura do trilho = sub-aba ativa).
- Swipe-back precisava ignorar apenas faixas com scroll próprio/campos de texto (não botões).

---

## Sugestão de ordem de execução

1. **Fase 1** (correção de Hooks + fundações) → destrava as próximas fases.
2. **Fase 2** (splits e desduplicação, reusando as primitivas da Fase 1).
3. **Fase 3** (estado/dados: contexto + persistência).
4. **Fase 4** (higiene: dead code, tipagem, tokens, body bg, remoção do AI Studio).
5. **Fase 5** (roteamento eficiente — implementado via `location.hash` + `hashchange`).
6. **Fase 6** (Capacitor & patamar de app — implementada; ver pendências acima).
7. **Fase 7** (navegação native-first por pilha — implementada; ver acima).
8. **Fase 8** (temas A/D/F: tokens, deep-link e testes — implementada; ver acima).
