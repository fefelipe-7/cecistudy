# Spec Visual: Shell Desktop (Sidebar · Topbar · Statusbar · Overlays)

> Módulo id: `shell` — fundação da reconstrução visual da superfície desktop.
> Companheiro: `context-desktop/REBUILD-DESKTOP-CAPABILITY-MAP.md` (aprovado) e
> `desktop/spec/01-shell-navegacao.md` (Plano original Fase 10 — lógica já implementada).
>
> **Direção aprovada: "refino do Notion-like atual".** Manter a estética clean/calorosa-fluída
> (`cecistudy-desktop-shell.json`); refinar **tipografia, elevação, densidade/contraste de zonas,
> estados (hover/focus/active) e consistência de tokens/radius**. Sem identidade nova, sem serifa
> editorial, sem dark, sem paper-texture. **Visual-only: nenhuma lógica muda.**

---

## 1. Objective

Polir a casca desktop para um acabamento "premium SaaS, mesma alma" consistente — mesma estrutura
funcional atual, com hierarquia tipográfica mais clara, elevação mais disciplinada, zonas com
contraste intencional e estados interativos consistentes (hover/focus/active). É a fundação de
tokens/visual que os módulos seguintes (faculdade, calendario, conhecimento, projetos, inbox)
vão consumir.

**Sucesso:** ao rodar o app desktop, a casca parece "só refinou" (nada estranho, nada novo de
identidade), mas com micro-detalhes claramente mais polidos — hierarquia, repouso visual, padrões
repetidos consistentes.

## 2. Constraints (visual-only — inegociável)

- **Nunca** editar: `packages/*`, `src/core/*`, `src/context/*` (lógica/estado), `src/lib/schedule.ts`,
  `src/lib/routing.ts`, `.github/*`, apps nativos.
- **Nunca** mudar comportamento: navegação, state, ações, handlers, eventos, acessibilidade de
  papel (aria), `data-*` de teste. Só muda classe/style/marcação de apresentação.
- **Nunca** adicionar dependência, nem bump de schema.
- Hex em classe → proibido; usar `var(--ds-*)` / tokens semânticos. Hex só como dado via `style={{}}` .
- Rosa nunca é **fundo de painel** (sidebar/canvas/inspector); rosa só em ações primárias, feedback,
  e micro-acentos (avatar, badge de inbox, nav ativa de item pequeno).
- Testes: manter os 500+ verdes; testes que asseram visual podem ser atualizados (com os mesmos
  seletores se possível).

## 3. Commands

- Lint/typecheck: `npm run lint`
- Testes: `npm run test`
- Build web: `npm run build`
- Dev desktop: `npm run dev:desktop` (ou `?platform=desktop`)
- Boundaries: `node .github/scripts/check-boundaries.mjs`

## 4. Project Structure (arquivos do módulo)

| Arquivo | Ação |
|---|---|
| `src/desktop/styles/desktop-tokens.css` | **Refinar**: adicionar tokens faltantes e reordenar por camada |
| `src/desktop/components/DesktopSidebar.tsx` | **Refinar**: estados nav, badges por aba, hover/focus, busca única |
| `src/desktop/components/DesktopTopbar.tsx` | **Refinar**: breadcrumb contextual, remover busca dupla, popover de visão |
| `src/desktop/components/WorkspaceSwitcher.tsx` | **Refinar**: micro-consistência (avatar/ativo/dropdown) |
| `src/desktop/components/ui/Panel.tsx` · `StatusBadge.tsx` | **Refinar**: tokens em vez de classes hardcoded |
| `src/shells/DesktopAppShell.tsx` | **Refinar**: statusbar/footer + overlay (só apresentação) |
| `src/desktop/components/ContextInspector.tsx` | **Refinar** (leve) — ver §7 |
| `src/desktop/components/CommandPalette.tsx` | **Refinar** visual do alerta de resultados/agrupamento (se tocar só classes) |

> Testes existentes que referenciam a casca (`desktopShell.test.tsx`, `WorkspaceSwitcher.test.tsx`)
> devem seguir verdes com os mesmos `aria-label`/textos (visual-only, sem renomear texto funcional).
> Se um texto precisa mudar por clareza (ex.: breadcrumb), atualizar o teste de acordo.

