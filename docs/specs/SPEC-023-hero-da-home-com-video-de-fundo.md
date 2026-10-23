# SPEC-023 · Hero da Home com vídeo de fundo

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **revertida em 2026-10-22** — o vídeo saiu, o hero voltou ao card clássico; o tema `campinho` ficou
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §4.1 (Home Acadêmica) — a Home **agrega** o que os outros módulos expõem; a escolha do fundo é de apresentação
> Decisões: D1, D2, D3, D4, D5, D6
> Supersede: —
> Revertida por: —
> Depende de: SPEC-007 (sistema de movimentos), SPEC-010 (padrão hero), SPEC-M-018 (voz do cecinho no mobile), SPEC-C-013 (identidade), SPEC-C-014 (contrato de voz)
> Data: 2026-10-20 (D1–D3 revisados em 2026-10-22; **revertida em 2026-10-22**)
> Cópia de grupo: **não haverá** — a spec foi revertida antes de subir como `SPEC-M-0xx`

> **Reversão (2026-10-22, decisão da dona do produto).** O card fino com vídeo
> em loop **não ficou bom**: em tela pequena a arte não cabia, e o véu que
> mantinha o texto legível apagava o vídeo. Voltou o hero clássico
> (`HeroSection.tsx`: gradiente + mascote + frase do dia), o vídeo e o
> `hero-ceu` foram **removidos do código**, e o que sobreviveu foi o **tema
> `campinho`** — que era o achado da rodada. O corpo abaixo fica como registro
> do que foi tentado e por quê; **não é contrato**. Nada de `hero-veu`,
> `hero-ink`, `hero-ceu`, `HeroVideo`, `heroVideo.config` ou `assets:hero`
> existe mais.


> **Marca.** Esta spec é de **apresentação** e é **visual-only**: nenhuma regra
> de domínio, nenhum estado, nenhuma navegação e nenhum schema foi tocado. O
> que mudou é o fundo de uma tela que já existiu.

---

## 1. Contexto

- **Situação.** A Home do mobile abre com um hero em card
  (`src/components/views/home/HeroSection.tsx`): `rounded-[26px]`, gradiente
  `from-surface-default to-surface-rose`, borda, sombra, data, título em serifa
  ("bom dia, Marina ✨"), a mascote `welcome-wave` no canto e a frase do dia.
  O texto vem da voz (`src/lib/voice.ts`: `saudacao()` e `resumoDoDia()`).
- **O pedido.** A dona do produto quer o hero com **vídeo de fundo**, em loop
  contínuo, **sem controle de play/pause na tela**, com o **texto de saudação
  por cima, à esquerda**. Na primeira versão o vídeo foi implementado **solto**
  (sangrando até a borda da tela) e a leitura visual **não foi aprovada**: o
  texto ficou grande, o hero continuou com cara de caixa e o véu do texto
  "matou a qualidade do vídeo".
- **O pedido final.** O vídeo **volta para dentro de um card**, mas um card
  **bem fino** — uma faixa, com altura suficiente para o vídeo ficar legal. E
  vem com um **tema novo**, inspirado nas cores do vídeo: no céu é azul, onde
  a cecinho senta é um campinho verde. A Home ficaria **com céu azul acima do
  card de hero** e **verde no resto do tema**; as outras telas, só o verde.
- **A arte.** O vídeo é um pôr do sol sobre a cidade, com a cecinho lendo na
  grama **à direita**. O texto do hero vai sobre o lado esquerdo (a cidade) e
  a cecinho fica livre à direita. A mascote que estava no canto do hero
  **saiu** — a arte já faz esse papel, e as duas juntas viravam ruído.
- **Consequência para a usuária.** A primeira tela do app passa a ter vida
  própria: o lugar que ela abre todo dia deixa de ser um cartão de gradiente e
  vira uma cena. O preço é o custo de um vídeo na tela que mais se abre.

## 2. Decisões

### D1 · O vídeo fica **dentro** de um card fino `[D]`

