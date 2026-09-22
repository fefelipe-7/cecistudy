# cecistudy — contexto geral e guia de implementação do app desktop

**Produto:** cecistudy  
**Usuária de referência:** Ceci  
**Documento:** contexto de produto, arquitetura e implementação desktop  
**Status:** guia técnico para orientar a reconstrução incremental  
**Autor:** Manus AI  

> O objetivo deste documento é transformar a visão aprovada para o cecistudy em um plano de implementação concreto no projeto existente. Ele explica o problema atual, a arquitetura desejada, os módulos, a separação desktop/mobile, a persistência, a sincronização, a migração e os critérios para saber se a evolução está funcionando.

## 1. O problema que está sendo resolvido

O cecistudy atual funciona como uma aplicação mobile-first que também pode ser exibida dentro de uma janela desktop. A estrutura atual é uma SPA React/TypeScript/Vite sem router tradicional, com o estado global concentrado no `AppContext`, views que consomem `useApp()` e uma casca desktop Tauri que ainda carrega o mesmo bundle web da raiz. [1]

Essa arquitetura foi adequada para começar, mas cria uma limitação de produto: o desktop acaba sendo interpretado como uma versão maior do mobile. A navegação por pilha, a BottomNav, o FAB e a composição de telas foram pensados para captura e acompanhamento rápido. Eles não são suficientes para uma experiência de estudo prolongado, escrita acadêmica, pesquisa, organização visual e produção profissional.

A mudança desejada não é simplesmente aumentar a largura das telas. O desktop precisa funcionar como um **workspace ativo de estudos e produção intelectual**, com documentos, painéis, Graph, editor acadêmico, calendário completo, projetos, TCC e Studio de Marketing. O mobile continuará compartilhando os mesmos dados, mas terá uma função diferente: registrar, consultar, acompanhar e executar ações rápidas.

A regra fundamental é:

> **Desktop e mobile compartilham o domínio e os dados, mas não precisam compartilhar a mesma experiência, navegação, densidade de informação ou capacidade de edição.**

## 2. Visão final do produto

O cecistudy será um sistema pessoal local-first para quatro atividades conectadas:

| Domínio | Pergunta principal |
|---|---|
| **Base de Conhecimento** | O que a Ceci escreveu, compreendeu, relacionou e ainda precisa explorar? |
| **Calendário** | O que precisa acontecer, quando deve ser feito e o que realmente aconteceu? |
| **TCC/Projetos** | Como uma pesquisa é organizada e transformada em uma produção acadêmica? |
| **Marketing/Posicionamento** | Como o conhecimento e a trajetória da Ceci se transformam em presença profissional orgânica? |

O módulo de Estudos continua sendo importante como domínio de revisão, sessões, flashcards e questões, mas será integrado aos quatro domínios principais.

O diferencial não será a existência isolada de cada módulo. Será a continuidade entre eles:

```text
Aula
  → registro
  → documento
  → bloco
  → conceito
  → relação
  → capítulo do TCC
  → etapa
  → responsabilidade
  → bloco de calendário
  → ideia de conteúdo
  → versão para canal
  → publicação
  → métrica
  → aprendizado
```

Cada módulo mantém a propriedade dos seus dados. O Calendário é dono do tempo; o TCC é dono da produção acadêmica; a Base de Conhecimento é dona dos documentos, conceitos e relações; o Marketing é dono do posicionamento, conteúdo e publicação; Estudos é dono da revisão e do histórico pedagógico.

## 3. O que já existe no projeto atual

O repositório atual possui uma base funcional que deve ser aproveitada, não descartada. Ele usa React 19, TypeScript, Vite, Tailwind CSS, Framer Motion e Capacitor nos aplicativos nativos. O desktop usa Tauri 2, com janela própria, updater, notificações e estado de janela, mas ainda carrega o bundle web compartilhado. [1]

O modelo atual reúne entidades como `Course`, `ClassNote`, `Task`, `Exam`, `StudySession`, `ReadingItem`, `Flashcard`, `PsychologyConcept`, `MaterialItem`, `InternshipLog` e `TccData`. A persistência atual usa uma camada dual entre `localStorage` na web e `@capacitor/preferences` no nativo. [2]

O projeto também possui versionamento de schema e migrações consecutivas. A versão atual documentada é a 11, e o mecanismo de importação recusa versões futuras, aplica migrações conhecidas, valida o payload e só então restaura o banco. [3] [4]

A sincronização existente já possui `SyncIndex`, stamps por coleção e registro, tombstones, merge LWW determinístico, união de sets e preview de alterações. A parte de transporte P2P está isolada em `transport-bridge.ts`, com a UI montada e o transporte real ainda pendente. [5] [6]

Essas peças formam uma boa base de transição. O problema não é falta de código; é que o código atual ainda organiza o domínio como listas globais expostas pelo `AppContext`, enquanto a nova visão exige Workspaces, documentos, relações, eventos, projetos, saídas, versões e providers.

## 4. Arquitetura-alvo

