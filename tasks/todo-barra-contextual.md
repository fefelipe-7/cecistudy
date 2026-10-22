# To-do: Barra contextual — a ação do rodapé é a ação da tela (SPEC-022)

> Spec: [`../docs/specs/SPEC-022-barra-contextual-acoes-da-tela-e-comportamento-estavel.md`](../docs/specs/SPEC-022-barra-contextual-acoes-da-tela-e-comportamento-estavel.md)
> Cópia de grupo: `docs/specs/mobile/SPEC-M-022-...` (no hub `cecigroup`)
> **Regra de ouro:** cada fase fecha com `npm run lint` + `npm run test` +
> `node .github/scripts/check-boundaries.mjs` verdes. `SCHEMA_VERSION` fica
> **inalterada** a fase inteira (a spec é só apresentação e estado de UI).

**Progresso:** 8/8 fases — **entregue em 2026-10-20**. `npm run verify` verde
(typecheck, 1746 testes, boundaries, gate de voz, contrato, build web e mobile).

- **F1** ✅ comportamento da peça: fade reativo (estado real), barra invisível
  inerte (`inert` + `pointer-events-none`), reset por contexto, geometria por
  token (`--contextual-bar-*`), HTML válido (sem botão dentro de botão),
  expansão derivada do contexto, erro com voz, código morto removido.
- **F2** ✅ a regra da ação: `tccSheet` no contexto do app, `openTccSheet` /
  `closeTccSheet` / `openTccCapture` / `openInternshipCaseSession`, a tabela da
  §5.3 na config, o gate de cobertura de `kind` (`BARRA_APARECE` — o
  compilador cobra), e o back que fecha a folha.
- **F3** ✅ a tela do TCC: as cinco folhas moram no contexto, o herói tem
  ação **só** na visão geral, e a barra espelha a ação da aba.
- **F4** ✅ as demais telas: Estágio (o herói cede a ação à barra, com a
  semente da aba), caso do paciente (semente montada pelo motor), notas
  (formulário inline), disciplina (as quatro ações do menu), streak (o mesmo
  destino do botão da tela).
- **F5** ✅ presença, espaço e convivência: classificação por `kind`, espaço
  reservado pela altura real, envelope de entrada/saída igual ao da barra de
  abas, z-index abaixo do overlay e do modal.
- **F6** ✅ teclado virtual (`visualViewport`) e limpeza (órfão
  `ContextualActionMenu` removido, `secondaryActions` fora do tipo).

**Decisões da dona (2026-10-19), já escritas na spec:** herói do TCC com ação
**só** na visão geral · no Estágio o herói **cede** a ação à barra · a barra
invisível fica **inerte** · o back **fecha a folha** antes de sair da tela.

**Ordem das fases:** comportamento da peça (F1) → a regra da ação (F2) → a
tela do TCC (F3) → as demais telas (F4) → presença, espaço e convivência (F5)
→ teclado e limpeza (F6) → gate e docs (F7). Cada fase é um passo
independente: se uma parar, a anterior já está em verde. **F1 e F2 podem
paralelizar**: F1 é o componente, F2 é a configuração e o contexto.

---

## F0 — Preparação

- [x] **F0.1** ~~Confirmar com a dona a ação do herói~~ — **decidido em
      2026-10-19**: o herói do TCC mantém a ação **só** na aba de visão geral
      (D2-i); nas outras quatro abas a primária é da barra. No Estágio, o
      herói **cede** a ação à barra (D2-ii) — o que **supera** a SPEC-010 D1/D3
      para o Estágio (ponteiro no cabeçalho da SPEC-010 já escrito).
- [x] **F0.2** Este arquivo de tasks criado, com fases, arquivos e gates.
- [x] **F0.3** Baseline registrado (medido em 2026-10-19): `npm run lint` → 0
      · `npm run test` → **4 falhas por timeout (5000 ms)** em 3 arquivos
      (`src/components/tcc/__tests__/TccView.test.tsx` e outros dois) sob a
      carga paralela desta máquina — os **mesmos arquivos passam isolados**
      (`npm run test -- src/components/tcc/__tests__/TccView.test.tsx` → 36
      passam), então é timeout de ambiente, não regressão. Se um teste da
      barra falhar, rodar o arquivo isolado antes de culpar a fase.
      · `node .github/scripts/check-boundaries.mjs` → 0.
      O número de testes vem do comando, não de cópia.
