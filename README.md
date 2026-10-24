<div align="center">
  <img src="public/icon-192.png" width="96" alt="cecistudy" />

  # cecistudy ♡

  **Cantinho acadêmico de Psicologia — organize a faculdade, estude e acompanhe a jornada até virar psicóloga.**

  [![CI](https://github.com/fefelipe-7/cecistudy/actions/workflows/ci.yml/badge.svg)](https://github.com/fefelipe-7/cecistudy/actions/workflows/ci.yml)
  [![Release](https://img.shields.io/github/v/release/fefelipe-7/cecistudy)](https://github.com/fefelipe-7/cecistudy/releases)
  ![Node](https://img.shields.io/badge/node-22-339933)
  ![Licença](https://img.shields.io/badge/licen%C3%A7a-PolyForm%20Noncommercial%201.0.0-lightgrey)

  [Releases](https://github.com/fefelipe-7/cecistudy/releases) · [OTA](ota/README.md) · [Docs](docs/) · [Contribuir](CONTRIBUTING.md)
</div>

## O que é

Aplicativo pessoal, mobile-first e em pt-BR, para organizar a graduação em
Psicologia: disciplinas e aulas, provas, flashcards com revisão espaçada,
biblioteca, diário de estágio, supervisão e TCC — tudo em um só lugar, sem
login e sem servidor.

## Funcionalidades

- **Faculdade** — disciplinas, aulas, provas, período letivo e virada de semestre
- **Estudo** — flashcards (revisão estilo Anki), quiz, foco, biblioteca e notas
- **Estágio e TCC** — diário de estágio, supervisão/intervisão, gestão do TCC
- **Calendário** — agenda de 14 dias e visão de mês, alimentada por um único agregador
- **Perfil e jornada** — narrativa da trajetória, temas, backup e sincronização

## Stack

| Camada | Tecnologia |
|---|---|
| UI | React 19, TypeScript, Vite 6, Tailwind 4, framer-motion |
| Nativo | Capacitor 8 (Android/iOS), OTA via `@capgo/capacitor-updater` |
| Persistência | `localStorage` (web) · SQLite (`cecistudy_user`) · Preferences |
| Catálogo | SQLite somente-leitura (`cecistudy_catalog`), gerado a partir de `content/` |
| Testes | Vitest (jsdom) |
| CI/CD | GitHub Actions, GitHub Pages (OTA) |

## Começando

```bash
nvm use            # Node 22 (.nvmrc)
npm ci
npm run dev        # http://localhost:3000
```

O catálogo (`public/assets/databases/cecistudy_catalog.db`) **não é versionado**:
ele é gerado a partir de `content/` no primeiro `npm run dev` (ou `npm run build`,
`npm run verify`) por `scripts/ensure-catalog.mjs`.

| Script | Para quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento (porta 3000) |
| `npm run typecheck` | checagem de tipos (`tsc --noEmit`) |
| `npm run lint` | Biome (lint + formato) |
| `npm run format` | formata o código com Biome |
| `npm run test` | todos os testes (Vitest) |
| `npm run test:domain` | testes de domínio — ciclo de edição |
| `npm run verify:domain` | gate de `dev`: tipos + domínio + fronteiras + voz + contrato |
| `npm run verify` | gate completo: `verify:fast` + build web + build mobile + bundle report |
| `npm run build` | build de produção em `dist/` |
| `npm run content:build` / `content:check` / `db:verify` | pipeline do catálogo |
| `npm run cap:sync` | sincroniza o Capacitor |
| `node .github/scripts/check-boundaries.mjs` | gate de fronteiras entre `packages/*` e a plataforma |

Regras de teste (classes, corte, anti-flaky): [`docs/estandares-testes.md`](docs/estandares-testes.md).

## Estrutura

```
src/             app web/mobile (shells, views, componentes, lib nativa)
packages/        domínio compartilhado: domain · application · data · sync
                 contracts · navigation · design-tokens
apps/mobile/     cliente Capacitor independente
contracts/       contrato de dados (schema.sql, canonical-json, goldens)
content/         catálogo, editorial e fontes curadas
public/          estáticos do bundle (ícones, manifest)
android/ ios/    projetos nativos (versionados)
docs/            specs, arquitetura, padrões e planos
tasks/           planos e to-dos de implementação
.github/         CI/CD e scripts de gate
```

Regra de ouro: `packages/*` **nunca** importa `react`, `@capacitor/*` ou
`__TAURI__` — garantido por `.github/scripts/check-boundaries.mjs`.

## Fluxo de trabalho

```
feat/*  fix/*  chore/*  docs/*  refactor/*  test/*
   │ PR (squash) → ci-ok
   ▼
  dev ────────────── gate de domínio
   │ PR de promoção (merge commit)
   ▼
 staging ─────────── gate completo (UI, integração, build, conteúdo)
   │ PR de promoção (merge commit)
   ▼
 main ────────────── tag vX.Y.Z → Release (APK + IPA) + OTA
```

- `dev` é a branch padrão. PR de feature abre contra ela.
- `staging` não publica nada: é a camada de teste mais pesada.
- `main` só recebe promoção de `staging` (ou `hotfix/*`). Publicar é ato
  explícito: mergear o PR de release do bot cria a tag.
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/).
  Detalhes em [CONTRIBUTING.md](CONTRIBUTING.md).

## Releases e atualizações

Cada tag `vX.Y.Z` publica um GitHub Release com APK, IPA e o zip do bundle web,
e atualiza o OTA que o app nativo consome na próxima abertura. O cliente valida
o SHA-256 e faz rollback automático se o bundle novo travar no boot.

Versão, `CHANGELOG.md` e tag são gerados pelo release-please. Ver
[`ota/README.md`](ota/README.md).

## Documentação

- [`docs/specs/`](docs/specs/) — decisões de produto e de engenharia (`SPEC-0NN`)
- [`docs/estandares-testes.md`](docs/estandares-testes.md) — classes de teste e regra de corte
- [`docs/arquitetura/`](docs/arquitetura/) — como o app se organiza
- [`AGENTS.md`](AGENTS.md) — convenções para sessões de agente neste repositório
- [`CHANGELOG.md`](CHANGELOG.md) — histórico de versões

## Licença

Código sob **PolyForm Noncommercial License 1.0.0** — uso permitido para fins
não comerciais; uso comercial não é licenciado. Ver [`LICENSE`](LICENSE).

O **conteúdo curado** em `content/` e `library/` reúne material de terceiros e
não é licenciado pela PolyForm; os direitos permanecem com seus autores.
