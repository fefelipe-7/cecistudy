# Análise Arquitetural — desktop Flutter + Rust

> Análise do `plano-desktop-flutter-rust.md` contra o estado atual do código.
> Objetivo: dar base de decisão para um plano de implementação real.
> Geração: 2026-09-09 · Skill: greenfield-architecture-planner · Estado do código verificado no workspace.

---

## 1. Executive Summary

O plano abandona Tauri+React no desktop em favor de **Flutter (apresentação) + Rust (domínio, dados, sync, integrações, capacidades)**, mantendo o mobile (React+Capacitor) intacto. A premissa central — *"a lógica já existe em TypeScript, é só traduzir, não desenhar do zero"* — é **verdadeira para os pacotes canônicos mas subdimensionada para a camada de estado/uso**:

- **O que existe e é portável (pequeno e puro):** `packages/domain` (~740 LOC), `packages/data` (~1k LOC), `packages/sync` (~840 LOC). São módulos enxutos, determinísticos, sem React — exatamente o perfil ideal para Rust.
- **O que o plano não nomeia:** a camada de "casos de uso" hoje mora em **`src/lib/*` (~5,5k LOC em 30+ módulos)** e no modelo de dados real (`src/types` + `src/data/empty.ts`, 25 coleções). O `packages/application` é um wrapper de ~136 LOC. A matriz de capacidades cobre só **9 entidades dos módulos novos**, não as entidades legadas em uso (course, task, exam, reading…). As 13 migrações de `packages/data/src/schema.ts` são closures JS — e a migração 9 depende de `parseLegacySchedule` que mora em `src/lib/schedule.ts`, **fora do boundary dos packages**.
- **O maior risco técnico não é "os dois lados divergirem", é o mecanismo concreto dessa divergência:** `tieBreak` do merge compara `JSON.stringify(a)` vs `JSON.stringify(b)` com semântica UTF-16 da string JS; `contentHash` (FNV-1a) faz hash dos **code-units UTF-16**; o sort do merge usa `localeCompare` (sensível a locale). Rust precisa reproduzir **exatamente** essas semânticas (ordem de chaves, escaping de unicode, bytes, ordenação) — ou o sync quebra silenciosamente. Golden files são necessários mas **não suficientes**: é preciso um **spec de "canonical JSON v1"** com vetores de teste, pinado antes de qualquer crate.
- **Oportunidade não aproveitada pelo plano:** a base SQLite do mobile (`USER_SCHEMA_VERSION = 1`) **ainda não saiu em build nativa** (comentário explícito no código). O DDL não está congelado. O `BackupV2` JSON é o contrato duro de compatibilidade; o `.sql` é **projeção local de storage**. Isso liberta o desktop para um schema próprio — mas recomendo compartilhar o `.sql` por economia, sem tratá-lo como contrato de compatibilidade.
- **Recomendação de forma geral:** o plano está arquiteturalmente coerente e a ordem de fases é sensata. Falta transformar 4 coisas em artefatos concretos antes do código: **canonical JSON v1**, **portas das migrações + fixture de versões antigas**, **inventário da camada `src/lib`** (o que porta para Rust vs o que fica como UI), e **extensão da matriz de capacidades para todas as entidades**.

---

## 2. Inputs Reviewed

| Input | O que é |
|---|---|
| `plano-desktop-flutter-rust.md` | Spec alvo (181 linhas) — escopo, fronteiras, crates, fases 0–7, riscos, decisões em aberto |
| `packages/domain/src/core/domain/*` | calendar, capabilities, knowledge, marketing, projects, workspace, common, ids + `__tests__/invariants.test.ts` |
| `packages/domain/src/core/ports/*` | repositories, integrations, sync, blobs |
| `packages/data/src/*` | schema (v13, 12 migrações), backupSchema (Zod), exportImport (BackupV2), persistentData, dataClient |
| `packages/sync/src/*` | provider, stamp, merge, engine, pairing, transport-bridge, providers/github |
| `packages/contracts/src/*` | serialization (30 LOC, interfaces duplicadas do sync) |
| `packages/application/src` | re-export de `src/core/application/use-cases` (~136 LOC) |
| `packages/navigation/src/*` | engine de pilha/hash (900+ LOC) — fora do escopo do port |
| `packages/design-tokens/src` | índice vazio prático |
| `src/types/*` | entity, navigation, quiz, internship, profile (incl. `SyncIndex`), temple |
| `src/data/empty.ts` | contrato `EmptyDatabase` (25 coleções) |
| `src/lib/*` (5.5k LOC) | schedule (533), contextActions (478), streak, ota, gcal+gcalLogic, difusos |
| `src/lib/db/migrations/user.ts` | DDL v1 da base da usuária (`data_json` híbrido) |
| `src/lib/db/catalogSchema.ts` | DDL do catálogo estático (somente leitura) |
| `desktop/src-tauri/src/lib.rs` | shell Tauri sem lógica (só plugins) — confirmado |
| `desktop/context-desktop/*`, `desktop/spec/*`, `src/desktop/*` | rebuild visual React em andamento (screens: Home 9.2k, KnowledgeGraph 12.3k, Projects 9.2k, Inbox 7.1k, Calendar stub 78B) |
| 67 arquivos de teste / ~6,8k LOC de testes | base de paridade existente (routing, exportImport, otaLogic, gcalLogic, streak…) |

---

## 3. Assumptions And Non-Goals

**Assumptions (substituíveis até a Fase 0):**

- O mobile (React+Capacitor) **não muda** durante as Fases 0–4 — é a referência de paridade e o outro lado do sync.
- O pipeline de catálogo continua em Node (`content/`) e o Rust **só lê** o `.db` resultante (aceito pelo plano).
- Flutter alvo é **desktop** (Windows/macOS/Linux). Flutter web não está no escopo.
- A Linguagem do contrato duro de compatibilidade entre dispositivos é o **BackupV2 JSON**; o `.sql` é projeção local.
- O custo de manter o domínio em TS+Rust existe e é aceito (decisão em aberto nº 4 do plano).

