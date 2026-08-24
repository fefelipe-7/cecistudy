# Sistema de Temas — cecistudy

> Especificação completa dos 10 temas suportados. Fonte da verdade para implementação.

---

## 1. Filosofia

O cecistudy conversa com a Ceci como um **cantinho acolhedor**. Os temas respeitam essa personalidade em variadas atmosferas — do warmth rosa-pastel ao drama do por-do-sol, da calma oceânica ao brilho do neon.

**Regras fixas (não mudam por tema):**
- Tipografia: `font-sans` (Inter), `font-display` (Plus Jakarta Sans), `font-serif` (DM Serif Display), `font-mono` (JetBrains Mono)
- Escala de radius: `xs 6px · sm 8px · md 12px · lg 16px · xl 20px · 2xl 24px · 3xl 32px`
- Dados de entidade (cores de curso, capas de livro, cores de família/abordagem) continuam como **dado inline** via `style={{}}` — não pertencem ao tema
- Classes utilitárias (`.journal-card`, `.paper-texture`, `.cute-badge`, `.press-btn`, `.hover-lift`, `.card-lift`) derivam de tokens semânticos; não precisam de adaptação por tema

**O que MUDA por tema:**
| Grupo | Tokens |
|---|---|
| Fundo | `canvas`, `surface-default`, `surface-subtle`, `surface-muted`, `surface-rose`, `surface-blue`, `surface-input` |
| Texto | `ceci-primary`, `ceci-secondary`, `ceci-tertiary`, `ceci-muted`, `ceci-faded`, `ceci-ink` |
| Marca | `ceci-brand`, `ceci-brand-strong`, `ceci-brand-soft`, `ceci-brand-hover`, `ceci-text-soft`, `ceci-primary-hover` |
| Acadêmico | `ceci-academic`, `ceci-academic-strong` |
| Bordas | `ceci-border-subtle`, `ceci-border-default`, `ceci-border-strong`, `ceci-border-brand`, `ceci-border-academic` |
| Sombras | temperatura das `shadow-xs` à `shadow-brand-strong` (todas rgba com `(64,56,58,...)` ou variante do brand) |

---

## 2. Mecanismo de Troca

**Runtime:** `document.documentElement.style.setProperty('--color-X', value)` no `:root` do CSS. Classes Tailwind (`bg-surface-rose`, `text-ceci-primary`, `border-ceci-border-brand`) resolvem a cor corrente automaticamente.

**Persistência:** `localStorage` chave `cecistudy_selectedTheme` (ou via `usePersistentState` em `AppContext.tsx`). Aplicado no boot antes de hidratar o app para evitar flash.

**Escopo de aplicação:**
- `ApplyTheme(themeId)` → lê o objeto `THEMES[themeId]`, calcula derivados (alpha, hover states), chama `setProperty` para cada token do grupo mutável
- Derivados automáticos (calculados no apply, não armazenados):
  - `surface-rose` = `brand` com alpha 8% (ex: `#D85F7914`)
  - `ceci-border-brand` = `brand` com alpha 20%
  - `ceci-brand-soft` = `brand` com alpha 25%
  - `ceci-brand-hover` = `brand-strong`
  - `surface-muted` = `surface-subtle` com saturação reduzida

**Mapeamento ChartTheme (dither-charts):**
- Tema claro (`rosa-claro`, `amanhecer`, `oceano`, `jardim`, `biblioteca`, `por-do-sol`, `nebulosa`, `cerâmica`) → `ChartTheme = 'light'`
- Tema escuro (`noturno`, `neon`) → `ChartTheme = 'dark'`
- Componentes canvas leem `getComputedStyle(document.documentElement).getPropertyValue('--color-ceci-primary')` para decidir contraste

---

## 3. Especificação dos 10 Temas

### 3.1 rosa-claro (default / identidade)

> O que existe hoje. Warmth cozy, cantinho afetuoso.