A arquitetura desejada terá experiências diferentes sobre um núcleo comum:

```text
                                CECISTUDY
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
        Desktop Experience                       Mobile Experience
        workspace de produção                    captura e acompanhamento
                │                                       │
                └───────────────────┬───────────────────┘
                                    │
                            Application Core
                                    │
                             Domain Core
                                    │
        ┌───────────────────┬───────┴───────┬───────────────────┐
        │                   │               │                   │
   Knowledge           Calendar         Projects/TCC        Marketing
        │                   │               │                   │
        └───────────────────┴───────┬───────┴───────────────────┘
                                    │
                           Relations / Provenance
                                    │
                             Local SQLite Store
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                 Local Engines                    Sync Engine
                    │                               │
       ┌────────────┼────────────┐        ┌─────────┴─────────┐
       │            │            │        │                   │
    Search       Graph       Context   Sync Protocol       Providers
    Index        Engine      Learning   + Encryption       GitHub/P2P
```

### 4.1 Camadas

| Camada | Responsabilidade | Pode conhecer React? |
|---|---|---:|
| **Experience** | Shells, layouts, painéis, menus, atalhos e projeções de plataforma. | Sim. |
| **Application** | Casos de uso, comandos, validação de fluxo e eventos de aplicação. | Não. |
| **Domain** | Entidades, regras, relações, estados e invariantes. | Não. |
| **Repository/Local Store** | SQLite, migrações, consultas e transações. | Não. |
| **Engines** | Busca, Graph, indexação, contexto, aprendizagem e sync. | Não. |
| **Providers** | GitHub, P2P, Google Calendar, redes sociais e Blob storage. | Não. |

A regra prática é que uma nova view não deve acessar diretamente arrays do `AppContext` para criar uma regra de negócio. Ela deve chamar um caso de uso, que valida a ação, grava no repositório e emite os eventos necessários.

## 5. Organização sugerida do código

A reorganização pode começar dentro do monorepo atual, sem exigir uma reescrita completa no primeiro momento.

```text
src/
├── app/
│   ├── App.tsx
│   ├── AppProvider.tsx
│   └── boot/
│
├── core/
│   ├── domain/
│   │   ├── workspace/
│   │   ├── knowledge/
│   │   ├── calendar/
│   │   ├── projects/
│   │   ├── marketing/
│   │   ├── studies/
│   │   └── relations/
│   ├── application/
│   │   ├── use-cases/
│   │   ├── commands/
│   │   └── events/
│   ├── ports/
│   │   ├── repositories.ts
│   │   ├── sync.ts
│   │   ├── blobs.ts
│   │   └── integrations.ts
│   └── serialization/
│
├── infrastructure/
│   ├── local/
│   ├── sync/
│   │   ├── engine/
│   │   ├── protocol/
│   │   ├── providers/github/
│   │   └── providers/p2p/
│   ├── blobs/
│   └── integrations/
│       ├── google-calendar/
│       ├── instagram/
│       ├── tiktok/
│       └── linkedin/
│
├── features/
│   ├── desktop/
│   │   ├── shell/
│   │   ├── home/
│   │   ├── workspace/
│   │   ├── knowledge/
│   │   ├── calendar/
│   │   ├── projects/
│   │   └── marketing/
│   ├── mobile/
│   │   ├── shell/
│   │   ├── capture/
│   │   └── agenda/
│   └── shared/
│
├── legacy/
│   ├── app-context-adapter.ts
│   └── migration/
│
└── platform/
    ├── web/
    ├── capacitor/
    └── tauri/
```

Essa organização é uma direção gradual. Não é necessário mover todos os arquivos de uma vez. O importante é que código novo seja criado nos limites novos, enquanto adaptadores permitem que as telas existentes continuem funcionando durante a migração.

## 6. Desktop como produto próprio

### 6.1 Shell desktop

O `DesktopAppShell` deve ser uma composição própria, e não uma variação condicional da BottomNav. Ele deverá assumir uma janela de trabalho persistente, com navegação lateral, abas ou documentos abertos, painéis redimensionáveis e um inspector contextual.

Uma estrutura inicial é:

```text
DesktopAppShell
├── DesktopTitleBar / top commands
├── WorkspaceSwitcher
├── DesktopSidebar
│   ├── Home
│   ├── Conhecimento
│   ├── Calendário
│   ├── Projetos / TCC
│   ├── Estudos
│   └── Marketing
├── WorkspaceCanvas
│   ├── tabs ou documentos abertos
│   ├── conteúdo principal
│   └── painéis especializados
├── ContextInspector
├── CommandPalette
└── StatusBar
    ├── indexação
    ├── sincronização
    └── provider
```

A Home desktop será uma superfície transversal e secundária. Ela mostrará retomadas, itens fixados, relações recentes, mudanças importantes, sugestões pendentes e próximos contextos. Pendências do Calendário poderão aparecer nela, mas a Home não substituirá o Calendário.

### 6.2 Retomada de sessão

