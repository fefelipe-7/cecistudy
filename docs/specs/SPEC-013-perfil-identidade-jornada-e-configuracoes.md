# SPEC-013 · Perfil: identidade, jornada e configurações

> Status: em andamento — **implementação entregue** (2026-10-14); confirmação de produto pendente
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §5.4 (Configurações e Perfil); §2 (árvore de módulos, "Configurações / Perfil")
> Decisões: D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12
> Supersede: —
> Depende de: SPEC-005 (período letivo), SPEC-006 (correção de virada), SPEC-008 (virada de semestre — entradas e navegação), SPEC-010 (padrão de hero é do Estágio; aqui só informa o tom)
> Data: 2026-10-13 · Implementado: 2026-10-14

> **Marca.** Esta spec é uma proposta de **apresentação** da tela de perfil. Toda
> a spec é `[P]` até a dona do produto confirmar item a item (ADR-005). Nenhum
> `[A]` é fechado por agente. A referencial §5.4 não traz marca `[D]` para o
> perfil; por isso a mudança entra como reformulação de superfície, sem alterar
> o contrato de dados nem a marca de produto.
>
> **O status acima é de implementação, não de produto.** O código está no disco e
> passa no gate; a marca `[P]` continua aberta, porque confirmá-la é ato da dona
> do produto. Execução e pendências em
> [`../../tasks/todo-perfil-redesign.md`](../../tasks/todo-perfil-redesign.md).

---

## 1. Contexto

A tela de perfil é a única superfície do app que reúne, no mesmo nível visual,
**quatro coisas de naturezas diferentes**: quem é a usuária, onde ela está na
graduação, o que ela construiu e a manutenção técnica do app. O resultado é uma
página longa que responde mal à primeira pergunta de quem abre a aba.

Hoje `PerfilView.tsx` renderiza, em ordem (`src/components/views/PerfilView.tsx:342-415`):

1. `ProfileHeader` — avatar, nome, curso, frase **e a barra de progresso**
   (`src/components/views/perfil/ProfileHeader.tsx:64-76`);
2. `JourneyTermCard` — período ativo, correção de ordinal, total ±, CTA de
   virada (`src/components/views/perfil/JourneyTermCard.tsx:97-215`);
3. `JourneySummary` — **grid de 11 tiles** de métricas
   (`src/components/views/PerfilView.tsx:257-339`);
4. `DitherFunnelChart` — funil sem ação associada
   (`src/components/views/PerfilView.tsx:363-370`);
5. `StudyStatsWidget` — ofensiva/streak (`src/components/views/PerfilView.tsx:372`);
6. `JourneyTimeline` — grid de N caixas de semestre, reflexão **e outro CTA de
   virada** (`src/components/views/perfil/JourneyTimeline.tsx:71-104, 115-163`);
7. `StickersSection` (`src/components/views/perfil/StickersSection.tsx:15-68`);
8. `PersonalizationSection` — tema, lembrete, Google Calendar **e o formulário
   de identidade** (`src/components/views/perfil/PersonalizationSection.tsx:107-144`);
9. `OtaSection` (só no nativo) (`src/components/views/PerfilView.tsx:59-124, 402`);
10. `DataSection` — sync, export/import e reset no mesmo grid
    (`src/components/views/perfil/DataSection.tsx:43-95`);
11. rodapé afetivo (`src/components/views/PerfilView.tsx:411-414`).

Os sintomas: o progresso da graduação aparece **três vezes** (header, card de
período e timeline); o CTA de virar semestre aparece **duas vezes** (card de
período e timeline); editar nome/universidade/frase exige rolar até o fim da
página; e OTA, backup e reset disputam atenção com o semestre atual.

- **Situação.** A usuária abre a aba "perfil" e não encontra, em cinco segundos,
  quem está usando o app, em que semestre está e quanto já percorreu.
- **O que ela faz hoje.** Rola a tela inteira; para editar os próprios dados,
  desce até "personalize seu cantinho".
- **O que acontece.** A informação principal se perde entre métricas, gráfico e
  status técnicos.
