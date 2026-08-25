# Como colar no projeto

1. Descompacte o ZIP na raiz do repositório Cecistudy.
2. Copie ou mantenha as pastas `content/`, `resources/`, `sql/`, `scripts/` e `docs/`.
3. O app deve apontar para `resources/catalog/cecistudy_catalog.sqlite` no runtime nativo.
4. Para edição, altere somente `content/`; depois regenere o SQLite com o builder do projeto.
5. O arquivo `legacy/cecistudy_banco_3004_final.json` não é a fonte primária; use-o apenas para comparação ou rollback.

## Campos de destaque

Cada questão modular contém `id`, `stem`, `format`, `difficulty`, `options`, `explanation`, `categoryId`, `approachIds`, `topicIds`, `origin`, `bank`, `exam`, `reviewStatus`, `isActive`, `isScorable` e `legacy`.

As questões anuladas, se existentes, continuam arquivadas no catálogo para preservação histórica, mas possuem `isActive=false` e `isScorable=false`.
