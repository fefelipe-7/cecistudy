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
**Progresso:** o "progresso semanal" da Home e a streak do Perfil agora são derivados
de `streakData` (`src/lib/streak.ts`). "Aulas de hoje", "assuntos a estudar", meta diária
e ppm seguem dummy.

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
- [x] **6.6** CI `.github/workflows/release.yml`: Android (ubuntu + JDK 21 + SDK → APK, assinado
  com keystore ou debug) e iOS (macOS runner + Xcode → IPA assinado ou unsigned p/ sideload).
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
- HomeView: "aulas de hoje" e "assuntos a estudar" ainda dummy a derivar do estado/seeds.
  (O `MoodCalendarWidget` fake foi **removido** — o Perfil é página única inline com métricas reais.)
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

## Fase 10 — Remoção do recurso de humor (estado de espírito) (implementada)

> **Status: `[x]` implementada a pedido da usuária.** O recurso de "estado de espírito"
> (mood do dia) foi **completamente removido**: seletor na home, calendário no Perfil e tudo
> relacionado. Este registro existe para agentes futuros não reimplementarem mood sem contexto.

**O que foi feito**
- Removidos `currentMood`/`moodHistory` (estado + persistência + export), `DailyMoodData`/
  `MoodEntry` (types), `MOOD_PRESETS`/`moodPresets.ts` (deletado), `INTENTION_CHIPS`.
- Removidos `avatarMood` (`UserProfile` — tagline do perfil) e `mood` (`StudySession` —
  humor da sessão no `SessionWizard` e no histórico do `EstudosView`).
- Removidos `EstadoDeEspiritoView` e `MoodCalendarWidget` (deletados); home sem botão de mood;
  header default sem badge de humor; `#/mood` sem rota (`NavScreen`/`routing.ts`/`App.tsx`);
  `handleSaveMood`/`openMoodView`/`closeMoodView`/`isMoodViewOpen` removidos; confete
  `mood-saved` removido de `celebrate.ts`.
- `SCHEMA_VERSION` 5 → **6**: `MIGRATIONS[6]` descarta `currentMood`/`moodHistory`/
  `profile.avatarMood` de backups antigos; `AppContext` limpa as chaves órfãs no boot.
- Docs (`AGENTS.md`, `.context/*.md`, skills) atualizados.

**Gatilho de validação:** `npm run lint` + `npm run test` + `npm run build` verdes.

---

## Fase 11 — OTA self-hosted (atualizações web sem novo IPA/APK) (implementada)

> **Status: `[x]` implementada.** O app nativo agora atualiza o bundle web
> (React/CSS/JS) over-the-air via `@capgo/capacitor-updater` (modo manual), servido
> de graça pelo GitHub Pages — sem servidor próprio nem novo `.ipa`/`.apk` a cada
> mudança de interface.

**O que foi feito**
- **Cliente:** `src/lib/ota.ts` (modo manual do `@capgo/capacitor-updater`, no-op no web) —
  `initOta()` chama `notifyAppReady()` no boot e agenda a checagem; `checkForUpdates()`
  busca o `version.json` no GitHub Pages, compara com a versão atual e baixa o zip
  (valida SHA-256); `next()` agenda a troca para a próxima abertura; `applyNow()`
  aplica na hora. UI reativa via `useOtaStatus()`.
- **Lógica pura testável:** `src/lib/otaLogic.ts` (`semverCompare`, `parseOtaManifest`,
  `shouldUpdate`) + testes (`otaLogic.test.ts`).
- **UI:** modal `ui/OtaUpdateModal.tsx` ("atualização pronta ♡") + card "atualização do
  app" no Perfil (versão atual, progresso de download, "verificar atualização",
  "aplicar agora") — só nativo.
