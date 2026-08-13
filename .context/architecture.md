# Arquitetura

> Visão estrutural do cecistudy: stack, hierarquia de componentes, modelo de estado,
> navegação e planos de backend. (pt-BR)

## 1. Stack e ferramentas

| Camada | Escolha | Notas |
|---|---|---|
| Framework | React 19 | SPA, sem router |
| Linguagem | TypeScript 5.8 | `tsc --noEmit` como lint/typecheck |
| Build | Vite 6 | alias `@/` → `src/`; HMR desabilitável via `DISABLE_HMR` (AI Studio) |
| Estilos | Tailwind CSS 4 | tokens em `@theme` no `src/index.css` |
| Animações | framer-motion 13 + motion 12 | entrada/saída de views, modais, nav |
| Ícones | lucide-react | ícones nomeados (ex.: `Brain`, `FileText`) |
| Utils | class-variance-authority + clsx + tailwind-merge | via `cn()` em `src/lib/utils.ts` |
| Slot | @radix-ui/react-slot | usado no `Button` (`asChild`) |
| Persistência | `localStorage` | prefixo `cecistudy_` |

**Dependências declaradas mas não usadas (dead):** `@google/genai`, `express`, `dotenv`.
A intenção é um backend com a API Gemini do lado do servidor (ver seção 6). O `package.json`
ainda usa `"name": "react-example"` (deveria ser `cecistudy`).

## 2. Hierarquia de componentes

```
App  (wrapper fino: AppProvider → AppShell)
└── AppProvider  (src/context/AppContext.tsx — TODO o estado global + persistência + handlers + navegação)
    └── AppShell  (consome useApp(); renderiza HeaderNav, views, BottomNav, modais)
        ├── HeaderNav  (header dinâmico: modo default (brand) ou detail)
        ├── main (container mobile-first, max-w-md / sm:max-w-xl)
        │   ├── (se moodView aberto) EstadoDeEspiritoView
        │   └── Views por activeTab (consumem useApp(), sem props):
        │       ├── HomeView
        │       ├── FaculdadeView ──► (se focusedCourse) CourseDetailView
        │       ├── EstudosView
        │       ├── BibliotecaView
        │       └── PerfilView
        ├── BottomNav (barra inferior + FloatingActionMenu)
        ├── QuickAddModal   (formulário "novo registro")
        └── GlobalSearchModal (busca global ⌘K)
```

- **Views** principais consomem o estado via hook `useApp()` (sem props drilling).
- **Modais/nav** (`QuickAddModal`, `GlobalSearchModal`, `HeaderNav`, `BottomNav`) ainda recebem
  props do `AppShell` (apenas 1 nível de drilling).
- **Widgets** (`components/widgets/`) são blocos reutilizáveis dentro das views.
- **ui/** (`components/ui/`) são primitivas de baixo nível (button, bottom-nav-bar, FAB).

## 3. Estado e persistência

Todo o estado global vive em `src/context/AppContext.tsx` (provider `AppProvider`) usando o
hook custom `usePersistentState` (em `src/lib/usePersistentState.ts`):

```ts
const usePersistentState = <T,>(key, initialValue) => {
  const [state, setState] = useState<T>(() => {
    const item = localStorage.getItem('cecistudy_' + key);
    return item ? JSON.parse(item) : initialValue;
  });
  useEffect(() => localStorage.setItem('cecistudy_' + key, JSON.stringify(state)), [key, state]);
  return [state, setState];
};
```

- Cada entidade tem seu próprio estado + setter (profile, courses, classes, tasks, exams,
  authors, concepts, approaches, readings, flashcards, materials, internshipLogs, tcc,
  stickers, sessions, currentMood), todos expostos via hook `useApp()`.
- Alguns estados **não** usam persistência e vivem em `useState` local da view:
  - `systemSuggestions`, dados de dias da semana (HomeView — dummy)
  - `dotsData` do calendário de humor (MoodCalendarWidget — dummy)

> ✅ `savedBookIds` e `looseNotes` (BibliotecaView) já são persistidos via `usePersistentState`.

## 4. Modelo de navegação (sem router)

Navegação 100% por estado em `App.tsx`:

- `activeTab: NavTab` → `'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil'`
- Sub-tabs por tab (estado próprio das views): `SubTabFaculdade`, `SubTabEstudos`,
  `SubTabBiblioteca`, `SubTabPerfil`.
- `handleNavigate(tab, subTab?, targetId?)` centraliza a troca de tab + rolagem ao topo.
- `targetId` → abre uma entidade específica (ex.: disciplina) vinda da busca global.
- `focusedCourseId` → renderiza `CourseDetailView` (drill-down de disciplina).

### Header dinâmico (`DynamicHeaderConfig`)
`App.tsx` constrói um `headerConfig` conforme o contexto:
- **default** — header de marca (logo "C", "cecistudy ♡", badge de semestre, busca, mood).
- **detail** — botão voltar, ícone/`code` da disciplina, título/subtítulo, favorito
  (bookmark) e `rightActions` custom (ex.: botão "Anotação").

## 5. Padrões de UI recorrentes

- **Layout mobile-first:** container `max-w-md sm:max-w-xl mx-auto`, `pb-20` para a barra inferior.
- **Pills de sub-tab:** botões `rounded-full` com estado ativo (`bg-[#40383A] text-white`).
- **Cards:** `.journal-card` ou `rounded-[24px] bg-white border-[#E9DFDC] shadow-…`.
- **Modais:** overlay `fixed inset-0 z-50 bg-black/40 backdrop-blur-xs` (repetido — ver backlog).
- **Capa de livro:** bloco colorido com lombada (spine `w-2.5 bg-black/10`), usado na biblioteca.

Detalhes completos em [`design-system.md`](./design-system.md).

## 6. Backend / AI Studio (planejado)

- `metadata.json` declara `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
- `.env.example` prevê `GEMINI_API_KEY` e `APP_URL`, injetadas pelo AI Studio em runtime.
- As deps `express`, `dotenv`, `@google/genai` estão presentes mas **sem código** —
  há a intenção de um servidor (ex.: `server.js`) para recursos de IA que ainda não existe.

## 7. Pontos de atenção arquitetural (resumo)

- `App.tsx` é wrapper fino (`AppProvider` → `AppShell`); estado centralizado em `AppContext`.
- Views principais consomem `useApp()`; modais/nav ainda têm 1 nível de props (do `AppShell`).
- Modais e patterns duplicados (em melhoria contínua).
- Ver [`backlog.md`](./backlog.md) para o backlog completo.
