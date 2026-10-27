# Plano · Motion onda 2 — cobertura total e container transform

> Status: proposta — **nada implementado**
> App: mobile (`cecistudy/`)
> Base: `SPEC-M-027` (F0..F9 entregues; F10 pendente) e `tasks/todo-motion-design.md`
> Data: 2026-10-26
> Regra: este plano é o **diagnóstico e o porquê** da **`SPEC-M-028`** (aceita em
> 2026-10-27). O roteiro executável, com checkbox e progresso, é
> [`todo-motion-onda-2.md`](todo-motion-onda-2.md). A spec é o contrato; o plano
> explica; o todo executa.
> **Atualizado em 2026-10-27** com a decisão D25/D26: o morph é uma **camada de
> clone**, não um par de `layoutId`. As seções 4 e 5 abaixo já descrevem o
> mecanismo novo — o spike de `layoutId` foi descartado porque a tela de origem
> desmonta em todo push com early return.

---

## Objetivo primário

Ao tocar num card, o card **vira a tela** — cresce no lugar, o conteúdo troca com
crossfade e a tela não desliza por baixo dele. A mesma gramática vale para
**todos** os cards que abrem detalhe, sheet ou modal do app, não só os dois pares
que a primeira onda entregou.

O teste de sucesso é visual e comparativo: abrir uma disciplina, uma família, uma
abordagem e um capítulo do TCC deve parecer **o mesmo gesto**, com a mesma
física, em qualquer aba.

---

## 1. O que a primeira onda entregou

| Peça | Estado | Evidência |
|---|---|---|
| Tokens em 6 famílias | ✅ | `src/lib/motion/tokens.ts:186-230` |
| Preferência `sistema/reduzido/completo` | ✅ | `src/components/motion/MotionPreferenceGate.tsx` |
| Overlays endurecidos (`Modal`) | ✅ | `src/components/ui/Modal.tsx:44-77`, `src/lib/overlayStack.ts` |
| Scroll restaurado por tela | ✅ | `src/lib/scroll.ts`, `src/shells/SlideScreen.tsx` |
| Reveal com observer único | ⚠️ **3 listas** | `src/components/library/NotesScreen.tsx:231`, `src/components/estudos/StudyHistoricoScreen.tsx`, `src/components/views/perfil/ProfilePreferences.tsx` |
| Shared element nota → detalhe | ✅ | `src/components/library/NotesScreen.tsx:232`, `src/shells/MobileAppShell.tsx:228` |
| Shared element disciplina → detalhe | ⚠️ **par existe, mas a tela desliza** | `src/components/views/faculdade/DisciplinasGrid.tsx:70`, `src/components/views/CourseDetailView.tsx:83` |
| Microinterações | ⚠️ **família `micro` sem consumidor** | `src/lib/motion/tokens.ts:186`; `0` usos de `TOKENS.micro` fora de `src/lib/motion/` |
| Ambiente | ⚠️ **2 pontos, intensidade provisória** | `src/components/views/home/HeroSection.tsx`, `src/components/views/EstudosView.tsx`; `ambient: 12` em `src/lib/motion/tokens.ts:118` |
| Bundle | ✅ | `artifacts/bundle-report.json` |

---

## 2. O que ficou de fora (com evidência)

### 2.1 Card → detalhe: 2 pares de ~10

| Fluxo | Origem | Destino | Estado |
|---|---|---|---|
| Nota → detalhe | `NotesScreen.tsx:232` | overlay `MobileAppShell.tsx:228` | ✅ |
| Disciplina → detalhe | `DisciplinasGrid.tsx:70` | `CourseDetailView.tsx:83` | ⚠️ par existe |
| Família → detalhe | `FamiliesView.tsx:56-59` | `FamilyDetailView.tsx:26-45` | ❌ |
| Abordagem → detalhe | `FamilyDetailView.tsx:59-62` | `ApproachDetailView.tsx:157-177` | ❌ |
| Templo → seção | `TempleScreen.tsx:122` | `AuthorsScreen`/`ConceptsScreen`/`TechniquesScreen`/`ComparisonsScreen` | ❌ |
| Grupo de quiz → detalhe | `QuizGroupSelector.tsx:94` | `QuizGroupDetail.tsx:62` (hero) | ❌ |
| Caso de estágio → tela | `InternshipDiaryView.tsx:234` | `InternshipCaseView.tsx` (hero) | ❌ |
| Capítulo do TCC → sheet | `TccView.tsx:670` | `ChapterSheet.tsx:173` (`Modal`) | ❌ |
| Artigo → modal | `ArticleCard.tsx:20` | `BookDetailModal.tsx:42` (`Modal`) | ❌ |
| Evento do calendário → destino | `CalendarEntryRow.tsx:49` | sheet/wizard do destino | ❌ |

