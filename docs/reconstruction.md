# Cecistudy para os semestres finais de Psicologia

## Direção recomendada

O Cecistudy já tem uma base ampla: organização de faculdade, tarefas, provas, estudo ativo, leituras, notas, estágio, TCC, foco, flashcards, quiz, histórico e backup. A próxima etapa não deve ser adicionar mais um conjunto de ferramentas isoladas. Ela deve transformar esse conjunto em um **sistema de formação em Psicologia**: um lugar que ajuda a aluna a ligar o que estuda, o que observa no estágio, o que leva à supervisão e o que entrega no TCC.

> A proposta de valor deixa de ser “um planner para Psicologia” e passa a ser “o caderno acadêmico e de formação que acompanha a estudante até o início da prática profissional”.

Para uma aluna do 8º ao 10º semestre, a principal dor não é falta de conteúdo. É a fragmentação entre disciplinas, campo, supervisão, relatórios, leituras, TCC e prazos. O Cecistudy deve reduzir essa fragmentação sem tentar virar prontuário, sistema de clínica ou plataforma de diagnóstico.

| Espaço atual | Valor já existente | Evolução recomendada |
|---|---|---|
| Faculdade | Disciplinas, aulas, provas e tarefas | Planejamento semanal por carga acadêmica e de estágio |
| Estudos | Foco, flashcards, quiz, leituras e histórico | Roteiro de aprendizagem conectado a disciplinas, estágio e TCC |
| Biblioteca | Livros, artigos, notas e transformação de conteúdo | Base de referências, fichas de leitura e repertório por tema |
| Estágio | Diário estruturado de registros | Ciclo completo de campo, supervisão, horas e entregas |
| TCC | Projeto, capítulos, prazo e referências | Espaço de pesquisa com evidências, fontes e entregáveis |
| Perfil | Métricas, conquistas e visão pessoal | Mapa de formação e portfólio de competências |

## Princípio de segurança e escopo

O diário de estágio existente mostrou que o produto é capaz de receber informações potencialmente sensíveis. Na fase atual, com dados persistidos localmente, o Cecistudy **não deve ser posicionado como prontuário, agenda de pacientes ou repositório de dados identificáveis de atendimentos**. Mesmo com um backend futuro, qualquer evolução voltada à prática deve nascer como ferramenta acadêmica e de supervisão, com orientação institucional e revisão jurídica antes de lidar com dados pessoais de terceiros.

O caminho seguro é apoiar a **reflexão anonimizada**: contexto geral, objetivos pedagógicos, hipóteses para discutir em supervisão, técnicas estudadas, dúvidas e aprendizados. Campos como nome, contato, data de nascimento, endereço, documento, diagnóstico fechado ou relatos identificáveis não devem ser incentivados no Cecistudy.

| Pode apoiar agora | Deve exigir outro nível de arquitetura e governança |
|---|---|
| Horas de estágio, tipo de atividade, disciplina, supervisão, entregas e reflexões anonimizadas | Cadastro de pacientes, prontuário, agenda clínica, documentos identificáveis e histórico de atendimento |
| Estudo de vinhetas fictícias e formulação de caso acadêmica | Ferramenta que recomenda conduta, diagnóstico ou intervenção para pessoas reais |
| Biblioteca, referências, citações, notas e TCC | Compartilhamento de dados clínicos entre usuários ou supervisores sem permissões e auditoria |

## O produto deveria ganhar três trilhas na Home

A tela **Hoje** pode manter seu tom acolhedor, mas para os semestres finais ela precisa organizar a rotina em três trilhas simples. Isso reduz a sensação de que tudo é uma lista de tarefas e torna a prioridade da semana compreensível em poucos segundos.