Ao fechar e reabrir o desktop, o cecistudy deverá restaurar o último Workspace, documentos abertos, painel selecionado, nó do Graph, posição da viewport, módulo ativo e layout. O estado de sessão não deve ser misturado com os dados de domínio.

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

### 6.3 Matriz de capacidades

Desktop e mobile usarão o mesmo domínio, mas cada entidade terá capacidades diferentes por plataforma.

```ts
interface PlatformCapability {
  entity: string;
  platform: 'desktop' | 'mobile';
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  projection: 'compact' | 'standard' | 'rich';
}
```

Essa matriz evita espalhar condições como `if (isDesktop)` por todas as views. Ela também permite que o mobile veja um resumo de uma relação profunda ou de um TCC sem receber o editor completo.

## 7. Workspaces

O cecistudy terá Workspaces independentes. Um Workspace é um universo de conhecimento, projetos, aprendizagem e contexto.

```text
User
├── Workspace Acadêmico
├── Workspace Profissional
└── Workspace Pessoal
```

O isolamento será o padrão:

| Operação | Escopo padrão |
|---|---|
| Busca | Workspace atual. |
| Graph | Workspace atual. |
| Inbox | Sugestões do Workspace atual. |
| IA | Contexto do Workspace atual, salvo autorização futura. |
| Sincronização | Todos os Workspaces autorizados inicialmente, sem misturar seus índices. |
| Relações entre Workspaces | Somente por ação explícita. |

Todas as entidades sincronizáveis deverão carregar `workspaceId` ou estar ligadas a uma entidade que o carregue. Relações entre Workspaces, quando existirem, terão origem, destino, autorização e proveniência.

## 8. Domínios do produto

### 8.1 Base de Conhecimento

A Base de Conhecimento será a fundação documental e semântica do cecistudy. A Ceci poderá escrever livremente, em nota temporária ou permanente, e o sistema trabalhará em segundo plano para indexar, sugerir relações e atualizar o Graph.

Entidades principais:

```text
Workspace
Document
Block
Concept
Relation
Area
Tag
Suggestion
AssociationPolicy
LearningState
Context
KnowledgePacket
Agent
Conversation
```

As relações serão classificadas como explícitas, determinísticas, semânticas ou definidas pela usuária. As inferidas entrarão no Inbox como hipóteses; não serão tratadas como fatos sem curadoria.

O Graph terá filtros por módulo, projeto, período, tipo de relação e profundidade. Ao selecionar um nó, poderá mostrar documentos de evidência, projetos conectados, quantidade de relações, estado de aprendizagem e lacunas.

A aprendizagem ativa será intencional ou contextual. O estado de um conceito poderá separar definição, explicação, recuperação, aplicação, comparação, resolução de problemas e criação de exemplos.

O `.cectx` será um artefato derivado e inicialmente interno. Ele será produzido pelo Context Engine para compilar contexto relevante antes de uma interação com IA. A Ceci poderá inspecioná-lo ou exportá-lo futuramente, mas não precisará editá-lo manualmente.

### 8.2 Calendário acadêmico

O Calendário será dono da dimensão temporal. Ele não será um calendário pessoal genérico e não substituirá a Home.

O domínio diferencia:

```text
Event            → algo que acontece em um horário
Responsibility   → algo que precisa ser realizado em um prazo
PlanningBlock    → reserva de tempo para uma responsabilidade
Occurrence       → instância de um evento recorrente
ExecutionRecord  → o que realmente aconteceu
RecurrenceRule   → regra que gera ocorrências
Subtask          → etapa de uma responsabilidade maior
```

Os níveis de compromisso serão `obrigatório`, `importante`, `recomendado` e `opcional`. Apenas itens recomendados poderão ser reservados por sugestão do sistema depois de aceitação. Itens opcionais não gerarão cobrança.

O desktop terá visão semanal como principal, com grade de horários, itens de dia inteiro, blocos arrastáveis/redimensionáveis, filtros, camadas visuais e painel contextual. O mobile terá agenda compacta e ações rápidas.

Faculdade, TCC, Estudos, Estágio, Marketing editorial e Google Calendar poderão aparecer na mesma visão temporal, com identidade visual própria. Cada módulo continuará dono do seu conteúdo.

A integração com Google Calendar será bidirecional. Eventos criados no cecistudy e sincronizados poderão ser editados nos dois lados. Eventos originalmente criados no Google serão importados como somente leitura no cecistudy. Uma responsabilidade local poderá ser associada a um evento externo sem assumir propriedade dos campos do Google.

### 8.3 TCC e Projetos

O TCC será uma instância de um sistema mais amplo de projetos acadêmicos. O cecistudy permitirá até cinco projetos ativos simultaneamente, contando todos os tipos de projeto, e um projeto poderá ter várias saídas sem consumir um slot por saída.

```text
Project
├── identity and settings
├── research base
├── academic tree
├── outputs
├── references
├── guidance and review
├── versions and deliveries
└── integrations
```

