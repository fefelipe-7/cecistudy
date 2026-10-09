# To-do: Padrão hero e qualidade de UI do Estágio (SPEC-010)

> Spec: [`../docs/specs/SPEC-010-padrao-hero-e-qualidade-de-ui-do-estagio.md`](../docs/specs/SPEC-010-padrao-hero-e-qualidade-de-ui-do-estagio.md)
> **Regra de ouro:** cada fase fecha com `npm run lint` + `npm run test` +
> `node .github/scripts/check-boundaries.mjs` verdes. `SCHEMA_VERSION` fica **20**
> a fase inteira (a spec é só apresentação).

**Progresso:** 8/8 fases ✅ — F7 concluída em 2026-10-07. SPEC-010 `entregue`.

**Ordem das fases:** molde (F1) → as três superfícies (F2–F4) → cards/escala (F5)
→ contrato dos componentes (F6) → gates e docs (F7). Cada fase é um passo
independente: se uma parar, a anterior já está em verde.

---

## F0 — Preparação (aprovação do plano)

- [x] **F0.1** SPEC-010 aprovada: status `proposta` → `em andamento`, decisões
  `D1..D7` viraram `[D]` (marca `[D]`/`[P]`/`[A]` obrigatória).
- [x] **F0.2** Este arquivo de tasks criado, com fases, arquivos e gates.
- [x] **F0.3** Baseline registrado: `npm run lint` 0 · `npm run test` 1217 pass /
  110 arquivos · boundaries 0.

**Verificação:** gates verdes antes de tocar em qualquer arquivo de UI.

---

## F1 — Molde do hero (D2)

- [x] **F1.1** `src/components/ui/HeroCard.tsx` — componente puro com a
  assinatura da §5 da spec (`eyebrow`, `title`, `summary`, `action`,
  `expression`, `accent`, `testId`); molde copiado de
  `faculdade/HeroSection.tsx:24-51` (`rounded-[26px]`, gradiente, serifa,
  mascote `-bottom-2 -right-2`, ação no canto superior direito).
  - *Accept:* `rg -c "font-serif-academic" src/components/ui/HeroCard.tsx` → 1.
  - *Invariantes:* não importa `useMobileApp`/`useNavValue`; não calcula data.
- [x] **F1.2** `src/components/internship/__tests__/HeroCard.test.tsx` — render
  com `testId="hero-card"`, ação chamando `onClick`, `accent="blue"` trocando a
  classe do gradiente, sem `console.error`. **6 testes.**
  - *Files:* `src/components/internship/__tests__/HeroCard.test.tsx`

**Verificação:** `npm run lint` + `npm run test` verdes.

---

## F2 — Diário: um hero, acima da barra de abas (D1, D3)

- [x] **F2.1** `src/components/views/InternshipDiaryView.tsx` — cabeçalho
  compacto removido; **um** `HeroCard` acima da `UnderlineTabBar`, com conteúdo
  por aba ativa: diário → `${formatHours(doneHours)} h de campo`; pacientes →
  nº de pacientes; supervisão → nº de encontros; resumo = meta + pendências;
  ação contextualizada (`anotar` / `anotar atendimento` / `anotar supervisão`).
- [x] **F2.2** Teste I1 (`InternshipDiaryHero.test.tsx`): `getAllByTestId(
  'hero-card').length === 1` nas três abas (3 testes).
  - *Files:* `src/components/internship/__tests__/InternshipDiaryHero.test.tsx`

**Verificação:** `npm run lint` + `npm run test` verdes.

---

## F3 — Supervisão: fim do cabeçalho duplo + PillGroup (D3, D7)

- [x] **F3.1** `src/components/views/SupervisionView.tsx` — cartão-cabeçalho
  removido (o hero do Diário é o topo da aba).
- [x] **F3.2** `SegmentedControl` → `PillGroup` `size="sm"` `variant="rose"`;
  filtros de pendência continuam `StatusChip`.
- [x] **F3.3** Faixa de pendentes ("levar pra próxima") mantida — é conteúdo.
  - *Accept:* teste I1 da aba supervisão asserta ausência do `h2` antigo.