**Non-goals desta análise:**

- Desenhar o schema `.sql` final (entrega da Fase 0 do plano).
- Escrever o spec de backup v2 como artefato de contrato.
- Decidir stack de estado do Flutter (Riverpod/Bloc) — recomendo adiar até a Fase 2; o princípio do plano (estado efêmero só no Flutter) independe da escolha.

---

## 4. Context Alignment

| Dimensão | Evidência revisada | Impacto arquitetural | Suposições / Perguntas |
| --- | --- | --- | --- |
| **Pessoal** | Projeto single-maintainer (usuária = autora). Voz afetuosa, pt-BR, produto recém saído de "separação" dos shells. Preferência declarada: desktop rico, mobile compacto; "não unilateral" (desktop expande mobile). | Custo de manutenção dupla (TS+Rust) é **real** e deve ser minimizado com contratos e fixtures automáticos. Ferramentas de dev simples no desktop (rusqlite > sqlx, um crate por fronteira). | Manutenção de longo prazo do Rust fica com a autora? Precisa de docs em pt-BR do mesmo nível dos `.context/*.md`. |
| **Organização** | Nenhum time/org; CI próprio (`.github/workflows/ci.yml`, `release-desktop.yml`). Regra de boundaries em `check-boundaries.mjs`. Padrão "mobile e desktop são produtos independentes, mesma base conceitual". | Desktop-Flutter é um **novo produto no mesmo repositório**. O CI desktop muda de "build Tauri" para "Flutter+Rust"; o gate de PR atual (lint+test+boundary) não sabe nada de Rust/Flutter — precisa de extensão. | Quem mantém o Rust no futuro? É aceitável depender de `flutter_rust_bridge` como dependência de build (codegen) no CI? |
| **Projeto** | Spec fechada com usuária para Calendário/TCC/Marketing/Docs; essas specs são o insumo dos módulos novos. Hardware de dev: Linux **sem** SDK (Flutter via CI). | O Rust core é o mesmo para todos os módulos; mas cada módulo tem UI própria em Flutter. O ritmo é "portar módulo a módulo" (Fase 3) — coerente. | Nenhum recurso de pacientes (greenfield) por ora — confirmado pelo plano. |
| **Workspace** | Monorepo npm em `packages/*`; `desktop/` Tauri; `apps/mobile`/`apps/desktop`; pipeline de conteúdo Node; GitHub **bloqueado** nesta máquina (npm/PyPI/MS CDN ok); box Linux sem JDK/SDK/Xcode. | `cecistudy-rust/` como workspace Cargo de raiz é viável e não colide com npm. **Verificar antes da Fase 1:** acesso ao crates.io, ao `flutter` SDK (storage.googleapis.com) e ao `rustup` nesta máquina — pode restringir dev local (build só no CI). O pipeline de conteúdo e o `db:verify` continuam como gates. | Crates.io é alcançável? `storage.googleapis.com` (Flutter SDK) é alcançável? Se não, o dev local do Flutter fica só em CI e no escritório da autora. |

---

## 5. Architecture Drivers (ranqueados)

1. **Interoperabilidade de dados (mobile↔desktop)** — o sync/backup não pode quebrar. Driver nº 1; justifica Fase 0 inteira e testes de paridade. *Força: contrato e determinismo.*
2. **Fidelidade de comportamento (paridade cross-língua)** — `tieBreak`, `contentHash`, ordenação, migrações, `makeId`. Erros aqui são silenciosos e custosos (corrompem dado do usuário). *Força: teste de vetores golden + canonical JSON.*
3. **Custo de manutenção dupla do domínio** — toda mudança de schema mobile exige edição coordenada em TS (packages) e Rust (crates) no mesmo PR, com golden atualizado. *Força: contratos + automação de fixtures.*
4. **Delivery speed / escopo** — o plano é grande (editor DOCX, grafo, grade de calendário, marketing studio). Fases por complexidade crescente preservam valor cedo. *Força: primeiro slice enxuto e vertical.*
5. **Simplicidade operacional** — app desktop single-user e offline-first; sem server; sem filas. SQLite + provider GitHub. *Força: evitar sofisticação especulativa (sqlx async, P2P, eventos).*
6. **Experiência de UI rica no desktop** — drag/resize de grade, editor paginado, grafo — justo onde Flutter ganha do webview Tauri. *Força: o que motiva a migração; não é driver de arquitetura de dados.*

Nota: "conformidade/segurança regulatória" não se aplica (app pessoal). Privacidade de dados clínico-adjacentes (diário de estágio) é relevante de forma leve — tudo local, nada na nuvem além do provider GitHub com token do usuário.

---

## 6. Recommended Architecture

Adota-se o plano com **ajustes obrigatórios** (numerados ADR na seção 14). Resumo do desenho recomendado:

**Topologia (igual ao plano, com 3 refinamentos):**

- **Rust** = dono do domínio+capacidades+persistência+sync+integrações; única superfície exposta ao Flutter é o **`cecistudy-ffi`** (crbe da bridge).
- **Flutter** = apresentação; estado de UI efêmero; consulta `capabilityFor` antes de renderizar ação.
- **Contrato de dados** = **BackupV2 JSON** (canônico) como única fonte de verdade entre dispositivos; `.sql` compartilhado como projeção local (ver ADR-04).

**Refinamentos:**