Projetos poderão usar modelos de TCC monográfico, artigo, revisão bibliográfica, estudo empírico, estudo de caso, relatório de estágio ou uma estrutura livre. A árvore acadêmica será configurável em todos os casos.

Uma saída terá seleção e ordem próprias. Ela poderá referenciar, duplicar ou incorporar documentos e blocos. O primeiro fluxo de produto poderá expor uma saída principal, mas o domínio suportará múltiplas saídas desde o início.

O editor visual será paginado e próximo do Word, com estilos, margens, cabeçalho, rodapé, numeração, tabelas, imagens, citações, notas, referências cruzadas e pré-visualização. O documento interno será a fonte canônica; DOCX será o primeiro formato de importação e exportação.

O round-trip DOCX será baseado em versões candidatas:

```text
Documento interno v1
  → exportar DOCX
  → editar no Word
  → importar versão candidata v2
  → comparação detalhada
  → aceitar, revisar ou descartar
```

A importação não sobrescreverá silenciosamente o documento. O perfil institucional será configurável e a validação de conformidade será diagnóstica, sem bloquear a escrita.

### 8.4 Marketing e Posicionamento

O Studio será voltado para a presença pessoal e profissional da Ceci, inicialmente com conteúdo orgânico em Instagram, TikTok e LinkedIn.

A cadeia será:

```text
PositioningProfile
  → Pillar / Objective / Audience
  → ContentIdea
  → ContentBase
  → ChannelVariant
  → Publication
  → MetricSnapshot
  → StrategicInsight
```

O conteúdo-base será independente do canal. Cada rede terá uma adaptação própria, com formatos e componentes opcionais.

| Canal | Formatos iniciais |
|---|---|
| Instagram | Feed, carrossel, Reels, Stories e sequência de Stories. |
| TikTok | Vídeo curto e séries futuras. |
| LinkedIn | Texto, documento/carrossel, imagem e vídeo curto. |

O fluxo editorial terá ideias, briefing, rascunho, revisão, aprovação individual, agendamento, publicação, métricas e reaproveitamento. A publicação automática exigirá autorização por peça e canal. O fluxo manual será sempre possível.

Métricas poderão ser automáticas por APIs oficiais ou registradas manualmente. Aprendizados estratégicos serão sugestões confirmáveis e não alterarão o posicionamento automaticamente. O sistema poderá mostrar avisos opcionais de responsabilidade para conteúdos ligados à Psicologia, sem bloquear a decisão da Ceci.

### 8.5 Estudos

Estudos continuará sendo dono de sessões, revisões, flashcards, questões e histórico pedagógico. Seus objetos poderão receber origem de documentos, conceitos, TCC, calendário e aulas.

O TCC ou a Base de Conhecimento poderão sugerir perguntas, flashcards e sessões, mas a Ceci precisará confirmar a criação. Estudos não será obrigado a consumir todo o conhecimento existente.

## 9. Integração entre domínios

Os módulos serão conectados por relações tipadas e eventos de aplicação.

```text
ClassNote
  └── generates → Document
Document
  └── contains → Block
Block
  └── supports → Concept
Concept
  └── grounds → TccSection
TccSection
  └── suggests → Responsibility
Responsibility
  └── planned-in → PlanningBlock
Concept
  └── inspires → ContentIdea
ContentIdea
  └── becomes → ContentBase
ContentBase
  └── adapts-to → ChannelVariant
```

A referência entre domínios não copiará conteúdo automaticamente. As estratégias serão:

| Estratégia | Uso |
|---|---|
| **Referência viva** | A origem continua única e novas versões podem ser sinalizadas. |
| **Snapshot** | Uma versão específica é preservada como evidência histórica. |
| **Cópia editorial** | O conteúdo é incorporado a outro contexto e pode ser editado localmente. |

A Home desktop e a busca global utilizarão essas relações, mas não substituirão a propriedade dos módulos.

## 10. Application Core e casos de uso

O Application Core deve ser a principal fronteira entre interface e domínio. Ele não precisa estar completo antes do primeiro protótipo, mas todo novo fluxo importante deve passar por ele.

Casos de uso iniciais:

```text
createWorkspace()
switchWorkspace()
createDocument()
updateDocument()
createConcept()
acceptSuggestion()
createRelation()
createCalendarEvent()
planResponsibility()
recordExecution()
createProject()
configureAcademicTree()
createOutput()
insertCitation()
exportDocx()
importDocxCandidate()
createContentBase()
createChannelVariant()
approvePublication()
recordMetricSnapshot()
startSync()
previewSync()
applySync()
restoreBackup()
```

Cada caso de uso deve validar invariantes, persistir a alteração, emitir um evento e atualizar índices ou sincronização conforme necessário.

Exemplos de invariantes:

| Regra | Dono |
|---|---|
| Um projeto ativo não pode exceder o limite global de cinco. | Projects domain. |
| Um evento externo do Google não pode ser editado pelo cecistudy. | Calendar integration. |
| Uma sugestão sem aprovação não cria uma relação definitiva. | Knowledge domain. |
| Uma publicação não pode ser enviada sem aprovação do canal. | Marketing domain. |
| Um DOCX importado não substitui a versão atual sem comparação. | Document/Export domain. |
| Um upload não pode publicar sobre uma revisão remota desconhecida. | Sync Engine. |

## 11. Persistência local

Cada dispositivo terá um SQLite local como banco de trabalho. A aplicação não acessará o banco remoto diretamente. Repositórios e casos de uso formarão a interface local.

Tabelas ou agregados iniciais:

```text
workspaces
workspace_settings
documents
blocks
concepts
relations
areas
tags
suggestions
association_policies
learning_states
projects
project_outputs
academic_nodes
project_documents
references
citations
comments
versions
calendar_events
recurrence_rules
occurrences
responsibilities
subtasks
planning_blocks
execution_records
content_bases
channel_variants
publications
metric_snapshots
strategic_insights
study_sessions
flashcards
questions
sync_records
sync_tombstones
sync_conflicts
attachments
migrations
```

O banco deve separar dados de usuário de catálogos estáticos. O projeto atual já exclui catálogos como `approaches` e `questions` do backup do usuário, e essa distinção deve ser preservada durante a migração. [7]

## 12. Sync Engine e GitHub Provider

### 12.1 Princípio

O GitHub pode ser o primeiro provider, mas não deve ser o backend conceitual do cecistudy. O app conhecerá o protocolo de sincronização; o provider conhecerá o transporte e o armazenamento.

```text
Local SQLite
   ↓
Change Log / Outbox
   ↓
Sync Engine
   ↓
Serialização própria
   ↓
Criptografia
   ↓
SyncProvider
   ├── GitHubProvider
   ├── P2PProvider
   └── futuros providers
```

### 12.2 Pacote de sincronização

O pacote deverá ser versionado pelo cecistudy:

```text
SyncPackage
├── manifest
├── schemaVersion
├── protocolVersion
├── appVersion
├── revision
├── parentRevision
├── deviceId
├── workspaceScope
├── snapshot or operations
├── tombstones
├── contentHashes
├── encryptionMetadata
└── integritySignature
```

O `SyncManifest` deverá carregar pelo menos `schemaVersion`, `protocolVersion`, `appVersion`, `revision`, `parentRevision`, `deviceId`, `workspaceScope`, `createdAt`, `contentHash` e `encryptionVersion`.

### 12.3 Concorrência e revisão

A política inicial será um dispositivo editando por vez. Porém, o protocolo não confiará somente nessa convenção.

```text
local conhece remoto = 127
local edita
local tenta publicar baseado em 127

se remoto ainda é 127:
    publica 128

se remoto já é 128:
    rejeita sobrescrita
    baixa estado novo
    faz merge ou pede resolução
```

A verificação compare-and-swap evita que uma operação antiga sobrescreva uma revisão mais nova.

O merge atual LWW por registro, stamps e tombstones pode ser preservado como uma primeira estratégia de compatibilidade. Com a expansão para documentos, blocos e operações, será necessário acrescentar IDs de operação, revision global, origem do dispositivo e conflitos explícitos. O merge de um documento acadêmico não deve ser tratado da mesma maneira que o merge de um marcador ou de um set de favoritos.

### 12.4 Providers

O `SyncProvider` terá responsabilidades de transporte e estado remoto:

```ts
interface SyncProvider {
  inspectRemote(): Promise<RemoteManifest>;
  downloadPackage(ref: PackageRef): Promise<Uint8Array>;
  uploadPackage(input: UploadPackageInput): Promise<RemoteManifest>;
  listRevisions(): Promise<RemoteRevision[]>;
  getMetadata(): Promise<ProviderMetadata>;
}
```

A restauração será principalmente uma responsabilidade de Backup/Recovery. O `P2PProvider` poderá reutilizar a UI de pareamento e o ponto de encaixe já preparado em `transport-bridge.ts`. [5]

### 12.5 Blobs

Arquivos grandes ficarão atrás de um `BlobProvider`, separado do provider de dados estruturados.

```text
SyncProvider
└── manifestos, operações e snapshots

BlobProvider
└── PDFs, imagens, DOCX, vídeos, anexos e exportações
```

Inicialmente os dois podem usar GitHub. A abstração deve permitir que o storage de blobs migre separadamente para WebDAV, S3, Google Drive ou servidor próprio.

### 12.6 Criptografia e credenciais

A criptografia deverá ser independente do provider. Tokens do GitHub, Google Calendar e redes sociais não podem ser embutidos no bundle, APK ou executável. Credenciais deverão ser revogáveis e armazenadas em mecanismo seguro do sistema operacional sempre que possível.

O repositório privado do GitHub é uma camada de controle de acesso, não uma substituição para criptografia de dados sensíveis.

## 13. Tauri e o núcleo desktop

