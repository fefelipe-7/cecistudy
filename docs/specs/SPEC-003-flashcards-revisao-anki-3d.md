# Spec: Flashcards à la Anki — revisão 3D + criação com o card como formulário

> **Status: proposta para revisão (2026-09-23).** Redesenho do recurso de flashcards do
> cecistudy para o modelo de revisão espaçada estilo **Anki** (níveis Again/Hard/Good/Easy +
> contadores novas/aprendendo/revisar), com **card físico 3D** (flip/tilt/swipe) e um fluxo
> de **criação onde o próprio card é o formulário** (digita a pergunta na frente → card vira
> em 3D → digita a resposta → o card **voa para dentro de um baú/envelope temático** como
> confirmação), com um "modo simples" (campos empilhados) como fallback acessível.
>
> **Decisões do usuário (2026-09-23):** (1) especificar primeiro, sem codar ainda; (2) criação
> 3D completo + fallback simples; (3) metáfora de confirmação = **envelope/baú temático**.
>
> Base de pesquisa: docs de Anki manual/AnkiDroid/AnkiMobile, padrões swipe modernos
> (Quizlet/flashswipe/Zyeon/VP0/LeitnerBox), técnicas CSS-3D + framer-motion e WCAG
> 2.3.3 / 2.5.4 / 2.2.2 (relatório consolidado em anexo ao fim).

## Objetivo

Hoje os flashcards têm **dois schedulers desconectados** e uma UX que não explora o potencial
da metáfora do card físico:

- A fila de revisão (`StudyRevisarScreen.tsx:23`) é montada pelo **legado** `src/lib/review.ts`
  (`isDueToday` por `lastReviewed`/`timesReviewed`), mas o review grava **FSRS**
  (`dataActions.ts:314-330` via `schedule` de `src/lib/fsrs.ts`) **sem atualizar `lastReviewed`**
  (`dataActions.ts:325: lastReviewed: c.lastReviewed ?? undefined`) — o "vencido" legado de um
  card já revisado fica **congelado**.
- A transformação de nota não usa `initCard` (`fieldsFor.tsx:331-339` cria card sem campos
  FSRS), divergindo do wizard (`FlashcardWizard.tsx:166-174`).
- A tela de revisão é plana (card 2D com `rotate` simples); a criação é um wizard de 5 passos;
  não há undo, não há contadores estilo Anki, não há swipe com commit/haptic, e card/gestos
  não respeitam `prefers-reduced-motion`.

Esta spec propõe: (1) **unificar o agendamento no FSRS** como fonte única (`due`/`state`);
(2) **redesenhar a revisão** no modelo Anki com card 3D, 4 níveis com intervalo impresso,
swipe como atalho, undo e contadores `novas · aprendendo · revisar`; (3) **reprojetar a
criação** com o card-3D-como-formulário e confirmação por voo para o **baú/envelope temático**,
com modo simples empilhado; (4) sem bump de `SCHEMA_VERSION` (os campos FSRS já existem desde a
migração 16) — mudança de comportamento, não de formato.

## User Stories / Critérios de aceite

1. **Revisar no ritmo do Anki.** "Como usuária, ao revisar eu quero ver só a pergunta, revelar
   a resposta, e avaliar em 4 níveis com o próximo vencimento mostrado em cada botão."
   - Aceite: na tela de revisão, um **card 3D** mostra a pergunta; toque (tap) vira para a
     resposta (flip `rotateY`); então aparecem 4 botões **esqueci / custei / lembrei / fácil**
     com o próximo prazo impresso (ex.: `<1m`, `10m`, `3d`); tocar avalia, avança na fila com
     commit síncrono e `hapticTap`; ao terminar, celebração com contagem e próximo vencimento.

2. **Swipe como atalho, nunca caminho único.** "Como usuária, quero poder arrastar o card para
   o lado quando a resposta estiver virada."
   - Aceite: após revelar, arrastar **para a direita = lembrei (Good)**, **para a esquerda =
     esqueci (Again)**, com rotação/tilt acompanhando o dedo (máx ~16–20°), carimbo "sei/não
     sei" crescendo com o drag e **haptic no commit**; o card que saiu é um *ghost* decorativo
     (≤300ms) e o cursor avança no instante do gesto; swipe **antes** da revelação não avalia;
     botões sempre presentes (WCAG 2.5.4); **desfazer** disponível (volta o último veredito).