1. **`cecistudy-data` ganha a migração + canonical JSON engine.** O crate não é só "driver + repositórios": precisa (a) das 13 funções de migração espelhando `MIGRATIONS`, incluindo o parse de schedule legado; (b) do stringifier canônico usado por sync e backup; (c) do hash FNV-1a sobre os **bytes canônicos**.
2. **`cecistudy-app` (casos de uso) precisa de um inventário explícito.** Os use-cases reais hoje estão em `src/lib/*` (streak, taskLogic, review/scheduling, quizLogic, noteLogic, gcalLogic, schedule…). Antes da Fase 3, produzir `crates/cecistudy-app/PORT-SURFACE.md` listando cada módulo e classificando: **porta para Rust / fica na UI (Flutter) / fica só no mobile**. Estimar LOC.
3. **Bridge minimal. `cecistudy-ffi` expõe poucos handles tipados** (comandos de use-case) e **passa o plano de dados como JSON opaco** (snapshot export/import, coleções). Não gerar bindings Dart para as 25 entidades — evita drift de codegen e versão pinada de structs. `capabilityFor` entra cedo no FFI.
4. **Thread model:** SQLite single-writer. `rusqlite` atrás de `Mutex` num *worker thread* dedicado, ou `r2d2_sqlite` com `max_size=1`. Chamadas longas (sync, Google) expõem `StreamSink` de progresso na bridge.

**Repositório (conforme plano):**

```
cecistudy-rust/
├── crates/
│   ├── cecistudy-domain/       entidades + invariantes + capacidades + ids + ports (traits)
│   ├── cecistudy-data/         canonical-json, migrações, schema, driver SQLite, backup export/import, repositórios
│   ├── cecistudy-content/      leitura somente-leitura do catálogo `.db`
│   ├── cecistudy-sync/         manifest/package, stamp, merge LWW, engine, provider github (reqwest)
│   ├── cecistudy-integrations/ google calendar (OAuth instaled-app + mapeamento + conflito)
│   ├── cecistudy-app/          casos de uso (facade sobre os crates acima)
│   └── cecistudy-ffi/          flutter_rust_bridge: porta única pra Flutter
apps/desktop-flutter/           (substitui desktop/ e apps/desktop)
```

**Stack:**
- Rust: `serde`/`serde_json`, `rusqlite` (bundled), `reqwest`, `chrono` (verificar fuso), `keyring` (segredos), `thiserror`/`anyhow`, `tracing`.
- Bridge: `flutter_rust_bridge` v2.
- Flutter: SDK estável mais recente; `flutter_local_notifications` (Fase 6).
- CI: adicionar na esquadrilha de jobs do `release-desktop.yml` instalação do Flutter+Rust, codegen da bridge, e um job **golden-parity** que roda `npm run contract:test` + `cargo test --workspace`.

---

## 7. Alternatives Considered

| Opção | Avaliação | Veredicto |
| --- | --- | --- |
| **A — Continuar Tauri 2 + React, com núcleo Rust via Tauri commands** | Mais barato (mantém UI React já em construção: shell/navegação/faculdade feitos; frontend-design skills prontas). Porta do núcleo Rust seria a mesma. Conflita com a decisão explícita da autora de abandonar React no desktop e com os ganhos de UX do Flutter (grade drag/resize, editor paginado). | **Considerada e rejeitada** pela autora (decisão de produto). Manter como trade-off documentado: custo de adoção do Flutter é alto (nova framework + codegen bridge + reescrita de UI) e existe **capital de UI React já aprovado** (shell/faculdade). Se o orçamento apertar, esta é a válvula de escape de menor custo. |
| **B — Flutter com lógica 100% Dart (sem Rust)** | Simples de começar, mas perde libs Rust maduras (DG DOCX/ABNT, crate de sync, HTTP async robusto) e contradiz o princípio declarado de "Rust decide". | Rejeitada — não é só preferência: APP do TCC (DOCX round-trip) e Google Calendar têm suporte Rust forte; Dart FFI para lógica pesada seria mais frágil. |
| **C — `sqlx` (async/compile-time SQL) em vez de `rusqlite`** | `sqlx` traz macros e async; `rusqlite` é síncrono e simples. App desktop single-writer, baixa concorrência → `rusqlite` atrás de um `Mutex`/worker é mais direto. `sqlx` só se precisarmos de queries compiladas complexas. | **`rusqlite` (bundled).** Decidir em ADR na Fase 1; não é bloqueante. |
| **D — Bridge full-typed (bindings para todas as entidades) vs. JSON opaco** | Full-typed: melhor DX, mas codegen grande, versão pinada de ~25 structs, drift alto a cada schema bump. JSON opaco: superfície mínima, contrato natural (mesmo JSON do sync/backup), menos deltas de versão. | **Híbrido:** comandos tipados + plano de dados JSON. Os structs typed são os objetos de dominio (Document, CalendarEvent…) quando fizerem sentido; coleções e snapshots passam como `String`/`Value`. |
| **E — Catálogo: Rust relê o `.db` gerado pelo Node (aceito) vs. gerar no Rust** | Gerar catálogo no Rust duplicaria o pipeline editorial Node (autores, conceitos, técnicas, questões) sem ganho; o `.db` está validado por `db:verify`. | **Aceitar o plano:** Node gera, Rust lê. Garantir no `release-desktop.yml` que o `.db` corrigido é empacotado com o binário. |
| **F — Escopo do `.sql` como contrato partilhado (mobile+Rust)** | O DDL do mobile (`v1`) **não está em release ainda** → é livre para remodelar. Compartilhar `.sql` dá consistência de query nos dois nativos, mas é **desnecessário** para compatibilidade (o contrato duro é o JSON). | **Compartilhar por economia, sem ser contrato.** ADR-04 explora o limpo: projeção local pode evoluir independente (colunas extra de query no desktop) sem tocar o sync. |

---

## 8. System Boundaries

### Dono atual da lógica no TS → distribuição alvo

