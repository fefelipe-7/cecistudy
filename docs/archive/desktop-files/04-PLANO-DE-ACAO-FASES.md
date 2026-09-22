# cecistudy Desktop — Plano de Ação por Fases

> Documento 4 de 4. Reconcilia: (a) o roadmap de arquitetura de domínio F0–F12
> (`PLANO-IMPLEMENTACAO.md`), (b) a reconstrução visual da apresentação já aprovada e em
> andamento (`REBUILD-DESKTOP-CAPABILITY-MAP.md`), e (c) o roadmap de funcionalidades por
> trilhas (`ROADMAP-FUNCIONALIDADES-DESKTOP.md`). É o documento para executar.

---

## 0. Como ler este plano

Existem **dois eixos de trabalho que rodam em paralelo, não em série**:

- **Eixo A — Arquitetura de domínio** (F0–F12): construir os módulos que ainda não existem
  (Documents/Blocks, Calendário como domínio, Marketing, Sync real). Este eixo é o que
  determina *o que o app faz*.
- **Eixo B — Refino visual da apresentação** (reconstrução aprovada em 2026-09-01): refazer
  a *aparência* de telas que já existem funcionalmente, sem tocar lógica. Este eixo é o que
  determina *como o app parece*.

Regra de sequenciamento entre os eixos: **o Eixo B só pode refinar visualmente um módulo
depois que o Eixo A tiver entregue o domínio daquele módulo.** Por isso Marketing está
bloqueado no Eixo B (F9 não existe ainda), e por isso Calendário como domínio (F7) deveria,
idealmente, vir antes do refino visual do calendário — ver recomendação na seção 4.

## 1. Princípios não negociáveis (guardrails)

- `AppContext` não recebe novas regras de negócio — vira facade de sessão/compatibilidade.
  Fluxo novo passa por caso de uso.
- Migração incremental e reversível; IDs estáveis; backup/restauração validados antes de
  mover dados.
- Design system único (tokens semânticos, sem hex solto), voz pt-BR, gates de
  lint/test/build antes de fechar qualquer fase ou slice.
- Refino visual nunca modifica arquivo de domínio, estado ou lógica de interação.
- Nenhum domínio novo é criado de forma impossível de sincronizar ou versionar depois.

## 2. Plano por fases — Eixo A (arquitetura de domínio)

### Fase 0 — Proteção e contratos ✅ concluída
Backup validado, round-trip testado, migração idempotente. Nenhuma ação necessária além de
manter os testes de `exportImport` vivos conforme novas entidades entram.

### Fase 1 — Domain Core independente de React ✅ concluída
`packages/domain` com tipos puros e invariantes testadas sem UI.

### Fase 2 — Ports, Repositories & Use Cases ✅ concluída
`packages/application`, `packages/contracts`. `AppContext` ganhou adapters.

### Fase 3 — Workspaces + `workspaceId` + sessão ✅ concluída
`DesktopSessionState` persistido; `WorkspaceSwitcher` funcional.

### Fase 4 — Shells próprios + matriz de capacidades ✅ base existente
**Ação pendente:** completar `StatusBar` (indexação/sync/provider) e finalizar
`ContextInspector` com ações contextuais reais (hoje é majoritariamente leitura).

### Fase 5 — Documents & Blocks (⬜ pendente — **próxima prioridade greenfield**)
**Por que agora:** é dependência direta de F7 (calendário rico), F8 (editor do TCC) e F9
(conteúdo-base do marketing). Adiar F5 trava três módulos ao mesmo tempo.

- Store de Document/Block (estender `useSqliteState` ou repositório novo).
- Editor básico — **Markdown-first** como fonte autoral inicial (não o editor paginado
  completo ainda); bloco como unidade atômica.
- Migrar `looseNotes`, `ClassNote`, `MaterialItem` para Document/Block preservando
  `legacySourceId` para rastreabilidade.
- **Critério de entrega (Marco A do roadmap):** a Ceci cria e reabre um documento dentro de
  um Workspace.

