# cecistudy Desktop — Arquitetura-Alvo e Decisões Técnicas

> Documento 2 de 4. Consolida os documentos de visão (`Arquitetura técnica-alvo`,
> `Blueprint arquitetural`, `cecistudy — contexto geral`) reconciliados com o estado real
> do código (ver Documento 1). É o "para onde vamos" tecnicamente.

---

## 1. Decisão arquitetural central

O desktop **não é** o mobile em janela maior. É uma segunda experiência de produto sobre
um domínio compartilhado.

```text
                                CECISTUDY
                                    │
                ┌───────────────────┴───────────────────┐
        Mobile Experience                       Desktop Experience
        captura e acompanhamento                workspace de produção
                └───────────────────┬───────────────────┘
                            Application Core
                                    │
                             Domain Core
                                    │
        ┌───────────────────┬───────┴───────┬───────────────────┐
   Knowledge           Calendar         Projects/TCC        Marketing
        └───────────────────┴───────┬───────┴───────────────────┘
                           Relations / Provenance
                                    │
                             Local SQLite Store
                                    │
                    ┌───────────────┴───────────────┐
                 Local Engines                    Sync Engine
       (Search, Graph, Context, Learning)   (Protocolo + Criptografia)
                                                       │
                                          Providers (GitHub · P2P · futuros)
```

**Regra fundamental:** desktop e mobile compartilham dados e domínio, não compartilham
navegação, densidade de informação, nem capacidade de edição.

## 2. Camadas e o que pode depender de quê

| Camada | Responsabilidade | Conhece React? | Onde vive hoje |
|---|---|---:|---|
| **Experience** | Shells, layouts, painéis, menus, atalhos | Sim | `src/desktop/*`, `apps/desktop/*` |
| **Application** | Casos de uso, comandos, validação de fluxo | Não | `packages/application` |
| **Domain** | Entidades, regras, relações, invariantes | Não | `packages/domain` |
| **Repository/Local Store** | SQLite, migrações, consultas, transações | Não | `packages/data` |
| **Engines** | Busca, Graph, contexto, aprendizagem, sync | Não | `packages/sync` (parcial); Graph/Search ainda dentro de `src/desktop` |
| **Providers** | GitHub, P2P, Google Calendar, redes sociais, Blob | Não | a construir |

Regra prática: uma view nova **não acessa arrays do `AppContext` diretamente** para
implementar uma regra de negócio — ela chama um caso de uso, que valida, persiste e emite
eventos. Isso já está sendo seguido para os módulos migrados (workspace, knowledge,
projects); ainda não está sendo seguido pelas telas legadas de Faculdade/Estudos.

## 3. Workspaces

O cecistudy terá múltiplos Workspaces isolados por padrão (ex.: Acadêmico, Profissional,
Pessoal). Todas as entidades sincronizáveis carregam `workspaceId` (já implementado na
migração 11→12).

| Operação | Escopo padrão |
|---|---|
| Busca | Workspace atual |
| Graph | Workspace atual |
| Inbox | Workspace atual |
| IA (futuro) | Workspace atual, salvo autorização explícita |
| Sincronização | Todos os workspaces autorizados, sem misturar índices |
| Relação entre workspaces | Só por ação explícita, com proveniência |

Estado de sessão (`DesktopSessionState`, **não sincronizado**, já implementado):

```ts
interface DesktopSessionState {
  lastWorkspaceId: string;
  openDocuments: string[];
  activeModule: string;
  selectedGraphNodeId?: string;
  graphViewport?: { x: number; y: number; zoom: number };
  activePanels: string[];
  layoutState: Record<string, unknown>;
}
```

## 4. Domínios do produto e quem é dono de quê

| Domínio | Dono principal | Status de implementação |
|---|---|---|
| Base de Conhecimento | Document, Block, Concept, Relation, Suggestion, AssociationPolicy, Graph | Relations/Inbox/Graph ✅ · Document/Block ⬜ (F5) |
| Calendário | Event, Responsibility, PlanningBlock, Occurrence, ExecutionRecord, RecurrenceRule | UI rica ✅ (sobre modelo antigo) · domínio novo ⬜ (F7) |
| TCC/Projetos | Project, Output, AcademicTree, Reference, Citation, Version | Gestão de projeto/saída ✅ · editor/DOCX ⬜ |
| Marketing | PositioningProfile, ContentIdea, ContentBase, ChannelVariant, Publication, MetricSnapshot | ⬜ 100% greenfield |
| Estudos | StudySession, Flashcard, Question, LearningState | Existente (legado), integração com os demais ainda a fazer |