- **Decisão.** O hero volta a ser um **card** (`rounded-[26px]`, borda,
  sombra) — o mesmo molde dos outros cards do app — mas **fino**: uma faixa de
  proporção `3/1` com teto de altura (`aspect-[3/1] max-h-[168px]`). O vídeo
  é a **superfície do card** (em absoluto, `object-cover`), e o texto senta
  por cima dele.
- **Justificativa.** A leitura "solto" (D1 da versão anterior) foi testada e
  **não passou**: com o vídeo sangrando, o hero continuou com cara de caixa
  (a moldura de cor do app é o que dá a "caixa"), o texto ficou grande em
  cima da arte, e o véu virou um retângulo visível no meio da cena. Dentro de
  um card, a moldura é o card — que é a linguagem do app — e o vídeo pode
  ficar **fino**, que é o que a dona pediu.
- **Alternativa rejeitada.** (a) Vídeo solto, sangrando até a borda — é a
  versão anterior desta spec; rejeitada pela leitura visual. (b) Vídeo de
  fundo da Home **inteira**, com o conteúdo rolando por cima — rejeitado:
  reescreve o layout inteiro da Home e deixa o vídeo em loop o tempo todo que
  a tela estiver aberta. Fica como porta.
- **Consequência aceita.** O card do hero não é igual aos outros: é uma
  faixa, não um bloco. E a proporção `3/1` corta a arte na vertical — o
  enquadramento é o da base (D2).

### D2 · O enquadramento é a **base** da arte; o texto fica à esquerda e pequeno `[D]`

- **Decisão.** O `object-position` do vídeo é `50% 100%` (base da arte: a
  grama e a cecinho) e o texto vive num bloco de `max-w-[70%]` (sm: `58%`),
  no canto inferior esquerdo, com corpo pequeno (`text-[11px]` para a data e a
  frase, `text-xl sm:text-2xl` para o título em serifa).
- **Justificativa.** A arte é assim: a cecinho está à direita, sobre a grama.
  O texto sobre a cidade, à esquerda, não briga com ela. E a base é a única
  fatia que cabe num card fino: o céu do quadro (o azul) fica de fora do
  card — e é o tema que o pinta em cima (D3). O texto encolheu porque a
  primeira versão, com o título em `text-3xl sm:text-4xl`, roubava a cena.
- **Alternativa rejeitada.** (a) Ancorar no meio (`50% 50%`) ou no topo —
  rejeitado porque a cecinho, que está na base e à direita, sai do quadro.
  (b) Manter o texto grande — rejeitado pela leitura visual.
- **Consequência aceita.** O card mostra a parte baixa do quadro: a cidade em
  silhueta, a grama e a cecinho. O pôr do sol do quadro fica de fora.

### D3 · O céu é do tema, acima do card; o verde é o campo `[D]`

- **Decisão.** A Home abre com uma **faixa de céu azul** (`hero-ceu`) acima do
  card do hero, sangrando na largura da tela, e o resto do app é o **verde do
  campo**. O céu é **invariante ao tema** — o vídeo é o mesmo em todos os
  temas, então o céu também é; o que muda por tema é o campo.
- **O tema novo.** `campinho` ("🌿 campinho"): o canvas é um **verde
  dessaturado e claro** (a grama ao entardecer, `#EDF2E4`), as superfícies
  puxam para o verde, e o texto é um **verde-escuro de folha** (`#2E3A26`),
  não preto — o app inteiro passa a pertencer ao mesmo mundo do vídeo.
- **Justificativa.** A arte tem dois mundos: o céu azul no topo e o campo
  verde embaixo. Um card fino não cabe os dois, então o card mostra o campo e
  o tema pinta o céu em cima. A sequência que a usuária vê na Home é
  **cabeçalho → céu → card → campo**, e as outras telas são só o campo.
