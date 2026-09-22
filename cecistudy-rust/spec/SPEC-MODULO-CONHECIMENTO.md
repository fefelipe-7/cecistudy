# SPEC-MODULO-CONHECIMENTO

> Módulo Conhecimento — Workspace Acadêmico Desktop Flutter+Rust
> Nível: Alto - UI + estado + bridge + testes
> Data: 2026-09-17

## 1. Objetivo
Grafo de conhecimento interativo, editor de blocos e inbox de sugestões. Documentos, relações e blocos gerenciados por Rust; Flutter renderiza grafo e editor.

## 2. Escopo
### In
- Lista de documentos por workspace
- Criar/editar documento com blocos rich text
- Relações entre documentos
- Grafo interativo visualização
- Inbox de sugestões de relações
- Busca full-text local

### Out
- Editor colaborativo real-time
- Exportação para PDF/DOCX nesta fase

## 3. Entidades Rust
- `Document { id, title, workspace_id, content_json, created_at, updated_at }`
- `Block { id, document_id, type, content, order }`
- `Relation { id, from_id, to_id, type, status }`
- `Suggestion { id, document_id, type, reason, status }`

## 4. API FFI
`KnowledgeApi`
- `list_documents(workspace_id) -> Vec<Document>`
- `get_document(id) -> Option<Document>`
- `create_document(doc) -> Result<Document>`
- `update_document(id, patch) -> Result<Document>`
- `list_relations(document_id) -> Vec<Relation>`
- `create_relation(rel) -> Result<Relation>`
- `list_suggestions(workspace_id) -> Vec<Suggestion>`
- `accept_suggestion(id) -> Result<()>`
- `reject_suggestion(id) -> Result<()>`

## 5. Estado Flutter - Riverpod
- `documentsProvider`
- `selectedDocumentProvider`
- `graphProvider` - nodes e edges para visualização
- `suggestionsProvider`
- `searchQueryProvider`

## 6. UI Flutter
### Telas
- `KnowledgeScreen` com split master-detail
- `GraphView` - grafo interativo com pan/zoom
- `DocumentEditor` - editor de blocos
- `InboxScreen` - sugestões de relações

### Componentes
- `DocumentList` - lista com busca
- `GraphCanvas` - renderização de nós/links
- `BlockEditor` - editor rich text por bloco
- `RelationPicker` - seleção de documento alvo
- `SuggestionCard` - aceita/rejeita

### Interações
- Duplo click nó no grafo → abrir documento
- Arrastar nó → reposicionar
- Criar documento via command palette
- Arrastar link entre nós → criar relação

## 7. Theming
- Fundo `canvas` `cream-50`
- Nós com cor por tipo documento
- Links com `border-ceci-border-subtle`
- Editor com `journal-card` style

## 8. Regras de Negócio
- Documento pertence a um workspace
- Relação não pode ser auto-referência
- Sugestão pode ser aceita/rejeitada apenas uma vez
- Busca local usa SQLite FTS

## 9. Critérios de Aceite
- [ ] Lista documentos por workspace
- [ ] Criar documento com 3 blocos persiste
- [ ] Grafo renderiza nós e links corretamente
- [ ] Criar relação via UI persiste
- [ ] Inbox mostra sugestões e aceita/rejeita
- [ ] Busca filtra documentos em tempo real
- [ ] Testes widget GraphCanvas
- [ ] Teste integração FFI criar documento→ler grafo

## 10. Testes
- Rust: `knowledge_domain_test.rs` invariantes relações
- Rust: `knowledge_repository_test.rs` CRUD
- Flutter widget: `GraphCanvasTest`
- Flutter integration: `KnowledgeFlowTest`

## 11. Dependências
- `cecistudy-domain` knowledge entities
- `cecistudy-data` repositories
- `cecistudy-app` use cases
- `cecistudy-ffi` bridge

## 12. Abertos
- Algoritmo de layout do grafo: force-directed vs hierárquico?
- Limite de nós visíveis para performance?
- Versionamento de documentos?
