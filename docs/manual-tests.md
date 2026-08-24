# Relatório de testes manuais e auditoria de uso real — Cecistudy

**Autor:** Manus AI  
**Data da rodada:** 19 de agosto de 2026  
**Projeto avaliado:** `cecistudy-main`  
**Ambiente:** aplicação Vite executada localmente em `http://127.0.0.1:3000/`, navegador Chromium, estado inicial criado pelo onboarding e persistência em `localStorage`.

## 1. Objetivo e escopo

Esta rodada simulou o comportamento de uma usuária real, priorizando não apenas o caminho feliz, mas também tentativas incompletas, respostas incorretas, estados vazios, ações reversíveis, ações destrutivas e transições entre telas. O objetivo foi identificar situações em que a usuária tenta fazer algo e não consegue, não entende o que ocorreu ou recebe um resultado diferente do que a interface prometeu.

Foram percorridos o onboarding, Home, tarefas, wizard combinado, Biblioteca, artigos, livros, notas avulsas, transformação de nota, foco, flashcards, quiz, histórico, Faculdade, disciplinas, aulas, provas, diário de estágio, TCC, backup/importação, carregamento de exemplos e reset. Também foi observado o comportamento do frontend, do armazenamento local, do servidor de desenvolvimento e das referências de rede/API.

A aplicação não foi alterada durante a auditoria. Os registros criados foram feitos em uma cópia de teste do projeto. Um backup completo do estado final foi exportado ao término da rodada.

## 2. Resumo executivo

O Cecistudy possui uma base funcional e uma experiência visual coerente. A maior parte dos caminhos de criação — tarefa, flashcard, nota, disciplina, aula, prova, estágio e TCC — chegou ao salvamento e atualizou os indicadores correspondentes. Backup e importação também funcionaram para o estado validado.

Entretanto, há um defeito **crítico** no quiz: depois de escolher uma alternativa incorreta, a questão não exibe feedback, não libera a continuação e não reage nem quando a alternativa correta é acionada posteriormente. Na prática, a usuária fica presa e precisa abandonar o quiz. Esse é o problema mais urgente da rodada.

Também foram reproduzidos problemas relevantes de dados e navegação. Tarefas criadas sem prazo aparecem com a data atual, apesar de a confirmação informar “sem prazo”; cards de livros parecem clicáveis, mas não abrem detalhe nem possuem semântica de botão; a ação “ver anotação” no diário de aulas é exibida como texto sem controle interativo detectável; e as ações `carregar exemplos` e `resetar cantinho` bloquearam o navegador por 45 segundos durante a tentativa de confirmação, sem uma confirmação acessível ou feedback concluível.

| Dimensão | Resultado da rodada |
|---|---|
| Fluxos principais concluídos | A maioria funcionou até o salvamento |
| Defeito funcional crítico | Quiz fica travado após resposta incorreta |
| Inconsistência de dados | Tarefa “sem prazo” recebe a data atual |
| Lacunas de interface | Cards de livros e “ver anotação” sem interação clara |
| Validação | Formulários vazios bloqueiam sem mensagem visível em vários pontos |
| Dados | Exportação e importação restauraram o estado validado |
| Backend | Não há backend de domínio nesta versão; o estado fica no `localStorage` |
| Servidor | Vite respondeu com HTTP 200 durante a execução |

## 3. Matriz dos fluxos testados

