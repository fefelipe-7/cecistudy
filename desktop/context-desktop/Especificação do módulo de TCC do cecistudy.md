# Especificação do módulo de TCC do cecistudy

**Status:** escopo conceitual fechado em conjunto.

**Produto:** cecistudy.

**Usuária de referência:** Ceci.

**Escopo:** sistema de projetos acadêmicos, pesquisa, escrita, referências, versões e produção de saídas universitárias configuráveis.

## 1. Visão do módulo

O módulo de TCC não será uma tela fixa de capítulos, uma lista de tarefas ou um editor Markdown com exportação. Ele será um sistema completo de **projetos acadêmicos configuráveis**, capaz de acompanhar pesquisa, organização, escrita, revisão, orientação, versões e produção de diferentes formatos de trabalho.

O TCC será um caso importante desse sistema, mas a arquitetura também deverá suportar artigo científico, iniciação científica, relatório de estágio, projeto de pesquisa, revisão bibliográfica, estudo de caso, apresentação acadêmica e outros trabalhos. O cecistudy não deve assumir que todo trabalho universitário possui a mesma estrutura.

O módulo terá duas dimensões inseparáveis:

| Dimensão | Responsabilidade |
|---|---|
| **Gestão acadêmica** | Projeto, tema, delimitação, problema, objetivos, metodologia, etapas, prazos, orientação, referências, versões, entregas e conformidade. |
| **Produção acadêmica** | Escrita autoral, documentos, capítulos, seções, citações, notas, tabelas, imagens, anexos, referências cruzadas e exportação. |

O Calendário será dono do tempo. A Base de Conhecimento será dona dos documentos, conceitos, relações e evidências gerais. O módulo de TCC será dono da organização da produção acadêmica, das saídas, das versões, da orientação e da configuração do trabalho.

## 2. Limite de projetos ativos

O cecistudy permitirá no máximo **cinco projetos ativos simultaneamente**, contando todos os projetos acadêmicos e de produção que utilizem esse sistema. O limite não será aplicado a projetos arquivados, concluídos ou preservados como histórico.

Cada projeto terá badges e identificadores visuais para facilitar a distinção entre TCC, artigo, iniciação científica, estágio, pesquisa, apresentação ou outro tipo configurado.

O limite é aplicado ao nível de projeto, não ao nível de saída. Um projeto pode gerar várias saídas sem consumir um novo slot ativo para cada uma.

## 3. Projeto, base de pesquisa e saída

O modelo conceitual será:

```text
Projeto
├── Identidade e configurações
├── Base de pesquisa
│   ├── Documentos
│   ├── Conceitos
│   ├── Referências
│   ├── Dados e evidências
│   └── Anexos
├── Estrutura acadêmica
├── Saídas
│   ├── TCC principal
│   ├── Artigo
│   ├── Apresentação
│   ├── Resumo expandido
│   └── outras produções
├── Orientação e revisão
├── Entregas e versões
└── Integrações
```

### Projeto

O projeto é o espaço de pesquisa, organização e produção. Ele possui identidade, tipo, status, badges, integrantes ou responsáveis quando necessário, configurações acadêmicas e vínculos com outros módulos.

### Base de pesquisa

A base de pesquisa reúne conteúdo reutilizável: documentos, notas, referências, conceitos, dados, anexos e evidências. Ela não pertence necessariamente a uma única saída. O mesmo conhecimento pode fundamentar o TCC, um artigo, uma apresentação ou um material de estudo.

### Saída

A saída é uma produção específica derivada do projeto. Ela possui árvore própria, seleção de conteúdo, ordem, perfil de formatação, regras de citação e formato de exportação.

Um mesmo projeto poderá produzir:

```text
Projeto de pesquisa
├── TCC principal
├── Artigo científico
├── Apresentação para banca
├── Resumo expandido
└── Material de estudo
```

A primeira experiência do produto poderá iniciar com uma saída principal para reduzir complexidade visual, mas o modelo de dados e os serviços devem suportar múltiplas saídas desde o início.

## 4. Tipos de projeto e modelos iniciais

O cecistudy oferecerá modelos previstos antes da criação, mas também permitirá começar livremente.

Um modelo poderá definir uma sugestão de árvore, campos iniciais, elementos acadêmicos, perfil de citação, checklist e configuração de exportação. A usuária poderá alterar tudo depois.

Exemplos de modelos iniciais:

| Modelo | Estrutura sugerida |
|---|---|
| TCC monográfico | Elementos pré-textuais, introdução, referencial, metodologia, resultados, discussão, conclusão e pós-textuais. |
| Artigo científico | Resumo, introdução, método, resultados, discussão e referências. |
| Revisão bibliográfica | Questão, estratégia de busca, seleção de estudos, síntese e discussão. |
| Estudo empírico | Problema, hipóteses, método, participantes, instrumentos, análise, resultados e limitações. |
| Estudo de caso | Contexto, fundamentação, descrição do caso, análise, discussão e conclusão. |
| Relatório de estágio | Contexto, objetivos, atividades, reflexões, supervisão, resultados e anexos. |
| Projeto livre | Árvore vazia ou estrutura mínima configurável pela usuária. |

Os modelos são pontos de partida, não contratos. A Ceci poderá adicionar, remover, renomear, reorganizar, duplicar, ocultar ou tornar opcionais elementos da árvore.

## 5. Árvore acadêmica configurável

Todo projeto e toda saída terão uma **árvore acadêmica configurável**. Não haverá um conjunto fixo obrigatório de capítulos, nem mesmo no TCC.

A árvore poderá conter:

```text
Projeto / Saída
├── Elementos pré-textuais
├── Capítulos
│   ├── Seções
│   │   ├── Subseções
│   │   │   └── Documentos e blocos de escrita
├── Elementos textuais
├── Elementos pós-textuais
└── Elementos opcionais
```

Um capítulo ou seção poderá ser composto por um documento único, vários documentos menores ou uma composição de blocos. Isso permite escrever uma seção diretamente, dividir a pesquisa em documentos menores ou reutilizar material da Base de Conhecimento.

### Elementos acadêmicos previstos

A lista de elementos inicialmente considerada é ampla e será organizada em três grupos para evitar que todos se tornem obrigatórios.

| Grupo | Elementos |
|---|---|
| **Núcleo recorrente** | Tema, delimitação do tema, problema de pesquisa, hipótese ou questão norteadora, objetivo geral, objetivos específicos, justificativa, introdução, referencial teórico, metodologia, resultados, discussão e conclusão/considerações finais. |
| **Condicionais ao tipo de pesquisa** | Revisão de literatura/estado da arte, tipo de pesquisa, campo/contexto, participantes/amostra, instrumentos de coleta, procedimentos de coleta, análise de dados, aspectos éticos, análise dos resultados, limitações e contribuições. |
| **Pré e pós-textuais configuráveis** | Resumo, palavras-chave, abstract, keywords, referências, apêndices, anexos, glossário, lista de abreviaturas e siglas, lista de figuras, lista de tabelas, lista de gráficos, lista de quadros, cronograma e orçamento. |

A árvore deve permitir marcar cada elemento como obrigatório, recomendado, opcional, oculto ou não aplicável ao projeto. A validação de conformidade utilizará essa configuração, e não uma lista universal fixa.

## 6. Operações de composição entre documentos e projetos

O “mixar páginas” será tratado como um conjunto de operações explícitas, porque cada uma possui uma consequência diferente para autoria, atualização e histórico.

| Operação | Comportamento |
|---|---|
| **Referenciar** | A saída exibe ou utiliza um documento/bloco de outro projeto, mantendo uma única origem editável. Atualizações na origem podem ser sinalizadas como disponíveis. |
| **Duplicar** | Cria uma cópia independente, preservando origem, data e histórico da duplicação. Alterações futuras não se propagam automaticamente. |
| **Incorporar** | Move ou vincula o conteúdo à saída atual, mantendo a origem e as relações anteriores no histórico. A partir da incorporação, o conteúdo pode ser editado no contexto da saída. |

Essas operações poderão ocorrer em nível de documento, seção ou bloco. A seleção de conteúdo não ficará limitada a documentos inteiros.

## 7. Modelo interno de documentos

O cecistudy terá um modelo interno canônico para representar documentos acadêmicos. DOCX, Markdown e LaTeX não serão fontes independentes e incompatíveis; serão modos de edição ou formatos de importação/exportação conectados ao modelo interno.

O modelo deverá representar, entre outros elementos:

- texto e parágrafos;
- headings e hierarquia;
- estilos acadêmicos;
- listas numeradas e não numeradas;
- tabelas;
- imagens e legendas;
- figuras, gráficos e quadros;
- citações e referências;
- notas de rodapé;
- links e referências cruzadas;
- equações;
- blocos de código;
- anexos;
- comentários;
- metadados de origem;
- histórico e versionamento.

O documento interno será a fonte de estrutura para vínculos com projetos, capítulos, referências, conceitos, comentários, versões e saídas.