### 2.2 Reveal: 3 listas de ~22

Aplicado em `NotesScreen`, `StudyHistoricoScreen` e `ProfilePreferences`. Sem
`Reveal` hoje:

- `DisciplinasGrid.tsx`, `WeekEventsList.tsx`, `InternshipSection.tsx`
- `FamiliesView.tsx`, `FamilyDetailView.tsx`, `ApproachDetailView.tsx`
- `TempleScreen.tsx` + `AuthorsScreen`, `ConceptsScreen`, `TechniquesScreen`,
  `ComparisonsScreen`
- `MyMaterialsSection.tsx`, `ExploreShelves.tsx`, `InlineCollectionBlock.tsx`,
  `MixedCollectionBlock.tsx`
- `TccView.tsx` (capítulos, referências, tarefas), `InternshipDiaryView.tsx`
- `CalendarScreen.tsx`, `StickersView.tsx`, `StreakView.tsx`
- `JourneyHistory.tsx`, `AchievementsPreview.tsx`, `JourneyRail.tsx`
- `QuizCategorySelector.tsx`, `QuizGroupSelector.tsx`

**Home foi desviada com motivo** (`tasks/todo-motion-design.md:199-208`): as duas
listas ficam acima da dobra e `AttentionSection.tsx:51` usa
`AnimatePresence mode="popLayout"`, que exige filho direto `motion`. O
`CalendarEntryRow.tsx:49` é um `<button>` comum dentro desse `AnimatePresence` —
o `popLayout` não consegue tirá-lo do fluxo. Isso é dívida, não design.

### 2.3 Overlays: só o `Modal` está endurecido

| Superfície | Problema | Evidência |
|---|---|---|
| `QuizExplanationOverlay` | Sem `exit`: some no mesmo quadro; `duration`/`ease` inline; fora da `overlayStack` | `QuizExplanationOverlay.tsx:20-33` |
| `CourseCreateMenu` | `Esc` próprio; não entra na pilha (com dois abertos, fecha os dois); sem `inert` | `CourseCreateMenu.tsx:43-49` |
| `HeaderActionMenu` | Mesmo padrão | `HeaderActionMenu.tsx:19-25` |
| `floating-action-menu` | Sem `Esc`/pilha; literais inline | `floating-action-menu.tsx:57-88` |
| `ReadingTrackerScreen` | `fixed inset-0` montado por early return, sem entrada/saída | `ReadingHubScreen.tsx:166-173` |
| `Toast` | Animado, mas com variante própria fora do `Modal` | `Toast.tsx:30-59` |

`handleSystemBack` cobre `Modal` + nomes fixos
(`navigationEngine.ts:791-820`), mas não cobre os menus acima. O back do Android
**sai da tela** em vez de fechar o menu.

### 2.4 Microinterações: CSS cobre o toque, o token não cobre nada

- `press-card`/`tap-interactive` existem em 13 arquivos
  (`src/index.css:354-380`), mas **só com mouse** para `card-lift`
  (`src/index.css:407-420`).
- `TOKENS.micro` não tem nenhum consumidor fora de `src/lib/motion/`.
- `SegmentedControl.tsx:72`, `ProgressBar.tsx:36`, `AnimatedNumber.tsx:12` usam
  spring literal, não token.
- Haptics estão bem cobertos (~20 pontos), mas não há auditoria de confirmação
  sem háptico.

### 2.5 Consolidação: o sistema ainda não é universal

- **37 arquivos** importam `framer-motion` direto (lista `KNOWN` em
  `src/lib/__tests__/motion/importRatchet.test.ts:31-68`).
- **20 arquivos / 34 literais** de `duration`/`stiffness`/`ease` fora de
  `src/lib/motion/` (`noInlineTokens.test.ts:29-70`).
- Presets sem consumidor: `listItemVariants`, `staggerFor`, `chromeFade`
  (`variants.ts:212-260`). `listStagger`/`listStaggerCap` existem no token e
  nenhuma lista usa.

### 2.6 Bugs e pendências que afetam o morph

