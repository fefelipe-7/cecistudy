# SPEC-026 · Saúde do repositório: branches, CI/CD e README

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **em andamento** (2026-10-23) — ver §11 para o estado da execução
> App afetado: mobile — **só este repositório** (`cecistudy/`). O desktop é outro
> app e não é tocado (`ADR-002`, `ADR-009`).
> Origem: `SPEC-C-004` (verificação e gate) + `spec-referencial-workspace-academico.md`
> §1.4 — a regra existe no código, e é o gate que a protege
> Decisões: D1..D12
> Supersede: — (o documento de origem se chamava `SPEC-014`, número **já usado**
> aqui por [`SPEC-014-faculdade-cantinho-academico.md`](SPEC-014-faculdade-cantinho-academico.md);
> esta spec é a importação dele, corrigida contra o disco na §0)
> Depende de: —
> Espelha: — (engenharia de um app só; não há espelho `SPEC-M-`)
> Data: 2026-10-23
> Plano de execução: [`../../tasks/todo-saude-do-repositorio.md`](../../tasks/todo-saude-do-repositorio.md)

> Documento de origem: `SPEC-014-repo-ci-cd-branches-readme.md` (análise de um
> clone de `main` em 2026-10-14, 93 commits, 37 tags, 1 autora). Importado em
> 2026-10-23 e decidido com a dona no mesmo dia. O diagnóstico foi conferido
> linha a linha contra o disco: o que mudou está na §1.3, o que continua valendo
> está na §1.2, e o que foi decidido depois está na §2.

---

## 1. Contexto

### 1.1 O problema

- **Situação.** O repositório tem **uma** branch (`main`) e **um** pipeline. Todo
  push em `main` vira release público **e** atualização OTA
  (`.github/workflows/release.yml:32-35`). Não há etapa entre "commit" e "o
  celular da usuária".
- **O que acontece hoje.** Um commit ruim chega ao aparelho pelo OTA
  (`src/lib/ota.ts`), sem etapa de teste intermediária. Um segundo push cancela o
  primeiro **no meio** (`release.yml:43-45`) e pode deixar Release criado sem
  Pages publicado. O repositório é público e **não tem README, LICENSE,
  CONTRIBUTING, SECURITY nem templates** — quem chega não sabe o que é o projeto,
  e juridicamente "sem licença" significa todos os direitos reservados.
- **Como se sabe que é problema.** 38 tags `v1.0.x`, 98 commits, uma branch local
  e uma remota (`git branch -a`), nenhum arquivo de governança na raiz, `npm
  audit` com **2 vulnerabilidades altas** (vite, zod) e 98 arquivos modificados
  sem commit na árvore de trabalho.

### 1.2 O que continua valendo do diagnóstico de 2026-10-14

| # | Severidade | Achado | Onde (conferido em 2026-10-23) |
|---|---|---|---|
| P1 | Alta | todo push em `main` vira release + OTA | `release.yml:32-35` |
| P2 | Alta | `concurrency` cancela o release em andamento | `release.yml:43-45` |
| P4 | Alta | só existe `main`; sem proteção, sem PR obrigatório | `git branch -a` |
| P5 | Média | `permissions` de escrita no workflow inteiro, inclusive nos builds | `release.yml:47-50` |
| P6 | Média | `gh release upload … \|\| true` engole falha | `release.yml:386-389` |
| P7 | Média | versão = `1.0.<nº de commits>`; `package.json` em `0.0.0`; sem SemVer nem changelog | `release.yml:94-104`, `package.json:4` |
| P8 | Média | sem README/LICENSE/CONTRIBUTING/SECURITY/CODEOWNERS/Dependabot/templates | raiz, `.github/` |
| P9 | Média | binários e derivados versionados (4 zips ≈ 9,5 MB; `.db` 20 MB; `seed.sql` 11,6 MB; `legacy/*` 15 MB) | `content/`, `public/`, `library/` |
| P10 | Média | `npm audit`: 2 altas (vite, zod) | `npm audit` |
| P12 | Baixa | `lint` é `tsc --noEmit`; sem formatador nem hook local | `package.json:20` |
| P13 | Baixa | `vite` está em `dependencies` **e** em `devDependencies` | `package.json:84,108` |
| P14 | Baixa | raiz poluída: `spec-tcc.md` (84 KB), `spec-performance.md` (42 KB), `especificacao-workspace-*.md` | raiz |
| P15 | Baixa | `.gitignore` cita `.github/workflows/ota.yml` (não existe); `ota/README.md` descreve tag e o pipeline roda em todo push | `.gitignore:24`, `ota/README.md` |

