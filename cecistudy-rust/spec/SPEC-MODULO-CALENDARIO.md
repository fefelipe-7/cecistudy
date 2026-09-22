# SPEC-MODULO-CALENDARIO

> Módulo Calendário — Workspace Acadêmico Desktop Flutter+Rust
> Nível: Alto - UI + estado + bridge + testes
> Data: 2026-09-17

## 1. Objetivo
Grade semanal desktop com drag/resize, recorrência, camadas por workspace e integração opcional Google Calendar. Fonte da verdade em Rust; Flutter apenas renderiza.

## 2. Escopo
### In
- Visualização semanal/mensal, grade por dia/hora
- Criação/edição/exclusão de Event, Responsibility, Study Session
- Recorrência simples: diária/semanal/mensal, fim em data ou contagem
- Drag/resize com confirmação
- Camadas: Faculdade, Estudos, Estágio, TCC, Laboratório
- Indicadores de conflito
- Sync opcional Google Calendar via Rust

### Out nesta fase
- Integração P2P, criptografia
- Import/export iCal
- Planejamento automático de responsabilidades IA

## 3. Entidades Rust
- `CalendarEvent { id, title, start, end, all_day, workspace_id, course_id?, color, recurrence_rule?, created_at, updated_at }`
- `Responsibility { id, title, due_date, commitment_level, workspace_id }`
- `StudySession { id, topic, start, duration, course_id? }`

## 4. API FFI
`CalendarApi`
- `list_events(range_start, range_end, workspace_id) -> Vec<Event>`
- `create_event(event) -> Result<Event>`
- `update_event(id, patch) -> Result<Event>`
- `delete_event(id) -> Result<()>`
- `list_responsibilities(workspace_id) -> Vec<Responsibility>`
- `create_study_session(session) -> Result<StudySession>`

## 5. Estado Flutter - Riverpod
- `calendarProvider` - range atual
- `eventsProvider` - lista de eventos filtrada
- `selectedDateProvider` - dia selecionado
- `dragStateProvider` - estado de drag/resize
- `conflictProvider` - detecção de sobreposição

## 6. UI Flutter
### Telas
- `CalendarScreen` com `WeekView` / `MonthView` toggle
- `EventSheet` bottom sheet para criar/editar
- `ConflictDialog` quando sobreposição detectada
- `LayerFilterBar` para habilitar/desabilitar camadas

### Componentes
- `CalendarGrid` - grade horas x dias
- `CalendarEventCard` - draggável, resize handle
- `RecurrencePicker` - UI de recorrência
- `LayerToggleChip` - chips por workspace

### Interações
- Click vazio → criar evento rápido
- Drag evento → atualizar start/end com debounce 300ms
- Resize handle → mudar fim
- Duplo click → abrir sheet edição
- Cmd+K → command palette de calendário

## 7. Theming
- Cores por workspace definidas em tema
- Eventos com borda `border-ceci-border-default`, fundo `surface-subtle`
- Hover: elevation sutil
- Drag: opacity 0.7

## 8. Regras de Negócio
- Evento não pode ter fim antes de início
- Evento all-day ocupa linha inteira
- Recorrência gera instâncias virtuais; edição pode ser desta instância ou série
- Conflito detectado se sobreposição > 0 min

## 9. Critérios de Aceite
- [ ] Abrir calendário semanal mostra eventos do range
- [ ] Criar evento via sheet persiste e aparece na grade
- [ ] Drag/resize atualiza evento via FFI
- [ ] Filtro de camada oculta eventos corretamente
- [ ] Conflito mostra diálogo com opções manter/ajustar
- [ ] Recorrência semanal gera instâncias corretas
- [ ] Testes widget para grid render
- [ ] Teste integração FFI criar/atualizar/deletar

## 10. Testes
- Rust: `calendar_domain_test.rs` invariantes de tempo
- Rust: `calendar_repository_test.rs` CRUD SQLite
- Flutter widget: `CalendarGridTest`
- Flutter integration: `CalendarFlowTest` criar→drag→editar

## 11. Dependências
- `cecistudy-domain` calendar entities
- `cecistudy-data` repositories
- `cecistudy-app` use cases
- `cecistudy-ffi` bridge
- `flutter_rust_bridge`

## 12. Abertos
- Suporte a recorrência complexa RRULE?
- Zoom de grade por hora?
- Persistência de tamanho/coluna da grade?