3. **Fila correta (FSRS unificado).** "Como usuária, quero revisar exatamente o que está
   vencido, sem cards congelados."
   - Aceite: a fila usa `isCardDue` do FSRS (`due <= hoje || sem due → legado`) em vez de só
     `isDueToday`; revisar um card atualiza `due`, `state`, `lastReviewed`, `timesReviewed` e
     `reviews` de forma coerente; contadores `novas · aprendendo · revisar` no topo derivados
     de `state`; contagens afins (Home/Estudos/Perfil/header) derivam da mesma função.

4. **Criar com o card como formulário.** "Como usuária, ao criar um flashcard eu quero escrever
   na própria carta: pergunta na frente, o card vira, resposta atrás, e ao guardar ele é jogado
   dentro da minha caixinha."
   - Aceite: abrir "novo flashcard" mostra um **card 3D em tela cheia**; `textarea` na face da
     frente (pergunta) → o card **vira em 3D** (automático no "continuar" ou digitando) →
     `textarea` no verso (resposta) → "guardar" faz o card **voar para dentro do baú/envelope
     temático** (voo ≤300ms, `layoutId`) como confirmação, com `hapticSuccess` e toast; no
     "modo simples", volta para os campos empilhados (mesmo card 3D vira apenas preview — ver §8).

5. **Nota → flashcard no mesmo padrão.** "Como usuária, ao transformar uma nota em flashcard eu
   quero um card válido igual ao do wizard."
   - Aceite: `fieldsFor.tsx` cria o card via `initCard` (campos FSRS + `due=hoje`), não mais
     `{...timesReviewed: 0}`; vínculos opcionais preservados.

6. **Acessibilidade & movimento.** "Como usuária com sensibilidade a movimento, quero o mesmo
   fluxo sem o 3D."
   - Aceite: com `prefers-reduced-motion`, flip vira **crossfade**, voo vira fade curto, tilt e
     stack 3D desligam (`useReducedMotion` + `MotionConfig reducedMotion="user"`), swipe vira
     fade breve; botões continuam iguais; `aria-live` anuncia o veredito; alvos ≥44px; foco
     permanece no palco (não some quando o deck esvazia).

## Comandos (gate obrigatório após QUALQUER mudança — AGENTS.md)

- `npm run lint` — typecheck (`tsc --noEmit`).
- `npm run test` — Vitest (jsdom). Foco: `src/lib/__tests__/fsrs.test.ts`
  (estendido), `src/lib/__tests__/reviewMeta.test.ts` (novo), `src/lib/__tests__/cards3d.test.tsx`.
- `npm run build` — Vite → `dist/`.
- `node .github/scripts/check-boundaries.mjs` — obrigatório se tocar `packages/*`
  (esta spec **não** toca `packages/*` — porém rodar mesmo assim é barato).

## Estrutura de pastas / arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/lib/fsrs.ts` | Unificar: + `isCardDue(card, now?)` (FSRS + fallback legado), + `nextDueLabel(card)` (rótulo humano do próximo vencimento), + `cardCounts(cards)` (novas/aprendendo/revisar) — funções puras, sem React |
| `src/context/dataActions.ts` | `handleReviewFlashcard` passa a gravar `lastReviewed` e `timesReviewed` sincronizados com FSRS (conserta o congelado de `:325`) |
| `src/components/wizards/note/fieldsFor.tsx` | Transformação de nota usa `initCard` (`:331-339`) |
| `src/components/views/HomeView.tsx` · `EstudosView.tsx` · `src/lib/headerConfig.ts` · `src/context/navigationEngine.ts` | Contagens de due → `isCardDue` |
| `src/components/flashcards/Card3D.tsx` **(novo)** | Card reversível 3D reutilizável (flip no tap + tilt/drag + presets reduced-motion) |
| `src/components/flashcards/RatingBar.tsx` **(novo)** | 4 botões com intervalo impresso + gestão de foco (acessível) |
| `src/components/flashcards/ReviewSession.tsx` **(novo)** | Fila: palco 3D, stack atrás (2D), swipe, undo, tri-count, `aria-live` |
| `src/components/flashcards/CardCreation3D.tsx` **(novo)** | Card-form 3D: pergunta (frente) → flip → resposta (verso) → "jogar no baú" |
| `src/components/flashcards/CardBaúEnvelope.tsx` **(novo)** | Baú/envelope temático em CSS 3D (tampa/aba que abre) + voo `layoutId` do card |
| `src/components/estudos/StudyRevisarScreen.tsx` | Refatorar para usar `ReviewSession`/`Card3D`/`RatingBar` (mantém rota e gestos de back) |
| `src/components/wizards/FlashcardWizard.tsx` | Passos frente/verso viram o `CardCreation3D` (com toggle "3D ♡ / simples") |
| `docs/specs/SPEC-003-…` | Este documento |

