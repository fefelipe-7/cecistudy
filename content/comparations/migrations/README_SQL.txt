PACOTE SQL DA SEÇÃO COMPARAÇÕES

Arquivo principal: comparacoes_seed_completo.sql
Banco-alvo: MySQL/MariaDB com suporte a JSON.

O script cria as tabelas comparacao, comparacao_item, comparacao_eixo, comparacao_eixo_resposta, comparacao_evidencia_dado e comparacao_fonte, e insere todos os dados.

Conteúdo: 130 comparações; 300 entidades comparadas; 1.170 eixos; 2.700 respostas de eixo; 132 linhas de dados de evidência; 21 fontes.

Importação:
mysql -u SEU_USUARIO -p NOME_DO_BANCO < comparacoes_seed_completo.sql

O script usa utf8mb4, transação e UPSERT por ID/slug. Faça backup do banco antes de importar e adapte os nomes das tabelas se o seu app já possuir tabelas com esses nomes.

O eixo 04 de todos os registros é “Mecanismo de mudança” e a pergunta “Como a mudança acontece?”.