- [x] **F0.4** Apontar a SPEC-021 como **superada** (cabeçalho) e escrever a
      reconciliação item a item na §12 da SPEC-022.

**Verificação:** gates verdes antes de tocar em qualquer arquivo de UI.

---

## F1 — O comportamento da peça (D4, D5, D6, D10)

> É a fase que responde "às vezes elas não brem na tela, ou travam". Não muda
> o que a barra **oferece** — muda o que a peça **faz**.

- [x] **F1.1** `src/components/ui/ContextualBottomBar.tsx` — `useScrollFade`
      vira **estado** (não `ref`): a opacidade reage ao scroll, **reinicia**
      por `contextKey` e a barra invisível fica **inerte**
      (`pointer-events-none`, `invisible`, `aria-hidden`).
      - *D4, I7, I8*
      - *Files:* `src/components/ui/ContextualBottomBar.tsx`
- [x] **F1.2** Teste de fade de scroll: rolar para baixo leva a opacidade a 0;
      rolar para cima a traz de volta. Teste de barra invisível inerte: com a
      opacidade 0, o botão **não** é clicável e não é anunciado.
      - *Files:* `src/components/ui/__tests__/ContextualBottomBar.test.tsx`
- [x] **F1.3** `ContextualBottomBar.tsx` — geometria por **constantes**:
      `BAR_HEIGHT`, `BAR_GAP` e `HOST_MARGIN` passam a valer no layout (hoje o
      44 px está hardcoded em duas classes). O conteúdo reserva o espaço pela
      altura real, e não por `6rem`.
      - *D5, D7*
      - *Files:* `src/components/ui/ContextualBottomBar.tsx`,
        `src/shells/MobileAppShell.tsx:250-258`
- [x] **F1.4** `ContextualBottomBar.tsx` — a peça da esquerda vira um
      contêiner `relative` com **dois botões irmãos** (ação + setinha). Some o
      `div role="button"` dentro de `<button>`; a setinha passa a ser focável
      por teclado; o painel de expansão usa `bottom-full` + `right-0` +
      `max-w`, dentro do contêiner.
      - *D5, I9*
- [x] **F1.5** `ContextualBottomBar.tsx` — a expansão reinicia quando o
      `contextKey` muda (hoje `expandedActionId` vaza entre telas e o
      `contextKey` é declarado e nunca lido).
      - *D6, I8*
      - *Files:* `src/components/ui/ContextualBottomBar.tsx`
- [x] **F1.6** `ContextualBottomBar.tsx` — o `catch` de `runAction` **avisa**:
      `showToast(erro(<chave>))`, com a chave nova no catálogo de voz
      (`src/lib/voice.ts`, categoria `ERRO`, duas frases).
      - *D10* — gate: `check-boundaries.mjs` (regra 4, voz)
- [x] **F1.7** `ContextualBottomBar.tsx` — limpeza: import `animate` sem uso,
      `BAR_*`/`BarPresentation` sem uso, ternário no-op
      (`reduced ? 'opacity-100' : 'opacity-100'`), `secondaryActions` do tipo.
      - *D5, §5.1*

**Verificação:** `npm run lint` + `npm run test` verdes.

---

## F2 — A regra da ação (D1, D3) e a tabela de contrato (§5.3)

> É a fase que responde "ao invés de abrir o sheet, abre a edição completa".
> Ela mexe na **regra**, não no caso: a lista de telas da §5.3 vira a fonte
> única e é verificada por teste.

- [x] **F2.1** `src/context/navigationEngine.ts` — o contexto do app ganha
      `tccSheet` (`{ type, id, intent? } | null`), `openTccSheet` e
      `closeTccSheet`, no mesmo padrão de `isCreatingLooseNote`
      (`navigationEngine.ts:415`). Tipos em `src/context/AppContext.tsx`.
      - *D3* — **sem** bump de `SCHEMA_VERSION`
      - *Files:* `src/context/navigationEngine.ts`, `src/context/AppContext.tsx`
- [x] **F2.2** `src/lib/contextBarConfig.ts` — os handlers passam a ser
      injetados (o padrão de `ContextBarConfigActions`), e a tabela da §5.3
      vira a **única** fonte do que a barra oferece. A barra do TCC passa a
      chamar `openTccSheet`, e **não** `openWizard`.
      - *D1, I2, I3*
      - *Files:* `src/lib/contextBarConfig.ts`
