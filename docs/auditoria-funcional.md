# cecistudy ♡ — Auditoria funcional completa (referência)

> Documento de referência consolidando **tudo** o que foi encontrado na auditoria funcional do
> cecistudy (agosto/2026), executada por agentes de exploração em 4 frentes:
>
> 1. **Views** — `HomeView`, `FaculdadeView`, `CourseDetailView`, `EstudosView`, `BibliotecaView`, `PerfilView`.
> 2. **Fluxos de criação** — `QuickAddModal`, `ComposeNoteView`, wizards, modais, busca global.
> 3. **Navegação & código morto** — `routing.ts`, `AppContext.tsx`, `App.tsx`, telas auxiliares, rotas.
> 4. **Libs, recursos nativos & persistência** — `src/lib/*`, plugins Capacitor, chaves persistidas, schema.
>
> Cada achado traz: **o problema**, **como pode ser resolvido** e **qual solução se espera**, com
> evidência em `arquivo:linha`. Este documento é a base para as próximas rodadas de correção.

---

## 0. Metodologia e legenda

- **Método:** leitura completa dos arquivos-fonte + verificação cruzada (`grep` de importadores/uso) +
  confirmação manual dos pontos críticos. Nenhuma alteração foi feita no código.
- **Estado do código auditado:** `main`, árvore limpa (git), sem histórico de builds nativos (CI nunca rodou).
- **2ª rodada (verificação de completude, ago/2026):** cada subagente re-varreu a categoria inteira e cruzou
  com este documento. Correções factuais e itens novos estão integrados nas seções 2.7, 3.16, 5, 6 e §9.

### Legenda de status

| Status | Significado |
|---|---|
| ✅ **works** | funcional de ponta a ponta, derivado de estado real e persistido |
| ⚠️ **partial** | funciona em parte; algo é fictício, incompleto ou com falha |
| ❌ **broken** | existe um caminho de UI, mas ele termina em tela quebrada/vazia |
| 🧟 **dead** | código definido sem nenhum importador/render ou sem caminho de uso |

---

## 1. Resumo executivo

### ❌ Quebrado (impede uso no dia a dia)

| # | Item | Evidência |
|---|---|---|
| B1 | Sub-tab "questões" (Estudos): "nova questão" abre overlay vazio | `EstudosView.tsx:647`, `WizardRouter.tsx:31-32`, `routing.ts:66` |
| B2 | Seção "abordagens & correntes" da Biblioteca: clique em livro leva a "não achei" | `BibliotecaView.tsx:750-755`, `libraryData.ts:583,643`, `ApproachDetailView.tsx:67-72` |

### ⚠️ Parcial (funciona, mas incompleto/fictício)

| # | Item |
|---|---|
| P1 | Modo leitura com conteúdo falso + bookmark morto |
| P2 | Busca global (⌘K): deep-link quebrado/pela metade |
| P3 | Notas avulsas sem edição e data fixa |
| P4 | Templo: 4 de 5 cards "em breve" |
| P5 | Back do Android: `EditTccModal` fora da cadeia + modais locais invisíveis |
| P6 | Streak: não conta prova nem livro do catálogo; `lastReviewed` em UTC |
| P7 | Calendário da Faculdade só com provas+tarefas |
| P8 | Export/import: `approaches` não restaurado; `SCHEMA_VERSION_KEY` não usado |
| P9 | Sub-tabs `materiais`/`mapa` da biblioteca são no-op |
| P10 | Header "meio preso" em telas de id desconhecido |
| P11 | Meta do dia e sugestões do dia com parte estática |
| P12 | `Exam` com fallback `courseId:'c1'`; aula com `courseId:''` quando não há curso |

### 🧟 Morto / sem caminho de uso

| # | Item |
|---|---|
| D1 | Criar **conceito**: inexistente (sem QuickAdd, sem wizard, sem handler) |
| D2 | Entidade `techniques`: persistida + handler, zero UI |
| D3 | Entidade `materials`: só leitura; nenhum fluxo cria |
| D4 | `@capacitor/calendar`: só permissão; nenhuma feature escreve no calendário |
| D5 | `data/index.ts` (facade sem importadores) |
| D6 | `ui/Card.tsx`, `ui/IconButton.tsx`, 5 × `ApproachDetail*Card.tsx` |
| D7 | Exports mortos: `hapticWarning`, `TAP_SPRING`, `SCHEMA_VERSION_KEY`, `handleAddQuestion`, `handleAddTechnique`, `handleUpdateReadingChapters` |
| D8 | `src/lib/__tests/zzdiag.test.ts` (teste diagnóstico órfão que roda no CI) |

### ✅ Funciona de verdade (confirmado)

- Home, Faculdade (4 sub-tabs), CourseDetail (3 abas + edição) com dados reais.
- Pomodoro real, flashcards com repetição espaçada, histórico de sessões.
- Wizards de criação: task, exam, flashcard, reading, session, internship, author.
- `ClassNoteDetailWizard` (5 passos) persiste rating + dúvidas.
- Biblioteca: favoritos (`savedBookIds`) e páginas lidas (`readingProgress`) persistidos; filtros; artigos com link.
- Perfil: todas as métricas reais; foto via câmera; lembrete (nativo); export/import/reset/demo; OTA (nativo); stickers desbloqueando.
- Streak registrado em 5 ações reais, só dias úteis.
- Persistência dual (web `localStorage` ↔ nativo `@capacitor/preferences`), schema v6 com migrações.

> **2ª rodada (verificação):** itens adicionais em §2.7 (telas auxiliares & onboarding), §3.16 (fluxos
> complementares), §6 (dead code novo), §5.3 (25ª chave `composePrefs`) e §9 (correções ao doc).

---

## 2. Auditoria — Views

### 2.1 `HomeView` (`src/components/views/HomeView.tsx`, 542 linhas)

| Feature | Status | Evidência |
|---|---|---|
| Saudação + data | ✅ works | data real (62–71, 136–142); `profile.name` real (141) |
| Meta do dia | ⚠️ partial | contagem de pendências real (171) + títulos das 2 primeiras (175); **resto do texto estático** (168–178) |
| Métricas (pendências, provas 14 dias) | ✅ works | `pendingTasks` (46), `pendingExamsIn14Days` (49–59) |
| Aulas hoje | ✅ works | `getCoursesOnWeekday` (74, `lib/schedule.ts:26-35`); horário via `extractScheduleTime` (240) |
| Assuntos a estudar | ✅ works | `studyTopics` derivado (94–108) |
| Progresso semanal / streak | ✅ works | `streakStats` + `currentWeekProgress` (335–388); clicável → `openStreak` (314) |
| Plano de ação (tarefas) | ✅ works | toggle real persistido `handleToggleTask` (418; `AppContext.tsx:549-560`); celebra ao concluir |
| Sugestões do dia | ⚠️ partial | `buildSuggestions` derivado real (77–80); **dispensa `doneSuggestions` é estado local** (81) — não persiste |
| Dica da ceci | ✅ works | texto fixo proposital (526–534) |

**Achado P11** — Meta do dia: texto complementar estático e `doneSuggestions` (dispensa de sugestões) não persistido.
- **Problema:** o texto "meta do dia" é parcialmente escrito à mão; dispensa de sugestões é `useState` local e some ao recarregar.
- **Como resolver:** derivar a meta 100% de estado (pendências do dia, sessões, leituras); mover `doneSuggestions` para `usePersistentState` se a dispensa devia ser permanente.
- **Solução esperada:** meta do dia inteira derivada; sugestões dispensadas continuam dispensadas após reload.

### 2.2 `FaculdadeView` (`src/components/views/FaculdadeView.tsx`, 309 linhas)

| Feature | Status | Evidência |
|---|---|---|
| Título do semestre | ✅ works | `profile.semester` (89) |
| Badges de resumo | ✅ works | `courses.length`, provas/tarefas pendentes (102–112) |
| Sub-tabs disciplinas/aulas/avaliacoes/calendario | ✅ works | todas renderizam dados reais |
| Grade de disciplinas | ✅ works | cursos reais, contagem de aulas, próxima prova (140–177); abre CourseDetail (147) |
| Diário de aulas | ✅ works | `classes` via `ClassNoteListItem` (189–195); leitura em `ClassNoteModal` (302–305) |
| Avaliações | ✅ works | provas reais com toggle concluído (208–222) |
| Calendário | ⚠️ partial | `eventsForMonth(exams, tasks, mês)` (74; `lib/schedule.ts:47-73`) — **aulas e estágio não entram** |
| Sua semana acadêmica | ✅ works | `upcomingEvents(exams, tasks, internshipLogs)` (79, 281–297) |

**Achado P7** — Calendário só com provas+tarefas.
- **Problema:** o mês da Faculdade ignora aulas (`course.schedule`) e registros de estágio; é uma limitação de utilidade diária.
- **Como resolver:** incluir blocos derivados de `course.schedule` (dias de aula) e `internshipLogs` no `eventsForMonth`, com rótulos/cores distintos.
- **Solução esperada:** o calendário mostra aulas, provas, tarefas e estágio no mesmo mês.

### 2.3 `CourseDetailView` (`src/components/views/CourseDetailView.tsx`, 555 linhas)

| Feature | Status | Evidência |
|---|---|---|
| Quick add 2x2 | ✅ works | estudo/prova/leitura → wizards; aula → `openCompose` (120–143) |
| Aba informações | ⚠️ partial | ementa real com fallback (211–212); detalhes reais (222–243); frequência de `course.attendance` (70–76, 239–242); pesos derivados de provas com `weightValue` (77–79, 258–277); **"média mínima: 7,0" é literal** (254); monitoria condicional (280–290) |
| Aba aulas & avaliações | ✅ works | provas toggle (315–350), diário (377–384), tarefas do curso (409–425) |
| Aba repertório | ✅ works | conceitos por `courseIds` (82–84), autores derivados (87–90), leituras + materiais por curso (511–535) |

**Achado (menor)** — "média mínima: 7,0" literal. Baixa prioridade; pode virar configuração ou texto fixo com semântica clara.

### 2.4 `EstudosView` (`src/components/views/EstudosView.tsx`, 747 linhas)

| Feature | Status | Evidência |
|---|---|---|
| Hero stats | ✅ works | foco na semana, flashcards vencidos (`isDueToday`), leituras em andamento (63–68, 205–231) |
| Continuar de onde parou | ✅ works | última sessão, próximos flashcards, leitura em andamento (247–324) |
| Pomodoro / sessão de foco | ✅ works | presets 25/45/15 (75), timer real (107–118), salvar → `handleAddSession` persiste + streak (135–148; `AppContext.tsx:656-659`); confete/haptic (115–116) |
| Flashcards | ✅ works | repetição espaçada real `REVIEW_INTERVALS`/`intervalFor`/`isDueToday` (28–36); fila por vencimento (96–105); virar/errei-acertei → `handleReviewFlashcard` persiste (151–169; `AppContext.tsx:623-642`); "revisar todos" (456); novo via wizard (536) |
| Leituras | ⚠️ partial | lista real com progresso (557–628); novo via wizard (624); **modo leitura com conteúdo fictício** (ver P1) |
| Questões | ❌ broken | botão "nova questão" → overlay vazio (ver B1) |
| Histórico de sessões | ✅ works | resumo semanal real (66–68, 682–693), lista ordenada (707–726) |

