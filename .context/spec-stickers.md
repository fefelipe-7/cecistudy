# Spec — Stickers & Conquistas: correção + catálogo expandido

**Base:** análise de `src/types.ts`, `src/data/stickerCatalog.ts`, `src/lib/stickers.ts`, `src/components/views/StickersView.tsx`.

---

## 1. Achado crítico: quase metade do catálogo atual nunca desbloqueia

`isConditionMet()` (`src/lib/stickers.ts`) só trata 18 dos 39 tipos de `StickerCondition` definidos em `types.ts`. Os outros 21 caem no `default: return false` — ou seja, **nunca são verdadeiros, para sempre**, mesmo que a usuária cumpra a condição de verdade.

Tipos afetados e stickers correspondentes no catálogo atual:

| Tipo quebrado | Sticker(s) afetado(s) |
|---|---|
| `exams-added` | st-15 "primeira avaliação registrada" |
| `exams-done` | st-16 "frente nas provas" |
| `concepts-known` | st-17 "conceitos na bagagem" |
| `authors-known` | st-18 "galeria de autores" |
| `materials-added` | st-19 "materiais em dia" |
| `courses` | st-20 "grade montada" |
| `flashcards-count` | st-22 "deck de cartas" |
| `questions-created` | st-23 "perguntas no cantinho" |
| `techniques-used` | st-24 "técnicas na manga" |
| `study-minutes` | st-25 "duas horinhas de foco" |
| `streak-total` | st-26 "constância real" |
| `reading-count` | st-27, st-30 |
| `reading-in-progress` | st-28 "livro na cabeceira" |
| `loose-notes` | st-31 "anotações soltas" |
| `internship-hours` | st-34 "hora na clínica" |
| `internship-logs` | st-35 "diário de campo em dia" |
| `tcc-created` | st-36 "tcc germinando" |
| `tcc-chapters-done` | st-37 "primeiro capítulo do tcc" |
| `penultimate-semester` | st-38 "reta final da graduação" |
| `streak-longest` | st-39 "ofensiva de mestre" |
| `graduation` | st-40 "formatura!" |

**Boa notícia:** os tipos já existem no union `StickerCondition` (`types.ts:742-781`) — não é preciso mudar schema, só implementar os `case`s faltantes em `isConditionMet()`.

### 1.1 Implementação dos 21 `case`s faltantes

```ts
// src/lib/stickers.ts — dentro de isConditionMet(), adicionar ao switch:

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
case 'questions-created':
  return state.questions.length >= condition.min;
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
  // conferir valor exato do status "em andamento" no tipo Reading — usar o mesmo
  // literal já usado em BibliotecaView.tsx para status "lendo"/"em andamento"
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
```

**Nota sobre `StickerState`:** os campos `exams`, `concepts`, `authors`, `materials`, `courses`, `questions`, `techniques`, `looseNotes` já existem na interface `StickerState` (`stickers.ts:17-38`), mas hoje tipados como `unknown[]` ou sem os campos usados acima (`completed` em exams, por exemplo, já existe). Conferir/ajustar tipagem desses campos ao implementar, trocando `unknown[]` por shapes mínimos como já feito para `readings`/`flashcards`.

**Correção adicional (bug menor, mesmo arquivo):** `streak-week` e `streak-month` (linhas 73-76) têm lógica redundante/confusa — comparam `state.streakTotal` contra um valor fixo (5 ou 15) **e também** contra `condition.min`, com precedência estranha (`&&` antes do ternário implícito). Simplificar para:
```ts
case 'streak-week':
  return state.streakTotal >= condition.min;
case 'streak-month':
  return state.streakTotal >= condition.min;
```
(A diferenciação semana/mês já vem do `min` diferente em cada sticker do catálogo — não precisa de lógica hardcoded no case.)

---

## 2. Filosofia da lista expandida

### 2.1 Curva de dificuldade (por que não é pirâmide simples)

Pirâmide pura (muito fácil → muito difícil, linear) tem um problema: no meio do caminho a progressão fica "sem graça" — sempre mais um pouco, sempre a mesma sensação. A curva melhor para um app de hábito de estudo cruza duas coisas:

