# Especificação incremental do Workspace Profissional do cecistudy

**Status:** rascunho inicial, para discussão e fechamento incremental (mesmo formato da spec do Calendário).

**Escopo:** novo workspace, separado do acadêmico, reunindo as funções que a Ceci vai usar quando estiver formada e atuando como psicóloga: agenda de consultório, prontuário, financeiro, documentos e comunicação com pacientes reais. Inclui o Marketing Studio, que deixa de ser módulo do workspace acadêmico e passa a viver aqui.

---

## 0. Regra de ouro (não negociável)

O cecistudy já tem um módulo que lida com "pacientes" e "sessões": o **Laboratório de Testes**, com personagens simulados para prática clínica. Este workspace lida com **pacientes reais**. São domínios diferentes, com donos de dado diferentes, sensibilidade diferente e ciclo de vida diferente.

> **Nenhuma entidade, tabela, tela ou nome deste workspace pode ser compartilhada ou confundida com as entidades do Laboratório.** `Paciente` (real) e `Personagem` (simulado) nunca são a mesma tabela, nunca aparecem na mesma lista, nunca compartilham um `id`. Se algum dia a Ceci quiser usar uma sessão real como base para treinar no Laboratório, isso é uma ação explícita de **exportação anonimizada**, nunca um vínculo automático.

Essa separação é mais importante que qualquer decisão de UI abaixo.

---

## 1. Propósito

O Workspace Profissional é o consultório digital da Ceci depois de formada: onde ela agenda sessões com pacientes reais, mantém prontuário, cobra, emite documentos e organiza a divulgação do próprio trabalho (Marketing). Ele não substitui o CFP nem sistemas de conformidade regulatória — ele organiza a rotina.

Ele **não é obrigatório de uso enquanto ela é estudante**. O workspace acadêmico continua sendo o principal até a formatura; este nasce vazio e cresce conforme ela começa a atender.

## 2. Por que workspace separado, e não módulo

Um módulo dentro do workspace acadêmico assumiria o contexto de estudante (Faculdade, Estudos, Calendário de provas). O Profissional tem contexto de negócio: agenda com clientes pagantes, dinheiro de verdade, dado de terceiro protegido por sigilo profissional e LGPD. Separar em workspace:

- Evita que a matriz de capacidades tenha que distinguir "prova de amanhã" de "sessão com paciente às 14h" dentro do mesmo balde de dados.
- Permite política de segurança/backup mais rígida só aqui, sem pesar o resto do app.
- Dá à sidebar principal um botão "trocar de vida" real — estudante vs. profissional — em vez de uma aba a mais.

## 3. Modelo central de entidades

| Entidade | Definição |
|---|---|
| **Paciente** | Pessoa real em atendimento. Dado cadastral, contato, vínculo com convênio (se houver), status (ativo/inativo/alta). |
| **Sessão (profissional)** | Um atendimento real, agendado ou realizado. Tem horário, duração, modalidade (presencial/online), status. |
| **Registro de prontuário** | Entrada clínica ligada a uma sessão ou avulsa: evolução, entrevista inicial, hipótese, plano terapêutico. Estruturado por template configurável, não texto livre solto. |
| **Documento clínico** | Artefato gerado ou anexado: atestado, recibo, contrato terapêutico, termo de consentimento, encaminhamento. |
| **Cobrança** | Registro financeiro ligado a uma sessão ou a um pacote de sessões: valor, status de pagamento, forma. |
| **Pacote/Convênio** | Configuração de como o paciente paga: avulso, pacote de N sessões, convênio com regras próprias. |
| **Comunicação** | Lembrete, confirmação, mensagem — o que foi enviado ao paciente e quando (não o conteúdo de terapia). |

Note o paralelo com a spec do Calendário: **Sessão** aqui é a mesma família de "Evento" — algo que ocupa um horário. A diferença é que ela carrega um vínculo obrigatório com Paciente e com Cobrança, que uma aula ou bloco de estudo não têm.

## 4. Módulos dentro do workspace

### 4.1 Consultório (agenda + atendimento)
Dono de: Paciente, Sessão, Pacote/Convênio.
- Agenda do profissional: quem vem, quando, presencial ou online.
- Cadastro e histórico de cada paciente (dados administrativos — não clínicos).
- Confirmação e lembrete automático de sessão.
- **Reaproveita o eixo Calendário** como motor de tempo: a Sessão profissional é um tipo de evento nesse eixo, com uma camada visual própria ("Consultório"), do mesmo jeito que Faculdade e TCC já são camadas hoje. Não deveria existir uma segunda grade de horários no app.

### 4.2 Prontuário
Dono de: Registro de prontuário.
- Templates de entrevista/evolução configuráveis por abordagem (a Ceci pode ter um modelo para TCC, outro para psicanálise, etc. — e o catálogo do Biblioteca já tem o conceito de "abordagens").
- Criptografia em repouso e controle de acesso — este é o dado mais sensível do app inteiro, mais sensível até que Estágio.
- Timeline por paciente: todas as entradas em ordem, filtráveis.
- Anexos (exames, encaminhamentos recebidos).

### 4.3 Financeiro
Dono de: Cobrança.
- Lançamento de cobrança por sessão realizada ou por pacote.
- Controle de inadimplência (quem está devendo).
- Relatório simples de faturamento por período.
- Fora do MVP, mas mapeado: emissão de recibo/NF-e, integração bancária, TISS para convênio.