### 1.3 O que já foi resolvido ou não se aplica (não reabrir)

| Do documento de origem | Estado em 2026-10-23 |
|---|---|
| **P3** — o CI não roda `npm run build` | **Fechado.** `ci.yml:34` roda `npm run verify`, que é `verify:fast` + `build:web` + `build:mobile` (`package.json:37`) |
| **P11** — `.agents/` (11 MB) versionado | **Fechado.** Não está no git (`git ls-files` = 0); as skills moram no hub |
| **P16** — `cecistudy-rust/` no repositório | **Fechado.** Removido pela `ADR-008`; o contrato do app mora em `contracts/` |
| **P17** — `content:check`/`db:verify` fora do CI | **Aberto, e pior:** não estão em nenhum script de gate (`package.json:36-37`) |
| **§2.6 / §3.5** — preview Vercel por branch | **Não se aplica.** Não existe integração Vercel neste repositório; o único destino publicado é o GitHub Pages do OTA |
| **§2.6** "checklist de QA em `docs/manual-tests.md`" | **Falso.** É um relatório de auditoria de 19/08/2026, não um checklist reexecutável |
| **§3.4 / §3.2** — OTA por canal (`stable`/`staging`), `gh-pages`, `applicationId` de staging | **Rejeitado pela dona.** `staging` não publica nada no aparelho (§2, D2). Um canal só, na raiz |

## 2. Decisões

### D1 · O fluxo é `dev → staging → main`, com promoção por PR

- **Decisão.** `feat/* fix/* chore/* docs/* refactor/* test/*` → PR **squash** em
  `dev`; `dev` → `staging` e `staging` → `main` por PR **merge commit**;
  `hotfix/*` sai de `main`, entra em `main` e volta para `dev`.
- **Justificativa.** É a única forma de ter um ponto entre "commit" e "celular".
  Merge commit na promoção preserva os commits Conventional já squashados e
  mantém as três branches com ancestral comum, o que dá changelog correto.
- **Alternativa rejeitada.** `dev → main` direto. Rejeitada porque a dona quer
  duas camadas distintas de teste (§2 D2), e uma camada só não as comporta.
- **Consequência aceita.** Todo release custa dois PRs de promoção. Correção
  urgente exige `hotfix` e back-merge, senão `dev` diverge.

### D2 · `staging` é camada de teste, **não** um ambiente publicável

- **Decisão.** `staging` **não** gera APK, **não** publica OTA, **não** cria tag e
  **não** publica em nenhum destino. Seu papel é rodar o gate mais pesado antes
  de a mudança chegar perto de produção.
- **Justificativa.** A dona foi explícita: publicar APK/OTA de staging é o
  caminho mais curto para atualizar o aparelho errado. O ganho de testar num
  canal separado não paga o risco de um bundle de teste chegar ao aparelho do dia
  a dia. Sem destino próprio, staging deixa de precisar de `applicationId`
  alternativo, manifesto alternativo e espelho de Pages.
- **Alternativa rejeitada.** Canal OTA `staging` + APK com `applicationId` de
  teste (o documento de origem, §3.4). Rejeitada por risco operacional e por
  exigir três mecanismos novos (sufixo de id, manifesto por canal, espelho de
  site) para um benefício que o CI já entrega.
- **Consequência aceita.** Testar no aparelho antes do release exige instalar o
  APK do release (ou rodar local). O OTA continua sendo entrega, não canal de
  teste.

### D3 · Cada camada roda um conjunto de testes diferente

- **Decisão.** PR para `dev` roda o gate de **domínio**; `staging` e `main` rodam
  o gate **completo**; a tag roda o **nativo + distribuição**.

| Camada | O que roda | O que isso prova |
|---|---|---|
| `dev` | `typecheck` · `test:domain` · `check:boundaries` · `test:voz` · `verify:contract` | regra pura, fronteira de pacote e contrato de dados |
| `staging` | `npm run verify` (`test:ci` completo + `build:web` + `build:mobile` + `bundle:report`) · `db:verify` · `content:check` | UI, integração, build de produção e catálogo |
| `main` | o mesmo de `staging` | o gate não afrouxa na porta da produção |
| tag `v*` | APK release + IPA + Release + OTA | empacotamento e distribuição |

