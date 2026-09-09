# Proposta de separação entre desktop e mobile do cecistudy

## Decisão arquitetural

A melhor solução para o que você quer **não é criar dois repositórios isolados**. É manter um único repositório, com **dois aplicativos independentes** e um conjunto pequeno de pacotes compartilhados.

> **Compartilhar dados não significa compartilhar a aplicação.** O desktop e o mobile podem usar as mesmas entidades, migrações, repositórios e protocolo de sincronização, mas devem possuir entradas, estados de interface, componentes, fluxos e builds independentes.

O resultado desejado é:

| Situação | Comportamento esperado |
|---|---|
| Alterar uma tela, estilo ou fluxo do desktop | O mobile não deve ser recompilado por causa dessa alteração e não deve sofrer alteração visual ou comportamental. |
| Alterar uma tela, estilo ou fluxo do mobile | O desktop não deve ser recompilado por causa dessa alteração e não deve sofrer alteração visual ou comportamental. |
| Alterar o modelo de dados compartilhado | Os dois clientes podem precisar atualizar seus contratos, mas isso deve ser intencional, versionado e testado. |
| Sincronizar dados entre dispositivos | Desktop e mobile trocam dados por um protocolo compartilhado, sem trocar estado de UI ou navegação. |

## Diagnóstico da arquitetura atual

Hoje o projeto ainda funciona como **um único aplicativo React com duas shells**. `App.tsx` decide entre `DesktopAppShell` e `MobileAppShell` por meio de `isDesktop`, mas ambos entram no mesmo bundle e compartilham o mesmo `AppContext`, `ScreenLayers`, `GlobalOverlays`, tipos de navegação e grande parte das views.[1][2]

A pasta `desktop/` contém principalmente o invólucro Tauri. O código de produto desktop continua em `src/desktop/` e depende de módulos compartilhados da raiz. Além disso, o Tauri empacota o mesmo `dist/` gerado pelo projeto raiz.[3] Isso significa que uma mudança em um arquivo compartilhado pode alterar o desktop e o mobile simultaneamente, mesmo quando a mudança foi pensada para apenas uma plataforma.

| Camada atual | Problema para a independência |
|---|---|
| `src/App.tsx` | Um único ponto de entrada seleciona a plataforma em runtime. |
| `src/context/AppContext.tsx` | Um provider concentra dados, navegação, modais e comandos dos dois clientes. |
| `src/shells/ScreenLayers.tsx` | O desktop renderiza views compartilhadas com o mobile. |
| `src/shells/GlobalOverlays.tsx` | Busca, Quick Add, edição de curso, edição de TCC, OTA e outros overlays são compartilhados. |
| `src/components/` | A maior parte das telas e componentes ainda é consumida pelo desktop e pelo mobile. |
| `src/lib/` | Há uma mistura de lógica agnóstica, Capacitor, Tauri e comportamento de UI. |
| `desktop/src-tauri/` | O wrapper é separado, mas recebe o bundle comum da raiz; portanto não separa o cliente React. |
| `src/types.ts` | Contém tanto entidades de domínio quanto navegação, estado visual e contratos específicos da experiência. |

A arquitetura atual foi adequada para iniciar rapidamente a shell desktop, mas **não atende ao novo requisito de isolamento literal entre os clientes**.

## Arquitetura recomendada

A estrutura recomendada é um monorepo com dois aplicativos e pacotes compartilhados:

```text
cecistudy/
├── apps/
│   ├── mobile/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── navigation/
│   │   │   └── platform/          # Capacitor, Android e iOS
│   │   └── package.json
│   │
│   └── desktop/
│       ├── src/
│       │   ├── app/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── workspace/
│       │   └── platform/          # Tauri, janela e recursos desktop
│       └── package.json
│
├── packages/
│   ├── domain/                    # entidades e invariantes puras
│   ├── application/               # casos de uso e comandos
│   ├── data/                      # SQLite, backup, migrações e repositories
│   ├── sync/                      # SyncPackage, merge e providers
│   ├── contracts/                 # DTOs, schemas e versões públicas
│   └── design-tokens/             # tokens semânticos, sem componentes de tela
│
├── package.json                   # workspace/orquestração, sem UI de cliente
└── turbo.json ou equivalente      # opcional, para builds independentes
```

Não é necessário adotar Turborepo imediatamente. O ponto essencial é a fronteira de dependências. O `package.json` raiz pode continuar orquestrando comandos, desde que `apps/mobile` e `apps/desktop` tenham entradas, dependências e builds próprios.

## O que deve ser compartilhado

