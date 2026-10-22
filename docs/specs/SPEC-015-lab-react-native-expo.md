# SPEC-015 · Laboratório da migração para React Native + Expo

> Status: em andamento
> App afetado: mobile
> Origem: `especificacao-workspace-academico.md` §2 (telas e módulos do cecistudy ♡)
> Decisões: D1..D13
> Depende de: SPEC-002 (motion, navegação, espaçamento), SPEC-010 (padrão hero)

## Contexto

O cecistudy mobile é um app **web empacotado**: React + Vite + Tailwind dentro de
Capacitor. Ele funciona e está em produção. O custo disso é conhecido e já foi
pago em design várias vezes — o `src/index.css` tem onze classes de "focus
immersive" que só fazem sentido num viewport de desktop, o shell tem uma grade
de 12 colunas que em 390px vira uma coluna, e a barra de navegação depende de
`position: fixed` mais `env(safe-area-inset-bottom)` para não ficar sob o
indicador de home do iPhone.

A pergunta desta fase não é "o React Native é melhor". É **como o cecistudy
fica na prática quando ele deixa de ser uma página e vira uma árvore de views**.

Essa pergunta não tem resposta no papel. Duas telas podem ter o mesmo
componente e parecer completamente diferentes: uma tem `backdrop-filter` e a
outra tem `BlurView`; uma tem transição de 300ms e a outra tem mola; uma tem
sombra em duas camadas e a outra tem `elevation: 0` no Android e o card flutua
como um adesivo. **A diferença só aparece rodando.**

Então esta fase entrega um **laboratório**: um app React Native + Expo, parado
ao lado do atual, com o onboarding e as cinco telas principais renderizadas com
aparência fiel e dados realistas. Sem regra de negócio. Sem persistência. Sem
escrita. É um mock que se pode sentir na mão.

O critério de sucesso não é "o código do RN é bonito". É: **uma pessoa toca no
mock e responde "eu prefiro essa versão" ou "não, perdemos algo"** — e a
resposta vem em horas, não em semanas.

## Decisões

### D1 — O `index.css` é a fonte da verdade do design; o RN recebe uma ponte

**Decisão.** `apps/rn-expo/src/tokens/palette.js` espelha o bloco `@theme` de
`src/index.css:17-246`. Nenhum componente do RN escreve hex cru.

**Alternativa rejeitada.** Copiar os valores para um `theme.ts` do RN "do
zero", com hex differentes porque o RN "precisa de mais contraste". Isso cria
uma segunda fonte da verdade que envelhece sem ninguém perceber, e é exatamente
o débito C10 (`packages/design-tokens` já é uma cópia morta e divergente em 12
de 19 cores). Não repetir.

**Consequência.** Um hex novo nasce no `index.css` e precisa ser replicado no
`palette.js`. O preço é uma cópia; o benefício é que o RN e o web falam a mesma
linguagem e a comparação da fase vale alguma. O gate
`scripts/tokens-sync.mjs` (Fase 3 desta spec) compara os dois arquivos.

`palette.js` é JS puro, e não TypeScript, porque `tailwind.config.js` o carrega
em Node — Node não resolve `require` de `.ts`, e o arquivo também carrega as
imagens do mascotote. O tipo vive em `src/tokens/index.ts`, que reexporta. Uma
fonte, duas superfícies.

### D2 — O laboratório fica em `apps/rn-expo/` **fora** do grafo de workspaces

**Decisão.** O diretório mora em `apps/` (junto do outro cliente mobile, como
pede a convenção), mas o `package.json` da raiz o **exclui**:
`"workspaces": ["packages/*", "apps/*", "!apps/rn-expo"]`. Ele tem `node_modules`
e `package-lock.json` próprios.

**Alternativa rejeitada.** Entra no workspace como todo mundo. O problema é
concreto: o app web está em React `19.0.1` e o React Native 0.88 exige
`>=19.1`. Se os dois subírem para o mesmo `node_modules`, o npm hoista a
versão mais nova e **o app de produção troca de React sem ninguém pedir** — o
`vite build` passa, os testes passam, e a resolução de dependências mudou. Um
laboratório de design não pode ser o vetor de uma mudança na app que está no ar.