- **Justificativa.** `docs/estandares-testes.md` já separa as classes de teste e
  manda usar `test:domain` como ciclo de edição. Rodar a suíte inteira em cada
  PR de feature é o que torna o CI lento e o desenvolvimento refém dele.
- **Alternativa rejeitada.** Rodar `npm run verify` em todo PR. Rejeitada por
  custo: 152 arquivos de teste em `src/` contra 14 em `packages/`.
- **Consequência aceita.** Uma regressão **de UI** entra em `dev` e só é vista na
  promoção. É o risco que a camada compra, e ele é reversível antes de chegar a
  `main`.

### D4 · Release só por tag; tag só pelo release-please

- **Decisão.** `release.yml` dispara em `release: types: [published]` (e
  `workflow_dispatch` com tag, para recuperação). Push em `main` **não** publica.
- **Justificativa.** P1: release por push é o vetor pelo qual um commit quebrado
  chega ao celular sem revisão. E o botão de publicar precisa ser um ato, não um
  efeito colateral de merge.
- **Alternativa rejeitada.** Manter push em `main` e confiar na camada de
  `staging`. Rejeitada porque qualquer merge publicaria, inclusive um back-merge.
- **Consequência aceita.** Publicar exige mergear o PR de release gerado pelo bot.

### D5 · release-please cuida de versão, `CHANGELOG.md`, tag e Release

- **Decisão.** `googleapis/release-please-action` roda em push na `main`, abre um
  PR de release com bump SemVer e `CHANGELOG.md`; ao mergear, cria a tag e o
  Release com as notas. `package.json` passa a carregar a versão real, com
  baseline `1.0.95` (a última tag existente).
- **Justificativa.** A dona pediu automação completa e changelog atualizado. O
  bot lê os commits Conventional que já são usados e não exige nenhum passo
  manual além de mergear o PR.
- **Alternativa rejeitada.** `npm version` manual + `gh release create
  --generate-notes`. Rejeitada porque não versiona o `CHANGELOG.md` no
  repositório e depende de alguém lembrar o comando.
- **Consequência aceita.** Um PR automático por release e a exigência de um
  token com permissão de escrita (D6). O primeiro PR de release vai propor
  `1.1.0` por causa dos `feat` acumulados; para sair `1.0.96`, basta escrever
  `Release-As: 1.0.96` no corpo do PR.

### D6 · O release-please usa um PAT, não o `GITHUB_TOKEN`

- **Decisão.** Criar `RELEASE_PLEASE_TOKEN` (fine-grained: `contents: write` +
  `pull-requests: write`) e ligar *Allow GitHub Actions to create and approve pull
  requests*.
- **Justificativa.** Tag e Release criados com o `GITHUB_TOKEN` padrão **não
  disparam outros workflows** (regra anti-recursão do GitHub). Sem o PAT, o bot
  cria a tag e o `release.yml` nunca roda — o release sai sem APK, IPA e OTA.
- **Alternativa rejeitada.** Juntar o build no mesmo workflow do bot. Rejeitada
  porque, numa reexecução, `release_created` já é `false` e não há como
  reconstruir os artefatos: o release ficaria sem recuperação.
- **Consequência aceita.** Um secret manual a mais. É o único passo que não é
  autoaplicável.

### D7 · OTA continua um canal só, na raiz, e só em release

- **Decisão.** `https://fefelipe-7.github.io/cecistudy/version.json` permanece a
  única URL de manifesto. Nenhuma mudança em `ota-manifest.mjs`, em
  `src/lib/ota.ts` ou na configuração do Pages.
- **Justificativa.** É contrato público com os aparelhos já instalados (a URL
  padrão está compilada em cada bundle — `src/lib/ota.ts:23`). Um canal extra
  significaria um segundo caminho de publicação e a chance de o aparelho certo
  ler o manifest errado.
- **Alternativa rejeitada.** Dois canais com `staging/version.json` (o documento
  de origem). Rejeitada pela D2.
