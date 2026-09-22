# Arquitetura técnica-alvo do cecistudy

**Status:** proposta arquitetural consolidada para validação antes da implementação.

**Produto:** cecistudy.

**Usuária de referência:** Ceci.

## 1. Decisão arquitetural central

O cecistudy não será reconstruído como um aplicativo único em que desktop e mobile apenas mudam o tamanho da mesma interface. Ele será composto por um domínio compartilhado, duas experiências de produto diferentes e uma infraestrutura local-first comum.

O mobile será a camada de captura, consulta, acompanhamento e ações rápidas. O desktop será o workspace completo de estudo, conhecimento, produção acadêmica, TCC, calendário e posicionamento profissional.

A separação correta será:

```text
                    CECISTUDY
                        │
          ┌─────────────┴─────────────┐
          │                           │
    Mobile Experience          Desktop Experience
    captura e acompanhamento   workspace de produção
          │                           │
          └─────────────┬─────────────┘
                        │
                 Shared Domain
                        │
          ┌─────────────┼─────────────┐
          │             │             │
     Local Store    Relation Layer   Sync Engine
          │             │             │
          └─────────────┼─────────────┘
                        │
                 Provider Layer
             GitHub · P2P · futuros
```

O domínio é compartilhado, mas a apresentação, a navegação, as capacidades de edição e a densidade de informação são específicas de cada plataforma.

## 2. Estado atual relevante

O projeto atual usa React, TypeScript e Vite como base do frontend. O mobile nativo é empacotado com Capacitor e o desktop usa Tauri 2, mas o shell desktop ainda carrega o mesmo bundle web da raiz. A maior parte do estado global continua concentrada em `src/context/AppContext.tsx`, e as entidades atuais são coleções como cursos, aulas, tarefas, provas, sessões, leituras, conceitos, materiais, estágio e TCC.

A implementação existente de sincronização já possui elementos valiosos: `SyncIndex`, stamps por registro, tombstones, merge determinístico, preview de alterações e uma camada de transporte isolada. O plano de evolução deve preservar essa base e substituir gradualmente o snapshot orientado a coleções por um protocolo de domínio capaz de representar Workspaces, documentos, blocos, relações, versões, anexos e entidades dos novos módulos.

O desktop atual deve ser considerado um ponto de partida de shell, não a arquitetura final do produto desktop. A nova experiência precisa ter entrypoint, layout, navegação e estado de sessão próprios.

## 3. Camadas do sistema

### 3.1 Experiências de produto

A camada de experiência contém as composições próprias de cada plataforma.

```text
apps/
├── mobile-web/
│   ├── MobileAppShell
│   ├── captura rápida
│   ├── agenda compacta
│   ├── consulta de projetos
│   └── ações rápidas
│
└── desktop/
    ├── DesktopAppShell
    ├── workspace persistente
    ├── Home transversal secundária
    ├── Document workspace
    ├── Knowledge Graph
    ├── Calendar workspace
    ├── TCC workspace
    └── Marketing Studio
```

A divisão inicial não precisa obrigatoriamente mover o repositório para dois aplicativos completos no primeiro commit. É possível manter uma base Vite enquanto se extraem `MobileAppShell` e `DesktopAppShell` como composições independentes. O requisito arquitetural é que os shells não continuem compartilhando uma única árvore de views desenhada originalmente para mobile.

### 3.2 Application Core

O Application Core expõe casos de uso estáveis para as interfaces, em vez de permitir que cada view manipule diretamente listas persistidas. Exemplos:

```text
createDocument()
updateDocument()
createCalendarEvent()
planResponsibility()
recordExecution()
createTccProject()
createOutput()
insertCitation()
createContentBase()
approveChannelVariant()
acceptSuggestion()
createRelation()
startSync()
restoreSnapshot()
```

Os casos de uso validam regras, emitem eventos de domínio e atualizam o armazenamento. O frontend recebe estados derivados e não precisa conhecer detalhes de SQLite, GitHub, P2P ou indexação.

### 3.3 Domain Core

