# migração de comparações v2

A migração `2026-08-27-comparacoes-v2` importa o dump editorial `comparacoes_seed_completo.sql` sem executar MySQL/MariaDB e sem criar dependência de banco no runtime. O parser `../normalizer.mjs` converte as seis tabelas relacionais em objetos `TempleComparison` v2, preservando respostas por eixo, evidências e fontes detalhadas.

A fonte complementar `fontes_referencias.json` fornece as 21 referências estruturadas. O registro canônico `tec-psicoeducacao` foi criado em `content/techniques/motivacionais-solucao/tec-psicoeducacao.json`, permitindo resolver o item usado pela `cmp-122`.

Para validar a migração e gravar um snapshot de inspeção, execute:

```bash
node content/comparations/migrations/import-comparacoes-sql.mjs --write
```

O comando é idempotente e verifica 130 comparações, 300 itens, 1.170 eixos, 2.700 respostas, 132 evidências e 21 fontes. O snapshot opcional fica em `content/comparations/comparacoes_v2.snapshot.json`; ele é um artefato de auditoria e não substitui o SQL como fonte editorial.

Para regenerar a aplicação web e o catálogo nativo, use o fluxo oficial:

```bash
npm run content:check
npm run content:build
npm run db:verify
```

O facade web gerado fica em `src/data/temple/comparisons.json`, e o catálogo nativo grava o objeto v2 em `comparison.data_json` no SQLite readonly. Nenhuma tabela MySQL é necessária em produção.
