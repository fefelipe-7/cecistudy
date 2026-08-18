# Design System

> Tokens, classes helper e padrões de UI do cecistudy. (pt-BR)
> Fonte da verdade: `src/index.css` (bloco `@theme` + `@layer base`).

## 1. Princípios

- **Mobile-first** e **carinhoso**: cantos grandes (`rounded-[20-24px]`), sombras suaves,
  tons pastéis, microinterações (hover/active com `active:scale-95`).
- **Toque:** alvos mínimos de 44px (classe helper `.touch-target`).
- ⚠️ **Regra anti-hex-raw:** o design system **já define tokens semânticos**, mas muitos
  componentes ainda usam hex arbitrário (`text-[#40383A]`, `bg-[#FFF5F7]`…). Prefira sempre
  os tokens quando criar/editar UI (ver backlog).

## 2. Paletas de cor (tokens `@theme`)

Escalas com 9 passos (50–900) em cada cor. Tonalidade principal listada:

| Cor | Papel | Exemplos de tom |
|---|---|---|
| **rose** | identidade, ação, afeto pessoal | `rose-50 #FFF5F7` · `rose-500 #E97891` · `rose-700 #B94862` |
| **blue** | conhecimento, contexto acadêmico | `blue-50 #F3F9FC` · `blue-500 #609FB8` · `blue-700 #396D82` |
| **cream** | canvas / atmosfera principal | `cream-50 #FFFCF8` · `cream-200 #FFF1E5` |
| **beige** | suporte, editorial, contexto | `beige-100 #F3EEE8` · `beige-500 #AD9986` |
| **green** | conclusão, sucesso | `green-400 #8BC7A2` · `green-700 #43805B` |
| **yellow** | atenção, aviso | `yellow-200 #FCE4A8` · `yellow-600 #BD913C` |
| **red** | erro, problema | `red-400 #E89189` · `red-700 #A8514B` |

### Aliases semânticos (preferir estes)
```css
--color-canvas: #FFFCF8;
--color-surface-default: #FFFFFF;
--color-surface-subtle: #FFF8F1;
--color-surface-muted: #FAF8F5;
--color-surface-rose: #FFF5F7;
--color-surface-blue: #F3F9FC;

--color-ceci-primary: #40383A;       /* quase-preto marrom — texto/título */
--color-ceci-secondary: #6D6366;     /* texto secundário */
--color-ceci-tertiary: #918689;
--color-ceci-muted: #ADA3A5;
--color-ceci-brand: #D85F79;         /* rosa marca */
--color-ceci-brand-strong: #B94862;  /* rosa forte (ações/acentos) */
--color-ceci-academic: #4A879F;      /* azul acadêmico */
--color-ceci-academic-strong: #396D82;

--color-ceci-border-subtle: #F2EBE8;
--color-ceci-border-default: #E9DFDC;
--color-ceci-border-strong: #DCCFCA;
--color-ceci-border-brand: #FFD3DD;
--color-ceci-border-academic: #CEE7F0;
```

### Convenções de uso observadas
- Fundo da tela: `#FFFCF8` (canvas / cream-50).
- Texto principal: `#40383A` (ceci-primary). Secundário: `#6D6366`.
- Botões primários: rosa (`#E97891`/`#B94862`) **ou** marrom escuro (`#40383A`/`#2D2728`).
- Badges/pills de destaque: fundo `surface-rose` + borda `border-brand` + texto `brand-strong`.

## 3. Tipografia (fontes Google Fonts)

| Token | Fonte | Uso |
|---|---|---|
| `--font-sans` | Inter | corpo/UI padrão |
| `--font-display` | Plus Jakarta Sans | títulos, `.font-display` |
| `--font-serif` | DM Serif Display | serifa acadêmica (`.font-serif-academic`) |
| `--font-mono` | JetBrains Mono | códigos/referências (ex.: ABNT) |

- Títulos com `letter-spacing: -0.015em` e `font-display font-bold`.
- Grande parte dos textos é **minúscula** por convenção de voz (ver `copy-and-voice.md`).

## 4. Raio de borda (`--radius-*`)

`xs 6px` · `sm 8px` · `md 12px` · `lg 16px` · `xl 20px` · `2xl 24px` · `3xl 32px`.
Uso comum: cards `rounded-[20-24px]`, botões/pills `rounded-full`, inputs `rounded-xl`.

## 5. Sombras (`--shadow-*`)

`xs` (1px) → `xl` (20px) + `floating`. Baseadas em `rgba(64,56,58, …)`.
Cards usam tipicamente `shadow-[0_2px_8px_rgba(64,56,58,0.05)]`; nav flutuante usa
`shadow-[0_8px_28px_rgba(64,56,58,0.12)]`.

## 6. Classes helper (em `index.css`)

| Classe | Função |
|---|---|
| `.journal-card` | card padrão acolhedor (branco, radius 20px, borda sutil, hover) |
| `.paper-texture` | fundo com textura pontilhada rosa sobre canvas |
| `.cute-badge` | badge arredondado com hover sutil |
| `.touch-target` | garante área mínima de toque 44×44px |
| `.font-serif-academic` | serifa acadêmica (DM Serif) |
| `.scrollbar-none` | esconde scrollbar (usado em faixas horizontais) |

## 7. Padrões de UI recorrentes

### Pills de sub-tab (navegação horizontal)
```tsx
<button className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
  isSel ? 'bg-[#40383A] text-white shadow-xs'
        : 'bg-white text-[#6D6366] border border-[#E9DFDC] hover:bg-[#FAF8F5]'
}`}>
```

### Overlay de modal (padrão repetido no código)
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
```

### Capa de livro (biblioteca)
- Contêiner `rounded-2xl` com `backgroundColor: coverColor`.
- Lombada (spine): `absolute left-0 w-2.5 bg-black/10 border-r`.
- Badge no topo, título centralizado, autor na base; barra de progresso quando "lendo".

### Bookmark / favorito
Botão `w-9 h-9 rounded-2xl border`; ativo = `bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862]`
com ícone `Bookmark` preenchido (`fill-[#B94862]`).

## 8. Animações (framer-motion / motion)

- **Transição de tela centralizada** em `screenVariants`/`VIEW_PULINHO` (`src/lib/motion.ts`),
  aplicada a **todas** as telas via `App.tsx` (`AnimatePresence mode="popLayout"`): entrada com
  fade + sobe 10px (easeOut, 0.3s), slide horizontal preservado nos push/pop. Views **não**
  declaram animação de entrada própria (wrapper `<div>` simples).
- Animações de item/card ficam **por-view** (ex.: tarefas na Home, hero da streak, drag de flashcard).
- Hover de cards: `.card-lift`/`.hover-lift` (gated por `@media (hover:hover) and (pointer: fine)`).
- Nav inferior e FAB: `motion` com spring.
- Modais/sheets: primitiva `ui/Modal` (`AnimatePresence` + variants por posição + drag-to-dismiss).

## 9. Checklist ao criar/editar UI

- [ ] Usar tokens semânticos (`ceci-*`, `surface-*`, `border-*`) sempre que possível.
- [ ] Manter `rounded` e `shadow` dentro da escala do design system.
- [ ] Garantir área de toque mínima de 44px em elementos interativos.
- [ ] Textos em pt-BR minúsculos, tom acolhedor (ver `copy-and-voice.md`).
- [ ] Seguir os padrões de pill/card/modal existentes em vez de criar novos.