O domínio compartilhado deve conter contratos independentes de plataforma para:

- Workspaces e escopo de contexto;
- documentos, blocos e versões;
- conceitos, relações, tags, áreas e proveniência;
- projetos, saídas e árvores acadêmicas;
- eventos, responsabilidades, blocos e ocorrências;
- posicionamento, conteúdo-base, versões por canal e publicações;
- sessões de estudo e estados de aprendizagem;
- sugestões, políticas de associação e aprovações;
- sincronização, dispositivos, revisões e conflitos.

Os tipos podem continuar sendo escritos em TypeScript no início, mas não devem depender de React, `AppContext`, localStorage, Capacitor ou Tauri. O objetivo é permitir que os mesmos contratos sejam usados pelo frontend, pelos comandos Tauri e por ferramentas de migração.

### 3.4 Engines locais

No desktop, as capacidades pesadas e de longa duração devem gradualmente migrar para um núcleo local integrado ao Tauri/Rust:

```text
Rust/Tauri Core
├── LocalStore
├── WorkspaceStore
├── DocumentStore
├── GraphStore
├── SearchIndex
├── KnowledgeIndexer
├── ContextEngine
├── LearningEngine
├── SyncEngine
├── Backup/Restore
└── BlobManager
```

A migração não precisa mover tudo para Rust de uma vez. O primeiro passo pode manter casos de uso em TypeScript atrás de interfaces estáveis. Em seguida, persistência, indexação, busca, sincronização e processamento incremental podem ser transferidos para comandos Rust sem alterar a UX.

## 4. Workspaces

O cecistudy terá vários Workspaces independentes. Cada Workspace representa um universo de conhecimento e trabalho, com documentos, conceitos, Graph, aprendizagem e projetos próprios.

```text
User
├── Workspace Acadêmico
├── Workspace Profissional
└── Workspace Pessoal
```

Todas as entidades de conteúdo do usuário deverão carregar `workspaceId`, direta ou indiretamente. O padrão será isolamento de contexto:

- a busca opera no Workspace atual;
- o Graph mostra o Workspace atual;
- a IA recebe o contexto do Workspace atual, salvo autorização explícita futura;
- sugestões não atravessam Workspaces automaticamente;
- sincronização pode transportar todos os Workspaces autorizados, mas não mistura seus índices.

Relações entre Workspaces poderão existir no futuro como uma ação explícita, usando uma entidade de relação externa com origem, destino, autorização e proveniência. Uma relação externa não deve transformar o isolamento padrão em vazamento automático.

A sessão do desktop deverá persistir:

```text
SessionState
├── lastWorkspaceId
├── openDocuments[]
├── activePanels[]
├── selectedGraphNode
├── graphViewport
├── activeModule
└── layoutState
```

Ao reabrir, o desktop deve retomar o último Workspace e o estado de trabalho, em vez de apresentar um dashboard numérico como tela principal.

## 5. Domínio e propriedade dos dados

A arquitetura deve diferenciar propriedade de entidade e relação entre entidades.

| Domínio | Dono principal |
|---|---|
| Conhecimento | Documents, Blocks, Concepts, Relations, Graph, LearningState e AssociationPolicy. |
| Calendário | Eventos, responsabilidades, blocos, ocorrências, prazos, recorrências e registros temporais. |
| TCC/Projetos | Projetos, saídas, árvores acadêmicas, documentos editoriais, versões, referências e orientação. |
| Marketing | Posicionamento, públicos, pilares, ideias, conteúdos-base, versões por canal, publicações, métricas e aprendizados. |
| Estudos | Sessões, revisões, flashcards, questões e histórico pedagógico. |

Um módulo pode referenciar a entidade de outro, mas não deve editar seus dados diretamente. Um marco do TCC pode criar uma sugestão de responsabilidade no Calendário; o Calendário será dono do horário e do estado temporal. Uma aula pode originar um documento de conhecimento; a aula continua pertencendo ao domínio acadêmico e o documento ao domínio de conhecimento.

## 6. Persistência local

