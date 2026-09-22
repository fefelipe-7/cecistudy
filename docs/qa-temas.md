# QA dos temas — checklist de smoke (TEM-001 E.2)

> Verificação visual manual dos **6 temas** (`rosa-claro`, `oceano`, `amanhecer`,
> `noturno`, `mar-profundo`, `neon`) nas telas principais. Rodar em `npm run dev`
> (web) e idealmente uma passada no app nativo (StatusBar). Registrar aqui por tema
> qualquer achado de contraste/quebra.

## Como testar

1. Perfil → aparência → "trocar a pele do cantinho ♡" → escolher o tema (aplicação imediata + transição).
2. Percorrer a checklist abaixo em **cada um dos 6 temas**.
3. Registrar achados na seção correspondente ao tema (ou ondulação geral no fim).

## Checklist por tela

- **Home:** saudações, meta do dia, cards de atenção/ritmo — sem hex estranho fora do tema.
- **Faculdade:** grade de disciplinas, curso (header detail + anotação de aula + wizard 5 passos).
- **Estudos:** timer de foco (imersão landscape no nativo), sessões, leitor (`ReaderModeModal`:
  papel/sépia/noturno **fixos** — não devem mudar com o tema do app).
- **Biblioteca:** capas de livros (bg `white/xx` sobre capa é intencional), notas, templo
  (conceitos/autores/técnicas), quiz (categories → play → result).
- **Perfil:** métricas, funil/gráficos (dither charts dark = paleta do tema), stickers, aparência
  (o próprio picker), dados (wizards de export/import).
- **Calendário/agenda do Google:** eventos, provas/tarefas sem data.
- **Chrome:** `meta[name=theme-color]` atualiza; **native**: StatusBar clara em temas dark
  (`themeChrome.ts`), restaurada ao sair do foco pelo tema ativo (`focusOrientation.ts`).

## Achados por tema

| Tema | Claro/escuro | Achados |
|---|---|---|
| `rosa-claro` · cantinho 🌷 | claro | — |
| `oceano` · calmaria azul 🌊 | claro | — |
| `amanhecer` · energia coral 🌅 | claro | — |
| `noturno` · cantinho aceso 🌙 | escuro | — |
| `mar-profundo` · profundeza azul 🐋 | escuro | — |
| `neon` · néon vibrante ⚡ | escuro | — |

## Ondulações gerais

- Bull: `bg-ceci-primary` + `text-white` em qualquer lugar é **bug** (deve ser `text-ceci-on-primary/on-brand`).
- Botões `bg-rose-500`/`bg-blue-500` são tokens de escala fixa (não mudam); ok se ficarem legíveis.
- Em dark: qualquer card "preto puro" (`#0A0A0A`/`neutral-900`) fora dos gráficos é regressão.
- U+FFFD (�) em qualquer texto = corrupção de edit; checar `rg '�' src`.