- **Como se sabe que é problema.** A própria estrutura do código mostra a
  repetição (progresso em `ProfileHeader.tsx:64-76`, `JourneyTermCard.tsx:150-155`
  e `JourneyTimeline.tsx:66-69`) e o CTA duplicado
  (`JourneyTermCard.tsx:204-213` e `JourneyTimeline.tsx:115-163`).

## 2. Decisões

### D1 · A tela vira uma narrativa de quatro movimentos, não uma pilha de cartões

- **Decisão.** A ordem passa a ser: **eu sou** (identidade) → **eu estou aqui**
  (semestre e progresso) → **eu construí** (ritmo, histórico, conquistas) →
  **eu cuido do meu cantinho** (preferências, dados, manutenção). A ordem é
  contrato: nenhum bloco técnico fica acima do acadêmico.
- **Justificativa.** Hoje a ordem segue a facilidade de implementação, não a
  pergunta da usuária (`PerfilView.tsx:342-415`): OTA e dados ficam depois de
  métricas e antes do rodapé, no mesmo tom de peso.
- **Alternativa rejeitada.** Manter a coluna de cartões e só reordenar: preserva
  a repetição de progresso e o formulário no fim.
- **Consequência aceita.** Reescrita de composição; os componentes atuais são
  substituídos/reestruturados (§5), com o custo de revalidar cada ação.

### D2 · Uma única derivação de dados, memoizada, em `profileViewModel`

- **Decisão.** Os dados de apresentação passam a ser calculados **uma vez** por
  `src/lib/profileViewModel.ts`, função pura memoizada com dependências
  explícitas. Cada componente recebe só a fatia que usa.
- **Justificativa.** As derivações estão espalhadas em `PerfilView.tsx:220-255`
  (minutos, páginas, flashcards, tarefas, provas, estágio, TCC, stickers); mover
  isso para cada componente duplicaria os loops.
- **Alternativa rejeitada.** Cada componente calcula o que precisa: repete
  `reduce`/`filter` e renderiza em cascata.
- **Consequência aceita.** Um contrato de tipo a manter; o view model **não**
  introduz regra de domínio nova (D9).

### D3 · O grid de 11 métricas vira um "ritmo" de quatro sinais

- **Decisão.** `ProgressPulse` mostra quatro indicadores: horas estudadas,
  páginas lidas, tarefas concluídas (`feitas/total`) e provas pendentes. As
  demais métricas são redistribuídas (§5) ou viram detalhe navegável.
- **Justificativa.** Onze tiles exigem leitura e comparação (`PerfilView.tsx:257-339`)
  para responder o que a tela deveria responder de imediato.
- **Alternativa rejeitada.** Manter os 11 com grid mais compacto: reduz altura,
  não reduz decisão.
- **Consequência aceita.** Estágio, TCC, aulas e flashcards deixam de ter tile
  próprio no primeiro bloco e passam a viver em módulos/detalhes específicos.

### D4 · O trilho contínuo da formação é a assinatura visual

- **Decisão.** `JourneyNow` apresenta o semestre com um **trilho** (linha com
  pontos de passado, nó atual e futuro) e uma legenda textual equivalente. O
  trilho aparece **uma vez**.
- **Justificativa.** Substitui a repetição de barras e caixas por uma metáfora
  única de percurso, e concentra o "em que semestre eu estou".
- **Alternativa rejeitada.** Manter barras + grid de caixas: é a repetição atual
  (`ProfileHeader.tsx:64-76` + `JourneyTimeline.tsx:71-104`).
- **Consequência aceita.** O status do trilho não pode depender só de cor
  (D11); exige legenda e resumo acessível.

### D5 · A edição de identidade sai do fim da página e vira sheet

- **Decisão.** `editar perfil` (no hero) e `editar dados pessoais` (em
  preferências) abrem `ProfileEditSheet` com nome, universidade e frase. Salvar
  é explícito (`guardar perfil`), com detecção de estado sujo.
- **Justificativa.** O formulário vive em `PersonalizationSection.tsx:107-144`,
  no fim da tela; corrigir o nome custa vários scrolls.
