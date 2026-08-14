# Plano de Animações & Transições (iOS-like)

> Documento de referência do trabalho de animação do cecistudy. (pt-BR)
> Objetivo: tornar o app fluido, com transições direcionais estilo iOS e
> micro-interações "inteligentes" (data-driven). Base para a execução em andamento.

## 1. Objetivo

Levar o cecistudy a um patamar de app **nativo de verdade** (web/PWA + Android/iOS):
- **Transições de tela direcionais** (push/pop da pilha de navegação), estilo iOS.
- **Modais/sheets** com spring e **drag-to-dismiss**.
- **Micro-interações data-driven** (progresso, contadores, toggles, mood, flashcards).
- **Acessibilidade**: respeito a `prefers-reduced-motion`.
- Manter performance (só `transform`/`opacity`, sem `layout` em listas grandes).

## 2. Decisões (validadas com o usuário)

- **Escopo:** tudo (Fases 1–4).
- **Estilo de transição:** slide lateral direcional (push entra da direita, pop volta
  para a esquerda), com leve parallax/scale da tela que sai.
- **Classes inertes:** trocar por **motion real** (framer-motion, já instalado) — **não**
  instalar `tailwindcss-animate`.

## 3. Diagnóstico do estado atual

### O que realmente anima hoje
- `framer-motion`/`motion` estão instalados, mas só 3 arquivos usam motion de verdade:
  - `components/views/HomeView.tsx` (entrada fade-up, `whileTap`/`whileHover`, `AnimatePresence`
    nas tarefas/sugestões).
  - `components/ui/bottom-nav-bar.tsx` (entrada spring + label que expande no item ativo).
  - `components/ui/floating-action-menu.tsx` (FAB girando + menu com blur/spring).
- Micro-interações CSS (`hover:`, `active:scale-*`, `transition-colors/transform`) em boa parte
  dos botões/cards — funcionam.
- Header com "shrink" ao rolar (scroll listener + `transition-all`) — funciona.
- Haptics (`tap`/`success`/`warning`) em ações-chave — funciona no nativo.

### Achado importante (bug silencioso)
Todas as views, todos os modais e o toast declararam classes `animate-in`, `fade-in`,
`slide-in-from-bottom-2`, `animate-fade-in`, `duration-200/300`… mas **não existe** o plugin
`tailwindcss-animate` nem `@keyframes` de `fade-in` no projeto (verificado em `package.json`,
`src/index.css`, configs). Resultado: **essas classes são inertes** — views trocam, modais
abrem e o toast aparece *instantaneamente* (pop, sem animação). Só a Home realmente animava
na entrada.

### Navegação
- `AppContext` já mantém uma **pilha push/pop** (`navigationStack`), mas o `AppShell` trocava
  as views com um `if/else` simples — sem cross-fade. Base perfeita para transição direcional.
- Telas auxiliares empilhadas: `course`, `notes`, **`temple`** (recurso "templo de conhecimento"
  adicionado concorrentemente à sessão), `mood`.