## 5. Design fundação — sistema de refinamento

### 5.1 Tokens (`desktop-tokens.css`) — refinamento por camada

Adicionar/ajustar, mantendo os existentes:

```css
/* --- surface: hierarquia de zonas (borda separa; sombra só flutua) ---
   canvas #FFFFFF · sidebar ~2-3% mais escura (#F7F6F4) · inspector tingido (#FBF9F7) */
--ds-surface-hover: #F2EFEB;        /* hover de item (nav, menus) — neutro, nunca rosa */
--ds-surface-active: #EBE7E1;       /* item de nav selecionado (Notion-like) — puro neutro */
--ds-surface-raised: #FFFFFF;       /* cards/popovers */

/* --- infra / foco (acessibilidade) --- */
--ds-focus-ring: 0 0 0 3px rgba(216, 95, 121, 0.25);  /* anel de foco: rosa suave, discreto */
--ds-focus-ring-neutral: 0 0 0 3px rgba(40, 32, 34, 0.18); /* foco em nav (não-roxa) */

/* --- elevation: reorder para hierarquia 3 níveis --- */
--ds-elevation-xs: 0 1px 2px rgba(40,32,34,0.05);        /* cards base */
--ds-elevation-sm: 0 2px 6px rgba(40,32,34,0.07);        /* hover/raised */
--ds-elevation-md: 0 8px 24px rgba(40,32,34,0.12);       /* popovers/dropdown/menus */

/* --- typographic scale (desktop) --- */
--ds-text-xl: 1.375rem;   /* título de tela = 22px/600 Plus Jakarta (hoje inline) */
--ds-text-lg: 1.0625rem;  /* 17px — used em títulos de card/lista */
--ds-text-md: 0.9375rem;  /* 15px — corpo/toast */
--ds-text-sm: 0.8125rem;  /* 13px — corpo compacto */
--ds-text-xs: 0.75rem;    /* 12px — captions/labels */
--ds-text-2xs: 0.6875rem; /* 11px — uppercase section labels */
--ds-text-mono: var(--font-mono);  /* kbd, horas do calendário, contagens */
```

> Sem hex em classe. Usar `var(...)` no style quando valor dinâmico; classes semânticas
> (`text-ceci-primary`, `bg-[var(--ds-surface-hover)]`) no restante.

### 5.2 Tipografia

- Manter **Plus Jakarta Sans (font-display)** exclusivo do título de tela (22px/600) — *single
  display accent* do desktop (hard constraint do JSON).
- Corpo = Inter (sans). Labels de seção = `text-[11px] uppercase tracking-[0.06em]` (padrão atual,
  manter).
- **Hora/código/números** = JetBrains Mono (kbd chips, contagens, horas de calendário).
- Escala acima define os tamanhos por data type; refinar substituindo `text-[XXpx]` avulsos por esses
  tokens onde fizer sentido sem churn.

### 5.3 Elevação & zonas

- **Borda separa regiões** (sidebar|inspector|camada de conteúdo); sombra só em elementos flutuantes
  (popovers, dropdowns, command palette, overlay de escrita).
- Sidebar/inspector: sem sombra. Content canvas: `#FFFFFF`.
- `shadow-xl`/`shadow-floating` fora de popover → trocar por `--ds-elevation-*` (G7).

### 5.4 Estados interativos (consistentes)

- **Hover de item de nav/acelerador/menuitem**: `var(--ds-surface-hover)` via classe CSS
  (`hover:bg-[var(--ds-surface-hover)]`). **Remover os `onMouseEnter/onMouseLeave` inline** do
  `DesktopSidebar` (hoje `rgba(0,0,0,0.03)`) — menos JS, mais consistente, hover obrigatório só
  quando há affordance.
- **Active (selecionado) na nav**: `var(--ds-surface-active)` de fundo + `text-ceci-primary`;
  **rossa apenas marca o item ativo** com uma barrinha de 3px à esquerda + ícone `text-ceci-brand-strong`
  (assinatura "caneta" discreta, coerente com a barra de domínio usada nos cards de módulo da Home).
  Isso substitui o atual `--ds-accent-subtle` de fundo de item — aproxima do Notion e libera o rosa
  como acento, não painel.
