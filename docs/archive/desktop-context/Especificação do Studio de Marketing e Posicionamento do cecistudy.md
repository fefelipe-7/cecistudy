# Especificação do Studio de Marketing e Posicionamento do cecistudy

**Produto:** cecistudy.

**Usuária de referência:** Ceci.

**Status:** escopo conceitual fechado em conjunto, com detalhes técnicos de integração a definir posteriormente.

## 1. Propósito

O Studio de Marketing será o espaço de posicionamento pessoal e profissional da Ceci. Ele organizará estratégia, ideias, produção de conteúdo, adaptações por canal, aprovação, publicação, métricas e aprendizados.

O módulo será voltado inicialmente para **conteúdo orgânico** e para uma única identidade profissional da Ceci. Não será um gerenciador genérico de várias marcas nem terá mídia paga como foco inicial.

Como a Ceci é estudante de Psicologia em transição para recém-formada, o Studio deverá acomodar uma comunicação que combine formação, repertório, estudos, divulgação científica, trajetória e construção profissional. O sistema não deve impor uma estratégia pronta, mas ajudar a Ceci a definir, testar e revisar a própria presença pública.

## 2. Canais iniciais

Os canais iniciais serão Instagram, TikTok e LinkedIn. Outros canais poderão ser adicionados futuramente sem alterar o conteúdo-base.

| Canal | Papel inicial |
|---|---|
| **Instagram** | Comunicação visual, carrosséis, feed, Reels e Stories. |
| **TikTok** | Vídeos curtos, roteiros e séries audiovisuais. |
| **LinkedIn** | Comunicação profissional, reflexões, textos, documentos e vídeos. |

As integrações com redes serão individuais e revogáveis. A Ceci poderá autorizar uma rede sem autorizar as demais.

## 3. Posicionamento flexível

O posicionamento será uma configuração viva, revisável e editável. A Ceci poderá definir manualmente os elementos ou receber sugestões do sistema.

```text
PositioningProfile
├── identidade profissional
├── propósito
├── áreas de interesse
├── temas que defende
├── temas que evita
├── público desejado
├── pilares de conteúdo
├── tom de voz
├── diferenciais
├── promessa
├── objetivos de comunicação
└── hipóteses estratégicas
```

Sugestões de público, pilares, objetivos e hipóteses entrarão como rascunhos aguardando aprovação. O sistema não deverá alterar automaticamente o posicionamento da Ceci.

O histórico de versões do posicionamento poderá existir, mas não será obrigatório nem deve adicionar complexidade ao primeiro fluxo.

A Ceci poderá definir temas que não quer abordar ou que exigem cuidado especial. Esses limites influenciarão sugestões e avisos, mas não bloquearão a criação.

## 4. Pilares, objetivos e classificação

Cada conteúdo poderá ter um pilar, objetivo e público principal, além de classificações secundárias.

Os objetivos poderão incluir educar, gerar conversa, construir autoridade, compartilhar trajetória, divulgar pesquisa, criar relacionamento, direcionar para outro material ou testar uma hipótese de posicionamento.

O Studio diferenciará conteúdo educativo, relato pessoal, opinião, conteúdo acadêmico, divulgação científica e comunicação profissional. Um conteúdo poderá pertencer a mais de uma categoria.

Pilares iniciais podem incluir:

- Psicologia explicada de forma acessível;
- rotina e formação de estudante/recém-formada;
- estudos, livros, artigos e repertório;
- reflexões sobre saúde mental e comportamento;
- bastidores de pesquisa, TCC e desenvolvimento profissional;
- posicionamento e construção de carreira.

Esses pilares são sugestões iniciais. A Ceci poderá criá-los, editá-los, removê-los ou aceitar sugestões do sistema.

## 5. Conteúdo-base e versões por canal

O Studio não terá um `Post` genérico como unidade principal. A cadeia será:

```text
PositioningProfile
      ↓
Pillar / Objective / Audience
      ↓
ContentIdea
      ↓
ContentBase
      ├── InstagramVariant
      ├── TikTokVariant
      └── LinkedInVariant
            ↓
Publication
            ↓
MetricSnapshot
            ↓
StrategicInsight
```

O conteúdo-base guardará a ideia, mensagem principal, objetivo, pilar, público, origem na Base de Conhecimento, referências, contexto e observações autorais.