### Fase 6 — Busca local + Relations + Graph + Inbox ✅ concluída
Já entregue (Marco C parcial). Pendência menor: indexador de busca dedicado (hoje reusa
`GlobalSearchModal` genérico) — tratar como otimização, não bloqueador.

### Fase 7 — Calendário como domínio (⬜ pendente)
A UI de calendário já é a mais madura do desktop (drag/resize/snap, camadas, mês/semana/
agenda) — o trabalho aqui é **de baixo (domínio) para cima**, não de tela:

- Introduzir `Event`, `Responsibility`, `PlanningBlock`, `Occurrence`, `ExecutionRecord`,
  `RecurrenceRule`, `Subtask` como entidades de domínio.
- 4 níveis de compromisso: obrigatório, importante, recomendado, opcional. Só itens
  recomendados podem ser reservados por sugestão do sistema após aceitação; opcionais nunca
  geram cobrança.
- Migrar `Task`/`Exam` para `Responsibility`/`Event` preservando histórico.
- Google Calendar bidirecional: evento criado no cecistudy e sincronizado é editável dos
  dois lados; evento originado no Google é importado como somente leitura; uma
  responsabilidade local pode se associar a um evento externo sem assumir propriedade dos
  campos do Google.
- **Critério de entrega (Marco D):** a Ceci planeja e registra uma atividade na visão
  semanal, com o dado gravado no novo domínio (não mais em `Task`/`Exam` cru).

### Fase 8 — TCC & Projetos + editor acadêmico + DOCX 🟡 em andamento
Slice 1 (gestão de projeto/saída, limite de 5 ativos) já entregue. Próximos slices:

1. Editor de blocos paginado — **depende de F5 estar pronto**.
2. Árvore acadêmica configurável (modelos: monográfico, artigo, revisão, estudo de caso,
   relatório de estágio, estrutura livre).
3. Biblioteca de referências + citações ABNT.
4. Exportação DOCX.
5. Importação DOCX como versão candidata + comparação detalhada (nunca sobrescreve
   silenciosamente).
- **Critério de entrega (Marcos E, F):** a Ceci cria projeto, escreve saída principal,
  exporta DOCX, edita fora, reimporta e compara.

### Fase 9 — Marketing Studio (⬜ pendente — 100% greenfield)
- `PositioningProfile` → `Pillar`/`Objective`/`Audience` → `ContentIdea` → `ContentBase` →
  `ChannelVariant` (Instagram/TikTok/LinkedIn) → `Publication` → `MetricSnapshot` →
  `StrategicInsight`.
- Fluxo editorial: ideia → briefing → rascunho → revisão → aprovação individual por canal →
  agendamento → publicação → métricas → reaproveitamento.
- Publicação automática exige autorização por peça e canal; fluxo manual sempre disponível.
- Calendário editorial integrado ao Calendário unificado (depende de F7).
- **Critério de entrega (Marco G):** adaptar uma ideia para Instagram, TikTok e LinkedIn e
  aprovar publicação em pelo menos um canal.

### Fase 10 — Sync Protocol + Providers (⬜ pendente)
- `SyncPackage`/`SyncManifest` versionado (schema descrito no Documento 2, seção 6).
- Engine: `inspectRemote`, `checkRevision` (compare-and-swap), `createPackage`, `merge`,
  `preview`, `resolveConflict`, `apply`.
- `GitHubProvider` (reusa `SyncIndex`/stamps existentes) + `P2PProvider` (reaproveita
  `transport-bridge`/`pairing`/`scanQr`) + `BlobProvider` + criptografia.
- **Critério de entrega (Marcos H, I):** dois dispositivos trocam dados sem sobrescrever
  revisão nova.

### Fase 11 — Engines avançadas (⬜ pendente)
Context Engine + `KnowledgePacket` + `.cectx` (contexto compilado para IA, desligado por
padrão); `LearningState` multidimensional; relações semânticas como sugestão; análise de
impacto entre domínios.

### Fase 12 — Remoção do legado (⬜ pendente)
Remover progressivamente listas globais do `AppContext`; ele permanece só como facade de
sessão/compatibilidade.

## 3. Plano por slices — Eixo B (refino visual, em andamento)

