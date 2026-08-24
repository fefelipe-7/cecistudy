# Análise completa do Cecistudy: telas, componentes e plano de simplificação

**Escopo:** auditoria estática do código entregue em `cecistudy.zip`, complementada pelos testes manuais registrados no próprio projeto em `docs/manual-findings.md` e pela documentação arquitetural em `.context/architecture.md`.

> **Status de implementação (2026-08-22):** a **Fase 0** já estava coberta pela "Fase 21" do backlog (`docs/manual-findings.md`). As fases de layout foram implementadas com as decisões da usuária: navegação com **4 abas + Perfil via avatar**; **estágio → Faculdade** (`#/faculdade/estagio`) e **TCC → Estudos** (`#/estudos/tcc`); stickers ficam no Perfil; **Home virou "Hoje"** (atenção do dia, ações rápidas focar/revisar, ritmo compacto; `FormationPlanWidget` removido da Home — arquivo mantido para uso futuro); **Faculdade** com sub-tabs só `disciplinas`/`calendario` (+ card de estágio) e aulas/avaliações vivendo no detalhe da disciplina; **Estudos** reordenado (foco → revisar → leituras → quiz → TCC → seu ritmo), gráficos de ritmo movidos para o histórico; **Biblioteca** dividida em "meus materiais" (topo) e "explorar" colapsável; **Perfil** enxuto mantendo funil dithered e linha do tempo (decisão explícita); wizards **não** alterados. Gate: lint + testes (274) + build verdes. Backup pré-implementação: `cecistudy_backup_20260822/`.

**Objetivo:** identificar o que existe atualmente, o que está repetido ou prolixo, quais componentes devem ser mantidos, alterados, movidos, fundidos ou removidos, e definir uma sequência segura para tornar o app mais claro e eficiente.

> **Diagnóstico executivo:** o Cecistudy não está carente de funcionalidade; ele está com excesso de superfícies, caminhos paralelos e blocos de informação competindo entre si. A melhoria principal não é adicionar recursos, mas estabelecer uma hierarquia: **capturar → organizar → estudar → revisar → acompanhar**. Hoje esses verbos aparecem em várias telas ao mesmo tempo, muitas vezes com cards, atalhos e métricas que repetem a mesma promessa.

## 1. Diagnóstico geral

A base atual é um SPA React/TypeScript mobile-first, sem router tradicional, com uma pilha de navegação própria e estado global concentrado em `AppContext`. O produto possui cinco abas principais — Home, Faculdade, Estudos, Biblioteca e Perfil — além de telas auxiliares, wizards, modais, subabas e fluxos de quiz. A estrutura é tecnicamente capaz de sustentar um produto amplo, mas a experiência resultante se aproxima mais de um painel completo de módulos do que de um cantinho de estudo guiado.

A sensação de prolixidade tem quatro causas principais. Primeiro, a **Home funciona como resumo de quase tudo**, repetindo progresso, tarefas, leituras, foco, streak e sugestões que também aparecem em Estudos, Perfil e Faculdade. Segundo, **Perfil acumula funções de painel, configurações, estatísticas, estágio, TCC, stickers, backup e integrações**, tornando-se uma segunda central de produto. Terceiro, Biblioteca reúne catálogo, notas, templo, famílias, abordagens, testes, autores, conceitos, artigos e filtros numa única experiência longa. Quarto, há uma forte repetição formal: cards brancos arredondados, títulos de seção, Kitty, setas, barras de progresso, pills e CTAs de “ver tudo” ou “começar”.

| Dimensão | Situação atual | Impacto | Direção recomendada |
|---|---|---|---|
| Arquitetura de informação | Cinco abas mais muitas telas auxiliares e subabas | A usuária precisa lembrar onde cada coisa mora | Reduzir a navegação primária para três ou quatro destinos mentais |
| Home | Muitos widgets e atalhos para módulos diferentes | Perde o foco de “o que faço agora?” | Transformar em agenda do dia + uma ação principal |
| Estudos | Painel de foco, revisão, leituras, histórico e quiz | É a área mais coerente, mas ainda fragmentada | Manter como centro de execução e unificar seus subfluxos |
| Faculdade | Disciplinas, detalhes, aulas, provas, tarefas e leituras | Mistura cadastro, acompanhamento e captura | Manter o domínio, reduzir a quantidade de portas de entrada |
| Biblioteca | Catálogo muito extenso e várias coleções paralelas | Scroll longo e baixa previsibilidade | Separar “meus materiais” de “explorar catálogo” |
| Perfil | Métricas, jornada, estágio, TCC, conquistas, preferências e dados | É um segundo dashboard e um menu de configurações disfarçado | Enxugar para identidade, configurações e links de gestão |
| Feedback | Toasts, Kitty, confetes e modais em vários fluxos | Celebrações perdem valor e ações ficam pouco previsíveis | Reservar feedback forte para conclusões significativas |
| Integridade funcional | Há fluxos comprovadamente incompletos | Redesign sem correção pode maquiar falhas | Corrigir P0/P1 antes de reorganizar visualmente |

