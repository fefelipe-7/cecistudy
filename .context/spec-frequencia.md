# Spec — Frequência de participação nas aulas (cecistudy)

**Base:** análise do código real (`src/types/entity.ts`, `src/components/courses/EditCourseModal.tsx`,
`src/components/courses/detail/CourseInfoContent.tsx`, `src/components/views/home/TodayClasses.tsx`,
`src/components/views/HomeView.tsx`, `src/components/views/CourseDetailView.tsx`,
`src/components/courses/detail/CourseAulasContent.tsx`, `src/context/dataActions.ts`,
`packages/data/src/schema.ts`, `packages/data/src/persistentData.ts`, `packages/data/src/backupSchema.ts`,
`packages/sync/src/stamp.ts`, `src/lib/schedule.ts`) + padrões do design system.

**Status:** proposta para revisão. Nenhum código escrito ainda.

---

## 1. Diagnóstico (o que existe hoje)

O campo `attendance` existe (`src/types/entity.ts:44-45`), mas é um **contador manual desligado da realidade**:

| Ponto | Onde | Problema |
|---|---|---|
| Dado é só 2 números soltos | `Course.attendance?: { attended: number; total: number }` | Sem histórico, sem cancelamento, sem vínculo com datas |
| Edição é crua | `EditCourseModal.tsx:169-176` — inputs "aulas assistidas"/"total de aulas" | Usuária tem que manter a matemática na cabeça |
| Exibição só quando preenchido | `CourseInfoContent.tsx:72-78` — barra só renderiza se `attendance.total > 0` | Se nunca preencheu, a frequência nem aparece |
| Sem margem de faltas | `CourseInfoContent.tsx:199-201` — só mostra "% + ausências" | Não responde "quantas ainda posso faltar?" |
| Regra fixa embutida | `CourseInfoContent.tsx:116,133-146,204` — `75` hardcoded em 3 trechos | Não configurável |
| "hoje na facul" não registra nada | `TodayClasses.tsx:22-24` — tocar na aula só abre a matéria | Sem atalho de presença no momento certo |
| Histórico só tem anotações | `CourseAulasContent.tsx:209-221` — "diário de aulas" lista só `ClassNote` | Presença não aparece nem pode ser editada |

**Veredito:** não rastreia "quantas aulas fiz do total", não responde "quantas ainda posso faltar" e não avisa
quando a margem estourou — é só um par de números digitado à mão.

---

## 2. Objetivo

Transformar a frequência num **rastreador de verdade**, com o hábito partindo da Home:

- **Registrar por aula do dia** na Home ("hoje na facul"), num menu de 4 opções:
  1. **"fui na aula"** → marca presença (`presente`), sem precisar anotar nada;
  2. **"anotar alguma coisinha"** → marca presença **e** entra no fluxo de anotação de aula existente;
  3. **"ainda bem que cancelou"** → registra aula **cancelada** (não conta no total de horas);
  4. **"deixei de ir"** → registra **falta** (conta como falta de verdade).
- **Responder sempre:** "X de Y assistidas · frequência Z% · pode faltar mais N".
- **Avisar** quando a margem de faltas zerar ou estourar.
- Manter tudo num **histórico editável por disciplina** (aba aulas) + **atalhos no detalhe** da matéria.
- Total de aulas do semestre **manual** (ajustável para bater com a realidade); **mínimo de presença configurável por matéria** (default 75%).

---

## 3. Regra de negócio (núcleo puro — `src/lib/attendance.ts`)

Fórmula da margem (padrão de cursos de graduação):
```
mínimo de presença      minPct                       (default 75, editável por matéria)
aulas previstas         total                        (manual, ajustável)
máx de faltas           maxAbsences = floor(total × (100 - minPct) / 100)
faltas usadas           absences     = registros 'falta'
margem restante         margin       = maxAbsences - absences   (negativo = estourou)
```
Derivados em `attendanceStats(attendance)`:
```ts
export type AttendanceStatus = 'ok' | 'atencao' | 'limite' | 'estourou';

export interface AttendanceStats {
  attended: number;      // baseAttended + registros 'presente'
  absences: number;      // registros 'falta'
  cancelled: number;     // registros 'cancelada'
  realized: number;      // attended + absences (aulas que de fato aconteceram)
  total: number;         // manual
  minPct: number;        // manual (default 75)
  pct: number;           // realized ? round(attended / realized * 100) : 0  — frequência até agora
  maxAbsences: number;   // floor(total × (100 - minPct) / 100)
  margin: number;        // maxAbsences - absences  (faltas que ainda pode ter)
  status: AttendanceStatus;
}
```
Status:
- `ok` → `margin > 0` e `pct >= minPct` (ou nenhuma aula realizada ainda);
- `atencao` → `margin > 0` e `pct < minPct`;
- `limite` → `margin === 0`;
- `estourou` → `margin < 0`.

