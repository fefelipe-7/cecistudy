# SPEC-014 · Faculdade: acabamento do cantinho acadêmico

> Status: entregue (2026-10-15)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §4.3 (Faculdade — "Visão geral · Disciplinas · Avaliações · Histórico")
> Decisões: D1, D2, D3, D4, D5, D6
> Supersede: a proposta anterior desta mesma SPEC-014 (2026-10-14), registrada em §8
> Depende de: SPEC-005 (período letivo), SPEC-008 (virada de semestre), SPEC-009 (estágio v4), SPEC-013 (molde do Perfil), SPEC-M-018 (voz do cecinho no mobile), SPEC-C-014 (contrato de voz), SPEC-C-013 (identidade), ADR-011 (cecinho)
> Data: 2026-10-15
> Cópia de grupo: [`../../../../docs/specs/mobile/SPEC-M-019-faculdade-cantinho-academico.md`](../../../../docs/specs/mobile/SPEC-M-019-faculdade-cantinho-academico.md)

> **Marca.** Esta spec é de **apresentação** e é **visual-only**: nenhuma regra de
> domínio, nenhum estado, nenhuma navegação e nenhum schema foi tocado. O que
> mudou foi o acabamento de uma tela que já existia e já era a marca.

---

## 1. Contexto

A tela de Faculdade é a mais antiga da visão geral do app e já tem identidade
própria: hero com serifa e mascote, card de estágio em destaque com gradiente,
grade da semana real e grade 7/5 com tabs. Ela **não** tinha problema de
informação — tinha problema de acabamento: o bloco de estágio repetia o mesmo
assunto em dois elementos, e as horas de campo apareciam como número pequeno
dentro de uma frase.

A proposta anterior desta spec (2026-10-14) reescreveu a tela como narrativa de
oito cards e tirou a tab bar da primeira camada. Ela foi implementada, mostrada à
dona do produto e **rejeitada** em 2026-10-15: cartão demais, informação
espalhada e o estágio perdendo o destaque que ele tinha. O objetivo original —
*tornar a tela um pouco mais bonita* — foi atropelado pelo tamanho da mudança. O
reverso está em §8.

---

## 2. Decisões

### D1 · A tela mantém o layout; o trabalho é de acabamento, não de estrutura `[D]`

- **Decisão.** A composição, a ordem dos blocos e a tab bar continuam exatamente
  como estavam. Nada de componente novo, nada de bloco novo, nada de
  reorganização. O diff de `FaculdadeView.tsx` é de 82 linhas adicionadas e 29
  removidas, e nenhuma delas move um bloco de lugar.
- **Justificativa.** É o que a dona pediu duas vezes e é o que a tela já
  executava bem. Refino é lapidação; reconstrução é outro produto.
- **Alternativa rejeitada.** Narrativa de oito cards com `overview` como padrão
  (a proposta anterior, §8): rejeitada por ver a tela pronta — cartão demais,
  informação espalhada e leitura em série em vez de por prioridade.
- **Consequência aceita.** Nenhum arquivo novo em
  `src/components/views/faculdade/`; a pasta tem os mesmos sete componentes de
  antes.

### D2 · O estágio é o segundo bloco e ganha peso por número, não por enfeite `[D]`

- **Decisão.** O card de "diário de estágio" volta ao segundo lugar — onde a
  tela sempre teve — e as horas de campo viram o número grande do card
  (`text-2xl`, tabular), com registros e pendências abaixo. A frase do cecinho
  entra pelo motor de voz (`DICA.faculdadePraticaAcompanha`).
- **Justificativa.** O estágio é a parte da formação que a usuária acompanha por
  acúmulo; hiding num parágrafo era o que apagava a informação.
- **Alternativa rejeitada.** Manter o card no fim da tela, como na proposta
  anterior: rejeitada porque desmanchou a prioridade que a tela já tinha.
- **Consequência aceita.** O bloco mais alto da tela depois do hero passou a ter
  o dado mais cumulativo do semestre.

### D3 · Um bloco por assunto: as ações do estágio moram dentro do card `[D]`

