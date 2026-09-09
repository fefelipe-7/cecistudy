# Roadmap de Funcionalidades — cecistudy Desktop Release

> **Documento de referência:** levantamento completo de todas as funcionalidades esperadas
> na versão release do cecistudy desktop, extraído da pasta `desktop/context-desktop/`.
> Organizado por módulo, com trilhas paralelas, dependências e ordem de complexidade.
>
> **Fontes:** `cecistudy — contexto geral e guia de implementação`, `Arquitetura técnica-alvo`,
> `Blueprint arquitetural`, `PLANO-IMPLEMENTACAO`, `Especificação do Calendário`, `Especificação
> do TCC`, `Especificação do Marketing`, `separacao-interface/00–07`, `desktop/spec/00-relatorio-varredura`.
>
> **Status atual (set 2026):** F0–F4, F6 concluídos; F8 parcial; F5, F7, F9–F12 pendentes.
> Separação de interface (Etapas 0–10): Fases 0–9 concluídas; Fase 10 em progresso.

---

## Índice

1. [Visão geral: módulos e trilhas](#1-visão-geral)
2. [Módulo 1 — Shell & Navegação Desktop](#2-shell--navegação)
3. [Módulo 2 — Home Desktop](#3-home-desktop)
4. [Módulo 3 — Sistema de Workspaces](#4-workspaces)
5. [Módulo 4 — Faculdade Master-Detail](#5-faculdade)
6. [Módulo 5 — Base de Conhecimento (Documents, Graph, Relations)](#6-base-conhecimento)
7. [Módulo 6 — Calendário Acadêmico](#7-calendario)
8. [Módulo 7 — TCC & Projetos Acadêmicos](#8-tcc-projetos)
9. [Módulo 8 — Marketing Studio](#9-marketing)
10. [Módulo 9 — Estudos Desktop](#10-estudos)
11. [Módulo 10 — Sync Engine & Providers](#11-sync)
12. [Módulo 11 — Perfil & Settings](#12-perfil)
13. [Módulo 12 — Infraestrutura & Plataforma](#13-infraestrutura)
14. [Mapa de dependências entre trilhas](#14-dependencias)
15. [Roadmap com fases e paralelismo](#15-roadmap)
16. [Status de execução atual](#16-status)

---

## 1. Visão geral: módulos e trilhas {#1-visão-geral}

### Trilhas paralelas (6)

| Trilha | Módulos | Dependência principal |
|---|---|---|
| **A — Fundação & Shell** | Shell, Navegação, Workspaces, Home, Perfil, Settings, Infraestrutura | Nenhuma (base) |
| **B — Conhecimento** | Documents & Blocks, Relations, Knowledge Graph, Inbox, Search Index | Trilha A (shell + workspace) |
| **C — Temporal** | Calendário Acadêmico, Google Calendar Integration | Trilha A (shell + workspace) |
| **D — Produção Acadêmica** | TCC/Projetos, Editor Acadêmico, DOCX/ABNT, Referências | Trilha B (documents) + Trilha C (calendário) |
| **E — Marketing** | Marketing Studio, Publicação, Métricas | Trilha B (conhecimento) + Trilha C (calendário editorial) |
| **F — Sincronização** | Sync Engine, Providers (GitHub/P2P/Blob), Criptografia | Trilha A (domínio) + qualquer módulo persistido |

### Princípio de ordenação

Dentro de cada trilha, as funcionalidades vão do **mais simples** (entidades/modelo) ao
**mais complexo** (UI rica, integrações, engines avançadas). Funcionalidades com **zero
dependência de código novo** (já implementadas) são marcadas com ✅.

---

## 2. Módulo 1 — Shell & Navegação Desktop {#2-shell--navegação}

> **Trilha A** · Complexidade: Baixa → Média · Status: ~70% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| 1.1 | Sidebar fixa esquerda | 256px, colapsável para `w-10`, navegação primária (home/faculdade/estudos/biblioteca) | ✅ `DesktopSidebar.tsx` |
| 1.2 | WorkspaceSwitcher | Seletor de workspace no topo da sidebar | ✅ `WorkspaceSwitcher.tsx` |
| 1.3 | Topbar contextual | Título, breadcrumb, busca, avatar. 44px altura | ✅ `DesktopTopbar.tsx` |
| 1.4 | Command Palette (⌘K) | Overlay 560px, navegação por comandos | ✅ `CommandPalette.tsx` (navegação simples) |
| 1.5 | Context Inspector | Painel colapsável à direita, contexto do item focado | ✅ `ContextInspector.tsx` |
| 1.6 | SplitLayout | Primitiva master-detail (left/right, rightOpen, onCloseRight) | ✅ `SplitLayout.tsx` |
| 1.7 | Panel / StatusBadge / TagPill | Primitivas UI desktop | ✅ `src/desktop/components/ui/` |
| 1.8 | Atalhos de teclado ⌘1–⌘4 | Navegação rápida por módulo | ⬜ Proposto |
| 1.9 | Breadcrumb contextual | Ex.: `Faculdade › [curso] › aula 3` | ⬜ Proposto |
| 1.10 | StatusBar | Indexação, sync status, provider status | ⬜ Proposto (F4) |
| 1.11 | Command Palette enriquecida (G5) | Resultados agrupados (Documentos/Eventos/Projetos/Comandos), fuzzy search | ⬜ Proposto (F7) |
| 1.12 | Ordenação/agrupamento na sidebar | Por workspace, projetos fixos, badges de contagem | ⬜ Proposto |
| 1.13 | Indicador de painéis abertos | Toggle graph/calendar no app | ⬜ Proposto |
| 1.14 | Colapso da sidebar persistido | Estado em `DesktopSessionState` | ⬜ Proposto |
| 1.15 | Onboarding desktop-aware | Escolha de workspace inicial, layout padrão, import de banco | ⬜ Proposto |

### Ordem de implementação

```
1.1–1.7 (já feito) → 1.8 (atalhos) → 1.10 (StatusBar) → 1.11 (Palette enriquecida)
→ 1.9 (breadcrumb) → 1.12–1.15 (polimento)
```

---

## 3. Módulo 2 — Home Desktop {#3-home-desktop}

> **Trilha A** · Complexidade: Baixa · Status: ~40% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| 2.1 | Quick stats | Métricas resumidas (tarefas, provas, sessões) | ✅ `HomeScreen.tsx` |
| 2.2 | Module shortcuts | Grid de atalhos para módulos | ✅ `HomeScreen.tsx` |
| 2.3 | Workspace banner | Banner contextual do workspace | ✅ `HomeScreen.tsx` |
| 2.4 | Recent items (G4) | Itens recentes (aulas, leituras, notas) lidos de `useDesktopApp` | ⬜ GAP identificado |
| 2.5 | Próximos prazos | Widget de visão semanal compacta | ⬜ Proposto |
| 2.6 | Atalho rápido | Abrir documento/calendário/grafo a partir da home | ⬜ Proposto |

### Ordem de implementação

```
2.1–2.3 (já feito) → 2.4 (recent items) → 2.5 (prazos) → 2.6 (atalhos)
```

---

## 4. Módulo 3 — Sistema de Workspaces {#4-workspaces}

> **Trilha A** · Complexidade: Média · Status: ~80% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| 3.1 | Workspace entity | Entidade `Workspace` com id, nome, config | ✅ `packages/domain` |
| 3.2 | workspaceId em entidades | Todas entidades sincronizáveis carregam `workspaceId` | ✅ Migração 11→12 |
| 3.3 | Workspace "Acadêmico" padrão | Criação automática no boot | ✅ `DEFAULT_WORKSPACE_ID` |
| 3.4 | Criar/alternar workspace | `createWorkspace`/`switchWorkspace` | ✅ `AppContext` + UI |
| 3.5 | DesktopSessionState | Persiste último workspace, docs abertos, painéis, viewport | ✅ `usePersistentState` |
| 3.6 | Restauração de sessão | Ao reabrir, retoma último workspace + estado | ✅ Derivado do estado |
| 3.7 | Isolamento entre workspaces | Busca, graph, sugestões operam no workspace atual | ⬜ Parcial (F6) |
| 3.8 | Relações entre workspaces | Ação explícita com origem/destino/autoriação | ⬜ Proposto (F11) |
| 3.9 | Múltiplos workspaces na sidebar | Ordenação, agrupamento visual | ⬜ Proposto |

### Ordem de implementação

```
3.1–3.6 (já feito) → 3.7 (isolamento) → 3.9 (UI) → 3.8 (relações cross-workspace)
```

---

## 5. Módulo 4 — Faculdade Master-Detail {#5-faculdade}

> **Trilha A** · Complexidade: Média · Status: ~60% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| 4.1 | CourseMasterList | Lista de disciplinas (master pane) | ✅ `CourseMasterList.tsx` |
| 4.2 | CourseDetailPane | Detalhe com abas (info/aulas/repertório) | ✅ `CourseDetailPane.tsx` |
| 4.3 | Integrado no SplitLayout | Master-detail funcional | ✅ `DesktopAppShell.tsx` |
| 4.4 | Comparação lado a lado | Duas disciplinas simultaneamente | ⬜ Proposto |
| 4.5 | Drag para calendário | Arrastar aula do master para grade semanal | ⬜ Proposto (F7) |
| 4.6 | Grade semanal de aulas | Vista por disciplina dentro do painel | ⬜ Proposto |
| 4.7 | Edição inline no detail | Editar notas/repertório sem modal | ⬜ Proposto |

### Ordem de implementação

```
4.1–4.3 (já feito) → 4.7 (edição inline) → 4.4 (comparação) → 4.6 (grade) → 4.5 (drag para calendário)
```

---

## 6. Módulo 5 — Base de Conhecimento {#6-base-conhecimento}

> **Trilha B** · Complexidade: Alta · Status: ~30% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| **Entidades & Modelo** | | | |
| 5.1 | Document entity | Modelo interno canônico (Workspace→Document→Block) | ✅ `packages/domain` |
| 5.2 | Block entity | Unidade atômica (parágrafo, título, tabela, imagem, citação, código) | ✅ `packages/domain` |
| 5.3 | Concept entity | Conceitos psicológicos com domínio, relações, estado de aprendizagem | ✅ `packages/domain` |
| 5.4 | Relation entity | Relações explícitas, determinísticas, semânticas | ✅ `packages/domain` |
| 5.5 | Suggestion entity | Sugestões de relações (inbox) | ✅ `packages/domain` |
| 5.6 | AssociationPolicy | Políticas de bloqueio/recusa de associações | ✅ `packages/domain` |
| 5.7 | LearningState | Estado multidimensional de aprendizagem | ✅ `packages/domain` |
| **Persistência** | | | |
| 5.8 | Store de Document/Block | SQLite via repositório dedicado | ⬜ F5 |
| 5.9 | Migração de dados legados | `looseNotes`, `ClassNote`, `MaterialItem` → Document/Block | ⬜ F5 |
| **Editor Básico** | | | |
| 5.10 | Editor Markdown-first | Bloco = unidade atômica; edição textual | ⬜ F5 |
| 5.11 | openDocuments[] | Documentos abertos em tabs no desktop | ⬜ F5 |
| **Relações & Graph** | | | |
| 5.12 | Relações explícitas via UI | Criar relação entre entidades pela interface | ✅ F6 |
| 5.13 | KnowledgeGraphView | Grafo SVG interativo (nós = entidades, arestas = relações) | ✅ F6 |
| 5.14 | KnowledgeInbox | Curadoria de sugestões (aceitar/rejeitar/vincular) | ✅ F6 |
| 5.15 | Filtros do Graph | Por domínio, curso, período, tipo de relação, profundidade | ⬜ Proposto |
| 5.16 | Seleção de nó → Inspector | Nó selecionado sincroniza com ContextInspector | ⬜ Proposto |
| 5.17 | Modo foco no Graph | Destacar vizinhança, minimapa | ⬜ Proposto |
| 5.18 | Viewport persistido | `graphViewport` em `DesktopSessionState` | ⬜ Proposto |
| **Busca** | | | |
| 5.19 | Busca local indexada | Índice de texto + metadados | ⬜ F6 (otimização) |
| 5.20 | Busca global enriquecida | Agrupada por tipo (doc/conceito/evento/projeto) | ⬜ Proposto |
| **Conhecimento avançado** | | | |
| 5.21 | Relações semânticas | Inferidas, entram como sugestão no Inbox | ⬜ F11 |
| 5.22 | Context Engine + .cectx | Contexto compilado para IA | ⬜ F11 |
| 5.23 | KnowledgePacket | Pacote de contexto para interação com IA | ⬜ F11 |
| 5.24 | LearningState multidimensional | 7 dimensões (definição, explicação, recuperação...) | ⬜ F11 |
| 5.25 | Análise de impacto | Onde um conceito é utilizado em capítulos/TCC/materiais | ⬜ F11 |

### Ordem de implementação

```
5.1–5.7 (já feito) → 5.8 (store) → 5.10 (editor básico) → 5.9 (migração) → 5.11 (tabs)
→ 5.12–5.14 (já feito) → 5.15–5.18 (graph polimento) → 5.19–5.20 (busca)
→ 5.21–5.25 (engines avançadas)
```

---

## 7. Módulo 6 — Calendário Acadêmico {#7-calendario}

> **Trilha C** · Complexidade: Alta · Status: ~10% implementado (entidades apenas)

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| **Entidades & Modelo** | | | |
| 6.1 | CalendarEvent | Algo que acontece em horário específico | ✅ `packages/domain` |
| 6.2 | Responsibility | Algo que precisa ser realizado dentro de um prazo | ✅ `packages/domain` |
| 6.3 | PlanningBlock | Reserva de tempo para uma responsabilidade | ✅ `packages/domain` |
| 6.4 | Occurrence | Instância de evento recorrente | ✅ `packages/domain` |
| 6.5 | ExecutionRecord | O que realmente aconteceu (duração, resultado) | ✅ `packages/domain` |
| 6.6 | RecurrenceRule | Regra de recorrência (frequência, dias, horário) | ✅ `packages/domain` |
| 6.7 | Subtask | Etapa de uma responsabilidade maior | ✅ `packages/domain` |
| 6.8 | 4 níveis de compromisso | Obrigatório / Importante / Recomendado / Opcional | ✅ `packages/domain` |
| **Visão Desktop (MVP)** | | | |
| 6.9 | Visão semanal (grade) | Dias no eixo horizontal, horários no vertical | ⬜ F7 |
| 6.10 | Itens de dia inteiro | Faixa separada no topo da grade | ⬜ F7 |
| 6.11 | Drag-and-drop | Arrastar eventos/blocos na grade | ⬜ F7 |
| 6.12 | Resize | Redimensionar blocos de planejamento | ⬜ F7 |
| 6.13 | Painel contextual | Detalhes, etapas, vínculos, planejamento, execução | ⬜ F7 |
| 6.14 | Camadas visuais | Faculdade/TCC/Estudos/Estágio/Marketing com cores próprias | ⬜ F7 |
| 6.15 | Filtros por origem | Mostrar/ocultar camadas | ⬜ F7 |
| **Visões alternativas** | | | |
| 6.16 | Visão diária | Detalhe do dia selecionado | ⬜ F7 |
| 6.17 | Visão mensal | Calendário tradicional | ⬜ F7 |
| 6.18 | Agenda/lista | Lista cronológica de itens | ⬜ F7 |
| **Criação & Edição** | | | |
| 6.19 | Criar evento/responsabilidade | Formulário com campos do domínio | ⬜ F7 |
| 6.20 | Estados | planejado → em andamento → concluído / adiado / cancelado | ⬜ F7 |
| 6.21 | Recorrência | Criar/editar regras, exceções por ocorrência | ⬜ F7 |
| 6.22 | Planejado vs. real | Dois registros por atividade (intenção vs. execução) | ⬜ F7 |
| **Migração** | | | |
| 6.23 | Task → Responsibility | Migrar tarefas existentes | ⬜ F7 |
| 6.24 | Exam → Event/Responsibility | Migrar provas existentes | ⬜ F7 |
| 6.25 | ClassNote → ExecutionRecord | Migrar registros de aula | ⬜ F7 |
| **Google Calendar** | | | |
| 6.26 | Autenticação OAuth | Conectar conta Google | ⬜ F7 |
| 6.27 | Sincronização bidirecional | Eventos cecistudy ↔ Google | ⬜ F7 |
| 6.28 | Eventos externos somente-leitura | Importados do Google, não editáveis | ⬜ F7 |
| 6.29 | Conflitos | Preservar versões, resolver manualmente | ⬜ F7 |
| **Mobile** | | | |
| 6.30 | Agenda compacta | Faixa de dias + agenda do dia | ⬜ F7 |
| 6.31 | Ações rápidas | Concluir, adiar, reagendar, registrar execução | ⬜ F7 |

### Ordem de implementação

```
6.1–6.8 (já feito) → 6.9 (grade semanal) → 6.10–6.12 (drag/resize) → 6.13 (inspector)
→ 6.14–6.15 (camadas) → 6.16–6.18 (visões alternativas) → 6.19–6.22 (criação/edição)
→ 6.23–6.25 (migração) → 6.26–6.29 (Google Calendar) → 6.30–6.31 (mobile)
```

---

## 8. Módulo 7 — TCC & Projetos Acadêmicos {#8-tcc-projetos}

> **Trilha D** · Complexidade: Muito Alta · Status: ~25% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| **Entidades & Modelo** | | | |
| 7.1 | Project entity | Projeto acadêmico com identidade, tipo, status | ✅ `packages/domain` |
| 7.2 | Output entity | Produção específica derivada do projeto | ✅ `packages/domain` |
| 7.3 | AcademicNode | Nó da árvore acadêmica configurável | ✅ `packages/domain` |
| 7.4 | Reference entity | Referência bibliográfica estruturada | ✅ `packages/domain` |
| 7.5 | Citation entity | Citação no texto | ✅ `packages/domain` |
| 7.6 | Limite de 5 projetos ativos | Invariante testado | ✅ `packages/domain` |
| **Gestão de Projetos** | | | |
| 7.7 | Criar projeto (modelo ou livre) | Formulário com tipo (TCC/artigo/revisão/etc.) | ✅ F8 Slice 1 |
| 7.8 | Lista de projetos | Badges "X de 5 ativos", status | ✅ F8 Slice 1 |
| 7.9 | Gerenciar saídas | createOutput/updateOutput/deleteOutput | ✅ F8 Slice 1 |
| 7.10 | Árvore acadêmica configurável | Capítulos/subcapítulos, drag/reorder | ⬜ F8 |
| 7.11 | Modelos de projeto | TCC monográfico, artigo, revisão, estudo de caso, etc. | ⬜ F8 |
| 7.12 | Checklist de elementos | Pré-textuais, textuais, pós-textuais configuráveis | ⬜ F8 |
| **Editor Acadêmico** | | | |
| 7.13 | Modelo interno de documento | Texto, headings, estilos, tabelas, imagens, citações, notas | ⬜ F8 |
| 7.14 | Editor visual paginado | Próximo ao Word: páginas, margens, cabeçalho, rodapé | ⬜ F8 |
| 7.15 | Estilos acadêmico | Fonte, tamanho, espaçamento, alinhamento, recuos | ⬜ F8 |
| 7.16 | Títulos numerados + sumário | Auto-gerados a partir da hierarquia | ⬜ F8 |
| 7.17 | Tabelas e imagens | Inserção, legendas, formatação | ⬜ F8 |
| 7.18 | Notas de rodapé | Citações, referências, comentários | ⬜ F8 |
| 7.19 | Referências cruzadas | Links internos entre seções | ⬜ F8 |
| 7.20 | Comentários | Anotações por trecho | ⬜ F8 |
| 7.21 | Pré-visualização de impressão | Conferência antes de exportar | ⬜ F8 |
| **Referências & Citações** | | | |
| 7.22 | Biblioteca global de referências | Cadastro manual, DOI, ISBN, BibTeX, RIS | ⬜ F8 |
| 7.23 | Citações diretas e indiretas | Com localizador (página, seção) | ⬜ F8 |
| 7.24 | Perfil ABNT inicial | Geração automática de bibliografia | ⬜ F8 |
| 7.25 | Perfis adicionais | APA, Vancouver, Chicago (pós-MVP) | ⬜ Proposto |
| **DOCX** | | | |
| 7.26 | Exportação DOCX | Alta fidelidade (estilos, tabelas, imagens, sumário) | ⬜ F8 |
| 7.27 | Importação DOCX | Como versão candidata (nunca sobrescreve) | ⬜ F8 |
| 7.28 | Comparação de versões | Diferencial detalhado antes de aceitar | ⬜ F8 |
| 7.29 | Round-trip DOCX | Exportar → editar fora → importar → comparar | ⬜ F8 |
| **Composição** | | | |
| 7.30 | Referenciar documento/bloco | Referência viva (atualizações sinalizadas) | ⬜ F8 |
| 7.31 | Duplicar | Cópia independente com proveniência | ⬜ F8 |
| 7.32 | Incorporar | Mover/vincular com preservação de origem | ⬜ F8 |
| **Conformidade** | | | |
| 7.33 | Perfil institucional configurável | Universidade, curso, tipo de trabalho | ⬜ F8 |
| 7.34 | Validação diagnóstica | Erros/avisos/itens ausentes (não bloqueante) | ⬜ F8 |
| **Versionamento** | | | |
| 7.35 | Autosave técnico | Recuperação frequente | ⬜ F8 |
| 7.36 | Histórico recuperável | Alterações para comparação/restauração | ⬜ F8 |
| 7.37 | Versões nomeadas | Marcos ("versão ao orientador", "pré-banca") | ⬜ F8 |
| **Orientação (pós-MVP)** | | | |
| 7.38 | Reuniões com orientador | Decisões, pendências, próximos passos | ⬜ Pós-MVP |
| 7.39 | Comentários vinculados | Por documento, seção, bloco ou trecho | ⬜ Pós-MVP |
| **Integrações** | | | |
| 7.40 | TCC → Calendário | Marcos, etapas, entregas como responsabilidades | ⬜ F8 |
| 7.41 | TCC → Conhecimento | Referências vivas a documentos/conceitos | ⬜ F8 |
| 7.42 | TCC → Estudos | Flashcards, sessões, questões de pesquisa | ⬜ F8 |
| 7.43 | TCC → IA | Localizar relações, apontar lacunas, revisar coerência | ⬜ F11 |
| **Multi-formato (pós-MVP)** | | | |
| 7.44 | Markdown como modo completo | Edição textual e portabilidade | ⬜ Pós-MVP |
| 7.45 | LaTeX como modo completo | Equações, código, controle técnico | ⬜ Pós-MVP |
| 7.46 | Exportação PPTX | Para apresentações | ⬜ Pós-MVP |

### Ordem de implementação

```
7.1–7.9 (já feito) → 7.13 (modelo interno) → 7.14–7.21 (editor paginado)
→ 7.10–7.12 (árvore) → 7.22–7.25 (referências) → 7.26–7.29 (DOCX)
→ 7.30–7.32 (composição) → 7.33–7.34 (conformidade) → 7.35–7.37 (versionamento)
→ 7.40–7.42 (integrações) → 7.38–7.39, 7.43–7.46 (pós-MVP)
```

---

## 9. Módulo 8 — Marketing Studio {#9-marketing}

> **Trilha E** · Complexidade: Alta · Status: 0% implementado (greenfield)

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| **Entidades & Modelo** | | | |
| 8.1 | PositioningProfile | Identidade, propósito, pilares, tom, público, objetivos | ⬜ F9 |
| 8.2 | ContentIdea | Ideia de conteúdo com origem na Base de Conhecimento | ⬜ F9 |
| 8.3 | ContentBase | Conteúdo-base independente do canal | ⬜ F9 |
| 8.4 | ChannelVariant | Adaptação para Instagram/TikTok/LinkedIn | ⬜ F9 |
| 8.5 | Publication | Publicação com estado e métricas | ⬜ F9 |
| 8.6 | MetricSnapshot | Métrica por publicação/versão | ⬜ F9 |
| 8.7 | StrategicInsight | Aprendizado estratégico confirmável | ⬜ F9 |
| **Posicionamento** | | | |
| 8.8 | Configurar posicionamento | Interface para todos os campos do perfil | ⬜ F9 |
| 8.9 | Sugestões de posicionamento | IA sugere pilares, público, hipóteses (rascunho) | ⬜ F9 |
| 8.10 | Temas proibidos/cuidado | Limites que influenciam sugestões | ⬜ F9 |
| **Pilares & Classificação** | | | |
| 8.11 | Pilares de conteúdo | Criar, editar, remover pilares | ⬜ F9 |
| 8.12 | Objetivos | Educarr, gerar conversa, construir autoridade, etc. | ⬜ F9 |
| 8.13 | Classificação por tipo | Educativo, relato, opinião, acadêmico, divulgação | ⬜ F9 |
| **Fluxo Editorial** | | | |
| 8.14 | Fila de ideias | Brainstorm com ligação à Base de Conhecimento | ⬜ F9 |
| 8.15 | Briefing | Definir objetivo, pilar, público, canal-alvo | ⬜ F9 |
| 8.16 | Rascunho | Criação do conteúdo-base | ⬜ F9 |
| 8.17 | Estados do fluxo | ideia→selecionado→briefing→rascunho→em_revisao→aprovado→… | ⬜ F9 |
| 8.18 | Templates próprios | Modelos por canal e formato | ⬜ F9 |
| **Versões por Canal** | | | |
| 8.19 | Instagram: feed, carrossel, Reels, Stories | Formatos com slides, legenda, capa, CTA, hashtags | ⬜ F9 |
| 8.20 | TikTok: vídeo curto | Gancho, roteiro, cenas, falas, duração, texto na tela | ⬜ F9 |
| 8.21 | LinkedIn: texto, documento, imagem, vídeo | Texto profissional, argumento, fonte, CTA | ⬜ F9 |
| 8.22 | Aprovação individual por canal | Aprovar IG ≠ aprovar TikTok | ⬜ F9 |
| **Publicação** | | | |
| 8.23 | Agendamento | Programar publicação | ⬜ F9 |
| 8.24 | Publicação autorizada | Ativada por canal, com autorização explícita | ⬜ F9 |
| 8.25 | Fallback manual | Publicar fora e registrar como publicada | ⬜ F9 |
| **Métricas** | | | |
| 8.26 | Métricas automáticas | Via APIs oficiais (quando disponíveis) | ⬜ F9 |
| 8.27 | Métricas manuais | Registro manual como fallback | ⬜ F9 |
| 8.28 | Comparação por canal/formato/pilar | Análise de desempenho | ⬜ F9 |
| **Aprendizados** | | | |
| 8.29 | Sugestões de aprendizado | IA sugere, Ceci confirma/rejeita | ⬜ F9 |
| 8.30 | Impacto no posicionamento | Aprendizados confirmados influenciam recomendações | ⬜ F9 |
| **Revisão** | | | |
| 8.31 | Aviso de responsabilidade (Psicologia) | Não bloqueante, sugere revisão | ⬜ F9 |
| **Integrações** | | | |
| 8.32 | Calendário editorial | Camada visual no Calendário unificado | ⬜ F9 |
| 8.33 | Conteúdo → Base de Conhecimento | Origem do conhecimento utilizada | ⬜ F9 |
| 8.34 | Séries/campanhas | Conteúdos relacionados em séries | ⬜ F9 |

### Ordem de implementação

```
8.1–8.7 (entidades) → 8.8–8.10 (posicionamento) → 8.11–8.13 (classificação)
→ 8.14–8.18 (fluxo editorial) → 8.19–8.22 (versões por canal)
→ 8.23–8.25 (publicação) → 8.26–8.28 (métricas) → 8.29–8.31 (aprendizados)
→ 8.32–8.34 (integrações)
```

---

## 10. Módulo 9 — Estudos Desktop {#10-estudos}

> **Trilha A** · Complexidade: Média · Status: ~50% (compartilhado com mobile)

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| 9.1 | Timer Pomodoro | Sessão de foco com timer | ✅ `StudyFocusScreen.tsx` |
| 9.2 | Flashcards | Revisão espaçada | ✅ Compartilhado |
| 9.3 | Leituras | Acompanhamento de leitura | ✅ Compartilhado |
| 9.4 | Questões | Banco de questões | ✅ Compartilhado |
| 9.5 | Histórico de sessões | Sessões passadas | ✅ Compartilhado |
| 9.6 | Master-detail de sessões | Lista lateral + detalhe | ⬜ Proposto desktop |
| 9.7 | Multitarefa em painéis | Timer + leitura + flashcards lado a lado | ⬜ Proposto desktop |
| 9.8 | Editor de baralho | Drag/reorder de flashcards | ⬜ Proposto desktop |
| 9.9 | Estatísticas enriquecidas | Gráficos, tendências, comparações | ⬜ Proposto desktop |

### Ordem de implementação

```
9.1–9.5 (já feito) → 9.6 (master-detail) → 9.9 (estatísticas)
→ 9.7 (multitarefa) → 9.8 (editor de baralho)
```

---

## 11. Módulo 10 — Sync Engine & Providers {#11-sync}

> **Trilha F** · Complexidade: Muito Alta · Status: ~30% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| **Protocolo** | | | |
| 10.1 | SyncManifest | schemaVersion, protocolVersion, revision, parentRevision | ✅ `packages/contracts` |
| 10.2 | SyncPackage | Pacote versionado com workspaceScope, tombstones, hashes | ✅ `packages/contracts` |
| 10.3 | SyncIndex | Stamps por registro, tombstones | ✅ `packages/sync` |
| 10.4 | Merge LWW determinístico | Last-Write-Wins com tombstones | ✅ `packages/sync` |
| 10.5 | Transport bridge (stub) | Interface de transporte preparada | ✅ `packages/sync` |
| **Engine** | | | |
| 10.6 | compare-and-swap | Verificação de revisão antes de publicar | ⬜ F10 |
| 10.7 | checkRevision | Rejeita sobrescrita de revisão mais nova | ⬜ F10 |
| 10.8 | createPackage | Montar pacote a partir de operações | ⬜ F10 |
| 10.9 | preview | Preview de alterações antes de aplicar | ⬜ F10 |
| 10.10 | resolveConflict | Resolução manual de conflitos | ⬜ F10 |
| 10.11 | apply | Aplicar pacote recebido ao banco local | ⬜ F10 |
| **Providers** | | | |
| 10.12 | GitHubProvider | Sync via repositório GitHub | ⬜ F10 |
| 10.13 | P2PProvider | Sync peer-to-peer (reaproveita pairing/scanQr) | ⬜ F10 |
| 10.14 | BlobProvider | Storage de arquivos grandes (PDFs, imagens, DOCX) | ⬜ F10 |
| 10.15 | Interface SyncProvider | `inspectRemote`, `downloadPackage`, `uploadPackage`, `listRevisions` | ⬜ F10 |
| **Criptografia** | | | |
| 10.16 | Criptografia de pacotes | Independente do provider | ⬜ F10 |
| 10.17 | Gestão de credenciais | Tokens revogáveis, nunca no bundle | ⬜ F10 |
| 10.18 | Integridade | IntegritySignature no SyncPackage | ⬜ F10 |
| **Concorrência** | | | |
| 10.19 | Política inicial: 1 dispositivo | Convenção + verify por compare-and-swap | ⬜ F10 |
| 10.20 | Merge por domínio | Documentos ≠ marcadores (estratégias distintas) | ⬜ F10 |
| **UI** | | | |
| 10.21 | SyncScreen | Tela de pareamento e sync | ✅ `SyncScreen.tsx` |
| 10.22 | Status de sync na StatusBar | Indicador visual | ⬜ F10 |
| **Backup** | | | |
| 10.23 | Backup portável | Exportação independente do provider | ✅ `exportImport.ts` |
| 10.24 | Restauração atômica | Prévia + validação + aplicação | ✅ `importAppDatabase` |

### Ordem de implementação

```
10.1–10.5, 10.21–10.24 (já feito) → 10.6–10.11 (engine) → 10.15 (interface)
→ 10.12 (GitHub) → 10.14 (Blob) → 10.16–10.18 (criptografia)
→ 10.19–10.20 (concorrência) → 10.13 (P2P) → 10.22 (StatusBar)
```

---

## 12. Módulo 11 — Perfil & Settings {#12-perfil}

> **Trilha A** · Complexidade: Baixa · Status: ~60% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| 11.1 | PerfilView | Página única com métricas reais, timeline, streak | ✅ Compartilhado |
| 11.2 | Stickers | Coleção de conquistas | ✅ |
| 11.3 | Updater Tauri | Verificar/aplicar atualizações desktop | ✅ `DesktopUpdateSection.tsx` |
| 11.4 | Lembrete diário | Timer JS no desktop | ✅ `notifications.ts` |
| 11.5 | Seção "Sessão desktop" | Workspace ativo, painéis abertos, reset | ⬜ Proposto |
| 11.6 | Preferências de densidade | Layout compact/comfortable | ⬜ Proposto |
| 11.7 | Janela de preferências dedicada | Abas: geral/aparência/atalhos/sync/updater | ⬜ Proposto |
| 11.8 | Lista de atalhos de teclado | Tela de ajuda | ⬜ Proposto |
| 11.9 | Controle de auto-update | Canal stable/beta | ⬜ Proposto |

### Ordem de implementação

```
11.1–11.4 (já feito) → 11.5 (sessão desktop) → 11.7 (preferências)
→ 11.6 (densidade) → 11.8 (atalhos) → 11.9 (auto-update)
```

---

## 13. Módulo 12 — Infraestrutura & Plataforma {#13-infraestrutura}

> **Trilha A** · Complexidade: Variável · Status: ~70% implementado

### Funcionalidades

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| 12.1 | Domain Core puro | Entidades sem React/Capacitor/Tauri | ✅ F1–F2 |
| 12.2 | Application Core | Use-cases e comandos testados | ✅ F2 |
| 12.3 | DataClient | Repositórios + backup/restore | ✅ F3 Ação 2/3 |
| 12.4 | packages/* (6 pacotes) | domain, application, data, sync, contracts, design-tokens | ✅ F1 |
| 12.5 | apps/mobile + apps/desktop | Entrypoints próprios | ✅ F5–F6 |
| 12.6 | Overlays próprios | MobileOverlays + DesktopOverlays | ✅ F7 |
| 12.7 | Dois providers | MobileAppProvider + DesktopAppProvider | ✅ F8 |
| 12.8 | Facades useMobileApp/useDesktopApp | Consumo isolado por plataforma | ✅ F10.1 |
| 12.9 | Boundary check | Script CI que falha se import cruzado | ✅ `check-boundaries.mjs` |
| 12.10 | Remoção de ScreenLayers | Ponte acidental removida | ⬜ F10 (em progresso) |
| 12.11 | AppContext como facade pura | Sem novas regras de negócio | ⬜ F10 |
| 12.12 | SQLite por dispositivo | Banco local com migrações | ✅ Parcial |
| 12.13 | CI path-based | Testes por workspace afetado | ⬜ Proposto |
| 12.14 | ESLint de boundaries | Regras de import automatizadas | ⬜ Proposto |
| 12.15 | Vitest isolado por workspace | Testes desktop não rodam no mobile | ⬜ Proposto |

---

## 14. Mapa de dependências entre trilhas {#14-dependencias}

```
Trilha A (Fundação & Shell)
  │
  ├──► Trilha B (Conhecimento) ─── Documents/Blocks ─── Graph ─── Search
  │         │
  │         ├──► Trilha D (TCC) ─── Editor ─── DOCX/ABNT ─── Referências
  │         │
  │         └──► Trilha E (Marketing) ─── Conteúdo/Canal ─── Publicação ─── Métricas
  │
  ├──► Trilha C (Calendário) ─── Grade semanal ─── Drag/Resize ─── Google Calendar
  │         │
  │         ├──► Trilha D (TCC usa Calendário para marcos)
  │         │
  │         └──► Trilha E (Marketing usa Calendário editorial)
  │
  └──► Trilha F (Sync) ─── Engine ─── Providers ─── Criptografia
              │
              └── Afeta todos os módulos que persistem dados
```

### Dependências críticas

| De | Para | Razão |
|---|---|---|
| B (Documents) | D (TCC) | Editor do TCC depende de Documents & Blocks |
| C (Calendário) | D (TCC) | TCC gera marcos/entregas no Calendário |
| C (Calendário) | E (Marketing) | Calendário editorial integrado |
| B (Conhecimento) | E (Marketing) | Conteúdo-base usa origem do conhecimento |
| A (Shell) | Tudo | Navegação, workspace, sessão são pré-requisitos |
| F (Sync) | Tudo | Sync precisa de entidades persistidas para transportar |

---

## 15. Roadmap com fases e paralelismo {#15-roadmap}

### Fases do Roadmap (com paralelismo)

```
FASE 1 — Fundação (Trilha A)                          [EM PROGRESSO]
├── 1.1  Shell desktop (Sidebar, Topbar, SplitLayout)     ✅
├── 1.2  Workspace system (entidades, UI, persistência)   ✅
├── 1.3  Home desktop (stats, shortcuts, banner)          ✅
├── 1.4  Perfil desktop (updater, lembrete)               ✅
├── 1.5  Boundary check + CI                              ✅
├── 1.6  Entrypoints apps/mobile e apps/desktop           ✅
├── 1.7  Overlays próprios                                ✅
├── 1.8  Dois providers (facade)                          ✅
├── 1.9  Facades useMobileApp/useDesktopApp               ✅
├── 1.10 StatusBar (indexação/sync)                       ⬜
├── 1.11 Breadcrumb contextual                           ⬜
├── 1.12 Atalhos de teclado ⌘1–⌘4                       ⬜
└── 1.13 Remoção de pontes (ScreenLayers/AppContext)      ⬜

FASE 2 — Base de Conhecimento (Trilha B)                [PRÓXIMA]
├── 2.1  Store de Document/Block (SQLite)                 ⬜
├── 2.2  Editor Markdown-first básico                     ⬜
├── 2.3  openDocuments[] em DesktopSessionState           ⬜
├── 2.4  Migração looseNotes/ClassNote → Document         ⬜
├── 2.5  Graph: filtros por domínio/curso                 ⬜
├── 2.6  Graph: seleção → inspector                      ⬜
├── 2.7  Graph: modo foco + minimapa                     ⬜
├── 2.8  Graph: viewport persistido                       ⬜
├── 2.9  Busca local indexada                             ⬜
└── 2.10 Busca global enriquecida                         ⬜

FASE 3 — Calendário (Trilha C)                          [PARALELA À FASE 2]
├── 3.1  Visão semanal desktop (grade)                    ⬜
├── 3.2  Itens de dia inteiro                             ⬜
├── 3.3  Drag-and-drop na grade                           ⬜
├── 3.4  Resize de blocos                                 ⬜
├── 3.5  Painel contextual do calendário                  ⬜
├── 3.6  Camadas visuais por origem                       ⬜
├── 3.7  Filtros por origem                               ⬜
├── 3.8  Visão diária                                     ⬜
├── 3.9  Visão mensal                                     ⬜
├── 3.10 Criação/edição de eventos/responsabilidades      ⬜
├── 3.11 Estados e recorrência                            ⬜
├── 3.12 Planejado vs. real                               ⬜
├── 3.13 Migração Task/Exam → Responsibility/Event        ⬜
├── 3.14 Google Calendar (OAuth + sync bidirecional)      ⬜
├── 3.15 Conflitos e resolução                            ⬜
├── 3.16 Agenda compacta mobile                           ⬜
└── 3.17 Ações rápidas mobile                             ⬜

FASE 4 — TCC & Projetos (Trilha D)                      [DEPOIS DAS FASES 2+3]
├── 4.1  Modelo interno de documento                      ⬜
├── 4.2  Árvore acadêmica configurável                    ⬜
├── 4.3  Modelos de projeto (TCC/artigo/revisão/etc.)     ⬜
├── 4.4  Editor visual paginado (Word-like)               ⬜
├── 4.5  Estilos acadêmicos                               ⬜
├── 4.6  Títulos numerados + sumário                      ⬜
├── 4.7  Tabelas, imagens, legendas                       ⬜
├── 4.8  Notas de rodapé                                  ⬜
├── 4.9  Referências cruzadas                             ⬜
├── 4.10 Comentários por trecho                           ⬜
├── 4.11 Pré-visualização de impressão                    ⬜
├── 4.12 Biblioteca de referências (DOI, ISBN, BibTeX)    ⬜
├── 4.13 Citações diretas/indiretas                       ⬜
├── 4.14 Perfil ABNT inicial                              ⬜
├── 4.15 Exportação DOCX                                  ⬜
├── 4.16 Importação DOCX (versão candidata)               ⬜
├── 4.17 Comparação de versões                            ⬜
├── 4.18 Round-trip DOCX completo                         ⬜
├── 4.19 Referenciar/duplicar/incorporar blocos           ⬜
├── 4.20 Conformidade diagnóstica                         ⬜
├── 4.21 Versionamento (autosave, histórico, nomeado)     ⬜
├── 4.22 TCC → Calendário (marcos/entregas)               ⬜
├── 4.23 TCC → Conhecimento (ref. vivas)                  ⬜
└── 4.24 TCC → Estudos (flashcards/sessões)               ⬜

FASE 5 — Marketing Studio (Trilha E)                    [PARALELA À FASE 4]
├── 5.1  PositioningProfile (entidade + UI)               ⬜
├── 5.2  Pilares, objetivos, classificação                ⬜
├── 5.3  Sugestões de posicionamento (IA)                 ⬜
├── 5.4  Fila de ideias                                   ⬜
├── 5.5  Briefing e rascunho                              ⬜
├── 5.6  Estados do fluxo editorial                       ⬜
├── 5.7  Templates próprios por canal                     ⬜
├── 5.8  Instagram: feed/carrossel/Reels/Stories          ⬜
├── 5.9  TikTok: vídeo curto                              ⬜
├── 5.10 LinkedIn: texto/documento/imagem/vídeo           ⬜
├── 5.11 Aprovação individual por canal                   ⬜
├── 5.12 Agendamento                                      ⬜
├── 5.13 Publicação autorizada + fallback manual          ⬜
├── 5.14 Métricas automáticas + manuais                   ⬜
├── 5.15 Comparação de desempenho                         ⬜
├── 5.16 Aprendizados estratégicos                        ⬜
├── 5.17 Aviso de responsabilidade (Psicologia)           ⬜
├── 5.18 Calendário editorial integrado                   ⬜
└── 5.19 Séries/campanhas orgânicas                       ⬜

FASE 6 — Sync Engine & Providers (Trilha F)             [PARALELA ÀS FASES 4+5]
├── 6.1  Engine: compare-and-swap + checkRevision         ⬜
├── 6.2  Engine: createPackage + preview + apply          ⬜
├── 6.3  Engine: resolveConflict                          ⬜
├── 6.4  Interface SyncProvider                           ⬜
├── 6.5  GitHubProvider                                   ⬜
├── 6.6  BlobProvider                                     ⬜
├── 6.7  Criptografia de pacotes                          ⬜
├── 6.8  Gestão de credenciais                            ⬜
├── 6.9  Integridade (IntegritySignature)                 ⬜
├── 6.10 Políticas de concorrência                        ⬜
├── 6.11 Merge por domínio (docs ≠ marcadores)            ⬜
├── 6.12 P2PProvider                                     ⬜
└── 6.13 StatusBar de sync                                ⬜

FASE 7 — Engenes Avançadas (pós-release)               [DEPOIS DE TUDO]
├── 7.1  Context Engine + .cectx                          ⬜
├── 7.2  KnowledgePacket                                  ⬜
├── 7.3  Relações semânticas (IA)                         ⬜
├── 7.4  LearningState multidimensional                   ⬜
├── 7.5  Análise de impacto entre domínios                ⬜
├── 7.6  TCC → IA (localizar relações, lacunas)           ⬜
├── 7.7  Markdown/LaTeX como modos completos              ⬜
├── 7.8  Orientação (comentários por trecho)              ⬜
└── 7.9  Exportação PPTX                                  ⬜
```

### Diagrama de paralelismo

```
Tempo ──────────────────────────────────────────────────────────────►

Fase 1  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (Fundação)
Fase 2          ░░░░░░░░████████████████████████░░░░░░░░░░░░░░░░░░░░  (Conhecimento)
Fase 3          ░░░░░░░░████████████████████████░░░░░░░░░░░░░░░░░░░░  (Calendário)
Fase 4                          ░░░░░░░░░░░░████████████████████████  (TCC)
Fase 5                          ░░░░░░░░░░░░████████████████████████  (Marketing)
Fase 6                              ░░░░░░░░░░░░░░████████████████████  (Sync)
Fase 7                                              ░░░░░░████████████  (Engines)

█ = ativo  ░ = aguardando dependência
```

### Regra de paralelismo

- **Fases 2 e 3** podem rodar em paralelo (conhecimento e calendário são independentes).
- **Fases 4 e 5** podem rodar em paralelo (TCC e Marketing são independentes entre si, mas dependem de 2+3).
- **Fase 6** (sync) pode começar quando qualquer módulo tiver dados persistidos, mas
  seu produto final depende de todos os módulos estarem usando o novo modelo.
- **Fase 7** é pós-release e depende de todas as anteriores.

---

## 16. Status de execução atual {#16-status}

### Trilha A — Fundação

| Fase | Status | Testes |
|---|---|---|
| F0 (Congelar) | ✅ Concluída | — |
| F1 (Packages) | ✅ Concluída | — |
| F2 (Domain puro) | ✅ Concluída | 9 testes |
| F3 (DataClient + workspaceId) | ✅ Concluída | 469 testes |
| F4 (Shell desktop) | ✅ Base existente | — |
| F5 (apps/mobile) | ✅ Concluída | Build próprio |
| F6 (apps/desktop) | ✅ Concluída | Build próprio |
| F7 (Overlays próprios) | ✅ Concluída | 475 testes |
| F8 (Dois providers) | ✅ Concluída | 476 testes |
| F9 (entrypoints sem isDesktop) | ✅ Concluída | 476 testes |
| F10 (Remoção pontes) | 🟡 Em progresso | 480 testes |

### Trilha B — Conhecimento

| Fase | Status | Testes |
|---|---|---|
| Documents & Blocks (F5 original) | ⬜ Pendente | — |
| Relations + Graph + Inbox (F6 original) | ✅ Concluída | 474 testes |

### Trilha C — Calendário

| Fase | Status | Testes |
|---|---|---|
| Calendário como domínio (F7 original) | ⬜ Pendente | — |

### Trilha D — TCC

| Fase | Status | Testes |
|---|---|---|
| Gestão de projetos (F8 Slice 1) | 🟡 Parcial | 476 testes |
| Editor acadêmico + DOCX | ⬜ Pendente | — |

### Trilha E — Marketing

| Fase | Status | Testes |
|---|---|---|
| Marketing Studio (F9 original) | ⬜ Pendente | — |

### Trilha F — Sync

| Fase | Status | Testes |
|---|---|---|
| Protocolo + providers (F10 original) | ⬜ Pendente | — |

### Contagem total de funcionalidades

| Módulo | Total | Implementadas | Pendentes |
|---|---|---|---|
| Shell & Navegação | 15 | 7 | 8 |
| Home Desktop | 6 | 3 | 3 |
| Workspaces | 9 | 6 | 3 |
| Faculdade | 7 | 3 | 4 |
| Base de Conhecimento | 25 | 12 | 13 |
| Calendário | 31 | 8 | 23 |
| TCC & Projetos | 46 | 9 | 37 |
| Marketing Studio | 34 | 0 | 34 |
| Estudos | 9 | 5 | 4 |
| Sync Engine | 24 | 6 | 18 |
| Perfil & Settings | 9 | 4 | 5 |
| Infraestrutura | 15 | 12 | 3 |
| **TOTAL** | **230** | **75** | **155** |

---

> **Uso deste documento:** referência para planejamento de sprints, priorização de
> features e acompanhamento de progresso. Atualizar conforme funcionalidades são
> implementadas. Cada funcionalidade pode ser rastreada de volta à fonte em
> `desktop/context-desktop/`.