**Sem** alteração em: `types/entity.ts` (campos já existem), `packages/data/src/schema.ts`
(sem bump), `packages/navigation/src/hash.ts` (sem rota nova), `src/lib/stickers.ts`
(fica consumindo `timesReviewed`, que continuamos sincronizando).

## Modelo de dados (unificação — sem novo formato)

**Regra única de agendamento = FSRS** (`src/lib/fsrs.ts`). Campos já persistidos
(`src/types/entity.ts:168-190`): `due`, `stability`, `difficulty`, `retrievability`, `lapses`,
`reviews`, `lastInterval`, `state: 'new'|'learning'|'review'|'relearning'` — legado
`lastReviewed`/`easeFactor`/`timesReviewed` preservados por migração, mas **não** mais usados
como fonte da fila.

- **`isCardDue(card, now?): boolean`** — `due` presente → `due <= hoje`; sem `due`
  (cards pré-migração/transformação antiga) → fallback para a fórmula legada de
  `src/lib/review.ts` (`!lastReviewed || daysSince(lastReviewed) >= intervalFor(timesReviewed)`).
  `review.ts` deixa de ser importado por views (mantém o arquivo exportado apenas p/ backward
  compat; remoção fica como Open Question).
- **`handleReviewFlashcard(id, quality)`** — mantém `schedule(c, quality)` e agora grava:
  `lastReviewed: updated.lastReviewed` (hoje), `timesReviewed` = soma acumulada (mesma semântica
  atual: `+1` apenas para `quality >= 2`), `reviews` do FSRS. `timesReviewed` segue alimentando
  **stickers** (`src/lib/stickers.ts:20,67-68`) e a métrica do Perfil sem mudança.
- **`nextDueLabel(card)`** — intervalo humano para os botões: cards novos/aprendendo mostram
  passos curtos (`<1m`, `10m`, `1d`); review mostra o `interval` calculado (`3d`, `1sem`, `2sem`,
  `1mês`…). Função pura com fallback `—` para seed indefinida.
- **Transformação de nota** passa a criar via `initCard({ ... })` (front/answer + vínculos),
  gerando `due = hoje`, `state: 'new'`.

**Sem `SCHEMA_VERSION` bump** (nenhum campo novo) → sem `MIGRATIONS`. Zod/backup inalterados.

## UI/UX — revisão (estilo Anki + 3D)

Estrutura topo→base (mobile-first, `max-w-md sm:max-w-xl`):

1. **Header da sessão (fino):**
   - **Contador tri estilo Anki**: `novas · aprendendo · revisar` (derivado de `cardCounts`;
     cores tokens: azul/rosa/green).
   - Progresso da sessão discretamente (`3/12`) + **desfazer**.
2. **Palco do card (centro, ~2/3 da tela):**
   - `Card3D`: `aspect-[3/4]`, tap = flip, drag = tilt+swipe; **stack de 2 atrás** em 2D
     (scale/translate, `aria-hidden`) para dar profundidade sem custo de composição.
   - Carimbo "sei ♡ / esqueci" com opacidade = progresso do drag.
   - **Regras CSS-3D** (pesquisa): `perspective` no palco (600–1000), `preserve-3d` no card que
     gira, `backface-visibility:hidden` nas faces (+ `translateZ(0)`), **nunca** `overflow`/
     `opacity`/`filter`/`will-change` no elemento com `preserve-3d` (achata no Safari); clipar
     nas faces; face de trás pré-rotacionada no mount; **sem `will-change`** no flip (quebra
     `backface-visibility` no Chromium).
3. **Barra de ação fixa:**
   - Antes da revelação: botão full-width **"mostrar resposta"**.
   - Depois: **4 botões** `esqueci / custei / lembrei / fácil` com o próximo prazo impresso
     (`<1m` · `10m` · `3d` · `1sem`) e cores dos tokens (errado=red, bom=green, neutros os demais).
   - Swipe é atalho (`→` Good, `←` Again); Hard/Easy só por botão.
4. **Feedback:** carimbo no commit (síncrono) + `hapticTap`; `aria-live` (`role="status"`) anuncia
   "lembrei · volta em 3 dias" / "esqueci · revê agora"; double-tap prevention (não revelar+e
   avaliar no mesmo tap).
5. **Fim da sessão:** celebração (mantém `celebrate('flashcards-done')`) com `reviewedCount` +
   próximo vencimento (`nextRoundInDays` já existente).
6. **Reduced motion:** `MotionConfig reducedMotion="user"` (global) + `useReducedMotion` no
   `Card3D` (flip→crossfade, tilt 0, stack sem lift, voo→fade) — flip por drag frame-a-frame é
   permitido (WCAG: "3D rotation by mouse drag is probably ok"; o flip **automático** é o que
   deve desligar).