1. **Cadência ao longo do tempo de uso**, não só dificuldade da métrica: nas ~2 primeiras semanas de uso, várias conquistas fáceis caem rápido (ensina que o sistema existe, dá gás inicial). Depois disso, a cadência desacelera sozinha porque as métricas crescem — sem precisar de nenhuma lógica especial de "primeiras semanas", só de escalonar os limiares certo.
2. **Escala geométrica dentro de cada métrica**, não linear. Em vez de `5 → 10 → 15 → 20` sessões (sensação de "sempre a mesma distância"), uso algo como `1 → 5 → 15 → 40 → 100` (cada degrau é ~2.5–3x o anterior). Isso cria dois efeitos bons: o início é rápido (1→5 é curto), e o topo continua alcançável — 100 sessões de estudo ao longo de uma graduação de psicologia (10 semestres) é totalmente factível, não é "impossível", é só raro de verdade.

### 2.2 Cinco níveis de raridade (informal, não exposto na UI como rótulo — só orienta a escolha dos limiares)

| Nível | Sensação-alvo | Exemplo de limiar (sessões de estudo) | Tempo aproximado p/ atingir com uso regular |
|---|---|---|---|
| Semente 🌱 | "uau, já ganhei uma coisa" | 1 | primeiro dia de uso |
| Broto 🌿 | "tô pegando o jeito" | 5 | primeira semana |
| Raiz 🌳 | "isso já é hábito" | 15–20 | primeiro mês |
| Copa 🌲 | "tô mesmo constante" | 40–50 | um semestre |
| Floresta 🏔️ | "poucas pessoas chegam aqui" | 100+ | um ano+ de uso |

Cada métrica nova segue essa proporção (~3x de nível a nível), ajustada à escala natural da métrica (não faz sentido pedir "100 TCCs criados" — lá o topo natural é 1 evento único, tipo "defesa concluída").

### 2.3 Regra de design: nunca punir, só celebrar

Confirma o que `applyStickerUnlocks` já garante no código (`s.unlocked` nunca regride) — mantive esse princípio em toda conquista nova: nenhuma conquista de "não faltou X dias" ou "sem atraso Y vezes". Toda condição é sobre acumular algo positivo, nunca sobre não ter feito algo negativo.

---

## 3. Catálogo expandido

Organizado por categoria (mantendo as 4 categorias existentes — `Sticker['category']` é um union fechado, não expandido). Cada bloco mostra: os que já existem (mantidos), os corrigidos por escala melhor, e os novos.

### 3.1 `faculdade` — 20 stickers (hoje: 10 funcionais + novos)

| id | nome | condição | min | observação |
|---|---|---|---|---|
| st-2 | cantinho organizado | `profile-set` | — | mantido |
| st-7 | análise de autor | `concepts-with-authors` | 3 | mantido |
| st-7b | teóricas na ponta da língua | `concepts-with-authors` | 10 | **novo** |
| st-10 | caderno caprichado | `class-notes` | 10 | mantido |
| st-10b | anotações de quem estuda de verdade | `class-notes` | 40 | **novo** |
| st-13a | primeira missão | `tasks-done` | 1 | **novo, degrau abaixo do st-13** |
| st-13 | missões cumpridas | `tasks-done` | 15 | mantido |
| st-13b | 50 missões | `tasks-done` | 50 | **novo** |
| st-13c | organização nível TDAH controlado | `tasks-done` | 150 | **novo, topo — humor leve, atenção ao tom** |
| st-15 | primeira avaliação registrada | `exams-added` | 1 | mantido, agora funcional |
| st-16 | frente nas provas | `exams-done` | 3 | mantido, agora funcional |
| st-16b | temporada de provas | `exams-done` | 10 | **novo** |
| st-17 | conceitos na bagagem | `concepts-known` | 10 | mantido, agora funcional |
| st-17b | mapa mental completo | `concepts-known` | 30 | **novo** |
| st-18 | galeria de autores | `authors-known` | 5 | mantido, agora funcional |
| st-18b | quem é quem da psicologia | `authors-known` | 15 | **novo** |
| st-19 | materiais em dia | `materials-added` | 5 | mantido, agora funcional |
| st-19b | acervo de referências | `materials-added` | 20 | **novo** |
| st-20 | grade montada | `courses` | 3 | mantido, agora funcional |
| st-20b | grade cheia | `courses` | 6 | **novo** |

**Nota de tom:** st-13c usa uma referência a TDAH de forma leve e afirmativa (organização como conquista, não piada sobre a condição em si). Se preferir, substituir por algo mais neutro tipo "organização em outro nível" — sinalizo aqui porque humor sobre saúde mental pede mais cuidado que humor sobre memes gerais.