- **Publicação:** o pipeline único `.github/workflows/release.yml` (push na main,
  tag `v*` ou `workflow_dispatch`) → `npm ci` → lint → test → build → zip do `dist/` → SHA-256 →
  `version.json` + `bundles/` (mantém as últimas 5 em `available`) → GitHub Pages.
  A versão semver do OTA é a **versão do release** (ex.: tag `v1.2.3` → OTA `1.2.3`).
  Script do manifest: `.github/scripts/ota-manifest.mjs`.
- **Config:** `capacitor.config.ts` com `CapacitorUpdater: { autoUpdate: 'off' }`; dep
  `@capgo/capacitor-updater` + `npx cap sync` (android/ios commitados).
- **Docs:** `ota/README.md` + `ota/version.json.example`; `AGENTS.md` e `architecture.md`
  atualizados.

**Setup manual único:** Settings → Pages → Source: "GitHub Actions"; e **uma** build
nativa (IPA/APK) com o plugin embutido para o dispositivo passar a receber OTA.

**Rollback:** automático se o bundle novo crashar antes do `notifyAppReady()`; manual via
re-run do workflow num commit antigo; `available` guarda as últimas 5 versões.

**Gatilho de validação:** `npm run lint` + `npm run test` + `npm run build` verdes.

---

## Fase 12 — Auditoria `docs/auditor.md` (contrato de banco, backup, quiz, ícones, OTA) (implementada)

> **Status: `[x]` implementada.** Correções estruturais dirigidas pelo relatório de
> auditoria (`docs/auditor.md`), todas verificadas no código antes de corrigir.
> Gate final: `npm run lint` + `npm run test` + `npm run build` verdes (235 testes).

- [x] **12.1** **Contrato único de banco + backup/reset/import (P1-1 + Zod):**
  - `src/lib/persistentData.ts` — contrato único (`PersistedDatabase`), bancos estáticos
    (`approaches`/`questions` **não** exportados — catálogos re-seedados sob demanda),
    snapshot de estado (`readDatabaseFromState`), `buildBackupData`, `resetDatabase`.
  - `src/lib/backupSchema.ts` — validação Zod por entidade (+ `.passthrough()` p/ campos
    legados); `backupDataSchema` tolera coleções ausentes (merge com `emptyDatabase()`)
    mas rejeita payloads malformados.
  - `src/lib/exportImport.ts` — `importAppDatabase` valida JSON → migra → valida Zod →
    merge; `buildBackupPayload(snapshot)`; re-export de `SCHEMA_VERSION`.
  - `src/data/schema.ts` — `SCHEMA_VERSION` 6→**7**; `MIGRATIONS[7]` adiciona `quizSessions`.
  - `src/context/AppContext.tsx` — `applyDatabase` também aplica `techniques`/`quizSessions`/
    `onboarding`; `loadDemoData` preserva onboarding; `resetApp` limpa seeds estáticos e
    refs; `exportData` usa `buildBackupPayload`.
  - Testes: `src/lib/__tests__/exportImport.test.ts` (13 testes: round-trip, reset, backup
    antigo schema 6, payload inválido, coleção malformada, passthrough).
- [x] **12.2** **Back do quiz + pilha de resultado (P1-2 + P2-5):**
  - `quiz-result` agora carrega a `pool` no próprio screen (não depende do `quiz-play`
    na pilha) — `openQuizResult` **remove** o jogo da pilha (P2-5) e o back volta ao
    seletor de categorias (P1-2). Handler de back nativo em `App.tsx` cobre
    result/play/loading/category; `onRetry` com guard de pool vazia.
- [x] **12.3** **Coleções de abordagens (P1-3):** `ContextCollection.approachId` +
    `col-app-tcc`→`psic-04-01` e `col-app-psicanalise`→`psic-01-01`; `BibliotecaView`
    troca o bypass `window.location.hash` por `openApproach(col.approachId)`.
