# Spec: CourseWizard — frequência em horas, campos, ícone emoji e paleta de cores

> **Status: implementada (2026-09-23).** Gate verde: `npm run lint` + `npm run test` (834)
> + `npm run build` + `node .github/scripts/check-boundaries.mjs`.

> Expansão do wizard de criação de disciplina (e do `EditCourseModal`): a frequência passa a
> ser declarada em **horas** (carga horária da faculdade), novos campos (categoria, média
> mínima, atendimento) são coletados onde já existem na `Course`, o ícone pode ser um
> **emoji guardado de verdade** (além dos 16 ícones Lucide) e a paleta de cores cresce de 7
> para ~18 opções com variações por família. Aulas (base da frequência) passam a ser
> **derivadas do horário**: se a matéria tem 1 dia de 2h por semana e carga de 66h, são 33
> aulas — a usuária nunca digita "número de aulas".

## Objetivo

Hoje o `CourseWizard` coleta apenas nome, código, semestre, horário, local, cor (7 hex) e um
ícone Lucide (a "emoji" do `ChoiceCardGrid` é só affordance visual, não é salva). Os campos
`category`, `minGrade`, `officeHours` e `attendance` já existem na `Course`
(`src/types/entity.ts:53-73`) mas **nenhum** é coletado no wizard — só o `EditCourseModal`
meche neles, e o modal de frequência pede "número de aulas", que a usuária não conhece
(faculdades informam carga horária em horas).

Esta spec propõe:

1. **Frequência em horas** — o wizard pede "carga horária total (h)" e "horas já feitas";
   o número de aulas (`attendance.total`/`baseAttended`) é **derivado** da duração média dos
   slots do horário. Exemplo real: matéria com 1 slot de 2h/semana e carga de 66h → 33 aulas.
2. **Novos campos** — categoria, média mínima e atendimento coletados no wizard (novo passo
   "frequência & requisitos") e refletidos no resumo/revisar.
3. **Ícone emoji** — um emoji escolhido em grade **é salvo em `Course.icon`** e renderizado
   como texto (cor da disciplina); os 16 ícones Lucide continuam disponíveis. Header, cards,
   edit e wizard respeitam os dois tipos.
4. **Paleta maior** — de 7 para **18 cores** (3–4 passos por família das escalas `@theme`),
   todas usáveis no wizard e no `EditCourseModal`.

## User Stories / Critérios de aceite

1. **Criar disciplina com carga horária em horas.** "Como usuária, ao criar uma disciplina eu
   quero informar quantas horas a matéria tem no total e quantas eu já fiz, e deixar o app
   descobrir quantas aulas isso dá pelo meu horário."
   - Aceite: novo passo "frequência" tem `carga horária total (h)` e `horas já feitas (h)`;
     mostra a previsão reativa "≈ 33 aulas de 2h com o seu horário"; se `carga total > 0`,
     salvar grava `attendance = { total: derivado, minPct, baseAttended: derivado,
     totalHours, baseHoursDone, records: [] }`; se vazio, não cria `attendance`.
   - Aceite: duração da aula = média das durações dos slots (`end - start`, minutos→horas);
     slot sem `end` conta 2h (`DEFAULT_CLASS_HOURS`); horário vazio → 2h por aula.

2. **Slide em vez de digitação.** "Como usuária, quero informar horas com um slider e
   digitação livre ao mesmo tempo, sem medo de errar."
   - Aceite: `EmailSlider` (nova primitiva de InputRange estilizada) + campo numérico
     sincronizados; passos de 1h no wizard e de 0,5h no editar.

3. **Campos antes perdidos no wizard.** "Como usuária, ao criar quero já dizer a categoria da
   matéria, a média mínima para passar e o atendimento."
   - Aceite: no passo "frequência & requisitos": `category` (select, valores
     `obrigatoria/optativa/estagio/tcc/extra`), `minGrade` (0–10, passthrough se vazio) e
     `officeHours` (texto livre, opcional) — todos persistidos em `handleAddCourse`.

