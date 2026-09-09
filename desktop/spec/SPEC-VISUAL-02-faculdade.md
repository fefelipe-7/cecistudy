# SPEC-VISUAL-02 — Módulo `faculdade` (master-detail de disciplinas)

> Refino visual-only da reconstrução da superfície desktop. Direção aprovada:
> **"refino do Notion-like atual"** — clean, calorosa-fluída, consistência de tokens/radius,
> elevação por zonas + sombra só em flutuante, rosa como acento (nunca fundo de painel).
> Escopo: **visual-only** — zero mudança de comportamento/navegação/estado/aria/schema.

## 1. Objetivo

Refinar a apresentação da aba **faculdade** desktop: o master-detail já implementado
(`CourseMasterList` + `CourseDetailPane` via `SplitLayout`, montado em
`src/desktop/screens/DesktopScreenLayers.tsx`). Módulo `shell` (slides/topbar/sidebar/statusbar)
já foi refinado e trava as transições da casca (ver `SPEC-VISUAL-01-shell.md`).

## 2. Front de limites (reafirmado)

- **Dentro:** `src/desktop/components/CourseMasterList.tsx`, `src/desktop/components/CourseDetailPane.tsx`,
  `src/desktop/screens/DesktopScreenLayers.tsx` (só a `buildDesktopFaculdade`), `src/desktop/layouts/SplitLayout.tsx`.
  Testes que asseram **visual** dos componentes desktop de faculdade podem ser atualizados.
- **Fora (preservar — nem editar):** `packages/domain|application|data`, `src/core/*`, `src/context/*`,
  `src/lib/schedule.ts`, `src/lib/routing.ts`, `src/data/*`, `.github/*`, apps nativos.
  **Não editar** os componentes de conteúdo compartilhados mobile/desktop
  (`src/components/courses/detail/CourseInfoContent|CourseAulasContent|CourseRepertorioContent`, `CourseCreateMenu`)
  — são reusados pelo mobile; se precisarem de mudança, paramos (fora de escopo).
- **Nenhuma mudança** de comportamento, navegação, estado, aria/semântica ou schema.
- **Sem hex cru em classe** — usar `var(--ds-*)`/tokens semânticos (`text-ceci-*`, `bg-surface-*`, `border-ceci-border-*`).
  Hex como dado (course.color) continua em `style={{}}`.

## 3. Estado atual (baseline)

- `CourseMasterList.tsx` — lista de disciplinas (cards `Panel` compactos, header "disciplinas" + botão "+").
- `CourseDetailPane.tsx` — grid `[minmax(260px,300px) 1fr]`: coluna esquerda = resumo (identidade, badges,
  logística/foco/atendimento), direita = `UnderlineTabBar` (informações/aulas/repertório) + conteúdo compartilhado.
- `SplitLayout.tsx` — `flex gap-5`, master `width: 300`.
- `DesktopScreenLayers.tsx:buildDesktopFaculdade` — calendário → `CalendarScreen`; `disciplinas` → `SplitLayout`
  com master `CourseMasterList` e detail `DetailPaneFade`.

## 4. Especificação de refino

### 4.1 Lista-mestra (CourseMasterList)

- **Header** alinhado ao design: label "disciplinas" com o estilo de seção do shell
  (`text-[11px] uppercase tracking-wider text-ceci-muted`); botão "+" com `aria-label`, borders/radius/tokens.
- **Card de disciplina** no padrão "premium SaaS mesma alma":
  - Eleição ativa ≠ fundo rosa: ativo = `border-ceci-border-strong` + fundo `var(--ds-surface-active)` ou sutil,
    com **accent** rosa reservado a estados de leitura (badge "aberta", contadores), nunca fundo de painel.
  - Linha 2: ícone de curso em tile `bg-surface-muted` (mantido), nome `text-sm font-semibold text-ceci-primary`,
    subtitle `text-xs text-ceci-muted`; à direita, metadata compacta da disciplina
    (ex.: horário `formatCourseSchedule` em `--ds-text-xs` / `font-mono` p/ dimensões quantitativas).
  - Transição de hover suave via classe (`hover:border-ceci-border-strong`, `bg` sutil) — **sem** `onMouseEnter/Leave`.