| Fronteira TS hoje | Fronteira Rust alvo | Observação de análise |
|---|---|---|
| `packages/domain` (entidades + capacidades + ports) | `cecistudy-domain` | ✅ porta 1:1. Incluir: as 9 entidades novas + **entidades legadas de `src/types` que forem usadas no desktop** (course, classNote, task…). Decidir o que entra no crate de domain vs. fica como "tipos de contrato" (ver seção 9). |
| `packages/data` (schema, migrações, backup, repos) | `cecistudy-data` | ✅ porta 1:1 + **migrações + canonical JSON + hash** (refinamento 1). Atenção: `schema.ts` importa `parseLegacySchedule` de `src/lib` — puxar essa função (e seu teste) para o boundary antes do port. |
| `packages/sync` (protocolo, merge, providers) | `cecistudy-sync` | ✅ porta 1:1. GitHub provider → `reqwest`. **Semânticas de ordenação/hash precisam de spec** (seções 8.1 e 12). |
| `packages/contracts` → colapsado em `cecistudy-data` | — | ✅ correto: o conteúdo atual (2 interfaces) é redundante com `packages/sync`. |
| `packages/application` (wrapper fino) + **`src/lib/*` (lógica de uso real)** | `cecistudy-app` | ⚠️ **Gap principal do plano.** Necessário inventário (`PORT-SURFACE.md`) antes da Fase 1. Ex.: `streak.ts` (210 LOC) porta; `copy.ts` (204, i18n/display) fica na UI; `ota.ts` (239) é mobile-only; `celebrate.ts`, `tips.ts` são UI; `gcalLogic.ts` porta (integração). |
| `packages/navigation` | **Flutter Navigator** (não porta) | ✅ declarar fora de escopo: no desktop não existe hash-routing; a pilha é do Flutter. O estado efêmero de UI é do Flutter por princípio. |
| `packages/design-tokens` | Tema Flutter (`ThemeExtension`) | Fora de escopo do port; definir no design system do Flutter (nunca hex raw em classes — vale no Flutter também). |
| `desktop/src-tauri` (plugins shell) | `cecistudy-app`/Flutter (janela, notify, updater) | O shell Tauri não tem lógica para migrar (confirmado no `lib.rs`). Notificação: `flutter_local_notifications`. Auto-update: manter o manifest `latest.json` (mesmo mecanismo de GitHub Releases) — **lógica de checagem/semver no Rust**, UI no Flutter (consistente com o princípio). |
| `src/lib/gcal.ts` + `gcalLogic.ts` (Google Calendar, hoje web-only) | `cecistudy-integrations` | ⚠️ O plano não referencia a implementação TS existente. O port deve **reusar gcalLogic.ts** (mapeamento exam/task → GoogleEvent) e trocar a parte de OAuth: **fluxo web GIS popup → OAuth instaled-app/loopback** no desktop. token → keyring. |
| Catálogo (`content/*`, `src/data/temple`, `src/lib/db/catalogDb.ts`) | `cecistudy-content` | ✅ leitura `.db` via rusqlite. No desktop não usar os facades JS. |

### 8.1 A fronteira mais delicada: determinismo de serialização

Hoje, para ring móbil↔desktop, o mesmo código TS roda nos dois (quando existia). Ao separar para Rust, **todo determinismo do merge/sync depende de reproduzir a semântica exata de JS**:

1. **`tieBreak`** (`stamp.ts:89`) — compara `JSON.stringify(local)` vs `JSON.stringify(remote)` com **`>` de string** (UTF-16 code-unit order, locale default da engine). Rust `r > l` em `String` (`Ord` byte-wise) **não é igual** a UTF-16 code-unit order para não-ASCII; e o escaping de `serde_json` difere do `JSON.stringify` JS (ordem de chaves, `\uXXXX` vs caractere cru, `encodeURIComponent` não entra). **Sintoma possível:** merge não-convergente ou perdedor inconsistente em dados com acentos (muito provável num app pt-BR!).
2. **`hashContent`** (FNV-1a, `provider.ts:92`) — faz hash dos **code-units UTF-16** de `charCodeAt`. Em Rust, ou itera UTF-16 (`input.encode_utf16()`) **ou** define-se que o input é o *canonical JSON em bytes UTF-8* **e o TS também muda**. Não pode ser decision por adivinhação.
3. **Ordenação pós-merge** (`merge.ts:109`) — `localeCompare`. Fixado: codificar que "sort = ordenação por bytes do canonical JSON" nos DOIS lados (muda o TS), com vetores de teste.
4. **`JSON.stringify` de datas e números** — JS serializa `1` → `"1"`, `0.1+0.2` → `"0.30000000000000004"`, `1e21` → `"1e+21"`. Rust `serde_json` produz `"1e21"`. Datas ISO vêm de `new Date().toISOString()` (sempre `Z`). **Fixar um stringifier canônico** (chaves ordenadas, escaping pinado, encoding UTF-8) usado por: `engine.push` (contentHash), `tieBreak`, `exportData`, e por `syncIndex.stableKey`. O TS atual usa `JSON.stringify` cru — **ajustar o TS para o canônico é parte da Fase 0** (mudança pequena e testável, mantida compatível com backups existentes).

> Conclusão: o plano diz "testes de paridade com golden files". A análise endossa, mas exige um artefato anterior: **spec de "canonical JSON v1"** (ordenação de chaves, escaping, bytes de hash) + vetores unitários nos dois lados. Este é o risco nº 1 (seção 13).

---

## 9. Data Model

### Comparação TS ↔ necessário em Rust

**Contrato duro (interoperável):** `BackupV2` JSON (`packages/data/exportImport.ts`) + `SyncIndex`. Coleções atuais (25):