### 2.5 `BibliotecaView` (`src/components/views/BibliotecaView.tsx`, 920 linhas)

| Feature | Status | Evidência |
|---|---|---|
| Suas notas | ✅ works | `looseNotes` persistidos; add/delete via `NotesScreen` (315–325) |
| Busca + filtros | ✅ works | filtros reais (71–302), `LibraryFilterModal`, badges, "esquecer filtros" (438–486) |
| Repertório & leituras recomendadas | ✅ works | `initialTrendingBooks` **estático** (`libraryData.ts:50-61`), mas favorito e progresso persistem (513–558, 897–906) |
| Catálogo de psicoterapias (10 famílias) | ✅ works | `psychotherapyCollections` estático de JSONs (`data/books/index.ts`); navegação/salvar/progresso ok (566–596) |
| Categorias mistas | ✅ works | `mixedCollections` + `MixedCollectionBlock` (601–632) |
| Testes / Autores / Conceitos / Multidisciplinar | ✅ works | `initialContextCollections` + `complementaryCollections` estáticos, salvos/progresso ok (637–795) |
| Abordagens & correntes | ❌ broken | link de livro usa id de **coleção** (ver B2) |
| Artigos científicos | ✅ works | 150 artigos estáticos com DOI/link; `ArticleDetailModal` abre/copia/salva (800–847; `ArticleDetailModal.tsx:101-126`) |
| Templo | ⚠️ partial | só "famílias" abre algo; demais "em breve" (ver P4) |
| FAB "+" | ✅ works | `openQuickAdd` (874–880) |

### 2.6 `PerfilView` (`src/components/views/PerfilView.tsx`, 790 linhas)

| Feature | Status | Evidência |
|---|---|---|
| Header + foto | ✅ works | `pickProfilePhoto` real (197–212, `lib/photo.ts`), remover (209–212); nome/universidade/carreira reais (344–349) |
| Progresso da graduação | ✅ works | `percentDegree` de `semester/totalSemesters` (215, 354–365) |
| Resumo da jornada (10 tiles) | ✅ works | **todas** métricas reais (215–228, 233–308) |
| Ofensiva de estudos | ✅ works | `StudyStatsWidget` com streak real |
| Linha do tempo | ✅ works | marcadores por semestre (440–464) + reflexão derivada (51–60, 466–471) |
| Diário de estágio | ✅ works | logs reais, "ver mais" → `InternshipDiaryView` (501–521); novo via quick add (493) |
| Meu TCC | ✅ works | TCC real com progresso, botão → `TccView` (524–562) |
| Stickers | ✅ works | desbloqueio automático real `applyStickerUnlocks` (`AppContext.tsx:457-499`; `lib/stickers.ts`) |
| Personalização | ✅ works | lembrete nativo (desabilitado no web com explicação — 620–664); perfil → `handleUpdateProfile` persiste (666–715) |
| OTA | ✅ works (nativo) | `OtaSection` só em `isNativePlatform` (719) |
| Dados (backup) | ✅ works | exportar/importar/resetar/carregar exemplos (733–779); usa `confirm()` nativo (762, 772) em vez de toast |

**Achado (menor)** — Feedback de import/reset usa `confirm()` nativo em vez do Toast. Ver backlog #11.

### 2.7 Telas auxiliares & onboarding (adicionadas na 2ª rodada)

> Estas telas apareciam nas tabelas de rota/nav (§4.1/§4.2) sem auditoria funcional própria. Todas
> **auditadas por feature nesta rodada**.

#### 2.7.1 `OnboardingScreen` (`src/components/views/OnboardingScreen.tsx`, 546 linhas) — ✅ works
- **7 passos com progresso** (96–108): welcome (111–131) → nome validado (133–172; `canProceedName` :55) →
  semestre/total (174–241, `SEMESTER_OPTIONS` 1–10) → contexto universidade/carreira (243–286) → foto
  (288–345) → escolha demo/vazio (347–406) → permissões (`PermissionsStep` 421–546).
- **Persistência real:** `finish()` (66–80) → `completeOnboarding(profileUpdate, loadDemo)` (`AppContext.tsx:735-745`)
  → grava `profile` + `onboarding {completed, completedAt, loadedDemo}` (chave `onboarding`, `AppContext.tsx:286`)
  + `applyDatabase(demoDatabase() | emptyDatabase())`. Renderizado em tela cheia antes do app (`App.tsx:209-211`).
- **Foto real:** `pickProfilePhoto` (57–64, `lib/photo.ts`); preview/remover (301–325).
- **Permissões nativas:** `checkPermission`/`requestPermission` (429–448, `lib/permissions.ts`); no web os
  toggles são desabilitados com aviso "disponível no aplicativo nativo" (462–466, 471, 498–508).
- **Observações:** `loadDemo` default **`true`** (:53) — a usuária precisa escolher ativamente "começar do
  zero"; `dailyQuote` é **hardcoded** (:74); `targetCareer` tem fallback literal `'Psicóloga Clínica'` (:73).
  Fluxo inteiro persistido; **sem problemas funcionais**.

#### 2.7.2 `StreakView` (`src/components/views/StreakView.tsx`, 198 linhas) — ✅ works
- Herói com streak atual + CTA → `handleNavigate('estudos','sessoes')` (75–81); tiles **recorde**
  (`streakStats.longest`) e **dias ativos** (`streakStats.total`) (83–104, `AnimatedNumber`).
- "sua semana" — 5 células seg–sex de `getWeekProgress` (107–151); "últimas semanas" — `getRecentWeeks` real
  (`lib/streak.ts:191-210`), 8 semanas (153–178); "como funciona a streak" — `WHAT_COUNTS` estático (180–195).
- Tudo derivado de `streakData` persistido. **Zero dummy.** Acessível via `openStreak`
  (`AppContext.tsx:924-931`; `HomeView:314`, `StudyStatsWidget`) e rotas `#/streak`, `#/perfil/streak`, `#/estudos/streak`.

#### 2.7.3 `TempleScreen` (`src/components/library/TempleScreen.tsx`, 136 linhas) — ⚠️ partial (confirma P4)
- 5 cards: **só `familias` abre algo** (`openFamilies()`, :84); demais (`autores`, `técnicas`, `comparações`,
  +1) mostram **toast "em breve: X ♡"** (:56, 66, 76). `handleCardClick` (:83-86) é a única lógica.
- **Problema (P4):** 4 de 5 cards são dead-end (toast). **Como resolver:** implementar as telas
  (autores/conceitos/técnicas/comparações) ou trocar o toast por estado vazio honesto até existirem.
  **Solução esperada:** nenhum card do Templo promete algo que não abre.

#### 2.7.4 `FamiliesView` (`src/components/views/FamiliesView.tsx`, 92 linhas) — ✅ works
- Lista as 10 famílias de `PSICOTERAPIA_FAMILIES` (`psicoterapiaFamilies.ts`): nome, descrição, badge
  `N abordagens`, bolha colorida; clique → `openFamily(family.id)` (~:56). Dado curado estático — por design.

#### 2.7.5 `FamilyDetailView` (`src/components/views/FamilyDetailView.tsx`, 102 linhas) — ✅ works
- Fallback "não achei essa família por aqui ♡" para família desconhecida (12–18) — confirma a exceção de
  render da §4.1. Cabeçalho com cor/descrição (20–54); lista de abordagens filtrada por `familyId` (:56),
  paginação local "ver todas as N abordagens" (88–95); clique → `openApproach(approach.id)` (:63).
- `ListSkeleton` durante o seed lazy das 97 abordagens. **Sem dummy.**

#### 2.7.6 `ApproachDetailView` (`src/components/views/ApproachDetailView.tsx`, 289 linhas) — ✅ works (ids reais)
- Fallback "não achei essa abordagem por aqui ♡" (67–72) — confirma B2 (ids de coleção `col-app-tcc`/
  `col-app-psicanalise` → tela morta).
- Conteúdo **real e rico** do `psicoterapiaApproaches.ts` (`approach.detail`): intro com pill de
  família/`historicalPeriod` (120–144); 5 blocos condicionais — visão geral + `ideia_central` (147–164),
  na prática (167–178), conhecimento/autores (181–206; autor → modal com `d.origem`, 268–286), visão
  acadêmica (209–220), aprofundamento com `leituras_fundamentais` + **navegação entre abordagens
  relacionadas** `relationsWithOtherApproaches.similar` → `openApproach` (223–258).
- **Placeholders honestos:** "conceitos e técnicas desta abordagem chegam em breve ♡" (:201-203) e rodapé
  fixo (:261-265). A view constrói as seções inline — os 5 `ui/ApproachDetail*Card.tsx` são **dead** (D6).

#### 2.7.7 `InternshipDiaryView` (`src/components/views/InternshipDiaryView.tsx`, 43 linhas) — ✅ works
- Header com **total de horas real** (redução sobre `internshipLogs`, :9, :25-28); lista de
  `InternshipLogCard` (:31-34); empty state acolhedor (:35-39). Tela de leitura (sem edição/delete aqui);
  criação via wizard. **Sem dummy.**

#### 2.7.8 `TccView` (`src/components/views/TccView.tsx`, 165 linhas) — ✅ works
- Empty state com "bora começar?" quando `tcc.title` vazio (:50-64). Conteúdo real: resumo (statusLabel,
  título, orientadora/área, problema, objetivos — 68–100); **cronograma de capítulos** com
  `chaptersDone/chaptersTotal` + `ProgressBar` + **toggle de conclusão por capítulo que persiste**
  (`handleToggleChapter` :16-21 → `handleUpdateTcc`, `AppContext.tsx:677-679`; linhas clicáveis :120;
  toast "capítulo guardado ♡" :20); referências ABNT (147–160). Botão "editar tcc" → `EditTccModal`
  (`App.tsx:332-337`). **Sem dummy.**

#### 2.7.9 `StickersView` (`src/components/views/StickersView.tsx`, 95 linhas) — ✅ works
- Header com `unlocked/total` real (`countUnlocked`, :19, :36-41); 4 categorias
  (`faculdade/estudo/leituras/jornada`, :44-92); cada sticker mostra emoji, nome, descrição e
  `unlockedAt` revertida (:79) ou cadeado "a desbloquear". Desbloqueios via `applyStickerUnlocks`
  (`AppContext.tsx:457-499`, `lib/stickers.ts`) — real e persistido. **Sem dummy.**

---

## 3. Auditoria — Fluxos de criação, wizards e modais

### 3.1 `QuickAddModal` (picker de tipos)

- **Status: ✅ works.** O picker lista **8 tipos**: `class, task, exam, flashcard, reading, session, internship, author` (`QuickAddModal.tsx:24-87`).
  > ⚠️ **Não há opção `concept`** (documentação dizia ~9 tipos; na prática são 8).
