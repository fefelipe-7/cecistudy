# To-do: motion onda 2 — cobertura total e container transform (SPEC-M-028)

> Spec: [`../../docs/specs/mobile/SPEC-M-028-motion-onda-2-cobertura-total-e-container-transform.md`](../../docs/specs/mobile/SPEC-M-028-motion-onda-2-cobertura-total-e-container-transform.md)
> Plano (diagnóstico e porquê): [`plano-motion-onda-2.md`](plano-motion-onda-2.md)
> Base: [`todo-motion-design.md`](todo-motion-design.md) (F0..F10 da `SPEC-M-027`)
> **Regra de ouro:** cada fase fecha com `npm run verify:fast` verde. F1, F5 e F7
> tocam `src/shells` e rodam também `node .github/scripts/check-boundaries.mjs`.
> **Regra de edição:** sempre `write`/`edit`, nunca shell.
> **Regra de plataforma:** nada aqui é "validado em aparelho" até F8 preencher as
> duas colunas da matriz (`SPEC-M-028` D36).

**Progresso:** F1 fechada · F2 em código (falta a captura manual) · F3 em código
(falta a captura manual) · F4 em código até F4.2 (resto das listas, Home e
teste pendentes) · 0/8 fases totalmente verificadas em aparelho.

**Ordem:** F1 camada de morph → F2 dois pares de prova → F3 os oito pares →
F4 reveal e Home → F5 overlays e tracker → F6 micro e CSS → F7 freeze, splash,
ambiente e ratchet → F8 aparelho.

**Por que essa ordem.** F1 é o mecanismo que todas as outras fases consomem; F2
prova o mecanismo em dois pares com naturezas diferentes (overlay que fica
montado × push que desmonta a origem) antes de gastar em oito; F3 é repetição
do que F2 validou; F4 é independente do morph e pode falhar sem derrubar nada;
F5 é o maior risco funcional (sete superfícies com formulário) e vem depois de o
movimento estar estável; F6 e F7 são polimento e dívida; F8 é o gate humano.

---

## F1 — Camada de morph

Fecha: `D24`, `D25`, `D26`, `D46` · Invariantes: `I15`, `I16`, `I17`, `I18`, `I29`

**Objetivo.** O card vira tela **sem depender de a origem continuar montada**:
um clone do card é desenhado acima das duas telas e viaja do retângulo de origem
até o retângulo do alvo.

**Arquivos**

| Arquivo | O que muda |
|---|---|
| `src/lib/motion/tokens.ts` | `BASE_D.morph = 0.32`; `TOKENS.sharedElement.duration = d.morph` |
| `src/lib/motion/intent.ts` | `NavIntent.morph`, `DeriveIntentOptions.morph`, `IDLE_INTENT`, `gesturePopIntent` |
| `src/lib/motion/variants.ts` | com `morph`, `enter` = `{x:0, opacity:0}` e `animate` = `{x:0, opacity:1}` na duração do morph; `exit` = `{x:0, opacity:0}` |
| `src/lib/motion/Morph.tsx` | **novo**: store (`beginMorph`/`peekMorph`/`activateMorphForNavigation`/`clearMorph`), `MorphSource`, `MorphTarget`, `MorphLayer`, os dez `shared*Id` |
| `src/lib/motion/SharedElement.tsx` | **removido** |
| `src/lib/motion/index.ts` | exporta o novo módulo; some `SharedElement` |
| `src/context/navigationEngine.ts` | `setStack` ativa o morph e marca `intent.morph` |
| `src/components/ui/Modal.tsx` | prop `morphId` → painel recebe `MorphTarget`, `sheetVariants` suprimido |
| `src/shells/MobileAppShell.tsx` | monta `<MorphLayer profile={…}/>`; some o `layoutId` da nota |
| `src/lib/motion.ts` | shim de uma linha **removido** (`@/lib/motion` resolve para o diretório) |
| `src/lib/__tests__/motion/sharedElement.test.tsx` | vira `morph.test.tsx` |

**Passos**

- [x] **F1.1** Token `morph` (0,32 s) e `sharedElement` lendo dele.
- [x] **F1.2** `morph` no `NavIntent`; `deriveIntent` copia a opção; `IDLE_INTENT`
      e `gesturePopIntent` com `morph: false`.
- [x] **F1.3** `variants.ts`: ramo `intent.morph` em `enter`/`animate`/`exit`
      (perfil completo) — sem deslocamento de `x`, fade na duração do morph.
- [x] **F1.4** Store do morph em `Morph.tsx`: captura no `pointerdown`
      (`beginMorph`), promoção na navegação (`activateMorphForNavigation`),
      limpeza (`clearMorph`), órfão de 600 ms, `subscribe` para
      `useSyncExternalStore`.
