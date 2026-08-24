# biblioteca — Tema 6/10

> **Vintage, erudição, papel envelhecido.** Vinho + dourado.

---

## Atmosfera

A biblioteca de uma faculdade de psicologia: prateleiras de madeira escura, livros com lombadas douradas, cheiro de papel antigo e café. Este tema é para a Ceci que ama a referência bibliográfica, que cita DSM-5 em conversa, que tem prazer em folhear uma edição brochura. Vinho bordô como brand (cor de encadernação), dourado como acento, e tudo em bege-papel para simular a página envelhecida.

**Sentido:** erudição, memória, respeito pela história da profissão.

---

## Paleta completa

| grupo | token | valor |
|---|---|---|
| fundo | `canvas` | `#FAF7F2` |
| | `surface-default` | `#FEFCF7` |
| | `surface-subtle` | `#F7F1E6` |
| | `surface-muted` | `#F3EDE3` |
| texto | `ceci-primary` | `#3A2E28` |
| | `ceci-secondary` | `#62564F` |
| | `ceci-tertiary` | `#867A72` |
| | `ceci-muted` | `#A39891` |
| | `ceci-faded` | `#BEB5AF` |
| | `ceci-ink` | `#2C2018` |
| marca | `ceci-brand` | `#8B4049` |
| | `ceci-brand-strong` | `#6E323A` |
| | `ceci-brand-soft` | `#B87580` |
| | `ceci-brand-hover` | `#5C2A32` |
| acadêmico | `ceci-academic` | `#6B8FA0` |
| | `ceci-academic-strong` | `#527384` |
| bordas | `ceci-border-subtle` | `#EDE4D8` |
| | `ceci-border-default` | `#E0D4C4` |
| | `ceci-border-strong` | `#CFC0AD` |
| | `ceci-border-brand` | `rgba(139, 64, 73, 0.22)` |
| | `ceci-border-academic` | `rgba(107, 143, 160, 0.22)` |

---

## Sombras

Temperatura castanho-quente (papel envelhecido):

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(58, 46, 40, 0.05)` |
| `shadow-sm` | `0 2px 8px rgba(58, 46, 40, 0.06)` |
| `shadow-md` | `0 6px 18px rgba(58, 46, 40, 0.08)` |
| `shadow-lg` | `0 12px 32px rgba(58, 46, 40, 0.10)` |
| `shadow-xl` | `0 20px 48px rgba(58, 46, 40, 0.13)` |
| `shadow-floating` | `0 8px 28px rgba(58, 46, 40, 0.13)` |
| `shadow-floating-strong` | `0 8px 28px rgba(58, 46, 40, 0.26)` |
| `shadow-brand` | `0 4px 16px rgba(110, 50, 58, 0.30)` |
| `shadow-brand-soft` | `0 4px 14px rgba(110, 50, 58, 0.22)` |

---

## Mapeamento no app

| elemento | tokens |
|---|---|
| body + container | `canvas` `#FAF7F2` |
| card | `surface-default` (`#FEFCF7`) + `border-default` + shadow-sm |
| botão primário | `ceci-brand-strong` (#6E323A) bg + `ceci-ink` text |
| badge brand | `surface-subtle` (`#F7F1E6`) bg + `border-brand` + `brand` text |
| header detail barra esquerda | `ceci-brand` bg |
| bookmark ativo | `surface-subtle` bg + `border-brand` + `ceci-brand` icon |
| progress bar | `ceci-brand` fill |
| seção biblioteca (shelf) | `surface-subtle` bg + `.paper-texture` (ativa para reforçar atmosfera) |
| capa de livro (inline) | continua como dado — NÃO afetada pelo tema |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#3A2E28` sobre canvas `#FAF7F2` | ~11.8:1 | ✅ AAA |
| brand-strong sobre white | ~5.0:1 | ✅ AA |
| secondary sobre canvas | ~5.4:1 | ✅ AA |

---

## Derivados automáticos

| token | fórmula | resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(139, 64, 73, 0.08)` |
| `ceci-border-brand` | brand @ 22% | `rgba(139, 64, 73, 0.22)` |
| `ceci-brand-soft` | brand @ 25% | `rgba(139, 64, 73, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(107, 143, 160, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `light`
- **isDark:** `false`
- **Textura `.paper-texture`: ATIVA** — o dot pattern rosa-vintage combina com o bege-papel. Este é o único tema que ativa explicitamente a textura como elemento atmosférico
- **Gradiente do canvas (opcional):** `linear-gradient(180deg, #FAF7F2, #F5EFE4)` para dar sensação de "papel inclinado"
- **Badge de semestre no header:** o vinho combina com dourado — considerar borda `ceci-border-brand` em vez de brand puro para ficar mais sutil

---

## Relação com outros temas

- **vs jardim:** ambos orgânicos, mas biblioteca é "seco/papel" enquanto jardim é "vivo/folha"
- **vs rosa-claro:** ambos claros/warm, mas biblioteca tem o vinho como brand (sério) vs rosa (afetuoso)
- **vs cerâmica:** ambos terrosos, mas biblioteca é mais vintage/papel, cerâmica é mais artesanal/argila

---

## Copy de apresentação

> **biblioteca** 📚  
> a estante de referências — vinho, dourado e o cheiro de papel antigo