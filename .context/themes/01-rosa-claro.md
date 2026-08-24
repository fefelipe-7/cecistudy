# rosa-claro — Tema 1/10

> **Identidade oficial do cecistudy.** Warmth cozy, cantinho afetuoso.

---

## Atmosfera

O primeiro tema — e o atual. É a casa da Ceci. O "café com leite no sofá", o abraço de quem cuida. Tons pastéis que não cansam a vista, contraste suficiente para ler à noite na cama, e o rosa marca que vira amor em cada interação.

**Sentido:** pertencimento, afeto, pele.

---

## Paleta completa

| grupo | token | valor | uso |
|---|---|---|---|
| fundo | `canvas` | `#FFFCF8` | fundo do body, container principal |
| | `surface-default` | `#FFFFFF` | cards, modais, bottom-nav |
| | `surface-subtle` | `#FFF8F1` | seções alternadas, hover de listas |
| | `surface-muted` | `#FAF8F5` | áreas desabilitadas, badges neutros |
| texto | `ceci-primary` | `#40383A` | títulos, texto principal |
| | `ceci-secondary` | `#6D6366` | subtítulos, descrições |
| | `ceci-tertiary` | `#918689` | labels, metadados |
| | `ceci-muted` | `#ADA3A5` | timestamps, placeholders |
| | `ceci-faded` | `#BEB4B6` | disabled, empty subtext |
| | `ceci-ink` | `#282022` | texto sobre brand-primary (botões) |
| marca | `ceci-brand` | `#D85F79` | ícone brand, badge ativo, link brand |
| | `ceci-brand-strong` | `#B94862` | botão primário, toggle on, ícone filled |
| | `ceci-brand-soft` | `#EA718F` | hover brand, progress brand |
| | `ceci-brand-hover` | `#A03B52` | hover brand-strong, active fab |
| acadêmico | `ceci-academic` | `#4A879F` | accent azul, ícone academic |
| | `ceci-academic-strong` | `#396D82` | botão secondary academic |
| bordas | `ceci-border-subtle` | `#F2EBE8` | separador interno |
| | `ceci-border-default` | `#E9DFDC` | borda de card |
| | `ceci-border-strong` | `#DCCFCA` | borda de input focado |
| | `ceci-border-brand` | `#FFD3DD` | card selecionado, borda brand |
| | `ceci-border-academic` | `#CEE7F0` | borda academic, filtro ativo |

---

## Sombras

Temperatura marrom-quente (padrão do design system):

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(64, 56, 58, 0.04)` |
| `shadow-sm` | `0 2px 8px rgba(64, 56, 58, 0.05)` |
| `shadow-md` | `0 6px 18px rgba(64, 56, 58, 0.07)` |
| `shadow-lg` | `0 12px 32px rgba(64, 56, 58, 0.09)` |
| `shadow-xl` | `0 20px 48px rgba(64, 56, 58, 0.12)` |
| `shadow-floating` | `0 8px 28px rgba(64, 56, 58, 0.12)` |
| `shadow-floating-strong` | `0 8px 28px rgba(64, 56, 58, 0.25)` |
| `shadow-brand` | `0 4px 16px rgba(185, 72, 98, 0.4)` |
| `shadow-brand-soft` | `0 4px 14px rgba(185, 72, 98, 0.3)` |

---

## Mapeamento no app

| elemento | tokens usados |
|---|---|
| body + container | `canvas` |
| header default | `surface-default` + `ceci-border-subtle` |
| card `.journal-card` | `surface-default` + border-brand-soft + shadow-sm |
| card hover | shadow-md + border-default |
| botão primário (CTA) | `ceci-brand-strong` bg + `ceci-ink` text |
| botão secundário | `surface-default` + `ceci-border-default` |
| pill ativa (sub-tab) | `ceci-brand-strong` bg + branco text |
| badge brand | `surface-rose` bg + `border-brand` + `ceci-brand-strong` text |
| bookmark ativo | `surface-rose` bg + `border-brand` + `ceci-brand-strong` + icon fill |
| input underline | `ceci-border-default` / `ceci-brand-strong` focus |
| progress bar brand | `ceci-brand` fill + `ceci-brand-soft` track |
| sheet/modal overlay | `rgba(0,0,0,0.4)` + backdrop-blur |
| toast brand | `ceci-brand-strong` bg + branco text |
| sticker desbloqueado glow | `shadow-brand` |
| confete celebrate | tons de `ceci-brand` + `ceci-brand-strong` |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#40383A` sobre canvas `#FFFCF8` | ~12:1 | ✅ AAA |
| primary sobre white | ~10:1 | ✅ AAA |
| secondary sobre canvas | ~5.5:1 | ✅ AA |
| brand-strong sobre white | ~4.8:1 | ✅ AA |
| muted sobre canvas | ~3.2:1 | ⚠️ AA apenas para textos grandes (>18px) |
| brand sobre canvas (texto) | ~3.0:1 | ⚠️ usar apenas p/ decorativo |

---

## Derivados automáticos (calculados no applyTheme)

| token derivado | fórmula | exemplo |
|---|---|---|
| `surface-rose` | brand com alpha 8% | `rgba(216, 95, 121, 0.08)` → usado em bg de seções brand |
| `ceci-border-brand` | brand com alpha 20% | `rgba(216, 95, 121, 0.20)` → borda brand |
| `ceci-brand-soft` | brand com alpha 25% | `rgba(216, 95, 121, 0.25)` → hover suave |
| `surface-blue` | academic com alpha ~6% | `rgba(74, 135, 159, 0.06)` → seção acadêmica |

---

## Comportamento especial

- **ChartTheme (dither-charts):** `light`
- **Transição CSS:** 350ms suave entre tokens
- **É o default:** rollout de schema sempre cai aqui se `themeId` ausente
- **Haptics ao trocar:** `hapticSuccess()` (ceci-haptics)
- **Cor do ano/estação:** nenhuma — é a base, sempre a mesma

---

## Notas de implementação

- Nenhum token é omitido — todos os 20 estão preenchidos
- Sombras mantêm temperatura marrom (padrão não-dark)
- `surface-rose` e `ceci-border-brand` são calculados, não hardcoded — quando o tema mudar, eles se adaptam
- Transição entre temas: adicionar classe `theme-transitioning` no `<html>` por 400ms

---

## Copy de apresentação (para o picker)

> **rosa-claro** ♡  
> o cantinho de sempre — warmth, acolhimento e o rosa que é a marca da ceci