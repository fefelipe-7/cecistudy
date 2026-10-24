# TODO: saúde do repositório — branches, CI/CD, release automático e higiene

> Criado 2026-10-23 · Spec: [`../docs/specs/SPEC-026-saude-do-repositorio-branches-ci-cd-e-readme.md`](../docs/specs/SPEC-026-saude-do-repositorio-branches-ci-cd-e-readme.md)
> Escopo: só este repositório. Nenhuma mudança em `packages/*`, schema, dado da
> usuária ou no desktop.
> Status: **proposta** — nada executado. Nenhuma task marcada.

## Decisões fechadas (não reabrir sem a dona)

| # | Decisão |
|---|---|
| 1 | Fluxo `dev → staging → main`, promoção por PR (squash em `dev`, merge commit nas promoções) |
| 2 | `staging` **não publica nada no aparelho**: sem APK, sem OTA, sem tag. É camada de teste |
| 3 | Testes diferentes por camada: `dev` = domínio; `staging`/`main` = UI + integração + build + conteúdo; tag = nativo + distribuição |
| 4 | Release 100% automático: release-please faz bump, `CHANGELOG.md`, tag e Release |
| 5 | OTA fica **um canal só**, na raiz, como hoje — publicado apenas em release de tag |
| 6 | Licença: **PolyForm Noncommercial 1.0.0** |
| 7 | Higiene: remover zips, parar de versionar o catálogo gerado, adotar Biome (lint + format) |
| 8 | GitHub acessível desta máquina (`gh` autenticado): verificação e settings via `gh api` quando possível |

---

## Fase 0 — Base limpa e medições

Sem isso, nada pode ser branch, PR ou medido.

- [ ] **T0.1** commitar os 98 arquivos pendentes (51 M, 17 D, 30 novos) na `main`
      — inclui o trabalho de calendário/backup/TCC e a migração de testes
      (`tasks/todo-test-reduction.md`). **Não** separar agora: a árvore já está mista.
      ```bash
      git add -A
      git commit -m "feat(app): o trabalho de 22–23/10 entra no repositório (calendário, backup, TCC, testes)"
      ```
- [ ] **T0.2** `nvm use 22 && npm ci` — `node_modules` não existe; o lock está modificado
- [ ] **T0.3** medir e registrar (§Medições): `time npm run verify`, `time npm run content:check`,
      `time npm run db:verify`, `time npm run test:domain`, `npm audit --audit-level=high`
- [ ] **T0.4** `npm run test:domain` e `npm run test:ui` verdes
      (pendência **T2.11** do `todo-test-reduction.md`)
- [ ] **T0.5** `npm run verify` verde local, uma vez, com número de duração anotado

**Gate da fase:** árvore limpa (`git status --short` vazio), `npm ci` e `npm run verify` verdes.

---

## Fase 1 — Governança, licença e README

- [ ] **T1.1** `LICENSE` com o texto **verbatim** da PolyForm Noncommercial 1.0.0
      ```bash
      curl -fsSL https://raw.githubusercontent.com/polyformproject/polyform-licenses/1.0.0/PolyForm-Noncommercial-1.0.0.md -o LICENSE
      ```
      Adicionar no topo do README: `Licença: PolyForm Noncommercial 1.0.0` (não é
      OSI; uso comercial proibido). O **conteúdo curado** (`content/`, `library/`)
      pode ter direitos de terceiros — registrar como pendência aberta, não
      declarar coberto pela PolyForm.
- [ ] **T1.2** `README.md` — o que é (2–3 frases), funcionalidades, stack real,
      começar (`nvm use && npm ci && npm run dev`), tabela de scripts de
      `package.json`, estrutura real (`src/`, `packages/`, `apps/mobile`,
      `content/`, `contracts/`, `docs/`), fluxo de branches, releases/OTA, licença.
      Sem badge de licença do shields (ele não conhece PolyForm).
- [ ] **T1.3** `CONTRIBUTING.md` — fluxo de 3 branches, Conventional Commits,
      comandos de gate por camada, `[D]/[P]/[A]`, onde escrever cada tipo de doc
- [ ] **T1.4** `SECURITY.md` — canal de contato e o que não abrir em issue pública
- [ ] **T1.5** `CODEOWNERS` — `* @fefelipe-7`
- [ ] **T1.6** `.github/PULL_REQUEST_TEMPLATE.md` — tipo · spec · gate rodado ·
      print se UI · **risco de OTA** · seção de QA (só quando a base é `staging` ou `main`)
- [ ] **T1.7** `.github/ISSUE_TEMPLATE/{bug.yml,feature.yml,config.yml}`
- [ ] **T1.8** `.github/dependabot.yml` — `npm` + `github-actions`, semanal, agrupado
- [ ] **T1.9** `.gitignore:24` — trocar `.github/workflows/ota.yml` por `release.yml`
- [ ] **T1.10** `ota/README.md` — corrigir o diagrama: hoje é push em `main`; passa
      a ser release por tag. Documentar que o canal é único (raiz).