### 3.2 `estudo` — 20 stickers

| id | nome | condição | min | observação |
|---|---|---|---|---|
| st-21 | primeiro foco | `sessions` | 1 | mantido |
| st-9 | foco de verdade | `sessions` | 5 | mantido |
| st-9b | rotina de foco | `sessions` | 20 | **novo** |
| st-9c | maratonista do foco | `sessions` | 60 | **novo** |
| st-3 | mestre dos flashcards | `flashcards-reviewed` | 10 | mantido |
| st-3b | revisão em dia | `flashcards-reviewed` | 50 | **novo** |
| st-3c | 200 revisões | `flashcards-reviewed` | 200 | **novo** |
| st-22 | deck de cartas | `flashcards-count` | 10 | mantido, agora funcional |
| st-22b | deck robusto | `flashcards-count` | 40 | **novo** |
| st-23 | perguntas no cantinho | `questions-created` | 5 | mantido, agora funcional |
| st-24 | técnicas na manga | `techniques-used` | 3 | mantido, agora funcional |
| st-25 | duas horinhas de foco | `study-minutes` | 120 | mantido, agora funcional |
| st-25b | dez horas de foco | `study-minutes` | 600 | **novo** |
| st-5 | semana do café & livros | `streak` | 5 | mantido |
| st-12 | maratona de foco | `streak` | 14 | mantido |
| st-12b | ofensiva de 30 dias | `streak` | 30 | **novo** |
| st-26 | constância real | `streak-total` | 15 | mantido, agora funcional |
| st-41 | semana de foco | `streak-week` | 5 | mantido |
| st-42 | mês de consistência | `streak-month` | 15 | mantido |
| st-44 | mestre das questões | `questions-mastered` | 50 | mantido |

### 3.3 `leituras` — 20 stickers

| id | nome | condição | min | observação |
|---|---|---|---|---|
| st-27 | primeira leitura registrada | `reading-count` | 1 | mantido, agora funcional |
| st-30 | leitora assídua | `reading-count` | 5 | mantido, agora funcional |
| st-30b | estante em movimento | `reading-count` | 15 | **novo** |
| st-1 | primeira leitura concluída | `reading-done` | — | mantido |
| st-28 | livro na cabeceira | `reading-in-progress` | 1 | mantido, agora funcional |
| st-29 | cem páginas | `pages-read` | 100 | mantido |
| st-11 | devoradora de livros | `pages-read` | 500 | mantido |
| st-33 | maratona literária | `pages-read` | 1000 | mantido |
| st-33b | três mil páginas | `pages-read` | 3000 | **novo, topo** |
| st-14 | biblioteca pessoal | `saved-books` | 5 | mantido |
| st-32 | estante querida | `saved-books` | 10 | mantido |
| st-32b | acervo completo | `saved-books` | 25 | **novo** |
| st-31 | anotações soltas | `loose-notes` | 5 | mantido, agora funcional |
| st-31b | ideias em profusão | `loose-notes` | 20 | **novo** |
| st-43 | flashcards em dia | `flashcard-streak` | — | mantido (realocado p/ leituras — revisão de cartas é hábito de leitura recorrente) |
| st-45 | exploradora de técnicas | `techniques-explored` | 5 | mantido (realocado p/ leituras — técnicas de estudo, não de campo) |
| st-9d | clube do livro sozinha mesmo | `reading-count` | 30 | **novo** |
| st-11b | maratona kindle | `pages-read` | 2000 | **novo** |
| st-14b | PDF piratinha organizado | `saved-books` | 15 | **novo, humor leve sobre hábito comum de estudante — revisar se cabe no tom do app** |
| st-31c | segunda cabeça externa | `loose-notes` | 40 | **novo, referência a "cognitive offloading" — vem do próprio tema do seu TCC** |

### 3.4 `jornada` — 20 stickers (inclui estágio e TCC)

