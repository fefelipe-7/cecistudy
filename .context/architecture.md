# Arquitetura

> Visão estrutural do cecistudy: stack, hierarquia de componentes, modelo de estado,
> navegação e planos de backend. (pt-BR)

## 1. Stack e ferramentas

| Camada | Escolha | Notas |
|---|---|---|
| Framework | React 19 | SPA, sem router |
| Linguagem | TypeScript 5.8 | `tsc --noEmit` como lint/typecheck |
| Build | Vite 6 | alias `@/` → `src/` |
| Estilos | Tailwind CSS 4 | tokens em `@theme` no `src/index.css` |
| Animações | framer-motion 13 + motion 12 | entrada/saída de views, modais, nav |
| Ícones | lucide-react | ícones nomeados (ex.: `Brain`, `FileText`) |
| Utils | class-variance-authority + clsx + tailwind-merge | via `cn()` em `src/lib/utils.ts` |
| Slot | @radix-ui/react-slot | usado no `Button` (`asChild`) |
| Persistência | **dual** — `localStorage` (web) ↔ `@capacitor/preferences` (nativo) | camada em `src/lib/storage.ts`; prefixo `cecistudy_` |
| Nativo | **Capacitor 8** | `@capacitor/{core,status-bar,splash-screen,keyboard,haptics,local-notifications,preferences}`; `android/` + `ios/` |

> Sem dependências mortas: `@google/genai`, `express`, `dotenv` e `@types/express` foram
> removidos (backend Gemini/AI Studio descartado). `package.json` usa `"name": "cecistudy"`.
> Builds nativos: `.github/workflows/native-build.yml` (APK debug + IPA unsigned).

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
hook custom `usePersistentState` (em `src/lib/usePersistentState.ts`), que por cima da camada
dual `src/lib/storage.ts`:

```ts
// storage.ts — adaptador dual
// web  → localStorage (síncrono; comportamento histórico preservado)
// nativo → @capacitor/preferences (assíncrono)
storage.get(key) / storage.set(key, value) / storage.remove(key)
storage.getSync(key) // apenas web (inicialização do hook)
```

- No **web** o hook continua síncrono (inicialização imediata, sem flash).
- No **nativo** a inicialização usa os seeds e depois hidrata de `@capacitor/preferences`
  (estado "carregando" implícito); a gravação só ocorre após a hidratação
  (evita sobrescrever dados salvos com seeds).

- Cada entidade tem seu próprio estado + setter (profile, courses, classes, tasks, exams,
  authors, concepts, approaches, readings, flashcards, materials, internshipLogs, tcc,
  stickers, sessions, currentMood, reminder), todos expostos via hook `useApp()`.
- Alguns estados **não** usam persistência e vivem em `useState` local da view:
  - `systemSuggestions`, dados de dias da semana (HomeView — dummy)
  - `dotsData` do calendário de humor (MoodCalendarWidget — dummy)

> ✅ `savedBookIds` e `looseNotes` (BibliotecaView) já são persistidos via `usePersistentState`.

## 3.1 Shell nativo (libs)

- `src/lib/native.ts` — bootstrap do shell (no-op no web): `StatusBar` (escuro, sem overlay),
  `Keyboard` (`resizeMode: native` p/ não cobrir inputs) e `SplashScreen.hide()` no 1º frame.
- `src/lib/haptics.ts` — `hapticTap()`/`hapticSuccess()`/`hapticWarning()` (no-op no web),
  usados em ações-chave (toggle de tarefa/prova, salvar mood, lembrete).
- `src/lib/notifications.ts` — lembrete diário via `@capacitor/local-notifications`
  (no-op no web). Estado `reminderSettings` (`{enabled, time}`) persistido no `AppContext`;
  UI em Perfil → personalização. Ícone pequeno Android: `ic_stat_cecistudy`.
- **Safe areas:** header e bottom-nav usam `env(safe-area-inset-*)` no padding (`viewport-fit=cover`).

## 4. Modelo de navegação (roteamento hash)

