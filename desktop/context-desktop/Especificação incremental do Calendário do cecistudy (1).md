# Especificação incremental do Calendário do cecistudy

**Status:** versão inicial definida em conjunto.

**Escopo:** módulo de Calendário acadêmico, integrado a Faculdade, Estudos, TCC, Base de Conhecimento e Google Calendar.

## 1. Propósito

O Calendário do cecistudy será um sistema de planejamento e acompanhamento de responsabilidades acadêmicas. Ele terá a forma completa de um calendário, mas não será um calendário pessoal genérico. Seu foco será organizar tudo o que acontece e tudo o que precisa ser realizado no universo de estudos, faculdade, estágio, TCC e responsabilidades relacionadas.

O Calendário não substituirá a Home. A Home será responsável por destacar pendências e prioridades. O Calendário será responsável principalmente por mostrar a distribuição temporal, os compromissos, os blocos planejados e o que efetivamente aconteceu.

## 2. Modelo central aprovado

O domínio separa o que ocupa um horário do que precisa ser realizado dentro de um prazo.

| Entidade | Definição |
|---|---|
| **Evento** | Algo que acontece em um horário específico, como aula, prova, apresentação, reunião, supervisão ou entrega agendada. |
| **Responsabilidade** | Algo que precisa ou pode ser realizado dentro de um prazo, como tarefa, leitura, pesquisa, revisão, escrita ou preparação. |
| **Bloco de planejamento** | Um período reservado para executar uma responsabilidade. Não cria uma obrigação nova; apenas reserva tempo para uma existente. |
| **Ocorrência** | Uma instância individual de um evento recorrente, como a aula de uma terça-feira específica. |
| **Registro de execução** | O relato do que realmente aconteceu, incluindo duração, conclusão, resultado e observações. |
| **Regra de recorrência** | A configuração que gera eventos repetidos durante um período, com exceções por ocorrência. |
| **Etapa/subtarefa** | Parte de uma responsabilidade ou marco maior, acompanhada em detalhe sem poluir a visão semanal. |

Uma leitura opcional pode existir como responsabilidade complementar sem ser tratada como falha quando não for realizada. Uma prova, apresentação de TCC ou entrega obrigatória possui peso diferente e deve ter comportamento visual e de lembrete correspondente.

## 3. Níveis de compromisso

O Calendário utiliza quatro níveis:

| Nível | Significado | Pode gerar atraso? | Pode ser sugerido/reservado automaticamente? |
|---|---|---:|---:|
| **Obrigatório** | Compromisso acadêmico que precisa ser cumprido. | Sim | Não sem ação explícita da usuária. |
| **Importante** | Tem impacto relevante, mas admite reorganização. | Sim, com menor severidade. | Não sem ação explícita da usuária. |
| **Recomendado** | Atividade benéfica sugerida pelo sistema ou pela própria usuária. | Não como falha. | Sim, quando a Ceci aceitar a sugestão. |
| **Opcional** | Atividade complementar, sem cobrança ou penalização. | Não. | Não por padrão. |

A ceci nunca deve transformar silenciosamente um item recomendado ou opcional em obrigação. Uma sugestão de bloco pode ser aceita, ajustada ou recusada.

## 4. Estados

Os estados aprovados são:

```text
planejado → em andamento → concluído
                 │              │
                 ├→ adiado      └→ registro de execução
                 │
                 ├→ não realizado
                 ├→ cancelado
                 └→ dispensado
```

`cancelado` representa uma alteração externa ou administrativa, como uma aula cancelada, e não deve gerar punição. `não realizado` significa que a atividade não aconteceu e requer uma decisão posterior. `dispensado` significa que a usuária decidiu que aquela responsabilidade não precisa mais ser feita.

Para uma atividade recorrente, a alteração deve ocorrer na ocorrência específica por padrão. A regra recorrente permanece intacta. Uma mudança permanente na série precisa ser uma ação explícita sobre a regra.

## 5. Recorrências

O Calendário suportará recorrência para aulas, supervisões, reuniões e outros compromissos regulares. A regra terá no mínimo frequência, dias, horário, data inicial, data final ou quantidade de ocorrências e fuso horário.

