//! API surface for flutter_rust_bridge.
//!
//! Este módulo será anotado com `#[frb(sync)]` quando o gerador estiver ativo.

use cecistudy_common::Error;

pub fn ping() -> Result<String, Error> {
    Ok("cecistudy-ffi ok".to_string())
}