- **Micro-animação:** revisar com cuidado; sem re-implementar swipe (Fase 9 revertida).
  Vazio: manter placeholder acolhedor.

### 4.2 Pane de detalhe (CourseDetailPane)

- Coluna esquerda (resumo) — refino de tipografia/raio/elevação:
  - Identidade: avatar de curso com `backgroundColor: ${course.color}20` (dado), nome `font-display text-lg font-bold`,
    docente com ícone `UserCheck` em `--ds-accent-strong`.
  - Badges: `StatusBadge` já em tokens — manter; separadores `border-t border-ceci-border-subtle`.
  - `dl` de logística: rótulos `text-[10px] uppercase tracking-wider text-ceci-tertiary`, valores `text-xs font-semibold`
    (mantidos); **foco** com `Timer` + valor `text-ceci-academic-strong` (mantido).
  - Cards: usar `Panel` (borda separa zonas; sem sombra default).
- Coluna direita (abas):
  - `UnderlineTabBar` mantida (padrão underline do detale).
  - `CourseCreateMenu` mantido (ação contextual).
  - Conteúdo da aba: Reaproveitar **como está** os componentes compartilhados
    (`CourseInfoContent`/`CourseAulasContent`/`CourseRepertorioContent`) — NÃO editar. Refinar apenas a
    **moldura/moldura da pane** (espaçamentos, raio, e o wrapper da coluna direita, se necessário isolado aqui).
- **Entrada da pane:** `DetailPaneFade` (crossfade + micro subida, `desktopScreenVariants`/curva `[0.22,1,0.36,1]`
  já refinada no módulo shell) preservada — focar curso não recria a tela inteira.

### 4.3 SplitLayout

- Manter `masterWidth=300`; refinamento fino de `gap`/alinhamento se necessário (ex.: `items-start`).
- O calendário (`faculdade/calendario`) **não faz parte deste módulo** — módulo `calendario` é separado (fase 3).

## 5. Critérios de aceite

- [ ] Focar/alternar disciplina **não** recria a tela inteira (pane de detalhe transiciona sozinha).
- [ ] Sidebar continua marcando "Calendário" como ativo na sub-tab calendário; foco de curso não marca nav item.
- [ ] Nenhum `onMouseEnter/Leave` adicionado em cards de disciplina.
- [ ] Apenas tokens (`var(--ds-*)`/semânticos); sem hex cru novo em classe.
- [ ] Estados de hover/active em cards refinados (borda/fundo sutil + accent pontual rosa).
- [ ] Conteúdo de abas mantém os componentes compartilhados intactos.
- [ ] `aria-label`/`role="option"`/`aria-selected` preservados no master.
- [ ] Gate: `npm run lint` + `npm run test` (+ `npm run build` + `check-boundaries` no fim do módulo) verdes.

## 6. Verification (gate por slice)

- `npm run lint` (`tsc --noEmit`).
- `npm run test` (deve continuar verde; novos testes só para lógica pura extraível, se houver).
- Fim do módulo: `npm run build` + `node .github/scripts/check-boundaries.mjs` + grep de hex em classe em `src/desktop/**`.

## 7. Observações de implementação

- Reavaliar o card ativo do master: o fundo rosa `bg-surface-rose`/`border-brand` pode ser trocado por
  `border-ceci-border-strong` + fundo `var(--ds-surface-active)` e o **rosa** reservado ao badge "aberta"
  (`StatusBadge variant="brand"` já em tokens) e/ou contadores — mantendo o accent-direção aprovada.
- Manter responsive: o master é `width: 300px` fixo; não quebrar em janelas menores.