**Consequência.** `npm install` na raiz não toca no laboratório, e vice-versa.
Um comando a mais para quem mexe aqui. Em troca, `npm install` na raiz continua
sendo seguro.

### D3 — O mock tem dados realistas, não placeholders

**Decisão.** `src/mocks/index.ts` descreve um semestre verdadeiro de Psicologia
clínica: seis disciplinas com código e professor, cinco itens de atenção com
prazo vencido, doze flashcards vencidos, TCC em 62%, catorze horas de estágio no
mês, quatro disciplinas com frequência abaixo do ideal.

**Alternativa rejeitada.** `Lorem ipsum`, listas vazias, `0`. Um array vazio
esconde exatamente o que a migração precisa revelar: como a tela se comporta
com texto de verdade, com linha de verdade, com número de verdade. A quebra de
linha do título de uma disciplina é o achado mais importante da fase, e ela só
aparece com o nome real.

**Consequência.** O dado é mais verboso que um mock trivial, e é uma mentira que
pode ser confundida com verdade por quem ler o código depois. O cabeçalho de
`mocks/index.ts` diz que é literal e não escreve nada.

### D4 — Uma tela montada por vez

**Decisão.** `AppShell` renderiza só a aba ativa. Não há as cinco telas vivas.

**Alternativa rejeitada.** As cinco montadas, como o `SharedScreenLayers` faz no
web. No web isso funciona porque as telas são `div` e o custo é memória de DOM.
No RN cada `ScrollView` mantém uma lista inteira de views nativas com imagem de
mascotote, gradiente e sombra — cinco delas ao mesmo tempo é o caminho curto
para um `OutOfMemoryError` num aparelho intermediário.

**Consequência.** Trocar de aba não tem a animação de "pilha" que o web faz
com `SlideScreen`. No lugar, um cross-fade curto — que é o que o iOS faz com
`UITabBarController` de qualquer jeito, então o comportamento nativo está mais
perto, não mais longe.

### D5 — A tab bar mede em vez de usar `layoutId`

**Decisão.** Cada aba reporta posição e largura no `onLayout`; uma pílula
animada única interpola para o alvo com mola.

**Alternativa rejeitada.** Medir com `measureInWindow` no `useEffect` com um
quadro de atraso, ou usar `react-native-tab-view`, que traz a própria barra e
aí estaríamos avaliando a biblioteca, não o nosso desenho.

**Consequência.** `onLayout` dá posição relativa ao pai, que é o que a pílula
precisa, e é estável sob scroll. A barra precisa de `collapsable={false}` nas
abas, senão o Android reporta `width: 0`.

### D6 — Toda elevação carrega `shadow*` **e** `elevation`

**Decisão.** Os tokens `shadow.*` de `palette.js` trazem os dois campos. O
`tailwind.config.js` extrai só a parte CSS, porque `boxShadow` do Tailwind não
tem equivalente Android — mas todo `style` que usa sombra no RN recebe a
elevação.

**Alternativa rejeitada.** Só `shadowColor`/`shadowOffset` (iOS). O card fica
perfeito no simulador do iOS e **invisivelmente plano no Android**, e o
Android é metade do mercado.

**Consequência.** Nenhum estilo no RN escreve `shadow*` sem `elevation`. É uma
regra de uma linha, verificável a olho.

### D7 — Toda animação passa por `useReducedMotion()`

**Decisão.** `src/lib/motion.ts` expõe `useReducedMotion()` lendo
`AccessibilityInfo.isReduceMotionEnabled()` com assinatura em evento.
`useEnter`, `useSpringValue` e `Tappable` consultam antes de animar. Com
movimento reduzido, o conteúdo **aparece sem transladar**.

**Alternativa rejeitada.** Deixar cada componente decidir. Então metade das
telas respeita, metade não, e ninguém percebe até alguém com
`prefers-reduced-motion` ligado abrir o app e ver a tela tremer.

**Consequência.** Uma animação é informação quando o texto depende dela. Fade
sem deslocamento é seguro; cascata sem deslocamento vira um piscar. Por isso
`useEnter` zera a distância, não a opacidade.

### D8 — Haptico marca decisão, não movimento