| Trilha | Pergunta que responde | Exemplos de itens |
|---|---|---|
| **Formação** | O que preciso aprender? | Aula, prova, leitura, flashcards, quiz e resumo |
| **Campo** | O que preciso preparar, observar ou levar à supervisão? | Turno de estágio, horas, pergunta de supervisão, relatório e reflexão anonimizados |
| **Entregas** | O que precisa avançar ou ser entregue? | Capítulo do TCC, relatório, seminário, fichamento e documentação de semestre |

Cada trilha deve mostrar somente uma ação principal, uma pequena métrica e uma próxima data. A aluna não precisa ver todos os módulos de uma vez; ela precisa entender qual é o próximo passo que protege o andamento da formação.

## Funcionalidades recomendadas

### 1. Plano semanal de formação

Essa é a funcionalidade com maior retorno imediato porque reutiliza quase tudo que o app já possui: aulas, provas, tarefas, sessões de foco, leituras, estágio e capítulos do TCC. Em vez de só listar pendências, o plano monta uma visão de segunda a domingo com blocos de **aula**, **campo**, **estudo**, **entrega** e **descanso**. A usuária pode reorganizar prioridades e marcar uma semana como “de prova”, “de relatório” ou “de fechamento de TCC”.

| Elemento | Dados de origem | Comportamento esperado |
|---|---|---|
| Semana em foco | Aulas, provas, tarefas, estágio e prazos de TCC | Mostra apenas itens relevantes aos próximos 7 dias |
| Carga estimada | Duração de foco, leituras e horas de estágio | Sinaliza excesso de compromissos, sem punir a usuária |
| Uma prioridade por trilha | Escolha da usuária | Fixa a ação mais importante no topo da Home |
| Check-in de sexta | Itens concluídos e adiados | Pergunta o que deve seguir para a próxima semana |

### 2. Estágio supervisionado 2.0

O diário de estágio já é uma ótima fundação. O avanço necessário é transformar registros isolados em um ciclo de formação: preparação, atividade, reflexão, supervisão e entrega. A tela deve ser útil antes e depois do campo, não apenas no momento de preencher um formulário longo.

| Bloco | O que a aluna registra | O que o Cecistudy devolve |
|---|---|---|
| Preparar o campo | Objetivo de aprendizagem, material a revisar e pergunta que deseja observar | Checklist curto antes do turno |
| Registro de atividade | Tipo de atividade, duração, contexto anonimizado e intervenção estudada | Horas acumuladas e evidência para relatório |
| Reflexão pós-campo | O que funcionou, dúvida para supervisão e conceito a revisar | Fila de assuntos para estudo e supervisão |
| Supervisão | Pauta, decisões, próximos passos e referências sugeridas | Ações vinculadas a prazo, estudo ou TCC |
| Entregas | Relatório, presença, ficha institucional ou devolutiva acadêmica | Linha do tempo do estágio e status de cada pendência |

O detalhe mais valioso seria o botão **“transformar em próximo passo”**, já existente em espírito no módulo de notas. Uma dúvida anotada no estágio pode virar flashcard, leitura, tarefa, pergunta de supervisão ou item do TCC. Esse é o elo que torna o Cecistudy singular.

### 3. Caderno de supervisão

Supervisão é onde a estudante conecta teoria, prática e responsabilidade. Hoje essa dimensão está dispersa entre notas, estágio e tarefas. Um caderno próprio deve centralizar encontros, sem guardar dados identificáveis de pessoas atendidas.

| Campo | Finalidade |
|---|---|
| Data e supervisora/orientadora | Organizar encontros e contexto acadêmico |
| Perguntas levadas | Preparar a conversa sem depender da memória da semana |
| Conceitos e referências citadas | Alimentar Biblioteca e Estudos |
| Próximos passos | Criar tarefas, leituras ou sessões de foco diretamente |
| Autoavaliação breve | Registrar confiança, limites e temas para retomar |

Uma boa interface seria uma página por encontro, com uma pequena coluna “antes da supervisão” e outra “depois da supervisão”. Assim a aluna vê que a supervisão produziu uma decisão concreta, e não apenas mais uma nota solta.