O compartilhamento deve ser deliberadamente pequeno e estável. Ele representa o **contrato do produto**, não a implementação das experiências.

| Pacote compartilhado | Deve conter | Não deve conter |
|---|---|---|
| `domain` | `Workspace`, `Document`, `Block`, `Project`, `CalendarEvent`, relações, invariantes e IDs estáveis. | React, hooks, navegação, Tailwind, Tauri ou Capacitor. |
| `application` | Casos de uso como criar documento, criar projeto, planejar responsabilidade, aceitar sugestão e preparar exportação. | Componentes, modais e decisões de layout. |
| `data` | Schema, migrações, repositories, backup/restore, serialização de entidades e drivers de armazenamento. | `DesktopSessionState`, `MobileNavigationState` ou qualquer estado de tela. |
| `sync` | `SyncManifest`, `SyncPackage`, merge, conflitos, tombstones, hashes e providers. | Sidebar, QR screen, toasts ou fluxo visual de pareamento. |
| `contracts` | Schemas versionados, DTOs de sincronização e compatibilidade entre versões. | Tipos de props de componentes específicos. |
| `design-tokens` | Cores semânticas, tipografia, espaçamentos e regras visuais primitivas. | Sidebar desktop, bottom navigation, cards de uma tela ou componentes com comportamento de plataforma. |

A sincronização deve trocar **dados de domínio e metadados de sincronização**. Ela não deve trocar a pilha de navegação, a posição de painéis, o estado de um modal ou o layout visual de um cliente.

## O que deve ser separado

O desktop e o mobile precisam ter implementações próprias para tudo que representa experiência, interação ou plataforma:

| Responsabilidade | Mobile | Desktop |
|---|---|---|
| Entrada do aplicativo | `apps/mobile/src/app/main.tsx` | `apps/desktop/src/app/main.tsx` |
| Navegação | Stack/tabs compactos e ações rápidas | Workspace, painéis, master-detail, documentos abertos e atalhos de teclado |
| Provider de UI | `MobileAppProvider` | `DesktopAppProvider` |
| Estado de sessão | `MobileSessionState` | `DesktopSessionState` |
| Shell | `MobileShell` | `DesktopShell` |
| Busca | Busca compacta e contextual | Command palette, busca global e filtros avançados |
| Criação | Wizards curtos e captura rápida | Compose, editor, painéis e fluxos longos |
| Calendário | Agenda do dia e visão resumida | Grade semanal, drag/resize e inspector persistente |
| TCC | Consulta, pendências e ações pontuais | Árvore, editor paginado, referências, versões e exportação |
| Notificações | Capacitor/local notifications | Recursos próprios do desktop, quando aplicável |
| Persistência local | Driver Capacitor/SQLite | Driver Tauri/SQLite ou store desktop equivalente |
| Empacotamento | Android/iOS/Web mobile | Windows/macOS/Linux via Tauri |

O ponto mais importante é que **`DesktopSessionState` não deve permanecer em `src/types.ts` compartilhado**. Ele é estado de produto do desktop. O mesmo vale para `NavScreen`, `navigationStack`, `overlayKey`, `focusedStudyScreen` e outros tipos que descrevem uma experiência específica.

## Como reorganizar o `AppContext`

O `AppContext` atual deve deixar de ser o provider universal dos dois clientes. A substituição recomendada é separar três responsabilidades:

```text
packages/data
  └── DataClient
        ├── repositories
        ├── backup/restore
        └── sync adapter

apps/mobile
  └── MobileAppProvider
        ├── MobileNavigationState
        ├── mobile quick actions
        └── projeções compactas dos dados

apps/desktop
  └── DesktopAppProvider
        ├── DesktopSessionState
        ├── open documents/panels
        ├── keyboard commands
        └── projeções ricas dos dados
```

Os dois providers podem usar o mesmo `DataClient` e os mesmos casos de uso, mas não devem compartilhar o estado de apresentação. Um comando como `createProject` pode ser compartilhado; o modo de abrir o formulário, a tela de confirmação, o painel selecionado e a navegação após salvar devem ser próprios de cada cliente.

Exemplo conceitual:

```ts
// compartilhado
const project = await dataClient.projects.create(input);

// mobile
mobileNavigation.openProjectSummary(project.id);

// desktop
desktopWorkspace.openProjectWorkspace(project.id);
```

O domínio é o mesmo; a reação da interface não é.

## Como tratar os dados compartilhados

Cada dispositivo deve possuir sua própria base local. O desktop não precisa abrir fisicamente o banco do celular, e o celular não precisa executar o código visual do desktop. Ambos devem manter uma representação compatível do mesmo domínio e sincronizar por `SyncPackage` versionado.