- **Alternativa rejeitada.** (a) O céu **dentro** do card, cortando a arte
  ainda mais para mostrar o topo do quadro — rejeitado porque o card ficaria
  com a cecinho fora de quadro. (b) O céu como token **por tema** —
  rejeitado porque o céu é da arte, não do tema: o vídeo é o mesmo em todos
  os temas, e um céu que muda com a paleta quebraria a cena.
- **Consequência aceita.** A Home é a **única** tela com azul. Em todos os
  temas o céu aparece — o que é coerente (é o céu do vídeo), mas tira a
  exclusividade do azul ao tema `campinho`. O `campinho` ganha o que importa:
  o **verde** como identidade do app inteiro.

### D4 · O véu é **escuro e local**; o texto do hero é sempre claro `[D]`

- **Decisão.** O véu é `bg-gradient-to-r from-hero-veu from-15% via-hero-veu/80 via-58% to-transparent to-82%`
  — escuro em **todos** os temas, forte no lado do texto e **zero** a partir
  de 82% (a cecinho fica intacta). O texto do hero usa `hero-ink`, que é
  **claro** em todos os temas.
- **Justificativa.** A versão anterior usava a cor da **superfície** do tema
  como véu. Nos temas claros isso **lavava** a arte: a cecinho, que é bege e
  clara, sumia no fundo branco — e a dona apontou exatamente isso ("esse
  fundo desse texto matou muito a qualidade do vídeo"). Escurecer
  **preserva a saturação** da arte e serve para texto claro e escuro ao
  mesmo tempo; então o texto do hero passa a ser **sempre claro**, como num
  cinema.
- **Medição.** O contraste foi medido no **render real** (o texto contra o
  pixel que fica atrás dele, WCAG 2.1) nos **sete** temas, para as três
  peças de texto (título, data e frase do dia):

  | Tema | Título | Data | Frase |
  |---|---|---|---|
  | `rosa-claro` | 9,97 | 7,74 | 7,24 |
  | `campinho` | 8,64 | 6,75 | **6,41** |
  | `oceano` | 9,30 | 7,25 | 6,90 |
  | `amanhecer` | 9,62 | 7,43 | 7,05 |
  | `noturno` | 9,63 | 7,41 | 7,04 |
  | `mar-profundo` | 9,71 | 7,50 | 7,11 |
  | `neon` | 10,02 | 7,78 | 7,30 |

  O pior caso é **6,41:1** — todos passam em **AA para texto normal**
  (≥ 4,5:1), com folga. O mesmo harness mediu o quanto o véu ainda toca a
  arte da cecinho: **delta de 3 a 15** por canal (0–6%), ou seja, a parte da
  arte que a usuária quer ver intacta está intacta.
- **Alternativa rejeitada.** (a) Véu com a cor da superfície do tema —
  rejeitado: lava a arte nos temas claros (medido). (b) Véu de tela inteira
  — rejeitado: é o que matou a qualidade do vídeo na primeira versão.
  (c) `text-shadow` — rejeitado por ser remendo: o problema é o fundo, não o
  texto. (d) Véu com borda reta (gradiente radial ou horizontal num card
  retangular) — rejeitado porque desenha um retângulo visível na cena.
- **Consequência aceita.** O lado esquerdo do card é escurecido. É o preço do
  contraste garantido — e é a parte da arte que não tem a cecinho.

### D5 · O loop só toca quando a tela está à vista e o app está em primeiro plano `[D]`

- **Decisão.** O vídeo:
  - tem `muted` + `playsinline` + `loop` + `autoplay` e **nenhum controle**;
  - tem `preload="none"` e um `poster` (primeiro frame) — o poster é a
    primeira pintura, o vídeo entra depois;
  - **não toca** sob `prefers-reduced-motion: reduce` (o poster fica);
  - **não carrega** em `saveData` ou em rede 2G;
  - **pausa** fora da viewport e com o documento oculto.
- **Justificativa.** `muted` não é detalhe: sem ele iOS e Android **bloqueiam**
  o autoplay e o hero fica no poster para sempre. O `preload="none"` é o que
  o `spec-performance.md` §6.1 exige de um asset ornamental — ele não entra
  no caminho crítico. A pausa é RF-05/RNF-03: loop ornamental que continua
  com a tela em segundo plano come bateria.
- **Alternativa rejeitada.** (a) `<video autoplay>` sem `muted` — rejeitado
  porque **não funciona** no iOS/Android. (b) Controlar o vídeo por botão de
  play/pause na tela — rejeitado por pedido: a dona quer o loop sem
  controle. (c) Pausar só com o documento oculto, ignorando a viewport —
  rejeitado porque a Home é rolável e o hero sai de vista rápido.
- **Consequência aceita.** Em 3G o hero pode ficar no poster por um tempo —
  e a primeira pintura é a mesma imagem, sem salto. A carga do vídeo é
  oportunística, como pede o §6.1.

### D6 · A voz encurta no catálogo, e a regra do hero vira um interruptor `[D]`

- **Decisão.**
  - As quatro frases da família `resumo` (`diaTranquilo`, `diaDeProvas`,
    `diaDeTarefas`, `diaMisto`) encurtam em `src/lib/voice.ts`. Elas **não**
    vão para o componente: o gate de voz (regra 4 do
    `check-boundaries.mjs`) reprova frase de voz escrita inline, e a dívida
    está zerada (`voice-allowlist.json`: `linhas: 0`).
  - O interruptor `HERO_VIDEO.enabled`
    (`src/components/views/home/heroVideo.config.ts`) liga e desliga o
    vídeo sem desfazer commit nenhum — o `RNF-04` do `spec-performance.md`
    exige que cada fase seja reversível "por flag/configuração ou commit
    isolado".
- **Justificativa.** A frase de duas linhas competia com a arte pela atenção.
  O tom, o `♡` e os **números** continuam — o número é o dado, a frase é o
  modo de dizer. O interruptor existe porque a leitura visual é da dona: só
  ela decide se a arte fica.
- **Alternativa rejeitada.** (a) Encurtar a frase no componente — rejeitado
  porque o gate de voz reprova e porque a voz tem um dono só. (b) Apagar a
  frase do dia do hero — rejeitado porque ela carrega o resumo real do dia
  (pendências de tarefa e prova), que é informação, não enfeite.
- **Consequência aceita.** `diaDeProvas` passou a mostrar o número de provas
  (`p.provas`), que a frase anterior não mostrava — ela usava `p.n`, que é o
  número de cartões. A frase de "so provas" agora diz "1 prova" quando é
  uma, e "2 provas" quando são duas.

## 3. Escopo

| Item | Tipo |
|---|---|
| Hero da Home do mobile com vídeo de fundo, dentro de um card fino | UI |
| Componente `HeroVideo` (`src/components/ui/`) | UI |
| Hook `useElementActivity` (`src/lib/`) | UI + performance |
| Faixa de céu na Home (`hero-ceu` em `HomeView.tsx`) | UI |
| Tema novo `campinho` (`src/lib/themes.ts`) | tema |
| Encurtamento da família `resumo` da voz | voz |
| Interruptor `HERO_VIDEO.enabled` | configuração |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Hero da **Faculdade** | escopo pedido: só a Home. A Faculdade tem o seu (`faculdade/HeroSection.tsx`) e a SPEC-014 diz que a tela mantém a composição |
| Hero do **Estágio** | `SPEC-010` D1 trava o molde do Estágio; mudá-lo é outra conversa |
| Hero do **desktop** | o desktop tem o seu (`HeroCard.tsx`, `SPEC-D-014` D92) — ver §7 |
| **RN** (`apps/rn-expo`) | o laboratório é mock visual; vídeo em RN é outra implementação. O `SPEC-015` D9 proíbe regra ali |
| **Áudio** | o vídeo é mudo (D5) — e o arquivo-fonte tinha faixa de áudio, removida |
| Domínio, schema, navegação, estado | nada disso foi tocado |
| **Vídeo de fundo da Home inteira** | rejeitado em D1 — fica como porta |

## 5. Contrato

| Peça | Onde | O que garante |
|---|---|---|
| `HeroVideo` | `src/components/ui/HeroVideo.tsx` | `muted`/`playsinline`/`loop`/`autoplay`, sem `controls`, `preload="none"`, `poster`, `aria-hidden`, `tabIndex={-1}`, e não autoplaya sob reduced motion |
| `useElementActivity` | `src/lib/useElementActivity.ts` | a atividade é viewport **E** documento visível — a regra que o `useCanvasSetup` já usava, agora com um dono só |
| `HERO_VIDEO` | `src/components/views/home/heroVideo.config.ts` | o interruptor e os caminhos dos três arquivos |
| `hero-veu` / `hero-ink` | `src/lib/themes.ts` | o véu (escuro) e o texto (claro) do hero, por tema |
| `hero-ceu` | `src/index.css` | o céu da Home — invariante ao tema, como os tokens da capa e do leitor (TEM-001 B.5) |
| `campinho` | `src/lib/themes.ts` | o tema verde do campo |
| `scripts/generate-hero-video.mjs` | `scripts/` | regenera os três arquivos a partir de `assets/hero-source.mp4` |

### Onde a regra mora (fonte única)

A regra "loop ornamental só corre com o elemento à vista e o app em primeiro
plano" tem **um dono**: `useElementActivity`. O `useCanvasSetup` (gráficos
dithered) **consume** esse hook; o `HeroVideo` **consome** esse hook. Nenhum
dos dois reimplementa a regra — implementá-la duas vezes é o que a
`fonte-unica-da-regra` proíbe, e o `spec-performance.md` §5.4 exige uma
política só.