- **Alternativa rejeitada.** Manter o formulário inline no hero: aumenta a
  altura do bloco principal e mistura leitura com edição.
- **Consequência aceita.** Um sheet a mais para manter; a foto continua no hero
  (não entra no sheet).

### D6 · Preferências e manutenção viram rows agrupadas

- **Decisão.** Aparência, lembrete, Google Calendar e editar dados são
  `PreferenceRow`s; sync, backup, atualização e reset são rows de manutenção, com
  reset isolado em "zona de cuidado".
- **Justificativa.** Sete controles hoje têm peso de cartão
  (`PersonalizationSection.tsx`, `DataSection.tsx:43-95`), competindo com o
  acadêmico.
- **Alternativa rejeitada.** Cartões independentes por integração: mantém a
  fragmentação visual.
- **Consequência aceita.** Tema, que era inline, passa a abrir em sheet.

### D7 · O funil dither sai do perfil

- **Decisão.** `DitherFunnelChart` deixa de ser renderizado no perfil. Os dados
  que ele mostra continuam alcançáveis pelas telas de Estudos/Faculdade.
- **Justificativa.** O funil não tem ação associada e ocupa a primeira viewport
  (`PerfilView.tsx:363-370`); a spec pede que o perfil não seja dashboard.
- **Alternativa rejeitada.** Mover o funil para um detalhe secundário: mantém
  um gráfico que a tela não usa para decidir nada.
- **Consequência aceita.** A leitura de "jornada" passa a vir do trilho (D4) e
  do histórico; a compreensão não pode depender de gráfico (D11).

### D8 · A ofensiva (streak) vira item de conquistas

- **Decisão.** `StudyStatsWidget` deixa de ser bloco próprio no perfil e é
  representado dentro de `AchievementsPreview`, com link para a tela de
  ofensiva.
- **Justificativa.** A estrutura-alvo não prevê bloco de ofensiva e o app tem
  tela própria (`openStreak`); no perfil ela só repetia números.
- **Alternativa rejeitada.** Manter o card de ofensiva: reintroduz um quinto
  bloco de números entre o ritmo e a memória.
- **Consequência aceita.** A ofensiva detalhada fica a um toque.

### D9 · Sem mudança de domínio, de schema ou de persistência

- **Decisão.** Nenhuma regra de domínio nova nasce em `src/components`. O período
  continua derivado de `academicTerms`/`useActiveTerm`; `profile.semester`
  permanece apenas fallback legado (SPEC-006 D6). Sem bump de `SCHEMA_VERSION`.
- **Justificativa.** É uma mudança de apresentação; `degreeProgress`,
  `semestersLeft` e `clampOrdinal` já existem (`src/lib/termScope.ts:133-158`).
- **Alternativa rejeitada.** Ler `profile.semester` como fonte principal:
  reintroduz o ping-pong de sync que a SPEC-005 removeu.
- **Consequência aceita.** "Registros recentes" é o **acumulado atual**; nenhuma
  janela temporal nova é criada (isso seria regra de domínio).

### D10 · Mobile-first, com composição em duas colunas a partir de 900 px

- **Decisão.** Coluna única até `<900 px` (pulse 2×2), grid 7/5 a partir de
  `900 px`, container máximo 1120 px em `≥1200 px`.
- **Justificativa.** O app é mobile-first, mas a tela só cabe bem em tablet e
  desktop se usar duas colunas de verdade, não uma coluna esticada.
- **Alternativa rejeitada.** Esticar a coluna única: gera linhas longas e cards
  vazios.
- **Consequência aceita.** Dois recortes de layout a validar em screenshot.

### D11 · Acessibilidade é parte da definição de pronto

- **Decisão.** Um único `h1` (nome), `h2` por seção, o nó atual com
  `aria-current="step"`, o trilho com resumo textual e `aria-hidden` na
  decoração, ações como `button`/`a` (nunca `div role="button"` novo), alvo de
  toque ≥44 px, contraste validado nos seis temas, `prefers-reduced-motion`
  respeitado.
