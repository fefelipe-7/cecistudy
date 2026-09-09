# Blueprint arquitetural do cecistudy

**Produto:** cecistudy  
**Usuária de referência:** Ceci  
**Status:** visão de produto e arquitetura consolidada para orientar a implementação  
**Autor:** Manus AI  

> Este documento consolida as decisões de produto e arquitetura discutidas para a evolução do cecistudy. Ele distingue o que já foi aprovado conceitualmente, o que pertence à implementação técnica e o que ainda deve ser validado durante prototipação.

## 1. Resumo executivo

O cecistudy deve deixar de ser entendido como um aplicativo mobile replicado no desktop. A direção aprovada é construir uma plataforma pessoal de estudos, produção intelectual e desenvolvimento profissional, com duas experiências complementares sobre um mesmo domínio de dados.

O **mobile** será uma camada de captura, consulta, acompanhamento e execução rápida. O **desktop** será um workspace completo e persistente, voltado para estudo prolongado, organização do conhecimento, escrita acadêmica, gestão de TCC, planejamento temporal e posicionamento profissional.

O produto será formado por quatro grandes domínios conectados:

| Domínio | Propósito |
|---|---|
| **Base de Conhecimento** | Escrever, organizar, relacionar, explorar e consolidar conhecimento. |
| **Calendário** | Organizar eventos, responsabilidades, planejamento e realidade acadêmica. |
| **TCC/Projetos** | Gerenciar pesquisas e produzir trabalhos acadêmicos configuráveis. |
| **Marketing/Posicionamento** | Construir a presença pessoal e profissional da Ceci por conteúdo orgânico. |

Esses domínios compartilharão dados e relações, mas manterão propriedade, regras e experiências próprias. O cecistudy deverá ser capaz de representar uma cadeia como:

```text
Aula
  → registro
  → documento
  → conceito
  → relação
  → capítulo do TCC
  → responsabilidade
  → bloco de calendário
  → ideia de conteúdo
  → adaptação por canal
  → publicação
  → métrica
  → aprendizado estratégico
```

A complexidade ficará principalmente na infraestrutura local e nas engines. A experiência cotidiana deverá continuar simples: a Ceci abre o cecistudy para escrever, estudar, planejar, pesquisar, produzir e continuar um raciocínio anterior.

## 2. Princípios arquiteturais não negociáveis

### 2.1 O desktop não será um espelho maior do mobile

O desktop terá layout, navegação, sessão, densidade de informação e capacidades próprias. A reutilização deverá acontecer no domínio e nos componentes realmente compartilháveis, não na imposição da mesma jornada de usuário.

O desktop deverá suportar workspace persistente, múltiplos painéis, editor de documentos, Graph, Inbox, calendário semanal, TCC, Marketing Studio, busca global, processamento local em segundo plano e restauração da sessão. O mobile deverá priorizar captura rápida, agenda compacta, consulta e ações pontuais.

### 2.2 Dados compartilhados não significam interfaces idênticas

Desktop e mobile usam o mesmo domínio sincronizado, mas cada plataforma recebe uma projeção e uma matriz de capacidades próprias. Uma aula pode ser criada no mobile como registro simples e enriquecida no desktop com conceitos, referências, relações, evidências e vínculos com TCC.

A restrição de edição será definida por capacidade de plataforma e propriedade da entidade, não por cópias diferentes do mesmo dado.

### 2.3 Cada módulo possui um dono

Uma integração pode referenciar ou solicitar mudança em outro domínio, mas não deve editar diretamente dados que não possui.

| Módulo | Dono principal |
|---|---|
| Base de Conhecimento | Documents, Blocks, Concepts, Relations, Graph, LearningState, Suggestions e AssociationPolicies. |
| Calendário | Events, Responsibilities, PlanningBlocks, Occurrences, Recurrences e ExecutionRecords. |
| TCC/Projetos | Projects, Outputs, AcademicTrees, referências editoriais, versões, orientação e conformidade. |
| Marketing | PositioningProfile, públicos, pilares, ideias, ContentBase, ChannelVariants, Publications, métricas e aprendizados. |
| Estudos | Sessões, revisões, flashcards, questões e histórico pedagógico. |

### 2.4 A automação importante exige confirmação