Cada ocorrência deverá poder ser marcada como realizada, cancelada, remarcada ou alterada sem destruir a regra original. Uma ocorrência remarcada manterá referência à regra e à data original, permitindo histórico e sincronização correta com o Google Calendar.

## 6. Planejamento versus realidade

Toda responsabilidade ou bloco que envolva tempo poderá ter uma dimensão planejada e uma dimensão real.

| Dimensão | Exemplos |
|---|---|
| Planejamento | Duração estimada, horário escolhido, objetivo, etapas e contexto esperado. |
| Realidade | Horário efetivo, duração realizada, estado, resultado, observações e desvios. |

A duração real poderá ser informada manualmente ou registrada por um timer da ceci. Os dois métodos devem coexistir. A diferença entre planejado e realizado pode alimentar histórico e aprendizagem, mas não deve ser usada para punir automaticamente a usuária.

## 7. Experiência desktop

A tela principal do módulo será uma visão semanal. A grade terá dias no eixo horizontal e horários no eixo vertical. Itens de dia inteiro aparecerão em uma faixa separada. Eventos e blocos de planejamento ocuparão posições temporais e poderão ser arrastados e redimensionados.

A interface oferecerá alternância para visão diária, mensal e agenda/lista. Os detalhes visuais ainda serão refinados durante o projeto, mas a decisão estrutural é que o painel contextual possa permanecer aberto enquanto a Ceci navega pela semana.

A mesma tela reunirá camadas visuais do Calendário, como Faculdade, TCC, Estudos, Estágio e Google Calendar. Cada camada terá cor, ícone ou etiqueta própria. Elas não serão calendários separados no domínio; serão filtros e projeções dentro de uma visão temporal unificada.

O painel contextual poderá exibir detalhes, etapas, vínculos com a origem, planejamento, execução real, histórico, sincronização, conflitos e ações. A Home continuará exibindo pendências e prioridades de forma mais destacada.

## 8. Experiência mobile

O mobile terá uma agenda compacta, preferencialmente com faixa de dias e agenda do dia selecionado. A visão semanal estará disponível de forma resumida, mas não tentará reproduzir a grade completa do desktop.

A criação e a edição rápida permitirão concluir, adiar, reagendar, alterar duração, registrar execução e marcar uma ocorrência como cancelada. A manipulação espacial será leve: em vez de arrastar livremente na grade, o mobile oferecerá ações para escolher outro dia, horário ou duração.

Campos avançados, etapas, histórico, vínculos profundos e análise do planejamento ficarão principalmente no desktop. O mobile poderá mostrar resumos e indicadores para que a usuária saiba que existem informações mais completas sincronizadas.

## 9. Integração com os módulos do cecistudy

O Calendário é dono do tempo; cada módulo de origem é dono do seu conteúdo.

| Origem | Entrada automática ou vinculável no Calendário | Dono do conteúdo |
|---|---|---|
| Faculdade | Aulas recorrentes, ocorrências, provas, apresentações, trabalhos e prazos. | Disciplina, aula, prova, nota e conteúdo acadêmico. |
| Estudos | Blocos de foco, revisão, leitura, questões e registros de execução. | Fila de revisão, flashcards, sessões e histórico pedagógico. |
| TCC | Marcos, etapas, reuniões, entregas e blocos de escrita/revisão. | Estrutura, capítulos, texto, referências, citações e versões. |
| Conhecimento | Sugestões de leitura, revisão, consolidação ou exploração de conceitos/documentos. | Documents, Blocks, Concepts, Relations, Graph e `.cectx`. |
| Google Calendar | Eventos sincronizados e bloqueios externos. | Campos do item conforme a origem e as regras de propriedade. |

Se a Ceci editar no Calendário algo que pertence ao cecistudy, o Calendário envia um comando ao módulo de origem. Ele não cria uma cópia independente. Mover uma prova atualiza a prova; alterar uma etapa do TCC atualiza o marco ou etapa; cancelar uma aula altera somente a ocorrência.

## 10. Integração bidirecional com Google Calendar

O cecistudy terá ou utilizará um calendário dedicado no Google para os itens acadêmicos que enviar. A integração será bidirecional e automática, com opção de sincronização manual e indicador de estado.

