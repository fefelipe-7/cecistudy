# cecistudy Desktop Flutter

UI greenfield para desktop (Windows/macOS/Linux) consumindo núcleo Rust via `cecistudy-ffi`.

## Estrutura
- `lib/bridge/` — bindings flutter_rust_bridge gerados
- `lib/screens/` — telas principais
- `lib/widgets/` — componentes reutilizáveis
- `lib/state/` — Riverpod/Bloc para UI efêmera
- `lib/theme/` — design tokens

## Próximos passos
1. `flutter create .` (se ainda não inicializado)
2. Configurar flutter_rust_bridge
3. Implementar skeleton de navegação + Home