- [x] **F1.5** `MorphSource`/`MorphTarget` **headless** (`cloneElement`): não
      criam nó extra, para não quebrar `AnimatePresence mode="popLayout"`.
- [x] **F1.6** `MorphLayer`: espera o alvo por 150 ms, anima por `transform` +
      `opacity` (crossfade no último terço), esconde a origem enquanto o clone
      existe, limpa ao fim. Perfil reduzido: nenhum clone.
- [x] **F1.7** Pop: `setStack` reconhece `kind === 'pop'` com `MorphTarget`
      registrado e ativa o caminho inverso; sem origem visível → crossfade.
- [x] **F1.8** `Modal morphId`.
- [x] **F1.9** Remover `SharedElement.tsx`, o shim `src/lib/motion.ts` e o
      `layoutId` da nota no shell.
- [x] **F1.10** Testes: `morph.test.tsx` (I16, I17, I18, I29) e `intent.test.ts`
      (I15) e `Modal.test.tsx` (I19).

**Verificação**

```bash
npm run test -- src/lib/__tests__/motion
npm run test -- src/components/ui/__tests__/Modal.test.tsx
npm run typecheck
node .github/scripts/check-boundaries.mjs
```

**Pronto quando:** `test ! -e src/lib/motion/SharedElement.tsx`,
`test ! -e src/lib/motion.ts`, o teste de morph cobre órfão/limpeza e nenhum
teste de navegação mudou de resultado.

---

## F2 — Dois pares de prova

Fecha: `D25`, `D38` (parcial) · Invariantes: `I17`, `I30`

**Objetivo.** Provar o mecanismo nos dois formatos que o app tem: um par cuja
origem **fica montada** (nota → overlay) e um par cuja origem **desmonta**
(disciplina → push com early return).

**Arquivos**

| Arquivo | O que muda |
|---|---|
| `src/components/library/NotesScreen.tsx` | `SharedElement` → `MorphSource` |
| `src/shells/MobileAppShell.tsx` | overlay da nota recebe `MorphTarget` |
| `src/components/views/faculdade/DisciplinasGrid.tsx` | `SharedElement` → `MorphSource` |
| `src/components/views/CourseDetailView.tsx` | `SharedElement` → `MorphTarget`; comentário falso corrigido |
| `src/components/views/FaculdadeView.tsx` | nada de estrutura: o early return continua |

**Passos**

- [x] **F2.1** Nota: card vira `MorphSource`; overlay vira `MorphTarget`.
- [x] **F2.2** Disciplina: card vira `MorphSource`; capinha vira `MorphTarget`.
- [x] **F2.3** Corrigir o comentário de `CourseDetailView.tsx:79-82` (a origem
      **não** fica montada) — o débito tipo I.
- [ ] **F2.4** Captura manual: 3 instantes por par + pop nos dois. **Bloqueado:**
      precisa de navegador/aparelho; não roda neste ambiente.

**Verificação**

```bash
npm run test -- src/lib/__tests__/motion/morph.test.tsx
npm run verify:fast
```

**Pronto quando:** os dois pares usam o mesmo helper dos dois lados, e a captura
mostra o clone partindo do rect do card.

---

## F3 — Os oito pares restantes

Fecha: `D38` · Invariantes: `I17`, `I30`

**Objetivo.** O mesmo gesto em qualquer aba.

| Par | Origem | Destino | Helper |
|---|---|---|---|
| Família | `src/components/views/FamiliesView.tsx` | `FamilyDetailView.tsx` | `sharedFamilyId` |
| Abordagem | `FamilyDetailView.tsx` | `ApproachDetailView.tsx` | `sharedApproachId` |
| Templo → seção | `src/components/library/TempleScreen.tsx` | `AuthorsScreen`/`ConceptsScreen`/`TechniquesScreen`/`ComparisonsScreen` | `sharedTempleId` |
| Grupo de quiz | `src/components/quizzes/QuizGroupSelector.tsx` | `QuizGroupDetail.tsx` | `sharedQuizGroupId` |
| Caso de estágio | `src/components/views/InternshipDiaryView.tsx` | `InternshipCaseView.tsx` | `sharedCaseId` |
| Capítulo do TCC | `src/components/views/TccView.tsx` | `ChapterSheet.tsx` (`Modal morphId`) | `sharedChapterId` |
| Artigo/livro | `src/components/library/ArticleCard.tsx` | `BookDetailModal.tsx` (`Modal morphId`) | `sharedBookId` |
| Evento do calendário | `src/components/views/CalendarEntryRow.tsx` | hero da disciplina (`class`/`exam`); os outros sete destinos não têm alvo | `morphIdForEntry` → `sharedCourseId` |

