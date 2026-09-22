# cecistudy Desktop — Sistema de Design

> Documento 3 de 4. Fonte: `desktop/cecistudy-desktop-shell.json` (design system v1,
> aprovado com o dono do produto), `desktop/LAYOUT-SPEC.md` e `desktop/spec/SPEC-VISUAL-01/02`.
> Esta NÃO é uma proposta nova — é a direção visual já decidida e parcialmente implementada
> (shell, navegação e faculdade já refeitos; calendário, conhecimento, marketing, projetos
> e inbox ainda pendentes de refino visual).

---

## 1. Direção visual (decisão fechada)

**Referência:** Notion — estrutura, contenção e hierarquia — combinado com o calor seletivo
herdado da identidade mobile do cecistudy. Não é um redesign de identidade nova.

Decisões confirmadas com o dono do produto:

- `liquid-glass` (blur/saturate) fica **fora** por enquanto.
- Radius fica parecido com o mobile, mas ajustado (teto menor, referência Notion).
- `cute-badge` pode aparecer no desktop, **sem** o bounce de toque do mobile.
- **Rosa nunca é fundo de painel/seção** — só acento, seleção e foco.
- `paper-texture` fora — prioridade é aparência limpa.
- Microcopy calorosa/emoji mantida em estado vazio, onboarding e situações afetivas
  pontuais (não em zonas de produção pesada).

## 2. Onde o calor mobile entra (e onde não entra)

| Zona | Vocabulário |
|---|---|
| Home (primeira tela do dia, baixa densidade) | Caloroso — saudação variável por hora, emoji com moderação |
| Empty states, onboarding, toasts afetivos | Caloroso |
| Editor, Grafo, Calendário (produção pesada) | Vocabulário Notion puro — sem calor |

## 3. Tokens de cor

### Superfícies
| Token | Valor | Uso |
|---|---|---|
| `surface.canvas` | `#FFFFFF` | Fundo do WorkspaceCanvas — branco puro, não o bege do documento original |
| `surface.sidebar` | `#F7F6F4` | ~2% de luminosidade abaixo do canvas — separa zona sem virar bloco pesado |
| `surface.surfaceRaised` | `#FFFFFF` | Popovers, dropdowns, command palette |
| `surface.inspector` | `#FBFAF9` | Quase idêntico ao canvas — diferença só em uso prolongado |

### Texto
| Token | Hex |
|---|---|
| `text.primary` | `#40383A` |
| `text.secondary` | `#6D6366` |
| `text.tertiary` | `#918689` |
| `text.muted` | `#ADA3A5` |

### Bordas
| Token | Hex |
|---|---|
| `border.subtle` | `#EEEBE7` |
| `border.default` | `#E4DFD9` |
| `border.strong` | `#D6CFC5` |
| `border.focus` | `#D85F79` (= accent) |

### Acento (regra crítica: nunca fundo de painel/seção inteira)
| Token | Hex | Uso |
|---|---|---|
| `accent.default` | `#D85F79` | Ação primária, seleção, foco, ícones de destaque |
| `accent.strong` | `#B94862` | Hover/texto sobre fundo de acento suave |
| `accent.subtle` | `#FBEEF1` | Fundo de item ativo na sidebar, fundo de badge rosa |

### Info e status
| Token | Hex |
|---|---|
| `info.default` | `#4A879F` |
| `info.subtle` | `#EEF5F8` |
| `status.success` | `#5A9F76` |
| `status.warning` | `#BD913C` |
| `status.danger` | `#C5665E` |

### Identidade por domínio (cor aparece só como dot, barra lateral 3px, ou badge — nunca
fundo de painel inteiro)
| Domínio | Cor |
|---|---|
| Base de Conhecimento | azul (`--color-ceci-academic`) |
| Calendário genérico | bege |
| TCC/Projetos | rosa (`--color-ceci-brand`) |
| Marketing | amarelo |
| Estudos | verde |
| Google Calendar externo | neutro tracejado (border dashed) |

## 4. Tipografia

| Família | Fonte |
|---|---|
| sans | Inter, ui-sans-serif, system-ui |
| display | Plus Jakarta Sans, Inter |
| mono | JetBrains Mono, ui-monospace |

| Papel | Fonte | Tamanho | Peso | Uso |
|---|---|---|---|---|
| display | display | 22px | 600 | Título de página — único lugar reservado à Plus Jakarta Sans no desktop |
| heading | sans | 16px | 500 | Título de seção/painel |
| subheading | sans | 14px | 500 | Título de card, label de grupo na sidebar |
| body | sans | 14px | 400 | Texto de conteúdo padrão |
| bodySm | sans | 13px | 400 | Texto secundário, descrições |
| caption | sans | 12px | 400 | Metadados, timestamps |
| label | sans | 11px | 500, uppercase, letter-spacing 0.06em | Headers de coluna, categorias |
| mono | mono | 12px | 400 | Revisões, IDs, hashes |

## 5. Espaçamento, radius e elevação

**Spacing:** `space1=4px · space2=8px · space3=12px · space4=16px · space6=24px · space8=32px · space12=48px`

**Radius (teto do sistema é 20px — nunca ultrapassa):**
| Token | Valor | Uso |
|---|---|---|
| xs | 6px | Inputs pequenos, badges, chips |
| sm | 8px | Botões, campos de formulário |
| md | 10px | Cards de item em lista, popovers pequenos |
| lg | 16px | Painéis, modais, cards de conteúdo padrão |
| xl | 20px | Cards maiores/hero da Home — teto absoluto |

