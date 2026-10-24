# Como contribuir

Este repositório é pessoal e mantido por uma pessoa, mas as regras abaixo valem
para qualquer sessão (humana ou agente) que abra um PR.

## Fluxo de branches

```
feat/*  fix/*  chore/*  docs/*  refactor/*  test/*
   │  PR (squash)
   ▼
  dev ────────────── integração; gate de domínio
   │  PR de promoção (merge commit)
   ▼
 staging ─────────── gate completo (UI, integração, build, conteúdo)
   │  PR de promoção (merge commit)
   ▼
 main ────────────── tag vX.Y.Z → Release + OTA

hotfix/*  sai de main → PR em main → release patch → PR main → dev
```

- **`dev` é a branch padrão.** PR de feature abre contra ela.
- **`staging` não publica nada.** É a camada onde o gate completo roda.
- **`main` só recebe promoção** de `staging` (ou `hotfix/*`). Um workflow
  (`branch-policy`) recusa qualquer outra origem.
- **Merge:** squash em `dev`; merge commit nas promoções.
- **Publicar** é ato explícito: mergear o PR de release gerado pelo bot cria a
  tag, e a tag dispara o build. Push em `main` não publica.

### Nomes

- Branch: `<tipo>/<slug-curto>` — `feat/calendario-14-dias`, `fix/ota-checksum`.
- Título do PR = mensagem Conventional (o squash usa o título). O CI valida.
- Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`, `merge` (este último só em promoção).
- Referencie a spec quando existir: `feat(tcc): SPEC-024 — …`.

## Gate

| Onde | Comando | Prova |
|---|---|---|
| PR para `dev` | `npm run verify:domain` | tipos, domínio, fronteiras, voz, contrato de dados |
| PR para `staging`/`main` | `npm run verify` + `npm run db:verify` + `npm run content:check` | UI, integração, build web/mobile, catálogo |
| Antes de tocar `packages/*` | `node .github/scripts/check-boundaries.mjs` | `packages/*` não importa plataforma |

O job agregador `ci-ok` é o único check obrigatório. Localmente, use
`npm run test:domain` no ciclo de edição (é o rápido) e o gate completo antes de
promover.

## Onde escrever o quê

| Assunto | Caminho |
|---|---|
| decisão de produto/engenharia do app | `docs/specs/SPEC-0NN-…` |
| plano e checklist de implementação | `tasks/todo-…` / `tasks/plan-…` |
| padrão de teste | `docs/estandares-testes.md` |
| contrato de dados | `contracts/` |
| regra de agente neste repo | `AGENTS.md` |

Regras de escrita: pt-BR, slug sem acento no nome do arquivo, `caminho:linha`
quando o texto descreve código. Use as ferramentas `edit`/`write` para editar —
`Set-Content`/`>` corrompem acento (U+FFFD é perda irreversível).

## Marca `[D]` / `[P]` / `[A]`

Toda regra nova leva a marca:

- `[D]` decidido com a dona do produto — trate como regra.
- `[P]` proposta, ainda não confirmada.
- `[A]` em aberto: precisa de decisão antes de implementar. **Agente não fecha.**

## Commits

Conventional Commits, em pt-BR, tom direto. Um commit = uma mudança coerente.
Não commite `node_modules`, `dist/` nem o catálogo gerado
(`public/assets/databases/*`, `content/last-build.json`) — todos ignorados.

## Licença

Ao contribuir você concorda que a contribuição entra sob a
[PolyForm Noncommercial 1.0.0](LICENSE). O conteúdo curado em `content/` e
`library/` tem direitos de terceiros e não é licenciado por ela.
