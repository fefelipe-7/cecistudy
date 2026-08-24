# Achados da rodada manual

## Rodada 1 — inicialização e onboarding

- O servidor Vite responde em `http://127.0.0.1:3000/` e a aplicação abriu corretamente no primeiro acesso.
- O host externo exposto pelo proxy retornou a mensagem do Vite: `Blocked request. This host (...) is not allowed. To allow this host, add ... to server.allowedHosts in vite.config.js.` Isso é uma limitação do modo de exposição/teste e também indica que o Vite não aceita hosts externos por padrão.
- O onboarding avançou corretamente pelos passos de nome, semestre, contexto, foto, escolha entre exemplos/zero e permissões.
- Foi possível preencher `Ana`, selecionar 6º semestre e 8 semestres totais, deixar universidade/objetivo/foto vazios e avançar sem bloqueio.
- Na etapa de permissões, os quatro switches aparecem na interface, mas estão `disabled=true`, `aria-checked=false` no web. O texto explica que a disponibilidade é apenas no app nativo, então o comportamento parece intencional; visualmente os controles podem ser confundidos com ações disponíveis.
- Ao concluir com “começar do zero”, a Home abriu com estado vazio e dados coerentes: 0 tarefas, 0 provas, 0 aulas e 0 tópicos.
- O app desbloqueou e exibiu imediatamente o toast `conquista desbloqueada: 🌷 cantinho organizado ♡` mesmo com o banco vazio. Isso pode ser intencional como conquista de onboarding, mas deve ser validado contra a expectativa de não celebrar conteúdo inexistente.
- A Home mostrou ações principais disponíveis: busca, “bora estudar?”, “bora focar?”, adicionar tarefa, abas inferiores e menu de atalhos.

## Rodada 2 — tarefa e progresso

A criação de tarefa funcionou pela Home: após informar `ler capítulo de psicologia social` e clicar em adicionar, o contador passou de 0 para 1, a tarefa apareceu no plano de ação e a Home passou a exibir um tópico prioritário. O checkbox também funcionou; ao concluir a tarefa, o contador voltou para 0 pendentes, o plano marcou `1 de 1 concluídas`, o dia atual entrou no streak e foram exibidos confetes e dois feedbacks de sucesso. Não houve erro visível nesse fluxo.

## Rodada 3 — wizard de tarefa/prova

O menu flutuante abriu e apresentou cinco atalhos: novo estágio, novo flashcard, nova prova/atividade, novo livro/leitura e nova aula/nota. O atalho “Nova prova / atividade” abriu uma tela de escolha entre tarefa e prova.

O fluxo de tarefa avançou por nome, categoria, prioridade, disciplina/prazo, agenda e confirmação. Mesmo sem nenhuma disciplina cadastrada, a etapa exibiu apenas `ainda não há disciplinas cadastradas`, sem oferecer um botão para criar uma disciplina naquele ponto; ainda assim foi possível continuar sem disciplina e sem prazo e salvar. A tarefa apareceu na Home com a categoria `revisao`, prioridade alta preservada e prazo preenchido automaticamente como `2026-08-19`, embora nenhum prazo tenha sido escolhido. Esse último comportamento é um possível bug funcional: a confirmação mostrou “sem prazo definido”, mas a Home exibiu a data do dia como prazo.

A integração com Google Agenda estava desligada por padrão e o fluxo permitiu guardar somente no app. Não houve erro de interface ou bloqueio ao concluir.

## Rodada 4 — Biblioteca e busca

A Biblioteca abriu com um catálogo extenso e conteúdo completo, mas carregou uma página muito longa, com milhares de pixels abaixo do viewport. A busca por `Freud` funcionou e exibiu o chip `filtros aplicados: "Freud"`, reduzindo as coleções visíveis. Ainda assim, a filtragem não removeu todos os cards cujo autor não era Freud dentro de coleções amplas; por exemplo, a seção psicanálise continuou mostrando Melanie Klein, Winnicott e Kohut porque a coleção inteira permaneceu visível. Isso pode ser esperado como filtragem por coleção, mas é uma possível inconsistência de expectativa: a busca parece filtrar seções, não necessariamente cada item exibido.