- [x] **12.4** **Ícones tipados (P2-2):** `CourseIconName` (união em `types.ts`),
    mapa tipado `Record<CourseIconName, LucideIcon>` com `Clock`/`BookOpen`/`History`,
    `COURSE_ICON_NAMES` exportado + teste. Header de estudos agora resolve os ícones.
- [x] **12.5** **Toast estável (P2-3):** `toastTimerRef` cancela o timer anterior e limpa
    no unmount do provider.
- [x] **12.6** **Texto do quiz (P2-4):** resultado usa `X minuto(s) no total` (sem duplicação).
- [x] **12.7** **OTA manual real (P2-6):** `checkForUpdates({ manual })` — manual seta erro
    visível no Perfil; background silencioso preserva `ready`/volta a `idle` sem alarme.
- [x] **12.8** **Refatoração de `AppContext.tsx` (concisão):**
  - `src/lib/quizStack.ts` — funções puras da pilha do quiz (`stackAfter*`) + 12 testes.
  - `src/lib/headerConfig.ts` — `buildHeaderConfig` puro (header dinâmico) + 5 testes.
  - `AppContext.tsx` 2084 → **1884** linhas.
- [x] **12.9** **Empacotamento (P-perf):** import de `@capacitor/filesystem` em
  `permissions.ts` alinhado ao padrão dinâmico do `exportImport.ts` (warning de chunk
  resolvido). Dados pesados (`psicoterapiaApproaches`/`bancoQuestoes`) já eram lazy.
- [x] **12.10** **Runtime (P-qualidade):** `engines: ">=22"` em `package.json` + `.nvmrc`
  (`22`) alinhado ao CI.

**Follow-ups documentados (não executados nesta fase):**
- Split por recurso do facade `src/data/books/index.ts` (BibliotecaView ~516 kB gzip 128 kB
  na primeira abertura; lazy por coleção/família exigiria reestruturar o facade).
- ESLint/Prettier como gate de PR (hoje `lint` = só `tsc --noEmit`).
- `uuid@7.0.3` (transitivo de `@capacitor/cli`→`xcode`): 3 vulns moderadas; aguardar
  atualização controlada da cadeia de CLI (não rodar `npm audit fix --force`).

---

## Fase 13 — Gesto de voltar pela borda (Edge Swipe-Back) no iOS (implementada)

> **Status: `[x]` implementada.** Voltar pela borda (arrastar da borda esquerda para a
> direita) no iPhone, no estilo de app nativo: o conteúdo acompanha o dedo e o commit/cancel
> decide. Implementado **100% em JS/framer-motion** (camada web) — chega por OTA, sem
> rebuild nativo. **Gate:** `npm run lint` + `npm run test` (31 arquivos / **284 testes**) +
> `npm run build` verdes. Doc completo: `.context/docs/edge-swipe-back.md`.

**O que foi feito**
- `AppContext.tsx`: extraída a cadeia de 25 passos do back do Android para
  **`handleSystemBack()`** (fonte única — Android **e** gesto iOS a chamam; retorna `true`
  se fechou algo) + **`canGoBack`** derivado (gesto inerte quando não há o que voltar).
- `App.tsx`: handler `backButton` do Android reduzido a `handleSystemBack()` + `exitApp`;
  `AppShell` cria `swipeX` (`useMotionValue(0)`) e envolve a camada de slide
  (`<motion.div style={{ x: swipeX }}>`); `<EdgeSwipeBack />` renderizado.
- **`src/lib/swipe.ts`** (novo, testável): `EDGE_WIDTH` 24px, `ENGAGE_THRESHOLD` 12,
  `COMMIT_THRESHOLD` 72, `MAX_DRAG_FRACTION` 0.42, `shouldIgnoreTarget`
  (interativos de verdade + `overflow-x` scroll/auto + `[data-no-swipe]`, até 6 níveis;
  **cards clicáveis NÃO ignoram** — o gesto vence o tap após movimento, como iOS),
  `isEngaged` (dx >= 12 e mais que vertical), `shouldCommit`, `clampDrag`, `supportsEdgeSwipe`.
