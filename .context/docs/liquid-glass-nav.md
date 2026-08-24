# Plano: Liquid Glass na Navegação (BottomNav + HeaderNav)

> Aplicar o efeito visual "liquid glass" (estilo Apple) nas barras de navegação
> existentes do cecistudy — `BottomNav` e `HeaderNav` — adaptado ao design system
> pt-BR/acolhedor do projeto. Inspiração: componente `apple-liquid-glass-switcher`
> (seletor de tema light/dark/dim), reaproveitado como referência estética.

**Status:** `[ ]` não iniciado · **Pré-requisitos:** nenhum · **Gate final:** `npm run lint` + `npm run test` + `npm run build` verdes.

---

## 0. Contexto e referência

O componente de referência (`ThemeSwitcher` com liquid glass) combina 3 camadas para
criar o efeito "vidro líquido" morphing:

1. **SVG filters** inline no HTML — `feImage` (mapa de distorção embutido como base64)
   + `feGaussianBlur` + `feDisplacementMap` (modifica pixels do conteúdo com base no mapa).
2. **CSS** — aplica `filter: url(#filtro)` em um `<div>` de fundo e usa `data-previous`
   + keyframes `scaleToggle` na opção ativa para sincronizar o morph com a troca.
3. **Transparência + blur** — `background` semi-transparente + `backdrop-blur-*`
   para o conteúdo atrás aparecer suavemente ("frosted glass").

O filtro `feDisplacementMap` (scale `0.5`) é **sutil** — distorce apenas ~0.5px,
criando uma vibração orgânica sem comprometer a legibilidade.

### Decisões de produto (adaptar ao cecistudy)
- **Não** usar o mecanismo `data-previous` + 3 keyframes do `ThemeSwitcher`
  (ele depende de radio inputs e selects discretos light/dark/dim). O cecistudy tem
  5 abas em um `motion` pill animado por `framer-motion` (`layoutId`). Em vez disso:
  - O **filtro SVG** fica **sempre ativo** no container do nav → efeito sutil contínuo.
  - O **pill ativo** recebe um background "vidro" (gradiente branco translúcido)
    no lugar do `bg-surface-rose` sólido atual, mantendo o spring `layoutId`.
- Manter a **paleta e tokens semânticos** do projeto (`ceci-*`, `surface-*`, `border-*`).
  Hex só como dado (via `style`), nunca em classes (regra do design system).
- Acessibilidade: o filtro é puramente decorativo; conteúdo mantém `aria-label` e contraste.

---

## 1. Análise do estado atual

| Componente | Arquivo | Estado atual | Linhas |
|---|---|---|---|
| `BottomNav` | `src/components/BottomNav.tsx` | Wrapper fixo (`bottom-[calc(1rem+env(...))]`, `z-40`, `pointer-events-none` auto) que renderiza `BottomNavBar` + `FloatingActionMenu` | 81 |
| `BottomNavBar` | `src/components/ui/bottom-nav-bar.tsx` | Pill branco sólido: `bg-white/95 border rounded-full shadow-floating h-[52px]`; pill ativo = `bg-surface-rose border-ceci-border-brand` com `layoutId="bottomnav-active-pill"`; ícone ativo = `text-ceci-brand-strong`; label animado (width/opacity) | 140 |
| `HeaderNav` | `src/components/HeaderNav.tsx` | Sticky `bg-canvas/95 border-b border-ceci-border-subtle` (sem `backdrop-blur`); 2 modos (`brand` / `detail`) via `AnimatePresence`; `scrolled` muda padding/shadow | 241 |
| `index.css` | `src/index.css` | Tailwind 4 (`@import "tailwindcss"`); `@theme` com tokens semânticos; `@layer base` com helpers (`.journal-card`, `.hover-lift` etc.); **sem `backdrop-blur` recycled, sem `glass`, sem `tw-animate-css`** | 303 |
| `package.json` | `package.json` | `tailwindcss@^4.1.14`, `framer-motion@^13`, sem `tw-animate-css` | — |
| `App.tsx` | `src/App.tsx` | Wrapper fino: `<MotionConfig><ErrorBoundary><AppProvider><AppShell/></AppProvider></ErrorBoundary></MotionConfig>` | ~532 |

**Pontos a preservar:**
- `BottomNavBar` props `activeIndex` (controlado) + `onChange` — fluxo atual.
- `layoutId="bottomnav-active-pill"` — animação spring do pill.
- `framer-motion` `whileTap`/spring — microinterações.
- Safe areas (`env(safe-area-inset-*)`) no header e bottom nav.
- Brand voice: "cecistudy ♡", badge de semestre, ícones lucide-react.

