# Especificação técnica — correção, melhoria e otimização do cecistudy

**Projeto:** cecistudy  
**Versão da especificação:** 1.0  
**Data:** 08/10/2026  
**Status:** proposta executável  
**Escopo:** cliente React/TypeScript/Vite, aplicação mobile Capacitor, web/PWA, persistência SQLite/Preferences, navegação, animações, bundles e pipeline de qualidade.

---

## 1. Objetivo

Esta especificação define a implementação completa das correções e otimizações identificadas na auditoria de performance do cecistudy. O objetivo não é apenas reduzir alguns números de bundle, mas tornar o comportamento da aplicação previsível em aparelhos móveis de entrada, preservar a identidade visual e melhorar o tempo até a primeira interação útil.

A implementação deverá:

- reduzir o trabalho bloqueante durante o boot;
- eliminar o pré-carregamento indiscriminado de telas;
- diminuir o custo de CPU, GPU, memória e bateria de gráficos animados;
- reduzir bytes e parsing de conteúdo grande;
- evitar renders propagados sem necessidade;
- serializar a persistência nativa sem perder alterações;
- impedir recriação desnecessária de timers e listeners de sincronização;
- restaurar o gate de TypeScript, testes e build;
- preservar navegação, gesto de voltar, reduced motion, persistência, import/export, sync e comportamento nativo.

A especificação é intencionalmente incremental: primeiro restaura a capacidade de medir e validar; depois altera boot e prefetch; em seguida otimiza canvas, estado, persistência e artefatos de conteúdo.

## 2. Resultado esperado

Ao final, o aplicativo deverá abrir a primeira tela útil sem aguardar catálogo, questões, chunks profundos ou operações não essenciais. Os módulos deverão ser carregados conforme a rota e a probabilidade de uso, não simplesmente todos em sequência após a abertura. Gráficos dithered deverão ficar completamente inativos quando fora da viewport ou quando a página/app estiver em segundo plano.

A aplicação deverá continuar funcional em quatro condições:

1. web com `localStorage` e rede rápida;
2. web com conexão lenta ou `saveData` ativo;
3. Android/iOS com SQLite disponível;
4. Android/iOS com catálogo ou banco do usuário sendo hidratado de forma assíncrona.

Nenhuma tela poderá assumir que o catálogo, banco de questões ou chunks secundários já estão carregados. O contrato correto passa a ser: **a tela pode mostrar estado de carregamento vazio e solicitar seu próprio recurso quando necessário**.

---

## 3. Baseline conhecido

A auditoria identificou os seguintes pontos de partida:

| Item | Situação observada |
|---|---:|
| Erros TypeScript | 96 em 21 arquivos |
| Boundary check | Passou |
| JS/CSS no `dist` analisado | ~18,07 MiB |
| Banco `cecistudy_catalog.db` | ~20,9 MB |
| Maior chunk observado | banco de questões, ~4,4 MB |
| Chunk Three.js/3D | ~2,5 MB |
| Splash mínima | 1.600 ms |
| Teto da splash | 7.000 ms |
| Debounce de persistência | 200 ms |
| Intervalo de sync em background | 30 minutos |
| Loaders de telas pré-carregados | 27 |
| Testes encontrados | 115 |

Esses valores são baseline de auditoria. Antes de comparar resultados, o time deverá gerar um baseline reproduzível com build limpo, pois o ZIP original tinha permissões de execução incorretas em `node_modules/.bin` e dependências opcionais ausentes do Rollup.

---

## 4. Não objetivos

Esta entrega não deverá:

- trocar React, Vite, Capacitor ou Framer Motion sem evidência de necessidade;
- reescrever todo o `DataClientProvider` de uma vez;
- remover animações de navegação sem medição;
- remover a splash nativa do sistema;
- alterar o modelo de dados público sem migração versionada;
- apagar conteúdo do catálogo sem confirmar equivalência funcional;
- substituir SQLite por outra persistência;
- implementar um service worker novo como pré-requisito da otimização;
- usar `as any`, `@ts-ignore` ou desativar `strict` para esconder erros;
- alterar o fluxo de sincronização GitHub sem testes de conflito e rollback.

---

## 5. Requisitos funcionais e não funcionais

### 5.1 Requisitos funcionais

**RF-01 — Abertura progressiva.** A primeira tela deverá renderizar e aceitar interação assim que seus dados mínimos locais estiverem disponíveis. Recursos secundários deverão continuar carregando em background.

**RF-02 — Degradação segura.** Se o catálogo, questões ou um chunk falhar, a aplicação deverá mostrar estado de erro localizado e oferecer retry; não poderá deixar o shell inteiro bloqueado.

**RF-03 — Carregamento por demanda.** Cada tela lazy deverá solicitar seu próprio módulo e dados. A ausência de prefetch não poderá causar tela vazia sem feedback.

**RF-04 — Persistência íntegra.** Atualizações rápidas deverão resultar no último estado persistido, sem perda nem regressão para uma versão anterior.

**RF-05 — Animação preservada.** Transições de navegação, modal, gesture back e microinterações continuarão funcionando, exceto loops ornamentais que estejam fora de vista ou com o documento oculto.

**RF-06 — Reduced motion.** `prefers-reduced-motion` continuará removendo deslocamentos e loops não essenciais. Nenhuma otimização poderá reintroduzir animação quando o perfil reduzido estiver ativo.