| Fluxo | Resultado | Observação principal |
|---|---|---|
| Onboarding do zero | Aprovado com ressalvas | Campos opcionais avançam; permissões aparecem desabilitadas na web |
| Criação de tarefa pela Home | Aprovado | Contadores, checkbox e streak foram atualizados |
| Wizard de tarefa/prova | Parcial | Cria tarefa, mas “sem prazo” vira data atual |
| Biblioteca e busca | Parcial | Busca funciona; catálogo é muito extenso e cards de livros não respondem claramente |
| Abrir e salvar artigo | Aprovado | Modal, salvar/remover e persistência funcionaram |
| Notas avulsas | Aprovado | Criar, categorizar e transformar funcionaram |
| Transformar nota em tarefa | Parcial | Conversão persiste, mas não leva a usuária ao resultado nem confirma claramente |
| Timer de foco | Aprovado com ressalvas | Pausar/retomar funciona; reiniciar apaga sem confirmação |
| Flashcards | Aprovado | Criar, revelar, avaliar e retirar da fila funcionaram |
| Quiz | Reprovado | Resposta incorreta trava a questão e impede conclusão |
| Histórico de estudos | Parcial | Mostra vazio após interrupção, sem explicar perda da sessão parcial |
| Backup/exportação | Aprovado | Download JSON gerado corretamente |
| Backup/importação | Aprovado no cenário validado | Toast e dados principais foram restaurados sem duplicação |
| Nova disciplina | Aprovado | Wizard e contador funcionaram |
| Nova aula | Aprovado com ressalvas | Registro aparece, mas “ver anotação” não é interativo |
| Nova prova | Aprovado com ressalvas | Cria e permite concluir; formulário vazio não explica o bloqueio |
| Diário de estágio | Aprovado com ressalvas | Fluxo completo funciona; validação vazia é silenciosa |
| TCC | Aprovado | Criação, capítulo, prazo e conclusão funcionaram |
| Carregar exemplos | Reprovado/indeterminado | Clique bloqueou por 45 s e tornou a sessão do navegador indisponível |
| Resetar cantinho | Reprovado/indeterminado | Mesmo bloqueio de 45 s durante a confirmação |

## 4. Defeitos que impedem ou bloqueiam a usuária

### 4.1. [P0] Quiz fica irreversivelmente travado depois de resposta incorreta

**Reprodução:** abrir Estudos → Quiz, iniciar um quiz de cinco questões, responder corretamente a primeira questão e escolher deliberadamente uma alternativa incorreta na segunda.

**Resultado observado:** a alternativa incorreta não ficou visualmente marcada, nenhum feedback de erro apareceu, a resposta correta não foi exibida e o botão `continuar` não foi liberado. Mesmo acionando diretamente a alternativa correta pelo DOM, a tela permaneceu sem feedback e sem avanço. A única saída encontrada foi abandonar o quiz pela navegação de retorno.

**Impacto:** a usuária não consegue concluir o quiz, não recebe aprendizado sobre o erro e pode interpretar o sistema como quebrado. Como o fluxo de avaliação é uma função central do app, o defeito deve ser tratado como bloqueador de release.

**Correção recomendada:** tornar a seleção de qualquer alternativa uma transição explícita de estado. O reducer do quiz deve registrar `selectedAnswer`, calcular `isCorrect`, renderizar feedback para acerto e erro e liberar `continuar` após a resposta. Deve existir um teste E2E que responda uma questão incorretamente e confirme que o usuário chega à próxima questão e ao resultado final. Evidência: [rodada 14][e1].

### 4.2. [P1] Tarefa sem prazo recebe a data atual

**Reprodução:** criar uma tarefa pelo wizard combinado ou transformar uma nota em tarefa; na etapa de prazo, escolher `sem prazo` e confirmar.

**Resultado observado:** a confirmação informa `sem prazo definido`, mas a Home mostra `prazo: 2026-08-19`. A tarefa passa a aparecer como obrigação do dia e altera os assuntos prioritários e os contadores diários.

**Impacto:** o app altera o significado do dado informado pela usuária. Uma tarefa sem prazo pode entrar indevidamente na agenda de hoje, gerando cobrança errada e indicadores inconsistentes.

**Correção recomendada:** representar a ausência de prazo como `null` ou `undefined` em todo o domínio e separar isso de uma data de exibição. A lógica de “tarefas de hoje” deve considerar somente `dueDate === hoje`, nunca um valor padrão inserido no salvamento. Adicionar teste para criação, transformação, exportação e importação de tarefa sem prazo. Evidência: [rodadas 3 e 9][e2].

### 4.3. [P1] Carregar exemplos e resetar o cantinho bloqueiam o fluxo de confirmação

**Reprodução:** no Perfil, clicar `carregar exemplos` e depois, em uma nova sessão, clicar `resetar cantinho`.