- **Consequência aceita.** `staging` não tem como validar um bundle antes do
  release; o que valida é o build + o gate completo + o teste manual.

### D8 · `package.json` é a fonte da versão, e o iOS passa a usá-la

- **Decisão.** `versionName` do Android e `MARKETING_VERSION` do iOS vêm da versão
  do release; `versionCode`/`CURRENT_PROJECT_VERSION` continuam vindo da contagem
  de commits (monotônico).
- **Justificativa.** Hoje o iOS está congelado em `1.0`
  (`ios/App/App.xcodeproj/project.pbxproj:310` e `:332`) e o `release.yml` nunca
  escreve a versão no projeto. Todo IPA sai como `1.0`.
- **Alternativa rejeitada.** Deixar o iOS como está e só versionar o Android.
  Rejeitada porque é exatamente o defeito atual.
- **Consequência aceita.** O release passa dois build settings extras no
  `xcodebuild`; o critério de aceite §7 cobre a regressão.

### D9 · Permissão mínima por job, segredo por `env`, falha de upload é falha

- **Decisão.** `permissions` declarado por job; build com `contents: read`; só o
  upload do Release com `contents: write`; só o Pages com `pages`/`id-token`.
  Segredos por `env:` (nunca interpolados dentro de `run`). O `|| true` do upload
  sai.
- **Justificativa.** P5/P6: hoje qualquer passo dos builds Android/iOS rodaria com
  escrita no repositório, e um upload que falha produz release sem APK
  parecendo sucesso.
- **Alternativa rejeitada.** Manter permissões no topo e revisar depois.
  Rejeitada porque a correção custa 10 linhas e o risco é silencioso.
- **Consequência aceita.** Release falha alto quando falta artefato — inclusive
  quando a causa é externa.

### D10 · `ci-ok` é o único required check, e `branch-policy` guarda a direção

- **Decisão.** Todo workflow de PR termina num job `ci-ok`. A regra que o GitHub
  não expressa — de qual branch um PR pode vir — vira o workflow
  `branch-policy`: `staging` só de `dev`; `main` só de `staging`; ambos aceitam
  `hotfix/*`; `main` aceita `release-please--*`.
- **Justificativa.** Se o ruleset exigir `verify`, qualquer refactor de job
  desliga a proteção em silêncio. `release-please--*` precisa passar, senão o PR
  automático de versão é sempre recusado.
- **Alternativa rejeitada.** Exigir cada job pelo nome. Rejeitada porque job
  pulado por `if` aparece como `skipped` e trava o merge.
- **Consequência aceita.** Um job de 20 s a mais por PR, e a regra "todo job novo
  de PR entra no `needs` do `ci-ok`" precisa estar no `AGENTS.md`.

### D11 · Higiene: zips fora, catálogo gerado fora do git, Biome

- **Decisão.** Remover os 4 zips duplicados; parar de versionar
  `public/assets/databases/cecistudy_catalog.db`, `…/version.json` e
  `content/last-build.json`, gerando-os com `content:ensure` nos scripts
  `predev`/`prebuild`/`preverify`; adotar **Biome 2** para lint e format, em um
  PR próprio.
- **Justificativa.** Os zips são redundância pura (9,5 MB, nenhum consumidor). O
  `.db` é saída de `content/build-catalog.mjs:219` e muda a cada build
  (`builtAt`), então versioná-lo é churn de 20 MB. Formatar 2.889 arquivos agora
  colide com o trabalho em andamento, por isso vem por último.
- **Alternativa rejeitada.** Manter o `.db` versionado (nada a fazer) e adotar
  ESLint + Prettier (duas ferramentas, dois configs, dois comandos). Também
  rejeitado: `git filter-repo` para expurgar os blobs antigos — destrutivo, sem
  rollback.
- **Consequência aceita.** Clone novo precisa gerar o catálogo no primeiro
  comando; o histórico continua com os 20 MB antigos (só cresce se o arquivo
  voltar). Um commit de formatação enorme, uma vez.

### D12 · O QA de promoção mora no template de PR

- **Decisão.** O template de PR tem uma seção de QA que só se aplica a PR com base
  `staging` ou `main`; ela é o checklist.
- **Justificativa.** `docs/manual-tests.md` é um relatório datado, não um
  checklist. Criar outro arquivo repetiria o mesmo conteúdo em dois lugares.
