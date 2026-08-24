# Plano de migração SQL e catálogo modular do Cecistudy

## Diagnóstico do projeto enviado

O projeto é um app React/Vite empacotado com **Capacitor 8** para iOS e Android. A camada atual tem uma intenção boa — uma interface `storage` única e um backup JSON versionado —, mas a persistência de domínio ainda é fragmentada: cada coleção é serializada e gravada de forma independente em chaves `cecistudy_*`. No app nativo, essas chaves chegam ao `@capacitor/preferences`; no web, chegam ao `localStorage`.

Isso funciona para preferências pequenas, mas se torna frágil para o domínio atual: cursos, aulas, tarefas, leituras, flashcards, sessões, registros de estágio, TCC, conceitos, autores, abordagens, técnicas, questões e tentativas de quiz estão distribuídos em dezenas de JSONs. Uma ação que logicamente deveria ser atômica — por exemplo, concluir uma sessão de estudo e atualizar streak, histórico e conquista — pode gravar múltiplas coleções em operações separadas.

| Área atual | Implementação observada | Limite prático |
|---|---|---|
| Dados da usuária | Estados `usePersistentState` no `AppContext`, um por coleção | Sem transação entre entidades relacionadas e com hidratação assíncrona independente no nativo |
| Questões | JSON único de 745 questões importado em `bancoQuestoes.ts` e regravado no estado persistido | Catálogo grande, monolítico, difícil de editar por grupo e misturado à lógica de estado da usuária |
| Abordagens | 97 abordagens geradas em TypeScript a partir de Markdown e semeadas no contexto | Pipeline existe, mas gera um arquivo TypeScript de aproximadamente 1,1 MB, não um catálogo relacional |
| Livros e artigos | Três JSONs estáticos e uma fachada TypeScript | Catálogo paralelo a `ReadingItem`, com duplicações conceituais e favoritos guardados apenas por IDs |
| Backup | JSON versionado, migrações de payload e validação por Zod | Ótima base, mas ainda exporta uma representação de coleções soltas, não uma base com integridade referencial |
| Configuração | `Preferences` | Uso adequado para lembrete, onboarding, tema e pequenos flags; inadequado para todo o domínio |

O Capacitor observa que `localStorage` e IndexedDB em WebViews devem ser tratados como armazenamento transitório; `Preferences` é apropriado para pequenas configurações, enquanto SQLite é recomendado para maior volume e consultas de melhor desempenho.[1] Isso reforça a mudança: **Preferences deve deixar de ser o banco do Cecistudy e passar a ser apenas a área de configurações do app.**

## Decisão de arquitetura

Adotar um modelo **local-first em SQLite**, com duas bases lógicas separadas.

| Base | Conteúdo | Ciclo de vida | Pode ir para backup da usuária? |
|---|---|---|---|
| `cecistudy_catalog.sqlite` | Questões, abordagens, famílias, autores canônicos, conceitos, técnicas, comparações, livros, artigos e metadados de catálogo | Gerada a partir da pasta `content/`; atualizada por release de conteúdo | Não por padrão; só manifesto de versão e itens criados pela usuária |
| `cecistudy_user.sqlite` | Perfil, semestre, disciplinas, aulas, tarefas, avaliações, leituras pessoais, progresso, flashcards pessoais, sessões, quizzes, estágio, TCC, notas e preferências de domínio | Criada no primeiro uso e migrada no aparelho | Sim, integralmente, com schema e versão |
| `Preferences` | Tema, onboarding concluído, lembrete, última versão de catálogo aplicada, flags de UX e chave/ponteiro de segurança | Pequeno e simples | Parcialmente, quando fizer sentido |

O plugin comunitário `@capacitor-community/sqlite` oferece suporte em iOS/Android, transações, migrações incrementais, importação/exportação JSON e APIs para sincronização.[2] Uma alternativa comercial é o plugin SQLite da Capawesome, que agrega migrações, transações, prepared statements, FTS5 e suporte a ORM; deve ser avaliado se você quiser suporte comercial e criptografia gerenciada.[3]

### Princípio: a interface não faz SQL diretamente

O React deve usar casos de uso e repositórios. Em vez de uma tela chamar `setTasks([...tasks, task])`, ela chama `taskService.create(taskInput)`. O serviço abre uma transação e atualiza `task`, `activity_event`, `streak` ou outros agregados necessários. A interface recebe uma consulta pronta para a tela.