| Entidade (TS `src/types` / backupSchema) | Em `cecistudy-domain`? | Dificuldade do port | Notas |
|---|---|---|---|
| `UserProfile` (+ `photoUrl` data-URL) | tipo contrato | baixa | data-URL: tamanho (foto) — evitar passar por struct typed na bridge; fica no JSON opaco |
| `Course` + `CourseScheduleSlot` | sim | **média** | migração 9 converte `schedule` string → slots via `parseLegacySchedule` (fora do package!) |
| `ClassNote` (rating, conceptIds…) | tipo contrato | média | relacionamentos N–N |
| `Task` | tipo contrato | baixa | `dueDate?` opcional — cuidado com `undefined` vs ausente no JSON |
| `Exam` | tipo contrato | baixa | `weight` string + `weightValue?` numérico |
| `StudySession`, `ReadingItem` (+chapters), `Flashcard` | tipo contrato | baixa/média | `Flashcard.easeFactor` — algoritmo SRS fica no app (se portar/flashcards para Rust) |
| `PsychologyConcept`/`Author`/`Approach` | tipo contrato (dados do usuário) | média | *Não confundir* com catálogo estático (templo). |
| `MaterialItem`, `Technique` (do usuário) | tipo contrato | baixa | |
| `InternshipLog` (+ `supervision`), `LooseNote`, `TccData`, `Sticker`, `QuizSession` | tipo contrato | média | stickers têm catálogo `stickerCatalog` + merge de progresso (`src/lib/stickers.ts`) → portar a lógica de merge ou contract. |
| `StreakData`, `Reminder`, `Onboarding` | tipo contrato | baixa | streak rules em `src/lib/streak.ts` (210 LOC) → `cecistudy-app`. |
| `ReadingProgress`, `savedBookIds`, `bookmarkedCourseIds` | tipo contrato (set) | baixa | merge-set (união) já implementado. |
| `StudyQuestion` (`questions`) | **cuidado** | baixa | `questions` é RECORD_COLLECTION *e* STATIC_BANK. O merge não exporta; repos restauram. Reproduzir semântica de re-seed no Rust. |
| `SyncIndex` (stamps/records/tombstones) | tipo contrato | baixa | já puras. |

**Entidades de domínio novos (módulos desktop) — já modelados em TS (`packages/domain`):**

| Módulo | Entidades | Dificuldade do port | Notas |
|---|---|---|---|
| **Calendário** | `CalendarEvent`, `RecurrenceRule`, `Occurrence`, `Responsibility`, `Subtask`, `PlanningBlock`, `ExecutionRecord` + `CommitmentLevel`/`Status`/`ModuleOrigin` | **alta** | recorrência (daily/weekly/monthly) e ocorrências com overrides são o núcleo; a **grade/drag/resize fica no Flutter**, mas o modelo de instâncias mora no Rust. Spec do Calendário já existe — usar como fonte. |
| **Conhecimento (Docs)** | `Document`, `Block` (10 tipos), `Relation` (kind/proveniência), `Suggestion`, `AssociationPolicy`, `LearningState` | média-alta | grafo + curadoria (Inbox) é lógica Rust (dedup/políticas já testadas em `knowledge.ts`); editor de blocos é UI. |
| **Marketing** | `PositioningProfile`, `ContentIdea`, `ContentBase`, `ChannelVariant`, `Publication`, `MetricSnapshot`, `StrategicInsight` | média | estados editoriais (10 fases) são máquinas de estado → Rust. |
| **Projetos/TCC** | `Project`, `AcademicNode`, `Output`, `Reference`, `Citation`, `MAX_ACTIVE_PROJECTS` | **alta** | invariante (≤5 ativos) portável; o **editor paginado + ABNT + DOCX** é trilha própria (o plano já reconhece). |
| **Workspace** | `Workspace`, `WorkspaceSettings`, `DefaultModule` | baixa | isolamento por `workspaceId` já em migração 12. |
| **Capabilities** | `PlatformCapability` (9 entidades) | baixa — **mas incompleta** | **Gap:** só 9 entidades novas. Para o princípio "Rust decide" valer nas telas legadas (faculdade/estudos/biblioteca/perfil), é preciso estender a matriz para ~todas as entidades persistidas. Recomendo `CapabilityEntity` ampliada + `capabilityFor` com fallback (default conservador) e teste. |

### Vida útil / retenção / migração

- Sem retenção regulatória. Backup = JSON exportado pelo usuário.
- **Migrações são o segundo maior trap:** as 13 funções `MIGRATIONS` (incluindo parse de schedule) precisam de um correspondente Rust **idêntico** e de fixtures de backup **de cada versão antiga** (alguns já existem? `exportImport.test.ts` cobre schema 6→atual; criar fixtures v1..13).

---

## 10. API / Integration Contracts

### Superfície FFI (bridge) — recomendação

```
// comandos tipados (use-cases/consultas)
snapshot_export(reason, workspace_scope) -> String        // BackupV2 JSON canônico
snapshot_import(json) -> ImportReport                      // valida+migra+merge; nunca aplicação parcial
capability_for(entity, platform) -> CapabilityResponse     // o Flutter pergunta antes de renderizar ação
mutate(WriteCommand) -> Ack                                // commands tipados por módulo (ex.: upsert_course, complete_task, plan_block)
sync_status() / sync_pull() / sync_push() -> SyncState     // progresso via StreamSink
gcal_connect() / gcal_status() / gcal_reconcile(...)       // integração
// plano de dados pesado é JSON opaco (coleções, snapshots), nunca struct Dart
```

### Contratos externos

| Integração | Contrato | Observação |
| --- | --- | --- |
| GitHub sync provider | `GET/PUT contents/{path}` + CAS por `sha` blob | Porta 1:1 com `reqwest`. Token: **keyring** (nunca file/Prefs). Rate limit: 5000/h autenticado — ok para volume pessoal; tratar `403`/quotas. |
| Google Calendar | OAuth2 **instaled-app** (loopback URI) + Calendar API `<start>/<eventId>` | Reusar `gcalLogic.ts` (map exam/task→event). Dois fluxos diferentes do web: desktop não tem popup GIS. `external_readonly`/`linked`/`conflict` (port de `integrations.ts`) mantidos. Token refresh em worker Rust. |
| Notificações desktop | `flutter_local_notifications` | Timer dispara no Rust (`cecistudy-app`) no horário de `reminderSettings`; UI mostra. (No web/mobile é timer JS / plugin Capacitor — não porta.) |
| Auto-update | `latest.json` + seu manifest (mesmo do Tauri hoje) | Checagem/semver em Rust; download+apply pode ficar na UI (Flutter) ou no Rust; decidir na Fase 6. Manter assinatura e upgrades sem rebuild. |