## Rodada 5 — cards da Biblioteca

Tentei clicar no card visível `A Interpretação dos Sonhos` durante a busca por Freud. O clique não abriu modal, detalhe, progresso ou ação perceptível. A inspeção do DOM encontrou elementos `DIV`/`P` com `cursor: pointer`, mas sem `role`, `tabindex` ou semântica de botão. Isso indica uma possível lacuna de interface: o card parece acionável visualmente, porém pode não responder ao clique nesse ponto da tela ou não oferecer acessibilidade por teclado. Artigos, por outro lado, aparecem como `button` com hint explícito.

## Rodada 6 — detalhe e salvamento de artigo

O botão de artigo abriu corretamente um modal com resumo, DOI, link externo, cópia de link, salvar/remover e voltar para a biblioteca. Ao clicar em `guardar artigo`, o hint mudou para `remover artigo dos salvos` e o localStorage passou a conter `cecistudy_savedBookIds=["art-46"]`. Esse fluxo funcionou; a diferença para os cards de livros é relevante, pois os artigos têm semântica de botão e os cards de livros não apresentaram ação perceptível no clique manual.

## Rodada 7 — notas avulsas

O estado vazio de notas mostrou a mensagem e indicou corretamente o menu `⋯` como caminho de criação. O menu abriu a ação `nova nota avulsa`; foi possível preencher título e conteúdo, salvar e retornar à lista. A nota apareceu com categoria `reflexão`, horário, conteúdo e ações de editar, transformar, copiar e excluir. Esse fluxo funcionou no teste manual.

## Rodada 8 — transformar nota em tarefa

A transformação abriu uma tela de seleção com opções de aula, tarefa, prova/avaliação, flashcard, sessão de estudo, estágio, conceito, autor e material. A seleção exigiu o evento real do botão; o clique visual por coordenada não respondeu, embora o DOM tivesse `button` com `data-manus_clickable`. Depois de escolher categoria `revisão`, prioridade `alta` e confirmar, o fluxo retornou para `/biblioteca/notas` com `0 notas salvas`. A nota original foi removida, o que sugere que a conversão ocorreu, mas o usuário não foi levado à tarefa nem recebeu uma confirmação visível no estado final. O próximo teste deve verificar se a tarefa realmente apareceu na Home/Estudos.

## Rodada 9 — resultado da transformação na Home

A tarefa transformada apareceu na Home com o título `observação sobre vínculo terapêutico`, portanto a conversão foi persistida. Contudo, a tela de confirmação da transformação mostrou `prazo: sem prazo`, enquanto a Home exibiu `prazo: 2026-08-19`. Isso reproduz na prática o problema de prazo padrão já suspeitado: uma tarefa criada/convertida sem prazo recebe a data atual, altera o contador de tarefas do dia e pode induzir a usuária a acreditar que possui uma obrigação hoje.

## Rodada 10 — concluir e desfazer tarefa

Marcar a tarefa transformada como concluída reduziu o contador de `2 tarefas pendentes` para `1` e aumentou o indicador do plano de ação de `1 de 3 concluídas` para `2 de 3`. Desmarcá-la reverteu ambos para os valores anteriores. O caminho reverso funcionou e o checkbox expôs hints coerentes de concluída/pendente.

## Rodada 11 — timer de foco

O acesso por `bora focar?` abriu `/estudos/foco`. Foi possível escolher 15 minutos, iniciar a sessão, observar a contagem de `15:00` para `14:50` e pausar. Ao pausar, a contagem ficou em `14:43` e o botão voltou para `iniciar`; o texto superior voltou a `pronto para começar`. O timer parece funcional, mas a nomenclatura pode confundir: depois de uma pausa, `iniciar` parece reiniciar uma sessão nova, não retomar a sessão existente. Ainda falta testar explicitamente se clicar novamente preserva 14:43 ou zera o relógio.