O Tauri atual é um shell pequeno, com plugins de notificação, updater, process e window-state. [1] A evolução deve transformá-lo gradualmente em uma ponte para capacidades locais, sem colocar toda a regra de negócio dentro dos comandos Tauri.

### 13.1 Comandos iniciais possíveis

```text
workspace_list
workspace_open
workspace_create
document_get
document_save
document_export
document_import_candidate
search_query
graph_query
suggestion_list
suggestion_apply
calendar_sync_google
sync_inspect
sync_download
sync_upload
sync_preview
sync_apply
backup_export
backup_restore
```

Os comandos devem ser pequenos, tipados e orientados a casos de uso. Um comando não deve devolver a tabela inteira do banco para a UI se a UI só precisa de uma projeção.

### 13.2 Eventos do núcleo para a UI

O núcleo poderá emitir eventos como:

```text
workspace.changed
document.updated
graph.indexed
search.indexed
suggestions.updated
calendar.sync.changed
sync.status.changed
sync.conflict.detected
backup.completed
```

A UI deve reagir a mudanças relevantes sem polling agressivo. Processos longos devem mostrar estado discreto de progresso ou conclusão.

## 14. Editor acadêmico e DOCX

O editor do TCC será um dos maiores riscos técnicos do projeto. Ele precisa parecer familiar para quem usa Word, mas também precisa manter a estrutura interna que conecta documentos, referências, versões, árvore acadêmica e múltiplas saídas.

A ordem de implementação deve ser:

| Ordem | Entrega |
|---:|---|
| 1 | Modelo interno de documento e estilos. |
| 2 | Editor visual paginado. |
| 3 | Estrutura acadêmica configurável. |
| 4 | Referências e citações ABNT. |
| 5 | Exportação DOCX. |
| 6 | Importação DOCX como versão candidata. |
| 7 | Comparação detalhada e aceitação explícita. |
| 8 | Markdown e LaTeX como modos completos. |

A conversão precisa ter um diagnóstico de fidelidade. Elementos que não puderem ser representados totalmente devem ser preservados quando possível e marcados como parcialmente estruturados.

O DOCX exportado deverá carregar metadados reconhecíveis, quando possível, para ajudar a associar documentos, seções e elementos na reimportação. O fluxo de retorno sempre criará uma versão candidata e mostrará comparação antes da aceitação.

## 15. Migração do app atual

A migração deve ser reversível. Antes de trocar a fonte de dados, o app deve continuar podendo exportar, restaurar e validar os dados atuais.

### M0 — proteção e contrato

Criar backup validado, exportação completa, IDs estáveis, versão de schema e testes de restauração. Aproveitar o mecanismo atual de importação versionada e restauração atômica. [3] [4]

### M1 — Domain Core e adapters

Criar interfaces de repositório e casos de uso. O `AppContext` passa a consumir adapters, mas ainda pode expor a API antiga às views legadas.

O objetivo desta fase é impedir que novas funcionalidades continuem adicionando regras diretamente ao contexto monolítico.

### M2 — Workspaces

Adicionar `workspaceId`, criar o Workspace Acadêmico padrão e migrar todas as entidades atuais para ele. A migração deve ser idempotente e verificável.

### M3 — Desktop shell próprio

Separar `DesktopAppShell` e `MobileAppShell`. O desktop passa a ter navegação lateral, workspace persistente, painéis e sessão. A BottomNav, FAB e pilha mobile deixam de ser o modelo principal desktop.

### M4 — Documents e Blocks

Migrar `looseNotes`, registros de aula, materiais e conceitos para o novo sistema documental. Preservar o ID antigo como `legacySourceId` ou metadado de proveniência.

### M5 — Knowledge Graph

Adicionar conceitos, relações, Inbox, AssociationPolicies, busca global e Graph. Primeiro implementar relações explícitas e determinísticas; relações semânticas entram depois, sempre como sugestões.

### M6 — Calendário

Migrar tarefas, provas, aulas e sessões para Events, Responsibilities, Occurrences, PlanningBlocks e ExecutionRecords. Adicionar visão semanal, ações mobile e Google Calendar.

### M7 — TCC e editor

Migrar `TccData` para Project, Output, AcademicTree, documentos internos, referências e versões. Construir uma saída principal completa antes de expor múltiplas saídas na interface.

### M8 — Marketing

Adicionar PositioningProfile, ContentIdea, ContentBase, ChannelVariant, Publication, MetricSnapshot e StrategicInsight. Conectar o calendário editorial ao Calendário unificado.

### M9 — Sync Protocol

Adaptar `SyncIndex`, stamps e tombstones ao protocolo versionado. Implementar snapshots compatíveis, revision global, compare-and-swap, GitHub Provider, P2P Provider, BlobProvider e criptografia.

### M10 — remoção do legado

Depois de migração, exportação, restauração e testes comprovados, remover gradualmente listas antigas e responsabilidades do `AppContext`. O contexto poderá permanecer como composição de sessão, seleção e compatibilidade, mas não como dono do domínio.

## 16. Roadmap de implementação por fatias verticais

