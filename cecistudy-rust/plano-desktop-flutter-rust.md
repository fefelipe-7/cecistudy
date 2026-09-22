# cecistudy desktop — separação e base arquitetural (Flutter + Rust)

**Escopo:** abandonar Tauri + React no desktop. Novo desktop = Flutter (apresentação) + Rust (tudo o resto). Mobile (React + Capacitor) continua como está. Os dois se comunicam por um contrato de dados único, de forma não unilateral: o desktop expande o mobile, não o substitui nem o espelha.

**Princípio que organiza todo o resto deste documento:**

> Rust é dono de domínio, dados, sync, integrações externas e regras de capacidade. Flutter só desenha o que o Rust já decidiu e serve — nunca decide sozinho se algo pode ser visto, criado, editado ou apagado.

---

## 1. Diagnóstico — o que já existe e vira a base

Isso não é uma migração de UI só. É a formalização de uma base que, em grande parte, **já existe em TypeScript** e precisa ser traduzida para Rust, não desenhada do zero.

### 1.1 O que o Tauri é hoje

`desktop/src-tauri/src/lib.rs` não tem lógica nenhuma — só registra plugins nativos (notificação, updater, window-state). O app inteiro roda como bundle React dentro do WebView. Ou seja: **não existe "lógica Tauri" para migrar**, existe lógica React/TS para portar.

### 1.2 A verdade canônica de hoje (TypeScript)

| Package | Responsabilidade | Vira, em Rust |
|---|---|---|
| `packages/domain` | Entidades, invariantes, máquinas de estado | `cecistudy-domain` |
| `packages/data` | Persistência (hoje `localStorage` no web/desktop, SQLite no mobile via Capacitor) | `cecistudy-data` |
| `packages/sync` | Protocolo de sync (`SyncManifest`/`SyncPackage`, merge LWW, providers) | `cecistudy-sync` |
| `packages/contracts` | Serialização/validação (Zod) do contrato de backup | Vira parte do `cecistudy-data` (serde) |

### 1.3 Módulos de domínio já implementados (não são specs em vazio)

`packages/domain/src/core/domain/`:

- **`calendar.ts`** — `CalendarEvent`, `RecurrenceRule`, `Occurrence`, `Responsibility`, `Subtask`, `PlanningBlock`, `ExecutionRecord`, `CommitmentLevel`, `CalendarItemStatus`. Já bate 1:1 com a spec de Calendário fechada com a Ceci.
- **`knowledge.ts`** ("Docs") — `Document`, `Block`, `Relation`, `Suggestion`, `AssociationPolicy`, `LearningState`. Grafo de conhecimento + curadoria (Inbox).
- **`marketing.ts`** — `PositioningProfile`, `ContentIdea`, `ContentBase`, `ChannelVariant`, `Publication`, `MetricSnapshot`, `StrategicInsight`. Studio de Marketing e Posicionamento.
- **`projects.ts`** ("TCC") — `Project`, `AcademicNode`, `Output`, `Reference`, `Citation`, limite de 5 projetos ativos. Já bate 1:1 com a spec de TCC.
- **`workspace.ts`** — `Workspace` isolado por padrão, com `defaultModule`.
- **`capabilities.ts`** — **a peça mais importante para este plano.** Já existe uma matriz `{ entity, platform, canView, canCreate, canEdit, canDelete, projection }` com `projection: 'compact' | 'standard' | 'rich'`, consultada via `capabilityFor(entity, platform)`. Isso é exatamente o mecanismo de "desktop rico / mobile compacto, mesma base de dados" que orienta esta migração — só precisa ser portado, não reinventado.

Não existe um módulo de "Pacientes". O que existe é um agrupamento anonimizado por paciente dentro do diário de Estágio (`internship.ts`) — case tracking simples, não um CRM clínico. Se vocês quiserem um módulo de verdade para isso, é greenfield.

### 1.4 Persistência e conteúdo

