# SPEC-010 · Padrão hero e qualidade de UI do Estágio

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/cecistudy/docs/specs/`
> Status: entregue (2026-10-07)
> App afetado: mobile
> Origem: `spec-referencial-workspace-academico.md` §3.2 (módulo Estágio no mobile)
> Decisões: D1..D7 — todas `[D]` (aprovadas pela dona do produto em 2026-10-05)
> Supersede: —
> Depende de: SPEC-009 (domínio e fluxos do Estágio)
> Data: 2026-10-05

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite
> verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

- **Situação.** O módulo Estágio tem três superfícies de tela: o Diário
  (com as abas diário / pacientes / supervisão, `InternshipDiaryView.tsx`) e o
  Caso do paciente (tela empilhada, `InternshipCaseView.tsx`). A regra, os
  fluxos e o wizard vieram da SPEC-009.
- **O que a usuária vê hoje.** Home e Faculdade **abrem** com um hero: cartão
  `rounded-[26px]`, gradiente suave, título em serifa acadêmica, mascote no
  canto e uma frase de resumo (`src/components/views/home/HeroSection.tsx:19`,
  `src/components/views/faculdade/HeroSection.tsx:24`). O Estágio **não**: ele
  abre com um cabeçalho compacto `rounded-2xl p-4 bg-surface-default` com ícone
  de 40px (`InternshipDiaryView.tsx:115`, `SupervisionView.tsx:58`,
  `InternshipCaseView.tsx:75`). Medido em 2026-10-05: **0** ocorrências de
  `font-serif-academic` e **0** de `rounded-[26px]` em toda a superfície do
  módulo (comando em §9).
- **Consequência para a usuária.** O módulo é o que mais dados ela tem sobre
  estágio (horas, meta, pendências, progresso por paciente) e é o único que
  esconde tudo isso atrás de um cabeçalho genérico. Ele parece menos
  importante que as outras abas, e o resumo do dia só aparece depois de rolar.
- **Os componentes novos não têm contrato.** `EmptyState`, `CardHeader`,
  `StepProgress`, `StatusChip`, `FieldBlock`, `InternshipCaseCard` e
  `InternshipLogCard` foram criados recentemente, um a um, e cada um resolvede
  um problema imediato: hoje coexistem com raio, escala de texto, alvo de toque
  e semântica de foco um pouco diferentes entre si.
- **Como se sabe que é problema.** A própria SPEC-009 (§9.2–§9.7) dizia o que
  cada tela deveria mostrar; o que falta é a camada visual ser a **mesma** do
  resto do app. O pedido veio da dona do produto: "padrão de telas no app, com
  card hero".

## 2. Decisões

### D1 · Toda superfície do Estágio abre com hero no molde das heroes de referência `[D]`

- **Decisão.** O Diário (com as três abas) e o Caso do paciente passam a abrir
  com um hero: `rounded-[26px]`, `bg-gradient-to-br`, eyebrow em minúsculas,
  título `font-serif-academic text-3xl sm:text-4xl`, frase de resumo
  `text-xs sm:text-[13px] text-ceci-secondary`, mascote no canto inferior
  direito (`absolute -bottom-2 -right-2`) e ação primária no canto superior
  direito.
- **Justificativa.** É literalmente o molde das duas telas que são a
  referência do app (`home/HeroSection.tsx:19-35`,
  `faculdade/HeroSection.tsx:24-51`). Repetir o molde é o que faz a tela
  parecer parte do mesmo produto.
- **Alternativa rejeitada.** (a) Aumentar o padding do cabeçalho atual e
  manter o `rounded-2xl` — rejeitado porque continua sendo um **terceiro**
  idioma de abertura de tela no app. (b) Refatorar `home/HeroSection` e
  `faculdade/HeroSection` num componente único e migrar as duas agora —
  rejeitado porque tira do escopo do módulo as duas telas que **são** a
  referência: mudá-las junto invalida o próprio parâmetro de comparação.
- **Consequência aceita.** O hero ocupa mais linha que o cabeçalho atual, então
  a lista começa um pouco mais abaixo. Aceito porque o hero absorve a ação
  primária e o resumo que hoje são cards separados (§D3) — a tela não fica mais
  comprida no total.

### D2 · O molde do hero vira um componente puro em `ui/HeroCard` `[D]`

- **Decisão.** Novo componente `src/components/ui/HeroCard.tsx`, semântica de
  apresentação: recebe `eyebrow`, `title`, `summary`, `action`, `expression`
  (mascote) e `accent` (`rose` | `blue`). Não lê contexto, não calcula dado,
  não navega.
- **Justificativa.** `src/components/ui/` é onde vivem os primitivos
  compartilhados (`UnderlineTabBar`, `PillGroup`, `ProgressBar`, `EmptyState`).
  Um molde só com props de apresentação é o que impede as três telas do
  módulo de divergirem — é o mesmo argumento de "uma derivação só" da
  SPEC-009 F6 aplicado à apresentação.
- **Alternativa rejeitada.** Copiar o JSX do hero para dentro de cada tela —
  rejeitado: três cópias do mesmo cartão divergem em silêncio, que é
  exatamente o defeito que a SPEC-009 corrigiu nos dados (F6).
- **Consequência aceita.** `HomeView` e `FaculdadeView` continuam com o hero
  próprio por enquanto: existem dois modos de construir o mesmo cartão até a
  migração (registrada em §4).

### D3 · Um hero por contexto de navegação, não um por aba `[D]`

- **Decisão.**
  - O Diário tem **um** hero, acima da `UnderlineTabBar`, e ele muda de
    conteúdo conforme a aba ativa: título = número principal da aba (horas de
    campo / pacientes / encontros), resumo = pendências e meta, ação =
    `anotar` já contextualizado para a aba.
  - A aba Supervisão **perde** o cartão-cabeçalho secundário
    (`SupervisionView.tsx:58-76`): hoje há dois cabeçalhos empilhados na mesma
    tela.
  - O Caso tem o **seu** hero, com as iniciais como título, resumo de sessões e
    ação `nova sessão` no canto; a barra de ações inferior fica só com as
    secundárias (`levar pendentes pra supervisão`, `adicionar iniciais`).
- **Justificativa.** Aba é estado dentro de uma tela, não tela: trocar de aba
  não deve trocar a identidade visual do topo. E o Caso é uma tela empilhada,
  com contexto próprio (uma pessoa) — ele merece hero próprio.
- **Alternativa rejeitada.** Um hero por aba, com a barra de abas abaixo de
  três heroes diferentes — rejeitado porque a barra de abas pularia de altura e
  posição a cada troca, e a usuária perde o ponto de fixação visual.
- **Consequência aceita.** O hero do Diário é genérico o bastante para as três
  abas; o detalhe específico da supervisão (próximas / anteriores) continua
  sendo conteúdo, não cabeçalho.

### D4 · O módulo tem uma escala tipográfica e de espaçamento única `[D]`

- **Decisão.** Escala fechada, usada em toda superfície do módulo:

  | Papel | Classe |
  |---|---|
  | título de hero | `font-serif-academic text-3xl sm:text-4xl` |
  | título de seção | `text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary` |
  | título de card | `font-display font-bold text-base` (`text-lg` só em card expansível) |
  | corpo | `text-xs` / `text-[12px]` `text-ceci-secondary` |
  | meta / legenda | `text-[11px]` `text-ceci-tertiary` |
  | raio | hero `rounded-[26px]` · card `rounded-2xl` · ação/pill `rounded-full` |
  | ritmo vertical | `space-y-4` entre blocos irmãos, `space-y-3` dentro de lista |

- **Justificativa.** É a escala que as telas de referência já usam
  (`.context/design-system.md` §3, §4, §7). Hoje o módulo mistura
  `text-lg`/`text-base`/`text-sm` e `p-4`/`p-3` sem critério.
- **Alternativa rejeitada.** Definir escala nova só para o Estágio —
  rejeitado: criar vocabulário visual próprio é o contrário do pedido.
- **Consequência aceita.** Alguns títulos de card ficam menores que hoje
  (`text-lg` → `text-base`), o que reduz a hierarquia dentro do card
  expansível — aceito porque o título do card perde para o título do hero, que
  é onde a hierarquia deve estar.

### D5 · Card de paciente e card de registro ganham identidade, não só tamanho `[D]`

- **Decisão.**
  - `InternshipCaseCard`: tile de iniciais à esquerda (mesmo formato do tile de
    ícone do `CourseDetailView`, `CourseDetailView.tsx:113-118`), título,
    linha de contexto, progresso e chips de pendência — a seta continua à
    direita.
  - `InternshipLogCard`: mantém o padrão atual (badge de tipo, data/horas,
    título, chips), alinhado à escala da §D4.
  - Ambos com `line-clamp` no título e alvo de toque ≥ 44px no card inteiro.
- **Justificativa.** A lista de pacientes é a tela em que a usuária decide
  "em quem eu estou trabalhando": hoje o card é um bloco de texto sem âncora
  visual, e as iniciais são a única identidade que o módulo tem direito a
  mostrar (SPEC-009: sem nome completo).
- **Alternativa rejeitada.** Avatar/foto ou cor por paciente — rejeitado: cor
  por paciente colide com a cor de disciplina (que já existe no app) e foto
  está fora do recorte de dado clínico (§4 da spec referencial).
- **Consequência ocupa.** Tile de iniciais consome ~56px de largura; em
  viewport de 320px o texto de contexto encolhe — aceito porque `truncate` já
  protege.

### D6 · Os componentes recém-criados viram contrato com tokens, foco e a11y `[D]`

- **Decisão.** `EmptyState`, `CardHeader`, `StepProgress`, `StatusChip`,
  `FieldBlock`, `LogTypeBadge`, `NextStepRow` passam a seguir quatro regras
  fixas:
  1. **Zero hex raw em className** (hex só como valor de dado, como o
     `accentColor` do gráfico) — tokens `ceci-*` / `surface-*` / `border-*`;
  2. **Todo controle interativo ≥ 44px** (`min-h-[44px]`) e com
     `focus-visible:ring-2 focus-visible:ring-ceci-brand`;
  3. **Chave de lista sempre única**, mesmo com rótulo repetido
     (`${label}-${i}`) — regra que já foi violada em `StepProgress.tsx:17` e
     `WizardScaffoldHeader.tsx:99`;
  4. **`StepProgress` expõe semântica** de progresso: `role="progressbar"` com
     `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`.
- **Justificativa.** São componentes novos, escritos um a um durante a
  implementação da SPEC-009; sem contrato eles viram dívida de consistência
  (é o mesmo formato do débito C10 do grupo: duas fontes de verdade da mesma
  coisa).
- **Alternativa rejeitada.** Deixar cada tela decidir por conta própria —
  rejeitado: é exatamente o estado atual, e ele gerou alvo de toque de 44px
  adesivo, semântica de progresso ausente e chaves duplicadas.
- **Consequência aceita.** Componentes podem ficar um pouco mais verbosos em
  props (`ariaLabel`, `testId`) em troca de poderem ser testados por asserção.

### D7 · Um único controle de filtro por tela: `PillGroup` `[D]`

- **Decisão.** Os filtros mutuamente exclusivos do módulo (diário: todos /
  campo / clínico / supervisão; caso: todas / sem reflexão / sem supervisão;
  supervisão: todas / supervisão / intervisão) usam `PillGroup` `size="sm"`
  `variant="rose"`. Os filtros de **pendência** continuam `StatusChip` com
  `aria-pressed`.
- **Justificativa.** Hoje o Diário e o Caso usam `PillGroup` e a Supervisão
  usa `SegmentedControl` — dois controles diferentes para a mesma ação dentro
  de um módulo (`SupervisionView.tsx:78-87`).
- **Alternativa rejeitada.** Padronizar em `SegmentedControl` — rejeitado:
  o `PillGroup` é o que a referência do app já usa nos filtros
  (`.context/design-system.md` §7, "pills de sub-tab") e acomoda 4 opções
  melhor em viewport estreito.
- **Consequência aceita.** A Supervisão perde o indicador visual de segmento
  selecionado; ganha consistência e o mesmo comportamento de foco das outras
  duas telas.

## 3. Escopo

| Item | Tipo |
|---|---|
| `src/components/ui/HeroCard.tsx` (novo) | código · UI |
| `InternshipDiaryView` — hero + remoção do cabeçalho compacto | UI |
| `SupervisionView` — remoção do cartão-cabeçalho, `PillGroup` | UI |
| `InternshipCaseView` — hero de paciente + barra de ações só secundárias | UI |
| `InternshipCaseCard` — tile de iniciais | UI |
| Escala da §D4 aplicada nos arquivos do módulo | UI |
| `StepProgress`, `CardHeader`, `StatusChip`, `FieldBlock`, `EmptyState` — contrato da §D6 | código · UI |
| Testes de render (hero, chaves, semântica de progresso) | gate |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Qualquer regra, tipo ou persistência da SPEC-009 | o domínio está fechado; esta spec é apresentação |
| `SCHEMA_VERSION` / migrações | nenhuma mudança de formato gravado — permanece 20 |
| Migrar `home/HeroSection` e `faculdade/HeroSection` para `HeroCard` | são a referência; migrá-las anula o parâmetro de comparação. Registrar e fazer depois |
| A sub-aba "estágio" da Faculdade (`faculdade/InternshipSection.tsx`) | é card de preview dentro de outra tela, não superfície do módulo |
| O wizard (`InternshipWizard`), além de `StepProgress`/`CardHeader` | fluxo da SPEC-009; só os dois componentes de UI entram pela §D6 |
| Cópia de grupo (`SPEC-M-xxx`) | é UI de um app só; não é regra de domínio nem contrato |
| Dark mode novo | usa o `theme` já existente no `DitherGrowthChart`, sem token novo |

## 5. Contrato

- **Assinatura** — `src/components/ui/HeroCard.tsx`:

  ```tsx
  export interface HeroCardProps {
    eyebrow: string;            // minúsculas: "estágio", "paciente"
    title: string;              // número ou nome; o único texto em serifa
    summary?: React.ReactNode;  // frase de resumo, uma linha
    action?: { label: string; onClick: () => void; ariaLabel?: string };
    expression?: MascoteExpression;
    accent?: 'rose' | 'blue';   // default 'rose'
    testId?: string;            // 'hero-card'
  }
  export const HeroCard: React.FC<HeroCardProps>;
  ```

- **Invariante do contrato.** `HeroCard` não importa `useMobileApp`, não
  importa `useNavValue`, não calcula data/hora: é apresentação pura. Se ele
  precisar de dado, o dado chega por props.
- **Quem consome.** `InternshipDiaryView` e `InternshipCaseView` (duas
  superfícies). `SupervisionView` deixa de ter cabeçalho próprio.

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | Cada superfície do módulo renderiza exatamente um `HeroCard` (`testId="hero-card"`), inclusive na aba supervisão | `InternshipDiaryView.tsx`, `InternshipCaseView.tsx` | teste de render: `getAllByTestId('hero-card').length === 1` |
| I2 | Nenhum hex raw em `className` dos arquivos do módulo (hex só como valor de dado) | escala da §D4 | gate `rg` (§8) |
| I3 | Rótulo repetido em lista não gera chave React duplicada | `StepProgress.tsx`, `WizardScaffoldHeader.tsx` | teste: render com rótulos duplicados + `console.error` não chamado |
| I4 | `StepProgress` tem semântica de progresso completa | `StepProgress.tsx` | teste: `role`, `aria-valuenow`, `aria-valuemax`, `aria-valuetext` |
| I5 | Todo controle interativo do módulo tem alvo ≥ 44px | componentes da §D6 | revisão + contagem `rg` (§9) |
| I6 | A tela que sai do slide não recebe foco enquanto está `aria-hidden` | `SlideScreen.tsx:95` (`inert`) | atributo presente quando `!isPresent` |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Zero registros | hero mostra `0h de campo` sem pendências; a lista cai no `EmptyState` existente |
| Meta de horas não definida | o resumo omite "meta"; o `GoalCta` continua abaixo |
| Paciente sem iniciais (`patientKey === ''`) | título do hero = "sem iniciais"; ação `adicionar iniciais` fica na barra inferior |
| Aba supervisão sem encontro | hero mantém resumo; `EmptyState` com copy própria e ação `anotar supervisão` |
| Rótulos de passo repetidos no wizard | chaves únicas por índice — sem warning do React |
| Tela saindo com foco no conteúdo | wrapper com `inert` — sem warning `Blocked aria-hidden` |
| Viewport de 320px | título `text-3xl` e `truncate`/`line-clamp` seguram; tile de iniciais não encolhe abaixo de 48px |
| Teclado aberto no input de meta | hero não é sticky; rolagem normal, sem `position` nova |

## 8. Critérios de aceite

- [x] `npm run lint` → sai com 0
- [x] `npm run test` → sai com 0 (suíte atual + testes novos da §6)
- [x] `node .github/scripts/check-boundaries.mjs` → sai com 0
- [x] `rg -c "HeroCard" src/components/views/InternshipDiaryView.tsx src/components/views/InternshipCaseView.tsx` → 2 arquivos com ocorrência
- [x] `rg -n "#[0-9A-Fa-f]{6}" src/components/views/Internship*.tsx src/components/views/SupervisionView.tsx src/components/InternshipLogCard.tsx src/components/internship` → **no máximo 1** ocorrência (o `accentColor` do gráfico, que é valor de dado) — medido: 1, `InternshipDiaryView.tsx:302`
- [x] `rg -c "font-serif-academic" src/components/ui/HeroCard.tsx` → 1
- [x] `npm run test -- src/components/internship/__tests__/` → todos passam (I1, I3, I4) — medido: 26/26 em 6 arquivos

## 9. Medição

Números medidos em 2026-10-05, no estado anterior. Os comandos produzem o
número; o número não é copiado de memória.

| Métrica | Comando | Antes | Depois |
|---|---|---|---|
| heroes no módulo | `rg -c "HeroCard" src/components/ui/HeroCard.tsx src/components/views/InternshipDiaryView.tsx src/components/views/InternshipCaseView.tsx` | 0 | 3 (componente + 2 superfícies) |
| herói de verdade (molde `rounded-[26px]`) | `rg -c "rounded-\[26px\]" src/components/ui/HeroCard.tsx` | 0 | 1 (o molde vive no componente; as superfícies consomem) |
| hex raw nos arquivos do módulo | `rg -o "#[0-9A-Fa-f]{6}" <arquivos do §8> \| Measure-Object -Line` | 1 (`InternshipDiaryView.tsx:270`, dado) | 1 (o mesmo `accentColor`, agora em `:302`) |
| alvos ≥44px no módulo | `rg -c "min-h-\[44px\]" src/components/views -g 'Internship*.tsx' src/components/views/SupervisionView.tsx src/components/InternshipLogCard.tsx src/components/internship src/components/ui/HeroCard.tsx` (soma) | 27 | 23 — os 3 botões de cabeçalho/ação primária viraram **1** ação no hero (D3); todo controle remanescente continua ≥44px (I5) |
| superfícies com cabeçalho duplicado | inspeção de `SupervisionView.tsx` e `InternshipDiaryView.tsx` | 2 empilhados | 0 (o hero do Diário é o topo das três abas; o Caso abre com o seu hero) |

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| Hero grande demais em tela pequena com teclado aberto | média | médio | variante `compact` (`p-4`, `text-2xl`) ativada por breakpoint — só se aparecer reclamação real |
| Escopo vazando para Home/Faculdade | média | médio | §4 declara fora de escopo; a migração vira task separada |
| Regressão de teste existente do módulo (`InternshipCaseDetail`) | baixa | alto | rodar a suíte antes de cada commit da implementação |
| Especificação visual fina demais para a dona ajustar depois | média | baixo | decisões estão `[D]` (2026-10-05); qualquer ajuste é edição na §2, não código surpresa |
| `HeroCard` virar "componente com 12 props" | média | médio | props de dados não entram (§5): se precisar de dado, é sinal de que o consumidor errou |

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `src/components/views/InternshipDiaryView.tsx`, `src/components/views/InternshipCaseView.tsx` | `src/components/internship/__tests__/HeroCard.test.tsx` | `npm run test` |
| D2 | `src/components/ui/HeroCard.tsx` (novo) | idem | `npm run lint` |
| D3 | `InternshipDiaryView.tsx` (hero acima da tab bar), `SupervisionView.tsx` (cabeçalho removido) | teste I1 (1 hero por superfície) | `npm run test` |
| D4 | escala aplicada nos arquivos do §3 | revisão visual + `rg` | §8 |
| D5 | `src/components/internship/InternshipCaseCard.tsx` | teste de render do card | `npm run test` |
| D6 | `StepProgress.tsx`, `WizardScaffoldHeader.tsx`, `StatusChip.tsx`, `FieldBlock.tsx`, `EmptyState.tsx` | testes I3, I4 | `npm run test` |
| D7 | `SupervisionView.tsx` (PillGroup) | teste de render | `npm run test` |

Tasks de implementação: `tasks/todo-hero-estagio.md` (criado na aprovação).

## 12. Reconciliação com o que já está em código

Esta spec regulariza trabalho feito **antes** dela, sem número de decisão — é
a parte da §D6 e do fix de acessibilidade que já existe no disco em
2026-10-05:

| Item | Estado | Onde |
|---|---|---|
| `EmptyState` com mascote e ação | implementado | `src/components/ui/EmptyState.tsx` |
| `ViewSkeleton` (`aria-busy`) | implementado | `src/components/ui/ViewSkeleton.tsx` |
| `CardHeader`, `StepProgress` | implementado | `src/components/ui/CardHeader.tsx`, `src/components/wizards/StepProgress.tsx` |
| alvos ≥44px e `focus-visible` nos chips/cards | implementado | `StatusChip.tsx`, `InternshipLogCard.tsx:330-351` |
| chaves únicas com rótulo repetido | implementado | `StepProgress.tsx:17`, `WizardScaffoldHeader.tsx:99`, `NextStepRow.tsx:79` |
| `inert` na tela que sai do slide | implementado | `src/shells/SlideScreen.tsx:95` |
| filtro "sem supervisão" por sessão, não por caso | implementado | `InternshipCaseView.tsx:64` |
| hero (D1, D2, D3) | **implementado** | `src/components/ui/HeroCard.tsx`, `InternshipDiaryView.tsx`, `InternshipCaseView.tsx`, `SupervisionView.tsx` (cabeçalho próprio removido) |
| escala única (D4), tile de iniciais (D5), PillGroup na supervisão (D7) | **implementado** | `InternshipCaseCard.tsx` (tile), `SupervisionView.tsx` (`PillGroup`), escala aplicada nos títulos de seção do módulo |
| contrato D6 (progressbar, foco, 44px, hex=0 em className) | **implementado** | `StepProgress.tsx`, `StatusChip.tsx`, `NextStepRow.tsx`, `EmptyState.tsx`, `HeroCard.tsx` |

---

> Regras de escrita em [`AGENTS.md`](../AGENTS.md): pt-BR, zero emoji em `#` e
> `##`, `caminho:linha` obrigatório, escrito com `write`/`edit`.
