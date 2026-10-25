# To-do: sistema de motion design contextual (SPEC-M-027)

> Spec: [`../../docs/specs/mobile/SPEC-M-027-sistema-de-motion-design-contextual.md`](../../docs/specs/mobile/SPEC-M-027-sistema-de-motion-design-contextual.md)
> **Substitui:** [`todo-transicoes.md`](todo-transicoes.md) (SPEC-007) e a Slice F dela.
> **Regra de ouro:** cada fase fecha com `npm run verify:fast` verde. F2, F6 e F7
> rodam também `node .github/scripts/check-boundaries.mjs` (tocam `src/shells`).
> F9 fecha com `npm run verify`.
> **Marca:** a **§4.10** do referencial foi colada em 2026-10-25 (D19), com o
> texto do anexo A, e as quatro restantes (D6, D12, D15, D21) foram confirmadas
> pela dona do produto no mesmo dia. **Todas as fases estão liberadas**; F7 está
> **adiada por decisão da usuária** (2026-10-25): o shared element de disciplina
> mexe na montagem da pilha e só se valida em aparelho, então vem depois da
> validação. A próxima é F10.
> **Regra de edição:** sempre `write`/`edit`, nunca PowerShell.

**Progresso:** 10/11 fases — F0, F1, F2, F3, F4, F5, F6, F7, F8 e F9 concluídas em
código (2026-10-25); F10 é a validação em aparelho.

**Ordem:** F0 base → F1 fundação → F2 overlays → F3 nota→detalhe → F4 micro →
F5 reveal → F6 navegação/scroll → F7 disciplina → F8 ambiente → F9 bundle →
F10 validação.

**Por que essa ordem.** F0 corrige comportamento e trava a dívida; F1 é a única
fonte de "quanto movimento"; F2 endurece os overlays antes de animá-los; F3 é a
referência do shared element, que F7 repete; F6 é o maior risco (scroll ×
freeze) e vem depois de o resto estar estável; F8 só faz sentido com o perfil
funcionando; F9 e F10 são medição, não construção.

---

## F0 — Base: bugs de gesto, ratchets e linha de base

Fecha: G1, G2, G3, D14, D22, I1, I2, I14.

- [x] **F0.1** G1 — o gesto de borda na web acompanha o dedo (`x` deixa de ser fixo em `0`)
  - Arquivo: `src/shells/MobileAppShell.tsx:296`
  - Teste: `src/lib/__tests__/swipe.test.ts` (caso de `swipeX` não-zero)
- [x] **F0.2** G2 — gesto cancelado no iOS não navega — **código pronto, não verificado em aparelho**
  - Arquivo: `ios/App/App/NativeNavigation/NativeNavigationPlugin.swift:96`
  - Validação: só em aparelho (F10); até lá, marcar como **não verificado**
- [x] **F0.3** G3 — `swipeX` reseta em navegação que não veio do gesto
  - Arquivo: `src/shells/MobileAppShell.tsx`
  - Teste: `src/lib/__tests__/navigationRegression.test.tsx`
- [x] **F0.4** Criar `src/lib/__tests__/motion/importRatchet.test.ts` com a lista
      conhecida de arquivos que importam `framer-motion` (só pode encolher)
- [x] **F0.5** Registrar a linha de base em `artifacts/bundle-report.json` e no
      comentário do ratchet de tokens
- [x] **Gate** `npm run verify:fast` — verde em 2026-10-25: 157 arquivos, 1699
      testes, boundaries OK, voz OK, contrato v22

Arquivos: `MobileAppShell.tsx`, `NativeNavigationPlugin.swift`,
`importRatchet.test.ts` (novo).

---

## F1 — Fundação: tokens, perfil montado e preferência

Fecha: D2, D9, D10, I3, I10.

- [x] **F1.1** Reorganizar `src/lib/motion/tokens.ts` nas seis famílias
      (`micro`, `enterExit`, `navigation`, `sharedElement`, `spring`, `ambient`),
      mantendo os valores atuais — é mudança de nome, não de número
  - Feito como `buildTokens(d, t)`: um construtor, duas saídas (`TOKENS` no
    perfil completo, `profile.tokens` no reduzido). Família é índice, não fonte
    de número — teste garante que nenhuma duração nova entra por ela.