4. **Ícone com emoji de verdade.** "Como usuária, quero um ícone de emoji (🧠, 🌸, 🦋…)
   que fique salvo e apareça do mesmo jeito do ícone Lucide, inclusive no header."
   - Aceite: passo "visual" tem duas grades — emojis (~42 curados) e ícones Lucide (16);
     emoji selecionado é salvo em `Course.icon` (ex.: `'🧠'`); `CourseIcon`, cards, header
     e `EditCourseModal` renderizam emoji como `<span>` na cor da disciplina; ícone antigo
     sem emoji (`'Brain'`) continua funcionando.
   - Aceite: `DynamicHeaderConfig.icon` (header do curso) aceita `string` (emoji ou nome
     Lucide); `CourseIconName` (união dos 16 Lucide) **não muda** (sem tocar
     `packages/navigation`).

5. **Mais cores.** "Como usuária, quero mais opções de cor para as capas das disciplinas."
   - Aceite: `COURSE_COLORS` passa de 7 para **18** hex (variações 400/500/600/700 de rose,
     blue, green, yellow, red, beige — espelhando exatamente as escalas `@theme` do
     `src/index.css`). As 7 cores antigas permanecem (disciplinas já criadas continuam
     selecionáveis).

6. **Editar sem migrar usuária para "aulas".** "Como usuária, no editar também quero informar
   horas, e uma disciplina que eu já tinha criado com '12 aulas' deve continuar do mesmo jeito."
   - Aceite: `EditCourseModal` troca os inputs "total de aulas"/"já feitas" por horas;
     disciplina legada sem `totalHours` abre com `total × duração média` pré-preenchido
     (modal apenas, sem salvar); salvar grava `totalHours`/`baseHoursDone` e os derivados.
   - Aceite: migração 17 **retroalimenta** `totalHours = total × duração média` e
     `baseHoursDone = baseAttended × duração média` para disciplinas com `attendance`
     existente (backup antigo → total de horas preenchível imediatamente).

## Comandos

Gate exigido após qualquer mudança (ver AGENTS.md):
- `npm run lint` — typecheck (`tsc --noEmit`).
- `npm run test` — Vitest (jsdom). Novos testes em `src/lib/__tests__/*`.
- `node .github/scripts/check-boundaries.mjs` — obrigatório pois `packages/data` muda.
- `npm run build` — Vite build.

Regeneração de golden files (SE o formato persistido mudar em `goldenSample.ts`):
- `GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts` + re-commit de
  `cecistudy-rust/contracts/golden/*`.
- Nota: os campos novos são **opcionais**; o `goldenSample` não precisa mudar → goldens
  íntegros. A env `goldenEnvelope.schemaVersion: 13` e o espelho
  `cecistudy-rust/crates/cecistudy-data/src/migrations.rs` (`SCHEMA_VERSION = 13`) já estão
  atrás do TS (16) — drift pré-existente, documentado como follow-up (alinhar o gate cargo
  aos golden files); este bump para 17 alarga o drift, sem efeito no runtime web.

## Estrutura de pastas / arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/types/entity.ts` | `CourseAttendance` + `totalHours?`/`baseHoursDone?` (opcionais) |
| `src/types/navigation.ts` | `DynamicHeaderConfig.icon?: CourseIconName \| string` |
| `packages/data/src/schema.ts` | `SCHEMA_VERSION` 16→17 + `MIGRATIONS[17]` (backfill horas) |
| `src/data/__tests__/schema.test.ts` | expect de versão 16→17 + teste da migração 17 |
| `src/lib/attendance.ts` | helpers puros: `hoursPerClassFromSchedule`, `classesFromHours`, `hoursFromClasses`, `buildAttendanceFromHours` |
| `src/lib/__tests__/attendance.test.ts` | testes dos helpers novos |
| `src/lib/courseOptions.ts` | `COURSE_COLORS` 7→18; `COURSE_ICON_OPTIONS` com os 16; novo `COURSE_EMOJIS` |
| `src/lib/__tests__/courseOptions.test.ts` | (novo) unicidade/cobertura de cores e ícones, emojis não-vazios |
| `src/components/ui/CourseIcon.tsx` | branch emoji: se `icon` não for chave do mapa, renderiza `<span>` na cor da disciplina |
| `src/components/ui/EmailSlider.tsx` | (novo) slider estilizado + campo numérico sincronizados |
| `src/components/ui/CourseIconPicker.tsx` | (novo) grade de emoji + grade Lucide (usado no wizard e no editar) |
| `src/components/ui/__tests__/CourseIconPicker.test.tsx` | seleção emoji/lucide |
| `src/lib/headerConfig.ts:348` | `icon: focusedCourse.icon` (sem cast) |
| `src/components/wizards/CourseWizard.tsx` | novo passo `curso-frequencia` + grade nova no passo visual + persistência + revisar |
| `src/components/courses/EditCourseModal.tsx` | inputs de frequência em horas + `CourseIconPicker` + `COURSE_COLORS` 18 |
| `src/components/courses/CourseAttendanceCard.tsx` | copy do empty state: "definir carga horária" em vez de "total de aulas" |

