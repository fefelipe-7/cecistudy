# Plano completo — Catálogo novo → Templo de Conhecimento

> Documento gerado em 2026-08-24 a partir do levantamento do pacote
> `content/catalogo.zip` + decisões tomadas com a usuária. **Este documento é o
> contrato para retomar/executar a implementação.** Status: plano aprovado,
> implementação NÃO iniciada (nenhum código da Fase A–D foi escrito ainda).

---

## 1. Decisões fechadas com a usuária (não reabrir sem pedir)

| # | Tema | Decisão |
|---|---|---|
| 1 | Questões | As **3.004 questões do pacote SUBSTITUEM as 745 atuais** (`bancoQuestoes`) |
| 2 | Status `review` | Questões em revisão entram **iguais às publicadas, sem badge/diferenciação visual** |
| 3 | Famílias | **Dois modelos coexistem**: 10 famílias editoriais (`fam-01..10`, biblioteca/famílias screen) × famílias taxonômicas do pacote (quiz/templo). Não unificar |
| 4 | Autores | Dedup **automático conservador agora**; refino editorial manual depois via `content/editorial/authors.json` |
| 5 | Corte de autores | **Todos os nomes válidos pós-dedup** (sem corte mínimo por citações) |
| 6 | Técnicas | Fonte oficial = `content/techniques/` (**136 técnicas, 10 categorias**, já no repo) |
| 7 | Comparações | **ADIADO** — cartão permanece toast "em breve ♡" nesta fase |
| 8 | Conceitos | Os 225 conceitos de `content/concepts/` viram fonte oficial; relações vazias **auto-preenchidas** por matching de texto (marcar `relationStatus: 'auto'`) |
| 9 | Abordagens | **Registro canônico + aliases** unindo os 3 sistemas de ids |
| 10 | Web/bundle | **Lazy chunks por entidade** (conceitos = 7,2 MB! carregar índice leve + detalhe por domínio via `import()` dinâmico) |
| 11 | Ordem | Implementar tudo; ordem: pipeline → dados → telas |

---

## 2. Inventário dos dados (verificado em 2026-08-24)

### 2.1 Pacote extraído — `content/catalogo/cecistudy_catalogo_modular_3004/`

Extraído de `content/catalogo.zip`. Release `2026.08.20`, hash `30ee3959…`.

| Pasta | Conteúdo | Volume | Observações |
|---|---|---|---|
| `content/questions/` | Questões por **18 categorias** → blocos `.questions.json` + `category.json` | **3.004** (MC 2.284 · C/E 720) | `published` 1.243 · `review` 1.759 · `deprecated` 2; origem `real` 1.245 / `autoral` 1.759; bancas: Autoral, CESPE/CEBRASPE, Cebraspe, FGV, IBFC, Consulplan, Marinha, UFJF/COPESE, VUNESP |
| `content/taxonomies/` | `areas.json` (122), `categories.json` (18), `topics.json` (**1.518 hierárquicos**, 82 raízes), `approaches.json` (17 com `familyId` family-*: psychodynamic/cognitive-behavioral/humanistic-existential/methodological/biological/contextual/clinical-public/other), difficulty/formats/origins/review-statuses | — | topics = espinha dorsal de cross-link |
| `content/authors/` | `{id,name,status}` por arquivo | **834** | ⚠️ Brutos: duplicatas (`freud`/`sigmund-freud`) e pseudo-autores que são tópicos (`memoria`, `linguagem`, `neuropsicologia`, leis, OMS…) |
| `content/works/` | `catalog.references.json`, itens `{id,title,kind:'reference'}` | 1.382 | ⚠️ Duplicatas claras (mesma obra com hashes diferentes) |
| `content/indexes/` | Índices prontos: question-groups, by-approach/bank/category/exam/format/status | — | úteis p/ filtros |
| `content/schemas/` | JSON Schemas (question, group, manifest) | — | validar ingestão |
| `sql/` | Schema relacional normalizado + FTS5 (`question_topic`, `question_approach`, `question_author`, `question_work`) | — | referência; adotar **nosso** schema como alvo |
| `resources/catalog/` | SQLite pronto | — | schema divergente do nosso — não usar direto |
| `legacy/` | `cecistudy_banco_3004_final.json` etc. | — | só rollback editorial |

Shape da questão (campos-chave): `id, stem, format ('multiple_choice'|'true_false'), difficulty ('basic'|'intermediate'|'advanced'|'unspecified'), knowledgeType, explanation, options[{id,text,isCorrect}] (C/E = 'Certo'/'Errado'), topicIds[], approachIds[], authorIds[], referenceIds[], reviewStatus, isActive/isScorable/isAnnulled, origin ('autoral'|'real'), bank, exam, year, categoryId, areaId, legacy`.

