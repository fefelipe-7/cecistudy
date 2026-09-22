# Spec v2 — Stickers & Conquistas: correção, catálogo expandido e XP/nível

**Status:** aprovado para implementação (2026-09-12). Decisões pendentes da seção 8 resolvidas.
**Base:** análise do `spec-stickers.md` (v1) + leitura direta de `src/types/profile.ts`,
`src/data/stickerCatalog.ts`, `src/lib/stickers.ts`, `src/context/sharedAppValue.ts`,
`src/context/DataClientProvider.tsx`, `src/context/AppContext.tsx`,
`src/components/views/StickersView.tsx`, `src/components/views/perfil/StickersSection.tsx`.

Plano de execução (tarefas por fase, acceptance e verificação): `tasks/plan-stickers.md`.

---

## Decisões resolvidas hoje (2026-09-12)

| # | Ponto em aberto (v1/v2 §8) | Decisão |
|---|---|---|
| 1 | st-13c redação | **"organização em outro patamar — hiperfoco ativado"** (não nomear TDAH) |
| 2 | st-37c TCC em trio | **manter "resiliência de quem faz TCC em trio"** (Ceci faz TCC em trio) |
| 3 | Progresso na StickersView | **opção A** — expor `stickerState` via contexto (`SharedAppValue` → `AppContextValue` → `useMobileApp()`) |
| 4 | XP retroativo | **sim, único no boot** — perfis antigos com stickers já desbloqueados recebem o XP de uma vez, em silêncio (janela de boot) |
| 5 | Onde gravar | spec em `.context/spec-stickers-v2.md`; plano em `tasks/plan-stickers.md` (o `tasks/plan.md` segue ocupado pelo MOD/HAR/SEP) |

---

## 1. Achados críticos

### 1.1 21 dos 39 tipos de condição nunca são verdadeiros

`isConditionMet()` (`src/lib/stickers.ts`) só trata 18 dos 39 tipos de `StickerCondition`.
Os outros 21 caem em `default: return false` — nunca desbloqueiam, mesmo que a condição
real seja cumprida. Afeta: `exams-added`, `exams-done`, `concepts-known`, `authors-known`,
`materials-added`, `courses`, `flashcards-count`, `questions-created`, `techniques-used`,
`study-minutes`, `streak-total`, `reading-count`, `reading-in-progress`, `loose-notes`,
`internship-hours`, `internship-logs`, `tcc-created`, `tcc-chapters-done`,
`penultimate-semester`, `streak-longest`, `graduation`.

### 1.2 `questions-created` e `questions-mastered` apontam para a fonte de dados errada

`state.questions` **não é conteúdo criado pela usuária** — é o banco estático de questões do
catálogo editorial, carregado inteiro na abertura do app (mesmo tratamento das abordagens).
Ele nunca fica vazio nem cresce por ação da usuária. Implementar `questions-created` como
`state.questions.length >= min` desbloquearia o sticker **no primeiro carregamento**, sem
esforço — e `questions-mastered` nem compila de verdade (`StudyQuestion` não tem `correct`,
só `QuizAnswer.correct` dentro de `quizSessions`).

**Fonte correta:** `quizSessions: QuizSession[]` (`session.answers: QuizAnswer[]`, cada
resposta com `questionId` e `correct`). Contamos **IDs únicos** (não respostas totais) para
não permitir "farmar" respondendo a mesma questão repetida.

```ts
// src/lib/stickers.ts — helpers internos, não exportados
function answeredQuestionIds(quizSessions: StickerState['quizSessions']): Set<string> {
  return new Set(quizSessions.flatMap((s) => s.answers.map((a) => a.questionId)));
}
function correctlyAnsweredQuestionIds(quizSessions: StickerState['quizSessions']): Set<string> {
  const ids = new Set<string>();
  for (const s of quizSessions) {
    for (const a of s.answers) if (a.correct) ids.add(a.questionId);
  }
  return ids;
}
```

