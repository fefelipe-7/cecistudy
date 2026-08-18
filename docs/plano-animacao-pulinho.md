# cecistudy ♡ — Plano: pulinho como padrão de transição em todas as telas

> Plano completo de implementação (aguardando execução). Objetivo: tornar a animação de
> entrada da **tela de estudos** ("pulinho" — fade + sobe 10px) o **padrão de transição de
> todas as telas** do app, centralizada em uma única fonte (`src/lib/motion.ts`).
>
> **Decisões tomadas com a usuária:**
> 1. **Abordagem A — Centralizar no AppShell** (camada global de `src/App.tsx`), não por-view.
> 2. **Sensação:** igual à Estudos hoje (easeOut, 0.3s, sobe 10px) — sem mudança perceptível.
> 3. **Escopo:** todas as telas, inclusive detalhes/quiz.

---

## 1. Diagnóstico (análise concluída)

O app tem **duas camadas de animação**:

1. **Camada global (AppShell)** — `src/App.tsx:264-371` envolve **todas** as telas de 1º nível
   num `<motion.div>` com `screenVariants` (`src/lib/motion.ts:38`). A chave `slideKey` muda a
   cada navegação (tab, course, notes, temple, streak, study, quiz…), então **toda** tela é
   remontada por essa camada:
   - troca de aba (`direction=0`): só **fade** (0.18s), sem deslocamento;
   - push/pop (`direction=±1`): **slide horizontal** (`x: ±22`).
2. **Animação interna por view** — apenas algumas telas têm um `motion.div` de entrada extra:
   - **`EstudosView:155`** → `initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}` **sem
     `transition`** (framer usa o padrão: easeOut, 0.3s). **Este é o "pulinho".**
   - **`Home` / `Faculdade` / `Biblioteca` / `Perfil`** → nenhuma animação interna; só o fade
     do AppShell. Por isso a Estudos se destaca entre as abas principais.
   - Telas auxiliares (Notes, Temple, Families, FamilyDetail, ApproachDetail, Study*, Quiz*)
     têm o mesmo `y:10` interno — empilhado sobre a camada global.

**Consequência:** a Estudos é a única aba principal com o pulinho e ainda paga **duas
animações** (fade do AppShell + pulinho interno). As telas auxiliares também dobram a animação.

### Inventário completo (verificado em `arquivo:linha`)

| Tela | Nível | Onde é renderizada |
|---|---|---|
| `EstudosView` | wrapper de tela (`y:10`) | AppShell (aba) |
| `StreakView` | hero card apenas (`y:10`) — **manter** | AppShell (`slideKey='streak'`) |
| `StudyFocusScreen` | wrapper de tela + bloco interno (`y:10`) — **só remover wrapper** | AppShell |
| `StudyRevisarScreen` | wrapper de tela + drag-card — **só remover wrapper** | AppShell |
| `StudyLeiturasScreen` | wrapper de tela | AppShell |
| `StudyHistoricoScreen` | wrapper de tela | AppShell |
| `QuizLoadingScreen` | wrapper de tela + `motion.span` — **só remover wrapper** | AppShell |
| `QuizPlayer` | wrapper de tela + cards | AppShell |
| `QuizCategorySelector` | wrapper de tela + seções internas | AppShell |
| `QuizResultScreen` | wrapper de tela + cards internos | AppShell |
| `NotesScreen` | wrapper de tela | dentro de `BibliotecaView` (muda `slideKey='notes'`) |
| `TempleScreen` | wrapper de tela | dentro de `BibliotecaView` (`slideKey='temple'`) |
| `FamiliesView` | wrapper de tela | dentro de `BibliotecaView` (`slideKey='families'`) |
| `FamilyDetailView` | wrapper de tela | dentro de `BibliotecaView` (`slideKey='family-…'`) |
| `ApproachDetailView` | wrapper de tela | dentro de `BibliotecaView` (`slideKey='approach-…'`) |
| `CourseDetailView` | **sem entrada** (ganha pulinho via AppShell) | dentro de `FaculdadeView` (`slideKey='course-…'`) |
| `InternshipDiaryView` / `TccView` / `StickersView` | **sem entrada** (ganham pulinho via AppShell) | dentro de `PerfilView` |
| `OnboardingScreen` | `y:12`, fluxo dedicado fora da camada — **manter** | `App.tsx:239` |

