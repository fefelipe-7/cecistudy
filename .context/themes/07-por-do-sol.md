# por-do-sol — Tema 7/10

> **Dramático, cozy, calor do entardecer.** Roxo-poente + coral.

---

## Atmosfera

O sol indo embora atrás da faculdade, o céu roxo e rosa, e a Ceci no último ciclo de revisão antes do jantar. Este tema é o "hora de parar e respirar" traduzido em cor. Roxo-queimado no texto para dar peso (é um texto que já viveu o dia todo), coral-entardecer como marca para a ação final, e um cream quente que puxa pro pêssego. Dramático, mas não opressivo — é o drama do entardecer, não do pesadelo.

**Sentido:** contemplação, encerramento, beleza passageira.

---

## Paleta completa

| grupo | token | valor |
|---|---|---|
| fundo | `canvas` | `#FDF8F5` |
| | `surface-default` | `#FFFCF9` |
| | `surface-subtle` | `#FAF2ED` |
| | `surface-muted` | `#F6ECE5` |
| texto | `ceci-primary` | `#3A2632` |
| | `ceci-secondary` | `#625058` |
| | `ceci-tertiary` | `#867580` |
| | `ceci-muted` | `#A39795` |
| | `ceci-faded` | `#BEB5B4` |
| | `ceci-ink` | `#2C1A24` |
| marca | `ceci-brand` | `#C85A50` |
| | `ceci-brand-strong` | `#B0453C` |
| | `ceci-brand-soft` | `#E08D84` |
| | `ceci-brand-hover` | `#983830` |
| acadêmico | `ceci-academic` | `#5A7A90` |
| | `ceci-academic-strong` | `#486378` |
| bordas | `ceci-border-subtle` | `#EDE4E0` |
| | `ceci-border-default` | `#E0D4CE` |
| | `ceci-border-strong` | `#CFC0B8` |
| | `ceci-border-brand` | `rgba(200, 90, 80, 0.22)` |
| | `ceci-border-academic` | `rgba(90, 122, 144, 0.22)` |

---

## Sombras

Temperatura roxo-quente:

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(58, 38, 50, 0.04)` |
| `shadow-sm` | `0 2px 8px rgba(58, 38, 50, 0.05)` |
| `shadow-md` | `0 6px 18px rgba(58, 38, 50, 0.07)` |
| `shadow-lg` | `0 12px 32px rgba(58, 38, 50, 0.09)` |
| `shadow-xl` | `0 20px 48px rgba(58, 38, 50, 0.12)` |
| `shadow-floating` | `0 8px 28px rgba(58, 38, 50, 0.12)` |
| `shadow-floating-strong` | `0 8px 28px rgba(58, 38, 50, 0.25)` |
| `shadow-brand` | `0 4px 16px rgba(176, 69, 60, 0.30)` |
| `shadow-brand-soft` | `0 4px 14px rgba(176, 69, 60, 0.22)` |

---

## Mapeamento no app

| elemento | tokens usados |
|---|---|
| body + container | `canvas` `#FDF8F5` |
| card | `surface-default` + `border-default` + shadow-sm |
| botão primário | `ceci-brand-strong` (#B0453C) bg + `ceci-ink` text |
| badge brand | `surface-subtle` (`#FAF2ED`) bg + `border-brand` + `brand` text |
| header detail barra esquerda | `ceci-brand` bg (coral-entardecer) |
| bookmark ativo | `surface-subtle` bg + `border-brand` + `ceci-brand` icon |
| progress bar | `ceci-brand` fill + `ceci-brand-soft` track |
| hero da home | bg gradiente `linear-gradient(180deg, #FDF8F5, #F5EAE2)` |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#3A2632` sobre canvas `#FDF8F5` | ~11.3:1 | ✅ AAA |
| brand-strong sobre white | ~4.6:1 | ✅ AA |
| secondary sobre canvas | ~5.3:1 | ✅ AA |
| brand sobre canvas (texto decorativo) | ~3.4:1 | ⚠️ decorativo |

---

## Derivados automáticos

| token | fórmula | resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(200, 90, 80, 0.08)` |
| `ceci-border-brand` | brand @ 22% | `rgba(200, 90, 80, 0.22)` |
| `ceci-brand-soft` | brand @ 25% | `rgba(200, 90, 80, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(90, 122, 144, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `light`
- **isDark:** `false`
- **Gradiente hero:** usar `linear-gradient(180deg, #FDF8F5 0%, #F5E8DD 60%, #E8D0C4 100%)` na home para simular o "céu queimando"
- **Ícone da home:** pode usar o cérebro (🧠) ou livro (📚) como accent — ambos funcionam
- **Transação suave:** este tema ganha muito com crossfade de 400ms (a transição é parte da experiência)

---

## Relação com outros temas

- **vs amanhecer:** ambos quentes, mas amanhecer é otimista/manhã; por-do-sol é contemplativo/fim de dia
- **vs rosa-claro:** ambos warm, mas rosa-claro é neutro-afetuoso; por-do-sol é dramático
- **vs nebulosa:** ambos têm roxo, mas por-do-sol é quente/luminoso; nebulosa é frio/cósmico

---

## Copy de apresentação

> **por-do-sol** 🌇  
> beleza passageira de quem fechou o dia de estudos — roxo e coral para contemplar