## 2. Inventário de navegação e modelo mental atual

A navegação é baseada numa pilha (`navigationStack`) sincronizada com hash. Isso permite deep-link, voltar nativo e retorno ao contexto de origem, o que é uma boa decisão técnica. Porém, essa flexibilidade também revela uma quantidade grande de estados possíveis: tab, disciplina, notas, templo, composição, detalhes, transformação, telas de estudo, quiz, streak, estágio, TCC, stickers, famílias e abordagens.

As cinco abas primárias são:

| Aba | Papel atual percebido | Conteúdo que invade a aba |
|---|---|---|
| **Home** | Resumo e próximos passos | Métricas de progresso, streak, tarefas, leituras, foco e sugestões |
| **Faculdade** | Organização acadêmica | Disciplinas, aulas, avaliações, tarefas, leituras, notas e ações de captura |
| **Estudos** | Execução do estudo | Foco, revisão, leituras, histórico, quiz e indicadores semanais |
| **Biblioteca** | Catálogo e acervo | Livros, artigos, notas, templo, conceitos, autores, abordagens e famílias |
| **Perfil** | Identidade e acompanhamento | Estatísticas, estágio, TCC, conquistas, lembretes, agenda, dados e preferências |

A recomendação é manter a pilha de navegação, porque ela resolve bem o contexto de origem, mas simplificar a **arquitetura mental** acima dela. Uma proposta forte é trabalhar com quatro destinos: **Hoje**, **Faculdade**, **Estudar** e **Biblioteca**. O Perfil pode deixar de ser uma aba principal e virar um menu acessado pelo avatar/header. Se a remoção da aba for considerada arriscada, ele deve ao menos perder o papel de dashboard.

## 3. Análise tela por tela

### 3.1 OnboardingScreen

O onboarding contém etapas de identidade, jornada acadêmica, contexto, foto, preferência inicial e permissões. A sequência tem uma lógica narrativa e é coerente com o tom acolhedor do app. Os campos opcionais podem permanecer opcionais, o que foi validado no teste manual.

| Componente/etapa | Decisão | Avaliação e alteração proposta |
|---|---|---|
| Identidade e nome | **Manter** | É uma personalização de alto valor e baixo esforço. Reduzir textos auxiliares para uma frase curta. |
| Jornada acadêmica | **Manter, simplificar** | Semestre atual e total são úteis, mas podem ser uma única etapa compacta. |
| Contexto universitário | **Manter como opcional** | Universidade e objetivo devem aparecer como “pular por agora”, sem dar sensação de formulário obrigatório. |
| Foto | **Mover para depois ou tornar opcional explícito** | Não deve bloquear a entrada nem receber tanto destaque quanto dados acadêmicos. |
| Escolha “exemplos” versus “zero” | **Manter, mas tornar consequência explícita** | A opção de exemplos deve explicar o que será criado e oferecer desfazer. O teste registrou travamento/ausência de feedback nessa ação. |
| Permissões | **Alterar fortemente** | No web, os quatro switches aparecem desabilitados. Isso parece controle quebrado. Exibir apenas um cartão informativo “permissões ficam disponíveis no app” ou esconder a etapa no web. |
| Celebração ao concluir | **Reduzir** | Não celebrar “cantinho organizado” como se houvesse conteúdo criado quando o banco está vazio. Usar uma mensagem de boas-vindas simples. |

**Conclusão:** manter a estrutura de onboarding, reduzir de seis para quatro momentos e remover a aparência de configuração técnica. O onboarding deve responder apenas: quem é a pessoa, em que contexto estuda e qual primeiro passo deseja executar.

### 3.2 HomeView

A Home é a principal fonte da sensação de repetição. O código contém saudação, resumo de tarefas, plano de ação, progresso da semana, tópico prioritário, leituras, foco, recomendações, atalhos e possivelmente sugestões locais. Ela tenta ser agenda, dashboard, central de captura e vitrine motivacional ao mesmo tempo.

| Componente atual | Decisão | Motivo e recomendação |
|---|---|---|
| Saudação/hero | **Manter, reduzir** | Deve ocupar pouco espaço e contextualizar o dia. Remover frases longas e ilustrações redundantes. |
| Resumo numérico de tarefas/provas/aulas/tópicos | **Fundir** | Transformar em uma única linha “hoje” com pendências relevantes. Aulas e tópicos não precisam competir com tarefas acionáveis. |
| “Plano de ação” | **Manter como bloco principal** | É o melhor candidato para o centro da Home. Exibir no máximo 3 próximos itens, com prioridade clara. |
| Tarefas listadas | **Manter, limitar** | Mostrar as tarefas do dia e um link “ver todas”. Não duplicar a lista completa da Faculdade. |
| Progresso de dias da semana | **Mover para Estudos ou Perfil** | O streak e dias ativos já têm tela própria. Na Home, usar apenas um indicador compacto, se necessário. |
| Tópico prioritário | **Fundir ao plano de ação** | Um tópico prioritário isolado é mais um card competindo pela atenção. Deve virar item do plano. |
| Leituras em andamento | **Manter como estado vazio contextual** | Exibir apenas quando houver leitura aberta; caso contrário, não ocupar espaço com um convite genérico. |
| Card de foco | **Manter como CTA principal condicional** | “bora focar?” deve ser a segunda ação, não outro dashboard de métricas. |
| Sugestões do sistema | **Mover para Biblioteca/Estudos** | Sugestões dummy e recomendações fazem mais sentido em explorar catálogo ou revisão. |
| FAB/menu de atalhos | **Manter, mas reduzir** | Cinco atalhos são muitos. Priorizar “capturar nota”, “tarefa” e “iniciar foco”; os demais entram em “mais”. |
| Kitty, confetes e frases | **Manter com orçamento de uso** | A personalidade é um ativo, mas precisa deixar de acompanhar cada card. Usar em onboarding, conclusão e estados vazios estratégicos. |