As versões por canal poderão alterar estrutura, extensão, ritmo, linguagem, formato e mensagem. Uma ideia sobre um conceito de Psicologia poderá virar um carrossel educativo no Instagram, um roteiro de vídeo no TikTok e uma reflexão profissional no LinkedIn sem perder a origem comum.

Um conteúdo-base poderá gerar várias peças relacionadas e poderá ser reaproveitado em séries, temporadas ou campanhas orgânicas opcionais.

## 6. Estados do fluxo editorial

Os estados aprovados são:

```text
ideia
selecionado
briefing
rascunho
em_revisao
aprovado
agendado
publicado
reaproveitamento
arquivado
```

O fluxo pode pular etapas ou utilizar fluxos personalizados. A Ceci poderá criar templates próprios por canal e formato, além dos modelos oferecidos pelo sistema.

## 7. Formatos por canal

### Instagram

Os formatos iniciais serão feed, carrossel, Reels, Stories e sequência de Stories. A versão poderá conter slides, legenda, capa, CTA, hashtags, texto alternativo e ordem da sequência.

### TikTok

O formato principal será vídeo curto, com possibilidade futura de séries. A versão poderá conter gancho inicial, roteiro, cenas, falas, duração, texto na tela, legenda, capa e CTA.

### LinkedIn

Os formatos iniciais serão texto, documento/carrossel, imagem e vídeo curto. A versão poderá conter texto principal, contexto profissional, argumento, fonte, CTA e adaptação de linguagem.

Roteiro, cenas, falas, texto na tela, legenda, capa e CTA são componentes opcionais. O Studio não deverá obrigar a Ceci a preencher todos eles.

Carrosséis poderão ser montados dentro do cecistudy com slides individuais ou preparados fora. O Studio deverá guardar estrutura, origem e relação da peça mesmo quando a montagem visual ocorrer em outro programa.

Não haverá uma biblioteca de assets como domínio próprio neste momento.

## 8. Aprovação e publicação

A aprovação será individual por adaptação. Aprovar uma versão para Instagram não aprova automaticamente as versões para TikTok ou LinkedIn.

A publicação direta será preparada por canal e ativada gradualmente. Cada rede terá autorização individual e revogável. A publicação exigirá autorização explícita da Ceci por peça e canal.

Quando a integração automática não estiver disponível, o Studio manterá um fluxo manual completo: a Ceci poderá publicar fora da plataforma e registrar a peça como publicada dentro do cecistudy.

O Studio não deverá publicar automaticamente com base apenas em uma sugestão da IA ou em um agendamento sem autorização compatível.

## 9. Calendário editorial

A produção e a publicação aparecerão no Calendário unificado como uma camada visual própria, mas o Studio também terá uma visão editorial específica.

O Calendário acadêmico continua sendo voltado a responsabilidades de estudo, enquanto a camada editorial organiza ideias, produção, revisão, agendamento e publicação. Itens de produção poderão gerar blocos ou responsabilidades no Calendário quando a Ceci decidir planejá-los.

## 10. Métricas

O Studio será preparado para métricas automáticas desde o início, utilizando APIs oficiais quando possível. A conexão de cada rede será individual e revogável.

Quando uma API não oferecer dados suficientes, houver limitação de permissão ou a integração ainda não estiver ativada, o registro manual será um fallback completo.

As métricas serão registradas por publicação e por versão de canal. O Studio deverá permitir vários tipos de métrica separados para rastreamento amplo, incluindo desempenho por formato, alcance, retenção, conversas, respostas, cliques, compartilhamentos, salvamentos, crescimento e outros dados disponíveis por plataforma.

O sistema deverá comparar desempenho por canal, formato, pilar, objetivo, público, série e hipótese estratégica. Uma publicação será analisada em relação ao objetivo que possuía, comparando intenção e resultado.

Métricas qualitativas, como comentários relevantes, dúvidas recorrentes, críticas e sinais de identificação, poderão existir quando for possível capturá-las ou registrá-las manualmente. Elas não são requisito obrigatório do primeiro fluxo automático.

## 11. Aprendizados estratégicos

O Studio poderá sugerir aprendizados, mas não deverá transformar amostras pequenas em certezas nem alterar automaticamente a estratégia.

Exemplos de aprendizado:

- determinado pilar gera mais conversas no LinkedIn;
- vídeos curtos possuem melhor retenção que carrosséis em determinado tema;
- um formato produz mais salvamentos, mas outro gera mais comentários;
- um público reage melhor a conteúdo de trajetória do que a conteúdo estritamente acadêmico;
- determinada hipótese de posicionamento ainda não possui evidência suficiente.

A Ceci poderá aceitar, editar, rejeitar ou ignorar cada aprendizado. Apenas aprendizados confirmados poderão influenciar recomendações futuras ou o posicionamento.

## 12. Revisão de responsabilidade ligada à Psicologia

O Studio poderá mostrar um aviso opcional quando a classificação ou o conteúdo indicar necessidade de cuidado, como linguagem que pareça diagnóstico, promessa de resultado, aconselhamento individual, exposição de situação sensível ou afirmação sem fonte.

Esse aviso será não bloqueante. A Ceci poderá continuar editando e publicar após a aprovação individual. O sistema deve ajudar a revisar a comunicação sem se apresentar como autoridade automática sobre a atuação profissional.

## 13. Relação com a Base de Conhecimento

Cada ideia, conteúdo-base e adaptação poderá registrar a origem do conhecimento utilizado. Essa origem pode ser uma aula, conceito, referência, documento, bloco, capítulo do TCC, experiência ou observação autoral.

A relação deverá permitir retornar à fonte, visualizar referências usadas e reaproveitar um conteúdo sem perder a proveniência. O conteúdo produzido no Studio não substitui nem altera automaticamente a fonte original da Base de Conhecimento.

## 14. IA assistiva

A IA poderá sugerir públicos, pilares, ideias, formatos, adaptações, séries, perguntas estratégicas e aprendizados. Ela não poderá publicar automaticamente, alterar o posicionamento sem aprovação ou substituir a voz da Ceci.

A assistência poderá ser ativada conforme o projeto e a função. Os detalhes de contexto amplo, permissões e processamento serão definidos na etapa futura de arquitetura de IA do cecistudy.

## 15. Escopo funcional completo

O Studio será planejado completo desde o início, incluindo:

- posicionamento;
- públicos e pilares configuráveis;
- hipóteses e metas de comunicação;
- fila de ideias;
- conteúdo-base;
- adaptações para Instagram, TikTok e LinkedIn;
- formatos opcionais de roteiro, cenas, legenda, capa e CTA;
- séries, temporadas e campanhas orgânicas opcionais;
- templates próprios;
- aprovação individual por canal;
- agendamento;
- publicação autorizada;
- fallback manual;
- métricas automáticas quando possível;
- métricas manuais;
- aprendizados estratégicos confirmáveis;
- calendário editorial integrado;
- origem na Base de Conhecimento;
- revisão opcional de responsabilidade ligada à Psicologia.

A implementação poderá ser feita por fatias verticais para reduzir risco técnico, mas o modelo de produto não será artificialmente limitado a planejamento ou rascunho.

## 16. Decisões futuras

Ainda serão detalhados durante a arquitetura técnica:

1. APIs e permissões específicas de Instagram, TikTok e LinkedIn;
2. autenticação e armazenamento seguro dos tokens;
3. limites de publicação e de métricas por plataforma;
4. formatos de mídia e processamento de vídeo/imagem;
5. modelo de comparação de métricas;
6. critérios para sugerir aprendizados sem sobreinterpretar dados;
7. integração detalhada com Base de Conhecimento e Calendário;
8. experiência de publicação e confirmação por canal;
9. regras profissionais e éticas específicas que serão convertidas em avisos;
10. escopo de automação da IA.

## Conclusão

O Studio de Marketing do cecistudy será o sistema de posicionamento e produção orgânica da Ceci. Ele conectará estratégia, conhecimento autoral, criação, adaptação multicanal, publicação e aprendizagem estratégica, sem reduzir a comunicação a posts genéricos ou a métricas isoladas.

A unidade central será o conteúdo-base autoral, do qual surgem adaptações específicas para Instagram, TikTok e LinkedIn. Cada versão será aprovada individualmente, publicada de forma autorizada e analisada em relação ao objetivo definido. O sistema poderá sugerir caminhos, mas a estratégia e a voz continuarão sob controle da Ceci.
