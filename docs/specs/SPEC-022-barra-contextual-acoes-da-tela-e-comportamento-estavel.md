# SPEC-022 · Barra contextual: a ação do rodapé é a ação da tela, e o comportamento é estável

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **entregue** (2026-10-20)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §3.2 (recorte do mobile) — **atenção**: a spec referencial **não** descreve a barra contextual (a §4.5 é "Biblioteca (compartilhada)"); a origem do desenho é a decisão da dona do produto em 2026-10-19 (SPEC-021) e a correção do texto do referencial é da dona (ADR-005)
> Decisões: D1..D13
> Supersede: SPEC-021 — **só** D5 (fade) e o caso de borda "tela com múltiplas ações" da §7; o desenho (D1..D4, D6) continua em vigor. **E SPEC-010 D1 e D3, só para o Estágio** (a primária deixa de ser do herói e passa a ser da barra — decisão da dona em 2026-10-19)
> Depende de: SPEC-007 (navegação por pilha), SPEC-010 (herói e ação primária), SPEC-012 (gestão do TCC)
> Espelha: SPEC-M-022 (cópia de grupo em `docs/specs/mobile/`)
> Data: 2026-10-19

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite
> verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

- **Situação.** A barra inferior contextual é o rodapé das telas **auxiliares**
  empilhadas do mobile: duas peças de vidro (`liquid-glass-nav`) na base da
  tela — a peça da esquerda com a **ação principal** da tela e a peça da
  direita com "voltar". O desenho está na SPEC-021; o código está em
  `src/components/ui/ContextualBottomBar.tsx` e a decisão de **qual** ação
  aparece está em `src/lib/contextBarConfig.ts`.
- **O que a usuária reportou (2026-10-19).** "Em alguns momentos elas não
  brem na tela, ou travam, ou se comportam do jeito errado, ou bugam de
  alguma forma." O exemplo concreto: na tela do TCC, aba **capítulos**, ao
  clicar na ação **"adicionar capítulos"**, em vez de abrir a sheet de novo
  capítulo, **abre a edição completa do TCC**.
- **Por que o exemplo é a prova da classe de defeito.** A ação da barra é
  escolhida por `buildContextBarConfig` a partir do `kind`/`tab` da tela, e o
  `onSelect` é um **wizard global** escolhido pelo mesmo mapa
  (`src/lib/contextBarConfig.ts:263-301`):

  | Aba do TCC | Rótulo na barra | O que a barra abre hoje | O que a tela oferece |
  |---|---|---|---|
  | `capitulos` | "adicionar capítulos" | `openWizard('tcc')` — **a ficha do TCC** (`contextBarConfig.ts:266-270`, `297`) | sheet de capítulo (`TccView.tsx:482-488`, `TccView.tsx:1174-1178`) |
  | `leituras` | "registrar leitura" | `openWizard('reading')` — leitura da estante | referência ABNT do TCC (`TccView.tsx:580-587`) |
  | `orientacao` | "nova reunião" | `openWizard('session')` — sessão de estudo | reunião de orientação (`TccView.tsx:926-932`) |
  | `escrita` | "registrar escrita" | `openWizard('task')` — **tarefa** | log de escrita (`TccView.tsx:1142-1144`) |
  | `visao` | "editar tcc" | `openWizard('tcc')` | o herói (`TccView.tsx:1139-1147`) |

  O defeito não é um erro de digitação: é **o mapa associar a entidade do
  wizard global ao rótulo do botão**. Quatro das cinco abas abrem a entidade
  errada. E a barra era o único lugar onde as cinco sheets do TCC
  (`ChapterSheet`, `ReferenceSheet`, `MeetingSheet`, `TaskSheet`,
  `WritingLogSheet` — `TccView.tsx:1174-1204`) poderiam ter sido abertas: como
  a barra nunca as abre, elas só existem dentro do conteúdo da tela, e a
  primária do rodapé fica inacessível. O mesmo padrão aparece fora do TCC: a
  barra do Estágio
  abre o wizard **sem o `kind`** (`contextBarConfig.ts:188`, `208`), a barra do
  caso do paciente semeia a **chave normalizada** do paciente em vez do rótulo
  (`contextBarConfig.ts:229-232`), a barra das notas abre o `compose` enquanto a
  tela abre o formulário inline (`contextBarConfig.ts:314` contra
  `NotesScreen.tsx:138-213`), e a barra da disciplina oferece "editar disciplina"
  enquanto a primária da tela é o menu "novo registro"
  (`CourseCreateMenu.tsx:16-21`).
- **O segundo defeito, do mesmo componente, é de comportamento.** O fade de
  scroll **nunca acontece**: `useScrollFade` muta um `useRef` sem disparar
  re-render (`ContextualBottomBar.tsx:43-79`), então `animate={{ opacity }}`
  (`:146`) nunca recebe alvo novo. Pior: como a barra **nunca é desmontada**
  (`MobileAppShell.tsx:350-356`), o `opacityRef` atravessa telas — a barra pode
  **abrir invisível** numa tela nova, **sumir sozinha** num re-render alheio e
  **não voltar** (o valor só é lido no render). E, com `opacity: 0`, a barra
  continua **clicável** e continua sendo **anunciada** pelo leitor de tela
  (`pointer-events-auto` em `:148`, `:162`, `:236`, sem `visibility` nem
  `aria-hidden` atados à opacidade) — toque fantasma que navega sozinho.
- **O terceiro defeito é de forma.** A peça da esquerda é um `<button>` que
  contém um `div role="button"` (`:152-196`) — HTML inválido, e a setinha de
  expansão é inalcançável por teclado. O painel de expansão é posicionado com
  `absolute bottom-[56px]` (`:206`) dentro de um pai **sem `relative`**: o
  containing block real é o host `fixed` (`:139`), e o menu alinha pela
  **esquerda do botão principal**, não pela setinha, e pode estoura a tela
  estreita. A seleção expandida **não reinicia** na troca de contexto
  (`expandedActionId` em `:87`, com `contextKey` declarado e nunca lido em
  `:86`). E a expansão **nunca aparece em produção**: nenhum ramo de
  `buildContextBarConfig` devolve mais de uma ação — `hasMultiple` (`:132`) é
  sempre falso, e o caminho de SPEC-021 D2 (a setinha) é código morto.
- **O quarto defeito é de espaço.** O conteúdo reserva `pb-[calc(6rem+…)]`
  (`MobileAppShell.tsx:254-256`) só porque existe *config*; com a barra
  invisível sobra uma **faixa vazia** de 96 px. A altura real da peça é 44 px
  (`ContextualBottomBar.tsx:31`), e `BAR_HEIGHT`, `BAR_GAP` e `HOST_MARGIN`
  (`:31-33`) **existem e não são usados** — o layout tem duas fontes de
  verdade.
