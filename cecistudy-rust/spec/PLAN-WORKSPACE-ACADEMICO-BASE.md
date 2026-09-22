# PLAN-WORKSPACE-ACADEMICO-BASE

> Plano de implementação incremental para base do Workspace Acadêmico Desktop Flutter+Rust.
> 2026-09-17

## 0. Dependências
- Rust 1.98, Flutter 3.44.3, Dart 3.12.2, Node 26.3.1
- `cecistudy-rust` workspace com 7 crates
- `apps/desktop-flutter` scaffold
- `cecistudy-ffi` stub

## 1. Fases

### Fase 0 - Contrato e higiene
Duração estimada: 1 dia
- Extrair DDL para `schema.sql` canônico
- Formalizar backup v2 spec
- Gerar golden files para 3 coleções
- Corrigir desvio `cecistudy-ffi` doc vs código
- Output: `contracts/verify-schema.mjs` passa

### Fase 1 - Core Rust
- Portar domain entidades legadas + capabilities
- Data: repositórios CRUD para Course/Task/Exam/ClassNote
- App: use cases de criação/lista
- Gate: 162+ testes passam
- Output: `cargo test` verde

### Fase 2 - Bridge
- Configurar `flutter_rust_bridge` no `cecistudy-ffi`
- Gerar bindings Dart
- Integrar `cecistudy-app` como única superfície
- Output: `flutter_rust_bridge generate` sem erro

### Fase 3 - Shell Flutter
- Riverpod providers para server state
- Sidebar colapsável, topbar, navegação
- Theming material 3 com tokens existentes
- Home placeholder carregando cursos
- Output: `flutter run -d linux` abre shell

### Fase 4 - Telas base
- Faculdade master-detail
- Perfil settings básico
- Biblioteca catálogo read-only
- Estudos lista de sessões
- Output: CRUD via UI funciona

## 2. Tracks paralelos
Track A - Rust Core: domain, data, app, ffi
Track B - Flutter UI: shell, theming, navigation, state
Track C - QA Paridade: golden files, testes cross-língua

## 3. Riscos
- R1: `data_json` exposto na superfície pública bloqueia R4
- R2: Drift de tokens Flutter vs CSS
- R3: Capabilities incompletas para entidades legadas
- Mitigação: remover `data_json` em R4, sync tokens via script, expandir capabilities matriz

## 4. Gates de qualidade
- Rust: `cargo clippy -D warnings && cargo fmt --check && cargo test`
- Flutter: `flutter analyze && flutter test`
- Paridade: round-trip JSON canônico TS↔Rust
- Build: `flutter build linux` sem erro

## 5. Métricas de sucesso
- Tempo inicial < 2s
- CRUD tarefa < 200ms local
- Cobertura Rust domain > 80%
- Zero warnings clippy

## 6. Próximos passos imediatos
1. Criar `desktop/spec/TASKS-WORKSPACE-ACADEMICO-BASE.md` detalhado
2. Aguardar definição de state manager e theming
3. Iniciar Fase 0 contrato

## Referências
- SPEC-WORKSPACE-ACADEMICO-BASE.md
- desktop/spec/01-task-breakdown-flutter-rust.md
- desktop/spec/ESTADO-ATUAL-CECISTUDY-DESKTOP.md