- **`src/components/ui/EdgeSwipeBack.tsx`** (novo): pointer events no `window` (passive,
  no-op em desktop/`mouse`), drag → `swipeX`, release commit (`onBack`) ou spring de volta,
  `pointercancel` → spring.
- `index.css`: `overscroll-behavior-x: none` no body (evita rubber-band horizontal).
- **17 testes** em `src/lib/__tests__/swipe.test.ts`.

**Contexto p/ agentes futuros**
- A **Fase 9** (swipe entre abas/pager) continua **revertida**; este gesto é só o **back
  pela borda** sobre a pilha push/pop existente.
- Sem conflito de duplo back: o WKWebView nativo não reconhece o gesto
  (`allowsBackForwardNavigationGestures = false`) e a eco-guard do `applyRoute` cobre o eco.
- Limite: a **tela atual** acompanha o dedo; a transição interativa **nativa plena**
  (tela anterior visível + sombra/elevação UIKit) exigiria plugin Capacitor em Swift +
  **rebuild nativo** (IPA) via CI — esta máquina Windows não compila iOS. Se evoluir,
  reusar `handleSystemBack`/`canGoBack` como ponte.

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
9. **Fase 10** (remoção do humor — implementada; ver acima) e **Fase 11** (OTA self-hosted — implementada; ver acima).
10. **Fase 12** (auditoria `docs/auditor.md` — contrato de banco/backup, quiz, ícones, OTA, refatoração — implementada; ver acima).
11. **Fase 21** (correções de QA manual — `docs/manual-findings.md` + `docs/manual-tests.md` — implementada; ver abaixo).
12. **Fase 13** (gesto de voltar pela borda iOS — implementada; ver acima).

---

## Fase 21 — correções de QA manual (`docs/manual-findings.md` + `docs/manual-tests.md`) (implementada)

> **Status: `[x]` implementada.** O P0 (quiz travado) e os P1/P2 prioritários dos manuais de QA foram corrigidos.
> **Gate:** `npm run lint` + `npm run test` (29 arquivos / 238 testes) + `npm run build` verdes.

**O que foi feito**

- **[P0 — F1] Quiz trava após resposta incorreta:**
  - Adicionado `src/components/quizzes/__tests__/QuizPlayer.test.tsx` (3 testes TDD: resposta errada marca vermelho e libera continuação; resposta correta avança questão; última questão chama onFinish). Testes passam em isolamento.
  - Diagnóstico: `updateQuizPlayState` chamava `syncHash(stack)` a cada resposta. `syncHash` atualizava `location.hash` → disparava `hashchange` → `applyRoute` lia o hash → `routeToStack` reconstrói a pilha. Para rotas de quiz, o roteador **degrada** `quiz-play`/`quiz-result` para `quiz-category` (ver `src/lib/routing.ts:280-282,339`). Resultado: o estado do jogo era apagado no meio da jogada, `selectedOption` local do `QuizPlayer` era resetado pelo `useEffect` de `currentIdx`, e a usuária ficava sem feedback.
  - Correção: removida a chamada `syncHash(stack)` de `updateQuizPlayState` (hash já estava sincronizado na abertura do quiz via `openQuizPlay`). Estado de jogo agora persiste durante toda a sessão.

- **[P1 — F2] Tarefa “sem prazo” vira data atual:**
  - `src/components/wizards/TaskExamWizard.tsx:331,359`: `taskDueDate || today()` → `taskDueDate || undefined`.
  - `src/components/wizards/TaskExamWizard.tsx:344`: `examDate || today()` → `examDate || undefined` (edição de prova).
  - `src/components/wizards/TaskExamWizard.tsx:363-364`: `if (addToAgenda)` agora verifica `taskDueDate` antes de criar evento no calendário.
  - `src/components/views/NoteTransformWizard.tsx:773`: `dueDate || today()` → `dueDate || undefined`.
  - HomeView já exibia `sem prazo` corretamente; `schedule.ts` filtra `if (t.dueDate)` — OK.
  - **Sem migração:** `dueDate?: string` já existe em `types.ts`.