- **Justificativa.** O trilho (D4) e as métricas (D3) só fazem sentido se
  mosaico acessível; e a regra de fronteira proíbe branch de plataforma no
  componente (`check-boundaries.mjs:131-140`).
- **Alternativa rejeitada.** Tratar acessibilidade como polimento final: a
  legenda do trilho e a semântica das rows mudam a estrutura, não só o estilo.
- **Consequência aceita.** Mais teste de interação e por teclado.

### D12 · A edição e a leitura preservam os contratos existentes

- **Decisão.** `PerfilView` mantém `mode: 'profile' | 'stickers'` e os handlers
  atuais; backup, import, sync, reset e OTA continuam usando os mesmos
  handlers; os componentes removidos não deixam imports nem testes quebrados.
- **Justificativa.** A rota é consumida por `src/shells/SharedScreenLayers.tsx:358`;
  trocar o contrato quebraria a navegação.
- **Alternativa rejeitada.** Renomear props/handlers junto com a UI: churn sem
  ganho e risco de regressão no shell.
- **Consequência aceita.** Durante a migração, `PerfilView` acumula a casca de
  compat e a composição nova.

## 3. Escopo

| Item | Tipo |
|---|---|
| View model de apresentação `src/lib/profileViewModel.ts` | código |
| `ProfilePage` + `ProfileHero` + `ProfileAvatar` + `ProfileEditSheet` | código · UI |
| `JourneyNow` + `JourneyRail` | código · UI |
| `ProgressPulse` + `PulseMetric` | código · UI |
| `JourneyHistory` | código · UI |
| `AchievementsPreview` | código · UI |
| `ProfilePreferences` + `PreferenceRow` | código · UI |
| `ProfileDataMaintenance` + `DangerZone` | código · UI |
| Remoção do funil dither e da ofensiva como blocos próprios | código · UI |
| Testes unitários, de interação e visuais (§8, §10) | teste |
| Flag local de desenvolvimento (removida ao fim) | código |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Mudar o modelo de dados de perfil | D9; é apresentação |
| Rede social, perfil público, gamificação competitiva | produto não pediu |
| Remover backup, sync, OTA, lembretes ou Google Calendar | continuam, só reagrupados |
| Alterar a navegação global ou a posição da aba Perfil | fora do módulo |
| Criar biblioteca de componentes fora do design system | reaproveita `src/components/ui` |
| Reescrever o desktop | outro app (ADR-009) |
| Filtro temporal de "registros recentes" | seria regra de domínio nova (D9) |

## 5. Contrato

### 5.1 View model (derivado, não persistido)

```ts
type ProfileViewModel = {
  identity: {
    displayName: string;
    subtitle: string;      // curso · universidade
    quote: string;
    photoUrl?: string;
    initials: string;
    level: number;
    title: string;
  };
  journey: {
    currentOrdinal: number;
    totalSemesters: number;
    percent: number;
    semestersLeft: number;
    activeTermLabel?: string;
    activeTermId?: string;        // a correção do ordinal é por id (SPEC-006 D6)
    hasActiveTerm: boolean;
    beyondCourseEstimate: boolean;
    slots: Array<{ ordinal: number; status: 'past' | 'current' | 'future';
                   hasSummary: boolean; courses: number }>;
    history: Array<{ ordinal: number; label: string; courses: number; highlights: string[] }>;
  };
  pulse: {
    studyTimeMinutes: number;
    studyTimeLabel: string;      // já formatado por `formatStudyTime`
    pagesRead: number;
    tasksCompleted: number;
    tasksTotal: number;
    examsPending: number;
  };
  achievements: {
    level: number; title: string; unlocked: number; total: number;
    visible: Sticker[]; next?: { label: string; progress: number };
    streak: { current: number; longest: number; alive: boolean };
  };
  preferences: {
    reminderSupported: boolean; reminderEnabled: boolean; reminderTime: string;
    calendarConfigured: boolean; calendarEnabled: boolean; themeLabel: string;
  };
  maintenance: {
    native: boolean;              // OTA só existe no nativo
  };
};
```