- **Catálogo** (autores, conceitos, abordagens, técnicas, banco de questões): gerado por pipeline Node em `content/build-catalog.mjs`, embutido como `.db` SQLite somente leitura. **Reaproveitado sem mudança** — o pipeline continua em Node (build-time), o Rust só abre o `.db` resultante.
- **Banco da usuária**: hoje SQLite normalizado só no mobile (`src/lib/db/migrations/user.ts`, migrações numeradas). O desktop nunca teve isso — sempre foi `localStorage`. **Esta migração é a oportunidade de dar ao desktop um banco de verdade, igual ao do mobile.**

### 1.5 Sync

`packages/sync`: protocolo próprio com `SyncManifest`/`SyncPackage`, revisão monotônica com CAS (compare-and-swap) por SHA, provider GitHub funcional (HTTP simples), provider P2P via WebRTC/Trystero **pausado** (não está pronto nem no mobile hoje).

### 1.6 Esforço paralelo em andamento (atenção)

Existe um rebuild visual-only do desktop em React já rodando (`desktop/context-desktop/REBUILD-DESKTOP-CAPABILITY-MAP.md`): `shell`, `navegação` e `faculdade` já foram refeitos e aprovados; `calendario`, `conhecimento`, `marketing`, `projetos`, `inbox` seguem pendentes. Esse trabalho **não toca `packages/*`** — é puramente visual. Decisão em aberto na seção 9.

---

## 2. A fronteira nova — o que fica em cada lado

### Rust (núcleo — único dono de lógica e dado)

- Domínio: entidades, invariantes, máquinas de estado (porta de `packages/domain`).
- Persistência: SQLite via `rusqlite`/`sqlx`, migrações, acesso ao catálogo.
- Sync: protocolo, merge LWW, providers (GitHub hoje; P2P depois).
- Integrações externas: Google Calendar bidirecional (auth, mapeamento de ID, conflito) e qualquer integração futura.
- Matriz de capacidades: `capabilities.ts` portada — o Rust decide o que cada plataforma pode ver/criar/editar/apagar; o front consulta, nunca decide sozinho.
- Casos de uso (application layer): orquestra domínio + dados + sync, é a única superfície exposta ao Flutter.

### Flutter (apresentação — sem lógica de negócio)

- Telas, widgets, navegação, tema, animação, interações (drag/resize da grade do calendário, editor paginado do TCC, etc. — tudo isso é *apresentação*, mesmo sendo sofisticado).
- Chama a API do núcleo Rust via bridge. Antes de mostrar uma ação (editar, apagar), consulta a capacidade — não embute regra de "sou desktop, posso tudo" no código Dart.
- Estado de UI efêmero (o que está selecionado, painel aberto, aba ativa) fica só no Flutter — não é dado de domínio, não sincroniza.

---

## 3. Estrutura de repositório proposta

```
cecistudy-rust/                  (novo workspace Cargo)
├── crates/
│   ├── cecistudy-domain/        entidades + invariantes + máquinas de estado
│   ├── cecistudy-data/          SQLite (driver, migrações, repositórios, backup export/import)
│   ├── cecistudy-content/       acesso somente-leitura ao catálogo (.db gerado pelo pipeline Node)
│   ├── cecistudy-sync/          protocolo, merge LWW, providers (github, futuramente p2p)
│   ├── cecistudy-integrations/  Google Calendar e integrações externas futuras
│   ├── cecistudy-app/           casos de uso — orquestra os crates acima
│   └── cecistudy-ffi/           bridge flutter_rust_bridge — única porta de entrada pro Flutter
│
apps/desktop-flutter/            (substitui desktop/ e apps/desktop)
├── lib/
│   ├── screens/                 home, faculdade, calendario, conhecimento, marketing, projetos, inbox, perfil
│   ├── widgets/
│   ├── bridge/                  bindings geradas pelo flutter_rust_bridge
│   └── state/                   estado de UI efêmero (Riverpod ou Bloc)
```

`packages/domain|data|sync|contracts` (TS) continuam existindo **para o mobile**, que não muda nesta fase.

---

## 4. O contrato de dados compartilhado (o que não pode divergir)

