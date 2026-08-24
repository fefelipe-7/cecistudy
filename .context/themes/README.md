# Catálogo de Temas — cecistudy ♡

> Índice dos 10 temas especificados. Cada arquivo contém a ficha completa: paleta, sombras, mapeamento no app, contraste WCAG, derivados e copy de apresentação.

---

## Os 10 temas

| # | ID | Nome | Emoji | Atmosfera |
|---|---|---|---|---|
| 1 | `rosa-claro` | rosa-claro | ♡ | warmth cozy, cantinho afetuoso (atual/default) |
| 2 | `noturno` | noturno | 🌙 | dark legível, foco noturno |
| 3 | `amanhecer` | amanhecer | 🌅 | quente, energia nova, otimismo |
| 4 | `oceano` | oceano | 🌊 | calma, profundidade, serenidade |
| 5 | `jardim` | jardim | 🌿 | natureza, crescimento, frescor |
| 6 | `biblioteca` | biblioteca | 📚 | vintage, erudição, papel envelhecido |
| 7 | `por-do-sol` | por-do-sol | 🌇 | dramático, cozy, entardecer |
| 8 | `nebulosa` | nebulosa | 🫥 | cósmica, introspectiva, serena |
| 9 | `cerâmica` | cerâmica | 🏺 | artesanal, orgânico, texturizado |
| 10 | `neon` | neon | 🎇 | noturno vibrante, sintético, energia |

---

## Estrutura de cada arquivo

Cada documento (`0X-nome.md`) contém:

1. **Atmosfera** — conceito, sentimento, quando usar
2. **Paleta completa** — tabela dos 20 tokens com valores hex/rgba
3. **Sombras** — temperatura e valores para os 9 níveis
4. **Mapeamento no app** — onde cada token é usado em componentes reais
5. **Contraste acessível** — WCAG AA/AAA por combinação principal
6. **Derivados automáticos** — tokens calculados no applyTheme()
7. **Comportamento especial** — flags (`isDark`, `ChartTheme`), texturas, gradientes opcionais
8. **Relação com outros temas** — pontos de comparação
9. **Copy de apresentação** — texto curto para o picker de temas

---

## Como usar este documento

Para implementar:
1. Ler **`themes.md`** (pasta pai) para arquitetura, tipos e ordem de implementação
2. Usar cada `0X-nome.md` como fonte de verdade dos valores de tokens
3. Seguir a ordem do `themes.md` (seção 5): sombras primeiro, depois `themes.ts`, testes, types, contexto, UI

Arquivo de referência arquitetural: [../themes.md](../themes.md)