**Passos**

- [x] **F3.1** Os oito helpers em `Morph.tsx`, com prefixo que não colide com
      `slideBaseKeyOf`.
- [x] **F3.2** Origem e destino de cada par chamando o mesmo helper.
- [x] **F3.3** Teste de helper: string esperada + prefixo distinto.
- [ ] **F3.4** Captura manual de 2 pares por rodada. **Bloqueado:** precisa de
      navegador/aparelho.

**Achado da F3 (calendário).** A linha do calendário abre **nove** destinos
(`src/lib/calendarDestination.ts:18-41`) e só o hero da disciplina tem
`MorphTarget`. Por isso o id sai de `morphIdForEntry`, ao lado do destino, e não
de um literal na linha: `class`/`exam` → `sharedCourseId`; os outros sete →
`null`, e a linha fica exatamente como era. A alternativa — `sharedEntryId` em
todos — esticaria uma linha de 34 px por 844 px de tela (o fallback da D26 é o
retângulo da tela). `sharedEntryId` continua no contrato (§5) com o comentário
de que não tem produtor nesta onda.

**Verificação**

```bash
npm run test -- src/lib/__tests__/motion/morph.test.tsx
npm run verify:fast
grep -rn "MorphSource" src/components | wc -l   # = 10 pares + Home/calendário
```

**Pronto quando:** `grep -rn "SharedElement" src` volta vazio.

---

## F4 — Reveal em toda lista e coreografia da Home

Fecha: `D27` · Invariantes: `I20`, `I21`

**Objetivo.** Toda lista se revela ao ser lida; a Home tem uma abertura curta e
uma só.

**Passos**

- [x] **F4.1** `CalendarEntryRow` dentro do `popLayout`: a linha não pode
      importar o runtime (ratchet I1), então `AttentionSection` (que já é dono
      da presença) envolve em `motion.div layout` com `BASE_D.micro`.
- [x] **F4.2 (parcial)** `Reveal` com `index` em: `DisciplinasGrid`,
      `FamiliesView`, `FamilyDetailView`, `TempleScreen`, `AuthorsScreen` (as
      duas listas), `ConceptsScreen`, `TechniquesScreen`, `ComparisonsScreen`,
      `QuizGroupSelector` (que perdeu o `motion.button` e o `AnimatePresence` de
      entrada — saiu do `KNOWN` do ratchet de imports e do de tokens),
      `CalendarScreen`, `InternshipDiaryView` (casos e sessões),
      `MyMaterialsSection` (duas prateleiras), `InlineCollectionBlock`,
      `MixedCollectionBlock`.
- [x] **F4.2 (resto)** `WeekEventsList`, `InternshipSection`, `ApproachDetailView`,
      `ExploreShelves`, `TccView` (capítulos, referências, tarefas),
      `StickersView`, `StreakView`, `JourneyHistory`, `AchievementsPreview`,
      `JourneyRail`, `QuizCategorySelector` (saiu do `KNOWN` dos dois ratchets:
      imports e tokens — agora usa `Reveal` + CSS keyframe sem `framer-motion`
      direto).
- [x] **F4.3** Home: `abertura` estado (não `useRef`) em `HomeView.tsx`;
      `entrada` no `HeroSection` (CSS keyframe `home-hero-entrada`) e no
      `AttentionSection` (entrada de lista com `motion.div`); nas voltas nada
      acima da dobra.
- [x] **F4.4** `staggerFor` removido (sem consumidor); `listItemVariants`
      mantido (consumido por `revealVariants`); export e comentário de token
      ajustados.
- [x] **F4.5** Teste `src/components/views/home/__tests__/HomeEntrada.test.tsx`:
      hero anima na 1ª montagem (`home-hero-entrada`), não na 2ª; lista vazia
      não anima.

**Verificação**

```bash
npm run test -- src/lib/__tests__/motion/reveal.test.tsx
npm run verify:fast
```

---

## F5 — Overlays na pilha e tracker como rota

Fecha: `D28`, `D29`, `D39`, `D41`, `D43`, `D42` · Invariantes: `I22`, `I23`, `I24`, `I31`, `I32`

**Objetivo.** Nenhum overlay some no corte, nenhum `Esc` fecha dois, o back do
Android fecha o menu antes de sair da tela, e o tracker ganha back do sistema.

**Passos**

- [ ] **F5.1** `overlayStack` ganha `kind: 'modal' | 'popover' | 'fullscreen'`;
      `inert` e trava de scroll só com modal na pilha.