**Resultado observado:** ambos os cliques ficaram aguardando por 45 segundos e tornaram a sessão do navegador indisponível. O servidor Vite continuou respondendo normalmente, portanto não foi uma queda do app inteiro. O comportamento é compatível com o uso de confirmação nativa não capturada pelo ambiente ou com uma confirmação que deixa o fluxo sem retorno visível.

**Impacto:** a usuária não sabe se a operação foi aceita, cancelada ou está pendente. Em ações destrutivas, esse comportamento é especialmente perigoso: pode provocar cliques repetidos, perda de confiança e impossibilidade de concluir uma operação necessária.

**Correção recomendada:** substituir `window.confirm` por um modal React acessível, com foco gerenciado, textos explícitos, botões `Cancelar` e `Confirmar`, feedback de conclusão e bloqueio contra duplo clique. O modal deve ser testável por Playwright sem depender de diálogo nativo do navegador. Evidência: [rodadas 21 e 22][e3].

### 4.4. [P1] Cards de livros parecem clicáveis, mas não abrem detalhe

**Reprodução:** abrir Biblioteca, pesquisar `Freud` e clicar no card `A Interpretação dos Sonhos`.

**Resultado observado:** o card aparenta ser acionável visualmente, inclusive com cursor de ponteiro, mas o clique não abre detalhe, leitura, progresso ou salvamento. A inspeção encontrou `DIV`/`P` sem `role`, `tabindex` ou semântica de botão. Artigos da mesma biblioteca, em contraste, são `button` com hint e abrem modal.

**Impacto:** a usuária não consegue descobrir o que fazer com parte importante do catálogo. A inconsistência entre livros e artigos cria uma expectativa quebrada e também impede navegação por teclado.

**Correção recomendada:** transformar cada card de livro em `<button>` ou em link semântico, com `aria-label`, foco visível e ação definida. Se o card não for interativo, remover o cursor de ponteiro e qualquer aparência de ação. O comportamento deve ser igual para livros, artigos e outros itens do catálogo. Evidência: [rodada 5][e4].

## 5. Problemas de interface, acessibilidade e entendimento

### 5.1. [P2] “Ver anotação” é texto sem controle interativo

Na aba `aulas & avaliações`, a aula salva aparece com o texto `ver anotação`, porém uma inspeção dos elementos `button`, `a` e `[role="button"]` não encontrou um controle correspondente. Também não foram encontrados controles visíveis de edição ou exclusão do registro. Isso cria uma ação prometida sem affordance funcional e torna difícil corrigir ou remover uma nota de aula depois de salva. Evidência: [rodada 19][e5].

A recomendação é abrir um detalhe ao clicar no cartão inteiro ou fornecer botões claros de `Ver`, `Editar` e `Excluir`, todos com semântica, foco e confirmação de exclusão.

### 5.2. [P2] Formulários vazios bloqueiam sem explicar o motivo

Foram testados formulários vazios de nova matéria, nova prova e novo atendimento de estágio. Em todos, o avanço permaneceu na etapa atual sem mensagem de erro visível ou indicação clara do campo obrigatório. O caminho preenchido funcionou, mas o caminho incompleto deixa a usuária sem diagnóstico.

A recomendação é renderizar mensagens inline junto ao campo obrigatório, usar `aria-invalid` e `aria-describedby`, destacar o primeiro erro e desabilitar o botão apenas quando isso for compreensível visualmente. A validação não deve depender somente de um bloqueio silencioso. Evidência: [rodadas 19, 20 e 21][e6].

### 5.3. [P2] Wizard de tarefa sem disciplina não oferece criação contextual

Quando não havia disciplinas cadastradas, o wizard informou `ainda não há disciplinas cadastradas`, mas não ofereceu um botão para criar uma disciplina naquele ponto. Foi possível continuar sem disciplina, o que evita o bloqueio total, porém a usuária precisa abandonar o fluxo e procurar outro módulo caso queira organizar o registro corretamente.

A recomendação é incluir `Criar disciplina` no próprio passo, abrir a criação em modal ou preservar os dados do wizard ao navegar para a criação de disciplina e retornar automaticamente.

### 5.4. [P2] Transformação de nota não confirma o resultado nem leva ao item criado