- [x] **F1.2** Passar o `override` do `motionPref` ao `MotionProfileProvider`
      e colocar `MobileOverlays` dentro do provider
  - Feito com `MotionPreferenceGate` nos dois entrypoints; o provider saiu do
    shell (`MobileAppShell.tsx`), que agora só consome `useMotionProfile()`.
- [x] **F1.3** `motionPref: 'sistema' | 'reduzido' | 'completo'` em
      `usePersistentState('motionPref', 'sistema')` no `DataClientProvider`,
      exposto no contexto (mesmo padrão de `themePref`)
- [x] **F1.4** ~~`useMotionPreference()` em `src/lib/motion/`~~ — **não criado**:
      a UI lê `useDataClientApp().motionPref` como qualquer outra preferência, e
      `motionPrefOverride()` (módulo puro) traduz para o `override`. O hook seria
      uma indireção a mais e obrigaria `lib/motion` a depender do contexto.
- [x] **F1.5** UI em Perfil → preferências: row + sheet com três opções
      (`ProfilePreferences.tsx`); texto em `VAZIO.rowMovimento`
- [x] **F1.6** Testes: `override` do provider vence o sistema
      (`components/motion/__tests__`), taxonomia sem duração inventada, e
      `motionPref` fora do payload do backup (`exportImport.test.ts`)
- [x] **Gate** `npm run verify:fast` — 160 arquivos / 1708 testes verdes; a voz
      reprovou o `description=` inline e foi corrigida (`VAZIO.rowMovimento`).
      Depois do ajuste: `tsc`, `check:boundaries` e os testes afetados verdes.

Arquivos: `src/lib/motion/tokens.ts`, `src/lib/motion/profile.ts`,
`src/lib/motion/preference.ts` (novo), `src/lib/motion/index.ts`,
`src/components/motion/MotionPreferenceGate.tsx` (novo),
`src/components/motion/MotionProfileProvider.tsx`, `src/App.tsx`,
`apps/mobile/src/app/main.tsx`, `src/context/DataClientProvider.tsx`,
`src/components/views/perfil/ProfilePreferences.tsx`,
`src/components/views/perfil/ProfilePage.tsx`, `src/components/views/PerfilView.tsx`,
`src/lib/voice.ts`.

---

## F2 — Overlays endurecidos (antes de animar)

Fecha: D8, I4, I5, I6, I7.

- [x] **F2.1** Trava de scroll do documento enquanto houver overlay aberto
      (contador, não booleano: modal sobre modal) — `src/lib/overlayStack.ts`
      (`lockScroll`/`unlockScroll`), lido pelo `Modal`
- [x] **F2.2** Safe area no painel (topo e base), sem animar `env()` — no
      **contêiner** de posição (`POSITION_CLASSES`), não no painel: os três
      sheets que somavam `env()` no `pb` passaram a `p-6` puro, sem padding
      duplicado; `PANEL_SCROLL_CLASSES` desconta as duas inserções do `max-h`
- [x] **F2.3** `inert` no conteúdo de trás enquanto o overlay está aberto —
      `#root` (o portal do `Modal` fica em `body`, fora dele); sai antes do
      retorno de foco, por isso o efeito vem antes do efeito de foco
- [x] **F2.4** `Esc` fecha **só** o overlay do topo — `isTopOverlay(id)` no
      listener de cada `Modal`
- [x] **F2.5** Back do Android cobre **todos** os overlays (não só os 5 atuais)
      — `closeTopOverlay()` no início de `handleSystemBack`; os 5 checks ficam
      como fallback do chunk lazy ainda não montado
- [x] **F2.6** Testes: scroll lock, restauração da posição, `Esc` do topo, back
      — 5 casos em `Modal.test.tsx` (trava, contador com dois abertos,
      `window.scrollTo` não chamado, `Esc` do topo, `inert`) + 1 em
      `navigationRegression.test.tsx` (back fecha o overlay do topo)