- **O quinto defeito é de lista.** `KIND_COM_RODAPE_PROPRIO`
  (`contextBarConfig.ts:98-103`) é a lista de telas que já têm rodapé próprio.
  É uma **lista copiada** e já divergiu: `quiz-loading` e `quiz-play` não
  estão nela e caem no `default` (`:357`) — recebem a barra por cima do quiz em
  andamento; `sync` e `comparison` têm "voltar" próprio na tela e mesmo assim
  ganham a peça de voltar.
- **Por que isso é uma spec e não um conserto.** A barra é chrome de navegação
  presente em **toda** tela auxiliar do app. Consertar o sintoma do TCC deixa o
  mapa `tela → wizard` intacto — e o mapa é justamente a origem do defeito.
  A correção precisa ser de **regra**: uma regra só, verificada por teste, que
  impeça a barra de fazer outra coisa que não seja a ação da tela.

---

## 2. Decisões

### D1 · A barra contextual executa a ação contextual da tela — a mesma função que o botão da tela executa

- **Decisão.** O que a barra oferece é a ação que a própria tela oferece no
  mesmo contexto, executada pela **mesma função**. A barra nunca abre um
  fluxo que a tela não abre, e nunca abre a **entidade errada** com o
  **rótulo certo**. Onde a ação da tela é uma sheet, a barra abre a mesma
  sheet; onde a ação da tela é um wizard, a barra abre o mesmo wizard, com a
  mesma semente.
- **Justificativa.** O defeito do TCC é a prova: `buildContextBarConfig`
  escolhe a *entidade* pelo `kind`/`tab` e o *rótulo* pela mesma tabela
  (`contextBarConfig.ts:263-301`), então os dois se separam. Amarrar a barra à
  função da tela troca a tabela de *entidades* pela tabela de *ações*, que é o
  que a usuária espera: o rótulo promete um capítulo, a sheet de capítulo
  abre.
- **Alternativa rejeitada.** (a) Manter o mapa `tela → wizard` e corrigir
  entrada por entrada (trocar `'tcc'` por `'chapter'` e afins) — rejeitada
  porque os wizards do TCC **não existem**: capítulo, referência, reunião,
  pendência e log de escrita são sheets da tela
  (`TccView.tsx:1174-1204`), não fluxos globais. (b) Fazer a barra
  "descobrir" a ação da view por introspecção (o componente declara o que
  pode fazer) — rejeitada porque o registro por view é canal paralelo, com
  corrida entre registro e desmontagem, e não é testável por uma função pura.
- **Consequência aceita.** `buildContextBarConfig` continua sendo função pura,
  mas passa a receber **as ações como handlers** (o padrão que já existe:
  `openWizard`, `openCompose`, `openEditCourse` — `contextBarConfig.ts:74-83`).
  A tabela de contrato da §5 passa a ser a **única** fonte do que a barra
  oferece, e o teste da §8 a verifica linha a linha.

### D2 · A tela tem uma ação primária, com um dono visível: o herói ou a barra — nunca os dois

- **Decisão.** Uma tela tem **uma** ação primária, e ela tem **um** dono
  visível.
  - Onde o **herói** expõe a primária, a barra **não** a repete: mostra só
    "voltar". No TCC, isso vale para a aba **visão geral** (o herói mantém
    "registrar escrita" **só** nela).
  - Onde o herói **não** expõe, a **barra** é a dona da primária e a executa:
    as outras quatro abas do TCC ("adicionar capítulo", "nova referência",
    "agendar reunião", "registrar escrita") e o **Estágio** inteiro
    ("anotar", "anotar atendimento", "anotar supervisão", "nova sessão").
  - Nas telas sem herói com ação, a barra espelha a ação que o **conteúdo**
    oferece (notas, disciplina, revisão de flashcards, streak).
