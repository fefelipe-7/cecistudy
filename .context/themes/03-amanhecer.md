# amanhecer — Tema 3/10

> **Quente, energia nova, otimismo suave.** Coral/terracota como brand.

---

## Atmosfera

O começo de um dia de faculdade. Café na mesa, sol entrando pela janela, planilha de estudos pela frente. A cor do entusiasmo sem ser vibrante: um coral queimado que aquece sem queimar, sobre um cream que puxa pro dourado sem ser amarelão. É o "bora estudar?" transformado em cor.

**Sentido:** energia, otimismo, recomeço.

---

## Paleta completa

| grupo | token | valor |
|---|---|---|
| fundo | `canvas` | `#FFFAF5` |
| | `surface-default` | `#FFFFFF` |
| | `surface-subtle` | `#FFF7EE` |
| | `surface-muted` | `#FAF5ED` |
| texto | `ceci-primary` | `#3D2E28` |
| | `ceci-secondary` | `#6B5A52` |
| | `ceci-tertiary` | `#917F77` |
| | `ceci-muted` | `#ADA094` |
| | `ceci-faded` | `#C4B7B0` |
| | `ceci-ink` | `#271C18` |
| marca | `ceci-brand` | `#E8785A` |
| | `ceci-brand-strong` | `#D0603F` |
| | `ceci-brand-soft` | `#F2A48D` |
| | `ceci-brand-hover` | `#B55035` |
| acadêmico | `ceci-academic` | `#5A8FA8` |
| | `ceci-academic-strong` | `#407090` |
| bordas | `ceci-border-subtle` | `#F2E8DF` |
| | `ceci-border-default` | `#E9D8C8` |
| | `ceci-border-strong` | `#DCC8B5` |
| | `ceci-border-brand` | `rgba(232, 120, 90, 0.22)` |
| | `ceci-border-academic` | `rgba(90, 143, 168, 0.25)` |

---

## Sombras

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(60, 46, 40, 0.04)` |
| `shadow-sm` | `0 2px 8px rgba(60, 46, 40, 0.05)` |
| `shadow-md` | `0 6px 18px rgba(60, 46, 40, 0.07)` |
| `shadow-lg` | `0 12px 32px rgba(60, 46, 40, 0.09)` |
| `shadow-xl` | `0 20px 48px rgba(60, 46, 40, 0.12)` |
| `shadow-floating` | `0 8px 28px rgba(60, 46, 40, 0.12)` |
| `shadow-floating-strong` | `0 8px 28px rgba(60, 46, 40, 0.25)` |
| `shadow-brand` | `0 4px 16px rgba(208, 96, 63, 0.35)` |
| `shadow-brand-soft` | `0 4px 14px rgba(208, 96, 63, 0.25)` |

---

## Mapeamento no app

| elemento | tokens |
|---|---|
| body + container | `canvas` |
| card | `surface-default` + `border-default` + shadow-sm |
| botão primário | `ceci-brand-strong` (#D0603F) bg + `ceci-ink` text |
| badge brand | `surface-subtle` (#FFF7EE) bg + `border-brand` + `brand` text |
| seção "meta do dia" | `surface-subtle` bg com gradiente sutil para `canvas` |
| ícone da home (sol) | `ceci-brand` fill |
| progress bar | `ceci-brand` fill |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#3D2E28` sobre canvas `#FFFAF5` | ~11.5:1 | ✅ AAA |
| brand-strong sobre white | ~4.7:1 | ✅ AA (botões) |
| brand sobre canvas (texto) | ~3.3:1 | ⚠️ decorativo apenas |
| secondary sobre canvas | ~5.2:1 | ✅ AA |

---

## Derivados automáticos

| token | fórmula | resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(232, 120, 90, 0.08)` |
| `ceci-border-brand` | brand @ 22% | `rgba(232, 120, 90, 0.22)` |
| `ceci-brand-soft` | brand @ 25% | `rgba(232, 120, 90, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(90, 143, 168, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `light`
- **isDark:** `false`
- **Gradiente sutil:** usar `linear-gradient(135deg, #FFFAF5, #FFF4E8)` no hero da home para sentir o "quente" sem ser óbvio
- **Haptics:** `hapticSuccess()` ao selecionar

---

## Relação com outros temas

- **vs rosa-claro:** mais terroso, menos pink; mesma luminosidade
- **vs por-do-sol:** o amanhecer é mais quente e otimista; o por-do-sol é mais dramático e introspectivo
- **vs biblioteca:** ambos usam castanho no primary, mas o biblioteca é mais vintage/papel; o amanhecer é mais clean/coral

---

## Copy de apresentação

> **amanhecer** 🌅  
> energia de quem recomeça — quente, otimista, pronta pra faculdade