- [x] **Gate** `npm run verify:fast` + `node .github/scripts/check-boundaries.mjs`
      — verde em 2026-10-25: 160 arquivos / **1714 testes**, fronteiras, voz e
      contrato OK (`SCHEMA_VERSION=22`)

Arquivos: `src/lib/overlayStack.ts` (novo), `src/components/ui/Modal.tsx`,
`src/context/navigationEngine.ts`, `src/components/ui/__tests__/Modal.test.tsx`,
`src/lib/__tests__/navigationRegression.test.tsx`,
`src/components/views/perfil/ProfileEditSheet.tsx` e `ProfilePreferences.tsx`
(safe area saiu dos três painéis de sheet).

---

## F3 — Fluxo de referência: nota → detalhe

Fecha: D4 (primeira metade), D21, I9.

- [x] **F3.1** `<SharedElement id>` com `layoutId` prefixado e fallback para
      crossfade quando a origem não está montada — `src/lib/motion/SharedElement.tsx`
      (novo; dentro de `lib/motion` porque o ratchet D22 proíbe componente novo
      importar `framer-motion`). O fallback é a ausência de par: sem outra
      instância montada o Motion não anima e a camada faz o fade (bug B3 não volta)
- [x] **F3.2** `LayoutGroup` no nível que contém lista e detalhe — em
      `MobileAppShell.tsx`, em volta das duas camadas (card na 1, página na 2)
- [x] **F3.3** Ligar origem (`NotesScreen`) e destino — a origem é o **card**
      (`SharedElement` com `sharedNoteId`), o destino é a **página do overlay**
      (`layoutId` no `motion.div` da camada 2, só quando `isNoteDetailOpen`).
      Com par, o morph é o movimento e o `overlayVariants` (fade+scale) sai;
      sem par, o fade+scale de sempre
- [x] **F3.4** Teste: mesma string nos dois lados; sem origem, crossfade —
      `src/lib/__tests__/motion/sharedElement.test.tsx`
- [x] **Gate** `npm run verify:fast` — verde em 2026-10-25: 161 arquivos /
      **1716 testes**, fronteiras OK

Arquivos: `src/lib/motion/SharedElement.tsx` (novo),
`src/lib/motion/index.ts`, `src/components/library/NotesScreen.tsx`,
`src/shells/MobileAppShell.tsx`,
`src/lib/__tests__/motion/sharedElement.test.tsx` (novo).

---

## F4 — Microinterações e haptics

Fecha: D15, I13.

- [x] **F4.1** ~~`src/lib/haptics.ts` — `haptic(kind)`~~ — **não criado**:
      `hapticTap`/`hapticSuccess`/`hapticWarning` já existem e já cumprem D15
      (sem `await`, engole erro, no-op no web) em 134 chamadas. Trocar a API
      seria refactor de 134 sítios para ganhar um parâmetro `kind` que ninguém usa
- [x] **F4.2** Aplicar em confirmação (concluir, salvar, toggle) e no commit do
      gesto; nada em scroll/reveal/ambiente — auditado: 74 `hapticSuccess`,
      46 `hapticTap`, 14 `hapticWarning`, **zero** em handler de scroll, reveal
      ou ambiente. O caso limítrofe (`ContextualBottomBar`) chama no handler de
      toque, não no `onScroll` (`:178`, `:189`)
- [x] **F4.3** ~~Microinterações de toque usando `micro`~~ — **descartado com
      motivo**: o feedback de toque do app é CSS (`active:scale-95`, 134 sítios,
      e `.tap-interactive` com `transform .15s`); a família `micro` é TS (0,12 s)
      e não alcança classe CSS sem uma ponte de token que não existe. Converter
      134 sítios para ganhar 30 ms é mudança de design system, não de motion.
      Fica como débito consciente, não como pendência escondida