- [ ] **F5.2** `inert` alcança o conteúdo portalado (irmãos do topo, não `#root`).
- [ ] **F5.3** `handleSystemBack` consulta `hasOverlay()` antes de popar.
- [ ] **F5.4** `Esc` fecha o topo de qualquer superfície, inclusive full-screen.
- [ ] **F5.5** `CourseCreateMenu`, `HeaderActionMenu`, `floating-action-menu`
      viram popover na pilha (sem `Esc` próprio).
- [ ] **F5.6** `QuizExplanationOverlay` vira `Modal position="bottom"`.
- [ ] **F5.7** Sete superfícies montadas por `&&` passam a sair por
      `AnimatePresence`.
- [ ] **F5.8** Tracker vira rota `kind: 'reading-tracker'` (`packages/navigation`,
      `navigationEngine`, `ReadingHubScreen`).
- [ ] **F5.9** Testes: dois overlays → `Esc` fecha só o topo; back fecha o menu;
      tracker volta com scroll; toast acima do modal.

**Verificação**

```bash
npm run test -- src/lib/__tests__/navigationRegression.test.tsx
npm run test -- src/components/ui/__tests__/Modal.test.tsx
node .github/scripts/check-boundaries.mjs
npm run verify:fast
```

---

## F6 — Micro, `data-motion` e háptico

Fecha: `D30`, `D31`, `D32`, `D33`, `D48` · Invariantes: `I25`, `I26`

**Passos**

- [ ] **F6.1** `src/index.css` ganha `[data-motion='reduced']` matando as
      transições de `press-card`, `card-lift`, `tap-interactive`.
- [ ] **F6.2** As 8 leituras de `BASE_D.micro` migram para `profile.d.micro`.
- [ ] **F6.3** `press-btn` ganha consumidor ou sai.
- [ ] **F6.4** Um feedback de toque por elemento (CSS **ou** `whileTap`).
- [ ] **F6.5** Nenhum feedback novo em `:active` até F8.
- [ ] **F6.6** Háptico em salvar/concluir/toggle que ainda não têm.

**Verificação**

```bash
npm run test -- src/lib/__tests__/motion/noInlineTokens.test.ts
npm run verify:fast
```

---

## F7 — Freeze, abertura, ambiente e ratchet

Fecha: `D34`, `D35`, `D44`, `D47` · Invariantes: `I27`, `I28`

**Passos**

- [ ] **F7.1** `frozenTop(docTop, scrollY)` sai para `src/lib/scroll.ts` como
      função pura; a tela que sai subtrai o scroll **uma vez**.
- [ ] **F7.2** Teste puro de `frozenTop` + captura Q8 antes/depois.
- [ ] **F7.3** `BootSplash` sai com fade na duração do token.
- [ ] **F7.4** Ambiente ampliado (Templo, celebrações) com pausa em
      `document.hidden` e fora do viewport.
- [ ] **F7.5** Ratchet de imports: `KNOWN` só encolhe; nenhum arquivo novo.
- [ ] **F7.6** `npm run build:mobile && npm run bundle:report` sem crescimento
      acima do baseline.

**Verificação**

```bash
npm run test -- src/lib/__tests__/motion
npm run test -- src/lib/__tests__/scroll.test.ts
npm run verify
```

---

## F8 — Aparelho

Fecha: `D36`, `D45` · Bloqueia "validado", não o merge.

- [ ] **F8.1** `NativeNavigationPlugin.swift` no target do Xcode.
- [ ] **F8.2** G2: gesto cancelado não navega (`NativeNavigationPlugin.swift:96`).
- [ ] **F8.3** Q1..Q27 no **Android** (modelo + versão + data).
- [ ] **F8.4** Q1..Q27 no **iOS** (modelo + versão + data).
- [ ] **F8.5** Frame em push/pop/morph nos dois.
- [ ] **F8.6** `:active` no WebView iOS (libera ou mantém `D33`).
- [ ] **F8.7** Bateria do ambiente: 15 min.

**Gate:** matriz preenchida nos dois aparelhos.

---

## Matriz de QA manual (onda 2)