- **[P1 — F3] “Carregar exemplos” e “Resetar” bloqueiam com `window.confirm()`:**
  - `src/components/views/PerfilView.tsx:800-818`: substituídos os dois `confirm()` nativos por estado local `pendingAction` + primitiva `ui/Modal` com textos explícitos, botões `cancelar`/`confirmar`, e `closeOnBackdrop={false}` (força decisão consciente).

- **[P1 — F4] Cards de livros sem semântica de botão:**
  - `src/components/views/BibliotecaView.tsx:552-594`: trocado `<div onClick>` por `<button>` com `aria-label="abrir {título}"` e suporte a teclado nativo. Tag de fechamento corrigida.

- **[P2 — F5] “Ver anotação” como affordance de ação:**
  - `src/components/courses/ClassNoteListItem.tsx:25-29`: adicionados `role="button"`, `tabIndex={0}`, `aria-label="ver anotação: {título}"` e `onKeyDown` (Enter/Space) no container clicável. `useLongPress` preservado (abre menu de gerenciamento no longo toque; clique normal abre a anotação).

- **[P2 — F6] Transformar nota em tarefa não navega ao item criado:**
  - `src/components/views/NoteTransformWizard.tsx`: após salvar tarefa, chama `setActiveTab('faculdade')` (se disciplina) ou `setActiveTab('home')` (se sem disciplina). Import de `setActiveTab` adicionado.

- **[P2 — F7] Reiniciar timer apaga sessão sem confirmação:**
  - `src/components/estudos/StudyFocusScreen.tsx`: adicionado estado `pendingReset` + `Modal` de confirmação. Botão de reinício agora abre o modal; `descarta`/`reset` do fluxo de sessão concluída também usa o modal quando há tempo decorrido.

- **[P3 — F8] Pausa retorna label “iniciar” ao invés de “retomar”:**
  - `src/components/estudos/StudyFocusScreen.tsx:118`: label agora é `toggleLabel = isRunning ? 'pausar' : preset\*60 - timeLeft > 0 ? 'retomar' : 'iniciar'`.

- **[P3 — F9/F10] Permissões web e estratégia de busca:**
  - Permissões web como controles desabilitados: **não alterado** nesta fase (recomendar manter como-info-visual em fase futura ou aceitar o padrão atual).
  - Estratégia de busca (item vs coleção): **decisão de produto** — documentar antes de alterar.

**Validação final**
- `npm run lint` ✓
- `npm run test` ✓ (29 arquivos / 238 testes)
- `npm run build` ✓ (`dist/` gerado em ~5.2s; avisos de chunk grande são pré-existentes)

**Arquivos alterados**
- `src/components/quizzes/__tests__/QuizPlayer.test.tsx` (novo)
- `src/context/AppContext.tsx` (remoção de `syncHash` de `updateQuizPlayState`)
- `src/components/wizards/TaskExamWizard.tsx`
- `src/components/views/NoteTransformWizard.tsx`
- `src/components/views/PerfilView.tsx`
- `src/components/views/BibliotecaView.tsx`
- `src/components/courses/ClassNoteListItem.tsx`
- `src/components/estudos/StudyFocusScreen.tsx`

**Follow-ups não executados (futuro)**
- Validação manual do quiz em ambiente real (reproduzir cenário P0).
- Ajustar `NoteTransformWizard` para também usar `undefined` em `examDate`/`sessionDate`/`internshipDate` (padronizar "sem data" em todas as transformações).
- Revisar permissões do onboarding (F9) — tornar switches informativos sem affordance de toggle na web.
- Documentar estratégia de busca da Biblioteca (F10).