- [x] **F2.3** `src/lib/__tests__/contextBarConfig.test.ts` — a tabela da §5.3
      é verificada **linha a linha**: para cada tela, o `id`, o `label`, o
      `ariaLabel` (começa com o `label`) e **qual handler** é chamado. A linha
      "tcc > capítulos" passa a esperar `openTccSheet({type:'chapter', id:'new'})`
      — e o `openWizard` do TCC **sai** do teste.
      - *D1, D12, I2, I3, I12*
- [x] **F2.4** `src/lib/__tests__/contextBarConfig.test.ts` — **gate de
      cobertura**: todo `kind` de `NavScreen` está classificado (com barra ou
      sem). Um `kind` novo sem classificação **quebra a suíte**.
      - *D8, I11*
- [x] **F2.5** `src/lib/contextBarConfig.ts` — a lista `KIND_COM_RODAPE_PROPRIO`
      é completada com o que já divergia: `quiz-loading` e `quiz-play` (que
      hoje recebem a barra por cima do quiz em andamento), `sync` e
      `comparison` (que já têm "voltar" próprio).
      - *D8*
- [x] **F2.6** `src/context/navigationEngine.ts` — o `handleSystemBack`
      consulta a folha aberta **antes** de sair da tela: com a folha do TCC
      aberta, o back do sistema e o "voltar" da barra **fecham a folha**; um
      segundo "voltar" sai da tela.
      - *D13, I13*

**Verificação:** `npm run lint` + `npm run test` verdes.

---

## F3 — A tela do TCC (D2, D3)

- [x] **F3.1** `src/components/views/TccView.tsx` — as cinco sheets passam a
      ler o estado do **contexto** (`tccSheet`) em vez de cinco `useState`
      locais (`TccView.tsx:156-169`); os `onClose` chamam `closeTccSheet`.
      - *D3*
- [x] **F3.2** `src/components/views/TccView.tsx` — os botões do conteúdo
      chamam a **mesma** função que a barra chama: `openTccSheet({type:'chapter',
      id:'new'})`, `openTccSheet({type:'writing'})`, `openTccSheet({type:'meeting',
      id:'new', intent:'agendar'})`, `openTccSheet({type:'task', id:'new'})`,
      `openTccSheet({type:'reference', id:'new'})`.
      - *D1, I3*
- [x] **F3.3** `src/components/views/TccView.tsx` — o herói mantém a ação
      **só** na aba de visão geral ("registrar escrita", D2-i) e nas outras
      quatro abas fica com identidade e resumo, sem CTA. A primária da aba
      passa a ser a ação do conteúdo, espelhada na barra.
      - *D2* — decisão da dona em 2026-10-19
- [x] **F3.4** `src/components/views/TccView.tsx` — a aba de leituras ganha a
      segunda candidata ("guardar link") e a de orientação ganha a segunda
      ("agendar reunião" + "adicionar pendência"): são as telas que passam a
      produzir a setinha de expansão.
      - *D6*
- [x] **F3.5** Teste da tela do TCC: a aba de capítulos, com a barra, abre a
      **sheet de capítulo** — e a sheet recebe o `chapterId` certo.
      - *I3*

**Verificação:** `npm run lint` + `npm run test` verdes.

---

## F4 — As demais telas (D1, D2)

- [x] **F4.1** Estágio: o **herói perde a ação** e a barra a assume — "anotar"
      (diário), "anotar atendimento" (pacientes), "anotar supervisão"
      (supervisão) e "nova sessão" (caso do paciente). A barra volta a ter a
      primária, agora com a **mesma** semente que o herói usava.
      - *D2-ii* — `src/components/views/InternshipDiaryView.tsx`,
        `src/components/views/InternshipCaseView.tsx` — **supera** a SPEC-010
        D1/D3 para o Estágio
- [x] **F4.2** Estágio: a barra do **caso do paciente** semeia o **rótulo**
      do paciente (como o herói faz, `InternshipCaseView.tsx:74-82`) e não a
      chave normalizada; e as abas de pacientes e supervisão semeiam o
      `kind` (`atendimento_clinico`, `supervisao`), como o herói faz.
      - *D1* — `contextBarConfig.ts:184-208`, `:229-232`
- [x] **F4.3** Biblioteca › notas: a barra passa a chamar o **formulário
      inline** (`setIsCreatingLooseNote(true)`), e não o `compose`.
      - *D1* — `contextBarConfig.ts:305-318`
