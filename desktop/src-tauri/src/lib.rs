//! cecistudy ♡ — shell desktop (Tauri 2).
//!
//! O app em si é o bundle web da raiz (`../../dist`), servido dentro do WebView.
//! Aqui registramos só os plugins nativos do desktop:
//! - `notification`: lembrete diário (agendado por timer JS em src/lib/notifications.ts)
//! - `updater` + `process`: auto-update via GitHub Releases (latest.json assinado)

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o cecistudy desktop");
}