**Home proposta:** cabeçalho curto; bloco “o que precisa da sua atenção hoje”; até três itens acionáveis; botão de foco; resumo mínimo de progresso. O restante deve ser acessado em Estudos, Faculdade ou Biblioteca.

### 3.3 FaculdadeView

Faculdade é o domínio acadêmico e deve continuar existindo. O problema não é a presença das disciplinas, mas a sobreposição de ações: cadastrar matéria, abrir matéria, anotar estudo, registrar aula, criar prova, adicionar leitura e eventualmente acessar tarefas. A tela tende a misturar visão de lista com visão de detalhe.

| Componente | Decisão | Motivo e recomendação |
|---|---|---|
| Lista de disciplinas | **Manter** | É o núcleo da aba. Exibir nome, código, pendências e progresso de forma compacta. |
| Card de disciplina | **Manter, reestruturar** | O card deve ter uma ação primária “abrir” e uma ação contextual “adicionar”. Evitar várias setas e CTAs equivalentes. |
| Favoritar disciplina | **Manter se usado** | É útil para ordenar foco, mas não deve dominar visualmente o card. |
| Subaba de aulas e avaliações | **Fundir no detalhe da disciplina** | Na lista geral, essa subaba adiciona complexidade. Dentro da disciplina, pode existir filtro “tudo / aulas / avaliações”. |
| CourseDetailView | **Manter, simplificar** | Deve ser o espaço de acompanhamento daquela matéria. Cabeçalho, progresso, próximos itens, aulas recentes e avaliações. |
| ClassNoteListItem | **Manter e corrigir** | O componente é central, mas “ver anotação” aparece como texto visual sem controle semântico. Tornar o card inteiro ou botão real acionável; adicionar editar/excluir em menu contextual. |
| ClassNoteModal | **Fundir com detalhe lateral/modal acessível** | Evitar modal apenas para leitura se o item já possui tela de detalhe. Usar bottom sheet para ações rápidas ou navegação para detalhe completo. |
| EditCourseModal | **Manter, consolidar** | Cadastro e edição devem usar o mesmo formulário. Se houver criação dentro de wizard, abrir uma versão curta e retornar os dados ao fluxo. |
| Ações “nova aula”, “nova prova”, “novo estudo” | **Manter, unificar** | Um botão “adicionar registro” com seleção de tipo é mais simples que várias entradas espalhadas. |
| Indicadores de aulas/provas | **Manter, compactar** | Exibir como contadores no cabeçalho da disciplina, mas não repetir em cada seção. |

**Fluxo recomendado:** Faculdade → disciplina → visão consolidada da disciplina → adicionar registro. Ações de alta frequência podem permanecer no botão de adicionar, mas não em cinco pontos diferentes da interface.

### 3.4 EstudosView

Estudos é a área com melhor potencial de se tornar o centro operacional do produto. Hoje ela contém cinco portais/cards: foco, revisão, leituras, histórico e quiz, além de pills com minutos, cartões e leituras. O agrupamento é semanticamente correto, mas os cards podem parecer cinco produtos separados.

| Componente | Decisão | Motivo e recomendação |
|---|---|---|
| Título/hero “cantinho de estudos” | **Manter, reduzir** | Um cabeçalho simples basta. |
| StatPill de foco semanal | **Manter em resumo compacto** | É útil para continuidade, mas não precisa de card próprio. |
| StatPill de cartões hoje | **Manter como estado acionável** | Se houver cartões vencidos, deve levar diretamente à revisão. |
| StatPill de leituras abertas | **Manter condicionalmente** | Mostrar apenas quando existir pendência. |
| Portal de foco | **Manter como ação primária** | Timer é uma ferramenta de execução. Deve ficar no topo quando não há revisão urgente. |
| Portal de revisar | **Manter e priorizar** | Cartões vencidos são uma pendência concreta. Mostrar quantidade e CTA direto. |
| Portal de leituras | **Manter** | Pode ser uma fila curta de leituras em andamento, não uma segunda biblioteca. |
| Portal de histórico | **Fundir parcialmente** | Histórico é secundário; pode entrar num painel “seu ritmo” ou na tela de Perfil. |
| Portal de quiz | **Manter, mas separar de tarefas diárias** | Quiz é execução opcional. Deve ser uma ação de prática, não mais um indicador concorrente. |
| StudyFocusScreen | **Manter e corrigir semântica** | Trocar “iniciar” por “retomar” quando pausado e pedir confirmação antes de reiniciar. |
| StudyRevisarScreen | **Manter, simplificar feedback** | O fluxo funciona, mas reduzir ornamentação entre cards e usar uma progressão clara. |
| StudyLeiturasScreen | **Manter** | Leitura em andamento pertence a Estudos; catálogo pertence à Biblioteca. |
| StudyHistoricoScreen | **Mover ou fundir** | Histórico detalhado pode ser acessado pelo perfil/ritmo, reduzindo a navegação da aba. |