**Gesture guard:** o palco usa `touch-pan-y` (não rouba scroll); o swipe do card deve ser
**inócuo** para o edge-swipe-back da Fase 13 (`src/lib/swipe.ts` ignora drags que começam em
elemento com gesture próprio — verificar que o palco desativa a heurística de borda se
necessário, sem remover `handleSystemBack`).

## UI/UX — criação (card como formulário + baú)

- **`CardCreation3D`** (tela da criação via `WizardScaffold`): um card central em `preserve-3d`.
  Passo "frente": `textarea` na face frontal (autofoco — lição Quizlet/Anki). Botão
  **"virar o card ♡"** (ou Enter) aplica `rotateY: 180` (spring 260/26) e dá foco ao `textarea`
  da face traseira — **assim o card vira, sem trocar de tela**. Passo "verso": resposta.
  Passos seguintes (grupo/conceito/disciplina) resumidos em um único "contexto (opcional)"
  colapsável, para o ato de criar ser do card, não do formulário.
- **`CardBaúEnvelope`** (confirmação): um baú/caixa de cartões temático (identidade cecistudy ♡,
  canto 24px, sombras duplas clay-style, mascote cecinho espreitando) em CSS 3D com **aba/tampa
  que abre** (`rotateX` no lid). Ao salvar: o card-form some e um **mini-card** com o mesmo
  `layoutId` monta dentro do baú (`AnimatePresence` + magic-motion) — "o card foi jogado na
  caixinha". Commit do `handleSave` é **síncrono** (persistência imediata); o voo é decorativo
  (≤300ms) e nunca bloqueia o próximo card. `hapticSuccess` + `showToast('flashcard guardado no
  cantinho ♡')`.
- **Modo simples** (fallback): toggle "3D ♡ / simples" no header do wizard. Em "simples", os
  campos frente/verso ficam empilhados (fluxo atual) e o card 3D pequeno é exibido como
  **preview não-interativo** que vira conforme você digita o verso (sem input dentro do 3D —
  evita fricção de teclado/3D no iOS/Android). Usado também como destino natural da
  **transformação de nota** (`NoteTransformWizard` → `FlashcardForm`).
- **Edição** de card existente (`handleUpdateFlashcard`): abre no mesmo `CardCreation3D`
  pré-preenchido em "modo simples" (edição = clareza > novidade).

**Copy:** pt-BR, minúsculo, acolhedor — "qual a pergunta do card?", "qual a resposta?",
"virar o card ♡", "jogar na caixinha", "guardado no baú ♡", "esqueci / custei / lembrei / fácil".
Tokens semânticos, sem hex em classes (hex apenas como dado via `style={{}}` quando preciso).

## Navegação & persistência

- **Sem rota/NavScreen nova**: criação segue em `{kind:'wizard'; type:'flashcard'}`; revisão em
  `{kind:'study'; screen:'revisar'}` (`packages/navigation/src/hash.ts:88-96` + retrocompat
  `#/estudos/flashcards`). Nenhuma mudança em `hash.ts`.
- **Persistência**: inalterada (mesmas chaves `flashcards`/`decks`, `data_json` nativo guarda a
  entidade completa). Export/import/backup sem mudança (sem bump).
- **Header**: `headerConfig.ts`/`navigationEngine.ts` usam `isCardDue` — subtítulo "N cartões
  esperando por você" passa a bater com a fila real.

## Plano de implementação (tasks — ordem por dependência)

> Cada task termina com o gate rodando. Plano detalhado vai para `tasks/plan.md` + `tasks/todo.md`
> **após aprovação desta spec** (fase clean).

1. **TASK-1 — Unificação do scheduler (fundação).**
   - `src/lib/fsrs.ts`: `isCardDue`, `nextDueLabel`, `cardCounts` (puras) + testes.
   - `src/context/dataActions.ts:314-330`: gravar `lastReviewed`/`timesReviewed` coerentes.
   - `src/components/wizards/note/fieldsFor.tsx:331-339`: `initCard`.
   - Trocar `isDueToday` por `isCardDue` em `HomeView`/`EstudosView`/`navigationEngine`/`headerConfig`.
   - Gate: lint + `fsrs.test.ts` estendido + `exportImport.test.ts` (round-trip continua verde) + build.
2. **TASK-2 — `Card3D` + `RatingBar` (building blocks).**
   - `Card3D.tsx`: flip/tap + tilt/drag + reduced-motion + CSS-3D safe. `RatingBar.tsx`: 4 botões
     com intervalo + `aria-pressed`/foco.
   - Gate: lint + teste de componente (`cards3d.test.tsx`: frente→verso no click, reduced-motion
     usa fade).