```text
React screen
   ↓
use case: createTask / finishFocus / buildQuiz / saveInternshipLog
   ↓
repository: TaskRepository / StudyRepository / CatalogRepository
   ↓
SQLite transaction
   ↓
query models: HomeDashboard / StudyDashboard / CourseDetail
```

## O catálogo modular: conteúdo como blocos LEGO

O repositório deve ganhar uma pasta `content/` na raiz. Ela é a fonte editorial legível, versionada e fácil de revisar em pull request. O app nunca consome essa pasta diretamente em runtime: scripts validam os arquivos, resolvem relações e geram os artefatos do catálogo SQLite.

```text
content/
  README.md
  catalog.manifest.json
  schemas/
    question.schema.json
    approach.schema.json
    author.schema.json
    concept.schema.json
    technique.schema.json
    comparison.schema.json
    work.schema.json
  taxonomies/
    areas.json
    topics.json
    difficulty.json
    question-formats.json
  questions/
    clinica-e-psicoterapias/
      category.json
      tcc/
        distorcoes-cognitivas.questions.json
        formulacao-de-caso.questions.json
      psicanalise/
        transferencia-e-contratransferencia.questions.json
    psicopatologia/
      category.json
      transtornos-de-ansiedade.questions.json
    etica-e-legislacao/
      category.json
      codigo-de-etica.questions.json
  approaches/
    psicodinamicas/
      family.json
      psicanalise-freudiana.json
      psicologia-do-ego.json
    cognitivas/
      family.json
      terapia-cognitiva-beck.json
      act.json
  authors/
    aaron-beck.json
    sigmund-freud.json
  concepts/
    cognitivos/
      distorcao-cognitiva.json
      pensamentos-automaticos.json
    psicodinamicos/
      transferencia.json
  techniques/
    tcc/
      reestruturacao-cognitiva.json
      registro-de-pensamentos.json
  comparisons/
    tcc-vs-rebt.json
    psicanalise-vs-psicologia-do-ego.json
  works/
    books/
      beck-1979-terapia-cognitiva.json
    articles/
      alliance-therapeutic-review-2024.json
```

Essa estrutura resolve a preocupação principal: para adicionar questões, não será preciso tocar em `bancoQuestoes.ts`, importar um JSON gigante ou reordenar arrays. Basta criar ou editar um arquivo de lote em uma categoria já existente, rodar o script e ver a validação indicar IDs inválidos, referências quebradas ou campos faltantes.

### Regras da pasta de conteúdo

| Regra | Decisão |
|---|---|
| Formato de autoria | JSON formatado com 2 espaços; evita adicionar um parser YAML e facilita validação nativa no Node |
| ID | Slug estável e semântico, por exemplo `q-tcc-distorcao-001` ou `app-tcc-beck` |
| Relações | Sempre por IDs; nunca por nome livre em campos de relação |
| Categoria | `category.json` define id, título, ordem, cor e taxonomia permitida |
| Lote | Arquivo `*.questions.json` contém uma coleção de questões relacionadas, não uma questão por arquivo |
| Conteúdo rico | Texto longo permitido em Markdown, mas metadados devem ficar estruturados |
| Arquivo removido | O builder detecta remoção e exige decisão explícita: desativar, substituir ou excluir |
| Qualidade | Todo conteúdo passa por schema, unicidade de ID, integridade de relações, auditoria de taxonomia e testes de contagem |

### Exemplo: grupo de questões editável

```json
{
  "schemaVersion": 1,
  "group": {
    "id": "qg-tcc-distorcoes-cognitivas",
    "title": "Distorções cognitivas",
    "categoryId": "clinica-e-psicoterapias",
    "topicIds": ["topic-distorcoes-cognitivas"],
    "approachIds": ["app-tcc-beck"],
    "source": "catálogo editorial Cecistudy",
    "status": "published"
  },
  "questions": [
    {
      "id": "q-tcc-distorcao-001",
      "stem": "Em uma formulação cognitiva, qual exemplo representa catastrofização?",
      "format": "multiple_choice",
      "difficulty": "intermediate",
      "knowledgeType": "conceitual",
      "options": [
        { "id": "a", "text": "Considerar várias hipóteses possíveis", "isCorrect": false },
        { "id": "b", "text": "Antecipar o pior desfecho como certo", "isCorrect": true },
        { "id": "c", "text": "Registrar evidências favoráveis e contrárias", "isCorrect": false }
      ],
      "explanation": "A catastrofização antecipa um resultado extremo e negativo como inevitável.",
      "topicIds": ["topic-distorcoes-cognitivas"],
      "approachIds": ["app-tcc-beck"],
      "authorIds": ["author-aaron-beck"],
      "referenceIds": ["work-beck-1979-cognitive-therapy"],
      "reviewStatus": "reviewed"
    }
  ]
}
```

