# cecistudy ♡ — Contexto do Projeto

> **Cantinho Acadêmico de Psicologia** — aplicativo pessoal (web/PWA + nativo **Android/iOS**
> via Capacitor) para organizar a faculdade, estudar Psicologia e acompanhar a jornada da Ceci
> até se tornar psicóloga. Documentação de contexto do projeto, em pt-BR.

Este diretório centraliza o conhecimento do projeto para agentes de IA e desenvolvedores.
Ele é carregado pelo opencode via `instructions` em `opencode.json`.

## Índice

| Arquivo | O que cobre |
|---|---|
| [`README.md`](./README.md) | Este índice + visão geral em 1 página |
| [`architecture.md`](./architecture.md) | Stack, hierarquia de componentes, estado/persistência, navegação, backend, Capacitor |
| [`design-system.md`](./design-system.md) | Tokens (cores, fontes, radius, sombras), classes helper, padrões de UI |
| [`components.md`](./components.md) | Inventário por arquivo: propósito, props, dependências, status usado/morto |
| [`data-model.md`](./data-model.md) | Entidades de `types.ts`, relações, prefixos de id, chaves localStorage, seeds |
| [`copy-and-voice.md`](./copy-and-voice.md) | Voz/tom pt-BR, lowercase, branding `cecistudy ♡`, emojis |
| [`backlog.md`](./backlog.md) | Pontos de melhoria e débito técnico priorizados |
| [`animations.md`](./animations.md) | Plano de animações/transições iOS-like, diagnóstico e progresso |

## Visão geral (resumo de 1 minuto)

- **Produto:** organizador acadêmico de Psicologia, extremamente pessoal e acolhedor
  ("cantinho", "carinho", "dica da ceci", emojis, tom afetuoso).
- **Público:** a própria usuária (Ceci) — uso individual, mobile-first.
- **Idioma da UI:** português do Brasil, com textos **minúsculos** e fofos.
- **Plataforma:** React SPA (web/Vercel) **+ app nativo Android/iOS via Capacitor** (assets
  embutidos localmente = offline nativo de graça).

### Stack técnica
React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 (`@theme`) · framer-motion ·
lucide-react · class-variance-authority · clsx · tailwind-merge · @radix-ui/react-slot ·
**Capacitor 8** (+ status-bar, splash-screen, keyboard, haptics, local-notifications, preferences).

Sem router, sem biblioteca de state, sem testes. Persistência **dual**:
`localStorage` no web/PWA e `@capacitor/preferences` no nativo (camada em `src/lib/storage.ts`).

### Estrutura de pastas
```
src/
  App.tsx                      → wrapper fino (AppProvider → AppShell)
  types.ts                     → 21 entidades/interfaces
  index.css                    → design system (tokens Tailwind 4)
  context/AppContext.tsx       → dono de TODO o estado global + persistência + navegação + header
  lib/
    storage.ts                 → persistência dual (localStorage ↔ Preferences)
    usePersistentState.ts      → hook de estado persistente (async-aware no nativo)
    native.ts                  → bootstrap do shell nativo (status bar, teclado, splash)
    haptics.ts                 → vibrações (no-op no web)
    notifications.ts           → lembrete diário local (no-op no web)
    utils.ts                   → cn()
  data/
    initialData.ts             → seed das entidades
    libraryData.ts             → catálogo da biblioteca (livros/coleções)
    moodPresets.ts             → presets de humor
  components/
    ui/                        → primitivas (button, Card, Modal, PillTabBar, IconButton, ProgressBar, CourseIcon…)
    views/                     → Home, Faculdade, Estudos, Biblioteca, Perfil, EstadoDeEspirito, CourseDetail
    widgets/                   → blocos reutilizáveis (stats, mood, reader…)
    library/  courses/         → componentes extraídos da biblioteca e de disciplinas
android/                       → projeto nativo Android (Capacitor)
ios/                           → projeto nativo iOS (Capacitor)
assets/                        → arte-fonte (icon/splash SVGs) p/ `cap:assets`
.github/workflows/             → CI (APK debug + IPA unsigned)
```

### Comandos
- Web: `npm run dev` (porta 3000) · `npm run build` · `npm run preview`
- Lint/typecheck: `npm run lint` = `tsc --noEmit`
- Nativo: `npm run cap:sync` (build + sync) · `npm run cap:open:android` · `npm run cap:open:ios` · `npm run cap:assets` (regenera ícones/splash)
- CI: `.github/workflows/native-build.yml` (APK debug + IPA unsigned via GitHub Actions)

Veja [`architecture.md`](./architecture.md) para os detalhes.