Descrição do sticker "perguntas no cantinho" (st-23): de *"registre 5 questões"* para
*"pratique 5 questões diferentes"* — a ação real da usuária é responder, não criar.

### 1.3 Bugs menores nas condições que hoje "funcionam" (mas mal)

```ts
// atual (confuso: precedência de && / ?: ignora condition.min na prática)
case 'streak-week':
  return state.streakTotal >= 5 && condition.min ? state.streakTotal >= condition.min : state.streakTotal >= 5;
case 'streak-month':
  return state.streakTotal >= 15 && condition.min ? state.streakTotal >= condition.min : state.streakTotal >= 15;

// corrigido — a diferenciação semana/mês vem do `min` de cada sticker no catálogo
case 'streak-week':
  return state.streakTotal >= condition.min;
case 'streak-month':
  return state.streakTotal >= condition.min;
```

`flashcard-streak`, `questions-mastered` e `techniques-explored` também ignoravam
`condition.min` (números fixos hardcoded: 14/50/5). Corrigir para usar `condition.min`
(mesmo quando o catálogo usa os mesmos valores — evita surpresa se o `min` mudar).

---

## 2. `isConditionMet` completo (todas as correções aplicadas)

```ts
export interface StickerState {
  profile: { name: string; semester: number; totalSemesters: number };
  readings: { status?: string; readPages?: number; totalPages?: number }[];
  flashcards: { timesReviewed?: number }[];
  sessions: { durationMinutes?: number }[];
  classes: unknown[];
  tasks: { completed: boolean }[];
  internshipLogs: { hours?: number }[];
  currentStreak: number;
  tcc: { status: string; title: string; chapters: { completed: boolean }[] };
  savedBookIds: string[];
  concepts: { authorIds: string[] }[];
  exams: { completed: boolean }[];
  authors: unknown[];
  materials: unknown[];
  courses: unknown[];
  techniques: unknown[];
  quizSessions: { answers: { questionId: string; correct: boolean }[] }[]; // NOVO (substitui `questions`)
  streakTotal: number;
  streakLongest: number;
  looseNotes: unknown[];
}

export function isConditionMet(condition: StickerCondition, state: StickerState): boolean {
  switch (condition.type) {
    // ---- já existiam, mantidos ----
    case 'reading-done':
      return state.readings.some(
        (r) => r.status === 'concluido' ||
          ((r.readPages ?? 0) > 0 && (r.totalPages ?? 0) > 0 && (r.readPages ?? 0) >= (r.totalPages ?? 0))
      );
    case 'profile-set':
      return state.profile.name.trim().length > 0;
    case 'flashcards-reviewed':
      return state.flashcards.reduce((acc, f) => acc + (f.timesReviewed ?? 0), 0) >= condition.min;
    case 'internship-first':
      return state.internshipLogs.length >= 1;
    case 'streak':
      return state.currentStreak >= condition.min;
    case 'degree-half':
      return state.profile.semester >= Math.ceil(state.profile.totalSemesters / 2);
    case 'concepts-with-authors':
      return state.concepts.filter((c) => c.authorIds.length > 0).length >= condition.min;
    case 'tcc-done':
      return state.tcc.status === 'concluido';
    case 'sessions':
      return state.sessions.length >= condition.min;
    case 'class-notes':
      return state.classes.length >= condition.min;
    case 'pages-read':
      return state.readings.reduce((acc, r) => acc + (r.readPages ?? 0), 0) >= condition.min;
    case 'tasks-done':
      return state.tasks.filter((t) => t.completed).length >= condition.min;
    case 'saved-books':
      return state.savedBookIds.length >= condition.min;
    // ---- corrigidas (bug de precedência / hardcode) ----
    case 'streak-week':
      return state.streakTotal >= condition.min;
    case 'streak-month':
      return state.streakTotal >= condition.min;
    case 'flashcard-streak':
      return state.flashcards.filter((f) => (f.timesReviewed ?? 0) > 0).length >= 14;
    case 'techniques-explored':
      return state.techniques.length >= condition.min;
    // ---- NOVAS — fonte correta (seção 1.2) ----
    case 'questions-created':
      return answeredQuestionIds(state.quizSessions).size >= condition.min;
    case 'questions-mastered':
      return correctlyAnsweredQuestionIds(state.quizSessions).size >= condition.min;
    // ---- as 21 que faltavam (seção 1.1) ----
    case 'exams-added':
      return state.exams.length >= condition.min;
    case 'exams-done':
      return state.exams.filter((e) => e.completed).length >= condition.min;
    case 'concepts-known':
      return state.concepts.length >= condition.min;
    case 'authors-known':
      return state.authors.length >= condition.min;
    case 'materials-added':
      return state.materials.length >= condition.min;
    case 'courses':
      return state.courses.length >= condition.min;
    case 'flashcards-count':
      return state.flashcards.length >= condition.min;
    case 'techniques-used':
      return state.techniques.length >= condition.min;
    case 'study-minutes':
      return state.sessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0) >= condition.min;
    case 'streak-total':
      return state.streakTotal >= condition.min;
    case 'reading-count':
      return state.readings.length >= condition.min;
    case 'reading-in-progress':
      return state.readings.filter((r) => r.status === 'lendo').length >= condition.min;
    case 'loose-notes':
      return state.looseNotes.length >= condition.min;
    case 'internship-hours':
      return state.internshipLogs.reduce((acc, l) => acc + (l.hours ?? 0), 0) >= condition.min;
    case 'internship-logs':
      return state.internshipLogs.length >= condition.min;
    case 'tcc-created':
      return state.tcc.title.trim().length > 0;
    case 'tcc-chapters-done':
      return state.tcc.chapters.filter((c) => c.completed).length >= condition.min;
    case 'penultimate-semester':
      return state.profile.semester >= state.profile.totalSemesters - 1;
    case 'streak-longest':
      return state.streakLongest >= condition.min;
    case 'graduation':
      return state.profile.semester >= state.profile.totalSemesters;
    default:
      return false;
  }
}
```