A camada compartilhada de dados deve incluir todas as entidades novas que hoje estão fora de `EmptyDatabase`, `PersistedStateSnapshot`, `buildBackupData`, `applyDatabase` e `USER_COLLECTION_KEYS`: workspaces, sessão sincronizável quando aplicável, relações, sugestões, políticas, projetos, outputs, Documents e Blocks. A sessão de UI, entretanto, deve permanecer local ao cliente e não deve ser sincronizada como se fosse dado de domínio.

A separação correta é:

| Tipo de dado | Compartilhado entre clientes? | Estratégia |
|---|---:|---|
| Projeto, output, documento, bloco e referência | Sim | Mesmo modelo, schema, migrações e sync. |
| Tarefa, evento, responsabilidade e execução | Sim | Mesmo domínio e protocolo; cada cliente pode projetar diferente. |
| Workspace e relações | Sim | Mesmo domínio e escopo por workspace. |
| Estado de sincronização | Sim parcialmente | Manifesto, revisão, tombstones e hashes são compartilhados; estado visual da tela não. |
| Navegação atual | Não | Cada cliente possui sua própria navegação. |
| Painéis abertos e viewport do grafo | Não | Pertencem à sessão desktop. |
| Tab selecionada e filtros compactos | Não | Pertencem à sessão mobile. |
| Preferências de aparência | Preferencialmente não | Podem usar tokens comuns, mas preferências de UI devem ser locais ao cliente. |

## Migração a partir do código atual

A migração deve ser incremental e não deve começar apagando o app atual. A ordem recomendada é:

| Etapa | Ação | Resultado |
|---:|---|---|
| **0** | Congelar a versão atual e adicionar testes de fronteira. | Nenhum novo import entre clientes passa despercebido. |
| **1** | Criar `packages/domain`, `packages/application`, `packages/data`, `packages/sync` e `packages/contracts`. | O núcleo compartilhado ganha uma localização explícita. |
| **2** | Mover `src/core/domain/**` para `packages/domain` e `src/core/application/**` para `packages/application`. | O domínio deixa de conhecer a aplicação React. |
| **3** | Mover schema, migrações, backup/restore e repositories para `packages/data`. | Desktop e mobile usam o mesmo contrato de dados, sem compartilhar provider de UI. |
| **4** | Mover `src/lib/sync/**` e `src/core/serialization.ts` para `packages/sync`/`contracts`. | O protocolo fica independente das telas de pareamento. |
| **5** | Criar `apps/mobile` usando as views atuais, sem mudar o comportamento mobile. | O mobile passa a ter entrada e build próprios. |
| **6** | Criar `apps/desktop` movendo `src/desktop/**` e `DesktopAppShell` para o cliente desktop. | O desktop deixa de depender de `ScreenLayers` e das views mobile. |
| **7** | Duplicar ou adaptar apenas os componentes necessários de busca, Quick Add, edição e toasts. | O desktop e o mobile podem evoluir separadamente. |
| **8** | Separar `MobileAppProvider` e `DesktopAppProvider`, usando o mesmo `DataClient`. | O domínio é compartilhado, mas estado de UI e navegação deixam de ser compartilhados. |
| **9** | Criar dois builds independentes e remover a decisão `isDesktop` do ponto de entrada. | Cada aplicativo já nasce sabendo qual experiência executa. |
| **10** | Remover gradualmente `src/shells/ScreenLayers.tsx` e o `GlobalOverlays` universal. | Desaparece a principal ponte acidental entre os clientes. |

A migração do TCC deve seguir a mesma regra: `Project`, `Output`, `AcademicNode`, `Document`, `Block`, `Reference` e `Citation` ficam no núcleo compartilhado; a tela de produção acadêmica fica exclusivamente em `apps/desktop`. O mobile pode receber uma projeção de consulta e ações rápidas depois, mas não deve importar o editor desktop.

## Regras que garantem independência

A separação só será real se houver regras automatizadas. Recomendo estabelecer os seguintes limites:

1. `apps/mobile` nunca pode importar de `apps/desktop`, e `apps/desktop` nunca pode importar de `apps/mobile`.
2. Nenhum pacote compartilhado pode importar React de um cliente, componentes de UI, Tauri ou Capacitor.
3. O desktop não pode importar `ScreenLayers`, `MobileAppShell`, views mobile ou overlays mobile.
4. O mobile não pode importar `DesktopAppShell`, `src/desktop/**`, componentes desktop ou estados de workspace visual.
5. Cada app deve possuir seu próprio `package.json`, entry point, configuração Vite e comando de build.
6. Alterações em `apps/desktop` devem executar apenas os testes e o build do desktop, salvo quando houver alteração explícita em `packages/*`.
7. Alterações em `apps/mobile` devem executar apenas os testes e o build do mobile, salvo quando houver alteração explícita em `packages/*`.
8. Toda alteração em `packages/domain`, `packages/data` ou `packages/sync` deve passar por testes de contrato dos dois clientes.
9. Tipos de domínio devem ser versionados separadamente de tipos de navegação e componentes.
10. A sincronização deve transportar dados, não estado de apresentação.

