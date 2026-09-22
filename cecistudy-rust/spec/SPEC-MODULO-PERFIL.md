# SPEC-MODULO-PERFIL

> Módulo Perfil — Workspace Acadêmico Desktop Flutter+Rust
> Nível: Alto - UI + estado + bridge + testes
> Data: 2026-09-17

## 1. Objetivo
Configuração do usuário, métricas de jornada, stickers e preferências do workspace. Único módulo de identidade e settings.

## 2. Escopo
### In
- Dados de perfil: nome, semestre, universidade, carreira alvo
- Métricas derivadas: streak, minutos estudados, cursos ativos
- Coleção de stickers
- Preferências: lembrete diário, tema, idioma
- Sync status e backup/restore
- Gerenciamento de workspaces

### Out
- Edição de avatar customizado
- Integrações sociais

## 3. Entidades Rust
- `Profile { id, name, semester, university, target_career, daily_quote }`
- `Sticker { id, name, emoji, unlocked, unlocked_at, category }`
- `StreakData { active_days: Vec<Date> }`
- `Reminder { enabled, time }`
- `Workspace { id, name, type, active }`

## 4. API FFI
`PerfilApi`
- `get_profile() -> Option<Profile>`
- `update_profile(patch) -> Result<Profile>`
- `list_stickers() -> Vec<Sticker>`
- `unlock_sticker(id) -> Result<()>`
- `get_streak() -> StreakData`
- `get_reminder() -> Reminder`
- `update_reminder(reminder) -> Result<Reminder>`
- `list_workspaces() -> Vec<Workspace>`
- `switch_workspace(id) -> Result<()>`
- `export_backup() -> Vec<u8>`
- `import_backup(data) -> Result<()>`

## 5. Estado Flutter - Riverpod
- `profileProvider`
- `stickersProvider`
- `streakProvider`
- `reminderProvider`
- `workspacesProvider`
- `syncStatusProvider`

## 6. UI Flutter
### Telas
- `PerfilScreen` com seções: Jornada / Streak / Stickers / Preferências / Sync
- `ProfileEditor` - formulário de perfil
- `StickerGallery` - grade de stickers desbloqueados
- `SettingsPane` - lembrete, tema
- `WorkspaceSwitcher` - lista workspaces

### Componentes
- `MetricCard` - valor + label
- `StreakTimeline` - dias ativos
- `StickerCard` - emoji + nome
- `BackupCard` - export/import

### Interações
- Editar perfil → salvar via FFI
- Toggle lembrete → atualiza
- Export backup → gera arquivo .cecistudy
- Import backup → valida e merge
- Trocar workspace → recarrega providers

## 7. Theming
- Fundo `surface-subtle`
- Cards com `journal-card`
- Stickers com destaque `surface-rose`

## 8. Regras de Negócio
- Perfil único por instalação
- Streak calculado a partir de `active_days`
- Backup mantém schema version
- Troca de workspace recarrega todo estado

## 9. Critérios de Aceite
- [ ] Exibir perfil e métricas derivadas
- [ ] Editar perfil persiste
- [ ] Streak timeline renderiza corretamente
- [ ] Stickers desbloqueados visíveis
- [ ] Lembrete toggle persiste
- [ ] Export backup gera arquivo válido
- [ ] Import backup restaura dados
- [ ] Trocar workspace atualiza UI
- [ ] Testes widget MetricCard
- [ ] Teste integração FFI perfil→update

## 10. Testes
- Rust: `profile_domain_test.rs`
- Rust: `profile_repository_test.rs`
- Flutter widget: `StickerGalleryTest`
- Flutter integration: `PerfilFlowTest`

## 11. Dependências
- `cecistudy-domain` profile entities
- `cecistudy-data` repositories
- `cecistudy-sync` para status
- `cecistudy-ffi` bridge

## 12. Abertos
- Múltiplos perfis por usuário?
- Temas personalizados além dos 10 padrão?
- Histórico de métricas por período?
