# Spec: HAR-001 — Remover Hardcoded

## Objective
Eliminar elementos hardcoded (cores hex, dados literais, strings, constantes) espalhados pelo código e substituí-los por dados em arquivos de dados ou tokens do design system. Separar dados de tela para que views consumam dados reais quando necessário.

## Scope

### Categorias de hardcoded a eliminar

#### 1. Cores hex em classNames (`src/components/`)
| Padrão | Substitução |
|---|---|
| `text-[#40383A]` | `text-ceci-primary` |
| `bg-[#FFF5F7]` | `bg-surface-rose` |
| `border-[#FFD3DD]` | `border-brand` |
| `border-[#E9DFDC]` | `border-default` |
| `bg-[#FFF8F1]` | `bg-surface-subtle` |
| `bg-[#FAF8F5]` | `bg-surface-muted` |
| `text-[#6D6366]` | `text-ceci-secondary` |
| `text-[#918689]` | `text-ceci-tertiary` |
| `text-[#ADA3A5]` | `text-ceci-muted` |
| `bg-[#40383A]` | `bg-ceci-primary` |
| `bg-[#D85F79]` | `bg-ceci-brand` |
| `text-[#B94862]` | `text-brand-strong` |
| `shadow-[0_2px_8px_rgba(64,56,58,0.05)]` | `shadow-xs` |
| `shadow-[0_8px_28px_rgba(64,56,58,0.12)]` | `shadow-floating` |
| `rounded-[24px]` | `rounded-2xl` |
| `rounded-[20px]` | `rounded-xl` |
| `text-[#E97891]` | `text-brand` |
| `text-[#396D82]` | `text-academic-strong` |
| `bg-[#F3F9FC]` | `bg-surface-blue` |
| `border-[#CEE7F0]` | `border-academic` |
| `text-[#8BC7A2]` | `text-green-400` |
| `text-[#43805B]` | `text-green-700` |
| `text-[#E89189]` | `text-red-400` |
| `text-[#A8514B]` | `text-red-700` |
| `bg-[#FCE4A8]` | `bg-yellow-200` |
| `text-[#BD913C]` | `text-yellow-600` |
| `text-[#C2E8D0]` | `text-green-200` |
| `text-[#FFB8C7]` | `text-rose-300` |
| `text-[#756354]` | `text-beige-700` |
| `text-[#4A879F]` | `text-academic` |

> **Nota:** Hex como **dados** (`course.color`, `coverColor`, `style={{ backgroundColor }}`) devem permanecer — são valores dinâmicos, não tokens de UI.

#### 2. Dados literais em views (`src/components/views/`)
| Arquivo | Dado hardcoded | Substitução |
|---|---|---|
| `HomeView.tsx` | `DUE_STYLES` (map de cores por urgência) | Mover para `src/lib/homeMeta.ts` ou usar tokens |
| `HomeView.tsx` | `ATTENTION_LIMIT = 5` | Constante em `src/lib/homeMeta.ts` |
| `HomeView.tsx` | Textos motivacionais hardcoded | Mover para `src/lib/tips.ts` (já existe `pickTip`) |
| `PerfilView.tsx` | `getJourneyReflection` (textos de semestre) | Mover para `src/lib/copy.ts` ou `src/lib/profileMeta.ts` |
| `PerfilView.tsx` | `CHART_PASTELS` (cores do gráfico) | Já em `src/lib/ditherChart.ts` — OK |
| `FaculdadeView.tsx` | Dados dummy de aulas/avaliações | Derivar do estado via `useApp()` |
| `NoteTransformWizard.tsx` | Textos de placeholder/help | Mover para `src/lib/wizardCopy.ts` |
| `BibliotecaView.tsx` | Filtros hardcoded | Já usa dados de `libraryData.ts` — OK |

#### 3. Strings e copy hardcoded
| Localização | Padrão | Ação |
|---|---|---|
| Vários componentes | Textos de UI em JSX literais | Mover para `src/lib/copy.ts` ou arquivo de copy por módulo |
| `PerfilView.tsx` | `getJourneyReflection()` | Extrair para `src/lib/profileMeta.ts` |
| `HomeView.tsx` | `getDailyGoalMessage()`, `getGreeting()` | Já em `src/lib/homeMeta.ts` — OK |
| `src/lib/celebrate.ts` | Textos de confete | Já em copy — OK |