### 2.2 Já existe no repo

- **`content/concepts/`** — 225 conceitos, **12 domínios** (15–25 cada), ~7,2 MB.
  Top-level keys: `id, entityType, name, slug, domainId, domainName, definition,
  sections{definition,explanation,understanding,manifestations,importance,historicalContext,perspectives,example,distinctions,relatedConcepts,practice,literatureDebates,sources},
  detailMarkdown, sourcePath, sourceUrl, status, reviewStatus, authorIds, approachIds,
  techniqueIds, workIds, relatedConceptIds, topicIds, tags, contentHash`.
  ⚠️ `authorIds/approachIds/techniqueIds/topicIds` estão **vazios** (A3 preenche).
  Domínios (qtde): Fundamentos Psicológicos (15) · Cognição e Processos Mentais (17) ·
  Emoção Afeto e Motivação (15) · Personalidade Self e Identidade (15) · Desenvolvimento
  Humano (15) · Aprendizagem e Comportamento (19) · Relações e Processos Interpessoais (18) ·
  Processos Sociais Culturais e Contextuais (20) · Psicopatologia e Sofrimento Psicológico (20) ·
  Processos Psicodinâmicos e Inconscientes (25) · Processos de Psicoterapia e Mudança (22) ·
  Existência Significado e Construção da Experiência (24).
  Ids: `concept-01-fundamentos-psicologicos-<slug>`; domains: `domain-01-fundamentos-psicologicos`.
- **`content/techniques/`** — 136 técnicas + 10 categorias (`index.json`:
  `posicoesNominais:142, tecnicasCanonicas:136`; ids `tec-*`). Categorias
  (`category.json`, id `domain-cognitivas` etc., campo `ordemExibicao`): cognitivas ·
  comportamentais · emocionais-experienciais · exposicao-aprendizagem ·
  humanistas-existenciais · mindfulness-aceitacao-regulacao · motivacionais-solucao ·
  narrativas-construtivistas · psicodinamicas · sistemicas-familiares-casais.
  Keys da técnica: `id, nome, canonicalKey, emUmaFrase, definicao, objetivo, comoFunciona,
  quandoEUtilizada, comoEAplicada, origem, desenvolvimentoHistorico, exemploPratico,
  fundamentacaoTeorica, evidencias, limitacoes, contextoClinico, observacoes, tipoTecnica,
  classificacaoEstatuto, slug, dominioId, dominioIds, dominioNomes, ordemExibicao,
  posicoesNominais, abordagemIds (25 distintos, TODAS preenchidas), modeloIds, fonteIds
  (src-*), tecnicasRelacionadasIds (todas preenchidas), dataCadastro, dataUltimaRevisao,
  status, sourcePath`.
- **Catálogo atual do app**: `public/assets/databases/cecistudy_catalog.db`
  versão `2026.08.20.1` — counts: areas 36, approachFamilies 10, approaches 97,
  questions 745, works 262. Gerado por `npm run content:build`
  (`content/build-catalog.mjs` ← `content/content-data.mjs` ← `src/data/*`).

### 2.3 Os 3 sistemas de ids de abordagem (resolver com registry)

| Sistema | Formato | Onde | Qtde |
|---|---|---|---|
| Editorial (app atual) | `psic-<fam>-<nn>` + famílias `fam-01..10` | `src/data/psicoterapiaApproaches.ts` / `psicoterapiaFamilies.ts` (GERADOS por `scripts/build-psicoterapia.mjs` — não editar na mão) | 97 / 10 |
| Taxonômico (questões) | `app-<slug>` + `familyId` family-* | pacote `taxonomies/approaches.json` | 17 |
| Técnicas | `app-<categoria>-<terapia-slug>` (ex.: `app-cognitiva_tcc-terapia-cognitiva-beck`) | `content/techniques/*/*.abordagemIds` | 25 distintos |

⚠️ **Zero interseção** entre os 25 ids das técnicas e os 97 editoriais (verificado).
Os 17 taxonômicos: avaliação/psicometria (methodological), behaviorismo/aprendizagem
(cognitive-behavioral), desenvolvimento humano (other), fundamentos (methodological),
humanista-existencial-fenomenológica (humanistic-existential), neuropsicologia
(biological), pesquisa/metodologia/estatística (methodological), psicanálise/
psicodinâmica (psychodynamic), cognitiva/TCC (cognitive-behavioral), escolar/
educacional (contextual), jurídica/forense (clinical-public), organizacional/trabalho
(contextual), social/comunitária (contextual), saúde/políticas públicas
(clinical-public), psicopatologia/clínica (clinical-public), teorias da personalidade
(psychodynamic), ética/regulamentação (clinical-public).