> **`reading-in-progress`:** o literal de status está confirmado — `ReadingItem.status`
> é `'nao_iniciado' | 'lendo' | 'concluido'` (`src/types/entity.ts:113`); usar `'lendo'`.

**Ajuste em `sharedAppValue.ts`:** o literal `state` do `useEffect` de stickers ganha
`quizSessions` (já destruturada no escopo, `sharedAppValue.ts:85`) e a lista de dependências
do efeito inclui `quizSessions`.

### 2.1 Função irmã `currentValueFor` (progresso numérico, pra UI)

Não muda a lógica de desbloqueio — expõe o valor atual pra exibição ("7/15").

```ts
export function currentValueFor(condition: StickerCondition, state: StickerState): number {
  switch (condition.type) {
    case 'flashcards-reviewed':
      return state.flashcards.reduce((acc, f) => acc + (f.timesReviewed ?? 0), 0);
    case 'sessions': return state.sessions.length;
    case 'class-notes': return state.classes.length;
    case 'pages-read': return state.readings.reduce((acc, r) => acc + (r.readPages ?? 0), 0);
    case 'tasks-done': return state.tasks.filter((t) => t.completed).length;
    case 'saved-books': return state.savedBookIds.length;
    case 'streak': return state.currentStreak;
    case 'streak-week': case 'streak-month': case 'streak-total': return state.streakTotal;
    case 'streak-longest': return state.streakLongest;
    case 'concepts-with-authors': return state.concepts.filter((c) => c.authorIds.length > 0).length;
    case 'exams-added': return state.exams.length;
    case 'exams-done': return state.exams.filter((e) => e.completed).length;
    case 'concepts-known': return state.concepts.length;
    case 'authors-known': return state.authors.length;
    case 'materials-added': return state.materials.length;
    case 'courses': return state.courses.length;
    case 'flashcards-count': return state.flashcards.length;
    case 'techniques-used': case 'techniques-explored': return state.techniques.length;
    case 'study-minutes': return state.sessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
    case 'reading-count': return state.readings.length;
    case 'reading-in-progress': return state.readings.filter((r) => r.status === 'lendo').length;
    case 'loose-notes': return state.looseNotes.length;
    case 'internship-hours': return state.internshipLogs.reduce((acc, l) => acc + (l.hours ?? 0), 0);
    case 'internship-logs': return state.internshipLogs.length;
    case 'tcc-chapters-done': return state.tcc.chapters.filter((c) => c.completed).length;
    case 'questions-created': return answeredQuestionIds(state.quizSessions).size;
    case 'questions-mastered': return correctlyAnsweredQuestionIds(state.quizSessions).size;
    default: return 0; // condições booleanas (sem `min`) — UI não desenha barra pra elas
  }
}
```