Um módulo pode **referenciar** entidade de outro módulo, mas não edita seus dados. Ex.: uma
saída de TCC pode sugerir uma responsabilidade no Calendário — o Calendário continua dono
do horário.

Estratégias de referência entre domínios:

| Estratégia | Uso |
|---|---|
| Referência viva | Origem única; novas versões podem ser sinalizadas |
| Snapshot | Versão específica preservada como evidência histórica |
| Cópia editorial | Conteúdo incorporado e editável localmente noutro contexto |

## 5. Persistência local

Cada dispositivo mantém um SQLite local como banco de trabalho (via Tauri/Rust no
desktop). A UI nunca acessa banco remoto diretamente — sempre via repositório/caso de uso.

Tabelas-alvo (parte já existe via schema atual + migrações, parte é greenfield):

```text
workspaces · workspace_settings · documents · blocks · concepts · relations · areas · tags
suggestions · association_policies · learning_states
projects · project_outputs · academic_nodes · project_documents · references · citations
comments · versions
calendar_events · recurrence_rules · occurrences · responsibilities · subtasks
planning_blocks · execution_records
content_bases · channel_variants · publications · metric_snapshots · strategic_insights
study_sessions · flashcards · questions
sync_records · sync_tombstones · sync_conflicts · attachments · migrations
```

Regra preservada: dados de usuário ficam separados de catálogos estáticos (o backup atual
já exclui `approaches`/`questions` de catálogo — manter esse padrão).

## 6. Sync Engine e Providers

### 6.1 Princípio
GitHub pode ser o **primeiro provider**, nunca o backend conceitual. O app conhece o
protocolo; o provider conhece só transporte e armazenamento.

```text
Local SQLite → Change Log/Outbox → Sync Engine → Serialização própria → Criptografia → SyncProvider
                                                                          ├── GitHubProvider
                                                                          ├── P2PProvider
                                                                          └── futuros
```

### 6.2 Pacote de sincronização (a versionar pelo próprio app)

```text
SyncPackage
├── manifest (schemaVersion, protocolVersion, appVersion, revision, parentRevision,
│             deviceId, workspaceScope, createdAt, contentHash, encryptionVersion)
├── snapshot ou operations
├── tombstones
├── contentHashes
├── encryptionMetadata
└── integritySignature
```

### 6.3 Concorrência — compare-and-swap

```text
local conhece remoto = 127
local edita e tenta publicar baseado em 127
  se remoto ainda é 127 → publica 128
  se remoto já é 128    → rejeita sobrescrita, baixa estado novo, faz merge ou pede resolução
```

O merge LWW + stamps + tombstones **já implementado** pode continuar como estratégia de
compatibilidade para dados simples (registros/coleções). Documentos e blocos acadêmicos
precisarão de uma estratégia de merge própria (não é seguro tratar um documento acadêmico
como um registro de tarefa).

### 6.4 Interface de provider

```ts
interface SyncProvider {
  inspectRemote(): Promise<RemoteManifest>;
  downloadPackage(ref: PackageRef): Promise<Uint8Array>;
  uploadPackage(input: UploadPackageInput): Promise<RemoteManifest>;
  listRevisions(): Promise<RemoteRevision[]>;
  getMetadata(): Promise<ProviderMetadata>;
}
```

`P2PProvider` reaproveita a UI de pareamento já existente (`pairing.ts`, `scanQr.ts`,
`transport-bridge.ts`).

### 6.5 Blobs e criptografia
Arquivos grandes (PDFs, imagens, DOCX, vídeos) ficam atrás de um `BlobProvider` separado do
provider de dados estruturados — os dois podem começar no GitHub, mas devem ser
substituíveis independentemente. Criptografia é camada independente do provider; tokens
nunca embutidos no bundle/executável; credenciais revogáveis, armazenadas via mecanismo
seguro do SO quando possível.

## 7. Núcleo Tauri (Rust)

Hoje `src-tauri` só tem plugins de shell (notification, updater, process, window-state) —
**zero lógica de domínio em Rust**. A evolução proposta é gradual, não um big-bang:

```text
Rust/Tauri Core (destino, não passo imediato)
├── LocalStore · WorkspaceStore · DocumentStore · GraphStore
├── SearchIndex · KnowledgeIndexer · ContextEngine · LearningEngine
├── SyncEngine · Backup/Restore · BlobManager
```