- **Decisão.** O `button` solto "anotar ou agendar um estágio", que vivia logo
  abaixo do card repetindo o assunto, saiu. As ações ficam no card: a área de
  cima abre o diário (com chevron e `aria-label`) e o botão embaixo faz a única
  coisa que o toque no card não faz — `anotar ou agendar um estágio`. O card
  deixa de ser um `<button>` e vira `<section>` com a área principal clicável e o
  CTA embaixo, o que também resolve botão dentro de botão.
- **Justificativa.** Um assunto, um bloco. A tela encolheu um elemento sem
  perder nenhuma ação — e sem repetir a mesma ação duas vezes.
- **Alternativa rejeitada.** Manter o botão solto: rejeitada porque duplicava o
  assunto logo abaixo do assunto.
- **Consequência aceita.** HTML válido (`section` > `button` > `button`) e um
  bloco a menos na dobra.

### D4 · A contagem é do domínio, chamada no ponto de uso `[D]`

- **Decisão.** Horas e pendências vêm de `computeStats`/`computePendencies`
  (`src/lib/internshipCases.ts`, reexport de `packages/domain`), com
  `localDateKey(now)` como hoje. Nenhum agregador de tela foi criado.
- **Justificativa.** A regra da contagem é da SPEC-009 e já tem dono e teste. Um
  view model de 583 linhas para ler um campo é dívida, não arquitetura.
- **Alternativa rejeitada.** `src/lib/facultyViewModel.ts` com as sete seções da
  proposta anterior: rejeitada porque sete das oito derivações ficaram sem
  consumidor — código morto com 25 testes, que é o pior dos dois mundos.
- **Consequência aceita.** O bloco de estágio tem a mesma forma de derivação do
  `InternshipSection.tsx:39-44`: um `useMemo`, o domínio chamado, nada reescrito.

### D5 · Voz: fica o que o card consome, chave órfã sai `[D]`

- **Decisão.** Das chaves registradas na proposta anterior, sobreviveu
  `DICA.faculdadePraticaAcompanha`, que o card de estágio consome. As outras
  dezoito (`faculdadeSemTermo`, `faculdadeAulaHoje`, `faculdadeSemPendencias`,
  `presencaGuardada` e afins) foram removidas de `src/lib/voice.ts`.
- **Justificativa.** `SPEC-C-014` D12: chave sem consumidor é dívida de voz. O
  gate não pegaria sozinho, porque hoje ele acusa frase inline e não chave
  órfã — deixar as chaves seria dívida silenciosa.
- **Alternativa rejeitada.** Manter as dezoito chaves "para quando a tela
  voltar": rejeitada porque ninguém sabe se voltam, e catálogo Morto envelhece
  para mentira.
- **Consequência aceita.** `voice.ts` e `voice.test.ts` seguem verdes; a
  assinatura do cecinho no bloco de estágio é uma frase, não um catálogo morto.

### D6 · Tokens e tipografia do app, sem classe nova `[D]`

- **Decisão.** O bloco novo usa só tokens semânticos (`bg-surface-rose`,
  `text-ceci-brand-strong`, `border-ceci-border-brand`) e utilitários que já
  existem no app (`touch-target`, `card-lift`, `press-card`, `tabular-nums`).
  Nenhum hex em classe, nenhuma classe nova em `index.css`.
- **Justificativa.** `SPEC-C-013` e a skill de design system do app: a diferença
  de marcas vive nos tokens, não em classe ad hoc.
- **Alternativa rejeitada.** Criar um componente `InternshipHighlightCard.tsx`
  para o bloco: rejeitada porque é um bloco só, e arquivo a mais para uma tela
  que ganhou um elemento, não uma seção.
- **Consequência aceita.** `check-boundaries.mjs` verde sem exceção nova.

---

## 3. Escopo