### Segredos (identidade/autorização)

- GitHub PAT e Google tokens de acesso/refresh → **OS keychain** (`keyring` crate) no desktop; nunca em arquivo claro.
- A web hoje guarda token Google só em memória (`gcal.ts`) e o GitHub (se usado no web?) — precisa revisitar. Para o desktop o keyring é mandatório (tokens de longa duração).

---

## 11. UI Architecture (Flutter)

- **Shell:** `FlutterApp` com slides/screens por módulo; navegação nativa do Flutter (Navigator/Router), **nunca pilha de domínio**.
- **Estado:** apenas **efêmero** (seleção, painel aberto, aba ativa). Dado de domínio sempre vem do Rust via repositório observável (snapshot + invalidations). Escolha Riverpod/Bloc **adiada até a Fase 2** — definir então com base no padrão de invalidação.
- **Agente de parallelidade:** chamadas Rust em isolate separado (a bridge já roda FFI em worker thread); SQLite single-writer com mutex/thread.
- **Ações condicionais por capacidade:** antes de exibir "editar/apagar", `capabilityFor(entity, 'desktop')`; quando `canEdit=false` (mobile), ocultar/desabilitar a ação. O mesmo Flutter codebase pode rodar ler-consigo no mobile *se* um dia o núcleo Rust for ao mobile (nº 4 do plano); hoje é só desktop.
- **Design tokens:** traduzir `src/index.css` `@theme` para `ThemeExtension` (cores `ceci-*`, tipografia Inter/PJS/DM Serif/JetBrains Mono offline via assets). Nunca hex raw em classes.
- **Acessibilidade:** alvos ≥44px, contraste, labels em pt-BR minúsculo (voz do produto). Reuso da doc de copy/voice.

---

## 12. Validation Strategy (paridade cross-linguagem)

**Camadas:**

1. **Contract tests (TS/Rust) com vetores canônicos.** Um script `scripts/emit-contract-fixtures.mjs` (TS é a luz de verdade por enquanto) grava em `contract/fixtures/`:
   - banco vazio; cada coleção com 3–5 entidades representativas (com acentos, opcionais ausentes, strings fora do ASCII);
   - backups nas versões 1..13 de schema (para migração);
   - um corpus **seedado** de mutações/merges (mesma seed nos dois lados).
2. **Paridade determinística.** Para cada fixture:
   - `export` JSON **byte-idêntico** (após canonical v1) nos dois lados;
   - `import` (migração) idêntico;
   - `contentHash` idêntico;
   - `mergeSyncedDatabases` produce o mesmo `merged` (ids + ordem) e índices iguais;
   - `tieBreak` idêntico para pares de entrada iguais.
3. **Fuzz de convergência (property).** Ambos os lados, seeds iguais: (a) `merge(a,b)==merge(b,a)`, (b) `merge(merge(a,b),c)==merge(merge(a,c),b)` (associatividade estrela), (c) idempotência `merge(x,x)==x`. Se os dois lados passam com os mesmos seeds, alta confiança de equivalência.
4. **Cross-version import:** um backup real (mobile, schema atual) importa no Rust → re-exporta → importa no TS → comparação estrutural igual.
5. **CI:** job `golden-parity` que roda `npm run contract:test` + `cargo test --workspace` no mesmo commit; gate do PR. Atualização de fixture = PR único.
6. **UI (Flutter):** widget tests por screen (render, navegação, capability-driven hiding), e **bridge smoke** (o app de verdade exporta/importa backup no teste de integração da Fase 2).
7. **O projeto ainda não tem ESLint/Prettier;** o gate hoje é `tsc --noEmit` + vitest + boundaries + `content:*`. Para Rust: `cargo fmt --check` + `cargo clippy -- -D warnings` no CI.

---

## 13. Risks (inclui os não citados no plano)

| # | Risco | Severidade | Mitigação |
|---|---|---|---|
| R1 | **Divergência silenciosa de serialização** (canonical JSON: ordenação de chaves, escaping, UTF-16 vs UTF-8, números) → `tieBreak`/`contentHash`/ordenação divergem e o sync corrompe dados | **Crítico** | Spec "canonical JSON v1" + vetores; mudar o TS para o canônico na Fase 0; golden files obrigatórios com gate de CI. **Não existe no plano como artefato.** |
| R2 | **Migrações JS (closures) não portadas** — import de backups antigos falharia no desktop | **Alto** | Portar `MIGRATIONS` 2..13 (+ `parseLegacySchedule`) para Rust com fixtures v1..13. "Extrair DDL → .sql" **não cobre isso**. |
| R3 | **Camada `src/lib` não inventariada** — o plano subdimensiona o "casos de uso"; risco de descobrir apps grandes no meio da Fase 3 | **Alto** | `PORT-SURFACE.md` no início da Fase 1; classificar porta/UI/mobile; estimar LOC. |
| R4 | **Matriz de capacidades incompleta** — o princípio "Rust decide" não vale nas telas legadas (faculdade/estudos/biblioteca) porque a matriz só tem 9 entidades novas | **Médio-Alto** | Estender `CapabilityEntity` p/ entidades legadas; fallback conservador; teste de que toda entidade tem linha. |
| R5 | **OAuth + segredos no desktop** — fluxo web (popup GIS) não existe no desktop; token em storage claro | **Alto** | OAuth instaled-app (loopback) no `cecistudy-integrations`; tokens em keyring. GCal é web-only hoje — não esquecer que não há caminho testado. |
| R6 | **`flutter_rust_bridge` codegen/toolchain no CI** — fonte de drift e falha de build; bindings versionados | **Médio** | codegen num step de CI antes do `flutter build`; commit dos bindings (ou persist em cache) para builds reproduzíveis. |
| R7 | **SQLite single-writer + bridge concorrente** — corrupção/blocking se várias threads escrevem | **Médio** | Mutex/worker thread único; filas para writes; testar estresse na Fase 2. |
| R8 | **Custo permanente de manter TS+Rust** (qualquer schema bump = editar 2 lados + fixtures) | **Médio** (aceito) | Contratos + fixtures automatizados; ADR registrando o custo; reavaliar unificação (nº4) no médio prazo. |
| R9 | **Rebuild visual React em andamento** pode virar trabalho jogado fora | **Médio** | Decisão do plano (nº1): parar calendario/conhecimento/marketing/projetos/inbox em React; usar screens entregues (shell/nav/faculdade) como referência visual, não como código. |
| R10 | **Packaging desktop** (Win .msi / macOS .dmg / Linux .deb) + assinatura + tamanho + deps nativas (SQLite bundled ok; keyring precisa serviço OS) | **Médio** | Reusar a esquadrilha do `release-desktop.yml`; adicionar Flutter+Rust+codegen; instalar no CI. Assinatura permanece gap atual (mesmo do Tauri). |
| R11 | **Catálogo embutido** — `cecistudy-content` precisa do `.db` no pacote e da versão (paridade com `catalog-version.json`) | **Baixo-Médio** | Copiar `public/assets/databases/*.db` no asset do app; checar versão no boot. |
| R12 | **Ambiente local Linux** — GitHub bloqueado; crates.io vs Flutter SDK desconhecidos; sem SDK Xcode. Dev do Flutter limitado | **Baixo-Médio** | Verificar acesso (crates.io, storage.googleapis.com) na Fase 1; caso bloqueado, pipeline de build no CI e dev em outra máquina da autora. |