> **Reconciliado com o código em 2026-10-14** (`src/lib/profileViewModel.ts:49-131`).
> Três pontos divergiram do esboço original e o código está certo:
> `terms` virou **`slots`** + **`history`** (o trilho precisa do ordinal de cada
> ponto, o histórico precisa dos congelados); `pulse` ganhou **`studyTimeLabel`**
> para não formatar tempo em dois lugares; `maintenance` ficou só com **`native`**
> — `updateStatus` e `syncConfigured` são derivados no componente, de `useOtaStatus`
> e da existência da ação de sync, e não são estado de apresentação do VM.

- **Invariante.** `deriveProfileViewModel` é **puro** e memoizado com deps
  explícitas; `profile.semester` só entra como fallback; nenhuma regra de
  domínio nova.
- **Quem consome.** `src/components/views/perfil/*`.

### 5.2 Estrutura de componentes

```
ProfilePage
├── ProfileHero            (ProfileAvatar, ProfileIdentity, ProfileEditTrigger)
├── JourneyNow             (JourneyRail, JourneyStatus, JourneyActions)
├── ProgressPulse          (PulseMetric, PulseDetailsLink)
├── JourneyHistory
├── AchievementsPreview
├── ProfilePreferences     (PreferenceRow, ThemeSheetTrigger, ProfileEditTrigger)
└── ProfileDataMaintenance (DataRow, BackupSheetTrigger, SyncRow, DangerZone)
    + ProfileEditSheet · ThemeSheet · ProfileFooterNote
```

### 5.3 Arquivos

```
src/components/views/PerfilView.tsx              → casca de rota/compat (mode)
src/components/views/perfil/ProfilePage.tsx      → layout principal
src/components/views/perfil/ProfileHero.tsx
src/components/views/perfil/ProfileAvatar.tsx
src/components/views/perfil/ProfileEditSheet.tsx
src/components/views/perfil/JourneyNow.tsx
src/components/views/perfil/JourneyRail.tsx
src/components/views/perfil/ProgressPulse.tsx
src/components/views/perfil/PulseMetric.tsx
src/components/views/perfil/JourneyHistory.tsx
src/components/views/perfil/AchievementsPreview.tsx
src/components/views/perfil/ProfilePreferences.tsx
src/components/views/perfil/PreferenceRow.tsx
src/components/views/perfil/ProfileDataMaintenance.tsx
src/lib/profileViewModel.ts
```

- **Substituídos:** `ProfileHeader`, `JourneySummary`, `PersonalizationSection`, `DataSection` (composição).
- **Reestruturados:** `JourneyTermCard` (→ `JourneyNow`), `JourneyTimeline` (→ `JourneyHistory`), `StickersSection` (→ `AchievementsPreview`).
- **Reaproveitados:** `ThemePickerCard` (em sheet), `Modal`, `ToggleRow`, `ProgressBar`, `AnimatedNumber`.

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | `PerfilView` responde a `mode="profile"` e `mode="stickers"` | `src/components/views/PerfilView.tsx` | teste de rota |
| I2 | Progresso da graduação aparece em **um** lugar | `JourneyNow.tsx` | teste de não-repetição |
| I3 | CTA de virada aparece em **um** lugar, sempre habilitado com período ativo (SPEC-008 D1) | `JourneyNow.tsx` | `JourneyRail.test.tsx` |
| I4 | `ordinal` clampeado em `1..MAX_TERM_ORDINAL`, nunca em `..total` (SPEC-008 D3) | `src/lib/termScope.ts:156-158` | teste de caso além-do-total |
| I5 | Nenhuma regra de domínio nova em `src/components` | revisão + boundary | `node .github/scripts/check-boundaries.mjs` |
| I6 | Nenhum hex cru em `className` | revisão | revisão/ESLint de tokens |
| I7 | Alvo de toque ≥44 px nas ações | `src/index.css:429-435` (`.touch-target`) | teste visual |
| I8 | Trilho comunica status por texto, não só cor | `JourneyRail.tsx` | teste de a11y |
| I9 | `SCHEMA_VERSION` e `contracts/` intocados | `packages/data/src/schema.ts` | `git diff --stat contracts/` vazio |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Nome vazio | estado de onboarding: `como quer ser chamada?` + CTA de preencher |
| Universidade vazia | link `adicione sua universidade`, nunca `undefined` ou separador solto |
| Frase vazia | placeholder editorial curto; não mostra caixa vazia |
| Sem foto | iniciais sobre superfície rosa, botão de câmera visível |
| Sem período ativo | `JourneyNow` colapsa em `abrir meu 1º semestre ♡` |
| `ordinal > totalSemesters` | aviso contextual (não erro); CTA de virada segue habilitado |
| Zero métricas | estado convidativo (`comece registrando uma sessão`), não `0` frio |
| Tarefas parciais | mostra `feitas/total` |
| Provas pendentes = 0 | sem cor de atenção |
| Stickers 0 / parcial / todos | silhueta / misto / linha cheia; sem grade de emojis cinza |
| Lembrete indisponível | row com explicação, não `disabled` silencioso |
| Google Calendar não configurado | toggle desabilitado + motivo |
| OTA indisponível (web) | row de atualização ausente |
| Erro de sync | não derruba o ritmo; retry local |