Funções puras (mesmo padrão de `src/lib/taskLogic.ts` / `streak.ts`):
```ts
export const DEFAULT_MIN_ATTENDANCE_PCT = 75;
export const DEFAULT_CLASS_HOURS = 2;               // horas assumidas quando o slot não tem término

export function attendanceStats(a?: CourseAttendance): AttendanceStats | null;   // null se attendance ausente/indefinido
export function applyAttendanceAction(course: Course, action: AttendanceAction, date: string): Course;
export function updateAttendanceRecord(course: Course, recordId: string, patch: Partial<AttendanceRecord>): Course;
export function removeAttendanceRecord(course: Course, recordId: string): Course;
export function upsertPresenceForClassNote(course: Course, note: { courseId: string; date: string; id: string }): Course;
export function recordHoursForCourse(course: Course, date: string): number | undefined; // duração do slot/2h default
```
`applyAttendanceAction` faz **upsert por data** (uma aula só tem um registro): se já existe registro na data,
troca o status; `noteId` é preservado em `presente` e desvinculado em `falta`/`cancelada`.

`upsertPresenceForClassNote` (usado em `addClassNote`): anotar aula implica presença →
- sem registro na data → cria `presente` com `noteId`;
- registro `presente` → apenas vincula `noteId`;
- registro `falta`/`cancelada` → **mantém** o status e vincula `noteId` (anotou mesmo assim).

---

## 4. Modelo de dados (`src/types/entity.ts`)

`Course.attendance` evolui de números soltos para **config + histórico**:
```ts
export type AttendanceStatus = 'presente' | 'falta' | 'cancelada';

export interface AttendanceRecord {
  id: string;             // 'ar-<timestamp>' (padrão Date.now() do QuickAdd)
  date: string;           // YYYY-MM-DD da aula acontecida
  status: AttendanceStatus;
  noteId?: string;        // se "anotar alguma coisinha" → vincula a ClassNote criada
  hours?: number;         // duração da aula (derivada do slot; editável)
  updatedAt?: string;
}

export interface CourseAttendance {
  total: number;          // aulas PREVISTAS no semestre (manual)
  minPct: number;         // mínimo de presença %, default 75
  baseAttended?: number;  // assistidas acumuladas ANTES do histórico (offset legado)
  records: AttendanceRecord[];
}
// Course.attendance?: CourseAttendance   (mesmo campo, shape enriquecido)
```

**Por que aninhar em `Course` em vez de criar coleção nova** (decisão de arquitetura):
- presença é 1:N com a disciplina e vive no mesmo objeto que já sincroniza;
- `courses` já é coleção sincronizável (`packages/sync/src/stamp.ts:16`), persistida com `data_json`
  (`src/lib/db/normalize.ts:128` grava o objeto inteiro) — **zero** mudança em sync, SQLite, backup,
  import/export e sem nova chave `usePersistentState`;
- se um dia surgir painel transversal (frequência média do semestre no Perfil), **promover** o histórico
  para coleção própria — não fazer antes.

---

## 5. Migração & pipeline (formato persistido muda → bump de schema)

Formato de `Course.attendance` muda → seguir a regra do AGENTS (bump em `packages/data/src/schema.ts`):

1. **`SCHEMA_VERSION` 14 → 15** + `MIGRATIONS[15]` normaliza cada `course`:
   - `attendance` antigo `{ attended, total }` → `{ total, minPct: 75, baseAttended: attended, records: [] }`;
   - formato novo incompleto → garantir defaults (`records: []`, `minPct` se ausente);
   - `attendance` ausente → não toca (continua opcional).
2. **`packages/data/src/backupSchema.ts`** — `courseSchema` usa `.passthrough()` (`backupSchema.ts:38`), então
   o objeto aninhado passa intacto em import/export de backups antigos e novos (**sem mudança obrigatória**).
   Opcional: adicionar shape de `attendance` na validação para pegar malformações cedo.
3. **Persistência/SQLite** — `saveCourses` grava o curso inteiro em `data_json` (`normalize.ts:128`) →
   **sem mudança de tabela**; o `records` viaja junto. Mesma coisa para sync (`merge.ts` LWW sobre `courses`).