| # | O quê | Evidência | Efeito |
|---|---|---|---|
| B1 | A tela que entra em `push` desliza de `+W` (`variants.ts:95-103`) enquanto o card morpha | `variants.ts:95-103` + `SharedElement.tsx` | O destino do par nasce fora da tela; o card "voa" para a direita e a página desliza. É por isso que o efeito não parece "o card abrindo a tela" |
| B2 | `SlideScreen` aplica `top: docTop - S` **e** `translateY(-S)` | `SlideScreen.tsx:69` e `:123` | Suspeita de dupla subtração do scroll; o morph começa deslocado em tela rolada (Q8) |
| B3 | Conteúdo do card inteiro está dentro do `SharedElement` | `DisciplinasGrid.tsx:70-136` | Sem `layout="position"` nos filhos, o texto estica durante o morph |
| B4 | G2 (gesto iOS cancelado navega) não verificado em aparelho | `tasks/todo-motion-design.md:38` | Risco de perda de contexto |
| B5 | F10 não executada | `tasks/todo-motion-design.md:376-386` | Nenhuma plataforma pode ser declarada validada |

---

## 3. Fase 0 — Descoberta de documentação (concluída)

Esta fase já foi feita nesta sessão; o resultado é o que autoriza as fases
seguintes.

### APIs permitidas (e fonte)

| API | Onde foi verificada | Uso |
|---|---|---|
| `layoutId` + `LayoutGroup` | `src/lib/motion/SharedElement.tsx`; `MobileAppShell.tsx` (LayoutGroup) | morph entre origem e destino |
| `AnimatePresence` + `usePresence`/`useIsPresent` | `src/shells/SlideScreen.tsx:100-104`; `src/components/ui/Modal.tsx:44-77` | presença e saída |
| `createScreenTargets` / `createScreenVariants` | `src/lib/motion/variants.ts:40-140` | física da pilha |
| `deriveIntent` / `consumeMotionIntent` | `src/lib/motion/intent.ts` | direção da navegação |
| `Reveal` / `revealVariants` | `src/lib/motion/Reveal.tsx`; `variants.ts:262-275` | reveal de lista |
| `overlayStack` (`pushOverlay`/`isTopOverlay`) | `src/lib/overlayStack.ts`; `Modal.tsx` | topo de overlay |
| `TOKENS` / `resolveProfile` | `src/lib/motion/tokens.ts:186-230`; `profile.ts` | duração/easing por perfil |
| `motion.div` com `layout="position"` | runtime instalado (`framer-motion` 13) | evitar esticar texto no morph |

### Anti-padrões que o plano proíbe

- `layoutId` no **root da página** (morpharia o fundo inteiro, não o card).
- Animar `width`/`height`/`top`/`left` por CSS: o layout animation do Motion já
  é por `transform`; misturar os dois causa salto.
- Usar `AnimatePresence` **dentro** do elemento que morpha: o conteúdo pisca.
- Aplicar `morph` em toda navegação: tab e pop continuam como estão.
- Criar gate visual novo (D17): a evidência visual é captura manual, não CI.
- Importar `framer-motion` em arquivo novo de `src/components/` (D22).

---

## 4. Fase 1 — Container transform (o "card vira tela")

**Como serve ao objetivo primário:** é o efeito que a usuária pediu; sem ele, os
pares novos repetem o problema do par de disciplina.

### 4.1 Por que `layoutId` não serve (o achado)

O app já tem os fluxos como rotas da pilha
(`packages/navigation/src/types.ts:54-122`). O problema é o renderizador:
`MobileAppShell.tsx:318` monta **uma** tela por vez, e a cópia que sai
re-renderiza com o estado novo. Numa tela com early return — o padrão do app —
a cópia troca o conteúdo para o destino no primeiro frame
(`FaculdadeView.tsx:139-140` devolve `<CourseDetailView/>`).

Logo o `layoutId` morfa hero→hero entre duas cópias, e o card não é origem de
nada. Manter a origem montada exigiria mudar o renderizador da pilha e o freeze
(`D25`, alternativa rejeitada). A camada de clone resolve sem tocar na pilha.

### 4.2 O que implementar

1. **Intenção `morph`** — `NavIntent` ganha `morph: boolean`
   (`src/lib/motion/intent.ts`). O `setStack`
   (`src/context/navigationEngine.ts:405`) ativa o morph e marca a intenção.
   Com `morph`, a tela **não desliza**: `enter` parte de `{x:0, opacity:0}` e
   `animate` chega a `{x:0, opacity:1}` na duração do morph; `exit` é
   `{x:0, opacity:0}`.