## 8. Editor visual acadêmico

O editor visual será o modo principal de escrita e deverá ser muito próximo do Microsoft Word, especialmente porque trabalhos universitários dependem de regras críticas de formatação.

A primeira experiência deverá começar com layout paginado, incluindo:

- páginas visíveis;
- margens;
- orientação e tamanho de página;
- cabeçalho e rodapé;
- numeração de páginas;
- quebras de página e de seção;
- estilos de parágrafo;
- fonte, tamanho e espaçamento;
- alinhamento e recuos;
- títulos numerados;
- sumário;
- tabelas;
- imagens e legendas;
- citações;
- notas de rodapé;
- referências cruzadas;
- comentários;
- pré-visualização de impressão.

As melhorias sobre o Word virão da integração com a árvore acadêmica, navegação estrutural, referências, Base de Conhecimento, Calendário, orientação, versões e múltiplas saídas. O editor não deverá perder a familiaridade de uma ferramenta de texto tradicional em nome de uma interface experimental.

### Modos de edição

| Modo | Uso |
|---|---|
| **Visual paginado** | Modo principal para a escrita acadêmica cotidiana. |
| **Markdown** | Modo alternativo para edição textual e portabilidade, previsto na arquitetura e expandido após a prioridade inicial do DOCX. |
| **LaTeX** | Modo alternativo para documentos ou blocos que exigem controle técnico, equações e código. |
| **Pré-visualização** | Conferência do resultado conforme o perfil da saída antes da exportação. |

Equações e trechos de código estarão disponíveis no modo LaTeX, conforme a decisão de escopo. O editor visual poderá exibir o resultado renderizado desses elementos, mas a edição especializada ficará vinculada ao modo LaTeX.

## 9. DOCX como prioridade de interoperabilidade

DOCX será o primeiro formato prioritário de importação e exportação, antes de Markdown e LaTeX. A conversão deverá buscar alta fidelidade de conteúdo, estrutura e estilos.

Na importação, o cecistudy deverá tentar preservar:

- estilos personalizados;
- títulos e hierarquia;
- tabelas;
- imagens;
- cabeçalhos e rodapés;
- notas de rodapé;
- sumário;
- comentários;
- quebras e seções;
- numeração;
- referências cruzadas;
- metadados reconhecíveis.

Quando algum elemento não puder ser representado completamente pelo modelo interno, o sistema deverá preservar o máximo possível, marcar o elemento como parcialmente estruturado e informar a limitação. A conversão não pode falhar silenciosamente.

## 10. Round-trip com edição externa

O DOCX exportado poderá ser aberto e editado em outro programa, como Microsoft Word ou editor compatível, e depois reimportado no cecistudy.

O fluxo será:

```text
Documento interno v1
        ↓ exportar DOCX
Edição externa
        ↓ importar
Versão externa candidata v2
        ↓ comparação detalhada
Aceitar, revisar ou descartar
```

A edição externa nunca será incorporada silenciosamente. O arquivo retornado será tratado como uma nova versão candidata. O cecistudy deverá mostrar comparação detalhada antes da aceitação, preservando o histórico e permitindo decisão explícita.

Identificadores e metadados exportados deverão ser utilizados, quando possível, para reconhecer documentos, seções e elementos. Conflitos entre alterações internas e externas também deverão ser apresentados para revisão.

## 11. Exportação por saída

Cada saída terá um perfil de exportação próprio. O sistema perguntará como a Ceci deseja exportar e apresentará somente formatos compatíveis com o tipo de conteúdo.

| Saída | Formatos possíveis |
|---|---|
| TCC ou artigo | DOCX, PDF, Markdown, LaTeX e outros formatos textuais compatíveis. |
| Resumo | DOCX, PDF, Markdown ou formato textual compatível. |
| Apresentação | PPTX, slides ou formato visual compatível, quando o modelo da saída suportar isso. |
| Material de estudo | Documento, PDF ou formato definido pelo tipo de material. |

Um documento textual não oferecerá PPTX como opção inadequada, e uma apresentação não será tratada como um documento de texto comum. A compatibilidade será determinada pelo tipo e pelo perfil da saída.

## 12. Referências e citações

O cecistudy terá uma biblioteca global de referências e seleções específicas por projeto e por saída. Uma mesma referência não será duplicada apenas porque foi utilizada em trabalhos diferentes.

A entrada de referências poderá ocorrer por:

- cadastro manual;
- DOI;
- ISBN;
- URL;
- BibTeX;
- RIS;
- importação de arquivos;
- identificadores de bases acadêmicas;
- dados fornecidos pela Ceci para normalização.