**RF-07 — Compatibilidade nativa.** A hidratação assíncrona SQLite, o lifecycle Capacitor, teclado, safe area, back Android e gesto iOS deverão permanecer funcionais.

### 5.2 Requisitos não funcionais

**RNF-01 — Qualidade.** `tsc --noEmit`, testes Vitest, boundary check e build web/mobile deverão passar em ambiente limpo.

**RNF-02 — Observabilidade.** Boot, hidratação, navegação, carregamento de chunks, persistência e animação deverão possuir marcas/medidas de desenvolvimento.

**RNF-03 — Eficiência.** Nenhum canvas dither poderá solicitar novos frames quando invisível, quando o documento estiver oculto ou quando o modo reduzido estiver ativo.

**RNF-04 — Segurança de mudança.** Cada fase deverá ser reversível por flag/configuração ou commit isolado.

**RNF-05 — Determinismo.** O resultado de um build deverá ser reproduzível com `npm ci` e versão de Node documentada.

---

## 6. Arquitetura-alvo

### 6.1 Camadas de prontidão

O boot deverá ser dividido em três níveis:

| Nível | Conteúdo | Bloqueia interação? |
|---|---|---|
| `critical` | tema, configuração mínima, abertura do banco do usuário, estado mínimo da rota inicial | Sim, somente até terminar ou falhar com fallback |
| `deferred` | catálogo necessário para a primeira tela, seed de dados e facades prováveis | Não; carrega após shell interativo |
| `opportunistic` | questões, approaches, telas profundas, prefetch e assets ornamentais | Não; executa em idle/rede adequada |

O contrato de boot deverá retornar um objeto com status por etapa, e não apenas uma Promise global sem contexto:

```ts
type BootStepId =
  | 'theme'
  | 'user-db'
  | 'user-state'
  | 'catalog-core'
  | 'catalog-approaches'
  | 'catalog-questions'
  | 'route-prefetch';

type BootStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';

type BootStepResult = {
  id: BootStepId;
  status: BootStepStatus;
  startedAt?: number;
  endedAt?: number;
  error?: unknown;
};
```

A UI deverá considerar `criticalReady` como o único requisito para sair da barreira inicial. `allReady` não deverá ser utilizado para bloquear a aplicação.

### 6.2 Gerenciador de recursos

Criar uma camada pequena, sem introduzir um framework de cache completo, para controlar recursos carregáveis:

```ts
type ResourcePriority = 'critical' | 'deferred' | 'opportunistic';

type ResourceRequest = {
  key: string;
  priority: ResourcePriority;
  load: () => Promise<unknown>;
};

interface ResourceManager {
  request<T>(request: ResourceRequest & { load: () => Promise<T> }): Promise<T>;
  prefetch(request: ResourceRequest): void;
  cancelPrefetch(key: string): void;
  status(key: string): BootStepStatus;
}
```

O manager deverá deduplicar requests pela chave, manter a Promise em cache enquanto o recurso estiver em carregamento e remover uma Promise rejeitada para permitir retry.

### 6.3 Política de prefetch

A política deverá considerar:

- rota atualmente visível;
- próxima rota provável conforme tab ativa;
- `navigator.connection.saveData`;
- `effectiveType` quando disponível;
- largura de banda estimada;
- documento visível ou oculto;
- preferência de reduced motion apenas para animações, não para carregamento obrigatório;
- possibilidade de `requestIdleCallback`, com fallback para `setTimeout`.

O prefetch deverá ser limitado a uma fila de baixa prioridade com no máximo um ou dois módulos simultâneos. Em `saveData`, conexão 2G/slow-2g ou documento oculto, deverá ser pulado.

### 6.4 Contextos e fatias

Manter a compatibilidade dos contextos agregados, mas estabelecer os bundles por domínio como caminho preferencial para telas pesadas:

- `CoursesActionsContext` para cursos, aulas, tarefas e provas;
- `StudyActionsContext` para sessões, leituras, quiz, streak e técnicas;
- `KnowledgeActionsContext` para autores, conceitos, livros e notas;
- `AppActionsContext` para perfil, tema, onboarding, sync e preferências;
- `TermActionsContext` para períodos acadêmicos;
- `NavValueContext` para navegação.

As telas novas não deverão importar `useMobileApp()` apenas para obter um setter de domínio. O contexto agregado permanece como API de compatibilidade até que o profiler comprove que uma tela deve ser migrada.

---

## 7. Plano de implementação por fases

## Fase 0 — Recuperar o pipeline

### Objetivo

Eliminar o bloqueio de qualidade que impede validar as mudanças.

### Arquivos e ações

1. Corrigir a instalação das dependências:
   - remover `node_modules` apenas no ambiente de desenvolvimento/CI;
   - executar `npm ci` usando o lockfile;
   - confirmar instalação de `@rollup/rollup-linux-x64-gnu` como dependência opcional compatível com o runner;
   - documentar Node 22.x e npm 10.x, ou fixar a versão oficial adotada pelo projeto.
2. Restaurar permissões de execução de `node_modules/.bin` no ambiente local/CI; não versionar `node_modules`.
3. Executar `tsc --noEmit` e corrigir os 96 erros em lotes pequenos.
4. Executar os 115 testes encontrados e registrar falhas reais separadamente de falhas de infraestrutura.
5. Executar o boundary check e os builds web/mobile.