**Gate da fase:** `npm run verify` verde (só doc); PR mergeado na `main`.

---

## Fase 2 — CI por camada

- [ ] **T2.1** `package.json`: script `verify:domain` (gate da camada `dev`)
      ```json
      "verify:domain": "npm run typecheck && npm run test:domain && npm run check:boundaries && npm run test:voz && npm run verify:contract"
      ```
- [ ] **T2.2** reescrever `.github/workflows/ci.yml`:

```yaml
name: ci

on:
  pull_request: { branches: [dev, staging, main] }
  push:         { branches: [dev, staging, main] }

permissions: { contents: read }
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  pr-title:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions: { pull-requests: read }
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        with:
          # `merge` existe porque as promoções dev→staging→main usam esse título.
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
            merge
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # camada 1: domínio — rápido, é o gate de toda feature
  gate-domain:
    # `env` não existe em `if:` de job; por isso a expressão usa só `github`.
    if: github.base_ref == 'dev' || (github.event_name == 'push' && github.ref_name == 'dev')
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run verify:domain

  # camada 2: UI, integração, build e conteúdo — porta de entrada de staging/main
  gate-full:
    if: github.base_ref != 'dev' && !(github.event_name == 'push' && github.ref_name == 'dev')
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run verify
      - run: npm run db:verify
      - run: npm run content:check
      # informativo até a T5.5; depois remover o continue-on-error
      - run: npm audit --omit=dev --audit-level=high
        continue-on-error: true

  # compila nativo só quando o nativo muda (não há JDK/SDK nesta máquina)
  android-debug:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - id: f
        uses: dorny/paths-filter@v3
        with:
          filters: |
            android:
              - 'android/**'
              - 'capacitor.config.ts'
              - 'package.json'
              - 'package-lock.json'
      - if: steps.f.outputs.android == 'true'
        uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - if: steps.f.outputs.android == 'true'
        uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21', cache: gradle }
      - if: steps.f.outputs.android == 'true'
        run: npm ci
      - if: steps.f.outputs.android == 'true'
        run: npm run build
      - if: steps.f.outputs.android == 'true'
        run: npx cap sync android
      - if: steps.f.outputs.android == 'true'
        run: cd android && chmod +x gradlew && ./gradlew assembleDebug --no-daemon

  ci-ok:
    if: always()
    needs: [pr-title, gate-domain, gate-full, android-debug]
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo '${{ toJSON(needs) }}'
          if echo '${{ toJSON(needs.*.result) }}' | grep -Eq '"(failure|cancelled)"'; then
            echo "::error::algum check falhou"
            exit 1
          fi
```

- [ ] **T2.3** `.github/workflows/branch-policy.yml`:

```yaml
name: branch-policy

on:
  pull_request:
    branches: [staging, main]

permissions: {}

jobs:
  branch-policy:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: valida a origem da promoção
        env:
          BASE: ${{ github.base_ref }}
          HEAD: ${{ github.head_ref }}
        run: |
          set -euo pipefail
          case "$BASE" in
            staging) esperado='dev' ;;
            main)    esperado='staging' ;;
            *) echo "::error::base inesperada: $BASE"; exit 1 ;;
          esac
          # release-please--* é o PR automático de versão; a origem é dele.
          if [ "$HEAD" = "$esperado" ] || [[ "$HEAD" == hotfix/* ]] || [[ "$HEAD" == release-please--* ]]; then
            echo "ok: $HEAD → $BASE"
          else
            echo "::error::PR para $BASE só pode vir de $esperado, hotfix/* ou release-please--*"
            exit 1
          fi
```

- [ ] **T2.4** primeiro PR real (o da fase 1) verde no GitHub, com os jobs
      `gate-domain`/`gate-full`, `pr-title` e `ci-ok` observados no navegador
- [ ] **T2.5** registrar a duração do CI. Se o `gate-full` passar de ~15 min,
      abrir spec de shard **com o número medido** (não por palpite)

**Gate da fase:** `ci-ok` verde e visível como check no PR.

---

## Fase 3 — Branches, rulesets e settings

Depende da fase 2: um ruleset que exige `ci-ok` antes do check existir trava tudo.

- [ ] **T3.1** criar as branches
      ```bash
      git switch main && git pull
      git push origin HEAD:dev
      git push origin HEAD:staging
      ```
- [ ] **T3.2** settings do repo (verificável por `gh api`):
      ```bash
      gh api -X PATCH repos/fefelipe-7/cecistudy \
        -f default_branch=dev \
        -F delete_branch_on_merge=true \
        -F allow_auto_merge=true \
        -F allow_update_branch=true
      ```
