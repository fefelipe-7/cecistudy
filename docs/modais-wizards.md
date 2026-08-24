# Revisão de modais, wizards, pickers e seletores do Cecistudy

## Objetivo

Esta especificação revisa a camada de interação do Cecistudy: modais, bottom sheets, wizards, pickers, grupos de seleção, campos de tags, formulários e o menu universal aberto por pressão prolongada. O objetivo é reduzir fricção, eliminar decisões repetidas e transformar o menu atual de “editar/excluir” em uma **central contextual de próxima ação**.

> **Princípio central:** o modal de pressão prolongada não deve ser apenas um menu administrativo. Ele deve responder: **“qual é a ação mais útil que posso fazer agora com este item?”**. Editar e excluir continuam disponíveis, mas deixam de ser as únicas ações.

A proposta preserva os fluxos existentes e evita criar um modal diferente para cada entidade. A solução deve ter um **shell visual único**, uma definição de ações por tipo de dado e pequenas ações rápidas que abrem campos inline ou um fluxo existente pré-preenchido.

## 1. Inventário atual

### 1.1 Modais e sheets

| Componente | Função atual | Avaliação |
|---|---|---|
| `Modal` | Primitiva compartilhada para overlay, animação, fechamento e posições | Manter como base, mas reforçar acessibilidade, foco, altura e comportamento de sheet |
| `ManageDataModal` | Menu universal de editar/excluir por long-press/clique direito | Manter e ampliar com ação recomendada por tipo |
| `GlobalSearchModal` | Busca global e navegação para item/seção | Manter, simplificar resultados e adicionar ação contextual |
| `QuickAddModal` | Entrada de “novo registro”/atalhos | Manter, mas reduzir a quantidade inicial de escolhas |
| `ClassNoteModal` | Visualização de anotação de aula | Manter temporariamente; avaliar substituição por detalhe/sheet consistente |
| `EditCourseModal` | Criar/editar matéria | Manter e usar o mesmo formulário nos dois casos |
| `BookDetailModal` | Detalhe de livro, salvamento e progresso | Manter; adicionar ação rápida de progresso de leitura |
| `ArticleDetailModal` | Detalhe de artigo, link, cópia e salvamento | Manter; alinhar estrutura ao detalhe de livro |
| `LibraryFilterModal` | Filtros do catálogo | Manter como sheet com busca e resumo de filtros |
| `ReaderModeModal` | Leitura, páginas, fonte, marcador e navegação | Manter; transformar em modo de leitura mais imersivo |
| `OtaUpdateModal` | Atualização técnica do app | Manter separado da experiência de estudo |
| `ManageDataModal` para dados | Excluir com aviso de cascata | Manter, mas com confirmação em duas etapas e impacto explícito |
| `EditTccModal` | Edição completa do TCC | Manter, mas migrar para wizard ou seções colapsáveis se crescer mais |
| `DetailPromptModal` | Pergunta após salvar anotação de aula | Manter apenas se não interromper a captura; tornar dispensável |

### 1.2 Wizards atuais

| Wizard | Complexidade percebida | Recomendação |
|---|---:|---|
| `CourseWizard` | Baixa/média | Manter como fluxo curto de matéria |
| `TaskExamWizard` | Alta, com bifurcação tarefa/prova | Manter a bifurcação, mas escolher o tipo antes e eliminar passos que não se aplicam |
| `FlashcardWizard` | Média | Manter; tornar pergunta/resposta o núcleo e relações opcionais |
| `ReadingWizard` | Média | Manter; separar cadastro de leitura de progresso posterior |
| `SessionWizard` | Baixa | Manter como fluxo de dois passos ou sheet expandido |
| `InternshipWizard` | Muito alta, cerca de 596 linhas | Manter o domínio, dividir em etapas essenciais e avançadas |
| `AuthorWizard` | Média | Manter; campos opcionais progressivos |
| `ConceptWizard` | Média | Manter; usar criação rápida a partir de outros contextos |
| `MaterialWizard` | Baixa/média | Manter; reduzir tags e metadados iniciais |
| `ClassNoteDetailWizard` | Cinco etapas | Manter, reduzir para três etapas |
| `NoteDetailWizard` | Identificação, vínculos e revisão | Manter, mas deixar vínculos para depois do salvamento |
| `NoteTransformWizard` | Muito alta; oito destinos possíveis | Manter, mas apresentar três destinos principais e “mais opções” |
| `WizardScaffold` | Barra fixa, headline, avanço/volta, animações | Manter como shell, corrigir validação, teclado, progresso e saída |