**Elevação:** borda é o separador primário entre zonas fixas do shell; sombra só em
elementos flutuantes.
| Token | Valor | Uso |
|---|---|---|
| xs | `0 1px 2px rgba(40,32,34,.04)` | Hover sutil em item de lista |
| sm | `0 2px 6px rgba(40,32,34,.06)` | Popover, dropdown, tooltip |
| md | `0 8px 24px rgba(40,32,34,.10)` | Command palette, modal |

## 6. Componentes do shell (especificação exata)

| Componente | Especificação |
|---|---|
| **Title bar** | 44px altura (padrão Notion/macOS), fundo `surface.canvas`, sem borda inferior |
| **Sidebar** | 240px largura, fundo `surface.sidebar`, borda direita 1px `border.default`; item default texto secundário, radius sm, padding 6px 8px; hover `rgba(0,0,0,.03)`; ativo fundo `accent.subtle` + texto/ícone `accent.strong` — **nunca fundo rosa sólido**; grupos: Home, Base de Conhecimento, Calendário, Projetos/TCC, Estudos, Marketing |
| **Workspace Switcher** | Topo da sidebar, dropdown discreto, sem borda visível até hover |
| **Workspace Canvas** | Fundo `surface.canvas`; tabs de documentos 36px no topo; padding lateral `space8` |
| **Context Inspector** | 320px, fundo `surface.inspector`, borda esquerda 1px, colapsável para `w-10`, sempre secundário — nunca compete visualmente com o canvas |
| **Command Palette** | Trigger ⌘K/Ctrl+K; acelerador secundário — **não substitui a sidebar**; overlay `rgba(40,32,34,.15)` sem blur pesado; painel 560px, radius lg, `elevation.md`; input sem borda lateral, só border-bottom; resultados agrupados por domínio (Documentos, Eventos, Projetos, Comandos) com label caption uppercase |
| **Status bar** | 28px, fundo `surface.sidebar`, borda superior; texto caption — indexação, sincronização, provider; cor só via dot de status (6px, verde/amarelo/vermelho) |

## 7. Home desktop (onde o calor entra)

- **Saudação:** tom caloroso, pessoal, varia por hora do dia — ex. "Bom dia, Ceci ☀️" —
  fonte `typography.display`.
- **Subtítulo:** direto, funcional — resumo do dia (X eventos, Y tarefas pendentes).
- **Quick stats:** grid 3-4 colunas, radius xl, elevation xs, borda subtle — métricas
  rápidas (progresso do TCC, eventos da semana, itens pendentes).
- **Recent items** (`G4`, ainda não implementado): lista/grid compacto, radius lg.
- **Module shortcuts:** grid de atalhos por domínio, radius xl, cor de identidade **só**
  como barra lateral 3px — nunca fundo do card inteiro.

## 8. Componentes especiais

**`cute-badge` no desktop:** permitido, mas sem a animação de bounce/scale do mobile.
Forma pill (radius 9999px), padding 4px 12px, fontSize 12px, weight 600; hover só muda cor
de fundo, sem transform.

**Empty state:** tom caloroso, pode usar emoji com moderação — ex.: "Nada por aqui ainda ✨
Que tal criar seu primeiro documento?"

## 9. Explicitamente fora do vocabulário desktop

- `liquid-glass-*` (backdrop-filter blur/saturate)
- `paper-texture` decorativo de fundo
- `press-card`/`press-btn` com scale bounce (linguagem tátil, sem sentido com mouse/teclado)
- Radius acima de 20px em qualquer superfície
- Rosa como fundo de painel ou seção inteira
- `shadow-floating`, `shadow-brand`, `shadow-brand-soft`

## 10. Explicitamente permitido no desktop

- `cute-badge` (sem bounce)
- Microcopy calorosa e emoji em: empty state, onboarding, saudação da Home, toasts afetivos
- Radius até 20px em cards de conteúdo maior (Home, hero cards)

## 11. Estado de execução do refino visual

| Módulo | Status |
|---|---|
| Shell (sidebar/topbar/statusbar/overlays) | ✅ Implementado — tokens, sidebar com estados/badges, busca única ⌘K, breadcrumb, popover de preferências, `WorkspaceSwitcher`/`Panel`/`StatusBadge`, statusbar. Gates verdes (lint, test, build, boundary, sem hex solto em classe). **Aguarda revisão manual e aprovação final.** |
| Navegação (transições) | ✅ Implementado junto do shell — `computeDesktopSlideKey`, crossfade + micro-subida, curva `[0.22,1,0.36,1]`, respeita `prefers-reduced-motion` |
| Faculdade (master-detail) | ✅ Implementado — card ativo neutro + accent rosa pontual, metadata compacta, hover/focus por tokens. **Aguarda aprovação.** |
| Calendário | ⬜ Pendente |
| Conhecimento (grafo) | ⬜ Pendente |
| Marketing | ⬜ Pendente (bloqueado — módulo de domínio ainda não existe) |
| Projetos/Inbox | ⬜ Pendente |

## 12. Regra de ouro para qualquer novo trabalho visual

1. Nunca alterar arquivo de domínio, use-case ou estado para "resolver" um problema visual.
2. Sempre herdar os tokens desta seção — exceções pontuais por módulo só quando
   justificadas e documentadas no spec daquele módulo.
3. Cada slice de refino termina com gate verde: `npm run lint`, `npm run test`,
   `npm run build`, `check-boundaries.mjs` (quando toca `src/shells` ou `src/desktop`), e
   verificação manual do app desktop rodando.