### Ordem de correção TypeScript

1. contratos compartilhados: `packages/contracts`, `packages/data`, `packages/sync`;
2. utilitários de dados e criptografia;
3. componentes de UI e testes de UI;
4. `InternshipWizard.tsx`;
5. `TaskExamWizard.tsx` e hooks de repertório;
6. `navigationEngine.ts` e header config;
7. grupos de quiz e testes restantes.

### Regras

- Corrigir o tipo na origem quando o domínio garante o valor.
- Usar fallback explícito somente quando `undefined` é semanticamente válido.
- Não mascarar erros com casts genéricos.
- Quando um tipo legado permitir `undefined`, normalizar na borda do formulário para um modelo interno completo.

### Critério de conclusão

- zero erro de TypeScript;
- zero erro de boundary;
- testes executáveis;
- build web e mobile iniciam sem erro de Rollup.

---

## Fase 1 — Instrumentação e baseline

### Objetivo

Medir antes de alterar comportamento.

### Novo módulo sugerido

`src/lib/performance/perfMarks.ts`.

API mínima:

```ts
export function mark(name: string): void;
export function measure(name: string, start: string, end?: string): void;
export function recordEvent(name: string, detail?: Record<string, unknown>): void;
export function flushDevMetrics(): void;
```

Em produção, a implementação deverá ser no-op ou enviar somente métricas explicitamente habilitadas. Em desenvolvimento, deverá usar `performance.mark`, `performance.measure` e logs agrupados.

### Marcas obrigatórias

- `app-entry-start`;
- `theme-ready`;
- `boot-critical-start/end`;
- `boot-deferred-start/end`;
- `boot-opportunistic-start/end`;
- `first-screen-mounted`;
- `interactive-ready`;
- `first-route-chunk-start/end`;
- `sqlite-hydration-start/end`;
- `catalog-request-start/end`;
- `persist-write-start/end`;
- `sync-cycle-start/end`.

### Medições obrigatórias

- `time-to-first-paint`;
- `time-to-interactive`;
- `time-to-first-route`;
- `critical-boot-duration`;
- `deferred-boot-duration`;
- `first-navigation-duration`;
- `sqlite-write-duration`;
- `chunk-load-duration`.

### Instrumentação de frames

Criar um contador somente em desenvolvimento para cada gráfico:

```ts
type FrameStats = {
  frames: number;
  skipped: number;
  lastFrameAt: number;
};
```

O contador deverá permitir validar que `frames` permanece em zero quando o elemento está fora da viewport ou o documento está oculto.

### Critério de conclusão

Um documento de baseline deverá registrar P50/P75/P95 em pelo menos:

- web desktop;
- Android mid-range;
- Android low-end;
- iPhone de geração anterior;
- cold start;
- warm start;
- conexão rápida;
- conexão lenta/simulação `saveData`.

---

## Fase 2 — Reestruturar o boot

### Arquivos principais

- `src/lib/bootPreload.ts`;
- `src/components/ui/BootSplash.tsx`;
- `src/App.tsx`;
- `src/main.tsx`;
- `apps/mobile/src/app/main.tsx`;
- `src/context/DataClientProvider.tsx`;
- `src/lib/db/userDb.ts` e facades do catálogo, conforme necessário.

### 2.1 Novo contrato de `runBootPreload`

Substituir o retorno implícito de uma Promise global por um estado estruturado:

```ts
type BootState = {
  criticalReady: boolean;
  deferredReady: boolean;
  opportunisticReady: boolean;
  steps: Record<BootStepId, BootStepResult>;
  errors: Array<{ step: BootStepId; error: unknown }>;
};

function runBootPreload(
  onProgress?: (state: BootState) => void,
  options?: { signal?: AbortSignal }
): Promise<BootState>;
```

A Promise deverá resolver quando as tarefas disparadas terminarem, mas a UI não poderá depender dessa resolução para montar a primeira tela.

### 2.2 Execução paralela segura

Etapas independentes deverão usar `Promise.allSettled`, não `Promise.all`, para que uma falha opcional não derrube o conjunto:

```ts
const critical = await allSettledWithStatus([
  step('theme', initTheme),
  step('user-db', openUserDb),
  step('user-state', hydrateMinimalUserState),
]);

void runDeferredGroup([
  step('catalog-core', loadCatalogCore),
  step('route-prefetch', prefetchInitialRoute),
]);

scheduleIdle(() => {
  void runOpportunisticGroup([
    step('catalog-approaches', loadApproaches),
    step('catalog-questions', loadQuestions),
  ]);
});
```

A ordem deverá respeitar dependências reais. Por exemplo, uma etapa que exige a conexão do banco deverá depender da Promise de `user-db`, mas não deverá esperar questões ou approaches.

### 2.3 Splash

Alterações em `BootSplash.tsx`:

- remover a regra de que toda a pré-carga precisa terminar para sair;
- manter duração mínima apenas se necessária para evitar flash visual, reduzindo o valor após medição;
- sair quando `criticalReady` for verdadeiro;
- manter o progresso como progresso do grupo crítico, não como falsa porcentagem de todos os recursos;
- em erro crítico, mostrar fallback acionável ou liberar a UI com modo degradado;
- preservar `MAX_DISPLAY_MS` como último escape, mas registrar o motivo quando acionado;
- manter `prefers-reduced-motion` sem bounce da mascote.

