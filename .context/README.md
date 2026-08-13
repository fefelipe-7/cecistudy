# cecistudy ♡ — Contexto do Projeto

> **Cantinho Acadêmico de Psicologia** — aplicativo pessoal (PWA/mobile-first) para
> organizar a faculdade, estudar Psicologia e acompanhar a jornada da Ceci até se tornar psicóloga.
> Documentação de contexto do projeto, em pt-BR.

Este diretório centraliza o conhecimento do projeto para agentes de IA e desenvolvedores.
Ele é carregado pelo opencode via `instructions` em `opencode.json`.

## Índice

| Arquivo | O que cobre |
|---|---|
| [`README.md`](./README.md) | Este índice + visão geral em 1 página |
| [`architecture.md`](./architecture.md) | Stack, hierarquia de componentes, estado/persistência, navegação, backend |
| [`design-system.md`](./design-system.md) | Tokens (cores, fontes, radius, sombras), classes helper, padrões de UI |
| [`components.md`](./components.md) | Inventário por arquivo: propósito, props, dependências, status usado/morto |
| [`data-model.md`](./data-model.md) | Entidades de `types.ts`, relações, prefixos de id, chaves localStorage, seeds |
| [`copy-and-voice.md`](./copy-and-voice.md) | Voz/tom pt-BR, lowercase, branding `cecistudy ♡`, emojis |
| [`backlog.md`](./backlog.md) | Pontos de melhoria e débito técnico priorizados |

## Visão geral (resumo de 1 minuto)

- **Produto:** organizador acadêmico de Psicologia, extremamente pessoal e acolhedor
  ("cantinho", "carinho", "dica da ceci", emojis, tom afetuoso).
- **Público:** a própria usuária (Ceci) — uso individual, mobile-first.
- **Idioma da UI:** português do Brasil, com textos **minúsculos** e fofos.
- **Plataforma:** React SPA (PWA) estática, deploy via Vercel.

### Stack técnica
React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 (`@theme`) · framer-motion ·
lucide-react · class-variance-authority · clsx · tailwind-merge · @radix-ui/react-slot.

Sem router, sem biblioteca de state, sem testes. Persistência via `localStorage`.

### Estrutura de pastas
```
src/
  App.tsx                      → dono de todo o estado global + persistência
  types.ts                     → 21 entidades/interfaces
  index.css                    → design system (tokens Tailwind 4)
  data/
    initialData.ts             → seed das entidades
    libraryData.ts             → catálogo da biblioteca (livros/coleções)
  components/
    ui/                        → primitivas (button, bottom-nav-bar, floating-action-menu)
    HeaderNav.tsx              → header dinâmico (default/detail)
    BottomNav.tsx              → barra inferior + menu flutuante
    QuickAddModal.tsx          → formulário de novo registro (6 tipos)
    GlobalSearchModal.tsx      → busca global (⌘K)
    views/                     → Home, Faculdade, Estudos, Biblioteca, Perfil, EstadoDeEspirito
    widgets/                   → blocos reutilizáveis (stats, mood, reader…)
```

### Comandos
- `bun run dev` (porta 3000) · `bun run build` · `bun run preview`
- `bun run lint` = `tsc --noEmit` (typecheck)

Veja [`architecture.md`](./architecture.md) para os detalhes.