O cecistudy poderá sugerir relações, conceitos, blocos de estudo, etapas, referências, conteúdos e aprendizados. Sugestão não equivale a alteração. Consequências significativas devem passar pela decisão da Ceci.

A usuária poderá aceitar, rejeitar, editar, remover, bloquear, arquivar ou ignorar sugestões. Rejeições relevantes serão persistidas como política, para evitar que o sistema repita associações explicitamente recusadas.

### 2.5 O cecistudy não dependerá de um fornecedor

GitHub, Google Calendar, Instagram, TikTok, LinkedIn e futuros serviços serão adapters/providers. O domínio, o formato de dados, as relações e o histórico deverão permanecer sob controle do cecistudy.

## 3. Arquitetura de alto nível

```text
                                      CECISTUDY
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                                               │
          Desktop Experience                               Mobile Experience
          workspace completo                               captura e acompanhamento
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │
                                  Application Core
                                          │
                                  Shared Domain Core
                                          │
          ┌───────────────────┬───────────┴───────────┬───────────────────┐
          │                   │                       │                   │
   Knowledge Domain     Calendar Domain        Projects/TCC Domain   Marketing Domain
          │                   │                       │                   │
          └───────────────────┴───────────┬───────────┴───────────────────┘
                                          │
                                  Relation / Provenance
                                          │
                                  Local SQLite Store
                                          │
                         ┌────────────────┴────────────────┐
                         │                                 │
                    Local Engines                      Sync Engine
                         │                                 │
       ┌─────────────────┼─────────────────┐       ┌───────┴────────┐
       │                 │                 │       │                │
  Knowledge Index   Context Engine   Learning   Sync Protocol   Provider Layer
       │                 │                 │       │                │
       └─────────────────┴─────────────────┘       ├── GitHub
                                                   ├── P2P
                                                   └── futuros
```

### 3.1 Camadas

| Camada | Responsabilidade |
|---|---|
| Experience | Shells, layouts, painéis, navegação, projeções e interações por plataforma. |
| Application Core | Casos de uso e comandos estáveis consumidos pelas interfaces. |
| Domain Core | Entidades, regras, eventos de domínio, relações e contratos independentes de UI. |
| Local Store | Persistência SQLite por dispositivo, migrações e consultas locais. |
| Engines | Indexação, busca, Graph, contexto, aprendizagem, processamento incremental e sincronização. |
| Providers | Integrações intercambiáveis de sync, blobs, calendário e redes sociais. |

## 4. Workspaces

O cecistudy terá vários Workspaces independentes. Cada Workspace é um universo de conhecimento, trabalho e contexto.

```text
User
├── Workspace Acadêmico
│   ├── Documents
│   ├── Concepts
│   ├── Graph
│   ├── Learning
│   └── Projects
├── Workspace Profissional
│   ├── Documents
│   ├── Concepts
│   ├── Graph
│   ├── Learning
│   └── Marketing
└── Workspace Pessoal
    ├── Documents
    ├── Concepts
    ├── Graph
    └── Learning
```

Por padrão, não existe vazamento de contexto entre Workspaces. A busca, o Graph, as sugestões e o contexto da IA operam no Workspace atual. Relações externas poderão existir no futuro, mas somente por ação explícita.

Todas as entidades sincronizáveis deverão possuir `workspaceId` direta ou indiretamente. O protocolo deverá estar preparado para um `SyncScope` por dispositivo, mesmo que inicialmente todos os Workspaces autorizados sejam sincronizados.

A sessão do desktop deverá guardar pelo menos:

```text
SessionState
├── lastWorkspaceId
├── openDocuments[]
├── activePanels[]
├── activeModule
├── selectedGraphNode
├── graphViewport
└── layoutState
```

A abertura padrão deve restaurar o último Workspace e a sessão de trabalho. A Home transversal existirá, mas será secundária; o cecistudy deve abrir como um espaço de continuidade, não como um dashboard de números.

## 5. Base de Conhecimento e Graph

O Graph não é o produto inteiro. Ele é uma visualização de um sistema pessoal de conhecimento que inclui editor, busca, contexto, aprendizagem, IA, `.cectx` e Inbox.

### 5.1 Domínio

