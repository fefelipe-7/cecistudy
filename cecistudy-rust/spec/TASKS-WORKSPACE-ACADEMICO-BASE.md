# TASKS-WORKSPACE-ACADEMICO-BASE

> Checklist de tarefas para agentes paralelos. Marcar [x] ao concluir.

## Fase 0 - Contrato
- [ ] Verificar `contracts/schema.sql` cobre 48 tabelas
- [ ] Executar `node contracts/verify-schema.mjs` com sucesso
- [ ] Criar `contracts/backup-v2-spec.md` formalizado
- [ ] Gerar golden files para courses, tasks, exams
- [ ] Atualizar AGENTS.md workspace para refletir `cecistudy-ffi` existente

## Fase 1 - Rust Core
- [ ] Portar entidades legadas para `cecistudy-domain/src/core/domain`
- [ ] Expandir capabilities matriz para Course/Task/Exam/ClassNote
- [ ] Implementar repositórios CRUD em `cecistudy-data`
- [ ] Criar use cases em `cecistudy-app` para criar/lista
- [ ] Rodar `cargo test` e garantir 162+ testes passando

## Fase 2 - Bridge
- [ ] Adicionar `flutter_rust_bridge` ao `cecistudy-ffi/Cargo.toml`
- [ ] Definir API `App` exposta via FFI
- [ ] Rodar `flutter_rust_bridge generate` sem erro
- [ ] Criar wrapper Dart em `apps/desktop-flutter/lib/bridge/`

## Fase 3 - Shell Flutter
- [ ] Configurar Riverpod providers
- [ ] Implementar `DesktopShell` com sidebar colapsável
- [ ] Integrar topbar com busca e avatar
- [ ] Aplicar tema material 3 com tokens
- [ ] Navegação base com 5 telas placeholder

## Fase 4 - Telas Base
- [ ] Faculdade master-detail funcional
- [ ] Perfil settings com nome e semestre
- [ ] Biblioteca catálogo read-only
- [ ] Estudos lista de sessões
- [ ] CRUD tarefa via UI persiste no SQLite

## QA
- [ ] Paridade JSON canônica TS↔Rust para 3 coleções
- [ ] `cargo clippy -D warnings` verde
- [ ] `cargo fmt --check` verde
- [ ] `flutter analyze` verde
- [ ] Teste manual de export/import backup

## Owners sugeridos
- Agent A: Fase 0 + Fase 1 Rust
- Agent B: Fase 2 Bridge + Fase 3 Shell
- Agent C: Fase 4 Telas + QA paridade

## Dependências entre tarefas
- Fase 1 depende de Fase 0
- Fase 2 depende de Fase 1
- Fase 3 depende de Fase 2
- Fase 4 depende de Fase 3

## Critérios de conclusão
- [ ] Shell abre e lista cursos
- [ ] Criar tarefa via UI persiste
- [ ] Export/import round-trip idêntico
- [ ] Gates Rust e Flutter verdes