Cada dispositivo terá seu próprio banco local SQLite. O frontend não deve acessar diretamente tabelas ou arquivos remotos. Ele deve chamar repositórios ou casos de uso locais.

Uma organização inicial possível é:

```text
Local Database
├── workspaces
├── documents
├── blocks
├── concepts
├── relations
├── suggestions
├── association_policies
├── projects
├── outputs
├── academic_nodes
├── calendar_events
├── responsibilities
├── planning_blocks
├── executions
├── content_bases
├── channel_variants
├── publications
├── metric_snapshots
├── learning_states
├── attachments
├── sync_records
├── sync_tombstones
└── migrations
```

O modelo não deve reproduzir indefinidamente as listas atuais de `AppContext`. As entidades antigas devem ser adaptadas para repositórios de domínio, com compatibilidade temporária durante a migração.

### 6.1 Documentos e conteúdo autoral

Na Base de Conhecimento, Markdown continua sendo uma fonte autoral importante. No TCC, o conteúdo precisa de um modelo interno rico para representar estilos, paginação, citações, tabelas, imagens, notas, referências e elementos acadêmicos.

A solução é utilizar um modelo interno de documentos com blocos e metadados, permitindo:

- Markdown como representação autoral e interoperável quando apropriado;
- editor visual como experiência principal do TCC;
- DOCX como importação/exportação prioritária;
- LaTeX e outros formatos por adaptadores posteriores;
- proveniência dos blocos e documentos;
- versões e snapshots sem duplicação silenciosa.

Não devem existir três fontes concorrentes e incompatíveis para o mesmo documento. Um documento terá uma representação interna, formatos externos e diagnóstico de conversão.

## 7. Relações e integração entre módulos

Uma camada transversal de relações permitirá construir sequências como:

```text
Aula
  └── gera → Documento
        └── contém → Bloco
              └── sustenta → Conceito
                    └── fundamenta → Seção do TCC
                          └── gera → Responsabilidade
                                └── planejada em → Bloco do Calendário

Conceito
  └── inspira → Ideia de Marketing
        └── origina → Conteúdo-base
              └── adapta para → Instagram/TikTok/LinkedIn
```

As relações terão tipo e proveniência. O sistema distinguirá relações explícitas, determinísticas, semânticas e definidas pela usuária. Sugestões inferidas irão para o Inbox; relações explícitas ou confirmadas entram no Graph conforme suas regras.

Toda sugestão entre módulos deverá aguardar confirmação quando criar uma consequência significativa, como gerar flashcards, criar tarefa, incluir referência no TCC ou transformar conceito em conteúdo.

## 8. Sync Protocol

O cecistudy terá um protocolo próprio, independente do GitHub. O pacote de sincronização será uma representação versionada do domínio, não uma cópia arbitrária de uma pasta Git.

```text
SyncPackage
├── manifest
├── schemaVersion
├── protocolVersion
├── appVersion
├── revision
├── deviceId
├── workspaceScope
├── operations or snapshot
├── tombstones
├── contentHashes
├── encryptionMetadata
└── integritySignature
```

O `SyncManifest` deverá registrar pelo menos:

```text
schemaVersion
protocolVersion
appVersion
revision
deviceId
workspaceId ou workspaceScope
createdAt
parentRevision
contentHash
encryptionVersion
```

### 8.1 Engine e providers

O `SyncEngine` conhecerá o protocolo, o estado local, as revisões, o merge e os conflitos. Ele não conhecerá detalhes da API do GitHub.

```text
SyncEngine
├── inspectRemote()
├── checkRevision()
├── createPackage()
├── encryptPackage()
├── uploadPackage()
├── downloadPackage()
├── verifyIntegrity()
├── merge()
├── preview()
├── resolveConflict()
└── apply()

SyncProvider
├── GitHubSyncProvider
├── P2PSyncProvider
├── WebDAVSyncProvider futuro
├── S3SyncProvider futuro
└── outros providers
```

`restore` será tratado principalmente pela camada de backup/recuperação, embora um provider possa oferecer snapshots restauráveis.

### 8.2 GitHub como primeiro provider