Embora o escopo final seja amplo, cada marco deve entregar uma capacidade utilizável.

| Marco | Fatia vertical | Critério de entrega |
|---:|---|---|
| A | Workspace → Document → salvar → reabrir | A Ceci cria e retoma um documento dentro de um Workspace. |
| B | Document → busca local | O documento pode ser encontrado por texto e metadados. |
| C | Document → Relation → Graph | Uma relação explícita aparece no Graph e no painel contextual. |
| D | Event/Responsibility → semana desktop | A Ceci planeja e registra uma atividade na visão semanal. |
| E | Project → AcademicTree → editor | A Ceci cria um projeto e escreve uma saída principal. |
| F | Document → referência → DOCX | A Ceci exporta, edita fora, importa e compara uma nova versão. |
| G | ContentBase → ChannelVariant | A Ceci adapta uma ideia para Instagram, TikTok e LinkedIn. |
| H | SQLite → SyncPackage → provider | Dois dispositivos trocam dados sem sobrescrever revisão nova. |
| I | Context → KnowledgePacket → IA | A IA trabalha com contexto compilado e autorização definida. |

O escopo não deve ser reduzido a telas isoladas. Cada fatia precisa atravessar domínio, persistência, UI e testes.

## 17. Testes e validação

### 17.1 Testes de domínio

As regras de limite de projetos, estados de calendário, recorrência, origem de eventos, aprovação de publicações, composição de documentos, relações e sugestões devem ser testadas sem React ou Tauri.

### 17.2 Testes de migração

Cada versão antiga deve poder ser convertida para a nova estrutura. A migração deve ser idempotente, preservar IDs e produzir relatório de itens migrados, ignorados ou ambíguos.

### 17.3 Testes de sincronização

O Sync Engine deve testar:

- revisão remota mais nova;
- upload baseado em revisão correta;
- tombstone contra registro vivo;
- alterações em dispositivos diferentes;
- conflito em campos distintos;
- restauração de snapshot;
- Workspaces separados;
- pacotes corrompidos;
- versão de protocolo desconhecida;
- providers indisponíveis;
- retry sem duplicar operações.

A implementação atual já testa merge, união, LWW, tombstones e simetria, e esses testes devem ser preservados durante a evolução. [5] [6]

### 17.4 Testes de documentos

O editor acadêmico precisa de testes de round-trip:

```text
modelo interno → DOCX → modelo interno
modelo interno → DOCX externo editado → comparação
modelo interno → exportação → restauração de versão
```

O teste não deve verificar apenas se o arquivo abre. Deve verificar estrutura, títulos, estilos, referências, tabelas, imagens, notas, metadados e elementos não suportados.

### 17.5 Testes de experiência

O desktop deve validar tarefas reais:

- abrir o último Workspace e continuar o trabalho;
- localizar uma nota e navegar para suas relações;
- montar a semana arrastando blocos;
- registrar uma aula e transformá-la em conhecimento;
- criar uma saída de TCC e exportar DOCX;
- criar um conteúdo-base e aprovar versões por canal;
- sincronizar com o celular sem reproduzir sua interface.

## 18. Segurança, privacidade e recuperação

O cecistudy terá dados pessoais, acadêmicos, autorais e profissionais. A implementação deve prever:

| Área | Requisito |
|---|---|
| Credenciais | Tokens revogáveis, nunca embutidos no bundle. |
| Sync | Pacotes verificáveis e criptografáveis. |
| Backup | Exportação independente do provider. |
| Restauração | Prévia, validação completa e aplicação atômica. |
| Dispositivo perdido | Revogação de dispositivo e credenciais. |
| Workspaces | Isolamento de contexto e escopo configurável. |
| IA | Contexto compilado, autorização e controle de escopo. |
| Dados externos | Relações e cópias com proveniência clara. |

A recuperação deve funcionar mesmo se GitHub, uma rede social ou outro provider deixar de existir. O formato próprio do cecistudy é o mecanismo de portabilidade.

## 19. Critérios de arquitetura saudável

A implementação estará evoluindo na direção certa quando:

- o desktop tiver uma navegação e uma densidade próprias;
- o mobile continuar simples e útil;
- o mesmo dado puder ter projeções diferentes;
- o `AppContext` não receber novas regras complexas;
- Workspaces forem isolados por padrão;
- cada entidade tiver dono e proveniência;
- a Home conectar módulos sem substituir nenhum deles;
- o Graph for navegável e explicável;
- o Calendário separar evento, responsabilidade, planejamento e realidade;
- o TCC suportar uma saída acadêmica completa e DOCX reimportável;
- o Marketing separar conteúdo-base de versões por canal;
- o GitHub puder ser substituído por outro provider;
- uma revisão nova nunca seja sobrescrita silenciosamente;
- os dados possam ser exportados e restaurados fora do provider;
- a IA possa ser ativada de forma controlada;
- a migração legada seja repetível e verificável.

## 20. O que não deve ser feito

