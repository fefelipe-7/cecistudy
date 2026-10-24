<!-- Título do PR = mensagem Conventional (o squash usa o título). Ex.: feat(tcc): SPEC-024 — prazos por capítulo -->

## O que muda

<!-- Uma ou duas frases. O "porquê" fica na spec. -->

## Tipo

- [ ] feat · [ ] fix · [ ] docs · [ ] refactor · [ ] test · [ ] chore · [ ] ci
- [ ] **promoção** (`dev → staging` ou `staging → main`)

## Spec

<!-- `docs/specs/SPEC-0NN-…` ou "sem spec: mudança mecânica" -->

## Gate rodado

- [ ] `npm run verify:domain` (PR para `dev`)
- [ ] `npm run verify` (PR para `staging`/`main`)
- [ ] `npm run db:verify` + `npm run content:check` (se mexeu em `content/` ou no catálogo)
- [ ] `node .github/scripts/check-boundaries.mjs` (se mexeu em `packages/*`)

## Risco de OTA

- [ ] o bundle novo é compatível com o banco e o estado já existentes
- [ ] não há mudança de `SCHEMA_VERSION` sem migração
- [ ] não há dependência nova em plugin nativo (senão exige APK/IPA nova)

## QA (só para PR com base `staging` ou `main`)

Rode no aparelho/app, não só no teste automatizado:

- [ ] abrir o app e navegar pelas telas tocadas
- [ ] fluxo principal da mudança, do começo ao fim
- [ ] voltar para o estado anterior (cancelar/desfazer) sem perder dado
- [ ] criar, editar e apagar um registro afetado
- [ ] fechar e reabrir o app: o estado persistiu
- [ ] nada de tela vazia, texto cru ou erro sem voz