**Decisão.** `src/lib/haptics.ts` com quatro verbos: `tap` (seleção), `press`
(ação primária), `success` (guardou), `warn` (pede cuidado). `Tappable` chama
`tap` por padrão; `strong` chama `press`. Nada dispara haptic em scroll nem em
entrada de card.

**Alternativa rejeitada.** Haptic em toda interação. É o caminho curto para o
app vibrar o aparelho a cada quadro, e vibrate-se torna ruído — a partir daí
o sinalsome.

**Consequência.** O mock é mais silencioso que o app web por não ter haptic, e
isso é proposital: a comparação de haptic é da Fase 3.

### D9 — Sem persistência, sem contexto, sem regra

**Decisão.** Onboarding é `useState`. Não há `AsyncStorage`, não há
`packages/*`, não há `useApp`. Nenhuma tela escreve em lugar nenhum.

**Alternativa rejeitada.** Já ligar o `packages/domain` para ter dado real. Isso
transforma a fase numa migração de código e deixa de ser uma fase de design —
e aí a comparação "qual dos dois apps é mais bonito" deixa de ser limpa, porque
os dois passam a ter a mesma lógica e só muda o desenho.

**Consequência.** Recarregar o app volta ao onboarding. É o comportamento
correto para um mock, e é o primeiro item a quebrar quando a fase virar real.

### D10 — O perfil é tela cheia, não quinta aba

**Decisão.** A barra tem quatro abas. O perfil abre pelo avatar do header e
ocupra a tela inteira, com botão de fechar.

**Alternativa rejeitada.** Botão de sair da barra para voltar à home. Um destino
que desaparece da barra e reaparece quando você chega nele parece quebrado — e
a pessoa não sabe se tocou errado.

**Alternativa rejeitada (2).** Cinco abas. A barra fica com 78px por aba em
390px e o rótulo de "biblioteca" não cabe junto do ícone; o app web já escolheu
quatro, e a escolha foi boa.

**Consequência.** A barra de quatro abas é o mesmo contrato do web, e o avatar
continua sendo a porta do perfil — nenhuma das duas telas perde o lugar que já
tinha.

### D11 — Um só botão, com peso nomeado

**Decisão.** `Button` tem `primary`, `brand`, `secondary` e `quiet`. A regra
não escrita da casa é: **uma ação `primary` por tela**.

**Alternativa rejeitada.** Portar `button.tsx` (shadcn, seis variantes) mais as
meia dúzia de botões escritos à mão que existem no web — que é o estado atual
do app. Cada botão tem um peso diferente, e é por isso que a tela parece "quase
certa" e não certa.

**Consequência.** Quando dois botões disputam a primária, a tela está errada.
Isso é discutível na revisão de design, e é a pergunta que a fase existe para
fazer.

### D12 — NativeWind para as classNames, tokens para o gradiente e a sombra

**Decisão.** `className` cobre layout, cor, tipografia e borda.
`LinearGradient`, `BlurView`, `Pressable` e `StyleSheet` ficam onde a
className não alcança.

**Alternativa rejeitada.** `StyleSheet` puro em tudo. Zero dependência a mais,
mas a migração de tela deixa de ser copiar e adaptar, e a distância visual
entre "o que o web faz" e "o que o RN faz" passa a incluir erro de digitação de
token — o que mascara o que a fase quer medir.

**Alternativa rejeitada (2).** NativeWind **e** gluestack. gluestack entrega
`Sheet` e `Tabs` prontos, que seria mais rápido; mas aí o mock passa a mostrar
a aparência do gluestack, não a do cecistudy, e a comparação perde o sentido.

**Consequência.** NativeWind 4 exige Tailwind 3, e a raiz usa Tailwind 4. São
duas versões do Tailwind no repositório, em árvores separadas — exatamente o que
D2 pagou para isolar.

### D13 — O pipeline de estilo é verificado por gate, não por "build verde"

**Decisão.** O `npm run verify` do laboratório tem três passos, e o terceiro é
novo por causa da revisão de 2026-10-17: **`check:classes`**
(`scripts/classes-check.mjs`), que extrai todo className estático de `src/**`,
compila o CSS pelo próprio Tailwind e falha listando o que não produz nada.
Completam o trio: `check:tokens` (a ponte com `index.css`) e `typecheck`.