- **Focus-visível**: `focus-visible:outline-none` + `focus-visible:[box-shadow:var(--ds-focus-ring)]`
  em todo elemento interativo (sidebar, topbar, workspace, profile, CTA). Nav usa ring neutro; ações
  primárias usam ring rosa.

### 5.5 Radius & densidade

- Teto **20px** (já). Menus/popovers `rounded-[12-14px]`; itens de nav `rounded-[8px]`; cards `rounded-2xl`.
- Densidade (comfortable/compact) já vive em `DesktopSessionState`; esta fase só **refina o padding
  de listas** nos módulos seguintes (calendário/faculdade). No shell: nada muda.

## 6. Componentes — refinamento por arquivo (aceite)

### 6.1 `desktop-tokens.css`
- [ ] Adiciona `--ds-surface-hover`, `--ds-surface-active`, `--ds-focus-ring`, `--ds-focus-ring-neutral`,
      escala `--ds-text-*`; mantém os existentes sem quebrar consumers.
- [ ] Sem hex novo em classes (só em definições de token).

### 6.2 `DesktopSidebar.tsx`
- [ ] Marca: igual, com hover/focus; manteve `cecistudy ♡`.
- [ ] Busca: **única entrada de busca** do shell — mantém aqui (⌘K); remove o campo largo duplicado da
      topbar (§6.3); kbd chip `⌘K` em mono.
- [ ] Navegação primária:
  - [ ] hover dos itens = `--ds-surface-hover` (classe, sem `onMouseEnter/Leave`).
  - [ ] item ativo = fundo `--ds-surface-active`, texto `ceci-primary`, **barrinha de 3px rosa à
        esquerda** + ícone rosa-strong; `aria-current` preservado.
  - [ ] `focus-visible` ring neutro em todos.
  - [ ] **Badges por aba** (derivados no render, count>0, somente leitura):
        `faculdade` → nº de provas nos próximos 7 dias (`app.exams`); `estudos` → flashcards a revisar
        (`app.flashcards`); `biblioteca` → `app.savedBookIds.length`. Badge = pill neutra `--ds-surface-raised`
        + `--ds-text-secondary`, texto xs mono. `home` sem badge.
- [ ] Inbox/Grafo (aceleradores): mesmo tratamento de hover/focus; badge de `pendingCount` mantém o
      rosa (é micro-acento de atenção) ou vira neutro — decisão: **neutro** (Notion-like) com
      `--ds-accent-strong` só quando ativo.
- [ ] Grupos (`navegação`, workspace) mantêm label uppercase xs.
- [ ] Perfil: refinamento de borda/hover; mantém avatar, nome, semestre.
- [ ] CTA `novo registro`: mantém `--color-ceci-primary` com hover `--color-ceci-primary-hover`;
      kbd `⌘N` em mono.
- [ ] `dica do cecinho` (Panel dashed): mantém estrutura; rosa só no CTA secundário.

### 6.3 `DesktopTopbar.tsx`
- [ ] **Breadcrumb contextual**: substitui o título único por trilha derivada da pilha (`home ›
      faculdade › [curso]`); último item = título da tela (em Plus Jakarta 22px/600); itens
      anteriores clicáveis (pop na pilha via `app.goBack`/handler já existentes), separador chevron
      `›` em `--ds-text-tertiary`. Não inventa navegação: reusa `app.*` existentes.
- [ ] **Busca única**: remove o campo largo `w-72` (só o ícone compacto do ⌘K no topbar em telas
      menores; a busca principal fica na sidebar). Zero duplicação visual de busca.
- [ ] Preferências de visualização (clareza + densidade): popover refinado (`elevation-md`,
      `rounded-[14px]`, foco visível, segme. active) — mantém `aria-pressed` e `patch`.
- [ ] Streak badge: pill refinada (mantém variante brand; pode virar neutra c/ rosa no coração —
      decisão visual: **neutral** com `ceci-brand-strong` no ♡).
- [ ] Altura `h-11` preservada; título 22px/600.

### 6.4 `WorkspaceSwitcher.tsx`
- [ ] Dropdown: `elevation-md`, radius 14px, foco visível, hover `--ds-surface-hover`.
- [ ] Avatar do workspace: mantém rosa (micro-marca), refina tamanho/borda.
- [ ] Item ativo do menu: **neutro** (`--ds-surface-active`) com `Check`; item atual passa a não usar
      `bg-surface-rose` em menuitem (rosa só no avatar).