---

## 14. Decision Log (recomendações)

| ID | Decisão | Status | Drivers | Rationale | Consequências |
|---|---|---|---|---|---|
| ADR-01 | **Canonical JSON v1 antes de qualquer crate** — pinar ordenação de chaves, escaping, bytes de hash; ajustar o TS para usá-lo (sync + backup) | **Proposto** | R1, driver 1/2 | O risco técnico nº1 é implementação de semântica, não golden files soltos | Mudança pequena e teste fica no TS na Fase 0; Rust espelha; gate de CI |
| ADR-02 | **`cecistudy-data` abriga migrações + schedule-parse** (porta de `parseLegacySchedule`) | **Proposto** | R2 | Migração é parte do port e hoje vive fora do boundary | `packages/data` fica self-contained; puxa `schedule.ts` (ou um helper) pro package antes do port |
| ADR-03 | **Extender matriz de capacidades p/ entidades legadas e expô-la cedo no FFI** | **Proposto** | R4 | "Rust decide" precisa valer em tudo que o desktop renderiza | `CapabilityEntity` ampliada; fallback conservador; todo entity tem `capabilityFor` testada |
| ADR-04 | **`BackupV2 JSON` = único contrato de compatibilidade; `.sql` = projeção local compartilhada por conveniência** | **Proposto** | driver 5, R1 | O DDL mobile (v1) não lançou; JSON já é o formato de sync/import | Desktop pode evoluir schema local sem tocar o contrato; mas padrão "data_json" do mobile reaproveitado reduz custo |
| ADR-05 | **Bridge híbrida: comandos tipados + plano de dados JSON opaco** | **Proposto** | driver 3/5, R6 | Menos codegen, menos version drift das 25 entidades | FFI expõe ~10 handles; snapshot/coleções via String |
| ADR-06 | **`rusqlite` (bundled) + single-writer thread** em vez de `sqlx` async | **Proposto** | driver 5, R7 | App single-user, baixa concorrência; simplicidade | Reavaliar se queries compiladas complexas exigirem (improvavelmente) |
| ADR-07 | **OAuth desktop instaled-app + keyring** (`cecistudy-integrations`) para Google; PAT GitHub também em keyring | **Proposto** | R5, privacy | Fluxo web GIS não existe no desktop; tokens de longa duração | Novo fluxo de dev/tests (loopback); garantir refresh |
| ADR-08 | **Auto-update com semver em Rust, UI no Flutter** — mantém `latest.json` atual | **Proposto** | consistência principiológica | "Rust decide, Flutter desenha" vale também p/ updater | Decide na Fase 6; reusar assets/composição atual |
| ADR-09 | **Parar rebuild React nos módulos novos; reter screen entregues só como referência visual** | **Proposto** | R9 | Decisão explícita da autora (plano nº1) | Nada de `desktop/`/`apps/desktop` no produto final; docs de especificação passam a ser spec do Flutter |
| ADR-10 | **Flutter desktp first; navegação/hash do web fora de escopo** (packages/navigation e design-tokens NÃO portam) | **Proposto** | escopo | Flutter Navigator é o shell de navegação; design tokens → `ThemeExtension` | Declarar nos non-goals para ninguém portar `packages/navigation` |

---

## 15. Recommended First Vertical Slice

**Objetivo:** provar o pipeline ponta a ponta (Rust + FFI + Flutter) com o **menor corte vertical** que valida o contrato e o determinismo — o risco nº1 — sem esperar todas as telas.

### Fatia 0 (Fase 0 do plano, endurecida)
1. Spec **canonical JSON v1** + vetores unitários no TS.
2. Extrair `parseLegacySchedule` pro boundary do `packages/data` (mover/hardize).
3. Extrair DDL do `migrations/user.ts` para um `.sql` numerado/versionado (referência, não contrato).
4. `scripts/emit-contract-fixtures.mjs` gerando fixtures v1..13 + coleções representativas + corpus seedado de merges.

### Fatia 1 (núcleo mínimo, sem UI)
- Crates: `cecistudy-domain` (entidades **course/task/profile** + capacidades ampliadas), `cecistudy-data` (canonical JSON, migrações completas, snapshot_export/import), `cecistudy-sync` (**stamp + merge + hash** para as mesmas coleções).
- Critério de saída: `cargo test` + golden parity CI **verdes** para as fixtures da Fatia 0 (export byte-idêntico, migração idêntica, merge idêntico).