2. **Store** — `beginMorph(id, el)` captura rect + clone no `pointerdown`;
   `activateMorphForNavigation(intent)` promove a captura a animação (push) ou
   monta o caminho inverso a partir do `MorphTarget` registrado (pop);
   `clearMorph()` limpa e restaura. Órfão de 600 ms.
3. **`MorphSource` / `MorphTarget`** — headless (`cloneElement`): não criam nó
   extra, para não quebrar `AnimatePresence mode="popLayout"`.
4. **`MorphLayer`** — mora no shell, `fixed`, `pointer-events-none`, `z-[55]`
   (acima do `Modal` z-50, abaixo do toast z-60). Espera o alvo por 150 ms,
   anima por `transform` + `opacity` (crossfade no último terço) e esconde a
   origem enquanto o clone existe.
5. **`Modal morphId`** — o painel vira `MorphTarget` e a entrada por
   `sheetVariants` é suprimida.
6. **Aplicar nos dois pares existentes** — nota e disciplina.

O spike de captura deixou de ser pré-requisito: o critério de "nenhum frame com
dois cards" passou a ser verificável por construção (a origem é escondida
enquanto o clone existe) e continua na matriz como Q21/Q22.

### 4.3 Referências de documentação

- `src/lib/motion/Morph.tsx` — store, primitivas e camada (novo).
- `src/lib/motion/variants.ts:40-160` — onde a intenção vira alvo.
- `src/shells/SlideScreen.tsx:60-130` — presença, freeze e foco.
- `src/components/ui/Modal.tsx:44-100` — presença, `inert` e `morphId`.
- `src/lib/motion/intent.ts` — canal de módulo e `consumeMotionIntent`.

### 4.4 Verificação

- Teste unitário: `createScreenTargets` com `morph` devolve `x: 0` no `enter`,
  no `animate` e no `exit`, no perfil completo e no reduzido.
- Teste de componente: `MorphSource`/`MorphTarget` marcam o filho com
  `data-morph-*` sem criar nó extra; `MorphLayer` não renderiza nada ocioso.
- Teste de store: órfão de 600 ms, limpeza no fim, próximo `beginMorph`
  sobrescreve.
- `npm run test -- src/lib/__tests__/motion` verde.
- Nenhum teste existente de navegação pode mudar de resultado
  (`navigationRegression.test.tsx`, `slideScreen` etc.).

### 4.5 Guardas

- Não remover o slide de `push`/`pop` fora de `morph`.
- Não deixar `beginMorph` pendente: se a navegação não acontecer, o timeout de
  600 ms limpa (teste de "morph órfão").
- Perfil reduzido: nenhum clone; as telas fazem fade.
- O clone nunca recebe ponteiro (`pointer-events-none`) e nunca fica no DOM
  depois do fim.

---

## 5. Fase 2 — Os pares restantes

**Como serve ao objetivo primário:** leva o mesmo gesto para as telas que a
usuária usa depois da disciplina (biblioteca, TCC, estágio, quiz).

| Par | Origem → destino | Id |
|---|---|---|
| Família | `FamiliesView.tsx:56` → `FamilyDetailView.tsx:26` | `sharedFamilyId(id)` |
| Abordagem | `FamilyDetailView.tsx:59` → `ApproachDetailView.tsx:157` | `sharedApproachId(id)` |
| Templo → seção | `TempleScreen.tsx:122` → header da seção | `sharedTempleId(section)` |
| Quiz grupo | `QuizGroupSelector.tsx:94` → `QuizGroupDetail.tsx:62` | `sharedQuizGroupId(id)` |
| Caso de estágio | `InternshipDiaryView.tsx:234` → `InternshipCaseView.tsx` | `sharedCaseId(patientKey)` |
| Capítulo TCC | `TccView.tsx:670` → `ChapterSheet.tsx:173` | `sharedChapterId(id)` via `Modal sharedId` |
| Artigo | `ArticleCard.tsx:20` → `BookDetailModal.tsx:42` | `sharedBookId(id)` via `Modal sharedId` |
| Evento do calendário | `CalendarEntryRow.tsx:49` → sheet/wizard | `sharedEntryId(id)` |

Regras:

- Cada helper mora em `src/lib/motion/Morph.tsx` (mesmo motivo de
  `sharedNoteId`/`sharedCourseId`: literal duplicado não casa em silêncio).