## Rodada 12 — retomar e reiniciar foco

Após pausar em `14:43`, clicar novamente em `iniciar` retomou a sessão em `14:43` e a contagem continuou. O botão circular de reinício zerou o timer imediatamente para `15:00`, encerrou o estado em andamento e não exibiu confirmação. Isso é um risco de UX: um toque acidental apaga a sessão atual sem aviso, embora ainda não houvesse minutos suficientes para testar o salvamento de histórico.

## Rodada 13 — criação e revisão de flashcard

Foi possível criar um flashcard em várias etapas: pergunta, resposta, relações opcionais e confirmação. Como não havia conceitos ou disciplinas, o formulário informou isso e permitiu salvar sem vínculo. Após salvar, o painel mostrou `1 cartão esperando por você`, abriu a revisão, revelou a resposta ao toque e ofereceu `errei`/`acertei`. Marcar `acertei` removeu o cartão da fila, mostrou `0 cartões esperando por você`, `revisão concluída` e `você revisou 1 cartão hoje`. O fluxo funcionou de ponta a ponta.

## Rodada 14 — bloqueio no quiz após resposta incorreta

O quiz de 5 questões abriu corretamente com filtro `Psicanálise e Psicodinâmica` e carregou uma questão de Freud. A primeira resposta correta (`BB)`) exibiu feedback de acerto e liberou `continuar`. Na segunda questão sobre Melanie Klein, cliquei deliberadamente na alternativa incorreta `AA)`. A interface não marcou a alternativa, não exibiu feedback de erro, não mostrou a resposta correta e não liberou `continuar`. Em seguida, acionei diretamente o botão correto `BB)` pelo DOM; mesmo assim, a tela permaneceu sem feedback e sem avanço. O usuário fica travado na questão e não consegue concluir o quiz depois de errar. Esse é um defeito funcional crítico no fluxo principal.

## Rodada 15 — histórico de foco

Depois de sair do quiz, abri `/estudos/historico`. A tela mostrou `0 dias · 0 sessões · 0 min` e informou que nenhuma sessão foi anotada. Isso é coerente com o teste anterior, pois o timer foi reiniciado antes de completar o ciclo; porém, a interface não oferece nenhum registro parcial nem aviso de que a sessão em andamento foi descartada. O caminho de saída é possível, mas o usuário pode perder silenciosamente o progresso de uma sessão interrompida.

## Rodada 16 — exportação de backup

A ação `exportar backup` gerou efetivamente um download chamado `cecistudy-backup.json`, originado de `http://127.0.0.1:3000`. O download apareceu no histórico do navegador e não apresentou erro. Ainda falta validar o conteúdo e fazer a importação em uma sessão limpa, pois o download sozinho não prova que todos os dados são restauráveis.

## Rodada 17 — importação de backup

Depois de tornar o input visível no ambiente de teste, enviei `cecistudy-backup.json`. A aplicação aceitou o arquivo e exibiu o toast `backup restaurado com carinho ♡`. A restauração aparenta ser funcional; a validação seguinte deve conferir Home, Biblioteca/Notas e Estudos para garantir que tarefas, notas, flashcards e artigos salvos retornam sem duplicação ou perda.

## Rodada 18 — validação pós-importação

A Home voltou a exibir exatamente as três tarefas do backup, sem duplicação: duas pendentes com prazo em `2026-08-19` e uma concluída sem prazo. A área de notas voltou a mostrar `0 notas salvas`, coerente com o fato de a nota original ter sido transformada em tarefa antes da exportação. O toast de restauração e esses estados indicam que o backup foi aplicado com consistência básica.

## Rodada 19 — disciplina, criação de matéria e diário de aulas

O wizard de nova matéria funcionou com apenas o nome preenchido: aceitou detalhes opcionais vazios, permitiu escolher cor/ícone, salvou `Psicopatologia II` e atualizou o contador para `1 disciplina`. A disciplina abriu com ações para anotar estudo, prova, leitura e aula. O registro de aula funcionou com tag, conteúdo e avaliação de quatro estrelas; o detalhe passou a mostrar `aulas & avaliações 1` e o cartão da aula.