```text
Workspace
Document
Block
Concept
Relation
Project
Area
Tag
LearningState
Agent
Conversation
Context
KnowledgePacket
Suggestion
AssociationPolicy
```

A Ceci escreve livremente. O processamento local transforma documentos e blocos em conceitos, relações e índices sem exigir configuração manual de agentes, embeddings ou contexto.

### 5.2 Relações

O sistema separará relações por origem:

| Origem | Característica |
|---|---|
| **Explícita** | Criada por link, tag, referência ou estrutura declarada. |
| **Determinística** | Derivada de evidência estrutural inequívoca. |
| **Semântica** | Inferida pelo sistema; pode exigir curadoria no Inbox. |
| **User-defined** | Criada manualmente pela Ceci com tipo e justificativa. |

Relações e conceitos deverão conter proveniência. O sistema deve responder de onde uma relação veio, quais documentos a sustentam e se ela foi aceita, inferida ou criada manualmente.

### 5.3 Inbox de curadoria

O Inbox será uma fila contextual de revisão, não uma interrupção contínua. Poderá conter:

- nova relação;
- possível contradição;
- conceito identificado;
- conceito duplicado;
- nova reflexão;
- lacuna de conhecimento;
- sugestão de estudo;
- revisão recomendada.

A Ceci poderá aceitar, rejeitar, editar, remover, bloquear ou arquivar cada item. `AssociationPolicy` deverá persistir bloqueios e recusas.

### 5.4 Aprendizagem ativa

A aprendizagem poderá ser iniciada de modo intencional — “quero estudar ownership” — ou de modo contextual — “você voltou a trabalhar com ownership”. Sugestões aparecerão no Inbox ou em painéis contextuais, sem interromper a escrita.

O estado de aprendizagem será multidimensional:

```text
ConceptLearningState
├── definition
├── explanation
├── recall
├── application
├── comparison
├── problemSolving
└── creation
```

O sistema não reduzirá domínio a uma única porcentagem. Ele deverá poder identificar que a Ceci compreende uma definição, mas ainda possui dificuldade de aplicação ou comparação.

### 5.5 Contexto e `.cectx`

A IA não receberá o corpus completo por padrão. A sequência será:

```text
Pergunta
  ↓
AI Router
  ↓
Knowledge Index
  ↓
Relevant Concepts
  ↓
Relations
  ↓
.cectx
  ↓
Knowledge Packet
  ↓
LLM
```

O `.cectx` será inicialmente um artefato derivado e interno, utilizado para contexto compilado e incremental. A Ceci poderá inspecionar ou exportar esse artefato no futuro, mas não deverá ser obrigada a editá-lo manualmente.

A IA poderá atuar como interlocutora crítica, localizar continuidade de pensamento, apontar contradições, sugerir novas reflexões e identificar lacunas. Ela não deverá apenas elogiar, escrever trabalhos completos ou alterar o conteúdo sem autorização.

## 6. Calendário acadêmico

O Calendário será uma visão temporal unificada das responsabilidades acadêmicas. Faculdade, TCC, Estudos, Estágio e eventos do Google aparecem juntos, com diferenciação visual por camada.

A regra central é:

```text
Evento           → o que acontece em um horário
Responsabilidade → o que precisa ser feito dentro de um prazo
Bloco            → quando a responsabilidade será executada
Ocorrência       → instância de uma regra recorrente
Execução         → o que realmente aconteceu
```

O Calendário terá quatro níveis de compromisso:

| Nível | Atraso | Reserva automática |
|---|---:|---:|
| Obrigatório | Sim | Não sem ação explícita. |
| Importante | Sim, menor severidade | Não sem ação explícita. |
| Recomendado | Não como falha | Sim, depois de aceite. |
| Opcional | Não | Não por padrão. |

A duração planejada e a duração real coexistirão. Um timer e o registro manual serão aceitos. Cancelamentos de aulas afetarão a ocorrência, não a regra de recorrência.

### Desktop

A visão principal será semanal, com grade de horários, faixa de itens de dia inteiro, blocos arrastáveis/redimensionáveis, filtros e painel contextual persistente. Visões diária, mensal e agenda/lista também existirão.

### Mobile