O céu e o campo do hero também têm um dono cada: o céu é `hero-ceu`
(invariante, no `index.css`) e o campo é o `canvas` do tema. A faixa de céu
é pintada em **um** lugar — `HomeView.tsx` — e o `HeroSection` não sabe
que ela existe.

## 6. Invariantes (verificáveis)

| # | Invariante | Onde se prova |
|---|---|---|
| I1 | O vídeo tem `muted`, `playsinline`, `loop`, `autoplay` e **nenhum** `controls` | `src/components/ui/__tests__/HeroVideo.test.tsx` |
| I2 | O vídeo tem `preload="none"` e `poster` | idem |
| I3 | O vídeo é decorativo: `aria-hidden="true"` e `tabIndex={-1}` | idem |
| I4 | Sob `prefers-reduced-motion`, o vídeo **não** autoplaya | idem |
| I5 | O webm vem antes do mp4 (o browser pula o que não decodifica) | idem |
| I6 | A atividade = viewport **E** documento visível; nasce inativo se o documento já está oculto | `src/lib/__tests__/useElementActivity.test.tsx` |
| I7 | Nenhuma frase de voz inline no componente | `check-boundaries.mjs` regra 4 (`npm run test:voz`) |
| I8 | A frase do dia continua sendo do motor de voz, e o número continua na frase | `src/lib/__tests__/voice.test.ts` |
| I9 | O hero é um **card** (raio + borda) e é **fino** (`aspect-[3/1]`, com teto de altura) | `src/components/views/home/__tests__/HeroSection.test.tsx` |
| I10 | O texto do hero fica numa coluna estreita à esquerda, e o vídeo enquadra a base da arte | idem |
| I11 | Com o interruptor desligado, o hero volta a ser a forma antiga (sem vídeo) | idem |
| I12 | O tema `campinho` existe, é claro, e o canvas dele é **verde** | `src/lib/__tests__/themes.test.ts` |
| I13 | O céu **não** está em `TOKEN_KEYS` — é invariante ao tema | idem |
| I14 | O contraste do texto do hero é ≥ 4,5:1 (AA, texto normal) nos 7 temas | medição no render real (D4) |

