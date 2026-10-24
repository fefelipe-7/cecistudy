# To-Do SPEC-M-025 — Central de notificações

Spec: `../../docs/specs/mobile/SPEC-M-025-central-de-notificacoes.md`
Plano: `plan-notificacoes-central.md`

Estado: Fases 1-3 entregues (falta T3.5); Fases 4-10 abertas.

## Regra de teste desta rodada

Base: `docs/estandares-testes.md`.

| O que testar | Classe | Onde |
|---|---|---|
| planner puro (aula, prova, estágio, tarefa, resumo, faixas) | invariante de domínio | `packages/domain/src/core/domain/__tests__/notifications.test.ts` |
| adaptador nativo (cancelar, agendar, orçamento) | integração de módulo com mock | `src/lib/__tests__/notifications.integration.test.ts` |
| confirmação de alarme, categorias no Perfil | UI comportamental | `src/components/views/perfil/__tests__/ProfilePreferences.test.tsx` |
| roteador de toque | unidade pura | `src/lib/__tests__/notificationRoutes.test.ts` |

Sem render-only, sem `setTimeout` real (usar `vi.useFakeTimers`), variação de
dado com `it.each` e data injetada (`today`/`now` nunca `new Date()` no teste).

## Fase 1 — Correção urgente de aulas (D3) — entregue
- [x] **T1.1** `syncClassReminders` com `hour`+`minute`, 10 min antes (`src/lib/notifications.ts`)
- [x] **T1.2** Teste unitário do `schedule.on` (`src/lib/__tests__/notifications.unit.test.ts`)
- [x] **T1.3** `npm run lint && npm run test`

## Fase 2 — Motor puro (D1, D2) — entregue
- [x] **T2.1** `packages/domain/src/core/domain/notifications.ts` com `NotificationFamily`, `PlannedNotification` e `NOTIFICATION_RANGES`
- [x] **T2.2** Faixas daily 1000, class 2000, thesis 3000, exam 4000, internship 5000
- [x] **T2.3** `ensureExactAlarmPermission` no adaptador — **revisado na Fase 5**
- [x] **T2.4** `planExamReminders` e `planInternshipReminders` puros
- [x] **T2.5** `syncExamReminders` / `syncInternshipReminders` ligados no `src/context/sharedAppValue.ts`
- [x] **T2.6** `routeFromNotificationExtra` aceita `{ family, target }`
- [x] **T2.7** `node .github/scripts/check-boundaries.mjs`
- [x] **T2.8** Migrar `planThesisReminders` para planner genérico — **descartado**: o planner do TCC já é puro e testado em `packages/domain/src/core/domain/thesis.ts`; migrar só reescreveria o mesmo comportamento

## Fase 3 — Adaptador unificado (D7) — entregue, falta T3.5
- [x] **T3.1** `syncFamily` + `schedulePlannedFamily` (`src/lib/notifications.ts:351-398`)
- [x] **T3.2** `syncThesisReminders` usando o helper
- [x] **T3.3** `ensureExactAlarmPermission` no Android
- [x] **T3.4** `auditPendingNotifications` por faixa (`src/lib/notifications.ts:317-348`)
- [ ] **T3.5** Teste de integração do adaptador com `LocalNotifications` mockado (`src/lib/__tests__/notifications.integration.test.ts`): cancelar faixa, agendar, permissão negada, plano vazio

## Fase 4 — Roteamento por família (D8)

Bug atual: `src/shells/MobileAppShell.tsx:172` manda toda notificação com `extra` para `openTccScreen`.

- [ ] **T4.1** `target.day?` no tipo `PlannedNotification` e `day: ex.date` no planner de prova (`packages/domain/src/core/domain/notifications.ts`)
- [ ] **T4.2** Resolvedor puro em `src/lib/notificationRoutes.ts`: `resolveNotificationRoute(extra)` devolve `{ kind: 'tcc' | 'calendar' | 'faculdade' | 'estagio' | 'home', ... }`
- [ ] **T4.3** `SharedAppShell` usa o resolvedor: TCC → `openTccScreen`, prova → `openCalendar(day)`, aula → `handleNavigate('faculdade')`, estágio → `openInternshipDiary`, tarefa/diário → `handleNavigate('home')`
- [ ] **T4.4** Fallback legado dentro do resolvedor: `extra.thesis` e `{ family, target }` que só conhecia TCC
- [ ] **T4.5** Teste `it.each` com um `extra` de cada família + dois legados (`src/lib/__tests__/notificationRoutes.test.ts`)

Critério: prova e estágio não abrem mais a tela do TCC; teste cobre as 6 famílias.

## Fase 5 — Alarme exato com confirmação (D6, D9)

- [ ] **T5.1** Separar no adaptador: `checkExactAlarmStatus()` (só consulta) e `openExactAlarmSettings()` (abre a tela); remover `changeExactNotificationSetting()` de todo caminho de sync (`src/lib/notifications.ts:40-52`)
- [ ] **T5.2** `ensureExactAlarmPermission` deixa de existir no fluxo de sync; o warning `inexact` vai para a auditoria
- [ ] **T5.3** Confirmação no `ProfilePreferences` ao ligar master/categoria com estado `inexact`: "abrir agora" / "agora não" (reaproveita `Modal`)
- [ ] **T5.4** Copy da confirmação em `src/lib/voice.ts` (família `notificacao`, junto de `permissaoCalendar`)
- [ ] **T5.5** Estado `denied` visível na UI sem abrir a tela do sistema por conta própria
- [ ] **T5.6** Teste do adaptador provando que nenhum sync chama `openExactAlarmSettings` (`src/lib/__tests__/notifications.integration.test.ts`)
- [ ] **T5.7** Teste de UI da confirmação: aceitar abre, recusar mantém o toggle e mostra o aviso