## 2. Problemas transversais de usabilidade

### 2.1 O sistema atual mistura três padrões de superfície

Hoje existem modal central, bottom sheet e tela inteira com aparência de wizard. Isso é aceitável quando cada padrão tem uma função clara, mas atualmente a mesma decisão pode aparecer em todos eles. O usuário pode escolher uma disciplina em um picker dentro de um wizard, abrir outro modal para criar a disciplina e retornar ao wizard, ou segurar um item e ser levado a outro fluxo ainda diferente.

A regra recomendada é:

| Situação | Superfície correta |
|---|---|
| Decisão simples com até oito opções | Bottom sheet curto ou seleção inline |
| Busca em lista grande | Bottom sheet com busca |
| Edição rápida de uma propriedade | Sheet contextual com campo inline |
| Criação/edição de entidade com vários campos | Wizard em tela inteira |
| Confirmação destrutiva | Modal central ou sheet com confirmação explícita |
| Leitura/visualização extensa | Tela ou modo imersivo, não modal pequeno |
| Atualização técnica | Modal dedicado, fora do fluxo acadêmico |

### 2.2 O `Modal` deve ser uma primitiva realmente robusta

O `Modal` compartilhado deve receber e aplicar um contrato consistente:

| Requisito | Comportamento desejado |
|---|---|
| Fechamento | Botão visível, toque fora quando seguro, tecla Escape no web e voltar nativo |
| Foco | Foco inicial no título/primeira ação; foco retorna ao disparador ao fechar |
| Acessibilidade | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e descrição quando necessário |
| Scroll | Apenas o corpo rola; cabeçalho e ações permanecem estáveis |
| Teclado mobile | O conteúdo sobe sem esconder o campo ativo; footer não cobre input |
| Altura | `max-height` previsível, com safe area e handle de sheet |
| Ação destrutiva | Nunca ficar lado a lado com ação primária sem diferenciação clara |
| Estado de carregamento | Botão mostra progresso e impede duplo envio |
| Alterações não salvas | Fechar pergunta somente quando houver conteúdo alterado |
| Animação | Entrada curta, sem deslocar o foco ou causar salto de layout |

O botão “voltar” dos sheets deve ter função clara. Em um modal de seleção, ele fecha. Em um wizard, ele volta uma etapa. Em um modal de gestão, ele retorna à lista de ações. O texto e o ícone devem refletir isso.

## 3. Novo modal de pressão prolongada

### 3.1 Nome e propósito

O componente pode continuar se chamando `ManageDataModal` internamente, mas na interface deve ser tratado como **ações do item**. O cabeçalho atual “o que você quer fazer com este registro?” é bom e pode ser preservado, porém o conteúdo deve ser reorganizado em três níveis:

1. **Ação recomendada**, específica para o tipo e para o estado atual do item.
2. **Ações comuns**, como abrir, editar, duplicar ou marcar como concluído.
3. **Ação destrutiva**, sempre separada e visualmente inferior.

A ação recomendada não deve ser escolhida somente pelo tipo. Ela deve considerar também o estado do registro. Um livro não lido recebe “começar leitura”; um livro em andamento recebe “adicionar páginas lidas”; um livro concluído recebe “reabrir leitura” ou “ver resumo”. Uma tarefa pendente recebe “marcar como concluída”; uma tarefa concluída recebe “reabrir tarefa”.

### 3.2 Hierarquia visual proposta