| Peça do contrato | Fonte única de verdade | Consumido por |
|---|---|---|
| DDL do banco da usuária | Extrair de `migrations/user.ts` para `.sql` numerado e versionado | TS (mobile) e Rust (desktop) leem o mesmo `.sql` |
| Formato de backup/sync (JSON v2) | Spec formal a escrever a partir de `backupSchema.ts` (Zod) | `serde` no Rust espelha campo a campo o Zod do TS |
| Matriz de capacidades | `capabilities.ts` | Precisa existir **igual** nos dois lados até uma decisão futura de unificação (ver seção 9) |
| Regras de merge (LWW) | `stamp.ts` / `merge.ts` | Portadas para Rust como funções puras, testadas com os mesmos fixtures |

**Testes de paridade (golden files):** o mesmo estado de entrada deve produzir o mesmo JSON de backup nos dois lados. Sem isso, o dia em que Rust e TS divergirem em um detalhe (um campo opcional, um formato de data), o sync quebra silenciosamente entre desktop novo e mobile. Este é o maior risco técnico do projeto — vale mais tempo de validação aqui do que em qualquer tela.

---

## 5. Módulos existentes — o que muda e o que não muda

| Módulo | Lógica hoje | Lógica nova | UI nova | Observação de capacidade |
|---|---|---|---|---|
| Calendário | `calendar.ts` (TS) | `cecistudy-domain`/`cecistudy-integrations` (Rust) | Flutter: grade semanal completa, drag/resize | Mobile mantém agenda compacta com ações restritas (concluir, adiar, cancelar ocorrência) — regra vem da matriz de capacidades |
| Conhecimento (Docs) | `knowledge.ts` | Rust | Flutter: grafo + editor de blocos | Mobile hoje é `compact`/leitura para `concept`/`relation` |
| Marketing | `marketing.ts` | Rust | Flutter: studio completo (canais, calendário editorial) | Mobile pode criar/editar `contentBase`, não apaga |
| Projetos/TCC | `projects.ts` | Rust | Flutter: árvore acadêmica + editor paginado + citações + export DOCX | Mobile é `compact`, só consulta/pendências — confirmado por você: mobile lê conteúdo real, não só metadados |
| Faculdade, Estudos, Biblioteca, Perfil | Espalhado em `src/core`/`src/lib` | Rust | Flutter, telas equivalentes | Módulos mais simples, menor risco de porte |
| Estágio (inclui casos/"pacientes") | `internship.ts` | Rust | Flutter | Sem mudança de escopo — segue sendo agrupamento por caso anonimizado, não um módulo de pacientes |

---

## 6. Google Calendar — desenho específico

Decisão já tomada: **inteiramente no Rust**, com separação estrita de responsabilidade.

- `cecistudy-integrations` possui: autenticação OAuth, mapeamento de ID entre evento cecistudy ↔ evento Google, sincronização bidirecional automática, detecção e resolução de conflito, preservação de versões em conflito.
- O Flutter nunca fala com a API do Google diretamente. Ele recebe do Rust eventos já resolvidos/mapeados, prontos para desenhar na grade, e comandos simples para o usuário decidir em caso de conflito (ex.: `manter_cecistudy`, `manter_google`, `combinar_campos`) — a lógica de o que cada opção significa mora no Rust.
- Isso cobre a regra de propriedade da spec: evento criado no cecistudy e sincronizado é editável nos dois lados; evento importado do Google é somente leitura no cecistudy; responsabilidade vinculada a evento externo nunca altera o evento.

---

## 7. Fases

**Fase 0 — Congelar o contrato (sem código de produto)**
Extrair DDL para `.sql` versionado; formalizar o backup v2 como spec; escrever golden files (fixtures JSON de cada coleção) para teste de paridade cross-língua.

**Fase 1 — Núcleo Rust, sem UI**
Portar `cecistudy-domain` (todas as entidades listadas na seção 1.3, incluindo `capabilities.ts`), `cecistudy-data` (schema + migrações + backup export/import), `cecistudy-sync` (merge + provider GitHub via `reqwest`), `cecistudy-content` (abrir o `.db` do catálogo). Critério de saída: testes de golden-file batem entre TS e Rust.