---

## 3. Catálogo expandido — 80 stickers (20 por categoria)

Curva geométrica ~3x por degrau dentro de cada métrica (racional completo no spec v1, seção 2).
Humor temático **mantido e expandido** (decisão do usuário).

### 3.1 `faculdade` (20)

| id | nome | emoji | condição | raridade |
|---|---|---|---|---|
| st-2 | cantinho organizado | 🌷 | `profile-set` | semente |
| st-20 | grade montada | 🗓️ | `courses` ≥3 | semente |
| st-13a | primeira missão | 🎯 | `tasks-done` ≥1 | semente |
| st-15 | primeira avaliação registrada | 📝 | `exams-added` ≥1 | semente |
| st-7 | análise de autor | ✨ | `concepts-with-authors` ≥3 | broto |
| st-10 | caderno caprichado | ✍️ | `class-notes` ≥10 | broto |
| st-16 | frente nas provas | 🏅 | `exams-done` ≥3 | broto |
| st-17 | conceitos na bagagem | 🎒 | `concepts-known` ≥10 | broto |
| st-18 | galeria de autores | 👥 | `authors-known` ≥5 | broto |
| st-19 | materiais em dia | 📂 | `materials-added` ≥5 | broto |
| st-20b | grade cheia | 📚 | `courses` ≥6 | broto |
| st-16b | temporada de provas | 📈 | `exams-done` ≥10 | raiz |
| st-18b | quem é quem da psicologia | 🖼️ | `authors-known` ≥15 | raiz |
| st-19b | acervo de referências | 🗃️ | `materials-added` ≥20 | raiz |
| st-7b | teóricas na ponta da língua | 🧩 | `concepts-with-authors` ≥10 | raiz |
| st-13 | missões cumpridas | ✅ | `tasks-done` ≥15 | raiz |
| st-17b | mapa mental completo | 🗺️ | `concepts-known` ≥30 | copa |
| st-10b | anotações de quem estuda de verdade | 📓 | `class-notes` ≥40 | copa |
| st-13b | 50 missões | 🏆 | `tasks-done` ≥50 | copa |
| st-13c | organização em outro patamar — hiperfoco ativado | 🧠 | `tasks-done` ≥150 | floresta |

### 3.2 `estudo` (20)