- [x] **F4.4** Faculdade › disciplina: a barra passa a oferecer as **mesmas
      quatro ações** do menu "novo registro" da tela — "anotar aula",
      "nova prova", "registrar estudo", "registrar leitura"
      (`CourseCreateMenu.tsx:16-21`, `:53-57`) — quatro candidatas, para a
      setinha existir de verdade.
      - *D1, D6*
- [x] **F4.5** Estudos › revisão: a barra continua abrindo o wizard de
      flashcard — é a **mesma** chamada que a tela faz
      (`StudyRevisarScreen.tsx:47-52`). Ajustar o teste, se a forma mudou.
      - *D1*
- [x] **F4.6** Streak: a barra passa a ir para o **mesmo** destino do botão
      da tela (`StreakView.tsx:77-84`) e o rótulo passa a dizer "ir para
      estudar".
      - *D1, D12*

**Verificação:** `npm run lint` + `npm run test` verdes.

---

## F5 — Presença, espaço e convivência (D7, D8, D9)

- [x] **F5.1** `src/shells/MobileAppShell.tsx` — o conteúdo reserva o espaço
      da barra pela **altura real** da peça (constante), e não por `6rem`; o
      fade **não** mexe no layout.
      - *D7* — `MobileAppShell.tsx:250-258`
- [x] **F5.2** `src/shells/MobileAppShell.tsx` + `ContextualBottomBar.tsx` —
      a barra entra e sai com o **mesmo envelope de animação** da barra de
      abas (o `AnimatePresence` e o token `navBar`), e o z-index fica
      **abaixo** do overlay de compose/wizard e do modal: as duas peças de
      vidro nunca coexistem.
      - *D9*
- [x] **F5.3** `src/lib/contextBarConfig.ts` + teste — a classificação das
      telas sem barra fica em **um** lugar, e o gate de cobertura de `kind`
      (F2.4) protege.
      - *D8*

**Verificação:** `npm run lint` + `npm run test` verdes.

---

## F6 — Teclado virtual e limpeza (D11, higiene)

- [x] **F6.1** `ContextualBottomBar.tsx` — a barra se posiciona pelo
      `window.visualViewport` (resize e scroll): com o teclado aberto, ela sobe
      com o conteúdo e não cobre o campo focado. Degrade: sem
      `visualViewport`, o comportamento atual.
      - *D11* — telas com campo: `NotesScreen.tsx:103`, `:169`;
        `SyncScreen.tsx:323`
- [x] **F6.2** Remover `src/components/ui/ContextualActionMenu.tsx` (órfão
      desde a SPEC-021 D2) e o campo `secondaryActions` do tipo.
      - *§5.1, escopo (higiene)*
- [x] **F6.3** `rg -n "ContextualActionMenu\|secondaryActions" src/` → vazio.

**Verificação:** `npm run lint` + `npm run test` + boundaries verdes.

---

## F7 — Gate, docs e reconciliação

- [x] **F7.1** `npm run verify` (gate único do mobile) verde: typecheck +
      testes + boundary + build web + build mobile.
- [x] **F7.2** `cecistudy/.context/docs/barra-inferior-contextual.md` — o
      documento ainda descreve a **barra antiga** (três peças, toque longo,
      `ContextualActionMenu`); corrigir para a de duas peças e apontar a
      SPEC-022. (Débito de drift: o documento mente sobre o código.)
- [x] **F7.3** `docs/specs/mobile/SPEC-M-021-...` e
      `docs/specs/mobile/SPEC-M-022-...` no hub: cabeçalho com a
      supersedência e a reconciliação, e a linha nova no índice
      (`docs/specs/README.md`).
- [x] **F7.4** `cecistudy/docs/specs/SPEC-021-...` — cabeçalho apontando
      para a SPEC-022, com o que **não** implementar a partir dela.
- [x] **F7.5** A §12 da SPEC-022 (reconciliação) recebe o estado final:
      o que foi implementado, o que ficou aberto (a dívida do "voltar" que não
      fecha a sheet) e o que foi absorvido.
- [x] **F7.6** `npm run test -- src/lib/__tests__/contextBarConfig.test.ts` e
      `npm run test -- src/components/ui/__tests__/ContextualBottomBar.test.tsx`
      — verdes, e a §8 da spec (critérios de aceite) conferida item a item.

**Verificação:** `npm run verify` verde.
