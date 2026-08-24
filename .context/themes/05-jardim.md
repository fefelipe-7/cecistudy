# jardim — Tema 5/10

> **Natureza, crescimento, frescor.** Verde-musgo como brand.

---

## Atmosfera

Uma estufa pequena, daquelas com cheiro de terra molhada e folha nova. O tema para a Ceci que vê a psicologia como algo orgânico — que cresce, se ramifica, Sometimes precisa de poda, Sometimes de adubo. Verde-musgo como brand porque é uma cor que respira: não é o verde "esperança" vibrante, é o verde da samambaia que pendura na janela do cantinho.

**Sentido:** crescimento, natureza, vitalidade.

---

## Paleta completa

| grupo | token | valor |
|---|---|---|
| fundo | `canvas` | `#F8FAF7` |
| | `surface-default` | `#FFFFFF` |
| | `surface-subtle` | `#F4F8F3` |
| | `surface-muted` | `#F2F5F1` |
| texto | `ceci-primary` | `#2A3228` |
| | `ceci-secondary` | `#566054` |
| | `ceci-tertiary` | `#7A8377` |
| | `ceci-muted` | `#9AA39A` |
| | `ceci-faded` | `#B7BDB6` |
| | `ceci-ink` | `#1C241A` |
| marca | `ceci-brand` | `#5A8A60` |
| | `ceci-brand-strong` | `#45724A` |
| | `ceci-brand-soft` | `#8DB893` |
| | `ceci-brand-hover` | `#38603D` |
| acadêmico | `ceci-academic` | `#4A8890` |
| | `ceci-academic-strong` | `#386E75` |
| bordas | `ceci-border-subtle` | `#E6ECE5` |
| | `ceci-border-default` | `#D6E0D5` |
| | `ceci-border-strong` | `#C0CFBF` |
| | `ceci-border-brand` | `rgba(90, 138, 96, 0.22)` |
| | `ceci-border-academic` | `rgba(74, 136, 144, 0.22)` |

---

## Sombras

Temperatura verde-quente sutil:

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(42, 50, 40, 0.04)` |
| `shadow-sm` | `0 2px 8px rgba(42, 50, 40, 0.05)` |
| `shadow-md` | `0 6px 18px rgba(42, 50, 40, 0.07)` |
| `shadow-lg` | `0 12px 32px rgba(42, 50, 40, 0.09)` |
| `shadow-xl` | `0 20px 48px rgba(42, 50, 40, 0.12)` |
| `shadow-floating` | `0 8px 28px rgba(42, 50, 40, 0.12)` |
| `shadow-floating-strong` | `0 8px 28px rgba(42, 50, 40, 0.25)` |
| `shadow-brand` | `0 4px 16px rgba(69, 114, 74, 0.30)` |
| `shadow-brand-soft` | `0 4px 14px rgba(69, 114, 74, 0.22)` |

---

## Mapeamento no app

| elemento | tokens usados |
|---|---|
| body + container | `canvas` `#F8FAF7` |
| card | `surface-default` + `border-default` + shadow-sm |
| botão primário | `ceci-brand-strong` (#45724A) bg + `ceci-ink` text |
| badge brand | `surface-subtle` (`#F4F8F3`) bg + `border-brand` + `brand` text |
| seção "study corner" | `surface-subtle` bg com ícone de folha |
| progress bar | `ceci-brand` fill + `ceci-brand-soft` track |
| ícone academic | `ceci-academic` fill (teal complementar) |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#2A3228` sobre canvas `#F8FAF7` | ~11.3:1 | ✅ AAA |
| brand-strong sobre white | ~4.4:1 | ✅ AA |
| secondary sobre canvas | ~5.3:1 | ✅ AA |
| brand sobre canvas (texto decorativo) | ~3.1:1 | ⚠️ decorativo |

---

## Derivados automáticos

| token | fórmula | resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(90, 138, 96, 0.08)` |
| `ceci-border-brand` | brand @ 22% | `rgba(90, 138, 96, 0.22)` |
| `ceci-brand-soft` | brand @ 25% | `rgba(90, 138, 96, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(74, 136, 144, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `light`
- **isDark:** `false`
- **Badge de sticker desbloqueado:** o verde combina com emoji de planta/árvore — considerar tooltip com msg "crescendo ♡"
- **Gradiente hero (opcional):** `linear-gradient(135deg, #F8FAF7, #F0F5EE)` na home
- **Pílula de streak:** usar `ceci-brand-soft` como bg para "dias ativos"

---

## Relação com outros temas

- **vs oceano:** ambos nature-inspired, mas jardim é mais botânico/terra, oceano é aquático/azul
- **vs biblioteca:** jardim é vivo/crescimento; biblioteca é seco/papel/velho
- **vs amanhecer:** amanhecer é energia/manhã; jardim é calma/tarde ensolarada

---

## Copy de apresentação

> **jardim** 🌿  
> crescimento e frescor — verde-musgo para quem estuda com calma e presença