## 8. Direção visual e responsividade (referência)

- **Tokens:** usar só tokens de `src/index.css` `@theme` (`:root` `:98-158`):
  `bg-canvas`, `bg-surface-default`, `bg-surface-muted`, `bg-surface-rose`,
  `bg-surface-blue`, `text-ceci-brand-strong`, `bg-ceci-brand-strong`,
  `text-ceci-academic-strong`, `bg-status-{success,warning,danger}-surface`,
  `text-status-{success,warning,danger}-strong`, `text-ceci-primary`,
  `text-ceci-secondary`, `border-ceci-border-subtle`, `border-ceci-border-default`.
  Nenhum hex cru.
- **Tipografia:** `font-display` em títulos e números; `font-serif` na frase da
  usuária; `font-mono` só em versão/schema/ids.
- **Breakpoints:** `<640` coluna única (pulse 2×2); `640–899` coluna única
  larga; `≥900` grid duas colunas (hero+jornada lado a lado, 7/5); `≥1200`
  container 1120 px. Barra inferior global preservada, não duplicada.
- **Motion:** entrada do hero com fade + ≤8 px uma vez; sem cascata longa; nó
  atual sem pulse sob `prefers-reduced-motion` (global em `src/index.css:558-564`).

## 9. Acessibilidade e conteúdo

- `h1` único (nome); `h2` para cada seção; `aria-current="step"` no semestre
  atual; `aria-label` no trilho com resumo textual.
