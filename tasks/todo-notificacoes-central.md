# To-Do SPEC-M-025 — Central de notificações

Spec: `../../docs/specs/mobile/SPEC-M-025-central-de-notificacoes.md`
Plano: `plan-notificacoes-central.md`

Estado: Fases 1–9 implementadas; T10.1, T10.2, T10.4 e T10.6 verdes. T10.3 roda
1225 testes verdes e 4 falhas **alheias** (fixtures de migração e gate de
movimento, ambos tocados por outra sessão); T10.5 depende do T10.3. Nenhuma
falha em arquivo da feature. A árvore está compartilhada com outra sessão (593
arquivos alterados), e nenhum arquivo dela foi tocado.

## Regra de teste desta rodada

Base: `docs/estandares-testes.md`.

| O que testar | Classe | Onde |
|---|---|---|
| planner puro (aula, prova, estágio, tarefa, resumo, faixas) | invariante de domínio | `packages/domain/src/core/domain/__tests__/notifications.test.ts` |
| adaptador nativo (cancelar, agendar, orçamento) | integração de módulo com mock | `src/lib/__tests__/notifications.integration.test.ts` |
| confirmação de alarme, categorias no Perfil | UI comportamental | `src/components/views/perfil/__tests__/ProfilePreferences.test.tsx` |
| roteador de toque | unidade pura | `src/lib/__tests__/notificationRoutes.test.ts` |
| normalizador da ponte `categories` | unidade pura | `src/lib/__tests__/reminderSettings.test.ts` |

Sem render-only, sem `setTimeout` real (usar `vi.useFakeTimers`), variação de
dado com `it.each` e data injetada (`today`/`now` nunca `new Date()` no teste).

## Fase 1 — Correção urgente de aulas (D3) — entregue
- [x] **T1.1** `syncClassReminders` com `hour`+`minute`, 10 min antes (`src/lib/notifications.ts`)
- [x] **T1.2** Teste do `schedule.on` no domínio/adaptador (`notifications.test.ts` + `notifications.integration.test.ts`); o antigo `notifications.unit.test.ts` testava cópia e foi removido
- [x] **T1.3** `npm run lint && npm run test` (verde antes da sessão concorrente)

## Fase 2 — Motor puro (D1, D2) — entregue
- [x] **T2.1** `packages/domain/src/core/domain/notifications.ts` com `NotificationFamily`, `PlannedNotification` e `NOTIFICATION_RANGES`
- [x] **T2.2** Faixas daily 1000, class 2000, thesis 3000, exam 4000, internship 5000, task 6000
- [x] **T2.3** `ensureExactAlarmPermission` no adaptador — **revisado na Fase 5**
- [x] **T2.4** `planExamReminders` e `planInternshipReminders` puros
- [x] **T2.5** `syncExamReminders` / `syncInternshipReminders` ligados no `src/context/sharedAppValue.ts`
- [x] **T2.6** `routeFromNotificationExtra` aceita `{ family, target }`
- [x] **T2.7** `node .github/scripts/check-boundaries.mjs`
- [x] **T2.8** Migrar `planThesisReminders` para planner genérico — **descartado**: o planner do TCC já é puro e testado em `packages/domain/src/core/domain/thesis.ts`; migrar só reescreveria o mesmo comportamento

## Fase 3 — Adaptador unificado (D7) — entregue
- [x] **T3.1** `syncFamily` + `schedulePlannedFamily` (`src/lib/notifications.ts`)
- [x] **T3.2** `syncThesisReminders` usando o helper
- [x] **T3.3** `ensureExactAlarmPermission` no Android — **substituído na Fase 5** por `checkExactAlarmStatus`/`openExactAlarmSettings`
- [x] **T3.4** `auditPendingNotifications` por faixa, com `dropped` e `exactAlarm`
- [x] **T3.5** Teste de integração do adaptador com `LocalNotifications` mockado (`src/lib/__tests__/notifications.integration.test.ts`): cancelar faixa, agendar, permissão negada, plano vazio

## Fase 4 — Roteamento por família (D8) — entregue
- [x] **T4.1** `target.day?` no tipo `PlannedNotification` e `day: ex.date` no planner de prova
- [x] **T4.2** Resolvedor puro em `src/lib/notificationRoutes.ts`: `resolveNotificationRoute(extra)` devolve `tcc | calendar | internship | tab`
- [x] **T4.3** `MobileAppShell` usa o resolvedor: TCC → `openTccScreen`, prova → `openCalendar(day)`, aula → Faculdade, estágio → `openInternshipDiary`, tarefa/diário → Home
- [x] **T4.4** Fallback legado dentro do resolvedor: `extra.thesis` e `{ family, target }` que só conhecia TCC
- [x] **T4.5** Teste com `extra` de cada família + dois legados (`src/lib/__tests__/notificationRoutes.test.ts`)