4. **`persistentData.ts`** — nenhuma coleção nova → sem mudança. `emptyDatabase` não precisa de seed novo.
5. **Gatilho:** `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs` (mexe em `packages/data`).

---

## 6. Estado & ações (`src/context`)

Sem chave nova de persistência (`courses` já existe). Ações novas expostas via `useMobileApp`
(mesmo padrão de `dataActions.ts`):

- `markAttendance(courseId, status: 'presente' | 'falta' | 'cancelada', date?)` — chama
  `applyAttendanceAction` (date default = hoje) e `setCourses`. Toast de confirmação ("prontinho ♡").
- `updateAttendanceRecord(courseId, recordId, patch)` / `removeAttendanceRecord(courseId, recordId)`.
- **Auto-upsert em `addClassNote`** (`dataActions.ts:207`): depois de `setClasses(prev => [...])`, chamar
  `setCourses` aplicando `upsertPresenceForClassNote` no curso da nota. Cobre TODOS os caminhos de criação
  de aula (quick capture, detalhe, transformação de nota), não só o menu da Home.

---

## 7. UI (mobile-first, tokens `ceci-*`, copy pt-BR minúsculo e acolhedor)

### 7.1 Home — "hoje na facul" vira o gatilho (`src/components/views/home/TodayClasses.tsx` + `HomeView.tsx`)
- Tocar no card de aula **abre um bottom sheet** novo (`src/components/courses/ClassActionsSheet.tsx`, via `Modal`)
  em vez de abrir direto a matéria.
- Sheet mostra matéria + horário do slot; se já existe registro **hoje**, marca o estado atual e oferece "desfazer".
- Grid **2×2** de ações:
  1. **fui na aula** — `UserCheck` → `markAttendance('presente')`.
  2. **anotar alguma coisinha** — `Feather` → `markAttendance('presente')` + `openCompose(course.id)` (fluxo
     de anotação existente; `noteId` é vinculado no save via `addClassNote`).
  3. **ainda bem que cancelou** — `CalendarX2` → `markAttendance('cancelada')` (não conta no total).
  4. **deixei de ir** — `UserMinus` → `markAttendance('falta')`.
- Botão discreto no sheet para abrir a matéria normalmente.

### 7.2 Detalhe — aba info (`src/components/courses/detail/CourseInfoContent.tsx`)
Substitui o card atual por um bloco **"frequência" sempre útil**:
- **Sem total configurado:** card de setup — "defina quantas aulas essa matéria tem no semestre para
  acompanhar sua frequência" → abre editar matéria.
- **Com total:** 
  - topline "assistidas **X** de **Y**" (AnimatedNumber + ProgressBar com cor por status);
  - linha "já faltou N · pode faltar mais M (limite K)" — a **margem** é o número protagonista;
  - badge "mínimo {minPct}%";
  - atalhos rápidos: 3 botões (`fui` / `falta` / `cancelada`) usando `markAttendance` + link "ver histórico";
  - mensagem por status (Mascote / tom do cecinho):
    - `ok` → "frequência de X% — bora continuar assim ♡";
    - `atencao` → "sua frequência está em X%, abaixo do mínimo de M% — ainda pode faltar N.";
    - `limite` → "cuidado: essa é a última falta que você pode ter.";
    - `estourou` → "você já faltou D além do permitido — vale conversar com o professor ♡".
- Remover o `75` hardcoded dos 3 trechos (`CourseInfoContent.tsx:116,133-146,204`).

### 7.3 Detalhe — aba aulas (`src/components/courses/detail/CourseAulasContent.tsx`)
"diário de aulas" vira **"histórico de aulas"** unificado por data:
- merge de `records` (presença) + `classes` (anotações), ordenados por data desc;
- cada linha: chip de status (presente ✓ verde / falta ✗ / cancelada) + data + título
  (nota vinculada, ou "aula do dia {data}");
- tocar em `record` → sheet de edição (`RecordEditSheet`: mudar status, excluir); tocar em nota →
  `openClassNoteDetail` (fluxo atual);
- long-press em record → `ManageSurface` (padrão existente de editar/excluir);
- manter botões "nova aula" e o empty state atual, agora com atalho "registrar presença".

### 7.4 Grade de disciplinas (`src/components/views/faculdade/DisciplinasGrid.tsx`)
Mini alerta quando `attendanceStats(status)` for `atencao`/`limite`/`estourou`:
pill "freq X%" com cor de aviso no card (não mostra nada quando ok/sem dados).