A experiência terá faixa de dias, agenda compacta e ações rápidas para concluir, adiar, reagendar, alterar duração, registrar realidade e cancelar uma ocorrência. A manipulação espacial será leve.

### Google Calendar

A integração será bidirecional, com calendário dedicado para itens acadêmicos enviados pelo cecistudy e suporte a sincronização automática/manual.

A origem define a propriedade:

| Origem | Editável no cecistudy | Editável no Google |
|---|---:|---:|
| Criado no cecistudy e sincronizado | Sim | Sim |
| Criado originalmente no Google | Não | Sim |
| Responsabilidade local associada a evento externo | Sim nos campos próprios | Não altera o evento externo |

O vínculo deverá preservar IDs dos dois lados, `etag` quando disponível, última modificação, origem, revision e estado de conflito. Alterações simultâneas não serão sobrescritas silenciosamente.

## 7. TCC e Projetos acadêmicos

O módulo de TCC será um sistema de projetos acadêmicos configuráveis. O limite será de até cinco projetos ativos contando todos os tipos de projeto, não cinco saídas.

```text
Project
├── identidade e configurações
├── base de pesquisa
├── academic tree
├── outputs
├── orientação e revisão
├── entregas e versões
└── integrações
```

Os projetos poderão ser TCC, artigo, iniciação científica, relatório, revisão, estudo de caso, apresentação ou projeto livre. Modelos iniciais serão pontos de partida, não contratos.

Todo projeto e toda saída terá uma árvore acadêmica configurável. Elementos podem ser obrigatórios, recomendados, opcionais, ocultos ou não aplicáveis. A lista de elementos inclui tema, problema, objetivos, justificativa, introdução, referencial, metodologia, resultados, discussão, conclusão, resumos, referências, anexos, glossário, listas, cronograma e orçamento, mas a aplicação dependerá do tipo e do perfil institucional.

Uma saída poderá usar conteúdo por:

| Operação | Resultado |
|---|---|
| Referenciar | Mantém uma origem editável e aponta para ela. |
| Duplicar | Cria cópia independente com origem preservada. |
| Incorporar | Leva conteúdo para a saída e permite edição local. |

### Editor acadêmico

O modo principal será visual e paginado, próximo ao Microsoft Word. Deve suportar páginas, margens, cabeçalhos, rodapés, numeração, quebras, estilos, títulos numerados, tabelas, imagens, legendas, citações, notas, referências cruzadas, comentários e pré-visualização.

Markdown e LaTeX serão modos alternativos. Equações e trechos de código serão editáveis no modo LaTeX. DOCX será o primeiro formato prioritário de importação e exportação.

O documento terá uma fonte interna canônica. DOCX, Markdown e LaTeX serão formatos de interoperabilidade, não fontes concorrentes incompatíveis.

### Round-trip DOCX

```text
Documento interno v1
  ↓ exportar
DOCX editado externamente
  ↓ importar
Versão candidata v2
  ↓ comparação detalhada
Aceitar, revisar ou descartar
```

A importação nunca sobrescreverá silenciosamente o documento. O cecistudy tentará preservar estilos, tabelas, imagens, cabeçalhos, rodapés, notas, sumário, comentários, seções, numeração e metadados reconhecíveis. Elementos parcialmente estruturados serão sinalizados.

### Referências e conformidade

Haverá biblioteca global de referências e seleções por projeto/saída. Entradas poderão vir de cadastro manual, DOI, ISBN, URL, BibTeX, RIS, arquivos e identificadores de bases.

ABNT será o perfil inicial. APA, Vancouver, Chicago e perfis personalizados entrarão posteriormente. A conformidade será configurável e não bloqueará a escrita ou exportação.

Autosave técnico, histórico recuperável e versões nomeadas serão separados. Orientação, comentários em trechos e solicitações entrarão depois do MVP, mas suas extensões devem ser previstas desde o início.

### MVP do TCC

O MVP funcional terá:

1. projetos, badges, limite de cinco ativos e árvores configuráveis;
2. modelo interno de documentos e versões;
3. editor visual paginado;
4. referências, citações e perfil ABNT inicial;
5. importação/exportação DOCX com round-trip e comparação detalhada.

A primeira experiência exposta poderá trabalhar com uma saída principal, mas a arquitetura deverá suportar múltiplas saídas desde o início.