- **Alternativa rejeitada.** Escrever `docs/qa-staging.md`. Rejeitada por
  duplicação.
- **Consequência aceita.** O checklist vive onde é usado.

## 3. Escopo

| Item | Tipo |
|---|---|
| `.github/workflows/ci.yml` (3 branches, `ci-ok`, gate por camada) | gate |
| `.github/workflows/branch-policy.yml` | gate |
| `.github/workflows/release-please.yml`, `.release-please-{config,manifest}.json` | CD |
| `.github/workflows/release.yml` por `release: published`; `release.legacy.yml` transitório | CD |
| `xcodebuild` com a versão do release (iOS) | código |
| `scripts/ensure-catalog.mjs` + `content:ensure` | código |
| `biome.json` + scripts `lint`/`format` | config |
| `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODEOWNERS` | doc |
| `.github/dependabot.yml`, templates de PR/issue | doc |
| remoção dos zips; `.gitignore`; `ota/README.md`; `AGENTS.md` | doc |

## 4. Contrato: branches, checks e permissões

| Regra | `dev` | `staging` | `main` | tags `v*` |
|---|---|---|---|---|
| Exigir PR | sim | sim | sim | n/a |
| Aprovações | 0 | 0 | 0 | n/a |
| Métodos de merge | squash | merge commit | merge commit | n/a |
| Checks obrigatórios | `ci-ok` | `ci-ok` + `branch-policy` | `ci-ok` + `branch-policy` | n/a |
| Origem permitida do PR | qualquer | `dev`, `hotfix/*` | `staging`, `hotfix/*`, `release-please--*` | n/a |
| Publica algo? | **não** | **não** | **não** (só a tag) | Release + OTA |
| Force push / deleção | bloqueado | bloqueado | bloqueado | bloqueado |
| Histórico linear | sim | não | não | n/a |
| Bypass | ninguém | ninguém | ninguém | só a dona (criar tag) |

## 5. Fora de escopo

- Canal OTA de staging, APK de staging, `applicationId` alternativo (D2).
- Preview de web por branch — não existe Vercel aqui (§1.3).
- `git filter-repo` e LFS (D11).
- e2e real e teste de performance de bundle — continuam em `spec-performance`.
- Licença do **conteúdo curado** (`content/`, `library/`): `[A]`, ver §9.
- Qualquer mudança em `packages/*`, no schema (`SCHEMA_VERSION` intacto) ou no
  desktop. Esta spec não muda dado da usuária.

## 6. Invariantes

1. Push direto em `dev`, `staging` ou `main` é recusado pelo servidor.
2. PR para `staging` que não venha de `dev` ou `hotfix/*` reprova; PR para `main`
   que não venha de `staging`, `hotfix/*` ou `release-please--*` reprova.
3. Todo workflow de PR termina em um job chamado `ci-ok`.
4. Push em `main` não cria Release, não cria tag e não altera o OTA.
5. `staging` não produz artefato instalável nem publica em nenhum destino.
6. Duas execuções do pipeline de release nunca se sobrepõem no tempo.
7. Nenhum release sai sem APK, IPA e zip anexados; upload que falha derruba o job.
8. A tag publicada, a versão do `package.json`, o `versionName` do Android e o
   `MARKETING_VERSION` do iOS são o mesmo número.
9. Um PR com `npm run build` quebrado e `tsc` verde reprova no CI.
10. Um clone novo, só com `npm ci`, consegue rodar `npm run dev` e
    `npm run verify` (o catálogo é gerado).

## 7. Critérios de aceite

Verificáveis por comando ou observação no GitHub.

- [ ] `git push origin main` (com commit novo) é recusado.
- [ ] PR `feat/x → main` reprova `branch-policy`; `feat/x → dev` passa.
- [ ] PR para `dev` roda o gate de domínio; PR para `staging` roda o gate completo.
- [ ] `gh run list --workflow=ci.yml` mostra execuções nas três branches, todas com `ci-ok`.
- [ ] Push em `main` não cria Release: `gh release list` inalterado.
- [ ] Merge do PR de release em `main` produz tag `vX.Y.Z`, `CHANGELOG.md`
      atualizado e Release com APK + IPA + zip, **sem comando manual de build**.