**Alternativa rejeitada.** Confiar que "o build saiu" significa que o estilo
aplicou. **Não significa.** A primeira bateria desta fase produziu um bundle
Android de 3,1 MB, sem um erro de build, com **todo className morto** — a
causa raiz foi `metro.config.js` inexistente (o `withNativeWind` é quem injeta
o CSS no bundle), e o sintoma foi o app inteiro sem estilo: texto preto sobre
canvas branco, zero padding, zero raio. Foi exatamente o "desastre visual"
relatado. Sem gate, a próxima classe morta reaparece do mesmo jeito: em
silêncio, no aparelho.

**Consequência.** Classe nova que o `tailwind.config.js` não conhece quebra
`npm run verify` — inclusive no CI de quem roda sem aparelho. O `expo export`
continua como verificação adicional (critério 2), e o `npm run web` vira a
pré-visualização mais barata da fase.

## Escopo

**Entregue nesta fase.**

- `apps/rn-expo/` — projeto Expo SDK 58 / React Native 0.88 / React 19.3
- Pipeline de estilo completo: `metro.config.js` (com `withNativeWind`),
  `babel.config.js` na forma documentada do NativeWind 4 e `tailwind.config.js`
  derivado de `palette.js`
- Design system em `src/tokens/` + `tailwind.config.js` derivado
- Primitivas: `Aurora`, `HeroCard`, `Card`, `SectionTitle`, `Section`, `Card`,
  `Button`, `Pill`/`PillGroup`/`Tag`, `Tappable`, `Mascote`, e o bloco de
  feedback (`EmptyState`, `ProgressBar`, `StatusChip`, `MetricTile`,
  `WeekRhythm`, `DashedDivider`, `AvatarTile`)
- Shell: `HeaderNav` (vidro fixo), `BottomNav` (vidro + pílula deslizante)
- Onboarding: os seis passos
- As cinco telas: home, faculdade, estudos, biblioteca, perfil
- Mock realista (`src/mocks/index.ts`)
- Gates locais: `scripts/tokens-sync.mjs` e `scripts/classes-check.mjs`,
  encadeados no `npm run verify` do laboratório (D13)

**Fora de escopo.**

- Qualquer regra de negócio, cálculo ou derivação
- Persistência (SQLite, `AsyncStorage`, backup, sync)
- Os 33 tipos de `NavScreen` — só as cinco raízes
- Os 14 wizards, os testes, o quiz, o TCC, a lista de estágios
- Tema escuro (`themes.ts` tem 6 temas; aqui só o `rosa-claro`)
- Ícones `lucide-react-native` no conteúdo (só no shell e nas bandejas)
- Empacotamento nativo (`expo prebuild`, lojas)

## Contrato

O que este laboratório **é**: um lugar para olhar e tocar.

O que ele **não é**: uma base de código pronta para virar produto. Ele não tem
`SCHEMA_VERSION`, não tem migração, não tem teste, e não tem a voz do cecinho
ligada ao gate — as frases estão escritas direto no componente, o que **violaria
a regra 4 do `check-boundaries.mjs`** se o gate varresse `apps/rn-expo`. Ele
não varre, por D2. Isso é dívida conhecida e temporária, e está anotada aqui de
propósito: quando a fase virar produto, as frases voltam para `voice.ts`.

## Invariantes

Verificáveis por comando, todos dentro de `apps/rn-expo`:

1. `npx tsc --noEmit` sai com 0 erro.
2. Nenhum hex em **expressão de código** de `src/screens`, `src/shell`,
   `src/components` — cor de componente vem de token. Duas exceções, ambas
   deliberadas: `src/mocks/index.ts`, onde `coverColor` e `course.color` são
   **dado**; e comentário de documentação que cita um valor do `index.css`
   para explicar a origem dele. Comando:

   ```powershell
   Get-ChildItem src\screens,src\shell,src\components -Recurse -File -Include *.ts,*.tsx |
     Select-String -Pattern '#[0-9A-Fa-f]{6}'
   ```

   O resultado esperado são só comentários, nunca `backgroundColor: '#...'`.
3. `npm run lint` na raiz **não** vê `apps/rn-expo` (`tsconfig.json` o exclui).
4. `node .github/scripts/check-boundaries.mjs` na raiz continua passando — o
   laboratório não pode enfraquecer o gate do app que está no ar.