**Conclusão:** Estudos deve ficar com três ações mentais: **focar**, **revisar** e **praticar**. Leituras podem ficar como fila contextual. Histórico não precisa ser uma porta de primeiro nível.

### 3.5 QuizCategorySelector, QuizLoadingScreen, QuizPlayer e QuizResultScreen

O quiz tem um fluxo relativamente completo, mas quatro telas consecutivas para configurar, gerar, jogar e ver resultado podem parecer pesadas para uma atividade que deveria começar rapidamente.

| Tela/componente | Decisão | Avaliação |
|---|---|---|
| QuizCategorySelector | **Manter, enxugar** | Filtros são úteis, mas agrupar em “tema”, “origem” e “quantidade” com defaults inteligentes. Evitar seções expansíveis demais. |
| QuizLoadingScreen | **Manter como estado, não como tela conceitual** | Pode ser uma transição curta dentro do fluxo; permitir cancelar e informar o que está sendo preparado. |
| QuizPlayer | **Manter e corrigir P0** | Teste manual comprovou bloqueio após resposta incorreta. O feedback de erro precisa marcar a opção, mostrar resposta correta e liberar avanço. |
| QuizExplanationOverlay | **Manter sob demanda** | Explicação deve abrir após resposta ou por botão “entender”, sem ocupar o fluxo inteiro. |
| QuizResultScreen | **Manter, reduzir** | Priorizar nota, acertos/erros, tempo e próximo passo. Reduzir a quantidade de cards estatísticos. |

**Fluxo recomendado:** tocar em “praticar” abre um sheet curto com tema e quantidade; a geração ocorre com loading discreto; o player ocupa a tela; o resultado oferece “revisar erros”, “refazer” e “voltar a estudar”.

### 3.6 BibliotecaView

A Biblioteca é a maior concentração de conteúdo e a tela mais claramente prolixa. O arquivo possui aproximadamente 949 linhas e renderiza múltiplas coleções, blocos mistos, artigos, filtros, detalhes de livros e detalhes de artigos. O teste manual confirmou que o catálogo é muito longo e que a busca pode parecer inconsistente porque filtra seções/coleções sem necessariamente remover todos os cards incompatíveis.

| Componente/seção | Decisão | Motivo e recomendação |
|---|---|---|
| Cabeçalho e busca | **Manter** | É a entrada correta, mas deve declarar se busca item, coleção ou ambos. |
| Filtro modal | **Manter, simplificar** | Consolidar filtros em tipo, status e tema. Mostrar quantidade de resultados. |
| Livros em andamento/salvos | **Mover para o topo** | “Meu acervo” e “continuar lendo” são mais importantes que o catálogo inteiro. |
| InlineCollectionBlock | **Manter como primitiva** | Reutilização é boa, mas limitar quantidade exibida e oferecer “ver coleção”. |
| MixedCollectionBlock | **Reavaliar/fundir** | Misturar tipos de conteúdo em uma estante pode confundir a expectativa do clique. Usar apenas quando o rótulo indicar claramente “misturado”. |
| Coleção Psicoterapias | **Manter como exploração** | Deve ser acessada via categoria, não necessariamente expandida toda na tela inicial. |
| Mistas | **Mover para exploração** | É uma coleção secundária. Não precisa estar entre as primeiras seções. |
| Testes, autores, conceitos, abordagens, multidisciplinar | **Fundir em “explorar por”** | São diferentes modos de indexação, não destinos que precisam aparecer como oito blocos verticais. Usar tabs internas ou filtros. |
| Artigos | **Manter separada visualmente** | Artigos têm comportamento diferente de livros e já possuem modal funcional. |
| ArticleCard | **Manter** | O teste mostrou que artigos têm semântica de botão e ação perceptível. |
| Cards de livros | **Corrigir e manter** | O clique não apresentou ação perceptível e os elementos parecem divs/p com cursor. Tornar botão/link acessível e consistente com artigos. |
| BookDetailModal | **Manter, revisar arquitetura** | Preservar detalhe, salvamento e progresso. Considerar sheet de detalhe no mobile. |
| ArticleDetailModal | **Manter** | Funcional e útil. Uniformizar com o detalhe de livros. |
| NotesScreen | **Manter como área separada** | Notas são conteúdo produzido pela usuária, não parte do catálogo. |
| TempleScreen | **Mover para exploração avançada** | “Templo” pode ser uma experiência temática, mas não deve competir com o acervo pessoal. |
| FamiliesView/FamilyDetailView/ApproachDetailView | **Manter como navegação secundária** | São bons detalhes de catálogo, mas devem ser acessados por exploração/filtros. |