### 7.5 Editar matéria (`src/components/courses/EditCourseModal.tsx`)
Substituir os inputs crus por:
- **"total de aulas do semestre"** (`number`, placeholder "0 = não acompanhar");
- **"mínimo de presença %"** (`number` 50–100, default 75);
- **"aulas assistidas antes de começar a acompanhar"** → `baseAttended` (offset para quem já tinha
  contagem manual — preserva o dado antigo sem perder progresso).
`onSave` constrói `CourseAttendance` **sem apagar `records`** existentes.

---

## 8. Arquitetura de arquivos

```
src/lib/attendance.ts                     → NÚCLEO PURO (stats/ações/constantes)
src/lib/__tests__/attendance.test.ts      → Vitest/unit (padrão dos libs puros)
src/components/courses/ClassActionsSheet.tsx  → sheet 2×2 da Home + reuso no detalhe
src/components/courses/RecordEditSheet.tsx    → editar/apagar registro no histórico
src/components/courses/detail/CourseAttendanceCard.tsx → card de frequência (extraído do InfoContent)
packages/data/src/schema.ts                → SCHEMA_VERSION 15 + MIGRATIONS[15]
src/types/entity.ts                        → CourseAttendance/AttendanceRecord/AttendanceStatus
src/context/dataActions.ts                 → markAttendance/update/remove + auto-upsert em addClassNote
```

## 9. Comandos (gate)

```
Lint:    npm run lint                 # tsc --noEmit
Test:    npm run test                 # Vitest (jsdom); unit novo em src/lib/__tests__/attendance.test.ts
Single:  npm run test -- src/lib/__tests__/attendance.test.ts
Build:   npm run build
Boundary: node .github/scripts/check-boundaries.mjs   # obrigatório (toca packages/data)
```

## 10. Testes

- **`attendance.test.ts`** (núcleo puro — o mais importante):
  - `attendanceStats` legado (sem records, com total/baseAttended), `pct` e clamps;
  - matemática da margem: `total 32, minPct 75 → maxAbsences 8`; `total 30 → 7`;
  - status por combinação (ok/atencao/limite/estourou);
  - `applyAttendanceAction`: upsert por data, troca de status, cancelada não conta, vincula/desvincula `noteId`;
  - `updateAttendanceRecord`/`removeAttendanceRecord`;
  - `upsertPresenceForClassNote`: não sobrescreve `falta`/`cancelada`, vincula `noteId` no `presente`.
- **Migração** (`exportImport.test.ts` / `migrationFixtures.test.ts`): backup v14 com `attendance {attended,total}`
  → v15 converte; backup sem attendance → intacto.
- **Componente** (opcional): `ClassActionsSheet` dispara as 4 ações e mostra estado marcado quando já há registro.

## 11. Critérios de aceite

1. Na Home, tocar numa aula de hoje abre o menu 2×2; cada botão registra a aula com o status correto
   (presente conta assistida · falta conta como falta · cancelada não conta).
2. O detalhe da disciplina mostra "X de Y · frequência Z% · pode faltar mais N" e avisa quando a margem
   zera ou estoura.
3. O histórico (aba aulas) lista presenças e anotações por data e permite mudar status ou apagar registro.
4. "anotar alguma coisinha" abre o fluxo de anotação e a presença fica marcada junto (`noteId` vinculado).
5. Editar matéria permite ajustar total e mínimo (%) por matéria; margens recalculam sozinhos.
6. Grade de disciplinas exibe alerta quando alguma matéria passa do mínimo.
7. Gate: `npm run lint` + `npm run test` + `npm run build` + boundaries verdes; backup v14 importa sem perda.

## 12. Fora de escopo (v1)

- Sem novo dashboard de horas de aula no Perfil (dados `hours` já no modelo para evolução futura).
- Sem notificação de "bateu o limite de faltas" (pode virar extensão com `@capacitor/local-notifications`).
- Sem promoção do histórico a coleção própria (só se surgir painel transversal).
- Não muda o modelo de `ClassNote` (número/data) nem o scheduler de aulas do calendário.

## 13. Perguntas em aberto

- Default de duração da aula quando o slot não tem `end`: assumir **2h** (constante `DEFAULT_CLASS_HOURS`) ou
  100 min (padrão de hora-aula)? A spec assume 2h.
- "hoje na facul" continua mostrando **aulas futuras sem registro**; o que fazer com aula de dias passados
  que nunca foi registrada? v1 deixa sem tratamento (a presença só é registrada quando a usuária age).
- Devo escrever o plano de tarefas (`tasks/plan.md` + `todo.md`) a partir desta spec?