Uma verificação automática simples pode falhar o CI quando encontrar imports proibidos. Também é possível usar uma ferramenta de análise de dependências, mas o princípio deve estar documentado em um teste ou script do próprio repositório.

## Critérios de aceite

A separação estará concluída quando todos os critérios abaixo forem verdadeiros:

| Critério | Teste de aceite |
|---|---|
| Alteração desktop não atravessa mobile | Alterar uma cor, componente, rota ou fluxo em `apps/desktop` e executar o build/teste mobile sem recompilar ou importar código desktop. |
| Alteração mobile não atravessa desktop | Alterar uma tela ou navegação em `apps/mobile` e confirmar que o build desktop não carrega esse código. |
| Dados continuam compatíveis | Criar um documento no desktop, sincronizar e visualizar a projeção mobile sem conversão manual. |
| Estado visual permanece independente | Abrir painéis e documentos no desktop não altera tab, stack ou modal no mobile. |
| Core permanece agnóstico | O pacote de domínio compila sem DOM, React, Tauri ou Capacitor. |
| Sync permanece estável | Dois clientes conseguem trocar pacote versionado mesmo que suas interfaces sejam diferentes. |
| Builds são independentes | Existe um comando de build mobile e outro desktop; nenhum deles depende do `dist/` produzido pelo outro. |
| Migrações são reversíveis | Backup e restore preservam os dados compartilhados sem transportar estado visual específico de plataforma. |

## Ajuste necessário no plano de implementação

O plano existente deve ser corrigido em um ponto fundamental. Ele está correto ao prever um Domain Core, portas, repositórios e duas experiências distintas, mas ainda trata `DesktopAppShell` e `MobileAppShell` como duas apresentações do mesmo aplicativo. A nova versão do plano deve declarar explicitamente:

> **Desktop e mobile compartilham o núcleo de dados, mas são clientes de aplicação independentes. Nenhum cliente importa telas, navegação, provider ou estado de apresentação do outro.**

Com esse ajuste, a sequência de produto pode continuar praticamente a mesma — Documents, busca, grafo, calendário, TCC, Marketing e Sync —, mas cada módulo passa a ter uma implementação de desktop e, quando necessário, uma projeção mobile própria.

A mudança mais importante é que a independência técnica deve vir **antes** da implementação do editor, calendário desktop e Marketing Studio. Caso esses módulos sejam construídos dentro do `AppContext`, `ScreenLayers` e bundle atuais, a dependência entre plataformas continuará crescendo e ficará mais cara de remover depois.

## Recomendação final

Eu recomendo manter **um único repositório**, compartilhar somente `domain + application + data + sync + contracts + tokens`, separar completamente `apps/mobile` e `apps/desktop`, e fazer a migração antes de avançar muito nos módulos exclusivos do desktop.

Em termos práticos, a primeira implementação que eu faria seria a criação das fronteiras e dos dois entry points, sem alterar a experiência visual atual. Depois moveria o desktop para consumir seu próprio provider e sua própria navegação. Só quando essa separação passasse nos testes de dependência eu começaria o editor acadêmico, o calendário semanal e o Marketing Studio.

## Referências internas

[1]: src/App.tsx "Entrada atual que escolhe a shell por plataforma"
[2]: src/shells/ScreenLayers.tsx "Camada compartilhada de renderização de telas"
[3]: desktop/src-tauri/tauri.conf.json "Configuração Tauri que empacota o dist compartilhado"
[4]: src/context/AppContext.tsx "Provider atual compartilhado entre mobile e desktop"
[5]: src/lib/persistentData.ts "Contrato atual de backup e persistência"
[6]: src/lib/db/normalize.ts "Coleções atuais persistidas no SQLite"
[7]: src/core/domain/knowledge.ts "Entidades compartilháveis de documentos, blocos e relações"
[8]: src/core/domain/calendar.ts "Entidades compartilháveis de calendário"
[9]: src/core/domain/marketing.ts "Entidades compartilháveis de marketing"
[10]: desktop/context-desktop/PLANO-IMPLEMENTACAO.md "Plano de implementação atual"