O GitHub será o primeiro provider de infraestrutura, armazenando snapshots, operações, manifestos e eventualmente blobs pequenos. O cecistudy não deverá usar o repositório como banco SQL nem depender da estrutura interna do GitHub.

O provider deverá usar revisão compare-and-swap:

```text
local knows remoteRevision = 127

if remoteRevision == 127:
    publish revision 128
else:
    refuse overwrite
    download newer state
    merge or request resolution
```

A regra “um dispositivo edita por vez” será uma convenção operacional inicial. A verificação de revisão continuará obrigatória para impedir sobrescrita acidental.

### 8.3 P2P

O P2P existente continuará como provider independente. O transporte atual, o pareamento e o preview de merge podem ser adaptados para consumir o novo `SyncPackage`, sem incorporar detalhes de P2P ao provider do GitHub.

### 8.4 Blobs

Arquivos maiores serão separados dos dados estruturados:

```text
SyncProvider
└── manifestos, operações, snapshots e metadados

BlobProvider
└── PDFs, imagens, DOCX, vídeos, anexos e exportações
```

Inicialmente, ambos podem usar GitHub, mas as interfaces devem permitir combinações futuras.

### 8.5 Criptografia

A criptografia será uma camada independente do provider:

```text
SQLite
  ↓
Sync Engine
  ↓
Serialização
  ↓
Criptografia
  ↓
Provider
```

O token do GitHub não poderá ser embutido no bundle, APK ou executável. Credenciais deverão ser revogáveis e armazenadas em mecanismo seguro do sistema operacional sempre que possível.

## 9. Separação desktop/mobile

### Desktop

O desktop terá:

- workspace persistente com múltiplos painéis;
- navegação lateral por áreas e projetos;
- editor de documentos e TCC com densidade próxima ao Word;
- Graph explorável;
- Inbox de curadoria;
- Calendário semanal com arrastar e redimensionar;
- Studio de Marketing completo;
- busca global;
- Home transversal secundária;
- processamento local em segundo plano;
- restauração de sessão;
- sincronização e status de provider.

### Mobile

O mobile terá:

- captura rápida de aulas, ideias, documentos e responsabilidades;
- acompanhamento do dia e agenda compacta;
- consulta resumida de projetos e relações;
- ações rápidas no Calendário;
- leitura e pequenas edições autorizadas;
- consulta de TCC e registro de ideias;
- consulta e criação rápida de conteúdo-base;
- sincronização do mesmo domínio, sem receber automaticamente toda a interface ou densidade do desktop.

Os dados continuam compartilhados. O que muda é a projeção e a capacidade de edição. A matriz de capacidades deve ser explícita no domínio ou na camada de aplicação, para que a interface não dependa apenas de condicionais espalhadas pelas views.

## 10. Migração do app atual

A migração deve ser incremental e reversível.

### Fase M0 — proteção e contratos

Antes de alterar o estado central, criar exportação completa, backup validado, versionamento de schema e identificadores estáveis. Nenhuma migração deve depender apenas de `Date.now()` ou da posição de um item em arrays.

### Fase M1 — compatibilidade de domínio

Introduzir repositórios e adaptadores que leiam as entidades atuais. O `AppContext` passa a consumir casos de uso, mantendo compatibilidade com telas legadas enquanto o novo domínio é adotado.

### Fase M2 — Workspaces

Adicionar `workspaceId`, criar o Workspace padrão Acadêmico e migrar os dados existentes para ele. A separação deve ocorrer antes da expansão de documentos, Graph e projetos.

### Fase M3 — shells separados

Extrair `MobileAppShell` e `DesktopAppShell` como composições independentes. Remover do desktop a dependência conceitual de BottomNav, FAB e pilha exclusivamente móvel. O desktop passa a ter navegação por workspace, áreas, painéis e sessão persistente.

### Fase M4 — fundação de conhecimento

Introduzir Document, Block, Concept, Relation, Suggestion, AssociationPolicy, Inbox e índices locais. As notas atuais, aulas, materiais, conceitos e referências podem ser migrados por adaptadores, preservando IDs de origem.