A barra de progresso não deverá representar uma soma enganosa entre uma etapa de 5 ms e outra de 2 s. Usar progresso por peso ou trocar por estado textual quando os pesos não forem confiáveis.

### 2.4 Critérios de aceite da fase

- Home/onboarding aparece sem esperar questões e approaches.
- Falha no catálogo opcional não impede navegação.
- A primeira ação de toque pode ocorrer assim que a tela inicial estiver montada.
- Não existem duas execuções concorrentes de boot.
- StrictMode não duplica efeitos com requests sem deduplicação.
- Cold start e warm start melhoram ou, no mínimo, não pioram no P95 após a separação.

---

## Fase 3 — Substituir o preload global de chunks

### Arquivos principais

- `src/shells/SharedScreenLayers.tsx`;
- `src/App.tsx`;
- `apps/mobile/src/app/main.tsx`;
- novo módulo `src/lib/performance/screenPrefetch.ts`;
- testes da navegação e lazy loading.

### 3.1 Remoção do comportamento atual

Remover chamadas que percorrem todos os loaders de `SCREEN_CHUNK_LOADERS` logo após o boot. Os loaders deverão continuar disponíveis para `lazy()` e carregamento real da rota.

A função antiga poderá permanecer como compatibilidade temporária, mas deverá ser alterada para aceitar uma lista explícita:

```ts
export function preloadScreenChunks(
  keys: ScreenKey[],
  options?: PrefetchOptions
): void;
```

Não deverá existir uma chamada de produção equivalente a `preloadScreenChunks(Object.keys(SCREEN_CHUNK_LOADERS))`.

### 3.2 Política por rota

Definir grupos:

| Contexto | Prefetch permitido |
|---|---|
| Home visível | próxima aba mais provável |
| Faculdade aberta | curso/agenda relacionados |
| Biblioteca aberta | leitura/comparação somente após intenção observável |
| Estudo aberto | quiz/revisão somente após ação do usuário |
| Perfil/configurações | nenhum prefetch pesado |
| onboarding | somente recursos do onboarding |

A intenção observável pode ser clique, hover em desktop, foco ou navegação já iniciada. Não usar hover como único gatilho em touch.

### 3.3 Limites

- máximo de 1 prefetch simultâneo por padrão;
- máximo de 2 somente em conexão rápida e dispositivo sem `saveData`;
- não prefetch em documento oculto;
- cancelar tarefas pendentes de baixa prioridade ao mudar de rota;
- não fazer prefetch do banco de questões, comparação ou Three.js sem intenção explícita;
- aplicar timeout de 10 s para prefetch; timeout não deve ser tratado como erro visível.

### 3.4 Critérios de aceite

- Apenas os chunks necessários à rota inicial são carregados nos primeiros 3 s.
- O fluxo de abrir qualquer rota ainda mostra loading local e completa normalmente.
- `saveData` impede prefetch não crítico.
- Não há duplicação de requests no web e no mobile.
- O tamanho de JS efetivamente carregado nos primeiros 30 s diminui no cenário Home.

---

## Fase 4 — Reduzir artefatos de conteúdo e bundle

### 4.1 Banco de questões

**Objetivo:** retirar o payload completo de ~4,4 MB do caminho de qualquer tela que não use questões.

Implementação:

1. Identificar a chave de agrupamento natural: área, escola, tema ou domínio.
2. Gerar arquivos particionados com manifest versionado:

```json
{
  "version": 1,
  "groups": {
    "fundamentos": { "url": "...", "bytes": 0, "sha256": "..." },
    "cognicao": { "url": "...", "bytes": 0, "sha256": "..." }
  }
}
```

3. Carregar apenas o grupo selecionado pelo quiz.
4. Manter cache por grupo no web e tabela/catalog source equivalente no nativo.
5. Validar que IDs, ordem, filtros e agrupamentos atuais permanecem iguais.
6. Se o catálogo nativo precisar continuar em SQLite, fazer a consulta por grupo com índice, em vez de materializar todas as questões em JavaScript.

**Aceite:** nenhum fluxo fora do quiz importa todos os grupos de questões; abrir um quiz carrega somente o grupo necessário.

### 4.2 Approaches, autores e comparações

- Remover imports estáticos de listas completas quando a tela utiliza busca/filtro.
- Expor facades assíncronas por consulta.
- Para autores e approaches, carregar índices compactos primeiro e detalhes completos somente ao abrir um item.
- Para comparações, mover fontes detalhadas e eixos extensos para carregamento sob demanda.
- Testar a equivalência com os dados atuais e snapshots dos resultados.

### 4.3 Three.js/3D

- Manter o módulo 3D fora do bundle inicial.
- Só solicitar o chunk ao entrar no fluxo que realmente renderiza `ThreeDPaper`.
- Em aparelhos fracos ou `saveData`, usar fallback CSS/canvas estático.
- Não inicializar contexto WebGL até o componente estar visível.
- Liberar recursos WebGL quando o fluxo sair, quando for seguro, evitando contextos acumulados.

### 4.4 Catálogo SQLite de ~20,9 MB