5. Nenhum arquivo do laboratório declara `export type NavTab =`,
   `NavScreen`, `StudyScreen` — esses tipos são de `packages/navigation`
   (regra do `check-boundaries.mjs`, alvo `apps`).

## Critérios de aceite

| # | Critério | Como se verifica |
|---|---|---|
| 1 | O projeto instala e faz typecheck | `npm install` + `npx tsc --noEmit` em `apps/rn-expo` |
| 2 | O bundle sai para Android | `npx expo export --platform android` |
| 3 | O app web não foi tocado | `npm run lint` e `npm run test` na raiz |
| 4 | O gate de fronteiras continua verde | `node .github/scripts/check-boundaries.mjs` |
| 5 | Os 24 mascototes migraram | `Get-ChildItem assets/mascote | Measure-Object` = 24 |
| 6 | Nenhuma dependência do app web | `apps/rn-expo/package.json` não cita `packages/*` nem `@/` do app |
| 7 | Toda classe usada compila pelo Tailwind | `npm run check:classes` (parte do `npm run verify`) |
| 8 | O CSS compilado chega ao bundle | `npx expo export --platform android` e conferir `letterSpacing`/`cssInterop` no `.hbc` |

## Medição

O dado que decide se esta fase funcionou não é técnico. É a resposta de quem
usa:

- **A pessoa tocou no mock por mais de cinco minutos sem perguntar o que era?**
- **Ela apontou uma coisa que piorou?** (é o achado mais valioso — significa
  que RN custou algo)
- **Ela apontou uma coisa que melhorou?** (é o que justifica a fase)
- **Ela prefere ficar no mock ou voltar pro app?** A resposta muda o escopo da
  Fase 2 inteira.

## Riscos

| Risco | Mitigação |
|---|---|
| O mock ficar bonito e a migração virar meses de retrabalho | D9 mantém o laboratório sem regra; a separação é o ponto |
| D1 virar duas fontes da verdade (o débito C10 repetido) | Gate `tokens-sync.mjs` na Fase 3; a spec declara a dívida |
| D2 isolar tanto que o laboratório morra por não compilar com o resto | `npm run verify` da raiz não o cobre; a Fase 3 decide se ele entra |
| NativeWind 4 não acompanhar o Tailwind 4 da raiz | D12 já assume duas versões em árvores separadas |
| Avaliar a biblioteca em vez do produto | D12 escolhe NativeWind **e não** gluestack, deliberadamente |
| Classe morta em silêncio (build verde, estilo ausente) | D13: `check:classes` no `npm run verify` |
| Vidro nativo (`BlurView`) falhar no Android e o conteúdo ficar ilegível | chão sólido sob o blur no `BottomNav` e no `HeaderNav`; o pior caso é perder o efeito, nunca a leitura |

## Rastreabilidade

| Decisão | Onde está no código | Verificada por |
|---|---|---|
| D1 | `src/tokens/palette.js`, `src/tokens/index.ts` | invariante 2; `scripts/tokens-sync.mjs` (Fase 3) |
| D2 | `package.json` da raiz (`!apps/rn-expo`), `tsconfig.json` da raiz (`exclude`) | invariantes 3 e 4 |
| D3 | `src/mocks/index.ts` | leitura |
| D4 | `src/shell/AppShell.tsx` | leitura |
| D5 | `src/shell/BottomNav.tsx` | leitura |
| D6 | `palette.js` (`shadow`), `src/components/HeroCard.tsx` | invariante 2 |
| D7 | `src/lib/motion.ts` | leitura |
| D8 | `src/lib/haptics.ts`, `src/components/Tappable.tsx` | leitura |
| D9 | `src/App.tsx`, ausência de `packages/*` | critério 6 |
| D10 | `src/shell/AppShell.tsx`, `src/shell/BottomNav.tsx` | leitura |
| D11 | `src/components/Button.tsx` | leitura |
| D12 | `tailwind.config.js`, `babel.config.js`, `metro.config.js` | critério 2 |
| D13 | `metro.config.js`, `scripts/classes-check.mjs` (`verify`) | critério 7 |