- [x] **F4.4** Teste: `haptic` não lança em jsdom e não é o único sinal —
      `src/lib/__tests__/haptics.test.ts`: no web não lança e não chama a ponte
      nativa. O "nunca é o único sinal" não é testável em unidade (é revisão de
      cada chamada) e está declarado no cabeçalho do teste
- [x] **Gate** `npm run verify:fast` — verde em 2026-10-25

Arquivos: `src/lib/__tests__/haptics.test.ts` (novo). `src/lib/haptics.ts`
**não** foi tocado.

---

## F5 — Scroll reveal em todas as listas

Fecha: D6.

- [x] **F5.1** `IntersectionObserver` único no shell + contexto —
      `src/components/motion/RevealProvider.tsx` (novo): um observer para o app,
      `Map` de elemento → callback, `disconnect` no unmount. Sem
      `IntersectionObserver` (jsdom, WebView antigo) o contexto fica
      `enabled: false` e o item vira `div` comum
- [x] **F5.2** `<Reveal>` com stagger cap 6 e `initial={false}` —
      `src/lib/motion/Reveal.tsx` (novo) + `revealVariants` em `variants.ts`
      (variante função com `custom={index}`). Mora em `lib/motion` porque o
      ratchet D22 proíbe arquivo novo em `components` importar `framer-motion`
- [x] **F5.3** Aplicar nas listas de Home, Biblioteca, Estudo/Quiz e Perfil —
      Biblioteca: `NotesScreen.tsx:225`; Estudo: `StudyHistoricoScreen.tsx`
      (sessões e quizzes); Perfil: `ProfilePreferences.tsx` (categorias de
      lembrete). **Home desviada com motivo**: as duas listas da Home
      (`AttentionSection`, `TodayClasses`) ficam acima da dobra — o reveal
      nunca armaria — e a de atenção vive dentro de `AnimatePresence
      mode="popLayout"`, que exige filho direto `motion` para tirar o item que
      sai do fluxo; envolver em `Reveal` quebraria essa medição. Home já recebe
      micro (F4) e ambiente (F8)
- [x] **F5.4** Desligado no reduzido; lista vazia não anima — `enabled` lê
      `useMotionProfile().reduced`; lista vazia não monta `Reveal` nenhum
      (o empty state é renderizado no lugar da lista)
- [x] **F5.5** Teste: item visível no primeiro paint não anima; observer
      desconecta no unmount — `src/lib/__tests__/motion/reveal.test.tsx`:
      visível antes de qualquer callback, visível-não-arma (desinscreve sem
      animar), fora da tela arma e entra ao cruzar, `disconnect` no unmount
- [x] **Gate** `npm run verify:fast` — verde em 2026-10-25: 163 arquivos /
      **1720 testes**, fronteiras OK

Arquivos: `src/lib/motion/Reveal.tsx` (novo),
`src/components/motion/RevealProvider.tsx` (novo), `src/lib/motion/variants.ts`,
`src/lib/motion/index.ts`, `src/shells/MobileAppShell.tsx`,
`src/components/library/NotesScreen.tsx`,
`src/components/estudos/StudyHistoricoScreen.tsx`,
`src/components/views/perfil/ProfilePreferences.tsx`,
`src/lib/__tests__/motion/reveal.test.tsx` (novo).

---

## F6 — Navegação: scroll restaurado e fechamento animado

Fecha: D5, D7, I8.

- [x] **F6.1** Guardar a posição de scroll por chave de tela; `pop` restaura,
      `push` começa no topo — `src/lib/scroll.ts`: `planScroll(from, to, restore)`
      alimentado pelo `setStack` (`navigationEngine.ts`) com as chaves de
      `slideBaseKeyOf(slideTopOf(...))`; `scrollToTop()` (já chamado por todas as
      36 ações) consome o plano. `pop` **e** troca de overlay restauram (overlay
      não muda a tela de baixo); `push`/`tab` vão ao topo