- Medir compressão efetiva no APK/IPA e no download web antes de mudar o formato.
- Criar versão de catálogo e checksum.
- Separar tabelas essenciais de tabelas opcionais.
- Adicionar índices somente para consultas comprovadas; cada índice tem custo de instalação e memória.
- Evitar carregar toda a tabela para arrays no provider.
- Expor consultas paginadas ou limitadas por domínio.
- Manter migração e fallback para catálogo anterior.

### 4.5 Fontes e assets

- Medir bytes das famílias Inter, Plus Jakarta Sans, DM Serif Display e JetBrains Mono.
- Manter apenas pesos realmente utilizados ou justificar cada peso.
- Preferir formatos modernos existentes no build e confirmar que não há cópia duplicada desnecessária.
- Não remover splash/icon nativos sem validar cada densidade, orientação e dark mode.

### 4.6 Critérios de aceite

- O build publica relatório de tamanho por chunk.
- Nenhum novo chunk crítico excede 500 KiB comprimido sem justificativa documentada.
- Chunks grandes de conteúdo são carregados por intenção/rota.
- Catálogo continua funcional em web e nativo.
- Dados permanecem versionados e podem ser invalidados por checksum.

---

## Fase 5 — Pausar e simplificar gráficos dithered

### Arquivos

- `src/components/ui/dither-growth.tsx`;
- `src/components/ui/dither-revenue.tsx`;
- `src/components/ui/dither-funnel.tsx`;
- `src/components/ui/dither-donut.tsx`;
- novo hook compartilhado `src/components/ui/useCanvasActivity.ts` ou equivalente.

### 5.1 Hook de atividade

Criar hook que combine Intersection Observer e visibilidade do documento:

```ts
function useCanvasActivity(
  elementRef: React.RefObject<Element>,
  options?: { rootMargin?: string }
): boolean;
```

Regras:

- `active = intersectionRatio > 0 && document.visibilityState === 'visible'`;
- em `prefers-reduced-motion`, `active` pode continuar verdadeiro para render estático, mas não para loop contínuo;
- o hook deve observar mudança de `visibilitychange`;
- fallback sem IntersectionObserver: considerar ativo enquanto montado e documento visível.

### 5.2 Loop de desenho

Substituir o padrão atual de reagendar frame mesmo invisível por um loop controlado:

```ts
const runningRef = useRef(false);

const schedule = () => {
  if (!active || reducedMotion) return;
  if (requestRef.current != null) return;
  requestRef.current = requestAnimationFrame(draw);
};

const draw = (now: number) => {
  requestRef.current = undefined;
  if (!active) return;
  renderFrame(now);
  if (needsAnimation) schedule();
};
```

Ao ficar inativo:

- cancelar o RAF pendente;
- não solicitar outro frame;
- preservar os dados necessários para desenhar no retorno.

Ao ficar ativo novamente:

- fazer um desenho estático imediato;
- reiniciar morph apenas se houve mudança de dados enquanto inativo;
- não reiniciar shimmer indefinidamente se o gráfico estável não precisa animar.

### 5.3 Otimização de desenho

- criar o contexto uma vez e reutilizar;
- evitar `getContext` a cada frame;
- evitar alocações de arrays por frame quando os dados não mudaram;
- cachear a grade estática em canvas auxiliar ou `OffscreenCanvas` quando suportado;
- limitar DPR a 2, mantendo fallback a 1 em aparelhos de baixa capacidade se a métrica indicar custo alto;
- atualizar `getBoundingClientRect` somente em ResizeObserver, não por frame;
- renderizar um frame estático após `resize` e mudança de tema.

### 5.4 Critérios de aceite

- zero RAF pendente após invisibilidade estabilizar;
- zero frames de shimmer quando reduced motion estiver ativo;
- retorno à viewport não produz tela vazia;
- scrub/pointer continua funcionando quando o gráfico está ativo;
- cleanup funciona em unmount e troca de rota;
- quatro componentes compartilham a mesma política, sem duplicação divergente.

---

## Fase 6 — Reduzir renders e estabilizar contextos

### 6.1 Instrumentação

Adicionar em desenvolvimento:

- contador de renders por tela pesada;
- marca de mudança de contexto;
- log opcional quando um bundle muda de identidade;
- profiler React em cenários controlados.

Não otimizar por suposição. Primeiro medir:

1. abrir Home e alterar um toast;
2. editar um curso;
3. atualizar streak;
4. trocar tema;
5. navegar push/pop;
6. executar sync;
7. atualizar uma nota enquanto Biblioteca está montada.

### 6.2 Migração dos consumidores

Para cada render confirmado como desnecessário:

- trocar `useMobileApp()` por hook de domínio;
- separar leitura de dados de ações quando possível;
- garantir que callbacks permaneçam estáveis com `useCallback`;
- garantir que objetos de bundle permaneçam estáveis com `useMemo`;
- evitar `useMemo` sem medir: memoização também tem custo e não deve esconder dependência incorreta.

### 6.3 `DataClientProvider`

Não dividir o provider imediatamente. Primeiro:

- manter o valor agregado para compatibilidade;
- tornar `domainCourses`, `domainStudy`, `domainKnowledge` e `domainApp` a API recomendada;
- revisar dependências dos `useMemo` e callbacks;
- remover referências instáveis de listas/objetos criados a cada render;
- separar catálogos estáticos dos dados de usuário quando a mudança de catálogo não precisar invalidar telas de domínio.

### 6.4 Critérios de aceite

