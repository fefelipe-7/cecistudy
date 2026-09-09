# Plano: Reaproveitar a UI/UX do calendário-referência no cecistudy

**Status:** implementado (2026-08-29) — lint + 500 testes + build verdes; fronteiras respeitadas. Tela de calendário agora exibida por padrão na sub-tab `calendário` da faculdade (default changed from `'disciplinas'` to `'calendário'` em `AppContext.tsx:760`).
**Local do referencial limpo:** `desktop/context-desktop/calendario-extracted/` (apenas os arquivos de UI/UX reutilizáveis)
**Alvo:** `src/desktop/components/calendar/` + `src/lib/schedule.ts` + handlers de `desktopApp`/`AppContext`

---

## 1. Contexto

Nosso app **já possui** uma tela de calendário desktop (`CalendarScreen.tsx`) acessível pela
sub-tab `calendario` da aba faculdade, na casca desktop (Tauri). Ela:

- pluga em `DesktopSidebar`/`DesktopTopbar` (reaproveita a casca);
- tem toolbar, filtro de camadas, grade semana/dia, mês e agenda;
- deriva eventos do estado real via `buildCalendarWeek` (`src/lib/schedule.ts`):
  aulas (recorrência do `Course.schedule`), provas, tarefas (prazo = all-day),
  capítulos de TCC e sessões de estudo;
- usa os tokens do design system (`--ds-layer-*`, `ceci-*`).

O que **falta** em relação ao app de referência (o zip):

| Recurso no referencial | Nosso estado atual | Ação |
|---|---|---|
| Arrastar e redimensionar eventos na grade | ausente (eventos estáticos) | **implementar** |
| Sobreposição lado-a-lado (estilo Google Calendar) | eventos empilham em largura total | **implementar** layout de colunas |
| Clicar num slot vazio abre criação naquele horário | ausente | **implementar** slot-create |
| Detalhe com toggle de status, etapas e edição inline | `CalendarContextPanel` existe, mas "reagendar/mais" são placeholders | **elevar** o painel |
| Dica hover "+ agendar" nos slots de 30min | ausente | **implementar** |
| Linha de hora atual | já existe | manter |
| Modal de criação/editar rico (tipo, camada, etapas, recorrência) | usa `openQuickAdd` genérico | **adaptar** (ver §5) |

O referencial já usa a **mesma paleta** do nosso design system (rose/blue/green/beige),
então o alinhamento visual é direto: trocar os poucos hex remanescentes por tokens
semânticos e manter cantos arredondados, sombras suaves e copy minúscula/acolhedora.

---

## 2. Objetivo

Elevar a `CalendarScreen` para a qualidade de interação do referencial, mantendo:

1. **Nossa camada de dados** — nada de `CalendarItem` livre; tudo deriva de
   `Course`/`Exam`/`Task`/`StudySession`/`TccData` via `lib/schedule.ts`.
2. **Nosso design system** — tokens `--ds-*` / `ceci-*`, cantos `rounded-2xl`, sombras brand.
3. **Detalhes que lembrem o app mobile** — cards arredondados e macios, labels minúsculas,
   tom acolhedor ("bora focar?", "prontinho ♡"), painel de contexto à direita espelhando
   o comportamento de folha de detalhe do mobile, toasts (já temos) em vez de `alert()`.

**Fora de escopo (não copiar do zip):** Google Calendar sync, sugestões de IA "Ceci",
som ambiente, banco de horas analytics, command palette próprio (já temos), timer banner
flutuante (usar o fluxo de foco existente). Esses arquivos já foram removidos do zip.

---

## 3. Mapeamento de dados (referência → nosso modelo)

O referencial usa um `CalendarItem` livre (`date`, `startTime`, `endTime`, `status`,
`etapas`, `layer`, `category`). Nosso modelo é normalizado. A ponte já existe em
`buildCalendarWeek`, mas precisamos de **write-back** para drag/resize e edição:

| Subtipo (camada) | Origem | Campo de data/hora | Write-back ao arrastar/redimensionar |
|---|---|---|---|
| `aula` (faculdade) | `Course.schedule` (recorrente semanal) | `slot.start`/`slot.end` | **não arrastável** — selecionar abre `CourseDetailPane` (a recorrência é semanal; mover 1 ocorrência exigiria exceção, fora do MVP) |
| `prova` (faculdade) | `Exam.date` | estimado (`14:00`, 2h) | atualizar `Exam.date` (+ horário se adicionarmos `Exam.time`) |
| `tarefa` (faculdade) | `Task.dueDate` | all-day | arrastar para outro dia atualiza `Task.dueDate` (sem hora) |
| `tcc` (tcc) | `TccData.chapters[].dueDate` | `16:00–18:00` | atualizar `dueDate` do capítulo |
| `estudo` (estudos) | `StudySession.date` + `durationMinutes` | início estimado | atualizar `StudySession.date` e (novo) `startTime` |
| `externo` (gcal) | placeholder | — | sem integração (manter como all-day somente leitura) |

