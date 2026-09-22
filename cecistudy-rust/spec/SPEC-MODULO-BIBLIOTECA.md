# SPEC-MODULO-BIBLIOTECA

> Módulo Biblioteca — Workspace Acadêmico Desktop Flutter+Rust
> Nível: Alto - UI + estado + bridge + testes
> Data: 2026-09-17

## 1. Objetivo
Acesso ao catálogo estático e às notas avulsas do usuário. Catálogo lido via `cecistudy-content` read-only; notas persistidas em user DB.

## 2. Escopo
### In
- Navegação por famílias de psicoterapias e áreas interdisciplinares
- Listagem de livros e artigos do catálogo
- Detalhe de obra com metadados
- Notas avulsas do usuário: criar/editar/deletar
- Favoritos de obras
- Busca no catálogo

### Out
- Leitura offline de PDFs
- Sincronização de anotações de leitura com catálogo
- Importação de biblioteca externa

## 3. Entidades
### Catálogo read-only Rust
- `CatalogBook { id, title, author, family, cover_color, pages }`
- `CatalogArticle { id, title, author, journal, year }`
- `Family { id, name, color }`

### User DB
- `LooseNote { id, title, content, category, created_at }`
- `SavedBook { user_id, catalog_id, saved_at }`

## 4. API FFI
`LibraryApi`
- `list_families() -> Vec<Family>`
- `list_books(family_id, query) -> Vec<CatalogBook>`
- `get_book(id) -> Option<CatalogBook>`
- `list_articles(family_id) -> Vec<CatalogArticle>`
- `list_loose_notes() -> Vec<LooseNote>`
- `create_loose_note(note) -> Result<LooseNote>`
- `update_loose_note(id, patch) -> Result<LooseNote>`
- `delete_loose_note(id) -> Result<()>`
- `toggle_saved_book(catalog_id) -> Result<bool>`

## 5. Estado Flutter - Riverpod
- `familiesProvider`
- `booksProvider(family_id, query)`
- `selectedBookProvider`
- `looseNotesProvider`
- `savedBooksProvider`

## 6. UI Flutter
### Telas
- `LibraryScreen` com tabs: Catálogo / Notas Avulsas
- `CatalogBrowser` - grid de famílias
- `BookShelf` - lista de obras por família
- `BookDetail` - metadados + ação salvar
- `LooseNotesList` - lista de notas
- `NoteEditor` - criar/editar nota

### Componentes
- `FamilyCard` - capa colorida
- `BookCard` - capa, título, autor
- `MixedCollectionBlock` - livros + artigos
- `NoteCard` - preview nota
- `SearchBar` - busca catalogo

### Interações
- Click família → abrir shelf
- Click livro → abrir detalhe
- Botão salvar → toggle favorito
- Click nota → abrir editor
- Cmd+K → busca global

## 7. Theming
- Cores de capa vêm do catálogo como dado
- Cards com `journal-card`
- Fundo `surface-rose` para seções de catálogo

## 8. Regras de Negócio
- Catálogo é read-only, nunca editável
- Notas avulsas são por usuário, workspace agnóstico?
- Favoritos persistem em user DB

## 9. Critérios de Aceite
- [ ] Listar famílias de catálogo
- [ ] Buscar livros por título/autor
- [ ] Abrir detalhe de livro com metadados
- [ ] Salvar/remover favorito persiste
- [ ] Criar/editar/deletar nota avulsa
- [ ] Navegação entre catálogo e notas via tabs
- [ ] Testes widget BookCard
- [ ] Teste integração FFI listar catálogo

## 10. Testes
- Rust: `content_query_test.rs` catálogo queries
- Rust: `library_repository_test.rs` notas CRUD
- Flutter widget: `BookShelfTest`
- Flutter integration: `LibraryFlowTest`

## 11. Dependências
- `cecistudy-content` CatalogDb read-only
- `cecistudy-data` repositories para notas
- `cecistudy-app` use cases
- `cecistudy-ffi` bridge

## 12. Abertos
- Notas avulsas por workspace ou global?
- Limite de busca no catálogo?
- Paginação de resultados?