```
canvas:     #FFFCF8
surface-default: #FFFFFF
surface-subtle:  #FFF8F1
surface-muted:   #FAF8F5

primary:    #40383A
secondary:  #6D6366
tertiary:   #918689
muted:      #ADA3A5
faded:      #BEB4B6
ink:        #282022

brand:      #D85F79
brand-strong: #B94862
brand-soft:   #EA718F
brand-hover:  #A03B52

academic:   #4A879F
academic-strong: #396D82

border-subtle:  #F2EBE8
border-default: #E9DFDC
border-strong:  #DCCFCA
border-brand:   #FFD3DD       (brand @ 20%)
border-academic:#CEE7F0

shadow-xs→xl → rgba(64,56,58, 0.04→0.12)
shadow-brand    → rgba(185,72,98, 0.4)
shadow-brand-soft → rgba(185,72,98, 0.3)
```

---

### 3.2 noturno

> Dark legível, sem contraste agressivo. Brand rosa suave para não cansar à noite.

```
canvas:     #161214           (quase-preto marfim)
surface-default: #221E20
surface-subtle:  #2A2628
surface-muted:   #1E1B1C

primary:    #E8DFDB           (cream claro invertido)
secondary:  #B5ADAB
tertiary:   #8A8385
muted:      #6D6668
faded:      #4E484A
ink:        #F5F0EC

brand:      #E8919C           (rose suave pastel — não branqueia)
brand-strong: #D4728A
brand-soft:   #F2B8C4
brand-hover:  #C25E76

academic:   #8FC5D4
academic-strong: #6BAABB

border-subtle:  #2E2A2C
border-default: #3A3538
border-strong:  #4A4548
border-brand:   rgba(232,145,156, 0.25)
border-academic:rgba(143,197,212, 0.25)

shadow-xs→xl → rgba(0,0,0, 0.15→0.45)
shadow-brand    → rgba(232,145,156, 0.35)
shadow-brand-soft → rgba(232,145,156, 0.25)
```

