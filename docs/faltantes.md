# O que ainda falta no cecistudy ♡

> Documento consolidado de lacunas e próximos passos (2026-08-25).
> Complementa `.context/backlog.md` (fases já implementadas lá não repetidas aqui em detalhe).
> Fontes: auditoria de ligação de dados (sessão "leitura inteligente + acervo"), follow-ups
> das fases 12/21, e itens abertos do backlog original.

---

## 1. Ligação de dados (tema em andamento)

### ✅ Recém-implementado
- Duplicata de obra no `ReadingWizard` contra estante pessoal **e** catálogo da biblioteca
  (`src/lib/readingMatching.ts` + cards de sugestão no passo "obra").
- Autor com autocomplete + criação direta (`src/components/ui/AuthorSuggestInput.tsx`).
- Acervo do templo nos wizards via "copiar ao selecionar"
  (`src/lib/acervoBridge.ts`, `useAcervoTheory.ts`, handlers `adoptAcervoConcept/Author`
  no AppContext). Schema intacto, idempotente por nome normalizado.

### 🔴 Falta — pontes que continuam quebradas
| Item | Situação hoje | Ação proposta |
|---|---|---|
| **Leitura ↔ catálogo** | `readings` (estante pessoal) e `savedBookIds`+`readingProgress` (biblioteca) rastreiam progresso do mesmo livro em dois sistemas paralelos, sem join (ids disjuntos `r-*` × `cat-*`). | Ao adotar dados do catálogo no wizard, guardar `catalogId?` opcional em `ReadingItem`; reconciliar progresso entre os dois (ou migrar progresso da biblioteca para a estante). Exigiria bump de schema leve (campo opcional não precisa migração). |
| **Autor vazio nos fluxos rápidos** | `InternshipLogCard.tsx:175` e `SupervisionView.tsx` criam leitura com `author: ''` — exibição foi corrigida com fallback, mas os dados continuam vazios/inconsistentes ('' × 'autor não informado'). | Normalizar na criação (omitir ou padronizar) e considerar tornar `author` opcional em `ReadingItem`. |
| **Técnicas do templo** | 136 técnicas canônicas são somente-leitura; a entidade pessoal `Technique` (`handleAddTechnique`) existe mas nenhuma ponte acervo→pessoal foi feita (só conceitos e autores). | Replicar o padrão `adoptAcervo*` para técnicas quando houver tela que selecione técnica pessoal. |
| **Rota `#/novo/conceito` órfã** | A rota existe no roteador (`routing.ts`) mas nada navega para ela; QuickAddModal não tem opção "conceito". | Adicionar "conceito" ao QuickAdd/FAB (hoje só dá pra criar via transformação de nota). |
| **Conceitos adotados sem abordagem** | O índice do templo (`TempleConceptIndexEntry`) não traz `approachIds`; conceitos copiados ficam sem `approachId` (tags marcam o domínio). | Se quiser vínculo completo, carregar o corpo do domínio sob demanda ao adotar (custo: chunk grande) ou resolver via registry por slug. |

### 🟡 Polimento do que ficou pronto
- Cards de duplicata do wizard não têm botão explícito "criar assim mesmo" — hoje salvar
  direto funciona, mas um dismiss deixaria a intenção clara.
- Matching do wizard cobre livros (`catalogBooks` + `interdisciplinaryBooks`); artigos
  (`articles`, tipo `artigo`) ainda não entram nas sugestões.
- Cache do `resolveIds` (`useAcervoTheory`) vive só enquanto o wizard está montado;
  reabrir readota pelo caminho idempotente (correto, mas vale saber).

---

## 2. Produto / UX

- **HomeView ("Hoje") ainda tem dados dummy**: "aulas de hoje", "assuntos a estudar" e meta
  diária não derivam do estado real (pendência antiga do backlog §9/Fase 8).
- **EstudosView**: sub-tabs além de leituras (questões/revisões) seguem sem conteúdo próprio.
- **F10 — estratégia de busca da Biblioteca** (item vs coleção): decisão de produto
  pendente, documentada em `docs/manual-findings.md`.
- **F9 — permissões no onboarding (web)**: switches aparecem como controles funcionais
  mas são no-op no navegador; virar informação visual sem affordance de toggle.
- **Ícone/splash provisórios**: arte definitiva da marca ainda não substituiu o "C"
  provisório (`assets/*.svg` → `cap:assets`).

---

## 3. Nativo / release

- **Assinatura para publicação**: keystore Android (`*.jks` + secrets GH) e signing iOS
  (conta Apple + provisioning). Sem isso, releases saem debug/unsigned.
- **Primeiro run do workflow de release** de ponta a ponta (APK/IPA/desktop + OTA) ainda
  não validado com secrets reais.
- **OTA**: precisa de uma build nativa com o plugin embutido para o dispositivo começar
  a receber updates; setup Pages (Source: GitHub Actions) é manual único.
- **Edge swipe-back (iOS)**: transição interativa plena (tela anterior visível) exigiria
  plugin Swift + rebuild — hoje a tela atual acompanha o dedo (JS puro, vai por OTA).
- **Validação em device real** pendente: quiz pós-correção do P0, swipe-back no iPhone,
  teclado/resize no Android.

---

## 4. Qualidade / infra

- **ESLint/Prettier como gate**: `npm run lint` continua sendo só `tsc --noEmit`.
- **Cobertura de testes**: wizards novos têm lógica pura testada (`readingMatching`,
  `acervoBridge`), mas faltam testes de componente para `ReadingWizard`,
  `AuthorSuggestInput`, `useAcervoTheory` (integração), `QuickAddModal` e
  `GlobalSearchModal`.
- **`uuid@7.0.3`** (transitivo de `@capacitor/cli`→`xcode`): 3 vulns moderadas; aguardar
  atualização da cadeia da CLI (não rodar `audit fix --force`).
- **Bundle**: `BibliotecaView` chunk ~5 MB (gzip ~600 kB somando facade) — split lazy por
  coleção/família segue documentado como follow-up da Fase 12.
- **Docs drift**: `.context/components.md` e trechos do `.context/backlog.md` podem ficar
  atrás do código; `types.ts` permanece a fonte da verdade.

---

## 5. Ordem sugerida

1. **Ponte leitura ↔ catálogo** (`catalogId` + reconciliação de progresso) — fecha o
   último buraco grande da ligação de dados.
2. **Conceito no QuickAdd** (rota órfã) — porta de entrada barata e de alto valor.
3. **HomeView derivada de dados reais** — última parte dummy do app.
4. **Assinatura + primeiro release completo no CI** — destrava distribuição real.
5. **ESLint/Prettier no gate + testes dos wizards novos** — consolida qualidade antes de
   novas features.
6. Técnicas do templo adotáveis + artigos no matching de leitura (quando houver UI que
   precise).