**Fase 2 — Bridge + esqueleto Flutter**
`flutter_rust_bridge` gerando bindings Dart a partir das structs Rust. App mínimo: abre catálogo, lê/escreve no banco da usuária, renderiza a Home. Valida o pipeline ponta a ponta antes de investir em todas as telas.

**Fase 3 — Portar módulo por módulo**
Ordem sugerida por complexidade/risco crescente: Home → Faculdade → Estudos → Biblioteca → Calendário (usando os MVPs já definidos na spec: domínio → grade desktop → recorrência → integração Faculdade → blocos/timer → camadas visuais → Google Calendar → conflitos → sugestões) → Conhecimento → Marketing → Projetos/TCC (usando as 5 fases de MVP já definidas na spec: projetos/árvore → modelo interno de documento → editor paginado → referências/ABNT → DOCX round-trip).

**Fase 4 — Interoperabilidade real com o mobile**
Export/import de backup (já existe como feature) + provider GitHub em Rust — dá compatibilidade completa de dados com o mobile atual, sem depender de P2P.

**Fase 5 (depois, não bloqueante) — Sync P2P em Rust**
O pareamento via WebRTC/Nostr está pausado até no mobile hoje. Não é pré-requisito de lançamento.

**Fase 6 — Empacotamento**
Build Flutter desktop (Windows/macOS/Linux), notificações (`flutter_local_notifications`), auto-update (mesmo mecanismo de GitHub Releases que o Tauri já usa hoje). Só então `desktop/` (Tauri) e `apps/desktop` (React) saem do repositório.

**Fase 7 — Migração de quem já usa o desktop antigo**
Como o Tauri guarda tudo em `localStorage` do WebView, o caminho seguro é: usuária exporta backup no app antigo (feature já existente) → importa no app novo, usando a mesma rotina validada na Fase 0/1.

---

## 8. Riscos

| Risco | Mitigação |
|---|---|
| Rust e TS divergirem em um detalhe do contrato e quebrarem o sync silenciosamente | Golden files obrigatórios desde a Fase 0; qualquer mudança de schema atualiza os dois lados no mesmo PR |
| TCC (editor paginado + round-trip DOCX + engine de citação ABNT) é um projeto do tamanho de um editor de texto por si só | Tratar como trilha própria dentro do plano, não como "mais uma tela"; seguir as 5 fases de MVP já definidas na spec, sem pular pra funcionalidades pós-MVP |
| Sync P2P em Rust (WebRTC/Nostr) é esforço grande | Não é bloqueador — GitHub provider já resolve interoperabilidade no dia 1 |
| Rebuild visual React em andamento pode virar trabalho jogado fora | Ver decisão pendente abaixo |
| Duas implementações do domínio (Rust para desktop, TS para mobile) mantidas por tempo indefinido | Aceitar como custo consciente por ora; reavaliar unificação (ex.: Rust também no mobile via Flutter) depois que o desktop estiver estável |

---

## 9. Decisões em aberto

1. **Rebuild visual React em andamento** — `calendario`, `conhecimento`, `marketing`, `projetos`, `inbox` ainda não foram refeitos visualmente em React. Recomendação: **parar agora** esse trabalho nesses módulos específicos (já que serão redesenhados em Flutter de qualquer forma) e não investir mais ali. `shell`/`navegação`/`faculdade` já entregues podem servir de referência visual, mas não como código a portar.
2. **Ponte Flutter↔Rust**: confirmar `flutter_rust_bridge` como abordagem (Rust concentra praticamente toda a lógica, Dart só desenha) — é a opção coerente com o princípio adotado para o Google Calendar, generalizado para o app inteiro.
3. **Módulo de Pacientes**: se for pra existir de fato (histórico clínico, sessões, evolução), é greenfield — não está em nenhuma spec hoje. Precisa de uma spec própria antes de entrar em qualquer fase.
4. **Unificação futura do domínio**: já que o núcleo Rust nasce completo, e Flutter compila pra Android/iOS também, vale já deixar registrado como possibilidade de médio prazo (não é decisão para agora): eventualmente usar o mesmo núcleo Rust no mobile também, eliminando a manutenção dupla do domínio em TS e Rust.