- ações de domínio não provocam render em telas sem dependência daquele domínio;
- nenhuma tela pesada piora em tempo de render após a migração;
- testes de contexto cobrem identidade estável onde isso for contrato;
- comportamento não muda em import/export, reset, onboarding e sync.

---

## Fase 7 — Fila de persistência SQLite

### Arquivo principal

`src/lib/useSqliteState.ts`, com possível novo módulo `src/lib/db/writeQueue.ts`.

### 7.1 Contrato da fila

```ts
type WriteTask = {
  key: string;
  version: number;
  write: () => Promise<void>;
};

interface WriteQueue {
  enqueue(task: WriteTask): Promise<void>;
  flush(key?: string): Promise<void>;
  cancelPending(key: string): void;
}
```

A fila deverá ser por chave de coleção. Uma nova mudança enquanto existe uma escrita pendente deverá substituir o payload pendente pela versão mais recente, sem cancelar uma transação já iniciada.

### 7.2 Semântica

- debounce de 200 ms permanece inicialmente;
- cada alteração recebe versão monotônica por chave;
- uma escrita em andamento termina;
- ao terminar, se houver versão mais nova, grava somente a mais nova;
- `pagehide`/`visibilitychange` chama `flush(key)`;
- erro mantém a versão pendente para retry e registra erro observável;
- reset/import deve invalidar pendências antigas antes de gravar o novo snapshot.

### 7.3 Testes

- 50 atualizações rápidas resultam no último valor;
- escrita lenta seguida de escrita rápida não regride;
- flush durante mudança de visibilidade grava o último valor;
- unmount não deixa Promise atualizar estado React;
- falha do SQLite usa fallback já existente sem loop infinito;
- duas coleções diferentes podem progredir sem bloquear indevidamente uma à outra.

---

## Fase 8 — Sincronização de background

### Arquivo principal

`src/context/DataClientProvider.tsx`, trecho de gatilhos de background e callbacks de sync.

### Problema a resolver

A cadeia `syncInBackground → performSync → getSyncPayloadJson` possui dependências amplas. O efeito de intervalo pode ser desmontado e reinstalado após mudanças de estado, criando trabalho desnecessário e dificultando observar listeners duplicados.

### Solução

Separar:

1. lifecycle do timer/listeners, dependente somente de `githubSyncConfig` e disponibilidade do ambiente;
2. callback operacional atualizada em ref;
3. snapshot atual de sync em ref ou provider estável.

Padrão conceitual:

```ts
const syncRef = useRef(syncInBackground);
syncRef.current = syncInBackground;

useEffect(() => {
  if (!githubSyncConfig) return;

  const run = () => void syncRef.current();
  const interval = window.setInterval(run, SYNC_INTERVAL_MS);
  window.addEventListener('online', run);
  window.addEventListener('pagehide', run);

  return () => {
    window.clearInterval(interval);
    window.removeEventListener('online', run);
    window.removeEventListener('pagehide', run);
  };
}, [githubSyncConfig]);
```

Adicionar uma trava `inFlight` para impedir sync concorrente em abertura + online + timer.

### Critérios de aceite

- um único intervalo por configuração ativa;
- no máximo um sync em andamento;
- snapshot mais recente usado sem recriar listeners;
- clear de configuração remove tudo;
- sync manual continua mostrando preview e permitindo aplicar/descartar.

---

## Fase 9 — Navegação, gesture e animações

### Preservar

- pilha como fonte de verdade;
- hash como espelho;
- continuidade do gesto de pop;
- `shouldIgnoreTarget` para inputs e áreas interativas;
- fallback de spring;
- reduced motion.

### Melhorias seguras

1. Garantir que `EdgeSwipeBack` não instale listeners em desktop e que o cleanup seja idempotente.
2. Manter leituras de layout fora de `pointermove`; qualquer nova medição deverá ocorrer em `pointerdown`/ResizeObserver.
3. Não montar telas pesadas preservadas na pilha se o contrato da navegação permitir desmontagem segura.
4. Aplicar `content-visibility: auto` somente em listas/áreas que não participem de gesto, foco ou medição de layout crítica.
5. Em `SlideScreen`, manter a tela de saída congelada durante transição, mas liberar recursos pesados após a animação.
6. Testar transições com teclado aberto, orientação alterada e retorno do background.

### Critérios de aceite

- push, pop, tab e replace não apresentam salto de scroll;
- gesto de borda não rouba toque de botão/input;
- Android back e iOS swipe continuam equivalentes;
- reduced motion não executa deslocamentos ornamentais;
- não há listeners duplicados após 20 navegações.

---

## 8. Estratégia de testes

### 8.1 Testes unitários

Adicionar ou atualizar testes para:

- classificação de boot por prioridade;
- deduplicação do `ResourceManager`;
- retry após falha de recurso;
- política de prefetch com `saveData`/conexão lenta;
- fila de persistência e ordenação por versão;
- trava de sync concorrente;
- atividade/inatividade de canvas;
- reduced motion;
- normalização dos contratos corrigidos em TypeScript.

### 8.2 Testes de componente

- `BootSplash` libera após `criticalReady` sem aguardar deferred;
- erro opcional não impede render;
- canvas não chama RAF quando invisível;
- canvas retoma ao voltar à viewport;
- `MobileAppProvider` mantém bundles e ações funcionais;
- `EdgeSwipeBack` instala somente em ponteiro coarse;
- telas lazy mostram loading e erro local.