**Biblioteca proposta:** primeiro “meus materiais” — salvos, em andamento, notas; depois “explorar” — catálogo por busca, tema e índice. O catálogo não deve renderizar todas as prateleiras de uma vez. Cada coleção deve mostrar três a seis itens e um caminho para abrir a coleção completa.

### 3.7 NotesScreen, NoteDetailWizard e NoteTransformWizard

As notas avulsas têm um fluxo funcional, mas a transformação em outros tipos cria uma explosão de complexidade. O `NoteTransformWizard` contém opções para aula, tarefa, prova, flashcard, sessão, estágio, conceito, autor e material; isso transforma uma ação simples em uma central de cadastro.

| Componente | Decisão | Recomendação |
|---|---|---|
| Lista de notas | **Manter** | Deve ser simples, com busca opcional, data, tipo e ações essenciais. |
| Estado vazio | **Manter** | A mensagem é útil, mas CTA deve ser direto e não depender apenas do menu de reticências. |
| NoteDetailWizard | **Manter, reduzir passos** | Usar campos progressivos: título/conteúdo primeiro, metadados depois. |
| NoteTransformWizard | **Dividir em dois níveis** | Primeiro oferecer as três conversões mais comuns: tarefa, flashcard e aula. “Mais tipos” abre opções avançadas. |
| ReviewCard | **Manter** | A confirmação antes de converter é boa, desde que mostre claramente o resultado e destino. |
| Pós-transformação | **Alterar obrigatoriamente** | Exibir sucesso e botão “abrir tarefa/cartão/aula”. O teste mostrou retorno à lista sem confirmação contextual. |
| Exclusão da nota original | **Manter com explicação** | Informar que a nota será convertida e removida ou preservada, deixando a escolha explícita. |

### 3.8 ComposeNoteView e ClassNoteDetailWizard

A captura rápida é um diferencial do produto. O contexto documenta que a última escolha do quick capture é persistida e que a aula salva pode abrir um wizard de detalhes em cinco passos. O risco é transformar “anotar uma aula” em um processo longo demais.

| Componente | Decisão | Avaliação |
|---|---|---|
| ComposeNoteView | **Manter como captura rápida** | Deve permitir salvar título e conteúdo em poucos segundos. Evitar exigir classificação antes de salvar. |
| Preferência do último modo | **Manter, com controle visível** | O app pode lembrar aula/nota, mas deve deixar evidente o tipo selecionado. |
| DetailPromptModal | **Alterar** | O prompt após salvar deve ser opcional e discreto; “fazer depois” precisa encerrar sem duplicar toast/celebração. |
| ClassNoteDetailWizard | **Manter, reduzir de 5 para 3 etapas** | Identificação, conteúdo e enriquecimento. Referências e avaliação podem ser opcionais na mesma etapa. |
| Formulários de campos opcionais | **Manter, mas progressivos** | Esconder campos avançados atrás de “adicionar detalhes”. |

### 3.9 PerfilView

Perfil é o maior problema de escopo depois da Biblioteca. O arquivo tem aproximadamente 891 linhas e contém identidade, foto, métricas, gráficos, estatísticas de estudo, estágio, TCC, stickers, lembretes, Google Agenda, edição de perfil, OTA, exportação/importação, exemplos e reset. São pelo menos quatro produtos misturados: perfil, progresso, configurações e administração de dados.

| Bloco | Decisão | Destino recomendado |
|---|---|---|
| Foto, nome e semestre | **Manter** | Cabeçalho do perfil/conta. |
| Métricas de estudo | **Mover parcialmente** | Resumo curto em Perfil; detalhes em Estudos/Historico. Evitar repetir Home. |
| DitherGrowthChart | **Manter somente em detalhe** | Bom para análise de evolução, excessivo no primeiro nível. |
| DitherFunnelChart | **Mover ou remover** | Se não gerar uma decisão, é visualização decorativa. Manter apenas se explicar progresso útil. |
| StudyStatsWidget | **Fundir** | Não manter um widget de estatísticas separado se Perfil já mostra métricas. Criar uma única seção “seu ritmo”. |
| Estágio/InternshipDiaryView | **Manter como módulo acadêmico** | Pode ser um card de atalho no Perfil, mas o detalhe deve continuar em tela própria. |
| InternshipLogCard | **Manter, compactar** | Exibir último registro e total; não listar muitos registros no Perfil. |
| TCC/TccView | **Manter como projeto** | Card resumido com progresso e detalhe próprio. |
| StickersView | **Mover para conquistas** | Manter a gamificação, mas como seção secundária acessível pelo avatar ou progresso. |
| Lembrete diário | **Manter em Configurações** | Não misturar com métricas e jornada. |
| Google Agenda | **Manter somente se integração estiver madura** | Caso ainda seja opcional/desabilitada, exibir estado de plataforma sem parecer erro. |
| Formulário de perfil | **Manter em editar perfil** | Não renderizar como seção longa inline no mesmo scroll do dashboard. |
| OTA update | **Manter técnico, esconder por padrão** | A atualização do app é importante, mas deve ficar no final de Configurações. |
| Backup, exemplos e reset | **Manter, agrupar em Dados** | Usar um único bloco “dados do cantinho”, com confirmação acessível e feedback claro. |
| Kitty e frase final | **Reduzir** | Uma frase de encerramento basta; não repetir depois de cada seção. |

