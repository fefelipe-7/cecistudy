# EST-002 — Reinvenção da Tela de Sessão de Foco (pomodoro imersivo em landscape)

> Reinvenção do pomodoro/cantinho de foco: sessão de foco **full-viewport, fundo
> preto imersivo, timer gigante** e o mínimo de botões, com o dispositivo em
> **landscape** quando possível. Abordagem em fases: **web-first** (sem rebuild
> nativo, entrega via OTA/web) e **nativo como follow-up** (plugin de orientação
> + rebuild no CI).
>
> **Data:** 2026-09-15
> **Skills aplicadas:** spec-driven-development · frontend-design · react-ui ·
> ui-ux-pro-max · planning-and-task-breakdown (viabilidade de orientação na stack)
> **Gate de validação:** `npm run lint` + `npm run test` + `npm run build` +
> `node .github/scripts/check-boundaries.mjs` verdes (Fase A); CI releases para a Fase B.

---

## Índice

| Seção | Conteúdo |
|---|---|
| [1. Contexto e problema](#1-contexto-e-problema-prd) | PRD — por quê, para quem, sucesso |
| [2. Visão da experiência](#2-visao-da-experiencia) | Fluxo + mock ASCII do landscape |
| [3. Viabilidade de orientação](#3-viabilidade-de-orientacao-landscape) | Achados na stack + estratégia em fases |
| [4. Mudanças por arquivo](#4-mudancas-por-arquivo) | Novos/alterados, arquivo a arquivo |
| [5. Componentes e refatoração](#5-componentes-e-refatoracao) | Split do StudyFocusScreen, hooks |
| [6. Critérios de aceite](#6-criterios-de-aceite-mensuraveis) | Aceite por fase |
| [7. Casos de borda](#7-casos-de-borda) | background, notificações, desktop, ciclos |
| [8. Gate de verificação](#8-gate-de-verificacao) | Comandos exatos |
| [9. Não-escopo e follow-ups](#9-nao-escopo-e-follow-ups) | — |
| [10. Decisões abertas](#10-decisoes-abertas) | — |

---

## 1. Contexto e problema (PRD)

### Problema

A tela de foco atual (`src/components/estudos/StudyFocusScreen.tsx`, 259 linhas)
é um **card rosa-claro dentro de uma coluna `max-w-md`**, em orientação
**retrato**, cercado de distrações: header do app, texto "cantinho de foco ceci",
pills de presets, picker custom, dica do cecinho e o fluxo de salvar sessão tudo
na mesma rolagem. Visualmente é "mais uma tela do app" — não um **modo de foco**.

O objetivo declarado da usuária: ao entrar na sessão de foco o app deve se
transformar numa **experiência imersiva de app nativo** — landscape, fundo preto,
só um timer bem grande e poucos botões. "Focar de verdade" = remover toda a
atmosfera do app da vista durante a sessão.

### Justificativa

1. **Imersão reduz carga cognitiva lateral**: tela cheia + contraste + poucos
   alvos tocam convidam a ficar; a UI atual compete com o conteúdo.
2. **Landscape é a morfologia natural de um timer de mesa**: largura sobra para
   dígitos gigantes; o usuário não precisa segurar o aparelho na mão — pode
   apoiar (kickstand/capinha) e olhar de longe.
3. **Fundo preto economiza bateria em AMOLED** e acompanha apps de foco
   (Headspace, Forest, pomodoro apps) — familiaridade de interação nativa.
4. **Fidelidade é o campo de batalha do recurso**; a tela atual celebra e distrai
   ao mesmo tempo, minando a própria proposta do pomodoro.
5. **Custo baixo**: a lógica de timer/saldar sessão já existe e é boa
   (presets 25/45/15 + custom + salvar parcial). A reinvenção é **apresentação +
   shell**, não novo domínio — não muda schema (nada persistido de novo além do
   que já existe).

### Usuária e sucesso

- **Quem:** a própria usuária (Ceci), uso individual, mobile-first (Celular + PWA).
- **Sucesso:** entrar em "foco" = a tela vira só um timer, ela para de usar o
  aparelho, e ao fim a sessão é guardada como hoje (tema + disciplina opcionais).
- **Não-sucesso:** depender de rebuild nativo para funcionar; desktop quebrado;
  retorno ao app retrato travado em landscape.

---

## 2. Visão da experiência

### Fluxo proposto

1. Estudos → "começar sessão de foco" (mesmo gatilho de hoje: `openStudy('focus')`).
2. A pilha `[estudos, study focus]` abre e o `StudyFocusScreen` **monta uma camada
   imersiva via `createPortal(document.body)`** — preto absoluto (`#0B0B0C`),
   cobrindo header, conteúdo e (já oculta) bottom nav.
3. O dispositivo vai para landscape quando possível (ver §3) e o layout se ajusta:
   timer gigante à esquerda/centro, controles discretos.
4. Tap no timer = pausar/retomar. Botões: pausar/retomar (primário), reiniciar
   (com confirmação se >0 min), **guardar parcial** (se ≥1 min decorrido).
5. Fim do timer → celebração + sheet de "guardar sessão" (tema + disciplina,
   mesmos campos de hoje) sem abandonar o preto.
6. Ao sair/voltar: destrava orientação, restaura status bar/theme-color, header
   do app reaparece.

### Mock ASCII — landscape (retrato degrada para a mesma pilha, centralizada)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│              25 : 00                ┌───────────────────────────┐         │
│                                    │ toque no timer = pausar   │         │
│            ciclo pomodoro          │  ou retomar              │         │
│              foco 2/4              └───────────────────────────┘         │
│                                                                           │
│   ┌────────────┐     ┌──────────┐     ┌──────────────────────┐            │
│   │   pausar   │     │ ↺ zera   │     │  ♡ guardar 5 min     │            │
│   └────────────┘     └──────────┘     └──────────────────────┘            │
│                                                                           │
│   dica do cecinho: uma coisa de cada vez, com carinho ✨                   │
└───────────────────────────────────────────────────────────────────────────┘
    ↑ safe-area left (notch)                                              ↑ right
```

Princípios de design (frontend-design + ui-ux-pro-max):

- **Uma assinatura, tudo quieto ao redor**: o timer é a única coisa "viva". Sem
  gradientes, sem blur, sem pills coloridas. Dígitos em `font-mono`
  (JetBrains Mono, que já existe no design system) ou `font-display` — dígitos
  tabulares mono leem como instrumento; decidir no item de implementação (mock
  assume mono). Cor: branco `#FFFFFF` sobre `#0B0B0C` (contraste ≈19.5:1 ≫ 4.5:1).
  Aceno da marca: o anel de progresso suave em `ceci-brand` (~1 cor no fundo preto).
- **Timing honesto**: anel de progresso **linear discreto** + dígitos. Nada de
  números "pulsando" a cada segundo; `prefers-reduced-motion` respeitado (config
  global `MotionConfig reducedMotion="user"` já cobre).
- **Toque**: alvos ≥64px no primário (pausar), ≥44px nos secundários; `active:scale`
  já padrão. Landscape não tem rebarba de polegar — botões no centro-lado direito.
- **Copy**: pt-BR lowercase, tom do cecinho mantido mas esparso. A dica continua,
  discreta, uma linha.

---

## 3. Viabilidade de orientação (landscape)

### Achados verificados no código

| # | Achado | Impacto |
|---|---|---|
| A1 | **Não existe plugin de orientação** no `package.json` (só `screen`/`splash`/`status-bar`/`keyboard`/`app`/`preferences`/`sqlite`/`local-notifications`…). | Fase B exige **nova dependência** + `npx cap sync` + **rebuild nativo** (só no CI; esta máquina Windows não compila Android/iOS). |
| A2 | `public/manifest.json` declara `"orientation": "portrait"`. | Em PWA instalada (`display: standalone`) o **landscape fica bloqueado na raiz** — trava até plugin nativo. |
| A3 | Zero usos de `screen.orientation`/`orientationchange` em `src/` (grep). | Campo livre; não há código legado de rotação a proteger. |
| A4 | `index.html` já usa `viewport-fit=cover` + `user-scalable=no` + `apple-mobile-web-app-status-bar-style=black-translucent`. | Safe areas `env(safe-area-inset-*)` funcionam; status bar pode sobrepor (uma das mattresses p/ imersão). |
| A5 | `@capacitor/status-bar` **já instalado** (config: `overlaysWebView:false`, `style:DARK`). | Dá para acender **status bar imersiva clara em runtime nativo sem nenhuma dependência nova** (Fase A). |
| A6 | `isBottomNavVisible` = só quando topo da pilha é `tab` (`packages/navigation/src/derive.ts:186`) → **bottom nav já some** na tela de foco. | Sobra só o header para esconder. |
| A7 | `headerConfig` monta header `detail` para `kind==='study'` (`src/lib/headerConfig.ts:248`). | Precisa virar "sem header" no modo focus. |
| A8 | APIs: `screen.orientation.lock()` exige **Fullscreen API** no Chromium; **iOS Safari/PWA não suporta** `lock` (rotação fica com o SO). | Estratégia em fases obrigatória (§3.1). |

### Estratégia em fases

#### Fase A — Web-first (sem rebuild; entrega por web/OTA)

Tudo que **não** exige build nativo:

1. **`manifest.json`**: `"orientation": "portrait"` → `"any"` (A2). Trade-off
   documentado: o resto do app é **portrait-safe** (coluna `max-w-md` centrada
   degrada bem em landscape); só o foco é *desenhado* para landscape.
2. **Lock progressivo onde o browser permite** (Chromium/Android WebView/desktop):
   ```ts
   // src/lib/focusOrientation.ts (esboço)
   export async function requestFocusLandscape(): Promise<boolean> {
     try {
       if (!document.fullscreenElement && document.documentElement.requestFullscreen)
         await document.documentElement.requestFullscreen();
       const so = (screen as any).orientation;
       if (so?.lock) { await so.lock('landscape'); return true; }
     } catch { /* degrada silencioso */ }
     return false;
   }
   export async function releaseFocusOrientation(): Promise<void> {
     try {
       const so = (screen as any).orientation;
       if (so?.unlock) await so.unlock();
       if (document.fullscreenElement && document.exitFullscreen)
         await document.exitFullscreen();
     } catch { /* no-op */ }
   }
   ```
   Sempre `try/catch`: **landscape é aprimoramento, não requisito** — no iOS
   Safari o app simplesmente aproveita quando o SO roda o aparelho; em retrato a
   camada imersiva continua funcionando (centralizada).
3. **Status bar/theme-color** (A5, sem dep nova):
   - Nativo: `StatusBar.setOverlaysWebView({ overlay: true })` +
     `StatusBar.setStyle({ style: 'LIGHT' })` ao entrar; restaurar ao sair
     (Valor default da config: DARK + `overlaysWebView:false`).
   - Web: trocar `<meta name="theme-color">` para `#0B0B0C` (helper no mesmo lib,
     mutando o meta tag; restaura ao sair).
   - Tudo chamado pelo **hook do shell/screen**, nunca "no ar" — ver §5.
4. **Layout full-viewport** via portal (§5) — funciona em QUALQUER plataforma e
   em retrato/landscape; o CSS media query faz micro-ajustes de espaçamento em
   landscape (`@media (orientation: landscape)`).

#### Fase B — Nativo (plugin de orientação; exige rebuild no CI)

1. `npm i @capacitor/screen-orientation` (official) + `npx cap sync`
   (android/ios commitados).
2. No lib da Fase A, quando `Capacitor.isNativePlatform()`:
   ```ts
   const { ScreenOrientation } = await import('@capacitor/screen-orientation'); // dinâmico (P-perf)
   await ScreenOrientation.lock({ orientation: 'landscape-primary' });
   // … e ao sair: await ScreenOrientation.unlock();
   ```
   Import **dinâmico** (padrão já usado em `exportImport.ts`/`permissions.ts` p/
   não inflar chunk web).
3. **Config nativa:** garantir que `ios/App` permite landscape
   (`UISupportedInterfaceOrientations` −iPhone + `UISupportedInterfaceOrientations~ipad`
   incluírem `landscape*`) e Android mantém portrait default no manifest —
   plugin passa a ganhar o controle em runtime.
4. **Gate:** só pode ser validado no CI (`release.yml`/`release-desktop.yml` /
   pipeline mobile); PR da Fase B roda `npm run build` + `cap sync` e o release
   nativo assina APK/IPA. Documentar manual de QA no device (rotação, notch,
   marteladas de app em background).

---

## 4. Mudanças por arquivo

| Arquivo | Ação | Motivo |
|---|---|---|
| `src/lib/focusOrientation.ts` | **NOVO** | `requestFocusLandscape` / `releaseFocusOrientation` / `isLandscapeViewport` + `applyFocusChrome` / `restoreFocusChrome` (theme-color + status bar). Sem imports estáticos de Capacitor p/ manter web limpo. |
| `src/lib/focusController.ts` | **NOVO** | Mini store estável (pub/sub) com `isRunning()`, `isActive()`, `emitBackRequested()` — usada pelo shell (guarda de back) e pela view (modal de confirmação). Mantém a camada visual fora de `isDesktop/Capacitor` (regra shared). |
| `src/lib/useFocusTimer.ts` | **NOVO** | Timer **por relógio de parede** (`endAt = Date.now()+restante`), pausa/retoma/zera, `remaining` derivado de `Date.now()` a cada tick (500ms) — sobrevive a background (ver §7). Loop de efeito colateral fora da view. |
| `src/components/estudos/FocusImmersiveView.tsx` | **NOVO** | A camada imersiva: `createPortal(document.body)` + `fixed inset-0 z-[45]` fundo `#0B0B0C`, timer gigante, botões, anel de progresso, dica do cecinho, sheets de salvar/confirmar (reusa `Modal`/`Picker`/`PillGroup`). Consome `useFocusTimer` + `useMobileApp` (courses, handleAddSession, showToast). |
| `src/components/estudos/StudyFocusScreen.tsx` | **Editar** | Vira **orquestrador fino** (estado da sessão preservado; agora delega visual para `FocusImmersiveView`). Manter rota/pilha intactas (lazy já aponta aqui). |
| `src/shells/SharedScreenLayers.tsx` | **Editar** | Nenhuma mudança de contrato; o lazy continua `loadStudyFocusScreen`. (Se preferir, apontar direto o lazy para `FocusImmersiveView` — decisão de implementação.) |
| `src/shells/MobileAppShell.tsx` | **Editar** | (1) Não renderizar `HeaderNav` quando `app.isFocusImmersiveOpen`; (2) no back (`handleSystemBack`), chamar `focusController` antes — se há sessão em andamento, cancela a navegação e emite `backRequested`. |
| `src/lib/headerConfig.ts` | **Editar** | `kind==='study' && screen==='focus'` → `null` (sem header). |
| `packages/navigation/src/derive.ts` | **Editar** | Novos derivados: `isFocusImmersiveOpen` (`focusedStudyScreen === 'focus'`) + `slideKey` imersivo. (Lógica pura em `packages/navigation` como regra da fronteira.) |
| `src/index.css` | **Editar** | Tokens `--color-focus-bg: #0B0B0C`, `--color-focus-primary: #FFFFFF`, classe helper `.focus-immersive` (safe-area padding `env(safe-area-inset-*)`, `overscroll-behavior:none`, `user-select:none`, `-webkit-user-select:none`), `@media (orientation: landscape)` micro-ajuste. |
| `src/index.html` | **Editar** (opcional) | Nada a fazer já; `viewport-fit=cover` ok. (theme-color é mutado em runtime.) |
| `public/manifest.json` | **Editar** | `orientation: portrait` → `any` (ver §3, A2). |
| `src/lib/__tests__/focusOrientation.test.ts` | **NOVO** | Testa lock/unlock/fallback com `screen.orientation` mockado (jsdom) + restauração de status. |
| `src/lib/__tests__/focusTimer.test.ts` | **NOVO** | Fake timers: contagem, pausa/retoma, conclusão, **background** (simular `Date.now()` saltar). |
| `src/lib/__tests__/focusController.test.ts` | **NOVO** | pub/sub, guarda de back premida/liberada. |
| Fase B: `package.json` + `capacitor.config.ts` (se necessário) + `android/`+`ios/` | **Editar (CI)** | `@capacitor/screen-orientation` + `cap sync`; oriétations do iOS; QA device. |

**Fronteiras** (`check-boundaries.mjs`): nada acima importa `apps/desktop` de
`src/lib`/`src/components`; os únicos branches de plataforma são o hook
`useFocusChrome` chamado a partir de `MobileAppShell`/shell (fora do conjunto
"shared UI não branca"), e o lib nunca referencia `isDesktop`/`Capacitor` fora de
`focusOrientation` (que pode, é `src/lib`). `FocusImmersiveView` **não** chama
`isDesktop`/`Capacitor` — usa só web APIs guardadas e o `focusController`.

---

## 5. Componentes e refatoração

### 5.1 Divisão de responsabilidades do foco

```
StudyFocusScreen (routing point, estado leve)
 │
 ├─ useFocusTimer()            → tempo (parede), running, controls
 ├─ useMobileApp()             → courses, handleAddSession, showToast
 │
 └─ FocusImmersiveView (portal → body, full-viewport)
     ├─ relógio gigante + anel de progresso
     ├─ eixo de botões: pausar/retomar · reiniciar · guardar parcial
     └─ sheets no final/parcial: tema + disciplina (Picker/Modal existentes)
        • Modal z-50 > overlay z-[45] → o sheet aparece ACIMA do preto
```

### 5.2 Dois detalhes técnicos críticos (riscos reais)

1. **`fixed` dentro de ancestral com transform quebra o full-bleed.** O conteúdo
   do slide é envolto por `<motion.div style={{ x: swipeX }}>` (ver
   `MobileAppShell.tsx:135`) — elemento com transform vira *containing block* do
   `fixed`. Por isso a camada imersiva **deve** sair do slide via
   `createPortal(..., document.body)` (padrão já usado pelo `Modal`). Sem isso o
   "preto absoluto" fica preso à coluna `max-w-md`.
2. **Escada de z-index.** `Modal` (save/confirm) é `z-50`. O overlay imersivo deve
   ser **`z-[45]`** (acima do header `z-40`, abaixo dos modais `z-50`) — senão as
   sheets de guardar ficam escondidas atrás do preto.

### 5.3 Guarda de saída (back/voltar padrão nativo)

- `MobileAppShell` (mobile): no handler de `backButton` e no pré-`handleSystemBack`,
  `if (focusController.isRunning()) { focusController.emitBackRequested(); return; }`.
  A `FocusImmersiveView` escuta `backRequested` → abre o modal
  "encerrar sessão agora?" com opção **guardar parcial** (≥1 min) + `cancelar`.
- `EdgeSwipeBack` (web): comportamento de commit chamará o mesmo caminho; o gesto
  continua visual, mas a navegação é barrada e o confirm aparece.
- **Desktop** (`DesktopAppShell` / `DesktopTopbar`): topbar some durante o foco
  (já brancha em `focusedStudyScreen`; adicionar guarda `isFocusImmersiveOpen`),
  e Esc/atalho de back usa a mesma `focusController.emitBackRequested()`.

### 5.4 Registro de sessão (comportamento preservado)

- Fim do timer → `celebrate('session-done')` + `hapticSuccess()` + sheet de guardar
  (tema + disciplina — campos atuais).
- Guardar parcial: botão discreto "♡ guardar X min" (visível se `elapsed ≥ 1`).
- Toast "sessão de estudo registrada com carinho ♡" (mesmo copy atual).
- `handleAddSession` já recebe `durationMinutes` — para parcial, usar minutos
  decorridos (arredondados, mínimo 1), igual hoje.

### 5.5 Ciclo pomodoro (opcional, marco P2)

Modelo simples e não persistente (estado de sessão, não de banco):
`foco 25′ → pausa curta 5′ → … ×4 → pausa longa 15′`. Fase do relógio + contador
"foco 2/4" no canto (mock). Sem novo schema; o plugin só estende a mesma pilha de
estado de fase. **Não bloquear a Fase A por isso** — entrega incremental (spec §9).

---

## 6. Critérios de aceite (mensuráveis)

### Fase A (web/OTA)

- [ ] **AC1 — Imersão full-bleed:** ao abrir foco, existe camada `fixed inset-0`
  fundo `#0B0B0C` via portal; header e conteúdo do app **não são visíveis** e a
  bottom nav continua oculta (já era). Até em retrato.
- [ ] **AC2 — Landscape:** com `manifest.orientation=any` + aparelho deitado
  (PWA standalone Chromium/Android): foco ocupa a tela deitada, insets
  `env(safe-area-inset-left/right)` ≥ notch respeitados. No iOS Safari a rotação
  é manual (SO) e tudo continua utilizável.
- [ ] **AC3 — Timer por relógio de parede:** um teste com `Date.now()` salto
  (background simulado, ≥1min) prova que `remaining` está correto; sem esse teste
  o item não conta como pronto.
- [ ] **AC4 — Controles mínimos:** 1 tap no timer pausa/retoma; botões
  reiniciar e guardar parcial presentes; reiniciar com elapse>0 exige confirmação
  e oferece guardar parcial; guardar guarda sessão real (`handleAddSession`) e dá
  toast.
- [ ] **AC5 — Saída limpa:** ao sair do foco, orientação destravada (se travada),
  fullscreen desfeito (se pedido), theme-color/status bar restaurados; re-abrir
  foco funciona. Testado via `focusOrientation.test.ts`.
- [ ] **AC6 — Background/kill:** reabrir o app (mesmo batendo 1min em background)
  não deixa "tela preta fantasma" nem orientation travada (limpeza idempotente no
  boot — `releaseFocusOrientation()` chamado por segurança no boot do app).
- [ ] **AC7 — Desktop íntegro:** desktop abre o foco imersivo (mesmo overlay),
  Esc/back sai com confirmação se contando, sem chamada de orientação que erre
  (console sem erro); `check-boundaries.mjs` verde.
- [ ] **AC8 — A11y:** botões com `aria-label`; timer `role="timer"` + label
  estático; contraste ≥ 4.5:1 em todos os textos sobre preto; `focus-visible`
  visível; reduzido-motion respeitado.
- [ ] **AC9 — Performance:** `StudyFocusScreen` continua em chunk lazy pré-carregado
  (`preloadScreenChunks`); camada imersiva monta em <300ms após o open (portal +
  zero refetch); nenhum novo import estático de Capacitor/desktop no caminho web.

### Fase B (nativo — CI)

- [ ] **AC10:** em Android/iOS, `ScreenOrientation.lock('landscape-primary')` ao
  abrir e `unlock()` ao sair, com topbar/notch ok nos dois sentidos.
- [ ] **AC11:** iOS permite landscape no target (Info.plist), Android portrait
  default no resto do app.
- [ ] **AC12:** APK/IPA de QA no release (CI) com o plugin instalado; manual QA
  documentado (rotação rápida, martelada de background, OTA coexistindo).

---

## 7. Casos de borda

| Caso | Tratamento |
|---|---|
| Usuário sai do foco com timer rodando | Guarda de volta (back/swipe/Esc) → confirm "encerrar já?" com opção guardar parcial. Sem surpresa. |
| App vai a background / trava | Timer por `endAt` (AC3); `pause`/`resume` do Capacitor não "congela" o relógio; retomada mostra o tempo real decorrido. |
| Notificação local (lembrete) dispara durante o foco | Sistema cuida (placa própria); nada de especial na camada. Se o app reaparece, timer segue via parede. |
| Kill durante foco em landscape | No boot, chamada idempotente `releaseFocusOrientation()` (fora do foco em si) — nunca abre preso em landscape/fullscreen. |
| `manifest.orientation=any` deixar o resto do app rotativo | Aceito/portrait-safe: coluna `max-w-md` centralizada + `user-scalable=no`; landscape não quebra nenhuma view atual (verificar visualmente no QA da Fase A). |
| iOS Safari sem `lock` | Fallback silencioso (`try/catch`); o layout já é full-bleed em qualquer orientação (landscape = aprimoramento). |
| Desktop (janela não rotaciona) | Overlay imersivo vale para as duas cascas (portal → body); a API de orientação no desktop é no-op/retorna; topbar oculta via `isFocusImersiveOpen`. |
| Ciclo pomodoro múltiplas fases | Estado de fase não persiste (sessão efêmera) — decisão registrada; se persistência for desejada, virar `usePersistentState` gera `MIGRATIONS`/`SCHEMA_VERSION` novo (SÓ se formato do banco mudar — não é o caso aqui). |
| Abrir outro modal por cima (ex.: onboarding/permissões) | `Modal` continua `z-50` > overlay `z-[45]`; nada quebra. |
| `prefers-reduced-motion` | Global `MotionConfig` já degrada; overlay usa fade simples. |

---

## 8. Gate de verificação

```bash
npm run lint                                              # tsc --noEmit (0 erros)
npm run test                                              # vitest (novos: focusOrientation, focusTimer, focusController)
npm run test -- src/lib/__tests__/focusOrientation.test.ts  # teste único p/ iterar
npm run build                                             # dist/ gerado
node .github/scripts/check-boundaries.mjs                 # 0 violações (toca src/components, SharedScreenLayers, shells)
```

Fase B (não roda local — máquina Windows sem JDK/SDK/Xcode):
`npm run build` + `npx cap sync` no CI; validação em device via APK/IPA do release
(`.github/workflows/release.yml`) e QA manual documentado no PR.

---

## 9. Não-escopo e follow-ups

- **Não** altera schema/persistência de sessão (fluxo `handleAddSession` intacto).
- **Não** implementa swipe entre abas, gestos extras, sounds/opções de "tick".
- Ciclo pomodoro (5.5) e ajustes finos de tipografia (mono vs display) são
  **marcos P2** desta spec, entregues depois da Fase A.
- Melhoria futura: leitura da meta diária/streak embutida no fim do foco (sem
  nova tela).

---

## 10. Decisões abertas

1. **Fonte dos dígitos:** JetBrains Mono (instrumento) vs Plus Jakarta Sans
   display (calor) — mock assume mono; fechar com a usuária no review visual.
2. **`manifest.orientation=any` (Fase A)** vs manter `portrait` e aceitar que
   landscape-só-via-plugin (move landscape inteiro para a Fase B). Padrão
   proposto: `any` + portrait-safe (menor custo, correção imediata via OTA).
3. **Fase B:** `@capacitor/screen-orientation` official
   (vs community `capacitor-screen-orientation` — mesmo com o plugin oficial,
   manter fallback nos dois durante a QA em device).
4. **Desktop:** foco imersivo full-viewport em ambas cascas (proposto) vs apenas
   mobile (desktop mantém o card atual). Proposta: full-viewport — consistência
   e o custo é o mesmo overlay.