### 8.3 Testes de integração

Cenários mínimos:

1. primeiro acesso sem dados;
2. hidratação nativa atrasada;
3. catálogo indisponível;
4. questões carregadas sob demanda;
5. import seguido de persistência;
6. reset enquanto há escrita pendente;
7. sync online/offline;
8. app em background durante escrita;
9. troca rápida de telas;
10. 20 pushes/pops e retorno à Home.

### 8.4 Testes de build

Scripts recomendados no `package.json`:

```json
{
  "typecheck": "tsc --noEmit",
  "test:ci": "vitest run --reporter=dot",
  "build:web": "vite build",
  "build:mobile": "npm run build --workspace=apps/mobile",
  "check:boundaries": "node .github/scripts/check-boundaries.mjs",
  "verify": "npm run typecheck && npm run test:ci && npm run check:boundaries && npm run build:web && npm run build:mobile"
}
```

O nome final dos scripts pode seguir a convenção existente, mas o CI deverá possuir uma única entrada equivalente a `verify`.

---

## 9. Orçamento de performance

Os limites abaixo são metas iniciais, a ajustar depois do baseline físico:

| Métrica | Meta inicial |
|---|---:|
| `critical-boot-duration` P75 em aparelho mid-range | ≤ 800 ms |
| `time-to-interactive` P75 warm start | ≤ 1.200 ms |
| `time-to-interactive` P75 cold start | ≤ 2.500 ms |
| espera artificial mínima da splash | ≤ 500 ms, salvo requisito visual comprovado |
| chunks carregados nos primeiros 3 s em Home | somente os essenciais da rota |
| prefetch em `saveData` | 0 recursos oportunísticos |
| RAF de canvas fora da viewport | 0 |
| RAF de canvas com documento oculto | 0 |
| writes SQLite concorrentes por chave | 0 |
| listeners de sync duplicados | 0 |
| erros TypeScript | 0 |
| boundary check | 100% verde |

Os limites de tempo não deverão ser tratados como promessa antes da medição. Se hardware ou requisitos visuais impedirem uma meta, documentar P95 real e a justificativa.

---

## 10. Instrumentação de bundle

Adicionar ao pipeline uma análise de tamanho com:

- bytes bruto por chunk;
- bytes gzip/brotli;
- origem principal do chunk;
- primeiro uso esperado;
- rota que o carrega;
- se é crítico, deferred ou opportunistic.

Gerar arquivo de relatório versionado fora do bundle público, por exemplo `artifacts/bundle-report.json`.

Falhar o CI somente para regressões claramente definidas, por exemplo:

- aumento maior que 10% no JS crítico;
- novo chunk crítico acima do limite sem anotação;
- carregamento de conteúdo oportunístico no entrypoint;
- inclusão acidental do banco completo em um chunk JavaScript.

---

## 11. Rollout e feature flags

As fases de boot, prefetch, canvas e fila de persistência deverão possuir flags temporárias durante desenvolvimento:

```ts
type PerformanceFlags = {
  progressiveBoot: boolean;
  routePrefetch: boolean;
  pausedCanvasLoops: boolean;
  queuedSqliteWrites: boolean;
  stableBackgroundSync: boolean;
};
```

Regras:

- flags ativadas por padrão em desenvolvimento somente após testes básicos;
- possibilidade de desligar cada alteração isoladamente em staging;
- não expor controles ao usuário final;
- remover flags depois de uma versão estável, evitando configuração permanente.

### Rollout sugerido

1. pipeline e instrumentação;
2. progressive boot em staging;
3. prefetch seletivo;
4. canvas pausado;
5. fila SQLite;
6. content/catalog splitting;
7. migração de consumidores por profiler;
8. remoção das flags.

---

## 12. Rollback

Cada fase deverá ser revertível sem migração destrutiva.

- Boot: voltar para o executor sequencial mantendo o novo estado de diagnóstico.
- Prefetch: reativar somente prefetch da rota atual, não o global, se houver falha.
- Catálogo: manter manifest com versão anterior e fallback para o arquivo anterior.
- Canvas: voltar a um frame estático por evento de visibilidade, nunca a loop infinito sem controle.
- SQLite: desligar a fila e gravar diretamente somente se testes mostrarem incompatibilidade; não apagar dados.
- Sync: voltar ao efeito anterior apenas temporariamente, registrando possível recriação de listeners.

Não apagar ou sobrescrever banco do usuário durante rollback. Migrações devem ser aditivas e ter backup/restore testado.

---

## 13. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Home renderizar antes de dados necessários | definir contrato mínimo de `criticalReady` e testes de estado vazio |
| prefetch seletivo aumentar latência de uma tela rara | carregar sob demanda com skeleton local e prefetch após intenção |
| divisão do catálogo divergir entre web e nativo | manifest/checksum e testes de equivalência |
| fila SQLite perder alteração no flush | teste de estresse, versionamento monotônico e flush explícito |
| pausa do canvas gerar frame antigo | desenho estático imediato ao reativar |
| contextos estabilizados esconder estado obsoleto | refs atualizadas antes do callback e testes de snapshot |
| correção de TypeScript mudar regra de negócio | revisar contratos e adicionar testes antes de casts |
| `content-visibility` quebrar foco/medição | aplicar somente após teste de teclado, scroll e acessibilidade |
| remover fontes/assets gerar fallback visual | comparar screenshots e manter subset necessário |
| StrictMode duplicar requests | deduplicação central por chave |