Comandos Tauri propostos (pequenos, tipados, orientados a caso de uso — nunca "devolver a
tabela inteira"):

```text
workspace_list · workspace_open · workspace_create
document_get · document_save · document_export · document_import_candidate
search_query · graph_query
suggestion_list · suggestion_apply
calendar_sync_google
sync_inspect · sync_download · sync_upload · sync_preview · sync_apply
backup_export · backup_restore
```

Eventos do núcleo para a UI (evitar polling agressivo):

```text
workspace.changed · document.updated · graph.indexed · search.indexed
suggestions.updated · calendar.sync.changed · sync.status.changed
sync.conflict.detected · backup.completed
```

**Decisão de sequenciamento:** manter casos de uso em TypeScript (como já está) enquanto o
volume de dados for pequeno; migrar para Rust primeiro as partes pesadas de longa duração
(indexação, sync, processamento de documentos grandes) — não a UI nem os casos de uso
simples.

## 8. Editor acadêmico e DOCX — maior risco técnico do projeto

Ordem de implementação recomendada (não pular etapas):

| Ordem | Entrega |
|---:|---|
| 1 | Modelo interno de documento e estilos |
| 2 | Editor visual paginado (páginas, margens, cabeçalho/rodapé, numeração, estilos de parágrafo) |
| 3 | Estrutura acadêmica configurável (árvore por tipo de projeto) |
| 4 | Referências e citações ABNT |
| 5 | Exportação DOCX |
| 6 | Importação DOCX como **versão candidata** (nunca substitui silenciosamente) |
| 7 | Comparação detalhada e aceitação explícita |
| 8 | Markdown e LaTeX como modos completos |

Fluxo de round-trip obrigatório:

```text
Documento interno v1 → exportar DOCX → edição externa (Word) → importar como v2 candidata
→ comparação detalhada → aceitar / revisar / descartar
```

A conversão deve ter diagnóstico de fidelidade: elementos não representáveis são
preservados quando possível e **marcados como parcialmente estruturados** — nunca falha
silenciosa.

## 9. Decisões técnicas que precisam de protótipo antes de comprometer arquitetura

1. Engine do editor visual paginado (opções: ProseMirror/Tiptap adaptado, ou motor próprio)
2. Modelo interno de documentos, estilos e layout
3. Engine de import/export DOCX (ex.: docx.js / mammoth / conversão via Rust)
4. Comparação estrutural e visual de versões
5. Engine bibliográfica ABNT
6. Schema SQLite final (tabelas listadas na seção 5)
7. Fronteira exata TypeScript ↔ Rust
8. Serialização do `SyncPackage`
9. Criptografia e gestão de chaves
10. Autenticação GitHub e APIs externas (Google Calendar, Instagram, TikTok, LinkedIn)
11. `BlobProvider` inicial
12. Indexação e busca local dedicada (hoje é genérica)
13. Formato do `.cectx` (contexto compilado para IA)
14. Execução em background (indexação, sync)
15. Comportamento de providers offline
16. Desempenho com documentos longos, muitos blocos e grafos extensos

Cada decisão deve ficar **atrás de uma interface** — um protótipo que falhar é substituível
sem reescrever domínio.

## 10. O que não fazer (guardrails não negociáveis)

- Não criar um segundo `AppContext` só para o desktop.
- Não colocar token do GitHub no frontend/bundle.
- Não tratar o repositório GitHub como banco SQL.
- Não confiar apenas na convenção "um dispositivo por vez" sem verificação compare-and-swap.
- Não transformar toda relação em link automático — inferidas entram como sugestão no Inbox.
- Não deixar a IA escrever documentos completos sem confirmação.
- Não importar eventos do Google Calendar como editáveis no cecistudy.
- Não começar pelo Graph visual, editor paginado ou publicação em redes sociais sem antes
  fechar os contratos de domínio/persistência que sustentam essas telas (F5 antes de F8/F9).

## 11. Critérios de arquitetura saudável (checklist de avaliação contínua)

- Desktop tem navegação e densidade próprias; mobile continua simples.
- Mesmo dado, projeções diferentes por plataforma via matriz de capacidades — não
  `if (isDesktop)` espalhado.
- `AppContext` não recebe novas regras de negócio.
- Workspaces isolados por padrão.
- Cada entidade tem dono e proveniência claros.
- Graph navegável e explicável; Calendário separa evento/responsabilidade/plano/realidade.
- TCC gera saída acadêmica completa com DOCX reimportável.
- Marketing separa conteúdo-base de versão por canal.
- GitHub é substituível sem reescrever domínio.
- Revisão remota nunca é sobrescrita silenciosamente.
- Migração legada é repetível e verificável.