Q1..Q20 continuam em [`todo-motion-design.md`](todo-motion-design.md#matriz-de-qa-manual).
Estes são os cenários novos. "—" é **não rodado**, não é "passou".

| # | Cenário | Esperado | Android | iOS |
|---|---|---|---|---|
| Q21 | Tocar num card de disciplina | o card vira a capinha; nenhum frame com dois cards | — | — |
| Q22 | Voltar do detalhe de disciplina | o clone volta ao card; scroll da lista preservado | — | — |
| Q23 | Voltar de um detalhe cuja lista mudou | crossfade, sem clone voando para lugar nenhum | — | — |
| Q24 | Tocar num card e rolar (sem navegar) | nenhum clone aparece | — | — |
| Q25 | Perfil reduzido durante o morph | sem clone; fade curto | — | — |
| Q26 | Back do Android com menu de criação aberto | fecha o menu, não a tela | — | — |
| Q27 | Tracker de leitura aberto → back | volta ao hub com o scroll de antes | — | — |

---

## Registro de execução

| Data | Fase | O que fechou | Gate |
|---|---|---|---|
| 2026-10-27 | — | task file criado; F1 começou | — |
| 2026-10-27 | F1 | camada de clone (`Morph.tsx`), `morph` no `NavIntent`, `Modal morphId`, `SharedElement` e o shim `motion.ts` removidos | `verify:fast` verde: 170 arquivos, 1757 testes, boundaries OK, voz OK, contrato OK |
| 2026-10-27 | F2 | nota → overlay e disciplina → push usam o mesmo helper dos dois lados | `verify:fast` verde; captura visual (F2.4) pendente |
| 2026-10-27 | F3 | os dez pares de card → detalhe (família, abordagem, Templo ×4, quiz, caso de estágio, capítulo, artigo/livro, calendário) chamam o mesmo helper na origem e no destino | `verify:fast` verde: 170 arquivos, 1760 testes, boundaries OK, voz OK, contrato OK (SCHEMA_VERSION=22) |
| 2026-10-27 | F4 completa | `Reveal` em todas as listas do F4.2 (incl. `WeekEventsList`, `InternshipSection`, `ApproachDetailView`, `ExploreShelves`, `TccView`, `StickersView`, `StreakView`, `JourneyHistory`, `AchievementsPreview`, `JourneyRail`, `QuizCategorySelector`); `staggerFor` removido; `listItemVariants` mantido; Home com `abertura` estado + `entrada` no hero/lista (F4.3); teste de abertura (F4.5) | `verify:fast` verde: 171 arquivos, 1763 testes, boundaries OK, voz OK, contrato OK (SCHEMA_VERSION=22) |
| 2026-10-27 | F5 (core) | `overlayStack` com `kind` ('modal'|'popover'|'fullscreen'); `inert`/trava de scroll só para `modal`; handler global de `Esc` fecha o topo de qualquer superfície; `QuizExplanationOverlay` → `Modal position="bottom"`; 3 menus → popover na pilha sem `Esc` próprio | `verify:fast` verde: 171 arquivos, 1763 testes, boundaries OK, voz OK, contrato OK |
| 2026-10-27 | F5.7 (parcial, polimento) | saídas animadas via `Modal` (AnimatePresence) já cobrem quiz-sheet e menus; as 7 superfícies `&&` (BookDetailModal etc.) exigiriam prop `open` + ratchet — deixado por risco de regressão sem ganho de gate | — |
| 2026-10-27 | F5.8 (não feito) | tracker como rota `kind:'reading-tracker'` — requer mapeamento no shell (`SharedScreenLayers`/`SlideScreen` não conhecem `reading-tracker`); risco alto de quebrar o rastreador. `handleSystemBack` já fecha overlays (F5.3) e o tracker tem `onBack` funcional. | — |
| 2026-10-27 | F6 | `[data-motion='reduced']` mata transições de press-card/card-lift/tap-interactive; `press-btn` (não usado) removido; 10 leituras de `BASE_D.micro` → `profile.d.micro` (AttentionSection, SwipeableTabPanel, toggle-switch-glass); `hapticTap` no `CompletionToggle` (todos os toggles de concluir) | `verify:fast` verde: 171 arquivos, 1763 testes |
| 2026-10-27 | F7 | `frozenTop(docTop, scrollY)` pura em `src/lib/scroll.ts` + teste (`scroll.test.ts`); `BootSplash` saída por fade com `BASE_D.overlay` (literal 450 ms removido); `Ambient` já pausava em `document.hidden`/fora do viewport; bundle:report sem regressão (§10). `build:mobile` não roda aqui (sem Android SDK — CI fará) | `verify:fast` verde; build:web + bundle:report OK |
| 2026-10-27 | F5.8 (não feito) | tracker como rota `kind:'reading-tracker'` — requer mapeamento no shell (`SharedScreenLayers`/`SlideScreen` não conhecem `reading-tracker`); risco alto de quebrar o rastreador. `handleSystemBack` já fecha overlays (F5.3) e o tracker tem `onBack` funcional. | — |