```text
[ícone] livro
       O cérebro e o inconsciente
       em andamento · 42 de 180 páginas

[ação recomendada destacada]
[ BookOpen ] adicionar páginas lidas
            registrar seu avanço nesta leitura

[ações comuns]
[ Abrir detalhe ]
[ Editar leitura ]
[ Guardar/remover dos salvos ]

[mais ações]
[ excluir leitura ]

[fechar]
```

A ação recomendada deve usar a cor acadêmica ou de marca, mas não a mesma aparência da exclusão. Ela pode ter uma descrição de uma linha e, quando possível, uma consequência imediata. A ação de excluir deve ficar no final, com separador e cor de perigo.

### 3.3 Contrato de dados recomendado

A lógica deve sair do JSX do modal e ser descrita por uma função pura, por exemplo:

```ts
type ContextAction = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  tone: 'primary' | 'neutral' | 'danger';
  recommended?: boolean;
  run: () => void;
};

type ManagedItemContext = {
  kind: ManagedItemKind;
  id: string;
  name: string;
  status?: string;
  meta?: string;
  actions: ContextAction[];
  recommendedAction?: ContextAction;
};
```

A função `getRecommendedAction(kind, id, ctx)` deve ser pura ou quase pura, testável com entidades em vários estados. O modal apenas renderiza o resultado. Dessa forma, novos tipos podem ser adicionados sem criar dezenas de condicionais de apresentação.

### 3.4 Matriz de ações recomendadas

| Tipo de dado | Estado | Ação recomendada | Resultado |
|---|---|---|---|
| Livro/leitura | Não iniciado | **começar leitura** | Abre detalhe/leitor na primeira página |
| Livro/leitura | Em andamento | **adicionar páginas lidas** | Abre stepper ou input de páginas |
| Livro/leitura | Concluído | **ver leitura concluída** | Abre detalhe com progresso e marcador |
| Artigo | Salvo | **abrir artigo** | Abre detalhe e link |
| Artigo | Não salvo | **guardar artigo** | Salva e confirma por toast |
| Tarefa | Pendente | **marcar como concluída** | Alterna estado e fecha modal |
| Tarefa | Concluída | **reabrir tarefa** | Alterna estado e fecha modal |
| Prova | Pendente | **marcar como concluída** | Alterna estado |
| Prova | Concluída | **reabrir prova** | Alterna estado |
| Flashcard | Vencido | **revisar agora** | Abre Estudos/Revisar com o cartão na fila |
| Flashcard | Não vencido | **ver flashcard** | Abre detalhe ou revisão individual |
| Sessão de foco | Registrada | **ver no histórico** | Abre detalhe do histórico |
| Sessão ativa | Em andamento | **retomar foco** | Retorna ao timer preservando o tempo |
| Aula | Registrada | **continuar anotação** | Abre detalhe da aula para completar campos |
| Aula | Completa | **revisar anotação** | Abre detalhe em modo leitura |
| Matéria | Ativa | **adicionar registro** | Abre menu contextual de aula/prova/tarefa/leitura |
| Matéria | Sem registros | **adicionar primeiro registro** | Abre captura contextual |
| Nota avulsa | Não transformada | **transformar em tarefa** | Atalho para conversão mais comum |
| Nota avulsa | Com conteúdo longo | **continuar editando** | Abre edição da nota |
| Conceito | Existente | **criar flashcard** | Abre FlashcardWizard com conceito pré-selecionado |
| Autor | Existente | **ver conceitos relacionados** | Navega para filtro do autor |
| Material | Existente | **abrir link/material** | Abre detalhe ou link |
| Registro de estágio | Recente/incompleto | **continuar registro** | Abre edição no ponto necessário |
| TCC | Ativo | **atualizar capítulo** | Abre TCC com capítulos em foco |
| Quiz concluído | Histórico | **revisar erros** | Abre resumo/questões erradas |

O exemplo pedido — segurar um livro para adicionar páginas — deve ser a primeira implementação porque demonstra claramente o valor do novo padrão. O modal deve mostrar o progresso atual e oferecer um controle rápido:

```text
páginas lidas
[ − ] 42 [ + ]

ou digite a nova página: [ 48 ]

[guardar progresso]
```

O sistema deve validar que a página não seja menor que a atual e não ultrapasse o total. Se o total for desconhecido, o campo pode aceitar qualquer valor não negativo e oferecer “marcar como concluído”.

### 3.5 Ações que devem ser comuns

Nem todo tipo precisa de todas as ações. A ordem recomendada é:

| Ordem | Ação | Quando aparece |
|---:|---|---|
| 1 | Ação recomendada | Sempre que houver uma ação de alto valor e baixo esforço |
| 2 | Abrir/ver detalhe | Quando existe detalhe dedicado |
| 3 | Editar | Quando o tipo é editável |
| 4 | Duplicar/converter/relacionar | Somente quando fizer sentido para o tipo |
| 5 | Excluir | Sempre que permitido, isolada no rodapé |

“Editar” não deve ocupar o primeiro lugar automaticamente. A usuária que segura uma tarefa geralmente quer concluí-la; quem segura um livro em andamento provavelmente quer atualizar páginas; quem segura um conceito pode querer criar um flashcard.

### 3.6 Pressão prolongada e descoberta

Long-press é uma interação pouco descoberta. O app deve manter o gesto, mas não depender exclusivamente dele. Cada card importante deve oferecer um menu discreto de três pontos ou uma ação secundária acessível. O gesto pode abrir o mesmo modal, enquanto o menu explícito aumenta a encontrabilidade.

No primeiro uso, pode haver um hint não bloqueante: “segure um item para ver ações rápidas”. Não mostrar esse hint repetidamente. No desktop, clique direito e menu explícito devem abrir a mesma experiência.

## 4. Pickers e seletores

### 4.1 Picker de seleção única

O `Picker` atual usa um botão que abre uma lista em bottom sheet, com estado selecionado e mensagem vazia. É uma boa primitiva, mas precisa evoluir em quatro pontos: busca, criação inline, descrição das opções e seleção de valores longos.

| Situação | Melhoria |
|---|---|
| Até 6 opções | Mostrar opções diretamente em cards/pills, sem abrir outra camada |
| 7–20 opções | Bottom sheet com lista e busca opcional |
| Mais de 20 opções | Busca focada, agrupamento e recentes |
| Lista vazia | Mostrar motivo e CTA para criar o item relacionado |
| Opção selecionada | Mostrar label e, se útil, metadado secundário |
| Opções longas | Permitir duas linhas; não cortar informação essencial |
| Seleção opcional | Ter uma opção explícita “sem vínculo”/“limpar seleção” |
| Campo obrigatório | Mostrar marcador e mensagem de erro próxima ao campo |
| Criação contextual | Botão “+ criar matéria” no rodapé da sheet, retornando a seleção |

O caso de tarefa sem disciplinas cadastradas é especialmente importante. Em vez de apenas “ainda não há disciplinas cadastradas”, o picker deve oferecer **“criar matéria agora”**. Esse fluxo abre o formulário mínimo de matéria, salva e devolve a nova matéria já selecionada ao wizard original.

### 4.2 Picker com busca

Para autores, conceitos, materiais, cursos e abordagens, o picker deve ter:

```text
[ buscar por nome... ]
recentes
  Psicologia Social
  Melanie Klein

todos
  ...

[ + criar novo ]
```

A busca deve filtrar os itens individualmente, não apenas manter uma coleção ampla visível. O resultado deve mostrar o tipo ou contexto quando houver nomes semelhantes.

### 4.3 Seleção múltipla

`PillGroupMulti` é adequado para poucos itens, mas não escala para listas grandes. A recomendação é alternar automaticamente de pills para picker com busca quando houver mais de oito opções. As seleções devem aparecer como chips removíveis acima da lista, com contador:

```text
3 selecionados · limpar tudo
[psicanálise ×] [vínculo ×] [ansiedade ×]
```