---

## 14. Checklist de implementação

### Pipeline

- [ ] `npm ci` reproduz dependências completas.
- [ ] Binários não dependem de permissões preservadas em ZIP.
- [ ] `@rollup/rollup-linux-x64-gnu` é resolvido no runner compatível.
- [ ] TypeScript está verde.
- [ ] Testes estão verdes.
- [ ] Boundary check está verde.
- [ ] Build web está verde.
- [ ] Build mobile está verde.

### Boot

- [ ] Prontidão crítica separada de deferred/opportunistic.
- [ ] Etapas independentes usam `allSettled`.
- [ ] Recursos são deduplicados.
- [ ] Falha opcional não bloqueia o shell.
- [ ] Splash não espera questões/approaches/chunks profundos.
- [ ] Marcas de performance registradas.

### Prefetch e bundle

- [ ] Não existe preload global de todos os loaders.
- [ ] Política de rota está documentada.
- [ ] `saveData` e conexão lenta desativam prefetch oportunístico.
- [ ] Questões são particionadas ou consultadas sob demanda.
- [ ] Three.js só inicia em fluxo que o utiliza.
- [ ] Relatório de bundle é gerado no CI.

### Canvas e animações

- [ ] Intersection Observer implementado.
- [ ] `visibilitychange` pausa loops.
- [ ] RAF pendente é cancelado ao ficar inativo.
- [ ] Retorno à viewport desenha corretamente.
- [ ] Reduced motion não mantém loop ornamental.
- [ ] Listeners e observers são removidos no unmount.

### Estado e persistência

- [ ] Consumidores pesados usam bundles de domínio quando medido.
- [ ] Dependências de `useMemo`/`useCallback` revisadas.
- [ ] Escritas SQLite são coalescidas e serializadas por chave.
- [ ] Flush de background preserva a última versão.
- [ ] Import/reset invalidam pendências antigas corretamente.
- [ ] Sync não possui concorrência nem listeners duplicados.

### Validação

- [ ] Profiler executado em Home, Faculdade, Biblioteca e Perfil.
- [ ] Cold/warm start medidos.
- [ ] Android real ou emulador representativo validado.
- [ ] iOS real ou simulador representativo validado.
- [ ] Teclado, safe area e orientação testados.
- [ ] Back Android e gesto iOS testados.
- [ ] Offline/online e retorno do background testados.
- [ ] Nenhuma regressão de acessibilidade e reduced motion.

---

## 15. Critérios finais de aceite

A entrega será considerada concluída somente quando todos os itens abaixo forem verdadeiros:

1. O pipeline completo executa em ambiente limpo.
2. Não há erros TypeScript.
3. O primeiro conteúdo útil aparece sem aguardar recursos oportunísticos.
4. A primeira interação não é bloqueada por questões, approaches, telas profundas ou preload global.
5. O carregamento de chunks segue política por rota/intenção.
6. O banco e os conteúdos grandes não são materializados desnecessariamente no provider.
7. Gráficos dithered não executam RAF invisíveis ou em background.
8. Persistência nativa mantém ordenação e último valor.
9. Sync de background possui uma única execução ativa e listeners estáveis.
10. A navegação mantém push/pop/tab/replace, scroll, gesture back e reduced motion.
11. O comportamento web e nativo é coberto por testes de integração.
12. O relatório final inclui métricas antes/depois e qualquer desvio dos orçamentos.
13. As flags temporárias foram removidas ou há justificativa formal para mantê-las.
14. O rollback foi exercitado em staging sem perda de dados.

---

## 16. Ordem recomendada de commits

Para facilitar revisão e rollback:

1. `chore: restore typecheck and reproducible toolchain`
2. `test: add performance and boot baseline instrumentation`
3. `perf: split critical deferred and opportunistic boot`
4. `perf: replace global screen preload with route-aware prefetch`
5. `perf: pause dither canvas loops outside viewport`
6. `perf: serialize sqlite writes per collection`
7. `perf: stabilize background sync lifecycle`
8. `perf: partition heavy catalog and question resources`
9. `perf: migrate profiled consumers to domain bundles`
10. `test: add mobile lifecycle and regression coverage`
11. `chore: remove temporary performance flags`

Cada commit deverá passar pelo subset relevante de testes e não deverá misturar correção funcional do wizard com otimização de runtime sem necessidade.

---

## 17. Decisão técnica final

A estratégia recomendada é **otimização progressiva orientada por medição**, não uma reescrita arquitetural. O maior retorno virá de quatro mudanças localizadas: separar prontidão crítica do boot, remover o preload global, pausar loops de canvas e restaurar o pipeline de tipos/build. A redução de catálogo e a migração de contextos devem ocorrer depois que a instrumentação demonstrar exatamente onde o custo permanece.

Essa ordem reduz risco porque primeiro cria observabilidade, depois altera o caminho de inicialização, em seguida reduz consumo contínuo e somente então mexe em persistência, conteúdo e propagação de estado. O resultado esperado é uma aplicação mais rápida ao abrir, mais econômica enquanto permanece aberta e mais confiável para evoluir.