### Fase M5 — Calendário e TCC

Migrar tarefas, provas, aulas, sessões e dados atuais de TCC para os novos domínios de Evento, Responsabilidade, PlanningBlock, Project, Output, AcademicTree e Document. Manter uma camada de leitura legada até a nova experiência estar validada.

### Fase M6 — Marketing

Introduzir PositioningProfile, ContentIdea, ContentBase, ChannelVariant, Publication, MetricSnapshot e StrategicInsight. O calendário editorial torna-se uma camada integrada do Calendário.

### Fase M7 — Sync Protocol

Adaptar `SyncIndex` e o merge atual para o protocolo versionado. Primeiro transportar snapshots compatíveis; depois adicionar operações, escopo de Workspace, BlobProvider, criptografia e providers.

### Fase M8 — remoção progressiva do legado

Depois de exportação, migração, testes e restauração comprovados, remover gradualmente a dependência de listas globais e do `AppContext` monolítico. O contexto poderá permanecer como composição de sessão e fachada temporária, não como dono de todo o domínio.

## 11. Roadmap técnico inicial

A ordem recomendada é:

1. contratos de domínio e identificadores;
2. Workspaces e sessão persistente;
3. repositório local e migrações;
4. shells desktop/mobile independentes;
5. Documents e Blocks;
6. relações, Graph, busca e Inbox;
7. Calendário temporal;
8. TCC e editor acadêmico;
9. Marketing Studio;
10. Sync Protocol versionado;
11. GitHub Provider e P2P Provider;
12. BlobProvider e criptografia;
13. integrações externas e automações;
14. IA assistiva e aprendizagem ativa avançada.

A ordem funcional pode parecer colocar sincronização depois dos módulos, mas a interface do `SyncEngine` deve nascer cedo. O sistema não precisa implementar GitHub no primeiro commit, porém nenhum domínio novo deve ser criado de forma impossível de sincronizar ou versionar.

## 12. Critérios de arquitetura saudável

A nova arquitetura será considerada consistente quando:

- desktop e mobile puderem usar o mesmo domínio sem compartilhar a mesma composição de UX;
- um Workspace não vazar contexto para outro por padrão;
- cada entidade tiver um dono claro;
- relações entre módulos forem tipadas e rastreáveis;
- documentos puderem ser exportados sem prender a aplicação a um provider;
- GitHub puder ser substituído sem reescrever o domínio;
- uma revisão remota antiga nunca for sobrescrita silenciosamente;
- backups puderem ser restaurados fora do GitHub;
- a migração de dados antigos for repetível e verificável;
- a IA puder operar sobre contexto compilado sem exigir leitura integral do corpus;
- a Ceci puder aceitar, rejeitar, editar ou bloquear automações importantes;
- o `AppContext` deixar de ser a fonte primária de todas as regras de negócio;
- o mobile continuar útil sem tentar reproduzir o workspace desktop.

## Referências internas

[1]: ../cecistudy-main/.context/architecture.md — arquitetura e stack atuais do cecistudy.

[2]: ../cecistudy-main/.context/data-model.md — entidades e persistência atuais.

[3]: ../cecistudy-main/docs/device-sync-plano.md — plano existente de sincronização P2P, merge e transporte.

[4]: ../cecistudy-main/src/lib/sync/merge.ts — implementação atual de merge determinístico.

[5]: ../cecistudy-main/src/lib/sync/stamp.ts — stamps, tombstones e regras atuais de sincronização.

## Conclusão

A “gambiarra” do GitHub é aceitável como primeiro provider porque não será a arquitetura do cecistudy. A arquitetura será o protocolo próprio, o banco local, o motor de sincronização, a camada de criptografia e as interfaces de provider/blob. O GitHub apenas implementará essa abstração inicialmente.

A mesma lógica vale para o desktop: Tauri pode continuar sendo o shell atual, mas o objetivo é que ele evolua para uma experiência própria apoiada por um núcleo local, e não permaneça apenas como um invólucro do bundle mobile.