| id | nome | condição | min | observação |
|---|---|---|---|---|
| st-4 | primeiro dia de estágio | `internship-first` | — | mantido |
| st-34 | hora na clínica | `internship-hours` | 1 | mantido, agora funcional |
| st-34b | dez horas de campo | `internship-hours` | 10 | **novo** |
| st-34c | cem horas de campo | `internship-hours` | 100 | **novo** |
| st-34d | duzentas horas — marco de estágio | `internship-hours` | 200 | **novo, referência a carga comum de estágio básico** |
| st-35 | diário de campo em dia | `internship-logs` | 3 | mantido, agora funcional |
| st-35b | registro constante de campo | `internship-logs` | 15 | **novo** |
| st-35c | freud ficaria orgulhosa das suas anotações | `internship-logs` | 40 | **novo, humor temático — atenção ao tom, ver nota abaixo** |
| st-36 | tcc germinando | `tcc-created` | — | mantido, agora funcional |
| st-37 | primeiro capítulo do tcc | `tcc-chapters-done` | 1 | mantido, agora funcional |
| st-37b | metade do caminho do tcc | `tcc-chapters-done` | 3 | **novo — ajustar min conforme nº típico de capítulos** |
| st-37c | tcc quase lá, resiliência de quem faz TCC em trio | `tcc-chapters-done` | 5 | **novo, referência pessoal ao seu contexto (TCC em trio) — trocar se não quiser algo tão específico** |
| st-8 | defesa do tcc | `tcc-done` | — | mantido |
| st-6 | rumo ao CRP! | `degree-half` | — | mantido |
| st-38 | reta final da graduação | `penultimate-semester` | — | mantido, agora funcional |
| st-40 | formatura! | `graduation` | — | mantido, agora funcional |
| st-39 | ofensiva de mestre | `streak-longest` | 21 | mantido, agora funcional |
| st-39b | ofensiva lendária | `streak-longest` | 60 | **novo, topo raro** |
| st-4b | supervisão, chat é sério | `internship-logs` | 8 | **novo, humor internet — ver nota de tom** |
| st-4c | analisando até a fila do mercado | `internship-first` | — | **redundante como condição — trocar por `internship-hours: 50` antes de implementar; entra como piada sobre "deformação profissional" de psicóloga em formação** |

### 3.5 Resumo de contagem

- Catálogo atual: 45 stickers (24 funcionais, 21 quebrados).
- Catálogo proposto: **80 stickers — exatamente 20 por categoria**, todos funcionais.
- Distribuição por raridade aproximada (heurística da seção 2.2): ~40% semente/broto (fácil, primeiras semanas), ~35% raiz (primeiro mês/semestre), ~25% copa/floresta (constância de médio-longo prazo).

**Nota geral de tom (humor temático):** marquei com "ver nota de tom" as entradas que usam humor sobre saúde mental, hábitos como pirataria de PDF, ou referência muito específica ao seu contexto pessoal (TCC em trio). São sugestões de rascunho, não veredito — vale você (e talvez sua namorada, que vai usar o app de verdade) revisar essas antes de eu implementar, trocando por algo mais neutro se não soar do jeito certo. O restante do catálogo (referências a Freud, DSM, "analisando todo mundo", gírias de internet como "chat é sério") segue o que você validou como aceitável.

---

## 4. Melhoria de UI associada (pequena, mas relevante para "empolgante de completar")

`StickersView.tsx` hoje mostra só bloqueado/desbloqueado — nenhuma indicação de "quão perto". Para conquistas com `min` numérico, adicionar uma barra de progresso fina (reaproveitando o `ProgressBar` já existente no design system, mesmo componente usado em `TccView`) sob a descrição, quando bloqueado:

```tsx
{!st.unlocked && st.condition && 'min' in st.condition && (
  <div className="mt-2">
    <ProgressBar value={Math.min(100, (currentValueFor(st.condition, state) / st.condition.min) * 100)} />
    <p className="text-[9px] text-ceci-tertiary mt-1">
      {currentValueFor(st.condition, state)}/{st.condition.min}
    </p>
  </div>
)}
```//
Requer expor o valor numérico atual (não só booleano) de `isConditionMet` — pequena refatoração para uma função irmã `currentValueFor(condition, state): number` ao lado de `isConditionMet`, usada só para exibição, sem mudar a lógica de desbloqueio.

**Por que isso importa tanto quanto a lista maior:** "7/15 tarefas concluídas" é o que faz a pessoa voltar e pensar "só faltam 8" — é o mesmo princípio de pendência-derivada-visível que já discutimos para o estágio. Sem isso, mesmo com 69 stickers, boa parte fica invisível como progresso até desbloquear do nada.

---

## 5. Sistema de XP, níveis e títulos

Sistema novo — não existe hoje nada de XP/nível no código (`UserProfile` não tem esses campos, e não há lógica de pontuação em nenhum lugar do app). Desenhado para reaproveitar o catálogo de stickers da seção 3 como única fonte de XP, sem precisar de lógica de pontuação por ação separada.