> Todas as telas auxiliares mudam o `slideKey` (ver `AppContext.tsx:544-577`), portanto são
> remontadas pelo AppShell e vão herdar o pulinho da camada global.

---

## 2. Etapa 1 — Centralizar o padrão em `src/lib/motion.ts`

### 2.1 Adicionar a constante canônica

Após a definição de `IOS_EASE_OUT` (~linha 9), adicionar:

```ts
/** Pulinho padrão de entrada de tela — fade + sobe 10px, curva easeOut (0.3s). Igual à EstudosView. */
export const VIEW_PULINHO: Transition = { duration: 0.3, ease: 'easeOut' };
```

### 2.2 Alterar `screenVariants`

Substituir o bloco atual (linhas 38-62) por:

```ts
export const screenVariants: Variants = {
  initial: (direction: number) => ({
    x: direction === 0 ? 0 : direction * 22,
    y: 10,
    opacity: 0,
  }),
  animate: (direction: number) => ({
    x: 0,
    y: 0,
    opacity: 1,
    transition: VIEW_PULINHO,
  }),
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : direction * -14,
    y: 0,
    opacity: direction === 0 ? 0 : 0.35,
    transition:
      direction === 0
        ? { duration: 0.12, ease: 'easeIn' }
        : { duration: 0.16, ease: 'easeIn' },
  }),
};
```

**O que muda / por quê:**
- `initial.y`: `0` → `10` — toda entrada começa 10px abaixo (o pulinho);
- `animate.transition`: `VIEW_PULINHO` (easeOut 0.3s) em **todas** as direções — substitui o
  fade 0.18 da troca de aba e o slide 0.24 do push/pop; o slide horizontal é preservado porque
  `x` continua em `initial` e volta a `0`;
- `exit` mantido (fade simples) — o pulinho é animação de **entrada** apenas.

> Observação: `AnimatePresence mode="popLayout"` e `MotionConfig reducedMotion="user"`
> (`App.tsx:264, 483`) continuam funcionando sem alteração. Usuários com "reduzir movimento"
> seguem sem animação.

---

## 3. Etapa 2 — Remover animações de entrada duplicadas

Para cada tela abaixo, converter o `motion.div` de entrada (com `initial`/`animate`) em `<div>`
simples, **mantendo o `className` e o conteúdo**; trocar o fechamento `</motion.div>` por `</div>`.

### 3.1 Tabela de edição

| # | Arquivo | Abre (linha) | Fecha (linha) | `className` |
|---|---|---|---|---|
| 1 | `src/components/views/EstudosView.tsx` | 155 | 393 | `max-w-md sm:max-w-xl mx-auto space-y-4 pb-1` |
| 2 | `src/components/views/ApproachDetailView.tsx` | 119 | 292 | `max-w-md sm:max-w-xl mx-auto space-y-8 pb-1 relative` |
| 3 | `src/components/views/FamiliesView.tsx` | 18 | 99 | `max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 relative` |
| 4 | `src/components/views/FamilyDetailView.tsx` | 25 | 105 | `max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 relative` |
| 5 | `src/components/estudos/StudyFocusScreen.tsx` | 70 | 192 | `max-w-md sm:max-w-xl mx-auto space-y-4` |
| 6 | `src/components/estudos/StudyHistoricoScreen.tsx` | 40 | 172 | `max-w-md sm:max-w-xl mx-auto space-y-3` |
| 7 | `src/components/estudos/StudyLeiturasScreen.tsx` | 24 | 122 | `max-w-md sm:max-w-xl mx-auto space-y-3` |
| 8 | `src/components/estudos/StudyRevisarScreen.tsx` | 80 | 182 | `max-w-md sm:max-w-xl mx-auto space-y-4` |
| 9 | `src/components/library/NotesScreen.tsx` | 73 | 361 | `max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 relative` |
| 10 | `src/components/library/TempleScreen.tsx` | 90 | 141 | `max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 relative` |
| 11 | `src/components/quizzes/QuizLoadingScreen.tsx` | 58 | 80 | `min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-6` |
| 12 | `src/components/quizzes/QuizPlayer.tsx` | 87 | 234 | `min-h-[70vh] flex flex-col pb-44` |
| 13 | `src/components/quizzes/QuizCategorySelector.tsx` | 218 | 364 | `min-h-[70vh] flex flex-col pb-44` |
| 14 | `src/components/quizzes/QuizResultScreen.tsx` | 137 | 363 | `min-h-[70vh] flex flex-col pb-44` |

