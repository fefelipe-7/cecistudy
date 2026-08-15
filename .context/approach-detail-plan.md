# Plano de Implementação: Telas Detalhadas de Abordagens

Este documento descreve as etapas necessárias para implementar telas individuais para cada abordagem psicológica na biblioteca, conforme especificado nas discussões.

## Visão Geral

O objetivo é transformar a apresentação atual de abordagens na BibliotecaView (que apenas exibe cards com livros relacionados) em uma experiência de leitura detalhada, onde cada abordagem possui sua própria página com estrutura rica, semelhante a um mini-capítulo.

## Etapas de Implementação

### 1. Extensão do Modelo de Dados
- **Arquivo**: `src/types.ts`
- **Ação**: Estender a interface `PsychologyApproach` com campos adicionais para suportar toda a estrutura solicitada:
  - Campos de identificação: `family`, `historicalPeriod`, `tags`, `summary`
  - Conteúdo detalhado: `definition`, `centralIdea`, `humanUnderstanding`, `sufferingUnderstanding`, `changeMechanism`, `practicePresentation`, `therapistObservation`
  - Seção acadêmica: `academicView` com subcampos para posição histórica, estado atual, evidências, debates e limitações
  - Livros fundamentais: array de objetos com título, autor, ano, importância, conteúdo, ideias centrais e motivo para ler
  - Críticas e controvérsias: string livre
  - Aplicações: descrição de onde a abordagem é utilizada
  - Relações com outras abordagens: estruturas para similaridades, influências e contrastes
  - Manter campos existentes para compatibilidade: `conceptIds`, `techniqueIds`, `authorIds`

### 2. Criação da Tela de Detalhe da Abordagem
- **Arquivo**: `src/components/views/ApproachDetailView.tsx`
- **Ação**: Criar novo componente que recebe uma abordagem e exibe todas as seções conforme especificado:
  - Cabeçalho com nome, família, período, autores, tags e frase-resumo
  - Seções sequenciais para: "o que é?", "ideia central" (destaque visual), "como entende a pessoa?", "como entende o sofrimento?", "como acontece a mudança?", "como se apresenta na prática?", "o que o terapeuta procura observar?"
  - Cards clicáveis para conceitos centrais, autores fundamentais e técnicas principais
  - Seção de visão acadêmica com subseções
  - Cards para livros fundamentais com destaque para o primeiro ("Comece por") e outros ("Aprofunde por")
  - Seções para críticas e controvérsias, aplicações e contextos
  - Seção de relações com outras abordagens (similares, influências, contrastes)
  - Seção de comparações com outras abordagens (cards clicáveis)
  - Botão FAB para criação rápida de conteúdo relacionado
  - Modais para visualização detalhada de conceitos, autores, técnicas e livros (implementação simplificada inicial)

### 3. Atualização do Sistema de Roteamento
- **Arquivo**: `src/lib/routing.ts`
- **Ações**:
  - Adicionar `{ kind: 'approach'; approachId: string }` ao tipo `NavScreen`
  - Atualizar `parseRoute` para reconhecer rotas no formato `#/biblioteca/abordagens/:approachId`
  - Atualizar `routeToStack` para criar pilha adequada para telas de abordagem (base: biblioteca → approach)
  - Atualizar `stackToHash` para gerar hash apropriado para telas de abordagem

### 4. Modificação da BibliotecaView
- **Arquivo**: `src/components/views/BibliotecaView.tsx`
- **Ação**: Alterar o comportamento dos cards de abordagem na seção "ABORDAGENS & CORRENTES DA PSICOLOGIA":
  - Em vez de abrir o modal de detalhe do livro ao clicar, navegar para a rota da abordagem detalhada
  - Utilizar o `id` da coleção como `approachId` na navegação (assumindo que cada coleção de abordagem representa uma abordagem)
  - Implementar via `window.location.hash = \`#/biblioteca/abordagens/${col.id}\` no handler `onSelectBook`

### 5. Criação de Componentes de Card Reutilizáveis
- **Arquivos**: `src/components/ui/`
  - `ApproachDetailConceptCard.tsx`: card para conceitos com efeito de clique
  - `ApproachDetailAuthorCard.tsx`: card para autores
  - `ApproachDetailVerbCard.tsx`: card para técnicas/verbos
  - `ApproachDetailBookCard.tsx`: card para livros fundamentais (com variante destacada)
  - `ApproachDetailComparisonCard.tsx`: card para comparações com outras abordagens (similares/constrastes)

### 6. Estratégia de População de Dados
- **Opção Recomendada**: Processar arquivos markdown existentes em `library/cecistudy_base_psicoterapias/entregas/` em tempo de construção
  - Criar script para extrair dados estruturados dos arquivos `.md`
  - Gerar arquivo TypeScript com dados das abordagens
  - Importar esses dados em `src/data/initialData.ts` ou criar novo seed
- **Alternativa**: Enriquecer gradualmente os objetos `PsychologyApproach` em `initialData.ts` com os novos campos

### 7. Considerações de Implementação
- **Responsividade**: Todos os componentes devem seguir o design system existente (tokens semânticos, espaçamento, tipografia)
- **Performance**: Implementar carregamento preguiçoso para seções extensivas (livros, comparações) se necessário
- **Estado de Leitura**: Integrar com sistema de streaks existente para marcar abordagens como "lidas"
- **Navegação**: Garantir que o botão voltar funcione corretamente através do sistema de pilha nativa
- **Acessibilidade**: Adicionar `aria-label` apropriado em elementos interativos
- **Copy Voice**: Todo o texto deve seguir as convenções de minúsculo e tom afetuoso do copy-and-voice.md

## Próximos Passos Imediatos

1. Estender a interface `PsychologyApproach` em `src/types.ts`
2. Criar o componente `ApproachDetailView.tsx` com estrutura básica
3. Atualizar o sistema de roteamento em `src/lib/routing.ts`
4. Modificar `BibliotecaView.tsx` para tornar os cards de abordagem navegáveis
5. Criar os componentes de card reutilizáveis na pasta `ui/`
6. Planejar a estratégia de população de dados dos arquivos markdown existentes

## Dependências

- Nenhuma nova dependência externa necessária
- Utiliza componentes existentes: `BookOpen`, `Sparkles`, `UserCheck`, etc. do `lucide-react`
- Aproveita o sistema de navegação baseado em pilha já implementado
- Usa o contexto `AppContext` para acesso a funções de navegação e estado

## Testes

Após a implementação, devem ser realizados:
- Testes de unidade para os novos componentes de card
- Testes de integração para verificar a navegação entre BibliotecaView e ApproachDetailView
- Testes de roteamento para garantir que as URLs são corretamente parseadas e geradas
- Testes manuais para verificar a renderização correta de todo o conteúdo estruturado