## Fase 5 — Alarme exato com confirmação (D6, D9) — entregue
- [x] **T5.1** `checkExactAlarmStatus()` (só consulta) e `openExactAlarmSettings()` (abre a tela); `changeExactNotificationSetting()` saiu de todo caminho de sync
- [x] **T5.2** `ensureExactAlarmPermission` deixou de existir no fluxo de sync; o estado `denied` aparece em `auditPendingNotifications().exactAlarm`
- [x] **T5.3** Confirmação no `ProfilePreferences` ao ligar master/categoria com estado `denied`: "abrir agora" / "agora não" (reaproveita `Modal`)
- [x] **T5.4** Copy da confirmação em `src/lib/voice.ts` (família `NOTIFICACAO`)
- [x] **T5.5** Estado `denied` visível na descrição do row, sem abrir a tela do sistema por conta própria
- [x] **T5.6** Teste do adaptador provando que nenhum sync chama `openExactAlarmSettings`
- [x] **T5.7** Teste de UI: aceitar abre, recusar mantém o lembrete e mostra o aviso

## Fase 6 — Controle único (D12) — entregue
- [x] **T6.1** `ReminderSettings` com `categories: { class, exam, task, thesis, internship, summary }`
- [x] **T6.2** `emptyReminder` com as categorias ligadas (`src/data/empty.ts`)
- [x] **T6.3** Normalizador puro `normalizeReminderSettings(raw, thesisEnabled)` em `src/lib/reminderSettings.ts`
- [x] **T6.4** `ProfilePreferences` com master + categorias em um lugar só (rows de `PreferenceRow`, o padrão da tela)
- [x] **T6.5** `sharedAppValue` gateia cada família por `categories`
- [x] **T6.6** `TccWizard` sem `remindersEnabled`; `TccView` sem on/off próprio; `reminderPrefs.enabled` não é mais lido
- [x] **T6.7** Teste do normalizador com estado legado (`categories` ausente e `reminderPrefs.enabled: false`)
- [x] **T6.8** Teste de UI: master desligado desliga tudo; categoria desligada vira `categories.<x> = false` na mesma escrita
- [x] **T6.9** `TccWizard`/`TccView` testes afetados atualizados

## Fase 7 — Tarefas (D10) — entregue
- [x] **T7.1** `'task'` em `NotificationFamily` e faixa 6000-6099
- [x] **T7.2** `planTaskReminders(tasks, prefs, today)` puro: véspera (`dueDate - 1`) e dia às `prefs.time`; ignora `completed`, sem `dueDate`, prazo passado
- [x] **T7.3** `syncTaskReminders` no adaptador + caso `'task'` no `syncFamily`
- [x] **T7.4** Efeito no `sharedAppValue` com as tarefas do contexto
- [x] **T7.5** Teste do planner: véspera, dia, concluída, sem prazo, prazo passado, horário já passado

## Fase 8 — Resumo diário (D11) — entregue
- [x] **T8.1** `planDailySummaries(snapshot, prefs, today)` puro: aulas do dia, provas, tarefas com prazo hoje e pendências do TCC, nessa ordem; até 4 linhas + contagem restante
- [x] **T8.2** Chaves de voz do resumo em `src/lib/voice.ts`
- [x] **T8.3** Adaptador compõe a linha a partir de `meta` e da voz; **14 dias materializados** com ids 1000–1013 (um por dia, não um id fixo) — refinamento da D11 registrado na spec
- [x] **T8.4** Dia vazio cai na frase genérica do diário
- [x] **T8.5** `sharedAppValue` reagenda o resumo quando aula, prova, tarefa ou TCC mudam
- [x] **T8.6** Teste do planner com dia cheio, dia vazio e mais de 4 itens

## Fase 9 — Orçamento de 64 no iOS (D13) — entregue
- [x] **T9.1** `enforcePendingBudget()`: lê `getPending()` uma vez, reserva `daily` e `class`, ordena as demais por `when` e cancela as mais distantes
- [x] **T9.2** Passada única com debounce curto depois do lote de sync (`vi.useFakeTimers` no teste)
- [x] **T9.3** `auditPendingNotifications().dropped` com os ids cortados, `byFamily`, `unknown` e `exactAlarm`
- [x] **T9.4** No-op em Android e web
- [x] **T9.5** Teste com `getPending` mockado devolvendo 70: resumo e aulas preservados, os mais distantes cortados, `dropped` correto

## Fase 10 — Fechamento
- [x] **T10.1** `npm run lint` — verde em 2026-10-23 (typecheck final sem erro)
- [x] **T10.2** `npm run test:domain` — 450 testes, 18 arquivos
- [ ] **T10.3** `npm run test:ui` — 1225 testes passam; 4 falham em arquivo alheio: `migrationFixtures.test.ts` (fixtures de migração reformatadas pela outra sessão) e `noInlineTokens.test.ts` (componentes alterados pela outra sessão). Nenhuma falha em arquivo da SPEC-M-025.
- [x] **T10.4** `node .github/scripts/check-boundaries.mjs` — OK
- [ ] **T10.5** `npm run verify:fast` — não rodado (T10.1/T10.3 pendentes)
- [x] **T10.6** Critérios de aceite da spec, status e índice `docs/specs/README.md` atualizados

## Não fazer nesta rodada
- Push remoto.
- Notificação de leitura/FSRS.
- Abrir a tela de otimização de bateria do OEM.
- Migrar `planThesisReminders` para planner genérico (descartado em T2.8).
- Tocar em arquivo de outra sessão (CI, release-please, shaders, `tsconfig.json`).