Mapeamento taxonômico→editorial sugerido (keyword): psicanálise→fam-01 ·
humanista/existencial/fenomenológica→fam-02 · behaviorismo/aprendizagem→fam-03 ·
cognitiva/TCC→fam-04 · sistêmica/família/casais→fam-05 · narrativa/construtivista→fam-06 ·
social/comunitária/grupos/diversidade→fam-09 · demais áreas metodológicas/contextuais →
**sem família editorial** (entrada canônica própria no registry).

---

## 3. Arquitetura alvo

### 3.1 Pipeline editorial (`content/`)

```
fontes: content/catalogo/.../{questions,taxonomies,authors,works}
      + content/concepts/ + content/techniques/
      + content/editorial/{approachRegistry.json, authors.json}

scripts novos:
  content/build-approach-registry.mjs   → content/editorial/approachRegistry.json
  content/build-authors.mjs             → content/editorial/authors.json (dedup conservador)
  content/fill-concept-relations.mjs    → regrava concepts/*.json (relations auto)
  content/build-questions-bank.mjs      → src/data/questions/cecistudy_banco_3004_questoes.json
                                           (shape BancoQuestaoRaw compatível c/ o atual!)
  content/build-temple-facades.mjs      → src/data/temple/{concept-index.json,
                                           concepts/<dominio>.json (12 chunks),
                                           techniques.json, authors.json,
                                           approachRegistry.json}
alterados:
  content/content-data.mjs   (+loaders temple, +hash das fontes novas)
  content/build-catalog.mjs  (+inserts das tabelas novas, +counts)
  content/check-content.mjs  (+mínimos novos)
  content/catalog-version.json (bump)
```

**Ponto-chave do quiz:** gerar o banco 3004 **no MESMO shape raw do banco atual**
(`BancoQuestaoRaw`: texto/tipo/alternativas/gabarito/explicacao/area/tema/subtema/
autor_ou_autores/escola_ou_abordagem/dificuldade/tipo_conhecimento/referencias_de_apoio/
origem/status_revisao/banca/prova/ano/formato/resposta_discursiva/criterios_de_correcao/
afirmativas/itens_de_associacao) → `src/data/bancoQuestoes.ts` só troca o import do JSON
e o resto do quiz (QuizCategorySelector, filterQuestionPool, QuizPlayer) funciona
inalterado. Mapeamento:

- `texto` = stem · `alternativas` = options[].text (C/E já vem como "Certo"/"Errado") ·
  `gabarito` = letra da option correta ("A".."E") · `explicacao` = explanation
- `area` = **título da categoria** (18) · `tema` = nome do 1º topicId · `subtema` = null
- `escolaOuAbordagem` = nome do 1º approachId · `dificuldade` = basic→basica /
  intermediate→intermediaria / advanced→avancada / unspecified→null
- `autor_ou_autores` = nomes dos autores curados (via authors.json) ·
  `referencias_de_apoio` = títulos dos referenceIds · `formato` = formato original
- `origem` = autoral/prova_real · `status_revisao` = reviewStatus · banca/prova/ano = bank/exam/year
- excluir apenas `deprecated`/`isAnnulled` (2 questões)

### 3.2 Schema do `.db` (`src/lib/db/catalogSchema.ts`)

Adicionar tabelas (manter as existentes):

```sql
CREATE TABLE concept_domain (id TEXT PRIMARY KEY, name TEXT NOT NULL, display_order INTEGER NOT NULL);
CREATE TABLE concept (id TEXT PRIMARY KEY, domain_id TEXT NOT NULL REFERENCES concept_domain(id),
                      name TEXT NOT NULL, display_order INTEGER NOT NULL, data_json TEXT NOT NULL);
CREATE TABLE catalog_author (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL,
                             question_count INTEGER NOT NULL DEFAULT 0, data_json TEXT NOT NULL);
CREATE TABLE technique_category (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
                                 display_order INTEGER NOT NULL);
CREATE TABLE technique (id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES technique_category(id),
                        name TEXT NOT NULL, display_order INTEGER NOT NULL, data_json TEXT NOT NULL);
CREATE TABLE question_category (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
                                display_order INTEGER NOT NULL);
CREATE TABLE topic (id TEXT PRIMARY KEY, parent_id TEXT REFERENCES topic(id), name TEXT NOT NULL);
```

