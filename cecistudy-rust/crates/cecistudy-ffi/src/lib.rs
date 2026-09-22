//! cecistudy-ffi — bridge flutter_rust_bridge sobre cecistudy-app.
//!
//! Este crate expõe a superfície já pronta de `cecistudy-app` para o lado Flutter.
//! Regra de boundary: só consome crates Rust, nunca Flutter/React.
//!
//! Próximos passos (R5):
//! - gerar bindings com `flutter_rust_bridge_codegen`
//! - expor wrappers para App::open, App::in_memory, App::verify, App::open_catalog, App::capability_for
//! - mapear erros para FFI-safe types

use cecistudy_common::Error;

pub mod api;

/// Facade estável para FFI — delega para `cecistudy-app`.
pub struct Ffi;

impl Ffi {
    pub fn new() -> Self {
        Self
    }

    // Exemplos de stubs — a implementação real será gerada via flutter_rust_bridge
    #[allow(dead_code)]
    pub fn open_app(&self, _path: &str) -> Result<(), Error> {
        // placeholder
        Ok(())
    }
}
