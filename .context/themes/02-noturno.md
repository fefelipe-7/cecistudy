# noturno — Tema 2/10

> **Dark legível para estudo noturno.** Conforto sem cegar, brand rosa suave.

---

## Atmosfera

O tema para quando a Ceci está estudando de noite no sofá, ou na cama com o celular no mínimo brilho. Não é um dark "hacker" agressivo — é pensado para **leitura prolongada sem fadiga**. Fundo quase-preto marfim, textos em cream invertido, brand rosa pastel para assinalar ações sem branquear os olhos.

**Sentido:** calma, foco, recolhimento.

---

## Paleta completa

| grupo | token | valor | uso |
|---|---|---|---|
| fundo | `canvas` | `#161214` | body, container principal |
| | `surface-default` | `#221E20` | cards, modais, bottom-nav |
| | `surface-subtle` | `#2A2628` | seções alternadas, hover de listas |
| | `surface-muted` | `#1E1B1C` | disabled, badges neutros |
| texto | `ceci-primary` | `#E8DFDB` | títulos, texto principal |
| | `ceci-secondary` | `#B5ADAB` | subtítulos, descrições |
| | `ceci-tertiary` | `#8A8385` | labels, metadados |
| | `ceci-muted` | `#6D6668` | timestamps, disabled |
| | `ceci-faded` | `#4E484A` | text muted extremo |
| | `ceci-ink` | `#F5F0EC` | texto sobre brand (botões dark) |
| marca | `ceci-brand` | `#E8919C` | ícone brand, badge, link |
| | `ceci-brand-strong` | `#D4728A` | botão primário, toggle on |
| | `ceci-brand-soft` | `#F2B8C4` | hover brand, progress brand |
| | `ceci-brand-hover` | `#C25E76` | hover brand-strong, active fab |
| acadêmico | `ceci-academic` | `#8FC5D4` | accent azul, ícone academic |
| | `ceci-academic-strong` | `#6BAABB` | botão secondary academic |
| bordas | `ceci-border-subtle` | `#2E2A2C` | separador interno sutil |
| | `ceci-border-default` | `#3A3538` | borda de card default |
| | `ceci-border-strong` | `#4A4548` | borda de input focado |
| | `ceci-border-brand` | `rgba(232, 145, 156, 0.25)` | card selecionado, borda brand |
| | `ceci-border-academic` | `rgba(143, 197, 212, 0.25)` | borda academic, filtro ativo |

---

## Sombras (dark mode)

Temperatura preta pura — sem o matiz marrom do modo claro:

| token | valor |
|---|---|
| `shadow-xs` | `0 1px 2px rgba(0, 0, 0, 0.15)` |
| `shadow-sm` | `0 2px 8px rgba(0, 0, 0, 0.20)` |
| `shadow-md` | `0 6px 18px rgba(0, 0, 0, 0.28)` |
| `shadow-lg` | `0 12px 32px rgba(0, 0, 0, 0.35)` |
| `shadow-xl` | `0 20px 48px rgba(0, 0, 0, 0.45)` |
| `shadow-floating` | `0 8px 28px rgba(0, 0, 0, 0.40)` |
| `shadow-floating-strong` | `0 8px 28px rgba(0, 0, 0, 0.55)` |
| `shadow-brand` | `0 4px 16px rgba(232, 145, 156, 0.35)` |
| `shadow-brand-soft` | `0 4px 14px rgba(232, 145, 156, 0.25)` |

---

## Mapeamento no app

| elemento | tokens usados |
|---|---|
| body + container | `canvas` `#161214` |
| card `.journal-card` | `surface-default` + `border-default` + shadow-sm |
| card hover | `surface-subtle` bg + shadow-md |
| botão primário | `ceci-brand-strong` bg + `ceci-ink` text |
| botão secondary | `surface-default` + `ceci-border-default` |
| pill ativa | `ceci-brand-strong` bg + branco text |
| badge brand | `surface-subtle` bg + `border-brand` + `ceci-brand` text |
| bookmark ativo | `surface-subtle` bg + `border-brand` + `ceci-brand` icon |
| input | `surface-muted` bg + `border-default` / `border-strong` focus |
| modal overlay | `rgba(0,0,0,0.65)` + backdrop-blur (mais opaco que o claro) |
| toast | `surface-default` + `ceci-border-default` |
| bottom nav | `surface-default` + `border-subtle` top |
| header | `surface-default` + `border-subtle` bottom |

---

## Contraste acessível (WCAG AA)

| combinação | ratio | status |
|---|---|---|
| primary `#E8DFDB` sobre canvas `#161214` | ~11.8:1 | ✅ AAA |
| brand-strong `#D4728A` sobre canvas | ~6.5:1 | ✅ AAA para botões |
| secondary sobre canvas | ~5.8:1 | ✅ AA |
| tertiary sobre canvas | ~3.8:1 | ⚠️ AA para textos grandes |
| muted `#6D6668` sobre `surface-default` | ~3.5:1 | ⚠️ AA apenas p/ textos grandes |

---

## Derivados automáticos

| token derivado | fórmula | exemplo resultado |
|---|---|---|
| `surface-rose` | brand @ 8% | `rgba(232, 145, 156, 0.08)` |
| `ceci-border-brand` | brand @ 25% | `rgba(232, 145, 156, 0.25)` (já definido manualmente) |
| `ceci-brand-soft` | brand @ 25% | `rgba(232, 145, 156, 0.25)` |
| `surface-blue` | academic @ 6% | `rgba(143, 197, 212, 0.06)` |

---

## Comportamento especial

- **ChartTheme:** `dark` — dither-charts usam paleta invertida
- **`isDark = true`**
- **Status bar nativa:** ícones claros (`StatusBar` — já é default no Capacitor, mas garantir)
- **Transição:** mesma 350ms, mas cuidado com `backdrop-blur` em overlay (mais opaco)
- **Brilho mínimo (web):** considerar `prefers-color-scheme: dark` como hint, não como source of truth — o usuário escolhe explicitamente
- **Eye-care:** evitar brand muito saturada à noite; o rosa `#E8919C` é propositalmente pastel

---

## Notas de implementação

- Cards no dark devem ter `surface-default` (#221E20), não `surface-subtle` — isso garante hierarquia visual
- Inputs textuais: usar `surface-muted` (#1E1B1C) como bg para diferenciar do card
-Texto `ceci-ink` (#F5F0EC) é usado apenas sobre fundos brand/academic — não sobre canvas
- Se o sistema operacional estiver em dark mode, sugerir o tema noturno no onboarding (sem forçar)
- O `.paper-texture` (radial-gradient dots) pode ficar invisível no dark — considerar variante com dots mais claros ou desativar

---

## Copy de apresentação (para o picker)

> **noturno** 🌙  
> para estudar de noite sem cansar a vista — conforto, foco, silêncio