A nota transformada em tarefa desapareceu da lista e apareceu posteriormente na Home, comprovando que a conversão ocorreu. Entretanto, o fluxo retornou à lista de notas sem levar a usuária à tarefa criada nem mostrar um feedback de sucesso suficientemente claro. O resultado só foi localizado porque a auditoria procurou na Home.

A recomendação é exibir `Nota transformada em tarefa` com ação `Abrir tarefa`, ou navegar diretamente para o registro criado. A operação também deve ser idempotente e explicar se a nota original foi removida, arquivada ou mantida.

### 5.5. [P2] Reiniciar o timer apaga a sessão sem confirmação

O timer de foco permitiu pausar e retomar corretamente, mas o botão circular de reinício zerou imediatamente a sessão para `15:00`, sem confirmação. A ação pode ser intencional, mas é destrutiva para o progresso da sessão atual.

A recomendação é trocar o ícone por um botão com label `Reiniciar sessão`, pedir confirmação quando houver tempo transcorrido e preservar uma sessão interrompida no histórico ou explicar explicitamente que ela será descartada.

### 5.6. [P3] Pausa retorna ao rótulo “iniciar”, embora o comportamento seja retomar

Após pausar em `14:43`, o botão voltou a exibir `iniciar`, embora o clique seguinte tenha retomado corretamente em `14:43`. O texto superior também retornou a `pronto para começar`. Isso não quebra o funcionamento, mas cria uma expectativa errada e torna o estado da sessão ambíguo.

A recomendação é usar `Retomar` após a pausa e preservar uma indicação visual de que existe uma sessão pausada.

### 5.7. [P3] Permissões web aparecem como controles, mas estão desabilitadas

No onboarding web, os quatro switches de permissão foram encontrados com `disabled=true` e `aria-checked=false`. O texto explica que a disponibilidade é apenas no app nativo, portanto não foi classificado como defeito funcional. Mesmo assim, a aparência de controle pode levar a usuária a tentar interagir com algo que não está disponível na plataforma.

A recomendação é substituir o switch desabilitado por uma informação de plataforma, ou mostrar claramente `Disponível somente no aplicativo Android/iOS` sem aparência de ação.

## 6. Observações de conteúdo, performance e consistência

A Biblioteca carregou uma página muito longa, com milhares de pixels abaixo do viewport e um catálogo extenso. A busca por `Freud` funcionou, mas aparentou filtrar coleções inteiras, não necessariamente cada item exibido dentro delas; uma seção pode continuar mostrando autores que não correspondem diretamente ao termo pesquisado. Isso pode ser uma decisão de produto, mas a interface deveria comunicar se o filtro é por coleção ou por item.

A experiência visual é consistente e a maior parte dos fluxos tem linguagem clara, mas alguns módulos apresentam excesso de etapas para registros simples. O wizard de tarefa, prova, estágio e TCC é detalhado, o que é útil para organização acadêmica, porém aumenta o custo de interação. Recomenda-se manter as etapas para registros completos e oferecer um modo rápido para criar o item mínimo, permitindo completar os detalhes depois.

O servidor de desenvolvimento permaneceu saudável e respondeu com HTTP 200 durante os bloqueios do navegador. A inspeção do código não encontrou backend de domínio, APIs REST, GraphQL, WebSocket, Axios, Supabase ou Firebase. As interações observadas são persistidas localmente; a única referência de rede identificada foi a verificação do manifesto OTA em `src/lib/ota.ts`. Isso reduz a superfície de falha de rede, mas concentra o risco em `localStorage`, hidratação, migração, exportação/importação e sincronização entre telas.

## 7. O que funcionou bem

O onboarding do zero foi concluído com campos opcionais vazios e levou a uma Home utilizável. Tarefas podem ser criadas, concluídas e desfeitas com contadores coerentes. Flashcards podem ser criados, revisados e avaliados. Artigos possuem um modal funcional com salvar/remover e o estado salvo sobreviveu ao backup. A criação de disciplina, aula, prova, registro de estágio e TCC percorreu todas as etapas e atualizou os indicadores principais.

O backup foi baixado como JSON e a importação exibiu `backup restaurado com carinho ♡`. Depois da importação, as tarefas retornaram sem duplicação e o estado salvo do artigo permaneceu presente no armazenamento local. A disciplina e o TCC criados durante a rodada também demonstraram que os modelos de dados são capazes de sustentar fluxos acadêmicos relativamente ricos.