**Contraste WCAG mínimo:** primary (#E8DFDB) sobre canvas (#161214) = 11.8:1 ✅

---

### 3.3 amanhecer

> Quente, energia nova, otimismo suave. Coral/terracota como brand.

```
canvas:     #FFFAF5
surface-default: #FFFFFF
surface-subtle:  #FFF7EE
surface-muted:   #FAF5ED

primary:    #3D2E28           (castanho-quente escuro)
secondary:  #6B5A52
tertiary:   #917F77
muted:      #ADA094
faded:      #C4B7B0
ink:        #271C18

brand:      #E8785A           (coral queimado)
brand-strong: #D0603F
brand-soft:   #F2A48D
brand-hover:  #B55035

academic:   #5A8FA8
academic-strong: #407090

border-subtle:  #F2E8DF
border-default: #E9D8C8
border-strong:  #DCC8B5
border-brand:   rgba(232,120,90, 0.22)
border-academic:rgba(90,143,168, 0.25)

shadow-xs→xl → rgba(60,46,40, 0.04→0.12)
shadow-brand    → rgba(208,96,63, 0.35)
shadow-brand-soft → rgba(208,96,63, 0.25)
```

---

### 3.4 oceano

> Calma, profundidade, erudição fluida. Azul-petróleo como brand.

```
canvas:     #F7FAFB
surface-default: #FFFFFF
surface-subtle:  #F2F7F9
surface-muted:   #F0F4F6

primary:    #243440           (azul-petróleo quase-preto)
secondary:  #556A78
tertiary:   #7A8E9B
muted:      #9BA6AD
faded:      #BCC4C9
ink:        #18242C

brand:      #3C8EA0           (teal-petróleo)
brand-strong: #2A7587
brand-soft:   #7DB8C8
brand-hover:  #236372

academic:   #4A879F           (mantido como tom complementar)
academic-strong: #396D82

border-subtle:  #E4ECF0
border-default: #D5E2E8
border-strong:  #C2D4DC
border-brand:   rgba(60,142,160, 0.22)
border-academic:rgba(74,135,159, 0.22)

shadow-xs→xl → rgba(36,52,64, 0.04→0.12)
shadow-brand    → rgba(42,117,135, 0.30)
shadow-brand-soft → rgba(42,117,135, 0.22)
```

---

### 3.5 jardim

> Natureza, crescimento, frescor. Verde-musgo como brand.

```
canvas:     #F8FAF7
surface-default: #FFFFFF
surface-subtle:  #F4F8F3
surface-muted:   #F2F5F1

primary:    #2A3228           (verde-escuro quente)
secondary:  #566054
tertiary:   #7A8377
muted:      #9AA39A
faded:      #B7BDB6
ink:        #1C241A

brand:      #5A8A60           (verde musgo)
brand-strong: #45724A
brand-soft:   #8DB893
brand-hover:  #38603D

academic:   #4A8890           (teal-acadêmico mantido)
academic-strong: #386E75

border-subtle:  #E6ECE5
border-default: #D6E0D5
border-strong:  #C0CFBF
border-brand:   rgba(90,138,96, 0.22)
border-academic:rgba(74,136,144, 0.22)

shadow-xs→xl → rgba(42,50,40, 0.04→0.12)
shadow-brand    → rgba(69,114,74, 0.30)
shadow-brand-soft → rgba(69,114,74, 0.22)
```

---

### 3.6 biblioteca

> Vintage, erudição, papel envelhecido. Vinho + dourado.

```
canvas:     #FAF7F2
surface-default: #FEFCF7
surface-subtle:  #F7F1E6
surface-muted:   #F3EDE3

primary:    #3A2E28           (castanho-papel escuro)
secondary:  #62564F
tertiary:   #867A72
muted:      #A39891
faded:      #BEB5AF
ink:        #2C2018

brand:      #8B4049           (vinho bordô)
brand-strong: #6E323A
brand-soft:   #B87580
brand-hover:  #5C2A32

academic:   #6B8FA0
academic-strong: #527384

border-subtle:  #EDE4D8
border-default: #E0D4C4
border-strong:  #CFC0AD
border-brand:   rgba(139,64,73, 0.22)
border-academic:rgba(107,143,160, 0.22)

shadow-xs→xl → rgba(58,46,40, 0.05→0.13)
shadow-brand    → rgba(110,50,58, 0.30)
shadow-brand-soft → rgba(110,50,58, 0.22)
```

---

### 3.7 por-do-sol

> Dramático, cozy, calor do entardecer. Roxo-poente + coral.

```
canvas:     #FDF8F5
surface-default: #FFFCF9
surface-subtle:  #FAF2ED
surface-muted:   #F6ECE5

primary:    #3A2632           (roxo-queimado escuro)
secondary:  #625058
tertiary:   #867580
muted:      #A39795
faded:      #BEB5B4
ink:        #2C1A24

brand:      #C85A50           (coral-entardecer)
brand-strong: #B0453C
brand-soft:   #E08D84
brand-hover:  #983830

academic:   #5A7A90
academic-strong: #486378

border-subtle:  #EDE4E0
border-default: #E0D4CE
border-strong:  #CFC0B8
border-brand:   rgba(200,90,80, 0.22)
border-academic:rgba(90,122,144, 0.22)

shadow-xs→xl → rgba(58,38,50, 0.04→0.12)
shadow-brand    → rgba(176,69,60, 0.30)
shadow-brand-soft → rgba(176,69,60, 0.22)
```

---

### 3.8 nebulosa

> Cósmica, introspectiva, serena. Índigo + lavanda.

```
canvas:     #F8F7FB
surface-default: #FCFBFE
surface-subtle:  #F3F1F8
surface-muted:   #EFECF5

primary:    #28243A           (índigo-escuro profundo)
secondary:  #565270
tertiary:   #7A7890
muted:      #9D9BAD
faded:      #BDBBD0
ink:        #1E1A2E

brand:      #7B6AAA           (lavanda-víola)
brand-strong: #625590
brand-soft:   #A99DD0
brand-hover:  #524880

academic:   #5080A0
academic-strong: #3E6888

border-subtle:  #E8E5F0
border-default: #D9D5E6
border-strong:  #C7C2D8
border-brand:   rgba(123,106,170, 0.22)
border-academic:rgba(80,128,160, 0.22)

shadow-xs→xl → rgba(40,36,58, 0.04→0.12)
shadow-brand    → rgba(98,85,144, 0.30)
shadow-brand-soft → rgba(98,85,144, 0.22)
```

---

### 3.9 cerâmica

> Artesanal, orgânico, texturizado. Terracota + argila + esmalte creme.

```
canvas:     #FBF8F5
surface-default: #FEFBF7
surface-subtle:  #F7F2EB
surface-muted:   #F3ECE3

primary:    #3A3228           (argila-escura)
secondary:  #62584F
tertiary:   #867C72
muted:      #A39B93
faded:      #BFB7AF
ink:        #2C241A

brand:      #C2724A           (terracota queimada)
brand-strong: #A85D38
brand-soft:   #DDA07A
brand-hover:  #904D2E

academic:   #5A8A90
academic-strong: #487078

border-subtle:  #EDE5DA
border-default: #E0D4C4
border-strong:  #CFC0AE
border-brand:   rgba(194,114,74, 0.22)
border-academic:rgba(90,138,144, 0.22)

shadow-xs→xl → rgba(58,50,40, 0.05→0.13)
shadow-brand    → rgba(168,93,56, 0.30)
shadow-brand-soft → rgba(168,93,56, 0.22)
```

---

### 3.10 neon

> Noturno porém vibrante, sintético, energia urbana. Preto grafite + magenta + ciano-elétrico.

```
canvas:     #0F0F12           (grafite profundo)
surface-default: #1A1A20
surface-subtle:  #22222B
surface-muted:   #16161C

primary:    #E6E0F0           (lavante quase-branco)
secondary:  #B0A8C0
tertiary:   #86809A
muted:      #68627A
faded:      #504A5C
ink:        #F4F0FF

brand:      #E93B8C           (magenta neon)
brand-strong: #D42A7C
brand-soft:   #F27AAA
brand-hover:  #B8206A

academic:   #00D4AA           (ciano neon elétrico)
academic-strong: #00B894

border-subtle:  #26252E
border-default: #33313C
border-strong:  #44424E
border-brand:   rgba(233,59,140, 0.30)
border-academic:rgba(0,212,170, 0.25)

shadow-xs→xl → rgba(0,0,0, 0.20→0.55) + glow sutil
shadow-brand    → rgba(233,59,140, 0.45)
shadow-brand-soft → rgba(233,59,140, 0.30)
```

**Contraste WCAG mínimo:** primary (#E6E0F0) sobre canvas (#0F0F12) = 12.5:1 ✅

---

## 4. Estrutura de Implementação

### 4.1 Arquivos a criar/modificar

```
src/
  lib/
    themes.ts              ← objeto THEMES com todos os 10 temas + função applyTheme()
    themes.test.ts         ← testes de applyTheme/removeTheme/derivados
  types.ts                 ← adicionar: themeId?: string em UserProfile
  context/
    AppContext.tsx          ← estado: selectedTheme, applyTheme(), restaurar no mount
  components/
    views/
      PerfilView.tsx        ← seção "aparência" com grid de 10 previews + nome

docs/
  themes.md                ← este arquivo (especificação)

.context/
  themes.md                ← espelho para agents leres
```

### 4.2 Tipos (src/lib/themes.ts)

```ts
export interface ThemeTokens {
  canvas: string
  'surface-default': string
  'surface-subtle': string
  'surface-muted': string
  primary: string
  secondary: string
  tertiary: string
  muted: string
  faded: string
  ink: string
  brand: string
  'brand-strong': string
  'brand-soft': string
  'brand-hover': string
  academic: string
  'academic-strong': string
  'border-subtle': string
  'border-default': string
  'border-strong': string
  'border-brand': string
  'border-academic': string
}

export interface Theme {
  id: ThemeId
  label: string
  emoji: string
  description: string
  isDark: boolean
  tokens: ThemeTokens
  /** Atalho para derivados automáticos (alpha mixes) — opcional */
  overrides?: Record<string, string>
}

export type ThemeId =
  | 'rosa-claro'
  | 'noturno'
  | 'amanhecer'
  | 'oceano'
  | 'jardim'
  | 'biblioteca'
  | 'por-do-sol'
  | 'nebulosa'
  | 'ceramica'
  | 'neon'
```

### 4.3 Função applyTheme

```ts
const TOKEN_KEYS: (keyof ThemeTokens)[] = [
  'canvas', 'surface-default', 'surface-subtle', 'surface-muted',
  'primary', 'secondary', 'tertiary', 'muted', 'faded', 'ink',
  'brand', 'brand-strong', 'brand-soft', 'brand-hover',
  'academic', 'academic-strong',
  'border-subtle', 'border-default', 'border-strong',
  'border-brand', 'border-academic',
]

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  TOKEN_KEYS.forEach((key) => {
    const value = theme.tokens[key]
    if (value) {
      root.style.setProperty(`--color-${key}`, value)
    }
  })
  // Ajustar temperatura das sombras (dark: preto puro, claro: marrom default)
  const shadowBase = theme.isDark ? '0,0,0' : '64,56,58'
  root.style.setProperty('--shadow-rgb', shadowBase)
}

export function removeTheme(): void {
  const root = document.documentElement
  TOKEN_KEYS.forEach((key) => {
    root.style.removeProperty(`--color-${key}`)
  })
  root.style.removeProperty('--shadow-rgb')
}
```

**Nota:** `shadow-xs→xl` e `shadow-brand*` devem ser reescritos para usar `var(--shadow-rgb)` no `index.css`:

```css
/* antes */
--shadow-xs: 0 1px 2px rgba(64, 56, 58, 0.04);
/* depois */
--shadow-xs: 0 1px 2px rgba(var(--shadow-rgb), 0.04);
```

Como há 9 sombras, **migrar para usar `var(--shadow-rgb)`** é pré-requisito do sistema de temas funcionar em dark/neon.

### 4.4 Estado no AppContext

```ts
// em AppContext.tsx — usar usePersistentState
const [selectedTheme, setSelectedTheme] = usePersistentState<ThemeId>(
  'selectedTheme',
  'rosa-claro' // default
)

// useEffect no mount:
useEffect(() => {
  const theme = THEMES[selectedTheme]
  if (theme) applyTheme(theme)
}, [selectedTheme])

// handler público:
const handleThemeChange = useCallback((themeId: ThemeId) => {
  setSelectedTheme(themeId)
}, [setSelectedTheme])
```

### 4.5 Picker no PerfilView

- Card com grid 2×5 (ou vertical scroll) de **swatches pequenos** (amostra das 4 cores principais + label + emoji)
- Preview visual: miniatura do card com as cores do tema (2-3 blocos coloridos)
- Feedback: `hapticSuccess()` ao selecionar
- Transição suave: `transition-colors duration-300` no `:root` via CSS

### 4.6 Migração de Schema

- `UserProfile` ganha campo `themeId?: string`
- `SCHEMA_VERSION` 6 → 7
- `MIGRATIONS[7]`: se `themeId` ausente no backup, setar `'rosa-claro'`
- Limpar chave `cecistudy_selectedTheme` legada se existir (migrar para perfil)

---

## 5. Ordem de Implementação Sugerida

1. **Refatorar sombras** no `index.css` para usarem `var(--shadow-rgb)` (pré-requisito dark/neon)
2. **Criar `src/lib/themes.ts`** com os 10 objetos `Theme` + `applyTheme()` + `removeTheme()`
3. **Testes `themes.test.ts`** — cobrir: apply sobre todos os tokens, remove reseta, derivados calculados
4. **`types.ts` + `initialData.ts`** — adicionar `themeId` em `UserProfile`, seed `'rosa-claro'`
5. **`data/schema.ts`** — `SCHEMA_VERSION` 7 + migration
6. **`AppContext.tsx`** — estado + apply no mount + handler
7. **`PerfilView.tsx`** — seção "aparência" com picker
8. **Verificação:** `npm run lint` + `npm run test` + `npm run build` + smoke test visual dos 10 temas

---

## 6. Notas de Design

- Tema **noturno** e **neon** usam `ChartTheme = 'dark'` nos dither-charts (controle separado, detectado por `isDark`)
- Tema **biblioteca** reaproveita a textura `.paper-texture` como elemento decorativo sutil (opcional, feature enhancement futura)
- Transição entre temas: `* { transition: background-color 0.35s ease, color 0.25s ease, border-color 0.3s ease }` no `:root` — fazer como opt-in via classe `.theme-transitioning` para não impactar performance
- Badge do curso no header (semestre) herda `text-ceci-primary` — funciona em qualquer tema
- Stickers/emoji continuam rendering nativo (não são afetados por tema — e nem deveriam)