Na aba `aulas & avaliações`, o cartão exibe o texto `ver anotação`, mas uma inspeção dos elementos `button`, `a` e `[role="button"]` não encontrou nenhum controle correspondente. Isso sugere uma ação visual sem affordance interativa: a usuária pode tentar abrir a anotação, mas não existe elemento semântico/navegável para fazê-lo. Também não apareceram controles visíveis de editar ou excluir a aula registrada.

## Rodada 20 — provas e avaliações

O cadastro de prova aceitou `Prova de Psicopatologia II`, data `10/09/2026`, disciplina, peso padrão `1,0`, nenhum tópico e integração com Google Agenda desligada. A confirmação exibiu todos esses dados; salvar atualizou `aulas & avaliações` para `2` e a prova apareceu na lista com checkbox. Marcar a prova como concluída mudou o hint para `pendente` e exibiu o ícone de conclusão.

Ao tentar avançar com o formulário vazio no primeiro passo, a tela permaneceu sem mensagem de erro visível. Isso pode deixar o usuário sem saber por que não avança, apesar de a validação estar bloqueando o fluxo. O cadastro preenchido, entretanto, funcionou.

## Rodada 21 — diário de estágio

O fluxo de novo registro de estágio funcionou de ponta a ponta. Foi possível escolher `atendimento clínico`, preencher resumo, sessão, idade, iniciais do paciente, data, tema, abordagem, intervenções, impressões, duração de `1` hora e reflexão. A tela final exibiu todos os dados antes do salvamento; depois, o perfil mostrou `1 horas anotadas`, o registro completo no diário e desbloqueou `primeiro dia de estágio`.

O campo de duração inicia com `4` horas por padrão, mas pôde ser alterado para `1`. Ao avançar com o resumo vazio, o fluxo não exibiu mensagem de validação visível, permanecendo na etapa inicial.

A ação `carregar exemplos` permanece um achado de usabilidade/robustez: o clique anterior ficou pendurado por 45 segundos e tornou o navegador indisponível, exigindo encerramento e reabertura da sessão. Como o servidor continuou respondendo normalmente, o comportamento é compatível com diálogo nativo de confirmação mal tratado pelo ambiente ou com bloqueio do fluxo de confirmação; na prática, a usuária pode ficar sem feedback e sem saber se os exemplos foram carregados.

## Rodada 22 — TCC e ações destrutivas de dados

O módulo de TCC funcionou com título, orientadora, área, pergunta de pesquisa, objetivo, referência ABNT e um capítulo com prazo `2026-10-01`. O TCC foi salvo, exibido na página principal e o capítulo pôde ser marcado como concluído, alterando o indicador de `0/1` para `1/1`.

Foi exportado um segundo backup, `cecistudy-backup (1).json`, contendo o estado completo da rodada. Em seguida, o botão `resetar cantinho` também ficou aguardando por 45 segundos e tornou o navegador indisponível, assim como havia acontecido com `carregar exemplos`. O servidor permaneceu saudável. Na prática, as duas ações de dados potencialmente destrutivas não oferecem um fluxo de confirmação/feedback que o navegador de teste consiga concluir; isso é um bloqueio importante para a usuária e também impede validar a conclusão do reset sem uma confirmação nativa acessível.

## Rodada 23 — monitoramento do backend/frontend

A inspeção da execução confirmou que o Cecistudy é essencialmente um frontend local/PWA nesta versão: o servidor Vite respondeu `HTTP 200`, não há referências a `fetch`, Axios, `/api`, GraphQL, WebSocket, Supabase ou Firebase no código de produto, e as operações de usuário observadas são persistidas no `localStorage`. A única chamada de rede identificada no código é `src/lib/ota.ts`, destinada ao manifesto de atualização OTA. Portanto, não há um backend de domínio para monitorar nesta rodada; os riscos de dados estão concentrados no estado local, hidratação, exportação/importação e sincronização entre telas.