**Pontos a limpar (dead code identificado):**
- `BottomNavBar` exporta `defaultNavItems` (6 itens genéricos Home/Portfolio/...) e
  `defaultIndex`/`stickyBottom` props — **nunca usados** pelo `BottomNav` do projeto.
  Remover (`BottomNav` sempre passa `items` + `activeIndex` controlado).

---

## 2. Estratégia técnica

### 2.1 Camada do filtro SVG (compartilhada)
- Um `<svg>` oculto injetado no `App.tsx` com **dois** `<filter>`:
  - `id="liquid-glass-nav"` — para o container (HeaderNav + BottomNav).
  - `id="liquid-glass-pill"` — para o pill ativo do BottomNav (mais intenso, `stdDeviation` menor).
- Cada filtro usa `feImage` (href = base64 do mapa de distorção — **copiar exatamente**
  o base64 do `ThemeSwitcher` de referência) + `feGaussianBlur` + `feDisplacementMap`
  (`scale="0.5"`, `xChannelSelector="R"`, `yChannelSelector="G"`).
- O `<svg>` fica `aria-hidden`, sem layout (`className="absolute w-0 h-0 overflow-hidden pointer-events-none"`).
- O filtro é referenciado via CSS: `filter: url(#liquid-glass-nav)`.

### 2.2 Token/util classes no `index.css`
Adicionar ao `@layer base`:
- `.liquid-glass-nav` — aplicado no container (header/bottom nav):
  - `background: color-mix(in srgb, var(--color-canvas) 75%, transparent)`
  - `backdrop-filter: blur(24px) saturate(140%)`
  - `border: 1px solid color-mix(in srgb, white 60%, transparent)`
  - `filter: url(#liquid-glass-nav)`
  - `transition: filter 0.6s ease, background-color 0.3s ease`
- `.liquid-glass-pill` — aplicado no pill ativo (BottomNav):
  - `background: linear-gradient(to bottom, color-mix(in srgb, white 90%, transparent), color-mix(in srgb, white 50%, transparent))`
  - `border: 1px solid color-mix(in srgb, white 70%, transparent)`
  - `filter: url(#liquid-glass-pill)`
  - `box-shadow: var(--shadow-xs), inset 0 1px 0 rgba(255,255,255,0.5)`

> `color-mix` é suportado no Safari 16.4+ e Chromium 111+ — cobre iOS/Android alvo do Capacitor.

### 2.3 Keyframes (`@import "tw-animate-css"` + custom)
- Importar `tw-animate-css` no topo do `index.css` depois de `@import "tailwindcss"`.
- Adicionar (caso `tw-animate-css` não cubra) os keyframes `scaleToggle`,
  `scaleToggle2`, `scaleToggle3` (fornecidos na referência) — usados como **opção**
  na animação do pill durante o morph, se necessário.

### 2.4 BottomNav — adaptação
**`src/components/ui/bottom-nav-bar.tsx`:**
1. **Limpar:** remover `defaultNavItems`, `defaultIndex`, `stickyBottom` (props e `useState`).
2. **Container `<motion.nav>`:** trocar `bg-white/95 dark:bg-card border border-ceci-border-default dark:border-sidebar-border ... shadow-floating` por `liquid-glass-nav` + `rounded-full shadow-floating`. Manter `h-[52px] min-w-[300px] max-w-[95vw]`.
3. **Pill ativo (`motion.span layoutId`):** trocar `bg-surface-rose border border-ceci-border-brand` por `liquid-glass-pill`. Manter `layoutId`, `transition` spring e `rounded-full`.
4. **Ícone ativo:** manter `text-ceci-brand-strong` (contraste forte sobre o vidro).
5. **Label ativo:** manter `text-ceci-brand-strong`; ajustar opacidade se necessário.
6. **Não ativo:** `text-ceci-tertiary` continua; `hover:bg-surface-muted` → `hover:bg-white/40`.

**`src/components/BottomNav.tsx`:**
1. Garantir que o container externo `fixed ... z-40 ... pointer-events-none` mantém `pointer-events-auto` no filho (já faz).
2. Sem mudança estrutural — o `FloatingActionMenu` permanece como está (não recebe glass nesta fase).
3. Validar que o `BottomNavBar` com `liquid-glass-nav` enxerga conteúdo atrás (a página precisa ter algo visível atrás do nav; hoje já tem — o `<main>` rola por baixo).