`question` continua com `data_json` mas agora com as 3.004 mapeadas (`area`=categoria,
`tema`=topic principal, `formato`). Atualizar `db:verify` (`EXPECTED_TABLES`/`MIN_COUNTS`)
e counts do `version.json`. Bump `catalog-version.json` (ex.: `2026.08.24.1`).

### 3.3 Camada de dados no app

- `src/lib/db/catalogDb.ts`: queries novas — `getCatalogConceptDomains`,
  `getCatalogConceptIndex`, `getCatalogConcept(id)` (data_json), `getCatalogAuthors`,
  `getCatalogTechniqueCategories`, `getCatalogTechniques(categoryId?)`. Padrão existente:
  `SELECT data_json …` + parse.
- Web (lazy): `src/data/temple/` gerado pela pipeline. Índice de conceitos leve no chunk
  do templo; conteúdo integral por domínio via `import(`…/concepts/${dominio}.json`)`
  (12 chunks ~600 KB). Techniques (~719 KB) e authors pequenos = 1 chunk cada.
- Loader platform-aware `src/lib/templeData.ts` (irmão de `src/lib/catalogLibrary.ts`):
  nativo → catalogDb; web → dynamic import dos facades. Memoizar promises.
- Registry: helper `resolveApproach(aliasId): { id, name, familyId? } | null` lendo
  `src/data/temple/approachRegistry.json` (estático, pequeno).

### 3.4 Telas do templo (padrão seguido: modo da BibliotecaView)

- `types.ts`: `NavScreen += { kind: 'templeSection'; section: TempleSection }`;
  `type TempleSection = 'conceitos' | 'autores' | 'tecnicas'`.
  Interfaces novas: `ConceptDomain`, `TempleConcept` (ou reusar estrutura dos JSONs),
  `TempleAuthor { id, name, kind, aliases, questionCount }`
  (⚠️ já existe `Technique` em types.ts — adaptar/estender em vez de duplicar).
- `routing.ts`: rota `#/biblioteca/templo/<slug>` (slugs: `conceitos`, `autores`,
  `tecnicas`) → Route.templeSection; routeToStack empurra `{kind:'templeSection',section}`;
  stackToHash serializa. `handleSystemBack` é genérico (pop da pilha) — nada a fazer.
- `AppContext.tsx`: `openTempleSection(section)` / `closeTempleSection` (seguir padrão de
  `openNotesScreen`); derivado `focusedTempleSection`; expor no hook; headerConfig: cases
  novos em `buildHeaderConfig` (títulos pt-BR lowercase: "conceitos", "autores",
  "técnicas"; icons Lightbulb/User/Wrench; cores dos cartões do TempleScreen).
- `TempleScreen.tsx`: trocar toasts por `openTempleSection('conceitos'|'autores'|'tecnicas')`;
  card "comparações" permanece toast "em breve: comparações ♡".
- `BibliotecaView.tsx`: `mode += 'concepts' | 'authors' | 'techniques'` renderizando os
  componentes novos `components/library/temple/`:
  - `ConceptsScreen.tsx` — lista por domínio → detalhe inline (seções markdown; back local)
  - `AuthorsScreen.tsx` — A–Z / mais citados → ficha (conceitos/questões relacionadas)
  - `TechniquesScreen.tsx` — 10 categorias → lista → ficha completa + relacionadas
  - Detalhe dentro da tela com estado local + botão voltar interno (evita mais níveis de pilha)
- Cross-links futuros: questão ↔ conceito ↔ autor ↔ técnica (deep-link `data-target`).

### 3.5 Quiz

Troca do JSON cobre a migração (seção 3.1). Conferir depois: `filterQuestionPool`
(`src/lib/quizLogic.ts`) segue ok pois campos são os mesmos; seletor mostra áreas = 18
categorias. Sem alteração de UI prevista.

---

## 4. Ordem de execução (checklist)

- [x] **A1** `build-approach-registry.mjs` → `content/editorial/approachRegistry.json`
      (match por nome/tags normalizados; fallback keyword→família; registrar não-casados)
- [x] **A2** `build-authors.mjs` → dedup conservador (normalizar acentos/caixa; merge só
      de variantes óbvias tipo substring "freud"⊂"sigmund freud"; classificar
      person/institution/topic-like; topic-like fora do templo; contar questões por autor)
- [x] **A3** `fill-concept-relations.mjs` → matching de texto (nomes de autores/tópicos nos
      campos dos conceitos) gravando `authorIds/topicIds` + `relationStatus:'auto'`