- Cada tile: `onPick(type); onClose()` (`:126-129`).
- Dispatch no `AppShell`: `type === 'class' ? openCompose() : app.openWizard(type)` (`App.tsx:183-189`).

| Tipo | Ação | Próxima tela | Status |
|---|---|---|---|
| `class` | `openCompose()` | `ComposeNoteView` (overlay, `App.tsx:274-277`) | ✅ |
| `task` | `openWizard('task')` | `TaskExamWizard preset="task"` | ✅ |
| `exam` | `openWizard('exam')` | `TaskExamWizard preset="exam"` | ✅ |
| `flashcard` | `openWizard('flashcard')` | `FlashcardWizard` | ✅ |
| `reading` | `openWizard('reading')` | `ReadingWizard` | ✅ |
| `session` | `openWizard('session')` | `SessionWizard` | ✅ |
| `internship` | `openWizard('internship')` | `InternshipWizard` | ✅ |
| `author` | `openWizard('author')` | `AuthorWizard` | ✅ |

Nenhum tipo do picker tem wizard ausente. O `WizardRouter` só falha com o tipo `question`, que **não está no picker** (vem de `EstudosView`).

### 3.2 `ComposeNoteView` (aula / avulsa)

- **Status: ✅ works** (ambos os modos persistem; modo aula oferece o wizard de detalhes em seguida).
- Campos modo aula: curso (144–157), tag (160–170), `StarRating` (190–195). Modo avulsa: pills de categoria (171–188).
- `handleSave` (`:51-89`): aula → cria `ClassNote` com `id:'cl-'+Date.now()`, `rating: rating || undefined` (56–70) → `handleAddClassNote` (73) → `setClasses` (`AppContext.tsx:577-580`, chave `classes`) → `closeCompose()` + **`openDetailPrompt(note.id)`** (75) → modal "quer dar mais detalhes?" (`App.tsx:51-106`) → "dar mais detalhes" → `openComposeDetails(noteId)` → `ClassNoteDetailWizard`.
- Avulsa → `addLooseNote` (79–85) → `setLooseNotes` (`AppContext.tsx:586-588`) + toast. Sem wizard de detalhes (por design).
- **P12 (aula com `courseId:''`):** com **zero cursos**, o select fica vazio e `courseId` vira `''` → nota de aula órfã poderia ser salva (`:34`, `:56-70`).
  - **Como resolver:** desabilitar salvar quando não houver curso selecionado (ou quando não houver cursos).
  - **Solução esperada:** impossível salvar aula sem curso.

### 3.3 Wizards em tela cheia

#### 3.3.1 `WizardScaffold` (shell compartilhado)
- **Status: ✅ works.** Passos avançam via "continuar"/salvar no último (`:69-72, 141-165`); "voltar"/"cancelar" (`:167-172`); barra de progresso (`:107-114`); validação `canNext`/`canSave` (`:61, 144`).

#### 3.3.2 `TaskExamWizard` (`task`, `exam`, `task-exam`)
- **Status: ✅ works.**
- Escolha task × exam só no modo combinado (`:58-102`); `kind` + `setStep(0)` (65–68, 82–85).
- Task: 4 passos (título → categoria/prioridade → curso/vencimento → revisão) (`:104-180`); Exam: 4 passos (`:182-252`).
- `handleSave` (263–288): task → `handleAddTask` (265–273) → `setTasks` (`AppContext.tsx:569-571`); exam → `handleAddExam` (275–283) → `setExams` (`AppContext.tsx:648-650`). Depois `closeWizard()` + toast.
- **P12 (exam com `courseId:'c1'`):** prova sem curso salva `courseId: courseId || 'c1'` (`:277`) — id fixo que pode não existir.
  - **Como resolver:** salvar `courseId` opcional (sem fallback), ou validar curso obrigatório, ou tratar `courseId` nulo na renderização.
  - **Solução esperada:** prova sem curso não aponta para curso inexistente.

#### 3.3.3 `SessionWizard`
- **Status: ✅ works.** 4 passos (tópico → minutos → curso → revisão) (`:19-76`); `handleSave` (78–89) → `handleAddSession` → `setSessions` (`AppContext.tsx:656-659`) + `registerActivity()` (streak).

#### 3.3.4 `FlashcardWizard`
- **Status: ✅ works.** 4 passos (`:27-92`); `handleSave` (97–109) → `handleAddFlashcard` → `setFlashcards` (`AppContext.tsx:619-621`). `lastReviewed`/`easeFactor` ficam `undefined` até a primeira revisão.

#### 3.3.5 `ReadingWizard`
- **Status: ✅ works (criação).** 4 passos (`:40-124`); `handleSave` (126–141) → `handleAddReading` → `setReadings` (`AppContext.tsx:594-596`). **⚠️ Não seta `chapters`** → toda leitura criada fica sem capítulos (alimenta P1).

#### 3.3.6 `AuthorWizard`
- **Status: ✅ works.** 4 passos (`:27-109`); `handleSave` (111–124) → `handleAddAuthor` → `setAuthors` (`AppContext.tsx:652-654`).

#### 3.3.7 `InternshipWizard`
- **Status: ✅ works.** Escolha de tipo (`:66-95`), 4 fluxos: `estagio` (4 passos), `atendimento_clinico` (6), `supervisao`/`intervisao` (6), `outro` (4) (`:97-451`); `handleSave` (466–503) monta `InternshipLog` e chama `handleAddInternshipLog` → `setInternshipLogs` (`AppContext.tsx:644-646`, chave `internship`).

#### 3.3.8 Wizard `question` — ❌ QUEBRADO (ver B1)
- `WizardFlow` inclui `'question'` (`types.ts:33-42`); `EstudosView` chama `openWizard('question')` (`EstudosView.tsx:647`).
- **`WizardRouter` NÃO tem case `'question'`** — `default: return null` (`WizardRouter.tsx:31-32`).
- Resultado: `openWizard('question')` empurra `{kind:'wizard', type:'question'}` (`AppContext.tsx:1050-1060`) → `overlayKey='wizard-question'` (435–442) → overlay renderiza `WizardRouter` → `null` → **tela em branco** (`App.tsx:282-286`). Sem scaffold, sem botão de cancelar, sem salvar. Saída só via back do browser/Android (`App.tsx:134-135`).
- `handleAddQuestion` existe (`AppContext.tsx:661-663`) mas **nenhuma UI o chama**.
- **Como resolver (opção A — implementar):** criar `QuestionWizard` (pergunta, resposta, curso, conceitos) com 2–4 passos, registrar em `WizardRouter` e em `WIZARD_SLUGS` (já existe `questao: 'question'` em `routing.ts:66`), ligar `handleSave` → `handleAddQuestion`. **Como resolver (opção B — desativar):** trocar o botão "nova questão" por toast "em breve" ou remover a sub-tab até existir feature.
- **Solução esperada:** a sub-tab "questões" permite criar e listar questões (ou deixa claro que não está disponível).

### 3.4 Criação de **conceito** — 🧟 INEXISTENTE (D1)
- Sem opção no QuickAdd, sem case no `WizardRouter`, sem `handleAddConcept` no `AppContext` (verificado por grep). `PsychologyConcept` só chega via seeds demo.
- **Como resolver:** decidir se conceito deve ser criável pelo usuário. Se sim: wizard + handler + caso no router + slug de rota. Se não: remover qualquer referência ou manter como dado curado.
- **Solução esperada:** conceitos criáveis (ou explicitamente fora do escopo de criação).

### 3.5 `ClassNoteDetailWizard` (5 passos após salvar aula)

- **Status: ✅ works — todos os 5 passos persistem.**
- Alcançado via `DetailPromptModal` → `openComposeDetails(noteId)` (`App.tsx:85-93`); re-hidrata de `classes` via `wizardNoteId` (`ClassNoteDetailWizard.tsx:22-25`, `AppContext.tsx:987-997`).
- Passos: 1 `identificacao` (84–113) → 2 `anotacoes` (114–126) → 3 `teoria` (127–170) → 4 `referencias` (171–214) → 5 `avaliacao` (215–248).
- `handleSave` (253–271) → `handleUpdateClassNote` (255–268) → `setClasses` map (`AppContext.tsx:582-584`). **Rating e dúvidas persistidos.** Guarda de estado vazio (53–65).

### 3.6 `EditCourseModal`

- **Status: ✅ works.** Form iniciado do curso (40–53); `handleSubmit` (55–73) valida nome e chama `onSave({...})` + `onClose`.
- Wiring: `App.tsx:324-329` → `handleUpdateCourse` → `setCourses` (`AppContext.tsx:692-694`). Entrada: header detail → menu → "editar detalhes da matéria" (`AppContext.tsx:1182`), só quando há curso focado (`App.tsx:326`).

### 3.7 `GlobalSearchModal` (⌘K) — ⚠️ PARCIAL (P2)

- **Status: partial.** Busca em conceitos/autores/cursos/anotações/leituras/abordagens (`:39-144`). Clique → `onNavigate(tab, subTab, id)` + fechar (216–219).
- `handleNavigate` (`AppContext.tsx:830-843`): seta sub-tab, grava `targetSectionRef`, e **para `tab==='faculdade'` empurra `{kind:'course', courseId: target}`** (837–838).
- Efeito deep-link (`AppContext.tsx:799-819`): após 250 ms, `scrollIntoView` + box-shadow rosa em `[data-target]` ou `[data-section]`.

| Tipo de resultado | tab/subTab | Destaque | Resultado |
|---|---|---|---|
| concept | biblioteca/conceitos | `data-section="conceitos"` existe (`BibliotecaView.tsx:700`) | ✅ rola até a seção (sem destaque por item) |
| author | biblioteca/autores | `data-section="autores"` (669) | ✅ seção |
| approach | biblioteca/abordagens | `data-section="abordagens"` (731) | ⚠️ **não abre o detalhe da abordagem** — só rola até a seção |
| course | faculdade/disciplinas | sem `data-target`/`data-section` | ⚠️ abre o curso certo, **sem destaque** |
| class | faculdade/aulas | `ClassNoteListItem` tem `data-target` (`ClassNoteListItem.tsx:19`) | ⚠️ **bug estrutural:** empurra `{kind:'course', courseId:<idDaNota>}` — id de nota tratado como curso |
| reading | estudos/leituras | sem `data-target`/`data-section` em `EstudosView` (cards em 562–620 sem hook) | ⚠️ troca para `leituras`, **sem destaque** |

**Detalhe do bug `class`:** `focusedCourse` fica `undefined` (`FaculdadeView.tsx:46-49`); a grade aparece com `aulas` ativa e o destaque dispara por acidente, mas a pilha/hash acha que há uma tela `course` aberta → bottom-nav escondida (`isBottomNavVisible` falso, `AppContext.tsx:355`), header default, back sem sentido.
- **Como resolver (class):** para resultado de aula, navegar para `faculdade` sub-tab `aulas` **sem** empurrar `course` (ou abrir o `ClassNoteModal` da nota via `targetId`).
- **Como resolver (course/reading):** adicionar `data-target`/`data-section` nos componentes correspondentes (ex.: `data-section="leituras"` em `EstudosView`, `data-target` no card de curso/`data-section="disciplinas"` em `FaculdadeView`).
- **Como resolver (approach):** ao clicar em abordagem, empurrar `{kind:'approach', approachId}` (como o fluxo Templo→Famílias) em vez de só setar a sub-tab.
- **Solução esperada:** todo resultado de busca navega e destaca o alvo correto, sem estados estruturais errados.