#### 4. Constantes e configurações
| Localização | Padrão | Ação |
|---|---|---|
| `src/components/ui/` | Valores de layout hardcoded | Mover para `src/lib/constants.ts` |
| `src/lib/streak.ts` | Constantes de streak | Já em lib — OK |
| `src/lib/schedule.ts` | Constantes de schedule | Já em lib — OK |
| `src/components/views/HomeView.tsx` | `DUE_STYLES` | Mover para `src/lib/homeMeta.ts` |

## Tech Stack
Mesmo stack do projeto. Sem novas dependências.

## Commands
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Dev: `npm run dev`

## Project Structure (novos/alterados arquivos)

```
src/
  lib/
    homeMeta.ts                     ← já existe (getDailyGoalMessage, getGreeting, DUE_STYLES)
    profileMeta.ts                  ← NOVO: getJourneyReflection + textos de semestre
    copy.ts                         ← NOVO: central de copy da UI (strings hardcoded → dados)
    constants.ts                    ← NOVO: constantes de layout/UI
    wizardCopy.ts                   ← NOVO: strings do NoteTransformWizard
    data/
      psicoterapia/                 ← (do MOD-001)
  components/
    views/
      HomeView.tsx                  ← sem DUE_STYLES, sem ATTENTION_LIMIT literals
      PerfilView.tsx                ← sem getJourneyReflection inline
      FaculdadeView.tsx             ← sem dados dummy
```

## Code Style
- Textos de UI: pt-BR minúsculo, conforme `copy-and-voice.md`.
- Constantes numéricas: nome descritivo, em `src/lib/constants.ts`.
- Cores: sempre tokens semânticos (`ceci-*`, `surface-*`, `border-*`, `brand-*`, etc.).
- Hex como dado (ex.: `course.color`): permanece em `style={{}}`, sem alteração.
- Copy por módulo: `src/lib/copy/home.ts`, `src/lib/copy/perfil.ts`, etc., ou um `src/lib/copy.ts` central.

## Testing Strategy
- Testes existentes: verificar que nenhum comportamento muda.
- Novos testes: `src/lib/__tests__/copy.test.ts` (verificar todos os textos extraídos).
- `src/lib/__tests__/homeMeta.test.ts` (DUE_STYLES, constantes).
- `src/lib/__tests__/profileMeta.test.ts` (getJourneyReflection).
- `npm run lint` + `npm run test` + `npm run build` verdes após cada incremento.

## Boundaries
- **Always:** Substituir hex em classNames por tokens; mover dados literais para arquivos de dados.
- **Ask first:** Mudar a estrutura de `src/lib/copy.ts` se há muitos textos.
- **Never:** Alterar comportamento visual — só substituir token por token equivalente.
- **Never:** Hex em `style={{}}` de dados dinâmicos (course.color, coverColor).
- **Never:** Criar novos arquivos de dados que duplicuem `types.ts`.

## Success Criteria
1. Zero ocorrências de `text-[#`, `bg-[#`, `border-[#` em classNames de `src/` (exceto hex em `style={{}}`).
2. Zero ocorrências de `rounded-[24px]` → `rounded-2xl`, `rounded-[20px]` → `rounded-xl`.
3. `shadow-[0_2px_8px_rgba(64,56,58,0.05)]` → `shadow-xs`, `shadow-[0_8px_28px_rgba(64,56,58,0.12)]` → `shadow-floating`.
4. `DUE_STYLES` e `ATTENTION_LIMIT` extratos de `HomeView.tsx`.
5. `getJourneyReflection` extratado de `PerfilView.tsx`.
6. Textos de UI movidos para `src/lib/copy.ts`.
7. Dados dummy em `FaculdadeView.tsx` derivados do estado.
8. Todos os 480 testes passam.
9. `npm run build` verde.
10. `npm run lint` verde.

## Open Questions
- `copy.ts` será um arquivo único ou dividido por módulo (`copy/home.ts`, `copy/perfil.ts`)?
  → Decisão: começar com `src/lib/copy.ts` central; dividir se passar de 300 linhas.
- Dados dummy de `FaculdadeView.tsx` — derivar do estado real ou manter como dados de seed?
  → Decisão: derivar do estado via `useApp()` (o app nasce zerado, mas os dados devem vir do estado, não de literais).
- O script de migração de tokens (`/tmp/opencode/migrate-tokens.mjs`) pode ser reutilizado?
  → Decisão: não — migração já feita na Fase 8-A. Restam apenas os poucos hex que escaparam.

## Dependencies
- Independente de MOD-001 e SEP-001, mas ambos se beneficiam.
- Requer o design system já ter todos os tokens necessários (Fase 8-A já adicionou os órfãos).