### 5.1 Modelo de dados

```ts
// adição em types.ts

export interface CategoryProgress {
  category: Sticker['category'];
  xp: number;
  level: number;      // 1-10, derivado de xp — recalculado, não persistido separadamente se preferir
}

export interface UserProfile {
  // ...campos existentes
  categoryXp: Record<Sticker['category'], number>;  // xp bruto acumulado por categoria
}
```

**Regra de concessão de XP:** cada sticker tem um `xpValue` implícito, calculado a partir do seu nível de raridade (seção 2.2) — não precisa de campo novo no catálogo, dá pra derivar de forma determinística a partir do `min` da condição (quanto maior o `min` relativo aos outros da mesma métrica, mais XP). Tabela fixa por raridade, mais simples de manter:

| Raridade | XP concedido |
|---|---|
| 🌱 Semente | 20 |
| 🌿 Broto | 50 |
| 🌳 Raiz | 120 |
| 🌲 Copa | 250 |
| 🏔️ Floresta | 500 |

Ao desbloquear um sticker (`applyStickerUnlocks`), soma o XP correspondente em `categoryXp[sticker.category]`. Sem lógica nova de pontuação — é literalmente reaproveitar o momento que já existe.

### 5.2 Curva de nível (por categoria)

Curva geométrica suave (razão ~1.35 por nível — mesmo princípio da seção 2.1, aplicado agora ao XP acumulado em vez de à métrica bruta):

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

Com 20 stickers por categoria distribuídos pela heurística de raridade da seção 2.2 (~8 semente/broto, ~7 raiz, ~5 copa/floresta), o total de XP disponível por categoria fica em torno de 2400–2800 — ou seja, nível 10 é alcançável completando quase todo o catálogo daquela categoria, o que é o efeito certo (nível máximo = "você praticamente completou essa categoria", não um teto arbitrário desconectado dos stickers).

```ts
// src/lib/levels.ts (novo arquivo, função pura — mesmo padrão de review.ts)
export const LEVEL_THRESHOLDS = [0, 50, 117, 207, 328, 491, 711, 1008, 1408, 1948];

export function levelFor(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; isMaxLevel: boolean } {
  const level = levelFor(xp);
  if (level >= LEVEL_THRESHOLDS.length) return { current: xp, needed: xp, isMaxLevel: true };
  return { current: xp - LEVEL_THRESHOLDS[level - 1], needed: LEVEL_THRESHOLDS[level] - LEVEL_THRESHOLDS[level - 1], isMaxLevel: false };
}
```

### 5.3 Títulos temáticos por categoria (10 níveis cada)

Tom validado: referências de psicologia/terapia (Freud, DSM, TCC vs psicanálise) e gírias de internet atuais são bem-vindas.

#### `faculdade`

| Nv | Título |
|---|---|
| 1 | calouro perdido no mapa do campus |
| 2 | aprendiz de PowerPoint |
| 3 | caçadora de slide no Classroom |
| 4 | fluente em "profa, vai cair na prova?" |
| 5 | sobrevivente de sexta-feira com 3 provas |
| 6 | Ctrl+F em prontuário mental próprio |
| 7 | citação ABNT sem ansiedade |
| 8 | terapeuta dos colegas de sala (não remunerada) |
| 9 | quase formada, moralmente exausta |
| 10 | veterana que já viu de tudo (inclusive a si mesma) |

#### `estudo`

| Nv | Título |
|---|---|
| 1 | pomodoro de boa vontade |
| 2 | flashcard iniciante |
| 3 | destruidora de deck |
| 4 | leitora de bula de remédio por hábito clínico |
| 5 | streak guerreira |
| 6 | 3h de foco, 0h de sono |
| 7 | mestre do "só mais uma revisão" |
| 8 | vidão de estudo espaçado |
| 9 | ninja do resumo esquematizado |
| 10 | chat, é real? nível deusa do cronograma |

#### `leituras`

| Nv | Título |
|---|---|
| 1 | leitora de orelha de livro |
| 2 | PDF piratinha organizado(a) |
| 3 | grifadora compulsiva |
| 4 | sabe a diferença entre TCC e psicanálise de cabeça |
| 5 | bibliófila em recuperação financeira |
| 6 | Freud já não assusta mais |
| 7 | DSM debaixo do braço |
| 8 | segunda cabeça externa (cognitive offloading com estilo) |
| 9 | estante que pesa mais que a mochila |
| 10 | é basicamente uma enciclopédia com CRP |