### 3.8 `ReaderModeModal` — ⚠️ PARCIAL (P1)

- **Progresso (real):** `currentPage` inicial de `reading?.readPages` (21); slider/setas → `handlePageChange` (34–40) → `onUpdateProgress` → `handleUpdateReadingPages` (`EstudosView.tsx:738-743`) → atualiza `readPages` + status `lendo`/`concluido` + persiste (`AppContext.tsx:598-617`). "% lido" e "~N min restantes" calculados reais (26, 145–149).
- **Conteúdo (fictício):** capítulos só renderizam se `reading.chapters` existir (113–126). **Nenhuma leitura tem `chapters`:** `ReadingWizard.handleSave` não seta (126–141); seeds demo só definem `chapters` para `TccData` (`initialData.ts:497`), não para `ReadingItem` (348–391); `handleUpdateReadingChapters` existe (`AppContext.tsx:669`) mas **não é chamado** (grep: só definição/interface/context-value).
  → Todo leitura cai no fallback: "Nenhum capítulo disponível para esta leitura." (`:127-131`) **+ parágrafo fixo** "Em seus estudos em Psicologia, o acompanhamento regular e a síntese diária de leituras…" (`:133-138`) — resquício do `sampleExcerpt` do backlog #12.
- **Botão bookmark morto:** sem `onClick` (78–83, `title="guardar marcador"` mas sem handler). Imports não usados: `Share2, Sun, Moon, Highlighter, List` (2).
- **Como resolver (conteúdo):** ou (a) adicionar campo `chapters`/corpo real ao `ReadingItem` (wizard pergunta se quer adicionar capítulos/notas, ou campo "resumo da leitura" livre) e persistir via `handleUpdateReadingChapters`/novo handler; ou (b) exibir um resumo vazio honesto e remover o parágrafo fixo.
- **Como resolver (bookmark):** implementar `onClick` (marcador global por leitura, ex.: lista de páginas favoritas persistida) ou remover o botão.
- **Solução esperada:** o modo leitura mostra o conteúdo real da leitura (ou um estado vazio claro), e o botão de marcador funciona ou é removido.

### 3.9 `BookDetailModal` (biblioteca)

- **Status: ✅ works.** Props de `BibliotecaView`: `readPages={readingProgress[selectedBook.id] ?? selectedBook.readPages ?? 0}`, `onToggleSave`, `onUpdateProgress` (898–905).
- Steppers (96–121) e passos rápidos (125–136) → `onUpdateProgress` → `updateReadingProgress` → `setReadingProgress` (`AppContext.tsx:1020-1022`, chave `readingProgress`).
- Favorito (165–177) → `toggleSaveBook` → `setSavedBookIds` (`AppContext.tsx:1014-1018`).
- Clamp em `totalPages` (26–32); barra de progresso só quando `totalPages` presente (138–145). Livros do catálogo sem `totalPages` mostram steppers ilimitados — aceito por design (ver `data-model.md §6`).
- **Nota (relacionada ao P6):** `updateReadingProgress` (livros do catálogo) **não registra streak nem celebra** (ver P6).

### 3.10 `ArticleDetailModal`

- **Status: ✅ works.** Renderiza dados reais do catálogo (`familia`, `classificacao`, `titulo`, `autores`, `resumo`, `observacao`, `doi/linkDireto`) (38–126); "abrir artigo ↗" é âncora real (107–115); copiar usa `copyToClipboard` + toast (26–29); favorito persiste via `toggleSaveBook` (130–141; `BibliotecaView.tsx:912-914`). Sem progresso (por design).

### 3.11 `NotesScreen` (notas avulsas) — ⚠️ PARCIAL (P3)

- **Status: partial.** Criar e deletar persistem; **não há edição**; data é literal.
- Criar (128–213): no save (191–210) monta `LooseNote` e chama `onAddNote` → `addLooseNote` (`BibliotecaView.tsx:317-323`) → `setLooseNotes` (`AppContext.tsx:586-588`). Deletar (269–276) → `deleteLooseNote` (`AppContext.tsx:590-592`).
- **Sem editar:** não existe botão/handler de edição; as únicas ações por nota são copiar e deletar (243–277).
- **Data fixa:** os dois caminhos de criação carimbam `date:'Hoje, agora'` incondicionalmente (`NotesScreen.tsx:199`, `ComposeNoteView.tsx:84`) — `formatNoteDate` (`notes.ts:17-37`) existe mas não é usado.
- **Tipo fora do lugar:** `LooseNote` é definido em `src/components/library/notes.ts:1-7`, **não em `types.ts`** (entidade persistida com interface fora da fonte canônica; importado em `AppContext.tsx:59`).
- **Como resolver:** (a) adicionar modo de edição (reabrir form preenchido → `updateLooseNote`); (b) usar `formatNoteDate`/data real; (c) mover `LooseNote` para `types.ts` (seguindo o padrão do projeto).
- **Solução esperada:** notas avulsas editáveis, com data correta e tipo em `types.ts`.

### 3.12 `LibraryFilterModal`

- **Status: ✅ works.** 4 handlers ligados: `onCategoryChange/onStatusChange/onTagChange/onReset` → estado dos filtros (883–894). "aplicar filtros" só fecha (154–159); filtragem é ao vivo. Filtros locais (não persistidos) — por design.

### 3.13 `InlineCollectionBlock` / `MixedCollectionBlock`

- **Status: ✅ works** (presentacionais). `onSelectBook` → `setSelectedBook` (591, 626…); `onSelectArticle` → `setSelectedArticle` (627). Progresso/salvos lêem `readProgress`/`savedBookIds` reais (`InlineCollectionBlock.tsx:38-44`, `MixedCollectionBlock.tsx:79-85`).

### 3.14 `StudyStatsWidget`

- **Status: ✅ works** (exibição). Usa `streakStats`/`currentWeekProgress` derivados (`:7-9`); clique/teclado → `openStreak` (13–21) → empurra `{kind:'streak'}` (`AppContext.tsx:924-931`).

### 3.15 `ClassNoteModal` / `ClassNoteListItem`

- **Status: ✅ works.** `ClassNoteModal` é modal de leitura (sem edição) (10–61), aberto de `FaculdadeView.tsx:302-303` e `CourseDetailView.tsx:548-549`. `ClassNoteListItem` renderiza rating (25) e carrega `data-target={note.id}` (19).
- **Achado (menor):** "1 material anexo" com `{note.materials?.length || 1}` (`:42`) — mostra "1" mesmo com zero materiais.
  - **Como resolver:** `note.materials?.length ? ... : nada` (condicional honesta).
  - **Solução esperada:** contagem de materiais correta (0 não vira 1).

### 3.16 Fluxos e componentes complementares (adicionados na 2ª rodada)

#### 3.16.1 `FloatingActionMenu` do `BottomNav` — atalhos diretos de criação (entrada paralela ao QuickAdd) — ✅ works
- `BottomNav.tsx:32-58` — o FAB "+" da barra inferior abre um menu com **5 atalhos que lançam
  wizards/modal direto, sem passar pelo `QuickAddModal`**: `Novo estágio` → `openWizard('internship')`
  (:36), `Novo flashcard` → `openWizard('flashcard')` (:41), `Nova prova / atividade` →
  `openTaskExamWizard()` (:46), `Novo livro / leitura` → `openWizard('reading')` (:51),
  `Nova aula / nota` → `openCompose()` (:56).
- Wiring: `App.tsx:294-300`; `openTaskExamWizard` → `openWizard('task-exam')` (`AppContext.tsx:1062`).
- **Observação (não funcional):** rótulos em title-case ("Novo estágio") destoam da convenção lowercase do
  `copy-and-voice.md` — **Como resolver:** normalizar para minúsculas na correção de copy.

#### 3.16.2 `EditTccModal` (`src/components/tcc/EditTccModal.tsx`) — ✅ works (antes só citado em 4.8/5.3)
- Campos: título, orientadora, área, problema de pesquisa, status (`STATUS_OPTIONS` :17-21), objetivos,
  capítulos (com data), referências; `useEffect` popula do `tcc` ao abrir (:33-42).
- Persistência: `onSave` → `handleUpdateTcc` → `setTcc` (`AppContext.tsx:677-679`); wiring em
  `App.tsx:332-337`; aberturas: `TccView.tsx:39,58` e ação de header detail (`AppContext.tsx:1116`).
- **P5 confirmado:** `isEditTccOpen` continua fora da cadeia do back do Android (`App.tsx:118-159`).

#### 3.16.3 Form inline de tarefa na `HomeView` — ✅ works (não citado em 2.1)
- `HomeView.tsx:110-124` (`handleAddNewTask`) + formulário `:460-476` ("adicionar uma tarefa para hoje..."):
  cria `Task` com `id:'task_'+Date.now()`, `priority:'media'`, `category:'outro'`, sem
  `dueDate`/`disciplineId` → `handleAddTask` → `setTasks` (`AppContext.tsx:569-571`).
- **Observação:** tarefa criada sem disciplina/prazo (consistente com o espírito do P12 — sem validação de curso).

#### 3.16.4 `OtaUpdateModal` (`src/components/ui/OtaUpdateModal.tsx`, 55 linhas) — ✅ works (nativo)
- `open = ota.supported && ota.status === 'ready' && !!ota.availableVersion` (:12); "aplicar agora" →
  `applyNow()` (:41); "fazer depois" → `dismissUpdate()` (:47); renderizado sempre em `App.tsx:349`
  (auto-guardado). Backend real em `lib/ota.ts` (`initOta` :140-160, `checkForUpdates` :168-205,
  `applyNow` :208-220, `dismissUpdate` :223-225, `useOtaStatus` :73-82). Documentado em 5.2/2.6, mas não
  auditado como modal na §3.

#### 3.16.5 `wizardFields.tsx` (`src/components/wizards/wizardFields.tsx`) — ✅ works (primitivas compartilhadas)
- `FieldLabel`, `TextInput`, `TextArea`, `DateInput`, `SelectField`, `ChipPicker`, `TagInput`, `ReviewCard`.
- Importado por **todos** os 7 wizards + `ClassNoteDetailWizard` (grep: 7 importadores — `TaskExamWizard.tsx:15`,
  `FlashcardWizard.tsx:6`, `SessionWizard.tsx:6`, `ReadingWizard.tsx:12`, `AuthorWizard.tsx:12`,
  `InternshipWizard.tsx:13`, `ClassNoteDetailWizard.tsx:7`). **Não é dead** — módulo de suporte omitido do doc.