Não fazer a pessoa percorrer uma longa grade para descobrir o que foi selecionado. O botão de confirmar deve informar a quantidade selecionada e permanecer fixo quando a lista for longa.

### 4.4 ChoiceCardGrid

`ChoiceCardGrid` funciona bem para decisões com significado visual, como prioridade, categoria, tipo de material ou tipo de estágio. Não deve ser usado para opções que poderiam ser uma lista compacta.

| Usar ChoiceCardGrid | Usar Picker/lista |
|---|---|
| 2–5 opções | Mais de 5 opções |
| Opções com ícone, cor ou descrição | Opções textuais simples |
| Decisão de alto nível | Seleção de entidade existente |
| Tipo de registro | Autor, disciplina, conceito ou material |

Cada card deve apresentar estado selecionado de forma redundante: cor, borda, ícone de check e texto acessível. Não depender apenas da mudança de fundo.

### 4.5 TagField

O `TagField` deve transformar texto em tag com Enter, vírgula ou botão “adicionar”. As tags precisam ser editáveis e removíveis por teclado. O placeholder deve deixar claro se a pessoa está adicionando uma tag ou selecionando uma entidade existente. Quando a informação já existe como conceito/autor/abordagem, priorizar seleção de entidade em vez de criar tags concorrentes.

### 4.6 DateInput, TimeInput e NumberInput

Os campos nativos são simples, mas precisam de tratamento de contexto:

| Campo | Melhoria |
|---|---|
| Data | Oferecer “hoje”, “amanhã”, “sem data” e data personalizada; nunca preencher hoje silenciosamente |
| Hora | Mostrar exemplos de horário e respeitar formato local |
| Número | Validar limites inline, mostrar unidade e não começar com valor potencialmente enganoso |
| Páginas | Mostrar página atual/total e impedir avanço acima do total |
| Duração | Iniciar vazio ou com valor explicitamente sugerido; não assumir quatro horas no estágio sem explicação |

## 5. Revisão dos wizards

### 5.1 WizardScaffold

O `WizardScaffold` já oferece headline por passo, animação, botão fixo, continuar, voltar e salvar. Deve continuar sendo a espinha dorsal, com as seguintes alterações:

| Elemento atual | Alteração |
|---|---|
| Headline grande | Manter, mas usar uma pergunta curta e concreta |
| Indicador de etapa | Adicionar “2 de 4” ou barra de progresso discreta |
| Botão continuar | Manter; desabilitado somente quando houver motivo explicado |
| Botão cancelar/voltar | Separar visualmente cancelamento de retorno |
| Validação | Exibir erro inline e rolar/focar o primeiro campo inválido |
| Footer fixo | Respeitar teclado e safe area; não cobrir campos |
| Fechamento | Confirmar descarte apenas se houver alteração real |
| Revisão final | Permitir tocar em uma linha para voltar diretamente ao passo correspondente |
| Salvamento | Mostrar estado “salvando...” e impedir duplo clique |
| Rascunho | Preservar rascunho ao sair acidentalmente de wizard longo |

O botão não deve ficar simplesmente desabilitado quando o passo é inválido. Abaixo dele ou no campo deve aparecer a razão: “preencha o título para continuar”.

### 5.2 CourseWizard

É um wizard adequado para uma entidade relativamente curta. Recomendo no máximo dois passos: dados básicos e personalização opcional. Cor e ícone podem ser escolhidos no mesmo passo ou depois da criação. A criação rápida a partir de outro wizard deve usar apenas nome da matéria e retornar ao fluxo original.

### 5.3 TaskExamWizard

O primeiro passo atual escolhe entre tarefa e prova, depois os fluxos divergem. Isso é correto, mas a experiência deve evitar que a pessoa atravesse campos irrelevantes.

**Fluxo proposto para tarefa:** título → prioridade/categoria → contexto e data → revisão. “Sem prazo” deve ser um estado visível e intencional.

**Fluxo proposto para prova:** título → data/peso → disciplina/tópicos → agenda opcional → revisão.