- [ ] **T3.3** rulesets (Settings → Rules → Rulesets) — um por alvo, tabela da
      SPEC-026 §4. Aprovações = 0 (conta solo). Checks: `dev` → `ci-ok`;
      `staging`/`main` → `ci-ok` + `branch-policy`. Merge: squash só em `dev`,
      merge commit só em `staging`/`main`. Force push e deleção bloqueados.
      Tags `v*`: bloquear update e deleção.
- [ ] **T3.4** Code security: secret scanning + push protection + CodeQL (default setup)
- [ ] **T3.5** ensaio: PR `feat/teste → dev` mergeia; PR `feat/teste → main`
      reprova em `branch-policy`; `git push origin main` é recusado
- [ ] **T3.6** apagar as branches do ensaio

**Gate da fase:** push direto recusado nos três branches; PR com origem errada reprovado.

---

## Fase 4 — Release automático

- [ ] **T4.1** baseline de versão: `package.json` `"version": "1.0.95"` (última tag)
- [ ] **T4.2** `.release-please-manifest.json` → `{ ".": "1.0.95" }`
- [ ] **T4.3** `.release-please-config.json`:
```json
{
  "packages": {
    ".": { "release-type": "node", "changelog-path": "CHANGELOG.md" }
  }
}
```
- [ ] **T4.4** `.github/workflows/release-please.yml` — roda em push na `main`,
      `permissions: { contents: write, pull-requests: write }`, action
      `googleapis/release-please-action@v4` com
      `token: ${{ secrets.RELEASE_PLEASE_TOKEN }}` e **`target-branch: main`**.
      O `target-branch` não é opcional: a branch padrão passa a ser `dev`, e sem
      ele o bot abriria o PR de release contra `dev` e taguearia a branch errada.
- [ ] **T4.5** criar o secret `RELEASE_PLEASE_TOKEN` (fine-grained PAT:
      `contents: write` + `pull-requests: write`) e ligar em
      Settings → Actions → General → *Allow GitHub Actions to create and approve pull requests*.
      **Por quê:** tag/Release criados com o `GITHUB_TOKEN` padrão **não disparam**
      outro workflow — sem PAT, o build nunca roda.
- [ ] **T4.6** reescrever `.github/workflows/release.yml` para disparar em
      `release: types: [published]` (e `workflow_dispatch` com input de tag, para
      recuperação). Manter o arquivo atual como `release.legacy.yml`
      (`workflow_dispatch` apenas) até o novo passar uma vez.
- [ ] **T4.7** no `release.yml`: permissões por job (build `contents: read`; upload
      `contents: write`; Pages `pages: write` + `id-token: write`), segredos por
      `env:` (hoje são interpolados dentro do `run` em `release.yml:248-252`),
      `concurrency: group: release, cancel-in-progress: false`, `timeout-minutes`,
      e remover o `|| true` do upload (`release.yml:386-389`)
- [ ] **T4.8** versão nativa: `APP_VERSION_NAME` = versão da tag (já funciona) e
      **iOS** passa a receber `MARKETING_VERSION` + `CURRENT_PROJECT_VERSION` nos
      dois `xcodebuild` (hoje o projeto está fixo em `1.0` —
      `ios/App/App.xcodeproj/project.pbxproj:310`)
- [ ] **T4.9** publicar o Release com os 3 artefatos e o OTA na raiz (sem mudar
      `ota-manifest.mjs`, sem canais, sem espelho)
- [ ] **T4.10** primeiro release real observado: tag criada pelo bot, `CHANGELOG.md`
      gerado, Release com APK+IPA+zip, OTA atualizado, celular recebendo o bundle
- [ ] **T4.11** só então apagar `release.legacy.yml`

**Gate da fase:** merge do PR de release em `main` produz tag + Release + OTA sem
nenhum comando manual de build.

---

## Fase 5 — Higiene

Cada item é um PR próprio. Ordem: 5.1 → 5.5.

- [ ] **T5.1** `npm audit fix` (vite, zod) e re-medir o audit
- [ ] **T5.2** remover os 4 zips duplicados:
      `content/catalogo.zip`, `content/cecistudy_autores.zip`,
      `library/cecistudy_base_psicoterapias.zip`,
      `library/books/cecistudy_colecao_complementar_100_livros_150_artigos.zip`
      — antes, provar que nada lê: `grep -rn "catalogo.zip\|cecistudy_autores.zip" --include="*.mjs" --include="*.md" .`