### Exemplo: abordagem e comparação

```json
{
  "id": "app-tcc-beck",
  "familyId": "family-cognitive-behavioral",
  "name": "Terapia Cognitiva de Beck",
  "shortName": "TCC",
  "summary": "Abordagem focada na relação entre interpretações, emoções e comportamento.",
  "sections": {
    "definition": "...",
    "centralIdea": "...",
    "clinicalPractice": "...",
    "evidenceAndDebates": "..."
  },
  "authorIds": ["author-aaron-beck"],
  "conceptIds": ["concept-thoughts-automatic", "concept-cognitive-distortion"],
  "techniqueIds": ["technique-cognitive-restructuring"],
  "workIds": ["work-beck-1979-cognitive-therapy"],
  "relatedApproachIds": ["app-rebt"]
}
```

Uma comparação fica em um arquivo independente porque é uma relação editorial própria, e não apenas uma lista de IDs dentro de cada abordagem. Isso evita duplicar texto e permite mostrar a mesma comparação no Mapa da Biblioteca, numa revisão e numa questão.

## Scripts que o projeto precisa ganhar

| Comando | Objetivo | Saída |
|---|---|---|
| `npm run content:check` | Varre a pasta e valida schemas, IDs, taxonomias e relações | Relatório legível; falha se existir erro |
| `npm run content:report` | Gera estatísticas por área, tema, abordagem, dificuldade e status de revisão | `build/content-report.json` e resumo no terminal |
| `npm run content:build` | Valida e compila os dados editoriais | `resources/catalog/cecistudy_catalog.sqlite` + manifesto/hashes |
| `npm run content:diff` | Compara a fonte com o último catálogo gerado | Lista de inserts, updates, desativações e relações alteradas |
| `npm run content:seed-dev` | Cria uma base de desenvolvimento com conteúdo e dados de exemplo separados | Banco local para testes manuais |
| `npm run db:migrate` | Executa migrações estruturais da base da usuária | Atualiza `cecistudy_user.sqlite` |
| `npm run db:legacy-import` | Converte backup/Preferences antigos para SQLite | Relatório de migração por coleção |
| `npm run db:verify` | Verifica foreign keys, contagens e invariantes | Falha de CI se a base estiver inconsistente |

### Como o builder funciona

1. Lê `content/catalog.manifest.json` e todos os arquivos reconhecidos.
2. Valida cada documento em Zod ou JSON Schema.
3. Constrói índices temporários de IDs e rejeita duplicatas.
4. Resolve `authorIds`, `approachIds`, `conceptIds`, `topicIds`, `techniqueIds` e `workIds`.
5. Gera transações SQL de inserção/atualização para `cecistudy_catalog.sqlite`.
6. Cria `catalog_release` com versão, hash, data e contagens.
7. Gera um manifesto de atualização para o app saber se precisa aplicar um novo release de catálogo.

O script deve usar uma transação única e uma tabela de staging. Se uma questão referenciar `app-tcc-bek` em vez de `app-tcc-beck`, o build falha antes de gerar banco incompleto.

## Modelo SQL recomendado

### 1. Banco de catálogo

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE catalog_release (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  built_at TEXT NOT NULL,
  source_schema_version INTEGER NOT NULL
);

CREATE TABLE approach_family (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  color TEXT
);