**Recomendação estrutural:** Perfil deve deixar de ser uma aba de navegação primária e passar a ser uma tela de conta/configurações com três seções: **identidade**, **preferências** e **dados**. O progresso detalhado deve viver em Estudos/Historico; estágio e TCC podem continuar como módulos acessíveis por cards.

### 3.10 StreakView

A tela de streak possui hero, recorde, dias ativos, semana atual, últimas semanas e explicação da streak. Ela é coerente como detalhe motivacional, mas parte de seus números já aparece na Home e no Perfil.

**Decisão:** manter como tela de detalhe, mas reduzir a exposição nas abas. Na Home, exibir apenas “sequência atual: X dias” quando for relevante. No Perfil, não repetir o mesmo número em um card completo. A explicação deve ser um disclosure curto, não outro bloco longo.

### 3.11 InternshipDiaryView e SupervisionView

O estágio é uma funcionalidade rica e diferenciada. O diário contém ciclo de formação, caderno de supervisão, registros e gráficos. O fluxo manual funcionou, mas a validação vazia não comunica o erro e a duração inicia com quatro horas, um valor que pode induzir preenchimento incorreto.

| Componente | Decisão | Recomendação |
|---|---|---|
| Resumo de horas/supervisões | **Manter no detalhe** | É útil para acompanhamento, não precisa ser repetido no Perfil. |
| InternshipPhase | **Manter, simplificar** | Exibir a fase atual e próximo marco; evitar muitos textos explicativos. |
| InternshipLogCard | **Manter** | Card de registro é necessário, com edição e exclusão acessíveis. |
| SupervisionView | **Manter como fluxo especializado** | Formulário deve ter validação inline e campos opcionais claramente marcados. |
| Gráficos | **Manter sob demanda** | Uma visualização principal; demais métricas em detalhes. |
| Kitty/celebração | **Reduzir** | Reservar para primeiro registro ou marcos reais. |

### 3.12 TccView e EditTccModal

O módulo de TCC é funcional, com metadados, problema, objetivos, referências, capítulos e progresso. A tela cumpre bem o papel de projeto. O risco é o Perfil repetir seu conteúdo.

**Decisão:** manter o módulo e seu editor. No Perfil, exibir apenas título, orientador/área e progresso. No detalhe, manter capítulos, conclusão e edição. O formulário deve usar o mesmo componente para criação e edição, evitando duplicação de lógica e layout.

### 3.13 StickersView

Stickers e conquistas funcionam como camada de personalidade e recompensa. O componente é simples e não precisa ser removido, mas está fora do caminho essencial do estudo.

**Decisão:** manter como recurso secundário; mover o acesso para “conquistas” dentro de Perfil/Progresso. Exibir na tela principal apenas uma conquista recente ou próximo marco, sem grade completa.

## 4. Componentes transversais e repetição visual

A repetição não está apenas nas telas; ela também aparece nos componentes transversais.

| Padrão | Evidência no código | Decisão |
|---|---|---|
| Cards `bg-white` | Uso muito frequente em componentes | **Manter o token, reduzir quantidade de cards**. Nem toda seção precisa de uma caixa própria. |
| `rounded-[24px]` | Repetido dezenas de vezes | **Manter como linguagem**, mas alternar com superfícies sem borda para criar hierarquia. |
| Títulos de seção grandes | Repetidos em Home, Perfil, Biblioteca e Estudos | **Padronizar níveis**: H1 de tela, H2 de bloco, label de card. |
| Kitty | Muitos usos em estados e headers | **Criar orçamento de personalidade**. Não usar em todos os estados vazios e confirmações. |
| `ChevronRight` | Muitas chamadas de “abrir/ver mais” | **Remover setas redundantes** quando o card inteiro for clicável. |
| ProgressBar | Usada em perfil, TCC, leituras e cursos | **Manter**, mas nomear o contexto e evitar mostrar percentuais sem decisão associada. |
| Modal/overlay | Padrão repetido | **Consolidar primitiva Modal/BottomSheet**, foco, ESC, retorno e confirmação acessível. |
| Pills de subtab | Usadas para vários domínios | **Manter em contextos locais**, mas evitar uma fileira de pills longa e horizontal em toda tela. |
| Toast + confete + Kitty | Feedbacks acumulados | **Escolher um feedback primário por evento**. Confete apenas em marcos; toast para confirmação operacional. |
| Menus de ação | Header, cards, FAB e Perfil | **Padronizar** menu contextual com verbos claros: editar, duplicar, excluir, abrir. |