Ordem já aprovada em `REBUILD-DESKTOP-CAPABILITY-MAP.md`:

```text
sessao (validar persistência já existente) ─┐
shell + navegacao (fundação) ───────────────┼→ faculdade → calendario → conhecimento/marketing → projetos/inbox
                                             │
                 (gate verde ao final de cada módulo)
```

| Ordem | Slice | Status |
|---:|---|---|
| 1 | Shell + navegação | ✅ Implementado — aguarda aprovação final |
| 2 | Faculdade (master-detail) | ✅ Implementado — aguarda aprovação final |
| 3 | Calendário | ⬜ Próximo — **recomendação: encadear com Fase 7 (Eixo A)**, ver seção 4 |
| 4 | Conhecimento + Marketing | ⬜ Conhecimento pode avançar (domínio já existe); Marketing bloqueado até Fase 9 |
| 5 | Projetos + Inbox | ⬜ Último — Inbox pode avançar (domínio já existe); Projetos pode receber refino parcial (gestão de projeto/saída já existe), mas o editor fica para depois de F5/F8 |

**Gate obrigatório por slice** (nenhum módulo é declarado "feito" sem isso):
- [ ] `npm run lint` (tsc --noEmit) limpo
- [ ] `npm run test` verde (mantém os testes existentes + novos do slice)
- [ ] `npm run build` gera `dist/` sem erro
- [ ] `node .github/scripts/check-boundaries.mjs` sem violação
- [ ] Rodar desktop dev e conferir visual/funcional manualmente

## 4. Recomendação de sequenciamento combinado (próximos 3 passos concretos)

Esta é a recomendação prática para os próximos ciclos de trabalho, cruzando os dois eixos:

**Passo 1 — Fechar o que já está pronto.**
Revisar e aprovar formalmente os slices visuais de Shell/Navegação e Faculdade (já
implementados, aguardando aprovação humana). Zero risco, zero código novo — só decisão.
Ao mesmo tempo, completar os itens pendentes menores da Fase 4 (`StatusBar` real,
`ContextInspector` com ações).

**Passo 2 — Abrir a Fase 5 (Documents & Blocks) antes de continuar o refino visual do
calendário.**
Justificativa: se o refino visual do calendário avançar primeiro e depois a Fase 7 mudar o
modelo de dados por baixo (`Task`/`Exam` → `Event`/`Responsibility`), parte do trabalho
visual pode precisar ser refeito para consumir os novos hooks/estados. É mais barato:
1. Fazer F5 (Documents & Blocks básico, Markdown-first).
2. Fazer F7 (Calendário como domínio) reaproveitando a UI de calendário já existente,
   trocando por baixo o que ela consome.
3. **Só então** rodar o slice visual "calendário" do Eixo B — refinando uma superfície que
   já está sobre o domínio definitivo, evitando retrabalho.

**Passo 3 — Avançar Conhecimento (visual) e Inbox (visual) em paralelo**, já que o domínio
de ambos (Relations/Suggestions/Graph) já está pronto — não há dependência do Eixo A
pendente aqui. Isso mantém o time/agente sempre com trabalho desbloqueado enquanto F7 e F5
avançam.

Depois desses três passos, a ordem natural volta a seguir o roadmap original:
F8 (editor/DOCX, agora desbloqueado por F5) → refino visual de Projetos → F9 (Marketing) →
refino visual de Marketing → F10 (Sync real) → F11 (engines avançadas) → F12 (remoção do
legado).

## 5. Sequência macro consolidada

```text
Eixo A: F0 → F1 → F2 → F3 → F4 → F5(A) → F6(B,C) → F7(D) → F8(E,F) → F9(G) → F10(H,I) → F11 → F12
Eixo B:            shell+nav ✔ → faculdade ✔ → [pausa até F7] → calendario → conhecimento/inbox
                                                                                → marketing (após F9) → projetos
```

## 6. Fatias verticais de entrega (critério de "está pronto" por marco)