Não se deve criar uma segunda versão do `AppContext` apenas para o desktop. Isso manteria o problema, duplicaria regras e dificultaria a sincronização.

Não se deve colocar o token do GitHub no frontend, tratar o repositório como banco SQL, substituir o SQLite inteiro sem revisão ou confiar apenas na regra informal de que dois dispositivos não serão usados ao mesmo tempo.

Não se deve transformar todas as relações em links automáticos, fazer a IA escrever documentos completos sem confirmação, importar eventos do Google como se fossem editáveis no cecistudy ou converter toda atividade acadêmica em uma obrigação punitiva.

Não se deve começar pelo Graph visual, pelo editor paginado ou pela publicação em redes sociais sem definir os contratos de domínio e persistência que sustentam essas telas.

## 21. Ordem recomendada para começar no código

O primeiro ciclo técnico recomendado é:

```text
1. Backup e exportação de segurança
2. Domain Core independente de React
3. Workspace + workspaceId
4. Repositórios e casos de uso
5. DesktopAppShell e MobileAppShell separados
6. SQLite/Local Store com migrações
7. Workspace → Document → Editor básico
8. Busca local
9. Sync Engine como interface
10. Primeiro provider e backup versionado
```

Depois desse ciclo, o cecistudy terá a fundação correta para evoluir Knowledge Graph, Calendário, TCC e Marketing sem repetir o acoplamento atual.

## 22. Decisões técnicas que devem ser prototipadas

O plano de produto está definido, mas as seguintes escolhas devem ser validadas com protótipos e testes:

1. engine do editor visual paginado;
2. modelo interno de documentos, estilos e layout;
3. engine de importação/exportação DOCX;
4. comparação estrutural e visual de versões;
5. engine bibliográfica para ABNT;
6. schema SQLite final;
7. fronteira TypeScript/Rust;
8. serialização do `SyncPackage`;
9. criptografia e gestão de chaves;
10. autenticação GitHub e APIs externas;
11. BlobProvider inicial;
12. indexação e busca local;
13. formato do `.cectx`;
14. execução em background;
15. comportamento dos providers quando offline;
16. desempenho com documentos longos, muitos blocos e Graphs extensos.

Essas escolhas devem ser isoladas atrás de interfaces. Um protótipo que falhar poderá ser substituído sem reescrever os domínios.

## 23. Conclusão

O cecistudy deve evoluir de uma aplicação mobile-first com shell desktop para uma plataforma pessoal de continuidade intelectual. O desktop será o ambiente de trabalho completo; o mobile será a camada de captura e acompanhamento. Eles compartilharão dados, mas não serão o mesmo produto em duas dimensões.

A arquitetura precisa preservar quatro propriedades: **propriedade clara dos dados, proveniência, reversibilidade e substituibilidade de infraestrutura**. Essas propriedades permitem conectar conhecimento, calendário, TCC, estudos e marketing sem criar um sistema monolítico impossível de migrar.

A proposta de usar GitHub como primeiro provider é compatível com anos de uso se o cecistudy possuir um protocolo próprio, um Sync Engine independente, SQLite local, BlobProvider, criptografia e exportação portátil. O GitHub será uma implementação substituível, não o centro da arquitetura.

O próximo passo de engenharia é construir o primeiro vertical slice `Workspace → Document → Editor → busca local → backup/sync`, mantendo o `AppContext` como fachada temporária. A partir dessa fundação, cada módulo poderá ser desenvolvido de forma incremental e testável, preservando a visão completa aprovada.

## Referências internas

[1]: `./cecistudy-main/.context/architecture.md` — stack, hierarquia, shells, navegação, persistência e capacidades desktop atuais.

[2]: `./cecistudy-main/.context/data-model.md` — entidades, IDs, persistência, seeds e catálogos estáticos atuais.

[3]: `./cecistudy-main/src/data/schema.ts` — versão atual do schema e migrações consecutivas.

[4]: `./cecistudy-main/src/lib/exportImport.ts` — exportação versionada, validação, migração e restauração atômica.

[5]: `./cecistudy-main/docs/device-sync-plano.md` — plano e status da sincronização P2P, stamps, merge e transporte.

[6]: `./cecistudy-main/src/lib/sync/merge.ts` e `./cecistudy-main/src/lib/sync/stamp.ts` — merge determinístico, LWW, tombstones e índice de sincronização.

[7]: `./cecistudy-main/src/lib/persistentData.ts` — fronteira entre dados do usuário e catálogos estáticos no backup atual.

[8]: `./calendar-spec-v0.1.md` — especificação consolidada do Calendário.

[9]: `./tcc-spec-v0.1.md` — especificação consolidada do TCC e dos projetos acadêmicos.

[10]: `./marketing-spec-v0.1.md` — especificação consolidada do Studio de Marketing.

[11]: `./ceci-concept-synthesis.md` — síntese da visão conceitual da Base de Conhecimento.

[12]: `./architecture-target-v0.1.md` — proposta técnica-alvo anterior, incorporada e ampliada neste guia.