### 2.5 HeaderNav — adaptação
**`src/components/HeaderNav.tsx`:**
1. **`<header>` (ambos modos):** trocar `bg-canvas/95 border-b border-ceci-border-subtle` por `liquid-glass-nav` + `border-b border-white/50`. Manter as transições de `padding`/`shadow` no `scrolled`.
2. **`scrolled` state:** ajustar o `shadow-xs` → `shadow-sm` quando scrolled (sutil reforço do glass).
3. **Modo brand:**
   - Logo "C": manter `bg-surface-rose` (sólido) — é o **elemento de marca**, não recebe glass (precisa de contraste forte).
   - Badge de semestre `bg-surface-blue`: manter sólido.
   - Search trigger (desktop): trocar `bg-white/90` → `bg-white/60 backdrop-blur-sm border-white/70` (alinhado ao glass).
   - Botão mobile de busca: manter `bg-white` sólido (botão interativo precisa ser claro).
4. **Modo detail:**
   - Back button: manter `bg-white` sólido.
   - Icon badge (course icon): manter `style={{ backgroundColor: ... }}` atual.
   - Code badge: manter `bg-white` sólido.
   - BookmarkToggle/HeaderActionMenu/Search: componentes próprios — não alterar nesta fase.

> **Princípio:** o vidro glass vai no **container**; botões e badges interativos permanecem **sólidos** para garantir affordance e contraste.

### 2.6 Injeção do SVG no `App.tsx`
- Criar `src/components/ui/LiquidGlassFilters.tsx` exportando um `<svg aria-hidden className="absolute w-0 h-0 overflow-hidden pointer-events-none">` com os 2 filtros inline.
- Importar e renderizar dentro de `<AppProvider>` (ou dentro do `<ErrorBoundary>`) no `App.tsx`, antes de `<AppShell />`.
- Os IDs são globais — devem ser únicos no documento (OK: só uma instância do app).

---

## 3. Dependências

| Pacote | Versão | Motivo |
|---|---|---|
| `tw-animate-css` | `^1.x` (última) | Utilitários de animação Tailwind 4 (referência pede `@import "tw-animate-css"`). |

**Instalação:**
```bash
npm install tw-animate-css
```

> Nenhuma outra dep externa é necessária — o efeito usa SVG nativo + CSS + framer-motion (já instalado).

---

## 4. Passos de implementação (checklist)

### Fase LG-1 — Fundações (deps + styles base)
- [ ] **LG-1.1** Instalar `tw-animate-css` (`npm install tw-animate-css`); confirmar entrada em `package.json`.
- [ ] **LG-1.2** `src/index.css`: adicionar `@import "tw-animate-css";` logo após `@import "tailwindcss";`.
- [ ] **LG-1.3** `src/index.css`: adicionar `@keyframes scaleToggle`, `scaleToggle2`, `scaleToggle3` (fornecidos na referência) — caso `tw-animate-css` não os forneça.
- [ ] **LG-1.4** `src/index.css` (`@layer base`): adicionar `.liquid-glass-nav` e `.liquid-glass-pill` (ver seção 2.2).
- [ ] **LG-1.5** Criar `src/components/ui/LiquidGlassFilters.tsx` com o SVG oculto contendo os filtros `#liquid-glass-nav` e `#liquid-glass-pill` (base64 das `feImage` copiados do `ThemeSwitcher` de referência).
- [ ] **LG-1.6** `src/App.tsx`: importar e renderizar `<LiquidGlassFilters />` dentro de `<AppProvider>` (antes de `<AppShell />`).

### Fase LG-2 — BottomNav (núcleo do glass)
- [ ] **LG-2.1** `src/components/ui/bottom-nav-bar.tsx`: remover dead code (`defaultNavItems`, `defaultIndex`, `stickyBottom`, `useState` interno não usado).
- [ ] **LG-2.2** `src/components/ui/bottom-nav-bar.tsx`: trocar classes do `<motion.nav>` por `liquid-glass-nav` + `rounded-full shadow-floating` (manter `min-w-[300px] max-w-[95vw] h-[52px]`).
- [ ] **LG-2.3** `src/components/ui/bottom-nav-bar.tsx`: trocar o pill ativo (`bg-surface-rose border-ceci-border-brand`) por `liquid-glass-pill` (manter `layoutId`, spring, `rounded-full`).
- [ ] **LG-2.4** `src/components/ui/bottom-nav-bar.tsx`: ajustar hover do item inativo (`hover:bg-surface-muted` → `hover:bg-white/40`).
- [ ] **LG-2.5** `src/components/BottomNav.tsx`: validar posicionamento `fixed ... z-40` + `pointer-events-auto`; o `FloatingActionMenu` permanece inalterado.