## 7. Portabilidade

O **molde hero** é regra comum (`SPEC-C-013` D6, espelhada em `SPEC-D-014`
D92 e `SPEC-010` D1). Esta spec **não muda o molde comum**: ela acrescenta
uma variação de **fundo** a **uma tela de um app**.

- O **desktop** tem o seu próprio hero (`src/components/HeroCard.tsx`), com o
  `D92` decidindo que o hero só aparece em tela de destaque. O vídeo do
  hero da Home **não** é portado: o desktop não tem Home construída, e a
  decisão de fundo é de apresentação local.
- O **tema `campinho`** é local do mobile: os dois apps não compartilham
  paleta (o desktop tem a dele, `SPEC-D-014`). O que é portável, se um dia
  for, é a **decisão** ("um tema que nasce da arte do herói") — não os
  valores de cor.
- Quando (e se) o desktop construir a Home, a decisão a portar é o
  **número e o enunciado** — não o arquivo. A forma seria uma `brief-de-portabilidade.md`
  a partir de [`templates/brief-de-portabilidade.md`](../../../templates/brief-de-portabilidade.md).
- **Cópia de grupo:** este arquivo é a fonte de verdade. A cópia de grupo
  (`docs/specs/mobile/SPEC-M-0xx`) é **pendente** — ela nasce quando a
  decisão for fechada, junto com a revisão do `SPEC-C-013` D6 (que descreve
  o molde hero como "gradiente, eyebrow, título serifado, mascote no canto" —
  descrição que **não** descreve mais o hero da Home).