## 8. Studio de Marketing e Posicionamento

O Studio será a área de posicionamento pessoal e profissional da Ceci, inicialmente focada em conteúdo orgânico para Instagram, TikTok e LinkedIn.

A cadeia principal será:

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

O posicionamento será flexível e poderá ser definido pela Ceci ou sugerido pelo sistema. Sugestões de público, pilares, objetivos e hipóteses entrarão como rascunhos e só influenciarão recomendações após aprovação.

### Produção multicanal

O conteúdo-base guardará mensagem, objetivo, pilar, público, contexto, origem na Base de Conhecimento e referências. Cada canal terá uma adaptação própria.

| Canal | Formatos iniciais |
|---|---|
| Instagram | Feed, carrossel, Reels, Stories e sequência de Stories. |
| TikTok | Vídeo curto e, no futuro, séries. |
| LinkedIn | Texto, documento/carrossel, imagem e vídeo curto. |

Roteiro, cenas, falas, texto na tela, legenda, capa e CTA serão componentes opcionais. Carrosséis poderão ser montados dentro do cecistudy ou fora, mantendo estrutura e origem.

O fluxo editorial usará os estados `ideia`, `selecionado`, `briefing`, `rascunho`, `em_revisao`, `aprovado`, `agendado`, `publicado`, `reaproveitamento` e `arquivado`.

### Publicação e métricas

A aprovação será individual por adaptação. As conexões com Instagram, TikTok e LinkedIn serão individuais e revogáveis. Publicação automática exigirá autorização explícita por peça e canal; publicação manual será fallback completo.

Métricas automáticas serão buscadas por APIs oficiais quando possível. O sistema também aceitará entrada manual. As métricas serão separadas por publicação e versão, permitindo comparação por canal, formato, pilar, objetivo, público, série e hipótese.

Aprendizados estratégicos serão sugestões confirmáveis. O sistema não deverá transformar amostras pequenas em certezas nem alterar o posicionamento automaticamente.

A revisão opcional de responsabilidade ligada à comunicação em Psicologia poderá alertar sobre diagnóstico, promessa de resultado, aconselhamento individual, exposição sensível ou afirmação sem fonte. O alerta será não bloqueante.

## 9. Integração transversal

A Home desktop será uma superfície de continuidade e conexão, não apenas um dashboard. Ela deverá mostrar contexto, itens fixados, retomadas, relações relevantes, mudanças recentes e próximos pontos de atenção sem substituir os módulos especializados.

A camada transversal suportará:

- busca global com origem e filtros;
- favoritos e itens fixados;
- Graph filtrável por módulo, projeto, período, relação e profundidade;
- linha de proveniência;
- links tipados entre domínios;
- sugestões que exigem confirmação;
- impacto de alterações;
- projeções compactas para o mobile.

As relações não criarão cópias por padrão. Conteúdo poderá ser referenciado, transformado em snapshot ou incorporado conforme a necessidade do domínio consumidor.

## 10. Persistência e sincronização

### 10.1 Banco local

Cada dispositivo terá um SQLite local como banco real. O frontend não acessará tabelas remotas diretamente; usará repositórios e casos de uso.

A organização lógica incluirá Workspaces, Documents, Blocks, Concepts, Relations, Suggestions, Policies, Projects, Outputs, AcademicNodes, CalendarEvents, Responsibilities, PlanningBlocks, Executions, ContentBases, ChannelVariants, Publications, MetricSnapshots, LearningStates, SyncRecords, Tombstones e migrações.

### 10.2 Sync Engine

O `SyncEngine` será independente de provider e concentrará revisão, criação de pacotes, verificação, criptografia, merge, preview, conflitos e aplicação.

```text
SyncEngine
├── inspectRemote
├── checkRevision
├── createPackage
├── encryptPackage
├── uploadPackage
├── downloadPackage
├── verifyIntegrity
├── merge
├── preview
├── resolveConflict
└── apply
```

`restore` ficará principalmente na camada de backup/recuperação, embora providers possam oferecer snapshots restauráveis.

### 10.3 Protocolo próprio

O formato de dados será do cecistudy, não do GitHub. O pacote deverá carregar:

```text
SyncPackage
├── manifest
├── schemaVersion
├── protocolVersion
├── appVersion
├── revision
├── deviceId
├── workspaceScope
├── parentRevision
├── operations or snapshot
├── tombstones
├── contentHashes
├── encryptionMetadata
└── integritySignature
```

A revisão será verificada com compare-and-swap. Se o remoto mudou desde a última leitura, o dispositivo não enviará uma nova versão por cima; ele fará download, merge ou pedirá resolução.

A política inicial será um dispositivo editando por vez, mas a proteção de revision continuará obrigatória.

### 10.4 Providers

O GitHub será o primeiro `SyncProvider`. O P2P já planejado continuará separado. WebDAV, S3, Google Drive, pasta local ou servidor próprio poderão ser implementados futuramente.

Um `BlobProvider` separado armazenará PDFs, imagens, DOCX, vídeos, anexos e exportações. Inicialmente ele poderá usar GitHub, mas sua abstração deve permitir migração independente.

A criptografia será uma camada independente:

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

Tokens não serão embutidos no bundle, APK ou executável. Credenciais deverão ser revogáveis e armazenadas de forma segura.

## 11. Arquitetura desktop/mobile

### Desktop

O desktop deverá evoluir do shell Tauri atual para um produto próprio com:

- workspace e sessão persistentes;
- navegação por áreas e projetos;
- múltiplos painéis;
- editor acadêmico paginado;
- Graph e Inbox;
- Calendário semanal completo;
- TCC/Projetos;
- Marketing Studio;
- busca global;
- Home transversal secundária;
- processamento local em segundo plano;
- status de indexação e sincronização;
- integração com providers;
- recursos nativos Tauri quando necessários.

### Mobile

O mobile continuará como camada de captura e acompanhamento, com:

- registro de aulas, ideias, responsabilidades e referências;
- agenda compacta e ações rápidas;
- leitura de detalhes sincronizados;
- acompanhamento de TCC e projetos;
- consulta resumida de conceitos e relações;
- criação rápida de conteúdo-base;
- edição apenas nas capacidades previstas;
- sincronização do mesmo domínio sem reproduzir a densidade do desktop.

### Matriz de capacidades

A aplicação deverá manter uma matriz explícita, por entidade e operação:

```text
CapabilityMatrix
├── entity
├── platform
├── canView
├── canCreate
├── canEdit
├── canDelete
└── projection
```

Isso evitará espalhar condicionais de plataforma por todas as views.

## 12. Migração do projeto atual

O projeto atual é uma base React/TypeScript/Vite com Capacitor para Android/iOS e Tauri 2 para desktop. O desktop atual ainda empacota o mesmo bundle web da raiz, e o estado global permanece fortemente concentrado no `AppContext`. [1] [2]

O projeto já possui persistência versionada, exportação/importação, stamps, tombstones, merge determinístico e uma fronteira de transporte P2P. [3] [4] [5]

A migração será incremental e reversível.

| Fase | Objetivo | Entrega |
|---:|---|---|
| M0 | Proteção | Backup validado, exportação completa, schema versionado e IDs estáveis. |
| M1 | Contratos | Domain Core, repositórios e casos de uso atrás de interfaces. |
| M2 | Workspaces | `workspaceId`, Workspace Acadêmico padrão e sessão persistente. |
| M3 | Shells | Desktop e mobile com composições, navegação e capacidades próprias. |
| M4 | Conhecimento | Documents, Blocks, Concepts, Relations, Graph, Inbox e índices. |
| M5 | Calendário/TCC | Novos domínios temporais, projetos, árvores e editor. |
| M6 | Marketing | Posicionamento, conteúdo-base, canais, publicação e métricas. |
| M7 | Sync Protocol | Manifesto, revision, snapshots/operações, providers, blobs e criptografia. |
| M8 | Legado | Remoção gradual das listas e do `AppContext` como dono do domínio. |

### Migração das entidades atuais

As entidades atuais não devem ser descartadas abruptamente. Elas devem passar por adaptadores, mantendo IDs e proveniência:

| Atual | Destino provável |
|---|---|
| `Course` | Disciplina acadêmica e fonte de eventos/responsabilidades. |
| `ClassNote` | Registro de aula ligado a Document/Blocks. |
| `Task` | Responsabilidade temporal. |
| `Exam` | Evento obrigatório e/ou marco acadêmico. |
| `StudySession` | Sessão de estudo e registro de execução. |
| `ReadingItem` | Referência/Reading e possível responsabilidade. |
| `Flashcard` | Material de Estudos ligado a Concept. |
| `PsychologyConcept` | Concept do Workspace Acadêmico, com compatibilidade editorial. |
| `MaterialItem` | Documento, fonte ou anexo conforme conteúdo. |
| `TccData` | Project, Output, AcademicTree e documentos internos. |
| `looseNotes` | Documents temporários ou notas de captura. |
| `syncIndex` | Base para SyncRecords, tombstones e protocolo versionado. |

Durante a transição, o `AppContext` poderá funcionar como fachada de compatibilidade. Ele não deverá continuar recebendo novas regras de negócio como fonte primária.

## 13. Roadmap geral

O escopo funcional é amplo e será mantido. A implementação será feita em fatias verticais para reduzir risco, não para cortar funcionalidades do plano.

### Marco A — fundação e segurança

Criar contratos de domínio, IDs, migrações, exportação, backup, Workspaces e sessão persistente. Validar restauração antes de mover dados importantes.

### Marco B — desktop realmente próprio

Extrair shell desktop, navegação, painéis, layout de workspace, restauração de sessão e matriz de capacidades. O mobile permanece estável durante essa etapa.

### Marco C — conhecimento utilizável

Construir Documents, Blocks, editor de conhecimento, busca, relações determinísticas, Graph inicial, Inbox e policies de associação. O Graph deverá ser funcional, não apenas decorativo.

### Marco D — Calendário

Construir eventos, responsabilidades, blocos, recorrências, exceções, planejamento/realidade, grade semanal e projeção mobile. Adicionar Google Calendar com origem e conflitos.

### Marco E — TCC

Construir projetos, árvores configuráveis, uma saída principal, modelo interno de documento, editor paginado, referências, perfil ABNT, DOCX e round-trip com comparação.

### Marco F — Marketing

Construir posicionamento, ideias, conteúdo-base, adaptações por canal, aprovação individual, calendário editorial, publicação gradual, métricas e aprendizados confirmáveis.

### Marco G — infraestrutura de sincronização

Adaptar o merge existente ao protocolo versionado, implementar GitHub Provider e P2P Provider, introduzir SyncScope, BlobProvider, criptografia e restauração.

### Marco H — engines avançadas

Adicionar Context Engine, Knowledge Packets, IA assistiva, aprendizagem multidimensional, sugestões contextuais, relações semânticas e análise de impacto.

## 14. Critérios de sucesso

A arquitetura estará no caminho certo quando:

- o desktop puder funcionar como workspace de produção sem depender da jornada mobile;
- o mobile continuar útil para captura e execução rápida;
- os mesmos dados forem projetados de forma diferente nas plataformas;
- Workspaces permanecerem isolados por padrão;
- cada domínio tiver propriedade clara;
- relações atravessarem módulos sem criar cópias indevidas;
- a Home conectar contextos sem substituir módulos;
- o TCC produzir DOCX editável e reimportável com comparação;
- o Calendário diferenciar eventos, responsabilidades, planejamento e realidade;
- o Marketing separar conteúdo-base de versões por canal;
- o Graph representar conceitos, relações, contexto e evolução;
- sugestões importantes aguardarem confirmação;
- GitHub puder ser substituído por outro provider;
- uma revisão remota não puder ser sobrescrita silenciosamente;
- backups puderem ser restaurados fora do provider;
- o `AppContext` deixar de ser o dono de todo o domínio;
- a IA receber contexto compilado e relevante, não o corpus integral por padrão.

## 15. Decisões técnicas ainda abertas

O plano de produto está suficientemente fechado para iniciar prototipação e arquitetura detalhada. Permanecem abertas decisões de implementação:

1. biblioteca do editor visual paginado;
2. modelo interno exato de documentos, estilos e layout;
3. engine de importação/exportação DOCX;
4. preservação de controle de alterações e comentários nativos do Word;
5. engine bibliográfica e implementação de estilos ABNT;
6. estratégia de comparação de versões;
7. schema SQLite final e limites entre TypeScript e Rust;
8. formato binário ou textual do `SyncPackage`;
9. algoritmo de criptografia e gerenciamento de chaves;
10. autenticação de GitHub e armazenamento de credenciais;
11. política de SyncScope por dispositivo;
12. BlobProvider inicial;
13. APIs e permissões das redes sociais;
14. política de conflitos do Google Calendar;
15. regras específicas de fuso horário;
16. mecanismo de indexação e busca local;
17. formato final do `.cectx`;
18. estratégia de execução dos engines em background;
19. comportamento exato da IA com acesso amplo ao cecistudy;
20. testes de desempenho com documentos, relações e Workspaces em escala.

Essas decisões devem ser tomadas com protótipos pequenos e testes de round-trip, restauração, indexação e sincronização. Elas não devem bloquear a separação dos shells nem a criação dos contratos de domínio.

## 16. Próximo passo recomendado

O próximo passo não deve ser adicionar outra tela ao `AppContext`. Deve ser criar a fundação de compatibilidade:

```text
1. criar Domain Core independente de React;
2. introduzir Workspace e workspaceId;
3. criar repositórios/casos de uso;
4. manter AppContext como fachada temporária;
5. extrair DesktopAppShell e MobileAppShell;
6. criar o primeiro vertical slice de Document + Workspace;
7. validar exportação, migração e restauração;
8. só então expandir Graph, Calendário, TCC e Marketing.
```

O primeiro vertical slice ideal seria **Workspace → Document → Editor → busca local → sincronização/backup**, porque essa sequência valida os limites que todos os quatro módulos precisarão respeitar.

## Referências internas

[1]: `./cecistudy-main/.context/architecture.md` — stack, shells, estado, persistência e navegação atuais.

[2]: `./cecistudy-main/.context/data-model.md` — entidades, seeds, persistência e tipos atuais.

[3]: `./cecistudy-main/docs/device-sync-plano.md` — plano e status da sincronização P2P, pareamento e merge.

[4]: `./cecistudy-main/src/lib/sync/merge.ts` — merge determinístico atual entre bancos.

[5]: `./cecistudy-main/src/lib/sync/stamp.ts` — stamps, tombstones e regras de alteração atuais.

[6]: `./calendar-spec-v0.1.md` — especificação aprovada do Calendário.

[7]: `./tcc-spec-v0.1.md` — especificação aprovada do TCC.

[8]: `./marketing-spec-v0.1.md` — especificação aprovada do Studio de Marketing.

[9]: `./ceci-concept-synthesis.md` — síntese da visão conceitual da Base de Conhecimento.

[10]: `./pasted_content_2.txt` — referência de uso diário, Graph, continuidade de pensamento e aprendizagem ativa.

[11]: `./pasted_content_3.txt` — decisões sobre Workspaces, Inbox, relações e estados de aprendizagem.

[12]: `./pasted_content_5.txt` — proposta de Sync Engine, providers, protocolo e criptografia.

## Conclusão

A arquitetura final proposta para o cecistudy é um **sistema pessoal local-first de conhecimento, estudos, produção acadêmica e posicionamento profissional**, com um domínio compartilhado e experiências desktop/mobile deliberadamente diferentes.

O desktop será o ambiente ativo e completo: a Ceci poderá escrever, analisar, conectar conceitos, estudar, planejar, desenvolver TCCs e organizar sua presença profissional. O mobile será o ponto de captura, acompanhamento e execução rápida.

Calendário, TCC, Base de Conhecimento e Marketing não serão telas isoladas nem variações de um mesmo CRUD. Serão domínios próprios, ligados por relações tipadas, proveniência, eventos e confirmações humanas.

O GitHub poderá ser utilizado como primeiro provider de sincronização, mas nunca como fundamento do domínio. O fundamento será o protocolo próprio do cecistudy, o banco local, o Sync Engine, a camada de criptografia e as abstrações de provider/blob.

A prioridade de implementação deve ser criar limites corretos antes de adicionar volume de funcionalidades. Se o cecistudy conseguir preservar propriedade, contexto, proveniência, reversibilidade e experiências específicas por plataforma, ele poderá crescer por anos sem ficar preso ao formato atual do app ou a um único fornecedor de infraestrutura.