CREATE TABLE approach (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES approach_family(id),
  name TEXT NOT NULL,
  short_name TEXT,
  summary TEXT,
  detail_markdown TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  source_path TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE author (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  biography TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  source_path TEXT NOT NULL
);

CREATE TABLE concept (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition TEXT NOT NULL,
  source_path TEXT NOT NULL
);

CREATE TABLE technique (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  source_path TEXT NOT NULL
);

CREATE TABLE topic (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL REFERENCES area(id),
  parent_id TEXT REFERENCES topic(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE area (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE question_group (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_path TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE question (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES question_group(id),
  stem TEXT NOT NULL,
  format TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  knowledge_type TEXT,
  explanation TEXT,
  source TEXT,
  review_status TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE question_option (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  UNIQUE(question_id, position)
);

CREATE TABLE question_topic (
  question_id TEXT REFERENCES question(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES topic(id),
  PRIMARY KEY (question_id, topic_id)
);

CREATE TABLE question_approach (
  question_id TEXT REFERENCES question(id) ON DELETE CASCADE,
  approach_id TEXT REFERENCES approach(id),
  PRIMARY KEY (question_id, approach_id)
);

CREATE TABLE question_author (
  question_id TEXT REFERENCES question(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES author(id),
  PRIMARY KEY (question_id, author_id)
);
```

Além dessas tabelas, o catálogo deve incluir `work`, `work_author`, `work_topic`, `approach_author`, `approach_concept`, `approach_technique`, `comparison`, `comparison_side` e um índice FTS5 para busca textual de abordagem, conceito, técnica, autor, obra e questão. O uso de FTS5 é suportado pela alternativa Capawesome; caso você escolha o plugin comunitário, verifique a disponibilidade de FTS na versão embutida antes de torná-la requisito.[3]

### 2. Banco da usuária

| Domínio | Tabelas principais | Relações que resolvem o estado solto atual |
|---|---|---|
| Perfil e calendário | `user_profile`, `semester`, `course`, `course_schedule`, `class_session` | Disciplina passa a ter muitas aulas/horários, em vez de uma string `schedule` |
| Organização | `task`, `task_link`, `assessment`, `assessment_topic` | Tarefa pode se ligar a aula, TCC, estágio, leitura ou supervisão |
| Estudos | `study_session`, `flashcard`, `flashcard_review`, `quiz_session`, `quiz_answer` | A resposta de quiz aponta para a questão de catálogo por ID, sem salvar a questão inteira como snapshot obrigatório |
| Leituras pessoais | `reading`, `reading_progress`, `reading_note`, `reading_highlight` | Progresso de catálogo e leitura da usuária deixam de competir em coleções paralelas |
| Notas | `note`, `note_link` | Uma nota pode se conectar a curso, conceito, abordagem, material, estágio, TCC ou tarefa sem vários arrays de IDs no documento |
| Estágio | `internship`, `field_activity`, `supervision_meeting`, `supervision_question`, `placement_deliverable` | Horas, atividade, encaminhamentos e supervisão ficam separados e pesquisáveis |
| TCC | `thesis_project`, `thesis_chapter`, `reference`, `thesis_evidence`, `thesis_task` | Referência e evidência podem sustentar capítulos específicos |
| Progresso | `activity_event`, `achievement`, `user_achievement`, `saved_catalog_item` | Streak e stickers passam a ser derivados/auditáveis, e favoritos deixam de ser arrays de IDs |

Para privacidade, os registros de estágio devem evitar campos identificáveis de terceiros. A tabela pode ter `subject_alias` opcional para iniciais, mas não deve ser tratada como prontuário. Dados de observação e reflexão devem ser incluídos somente se a política da instituição permitir e se a base tiver proteção adequada.

### Mudanças importantes em campos atuais

| Campo atual | Situação | Modelo novo |
|---|---|---|
| `Course.schedule` | String não consultável | `course_schedule` com dia da semana, início, fim e local |
| `ClassNote.conceptIds[]` | Array dentro do registro | `note_link` ou `class_note_concept` |
| `PsychologyAuthor.majorWorks[]` | Texto sem entidade | `work` + `work_author` |
| `PsychologyConcept.authorIds[]` | Array sem integridade | `concept_author` |
| `Question.escolaOuAbordagem` | Texto livre e inconsistente | `question_approach` para IDs canônicos |
| `Question.tema/subtema` | Strings inconsistentes | `topic` hierárquico + `question_topic` |
| `ReadingProgress` | Mapa `bookId → páginas` separado | `reading` ou `reading_progress` normalizado |
| `savedBookIds` | Array sem metadados | `saved_catalog_item` com data, item e tipo |
| `TccData.references[]` | Strings sem identificação | `reference` + `thesis_evidence` |
| `StreakData.activeDays[]` | Estado derivado salvo | `activity_event`; streak calculada por consulta ou materialização controlada |

## Estratégia de migração sem perder dados

O projeto já possui `SCHEMA_VERSION`, migrações de backup e validação por Zod. Esse investimento deve ser preservado, não descartado.

| Fase | Ação | Proteção contra perda |
|---|---|---|
| A. Preparar | Introduzir SQLite e repositórios ainda sem mudar telas | Testes de banco e schema em CI |
| B. Catálogo | Gerar e embutir `cecistudy_catalog.sqlite` a partir de `content/` | `content:check`, hashes e relatórios de contagem |
| C. Usuária | Criar `cecistudy_user.sqlite` vazio e repositórios de leitura | App continua lendo coleção legada durante uma janela controlada |
| D. Importar legado | Ler todas as chaves `cecistudy_*`, normalizar e inserir em uma transação | Backup automático antes; tabela `legacy_import_map`; rollback se qualquer etapa falhar |
| E. Verificar | Comparar contagens e relações depois da importação | Tela de resumo: tarefas, aulas, leituras, sessões, TCC e estágio preservados |
| F. Virar fonte de verdade | Telas passam a consultar SQLite; legado fica somente leitura | Flag de migração concluída e telemetria local de falha |
| G. Limpar | Depois de versões estáveis, remover coleções legadas | Backup exportável permanece compatível por um período definido |

As migrações SQL devem ser numeradas e transacionais, por exemplo `db/migrations/user/001_init.sql`, `002_add_quiz.sql` e `003_normalize_readings.sql`. O app registra a última versão aplicada em `schema_migrations`. Nunca se deve usar uma única `SCHEMA_VERSION` para misturar mudanças de conteúdo e mudanças de dados da usuária: `user_schema_version` e `catalog_release.version` são responsabilidades diferentes.

## Importação e exportação na nova arquitetura

O backup da usuária deve continuar sendo JSON ou ZIP, pois esse formato é fácil de portar, revisar e compartilhar pelo iOS Files. A diferença é que ele passa a ter uma estrutura explícita de `metadata`, `userData` e versões de schema, em vez de espelhar diretamente chaves de UI.

```json
{
  "format": "cecistudy-user-backup",
  "formatVersion": 1,
  "userSchemaVersion": 3,
  "catalogRelease": "2026.08.0",
  "exportedAt": "2026-08-20T12:00:00.000Z",
  "payload": {
    "profile": { "...": "..." },
    "courses": [],
    "tasks": [],
    "readings": [],
    "studySessions": [],
    "quizSessions": [],
    "internships": [],
    "thesis": { "...": "..." }
  }
}
```

No import, o app precisa mostrar uma prévia antes de substituir dados: versão, data do backup, número de disciplinas, leituras, tarefas, sessões e registros de estágio. A importação acontece numa transação em uma base temporária; só troca a base ativa após validação completa. O catálogo não precisa ser importado porque vem de release próprio, mas IDs de itens de catálogo precisam ser preservados para que favoritos, respostas de quiz e vínculos de notas continuem válidos.

## Roadmap de implementação sugerido

| Ordem | Entrega | Resultado concreto |
|---|---|---|
| 1 | Fundação SQLite e repositórios | O app abre as bases e executa migrações sem alterar visual |
| 2 | `content/` + builder de questões e abordagens | Novo arquivo de grupo passa por validação e entra no catálogo sem editar TypeScript manualmente |
| 3 | Catálogo de questões e quiz em SQLite | Filtros de quiz usam áreas, temas e abordagens canônicos; tentativas persistem por ID |
| 4 | Migração de cursos, aulas, tarefas, leituras e flashcards | Dados da aluna saem de `Preferences` sem alteração de UX |
| 5 | Export/import v2 e backup protegido | Usuária consegue restaurar dados com prévia e validação |
| 6 | Estágio, TCC e notas relacionais | Links entre campo, supervisão, estudo e TCC passam a ser possíveis |
| 7 | Busca unificada e sync opcional | Pesquisa em catálogo e dados pessoais; nuvem somente quando o modelo local estiver estabilizado |

## Decisões que precisam ser tomadas antes de codar

1. **Editor de conteúdo:** você quer que a equipe edite JSON no repositório, ou também quer uma futura tela administrativa? Minha recomendação é começar com JSON + validação + pull request; é mais rápido e muito mais seguro para catálogo acadêmico.
2. **Critério de inclusão de conteúdo:** quem aprova uma questão ou abordagem antes de `status: published`? O sistema deve admitir `draft`, `reviewed`, `published` e `deprecated`.
3. **Atualização de catálogo:** conteúdos novos chegam por atualização de app, OTA ou ambos? É preciso definir isso porque catálogo e banco local precisam de uma política de release.
4. **Criptografia:** estágio atual armazenará apenas reflexão anonimizada ou poderá conter conteúdo mais sensível? A resposta define se SQLCipher/Keychain deve entrar já na primeira migração.
5. **Sincronização:** o primeiro objetivo é proteção local e backup; não recomendo bloquear a migração SQLite esperando um backend de sync.

## Referências

[1]: https://capacitorjs.com/docs/guides/storage "Data Storage in Capacitor"
[2]: https://github.com/capacitor-community/sqlite "Capacitor Community SQLite"
[3]: https://capawesome.io/docs/sdks/capacitor/sqlite/ "Capacitor SQLite Plugin"