**Verificação:** `npm run lint` + `npm run test` verdes.

---

## F4 — Caso: hero com iniciais, barra só secundária (D3)

- [x] **F4.1** `src/components/views/InternshipCaseView.tsx` — bloco hero vira
  `HeroCard` `accent="blue"` (`eyebrow="paciente"`, título = iniciais ou "sem
  iniciais", resumo = sessões · horas · última · idade · abordagem ·
  pendências, ação `nova sessão`); stats/progresso/`corrigir iniciais` num card
  abaixo.
- [x] **F4.2** Barra inferior perdeu `nova sessão`; mantém `levar pendentes pra
  supervisão` e `adicionar iniciais`.
- [x] **F4.3** Teste I1 da tela do Caso (`InternshipCaseHero.test.tsx`): exatamente
  1 `hero-card`, ação no hero, accent blue. **3 testes.**

**Verificação:** ✅ `npm run lint` 0 · testes do módulo 18/18 · boundaries OK.

---

## F5 — Cards e escala (D4, D5)

- [x] **F5.1** `src/components/internship/InternshipCaseCard.tsx` — tile de
  iniciais à esquerda no formato do tile do `CourseDetailView.tsx:113-118`;
  `line-clamp` no título; card inteiro ≥44px.
- [x] **F5.2** Escala da §D4 aplicada nos arquivos do módulo (títulos de seção,
  títulos de card `text-base`, `space-y-4`/`space-y-3`, raios).
- [x] **F5.3** `InternshipLogCard` alinhado à escala (mantém `text-lg` só por
  ser card expansível).

**Verificação:** ✅ `npm run lint` 0 · testes do módulo 22/22 · gate de hex (§8) = 1 (só o `accentColor` do gráfico).

---

## F6 — Contrato dos componentes (D6)

- [x] **F6.1** `src/components/wizards/StepProgress.tsx` —
  `role="progressbar"` + `aria-valuemin`/`aria-valuemax`/`aria-valuenow`
  + `aria-current="step"` no passo ativo.
- [x] **F6.2** Chaves únicas por índice nos componentes do módulo (I3) —
  `NextStepRow` (`${step}-${i}`) corrigido; teste de duplicata sem warning.
- [x] **F6.3** `EmptyState`, `StatusChip`, `NextStepRow`, `StepProgress`,
  `HeroCard` — `min-h-[44px]` e `focus-visible:ring-2
  focus-visible:ring-ceci-brand` em todo controle (I2, I5).
- [x] **F6.4** Testes I3/I4 (`ModuleChromeContract.test.tsx`, 5 testes).

**Verificação:** ✅ `npm run lint` 0 · testes do módulo 26/26 · boundaries OK · gate de hex = 1.

---

## F7 — Fechamento

- [x] **F7.1** Todos os critérios de aceite da §8 da spec marcados, com o
  comando que os produziu.
- [x] **F7.2** §9 Medição: números "depois" preenchidos com os comandos.
- [x] **F7.3** §12 Reconciliação: itens D1/D2/D3/D4/D5/D7 → implementado.
- [x] **F7.4** SPEC-010 → status `entregue`; `docs/specs/README.md` atualizado.
- [x] **F7.5** `AGENTS.md` do mobile ganha a regra da SPEC-010 (uma abertura de
  superfície = um `HeroCard`; escala única do módulo).
- [x] **F7.6** Validação UTF-8 final: `Select-String -Pattern ([char]0xFFFD)`
  vazio em todos os arquivos tocados; `npm run build` OK.

**Verificação final:** `npm run lint` 0 · `npm run test` 0 falhas · boundaries 0
· `npm run build` OK.

---

## Fora de escopo (fica aberto)

- Migrar `home/HeroSection` e `faculdade/HeroSection` para `HeroCard` — são a
  referência; registrar e fazer depois (§4 da spec).
- Sub-aba "estágio" da Faculdade (`faculdade/InternshipSection.tsx`).
- Escuro/dark mode novo, cópia de grupo (`SPEC-M-xxx`).
- Qualquer regra, tipo ou persistência da SPEC-009 — domínio fechado.