| Marco | Fatia vertical | Critério de entrega |
|---:|---|---|
| A | Workspace → Document → salvar → reabrir | Ceci cria e retoma um documento num Workspace |
| B | Document → busca local | Documento encontrado por texto e metadados |
| C | Document → Relation → Graph | Relação explícita aparece no Graph + inspector — ✅ feito |
| D | Event/Responsibility → semana desktop | Ceci planeja e registra na visão semanal, sobre o novo domínio |
| E | Project → AcademicTree → editor | Ceci cria projeto e escreve saída principal |
| F | Document → referência → DOCX | Exporta, edita fora, importa e compara versão |
| G | ContentBase → ChannelVariant | Adapta ideia para Instagram, TikTok, LinkedIn |
| H | SQLite → SyncPackage → provider | Dois dispositivos trocam dados sem sobrescrever revisão |
| I | Context → KnowledgePacket → IA | IA opera com contexto compilado e autorização |

Cada fatia atravessa domínio + persistência + UI + teste — nunca uma tela isolada.

## 7. Trilhas paralelas (para planejamento de capacidade/equipe)

| Trilha | Módulos | Dependência principal |
|---|---|---|
| A — Fundação & Shell | Shell, Navegação, Workspaces, Home, Perfil, Settings, Infraestrutura | Nenhuma (concluída em sua maior parte) |
| B — Conhecimento | Documents & Blocks, Relations, Knowledge Graph, Inbox, Search Index | Trilha A |
| C — Temporal | Calendário Acadêmico, Google Calendar | Trilha A |
| D — Produção Acadêmica | TCC/Projetos, Editor Acadêmico, DOCX/ABNT, Referências | Trilha B + C |
| E — Marketing | Marketing Studio, Publicação, Métricas | Trilha B + C (calendário editorial) |
| F — Sincronização | Sync Engine, Providers, Criptografia | Trilha A + qualquer módulo persistido |

Se houver mais de um desenvolvedor/agente disponível, B e C podem correr em paralelo depois
da Trilha A; D e E só depois que B e C tiverem uma base mínima; F pode começar cedo como
interface (contratos) mesmo sem provider real implementado.

## 8. Verificação e testes (aplicar em toda fase nova)

- **Domínio:** regras de limite de projetos, estados de calendário, recorrência, origem de
  eventos, aprovação de publicações, composição de documentos — testadas sem React/Tauri.
- **Migração:** cada versão antiga deve converter para a nova estrutura de forma idempotente,
  preservando IDs, com relatório de itens migrados/ignorados/ambíguos.
- **Sincronização:** revisão remota mais nova, upload com revisão correta, tombstone contra
  registro vivo, alterações em dispositivos diferentes, conflito em campos distintos,
  restauração de snapshot, workspaces separados, pacotes corrompidos, retry sem duplicar.
- **Documentos:** round-trip `modelo interno → DOCX → modelo interno`; comparação de
  estrutura, títulos, estilos, referências, tabelas, imagens, notas e metadados.
- **Experiência:** tarefas reais ponta-a-ponta — abrir último Workspace e continuar
  trabalho; localizar nota e navegar relações; montar semana arrastando blocos; registrar
  aula e transformar em conhecimento; criar saída de TCC e exportar DOCX; sincronizar com o
  celular sem reproduzir a interface dele.

## 9. Resumo executivo — o que fazer primeiro, em uma frase por passo

1. Aprovar formalmente o refino visual de Shell/Navegação e Faculdade (já pronto).
2. Implementar Documents & Blocks (F5) — desbloqueia TCC, Calendário rico e Marketing.
3. Migrar o Calendário para domínio próprio (F7), reaproveitando a UI existente.
4. Só então refinar visualmente o Calendário (Eixo B), evitando retrabalho.
5. Avançar em paralelo o refino visual de Conhecimento/Inbox (domínio já pronto).
6. Completar o editor acadêmico e DOCX (F8) — maior risco técnico, tratar com protótipos.
7. Construir o Marketing Studio (F9) do zero, depois refinar visualmente.
8. Implementar o transporte de sincronização real (F10) — segundo maior risco técnico.
9. Engines avançadas (F11) e remoção do legado (F12) fecham o ciclo.