#### 3.16.6 `ui/Kitty` (mascote) — ✅ usado em 8+ lugares (não documentado)
- Importado em: `QuickAddModal.tsx:14`, `OtaUpdateModal.tsx:3`, `ArticleDetailModal.tsx:6`,
  `BookDetailModal.tsx:5`, `CourseDetailView.tsx:16`, `EstudosView.tsx:23`, `PerfilView.tsx:37`,
  `TccView.tsx:5`, `wizardFields.tsx:4`. Caso inverso do dead code — usado e não registrado no doc
  (também ausente em `components.md`).

---

## 4. Auditoria — Navegação, rotas e código morto

### 4.1 `NavScreen` kinds × branches de render

A união `NavScreen` em `src/types.ts:13-27` tem **14 kinds** (a lista de `AGENTS.md` está incompleta):

```
tab | course | notes | temple | streak | internshipDiary | tcc | stickers
| compose | composeDetails | wizard (type) | approach | families | family
```

**Todos os 14 kinds têm branch de render** (nenhum kind totalmente morto), em três níveis:

| Kind | Onde renderiza | Evidência |
|---|---|---|
| `tab` | App.tsx camada slide, por `activeTab` | `src/App.tsx:252-256` |
| `streak` | App.tsx camada slide | `src/App.tsx:245-248` |
| `compose` | App.tsx overlay | `src/App.tsx:274-277` |
| `composeDetails` | App.tsx overlay | `src/App.tsx:278-281` |
| `wizard` | App.tsx overlay | `src/App.tsx:282-285` |
| `course` | Dentro de `FaculdadeView` (só se curso existe) | `FaculdadeView.tsx:49-65` |
| `notes` | Dentro de `BibliotecaView` | `BibliotecaView.tsx:315-325` |
| `temple` | Dentro de `BibliotecaView` | `BibliotecaView.tsx:328-330` |
| `families` | Dentro de `BibliotecaView` | `BibliotecaView.tsx:333-335` |
| `family` | Dentro de `BibliotecaView` | `BibliotecaView.tsx:338-340` |
| `approach` | Dentro de `BibliotecaView` | `BibliotecaView.tsx:343-344` |
| `internshipDiary` | Dentro de `PerfilView` | `PerfilView.tsx:171-174` |
| `tcc` | Dentro de `PerfilView` | `PerfilView.tsx:176-179` |
| `stickers` | Dentro de `PerfilView` | `PerfilView.tsx:181-183` |

**Exceções (kind existe mas renderiza nada/fallback):**
- `wizard` + `type:'question'` → overlay em branco (B1).
- `course` com id não-curso (resultado de busca de aula) → fallback para a grade da Faculdade, mas o topo da pilha continua `course` (bottom-nav escondida, sem header detail).
- `approach`/`family` com id desconhecido → telas "não achei": `ApproachDetailView.tsx:67-72`, `FamilyDetailView.tsx:12-18`.

`parseRoute`/`routeToStack` **não produzem nenhum kind sem branch** — as rotas mortas são de *valor* (ids errados) e do subtype `question`.

### 4.2 Inventário de rotas hash (`parseRoute`, `routing.ts:80-174`)

| Rota | Parseia para | Tela |
|---|---|---|
| `#/`, `#/home` | `{tab:'home'}` (145) | ✅ HomeView |
| `#/streak` | `{tab:'home',streak}` (84) | ✅ StreakView |
| `#/perfil/streak`, `#/estudos/streak` | `{tab,streak}` (168) | ✅ StreakView (sobre a aba base) |
| `#/faculdade` | `{tab:'faculdade'}` (149) | ✅ FaculdadeView |
| `#/faculdade/c3` | `{focusedCourseId:'c3'}` (149) | ✅ CourseDetailView (se existe) |
| `#/faculdade/<id-desconhecido>` | `{focusedCourseId}` | ⚠️ fallback grade + bottom-nav escondida |
| `#/faculdade/{disciplinas,aulas,avaliacoes,calendario}` | `{subTab}` (147–148) | ✅ conteúdo real |
| `#/estudos`, `#/estudos/{sessoes,leituras,flashcards,questoes,historico}` | tab/subTab (158–171) | ✅ todos renderizam (questões = empty state com botão quebrado) |
| `#/biblioteca` | `{tab:'biblioteca'}` (156) | ✅ BibliotecaView |
| `#/biblioteca/notas` | `{notes:true}` (152) | ✅ NotesScreen |
| `#/biblioteca/templo` | `{temple:true}` (153) | ✅ TempleScreen |
| `#/biblioteca/familias` | `{families:true}` (135–137) | ✅ FamiliesView |
| `#/biblioteca/familias/:famId` | `{familyId}` (136) | ✅ FamilyDetailView (ou "não achei") |
| `#/biblioteca/abordagens/<psic-XX-XX>` | `{approachId}` (130–132) | ✅ ApproachDetailView (id real) |
| `#/biblioteca/abordagens/<collectionId>` | `{approachId}` | ❌ "não achei" (B2) |
| `#/biblioteca/{materiais,autores,conceitos,abordagens,mapa}` | `{subTab}` (154–155) | ⚠️ mesmo catálogo completo; `materiais`/`mapa` não destacam nada |
| `#/perfil` | `{tab:'perfil'}` (158–171) | ✅ PerfilView |
| `#/perfil/estagio` | `{internshipDiary:true}` (159–161) | ✅ InternshipDiaryView |
| `#/perfil/tcc` | `{tcc:true}` (162–164) | ✅ TccView |
| `#/perfil/stickers` | `{stickers:true}` (165–167) | ✅ StickersView |
| `#/perfil/<qualquer-outra>` | `{tab:'perfil'}` (173/171) | ✅ (perfil sem sub-tabs) |
| `#/nota`, `#/<tab>/nota`, `#/faculdade/c3/nota` (+`/detalhes`) | compose/composeDetails (88–107) | ✅ ComposeNoteView / ClassNoteDetailWizard |
| `#/novo/{tarefa,prova,prova-atividade,leitura,flashcard,estagio,estudo,autor,questao}` | `{wizard}` (111–127) | ✅ todos, **exceto `questao` → overlay em branco** |
| `#/novo/conceito`, `#/novo/xyz`, `#/xyz` | `{tab:'home'}` (122,125,173) | ✅ cai para home (testado em `routing.test.ts:110-111,120`) |

**Rotas que parseiam mas não levam a tela útil:**
1. `#/biblioteca/abordagens/<collectionId>` → "não achei" (B2).
2. `#/novo/questao` → overlay em branco (B1).
3. `#/faculdade/<id-desconhecido>` (incl. push da busca de aula) → grade com bottom-nav escondida.

**Rotas inalcançáveis pela UI:** nenhuma das telas auxiliares é inalcançável (`openStreak`, `openInternshipDiary`, `openTccScreen`, `openStickersScreen`, `openNotesScreen`, `openTemple`, `openFamilies`, `openFamily`, `openApproach` têm botões). `#/perfil/streak` é alcançável pela UI: `PerfilView.tsx:422` renderiza `StudyStatsWidget`, cujo clique → `openStreak` (`StudyStatsWidget.tsx:13-21`) → empurra `{kind:'streak'}` sobre a base perfil (`AppContext.tsx:924-931`) → hash `#/perfil/streak`.

### 4.3 Sub-tabs por aba — tratadas vs. placeholder

- **faculdade** — `disciplinas`, `aulas`, `avaliacoes`, `calendario`: **todas com conteúdo real** (`FaculdadeView.tsx:127, 183, 201, 228`).
- **estudos** — `sessoes` (342), `flashcards` (440), `leituras` (545), `questoes` (633), `historico` (680): **todas renderizam algo**. `questoes` mostra empty state cujo botão abre o wizard quebrado (B1).
- **biblioteca** — `SUB_TAB_BY_TAB.biblioteca = ['materiais','autores','conceitos','abordagens','mapa']` (`routing.ts:42`), mas **`BibliotecaView` nunca alterna por `subTabBiblioteca`** — renderiza sempre todas as seções inline e usa filtros. O `data-section` existe para `psicoterapias/mistas/testes/autores/conceitos/abordagens/multidisciplinar/artigos` (`BibliotecaView.tsx:567,602,638,669,700,731,766,801`).
  → **P9:** `materiais` e `mapa` são rotas no-op: parseiam, renderizam o mesmo catálogo e não destacam nada.
- **perfil** — sem sub-tabs; `DEFAULT_SUB_TAB.perfil='jornada'` (`routing.ts:51`); `#/perfil/xyz` → `{tab:'perfil'}`.

### 4.4 Código morto confirmado (por grep de importadores)

**Nunca importados (dead):**
- `src/data/index.ts` — facade que re-exporta types/schema/empty/seeds/libraryData/constants/notesSeeds (`:11-17`). **Zero importadores.** Views importam direto de `data/empty`, `data/seeds`, etc.
- `src/components/ui/Card.tsx` — definido (9), nunca importado.
- `src/components/ui/IconButton.tsx` — definido (9), nunca importado.
- `src/components/ui/ApproachDetailVerbCard.tsx`, `ApproachDetailAuthorCard.tsx`, `ApproachDetailComparisonCard.tsx`, `ApproachDetailConceptCard.tsx`, `ApproachDetailBookCard.tsx` — definidos, **nunca importados**.

**NÃO são dead (AGENTS.md está defasado):**
- `ApproachDetailView.tsx` — importado e renderizado (`BibliotecaView.tsx:51, 343-344`). A nota "never rendered" do AGENTS.md está **desatualizada**.
- `StarRating`, `AnimatedNumber`, `UnderlineTabBar`, `ProgressBar` — todos com importadores vivos.
- **VIVOS (2ª rodada — itens que poderiam parecer mortos):** `suggestions.ts` (`buildSuggestions` usado por `HomeView.tsx:26,78`); `psicoterapiaApproaches.ts` (seed lazy `AppContext.tsx:256`, ~1MB); `scroll.ts` (`scrollToTop`, 17 call sites em `AppContext.tsx:520-1059`); `photo.ts` (`pickProfilePhoto`, `PerfilView.tsx:27` + `OnboardingScreen.tsx:21`).

### 4.5 Como `ApproachDetailView` é renderizado hoje (dois caminhos)

**Caminho que funciona (ids reais `psic-XX-XX`):**
1. `BibliotecaView` renderiza `<ApproachDetailView approachId={focusedApproachId} />` quando o topo é `approach` (`BibliotecaView.tsx:343-344`).
2. Alcançado via Templo → Famílias: `TempleScreen.tsx:84` → `openFamilies()` → `FamiliesView.tsx:56` `openFamily(family.id)` → `FamilyDetailView.tsx:63` `openApproach(approach.id)` com `approaches.filter(a => a.familyId === familyId)` (56).
3. Ids: `psic-01-01`, `psic-01-02`, … (`src/data/psicoterapiaApproaches.ts:7,64`); `approaches` são seeded lazy no contexto (`AppContext.tsx:253-268`). `openApproach` empurra `{kind:'approach', approachId}` (`AppContext.tsx:909-920`) → hash `#/biblioteca/abordagens/<id>` (`routing.ts:255-257`) → round-trip OK (130–132).