**Decisão de modelo:** adicionar campo opcional `startTime?: string` a `StudySession`
(hoje só guarda `date` + `durationMinutes`) para que o bloco de estudo tenha posição real
na grade e possa ser arrastado. Provas: adicionar `time?: string` opcional a `Exam`
(horário da prova) — mantém compatível (undefined = estimado). Tarefas permanecem all-day.

---

## 4. Plano de implementação (incremental)

### Fase A — Layout de sobreposição lado-a-lado (semana/dia)
- Portar `computeOverlappingEventLayout` + `snapTo30Minutes` de
  `calendario-extracted/src/utils/dateUtils.ts` para `src/lib/schedule.ts`
  (já temos `layoutTimedEntry`; adicionar colunas/overlap).
- `WeekGrid.tsx`: trocar posicionamento `left-1 right-1` (largura total) por
  `left/width` derivados de `colIndex`/`totalCols`; manter tokens de camada
  (`--ds-layer-*-bg/border/fg`).
- `CalendarDayView` equivalente: nossa grade atual é só semana (5 dias); a view "dia"
  do referencial (`CalendarDayView.tsx`) serve de template para uma coluna única
  arrastável quando `view==='dia'`. Reaproveitar a lógica de drag/resize do referencial.

### Fase B — Arrastar e redimensionar (write-back real)
- Em `WeekGrid`/`DayView`: adotar os handlers `draggingState`/`resizingState` do referencial
  (mouse down/move/up em `window`), com `snapTo30Minutes`.
- Ao soltar: chamar handlers novos em `desktopApp`:
  - `rescheduleExam(id, date, time?)`, `rescheduleTask(id, date)`,
    `rescheduleSession(id, date, startTime)`, `rescheduleTccChapter(idx, date)`.
  - Esses atualizam o estado persistente (`AppContext`) e disparam toast acolhedor
    ("agendamento ajustado ♡").
- `aula`: `onMouseDown` não inicia drag; abre detalhe da disciplina.

### Fase C — Slot-click para criar
- Nos slots de 30min da grade: ao clicar, abrir criação pré-preenchida com `date`+`time`.
- Reaproveitar o `QuickAddModal` existente (canônico) passando `initialDate`/`initialTime`
  e deixando a usuária escolher o tipo (prova/tarefa/bloco de estudo). O `ItemModal.tsx`
  do referencial é o **template visual** (tipo/camada/etapas/observações) — adaptar para
  nosso modelo em vez de um `CalendarItem` livre.
- Dica hover "+ HH:MM (30m)" nos slots (copiar do referencial).

### Fase D — Painel de contexto mais rico
- Elevar `CalendarContextPanel.tsx` para espelhar `EventDetailModal.tsx` do referencial:
  - toggle de status/conclusão inline (prova/tarefa/sessão/tcc);
  - etapas: adicionar/toggle (capítulos de TCC já são etapas; para tarefa, futuro);
  - botão "editar" → abre wizard correto (prova/tarefa/TCC/estudo);
  - "reagendar" vira modal real de data/hora (substitui o placeholder de toast);
  - "iniciar timer" → `app.openStudy('focus')` (já existe);
  - observações editáveis quando aplicável.
- Manter copy acolhedora e tokens; remover `alert()` (já não usamos).

### Fase M — Mês e Agenda (alinhamento)
- `MonthView.tsx` e `AgendaView.tsx`: alinhar cores/bordas aos tokens e ao padrão do
  referencial (chips com borda-esquerda na cor da camada, toggle de conclusão na agenda,
  botão "focar" na agenda para sessões). `AgendaView.tsx` do referencial é o template.

---

## 5. Decisões de design (design system + mobile feel)

- **Cores por camada**: já temos `--ds-layer-faculdade/tcc/estudos/externo` (bg/border/fg).
  Usar consistentemente; não reintroduzir hex.
- **Cantos/sombras**: cards de evento `rounded-2xl`, `shadow-xs`→`hover:shadow-sm`;
  selecionado com `ring-2 ring-[var(--ds-layer-*-fg)]/40` (estilo referencial).
- **Copy**: manter minúsculas e tom ("agendamento ajustado ♡", "bora focar?").
- **Acessibilidade**: `role`/`aria-label` nos blocos arrastáveis; `aria-pressed` no toggle
  de status; foco visível.
- **Mobile feel**: o painel de contexto à direita (desktop) espelha a folha de detalhe do
  mobile; no mobile (web) a sub-tab calendário já existe na Faculdade — manter comportamento
  leve (sem drag; ações de dia/horário via menus), conforme a spec do calendário (§8).