Navegação por estado em `src/context/AppContext.tsx`, sincronizada com um "pathname virtual"
no `location.hash` (sem router/dependência). Fase 5 do backlog.

Rotas: `#/home`, `#/faculdade`, `#/faculdade/:courseId`, `#/estudos`, `#/biblioteca`,
`#/perfil`, `#/mood`.

- `activeTab: NavTab` → `'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil'`
- Sub-tabs por tab (estado local das views): `SubTabFaculdade`, `SubTabEstudos`,
  `SubTabBiblioteca`, `SubTabPerfil` (não codificadas na URL).
- `AppContext` escuta `hashchange` (aplica a rota ao estado — deep-link + voltar/avançar).
- Ações de navegação (`handleNavigate`, `openCourseDetail`, `closeCourseDetail`,
  `openMoodView`, `closeMoodView`, `handleSaveMood`) sincronizam o `location.hash`.
- `handleNavigate(tab, subTab?, targetId?)` centraliza a troca de tab + rolagem ao topo.
- `targetId` → abre uma entidade específica (ex.: disciplina) vinda da busca global.
- `focusedCourseId` → renderiza `CourseDetailView` (drill-down de disciplina, rota
  `#/faculdade/:courseId`).

### Header dinâmico (`DynamicHeaderConfig`)
`AppContext` constrói um `headerConfig` conforme o contexto:
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

## 6. Capacitor (apps nativos Android/iOS)

O cecistudy é **dois produtos em uma base de código**:
- **Web/PWA** → build Vite puro, deploy Vercel (`npm run build`).
- **Nativo** → Capacitor 8 empacota o mesmo `dist/` em `android/` e `ios/`
  (assets embutidos = offline de graça; sem service worker).

### Configuração
- `capacitor.config.ts`: `appId: "ceci.study.app"`, `appName: "cecistudy"`, `webDir: "dist"`,
  `backgroundColor: #FFFCF8`; plugins `SplashScreen` (fundo da marca, auto-hide),
  `StatusBar` (DARK, sem overlay).
- `android/` e `ios/` são **commitados** (projetos gerados por `cap add`), exceto
  artefatos de build (`android/app/build/`, `ios/App/App/public/`, `*.jks`).

### Fluxo de trabalho
```
npm run build          → gera dist/ (web)
npx cap sync           → copia dist/ para android/ios + atualiza plugins
npm run cap:open:android / cap:open:ios → abre no Android Studio / Xcode
npm run cap:assets     → regenera ícones/splash a partir de assets/*.svg
```

### Assets nativos
- `assets/icon.svg` (1024), `assets/icon-foreground.svg` + `icon-background.svg`
  (adaptive icon Android), `assets/splash.svg` (2732), `assets/icon-notification.svg`
  → gerados por `@capacitor/assets` (`cap:assets`) + `public/icon.png`/`icon-192.png`.
- Notificação Android usa `ic_stat_cecistudy.png` (drawable).

### Builds (CI)
`.github/workflows/native-build.yml`:
- **Android:** ubuntu + JDK 21 + Android SDK → `assembleDebug` → artifact APK.
- **iOS:** macOS runner + Xcode → build unsigned p/ iphonesimulator (IPA assinado exige
  provisioning do usuário — ver `backlog.md`).

> **Limitação do ambiente:** esta máquina (Linux) **não compila** os apps (sem JDK/SDK/Xcode).
> Os builds nativos rodam no CI; para distribuir nas stores é preciso configurar
> keystore (Android) e signing/provisioning (iOS) — documentado em `backlog.md`.

## 7. Pontos de atenção arquitetural (resumo)

- `App.tsx` é wrapper fino (`AppProvider` → `AppShell`); estado centralizado em `AppContext`.
- Views principais consomem `useApp()`; modais/nav ainda têm 1 nível de props (do `AppShell`).
- Persistência dual: web síncrona (sem flash) · nativo assíncrona (hidratação pós-seed).
- Modais e patterns duplicados (em melhoria contínua).
- Ver [`backlog.md`](./backlog.md) para o backlog completo.