### Fase LG-3 — HeaderNav (glass no header)
- [ ] **LG-3.1** `src/components/HeaderNav.tsx`: trocar `bg-canvas/95 border-b border-ceci-border-subtle` → `liquid-glass-nav` + `border-b border-white/50` no `<header>` (ambos fluxos).
- [ ] **LG-3.2** `src/components/HeaderNav.tsx`: ajustar `shadow-xs` → `shadow-sm` quando `scrolled` (reforço sutil).
- [ ] **LG-3.3** `src/components/HeaderNav.tsx` (brand mode): search trigger desktop `bg-white/90` → `bg-white/60 backdrop-blur-sm border-white/70`.
- [ ] **LG-3.4** `src/components/HeaderNav.tsx`: validar contraste dos elementos sólidos (logo "C", badge semestre, botões) sobre o glass.

### Fase LG-4 — Verificação e polimento
- [ ] **LG-4.1** `npm run lint` (typecheck) verde.
- [ ] **LG-4.2** `npm run test` verde.
- [ ] **LG-4.3** `npm run build` verde; confirmar que o bundle não regrediu (tamanho similar).
- [ ] **LG-4.4** Inspeção visual em `npm run dev`:
  - BottomNav: pill branco translúcido com morph sutil ao trocar de aba; ícones legíveis; spring preservado.
  - HeaderNav (brand): vidro translúcido mostra conteúdo rolando; logo e badge sólidos.
  - HeaderNav (detail): vidro translúcido; botão voltar/ícone/badge sólidos legíveis.
  - Safe areas (notch) preservadas no mobile.
- [ ] **LG-4.5** Teste de regressão: navegação por pilha (push/pop), busca global (⌘K), FAB, favoritos — todos funcionando.

---

## 5. Arquivos afetados

| Arquivo | Tipo |
|---|---|
| `package.json` | alterar (deps) |
| `src/index.css` | alterar (import + keyframes + classes) |
| `src/components/ui/LiquidGlassFilters.tsx` | **novo** |
| `src/App.tsx` | alterar (renderizar o SVG) |
| `src/components/ui/bottom-nav-bar.tsx` | alterar (classes + limpeza dead code) |
| `src/components/BottomNav.tsx` | validar (provável sem mudança) |
| `src/components/HeaderNav.tsx` | alterar (classes do `<header>` + search trigger) |

---

## 6. Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `filter: url(#...)` afeta hitbox/hover de elementos filhos | média | Filtro é no **container**, não nos botões; botões têm `bg` sólido e `z-10`. Testar em dev. |
| `color-mix` não suportado em webviews muito antigos | baixa | Capacitor 8 → Android WebView System (Chromium 111+) e iOS WKWebView (Safari 16.4+) suportam. |
| Performance de `backdrop-filter` + `filter` em mobile | média | Só 2 elementos (header + bottom nav) pequenos. Se houver travamento, reduzir `stdDeviation` ou remover o `feDisplacementMap` do header. |
| Contraste do pill translúcido sobre fundos coloridos | média | Gradiente tem ~90% branco no topo; ícone ativo usa `text-ceci-brand-strong` (marrom-rosa forte). Validar visual. |
| Dead code removido quebra algum import externo | baixa | `defaultNavItems`/`defaultIndex`/`stickyBottom` não usados em `src/` nem em testes (verificar via grep antes de remover). |
| O `feImage` base64 é ~30KB (2x) — aumenta o bundle | baixa | Inline no SVG único, carregado uma vez. Aceitável. |

---

## 7. rollback

Se houver regressão visual/performance:
1. Reverter as classes `.liquid-glass-nav`/`.liquid-glass-pill` para os valores anteriores (`bg-white/95`, `bg-surface-rose`).
2. Remover o `style={{ filter }}` / import do `<LiquidGlassFilters />`.
3. O `tw-animate-css` instalado pode permanecer (inerte se não usado) ou ser removido com `npm uninstall tw-animate-css`.

O plano é **não-destrutivo**: nenhuma feature removida, só estilos ajustados. Rollback é trivial via git.

---

## 8. Notas p/ agentes futuros

- O `<LiquidGlassFilters />` é o **único** lugar que define os IDs `liquid-glass-nav` / `liquid-glass-pill`. Não duplicar.
- O base64 dentro de `feImage href="data:image/webp;base64,..."` deve ser **copiado exatamente** do `ThemeSwitcher` de referência — é o mapa de distorção que cria o morph "Apple". Trocar por outro base64 muda o efeito.
- Se quiser intensidade diferente do morph, mexer no `scale` do `feDisplacementMap` (0.5 = sutil; 1.0 = visível; 2.0 = agressivo).
- Esta fase **não** toca no `FloatingActionMenu` — ele continua como FAB sólido. Glass no FAB fica para fase futura se solicitado.
- Atualizar `AGENTS.md` e `.context/architecture.md` (seção "Padrões de UI") com a nova classe `.liquid-glass-nav` depois de implementado.