- Prefixos distintos das chaves de camada (`slideBaseKeyOf`), como
  `course-card-` já faz.
- O `MorphSource` captura no `pointerdown` do próprio card; não existe
  `beginMorph` manual no `onClick`.
- Sheet/modal: o painel é o destino (`Modal morphId`); o header interno não
  vira alvo.

### Verificação

- Um teste por helper: string esperada + prefixo não colide com
  `slideBaseKeyOf`.
- Um teste por par: origem e destino chamam a mesma função (grep no teste, como
  `morph.test.tsx` já faz).
- Captura manual de 2 pares por fase (não todos de uma vez).

---

## 6. Fase 3 — Reveal e coreografia de lista

**Como serve ao objetivo primário:** o app deixa de "aparecer de uma vez" nas
telas que a primeira onda não cobriu.

1. Aplicar `Reveal` nas listas da §2.2, com `index` e cap 6
   (`revealVariants`, `listStaggerCap`).
2. Home:
   - `CalendarEntryRow` vira `motion.button` para o `popLayout` funcionar
     (`AttentionSection.tsx:51-66`).
   - `Reveal` entra **dentro** do filho `motion`, nunca por fora.
   - Se a lista estiver acima da dobra, o `Reveal` não arma — comportamento
     correto, não bug.
3. `listItemVariants`/`staggerFor`: usar nas listas que entram/saem (atenção,
   histórico) ou remover do `variants.ts` — não deixar preset morto.
4. Não animar lista vazia; não animar no perfil reduzido (já garantido pelo
   `Reveal`).

### Verificação

- `src/lib/__tests__/motion/reveal.test.tsx` estendido: item visível no primeiro
  paint não anima; item fora da tela anima ao cruzar; cap de stagger.
- Teste de Home: `popLayout` com `CalendarEntryRow` não deixa item preso.

---

## 7. Fase 4 — Overlays fora do `Modal`

**Como serve ao objetivo primário:** fechar um overlay deixa de ser corte seco e
o back do Android deixa de sair da tela.

1. `QuizExplanationOverlay` → `Modal` (ou `AnimatePresence` + `overlayStack`),
   com `exit` e tokens (remove `QuizExplanationOverlay.tsx:23,32` do ratchet).
2. `CourseCreateMenu`, `HeaderActionMenu`, `floating-action-menu`:
   - `pushOverlay`/`removeOverlay` para o `Esc` fechar **só o topo**;
   - `inert` no conteúdo de trás quando forem modais de verdade;
   - back do Android coberto por `handleSystemBack` (`navigationEngine.ts:791`).
3. `ReadingTrackerScreen` (`ReadingHubScreen.tsx:166-173`): entrada/saída com
   `AnimatePresence` + `motion`, ou virar rota da pilha (decisão na fase).
4. `Toast` continua como está (já anima); só alinhar tokens se sobrar literal.

### Verificação

- Teste: dois overlays abertos, `Esc` fecha só o topo; back do Android fecha o
  menu antes da tela.
- Teste: `QuizExplanationOverlay` sai do DOM só depois do `exit`.
- `overlayStack` limpa no unmount (sem pilha fantasma).

---

## 8. Fase 5 — Microinterações e feedback de toque

**Como serve ao objetivo primário:** o app responde ao dedo em todo lugar, não
só onde já havia CSS.

1. `TOKENS.micro` em `SegmentedControl`, `toggle-switch-glass` (já usa
   `BASE_D.micro`), `ProgressBar`, `AnimatedNumber`, sublinhado de aba, FAB.
2. Auditoria de `onClick` em card/botão sem `press-card`/`tap-interactive`:
   adicionar a classe onde falta; não duplicar feedback (CSS + motion no mesmo
   elemento briga).
3. Auditoria de confirmação sem háptico (salvar, concluir, toggle) — completar
   com `hapticSuccess`/`hapticTap`, nunca em scroll/reveal.
4. Perfil reduzido: micro vira opacidade, sem escala.

### Verificação

- `noInlineTokens.test.ts`: remover entradas dos arquivos migrados.
- Teste de `SegmentedControl`: transição vem de `TOKENS.micro` (não literal).
- Teste de háptico: não lança em jsdom e não é o único sinal.

---

## 9. Fase 6 — Consolidação de tokens e imports