- [ ] `gh release view vX.Y.Z --json assets` lista os três arquivos.
- [ ] O IPA do release tem `MARKETING_VERSION` igual à tag (não `1.0`).
- [ ] OTA na raiz atualizado após o release; nenhum arquivo fora da raiz criado.
- [ ] `npm run db:verify` e `npm run content:check` aparecem como passos do CI.
- [ ] `git ls-files | grep -c '\.zip$'` = 0 e `git ls-files | grep -c 'cecistudy_catalog.db'` = 0.
- [ ] Em clone limpo: `npm ci && npm run dev` funciona (gera o catálogo).
- [ ] `npm run lint` roda Biome (não `tsc`) e `npm run typecheck` continua sendo o `tsc`.

## 8. Medição

| O que | Comando |
|---|---|
| Gate completo | `time npm run verify` |
| Gate de domínio | `time npm run verify:domain` |
| Duração do CI | `gh run view <id> --json jobs` |
| Vulnerabilidades | `npm audit --audit-level=high` |
| Tamanho | `du -sh .git content public/assets/databases` |
| Tags e commits | `git tag | wc -l` · `git rev-list --count HEAD` |
| Árvore suja | `git status --short | wc -l` |

## 9. Riscos e pendências

| Risco | Mitigação |
|---|---|
| **O CI nunca rodou** desta máquina | a fase 2 do todo termina com execução observada no navegador |
| Tempo do `test:ci` desconhecido (152 arquivos em `src/`) | medir antes de tornar `ci-ok` obrigatório (T0.3, T2.5) |
| release sem PAT não dispara build | D6: `RELEASE_PLEASE_TOKEN` é pré-requisito do primeiro release |
| Formatar 2.889 arquivos com o trabalho pendente em aberto | T0.1 commita antes; Biome é o último PR (T5.4) |
| `.db` fora do git quebra clone novo | `content:ensure` nos `pre*` + aviso no README |
| Aparelho recebendo bundle de teste | D2: `staging` não publica nada |

Pendências abertas:

- **`[A]` Licença do conteúdo curado.** A PolyForm Noncommercial 1.0.0 vale para
  o **software**. `content/` e `library/` reúnem material de terceiros (livros,
  artigos, catálogo) cujos direitos não são da dona. Declarar licença própria
  para o conteúdo (ou atribuição) é decisão dela, com apoio habilitado se houver
  dúvida. O `LICENSE` cobre só o código.
- **`[A]` Licença de `apps/desktop-flutter` e `apps/rn-expo`.** São scaffolds
  experimentais dentro do repositório; se forem publicados como produto, a
  licença precisa ser reavaliada.

## 10. Rastreabilidade

| Decisão | Arquivo | Gate que prova |
|---|---|---|
| D1, D10 | rulesets + `branch-policy.yml` | PR com origem errada reprova |
| D2 | `ci.yml`/`release.yml` (staging sem job de publicação) | `gh run list` em `staging` sem artefato publicado |
| D3 | `ci.yml` (`gate-domain` / `gate-full`), `verify:domain` | jobs diferentes por branch |
| D4, D5, D6 | `release-please.yml`, `release.yml` | push em `main` não cria Release; merge do PR cria |
| D7 | — (nada muda) | `curl` do manifesto após release |
| D8 | `release.yml` (`xcodebuild` com versão) | `gh release view` + IPA com a versão da tag |
| D9 | `release.yml` (permissões por job, sem `\|\| true`) | release sem IPA falha |
| D11 | `ensure-catalog.mjs`, `biome.json`, remoção dos zips | `git ls-files` e `npm run verify` |
| D12 | `PULL_REQUEST_TEMPLATE.md` | checklist presente no PR de promoção |

Não há golden nem fixture: esta spec muda processo, não domínio. O que ela
garante é o gate — e o gate é o teste.

## 11. Estado da execução (2026-10-24)

O que está no repositório e o que ainda depende do GitHub.

