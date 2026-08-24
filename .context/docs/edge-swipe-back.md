# Fase 13 — Gesto de voltar pela borda (Edge Swipe-Back)

> Fazer o gesto de "voltar pela borda" (arrastar da borda esquerda para a direita)
> funcionar no iPhone do jeito que funciona o voltar do Android — fechar disciplinas,
> notas, quiz, compose, wizard e telas empilhadas com acompanhamento 1:1 do dedo.
> Implementado **100% em JavaScript/framer-motion** (camada web), sem mudança nativa.

**Status:** `[x]` implementada · **Gate final:** `npm run lint` + `npm run test` (31 arquivos / 284 testes) + `npm run build` verdes.

---

## 0. Contexto

- O Android já tinha o gesto/tecla de voltar via `@capacitor/app` `backButton` com uma
  **cadeia de 25 passos** no `App.tsx` (fecha modal → pop de tela → `exitApp`).
- No iPhone o swipe-back do WKWebView **não disparava** (`allowsBackForwardNavigationGestures`
  é `false` por padrão e o Capacitor não o habilita), então não havia gesto de voltar.
- A **Fase 9** do backlog implementou swipe entre abas/sub-abas + swipe-back e foi
  **revertida** a pedido da usuária. Este gesto é diferente: apenas o **back pela borda**,
  sem pager entre abas — reimplementar foi decisão explícita da usuária.
- Não há resquício do código da Fase 9 no `src/` (verificado antes de começar).

---

## 1. Arquitetura

```
window (pointerdown na borda esquerda, touch)
   │  clientX <= EDGE_WIDTH (24px)
   ▼
EdgeSwipeBack (src/components/ui/EdgeSwipeBack.tsx)
   │  engaja após movimento horizontal > 12px (isEngaged)
   ▼
swipeX = useMotionValue(0)  →  wrapper <motion.div style={{ x: swipeX }}>
   │  (clamp a 42% da largura da tela)
   ▼
release do dedo
   ├── dx >= COMMIT_THRESHOLD (72px) → onBack() = AppContext.handleSystemBack()
   └── dx <  threshold                → spring de volta (cancel)
```

- **`handleSystemBack()`** no `AppContext` virou a **fonte única** da cadeia de voltar:
  tanto o botão/gesto do Android quanto o gesto de borda iOS chamam a mesma função
  (retorna `true` se fechou algo). O handler do Android no `App.tsx` foi reduzido a:
  `const handled = a.handleSystemBack(); if (!handled) void CapacitorApp.exitApp();`
- **`canGoBack`** (derivado no `AppContext`) diz se existe algo para voltar; o gesto fica
  **inerte** quando não há (primeira tela/abas).

### Por que na camada web (e não nativa)
- **Entrega imediata por OTA**: gesto 100% em JS/CSS chega ao iPhone instalado via
  bundle web (`@capgo/capacitor-updater`) — sem novo IPA/APK.
- O reconhecimento nativo (`UIScreenEdgePanGestureRecognizer` + plugin Capacitor) exigiria
  **rebuild nativo** (IPA novo) e esta máquina (Windows) **não compila** iOS (CI faz).
- Conflito de duplo back **não existe**: o WKWebView nativo não reconhece o gesto
  (`allowsBackForwardNavigationGestures = false`), e a eco-guard do `applyRoute`
  (`lastSyncedHashRef`) ignora o eco do espelho do hash.
- Sacrifica a **transição interativa nativa** (a tela anterior acompanhando o dedo de
  verdade). O que o JS entrega: o **conteúdo atual** acompanha o dedo (transform `x`),
  commit/cancel no threshold — próximo do padrão, sem ser 100% UIKit. Ver seção 5.

---

## 2. O que foi feito

### 2.1 `src/context/AppContext.tsx`
- Interface `AppContextValue`: adicionados `handleSystemBack: () => boolean` e `canGoBack: boolean`.
- Derivação de `canGoBack` (mesma cadeia do back, sem side effects):
  `managedItem || isQuickAddOpen || isSearchOpen || isEditCourseOpen || isDetailPromptOpen ||
  isComposeDetailsOpen || isComposeScreenOpen || isWizardOpen || isNoteTransformOpen ||
  isNoteDetailOpen || isStreakScreenOpen || isInternshipDiaryOpen || isTccScreenOpen ||
  isStickersScreenOpen || isQuizResultOpen || isQuizPlayOpen || isQuizLoadingOpen ||
  isQuizCategoryOpen || focusedStudyScreen || isNotesScreenOpen || isTempleScreenOpen ||
  isFamiliesScreenOpen || focusedFamilyId || focusedApproachId || focusedCourseId`.
- `handleSystemBack` (useCallback, após `headerConfig`): a cadeia de 25 passos agora mora
  aqui, retornando `true`/`false`.

### 2.2 `src/App.tsx`
- Handler `backButton` do Android simplificado para `handleSystemBack()` + `exitApp`.
- `AppShell`: `const swipeX = useMotionValue(0)`.
- Camada de slide (`<AnimatePresence mode="popLayout">`) envolvida por
  `<motion.div style={{ x: swipeX }} className="will-change-transform">`.
- `<EdgeSwipeBack swipeX={swipeX} onBack={app.handleSystemBack} canGoBack={app.canGoBack} />`
  renderizado junto ao `<LiquidGlassFilters />`.