A linguagem visual deve continuar acolhedora, mas com mais áreas de respiro. Hoje o uso repetido de cards torna todas as informações igualmente importantes. A simplificação visual deve usar três níveis: superfície principal sem contêiner, card de ação e modal/detalhe. Se tudo for card, nada parece prioritário.

## 5. Duplicidades funcionais prioritárias

| Duplicidade | Onde aparece | Problema | Ação |
|---|---|---|---|
| Progresso geral | Home, Perfil, Streak e Estudos | Quatro lugares respondem parcialmente à mesma pergunta | Definir “ritmo” como fonte principal; Home mostra só o essencial |
| Tarefas | Home, Faculdade e Estudos/Histórico | A usuária pode não saber onde gerenciar | Gestão na Faculdade/Hoje; execução no Hoje |
| Leituras | Home, Estudos e Biblioteca | Mistura pendência com catálogo | Em andamento em Estudos; catálogo em Biblioteca |
| Aulas/notas | Faculdade, quick capture, Biblioteca/Notas | Captura e consulta parecem caminhos diferentes | Captura rápida única; consulta por contexto de disciplina ou notas |
| Foco | Home, Estudos e histórico do Perfil | CTA e estatísticas repetidos | Iniciar em Hoje/Estudos; histórico em Estudos |
| Streak | Home, Perfil e tela dedicada | Incentivo perde impacto | Resumo na Home; detalhe apenas na tela dedicada |
| Criar registro | FAB, header de disciplina, Biblioteca e wizards | Muitas portas para o mesmo resultado | “Adicionar” contextual, com tipo sugerido pelo contexto |
| Configurações | Perfil inline e modais de dados | Mistura preferências com administração | Tela de Configurações separada |
| Catálogo | Todas as prateleiras na Biblioteca | Scroll longo e baixa descoberta | Exploração paginada/colapsada por categorias |

## 6. Plano de alteração recomendado

### Fase 0 — corrigir confiabilidade antes de redesenhar

Esta fase é obrigatória. O teste manual registrou bloqueio crítico no quiz após resposta incorreta; prazo sem data aparecendo como data atual; cards de livros e ações de aula visualmente clicáveis sem semântica funcional; validações sem mensagem; confirmação nativa problemática em carregar exemplos e reset; transformação de nota sem confirmação contextual; e reinício de timer sem confirmação.

| Prioridade | Entrega | Critério de aceite |
|---|---|---|
| P0 | Corrigir resposta incorreta no quiz | Qualquer alternativa marca estado, mostra feedback e permite avançar |
| P1 | Corrigir semântica de prazo ausente | Sem prazo permanece `null/undefined` em Home, filtros, backup e importação |
| P1 | Corrigir cards de livro e aula | Clique, teclado e leitor de tela abrem o mesmo detalhe |
| P1 | Trocar confirmações nativas por modal acessível | Cancelar/confirmar funcionam sem travar e retornam feedback |
| P1 | Validar formulários inline | Campo ausente mostra mensagem próxima e recebe foco |
| P2 | Tornar transformação de nota observável | Após converter, oferecer abrir o item criado |
| P2 | Confirmar reinício do timer | Sessão em andamento não é descartada por toque acidental |
| P2 | Permitir criar disciplina dentro do wizard | Usuária não precisa abandonar o fluxo para criar vínculo |

### Fase 1 — reduzir repetição de conteúdo

O objetivo é mudar a distribuição, não ainda redesenhar tudo. Remover da Home os blocos que já têm casa própria, mover histórico detalhado para Estudos, transformar Perfil em conta/progresso resumido e reorganizar Biblioteca entre acervo pessoal e exploração.

### Fase 2 — reduzir caminhos de criação

Criar um componente de “Adicionar registro” contextual. Na Home ele sugere tarefa/nota/foco; dentro de uma disciplina sugere aula/prova/estudo; na Biblioteca sugere nota/material. O mesmo componente deve alimentar os wizards existentes, não criar novos formulários paralelos.

### Fase 3 — consolidar componentes e estados vazios

Criar ou padronizar `ScreenHeader`, `SectionHeader`, `ActionCard`, `EmptyState`, `ProgressSummary`, `ActionMenu` e `ConfirmModal`. A meta não é abstrair por abstrair; é garantir que títulos, espaçamentos, CTAs, feedbacks e acessibilidade não sejam reimplementados em dezenas de arquivos.

### Fase 4 — reorganizar a navegação primária

Testar uma versão com quatro destinos: Hoje, Faculdade, Estudos e Biblioteca. Perfil deve ser acessado pelo avatar e conter conta/configurações. Se a métrica de uso mostrar que Estudos e Faculdade são excessivamente próximos, testar uma fusão parcial entre “Faculdade” e “Hoje”, sem remover o detalhe por disciplina.

### Fase 5 — refinamento visual e validação

Somente depois das fases anteriores, revisar cores, ilustrações, animações, cards e densidade. A estética atual não precisa ser substituída; precisa receber uma hierarquia melhor. Validar em viewport mobile e desktop, com teclado, leitor de tela e dados vazios/preenchidos.

