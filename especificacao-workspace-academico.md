# Especificação incremental do Workspace Acadêmico do cecistudy

**Status:** rascunho para discussão, companion da spec do Workspace Profissional.

**Escopo:** o workspace original do cecistudy, agora sem o Marketing Studio (migrado para o Profissional). É o app enquanto a Ceci é estudante de psicologia.

---

## 1. Propósito

Organizar tudo que é vida de estudante: disciplinas, estudo, estágio supervisionado, TCC e a prática clínica simulada de laboratório. É o workspace ativo por padrão até a formatura.

## 2. Módulos de domínio

| Módulo | Dono de | Spec própria |
|---|---|---|
| **Faculdade** | Disciplina, Aula, Prova, Trabalho, Nota, ClassNote | — (nível de detalhe atual basta) |
| **Estudos** | StudySession, Flashcard, ReadingItem, fila de revisão | — |
| **Estágio** | Caso, Atendimento, Supervisão, Reflexão | Precisa de tratamento de sigilo próprio (ver §4) |
| **TCC/Projetos** | Projeto, Base de pesquisa, Saída, árvore acadêmica configurável, editor paginado, DOCX round-trip | ✅ já especificada |
| **Laboratório de Testes** | Personagem (simulado), Sessão de prática, Memória, Evento | ✅ já especificada — ver regra de ouro abaixo |

## 3. O que é compartilhado com o Profissional, e não duplica

| Eixo/Sistema | Papel aqui | Papel no Profissional |
|---|---|---|
| **Calendário** | Camadas Faculdade, Estudos, TCC, Estágio | Camada Consultório |
| **Conhecimento** | Documents/Blocks/Concepts vindos de aula, leitura, TCC | Em aberto se prontuário entra aqui (ver spec do Profissional, §8.3) |
| **Biblioteca** (catálogo) | Consulta livre, base para Estudos | Pode alimentar templates de abordagem no Prontuário |
| **Perfil** | Streak, métricas de estudo | Mesmo perfil, sem duplicar identidade |

Nenhum desses três vira módulo do Profissional por conta própria — eles só ganham uma camada/projeção nova lá, exatamente como a spec do Calendário já define para os módulos acadêmicos entre si.

## 4. Estágio precisa de decisão própria de sigilo — antes de virar ponte para o Profissional

Estágio já lida com caso real de paciente (paciente do local de estágio, supervisionado). Ele é, na prática, uma versão em miniatura e supervisionada do que o Profissional vai fazer sozinho depois. Duas decisões travam aqui:

1. **Estágio usa o mesmo nível de proteção de dado que o Profissional (criptografia, política de backup separada) ou um nível intermediário?** Hoje a varredura técnica não achou nenhuma regra de capacidade para essa família de entidades — pendência já registrada.
2. **Quando a Ceci se forma, o histórico de Estágio migra, se conecta ou fica isolado do Profissional?** São pacientes diferentes (do estágio vs. do consultório próprio), mas a experiência acumulada (o que ela aprendeu) pode fazer sentido levar. Dado clínico, não.

## 5. Regra de ouro (repetida de propósito)

Vale para este workspace com a mesma força que vale para o Profissional: **Personagem simulado (Laboratório) e paciente real (Estágio ou, mais tarde, Profissional) nunca compartilham tabela, id ou tela.** O Laboratório existe justamente para treinar sem risco — misturar os dois destrói essa garantia.

## 6. O que fica de fora deste documento

Calendário e TCC já têm spec própria e não são repetidos aqui. Faculdade, Estudos e Laboratório têm profundidade suficiente já descrita nesta conversa; só precisam de spec dedicada se algo específico travar durante a implementação (ex: um comportamento fino do editor paginado do TCC, ou o motor de eventos do Laboratório).

## 7. Decisão em aberto herdada

A pergunta original — se o desktop é "superset" do mobile ou "estação de trabalho" — ainda não fechou. Ela se aplica por módulo, não pro workspace inteiro: Faculdade e Perfil tendem a "mesmo nos dois"; TCC, Laboratório e o Consultório (Profissional) tendem a "nasce no desktop". Fica como critério a aplicar módulo a módulo conforme cada um for especificado, em vez de uma resposta única.