## 8. Plano de correção priorizado

| Prioridade | Entrega | Critério de aceite |
|---|---|---|
| P0 | Corrigir estado de resposta do quiz | Resposta errada mostra feedback, libera avanço e permite chegar ao resultado |
| P1 | Corrigir semântica de prazo ausente | “Sem prazo” permanece sem data na Home, filtros, backup e importação |
| P1 | Substituir confirmações nativas | Exemplos e reset abrem modal acessível, confirmam/cancelam e retornam feedback |
| P1 | Tornar cards de livros acionáveis | Clique, teclado e leitor de tela abrem o mesmo detalhe que artigos |
| P2 | Corrigir ações do diário de aulas | “Ver anotação”, editar e excluir são controles reais e testáveis |
| P2 | Adicionar validação inline | Cada etapa vazia informa o campo necessário e move o foco para o erro |
| P2 | Criar disciplina dentro do wizard | Usuária pode criar uma matéria sem perder os dados da tarefa/prova |
| P2 | Melhorar transformação de nota | Mostrar sucesso e oferecer “Abrir tarefa” após conversão |
| P2 | Proteger reinício do timer | Confirmar descarte quando houver tempo ou salvar sessão interrompida |
| P3 | Renomear estados do timer | Pausa mostra `Retomar` e estado pausado permanece explícito |
| P3 | Diferenciar controles nativos e web | Permissões indisponíveis aparecem como informação de plataforma |
| P3 | Definir estratégia de busca | Documentar ou ajustar se a busca é por item, coleção ou ambos |

## 9. Testes automatizados recomendados para evitar regressão

A suíte E2E deve incluir um cenário de resposta incorreta no quiz, um cenário de tarefa sem prazo, uma transformação de nota em tarefa, o fluxo completo de exportação/importação, os modais de reset e exemplos, a navegação por teclado nos cards da Biblioteca e as ações de editar/excluir anotação de aula. Cada teste deve capturar console errors, falhas de rede, screenshots no erro e o estado relevante do `localStorage`.

Também é recomendável adicionar testes de acessibilidade com foco em elementos semânticos, `aria-label`, `aria-invalid`, foco após erro, foco dentro de modais e ausência de controles visualmente clicáveis que não sejam `button`, `a` ou elementos equivalentes. Os testes devem rodar em viewport desktop e mobile, pois o projeto pretende atender web/PWA e app nativo.

## 10. Conclusão

O Cecistudy está em um estágio de protótipo avançado ou MVP funcional: há boa cobertura de produto, modelos ricos e vários fluxos completos, mas ainda existem falhas que impedem uma experiência confiável em cenários reais. O quiz travado e a semântica errada de prazo devem ser corrigidos antes de ampliar o catálogo ou investir em novas features. Em seguida, a prioridade deve ser tornar os elementos realmente interativos, substituir confirmações nativas por modais acessíveis e tornar validações e transformações observáveis.

A avaliação geral desta rodada é **“funcional, porém não pronto para uso confiável sem correções de fluxo”**. A aplicação não está quebrada de forma ampla; os problemas estão concentrados em alguns caminhos, mas esses caminhos afetam confiança, integridade dos dados e conclusão de tarefas importantes.

## Referências internas de evidência

[e1]: manual-findings.md#rodada-14--bloqueio-no-quiz-após-resposta-incorreta "Rodada 14 — bloqueio no quiz após resposta incorreta"
[e2]: manual-findings.md#rodada-3--wizard-de-tarefaprova "Rodadas 3 e 9 — prazo sem data"
[e3]: manual-findings.md#rodada-22--tcc-e-ações-destrutivas-de-dados "Rodadas 21 e 22 — ações destrutivas"
[e4]: manual-findings.md#rodada-5--cards-da-biblioteca "Rodada 5 — cards da Biblioteca"
[e5]: manual-findings.md#rodada-19--disciplina-criação-de-matéria-e-diário-de-aulas "Rodada 19 — diário de aulas"
[e6]: manual-findings.md#rodada-20--provas-e-avaliações "Rodadas 19, 20 e 21 — validação"