## Modelo de dados proposto

### `CourseAttendance` (`src/types/entity.ts`, campos opcionais — nada quebra)

```ts
export interface CourseAttendance {
  total: number;            // aulas derivadas (permanece — base de attendanceStats/registros)
  minPct: number;
  baseAttended: number;     // aulas já feitas antes dos registros
  records: AttendanceRecord[];
  totalHours?: number;      // NOVO — carga horária total em horas (fonte da verdade na UI)
  baseHoursDone?: number;   // NOVO — horas já feitas antes dos registros
}
```

- `total`/`baseAttended` continuam sendo as unidades da lógica de frequência
  (`attendanceStats`, registros, margem de faltas) — **zona do `src/lib/attendance.ts`
  intacta**; só os campos novos se somam.
- Aulas derivadas no save: `total = classesFromHours(totalHours, schedule)`,
  `baseAttended = min(classesFromHours(baseHoursDone, schedule), total)` (clamp a `total`).

### Helpers puros (novos em `src/lib/attendance.ts`)

```ts
export const DEFAULT_CLASS_HOURS = 2; // já existe

// Duração média dos slots do horário (minutos→horas); slot sem `end` → DEFAULT_CLASS_HOURS;
// horário vazio → DEFAULT_CLASS_HOURS. Retorna horas (float).
hoursPerClassFromSchedule(schedule?: CourseScheduleSlot[]): number;

// Aulas derivadas = arredonda(totalHours / horasPorAula); totalHours>0 ⇒ mínimo 1.
classesFromHours(totalHours: number, schedule?: CourseScheduleSlot[]): number;

// Reverso (migração/editar legado): horas ≈ aulas × horasPorAula.
hoursFromClasses(totalClasses: number, schedule?: CourseScheduleSlot[]): number;

// Constrói o `attendance` completo a partir de horas (ou undefined se totalHours vazio/<=0).
buildAttendanceFromHours(opts: { totalHours?: number; hoursDone?: number; minPct?: number;
  schedule?: CourseScheduleSlot[] }): CourseAttendance | undefined;
```

Exemplos (critério 1): `{totalHours: 66, schedule: [1 dia de 19:00–21:00]}` → aulas 33;
`schedule: []` → horasPorAula 2 → 33; `{totalHours: 66, schedule: [19:00–21:00, 19:00–20:30]}`
→ média 1,75 → aulas 38.

### Schema & migração (`packages/data/src/schema.ts`)

- `SCHEMA_VERSION` 16 → **17** (formato persistido muda). `MIGRATIONS[17]`:

```ts
// 16 → 17: frequência em horas (SPEC-004). `CourseAttendance` ganha `totalHours`/
// `baseHoursDone` (opcionais). Backfill para disciplinas com `attendance` que já têm
// horário: totalHours = total × duração média; baseHoursDone = baseAttended × duração média.
17: (data) => ({ ...data, courses: ((data.courses ?? []) as any[]).map((c) => {
    const a = c.attendance;
    if (!a || typeof a.total !== 'number') return c;
    const hpc = hoursPerClassFromSchedule(c.schedule);
    return {
      ...c,
      attendance: { ...a,
        totalHours: a.totalHours ?? Math.round(a.total * hpc * 10) / 10,
        baseHoursDone: a.baseHoursDone ?? Math.round((a.baseAttended ?? 0) * hpc * 10) / 10,
      },
    };
  }) }),
```

- Discrete/redondo: 1 casa decimal (`×10/10`) para evitar `66.0000001`.
- `schema.test.ts` atualiza a expect da versão (hoje espera 16) e ganha um caso
  16→17 com backfill + idempotência (não sobrescreve `totalHours` já presente).

### Ícone

- `Course.icon: string` já é `string` (`src/types/entity.ts:66`) — sem mudança de tipo.
- `DynamicHeaderConfig.icon?: CourseIconName` → `CourseIconName | string`
  (`src/types/navigation.ts:39`) — o header do curso pode receber emoji.