**Como serve ao objetivo primário:** a física do morph e do reveal deixa de
conviver com 37 físicas locais; o app inteiro passa a responder igual.

1. Migrar os 37 arquivos de `KNOWN` (`importRatchet.test.ts:31-68`) para
   `@/lib/motion`; a lista só encolhe.
2. Migrar os 34 literais de `KNOWN_INLINE` (`noInlineTokens.test.ts:29-70`) para
   tokens; a lista só encolhe.
3. Remover presets mortos (`chromeFade`; `listItemVariants`/`staggerFor` se a
   Fase 3 não os usar).
4. `src/lib/motion.ts` (shim): manter só o que ainda é reexportado; remover o
   resto.

### Verificação

- `KNOWN` e `KNOWN_INLINE` vazios (ou só com o shim declarado).
- `npm run verify` verde.
- `grep -rl "from 'framer-motion'" src | wc -l` = só `src/lib/motion/` +
  `src/shells/` + entrypoints.

---

## 10. Fase 7 — Freeze, scroll e validação

**Como serve ao objetivo primário:** o morph não pode começar deslocado; a tela
que sai precisa congelar onde a usuária a via.

1. B2: extrair `frozenTop(docTop, scrollY)` para função pura e testar; remover o
   `translateY(-S)` de `SlideScreen.tsx:123` **se** o teste/captura confirmar a
   dupla subtração.
2. Verificar Q8 (tela rolada → abrir disciplina → voltar) na captura.
3. Rodar `npm run verify` (gate único do mobile) e `check-boundaries`.
4. F10 (Android/iOS): matriz Q1..Q20, frame em push/pop,
   `prefers-reduced-motion`, bateria do ambiente (15 min).
5. Atualizar `tasks/todo-motion-design.md` e abrir a spec da onda 2 com o que
   foi decidido.

### Verificação

- Teste puro de `frozenTop` (jsdom não mede layout; a função pura mede).
- Captura antes/depois do Q8.
- Gate completo verde.
- Matriz de aparelho preenchida (depende da usuária).

---

## 11. Fora de escopo

- Nova identidade visual, tema, tipografia, cor, telas ou reestruturação de
  produto.
- Motion do desktop (`SPEC-D-016`).
- Virtualização de lista, `LazyMotion`/`m`, screenshot diff (D16/D17).
- Heurística de hardware (D10).
- Interactive pop nativo pleno (plugin Swift): entra só como **gesto de borda**
  na F8 (`D45`), com dependência de Xcode e iPhone.
- Aumentar a intensidade do ambiente sem medição de bateria (D13).

---

## 12. Riscos

| Risco | Mitigação |
|---|---|
| A origem desmontar no push continua sem par | camada de clone (`D25`): não depende da origem viva |
| Ghost card (duas cópias durante o morph) | a origem é escondida enquanto o clone existe (Q21) |
| Clone não parecer o card (fonte, sombra, imagem) | `cloneNode(true)` no `pointerdown`, antes de qualquer mudança de estado |
| Destino `lazy` não monta em 150 ms | cai para o rect da tela (push) ou crossfade (pop) |
| Morph em tela rolada desloca | `frozenTop` na F7, com teste puro + captura Q8 |
| 8 pares novos virarem 8 físicas | um helper por par + teste de mesmo id |
| Reveal em lista acima da dobra não arma | comportamento esperado; testar que não anima |
| Migração de 37 arquivos quebrar animação existente | uma fase só para isso, com gate completo |
| F8 não acontecer | declarar "não validado em aparelho" em todo relatório |

---

## 13. Rastreabilidade

| Fase | Decisão | Invariante | Gate |
|---|---|---|---|
| F1 | D24, D25, D26, D46 | I15..I18, I29 | `morph.test.tsx`, `intent.test.ts`, `Modal.test.tsx` |
| F2 | D25, D38 (parcial) | I17, I30 | `morph.test.tsx` + captura |
| F3 | D38 | I17, I30 | `morph.test.tsx` + captura |
| F4 | D27 | I20, I21 | `reveal.test.tsx` |
| F5 | D28, D29, D39, D41, D42, D43 | I22..I24, I31, I32 | `navigationRegression`, `Modal.test.tsx` |
| F6 | D30, D31, D32, D33, D48 | I25, I26 | `noInlineTokens.test.ts` |
| F7 | D34, D35, D44, D47 | I27, I28 | teste puro de `frozenTop`, `verify` |
| F8 | D36, D45 | — | matriz Q1..Q27 |