O sistema deverá suportar citações diretas e indiretas, citações com página ou outro localizador, notas de rodapé, referências cruzadas e geração automática da lista bibliográfica.

ABNT será o perfil inicial prioritário. APA, Vancouver, Chicago e perfis personalizados deverão ser suportados posteriormente, mantendo o estilo separado da estrutura do projeto.

A referência poderá conter metadados bibliográficos, fonte original, arquivo ou link, notas da Ceci, conceitos relacionados, trechos destacados e relações com documentos ou blocos do TCC.

## 13. Orientação e revisão

A camada de orientação entrará após o MVP, mas sua estrutura deverá ser prevista desde o início. Ela poderá registrar:

- reuniões com orientador;
- decisões;
- comentários gerais;
- solicitações;
- pendências;
- próximos passos;
- comentários vinculados a documento, seção, bloco ou trecho;
- estados `aberto`, `em análise`, `resolvido` e `arquivado`.

Uma solicitação do orientador poderá gerar uma etapa ou responsabilidade no Calendário, mas somente após confirmação da Ceci. O Calendário continuará sendo dono do prazo e do tempo; o TCC continuará sendo dono da solicitação e do contexto acadêmico.

## 14. Versões e histórico

O sistema separará três níveis:

| Tipo | Função |
|---|---|
| **Autosave técnico** | Recuperação frequente e proteção contra perda de conteúdo. |
| **Histórico recuperável** | Registro de alterações para comparação e restauração. |
| **Versão nomeada** | Marco intencional, como “versão enviada ao orientador”, “pré-banca” ou “versão final”. |

Exportações também deverão ser registradas, incluindo formato, perfil utilizado, data e documento de origem. Importações externas entrarão como versões candidatas até serem aceitas após comparação.

## 15. Conformidade universitária

A conformidade será configurável por instituição, curso, tipo de trabalho, projeto ou saída. O perfil poderá definir:

- elementos obrigatórios;
- ordem da árvore;
- estilos;
- margens;
- fonte;
- espaçamento;
- paginação;
- capa;
- folha de rosto;
- sumário;
- citações;
- referências;
- listas;
- anexos;
- regras de exportação;
- checklist de entrega.

A validação funcionará como diagnóstico não bloqueante. O cecistudy apontará erros, avisos, itens ausentes e elementos não verificados, mas não impedirá a Ceci de escrever ou exportar. A universidade e o curso continuam sendo a autoridade final sobre a aceitação do trabalho.

## 16. Integração com a Base de Conhecimento

O TCC poderá usar conteúdo da Base de Conhecimento em três formas:

| Forma | Comportamento |
|---|---|
| **Referência viva** | Aponta para documento ou bloco original e acompanha novas versões disponíveis. |
| **Snapshot** | Registra a versão específica usada em determinado momento. |
| **Cópia editorial** | Incorpora o conteúdo à saída, permitindo edição local e preservando a origem. |

Um projeto poderá selecionar documentos inteiros ou blocos específicos. Quando um documento ou conceito vinculado for alterado, o sistema deverá avisar que existe uma nova versão, sem alterar automaticamente o texto já escrito na saída.

A visão de impacto deverá mostrar onde um conceito, referência, documento ou bloco é utilizado em capítulos, saídas, tarefas, materiais de estudo e outros módulos.

## 17. Integração com o Calendário

O TCC poderá gerar marcos, responsabilidades, etapas e blocos de planejamento, como:

- buscar referências;
- ler artigos;
- escrever uma seção;
- revisar um capítulo;
- reunir-se com o orientador;
- preparar apresentação;
- enviar uma versão;
- cumprir uma entrega institucional.

Esses itens só entrarão no Calendário após confirmação quando forem sugestões ou solicitações. O TCC define a natureza e o conteúdo da etapa; o Calendário define tempo, prazo, ocorrência, planejamento e execução.

## 18. Integração com Estudos

O TCC poderá gerar materiais de estudo opcionais a partir de conceitos, referências, capítulos e questões de pesquisa. Exemplos incluem:

- perguntas de recuperação;
- flashcards;
- sessões de revisão;
- perguntas de banca;
- exercícios de explicação;
- revisão de conceitos fundamentais.

A geração será opcional e não obrigará a Ceci a usar o módulo Estudos. Estudos continuará sendo dono da fila de revisão, das sessões, do histórico pedagógico e do estado de aprendizagem.

## 19. Integração com IA

