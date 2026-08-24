# oceano — Tema 4/10

> **Calma, profundidade, erudição fluida.** Azul-petróleo + teal.

---

## Atmosfera

O oceano visto de cima: não o mar agitado de tempestade, mas a calma da superfície que esconde profundidade. Um tema para quem quer estudar com a mente serena, onde cada informação é uma onda que chega suave. Azul-petróleo como brand porque é a cor do conhecimento sem ser o "azul clássico" genérico.

**Sentido:** serenidade, profundidade, clareza mental.

---

## Paleta completa

| grupo | token | valor |
|---|---|---|
| fundo | `canvas` | `#F7FAFB` |
| | `surface-default` | `#FFFFFF` |
| | `surface-subtle` | `#F2F7F9` |
| | `surface-muted` | `#F0F4F6` |
| texto | `ceci-primary` | `#243440` |
| | `ceci-secondary` | `#556A78` |
| | `ceci-tertiary` | `#7A8E9B` |
| | `ceci-muted` | `#9BA6AD` |
| | `ceci-faded` | `#BCC4C9` |
| | `ceci-ink` | `#18242C` |
| marca | `ceci-brand` | `#3C8EA0` |
| | `ceci-brand-strong` | `#2A7587` |
| | `ceci-brand-soft` | `#7DB8C8` |
| | `ceci-brand-hover` | `#236372` |
| acadêmico | `ceci-academic` | `#4A879F` |
| | `ceci-academic-strong` | `#396D82` |
| bordas | `ceci-border-subtle` | `#E4ECF0` |
| | `ceci-border-default` | `#D5E2E8` |
| | `ceci-border-strong` | `#C2D4DC` |
| | `ceci-border-brand` | `rgba(60, 142, 160, 0.22)` |
| | `ceci-border-academic` | `rgba(74, 135, 159, 0.22)` |

---

## Sombras

Temperatura azulada-sutil (quase neutra):

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(36, 52, 64, 0.04)` |
| `shadow-sm` | `0 2px 8px rgba(36, 52, 64, 0.05)` |
| `shadow-md` | `0 6px 18px rgba(36, 52, 64, 0.07)` |
| `shadow-lg` | `0 12px 32px rgba(36, 52, 64, 0.09)` |
| `shadow-xl` | `0 20px 48px rgba(36, 52, 64, 0.12)` |
| `shadow-floating` | `0 8px 28px rgba(36, 52, 64, 0.12)` |
| `shadow-floating-strong` | `0 8px 28px rgba(36, 52, 64, 0.25)` |
| `shadow-brand` | `0 4px 16px rgba(42, 117, 135, 0.30)` |
| `shadow-brand-soft` | `0 4px 14px rgba(42, 117, 135, 0.22)` |

---

## Mapeamento no app

| elemento | tokens usados |
|---|---|
| body + container | `canvas` `#F7FAFB` |
| card | `surface-default` + `border-default` + shadow-sm |
| botão primário | `ceci-brand-strong` (#2A7587) bg + `ceci-ink` text |
| badge brand | `surface-subtle` (`#F2F7F9`) bg + `border-brand` + `brand` text |
| header detail barra esquerda | `ceci-brand` bg (único lugar que usa brand puro como barra) |
| bookmark ativo | `surface-subtle` bg + `border-brand` + `ceci-brand` icon |
| progress bar brand | `ceci-brand` fill + `ceci-brand-soft` track |
| seção acadêmica | `surface-subtle` + `border-academic` |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#243440` sobre canvas `#F7FAFB` | ~12.2:1 | ✅ AAA |
| brand-strong sobre white | ~4.7:1 | ✅ AA |
| brand sobre canvas (texto) | ~3.2:1 | ⚠️ decorativo |
| secondary sobre canvas | ~5.6:1 | ✅ AA |

---

## Derivados automáticos

| token | fórmula | resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(60, 142, 160, 0.08)` |
| `ceci-border-brand` | brand @ 22% | `rgba(60, 142, 160, 0.22)` |
| `ceci-brand-soft` | brand @ 25% | `rgba(60, 142, 160, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(74, 135, 159, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `light`
- **isDark:** `false`
- **Acento único:** `ceci-brand` e `ceci-academic` são tonos próximos (azul-petróleo e azul-acadêmico). Usar `ceci-brand` como cor primária e `ceci-academic-strong` como contraste secundário para não perder hierarquia
- **Gradiente sutil (opcional):** `linear-gradient(180deg, #F7FAFB, #F0F5F8)` no container
- **Sem cor "quente" no produto:** este é o único tema sem nenhum matiz avermelhado — útil para diferenciar visualmente do rosa-claro

---

## Relação com outros temas

- **vs rosa-claro:** ambos claros, mas oceano é mais "frio/azul" enquanto rosa-claro é "quente/rosa"
- **vs jardim:** ambos nature-inspired, mas oceano é aquático enquanto jardim é botânico
- **vs noturno:** inverso conceitual — oceano é a superfície calma, noturno é a profundidade escura

---

## Copy de apresentação

> **oceano** 🌊  
> calma e profundidade — azul-petróleo para quem quer clareza mental nos estudos