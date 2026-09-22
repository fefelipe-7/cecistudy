# SPEC-WORKSPACE-ACADEMICO-BASE

> Spec-driven para a base do Desktop Flutter+Rust — Workspace Acadêmico.
> Gera as fundações de domínio, dados, bridge e shell Flutter que sustentam
> Faculdade, Estudos, Estágio, TCC/Projetos, Laboratório, Calendário, Conhecimento e Biblioteca.
> Status: 2026-09-17.

## 1. Objetivo
Estabelecer a base executável do desktop Flutter+Rust para o Workspace Acadêmico com:
- Rust como dono de domínio/dados/sync e Flutter como apresentação.
- Bridge `cecistudy-ffi` gerando bindings `flutter_rust_bridge`.
- Shell Flutter com navegação, theming e state management consolidados.
- Workspace Acadêmico ativo por padrão (`ws-academico` DEFAULT_WORKSPACE_ID).

## 2. Escopo
### In scope
- Contrato cross-língua: `schema.sql`, backup v2, golden files.
- Crates Rust: `common, domain, data, content, sync, app, ffi`.
- Flutter shell: sidebar, topbar, workspace switcher, command palette, navegação.
- Telas base: Home, Faculdade list, Estudos, Biblioteca, Perfil.
- Capacidades mínimas para entidades legadas: Course, Task, Exam, ClassNote, Flashcard, ReadingItem.

### Out of scope nesta fase
- `cecistudy-integrations` Google Calendar.
- Marketing Studio completo, Projetos/TCC editor paginado ABNT/DOCX.
- Sync P2P criptografado.
- Auto-update Flutter.

## 3. Suposições
- Rust toolchain 1.98, edition 2024, resolver 2.
- Flutter 3.44.3, Dart 3.12.2.
- `apps/desktop-flutter` scaffold existe; `cecistudy-ffi` stub existe.
- Pacotes TS são oráculo de paridade via golden files.
- Workspace Acadêmico é o default; outros workspaces podem coexistir.

## 4. Requisitos funcionais
### FR-01 Workspace
- App abre com workspace academico ativo.
- Switcher permite troca; estado persiste.

### FR-02 Navegação
- Pilha de navegação push/pop com hash mirror.
- Bottom/side navigation visível apenas em telas base.
- Back do sistema respeita pilha.

### FR-03 Domínio mínimo
- Entidades tipadas em Rust: Course, Task, Exam, ClassNote, Flashcard, ReadingItem, StudySession, InternshipLog, Profile, Sticker, StreakData, Reminder.
- Factories e invariantes portados de `packages/domain`.
- Capabilities matriz cobre entidades legadas.

### FR-04 Dados
- SQLite user db com migrações 13.
- Repositórios CRUD por entidade.
- Export/import backup v2 com validação Zod equivalente em serde.

### FR-05 Bridge
- `flutter_rust_bridge` gera bindings a partir de `cecistudy-app` API.
- `App::open`, `App::in_memory`, `verify`, `open_catalog`.
- Casos de uso: criar/lista task, course, class note, flashcard.

### FR-06 Shell Flutter
- Sidebar colapsável 72/240px, topbar com busca e avatar.
- Theming material 3 derivado de tokens existentes.
- State management Riverpod.

## 5. Requisitos não funcionais
- NFR-01 Rust é dono de regra; Flutter não decide capacidade.
- NFR-02 Offline-first; dados locais SQLite.
- NFR-03 Gate: `cargo clippy -D warnings`, `cargo fmt --check`, `cargo test` 162+ testes.
- NFR-04 Paridade JSON canônica entre TS e Rust.
- NFR-05 Acessibilidade básica: tamanhos toque 44px, contraste WCAG AA.

## 6. Capability Map
| Módulo | Responsabilidade | Depende de | Prioridade |
|---|---|---|---|
| Contrato DDL+backup | schema.sql, backup v2, golden | — | P0 |
| domain | entidades, factories, invariantes | — | P0 |
| data | SQLite, migrações, repositórios | domain | P0 |
| app | use cases | domain+data | P0 |
| ffi | flutter_rust_bridge | app | P0 |
| flutter shell + Home | UI base | ffi | P0 |
| Faculdade | master-detail disciplinas | shell | P0 |
| Perfil Settings | métricas, stickers | shell | P1 |
| Biblioteca | catálogo .db | content | P1 |
| Estudos | pomodoro, flashcards | shell | P1 |

## 7. Golden Rules
- Laboratório nunca compartilha tabela/id/tela com Estágio.
- Rust decide capacidade; Flutter só renderiza se `capabilityFor` permitir.
- Nenhum import `isDesktop/__TAURI__` no domínio.
- Tokens semânticos; não hex raw em classes.

## 8. Critérios de aceite
- [ ] `cargo test` passa, gate verde.
- [ ] `flutter_rust_bridge generate` sem erro.
- [ ] Shell abre, lista cursos do banco em memória.
- [ ] Criar tarefa via UI persiste e aparece na lista.
- [ ] Export/import backup round-trip idêntico.
- [ ] Paridade JSON canônica TS↔Rust para 3 coleções.

## 9. Open Questions
- Qual state manager definitivo: Riverpod vs Bloc?
- Estratégia de theming: Material 3 custom vs tokens diretos?
- Navegação: go_router vs navigator 2.0?
- Como lidar com `data_json` ainda exposto em data?

## 10. Referências
- desktop/spec/ESTADO-ATUAL-CECISTUDY-DESKTOP.md
- desktop/spec/01-task-breakdown-flutter-rust.md
- desktop/spec/FLUTTER-RUST-SPEC-ANALYSIS.md
- cecistudy-rust/contracts/schema.sql
- apps/desktop-flutter/pubspec.yaml