#### `jornada`

| Nv | Título |
|---|---|
| 1 | estagiária com o coração na mão |
| 2 | analisando a fila do mercado sem querer |
| 3 | "e você, como se sente sobre isso?" (modo automático ligado) |
| 4 | supervisão, chat é sério |
| 5 | diário de campo com plot twist toda semana |
| 6 | quase-psicóloga em construção |
| 7 | TCC: capítulo escrito, alma parcialmente intacta |
| 8 | rumo ao CRP com convicção |
| 9 | reta final, café e resiliência |
| 10 | formada (ou quase) — Freud ficaria orgulhoso |

**Nota sobre st-13c/st-4c/etc. marcadas na seção 3:** os títulos acima já dão o tom geral; onde a piada específica de um sticker individual repetir a mesma referência do título de nível (ex: "Freud ficaria orgulhosa"), ajustar um dos dois para não repetir a mesma piada duas vezes na mesma categoria.

### 5.4 Nível geral (combinado)

Soma simples de XP das 4 categorias, com seus próprios 10 títulos — não-temáticos por categoria específica, mas ainda com humor, representando a "jornada da psicóloga em formação" como um todo:

```ts
const totalXp = Object.values(profile.categoryXp).reduce((a, b) => a + b, 0);
// mesma curva de LEVEL_THRESHOLDS, mas escalada 4x (soma de 4 categorias)
const GENERAL_THRESHOLDS = LEVEL_THRESHOLDS.map(t => t * 4);
```

| Nv | Título geral |
|---|---|
| 1 | novata no cantinho |
| 2 | estudante de primeiro contato terapêutico |
| 3 | zona de conforto? não conheço |
| 4 | rapport com o próprio cronograma |
| 5 | vínculo terapêutico com a cafeteira |
| 6 | insight tem hora, mas a sua vem sempre |
| 7 | supervisionada oficial da vida acadêmica |
| 8 | quase-CRP, alma de veterana |
| 9 | formação sólida, ansiedade administrável |
| 10 | psicóloga(o) em formação nível mestre jedi da escuta ativa |

### 5.5 UI — onde isso aparece

**Header do perfil / Home:** badge compacto com nível geral + título (nível 5.4), reaproveitando o mesmo padrão visual do `Sticker` (`bg-rose-500`, cantos arredondados) já usado no cabeçalho de `StickersView.tsx`.

**`StickersView.tsx`, dentro de cada bloco de categoria:** substituir o contador simples "`{groupUnlocked}/{group.length}`" por uma barra de nível compacta:

```tsx
<div className="flex items-center justify-between">
  <h3>{CATEGORY_LABELS[category]}</h3>
  <span className="text-[11px] text-ceci-secondary">
    nv. {levelFor(profile.categoryXp[category])} · {TITLES[category][levelFor(...) - 1]}
  </span>
</div>
<ProgressBar value={/* % até o próximo nível, via xpToNextLevel */} />
```

Reaproveita `ProgressBar` (mesmo componente já sugerido na seção 4) — sem componente novo de baixo nível.

**Momento de level up:** ao cruzar um threshold de nível dentro de `applyStickerUnlocks`, disparar o mesmo tipo de celebração visual que já deve existir para desbloqueio de sticker (conferir se há toast/modal de "sticker desbloqueado" já implementado em algum lugar do fluxo — reaproveitar o mesmo padrão para "nível X alcançado: [título]").

---

## 6. Ordem de implementação sugerida

1. **Seção 1** — implementar os 21 `case`s faltantes em `isConditionMet`. Corrige o catálogo atual sem adicionar nada novo; usuárias que já cumpriram condições "escondidas" vão ver stickers desbloquearem na primeira abertura pós-update (bom momento de celebração retroativa).
2. **Seção 3** — adicionar as ~35 entradas novas ao `STICKER_CATALOG`, fechando 20 por categoria (revisar antes as marcadas "ver nota de tom").
3. **Seção 4** — barra de progresso na `StickersView`, opcional mas recomendado no mesmo ciclo.
4. **Seção 5** — sistema de XP/nível/título: `categoryXp` no perfil, `levels.ts`, concessão de XP ao desbloquear sticker, UI de nível na Home e na `StickersView`. Depende de (1)-(3) estarem prontos, já que XP é inteiramente derivado do catálogo de stickers.