**Caminho quebrado (ids de coleção):**
- Seção "abordagens & correntes da psicologia" renderiza `InlineCollectionBlock` para 2 coleções de abordagens e, **em todo clique de livro**, faz `window.location.hash = '#/biblioteca/abordagens/' + col.id` (`BibliotecaView.tsx:750-755`).
- `col.id` é id de **coleção**, não de abordagem: `col-app-tcc` (`libraryData.ts:583`) e `col-app-psicanalise` (`libraryData.ts:643`) — únicas coleções `blockCategory:'abordagens'` (as demais — `col-beck`, `col-freud`, `col-rogers`, `col-vygotsky` — são `'autores'`).
- Esse hash parseia `{tab:'biblioteca', approachId:'col-app-tcc'}` → empurra `{kind:'approach', approachId:'col-app-tcc'}` → `approaches.find(a => a.id === 'col-app-tcc')` → undefined → **"não achei essa abordagem por aqui ♡"** (`ApproachDetailView.tsx:67-72`).
- **Efeito colateral:** o clique em livro dessas duas coleções **nunca abre `BookDetailModal`** — sempre navega para a tela morta.

**B2 — Como resolver:**
- Opção A: os livros dessas coleções devem abrir `BookDetailModal` (comportamento padrão das outras coleções) — remover o bloco `onSelectBook` especial.
- Opção B: se a intenção é navegar para a abordagem, mapear cada livro/coleção para um id de abordagem real (`psic-XX-XX`) e chamar `openApproach(id)`.
- **Solução esperada:** clicar num livro da seção "abordagens & correntes" abre o modal do livro (ou a abordagem real), nunca a tela "não achei".

### 4.6 Header dinâmico

Configurado para: `streak` (1086–1094), `internshipDiary` (1095–1106), `tcc` (1107–1118), `stickers` (1119–1127), `notes` (1128–1139), `temple` (1140–1148), `families` (1149–1157), `family` (1158–1167), `approach` (1168–1176), `course` (1177–1196). Abas → `headerConfig` nulo → header de marca. `compose`/`composeDetails`/`wizard` → header oculto (`App.tsx:217`, `isAuxFlow`).

**P10 — Telas com header "meio preso":**
- `course` com id desconhecido (resultado de busca de aula): `focusedCourse` undefined → sem `headerConfig` → **header de marca sem botão voltar, enquanto bottom-nav está escondida** (topo ainda `course`) — estado meio preso.
- `approach`/`family` com ids desconhecidos ("não achei"): `focusedApproach`/`focusedFamily` undefined → header de marca sem back + bottom-nav escondida.
- `materiais`/`mapa` da biblioteca: header de marca, catálogo idêntico (rota no-op).
- **Como resolver:** para qualquer tela auxiliar empilhada, garantir header detail com botão voltar mesmo sem item encontrado (fallback com título genérico e "não encontrado" no corpo).
- **Solução esperada:** nenhuma tela empilhada fica sem back affordance.

### 4.7 Busca global — deep-link `targetId` (ver 3.7)

Efeito `AppContext.tsx:799-819` procura `[data-target]` (804) e depois `[data-section]` (805–807). Hooks disponíveis: `data-target` **só** em `ClassNoteListItem` (`ClassNoteListItem.tsx:19`); `data-section` **só** em `BibliotecaView` (8 seções). Resultado: só `concept`/`author`/`approach`/`class` destacam; `course` e `reading` não; `class` navegação estruturalmente errada; `approach` não abre o detalhe.

### 4.8 Back do Android (`@capacitor/app` em `App.tsx:118-164`)

Cadeia linear: `QuickAdd → Search → EditCourse → DetailPrompt → ComposeDetails → Compose → Wizard → Streak → InternshipDiary → Tcc → Stickers → Notes → Temple → Families → family → approach → course → else CapacitorApp.exitApp()`.

Os pops são guardados por flag por tela (derivados, `AppContext.tsx:344-360`) — não trava em loop.

**Lacunas / estados presos (P5):**
1. **`isEditTccOpen` não está na cadeia.** `EditTccModal` (aberto de `TccView.tsx:39,58`, renderizado em `App.tsx:332-337`) não é fechado pelo back. Com a tela Tcc no topo, o back fecha a tela por baixo (`App.tsx:140-141`) e o **modal fica flutuando sobre o perfil** — estado preso de verdade.
2. **Modais locais das views invisíveis ao handler** (vivem em estado da view, não no `AppContext`):
   - `BookDetailModal`, `ArticleDetailModal`, `LibraryFilterModal` (`BibliotecaView.tsx:883-916`)
   - `ClassNoteModal` (`FaculdadeView.tsx:302-305`, `CourseDetailView.tsx:547-550`)
   - `ReaderModeModal` (`EstudosView.tsx:738-743`)
   - Modal de autor dentro de `ApproachDetailView` (268–286)
   - Composer inline de notas em `NotesScreen` (`isCreatingLooseNote`, `:128`)
   - Com uma **aba** no topo (ex.: biblioteca + `BookDetailModal` aberto), o 1º back cai em `exitApp()` (`App.tsx:156-157`) — **o app sai com modal aberto**.
   - Com tela auxiliar no topo, o back faz pop da tela e **deixa o modal aberto sobre a aba base**.
3. A cadeia é determinística (checks exclusivos; `focusedFamilyId`/`focusedApproachId` só truthy quando o topo corresponde, `AppContext.tsx:351-352`) — sem double-pop.

**Como resolver (P5):** elevar os estados de "modal aberto" das views para o `AppContext` (ou registrar um callback global de modal), e incluir `EditTccModal` na cadeia antes de `Tcc`.
- **Solução esperada:** o back fecha o modal aberto (qualquer um) antes de popar/ sair.

---

## 5. Auditoria — Libs, recursos nativos e persistência

### 5.1 `src/lib/*` módulo a módulo

| Módulo | Status | Observação |
|---|---|---|
| `storage.ts` | ✅ wired+works | dual web (sync) ↔ nativo (async), prefixo `cecistudy_`; testes ok |
| `usePersistentState.ts` | ✅ wired+works | 24 invocações no `AppContext`; no nativo hidrata pós-seed (comportamento documentado) |
| `native.ts` | ✅ wired (nativo) / noop web | status bar, keyboard, splash — boot em `App.tsx:112` |
| `haptics.ts` | ⚠️ wired+partial | `hapticTap`/`hapticSuccess` usados; **`hapticWarning` morto** (`:17`) |
| `notifications.ts` | ✅ wired+works (nativo) / noop web | `updateReminder` (`AppContext.tsx:681-690`); UI Perfil 620–664; `reminderSettings` persistido (chave `reminder`); sem testes |
| `celebrate.ts` | ✅ wired+works | 5 gatilhos; `reading-done` só via `handleUpdateReadingPages`, **não** via `updateReadingProgress` (catálogo) |
| `permissions.ts` | ✅ wired+works (só onboarding) | único call site: `OnboardingScreen.tsx:23-24,433,446`; **nenhuma UI pós-onboarding**; web → `unsupported` |
| `photo.ts` | ✅ wired+works | onboarding + Perfil (câmera/galeria nativo; `<input type=file>` + canvas no web); `photoUrl` persistido |
| `streak.ts` | ✅ wired+works | registrado em 5 ações; ver P6 (lacunas) |
| `schedule.ts` | ✅ wired+works | Home + Faculdade; sem testes |
| `suggestions.ts` | ✅ wired+works | HomeView; sem testes |
| `taskLogic.ts` | ✅ wired+works | `shouldCelebrateTasks` → confete + haptic + toast; testado |
| `ota.ts` | ✅ wired+works (nativo) / noop web | `initOta()` no boot (`App.tsx:204-206`, guard `onboarding.completed`); `notifyAppReady`; auto-check 4s; `next()`/`applyNow`; UI nativa |
| `otaLogic.ts` | ✅ wired+works | semver/manifest; testado |
| `exportImport.ts` | ✅ wired+works (2 lacunas) | ver P8 |
| `utils.ts` | ✅ wired+works | `cn()` em tudo; `copyToClipboard`; testado |
| `routing.ts` | ✅ wired+works | cobertura boa; excessão do wizard `question` (B1) |
| `motion.ts` | ⚠️ wired+partial | **`TAP_SPRING` morto** (`:20`) |
| `scroll.ts` | ✅ wired+works | `scrollToTop` nos handlers de navegação |
| `stickers.ts` | ✅ wired+works | merge + unlocks no mount; testado |
| `data/index.ts` | 🧟 dead | facade sem importadores |

### 5.2 Matriz de plugins Capacitor

| Plugin | package.json | Importado em | UI alcançável | Veredito |
|---|---|---|---|---|
| `@capacitor/core` | ✓ | storage, exportImport, App.tsx | — | core |
| `@capacitor/app` | ✓ | `App.tsx:3` (back :118–159) | back Android | ✅ wired+works |
| `@capacitor/status-bar` | ✓ | `native.ts:1` | boot | ✅ wired (nativo) |
| `@capacitor/keyboard` | ✓ | `native.ts:2` | boot | ✅ wired (nativo) |
| `@capacitor/splash-screen` | ✓ | `native.ts:3` | boot | ✅ wired (nativo) |
| `@capacitor/preferences` | ✓ | `storage.ts:2` | — | ✅ wired+works |
| `@capacitor/haptics` | ✓ | `haptics.ts:1` | toggles/saves | ✅ wired+works |
| `@capacitor/local-notifications` | ✓ | `notifications.ts:1`, `permissions.ts:4` | Perfil lembrete + onboarding | ✅ wired+works (nativo) |
| `@capacitor/camera` | ✓ | `permissions.ts:1`, `photo.ts:1` | foto de perfil | ✅ wired+works (feature real) |
| `@capacitor/calendar` | ✓ | **só** `permissions.ts:2,29-32,56-58` | só toggle "agenda" do onboarding | 🧟 semi-dead: só permissão, **nenhuma feature** (D4) |
| `@capacitor/filesystem` | ✓ | `permissions.ts:3`, `exportImport.ts:18` | onboarding + backup nativo | ✅ wired+works |
| `@capacitor/share` | ✓ | `exportImport.ts:19` | share do backup nativo | ✅ wired+works |
| `@capgo/capacitor-updater` | ✓ | `ota.ts:2` | OtaUpdateModal + Perfil | ✅ wired+works (nativo) |
| `canvas-confetti` | ✓ | `celebrate.ts:1` | 5 gatilhos | ✅ wired+works |

**D4 (`@capacitor/calendar`) — problema:** o plugin está no `package.json` e pede permissão no onboarding, mas **nenhuma feature escreve no calendário do sistema**; o "calendário" do app é UI derivada de provas/tarefas. Capability pendurada.
- **Como resolver:** ou implementar uma feature (ex.: "adicionar evento no calendário do sistema" a partir de provas/aulas), ou remover o plugin + a permissão do onboarding.
- **Solução esperada:** nenhuma permissão/capability sem uso real.

### 5.3 Auditoria de persistência (`usePersistentState` no `AppContext.tsx:243-325`)