| id | nome | emoji | condição | raridade |
|---|---|---|---|---|
| st-21 | primeiro foco | 🍅 | `sessions` ≥1 | semente |
| st-41 | semana de foco | 📅 | `streak-week` ≥5 | semente |
| st-9 | foco de verdade | ⏱️ | `sessions` ≥5 | broto |
| st-3 | mestre dos flashcards | 🧠 | `flashcards-reviewed` ≥10 | broto |
| st-22 | deck de cartas | 🃏 | `flashcards-count` ≥10 | broto |
| st-23 | perguntas no cantinho | ❓ | `questions-created` ≥5 | broto |
| st-24 | técnicas na manga | 🛠️ | `techniques-used` ≥3 | broto |
| st-25 | duas horinhas de foco | ⏰ | `study-minutes` ≥120 | broto |
| st-5 | semana do café & livros | ☕ | `streak` ≥5 | broto |
| st-9b | rotina de foco | 🔁 | `sessions` ≥20 | raiz |
| st-3b | revisão em dia | 🔂 | `flashcards-reviewed` ≥50 | raiz |
| st-22b | deck robusto | 🎴 | `flashcards-count` ≥40 | raiz |
| st-25b | dez horas de foco | ⌛ | `study-minutes` ≥600 | raiz |
| st-12 | maratona de foco | 🔥 | `streak` ≥14 | raiz |
| st-26 | constância real | 📆 | `streak-total` ≥15 | raiz |
| st-42 | mês de consistência | 🗓️ | `streak-month` ≥15 | raiz |
| st-12b | ofensiva de 30 dias | 🚀 | `streak` ≥30 | copa |
| st-44 | mestre das questões | 🎯 | `questions-mastered` ≥50 | copa |
| st-9c | maratonista do foco | 🏃 | `sessions` ≥60 | floresta |
| st-3c | 200 revisões | 💎 | `flashcards-reviewed` ≥200 | floresta |

### 3.3 `leituras` (20)

| id | nome | emoji | condição | raridade |
|---|---|---|---|---|
| st-27 | primeira leitura registrada | 📖 | `reading-count` ≥1 | semente |
| st-1 | primeira leitura concluída | 📗 | `reading-done` | semente |
| st-28 | livro na cabeceira | 🛏️ | `reading-in-progress` ≥1 | semente |
| st-30 | leitora assídua | 📚 | `reading-count` ≥5 | broto |
| st-29 | cem páginas | 📄 | `pages-read` ≥100 | broto |
| st-14 | biblioteca pessoal | 🔖 | `saved-books` ≥5 | broto |
| st-31 | anotações soltas | 🗒️ | `loose-notes` ≥5 | broto |
| st-43 | flashcards em dia | 🃏 | `flashcard-streak` | broto |
| st-30b | estante em movimento | 📦 | `reading-count` ≥15 | raiz |
| st-11 | devoradora de livros | 📖 | `pages-read` ≥500 | raiz |
| st-32 | estante querida | 🏷️ | `saved-books` ≥10 | raiz |
| st-14b | PDF piratinha organizado(a) | 🗂️ | `saved-books` ≥15 | raiz |
| st-31b | ideias em profusão | 💭 | `loose-notes` ≥20 | raiz |
| st-45 | exploradora de técnicas | 🔍 | `techniques-explored` ≥5 | raiz |
| st-33 | maratona literária | 🏃‍♀️ | `pages-read` ≥1000 | copa |
| st-32b | acervo completo | 🏛️ | `saved-books` ≥25 | copa |
| st-9d | clube do livro sozinha mesmo | 🍵 | `reading-count` ≥30 | copa |
| st-31c | segunda cabeça externa | 🧾 | `loose-notes` ≥40 | copa |
| st-33b | três mil páginas | 🏔️ | `pages-read` ≥3000 | floresta |
| st-11b | maratona kindle | 📱 | `pages-read` ≥2000 | floresta |

### 3.4 `jornada` (20)