Exemplo (antes/depois), `EstudosView.tsx`:

```tsx
// antes
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  className="max-w-md sm:max-w-xl mx-auto space-y-4 pb-1"
>

// depois
<div className="max-w-md sm:max-w-xl mx-auto space-y-4 pb-1">
```

### 3.2 Remover `import { motion }` onde ficar sem uso

Após a etapa 3.1, os arquivos abaixo ficam **sem nenhum** `<motion.*>` — remover a linha
`import { motion } from 'framer-motion';` (linha 2 em todos):

- `src/components/views/ApproachDetailView.tsx`
- `src/components/views/FamiliesView.tsx`
- `src/components/views/FamilyDetailView.tsx`
- `src/components/estudos/StudyHistoricoScreen.tsx`
- `src/components/estudos/StudyLeiturasScreen.tsx`
- `src/components/library/NotesScreen.tsx`
- `src/components/library/TempleScreen.tsx`

> O `tsconfig.json` não usa `noUnusedLocals`, então import órfão não quebra o `lint` — mas a
> remoção mantém o código limpo.

### 3.3 NÃO tocar (animações de itens/cards, não são transição de tela)

- `HomeView.tsx:40-72` e `:479-512` — itens de tarefa/sugestão (`y:6`, com `layout`/`whileTap`);
- `StreakView.tsx:33-46` — hero card (`y:10` + pulse infinito da chama);
- `StudyFocusScreen.tsx:134-138` — bloco "guardar sessão de X min?" (condicional);
- `StudyRevisarScreen.tsx:126` — card com `drag` (flashcards);
- `QuizLoadingScreen.tsx:70` — `motion.span`;
- `QuizCategorySelector` / `QuizResultScreen` — seções e cards internos;
- `OnboardingScreen` — fluxo dedicado (`App.tsx:239`, fora da camada global), usa `y:12`.

---

## 4. Etapa 3 — Telas que passam a herdar o pulinho automaticamente

Sem tocar em código, ganham o pulinho via camada global (mudança do `slideKey` → remount):

- abas: `Home`, `Faculdade`, `Biblioteca`, `Perfil` (troca de aba, `direction=0`);
- `CourseDetailView` (dentro de `FaculdadeView`);
- `InternshipDiaryView`, `TccView`, `StickersView` (dentro de `PerfilView`);
- `StreakView` (hero card mantém sua entrada própria em cima do pulinho global).

---

## 5. Etapa 4 — Verificação (gate obrigatório)

```bash
npm run lint        # tsc --noEmit
npm run test        # vitest
npm run build       # vite build
```

- Nenhum teste cobre animação (só `routing`, `storage`, `utils`, `streak`, `otaLogic`, etc.) —
  sem impacto esperado.
- Verificação manual no `npm run dev`: alternar entre as 5 abas e abrir/fechar curso, notas,
  temple, streak, estudo (focus/revisar/leituras/histórico) e quiz — todas devem entrar com o
  mesmo fade + pulinho; o slide horizontal dos push/pop continua presente.

---

## 6. Etapa 5 — Atualizar docs (após código verde)

- `design-system.md` §8 — trocar a nota `Entrada de views: initial={{opacity:0,y:10}}
  animate={{opacity:1,y:0}}` por: transição de tela centralizada em `screenVariants`/
  `VIEW_PULINHO` (`src/lib/motion.ts`), aplicada a todas as telas via `App.tsx`; animações de
  item/card ficam por-view.

---

## 7. Resumo de arquivos alterados

**Código:**
- `src/lib/motion.ts` (adicionar `VIEW_PULINHO` + alterar `screenVariants`)
- 14 telas: converter wrapper de entrada `motion.div` → `div`
- 7 telas: remover `import { motion }`

**Docs:**
- `design-system.md` (§8, após validação)