- [x] **B1** `build-questions-bank.mjs` → `src/data/questions/cecistudy_banco_3004_questoes.json`
      + trocar import em `src/data/bancoQuestoes.ts` (manter shape raw!) → testar quiz
- [x] **A4** Schema + `build-catalog.mjs` + `content-data.mjs` + `check-content.mjs` +
      `db-verify.mjs` + bump `catalog-version.json` → `npm run content:build` + `db:verify`
- [x] **B2** `build-temple-facades.mjs` → `src/data/temple/*` (lazy chunks)
- [x] **B3** `catalogDb.ts` queries + `src/lib/templeData.ts` loader dual
- [x] **C0** types.ts (NavScreen/TempleSection/interfaces) + routing.ts + AppContext
      (open/close/derivados/headerConfig) + TempleScreen wiring
- [x] **C1** ConceptsScreen · **C2** AuthorsScreen · **C3** TechniquesScreen
- [x] **D** Testes (registry resolve, dedup pure functions, routing templeSection, telas),
      gate completo: `npm run lint` + `npm run test` + `npm run build` +
      `npm run content:build` + `npm run db:verify`; atualizar `.context/data-model.md`,
      `architecture.md`, `components.md`

## 5. Riscos / atenção

- **Conceitos = 7,2 MB**: nunca importar estático no bundle inicial; índice leve +
  lazy por domínio. No nativo tudo vem do `.db`.
- **Autores/obras sujos**: curadoria automática conservadora; merges duvidosos ficam
  fora até revisão manual em `content/editorial/authors.json`.
- **Schema divergente**: o SQLite do pacote NÃO é copiado; nosso builder é a única
  fonte do `.db` embutido.
- **Quiz**: manter shape raw do banco evita tocar em QuizPlayer/quizLogic; validar
  C/E ("Certo"/"Errado") e dificuldades `unspecified→null` antes de publicar.
- `tsconfig` já tem `resolveJsonModule`; scripts .mjs rodam com type-stripping no Node 26.
- Gate de validação sempre: `npm run lint` + `npm run test` + `npm run build` +
  `npm run content:build` + `npm run db:verify`.

## 6. Estado atual desta sessão

- ✅ Pacote extraído em `content/catalogo/cecistudy_catalogo_modular_3004/` (zip mantido).
- ✅ Levantamento completo + decisões fechadas com a usuária (seções 1–2).
- ✅ **IMPLEMENTADO (2026-08-25)** — checklist da seção 4 completo (A1→D). Resultados:
  - Registry: 114 canônicas (97 editoriais · 17 taxonômicas próprias) + 25 aliases de técnicas.
  - Autores: 834 brutos → 747 curados (723 pessoas · 24 instituições · 36 excluídos).
  - Conceitos: 191/225 atualizados com relações `auto` (185 com autores).
  - Questões: 3.002 no app (2 anuladas fora); quiz funciona inalterado (shape raw preservado).
  - `.db` versão `2026.08.24.1` (16 MB) com 13 tabelas; `db:verify` ok.
  - Web: facades lazy — chunk do templo (~1 MB gzip 98 kB) só carrega ao abrir o templo;
    conceitos em 12 chunks por domínio (~35–155 kB gzip cada).
  - Telas: `temple/ConceptsScreen`, `AuthorsScreen`, `TechniquesScreen` empilhadas via
    `#/biblioteca/templo/<slug>`; detalhe com back interno.
  - Gate: lint ✓ · testes 424/45 arquivos ✓ (inclui templeData + AuthorsScreen + routing) ·
    build ✓ · content:check ✓ · db:verify ✓.
  - Docs: `.context/data-model.md` (seção 7), `components.md`, este checklist.

## 7. Follow-ups futuros (não bloqueantes)

- Cross-links questão ↔ conceito ↔ autor ↔ técnica (deep-link `data-target`).
- Comparações entre abordagens (cartão segue toast "em breve ♡").
- ~~Ficha do autor com conceitos/questões relacionadas~~ → **substituído (2026-08-25)**: os
  autores viraram entidade de consulta com **139 fichas editoriais completas**
  (`content/authors-curated/` → `build-authors-fichas.mjs`), sem qualquer vínculo com
  questões. Tela: `temple/AuthorsScreen` + `temple/MarkdownBlock.tsx` (renderer de markdown
  das fichas). O antigo dedup (`build-authors.mjs` → `authors.json`) ficou como artefato da
  pipeline A2, sem consumo no app; os `authorIds` auto-preenchidos dos conceitos apontam para
  ids que não estão mais no `catalog_author` — remapear quando os cross-links forem feitos.