## 7. Arquitetura de informação futura

A arquitetura recomendada é:

```text
Hoje
├── próximos 3 itens
├── iniciar foco
├── revisão pendente, se houver
└── resumo curto de ritmo

Faculdade
├── disciplinas
├── disciplina/:id
│   ├── visão geral
│   ├── próximos itens
│   ├── aulas
│   └── avaliações
└── adicionar registro contextual

Estudos
├── foco
├── revisar
├── leituras em andamento
├── praticar quiz
└── histórico/ritmo

Biblioteca
├── meus materiais
│   ├── salvos
│   ├── em andamento
│   └── notas
└── explorar
    ├── busca
    ├── filtros
    ├── temas
    ├── autores/conceitos/abordagens
    └── coleções

Avatar / Perfil
├── identidade
├── progresso detalhado
├── conquistas
├── preferências
└── dados e atualização
```

A regra de ouro é que cada objeto tenha uma casa principal. **Tarefa** pertence a Hoje/Faculdade; **execução da tarefa** acontece em Hoje. **Leitura em andamento** pertence a Estudos; **livro de catálogo** pertence à Biblioteca. **Progresso detalhado** pertence a Estudos/Perfil; Home mostra apenas o que ajuda a decidir a próxima ação.

## 8. Critérios de sucesso do redesign

O redesign deve ser avaliado por comportamento, não apenas por aparência.

| Objetivo | Métrica/critério |
|---|---|
| Encontrar o próximo passo | Usuária identifica a ação principal da Home em até 5 segundos |
| Reduzir repetição | Nenhuma informação principal aparece em mais de dois destinos sem motivo explícito |
| Simplificar criação | Tarefa, nota e foco começam em até dois toques a partir de Hoje |
| Simplificar disciplina | Usuária abre uma matéria e entende pendências sem navegar por múltiplas subabas |
| Simplificar Biblioteca | Primeiro viewport mostra acervo pessoal antes do catálogo extenso |
| Melhorar acessibilidade | Todo elemento visualmente acionável é `button`, `a` ou equivalente semântico |
| Melhorar confiabilidade | Quiz, prazo, validações, confirmação, timer e transformação passam testes E2E |
| Preservar personalidade | Kitty/celebrações aparecem em momentos relevantes, não em todos os cards |
| Reduzir carga cognitiva | Cada tela tem uma ação primária e no máximo duas ações secundárias visíveis |

## 9. Ordem prática de implementação

A ordem recomendada é: corrigir quiz e prazos; substituir confirmações e validar formulários; corrigir affordances de livros/aulas e transformação; refazer a Home como “Hoje”; dividir Perfil em Progresso e Configurações; reorganizar Biblioteca em “meus materiais” e “explorar”; consolidar adição contextual; reduzir subabas de Estudos; reduzir passos dos wizards; por fim, consolidar primitives e refinar o visual.

Não recomendo começar removendo funcionalidades. O risco é interpretar excesso visual como excesso de produto. Primeiro deve-se **manter a capacidade dos módulos**, mas retirar sua exposição simultânea. Estágio, TCC, stickers, quiz, catálogo e notas podem continuar existindo; eles não precisam aparecer todos com o mesmo peso no primeiro nível.

## 10. Observação técnica sobre a auditoria

A análise foi feita sobre o código-fonte e a documentação incluída no ZIP. O build e os testes não puderam ser concluídos neste ambiente porque o `node_modules` entregue no ZIP está com permissões restauradas incorretamente e sem o pacote opcional nativo `@rollup/rollup-linux-x64-gnu`; após corrigir permissões, Vite/Vitest ainda falharam nessa dependência ausente. Isso não invalida a análise de produto, mas recomenda reinstalar dependências com `npm ci` em uma cópia limpa antes da próxima rodada de validação.

Os achados funcionais utilizados no diagnóstico estão documentados em `docs/manual-findings.md`, especialmente: bloqueio do quiz após erro, prazo sem data sendo preenchido com a data atual, cards de livros sem ação perceptível, transformação de nota sem confirmação final, ações de aula sem controles reais, validação silenciosa, timer sem confirmação de reinício e confirmações nativas problemáticas.

## Conclusão

O Cecistudy tem uma base rica e uma identidade própria. O caminho para ficar melhor não é torná-lo mais completo, e sim mais decidido. A usuária deve abrir o app e entender imediatamente o que fazer agora; entrar em Faculdade para organizar o contexto acadêmico; entrar em Estudos para executar; entrar em Biblioteca para consultar e descobrir; e abrir Perfil apenas para acompanhar, configurar ou administrar dados.

A alteração mais importante é transformar a Home em **Hoje**, retirar do Perfil o papel de segundo dashboard, separar acervo pessoal de catálogo e reduzir a quantidade de portas de entrada para criação. Em paralelo, os fluxos com falhas de confiança precisam ser corrigidos. Com essa combinação — correção funcional primeiro, depois hierarquia e só então refinamento visual — o app tende a ficar substancialmente menos repetitivo sem perder sua personalidade nem seus recursos diferenciados.