- `CourseIcon` (ui): `COURSE_ICON_MAP[icon]` resolve → Lucide; senão → emoji
  (`<span className="inline-flex …">{icon}</span>`, cor = classe da disciplina ou
  `text-ceci-brand-strong`). GraduationCap segue fallback para vazio.

## UI/UX

### Novo passo `curso-frequencia` (entre `curso-detalhes` e `curso-estilo`)

1. **Carga horária total (h)** — `EmailSlider` (slider estilizado 1–360h + input numérico
   sincronizado; pré-valor `''`).
2. **Horas já feitas (h)** — idem, passos de 1h; clamp interno a `carga total` quando
   informada (inteligência com carinho: não deixa marcar mais do que o total).
3. **Previsão reativa**: "≈ {n} aulas de {h}h com o seu horário" — derivada do schedule do
   passo anterior; some/avisa se horário vazio ("horário vazio → contei aulas de 2h").
4. **Média mínima (0–10)** — slider 0–10 (passthrough; vazio = "não me lembro agora ♡").
5. **Categoria** — pills: obrigatória / optativa / estágio / tcc / extra.
6. **Atendimento** — input texto curto opcional (ex.: "terças 14h–16h, sala 203").

Passo de **prosseguir** validado pelo menos com o nome (como hoje); campos de frequência
opcionais. Botão "pular" quando nada preenchido.

### Passo visual (`curso-estilo`) — `CourseIconPicker`

- Duas seções: **"emoji"** (grade 6×7, ~42 emojis curados de psico/academia/natureza) e
  **"ícone"** (os 16 Lucide com label). Seleção única; `aria-label` por opção; emoji em
  grade maior (text-2xl) com fundo `surface-rose` quando ativo.
- `CourseIconPicker` também usado no `EditCourseModal` (paridade visual).
- Emoji curados: classe psicologia `🧠 📚 ✍️ 📝 🎓 🔬 🧬 🧩 💭` + academia `🏛️ ⚖️ 💊 🎯 ⏳ 📈 🧭 🪶` + natureza/afeto `🌸 🦋 🌱 🐝 🦉 🐢 🐋 🐈 🌼 🍀 🌙 ☀️` + arte/ferramentas `🎨 🎸 📷 ⚗️ 🧵 🗿 🧘 ✨` (~42).

### Paleta `COURSE_COLORS` (18)

Rose `#F596AA #E97891 #D85F79 #B94862` · Blue `#83BCD0 #609FB8 #4A879F #396D82` ·
Green `#8BC7A2 #5A9F76 #43805B` · Yellow `#E8C36D #BD913C` · Red `#E89189 #D97A72 #A8514B` ·
Beige `#AD9986 #756354` — todos espelhando as escalas `@theme` (`src/index.css:21+`).
As 7 atuais (`#E97891 #B94862 #609FB8 #4A879F #8BC7A2 #AD9986 #BD913C`) permanecem na lista.

### Copy

- Frequência: "carga horária total (h)", "horas já feitas", "≈ {n} aulas de {h}h",
  "frequência mínima (%)", "define quantas aulas a matéria tem de verdade ♡".
- Empty state do `CourseAttendanceCard`: "definir carga horária em horas" (em vez de
  "o total de aulas").

## Navegação & persistência

- Nada muda na navegação (wizard já é fluxo de passos sobre a aba faculdade).
- `formData` local do wizard ganha `category/minGrade/officeHours/totalHours/hoursDone/
  minPct`, consumidos no `handleAddCourse` final (passo `revisar` mostra "frequência",
  "requisitos" e "visual" — emoji aparece como texto).
- `EditCourseModal` salva com os mesmos helpers (deriva `total`/`baseAttended` dos novos
  campos de horas e preserva `records`).
- Persistência: sem novos keys; reaproveita `cecistudy_courses` (campos novos via
  `usePersistentState` + `backupSchema` passthrough — sem validação estrita de
  `attendance`, verificado).

## Plano de implementação (tasks)

1. **T1 — Modelo, helpers e schema (boundary).** `entity.ts` (campos opcionais) +
   `attendance.ts` (4 helpers) + `schema.ts` (17 + MIGRATIONS[17]) + `schema.test.ts`
   (versão e migração) + testes de helpers em `attendance.test.ts`.