---

## 6. O que NÃO copiar do zip (já removido)

`App.tsx`, `Sidebar`, `TopHeader`, `ContextualPanel`, `CommandPalette`, `ToastNotification`,
`ActiveTimerBanner`, `GoogleSyncModal`, `CeciSuggestionsModal`, `HoursAnalyticsModal`,
`HoursKnowledgeView`, `ExecutionLogModal`, `RescheduleModal` (IA), `ambientAudio`,
`initialData`, `hoursData`, assets, configs de build. Motivo: fora de escopo ou já temos
equivalente na casca desktop.

**Mantido como template de UI/UX:** `CalendarWeekView.tsx`, `CalendarDayView.tsx`,
`CalendarMonthView.tsx`, `CalendarAgendaView.tsx`, `EventDetailModal.tsx`, `ItemModal.tsx`,
`utils/dateUtils.ts` (helpers de grade/overlap), `types.ts` (modelo de referência).

---

## 7. Verificação

- `npm run lint` (tsc --noEmit) verde.
- `npm run test` verde (adicionar testes a `lib/schedule.ts` para `computeOverlappingEventLayout`
  e write-back de reschedule, seStillNone).
- `npm run build` verde.
- `node .github/scripts/check-boundaries.mjs` (sem import de react/capacitor em `packages/*`;
  `lib/schedule.ts` é `src/lib` — ok).
- Manual: arrastar prova/tarefa/sessão atualiza o estado e persiste; slot-click cria;
  painel mostra status/etapas/editar; mês/agenda alinhados.

---

## 10. Regras do aplicativo (desktop preview)

- A preview da casca desktop **somente** está disponível via `npm run dev:desktop`.
- O query `?platform=desktop` foi removido; a detecção usa `window.__TAURI_INTERNALS__` (ou o script `dev:desktop`).
- Para visualizar a tela de calendário com as novas interações (arrasto, colunas sobrepostas, etc.), execute `npm run dev:desktop`.
- A sub-tab inicial da faculdade agora é `calendário` (definido em `AppContext.tsx:760`). Para alternar de volta para `disciplinas`, use o seletor de sub-tab ou navegue via hash `#!/faculdade/disciplinas`.

---

## 8. Ordem sugerida

1. Fase A (overlap) — maior ganho visual, baixo risco.
2. Fase B (drag/resize + write-back) — requer os novos campos (`Exam.time`, `StudySession.startTime`).
3. Fase C (slot-create).
4. Fase D (painel rico).
5. Fase M (mês/agenda).

---

## 9. Registro de implementação (2026-08-29)

Todas as fases (A–M) foram implementadas de uma vez, incrementalmente, com verificação verde.

- `src/lib/schedule.ts`: + `timeToMinutes`, `minutesToTime`, `snapTo30Minutes`,
  `computeOverlappingEventLayout`, tipo `TimedLayoutEntry`; `CalendarEntry` ganhou
  `entryRef`/`dataId`; `buildCalendarWeek` popula `entryRef`/`dataId` e usa `Exam.time` /
  `StudySession.startTime` quando presentes.
- `src/types.ts`: `Exam.time?` e `StudySession.startTime?` (opcionais, retrocompatíveis).
- `src/desktop/components/calendar/WeekGrid.tsx`: renderiza temporizados em colunas lado-a-lido
  via `computeOverlappingEventLayout`; aceita `onReschedule` e `onSlotCreate` (duplo-clique → horário).
- Novos: `DraggableTimedEvent.tsx` (arrasto + resize com write-back, aulas não arrastáveis),
  `DraggableAllDayEvent.tsx` (arrasto horizontal entre dias para tarefa/tccChapter).
- `AllDayRow.tsx`: usa `DraggableAllDayEvent` + `onSlotCreate` (duplo-clique em célula vazia).
- `EventBlock.tsx`: aceita `className` para preencher altura no arrasto.
- `CalendarScreen.tsx`: `applyReschedule` unificado (exam/session/tccChapter/task) usando
  `handleUpdateExam`/`handleUpdateSession`/`handleUpdateTcc`/`handleUpdateTask`; `slotCreate`
  abre quick-add; `toggleDone` e `editEntry` (abrem wizard/curso/tcc).
- `CalendarContextPanel.tsx`: editor inline de reagendamento (data + horário), toggle
  "concluído", botão "editar"; `onReschedule(date, start?)`.
- `MonthView.tsx`: mini-eventos coloridos por dia (até 3 + "+N") em vez de só pontos.
- `tsconfig.json`: exclui `desktop/context-desktop/calendario-extracted` do typecheck (template).
- Verificação: `npm run lint` ok · `npm run test` 500 pass · `npm run build` ok ·
  `check-boundaries.mjs` ok.
