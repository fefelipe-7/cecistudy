# Plano de implementação SPEC-M-025 · Central de notificações

Spec: `../../docs/specs/mobile/SPEC-M-025-central-de-notificacoes.md`
To-do: `todo-notificacoes-central.md`
Testes: `docs/estandares-testes.md` (planner no domínio, adaptador com mock, UI só comportamental)

## Objetivo

Um plano puro por família, um adaptador nativo, um lugar de controle e nenhum
descarte invisível — corrigindo o disparo de aula, o toque na tela errada e a
perda silenciosa acima de 64 pendentes no iOS.

## Fases

### Fase 1 — Correção urgente de aulas (D3) — entregue
`syncClassReminders` com `hour`+`minute` e 10 min antes. Critério: `npm run lint`
e `npm run test` passam.

### Fase 2 — Motor puro e faixas (D1, D2) — entregue
`packages/domain/src/core/domain/notifications.ts` com `NOTIFICATION_RANGES`,
`PlannedNotification` e planners de prova e estágio. Critério:
`check-boundaries.mjs` passa.

### Fase 3 — Adaptador unificado e auditoria (D7) — entregue, falta T3.5
`syncFamily` + `schedulePlannedFamily`, `ensureExactAlarmPermission` e
`auditPendingNotifications`. Falta o teste de integração com mock.

### Fase 4 — Roteamento por família (D8) · T4.1–T4.5
O shell passa a ler `{ family, target }` e escolher a tela; hoje tudo cai em
`openTccScreen` (`src/shells/MobileAppShell.tsx:172`). O planner de prova ganha
`target.day` para abrir o calendário certo. Critério: teste com um `extra` de
cada família + fallback legado.

### Fase 5 — Alarme exato com confirmação (D6, D9) · T5.1–T5.7
O adaptador só consulta; abrir a tela do sistema é ação explícita da UI, com
confirmação e copy. Critério: teste provando que nenhum sync chama
`changeExactNotificationSetting`.

### Fase 6 — Controle único (D12) · T6.1–T6.9
`ReminderSettings` ganha `categories`; o TCC perde o on/off e mantém só os
ajustes finos. A ponte de leitura preenche `categories` ausente e herda o
`reminderPrefs.enabled` antigo, sem bump de schema. Critério: testes de
`ProfilePreferences` e `TccWizard`.

### Fase 7 — Tarefas (D10) · T7.1–T7.5
Família `task` (6000-6099), véspera e dia às `prefs.time`, ignorando concluída e
sem prazo. Critério: planner testado nos cinco casos.

### Fase 8 — Resumo diário (D11) · T8.1–T8.6
Uma notificação no horário configurado com aulas, provas, tarefas e TCC do dia;
substitui a frase genérica do id `1001`. Critério: planner testado com dia cheio,
vazio e acima de 4 itens.

### Fase 9 — Orçamento de 64 no iOS (D13) · T9.1–T9.5
Passada única com debounce: reserva `daily` e `class`, corta o mais distante e
reporta `dropped`. Critério: `getPending` mockado com mais de 64.

### Fase 10 — Fechamento · T10.1–T10.6
`npm run verify:fast`, critérios de aceite marcados, status da spec em
`entregue`.

## Dependências

- `packages/*` não importa `@capacitor/*` (gate de fronteiras).
- `src/lib/notifications.ts` continua sendo a única glue nativa.
- Fase 6 antes de 7 e 8: categoria é o que liga/desliga as famílias novas.

## Riscos

- OEM agressivo ignora alarme exato mesmo com permissão → documentar limite.
- iOS descarta acima de 64 → a passada de orçamento torna o descarte visível.
- Ponte de `categories` lendo `reminder` antigo → teste com estado legado.