### 4. Mesa de pesquisa do TCC

O TCC já é o módulo visualmente e conceitualmente mais maduro. A maior oportunidade é converter o projeto de uma lista de capítulos em uma **mesa de evidências**. Essa tela não precisa escrever a monografia; precisa ajudar a estudante a saber o que já tem, o que falta sustentar e qual é o próximo trecho viável.

| Recurso | Uso prático |
|---|---|
| Pergunta, objetivo e recorte fixados no topo | Evita que leituras e anotações se afastem do projeto |
| Fichas de referência | Autor, ano, ideia central, citação, página, relação com capítulo e status de leitura |
| Mapa capítulo → evidência | Mostra quais capítulos têm fontes, argumentos e lacunas |
| Quadro de entregas | Orientação, versão, revisão e prazo institucional |
| Linha de escrita | Minutos, palavras ou blocos concluídos sem transformar escrita em competição |

O recurso mais importante seria o vínculo **“esta nota sustenta este parágrafo/capítulo”**. Ele aproveita Biblioteca, notas e leituras, evitando que o TCC vire outro silo no app.

### 5. Mapa de competências de formação

Nos semestres finais, a pergunta muda de “o que falta estudar?” para “o que já consigo fazer com supervisão?”. O Cecistudy pode oferecer um mapa pessoal de formação, não como avaliação clínica oficial, mas como visão reflexiva da jornada acadêmica.

| Eixo | Evidências possíveis | Sinal apresentado |
|---|---|---|
| Entrevista e escuta | Disciplinas, leituras, prática supervisionada e reflexões | Em desenvolvimento / praticado / aprofundar |
| Avaliação psicológica | Aulas, fichamentos, instrumentos estudados e relatórios acadêmicos | Trilha de estudo e evidências |
| Psicoterapias | Quiz, flashcards, livros, casos fictícios e supervisão | Abordagens mais estudadas |
| Ética e documentação | Leituras, presença em supervisão e entregas | Checklist de formação |
| Pesquisa e escrita | Capítulos, referências, resumos e apresentações | Progresso do TCC |

Esse mapa deve ser uma ferramenta de autopercepção. Ele não deve afirmar competência profissional, emitir certificação ou substituir avaliação de supervisor ou instituição.

### 6. Laboratório de casos fictícios e raciocínio clínico

O quiz atual é uma boa base para expandir prática ativa. Em vez de apenas perguntas objetivas, o app pode oferecer **vinhetas fictícias ou anonimizadas de uso educacional**, com contexto, perguntas de reflexão, conceitos relacionados e referências de estudo. A intenção é preparar discussão acadêmica, não treinar decisões automáticas sobre pessoas reais.

| Etapa da vinheta | Interação |
|---|---|
| Apresentação do contexto | Ler uma situação fictícia curta e identificar o foco de estudo |
| Hipóteses de aprendizagem | Selecionar conceitos, leituras ou temas para revisar |
| Feedback didático | Ver explicação com referências e observações de limites éticos |
| Continuidade | Transformar lacunas em flashcards, leitura ou sessão de foco |

### 7. Portfólio de conclusão de curso

Perto da formatura, a aluna precisa reunir evidências do percurso: projetos, apresentações, referências, relatórios acadêmicos, disciplinas, estágio e pesquisa. Um portfólio privado dentro do Cecistudy pode organizar esses materiais em um formato exportável, sem incluir dados sensíveis de terceiros.

O resultado pode ser um resumo por semestre com: áreas estudadas, produções acadêmicas, horas de campo, temas de interesse, TCC, eventos e leituras marcantes. Em uma fase posterior, a usuária poderia escolher conscientemente o que exportar para currículo, entrevista, processo seletivo de pós-graduação ou apresentação profissional.

## Recursos de completude que vêm antes de catálogo novo