### Fatia 2 (bridge + esqueleto Flutter)
- `cecistudy-ffi` com `snapshot_export/import`, `capability_for`, `upsert_course`/`complete_task`.
- App Flutter mínimo: Home (saudação via profile) + Perfil com botão **exportar backup** — o arquivo exportado **precisa ser byte-idêntico** (canonical) ao que o mobile TS exporta para o mesmo estado.

### Fatia 3 (largo, módulo a módulo)
Ordem proposta pelo plano: Home → Faculdade → Estudos → Biblioteca → Calendário (com seus MVPs) → Conhecimento → Marketing → Projetos/TCC (trilha própria). Cada módulo só sai com: use-case Rust + golden parity + widget test Flutter.

---

## 16. Open Questions (bloqueiam decisões — responder durante a Fase 0)

1. **OAuth/segredo desktop:** aceito `keyring` + fluxo instaled-app (ADR-07)? Há conta Google real para testes da autora? Precisa de `.env`/secrets no CI para testes de integração Google?
2. **Esconteúdo do port `src/lib`:** para cada módulo (streak, quizLogic, review, taskLogic, noteLogic, gcalLogic, schedule, internship*), *desktop precisa dele em Rust ou a UI consegue satisfazer com dado cru + regra local?* Ex.: SRS de flashcards — algoritmos permanecem no Rust ou ficam no Flutter? **Isto muda o tamanho de `cecistudy-app`.**
3. **Entidades legadas no domínio:** `Course`, `Task`… entram como tipos-ásperos no `cecistudy-domain` ou ficam como "tipos de contrato" dentro de `cecistudy-data`? (Recomendo: domínio guarda só as 9 novas; legadas ficam como dados de contrato com validação estrutural — reduz retrabalho e preserva o foco.)
4. **Multi-dispositivo real:** o `SyncCheckpoint` (baseRevision/baseBlobSha) hoje é persistido onde? No web/localStorage. Desktop (Rust) deve persistir em SQLite — confirmar que o checkpoint **não é parte do contrato de dados** (é local).
5. **Versão do Rust/maturidade do flutter_rust_bridge:** pinar versão inicial (crates do autofix de template) — recomendado começar com a versão estável mais recente da FRB v2; reavaliar a cada 6 meses.
6. **Release desktop:** manter os 3 targets (Windows/macOS/Linux) desde o início ou só **Linux** primeiro (dev) e ampliar? (Recomendo: CI matriz já existe — manter 3, mas smoke só Linux no início.)
7. **Infra local:** crates.io e Flutter SDK alcançáveis desta máquina? (R12) — determina se o dev de Rust/Flutter acontece aqui ou só em CI.
8. **Semântica de `Approach`/`questions` no merge:** confirmar que o desktop **re-seeds** `approaches`/`questions` igual ao `bootPreload` do web (não participam do backup). Definir o trigger (primeiro boot / reset).

---

## 17. Gap Analysis (resumo executivo do que falta ao plano virar implementação)

| Peça do plano | Estado hoje | Falta |
|---|---|---|
| `cecistudy-domain` (núcleo + capacidades) | TS `packages/domain` pronto (740 LOC) | capacidades ampliadas; decisão do escopo de entidades legadas (Q3) |
| `cecistudy-data` | TS `packages/data` pronto (1k LOC) | **canonical JSON v1**; migrações em Rust; `parseLegacySchedule` no boundary; extração `.sql` |
| `cecistudy-sync` | TS `packages/sync` pronto (840 LOC) | semântica de ordenação/hash pinada; provider github→reqwest; checkpoint local em Rust (Q4) |
| `cecistudy-content` | pipeline Node + `.db` validado | empacotar `.db` no target desktop; versão check |
| `cecistudy-integrations` | só web (gcal.ts/GIS) | **desenho OAuth desktop + keyring**; reusar `gcalLogic.ts` |
| `cecistudy-app` | TS: só wrapper (~136 LOC); real em `src/lib` | **`PORT-SURFACE.md` + inventário** (R3) |
| `cecistudy-ffi` | inexistente | escolha FRB v2 + ADR-05 |
| `apps/desktop-flutter` | inexistente (existe desktop/ Tauri) | setup Flutter; temas; navegação; screens |
| Paridade/CI | 67 testes TS, nenhum cross-lang | harness `contract/` + job `golden-parity` + clippy/fmt |
| ReleaseDesktop | Tauri (msi/dmg/AppImage/deb) | trocar por Flutter+Rust; manter `latest.json` updater |

---

## 18. Handoff To Implementation Planning

**Preservar (contexto que moldou o plano):**
- Mobile TS **não muda** durante Fases 0–4; é a fonte de referência de paridade.
- Contrato duro = BackupV2 JSON; `.sql` é projeção local.
- Voz pt-BR minúscula e acolhedora vale no Flutter; nunca "Ceci" na UI.
- `packages/data` importa hoje `@/lib/schedule` — corrigir boundary na Fase 0 (ADR-02).
- Rust nunca importa React/Capacitor/`__TAURI__`. A regra do `check-boundaries.mjs` se estende por princípio (mesmo sem o script cobrir Rust).
- Builds desktop só na CI (Linux box sem SDK); reusa-se a esquadrilha do `release-desktop.yml`.

**Primeiros artefatos a produzir (nesta ordem):**
1. `plano-impl.md` com as tarefas da Fase 0 endurecida (ADR-01..04).
2. spec "canonical JSON v1" + vetores.
3. `PORT-SURFACE.md` (inventário `src/lib` fontable para Rust).
4. `scripts/emit-contract-fixtures.mjs` + harness de paridade.
5. Setup `cecistudy-rust/` (workspace vazio, clippy/fmt no CI) e `apps/desktop-flutter` (skeleton) — **antes** do primeiro crate de domínio profundo.

**Próximo skill sugerido:** `planning-and-task-breakdown` (quebrar Fase 0/1 em tarefas executáveis) ou `spec-driven-development` (formalizar o canonical JSON + contratos como spec antes de codificar).