- [ ] **T5.3** parar de versionar o catálogo gerado:
      `public/assets/databases/cecistudy_catalog.db`, `…/version.json`,
      `content/last-build.json` (todos gerados por `content/build-catalog.mjs`)
      ```bash
      git rm --cached public/assets/databases/cecistudy_catalog.db \
                      public/assets/databases/version.json \
                      content/last-build.json
      ```
      - [ ] **T5.3.1** `.gitignore` com os três caminhos
      - [ ] **T5.3.2** `scripts/ensure-catalog.mjs`: gera o catálogo só quando falta
            ou quando algum arquivo de `content/**` é mais novo que o `.db`
            (`shortcut: comparação por mtime, reavaliar se content:build ficar caro`)
      - [ ] **T5.3.3** `package.json`: `"content:ensure": "node scripts/ensure-catalog.mjs"`
            e `"predev"`, `"prebuild"`, `"preverify"` chamando `content:ensure`
      - [ ] **T5.3.4** `npx cap sync`/`build` continuam funcionando com o `.db` recém-gerado
      - [ ] **T5.3.5** README/CONTRIBUTING: clone novo roda `npm ci` e o primeiro
            `npm run dev`/`verify` gera o catálogo
      - [ ] **T5.3.6** `npm run db:verify` verde depois de gerar
- [ ] **T5.4** Biome 2.6 (`@biomejs/biome`) — **um** PR só de formatação:
      - [ ] **T5.4.1** `npm i -D @biomejs/biome@^2`
      - [ ] **T5.4.2** `biome.json` ignorando `dist`, `content`, `public`, `library`,
            `android`, `ios`, `artifacts`, `apps/desktop-flutter`, `apps/rn-expo`,
            `docs`, `**/*.md`, `package-lock.json`
      - [ ] **T5.4.3** scripts: `"lint": "biome check"`, `"lint:fix": "biome check --write"`,
            `"format": "biome format --write ."`; `verify:fast` passa a rodar
            `typecheck` + `lint` (hoje `lint` é `tsc`)
      - [ ] **T5.4.4** `npx biome check --write .` e correção do que sobrar; regra
            barulhenta entra como `warn` **com comentário no config** (JSONC aceita)
      - [ ] **T5.4.5** `AGENTS.md` do app e o da raiz: `lint` deixa de ser `tsc`
      - [ ] **T5.4.6** `npm run verify` verde depois da formatação
- [ ] **T5.5** voltar o passo `npm audit` do CI para obrigatório (remover `continue-on-error`)

**Rollback:** cada item é um commit isolado; os zips e o `.db` continuam no
histórico, então `git checkout <sha> -- <arquivo>` recupera.

---

## Fase 6 — Fechamento

- [ ] **T6.1** `AGENTS.md` do app: comandos (`verify:domain`, `lint`, `format`,
      `content:ensure`), fluxo de branches, release por tag, "CI espera `main`"
      deixa de existir
- [ ] **T6.2** badges do README funcionando (CI, release, node) após o primeiro run verde
- [ ] **T6.3** mover `spec-tcc.md` e `spec-performance.md` para `docs/archive/`;
      `especificacao-workspace-*.md` para `docs/specs/`
- [ ] **T6.4** registrar no `docs/specs/SPEC-026` o que foi entregue e o que ficou
      de fora (débitos novos com número)
- [ ] **T6.5** rodar o checklist de aceite da SPEC-026 §7, item por item

---

## Medições (preencher ao executar)

| O que | Comando | Antes | Depois |
|---|---|---|---|
| Gate completo | `time npm run verify` | — | — |
| Gate `dev` | `time npm run verify:domain` | — | — |
| `test:domain` | `time npm run test:domain` | — | — |
| `content:check` | `time npm run content:check` | — | — |
| `db:verify` | `time npm run db:verify` | — | — |
| `content:build` | `time npm run content:build` | — | — |
| CI (PR) | `gh run view <id> --json jobs` | nunca rodou | — |
| Vulnerabilidades | `npm audit --audit-level=high` | 2 altas (vite, zod) | — |
| Tamanho do repo | `du -sh .git` · `du -sh content public/assets/databases` | — | — |
| Arquivos sem commit | `git status --short \| wc -l` | 98 | 0 |

---

## Riscos

| Risco | Mitigação |
|---|---|
| CI nunca rodou; pode chegar vermelho de primeira | T2.4 termina com execução observada, não com "deve passar" |
| `gate-full` lento trava promoção | T2.5 mede; shard só com número |
| release-please sem PAT não dispara build | T4.5 é pré-requisito de T4.10 |
| Biome reformata ~2.900 arquivos | PR único (T5.4), depois do trabalho pendente commitado; nada de branch aberta nesse momento |
| `.db` fora do git quebra clone novo | T5.3.2 + T5.3.5: `content:ensure` nos `pre*` e aviso no README |
| Perder o trabalho de 22–23/10 | T0.1 antes de qualquer branch |
| Reverter D2 (staging sem publicar) exige APK nova | hoje não há aparelho apontando para canal nenhum; é o momento seguro |