| Chave | Seed | Setter exposto? | Chamado? |
|---|---|---|---|
| `profile` | `empty.ts:30` | `handleUpdateProfile` (:673) | ✓ (Perfil, foto, onboarding, stickers) |
| `courses` | `[]` | `handleUpdateCourse` (:692) + `applyDatabase` | ✓ |
| `classes` | `[]` | `handleAddClassNote`/`handleUpdateClassNote` (:577,582) | ✓ |
| `tasks` | `[]` | `handleAddTask`/`handleUpdateTask`/`handleToggleTask` | ✓ |
| `exams` | `[]` | `handleAddExam`/`handleToggleExam` | ✓ |
| `authors` | `[]` | `handleAddAuthor` (:652) | ✓ (`AuthorWizard.tsx:112`) |
| `concepts` | `[]` | **nenhum handler** | ✗ sem setter; **nenhuma UI cria** (D1) |
| `approaches` | `[]` → lazy seed `PSICOTERAPIA_APPROACHES` (:252-268) | setter **não exposto** (só efeito lazy) | ✗ **read-only** — está no value (`:1208`), consumido por `GlobalSearchModal.tsx:33`, `AuthorWizard.tsx:15`, `FamilyDetailView.tsx:8`, `ApproachDetailView`; nada edita (intencional) |
| `readings` | `[]` | `handleAddReading`/`handleUpdateReadingPages`/`handleUpdateReadingChapters` (:594,598,669) | ✓ dois primeiros; **`handleUpdateReadingChapters` nunca chamado** |
| `flashcards` | `[]` | `handleAddFlashcard`/`handleReviewFlashcard` (:619,623) | ✓ |
| `materials` | `[]` | `setMaterials` só em `applyDatabase` (:707) | ✗ **nenhuma UI cria** (D3) |
| `internship` | `[]` | `handleAddInternshipLog` (:644) | ✓ (`InternshipWizard.tsx:499`) |
| `tcc` | `emptyTcc` | `handleUpdateTcc` (:677) | ✓ (`EditTccModal`) |
| `stickers` | `lockedStickerCatalog()` | `setStickers` (merge/unlock) | ✓ |
| `sessions` | `[]` | `handleAddSession` (:656) | ✓ (SessionWizard + pomodoro) |
| `questions` | `[]` | `handleAddQuestion` (:661) | ✗ **nunca chamado** (B1) |
| `techniques` | `[]` | `handleAddTechnique` (:665) | ✗ **nunca chamado**; **zero UI** (D2) |
| `streakData` | `emptyStreakData` | `registerActivity` (:541) | ✓ (5 ações) |
| `reminder` | `emptyReminder` | `updateReminder` (:681) | ✓ (Perfil) |
| `onboarding` | `emptyOnboarding` | `completeOnboarding` (:735) | ✓ |
| `savedBookIds` | `[]` | `toggleSaveBook` (:1014) | ✓ (Biblioteca) |
| `readingProgress` | `{}` | `updateReadingProgress` (:1020) | ✓ (BookDetailModal) — **mas não alimenta streak/celebrate** |
| `bookmarkedCourseIds` | `[]` | `toggleBookmarkCourse` (:533) | ✓ (header bookmark) |
| `looseNotes` | `[]` | `addLooseNote`/`deleteLooseNote` (:586,590) | ✓ (NotesScreen + compose) |

**Sinalizados:** persistidas-mas-nunca-atualizadas → `approaches` (read-only, intencional), `materials` (sem fluxo de criação), `questions` (criação quebrada), `techniques` (sem UI). Persistida sem setter no value → `concepts` (sem add/update).

**25ª chave fora do AppContext (2ª rodada):** `composePrefs` — `usePersistentState<ComposePrefs>('composePrefs', { mode: 'avulsa' })` em `ComposeNoteView.tsx:30`. Fica **fora dos counts 24/24/24/22** do §5.4: não entra em `emptyDatabase()`, `demoDatabase()`, `exportData` nem `applyDatabase` — logo, **reset/import não limpa** `composePrefs`.
- **Como resolver:** decidir se `composePrefs` deve participar do backup (adicionar às 4 estruturas) ou continuar "preferência de UI" e documentar como tal.
- **Solução esperada:** ou o backup restaura/limpa `composePrefs`, ou fica explícito que é preferência de UI não incluída.

### 5.4 Schema / export-import / seeds — sincronia

- `SCHEMA_VERSION = 6` (`schema.ts:8`); `MIGRATIONS` cobre 2→6 (1 pulado, tratado pelo loop `migrateDatabase`, `schema.ts:85-89`). Versão 6 remove chaves de humor (`schema.ts:61-71`).
- **Contagem de chaves em sincronia:** `emptyDatabase()` (`empty.ts:85-111`) = **24 chaves**; `demoDatabase()` (`seeds.ts:29-54`) = **24**; `exportData` (`AppContext.tsx:752-758`) = **24**; `applyDatabase` (`:698-719`) seta **22** — pula `approaches` e `onboarding`.
- Contagem demo: `initialProfile/courses/classes/tasks/exams/authors/concepts/readings/flashcards/materials/internshipLogs/tcc/stickers/studySessions/streakData` + `INITIAL_NOTES`. `approaches: []`, `questions: []`, `techniques: []` (vazios no demo).
- `SCHEMA_VERSION_KEY` (`schema.ts:11`) **exportado mas nunca usado** — a versão só vive dentro do JSON; nada carimba `localStorage`.

### 5.5 `exportImport` — lacunas (P8)

1. `exportData` (`AppContext.tsx:748-761`) inclui `approaches` — mas `applyDatabase` (`:697-720`) **nunca restaura approaches** (import/loadDemo/reset deixam o catálogo lazy de 97 abordagens intacto). Exportar approaches é cosmético.
2. `applyDatabase` não seta `onboarding` (tratado em `completeOnboarding`) — ok.
3. `SCHEMA_VERSION_KEY` exportado mas não usado.
4. Validação do import correta: recusa não-objeto/versão ausente (`exportImport.ts:61-63`), `migrateDatabase` retorna `null` para `fromVersion < 1` ou `> SCHEMA_VERSION` (`schema.ts:82-83`), aplica MIGRATIONS 2→6.

**Como resolver (P8):** restaurar `approaches` no import (com safe-merge dos `psic-XX-XX` existentes) ou parar de exportá-los; remover/usar `SCHEMA_VERSION_KEY`.
- **Solução esperada:** backup/restore fiel ao estado exportado, sem ambigüidade de versão.

### 5.6 Streak — lacunas (P6)

- `registerActivity` (`AppContext.tsx:541-547`) chamado em exatamente 5 lugares: tarefa concluída (554), aula anotada (579), avanço de leitura (610), revisão de flashcard (626), sessão salva (658). Finais de semana excluídos via `isStudyDay` (543). Lógica bem testada (`streak.test.ts`, 25+ casos).
- **Lacunas:**
  a. `handleToggleExam` (`AppContext.tsx:562-567`) **não registra atividade** — concluir prova não conta na streak.
  b. `updateReadingProgress` (livros do catálogo na Biblioteca, `:1020`) **não registra atividade nem celebra** — só leituras do `EstudosView` contam.
  c. `handleReviewFlashcard` carimba `lastReviewed` com `toISOString()` (UTC, `:625`) enquanto a streak usa `toDateKey` local — **risco de off-by-one perto da meia-noite**.
- **Como resolver:** adicionar `registerActivity()` em `handleToggleExam` e `updateReadingProgress`; usar data local (`toDateKey`) em vez de `toISOString` para `lastReviewed`.
- **Solução esperada:** toda ação de estudo relevante conta na streak; datas de revisão consistentes no fuso local.

### 5.7 Testes órfãos / soltos

- `src/lib/__tests/zzdiag.test.ts` — teste diagnóstico (asserts `true`, loga tipos de `localStorage`). O `include: ['src/**/*.test.{ts,tsx}']` do `vitest.config.ts:14` **o executa em todo `npm run test`**. Inofensivo, mas deve sair (D8).
- Cobertura atual (2ª rodada, corrigida): `routing` (27), `streak` (25), `stickers` (15), `otaLogic` (13),
  `catalog` (18, em `src/data/books/__tests__/catalog.test.ts` — **antes omitido**), `utils` (6),
  `taskLogic` (5), `storage` (4), `UnderlineTabBar` (3), `zzdiag` (1) (+ `Modal`).
- ⚠️ **Correção (2ª rodada):** o doc citava `PillTabBar` — **não existe** (grep zero). O componente real é
  `src/components/ui/__tests__/UnderlineTabBar.test.tsx` (renomeado; doc defasado).
- Views/modais/wizards sem cobertura.

---

## 6. Inventário consolidado de código morto