| id | nome | emoji | condição | raridade |
|---|---|---|---|---|
| st-4 | primeiro dia de estágio | 🩺 | `internship-first` | semente |
| st-34 | hora na clínica | 🕐 | `internship-hours` ≥1 | semente |
| st-36 | tcc germinando | 🌱 | `tcc-created` | semente |
| st-34b | dez horas de campo | 🕑 | `internship-hours` ≥10 | broto |
| st-35 | diário de campo em dia | 📔 | `internship-logs` ≥3 | broto |
| st-37 | primeiro capítulo do tcc | 📑 | `tcc-chapters-done` ≥1 | broto |
| st-4b | supervisão, chat é sério | 🗣️ | `internship-logs` ≥8 | broto |
| st-6 | rumo ao CRP! | 🎓 | `degree-half` | raiz |
| st-34c | cem horas de campo | 🕒 | `internship-hours` ≥100 | raiz |
| st-35b | registro constante de campo | 🗃️ | `internship-logs` ≥15 | raiz |
| st-37b | metade do caminho do tcc | 📘 | `tcc-chapters-done` ≥3 | raiz |
| st-4c | analisando até a fila do mercado | 🛒 | `internship-hours` ≥50 | raiz |
| st-38 | reta final da graduação | 🏁 | `penultimate-semester` | copa |
| st-34d | duzentas horas — marco de estágio | 🕓 | `internship-hours` ≥200 | copa |
| st-35c | freud ficaria orgulhoso das suas anotações | 🛋️ | `internship-logs` ≥40 | copa |
| st-37c | tcc quase lá, resiliência de quem faz TCC em trio | 🤝 | `tcc-chapters-done` ≥5 | copa |
| st-39 | ofensiva de mestre | 🏆 | `streak-longest` ≥21 | copa |
| st-8 | defesa do tcc | 🎤 | `tcc-done` | floresta |
| st-40 | formatura! | 🎓 | `graduation` | floresta |
| st-39b | ofensiva lendária | 👑 | `streak-longest` ≥60 | floresta |

**Notas:**
- st-4c usa `internship-hours` ≥50 (não `internship-first`, que já é coberto pelo st-4) — a
  piada da "deformação profissional" vem depois de volume real de horas.
- st-23: descrição muda para "pratique 5 questões diferentes" (fonte = quiz, seção 1.2).
- Ids `st-1..st-45` preservados (progresso persistido casa); novos ids `st-*a/*b/*c` entram
  bloqueados via `mergeCatalogWithProgress`.
- Total: **80 stickers, 20 por categoria**, todos com condição implementada (nenhum
  `default: return false`).

---

## 4. Barra de progresso (StickersView)

Card bloqueado com condição `min` mostra a barra + "cur/min" (gatilho de "só faltam X"):

```tsx
{!st.unlocked && st.condition && 'min' in st.condition && (
  <div className="mt-2">
    <ProgressBar value={Math.min(100, (currentValueFor(st.condition, state) / st.condition.min) * 100)} />
    <p className="text-[9px] text-ceci-tertiary mt-1">
      {currentValueFor(st.condition, state)}/{st.condition.min}
    </p>
  </div>
)}
```

A `StickersView` acessa o `StickerState` via contexto (**decisão A**): `SharedAppValue`
passa a expor `stickerState` (montado no `useEffect` de stickers), o `AppContextValue`
ganha o campo e `buildAppContextValue` repassa de `shared.stickerState` — a view consome
via `useMobileApp()`.

---

## 5. Sistema de XP, níveis e títulos

### 5.1 Decisão de engenharia (diverge do spec v1)

Em vez de derivar XP do `min` relativo a outros stickers da métrica (frágil/indireto),
cada `StickerDefinition` ganha um campo `rarity` explícito, já listado na seção 3. XP vem
de tabela fixa por raridade — auditable sticker a sticker.

```ts
// src/lib/levels.ts
export const XP_BY_RARITY: Record<StickerRarity, number> = {
  semente: 20,
  broto: 50,
  raiz: 120,
  copa: 250,
  floresta: 500,
};
```

### 5.2 Modelo de dados

```ts
// src/types/profile.ts
export type StickerRarity = 'semente' | 'broto' | 'raiz' | 'copa' | 'floresta';

export interface UserProfile {
  // ...campos existentes
  /** Opcional — retrocompatível com perfis salvos antes do sistema de níveis. */
  categoryXp?: Record<Sticker['category'], number>;
}
```

`categoryXp` **opcional** = sem migração de banco (`backupSchema` já faz passthrough).
Helper com fallback:

```ts
export function categoryXpOrDefault(profile: Pick<UserProfile, 'categoryXp'>) {
  return { faculdade: 0, estudo: 0, leituras: 0, jornada: 0, ...(profile.categoryXp ?? {}) };
}
```

