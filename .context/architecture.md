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
App  (raiz — possui TODO o estado global + persistência + modais)
├── HeaderNav  (header dinâmico: modo default (brand) ou detail)
├── main (container mobile-first, max-w-md / sm:max-w-xl)
│   ├── (se moodView aberto) EstadoDeEspiritoView
│   └── Views por activeTab:
│       ├── HomeView
│       ├── FaculdadeView ──► (se focusedCourse) CourseDetailView
│       ├── EstudosView
│       ├── BibliotecaView
│       └── PerfilView
├── BottomNav (barra inferior + FloatingActionMenu)
├── QuickAddModal   (formulário "novo registro")
└── GlobalSearchModal (busca global ⌘K)
```

- **Views** recebem tudo via **props** (drilling intenso de estado e callbacks).
- **Widgets** (`components/widgets/`) são blocos reutilizáveis dentro das views.
- **ui/** (`components/ui/`) são primitivas de baixo nível (button, bottom-nav-bar, FAB).

## 3. Estado e persistência

Todo o estado global vive em `App.tsx` usando o hook custom `usePersistentState`:

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
  stickers, sessions, currentMood).
- Alguns estados **não** usam persistência e vivem em `useState` local da view:
  - `savedBookIds`, `looseNotes` (BibliotecaView)
  - `systemSuggestions`, dados de dias da semana (HomeView — dummy)
  - `dotsData` do calendário de humor (MoodCalendarWidget — dummy)

> ⚠️ **Inconsistência conhecida:** `savedBookIds` e `looseNotes` deveriam ser persistidos
> como as demais entidades (ver `backlog.md`).

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

- `App.tsx` é monolítico (417 linhas) — candidato a extração (context/provider, reducers, hooks).
- Props drilling intenso em todas as views.
- Modais e patterns duplicados.
- Ver [`backlog.md`](./backlog.md) para o backlog completo.