| Item | Tipo |
|---|---|
| Bloco de estágio em `FaculdadeView.tsx`: um card, número grande, ações dentro | UI |
| `estagio` derivado do domínio (`computeStats`/`computePendencies`) | derivação |
| `DICA.faculdadePraticaAcompanha` consumida no card | voz |
| Chaves órfãs da proposta anterior removidas de `voice.ts` | voz |
| Componentes da proposta anterior removidos (9 arquivos + 10 testes) | remoção |
| `facultyViewModel.ts` e `diasAteComSinal` removidos | remoção |
| `packages/navigation` e `navigationEngine.ts` restaurados | reversão |
| Índice do grupo (`SPEC-M-019`) corrigido | doc |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Reordenar blocos, tirar a tab bar ou criar visão `overview` | rejeitado pela dona (§8) |
| Card "hoje" de presença na Faculdade | Home já é a dona do "hoje"; D5 da proposta anterior nunca virou necessidade |
| Progresso da formação na Faculdade | Perfil já mostra (SPEC-013 I2) — repetir aqui seria duplicar |
| Domínio, schema, `contracts/`, `SCHEMA_VERSION` | §4 do `AGENTS.md` do app |
| `HeroSection`, `WeekGrid`, `DisciplinasGrid`, `CalendarMonth`, `InternshipSection`, `WeekEventsList` | já estão certos; intocados |

---

## 5. Contrato

### 5.1 Derivação do bloco de estágio

```ts
const estagio = useMemo(() => {
  const stats = computeStats(internshipLogs, localDateKey(now));
  const pendencias = computePendencies(internshipLogs, localDateKey(now));
  return {
    registros: internshipLogs.length,
    horas: stats.doneHours,
    pendencias: pendencias.noReflection.length + pendencias.noSupervision.length,
  };
}, [internshipLogs, now]);
```

- **Invariante.** `now` entra como input; "hoje" é data civil em fuso local
  (`localDateKey`), nunca `new Date()` dentro da derivação (SPEC-009).
- **Quem consome.** `estagio.registros` decide entre o estado com dado e o
  convite; `estagio.horas` é o número grande; `estagio.pendencias` vira "N
  pedindo carinho" quando maior que zero.

### 5.2 Voz

Uma frase, uma chave: `DICA.faculdadePraticaAcompanha`. O card consome pelo
motor de voz (`frase(DICA, chave)`) e **não** escreve o texto — a chave é o
contrato, não a palavra.

---

## 6. Invariantes

| # | Invariante | Onde é garantida | Gate |
|---|---|---|---|
| I1 | Nenhum bloco novo, nenhum bloco movido | `FaculdadeView.tsx` | revisão + diff |
| I2 | Um bloco por assunto (o botão solto saiu) | `FaculdadeView.tsx` | revisão |
| I3 | A contagem do estágio vem do domínio, não reimplementada | `estagio` memo | `computeStats`/`computePendencies` já testados |
| I4 | Zero mudança de domínio, schema, persistência e navegação | — | `git diff --stat contracts/` vazio; `packages/navigation` limpo |
| I5 | Voz só onde há consumidor | `voice.ts` | `npm run test -- src/lib/__tests__/voice.test.ts` + `check:voz` |
| I6 | Só tokens semânticos, sem hex em classe | bloco de estágio | `check-boundaries` + revisão |
| I7 | Botão real, alvo ≥44 px, rótulo no `aria-label` | bloco de estágio | revisão |

---

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Sem nenhum registro de estágio | Convite "campo, supervisão e entregas — tudo num lugar só ♡"; os dois CTAs continuam |
| Horas zeradas com registros | Mostra `0h` e a contagem de registros — honesto, sem esconder |
| Pendências de reflexão/supervisão | "N pedindo carinho" no lugar de "tudo em dia" |
| Mascote e CTA na mesma faixa | `pr-16` reserva a área do mascote, para o CTA não cair embaixo dele |
| Tela estreita | O CTA quebra linha (`flex-wrap`); o número grande não quebra |

---

## 8. Histórico: a proposta que foi revertida