- **Justificativa.** Duas decisões colidiam: o SPEC-010 D3 ("a primária é do
  herói, então a barra leva só secundárias") e o pedido da dona em
  2026-10-19, que é a barra do TCC **ter** a ação "adicionar capítulo" e
  abrir a sheet. A dona resolveu em 2026-10-19: no TCC o herói **mantém** a
  ação **só na visão geral**; no Estágio o herói **cede** a ação à barra. Uma
  regra só cabe nas duas: **um dono visível da primária**, e o dono é o herói
  *ou* a barra.
- **Alternativa rejeitada.** (a) Duas CTAs iguais na mesma tela (herói e
  barra com a mesma ação) — rejeitada porque duplica a porta e é o defeito
  que o SPEC-010 D3 já eliminou no Estágio. (b) Tirar a ação do herói do TCC
  em **todas** as abas — rejeitada pela dona: a visão geral continua com
  "registrar escrita" no herói. (c) Manter a primária do TCC no herói **e**
  na barra — rejeitada, mesma razão de (a). (d) Deixar a barra repetir a
  primária do herói no Estágio — rejeitada pela dona em 2026-10-19.
- **Consequência aceita.** (i) No TCC, o herói deixa de ter a ação fixa
  "registrar escrita" nas **cinco** abas — que mente em quatro delas (na aba
  de capítulos ela oferece "registrar escrita" enquanto a usuária gerencia
  capítulos, `TccView.tsx:1139-1147`) — e passa a tê-la **só** na visão geral;
  nas outras quatro abas a primária é da barra.
  (ii) No Estágio, o herói **cede** a ação à barra (`contextBarConfig.ts:156-212`
  mantém a ação; o que muda é o herói), e o Caso do paciente passa a ter
  "nova sessão" na barra. (iii) Nas demais telas, a barra espelha a ação que a
  tela já oferece. **A D1 e a D3 do SPEC-010 ficam superadas** para o
  Estágio — a primária deixa de ser do herói e passa a ser da barra; o
  SPEC-010 aponta para cá. (iv) As mudanças são visíveis: o herói do
  Estágio perde a CTA e o do TCC perde a CTA em quatro abas — registradas
  nos Riscos (§10).

### D3 · O estado do que a barra abre mora no contexto do app, e a sheet é aberta pela mesma função, venha de onde vier

- **Decisão.** O estado das folhas que a barra precisa abrir (as cinco sheets do
  TCC) sobe para o **contexto do app**, no mesmo padrão de
  `isCreatingLooseNote` (`navigationEngine.ts:415`). O conteúdo e a barra
  chamam a **mesma** função (`openTccSheet` / `closeTccSheet`); não existem
  duas portas para a mesma sheet.
- **Justificativa.** Sem estado compartilhado, a barra teria de alcançar o
  estado local da view — e o único jeito de fazer isso é um protocolo de
  registro (rejeitado em D1-b) ou empurrar a folha para a pilha de navegação.
  O contexto do app já é o lugar do estado de UI efêmera que atravessa telas (o formulário
  de nota avulsa é exatamente esse caso: `isCreatingLooseNote`).
- **Alternativa rejeitada.** (a) Estado local na view + registro da ação pela
  view — rejeitada pelo mesmo motivo de D1-b. (b) Estado na pilha de
  navegação (`NavScreen`) — rejeitada porque a sheet é **sobreposição
  efêmera**, não tela: ela não entra no histórico do navegador, não é
  codificada no hash e não deve sobreviver a um "voltar".
- **Consequência aceita.** O contexto do app ganha `tccSheet`
  (`{ type, id, intent? } | null`) e as ações `openTccSheet` / `closeTccSheet`;
  `TccView` lê o estado do contexto em vez de cinco `useState` locais
  (`TccView.tsx:156-169`). **Nenhuma** mudança de `SCHEMA_VERSION`: é estado de
  UI, não dado persistido.

### D4 · O fade de scroll é estado real: reativo, reiniciado por contexto, e a barra invisível não é clicável nem anunciada

- **Decisão.** A opacidade da barra é um **estado** (não um `ref` lido no
  render). Ela reage ao scroll: para baixo, some; para cima, volta. Ela
  **reinicia** (visível) a cada troca de contexto. E quando está invisível, a
  barra **não recebe toque** e **não é anunciada** (`pointer-events`,
  `visibility` e `aria-hidden` atados à opacidade).
- **Justificativa.** Três defeitos saem da mesma raiz: `setOpacity` escreve
  num `useRef` e não provoca re-render (`ContextualBottomBar.tsx:47-49`), então
  o fade **não acontece**; o `ref` sobrevive à navegação (a barra nunca é
  desmontada — `MobileAppShell.tsx:350-356`), então a barra pode **abrir
  invisível**; e `opacity: 0` não tira a barra do hit-test, então ela navega
  sozinha ao ser tocada no lugar onde "voltar" estava.
- **Alternativa rejeitada.** (a) `MotionValue` do framer-motion, animado sem
  re-render — rejeitada porque o valor ainda precisa ser **lido** por
  `aria-hidden`/`pointer-events`, que são atributos de render. (b)
  `IntersectionObserver` com um sentinela no conteúdo — rejeitada porque
  exige um sentinela por tela e o app rola a `window` (`src/lib/scroll.ts:13-16`).
- **Consequência aceita.** O hook vira `useState` + `useEffect` de reset por
  `contextKey`; a barra invisível ganha `pointer-events-none`, `invisible` e
  `aria-hidden`. O comportamento do scroll continua sendo o pedido da dona
  (SPEC-021 D5): some ao rolar para baixo, volta ao rolar para cima.

### D5 · A geometria da barra é uma só, e a expansão tem containing block e alinhamento próprios

- **Decisão.** Altura da peça, gap entre as peças e folga da base saem de
  **constantes** (as que já existem: `BAR_HEIGHT`, `BAR_GAP`, `HOST_MARGIN` —
  `ContextualBottomBar.tsx:31-33`). A peça da esquerda vira um contêiner
  `relative` com **dois botões irmãos** (a ação e a setinha), e o painel de
  expansão é posicionado com `bottom-full` + `right-0` + `max-w`, dentro desse
  contêiner.
- **Justificativa.** Hoje o 44 px está hardcoded em duas classes (`:163`,
  `:237`), o gap está em `gap-3` (`:148`) e a margem em `1rem` (`:139`), enquanto
  as constantes existem e não são usadas. E o painel usa
  `absolute bottom-[56px]` (`:206`) dentro de um pai **sem `relative`**: o
  containing block real é o host `fixed` (`:139`), a distância vertical vale
  por coincidência numérica (56 − 44) e o alinhamento horizontal é a
  **posição estática** — a borda esquerda do botão principal, não a setinha que
  o abriu, que fica à direita.
- **Alternativa rejeitada.** Manter o painel como filho do host, com `left`/`right`
  manuais — rejeitada porque a posição passaria a depender da largura do
  rótulo do botão.
- **Consequência aceita.** Some o HTML inválido (nenhum `role="button"` dentro
  de `<button>`) e a setinha passa a ser alcançável por teclado. A geometria
  tem **um** lugar: as constantes.
- **Emenda (2026-10-22) — largura é do conteúdo, não do desenho.** A peça
  media `110px`–`220px` fixos por causa da simetria da SPEC-021: rótulo longo
  do TCC ("adicionar pendência") saía truncado sem necessidade. As peças passam
  a medir o próprio conteúdo; só encolhem — com o rótulo truncando — quando a
  soma das duas não cabe na tela (`min-w-0` + `max-w-full` na linha e na peça),
  e a peça de "voltar" não encolhe (`shrink-0`). O painel de expansão troca o
  teto de `220px` pelo da tela (`max-w-[calc(100vw-1.5rem)]`). A altura, o gap
  e a folga continuam vindo dos tokens `--contextual-bar-*`.
  - **Alternativa rejeitada.** Aumentar o teto para um valor fixo maior —
    rejeitada porque o número certo depende do rótulo e do tamanho da tela;
    outro teto fixo só adia o truncamento.
  - **Consequência aceita.** As duas peças deixam de ter a mesma largura; a
    simetria fica por conta da altura e do raio.

### D6 · A expansão existe quando há duas ou mais candidatas, e a seleção reinicia quando o contexto muda

- **Decisão.** A setinha de expansão aparece quando a tela tem **duas ou mais**
  ações contextuais; ela mostra as outras e a peça passa a exibir a
  selecionada. A seleção é **derivada do `contextKey`**: trocar de tela
  reinicia.
- **Justificativa.** A SPEC-021 D2 pediu a setinha, mas nenhum ramo de
  `buildContextBarConfig` devolve mais de uma ação — `hasMultiple`
  (`ContextualBottomBar.tsx:132`) é sempre falso e o caminho é código morto.
  A barra também **não reinicia** a expansão: `expandedActionId` (`:87`) é
  estado solto e o `contextKey` (`:86`) é declarado e nunca lido — a
  expansão "vaza" de uma tela para outra, contra a SPEC-021 §5 e §7.
- **Alternativa rejeitada.** (a) Manter a barra com uma ação só e levar as
  demais ao header — rejeitada porque a setinha foi pedida pela dona e é o
  mecanismo que comporta as telas com mais de uma ação (a disciplina tem
  quatro: `CourseCreateMenu.tsx:16-21`; o TCC em orientação e em leituras
  tem duas cada). (b) Remover o caminho de expansão até existir quem o
  produza — rejeitada porque a SPEC-021 D2 continua em vigor e as telas da
  §5 passam a produzi-lo.
- **Consequência aceita.** As telas com mais de uma ação ganham a setinha
  funcionando, e a seleção é derivada do contexto (sem `useEffect` de reset e
  sem quadro extra).

### D7 · O espaço do conteúdo vem da altura real da peça, e o fade não muda o layout

- **Decisão.** O conteúdo reserva o espaço da barra pela **altura real** da
  peça (uma constante), e não por um número copiado. O **fade** não altera o
  layout: a barra some, o espaço permanece.
- **Justificativa.** Hoje o conteúdo reserva `pb-[calc(6rem+…)]`
  (`MobileAppShell.tsx:254-256`) porque existe *config* — 96 px para uma peça
  de 44 px com 16 px de folga. Com a barra invisível (D4) sobra uma **faixa
  vazia**; e o número 6rem não tem relação com a altura real, que está em
  `BAR_HEIGHT` (`ContextualBottomBar.tsx:31`).
- **Alternativa rejeitada.** Liberar o espaço quando a barra fica invisível
  — rejeitada porque isso faria o conteúdo **pular** durante o scroll, que é
  pior que a faixa vazia.
- **Consequência aceita.** A reserva passa a ser derivada de uma constante
  única; o salto de 24 px ⇄ 96 px na troca de tela encolhe para o valor real.

### D8 · A lista de telas sem barra é derivada do fato, e um teste falha quando um `kind` novo não está classificado

- **Decisão.** A classificação de quais telas **não** recebem a barra fica em
  **um** lugar, com um teste que varre todos os `kind` de `NavScreen` e falha
  quando um kind novo não está classificado.
- **Justificativa.** `KIND_COM_RODAPE_PROPRIO` (`contextBarConfig.ts:98-103`)
  é a lista de telas com rodapé próprio, e é a **segunda fonte de verdade** da
  mesma regra (a primeira é o rodapé da própria tela). Ela já divergiu:
  `quiz-loading` e `quiz-play` não estão nela e caem no `default` (`:357`) —
  a barra aparece **por cima do quiz em andamento**; `sync` tem topbar própria
  (`SyncScreen.tsx:188-199`) e `comparison` tem dois "voltar" próprios
  (`ComparisonDetailScreen.tsx:259`, `:489`), e mesmo assim ganham a peça de
  voltar.
- **Alternativa rejeitada.** Manter a lista e lembrar de atualizá-la a cada
  tela nova — rejeitada porque é exatamente o que já aconteceu.
- **Consequência aceita.** O gate passa a ser um **teste**, não uma
  lembrança: um `kind` novo sem classificação quebra a suíte.

### D9 · A barra nunca fica por cima de overlay, modal ou barra de abas

- **Decisão.** A barra tem z-index **abaixo** do overlay de compose/wizard e do
  modal, e **nunca** coexiste com a barra de abas: a entrada e a saída dela
  usam o mesmo `AnimatePresence` e o mesmo token da barra de abas.
- **Justificativa.** A barra é `z-40` (`ContextualBottomBar.tsx:139`) e o
  overlay de compose/wizard é `z-40` dentro do `<main>`
  (`MobileAppShell.tsx:303`): empate resolvido pela ordem no DOM, e a barra
  fica **por cima** durante o `exit` do overlay. E a troca aba → auxiliar
  mostra as duas peças de vidro sobrepostas por cerca de 240 ms, porque a
  barra de abas sai em `navBar` = 0,24 s (`motion/tokens.ts:78`,
  `MobileAppShell.tsx:323-348`) e a contextual aparece na hora.
- **Alternativa rejeitada.** Subir a barra para `z-[46]` — rejeitada porque
  resolve o sintoma e mantém a lista de exclusão como segunda fonte de
  verdade; e porque "por cima do overlay" continua errado por definição.
- **Consequência aceita.** A barra é montada com o mesmo envelope de animação
  da barra de abas; o rodapé de um overlay (compose/wizard) nunca tem uma
  peça de vidro por cima.

### D10 · Falha da ação é dita em voz alta, com as duas frases do cecinho

- **Decisão.** Quando a ação da barra **rejeita** (erro ou cancelamento), a
  barra avisa: um `toast` com a frase de erro do catálogo de voz, com as duas
  frases (o que houve e o que ela pode fazer).
- **Justificativa.** O `catch` de `runAction` engole o erro em silêncio
  (`ContextualBottomBar.tsx:100-104`): a usuária toca em "editar disciplina" e
  **nada acontece** — sem mensagem, sem som, sem mudança de tela. Isso lê como
  travamento, e é uma das coisas que ela reportou ("travam").
- **Alternativa rejeitada.** (a) Manter o silêncio — rejeitada porque "toque
  sem efeito" é indistinguível de "app travado". (b) Mostrar a mensagem
  dentro da própria barra — rejeitada porque a barra some no scroll e a
  mensagem morre junto; o toast é o canal do app para mensagens de camada 1.
- **Consequência aceita.** A barra passa a depender de `showToast`; a chave
  nova entra no catálogo de voz (`src/lib/voice.ts`, categoria `ERRO`), que é
  verificado pelo gate de voz (regra 4 do `check-boundaries.mjs`).

### D11 · A barra cede espaço ao teclado virtual

- **Decisão.** A barra se posiciona pelo **viewport visual**
  (`window.visualViewport`), não pela janela: com o teclado aberto, ela sobe
  junto com o conteúdo e não cobre o campo focado.
- **Justificativa.** A barra é `fixed` e o app configura o teclado nativo em
  modo `Native` (`src/lib/native.ts:19`), o que **redimensiona** o WebView: a
  viewport de layout encurta, a barra sobe e passa a flutuar sobre o
  conteúdo. Não há uma única ocorrência de `visualViewport` em `src/`. As
  telas com barra **e** campo de texto são a de notas (busca e corpo da nota
  inline, `NotesScreen.tsx:103`, `:169`) e a de pareamento (`SyncScreen.tsx:323`).
- **Alternativa rejeitada.** Esconder a barra quando o teclado abre —
  rejeitada porque a peça de "voltar" é a única saída que a tela oferece
  naquele momento, e o back do sistema continua.
- **Consequência aceita.** A barra passa a ler `visualViewport` (resize e
  scroll) e a se reposicionar; em troca, o layout da barra deixa de ser uma
  conta de CSS.

### D12 · O rótulo da barra é o rótulo da tela, e o nome acessível contém o rótulo visível

- **Decisão.** O rótulo da barra é **a mesma palavra** que a tela usa, e o
  `aria-label` **começa** com o rótulo visível.
- **Justificativa.** "adicionar capítulos" (plural) na barra e "adicionar
  capítulo" na tela (`TccView.tsx:487`) é o primeiro sintoma da divergência de
  ação: quando os dois rótulos divergem, o usuário já desconfia. E o nome
  acessível que **não** contém o texto visível quebra o "label in name"
  (WCAG 2.5.3) em pelo menos quatro ações (`contextBarConfig.ts:146`,
  `:165-166`, `:184-185`, `:265-266`).
- **Alternativa rejeitada.** Manter rótulos próprios da barra — rejeitada
  porque a divergência de rótulo é o que faz a divergência de ação passar
  despercebida.
- **Consequência aceita.** A tabela da §5 traz, para cada ação, o rótulo
  **exato** que a tela usa, e o `ariaLabel` é derivado dele.

### D13 · O "voltar" fecha a folha aberta antes de sair da tela

- **Decisão.** Com uma folha (sheet) aberta, o "voltar" da barra e o **back do
  sistema** fecham a folha primeiro. Só um segundo "voltar" sai da tela.
- **Justificativa.** Hoje a folha é estado local da view: o back do sistema
  sai da tela e a folha some **sem salvar** — a usuária perde o que estava
  digitando. Com o estado da folha no contexto do app (D3), fechar a folha é
  uma operação de primeira classe, e a folha é **sobreposição**, não tela: o
  back que fecha modal é o comportamento esperado em todo app.
- **Alternativa rejeitada.** (a) Deixar como está (a folha fecha junto com a
  tela, sem salvar) — rejeitada pela dona em 2026-10-19. (b) Empilhar a
  folha na pilha de navegação — rejeitada em D3-b: folha não é tela e não
  entra no histórico.
- **Consequência aceita.** O `handleSystemBack` do motor de navegação passa a
  consultar a folha aberta **antes** de sair da tela, e a peça de "voltar" da
  barra deixa de ser a única forma de fechá-la. A dívida que existia
  (o back não fechava a folha) **fecha**.

---

## 3. Escopo

| Item | Tipo |
|---|---|
| Regra da ação da barra (D1) e tabela de contrato por tela (§5) | contrato + código |
| Primária com dono visível: herói **ou** barra, nunca os dois (D2) | UI + código |
| `tccSheet` no contexto do app e `openTccSheet`/`closeTccSheet` (D3) | código |
| O "voltar" e o back do sistema fecham a folha antes de sair da tela (D13) | comportamento |
| Fade de scroll reativo, reset por contexto, barra invisível inerte (D4) | comportamento |
| Geometria por constantes, HTML válido, teclado na setinha (D5) | UI + código |
| Expansão com 2+ candidatas e seleção derivada do contexto (D6) | UI + código |
| Reserva de espaço pela altura real (D7) | UI |
| Classificação das telas sem barra com teste de cobertura de `kind` (D8) | código + gate |
| Z-index e convivência com a barra de abas (D9) | UI |
| Erro da ação com toast de voz (D10) | comportamento |
| Teclado virtual via `visualViewport` (D11) | UI + código |
| Rótulo único e nome acessível contendo o rótulo (D12) | contrato |
| Testes: tabela de contrato por tela, fade, inércia da barra invisível, reset de contexto, HTML válido | teste |
| Correção da lista morta (`ContextualActionMenu` órfão, `secondaryActions` sem uso, import `animate` sem uso, `contextKey` não lido) | higiene |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| O **desenho** das duas peças (SPEC-021 D1..D4, D6) | continua em vigor; esta spec conserta o que a peça **faz**, não como ela é |
| Pressionamento longo e `usePressGesture` (SPEC-021 D6) | já removido; `usePressGesture` continua existindo para o FAB |
| `ContextualActionMenu` como painel de ações | absorvido pela expansão (SPEC-021 D2) — vira **dívida de código morto** a ser removida |
| O **desktop** (`cecistudy-desktop`) | outro app, outro contrato de dados, backend em Rust (ADR-006) |
| O rodapé do desktop (painel contextual do Calendário) | é coluna lateral, não rodapé; regra do desktop vive em `docs/calendario/` |
| O texto da spec referencial | a §4.5 não é a barra contextual; **corrigir o referencial é da dona** (ADR-005) |
| A tela de `notes` reescrita | a barra passa a chamar o **mesmo** formulário inline que o header já chama |
| Mudança de `SCHEMA_VERSION` | nada de dado persistido muda (D3) |

---

## 5. Contrato

### 5.1 Forma

`buildContextBarConfig(input): ContextBarConfig | null` continua sendo a função
pura que decide **se a barra aparece** e **quais são as candidatas**:

```ts
export interface ContextBarAction {
  id: string;              // estável dentro do contexto
  label: string;           // o rótulo que a tela usa (D12)
  ariaLabel: string;       // começa com `label` (D12)
  Icon: ComponentType<{ className?: string }>;
  onSelect: () => void | Promise<void>;  // a MESMA função da tela (D1)
  destructive?: boolean;
  disabled?: boolean;
}

export interface ContextBarConfig {
  contextKey: string;              // identidade do contexto; troca reinicia a seleção (D6)
  primaryActions: ContextBarAction[];  // 1ª = selecionada; 2+ habilita a setinha (D6)
}
```

`secondaryActions` sai do tipo: a barra não renderiza secundárias (SPEC-021
D2, fora de escopo) e o campo hoje é sempre `[]` e nunca lido
(`contextBarConfig.ts:70`, `:135`).

### 5.2 Handlers

A função recebe as ações da tela por injeção (o padrão que já existe em
`ContextBarConfigActions`, `contextBarConfig.ts:74-83`):

| Handler | Assinatura | Quem usa |
|---|---|---|
| `openTccSheet` | `(sheet: TccSheet) => void` | TCC (D3) |
| `closeTccSheet` | `() => void` | TCC (D3) |
| `openInternshipWizard` | `(seed?: InternshipWizardSeed) => void` | Estágio (D1) |
| `openWizard` | `(flow: WizardFlow, courseId?: string, seed?: InternshipWizardSeed) => void` | Estudos › revisar (D1) |
| `openCompose` / `setIsCreatingLooseNote` | `() => void` / `(v: boolean) => void` | Biblioteca › notas (D1) |
| `openEditCourse` | `(courseId: string) => void` | Faculdade › disciplina (D1) |
| `openStudy` / `handleNavigate` | — | Estudos › histórico, streak (D1) |

`TccSheet`:

```ts
export type TccSheet =
  | { type: 'chapter';   id: string }                    // 'new' cria
  | { type: 'reference'; id: string }
  | { type: 'meeting';   id: string; intent: 'agendar' | 'registrar' }
  | { type: 'task';      id: string }
  | { type: 'writing' };
```

### 5.3 Tabela de contrato — o que a barra oferece em cada tela

A tabela é a **fonte única**: o teste da §8 a verifica linha a linha (ação,
rótulo e handler chamado). "Ação da tela" é a coluna que diz qual é a
função que a barra executa.

| Tela | Candidatas da barra | Executa | Ação da tela (mesma função) | Dono da primária |
|---|---|---|---|---|
| `#/estudos/tcc/visao` | — (só "voltar") | — | o **herói** expõe "registrar escrita" (dono da primária, D2) | **herói** |
| `#/estudos/tcc/capitulos` | "adicionar capítulo" | `openTccSheet({type:'chapter', id:'new'})` | `TccView.tsx:482-488` | **barra** |
| `#/estudos/tcc/leituras` | "nova referência" · "guardar link" | `openTccSheet({type:'reference', id:'new'})` · captura de link | `TccView.tsx:580-587` · `TccView.tsx:545-552` | **barra** (2 candidatas → setinha, D6) |
| `#/estudos/tcc/orientacao` | "agendar reunião" · "adicionar pendência" | `openTccSheet({type:'meeting', id:'new', intent:'agendar'})` · `openTccSheet({type:'task', id:'new'})` | `TccView.tsx:926-932` · `TccView.tsx:896-903` | **barra** (2 candidatas → setinha) |
| `#/estudos/tcc/escrita` | "registrar escrita" | `openTccSheet({type:'writing'})` | `TccView.tsx:1142-1144` | **barra** |
| `#/faculdade/{curso}` | "anotar aula" · "nova prova" · "registrar estudo" · "registrar leitura" | `openCompose(courseId)` · `openWizard('exam'\|'session'\|'reading', courseId)` | as mesmas de `CourseCreateMenu.tsx:53-57` | **barra** (4 candidatas → setinha, D6) |
| `#/estagio/diario` | "anotar" | `openInternshipWizard()` | o herói hoje (cede a ação à barra, D2) | **barra** |
| `#/estagio/pacientes` | "anotar atendimento" | `openInternshipWizard({kind:'atendimento_clinico'})` | idem | **barra** |
| `#/estagio/supervisao` | "anotar supervisão" | `openInternshipWizard({kind:'supervisao'})` | idem | **barra** |
| `#/estagio/caso` | "nova sessão" | `openInternshipWizard({kind:'atendimento_clinico', patient: <rótulo>, …})` | o herói hoje (cede a ação à barra, D2) | **barra** |
| `#/estudos/revisar` | "criar flashcard" | `openWizard('flashcard')` | `StudyRevisarScreen.tsx:47-52` | conteúdo |
| `#/estudos/historico` | — (só "voltar") | — | — | — |
| `#/biblioteca/notas` | "nova nota" | `setIsCreatingLooseNote(true)` | `headerConfig.ts:187` | conteúdo (formulário inline) |
| `#/streak` | "ir para estudar" | a navegação que o botão da tela faz | `StreakView.tsx:77-84` | conteúdo |
| `#/templo`, `#/templo/{seção}`, comparação, abordagem, família, histórico de períodos, figurinhas, sincronização | — (só "voltar") | — | — | — |

**A barra nunca oferece** uma ação que não esteja nesta tabela; a tabela não
tem linha para "abrir o wizard X" genérico.

---

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | A barra não aparece em tela primária, overlay (compose/wizard/noteDetail/noteTransform), tela de foco imersivo nem em tela com rodapé próprio | `src/lib/contextBarConfig.ts` | `src/lib/__tests__/contextBarConfig.test.ts` |
| I2 | A barra oferece **exatamente** as candidatas da §5.3, e a 1ª é a ação principal | `buildContextBarConfig` | `contextBarConfig.test.ts` (tabela) |
| I3 | Nenhuma ação da barra abre um fluxo que a tela não abre; **nenhuma** abre a entidade errada com o rótulo certo | §5.3 + D1 | `contextBarConfig.test.ts` (handler chamado por linha) |
| I4 | A barra tem duas peças quando há candidatas e uma quando não há | `ContextualBottomBar.tsx` | `ContextualBottomBar.test.tsx` |
| I5 | O toque na peça de voltar **sempre** navega (nunca reduz, nunca esconde) | `ContextualBottomBar.tsx` | `ContextualBottomBar.test.tsx` |
| I6 | O toque na ação principal executa a ação **imediatamente** (sem longo-press) | `ContextualBottomBar.tsx` | `ContextualBottomBar.test.tsx` |
| I7 | A barra invisível (fade) **não** recebe toque e **não** é anunciada | `ContextualBottomBar.tsx` | `ContextualBottomBar.test.tsx` (novo) |
| I8 | Trocar de `contextKey` reinicia a seleção da ação principal e a expansão | `ContextualBottomBar.tsx` | `ContextualBottomBar.test.tsx` (novo) |
| I9 | A setinha de expansão não é `<button>` dentro de `<button>` e é alcançável por teclado | `ContextualBottomBar.tsx` | `ContextualBottomBar.test.tsx` (novo) |
| I10 | Sob `prefers-reduced-motion`, o fade é instantâneo | `ContextualBottomBar.tsx` | `ContextualBottomBar.test.tsx` |
| I11 | Todo `kind` de `NavScreen` está classificado (com barra ou sem) | `contextBarConfig.ts` | `contextBarConfig.test.ts` (novo, gate) |
| I12 | O rótulo da ação da barra é o rótulo da tela, e o `ariaLabel` começa com ele | §5.3 + D12 | `contextBarConfig.test.ts` |
| I13 | Com folha aberta, o back e o "voltar" **fecham a folha** e não saem da tela | motor de navegação + D13 | `contextBarConfig.test.ts` / teste do motor |

---

## 7. Casos de borda

| Entrada | Comportamento esperado |
|---|---|
| Aba de capítulos do TCC, toque em "adicionar capítulo" | abre a **sheet de novo capítulo** (`ChapterSheet`), não o wizard do TCC |
| Aba de capítulos do TCC, sem capítulo nenhum (estado vazio) | a barra segue oferecendo "adicionar capítulo"; a sheet abre em modo criação |
| Aba de leituras do TCC, toque na setinha | expande para cima as duas candidatas ("nova referência", "guardar link") |
| Aba de orientação do TCC, toque na setinha | expande "agendar reunião" e "adicionar pendência" |
| A usuária rola para baixo | a barra dá fade out e **para de receber toque** |
| A usuária rola para cima | a barra dá fade in e volta a receber toque |
| A usuária navega para outra tela com a barra invisível | a barra **abre visível** (reset por contexto, D4) |
| A ação rejeita (erro) | toast com as duas frases do cecinho; a barra volta ao normal (D10) |
| A usuária toca no lugar de "voltar" com a barra invisível | **nada acontece** (a barra está inerte, D4) |
| Tela de Estágio (três abas) | a barra mostra **só** "voltar" (o herói é o dono da primária, D2) |
| Quiz em andamento (`quiz-play`) | **sem** barra contextual (D8) |
| Teclado virtual aberto numa tela com busca | a barra sobe com o viewport visual e não cobre o campo (D11) |
| Troca de aba do TCC com a barra expandida | a expansão reinicia (D6) |
| Volta do sistema (Android) com uma sheet do TCC aberta | a sheet **fecha** e o conteúdo é preservado; um segundo volta sai da tela (D13) |

---

## 8. Critérios de aceite

- [x] `npm run lint` sai com 0
- [x] `npm run test` sai com 0
- [x] `node .github/scripts/check-boundaries.mjs` sai com 0
- [x] `npm run test -- src/lib/__tests__/contextBarConfig.test.ts` — a linha
      "tcc > capítulos" da §5.3 passa: a barra chama
      `openTccSheet({type:'chapter', id:'new'})` e **não** chama `openWizard`
- [x] `npm run test -- src/lib/__tests__/contextBarConfig.test.ts` — a tabela
      completa da §5.3 é verificada linha a linha (ação, rótulo, handler)
- [x] `npm run test -- src/components/ui/__tests__/ContextualBottomBar.test.tsx`
      — existe teste de **fade de scroll**: opacidade vai a 0 ao rolar para
      baixo e volta a 1 ao rolar para cima
- [x] `npm run test -- src/components/ui/__tests__/ContextualBottomBar.test.tsx`
      — existe teste de **barra invisível inerte**: `pointer-events-none` e
      `inert` quando a opacidade é 0
- [x] `npm run test -- src/components/ui/__tests__/ContextualBottomBar.test.tsx`
      — existe teste de **reset por contexto**: trocar `contextKey` fecha a
      expansão e reinicia a ação principal
- [x] `npm run test -- src/components/ui/__tests__/ContextualBottomBar.test.tsx`
      — a peça da esquerda **não** contém `button button` (HTML válido) e a
      setinha é focável
- [x] `npm run test -- src/lib/__tests__/contextBarConfig.test.ts` — todo
      `kind` de `NavScreen` está classificado (gate de cobertura, D8)
- [x] `rg -n "openWizard" src/lib/contextBarConfig.ts` — as ocorrências são
      **as mesmas chamadas que a tela faz**: revisão de flashcards
      (`StudyRevisarScreen.tsx:47-52`) e o menu de registros da disciplina
      (`CourseCreateMenu.tsx:53-57`). Nenhuma abre um fluxo que a tela não
      abra.
- [x] `rg -n "ContextualActionMenu" src/` — **zero** ocorrências (arquivo
      órfão removido)
- [x] `rg -n "secondaryActions" src/` — **zero** ocorrências (campo morto
      removido do tipo)

---

## 9. Medição

| Métrica | Como medir | Gate |
|---|---|---|
| A tabela de contrato da §5.3 está coberta por teste | `npm run test -- src/lib/__tests__/contextBarConfig.test.ts` | `npm run test` |
| A barra tem teste de fade, de inércia e de reset | `npm run test -- src/components/ui/__tests__/ContextualBottomBar.test.tsx` | `npm run test` |
| Nenhum `kind` de tela ficou sem classificação | teste de cobertura em `contextBarConfig.test.ts` | `npm run test` |
| Nenhum código morto da barra | `rg -n "ContextualActionMenu\|secondaryActions" src/` → vazio | `npm run lint` |
| A barra não abre fluxo que a tela não abre | `rg -n "openWizard" src/lib/contextBarConfig.ts` → 1 ocorrência (flashcards) | `npm run test` |
| Fronteiras de pacote intactas | `node .github/scripts/check-boundaries.mjs` | CI |
| O dado persistido não mudou | `rg -n "SCHEMA_VERSION" packages/data/src/schema.ts` — o valor **não** muda com esta spec | `npm run verify` |

> Números de teste **não** são copiados para cá: quem conta é o comando.

---

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| O herói do TCC perde a CTA em quatro abas (D2-i, decisão da dona em 2026-10-19) e a usuária sente falta da "registrar escrita" no topo | média | média | A ação volta ao herói **só** na aba de visão geral (já é a decisão registrada); nas outras abas, a barra é a porta |
| O herói do Estágio perde a CTA (D2-ii, decisão da dona em 2026-10-19) e a usuária sente que a primária ficou "escondida" na base | média | média | A barra do Estágio é sempre alcançável e some só ao rolar para baixo; a primária volta ao herói com uma linha |
| `visualViewport` não existe em algum WebView antigo | baixa | baixa | `if (!window.visualViewport) return;` — degrade para o comportamento atual |
| A tabela da §5.3 envelhece (tela nova sem linha) | média | alta | O gate de cobertura de `kind` (I11) falha quando um `kind` novo aparece |
| O toque de voltar, com a barra invisível, deixa de parecer clicável | média | baixa | Aceito: a barra some ao rolar para baixo por decisão da dona (SPEC-021 D5) e por D4 ela fica inerte |
| A folha passar a morar no contexto aumenta o estado do app | baixa | baixa | O estado é efêmero e vive ao lado de `isCreatingLooseNote`; nenhuma migração |

---

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `src/lib/contextBarConfig.ts` (handlers) + §5.3 | `contextBarConfig.test.ts` | `npm run test` |
| D2 | `src/components/views/TccView.tsx` (herói) + `src/components/views/InternshipDiaryView.tsx` (herói) + `contextBarConfig.ts` | `contextBarConfig.test.ts` + teste do herói | `npm run test` |
| D3 | `src/context/navigationEngine.ts` (`tccSheet`) + `src/context/AppContext.tsx` (tipos) | `contextBarConfig.test.ts` | `npm run test` |
| D4 | `src/components/ui/ContextualBottomBar.tsx` (`useScrollFade`) | `ContextualBottomBar.test.tsx` | `npm run test` |
| D5 | `src/components/ui/ContextualBottomBar.tsx` (constantes, peça esquerda, painel) | `ContextualBottomBar.test.tsx` | `npm run test` |
| D6 | `src/components/ui/ContextualBottomBar.tsx` (`expandedActionId` derivado) + §5.3 | `ContextualBottomBar.test.tsx` | `npm run test` |
| D7 | `src/shells/MobileAppShell.tsx:250-258` | — (layout) | `npm run lint` |
| D8 | `src/lib/contextBarConfig.ts` (classificação) | `contextBarConfig.test.ts` (cobertura de `kind`) | `npm run test` |
| D9 | `src/shells/MobileAppShell.tsx` (envelope de animação) + `ContextualBottomBar.tsx` (z-index) | `ContextualBottomBar.test.tsx` | `npm run test` |
| D10 | `ContextualBottomBar.tsx` (`runAction`) + `src/lib/voice.ts` | `ContextualBottomBar.test.tsx` | `check-boundaries.mjs` (regra 4) |
| D11 | `ContextualBottomBar.tsx` (`visualViewport`) | `ContextualBottomBar.test.tsx` | `npm run test` |
| D12 | `contextBarConfig.ts` (rótulos) | `contextBarConfig.test.ts` | `npm run test` |
| D13 | `src/context/navigationEngine.ts` (`handleSystemBack`) | teste do motor | `npm run test` |

**Espelho no outro app:** não se aplica — a barra inferior contextual é chrome
do **mobile**. O desktop tem coluna de inspeção no Calendário
(`cecistudy-desktop/docs/calendario/02-grade-desktop.md` D18), que é outra
coisa; a regra de domínio do desktop vive em Rust (ADR-006) e esta spec não
toca o desktop.

---

## 12. Reconciliação com a SPEC-021

| Item da SPEC-021 | Estado | Onde |
|---|---|---|
| D1 — duas peças de vidro pura, igual tamanho, centralizadas | **mantida** | SPEC-022 D5 (a geometria passa a ter constantes) |
| D2 — peça da esquerda com ícone + rótulo + setinha para cima | **mantida, corrigida** | SPEC-022 D5 (HTML válido, teclado) e D6 (a setinha passa a existir de verdade) |
| D3 — "voltar" + seta, sempre navega | **mantida** | SPEC-022 I5 |
| D4 — telas sem ação principal mostram só "voltar", centralizada | **mantida** | SPEC-022 I4 |
| D5 — fade out no scroll para baixo, fade in para cima | **superada** | SPEC-022 D4 (o fade passa a ser estado real, com reset por contexto e barra inerte quando invisível) |
| D6 — nada de pressionamento longo | **mantida** | SPEC-022 I6 |
| §5 — `secondaryActions` ignorado pela barra | **superada** | SPEC-022 §5.1 (o campo sai do tipo) |
| §7 — caso "tela com múltiplas ações principais" | **superada** | SPEC-022 D6 e §5.3 (as telas com 2 candidatas passam a existir: TCC em leituras e em orientação, disciplina) |
| §6 — I1 a I5 (invariantes) | I1, I2, I3, I4 mantidos e ampliados; I5 (fade instantâneo sob movimento reduzido) **superada** por SPEC-022 I10 | — |
| §10 — risco "conflito do hook de scroll com o scroll nativo" | **resolvido** | SPEC-022 D4 (o app rola a `window`; o hook passa a ser estado) |
| §3 — "mapeamento de ação principal por rota (lista fechada)" | **superada** | SPEC-022 §5.3 (a lista fechada passa a ser **ação da tela**, não rota→wizard) |
| §12 — reconciliação com a barra anterior (três peças, longo-press) | mantida | — |

### Reconciliação com a SPEC-010 (padrão hero do Estágio)

| Item da SPEC-010 | Estado | Onde |
|---|---|---|
| D1 — o herói do Estágio tem ação primária no canto superior direito | **superada** (só para o Estágio) | SPEC-022 D2: a primária passa a ser da barra; o herói fica com identidade e resumo |
| D3 — a primária é do herói, a barra leva só secundárias | **superada** (só para o Estágio) | SPEC-022 D2: no Estágio, o herói cede a ação à barra |
| D2 — `ui/HeroCard` é componente puro de apresentação | **mantida** | — |
| D4 (escala), D5 (identidade dos cards), D6 (contrato dos componentes), D7 (um filtro por tela) | **mantidas** | — |
| §3 Escopo (superfície do Estágio com hero) | mantida, com a ressalva da D2 | — |

**O que a SPEC-010 continua autorizando:** o molde do herói, a escala, a
identidade dos cards, o contrato dos componentes e o filtro único. **O que a
SPEC-022 muda:** quem é o dono da primária no Estágio — a barra, não o herói.

**O que a SPEC-021 continua autorizando:** o desenho das duas peças, o texto
"voltar", a ausência de longo-press e o fade por scroll. **O que a SPEC-022
muda:** a *origem* da ação (a tela, não um mapa de wizards), o comportamento
do fade (estado real, reset por contexto, barra inerte) e a forma da peça da
esquerda (HTML válido, com a setinha de verdade).

### Estado da implementação (2026-10-20)

| Decisão | Estado | Onde |
|---|---|---|
| D1 — a barra executa a ação da tela | **implementada** | `src/lib/contextBarConfig.ts` (tabela da §5.3) + `src/components/tcc/__tests__/TccBarraContextual.test.tsx` |
| D2 — um dono visível da primária | **implementada** | `TccView.tsx` (herói só na visão geral) · `InternshipDiaryView.tsx` e `InternshipCaseView.tsx` (herói sem ação) |
| D3 — a folha mora no contexto do app | **implementada** | `navigationEngine.ts` (`tccSheet`, `openTccSheet`, `closeTccSheet`, `openTccCapture`) |
| D4 — fade reativo, reset por contexto, barra inerte | **implementada** | `ContextualBottomBar.tsx` (`useScrollFade`) |
| D5 — geometria por token, HTML válido | **implementada** | `src/index.css` (`--contextual-bar-*`) · `ContextualBottomBar.tsx` |
| D6 — expansão com 2+ candidatas, seleção derivada | **implementada** | `ContextualBottomBar.tsx` · telas do TCC e da disciplina |
| D7 — espaço pela altura real | **implementada** | `MobileAppShell.tsx` (`--contextual-bar-space`) |
| D8 — classificação com gate de `kind` | **implementada** | `BARRA_APARECE` (o compilador cobra) + teste que varre o tipo |
| D9 — nunca por cima do overlay, nunca coexistindo com a barra de abas | **implementada** | `z-30` + envelope `navBar` |
| D10 — falha da ação dita em voz alta | **implementada** | `erro('acaoFalhou')` no catálogo de voz · a casca mostra o toast |
| D11 — teclado virtual (`visualViewport`) | **implementada** | `ContextualBottomBar.tsx` (`useKeyboardInset`) |
| D12 — rótulo único, nome acessível contendo o rótulo | **implementada** | tabela da §5.3 · teste por linha |
| D13 — o back fecha a folha antes de sair | **implementada** | `handleSystemBack` no motor de navegação |

**Dívida que sobrou (declarada, não escondida):** as sheets que moram **fora**
do contexto (wizards, formulários) ainda não têm um back que as feche — elas
têm o próprio rodapé, e fechar a tela é o caminho de saída. O escopo da D13 é
o das folhas do TCC.