`src/data/empty.ts` (`emptyProfile`) ganha `categoryXp: { faculdade: 0, estudo: 0, leituras: 0, jornada: 0 }`.

### 5.3 Concessão de XP + XP retroativo

No `useEffect` de stickers (`sharedAppValue.ts`), no bloco `if (newlyUnlocked.length > 0 && hasRealNewUnlock)`:

```ts
setProfile((p) => {
  const xp = categoryXpOrDefault(p);
  for (const s of newlyUnlocked) {
    const def = stickerDefinitionFor(s.id);
    if (def) xp[s.category] += XP_BY_RARITY[def.rarity];
  }
  return { ...p, stickersCollected: countUnlocked(updated), categoryXp: xp };
});
```

**Retroativo (decisão #4):** perfis antigos sem `categoryXp` recebem, **uma única vez no
boot**, o XP dos stickers já desbloqueados. Regra determinística: se `profile.categoryXp`
estiver ausente → iterar os `stickers` já `unlocked` e somar o XP de cada; gravar o campo.
Isso roda dentro da janela de boot (celebração silenciosa — o app "acorda" com os níveis já
computados, sem confete de level-up retroativo).

### 5.4 Curva de nível (por categoria)

| Nível | XP acumulado necessário |
|---|---|
| 1 | 0 |
| 2 | 50 |
| 3 | 117 |
| 4 | 207 |
| 5 | 328 |
| 6 | 491 |
| 7 | 711 |
| 8 | 1008 |
| 9 | 1408 |
| 10 | 1948 |

Com a distribuição de raridade da seção 3 (~3-4 semente, 6-9 broto, 5-7 raiz, 4-5 copa,
2-3 floresta por categoria), o total por categoria fica ~2200–2900 — nível 10 exige
completar quase todo o catálogo daquela categoria.

```ts
export const LEVEL_THRESHOLDS = [0, 50, 117, 207, 328, 491, 711, 1008, 1408, 1948];
export function levelFor(xp: number): number { /* v1/v2 — idem */ }
export function xpToNextLevel(xp: number) { /* v1/v2 — idem */ }
```

### 5.5 Títulos temáticos por categoria (10 níveis cada)

**`faculdade`:** calouro perdido no mapa do campus → aprendiz de PowerPoint → caçadora de
slide no Classroom → fluente em "profa, vai cair na prova?" → sobrevivente de sexta-feira com
3 provas → ctrl+F em prontuário mental próprio → citação ABNT sem ansiedade → terapeuta dos
colegas de sala (não remunerada) → quase formada, moralmente exausta → veterana que já viu de
tudo (inclusive a si mesma).

**`estudo`:** pomodoro de boa vontade → flashcard iniciante → destruidora de deck → leitora
de bula de remédio por hábito clínico → streak guerreira → 3h de foco, 0h de sono → mestre do
"só mais uma revisão" → vidão de estudo espaçado → ninja do resumo esquematizado → chat, é
real? nível deusa do cronograma.

**`leituras`:** leitora de orelha de livro → PDF piratinha organizado(a) → grifadora
compulsiva → sabe a diferença entre TCC e psicanálise de cabeça → bibliófila em recuperação
financeira → Freud já não assusta mais → DSM debaixo do braço → segunda cabeça externa
(cognitive offloading com estilo) → estante que pesa mais que a mochila → é basicamente uma
enciclopédia com CRP.

**`jornada`:** estagiária com o coração na mão → analisando a fila do mercado sem querer →
"e você, como se sente sobre isso?" (modo automático ligado) → supervisão, chat é sério →
diário de campo com plot twist toda semana → quase-psicóloga em construção → TCC: capítulo
escrito, alma parcialmente intacta → rumo ao CRP com convicção → reta final, café e
resiliência → formada (ou quase) — Freud ficaria orgulhoso.

**Nota:** onde a piada de um sticker repetir a do título de nível da mesma categoria (ex.:
"Freud ficaria orgulhoso" em st-35c e no nível 10 de `jornada`), é proposital — reforça o
tema quando a usuária bate os dois juntos.

### 5.6 Nível geral (combinado)

```ts
export const GENERAL_THRESHOLDS = LEVEL_THRESHOLDS.map((t) => t * 4);
export const GENERAL_TITLES = [
  'novata no cantinho',
  'estudante de primeiro contato terapêutico',
  'zona de conforto? não conheço',
  'rapport com o próprio cronograma',
  'vínculo terapêutico com a cafeteira',
  'insight tem hora, mas a sua vem sempre',
  'supervisionada oficial da vida acadêmica',
  'quase-CRP, alma de veterana',
  'formação sólida, ansiedade administrável',
  'psicóloga(o) em formação nível mestre jedi da escuta ativa',
];
```

### 5.7 UI — onde aparece

- **`StickersSection.tsx` (perfil):** badge compacto com nível geral + título (padrão visual
  `bg-rose-500` do cabeçalho da StickersView). Recebe `profile` como prop nova (PerfilView já
  tem `profile`).
- **`StickersView.tsx`, por categoria:** trocar `{groupUnlocked}/{group.length}` por
  `nv. X · <título>` + `ProgressBar` até o próximo nível (via `xpToNextLevel`).
- **Momento de level-up:** ao subir de nível (comparar `levelFor` antes/depois por categoria
  e geral), disparar celebração maior que a de sticker avulso — novo `CelebrationKind:
  'level-up'` em `celebrate.ts` (`burstFromCenter` + `sideCannons`, helpers já existentes) e
  toast `"nível 4 alcançado: fluente em 'profa, vai cair na prova?' 🎉"`. Silêncio na janela
  de boot (mesmo `bootWindowRef`).

---

## 6. Resumo das mudanças por arquivo

| Arquivo | Mudança |
|---|---|
| `src/types/profile.ts` | + `StickerRarity`, + `categoryXp?` em `UserProfile` |
| `src/data/stickerCatalog.ts` | reescrito: 80 stickers, + `rarity` em `StickerDefinition`, + `stickerDefinitionFor()` |
| `src/lib/stickers.ts` | 21 `case`s novos + 4 corrigidos, `quizSessions` no `StickerState` (substitui `questions`), + `currentValueFor()` |
| `src/lib/levels.ts` | **novo arquivo** — `XP_BY_RARITY`, `LEVEL_THRESHOLDS`, `GENERAL_THRESHOLDS`, `levelFor`, `xpToNextLevel`, `categoryXpOrDefault`, títulos por categoria + geral |
| `src/data/empty.ts` | `emptyProfile.categoryXp` zerado |
| `src/context/sharedAppValue.ts` | `quizSessions` no estado da avaliação + dependências; concessão de XP + level-up + retroativo no `useEffect` de stickers; expor `stickerState` no `SharedAppValue` |
| `src/context/AppContext.tsx` | `AppContextValue.stickerState` + repasse no `buildAppContextValue` |
| `src/lib/celebrate.ts` | + `CelebrationKind: 'level-up'` |
| `src/components/views/StickersView.tsx` | barra de progresso por sticker bloqueado; nível/título por categoria + barra até próximo nível |
| `src/components/views/perfil/StickersSection.tsx` | badge de nível geral (recebe `profile`) |
| `src/components/views/PerfilView.tsx` | passa `profile` pra `StickersSection` |
| `src/lib/__tests__/stickers.test.ts` | `baseState` com `quizSessions: []`; testes de `questions-*` via `quizSessions`; + testes dos 21 casos novos e correções |
| `src/lib/__tests__/levels.test.ts` | **novo** — XP por raridade, nível por XP (boundaries), título por nível, fallback `categoryXpOrDefault` |

**Fora de escopo:** migrations (`categoryXp` opcional, schema passthrough); `SCHEMA_VERSION`
não muda; nada em `packages/*` (sem boundary check).