A IA será desligada por padrão e poderá ser ativada por projeto e por função. O princípio aprovado é que ela poderá ter acesso ao conjunto amplo de conteúdo do cecistudy, e não apenas ao projeto atual, mas os detalhes de contexto, segurança, seleção de fontes, Knowledge Packets, permissões e comportamento dos agentes serão definidos futuramente durante o desenvolvimento.

Funções possíveis incluem:

- localizar relações entre capítulos e conhecimento existente;
- apontar lacunas;
- revisar coerência entre problema, objetivos e metodologia;
- comparar versões;
- sugerir perguntas de banca;
- transformar orientação confirmada em etapas;
- detectar referências possivelmente não utilizadas;
- apoiar a revisão formal;
- gerar materiais de estudo opcionais.

A IA não terá autorização implícita para substituir a autoria da Ceci nem alterar o texto sem confirmação explícita.

## 20. MVP do módulo de TCC

As fases 1 a 5 formarão o MVP:

| Fase | Entrega |
|---:|---|
| 1 | Projetos, tipos, badges, limite de cinco ativos e árvores configuráveis. |
| 2 | Modelo interno de documentos, seções, blocos, origem, composição e versões. |
| 3 | Editor visual acadêmico paginado próximo ao Word. |
| 4 | Biblioteca de referências, citações e perfil ABNT inicial. |
| 5 | Importação e exportação DOCX com round-trip e comparação detalhada. |

O MVP deverá oferecer uma experiência completa para **uma saída principal**, mesmo que a arquitetura de múltiplas saídas já esteja presente. Markdown e LaTeX serão previstos no modelo, mas ficarão depois da prioridade DOCX.

## 21. Pós-MVP

Depois do MVP, entram as camadas que transformarão o editor em um sistema acadêmico completo:

1. orientação, comentários em trechos e solicitações;
2. integrações profundas com Calendário, Base de Conhecimento e Estudos;
3. múltiplas saídas plenamente expostas na interface;
4. Markdown e LaTeX como modos de edição mais completos;
5. perfis de citação adicionais e estilos personalizados avançados;
6. IA assistiva por projeto e função;
7. visão de impacto e análise de dependências;
8. colaboração ou recursos avançados de controle de alterações, caso sejam necessários.

## 22. Critérios de sucesso do MVP

O MVP será considerado funcional quando a Ceci conseguir:

- criar um projeto acadêmico a partir de modelo ou em modo livre;
- configurar sua árvore acadêmica;
- criar uma saída principal;
- adicionar e organizar documentos e seções;
- escrever em editor visual paginado;
- utilizar estilos acadêmicos;
- inserir referências e citações;
- gerar bibliografia conforme o perfil ABNT inicial;
- exportar um DOCX compatível;
- abrir e editar o DOCX em outro programa;
- importar o DOCX alterado;
- visualizar uma comparação detalhada;
- aceitar ou rejeitar a nova versão sem perder o histórico;
- receber diagnósticos de conformidade sem bloqueio;
- manter a estrutura preparada para múltiplas saídas futuras.

## 23. Decisões técnicas ainda abertas

O escopo de produto está fechado, mas algumas decisões de implementação permanecem abertas:

1. biblioteca ou engine do editor visual paginado;
2. modelo interno exato para documentos, estilos e layout;
3. estratégia de conversão e reconciliação DOCX;
4. preservação de controle de alterações e comentários nativos do Word;
5. engine de citações e estilos bibliográficos;
6. mecanismo de comparação entre versões;
7. estratégia de geração de DOCX e PDF;
8. forma de armazenamento de arquivos e anexos;
9. sincronização do documento interno entre desktop e mobile;
10. forma de representar referências cruzadas e identificadores invisíveis no DOCX;
11. momento de introduzir Markdown e LaTeX completos;
12. requisitos de desempenho para documentos longos.

Essas decisões não alteram o modelo de produto aprovado. Elas devem ser escolhidas durante a arquitetura técnica e prototipação do editor.

## Conclusão

O módulo de TCC do cecistudy será um sistema de produção acadêmica configurável, com até cinco projetos ativos, múltiplas saídas previstas, árvore acadêmica livre, editor visual paginado próximo ao Word, interoperabilidade prioritária com DOCX, referências estruturadas, versões, conformidade ajustável e integrações progressivas com o restante do cecistudy.

A primeira entrega não tentará expor toda a complexidade final. Ela entregará uma saída acadêmica completa e confiável, enquanto a arquitetura preservará desde o início a possibilidade de gerar artigos, apresentações, resumos e outras produções a partir da mesma base de pesquisa.