Antes de expandir o produto com muitas telas, vale corrigir o que torna o núcleo confiável. A auditoria mostrou que o produto já possui modelos de dados ricos, mas ainda tem falhas em fluxos críticos, validações, interações e persistência local. Para uma usuária em semestres finais, perder uma sessão, ter um quiz travado ou não entender por que um formulário não avança quebra mais valor do que a ausência de uma nova funcionalidade.

| Prioridade | Iniciativa | Por que vem agora |
|---|---|---|
| P0 | Corrigir quiz, prazo sem data, reset/exemplos, feedback de validação e cards sem ação | Evita quebra de confiança no fluxo diário |
| P0 | Cobrir E2E de foco, quiz, estágio, TCC e backup/importação | Protege os módulos que passam a concentrar a rotina da aluna |
| P1 | Planejamento semanal de formação | Conecta recursos que já existem sem exigir dados clínicos novos |
| P1 | Estágio 2.0 e caderno de supervisão | É o maior diferencial possível para o final da graduação |
| P1 | Mesa de pesquisa do TCC | Aumenta profundidade do módulo mais bem resolvido do app |
| P2 | Mapa de competências e laboratório de vinhetas | Dá direção profissional sem ultrapassar o escopo educacional |
| P2 | Portfólio de conclusão | Converte trajetória em material útil de transição profissional |
| P3 | Integração de calendário, sincronização e compartilhamento | Só depois de identidade, permissão e arquitetura de dados maduras |

## Arquitetura recomendada por fase

Na configuração atual, o Cecistudy funciona como PWA local com persistência no `localStorage`. Isso é adequado para estudo individual, preferências, tarefas, leituras, materiais e dados anonimizados de baixo risco. Não é uma base apropriada para ampliar armazenamento de conteúdo sensível ligado a estágio.

| Fase | Arquitetura | Escopo permitido |
|---|---|---|
| Agora | PWA local + backup JSON melhorado | Estudos, TCC, horas, reflexões anonimizadas, planejamento e portfólio pessoal |
| Próxima | Conta de usuário, banco de dados, sincronização, exportação e exclusão | Sincronizar itens acadêmicos e permitir recuperação segura entre dispositivos |
| Antes de dados de campo mais ricos | Política de dados, consentimento institucional, permissões, trilha de auditoria e revisão jurídica | Avaliar qualquer campo que possa identificar terceiros |

Uma melhoria simples e urgente é fazer o backup se tornar uma experiência de proteção: último backup, lembrete mensal, teste de restauração, resumo do que será exportado e aviso explícito de dados locais. Isso é mais valioso do que uma integração sofisticada se a usuária ainda puder perder seu percurso acadêmico ao trocar de aparelho.

## O que eu não recomendaria construir agora

Não recomendo começar por rede social de estudantes, ranking de produtividade, agenda de pacientes, prontuário, chat de aconselhamento clínico, “diagnóstico por IA” ou feed de conteúdo genérico. Esses recursos aumentam complexidade, risco, moderação e responsabilidade, mas não resolvem a fragmentação central da estudante em fase final de formação.

O Cecistudy ganha força quando é específico: **uma plataforma de formação organizada, afetiva e responsável para quem está aprendendo a se tornar psicóloga**. Estágio, supervisão, TCC e repertório são os quatro blocos que podem torná-lo difícil de substituir.

## Sequência prática de implementação

Nas próximas quatro entregas, eu seguiria esta ordem: primeiro corrigir os defeitos P0 e tornar validações observáveis; depois lançar o plano semanal; em seguida integrar Estágio 2.0 com Caderno de Supervisão; e então evoluir TCC para mesa de evidências. Só após esses passos eu criaria Mapa de Competências, laboratório de vinhetas e portfólio.

Essa sequência preserva a essência atual do Cecistudy. O app continua leve, pessoal e acolhedor, mas passa a acompanhar a aluna justamente quando a graduação fica mais complexa e mais próxima da prática profissional.