A disciplina deve ter ação “criar matéria” quando não houver opções. Agenda deve ser uma opção posterior, não uma etapa que apareça para todos sem necessidade.

### 5.4 FlashcardWizard

A pergunta e a resposta são o núcleo. Relações com conceito, autores e disciplina são enriquecimento. O fluxo deve permitir salvar o cartão sem vínculos e, depois, sugerir “relacionar agora” sem bloquear.

A ação recomendada no modal para flashcard vencido deve abrir diretamente a revisão, não a edição. Editar fica na camada secundária.

### 5.5 ReadingWizard

Separar claramente **cadastrar leitura** de **atualizar progresso**. O wizard de cadastro deve pedir título, autor, total de páginas e vínculo opcional. Páginas lidas devem iniciar como zero, sem assumir avanço. A ação de pressão prolongada deve usar um mini-editor de páginas, sem abrir o wizard completo.

### 5.6 SessionWizard

Este fluxo deve ser curto: tópico, disciplina opcional, data/duração e revisão. Se a sessão vier do timer, o tópico e a duração devem ser pré-preenchidos e a pessoa deve apenas confirmar.

### 5.7 InternshipWizard

É o wizard mais pesado. Recomendo dividir em:

1. **Registro essencial:** tipo, data, resumo e duração.
2. **Contexto profissional:** sessão, idade/iniciais, abordagem e intervenções.
3. **Reflexão:** impressões, limites, confiança, temas e próximos passos.

O primeiro passo deve permitir salvar um registro mínimo. O restante pode ser completado depois por “continuar registro”, que será uma ação recomendada no modal contextual. A duração deve começar vazia ou com uma sugestão explicitamente marcada, nunca com quatro horas silenciosamente.

### 5.8 AuthorWizard, ConceptWizard e MaterialWizard

Esses wizards têm campos opcionais e devem adotar o mesmo padrão: salvar o núcleo rapidamente e enriquecer depois. Para conceito, o nome e a definição são suficientes no primeiro passo. Para autor, nome e nota principal. Para material, título e tipo. Links, tags, autores e relações ficam na etapa avançada.

### 5.9 ClassNoteDetailWizard

Reduzir cinco etapas para três:

| Etapa | Conteúdo |
|---|---|
| 1. Identificação | Título, disciplina, data e número da aula |
| 2. Conteúdo | Anotações principais, conceitos e abordagens mais relevantes |
| 3. Enriquecer | Autores, materiais, avaliação e dúvidas, todos opcionais |

O prompt “quer dar mais detalhes?” deve aparecer somente quando a nota tiver sido salva com conteúdo mínimo. Se a usuária já escolheu “anotar aula completa”, o prompt é redundante.

### 5.10 NoteDetailWizard

Permitir salvar a nota após título, categoria e conteúdo. Vínculos são opcionais e devem ser uma seção “relacionar ao cantinho”. O ReviewCard deve permitir editar diretamente cada grupo, em vez de obrigar voltar sequencialmente pelos passos.

### 5.11 NoteTransformWizard

Este é o principal candidato à redução de carga cognitiva. Na primeira tela, mostrar:

```text
transformar em
[ tarefa ] [ flashcard ] [ aula ]

mais opções
prova · sessão · estágio · conceito · autor · material
```

Depois de escolher o destino, mostrar somente os campos desse destino. A conversão deve explicar o que acontecerá com a nota original: preservar, arquivar ou remover. No final, oferecer “abrir item criado”.

## 6. Ação recomendada como sistema de produto

A ação recomendada deve ser uma camada reutilizável também fora do long-press. O mesmo resultado pode aparecer como CTA em cards, na Home e no detalhe. Isso evita que o novo modal se torne outro lugar isolado com regras diferentes.

| Local | Uso |
|---|---|
| Card | Ícone/menu de ações rápidas |
| Home | Próxima ação global do dia |
| Modal de pressão prolongada | Próxima ação específica do item |
| Detalhe | Ação relacionada ao estado atual |
| Estado vazio | Ação de criação ou configuração |