Critério: grep por `changeExactNotificationSetting` só encontra a função de abertura e o clique da UI.

## Fase 6 — Controle único (D12)

- [ ] **T6.1** `ReminderSettings` com `categories: { class, exam, task, thesis, internship, summary }` (`src/context/DataClientProvider.tsx:98-101`)
- [ ] **T6.2** `emptyReminder` com as categorias ligadas (`src/data/empty.ts:69`)
- [ ] **T6.3** Normalizador puro `normalizeReminderSettings(raw, thesisEnabled)` em `src/lib/reminderSettings.ts`: `categories` ausente = todas ligadas; `thesis` herda `reminderPrefs.enabled`
- [ ] **T6.4** `ProfilePreferences` com master + categorias em um lugar só (rows com `ToggleRow`)
- [ ] **T6.5** `sharedAppValue` gateia cada família por `categories` (`src/context/sharedAppValue.ts:342-369`)
- [ ] **T6.6** `TccWizard` sem `remindersEnabled` (`src/components/wizards/TccWizard.tsx:75,135`); `TccView` sem on/off próprio; `reminderPrefs.enabled` não é mais lido
- [ ] **T6.7** Teste do normalizador com estado legado (`categories` ausente e `reminderPrefs.enabled: false`)
- [ ] **T6.8** Teste de UI: master desligado desliga tudo; categoria desligada não chama o sync daquela família
- [ ] **T6.9** Atualizar `TccWizard`/`TccView` testes afetados

Critério: um único lugar liga/desliga lembrete; nenhum teste espera `reminderPrefs.enabled` como controle.

## Fase 7 — Tarefas (D10)

- [ ] **T7.1** `'task'` em `NotificationFamily` e faixa 6000-6099 em `NOTIFICATION_RANGES`
- [ ] **T7.2** `planTaskReminders(tasks, prefs, today)` puro: véspera (`dueDate - 1`) e dia às `prefs.time`; ignora `completed`, sem `dueDate`, prazo passado
- [ ] **T7.3** `syncTaskReminders` no adaptador + caso `'task'` no `syncFamily`
- [ ] **T7.4** Efeito no `sharedAppValue` com as tarefas que já estão no contexto
- [ ] **T7.5** Teste `it.each` do planner: véspera, dia, concluída, sem prazo, prazo passado, horário já passado

Critério: os cinco casos acima passam com `today`/`now` injetados.

## Fase 8 — Resumo diário (D11)

- [ ] **T8.1** `planDailySummary(snapshot, prefs, today)` puro: aulas do dia, provas, tarefas com prazo hoje e pendências do TCC, nessa ordem; devolve no máximo 4 linhas e a contagem restante
- [ ] **T8.2** Chaves de voz do resumo em `src/lib/voice.ts` (o domínio não escreve copy)
- [ ] **T8.3** Adaptador compõe a linha a partir de `meta` e da voz; id `1001`
- [ ] **T8.4** Dia vazio cai na frase genérica do diário
- [ ] **T8.5** `sharedAppValue` reagenda o resumo quando aula, prova, tarefa ou TCC mudam
- [ ] **T8.6** Teste do planner com dia cheio, dia vazio e mais de 4 itens (prova que o 5º vira "e mais N")

Critério: uma única notificação `1001` por dia, no horário configurado, com o conteúdo do dia.

## Fase 9 — Orçamento de 64 no iOS (D13)

- [ ] **T9.1** `enforcePendingBudget()` no adaptador: lê `getPending()` uma vez, reserva `daily` e `class`, ordena as demais por `when` e cancela as mais distantes
- [ ] **T9.2** Passada única com debounce curto depois do lote de sync (`vi.useFakeTimers` no teste, sem espera real)
- [ ] **T9.3** `auditPendingNotifications().dropped` com os ids cortados e o total esperado vs real
- [ ] **T9.4** No-op em Android e web
- [ ] **T9.5** Teste com `getPending` mockado devolvendo 70: resumo e aulas preservados, os mais distantes cortados, `dropped` correto

Critério: `getPending().length <= 64` e nenhum corte invisível.

## Fase 10 — Fechamento

- [ ] **T10.1** `npm run lint`
- [ ] **T10.2** `npm run test:domain`
- [ ] **T10.3** `npm run test:ui`
- [ ] **T10.4** `node .github/scripts/check-boundaries.mjs`
- [ ] **T10.5** `npm run verify:fast`
- [ ] **T10.6** Marcar os critérios de aceite na spec, mudar o status para `entregue` e atualizar o índice `docs/specs/README.md`

## Não fazer nesta rodada
- Push remoto.
- Notificação de leitura/FSRS.
- Abrir a tela de otimização de bateria do OEM.
- Migrar `planThesisReminders` para planner genérico (descartado em T2.8).