## 8. Rastreabilidade

| Decisão | Código | Teste | Gate |
|---|---|---|---|
| D1 (card fino) | `src/components/views/home/HeroSection.tsx` | `HeroSection.test.tsx` (I9) | `npm run test` |
| D2 (enquadramento e texto) | `HeroSection.tsx` (`object-position`, `max-w`) | `HeroSection.test.tsx` (I10) | `npm run test` |
| D3 (céu e tema campinho) | `HomeView.tsx` (`hero-ceu`), `src/lib/themes.ts` (`campinho`) | `themes.test.ts` (I12, I13) | `npm run test` |
| D4 (véu escuro e local) | `HeroSection.tsx`, `src/lib/themes.ts` (`hero-veu`, `hero-ink`) | medição de contraste no render real (I14) | revisão de tela |
| D5 (loop sob controle) | `src/components/ui/HeroVideo.tsx` | `HeroVideo.test.tsx` | `npm run test` |
| D5 (pausa fora de vista) | `src/lib/useElementActivity.ts` | `useElementActivity.test.tsx` | `npm run test` |
| D6 (voz encurtada) | `src/lib/voice.ts` | `voice.test.ts` | `npm run test:voz` |
| D6 (interruptor) | `heroVideo.config.ts` | `HeroSection.test.tsx` (I11) | `npm run test` |

## 9. Como rodar

```bash
npm run dev          # http://localhost:3000 — a Home abre com o vídeo
npm run assets:hero  # regenera os arquivos a partir de assets/hero-source.mp4
```

Para desligar o vídeo: `HERO_VIDEO.enabled = false` em
`src/components/views/home/heroVideo.config.ts`. O hero volta a ser o card
antigo, sem desfazer commit.

Para ver o tema novo: Perfil → preferências → tema → **🌿 campinho**.

## 10. Riscos

| Risco | Como está tratado |
|---|---|
| O vídeo **não** toca (política de autoplay, 3G, iOS sem `muted`) | o poster é a primeira pintura; a arte não some, ela só não se move |
| Custo de dados e bateria | `preload="none"`, pausa fora de vista, sem carga em `saveData`/2G, e `muted` (sem som) |
| O véu lavar a arte | o véu é **escuro** (D4): escurecer preserva a saturação; medido nos 7 temas |
| A arte não "combinar" com o texto | o contraste é medido no render real nos 7 temas (D4) |
| O texto em cima da cecinho | o texto fica em `max-w-[70%]` e o enquadramento é a base da arte (D2) |
| A voz divergir entre apps | a frase mora no arquivo de voz do app; a decisão comum é o **número**, não o texto |