### 4.4 Documentos
Dono de: Documento clínico.
- Modelos: atestado, recibo, contrato terapêutico, termo de consentimento.
- Preenchimento a partir dos dados do Paciente/Sessão (sem redigitar).
- Fora do MVP: assinatura eletrônica.

### 4.5 Marketing Studio
Dono de: Pipeline editorial, canais, publicações (já especificado anteriormente).
- Migra do workspace acadêmico para cá sem mudança de modelo de dados.
- Uso: divulgação do próprio trabalho como profissional (Instagram, site, conteúdo educativo).

### 4.6 Portal do Paciente — fora do MVP, mapeado
Presente em praticamente todo concorrente pesquisado (Clínica nas Nuvens, Carepatron, PsicoManager): agendamento e pagamento pelo próprio paciente, acesso a documentos. Faz sentido para o cecistudy só numa fase avançada (exigiria backend voltado ao paciente, fora do escopo do desktop/mobile da Ceci). Registrado como decisão aberta, não como módulo do MVP.

## 5. O que os concorrentes têm que o cecistudy deliberadamente **não** vai replicar (por enquanto)

Pesquisando Clínica nas Nuvens, PsicoManager, Sinappsy, Menta e Carepatron, o padrão de mercado inclui: telemedicina embutida, faturamento TISS para convênio, BI avançado, gestão de equipe/múltiplos profissionais, integração contábil (DAS, NF-e). Isso é dimensionado para clínica com secretária e vários profissionais. A Ceci é uma profissional solo. Levar esse escopo cheio para o MVP seria construir para uma clínica que não existe. Ficam de fora até haver sinal real de necessidade:
- Gestão multiusuário/equipe.
- Telemedicina embutida (uma chamada de vídeo externa resolve por anos).
- Faturamento TISS/convênio.
- Integração contábil/fiscal.

## 6. Como isso se encaixa na taxonomia geral do app

Retomando a taxonomia fechada na conversa anterior:
- **Consultório, Prontuário, Financeiro, Documentos** são módulos de domínio — cada um dono de suas entidades, dentro do workspace Profissional.
- **Marketing** continua módulo de domínio, só muda de workspace.
- **Calendário** (eixo do tempo) e **Perfil** (sistema) são compartilhados entre os dois workspaces — não duplicam.
- **Conhecimento** (eixo do significado) é uma decisão em aberto: uma anotação de prontuário é "conhecimento" no mesmo sentido que um resumo de aula? Provavelmente não — prontuário tem regras de sigilo que o grafo de conhecimento acadêmico não tem. Registrado como pendência (§8).

## 7. Segurança e sigilo — requisito transversal do workspace

Este workspace tem o requisito mais alto do app inteiro, acima até de Estágio:
- Dado de terceiro (o paciente não é usuária do app, não deu consentimento de uso de produto — só de atendimento).
- Prontuário é documento com valor legal (CFP exige guarda por tempo determinado).
- Sigilo profissional é obrigação ética, não só preferência de produto.

Implicações práticas a decidir na Fase 0 deste workspace (não depois): criptografia de prontuário em repouso, política de backup separada (o backup do prontuário não pode vazar para o mesmo canal de sync usado pelas notas de faculdade), e trilha de auditoria de quem acessou o quê.

## 8. Decisões ainda abertas

1. Nome definitivo do workspace ("Profissional", "Consultório", "Clínica" — impacta nome de todo o resto).
2. Se **Sessão profissional** é literalmente uma especialização de **Evento** do Calendário (mesma tabela, campo de tipo) ou uma entidade própria que só se projeta como evento — decisão de modelagem que evita ou não duplicação de dado de horário.
3. Se o Registro de prontuário entra no eixo Conhecimento ou fica isolado por sigilo.
4. Se templates de entrevista/evolução vêm do catálogo (Biblioteca, por abordagem) ou são só configuração pessoal da Ceci.
5. Onde entra o critério de "quando este workspace deixa de ser experimental e vira uso real" — provavelmente: quando ela tiver o primeiro paciente de verdade, não quando o código estiver pronto.
6. Se cobrança/financeiro precisa de moeda/formato fiscal desde já ou pode nascer com valor simples sem nota fiscal.

## 9. MVP sugerido

| Ordem | Entrega |
|---:|---|
| 1 | Domínio de Paciente, Sessão profissional, Registro de prontuário — com decisão do item 8.2 já fechada. |
| 2 | Camada "Consultório" no Calendário existente (reaproveita a grade, não cria uma nova). |
| 3 | Prontuário com template único fixo (sem customização ainda) + criptografia em repouso. |
| 4 | Cadastro e histórico de paciente (tela dedicada, fora do Calendário). |
| 5 | Cobrança simples por sessão (valor, pago/pendente) sem nota fiscal. |
| 6 | Documentos: atestado e recibo, preenchidos a partir de Paciente/Sessão. |
| 7 | Migração do Marketing Studio para este workspace (sem mudança de modelo). |
| 8 | Templates configuráveis de prontuário por abordagem. |
| 9 | Relatório de faturamento por período. |

A ordem prioriza provar a separação de sigilo (item 3) antes de qualquer coisa financeira ou de documento, porque é a parte que não dá pra corrigir depois sem migração de dado sensível.