2. **T2 — Opções.** `courseOptions.ts`: 18 cores, 16 ícones, `COURSE_EMOJIS` + teste novo
   `courseOptions.test.ts`.
3. **T3 — Renderização do ícone.** `CourseIcon.tsx` (branch emoji) +
   `types/navigation.ts` (icon `| string`) + `headerConfig.ts:348` (sem cast) +
   teste do `CourseIcon` (emoji e fallback).
4. **T4 — Picker + slider.** `CourseIconPicker.tsx` + `EmailSlider.tsx` + testes.
5. **T5 — Wizard.** `CourseWizard.tsx`: novo passo `curso-frequencia`, grade nova no
   `curso-estilo`, revisar, save via helpers.
6. **T6 — Editar & frequência.** `EditCourseModal.tsx` (horas + picker + 18 cores) +
   `CourseAttendanceCard.tsx` (copy).
7. **T7 — Gate.** `npm run lint` + `npm run test` + boundary + `npm run build`; spec →
   implementada; atualiza `tasks/todo.md`.

Tasks ≤ 5 arquivos cada, ordem respeita dependências (schema antes de UI; helpers antes do
wizard/editar).

## Testes

- `attendance.test.ts` (+~6): `hoursPerClassFromSchedule` (slot único/duplo/sem end/vazio),
  `classesFromHours` (66h→33, mínimo 1, vazio→2h), `hoursFromClasses` (redondo), clamp de
  `baseAttended`.
- `schema.test.ts`: `SCHEMA_VERSION === 17`; migração 16→17 backfill (com e sem `attendance`,
  idempotente, `totalHours` presente não sobrescrito, `total` não-numérico preservado).
- `courseOptions.test.ts`: 18 cores únicas ∈ escalas `@theme`; `COURSE_ICON_OPTIONS`
  = 16 valores ⊆ `COURSE_ICON_NAMES`; `COURSE_EMOJIS` não-vazio e único.
- `CourseIcon.test`: emoji renderiza texto; nome Lucide renderiza ícone; vazio → GraduationCap.
- `CourseIconPicker.test`: seleção emoji e Lucide chamam `onChange` com valor certo.
- Regressão: `attendance.test.ts`/`goldenFixtures`/`exportImport` verdes (galho limpo).

## Boundaries (per `.github/scripts/check-boundaries.mjs` + AGENTS.md)

- `packages/data` muda (`schema.ts`): rota obrigatória o gate. `packages/data` continua sem
  importar React/Capacitor; os helpers de horas moram em `src/lib/attendance.ts` (fora do
  pacote) e são importados pelo `schema.ts` — padrão já existente
  (`parseLegacySchedule`, `migrateLegacyAttendance`) e permitido (lib client).
- `packages/navigation` **não muda** (`CourseIconName` intacto); `src/types/navigation.ts`
  (tipo React-dependente) alarga `icon` para `| string`.
- Stub de compat de tipos (`src/types/entity.ts`) re-exporta de `packages/domain` com
  caminho relativo — campos novos vão no shape de `CourseAttendance` que a UI consome.

## Success Criteria

- Gate completo verde: lint, testes (galho limpo + novos), boundary, build.
- Critérios 1–6 do aceite cobertos por teste ou verificação manual descrita no
  `tasks/todo.md`.
- Nenhum curso existente muda em `export/import` (migração idempotente; só soma horas em
  `attendance` quando o backup já tem aulas).

## Open Questions

- **Formato dos horários irregulares** (ex.: aula de 4h 1×/mês): a duração média cobre o
  caso do "1 dia 2h", mas turmas com blocos irregulares subestimam. Registrado como
  follow-up: permitir "duração da aula" manual no editar (gancho: `hoursPerClassFromSchedule`).
  ▽ *Não-blocking para esta fase.*
- **`total`/`baseAttended` (aulas) permanecem o contrato da frequência** (registros,
  margem, provas?): [x] decisão — sim, derivados; NÃO migrar registros para horas agora.
- **Migração 17 vs backup restaurado**: backup v16 com `attendance` de curso **sem**
  horário ganha `totalHours = total × 2h` — aceito (horário vazio cai no default).
- **Drift Rust (`SCHEMA_VERSION 13`)**: alargado para 17; follow-up dedicado (alinhar gate
  cargo aos golden files) fora do escopo.