### Outros
- Sem suporte a `prefers-reduced-motion`.
- Muitos stats ainda são dummy (backlog #9) — animações devem ser **data-driven** quando possível.

## 4. Arquitetura de animação

### `src/lib/motion.ts` (criado)
Tokens e variants compartilhados, fonte única para todas as transições:
- `iOS_SPRING`, `TAP_SPRING`, `OVERLAY_FADE` (transições reutilizáveis).
- `screenVariants(direction)` — variants direcionais (1 = push, -1 = pop, 0 = fade sutil para
  troca de aba). Entry da direita/esquerda + parallax na saída.
- `sheetVariants` — por posição (`center` scale+fade, `top` slide-down, `bottom` slide-up).
- `staggerContainer` / `staggerItem` — entrada escalonada de listas/cards.
- `fadeSlide` — fade + slide para headers/toasts.

### `MotionConfig reducedMotion="user"`
Envolve toda a app no `App` (raiz), garantindo acessibilidade global — qualquer dispositivo
com "reduzir movimento" desativa animações automaticamente.

## 5. Fases de execução

### Fase 1 — Fundação
- [x] Criar `src/lib/motion.ts`.
- [x] Envelopar app em `<MotionConfig reducedMotion="user">` (`src/App.tsx`).
- [ ] Remover classes inertes (`animate-in`, `fade-in`, `slide-in-from-*`, `animate-fade-in`)
  das views/modais/header e trocar por motion real (em andamento).

### Fase 2 — Transições de tela direcionais (push/pop)
- [x] `AppContext`: expor `screenKey` (ex.: `tab-home`, `course-c3`, `notes`, `temple`, `mood`)
  e `navDirection` (`1` push / `-1` pop / `0` troca). Centralizado em `setStack(next)` que deriva
  a direção comparando o tamanho da pilha anterior (via `navigationStackRef`).
- [x] `AppShell` (`src/App.tsx`): `<AnimatePresence mode="popLayout" custom={navDirection}>`
  + `motion.div` keyed por `screenKey` usando `screenVariants`. `initial={false}` na 1ª mount.
- [x] `HeaderNav`: `AnimatePresence mode="wait"` para "morph" brand↔detail (variants `fadeSlide`).
- [x] `bottom-nav-bar.tsx`: "pill mágica" com `layoutId="bottomnav-active-pill"` deslizando entre
  abas (mantém o label que expande). Ícone/label com `relative z-10`.

### Fase 3 — Sheets (modais iOS)
- [x] Upgrade de `ui/Modal.tsx`: `AnimatePresence` + backdrop fade + variants por posição +
  **drag-to-dismiss** (bottom) via `useDragControls` + handle "grabber". Mantém props (`open`,
  `onClose`, `children`, `className`, `position`, `closeOnBackdrop`).
- [x] `QuickAddModal` → `Modal` position `bottom` (bottom-sheet mobile / center desktop).
- [x] `GlobalSearchModal` → `Modal` position `top`.
- [x] `ReaderModeModal` → `Modal` position `center` (`closeOnBackdrop={false}`).
- [x] `Toast` → spring slide-up + exit com `AnimatePresence` (wrapper estático centraliza; motion
  interno evita conflito de transform com `-translate-x-1/2`).
- [ ] Validar modais que já usavam a primitiva (`ClassNoteModal`, `EditCourseModal`,
  `BookDetailModal`, `LibraryFilterModal`) — ganham animação automaticamente; revisar positions.

### Fase 4 — Micro-interações inteligentes (data-driven)
- [ ] `ui/AnimatedNumber.tsx` (novo) — count-up com `useSpring`/`useTransform`.
- [ ] `ui/ProgressBar.tsx` — spring na largura da barra (substituir `transition-all`).
- [ ] Progresso real animado: cursos, leituras (`readPages`), TCC.
- [ ] Toggle de tarefa/prova: "check" com pop + haptic (haptic já existe).
- [ ] Salvar mood: celebração leve (emoji bounce) antes de voltar para home.
- [ ] Flashcards **swipeable** (drag horizontal p/ próximo/anterior, mantendo flip no toque).
- [ ] Stagger sutil de cards por view (30–50ms).

### Qualidade / verificação
- [ ] `npm run lint` (`tsc --noEmit`) limpo.
- [ ] Teste manual `npm run dev`: trocar abas, abrir curso/notas/templo/mood, abrir cada modal,
  toast, timer, toggles, mood; ativar "reduzir movimento" no SO e confirmar.
- Regras: só `transform`/`opacity` nas transições; sem `layout` em listas grandes;
  `reducedMotion` global; `will-change` pontual.

## 6. Arquivos envolvidos

**Novos**
- `src/lib/motion.ts`
- `src/components/ui/AnimatedNumber.tsx` (a criar)

**Modificados**
- `src/App.tsx` — MotionConfig + AnimatePresence direcional.
- `src/context/AppContext.tsx` — `screenKey`, `navDirection`, `setStack`, temple nodes.
- `src/components/HeaderNav.tsx` — morph brand/detail.
- `src/components/ui/bottom-nav-bar.tsx` — pill com layoutId.
- `src/components/ui/Modal.tsx` — sheets + drag-to-dismiss.
- `src/components/ui/Toast.tsx` — spring + exit.
- `src/components/ui/ProgressBar.tsx` — spring.
- `src/components/QuickAddModal.tsx`, `src/components/GlobalSearchModal.tsx`,
  `src/components/widgets/ReaderModeModal.tsx` — migrados para a primitiva Modal.
- Views (raiz) — remover classes inertes + stagger/motion: `HomeView`, `FaculdadeView`,
  `EstudosView`, `BibliotecaView`, `PerfilView`, `CourseDetailView`, `EstadoDeEspiritoView`,
  `NotesScreen`/`TempleScreen`.

## 7. Notas / riscos

- **Concorrência:** durante a sessão, o recurso "templo de conhecimento" (`temple` /
  `TempleScreen`) foi adicionado por edits concorrentes. O plano de animação **preserva** essa
  feature (inclusão de `temple` no `screenKey`, handlers, header) — não a implementa nem a remove.
- `popLayout` com window scroll: a tela que sai é "popped" do fluxo; o `scrollTo({top:0})` nos
  handlers de navegação roda junto com a transição. Aceitável; validar na prática.
- `motion` (transform) conflita com classes Tailwind de `translate` (`-translate-x-1/2`) — por
  isso o Toast usa um wrapper estático e o motion interno só anima `y`/`opacity`.
- Modais que já usavam a primitiva `Modal` herdam a nova animação sem mudança de API.

## 8. Progresso (checklist rápido)

- [x] F1 motion.ts + MotionConfig
- [x] F2 screenKey/navDirection + AnimatePresence direcional + header morph + bottom nav pill
- [x] F3 Modal upgrade + QuickAdd + GlobalSearch + Reader + Toast
- [x] F3 validação dos modais via primitiva
- [x] Remoção das classes inertes nas raízes das views
- [x] F4 AnimatedNumber + ProgressBar spring
- [x] F4 micro-interações (toggle check pop + mood emoji bounce + AnimatedNumber nos stats)
- [x] F4 flashcards swipeable
- [x] Verificação final (tsc --noEmit limpo + build Vite OK)
