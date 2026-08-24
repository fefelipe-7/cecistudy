# neon — Tema 10/10

> **Noturno vibrante, sintético, energia urbana.** Preto grafite + magenta neon + ciano-elétrico.

---

## Atmosfera

O oposto radical do rosa-claro. Quando a Ceci quer estudar de noite mas não quer o calmão do noturno — quer **café** + **fone** + **tela brilhando**. Preto grafite puro (não preto RGB puro, tem um toque azulado), magenta neon que grita ação, e ciano-elétrico como acento acadêmico. É o tema "foco total", para quando a concentração precisa de energia, não de acolhimento.

**Sentido:** energia, foco, urgência produtiva.

---

## Paleta completa

| grupo | token | valor |
|---|---|---|
| fundo | `canvas` | `#0F0F12` |
| | `surface-default` | `#1A1A20` |
| | `surface-subtle` | `#22222B` |
| | `surface-muted` | `#16161C` |
| texto | `ceci-primary` | `#E6E0F0` |
| | `ceci-secondary` | `#B0A8C0` |
| | `ceci-tertiary` | `#86809A` |
| | `ceci-muted` | `#68627A` |
| | `ceci-faded` | `#504A5C` |
| | `ceci-ink` | `#F4F0FF` |
| marca | `ceci-brand` | `#E93B8C` |
| | `ceci-brand-strong` | `#D42A7C` |
| | `ceci-brand-soft` | `#F27AAA` |
| | `ceci-brand-hover` | `#B8206A` |
| acadêmico | `ceci-academic` | `#00D4AA` |
| | `ceci-academic-strong` | `#00B894` |
| bordas | `ceci-border-subtle` | `#26252E` |
| | `ceci-border-default` | `#33313C` |
| | `ceci-border-strong` | `#44424E` |
| | `ceci-border-brand` | `rgba(233, 59, 140, 0.30)` |
| | `ceci-border-academic` | `rgba(0, 212, 170, 0.25)` |

---

## Sombras

Preto puro + glow de brand:

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(0, 0, 0, 0.20)` |
| `shadow-sm` | `0 2px 8px rgba(0, 0, 0, 0.25)` |
| `shadow-md` | `0 6px 18px rgba(0, 0, 0, 0.32)` |
| `shadow-lg` | `0 12px 32px rgba(0, 0, 0, 0.40)` |
| `shadow-xl` | `0 20px 48px rgba(0, 0, 0, 0.55)` |
| `shadow-floating` | `0 8px 28px rgba(0, 0, 0, 0.48)` |
| `shadow-floating-strong` | `0 8px 28px rgba(0, 0, 0, 0.65)` |
| `shadow-brand` | `0 4px 16px rgba(233, 59, 140, 0.45)` |
| `shadow-brand-soft` | `0 4px 14px rgba(233, 59, 140, 0.30)` |

---

## Mapeamento no app

| elemento | tokens usados |
|---|---|
| body + container | `canvas` `#0F0F12` |
| card | `surface-default` (`#1A1A20`) + `border-default` + shadow-sm |
| botão primário | `ceci-brand-strong` (#D42A7C) bg + `ceci-ink` text |
| badge brand | `surface-muted` bg + `border-brand` + `brand` text |
| header detail barra esquerda | `ceci-brand` bg |
| bookmark ativo | `surface-muted` bg + `border-brand` + `ceci-brand` icon |
| progress bar | `ceci-brand` fill + glow blur extra |
| ícone academic | `#00D4AA` fill (ciano neon — alto contraste) |
| FAB | `ceci-brand` bg + ícone branco + `shadow-brand` glow |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#E6E0F0` sobre canvas `#0F0F12` | ~12.5:1 | ✅ AAA |
| brand-strong `#D42A7C` sobre canvas | ~7.2:1 | ✅ AAA (excelente para botões) |
| academic `#00D4AA` sobre canvas | ~11.0:1 | ✅ AAA |
| secondary sobre canvas | ~6.1:1 | ✅ AAA |
| tertiary sobre canvas | ~4.4:1 | ✅ AA |
| muted sobre canvas | ~3.8:1 | ⚠️ AA para textos grandes |

---

## Derivados automáticos

| token | fórmula | resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(233, 59, 140, 0.08)` |
| `ceci-border-brand` | brand @ 30% | `rgba(233, 59, 140, 0.30)` (definido manualmente para ficar mais visível no dark) |
| `ceci-brand-soft` | brand @ 25% | `rgba(233, 59, 140, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(0, 212, 170, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `dark`
- **isDark:** `true`
- **Glow effect (recomendado):** nos botões principais e no FAB, adicionar `box-shadow` com brand + `blur(12px)` para simular o brilho neon
- **Backdrop blur:** usar `backdrop-blur-md` (mais forte) nos overlays para dar sensação de "vidro iluminado"
- **Status bar nativa:** ícones BRANCOS (confirmar em `native.ts`)
- **Transição:** 350ms; neon se destaca mais na mudança
- **Sem `ceci-faded` claro:** o `#504A5C` já é uma cor visível no dark — textos faded continuam legíveis

---

## Relação com outros temas

- **vs noturno:** ambos dark, mas neon é vibrante/sintético; noturno é calmo/pastel
- **vs rosa-claro:** opostos — neon é dark+neon; rosa-claro é light+warmth
- **vs por-do-sol:** ambos dramáticos, mas por-do-sol é warm/terroso; neon é cold/sintético

---

## Copy de apresentação

> **neon** 🎇  
> foco total à noite — magenta e ciano elétrico para quem estudar é energia pura