| Item | Estado |
|---|---|
| Licença PolyForm Noncommercial 1.0.0, README, CONTRIBUTING, SECURITY, CODEOWNERS, templates, Dependabot | entregue |
| `ci.yml` (`gate-domain`/`gate-full`/`android-debug`/`pr-title`/`ci-ok`), `branch-policy.yml` | entregue e **executado** — runs `40059531878` (`dev`) e `40059533949` (`staging`) verdes, `android-debug` incluso |
| `release.yml` (release publicado + dispatch) | entregue e **exercitado** — release `v1.0.99` publicado em 2026-10-24 disparou o build de APK/IPA/OTA |
| `release-please.yml` | entregue e **executado** — abriu o PR de versão sozinho na `main` |
| `sync-main-back.yml` | entregue — devolve versão/CHANGELOG da `main` para a `dev` por PR automático |
| `package.json`: `verify:domain`, `content:ensure` em `predev`/`prebuild`/`preverify`, versão 1.0.99 | entregue |
| Zips fora do git (9,4 MB) e catálogo destrackeado (20 MB) | entregue |
| Biome 2.6.2 (`format`, `format:check`, `lint:code`) e 508 arquivos formatados | entregue |
| Branches `dev`/`staging` e default branch **`main`** | **aplicado** — a default voltou para `main` por decisão da dona; a regra de "sempre criar branch antes do PR" mora no `AGENTS.md` |
| Rulesets `dev`, `staging`, `main`, `tags-v` | **aplicado** (`25769442`, `25769443`, `25769444`, `25769445`); o de tag tem bypass de admin, para a dona poder apagar tag publicada errada |
| Settings: auto-merge, delete branch on merge, update branch, Actions pode abrir PR | **aplicado** |
| Segurança: secret scanning, push protection, alertas de vulnerabilidade, Dependabot security updates, CodeQL default | **aplicado** |
| `RELEASE_PLEASE_TOKEN` | **aplicado** — PAT com escopos `repo` + `workflow` |
| `CHANGELOG.md` escrito à mão, com `skip-changelog` no release-please | **aplicado** — o texto é humano; o release-please cuida só de versão e tag |
| Primeiro release real (`v1.0.99`) | **publicado** em 2026-10-24 |

O enforcement foi provado, não presumido (2026-10-24):

- `git push origin HEAD:main` → recusado: *"Changes must be made through a pull
  request"* + *"Required status check branch-policy is expected"*.
- `git push origin --delete staging` → recusado: *"Cannot delete this branch"*.
- PR de ensaio `feat/ensaio` → `main` → `branch-policy` **fail**, como o §4
  exige. PR fechado e branch apagada em seguida.

O caminho completo também foi exercitado de ponta a ponta, e **duas falhas
reais** apareceram nele — as duas corrigidas na origem:

1. O action procura `release-please-config.json` **sem ponto** no nome; o
   arquivo estava como `.release-please-config.json` e o primeiro run falhou com
   *"Missing required manifest config"*.
2. O tag saiu como `cecistudy-v1.1.0` (componente no nome). Como o `release.yml`
   deriva a versão com `${TAG#v}`, o bundle OTA viraria
   `cecistudy-cecistudy-v1.1.0` e o app nunca veria a atualização. Entrou
   `include-component-in-tag: false` **e** um guard no `release.yml` que falha
   alto se o tag não casar `^vX.Y.Z` — o release `cecistudy-v1.1.0` foi apagado
   sem assets.
3. A `main` recebeu versão/CHANGELOG do release-please e a `dev` não; a promoção
   seguinte conflitou nesses arquivos. Por isso o `sync-main-back.yml`.

A publicação é automática a partir do release: publicar um Release dispara
`release.yml` (bundle web + APK + IPA + OTA). O que continua manual é **decidir
quando promover** `dev → staging → main` — promoção é julgamento, não relógio.

Divergências em relação ao texto acima, ambas deliberadas:

1. **`npm run lint` continua `tsc --noEmit`.** O §7 previa Biome no `lint`, mas
   `AGENTS.md` documenta `lint = tsc` e é o contrato que o CI e as sessões leem.
   Biome entrou como `lint:code`.
2. **`format:check` não está no `verify:fast`.** Os arquivos da outra sessão já
   estão commitados, mas ainda fora do formato do Biome; ligar o passo exige
   rodar `npm run format` antes, num commit próprio.

Débito novo descoberto na execução: **`npm run content:check` regrava as fachadas
do templo** (15 JSON + 2 `.ts` em `src/data/temple/`, ~17 mil linhas de diff,
conteúdo idêntico). A árvore fica suja a cada verificação. Registrado em
`tasks/todo-saude-do-repositorio.md` (Pendências reais, item 8).