| Item | Arquivo | O que é | Ação sugerida |
|---|---|---|---|
| `data/index.ts` | `src/data/index.ts` | facade sem importadores | remover (imports diretos já existem) |
| `Card.tsx` | `src/components/ui/Card.tsx` | primitiva não usada | usar (migrar cards repetidos) ou remover |
| `IconButton.tsx` | `src/components/ui/IconButton.tsx` | primitiva não usada | usar ou remover |
| `ApproachDetailVerbCard.tsx` | `src/components/ui/` | nunca importado | usar no `ApproachDetailView` ou remover |
| `ApproachDetailAuthorCard.tsx` | `src/components/ui/` | nunca importado | idem |
| `ApproachDetailComparisonCard.tsx` | `src/components/ui/` | nunca importado | idem |
| `ApproachDetailConceptCard.tsx` | `src/components/ui/` | nunca importado | idem |
| `ApproachDetailBookCard.tsx` | `src/components/ui/` | nunca importado | idem |
| `hapticWarning` | `src/lib/haptics.ts:17` | export sem call sites | usar ou remover |
| `TAP_SPRING` | `src/lib/motion.ts:20` | export sem importadores | remover |
| `SCHEMA_VERSION_KEY` | `src/data/schema.ts:11` | export sem uso | usar ou remover |
| `handleAddQuestion` | `src/context/AppContext.tsx:661` | handler nunca chamado | ligar a um QuestionWizard ou remover |
| `handleAddTechnique` | `src/context/AppContext.tsx:665` | handler nunca chamado | ligar a UI de técnicas ou remover |
| `handleUpdateReadingChapters` | `src/context/AppContext.tsx:669` | handler nunca chamado | ligar ao modo leitura real ou remover |
| `zzdiag.test.ts` | `src/lib/__tests/zzdiag.test.ts` | teste diagnóstico órfão | remover |
| `@capacitor/calendar` | `package.json` | só permissão, sem feature | implementar feature ou remover |
| Entidade `concepts` (criação) | — | sem wizard/handler/UI | criar fluxo ou aceitar como só-seed |
| Entidade `techniques` | `src/types.ts` + `AppContext` | persistida, zero UI | criar UI ou remover da persistência |
| Entidade `materials` | `src/types.ts` + `AppContext` | só leitura | criar fluxo de criação ou remover |
| `screenKey` | `src/context/AppContext.tsx:110,362,1234` | exposto no `useApp()` sem consumidor | remover (App.tsx usa `slideKey`/`overlayKey`) |
| `setActiveTab` (contexto) | `src/context/AppContext.tsx:116,1075,1238` | exposto sem consumidor | remover (⚠️ `CourseDetailView.tsx:59,159` tem `setActiveTab` **local** — não confundir) |
| `setFocusedCourseId` | `src/context/AppContext.tsx:1248` | exposto, nunca chamado (nem interno) | remover |
| `handleUpdateTask` | `src/context/AppContext.tsx:573` | handler nunca chamado | ligar a UI de edição de tarefa ou remover |
| prop `internshipLogs` | `src/components/views/CourseDetailView.tsx:42` | prop morta (passada de `FaculdadeView.tsx:60`, não usada no destructure :47-58) | remover da interface + do call site |
| import `StickyNote` | `src/components/library/NotesScreen.tsx:10` | import não usado (render usa FileText/Search/X/Plus/Check/Copy/Trash2) | remover |
| `formatNoteDate` | `src/components/library/notes.ts:17` | função morta (citada em §3.11, faltava na §6) | usar (data real das notas) ou remover |
| `constants.ts` | `src/data/constants.ts` | módulo inteiro morto (`STREAK_WHAT_COUNTS` :9, `WEEKDAY_LABELS` :18, zero importadores) | remover (ou usar nas telas de streak) |
| `articlesForFamily` | `src/data/books/index.ts:258` | export morto (nunca importado) | remover |
| `interdisciplinaryBooks` | `src/data/books/index.ts:142` | não usado em runtime (só `catalog.test.ts` + ref interna :212) | remover do bundle (manter só no teste) ou consumir |
| `REMINDER_CHANNEL` | `src/lib/notifications.ts:7` | export morto | remover |
| 6 classes CSS | `src/index.css` | mortas: `.journal-card` (:187), `.paper-texture` (:248), `.cute-badge` (:255), `.press-btn` (:221), `.hover-lift` (:230), `.font-serif-academic` (:181) | remover ou usar (vivas: `.card-lift`, `.press-card`, `.cv-shelf`, `.tap-interactive`, `.touch-target`, `.scrollbar-none`) |
| devDeps sem uso | `package.json` | `@testing-library/user-event` (:57), `tsx` (:68), `autoprefixer` (:63, sem postcss.config); **`vite` duplicado** em deps (:51) e devDeps (:70) | remover do arquivo correto (manter `vite` só em devDeps) |

> **VIVOS apesar do doc (2ª rodada):** `suggestions.ts`, `psicoterapiaApproaches.ts`, `scroll.ts`, `photo.ts` —
> ver §4.4. `bottom-nav-bar.tsx` é **VIVO** (`BottomNav.tsx:4`) mas carrega resíduo de template shadcn:
> `defaultNavItems` (Home/Portfolio/Transactions/Messages/Rewards/Profile, `:23-30`) e classes
> `dark:bg-card`/`dark:border-sidebar-border` que não resolvem para tokens do tema — **Como resolver:**
> limpar o resíduo (remover `defaultNavItems` morto e classes `dark:` não-tokenizadas).

---

## 7. Plano de correção sugerido (por fases)

### Fase A — destravar o quebrado (prioridade máxima)
- **A1 (B1):** criar `QuestionWizard` (ou desativar o botão "nova questão" com toast/remover sub-tab até existir feature). Ligar `handleAddQuestion`.
- **A2 (B2):** corrigir o `onSelectBook` das coleções "abordagens & correntes" (`BibliotecaView.tsx:750-755`) — abrir `BookDetailModal` ou navegar para abordagem real.

### Fase B — parciais que afetam o uso diário
- **B1 (P1):** conteúdo real no modo leitura (capítulos/resumo persistidos; remover parágrafo fixo; bookmark funcional ou removido).
- **B2 (P2):** deep-link da busca: corrigir push de aula (não usar `course` para nota), adicionar `data-target`/`data-section` para curso/leitura, abrir abordagem no resultado.
- **B3 (P3):** edição de notas avulsas + data real + mover `LooseNote` para `types.ts`.
- **B4 (P5):** incluir `EditTccModal` e os modais locais das views na cadeia do back do Android.
- **B5 (P6):** streak em prova concluída + livro do catálogo + `lastReviewed` no fuso local.

### Fase C — higiene e sincronização
- **C1 (P7/P9/P10/P11/P12):** calendário com aulas/estágio; `materiais`/`mapa` com seções reais ou remoção das rotas; header com back em telas sem item; meta do dia 100% derivada; fallbacks de `courseId`.
- **C2 (P8):** restore de `approaches` no import; uso/remoção de `SCHEMA_VERSION_KEY`.
- **C3 (D1–D8 + novos da §6):** decisão e limpeza dos itens mortos — inclui `screenKey`, `setActiveTab` (contexto), `setFocusedCourseId`, `handleUpdateTask`, prop `internshipLogs`, import `StickyNote`, `formatNoteDate`, `constants.ts`, `articlesForFamily`, `interdisciplinaryBooks`, `REMINDER_CHANNEL`, 6 classes CSS e as devDeps sem uso + `vite` duplicado.
- **C4:** atualizar `AGENTS.md`/`.context/*.md` (docs defasados: "not a git repo", "ApproachDetailView never rendered", `components.md` sem wizards/`wizardFields`/`Kitty`, `data-model.md` sub-tab estudos `revisoes` → real `historico`, resíduo shadcn do `bottom-nav-bar`) e remover `zzdiag.test.ts`.
- **C5:** expansão de testes (QuickAddModal, GlobalSearchModal, wizards, views; corrigir `PillTabBar` → `UnderlineTabBar`).
- **C6:** decisão sobre `composePrefs` (participar do backup ou documentar como preferência de UI — §5.3).
- **C7 (outros achados):** normalizar rótulos title-case do FAB do BottomNav para lowercase; corrigir docstring `PsicoterapiaFieldKey` ("22 campos" → 21, `types.ts:252`); substituir a manipulação direta de hash em `BibliotecaView.tsx:754` por `openApproach`.

### Critérios de aceite
- `npm run lint` (tsc --noEmit) verde.
- `npm run test` (vitest) verde.
- `npm run build` verde.
- Verificação manual nos fluxos afetados (web +, quando possível, nativo).

---

## 8. Checklist de verificação manual (pós-correção)

- [ ] Estudos → "questões": botão "nova questão" abre um fluxo funcional (ou aviso claro).
- [ ] Biblioteca → "abordagens & correntes": clique em livro abre o modal do livro (ou a abordagem certa), nunca "não achei".
- [ ] Estudos → leitura em andamento → modo leitura: mostra conteúdo real (ou estado vazio claro), sem texto genérico.
- [ ] Busca ⌘K: resultado de aula leva à aula destacada; curso leva ao curso; leitura rola até a seção; abordagem abre o detalhe.
- [ ] Notas avulsas: criar, editar e deletar; data correta.
- [ ] Back do Android: fecha modal aberto → fecha tela auxiliar → sai do app (incluindo `EditTccModal`).
- [ ] Streak: concluir prova e avançar livro do catálogo conta no dia; revisão de flashcard perto da meia-noite conta no dia certo.
- [ ] Calendário da Faculdade mostra aulas, provas, tarefas e estágio.
- [ ] Perfil → Dados: exportar → resetar → importar restaura todas as entidades exportadas (incl. abordagens, se exportadas).
- [ ] Perfil → personalização: lembrete liga/desliga e persiste (nativo).
- [ ] Nenhuma tela auxiliar fica sem botão voltar.

---

## 9. Registro da 2ª rodada de verificação (ago/2026)

> Subagentes re-rodados por categoria, varrendo o projeto inteiro e cruzando com este documento. O que
> mudou nesta revisão:

### Correções factuais ao documento original
- **§4.2** — "#/perfil/streak só alcançável digitando URL" era **falso**: `PerfilView.tsx:422` →
  `StudyStatsWidget.tsx:13-21` → `openStreak` (`AppContext.tsx:924-931`).
- **§5.3** — "approaches não está no value do context" era **falso**: está em `AppContext.tsx:1208`
  (read-only, sem setter — intencional), consumido por `GlobalSearchModal`, `AuthorWizard`,
  `FamilyDetailView`, `ApproachDetailView`.
- **§5.7** — "PillTabBar" **não existe** (grep zero); o arquivo real é `UnderlineTabBar.test.tsx`
  (componente renomeado). Cobertura de testes re-listada com contagens por suíte (inclui `catalog`, 18).
- **Off-by-one** em refs de linha: `BibliotecaView.tsx:343-345` → `:343-344` (§4.1/§4.4/§4.5);
  `ApproachDetailView.tsx:67-73` → `:67-72` (§4.1/§4.5).

### Itens novos no documento
- **§2.7** — auditoria funcional das 9 telas auxiliares/onboarding: `OnboardingScreen` (7 passos, ✅;
  `loadDemo` default `true`, `dailyQuote`/`targetCareer` literais), `StreakView` ✅, `TempleScreen` ⚠️
  (4 de 5 cards = toast "em breve" — reforça P4), `FamiliesView` ✅, `FamilyDetailView` ✅,
  `ApproachDetailView` ✅ (ids reais `psic-XX-XX`; placeholders honestos; rodapé fixo),
  `InternshipDiaryView` ✅, `TccView` ✅ (toggle de capítulo persistido), `StickersView` ✅.
- **§3.16** — `FloatingActionMenu` do BottomNav (5 atalhos diretos fora do QuickAdd; rótulos title-case
  destoam da voz lowercase), `EditTccModal` ✅ (P5 confirmado), form inline de tarefa na Home,
  `OtaUpdateModal` ✅, `wizardFields.tsx` (primitivas dos 7 wizards — não é dead), `ui/Kitty` (8+ usos).
- **§5.3** — `composePrefs` (`ComposeNoteView.tsx:30`) como **25ª chave persistida fora do AppContext**
  (reset/import não limpa).
- **§6** — 13 itens novos de dead code (`screenKey`, `setActiveTab` do contexto, `setFocusedCourseId`,
  `handleUpdateTask`, prop `internshipLogs`, import `StickyNote`, `formatNoteDate`, `constants.ts`
  inteiro, `articlesForFamily`, `interdisciplinaryBooks`, `REMINDER_CHANNEL`, 6 classes CSS, devDeps
  sem uso + `vite` duplicado) + nota "VIVOS apesar do doc" (`suggestions.ts`, `psicoterapiaApproaches.ts`,
  `scroll.ts`, `photo.ts`) e resíduo shadcn do `bottom-nav-bar`.
- **§7 Fase C** — itens C6 (decisão sobre `composePrefs`) e C7 (outros achados: FAB title-case,
  docstring `PsicoterapiaFieldKey` "22" → 21 em `types.ts:252`, hash direto em `BibliotecaView.tsx:754`).

---

*Documento de referência gerado a partir da auditoria funcional de agosto/2026. Evidências apontam para `arquivo:linha` na versão `main` à época. Se o código mudar, revalidar antes de aplicar as correções.*