Em 2026-10-14 a tela foi reescrita como narrativa de **oito cards**
(`FacultyPage`, `FacultyHeroCard`, `CecinhoFacultyNote`, `TodayFacultyCard`,
`FacultyAttentionCard`, `FacultyWeekCard`, `CoursesCardsSection`,
`PracticeCornerCard`, `FacultyNavigationCards`), com `SubTabFaculdade` ganhando
`'overview'` como padrão e a tab bar saindo da primeira camada.

**Rejeitada pela dona do produto em 2026-10-15**, com três motivos: a tela ficou
**cheia de cartão**; as informações **não ficaram claras** dentro dela; e o
estágio, que é importante nesta fase, **perdeu o foco** que tinha.

O que sobrou dela e foi aproveitado: o bloco de estágio lendo números do domínio
em vez de frase, e a frase do cecinho vinda do motor de voz. O que saiu: os nove
componentes, os dez testes, o `facultyViewModel.ts`, as dezoito chaves de voz,
o `'overview'` de `SubTabFaculdade`, `DEFAULT_SUB_TAB.faculdade` e o default de
`navigationEngine.ts`. As decisões antigas `D1..D14` **não** valem mais: onde
this spec e a proposta anterior divergirem, **esta spec vence**.

---

## 9. Critérios de aceite

- [x] `npm run lint` sai com 0
- [x] `npm run test` sai com 0
- [x] `node .github/scripts/check-boundaries.mjs` sai com 0
- [x] `npm run check:voz` sai com 0 frases inline
- [x] `git diff --stat contracts/` sai vazio (I4)
- [x] `git diff --stat packages/navigation` sai vazio (I4)
- [ ] Revisão visual na usuária (sem navegador no ambiente de agente)

Números são **gerados**, não copiados:

```bash
npm run lint
npm run test
node .github/scripts/check-boundaries.mjs
npm run check:voz
git diff --stat contracts/
Get-ChildItem src\components\views\faculdade -File -Filter *.tsx | Measure-Object
```

## 10. Medição

| Métrica | Como medir | Gate |
|---|---|---|
| Componentes novos na pasta da tela | `Get-ChildItem src\components\views\faculdade -File -Filter *.tsx \| Measure-Object` | revisão (D1: zero novo) |
| Tamanho da mudança | `git diff --stat src/components/views/FaculdadeView.tsx` | revisão |
| Contrato intocado | `git diff --stat contracts/` | vazio |
| Navegação intocada | `git diff --stat packages/navigation src/context/navigationEngine.ts` | vazio |
| Sem corrupção de encoding | `Select-String -Path <arquivos> -Pattern ([char]0xFFFD)` | vazio |

## 11. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| O bloco de estágio ficar apertado com o mascote em tela estreita | média | baixo | `flex-wrap` + `pr-16` já estão; se ainda apertar, o mascote desce |
| Perder alguma ação na fusão dos dois botões | baixa | alto | abrir o diário (área de cima) e anotar (botão) continuam no mesmo card, com os mesmos handlers |
| A contagem divergir do diário | baixa | alto | a regra é do domínio (`computeStats`/`computePendencies`), a mesma do `InternshipSection` |
| Reaparecer proposta de "melhorar" via reconstrução | média | alto | D1 e §8: refino é lapidação; reconstrução é outro produto |

## 12. Rastreabilidade

| Decisão | Onde no código | Verificação |
|---|---|---|
| D1 | `src/components/views/FaculdadeView.tsx` (diff de 82/29, nenhum bloco movido) | revisão |
| D2 | bloco "diário de estágio" | revisão |
| D3 | `<section>` + dois CTAs internos; botão solto removido | revisão |
| D4 | `estagio` (`useMemo` → `internshipCases`) | `computeStats`/`computePendencies` |
| D5 | `voice.ts` (`DICA.faculdadePraticaAcompanha`) | `voice.test.ts` + `check:voz` |
| D6 | classe do bloco | `check-boundaries` |

---

> Regras de escrita do
> [`AGENTS.md`](../../AGENTS.md#regras-de-escrita): pt-BR, zero emoji em `#` e
> `##`, `caminho:linha` obrigatório, e **escreva com a ferramenta `write`/`edit`,
> nunca com PowerShell**.