### 6.5 `ui/Panel.tsx` · `ui/StatusBadge.tsx`
- [ ] `Panel`: troca `border-ceci-border-subtle`/dashed por tokens consistentes; mantém `bg-white
      rounded-2xl`; `--ds-elevation-xs` apenas quando card flutuante pedir (Padrão: borda separa —
      **sem sombra default**; só `shadow-xs` removível por prop).
- [ ] `StatusBadge`: variantes mapeadas a tokens/paletas existentes (sem hex novo); `neutral`
      continua beige.

### 6.6 `DesktopAppShell.tsx` (só apresentação)
- [ ] Statusbar/footer: refinado — dot de status `success` mantém; espaçamento `px-8`, `h-7`;
      adiciona `--ds-text-2xs`/mono para o texto secundário se aplicar; mantém `sincronizado` +
      universidade.
- [ ] Overlay de escrita: mantém `rounded-[20px]` (teto), `elevation-md`, sem blur; adiciona
      `focus-visible` numa ação de fechar se houver; nada além de classe.

### 6.7 `ContextInspector.tsx` (leve)
- [ ] Header/fundo de painel: alinhar a `--ds-surface-inspector`, borda `--ds-border-subtle`,
      padding/fonte da escala; **sem mudança estrutural/de estado** (props `open`/`onToggle` mantidas).

### 6.8 `CommandPalette.tsx` (leve)
- [ ] Visual de agrupamento por domínio (caption uppercase) e kbd chips em mono; popover `elevation-md`;
      mantém lógica/comando/trigger exatos.

## 7. Testing Strategy

- Manter os 500+ verdes.
- `desktopShell.test.tsx` e `WorkspaceSwitcher.test.tsx`: **não devem quebrar** se textos/aria de
  ação forem preservados. Atualizar apenas o que refletir mudança visual de rótulo (ex.: título do
  breadcrumb em vez de string única).
- Novo teste leve (opcional) se houver componente extraível puro (ex.: badges de contagem por aba) —
  seguir padrão Vitest/jsdom existente.
- Nenhuma lógica nova testável por unidade esperada nesta fase (visual-only).

## 8. Boundaries (sempre / perguntar / nunca)

- **Sempre:** rodar `npm run lint` + `npm run test` após cada slice; manter `aria`/`data-*`; usar tokens.
- **Perguntar antes:** se um item visual exigir mudar texto funcional, aria-label ou seletores de
  teste (pequeno, mas relatar); se precisar tocar `CommandPalette`/`ContextInspector` além de classe.
- **Nunca:** editar `packages/*`, `src/core/*`, `src/context/*`, `src/lib/{schedule,routing}.ts`,
  `apps/desktop/src/session/*` (modelo), `.github/*`; mudar comportamento/navegação/schema; adicionar dep.

## 9. Success Criteria (fim do módulo)

- [ ] Rodar o desktop (`dev:desktop`): casca visualmente polida e **comportamento idêntico** ao atual
      (navegação, ⌘K/⌘N/⌘1–⌘4, breadcrumb volta, badges corretos, workspace switch igual).
- [ ] `npm run lint` limpo · `npm run test` (500+) verde · `npm run build` gera `dist/` ·
      `check-boundaries.mjs` verde.
- [ ] Sem hex em classe em `src/desktop/**` após o slice (grep `-[#]` preexistente → zerado nesta fase).
- [ ] Nenhuma lógica alterada: `git`-diff visual por arquivo mostra só classe/style/marcação.
- [ ] Roadmap/mapa atualizado (status do módulo `shell` = done).

## 10. Open questions

- Breadcrumb: o título de tela atual (ex.: "calendário acadêmico") vira o último crumb — quando não
  há pilha útil (Home), manter apenas o título simples. Ok?
- Badges de estudos: "flashcards a revisar" — definir "a revisar" = `!lastReviewed || due`? Sugerido:
  flashcards com `timesReviewed < 1` ou `dueToday` (derivação simples, sem lógica nova)
  → resolver na implementação/incremental, sem criar função de calendário.