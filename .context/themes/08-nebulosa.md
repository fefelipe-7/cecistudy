# nebulosa — Tema 8/10

> **Cósmica, introspectiva, serena.** Índigo + lavanda.

---

## Atmosfera

A Ceci olhando pela janela de madrugada, cidade apagada, pensando sobre a jornada. Este tema é sobre **introspecção** e sobre como a psicologia também é olhar pra dentro no escuro até encontrar um brilho. Índigo profundo no texto (quase-preto azulado), lavanda-víola como brand (suave, etérea), e um fundo quase-branco com viés lavanda. Não é dark — é o brilho fraco de uma estrela no fundo do universo.

**Sentido:** introspecção, serenidade, expansão.

---

## Paleta completa

| grupo | token | valor |
|---|---|---|
| fundo | `canvas` | `#F8F7FB` |
| | `surface-default` | `#FCFBFE` |
| | `surface-subtle` | `#F3F1F8` |
| | `surface-muted` | `#EFECF5` |
| texto | `ceci-primary` | `#28243A` |
| | `ceci-secondary` | `#565270` |
| | `ceci-tertiary` | `#7A7890` |
| | `ceci-muted` | `#9D9BAD` |
| | `ceci-faded` | `#BDBBD0` |
| | `ceci-ink` | `#1E1A2E` |
| marca | `ceci-brand` | `#7B6AAA` |
| | `ceci-brand-strong` | `#625590` |
| | `ceci-brand-soft` | `#A99DD0` |
| | `ceci-brand-hover` | `#524880` |
| acadêmico | `ceci-academic` | `#5080A0` |
| | `ceci-academic-strong` | `#3E6888` |
| bordas | `ceci-border-subtle` | `#E8E5F0` |
| | `ceci-border-default` | `#D9D5E6` |
| | `ceci-border-strong` | `#C7C2D8` |
| | `ceci-border-brand` | `rgba(123, 106, 170, 0.22)` |
| | `ceci-border-academic` | `rgba(80, 128, 160, 0.22)` |

---

## Sombras

Temperatura índigo-sutil:

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(40, 36, 58, 0.04)` |
| `shadow-sm` | `0 2px 8px rgba(40, 36, 58, 0.05)` |
| `shadow-md` | `0 6px 18px rgba(40, 36, 58, 0.07)` |
| `shadow-lg` | `0 12px 32px rgba(40, 36, 58, 0.09)` |
| `shadow-xl` | `0 20px 48px rgba(40, 36, 58, 0.12)` |
| `shadow-floating` | `0 8px 28px rgba(40, 36, 58, 0.12)` |
| `shadow-floating-strong` | `0 8px 28px rgba(40, 36, 58, 0.25)` |
| `shadow-brand` | `0 4px 16px rgba(98, 85, 144, 0.30)` |
| `shadow-brand-soft` | `0 4px 14px rgba(98, 85, 144, 0.22)` |

---

## Mapeamento no app

| elemento | tokens usados |
|---|---|
| body + container | `canvas` `#F8F7FB` |
| card | `surface-default` + `border-default` + shadow-sm |
| botão primário | `ceci-brand-strong` (#625590) bg + `ceci-ink` text |
| badge brand | `surface-subtle` (`#F3F1F8`) bg + `border-brand` + `brand` text |
| header detail barra esquerda | `ceci-brand` bg |
| bookmark ativo | `surface-subtle` bg + `border-brand` + `ceci-brand` icon |
| progress bar | `ceci-brand` fill + `ceci-brand-soft` track |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#28243A` sobre canvas `#F8F7FB` | ~12.0:1 | ✅ AAA |
| brand-strong sobre white | ~4.6:1 | ✅ AA |
| secondary sobre canvas | ~5.5:1 | ✅ AA |
| brand sobre canvas (texto decorativo) | ~3.5:1 | ⚠️ decorativo |

---

## Derivados automáticos

| token | fórmula | resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(123, 106, 170, 0.08)` |
| `ceci-border-brand` | brand @ 22% | `rgba(123, 106, 170, 0.22)` |
| `ceci-brand-soft` | brand @ 25% | `rgba(123, 106, 170, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(80, 128, 160, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `light`
- **isDark:** `false`
- **Ícone especial:** usar um ícone de estrela/lua na home para reforçar a atmosfera cósmica
- **Hero gradiente (opcional):** `linear-gradient(135deg, #F8F7FB, #EFEBF8)` — muito sutil, quase imperceptível, mas dá profundidade
- **Transição:** 400ms crossfade reforça a sensação de "flutuar entre galáxias"

---

## Relação com outros temas

- **vs por-do-sol:** ambos usam roxo, mas por-do-sol é quente/coral; nebulosa é frio/lavanda
- **vs noturno:** noturno é funcional (escuro p/ ler à noite); nebulosa é atmosférico (claro com viés cósmico)
- **vs biblioteca:** ambos introspectivos, mas biblioteca é terra/papel; nebulosa é éter/estrela

---

## Copy de apresentação

> **nebulosa** 🫥  
> introspecção e expansão — índigo e lavanda para quem estuda olhando pra dentro