A regra é: **uma ação recomendada por vez**. Não exibir “adicionar páginas”, “abrir leitor”, “guardar”, “editar” e “marcar concluído” com o mesmo peso. A recomendação deve ser explicada pelo estado do item.

## 7. Roadmap de implementação

### P0 — Fundação e ação de leitura

Implementar contrato de ações contextuais; adicionar ação “adicionar páginas lidas” para leituras; criar mini-editor de progresso; garantir validação de página atual/total; adicionar testes do cálculo e persistência.

### P1 — Universalizar ações recomendadas

Adicionar recomendações para tarefas, provas, flashcards, aulas, notas, matérias, sessões, estágio, TCC e quiz. Manter exclusão em seção separada. Adicionar menu explícito de três pontos nos cards mais importantes para que o long-press não seja a única descoberta.

### P1 — Melhorar primitives

Reforçar `Modal` com foco, Escape, `aria`, safe area e retorno ao disparador. Evoluir `Picker` com busca, seleção limpa, recentes e “criar novo”. Evoluir `PillGroupMulti` com contador, chips selecionados e modo busca.

### P2 — Reduzir wizards

Começar por `NoteTransformWizard`, `ClassNoteDetailWizard` e `InternshipWizard`. Depois revisar `TaskExamWizard`, `ReadingWizard` e `FlashcardWizard`. Criar salvamento mínimo e enriquecimento posterior.

### P2 — Validação e rascunhos

Criar mecanismo comum para erro inline, foco no campo inválido, confirmação de descarte e rascunho de wizard longo. Remover estados silenciosos de botão desabilitado.

### P3 — Refinamento visual

Reduzir Kitty, animações e cards dentro de modais. O conteúdo de ação deve aparecer antes de ilustração e texto decorativo. Usar uma única ação primária, ações neutras agrupadas e exclusão isolada.

## 8. Critérios de aceite

| Área | Critério |
|---|---|
| Modal contextual | Segurar livro em andamento abre “adicionar páginas lidas” em até um toque |
| Progresso de leitura | Atualizar páginas não exige abrir o wizard completo |
| Tarefa/prova | Item pendente oferece concluir; item concluído oferece reabrir |
| Flashcard | Cartão vencido oferece revisar agora |
| Nota | Nota avulsa oferece transformação principal e destino claro |
| Picker vazio | Lista vazia oferece ação de criação quando o contexto permitir |
| Picker grande | Autores/conceitos/materiais podem ser buscados individualmente |
| Multi-seleção | Usuária vê selecionados, contador e opção de limpar |
| Wizard | Usuária sabe em que etapa está e por que não pode avançar |
| Validação | Primeiro erro recebe foco e mensagem próxima |
| Modal | Foco não escapa; Escape/voltar fecham corretamente |
| Exclusão | Ação destrutiva fica separada e mostra impacto/cascata |
| Long-press | Existe alternativa explícita por menu de ações |
| Consistência | A mesma ação abre o mesmo fluxo independentemente do ponto de origem |

## Conclusão

O modal universal deve evoluir de um menu genérico de manutenção para um **menu contextual de continuidade**. Essa mudança é valiosa porque reduz navegação: em vez de segurar um livro, escolher editar e procurar páginas, a usuária segura o item e registra o avanço diretamente. O mesmo princípio pode concluir tarefas, iniciar revisão de flashcard, continuar uma anotação, transformar uma nota e atualizar um capítulo do TCC.

A recomendação é implementar primeiro a ação de leitura, porque ela valida o padrão com baixo risco e alto valor percebido. Em seguida, o padrão deve ser generalizado por uma matriz de ações declarativa. Paralelamente, `Modal`, `Picker`, `PillGroupMulti` e `WizardScaffold` devem receber melhorias de acessibilidade, validação e retorno de contexto. Assim, o app fica mais rápido sem perder profundidade: as ações frequentes tornam-se imediatas, e os wizards permanecem disponíveis para quem precisa registrar detalhes completos.
