# cerâmica — Tema 9/10

> **Artesanal, orgânico, texturizado.** Terracota queimada + argila.

---

## Atmosfera

O ateliê da Ceci — mesa de madeira com tinta respingada, panelas de barro no forno, mãos sujas de argila. Este tema é sobre **fazer com as mãos**, sobre a psicologia como ofício e não só como ciência. Terracota queimada como brand porque é a cor da argila cozida: resistente, bonita, imperfeita. Bege-argila nos surfaces para lembrar a massa crua.

**Sentido:** artesanato, organicidade, rito.

---

## Paleta completa

| grupo | token | valor |
|---|---|---|
| fundo | `canvas` | `#FBF8F5` |
| | `surface-default` | `#FEFBF7` |
| | `surface-subtle` | `#F7F2EB` |
| | `surface-muted` | `#F3ECE3` |
| texto | `ceci-primary` | `#3A3228` |
| | `ceci-secondary` | `#62584F` |
| | `ceci-tertiary` | `#867C72` |
| | `ceci-muted` | `#A39B93` |
| | `ceci-faded` | `#BFB7AF` |
| | `ceci-ink` | `#2C241A` |
| marca | `ceci-brand` | `#C2724A` |
| | `ceci-brand-strong` | `#A85D38` |
| | `ceci-brand-soft` | `#DDA07A` |
| | `ceci-brand-hover` | `#904D2E` |
| acadêmico | `ceci-academic` | `#5A8A90` |
| | `ceci-academic-strong` | `#487078` |
| bordas | `ceci-border-subtle` | `#EDE5DA` |
| | `ceci-border-default` | `#E0D4C4` |
| | `ceci-border-strong` | `#CFC0AE` |
| | `ceci-border-brand` | `rgba(194, 114, 74, 0.22)` |
| | `ceci-border-academic` | `rgba(90, 138, 144, 0.22)` |

---

## Sombras

Temperatura terrosa (argila queimada):

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(58, 50, 40, 0.05)` |
| `shadow-sm` | `0 2px 8px rgba(58, 50, 40, 0.06)` |
| `shadow-md` | `0 6px 18px rgba(58, 50, 40, 0.08)` |
| `shadow-lg` | `0 12px 32px rgba(58, 50, 40, 0.10)` |
| `shadow-xl` | `0 20px 48px rgba(58, 50, 40, 0.13)` |
| `shadow-floating` | `0 8px 28px rgba(58, 50, 40, 0.13)` |
| `shadow-floating-strong` | `0 8px 28px rgba(58, 50, 40, 0.26)` |
| `shadow-brand` | `0 4px 16px rgba(168, 93, 56, 0.30)` |
| `shadow-brand-soft` | `0 4px 14px rgba(168, 93, 56, 0.22)` |

---

## Mapeamento no app

| elemento | tokens usados |
|---|---|
| body + container | `canvas` `#FBF8F5` |
| card | `surface-default` + `border-default` + shadow-sm |
| botão primário | `ceci-brand-strong` (#A85D38) bg + `ceci-ink` text |
| badge brand | `surface-subtle` (`#F7F2EB`) bg + `border-brand` + `brand` text |
| header detail barra esquerda | `ceci-brand` bg |
| bookmark ativo | `surface-subtle` bg + `border-brand` + `ceci-brand` icon |
| progress bar | `ceci-brand` fill + `ceci-brand-soft` track |
| seção "tcc" / estágio | `surface-subtle` bg + border brand |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#3A3228` sobre canvas `#FBF8F5` | ~11.6:1 | ✅ AAA |
| brand-strong sobre white | ~4.8:1 | ✅ AA |
| secondary sobre canvas | ~5.4:1 | ✅ AA |
| brand sobre canvas (texto decorativo) | ~3.3:1 | ⚠️ decorativo |

---

## Derivados automáticos

| token | fórmula | resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(194, 114, 74, 0.08)` |
| `ceci-border-brand` | brand @ 22% | `rgba(194, 114, 74, 0.22)` |
| `ceci-brand-soft` | brand @ 25% | `rgba(194, 114, 74, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(90, 138, 144, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `light`
- **isDark:** `false`
- **Textura `.paper-texture`: usar com moderação** — este tema tem textura natural, então o dot pattern pode ficar "sujo". Usar apenas em cards de destaque, não em toda a home
- **Ícone do produto:** a terracota combina com ícones de mãos/ferramenta — reforçar o "craft"
- **Haptics:** vibrar com padrão diferenciado ao trocar (sugestão: combinar `hapticSuccess()` com pequeno delay de 100ms)

---

## Relação com outros temas

- **vs biblioteca:** ambos terrosos, mas biblioteca é papel/vinho; cerâmica é barro/terracota
- **vs amanhecer:** amanhecer é fresco/manhã; cerâmica é quente/fogo do forno
- **vs jardim:** jardim é crescimento/verde; cerâmica é matéria/transformação

---

## Copy de apresentação

> **cerâmica** 🏺  
> feito à mão, orgânico e texturizado — terracota queimada para quem vê a psicologia como ofício