A origem determina a permissão:

| Tipo | Editável no cecistudy | Editável no Google | Tratamento |
|---|---:|---:|---|
| Criado no cecistudy e sincronizado | Sim | Sim | Mantém identidade ligada nos dois sistemas. |
| Criado no Google e importado | Não | Sim | Aparece como bloqueio externo somente leitura no cecistudy. |
| Responsabilidade criada no cecistudy ligada a evento externo | Sim nos campos próprios da responsabilidade | Não altera o evento externo | Mantém associação contextual sem assumir propriedade do evento. |

Cada vínculo deve manter identidade dos dois lados, calendário de origem/destino, último estado sincronizado, última modificação observada, origem da alteração, versão/etag quando disponível e estado de conflito.

Eventos externos podem ser associados a um contexto acadêmico para referência, mas essa associação não torna seus campos editáveis. Se a Ceci precisar se preparar para uma reunião externa, o cecistudy cria uma responsabilidade própria ligada ao evento, sem modificar o evento do Google.

Conflitos não serão sobrescritos silenciosamente. O sistema deve preservar temporariamente as versões e permitir manter a versão do cecistudy, manter a do Google ou combinar campos quando a combinação for segura.

Excluir um item vinculado deve pedir confirmação sobre a exclusão no outro sistema. Se o evento for excluído no Google, a ligação será marcada como removida no cecistudy, o histórico acadêmico será preservado e a Ceci poderá recriar o evento.

## 11. MVP sugerido

O MVP do Calendário deve provar o modelo de tempo, não tentar resolver toda a inteligência do cecistudy.

| Ordem | Entrega |
|---:|---|
| 1 | Novo domínio de eventos, responsabilidades, blocos, ocorrências, etapas e registros de execução. |
| 2 | Visão semanal desktop com arrastar/redimensionar e painel contextual. |
| 3 | Agenda diária mobile com criação e edição rápida. |
| 4 | Aulas recorrentes com cancelamento e remarcação por ocorrência. |
| 5 | Provas, apresentações, tarefas e prazos vindos de Faculdade. |
| 6 | Blocos de estudo manuais e timer de execução. |
| 7 | Camadas visuais por origem dentro do mesmo calendário. |
| 8 | Integração bidirecional com calendário dedicado do Google. |
| 9 | Conflitos, exclusões e indicador de sincronização. |
| 10 | Sugestões de blocos recomendados pela ceci. |

A integração inicial com Google exige atenção especial a autenticação, escolha de calendário, mapeamento de IDs, recorrências e conflitos. Ela deve entrar cedo, mas não deve impedir a evolução do calendário interno caso a conexão esteja indisponível.

## 12. Decisões ainda abertas

As decisões abaixo ainda podem ser fechadas durante o desenho técnico:

1. Se o item principal do calendário se chamará `Event`, `CalendarEvent` ou outro nome no domínio.
2. Se uma responsabilidade pode ter múltiplos prazos ou apenas um prazo principal com etapas internas.
3. Quais propriedades terão sincronização por campo e quais serão específicas do cecistudy.
4. Como será escolhida a cor de cada camada e se a usuária poderá personalizá-la.
5. Se o Google Calendar será conectado a uma conta e calendário por workspace ou a uma configuração global do cecistudy.
6. Qual será a política de fuso horário para viagens, mudanças de horário e eventos recorrentes.
7. Se blocos planejados podem se sobrepor e como o sistema sinalizará conflito sem impedir a decisão da usuária.
8. Como a Ceci aceitará, ajustará ou recusará uma sugestão de bloco recomendado.

## 13. Regra de ouro

O Calendário deve responder a três perguntas diferentes sem misturá-las:

```text
O que está marcado para acontecer?
O que precisa ser feito?
O que realmente aconteceu?
```

A primeira pergunta pertence aos eventos e ocorrências. A segunda pertence às responsabilidades, etapas e blocos de planejamento. A terceira pertence aos registros de execução. Essa separação é o que permitirá que o cecistudy seja completo sem transformar toda atividade acadêmica em uma obrigação punitiva.