3. **TASK-3 — `ReviewSession` e refatorar `StudyRevisarScreen`.**
   - Palco 3D, stack 2D, swipe com commit/ghost/haptic, tri-count, undo, `aria-live`,
     confirmação de fim de sessão (mantém `celebrate`).
   - Gate: lint + `reviewMeta.test.ts` (contagens + undo) + build.
4. **TASK-4 — `CardCreation3D` + `CardBaúEnvelope` no `FlashcardWizard`.**
   - Passos frente/verso 3D, contexto colapsável, toggle "3D ♡ / simples", voo `layoutId` para o
     baú, edição em modo simples.
   - Gate: lint + teste leve de render/flip + build + passada manual (criar→voar→revisar no device).
5. **TASK-5 — Passada de polimento & integração.**
   - Contagens por aba coerentes; gesto guard vs edge-swipe-back; reduced-motion full; QA manual
     (onboarding → criar → revisar → stickers → backup round-trip). Gate full + boundary script.

## Testes

- `src/lib/__tests__/fsrs.test.ts` (estender): `isCardDue` (due passado/futuro/sem due → fallback
  legado), `nextDueLabel` (new/aprendendo/review), `cardCounts` (distribuição por `state`).
- `src/lib/__tests__/reviewMeta.test.ts`: tri-contagem, undo (restaura snapshot do card),
  swipe commit síncrono (verdict aplicado antes do ghost).
- `src/lib/__tests__/cards3d.test.tsx`: `Card3D` flip no tap + crossfade com
  `prefers-reduced-motion`; `RatingBar` renderiza 4 CYP + intervalo e dispara `onGrade(0..3)`.
- Mantém padrão Vitest/jsdom (`vitest.config.ts`, `src/lib/__tests__/*`).

## Boundaries (per `check-boundaries.mjs` + AGENTS.md)

- **always (obrigatório):** `npm run lint` + `npm run test` após cada mudança; `npm run build`
  antes de finalizar; `check-boundaries.mjs` (esta spec não toca `packages/*`; rodar é barato).
- **ask first:** mover `fsrs`/`review` para `packages/domain` (canônico por AGENTS.md — mas hoje
  `types/entity.ts` também vive em `src/`; **Open Question**, padroniza com o precedente SPEC-001).
- **never:** `packages/*` importando `react`/`@capacitor/*`/`__TAURI__`; `src/shells`/`src/overlays`
  brancinando por plataforma; hex raw em classes; swipe como único caminho de avaliação;
  flip automático não-desativável com `prefers-reduced-motion`.

## Success Criteria

- Um card criado hoje **volta a aparecer exatamente quando o FSRS manda** (teste de sequência:
  novo → lembrei → due futuro; esqueci → due curto), e os contadores de Home/Estudos/Perfil
  batem com a fila.
- Revisão: front→tap→resposta→4 níveis com prazo, swipe `→`=Good/`←`=Again, undo, tri-count,
  fim com celebração — tudo funcional por botão quando reduced-motion/teclado.
- Criação: card 3D com pergunta→flip→resposta→**voo para o baú**; modo simples equivalente;
  transformação de nota gera card válido (com `due`/`state`).
- Gate verde: `npm run lint` + `npm run test` + `npm run build`.

## Open Questions

1. **FSRS completo vs simplificado.** `fsrs.ts` declara `FSRS_PARAMS` (17 valores) mas `schedule`
   usa uma simplificação com multiplicadores fixos por qualidade. Manter a simplificação (recomendado:
   determinística, testável, suficiente para um app pessoal) ou implementar FSRS-5 completo (retorno
   otimizado por `desiredRetention`)? Não bloquear a UX.
2. **`review.ts` legado:** manter exportado (backward-compat) ou remover após a unificação?
3. **Gestão de decks:** os grupos existem no schema sem UI de gestão; esta spec mantém o picker
   opcional. Criar deck/listagem agora ou numa spec futura?
4. **"Modo simples" padrão:** qual deve ser o default do toggle — 3D (conforme pedido) ou simples
   (seguro)? Proposta: default **3D**, com memória da última escolha (padrão `composePrefs`).
5. **Teclado × flip 3D:** a pesquisa aponta risco real de foco/caret em `textarea` dentro de CSS-3D
   no iOS/Android WebView. Mitigação: face pré-rotacionada, `translateZ(0)`, modo simples como
   fallback — **validar em device real** antes de fechar a spec; se inviável, escalar a criação
   para "modo simples + preview 3D" (preserva o voo do baú).