### 2.3 `src/lib/swipe.ts` (novo — helpers puros testáveis)
| Símbolo | Valor | Papel |
|---|---|---|
| `EDGE_WIDTH` | `24` | Largura da faixa da borda esquerda que inicia o gesto (px) |
| `ENGAGE_THRESHOLD` | `12` | Movimento horizontal mínimo para "engajar" (vira drag) |
| `COMMIT_THRESHOLD` | `72` | Soltar acima disso volta; abaixo volta ao lugar |
| `MAX_DRAG_FRACTION` | `0.42` | Fração máx. da largura que o conteúdo desliza |
| `shouldIgnoreTarget(el)` | — | True se botão/link/input/textarea/select/contenteditable/`[data-no-swipe]` ou container com `overflow-x` scroll/auto (sobe até 6 níveis) |
| `isEngaged(...)` | — | `dx >= 12 && |dx| > |dy|` (ignora scroll vertical) |
| `shouldCommit(dx)` | — | `dx >= 72` |
| `clampDrag(dx, w)` | — | `[0, round(w * 0.42)]` |
| `supportsEdgeSwipe(w)` | — | `w >= 320` |

> **Decisão:** cards clicáveis (`role="button"`) **não** ignoram o gesto — quase toda a
> borda esquerda é card clicável; o gesto vence o tap após movimento horizontal, como no
> iOS. Botões/inputs de verdade continuam funcionando (nunca rouba o toque sem movimento).

### 2.4 `src/components/ui/EdgeSwipeBack.tsx` (novo)
- Props: `swipeX: MotionValue<number>`, `onBack: () => boolean`, `canGoBack: boolean`.
- Escuta `pointerdown/move/up/cancel` no `window` (passive), no-op em `mouse`/desktop
  (gate por `matchMedia('(pointer: coarse)')`).
- `stateRef.current` atualizado a cada render → sem closure velho de `onBack`/`canGoBack`.
- Durante o drag: `swipeX.set(clampDrag(dx, window.innerWidth))`.
- Release: `swipeX.set(0)`; se commit → `onBack()`; senão `animate(swipeX, 0, { type:'spring', stiffness:500, damping:42 })`.
- `pointercancel` → spring de volta.
- Renderiza `null` (puramente funcional).

### 2.5 `src/index.css`
- `body`: adicionado `overscroll-behavior-x: none` (evita rubber-band horizontal brigando
  com o gesto).

---

## 3. Cobertura de testes (`src/lib/__tests__/swipe.test.ts`)

17 testes:
- **Constantes** (limiares).
- **`shouldIgnoreTarget`**: botões, links, inputs, textarea, contenteditable
  (via `setAttribute` — jsdom não reflete `.contentEditable`), `data-no-swipe`,
  ancestral ignorado, containers `overflow-x: scroll/auto`, conteúdo comum, limite de 6 níveis.
- **`isEngaged`**: horizontal suficiente, pouco movimento, drag vertical (scroll) não
  engaja, movimento para a esquerda não engaja.
- **`shouldCommit`/`clampDrag`**: limiar de commit, clamp a `[0, fração]`, `supportsEdgeSwipe`.

---

## 4. Verificação

- `npm run lint` ✓ · `npm run test` ✓ (31 arquivos / **284 testes**) · `npm run build` ✓.
- Avisos de build pré-existentes (chunk grande da biblioteca, `bottom-[calc(1rem+env(...))]`) — inalterados.

---

## 5. Limite conhecido e evolução possível

O gesto é **web**: a tela atual acompanha o dedo via transform, e o commit/cancel decide.
A experiência de app nativo **plena** (tela anterior visível acompanhando o dedo + sombra/
elevação + transição interativa UIKit) exigiria o reconhecimento **nativo** do gesto:

- Plugin Capacitor próprio (Swift) com `UIScreenEdgePanGestureRecognizer` + eventos
  `swipeBackStarted/Changed/Completed/Cancelled` + progresso; React continua dono das rotas
  (chama `handleSystemBack()` ao completar).
- Requer **rebuild nativo** (IPA) e **Xcode** (CI) — não compilável nesta máquina Windows.
- **Recomendação se evoluir:** manter `handleSystemBack`/`canGoBack` como ponte (já prontos);
  adicionar só o reconhecimento + transição interativa nativa, sem reescrever o router.

---

## 6. Notas p/ agentes futuros

- Não duplicar a cadeia de voltar: ela vive em **`handleSystemBack`** (AppContext) — o
  `App.tsx` (Android) e o `EdgeSwipeBack` (iOS) só chamam.
- `canGoBack` é a fonte para decidir se há o que voltar (gesto inerte na raiz).
- Não reimplementar swipe entre abas/pager (Fase 9 revertida): o padrão é **pilha
  push/pop** + hash-espelho; este gesto é só o **back pela borda**.
- `data-no-swipe` existe como escape para futuras faixas que não devem iniciar o gesto
  (ex.: carrossel, campo com scroll horizontal).
- Se um dia habilitar o swipe-back nativo do WKWebView, revisar conflito de **duplo back**
  (gesto JS + `popstate` nativo).
- Atualizar `AGENTS.md`/`.context/architecture.md` se o gesto ganhar comportamento novo.