//! Provedores de transporte para o pacote de sincronização.

pub mod github;

pub use github::{DEFAULT_PATH, GitHubSyncConfig, GitHubSyncProvider, normalize_path};
