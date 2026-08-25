# Cecistudy — catálogo modular

Release: **2026.08.20**
Questões: **3004**
Hash do conteúdo: `30ee39598da3ba957e790a657e1b9abf10af55a574935b07cc8abc3c0bdf0edb`

## Estrutura

| Pasta | Função |
|---|---|
| `content/questions/` | Questões agrupadas por categoria e bloco de quiz |
| `content/taxonomies/` | Áreas, categorias, temas, abordagens, formatos e estados editoriais |
| `content/approaches/` | Famílias e arquivos canônicos de abordagem |
| `content/authors/` | Autores identificados no catálogo |
| `content/works/` | Referências de apoio e fontes associadas |
| `content/indexes/` | Índices rápidos para filtros do app |
| `resources/catalog/` | Banco SQLite gerado para runtime |
| `sql/` | Schema e dump SQL reproduzível |
| `scripts/` | Validação e inspeção do conteúdo |

## Uso no projeto

Descompacte este pacote na raiz do repositório. O diretório `content/` é a fonte editorial; `resources/catalog/cecistudy_catalog.sqlite` é o artefato pronto para o runtime. O app deve consultar o catálogo por repositórios, não importar o JSON monolítico diretamente.

Antes de publicar, execute:

```bash
python3 scripts/content_check.py
python3 scripts/content_report.py
```

As questões autorais estão com revisão humana recomendada; questões anuladas permanecem inativas e não pontuáveis. O arquivo `legacy/cecistudy_banco_3004_final.json` é mantido apenas como referência e rollback editorial.