- [x] **F6.2** Garantir que o freeze de saída continua correto com a restauração
      (testar Q8 antes e depois) — o congelamento continua sendo capturado
      **antes** de mexer no scroll (`frozenExitScrollY = window.scrollY`) e a
      cópia congelada é `fixed`, então a restauração do documento não a move.
      Coberto por `scrollRestore.test.ts` ("congela a posição da tela que sai
      antes de restaurar"). O quadro congelado em si só se confirma em aparelho
      (F10)
- [x] **F6.3** Fechamento animado de `Modal`, sheet e `Toast`, com `inert` no
      intervalo de saída — `Modal`/`Toast` já tinham `AnimatePresence` + `exit`;
      o que faltava era o `inert`: `ModalOverlay` (novo, dentro de `Modal.tsx`)
      usa `useIsPresent` e aplica `inert` + `aria-hidden` enquanto sai. Sheets
      são `Modal position="bottom"`, herdam o mesmo caminho
- [x] **F6.4** Teste: `scrollRestore` (novo) e `Modal` fechando com presença —
      `src/lib/__tests__/scrollRestore.test.ts` (5 casos) e
      `Modal.test.tsx` ("marca o overlay como inert enquanto ele sai")
- [x] **Gate** `npm run verify:fast` + `node .github/scripts/check-boundaries.mjs`
      — verde em 2026-10-25: 164 arquivos / **1726 testes**, fronteiras OK

Arquivos: `src/lib/scroll.ts`, `src/context/navigationEngine.ts`,
`src/components/ui/Modal.tsx`, `src/lib/__tests__/scrollRestore.test.ts` (novo),
`src/components/ui/__tests__/Modal.test.tsx`.

---

## F7 — Tela de origem montada e shared element de disciplina

Fecha: D4 (segunda metade).

Concluída em 2026-10-25 (reaberta e entregue sem tocar na montagem do shell).

> Decisão de arquitetura: F7.1 e F7.2 não precisaram de mudança no `MobileAppShell`.
> O `AnimatePresence` do shell (modo sync, sem `mode`) mantém a tela que sai
> montada até `safeToRemove()` ao fim do `exit` (`SlideScreen.tsx:100-104`), então
> a tela de origem (grade de disciplinas) já fica montada durante a transição para
> o detalhe — o par `layoutId` tem de onde partir e para onde voltar. Não existe
> `layoutId` órfão: o par só anima quando origem e destino estão montados juntos;
> sem par, o crossfade de sempre (`overlayVariants`) continua.

- [x] **F7.1** Montar a tela de origem sob o detalhe — **não necessário**: a origem já
  fica montada durante a transição (`AnimatePresence` mantém a tela que sai até
  `safeToRemove()`). Sem regressão de montagem; `slideKey`/`slideLayerChanged`
  continuam valendo.
- [x] **F7.2** Garantir que o overlay não remonta a base — não tocado; coberto pelos
  testes existentes de `navigationRegression.test.tsx` (overlay não remonta a base).
- [x] **F7.3** Shared element do card de disciplina → detalhe
  - `src/lib/motion/SharedElement.tsx`: `style?` opcional + `sharedCourseId(id)`
    (`course-card-<id>`, prefixo distinto de `course-<id>` da camada de slide)
  - `src/components/views/faculdade/DisciplinasGrid.tsx`: card envolvido por
    `<SharedElement id={sharedCourseId(c.id)}>` (wrapper, não o `ManageSurface`,
    porque `card-lift`/`press-card` escrevem `transform` no próprio card)
  - `src/components/views/CourseDetailView.tsx`: hero da capa envolvido por
    `<SharedElement id={sharedCourseId(course.id)}>`; comentário de B3 (78-81)
    substituído por documentação do par
  - `src/lib/motion/index.ts`: `sharedCourseId` exportado
- [x] **F7.4** Teste: mesmo `layoutId` nos dois lados + prefixo não colide com a
  chave de camada — `src/lib/__tests__/motion/sharedElement.test.tsx` (2 casos novos)
- [x] **Gate** `npm run verify:fast` + `node .github/scripts/check-boundaries.mjs`
  — verde: 165 arquivos / 1731 testes; fronteiras, voz e contrato OK

Arquivos: `src/lib/motion/SharedElement.tsx`, `src/lib/motion/index.ts`,
`src/components/views/faculdade/DisciplinasGrid.tsx`,
`src/components/views/CourseDetailView.tsx`,
`src/lib/__tests__/motion/sharedElement.test.tsx`.

**Suspeita registrada para F10/Q8 (não alterada nesta fase):**
> O `SlideScreen.tsx` aplica `top: docTop - S` **e** `translateY(-S)` no conteúdo
> da cópia congelada (linhas 69 e 123): suspeita de dupla subtração de `S`, que
> deslocaria o morph do shared element em tela rolada. Não foi alterado porque o
> `SPEC-007` protege o mecanismo e só se verifica em aparelho. Fix de uma linha
> pronto: remover o `transform` (o `top` já coloca a cópia no lugar certo). Ver
> Q8: tela rolada → abrir disciplina → voltar; se o morph começar deslocado, é
> o freeze.

---

## F8 — Movimento ambiente

Fecha: D13, I11.

- [x] **F8.1** `<Ambient>` em `transform`/`opacity`, elemento pequeno —
      `src/components/motion/Ambient.tsx` (novo): CSS puro (`@keyframes
      ambient-float` em `src/index.css`), só `transform`, duração vinda do token
      (`TOKENS.ambient.duration`). Zero `requestAnimationFrame`, zero JS por
      frame. Aplicado em dois elementos pequenos e persistentes: arte do hero da
      Home (`HeroSection.tsx`) e mascote do hero de Estudos (`EstudosView.tsx`).
      **Biblioteca e Perfil ficam sem ambiente**: não têm elemento decorativo
      persistente (o mascote da Biblioteca é o empty state; o do Perfil é o
      avatar da própria usuária)
- [x] **F8.2** Pausa em `document.hidden` e fora do viewport — `visibilitychange`
      + `IntersectionObserver` próprio, ambos via `animation-play-state: paused`
      (pausar não reinicia a fase, então o elemento não salta ao voltar)
- [x] **F8.3** Desligado no reduzido; fora de tela de leitura longa — no perfil
      reduzido a classe `ambient` nem é montada; as telas de leitura (notas,
      leitura longa) não montam `Ambient`
- [x] **F8.4** Medir bateria em aparelho antes de aumentar a intensidade —
      **código pronto, não medido**: a intensidade fica na provisória
      (`ambient: 12` s, deslocamento de 4px); aumentar só com medição em Android
      e iOS (F10)
- [x] **F8.5** Teste: pausa em `hidden`; sem `requestAnimationFrame` ativo —
      `src/components/motion/__tests__/Ambient.test.tsx`: pausa fora do viewport
      e volta, pausa com a aba oculta, perfil reduzido sem animação. "Sem rAF" é
      estrutural (animação é CSS) e está declarado no cabeçalho do teste
- [x] **Gate** `npm run verify:fast` — verde em 2026-10-25: 165 arquivos /
      **1729 testes**, fronteiras OK

Arquivos: `src/components/motion/Ambient.tsx` (novo), `src/index.css`,
`src/components/views/home/HeroSection.tsx`, `src/components/views/EstudosView.tsx`,
`src/components/motion/__tests__/Ambient.test.tsx` (novo),
`src/lib/__tests__/motion/fakeIntersectionObserver.ts` (novo helper de teste).

---

## F9 — Bundle

Fecha: D16, I14.

- [x] **F9.1** Igualar `manualChunks` no build do mobile — a lista virou
      `scripts/vite-manual-chunks.mjs`, importada pelos dois `vite.config.ts`
      (duplicar era como divergiria em silêncio)
- [x] **F9.2** `npm run bundle:report` e comparar com a §9 da spec — `vendor-motion`
      **152.830 B / 50.760 B gzip**, idêntico ao baseline; o build mobile agora
      emite o mesmo chunk, com o mesmo hash (`CL2k_cSx`), antes tudo ia junto no
      `index-*.js`
- [x] **F9.3** Registrar o número; se não melhorou, registrar e não mexer em
      `LazyMotion` — **não melhorou** (é o mesmo código, só separado): sem
      `LazyMotion`, como decidido. O chunk segue `critical` porque o shell
      importa `framer-motion` no caminho de boot; o ganho de F9 é medir o que é
      do motion separado do app, não encolher o runtime
- [x] **Gate** `npm run verify` — verde em 2026-10-25

Arquivos: `apps/mobile/vite.config.ts`, `artifacts/bundle-report.json`.

---

## F10 — Validação em aparelho

Fecha: D18, D11.

- [ ] **F10.1** Rodar Q1..Q20 no **Android** (modelo + versão + data)
- [ ] **F10.2** Rodar Q1..Q20 no **iOS** (modelo + versão + data)
- [ ] **F10.3** Medir frame em push/pop nos dois (DevTools / Instruments)
- [ ] **F10.4** Verificar `prefers-reduced-motion` do sistema nos dois; se o
      Android não entregar, o toggle é o caminho e isso fica registrado
- [ ] **F10.5** Medir bateria do ambiente (15 min em tela inicial)
- [ ] **Gate** matriz preenchida nos dois aparelhos

---

## Matriz de QA manual

Preencher as duas colunas em F10. "—" é não rodado, não é "passou".

| # | Cenário | Esperado | Android | iOS |
|---|---|---|---|---|
| Q1 | Abrir/fechar detalhe de disciplina | push entra da direita; pop sai com parallax atrás | — | — |
| Q2 | Trocar de disciplina `c1 → c2` | crossfade curto, sem empurrão de tela cheia | — | — |
| Q3 | Perfil → semestre → histórico → voltar | transição nos dois sentidos | — | — |
| Q4 | Anotação dentro do detalhe de disciplina | camada própria; sub-aba do curso persiste | — | — |
| Q5 | Gesto de borda antes do limiar | volta ao lugar, sem pulo | — | — |
| Q6 | Gesto de borda além do limiar | continua de onde o dedo soltou | — | — |
| Q7 | Cinco telas em sequência rápida | nada preso no DOM, nenhum `transform` residual | — | — |
| Q8 | Tela rolada → abrir outra → voltar | scroll restaurado e freeze pixel-a-pixel | — | — |
| Q9 | Perfil → "reduzido" | fade curto, sem parallax, gesto desligado | — | — |
| Q10 | Wizard: 5 passos + fechar | overlay entra/sai; passos 40 px; base não remonta | — | — |
| Q11 | Bottom-nav: base ↔ tela auxiliar | barra sai com `y` | — | — |
| Q12 | `Tab` repetido durante um pop | nunca cai na tela que está saindo | — | — |
| Q13 | Gesto nativo no iOS | idêntico ao web | — | — |
| Q14 | Chunk lento (2G) | skeleton dentro da animação, sem skeleton infinito | — | — |
| Q15 | Nota → detalhe | o card vira o topo do detalhe, sem salto | — | — |
| Q16 | Fechar modal | sai com continuidade; foco volta ao gatilho | — | — |
| Q17 | Modal sobre modal + `Esc` | fecha só o do topo | — | — |
| Q18 | Back do Android com overlay aberto | fecha o overlay, não a tela | — | — |
| Q19 | Rolagem com lista de 200 itens | itens entram ao aparecer; nada anima fora da tela | — | — |
| Q20 | App em background 2 min com ambiente | sem dreno; loop pausado | — | — |

---

## Aberto (decisão da dona do produto)

- [x] Colar a seção de motion no `spec-referencial-workspace-academico.md`
      (texto no anexo A da spec) — feito em 2026-10-25, §4.10 (linha 521).
- [ ] Confirmar se o movimento ambiente entra na Home, no Perfil ou nos dois —
      **estado atual**: entrou na Home (arte do hero) e em Estudos (mascote do
      hero); Biblioteca e Perfil ficaram sem elemento ambiente (não têm
      decorativo persistente). Confirmar se é isso ou se falta um elemento.
- [ ] Confirmar a intensidade do háptico em aparelho (F4 só entrega o mínimo).