- Cada métrica é `button`/`a` real com label completo ("12 horas e 40 minutos
  estudados. abrir sessões de estudo.").
- Rótulos concretos: `guardar perfil`, `ver todas as conquistas`, `backup e
  restauração`, `corrigir semestre atual` (label acessível).
- Tom pt-BR, minúsculas, caloroso; sem esconder o efeito de uma ação; sem emoji
  em toda linha.

## 10. Critérios de aceite

- [x] `npm run lint` sai com 0
- [~] `npm run test` sai com 0 — perfil verde e estável (3 rodadas); a suíte completa é intermitente por motivo alheio a este módulo
- [x] `node .github/scripts/check-boundaries.mjs` sai com 0
- [x] `git diff --stat contracts/` sai vazio
- [x] `npm run test -- src/lib/__tests__/profileViewModel.test.ts` cobre os 10 casos do §2/D2
- [x] `npm run test -- src/components/views/perfil/__tests__/JourneyRail.test.tsx` passa para 1, 2, 8 e 12 semestres e ordinal > total
- [x] `npm run test -- src/components/views/perfil/__tests__/ProfileHero.test.tsx` passa
- [x] `npm run test -- src/components/views/perfil/__tests__/ProgressPulse.test.tsx` passa
- [x] `npm run test -- src/components/views/perfil/__tests__/PreferenceRow.test.tsx` passa
- [x] `npm run test -- src/components/views/perfil/__tests__/ProfilePage.test.tsx` — **adicionado na execução**: fixa I2 (progresso em um lugar só), I3 (CTA de virada em um lugar só), D1 (ordem do DOM), D7 (funil fora), D8 (ofensiva como item), D10 (grid 7/5) e D11 (um `h1`, regiões nomeadas, zero `div role="button"`)
- [~] `npm run verify` sai com 0 — `typecheck`, testes, `check:boundaries`, `verify:contract` e `build:web` passam; para em `bundle:report`, que acusa +19% na entrada crítica por causa do trabalho de performance acumulado na árvore, não deste módulo. Detalhe em [`../../tasks/todo-perfil-redesign.md`](../../tasks/todo-perfil-redesign.md#gate-de-bundle-bloqueia-o-verify-fora-do-perfil)
- [ ] Screenshot em 375/390/768/1280 e nos temas — **pendente**: esta máquina não tem driver de navegador nem display. É o que falta da verificação.

## 11. Medição

| Métrica | Como medir | Gate |
|---|---|---|
| Arquivos da árvore de perfil presentes | `Get-ChildItem src\components\views\perfil -File -Filter *.tsx \| Measure-Object` | revisão do plano |
| Testes novos rodando | `npm run test -- src/components/views/perfil` | `npm run test` |
| Contrato intocado | `git diff --stat contracts/` | vazio |
| Sem corrupção de encoding | `Select-String -Path <arquivos> -Pattern ([char]0xFFFD)` | vazio |

Números são gerados, não copiados.

## 12. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| Churn de UI grande quebrar ações existentes | média | alto | fases isoladas com gate verde entre elas |
| Repetir progresso por engano | média | médio | I2/I3 como teste, não só revisão |
| Introduzir regra de domínio no view model | baixa | alto | todo cálculo reusa `termScope`/`profileMeta`/`levels` |
| Branch de plataforma no componente | baixa | alto | `native` derivado no VM (`src/lib`) |
| Sheet quebrar com teclado/safe area | média | médio | teste visual em breakpoint real |

## 13. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `src/components/views/perfil/ProfilePage.tsx` | teste de composição | `npm run test` |
| D2 | `src/lib/profileViewModel.ts` | `src/lib/__tests__/profileViewModel.test.ts` | `npm run test` |
| D3 | `src/components/views/perfil/ProgressPulse.tsx` | `.../__tests__/ProgressPulse.test.tsx` | `npm run test` |
| D4 | `src/components/views/perfil/JourneyRail.tsx` | `.../__tests__/JourneyRail.test.tsx` | `npm run test` |
| D5 | `src/components/views/perfil/ProfileEditSheet.tsx` | `.../__tests__/ProfileHero.test.tsx` | `npm run test` |
| D6 | `src/components/views/perfil/PreferenceRow.tsx` | `.../__tests__/PreferenceRow.test.tsx` | `npm run test` |
| D7 | `src/components/views/PerfilView.tsx` (remove funil) | teste de composição | `npm run test` |
| D8 | `src/components/views/perfil/AchievementsPreview.tsx` | teste de composição | `npm run test` |
| D9 | `src/lib/profileViewModel.ts` | `I9` | `git diff --stat contracts/` |
| D10 | `ProfilePage.tsx` (grid) | screenshot 1280 | teste visual |
| D11 | `JourneyRail.tsx`, `PreferenceRow.tsx` | testes de a11y | `npm run test` |
| D12 | `src/components/views/PerfilView.tsx` | teste de rota `mode` | `npm run test` |

## 14. Reconciliação

Não supersede nenhuma spec. Itens dos componentes removidos são redistribuídos
conforme §5.3; a reconciliação de execução mora no plano
`cecistudy/tasks/plan-perfil-redesign.md`.

---

> Regras de escrita em [`../../AGENTS.md`](../../AGENTS.md#regras-de-escrita):
> pt-BR, zero emoji em `#` e `##`, `caminho:linha` obrigatório, escrita com
> `write`/`edit`, nunca com PowerShell.
