# Separação de Interface — Visão Geral

> Pasta de planejamento para separar **desktop** e **mobile** em clientes independentes,
> mantendo apenas o núcleo de dados compartilhado.
> Origem: `desktop/split-mobile.md` (proposta arquitetural) reconciliada com o
> estado real auditado em `src/` (ago/2026).

## Por que esta pasta existe

O `split-mobile.md` propõe o alvo correto:

> **Desktop e mobile compartilham o núcleo de dados, mas são clientes independentes.
> Nenhum cliente importa telas, navegação, provider ou estado de apresentação do outro.**

Hoje ainda não é assim. `src/App.tsx:18` escolhe a shell em runtime via `isDesktop`
(`src/lib/platform.ts:32`), mas **as duas shells caem no mesmo bundle** e consomem o
mesmo `AppContext` (`src/context/AppContext.tsx` ~1800 linhas), os mesmos `ScreenLayers`
(`src/shells/ScreenLayers.tsx`) e os mesmos `GlobalOverlays`
(`src/shells/GlobalOverlays.tsx`). O Tauri empacota `../../dist` (`desktop/src-tauri/tauri.conf.json`),
ou seja, todo `src/components/` acaba no instalador desktop mesmo quando a mudança foi
pensada só para mobile — e vice-versa.

Esta pasta transforma a proposta em **plano executável, incremental e reversível**,
sem quebrar o app.

## O que há nesta pasta

| Arquivo | Papel |
|---|---|
| `01-diagnostico-atual.md` | Inventário do acoplamento real (o que quebra o isolamento) |
| `02-fronteiras-e-contratos.md` | O que **deve** ser compartilhado vs. separado (contratos estáveis) |
| `03-plano-incremental.md` | 10 etapas ordenadas, cada uma com entrada/saída/verificação — nenhuma quebra o app |
| `04-regras-e-guardrails.md` | Regras automatizadas que impedem regressão (imports, builds, testes) |
| `05-criterios-de-aceite.md` | Como saber que a separação está concluída (testes de aceitação) |
| `06-riscos-e-mitgacoes.md` | Riscos e mitigação (rollback, dados, sync, Tauri/Capacitor) |

## Princípio norteador

```
Compartilhar dados ≠ compartilhar aplicação
Compartilhar domínio ≠ compartilhar estado de UI/navegação
Sincronizar dados ≠ sincronizar pilha de navegação, painéis ou viewport
```

O isolamento deve vir **antes** do editor paginado, do calendário semanal e do
Marketing Studio. Se esses módulos forem construídos dentro do `AppContext`/`ScreenLayers`
atuais, o custo de separação só aumenta.

## Leitura recomendada (ordem)

1. `01-diagnostico` → entenda o custo atual
2. `02-fronteiras` → memorize o contrato que não pode vazar
3. `03-plano` → execute fase a fase
4. `04-guardrails` → trave o que foi isolado
5. `05-aceite` / `06-riscos` → valide e mitigue

## Relação com `PLANO-IMPLEMENTACAO.md`

O `PLANO-IMPLEMENTACAO.md` (F0–F12) permanece válido para **conteúdo** (Documents,
Graph, Calendário, TCC, Marketing, Sync). Esta pasta complementa o **como**:
quando, onde e com que guardrails o `DesktopAppShell`/`MobileAppShell` deixam de
compartilhar bundle, provider e navegação. A regra é:

- **F0–F3** (backup, domain core, workspaceId, sessão) → podem andar em paralelo
- **Separação de interface** → deve entrar entre **F3 e F5** (antes de Documents & Blocks)
- **F5+** (editor, Graph, calendário, TCC, Marketing, sync engine) → só depois que
  a fronteira `apps/*` vs `packages/*` estiver travada por lint/CI

## Referências

- `desktop/split-mobile.md` — proposta original
- `desktop/context-desktop/PLANO-IMPLEMENTACAO.md` — plano mestre de produto
- `src/App.tsx` — entrypoint atual com `isDesktop`
- `src/context/AppContext.tsx` — provider universal a ser quebrado
- `src/shells/ScreenLayers.tsx` + `GlobalOverlays.tsx` — pontes acidentais entre clientes
- `src/types.ts` — mistura de domínio + navegação + sessão
- `desktop/src-tauri/tauri.conf.json` — `frontendDist: ../../dist` (bundle compartilhado)
