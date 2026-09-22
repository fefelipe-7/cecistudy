# Architecture Plan: cecistudy Desktop Flutter UI (R6)

## Executive Summary
Arquitetura greenfield para UI desktop Flutter do cecistudy, consumindo núcleo Rust via `cecistudy-ffi`. Rust mantém domínio, dados, sync e capacidades; Flutter apenas apresenta, consulta capacidades e gerencia estado de UI efêmero. Primeira vertical slice: abrir app, ler Home e navegação básica com bridge funcional.

## Inputs Reviewed
- `plano-desktop-flutter-rust.md` — princípios: Rust dono de lógica, Flutter só apresentação.
- `desktop/spec/01-task-breakdown-flutter-rust.md` — R6: skeleton + bridge + primeiras telas, sem base React/JS.
- `cecistudy-rust/AGENTS.md` — workspace Rust, gates `cargo clippy -D warnings` + `fmt --check` + `cargo test`.
- `contracts/schema.sql`, `contracts/golden/` — contrato de dados compartilhado.
- `packages/domain/src/core/domain/` — módulos TS existentes (calendar, knowledge, marketing, projects, internship).

## Assumptions And Non-Goals
Assumptions:
- `cecistudy-ffi` esqueleto já existe; bridge gerada via flutter_rust_bridge.
- Mobile React/Capacitor permanece inalterado; desktop não substitui mobile.
- Design system segue tokens existentes, mas implementação Flutter começa do zero.

Non-goals:
- Não portar código React/JS; UI nova.
- Não implementar lógica de negócio no Dart.
- Não fazer sync P2P agora.

## Context Alignment
| Context Dimension | Evidence Reviewed | Architecture Impact | Assumptions / Open Questions |
|---|---|---|---|
| Personal | Manutenção por 1 dev, preferência Rust core | Simplicidade operacional, evitar duplicação lógica | Tempo disponível para aprender Flutter |
| Organization | Nenhuma restrição externa | Livre escolha de pacotes Flutter | - |
| Project | Fase 2 após R5; gate Rust verde | UI só inicia após bridge estável | Ordem de módulos: Home → Faculdade → Estudos → Biblioteca → Calendário → Conhecimento/Marketing/Projetos |
| Workspace | Rust workspace em `cecistudy-rust/`; Tauri legando em `desktop/` | App Flutter em `apps/desktop-flutter/` separado | Onde versionar bindings? |

## Architecture Drivers
1. Separação estrita de responsabilidades: Rust decide, Flutter desenha.
2. Paridade de dados com mobile via canonical JSON v1.
3. Velocidade de entrega de primeira vertical slice.
4. Manutenibilidade por dev único.

## Recommended Architecture
**Topologia**: Flutter desktop app monólito de UI + bridge para crates Rust.

- `apps/desktop-flutter/` 
  - `lib/bridge/` — bindings flutter_rust_bridge gerados
  - `lib/screens/` — Home, Faculdade, Estudos, Biblioteca, Perfil, Calendário, Conhecimento, Marketing, Projetos, Inbox
  - `lib/widgets/` — componentes reutilizáveis
  - `lib/state/` — Riverpod/Bloc para estado de UI efêmero
  - `lib/theme/` — tokens de design, cores, tipografia

- Comunicação: chamada síncrona/assíncrona via FFI. Antes de ação, consultar `capability_for(entity, platform)` no Rust.

## Alternatives Considered
- Usar `provider` vs `Riverpod`: Riverpod escolhido por tipagem e testabilidade.
- `flutter_rust_bridge` vs `dart:ffi` manual: bridge gera boilerplate e mantém tipos.

## System Boundaries
- **Rust core**: domínio, dados, sync, integrações, capacidades.
- **FFI**: única porta; nunca expor conexão SQLite direta ao Dart.
- **Flutter**: apresentação, navegação, estado de UI, tema.

## Data Model
UI não define entidades; consome DTOs do Rust já tipados. Estado de UI efêmero (seleções, filtros, abas abertas) fica local no Flutter, não sincroniza.

## API And Integration Contracts
- `App::open(path)`, `App::in_memory()`, `App::verify()`
- `App::open_catalog(path)`
- `App::capability_for(entity, platform)`
- Use cases expostos via `cecistudy-app` → FFI.

## UI Architecture
- Shell app com navegação por pilha, sidebar desktop fixa ≥ lg.
- Estado de UI via Riverpod; modelo de ViewModel fino.
- Widgets stateless quando possível; estado local com `StatefulWidget` mínimo.
- Acessibilidade: semântica Flutter, contraste WCAG.

## Security, Privacy, And Compliance Notes
- Credenciais e tokens nunca passam pelo Dart; Rust gerencia OAuth Google Calendar.
- Dados locais em SQLite gerenciado pelo Rust.

## Accessibility And UX Constraints
- Mobile-first não se aplica; desktop: área de toque maior, teclado, atalhos.
- Manter tom pt-BR minúsculo, acolhedor.

## Observability And Operations
- Logs de erros via FFI para console Flutter.
- Releases via GitHub Actions; auto-update Flutter desktop.

## Deployment And Local Development
- Dev: `flutter run -d windows` + `cargo run` para testes Rust.
- Build: `flutter build windows/macos/linux`.

## Validation Strategy
- Unit tests Flutter para widgets.
- Testes de integração bridge: chamadas Rust com dados mock.
- Golden tests de paridade já existentes em Rust mantêm contrato.

## Decision Log
| ID | Decision | Status | Context | Rationale | Consequences |
|----|----------|--------|---------|-----------|--------------|
| ADR-001 | Flutter desktop greenfield sem base React | Proposed | R6 | Evita débito técnico, segue princípio Rust dono | Trabalho de UI do zero |
| ADR-002 | flutter_rust_bridge | Proposed | R5 | Tipagem automática, reduz boilerplate | Dependência de geração |

## Risks And Open Questions
- Curva de aprendizado Flutter.
- Tamanho dos bindings gerados.
- Sincronização de versões entre crates e Flutter.

## Handoff To Implementation Planning
- Criar `apps/desktop-flutter/` com `flutter create`.
- Configurar flutter_rust_bridge e gerar bindings a partir de `cecistudy-ffi`.
- Implementar skeleton de navegação e tela Home mockada via FFI ping.
- Próximo passo: vertical slice Home → Faculdade.
