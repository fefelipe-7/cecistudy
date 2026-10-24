/**
 * Voz do cecinho — a fonte única de linguagem do produto.
 *
 * Contrato: `SPEC-C-014` (`D1`..`D8`). Implementação: `SPEC-M-018`
 * (`D13`, `D14`). Plano: `tasks/plan-voz-do-cecinho.md`.
 *
 * **Este arquivo é dado puro.** Ele não importa React, `packages/*`, perfil nem
 * plataforma. O nome da usuária **chega por argumento** (`VozContexto`); este
 * arquivo nunca o lê — o amarração com o perfil é `src/lib/useVoz.ts` (`D14`).
 *
 * Invariantes verificadas em `voice.test.ts`:
 * - `I3`  o apelido "ceço" só aparece nas chaves de `CHAVES_COM_APELIDO` (`D3`)
 * - `I4`  nenhuma frase de usuária vive em `packages/*` — este é o destino delas (`D6`)
 * - `I9`  nome ausente, vazio ou sem autorização nunca quebra a frase (`D8`)
 * - `I10` nenhum relógio lido: o instante entra por parâmetro (`SPEC-M-001` D3).
 *   Exceção única e declarada: `agora: Date = new Date()` como **default de
 *   parâmetro** em `dica`, `resumoDoDia` e `saudacao` — o mesmo padrão que
 *   `thesis.ts` já usa ("o único relógio do arquivo"). `Date.now()` não existe
 *   aqui, e `voice.test.ts` conta as ocorrências.
 */

// Só o **tipo**: em runtime esta importação não existe, e a voz segue sem
// depender de `packages/*` (`D14`). O `Record` de `ERRO_POR_KIND_SYNC` é o que
// compensa — um `kind` novo no sync quebra a compilação aqui.
import type { SyncProviderErrorKind } from '../../packages/sync/src/provider';
import { SyncProviderError } from '../../packages/sync/src/provider';

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------

/**
 * Quem a voz está falando com. **Dados**, não estado: a voz recebe, não lê.
 */
export interface VozContexto {
  /** Nome como a usuária digitou no perfil. Ausente/vazio = fala com "você". */
  nomeDaUsuaria?: string;
  /**
   * Autorização explícita da usuária para ser tratada pelo nome (`D8`).
   * Padrão seguro = `false`: sem autorização, a voz diz "você".
   */
  tratamentoAutorizado: boolean;
}

// ---------------------------------------------------------------------------
// Marca e nome do personagem
// ---------------------------------------------------------------------------

/**
 * `cecinho` é o nome de registro; `ceço` é intimidade, e só vale nas chaves de
 * `CHAVES_COM_APELIDO` (`D3`). O nome do produto é `cecistudy ♡` — "cantinho" é a
 * metáfora que o cecinho usa para o espaço onde mora, e é metáfora, **não nome**
 * (`D4`). Nenhum identificador técnico leva `♡` (`SPEC-C-013` D1).
 */
export const VOZ = {
  marca: 'cecistudy ♡',
  marcaTecnica: 'cecistudy',
  registro: 'cecinho',
  intimidade: 'ceço',
  /** Rótulo da dica: é aqui que o personagem se nomeia, nunca na frase (`D2`). */
  rotuloDica: 'dica do cecinho ✨',
} as const;

// ---------------------------------------------------------------------------
// Categorias — a camada 1 que o gate cobre (`D9`)
// ---------------------------------------------------------------------------

export const CATEGORIAS = [
  'ERRO',
  'VAZIO',
  'DICA',
  'CONFIRMACAO',
  'CELEBRACAO',
  'NOTIFICACAO',
  'ONBOARDING',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export type Params = Record<string, string | number | string[]>;

/**
 * Uma frase de voz. A forma simples é a mais comum; a forma com função recebe os
 * parâmetros e o contexto — é onde mora a variante (`D7`) e o tratamento por
 * nome (`D8`).
 *
 * **A frase tem de ser literal.** O gate e o teste leem o corpo da função, então
 * uma frase montada por interpolação de constante fica **invisível** para eles. Um
 * gate que pode ser burlado assim é pior do que nenhum — a mesma lição que
 * `check-boundaries.mjs:261-265` já registra no projeto. Interpolação só para
 * **dados** (`p.x`); o texto, sempre escrito na hora.
 */
export type Frase = string | ((params: Params, ctx: VozContexto) => string);

/** Um catálogo é uma chave por frase, dentro de uma categoria. */
export type Catalogo = Record<string, Frase>;

/**
 * `I3` — chaves onde o apelido "ceço" é permitido (`D3`).
 *
 * O limite é a **chave**, não a categoria: o critério é afeto próximo —
 * celebração de marco, encerramento de ciclo, despedida de sessão de foco
 * (`SPEC-C-014` D3, ampliado para **primeiro contato** pela dona do produto em
 * 2026-10-14). Um `ceço` em erro, validação, notificação de rotina ou rótulo é
 * infração, mesmo que a categoria pareça aberta.
 *
 * Vazio por enquanto: o apelido só entra quando a frase existir de verdade.
 * `I3` reprova frase com `ceço` fora daqui — então esta lista só cresce junto
 * com a chave que o usa.
 */
export const CHAVES_COM_APELIDO: readonly string[] = [
  // Afeto próximo (`D3`, ampliado pela dona do produto em 2026-10-14):
  // despedida de sessão de foco, celebração de marco e primeiro contato.
  'CELEBRACAO.sessaoDeFocoGuardada',
  'CELEBRACAO.semestreVirado',
  'ONBOARDING.boasVindasDescricao',
];

/**
 * `D2` — as únicas chaves onde o cecinho **se apresenta por nome**.
 *
 * A regra é "o personagem não se nomeia no meio da frase" — mas o primeiro
 * contato é a exceção que a dona do produto escolheu: a única vez que oferecer
 * o nome (e o apelido) não é invasão, é convite. Fora daqui, "cecinho" em frase
 * de voz é infração.
 */
export const CHAVES_ONDE_SE_NOMEIA: readonly string[] = ['ONBOARDING.boasVindas'];

/**
 * `D3`/`D4` — termos que **nunca** entram na voz do mobile. Todo termo tem
 * motivo escrito: termo sem motivo não sobrevive sem revisão explícita da dona do
 * produto.
 */
export const PROIBIDO: Record<string, string> = {
  // A usuária é "você". "Ceci" é o nome da dona do produto, nunca rótulo de UI
  // (`SPEC-C-013` D2, `SPEC-C-014` D8).
  ceci: 'a usuária é tratada por "você"; "Ceci" é o nome da dona do produto',
  // Vocabulário de diagnóstico que a voz não fala: o detalhe técnico vai sob
  // a expansão (`SPEC-C-014` D5).
  stacktrace: 'detalhe técnico vai na expansão, nunca no primeiro nível',
  exception: 'idem — a voz não fala o nome da exceção, fala o que ela pode fazer',
  undefined: 'a frase degrada para a versão sem o dado, nunca mostra "undefined"',
  null: 'idem — jamais aparece um valor nulo na frase',
};

// ---------------------------------------------------------------------------
// Tratamento por nome (`D8`)
// ---------------------------------------------------------------------------

/**
 * O nome só é usado quando a usuária **autorizou**. Ausente, vazio, só espaços
 * ou sem autorização → `undefined`, e a voz fala com "vou lembrar" como está.
 */
export function nomeDisponivel(ctx: VozContexto): string | undefined {
  if (!ctx.tratamentoAutorizado) return undefined;
  const nome = ctx.nomeDaUsuaria?.trim();
  return nome ? nome : undefined;
}

/**
 * Abre a frase com o nome, quando ele existe. A voz é minúscula por convenção,
 * então o nome entra como foi digitado e a frase continua como está.
 *
 * `'vou lembrar'` → `'Fernanda, vou lembrar'`
 */
export function comNome(frase: string, ctx: VozContexto): string {
  const nome = nomeDisponivel(ctx);
  return nome ? `${nome}, ${frase}` : frase;
}

// ---------------------------------------------------------------------------
// Catálogos — declarados aqui, preenchidos fase a fase (F1, F3, F5)
// ---------------------------------------------------------------------------

export const VAZIO: Catalogo = {
  /**
   * O chip de preenchimento do registro de estágio (`SPEC-011 D13`). O domínio
   * devolve só a lista de campos que faltam (`SPEC-M-018 D17`); a frase é daqui.
   */
  preenchimento: (p) => {
    const faltando = (p.faltando ?? []) as string[];
    if (faltando.length === 0) return 'tudo preenchido';
    if (faltando.length === 1) return `falta ${faltando[0]}`;
    const quantos = POR_EXTENSO[faltando.length] ?? String(faltando.length);
    return `ainda falta preencher ${quantos}`;
  },
  semPaciente:
    'nenhum paciente por aqui ainda — anote um atendimento clínico e ele aparece aqui ♡',
  semRegistroEstagio: 'ainda não tem registro de estágio — que tal anotar o primeiro? ♡',
  semResultadoFiltro: 'nada por aqui com esse filtro',
  /** Ajudas de campo do wizard — é a dica de como usar, não rótulo. */
  toqueParaAdicionarTemas: 'toque em + para adicionar os temas',
  /** A dica de validação do link na captura (`SPEC-012 §8.6`). */
  linkDica: 'cole um link http(s) válido',
  toqueParaAdicionar: 'toque em + para adicionar',
  /** O caso foi aberto, mas não há sessão para navegar. */
  pacienteSemSessoes: 'esse paciente não tem mais sessões',
  semSupervisao: 'ainda não tem supervisão anotada — que tal registrar a próxima? ♡',

  // --- TCC
  capitulosVazio: 'a lista nasce vazia: monte os capítulos do jeito que fizer sentido pro seu trabalho ♡',
  referenciasVazio:
    'artigos e livros que você guardar e citar no tcc aparecem aqui, já no formato abnt ♡',
  orientacaoVazio:
    'as conversas com a orientação e o que fica pendente vivem aqui — e cada decisão da reunião pode virar uma pendência sua ♡',
  escritaVazio: 'registre suas sessões de escrita e acompanhe o ritmo até a entrega ♡',
  tccComecar:
    'comece pelo que dá identidade ao trabalho: um título, quem orienta e a pergunta que ele quer responder. o resto você preenche no caminho ♡',
  tccLembretes:
    'o app avisa de capítulos, reuniões, entrega e banca — no ritmo que você escolher depois',
  /** Ajuda de campo de formulário — é dica de uso, não rótulo. */
  campoOpcional: 'não precisa preencher tudo, pode deixar vazio ♡',
  campoOpcionalCurto: 'não precisa preencher tudo ♡',

  // --- Faculdade: busca sem resultado
  semConceitoParecido: 'ainda não tem conceito parecido por aqui ♡',
  semAutorParecido: 'ainda não tem autor parecido por aqui ♡',
  semLeituraParecida: 'ainda não tem leitura parecida por aqui ♡',
  calendarioVazio: 'nada marcado nos próximos dias — o calendário enche sozinho conforme você anota ♡',
  diaSemNada: 'nada marcado neste dia ♡',
  /** Capítulo aberto sem referência vinculada (SPEC-024 T4.2). */
  capituloSemReferencia:
    'nenhuma referência vinculada ainda — o vínculo se faz na própria referência ♡',
  semAbordagensRegistradas: 'ainda não há abordagens registradas.',
  semDisciplinas: 'ainda não há disciplinas cadastradas. que tal criar a primeira?',
  semGrupos: 'ainda não há grupos. crie um depois ♡',
  semConceitosNoCantinho: 'ainda não há conceitos no cantinho.',

  // --- Perfil: o que cada row faz
  rowSync: 'enviar e puxar alterações com o repositório github.',
  rowBackup: 'guardar um arquivo com tudo do cantinho.',
  rowRestaurar: 'restaurar de um arquivo exportado.',

  // --- Estudos / leitura
  leitorSemRegistro:
    'abre o leitor e registra de onde saiu — o acompanhamento nasce daqui ♡',
};
/**
 * As variantes do motor único (`D7`). Toda frase é **literal** — o gate lê o
 * texto, e interpolação de constante deixaria a frase invisível para ele.
 *
 * A chave `CHAVES_COM_APELIDO` só lista as de afeto; o apelido não aparece em
 * dica de rotina nem em erro (`I3`).
 */
export const DICA: Catalogo = {
  // --- prova (o momento mais específico, então vem primeiro)
  provaPassada: (p) => `aquela prova "${p.titulo}" já passou — anota como foi, isso te ajuda depois ♡`,
  provaHoje: (p) => `bora revisar? "${p.titulo}" chega hoje.`,
  provaAmanha: (p) => `bora revisar? "${p.titulo}" chega amanhã.`,
  provaNaSemana: (p) => `bora revisar? "${p.titulo}" chega em ${p.diasProva} dias.`,
  provaProgramada: (p) => `tem "${p.titulo}" marcada para ${p.data} — sem pressa, mas sem esquecer ♡`,

  // --- matrícula
  frequencia: (p) => `sua frequência está em ${p.pct}% — respira, mas toma cuidado com as faltas ♡`,

  // --- carga do dia
  cartoesVencidos: (p) => `tem ${p.n} cartão esperando revisão — começa pelos rápidos ✨`,
  leitura: () => 'que tal uns parágrafos da leitura em andamento? poucos por dia terminam o livro ♡',
  sequenciaSemFoco: (p) => `${p.dias} dias seguidos — bora manter a chama com uma sessão curtinha hoje? 🔥`,
  sequencia: (p) => `${p.dias} dias seguidos de estudo. você tá construindo algo bonito ♡`,
  aulaHoje: () => 'hoje tem aula — anota tudo com carinho ♡',
  focoNaMateria: (p) =>
    `já são ${Number(p.minutos) >= 60 ? `${Math.floor(Number(p.minutos) / 60)}h de foco` : `${p.minutos}min de foco`} nessa matéria. que orgulho de você ♡`,
  semFocoHoje: () => 'uma sessão leve de foco já conta. começa devagar, sem pressa ☕',

  // --- o resumo do dia (era `getDailyGoalMessage`, em `homeMeta.ts`)
  // Encurtadas para o hero com vídeo: a frase divide a tela com a arte, e uma
  // frase de duas linhas competia com ela. O tom, o `♡` e os NÚMEROS continuam
  // — o número é o dado, a frase é o modo de dizer.
  diaTranquilo: () => 'hoje está leve ♡',
  diaDeProvas: (p) =>
    `hoje é dia de ${p.provas} ${Number(p.provas) === 1 ? 'prova' : 'provas'} — revisa o essencial ♡`,
  diaDeTarefas: (p) =>
    `hoje tem ${p.tarefas} ${Number(p.tarefas) === 1 ? 'tarefa' : 'tarefas'} pendentes ♡`,
  diaMisto: (p) =>
    `hoje: ${p.tarefas} ${Number(p.tarefas) === 1 ? 'tarefa' : 'tarefas'} e ${p.provas} ${Number(p.provas) === 1 ? 'prova' : 'provas'} no radar ♡`,

  // --- o descanso e as saudações
  descanso: () => 'sem pressa hoje: uma página, um cartão, um resumo. o cantinho cuida do resto ♡',
  madrugada: () => 'boa madrugada',
  manha: () => 'bom dia',
  tarde: () => 'boa tarde',
  noite: () => 'boa noite',

  // --- Faculdade: a assinatura do cecinho no bloco de estágio
  faculdadePraticaAcompanha: 'guardo tudo com você, registro por registro ♡',
};

// ---------------------------------------------------------------------------
// D7 · o motor único de frase
// ---------------------------------------------------------------------------

/**
 * O contexto real do dia que alimenta a dica. É **dado**: quem escreve a frase é
 * `dica()`, não o componente.
 */
export interface DicaContexto {
  /** Cartões com revisão vencida. */
  cartoesVencidos?: number;
  /** Tarefas pendentes. */
  tarefasPendentes?: number;
  /** Provas pendentes, e a mais próxima. */
  provasPendentes?: number;
  /** Dias (inteiro ≥ 0) até a próxima prova; `null` se não há ou já passou. */
  diasAteProva?: number | null;
  /** Há leitura em andamento? */
  leituraEmAndamento?: boolean;
  /** Dias ativos da sequência atual. */
  diasDeSequencia?: number;
  /** Minutos de foco registrados hoje. */
  minutosDeFocoHoje?: number;
  /** Matrícula: frequência em %, quando não está em dia. */
  frequenciaPercent?: number | null;
  /** Título da próxima prova, quando há. */
  tituloProva?: string;
  /** Data curta da próxima prova, quando há. */
  dataProvaCurta?: string;
  /** Há aula hoje nesta matéria? */
  aulaHoje?: boolean;
  /** Minutos de foco acumulados na matéria. */
  minutosDeFocoNaMateria?: number;
}

/**
 * Uma candidata: só entra se o contexto pedir. A mais específica vence.
 *
 * `familia` separa as duas superfícies que já existiam — a dica do Estimates e o
 * resumo do cabeçalho da Home.continuam a ser **a mesma lista e a mesma ordem**:
 * um motor só, com duas portas de entrada, em vez de dois motores com regras
 * parecidas que divergem sozinhas.
 */
interface Candidata {
  chave: string;
  familia: 'dica' | 'resumo';
  quando: (c: DicaContexto) => boolean;
}

const CANDIDATAS: Candidata[] = [
  {
    chave: 'provaPassada',
    familia: 'dica',
    quando: (c) => c.provasPendentes !== undefined && (c.diasAteProva ?? 1) < 0,
  },
  {
    chave: 'provaHoje',
    familia: 'dica',
    quando: (c) => (c.provasPendentes ?? 0) > 0 && c.diasAteProva === 0,
  },
  {
    chave: 'provaAmanha',
    familia: 'dica',
    quando: (c) => (c.provasPendentes ?? 0) > 0 && c.diasAteProva === 1,
  },
  {
    chave: 'provaNaSemana',
    familia: 'dica',
    quando: (c) => (c.provasPendentes ?? 0) > 0 && (c.diasAteProva ?? 99) <= 7,
  },
  {
    chave: 'provaProgramada',
    familia: 'dica',
    quando: (c) => (c.provasPendentes ?? 0) > 0 && c.dataProvaCurta !== undefined,
  },
  {
    chave: 'frequencia',
    familia: 'dica',
    quando: (c) => c.frequenciaPercent !== undefined && c.frequenciaPercent !== null,
  },
  {
    chave: 'cartoesVencidos',
    familia: 'dica',
    quando: (c) => (c.cartoesVencidos ?? 0) > 0,
  },
  {
    chave: 'leitura',
    familia: 'dica',
    quando: (c) => c.leituraEmAndamento === true,
  },
  {
    chave: 'sequenciaSemFoco',
    familia: 'dica',
    quando: (c) => (c.diasDeSequencia ?? 0) >= 3 && (c.minutosDeFocoHoje ?? 0) === 0,
  },
  {
    chave: 'sequencia',
    familia: 'dica',
    quando: (c) => (c.diasDeSequencia ?? 0) >= 3,
  },
  {
    chave: 'aulaHoje',
    familia: 'dica',
    quando: (c) => c.aulaHoje === true,
  },
  {
    chave: 'focoNaMateria',
    familia: 'dica',
    quando: (c) => (c.minutosDeFocoNaMateria ?? 0) > 0,
  },
  {
    chave: 'semFocoHoje',
    familia: 'dica',
    quando: (c) => c.minutosDeFocoHoje === 0,
  },

  // --- resumo do cabeçalho da Home (era `getDailyGoalMessage`)
  {
    chave: 'diaMisto',
    familia: 'resumo',
    quando: (c) => (c.tarefasPendentes ?? 0) > 0 && (c.provasPendentes ?? 0) > 0,
  },
  {
    chave: 'diaDeProvas',
    familia: 'resumo',
    quando: (c) => (c.tarefasPendentes ?? 0) === 0 && (c.provasPendentes ?? 0) > 0,
  },
  {
    chave: 'diaDeTarefas',
    familia: 'resumo',
    quando: (c) => (c.tarefasPendentes ?? 0) > 0 && (c.provasPendentes ?? 0) === 0,
  },
  {
    chave: 'diaTranquilo',
    familia: 'resumo',
    quando: () => true,
  },
];

/** Preenche os `params` de cada candidata com o que o contexto traz de fato. */
function paramsDa(c: DicaContexto): Params {
  return {
    titulo: c.tituloProva ?? '',
    data: c.dataProvaCurta ?? '',
    diasProva: c.diasAteProva ?? 0,
    n: c.cartoesVencidos ?? c.tarefasPendentes ?? 0,
    dias: c.diasDeSequencia ?? 0,
    pct: c.frequenciaPercent ?? 0,
    minutos: c.minutosDeFocoNaMateria ?? 0,
    tarefas: c.tarefasPendentes ?? 0,
    provas: c.provasPendentes ?? 0,
  };
}

/** A frase de uma família, pela mesma lista e na mesma ordem. */
function fraseDa(familia: 'dica' | 'resumo', contexto: DicaContexto): string {
  const achada = CANDIDATAS.find((c) => c.familia === familia && c.quando(contexto));
  const chave = achada?.chave ?? (familia === 'resumo' ? 'diaTranquilo' : 'descanso');
  return resolver(DICA[chave] ?? DICA.descanso, paramsDa(contexto), SEM_NOME);
}

/**
 * A dica do cecinho para o momento real — a mais específica vence.
 *
 * `I10`: não lê relógio. `agora` entra por parâmetro, e o chamador é quem decide.
 */
export function dica(contexto: DicaContexto, agora: Date = new Date()): string {
  return fraseDa('dica', contexto);
}

/**
 * O resumo do dia, no cabeçalho da Home. Mesma lista, mesma ordem, outra
 * família — é o outro lado de `D7`, não um motor à parte.
 */
export function resumoDoDia(contexto: DicaContexto, agora: Date = new Date()): string {
  return fraseDa('resumo', contexto);
}

/** Saudação por turno do dia — também é do motor (`D7`), não de `homeMeta`. */
export function saudacao(agora: Date = new Date()): string {
  const hora = agora.getHours();
  if (hora < 5) return resolver(DICA.madrugada, {}, SEM_NOME);
  if (hora < 12) return resolver(DICA.manha, {}, SEM_NOME);
  if (hora < 18) return resolver(DICA.tarde, {}, SEM_NOME);
  return resolver(DICA.noite, {}, SEM_NOME);
}
export const CONFIRMACAO: Catalogo = {
  /** A zona de cuidado do Perfil (`SPEC-013 D6`). */
  resetarTitulo: 'resetar cantinho?',
  resetarDescricao: 'isso apaga todo o conteúdo do cantinho e não dá para desfazer. tem certeza?',
  resetarAviso: 'apaga todo o conteúdo e não dá para desfazer.',
};
export const CELEBRACAO: Catalogo = {
  /**
   * Os brindes de escrita do registro de estágio. A palavra "ceço" é permitida
   * aqui — é afeto próximo (`D3`, decidido pela dona do produto em 2026-10-14).
   */
  registroAgendado: 'agendado ♡',
  registroAtualizado: 'registro atualizado ♡',
  registroGuardado: 'registro guardado ♡',

  // --- TCC
  capituloGuardado: 'capítulo guardado ♡',
  capituloRemovido: 'capítulo removido',
  reuniaoCancelada: 'reunião cancelada',
  reuniaoReativada: 'reunião reativada ♡',
  reuniaoGuardada: 'reunião guardada ♡',
  reuniaoRegistrada: 'reunião registrada ♡',
  referenciaCopiada: 'referência copiada ♡',
  referenciaGuardada: 'referência guardada ♡',
  referenciaRemovida: 'referência removida',
  referenciaAdicionada: 'referência adicionada ♡',
  pendenciaGuardada: 'pendência guardada ♡',
  pendenciaRemovida: 'pendência removida',
  sessaoDeEscritaGuardada: 'sessão guardada ♡',
  /** Fim de sessão de foco — aqui o cecinho se despede (`D3`, afeto próximo). */
  sessaoDeFocoGuardada: (p) => `guardei seus ${p.minutos} min com carinho, ceço ♡`,
  sessaoDeEstudoRegistrada: 'sessão de estudo registrada com carinho ♡',
  sessaoDeLeituraGuardada: 'sessão de leitura guardada com carinho ♡',
  tccGuardado: 'tcc guardado ♡',
  listaCopiada: 'lista copiada ♡',
  /** Sumário de capítulos copiado (SPEC-024 T4.3). */
  sumarioCopiado: 'sumário copiado ♡',
  tarefaAtualizada: 'tarefa atualizada ♡',
  provaAtualizada: 'prova atualizada ♡',
  leituraAtualizada: 'leitura atualizada ♡',
  leituraGuardadaNaEstante: 'leitura guardada na estante ♡',
  dadosDoAcervoPreenchidos: 'dados do acervo preenchidos ♡',
  preenchemosDaEstante: 'preenchemos com os dados da sua estante ♡',
  tarefaSalvaNaAgenda: 'tarefa salva e marcada na sua agenda ♡',
  provaSalvaNaAgenda: 'prova salva e marcada na sua agenda ♡',

  // --- Faculdade
  registroApagado: 'registro apagado ♡',
  materiaAdicionada: 'matéria adicionada ao seu cantinho ♡',
  autorAtualizado: 'autor atualizado ♡',
  /** Vinda do `TOAST` de `copy.ts`, que sai inteiro (`SPEC-M-018` D13). */
  autorGuardado: 'autor guardado no cantinho ♡',
  materiaPrecisaCadastro: 'cadastre a matéria — quando voltar, ela aparece aqui ♡',
  conceitoAtualizado: 'conceito atualizado ♡',
  conceitoGuardadoNoCantinho: 'conceito guardado no cantinho ♡',
  flashcardAtualizado: 'flashcard atualizado ♡',
  flashcardGuardadoNoBau: 'flashcard guardado no baú ♡',
  materialAtualizado: 'material atualizado ♡',
  materialGuardadoNoCantinho: 'material guardado no cantinho ♡',
  sessaoAtualizada: 'sessão atualizada ♡',
  sessaoGuardadaNoHistorico: 'sessão guardada no seu histórico ♡',
  /** Virada de semestre — é marco, e marco celebra com o apelido (`D3`). */
  semestreAberto: (p) => `${p.label} aberto ♡`,
  semestreVirado: (p) => `semestre virado ♡ ${p.ordinal}º aberto, ceço tá contigo ♡`,

  // --- Perfil
  configuracoesGuardadas: 'guardei suas configurações com carinho ♡',
  fotoAtualizada: 'foto de perfil atualizada ♡',
  fotoRemovida: 'foto removida — tudo bem, sem pressa ♡',

  // --- Captura de link (`SPEC-012 §8.6`)
  linkDuplicado: 'esse link já estava guardado ♡',
  linkGuardado: 'pronto, guardado ♡',
  linkGuardadoNoTcc: 'guardado no tcc ♡',

  // --- Sync + OTA
  codigoDePareamento: 'digita o código de 6 letras que aparece no outro dispositivo ♡',
  qrErrado: 'esse QR não é de sincronização do cantinho ♡',

  // --- Notas e aulas
  semestreRestaurado: (p) => `${p.label} voltou a ser o seu semestre atual ♡`,
  aulaCompleta: 'aula completa no diário ♡',
  notaAvulsaSalva: 'nota salva nas notas avulsas ♡',
  notaGuardada: 'nota guardada com carinho ♡',
  notaTransformada: (p) => `nota transformada em ${p.label} ♡`,
  /** Ajudinha de campo: o que a marcação faz. */
  marcarParaRevisar: 'marca aqui para revisar depois',
  presencaRegistrada: 'presença registrada ♡ bora estudar?',

  // --- Contexto (reset, backup, sync)
  cantinhoResetado: 'cantinho resetado — vamos começar de novo? ♡',
  cantinhoPronto: 'cantinho pronto — bora começar? ♡',
  backupIncompativel: 'ops, esse arquivo de backup não é compatível ♡',
  backupRestaurado: 'backup restaurado com carinho ♡',
  sincronizado: 'sincronizado com carinho ♡',
  dadosEnviados: 'dados enviados para a nuvem ♡',
  planoDoDiaCompleto: (p) => `plano do dia completo! parabéns${p.nome ? `, ${p.nome}` : ''} 🎉`,
  leituraConcluida: 'leitura concluída! que orgulho de você ♡',
  nivelAlcancado: (p) => `nível geral ${p.numero} alcançado: ${p.titulo} 🎉`,
  clientIdFaltando: 'configura o client id do google para usar a agenda ♡',
  projetoCriado: (p) => `projeto "${p.titulo}" criado ♡`,
  sessaoDeQuizGuardada: 'sessão de quiz guardada ♡',
};

/**
 * "hoje" / "amanhã" / "em N dias" (`SPEC-M-018 D17` — saiu do domínio).
/**
 * "hoje" / "amanhã" / "em N dias" (`SPEC-M-018 D17` — saiu do domínio).
 *
 * Auxiliar **privado**: o walker lê o corpo da frase e enxerga o texto literal
 * de cada uma, mas não o que vem daqui. Isso basta para `I3` e `PROIBIDO` — nenhum
 * termo proibido mora neste helper — e é o limite do gate, registrado aqui.
 */
function prazoDe(dias: number): string {
  return dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`;
}

export const NOTIFICACAO: Catalogo = {
  /** A marca, sem o rótulo — para títulos compostos (`cecistudy ♡ aula de X`). */
  marca: 'cecistudy ♡',
  tccTitulo: 'cecistudy ♡ tcc',
  tccCapitulo: (p) => `o capítulo ${p.referencia} vence ${prazoDe(Number(p.dias))}`,
  tccPendencia: (p) => `pendência da orientação: ${p.referencia} — ${prazoDe(Number(p.dias))}`,
  tccReuniao: (p) =>
    `reunião com ${p.referencia} ${prazoDe(Number(p.dias))}${p.hora ? ` às ${p.hora}` : ''}`,
  tccEntrega: (p) => `faltam ${p.dias} dias para a entrega do tcc ♡`,
  tccBanca: (p) => `faltam ${p.dias} dias para a banca do tcc ♡`,
  /**
   * O lembrete diário, por turno do dia. `D18`: o texto é montado **no
   * agendamento**, que é quando o perfil está carregado — por isso é aqui que o
   * tratamento por nome pode entrar, se a usuária autorizou.
   */
  diario: (p) =>
    p.turno === 'manha'
      ? 'uma pausinha para revisar o dia? com leveza e foco! ♡'
      : 'hora de fechar o dia com uma sessão leve de estudos ♡',
  diarioTitulo: 'cecistudy ♡ lembrete de estudo',
  aula: (p) => `aula de ${p.nome}`,
  /** O corpo do lembrete de aula: quando começa e onde. */
  aulaHorario: (p) =>
    `começa às ${p.inicio}${p.fim ? `–${p.fim}` : ''}${p.sala ? ` • ${p.sala}` : ''}`,
};
export const ONBOARDING: Catalogo = {
  /**
   * O interruptor do tratamento por nome (`SPEC-C-014` D8).
   *
   * Autorização é **opt-in e fechada por padrão** — a voz chama de "você" até
   * ela ligar. A explicação diz o que muda, e não tenta vender: decisão dela.
   */
  nomeAutorizadoTitulo: 'me chamar pelo nome',
  nomeAutorizadoDescricao: (p) =>
    `quando estiver ligado, eu te chamo de ${p.nome} nos recados e nas celebrações`,

  // --- Onboarding (`SPEC-C-014` D1/D3: 1ª pessoa, e o primeiro contato é
  //     onde os dois nomes se apresentam — é a única vez que o cecinho se
  //     apresenta, e é a única chance de oferecer o "ceço" sem parecer forçado.)
  /**
   * A primeira tela. O cecinho se apresenta **uma vez**, e oferece o apelido —
   * "ceço" — porque primeiro contato é o único momento em que oferecer
   * intimidade não é invasão: é convite.
   */
  boasVindas: 'oi! eu sou o cecinho ♡',
  boasVindasDescricao:
    'esse daqui é o seu cantinho. eu anoto suas aulas, leituras e provas, e cuido da sua jornada até o CRP — se quiser, pode me chamar de ceço.',
  comecar: 'bora?',

  quemEuChamo: 'como eu te chamo?',
  quemEuChamoDica: 'só o primeiro nome serve — é assim que eu vou te chamar por aqui',

  suaJornada: 'onde você está na jornada?',
  suaJornadaDica: 'eu preparo os avisos a partir daqui',
  semestreAtual: 'semestre atual',
  totalDoCurso: 'total de semestres do curso',

  seuContexto: 'e pra onde você caminha?',
  seuContextoDica: 'se quiser me contar agora; também pode ser depois ♡',

  suaFoto: 'um rostinho pra eu te reconhecer',
  suaFotoDica: 'pode deixar pra depois, se preferir ♡',

  permissoesTitulo: 'as chaves do cantinho',
  permissoesDica: 'eu peço cada acesso só na hora em que você usar ♡',
  permissoesWeb: 'por aqui, na versão de navegador, nada é necessário ♡',
  permissaoNegada: 'não deu — dá pra ativar depois nas configurações.',

  /** O que cada permissão faz: a dica, não o rótulo. */
  permissaoFiles: 'guardar e exportar backups do seu cantinho.',
  permissaoPhotos: 'usar câmera e galeria para sua foto de perfil.',
  permissaoCalendar: 'anotar aulas, provas e estudos na sua agenda.',
  permissaoNotifications: 'receber o lembrete diário de estudo ♡',

  rodape: 'tudo fica guardado aqui no seu dispositivo, com carinho ♡',
};

/** Numeral por extenso — sai do domínio (`SPEC-M-018 D17`, `internship.ts`). */
const POR_EXTENSO: Record<number, string> = {
  2: 'dois',
  3: 'três',
  4: 'quatro',
  5: 'cinco',
};

// ---------------------------------------------------------------------------
// Erro — a única categoria com **duas** frases obrigatórias (`D5`)
// ---------------------------------------------------------------------------

/**
 * `D5` — o erro tem duas frases, sempre nesta ordem:
 *
 * 1. `oQueAconteceu` — o que aconteceu, em 1ª pessoa do cecinho, sem jargão;
 * 2. `oQuePodeFazer` — o que a usuária pode fazer **agora**.
 *
 * Erro sem a segunda frase trava a usuária; erro sem a primeira é jargão. O
 * detalhe técnico (`Error.message`, código HTTP, stack) **não entra aqui** — ele
 * vai para a expansão, sob a frase do cecinho.
 */
export interface ErroVoz {
  oQueAconteceu: Frase;
  oQuePodeFazer: Frase;
}

/**
 * Chave usada quando o código pedido não existe no catálogo. Ela existe porque
 * `erro()` nunca pode devolver a string crua de um `Error` — seria expor
 * diagnóstico com cara de voz (`D5`).
 */
export const FALLBACK = 'desconhecido';

/**
 * O catálogo de erro. `ERRO` é o único que o walker achata em duas frases, e é
 * por isso que `I3` alcança o texto de erro: **"ceço" nunca entra aqui**.
 */
export const ERRO: Record<string, ErroVoz> = {
  /** A tela inteira quebrou. Aparece fora de qualquer provider, sem nome (`F1`). */
  appQuebrou: {
    oQueAconteceu: 'não consegui carregar essa tela',
    oQuePodeFazer: 'volta pro começo que eu tento montar de novo',
  },
  /** A senha do backup não bate (`SPEC-012`). */
  senhaInvalida: {
    oQueAconteceu: 'não consegui abrir esse backup',
    oQuePodeFazer: 'confere a senha e tenta de novo',
  },
  /** A meta de horas de estágio pede um número possível (`SPEC-009 D2`). */
  metaDeHoras: {
    oQueAconteceu: 'não consegui guardar essa meta de horas',
    oQuePodeFazer: 'coloca um número entre 1 e 5000',
  },
  /** A ação da barra contextual falhou (SPEC-022 D10). */
  acaoFalhou: {
    oQueAconteceu: 'não consegui fazer isso agora',
    oQuePodeFazer: 'tenta de novo em um instante',
  },

  // --- TCC
  capituloSemTitulo: {
    oQueAconteceu: 'não consegui guardar o capítulo',
    oQuePodeFazer: 'escreve um título antes de salvar',
  },
  reuniaoSemData: {
    oQueAconteceu: 'não consegui guardar a reunião',
    oQuePodeFazer: 'escolhe uma data antes de salvar',
  },
  pendenciaSemTitulo: {
    oQueAconteceu: 'não consegui guardar a pendência',
    oQuePodeFazer: 'escreve um título antes de salvar',
  },
  escritaSemPalavras: {
    oQueAconteceu: 'não consegui registrar a sessão de escrita',
    oQuePodeFazer: 'diz quantas palavras — pode ser 0',
  },
  semReferenciaPraCopiar: {
    oQueAconteceu: 'não achei referência pra copiar',
    oQuePodeFazer: 'guarda uma referência primeiro',
  },
  /** O quiz montou vazio com os filtros atuais. */
  quizSemQuestoes: {
    oQueAconteceu: 'não achei questão com esses filtros',
    oQuePodeFazer: 'afrouxa os filtros ou cria questões novas',
  },
  /** A montagem do quiz falhou. */
  quizNaoMontou: {
    oQueAconteceu: 'não consegui preparar o quiz',
    oQuePodeFazer: 'tenta de novo em um instante',
  },
  /** Salvou, mas o calendário nativo não deixou marcar. */
  naoMarcouNaAgenda: {
    oQueAconteceu: 'guardei aqui, mas não consegui marcar na sua agenda',
    oQuePodeFazer: 'confere a permissão do calendário e tenta de novo',
  },

  // --- Sync (`SPEC-M-018 D17`: o código de máquina vem de `SyncProviderError.kind`)
  /** 401/403. Sem a palavra "token": é jargão, e `D5` proíbe jargão. */
  syncAuth: {
    oQueAconteceu: 'não consegui entrar no seu dispositivo remoto',
    oQuePodeFazer: 'confere o acesso que você gerou lá e tenta de novo',
  },
  /** 409 — o remoto mudou desde a última leitura. */
  syncRemotoMudou: {
    oQueAconteceu: 'o outro dispositivo mudou antes de eu conseguir ler',
    oQuePodeFazer: 'sincroniza de novo para deixar os dois em dia',
  },
  /** Sem rede. */
  syncRede: {
    oQueAconteceu: 'não consegui alcançar a internet agora',
    oQuePodeFazer: 'confere a conexão e tenta de novo',
  },
  /** Nada publicado no remoto ainda. */
  syncVazio: {
    oQueAconteceu: 'não achei nada publicado no outro dispositivo',
    oQuePodeFazer: 'começa pela sincronização daqui pra criar o primeiro pacote',
  },
  /** O pareamento não achou o outro dispositivo a tempo. */
  syncPar: {
    oQueAconteceu: 'o outro dispositivo não apareceu pra mim',
    oQuePodeFazer: 'confere que o código é o mesmo e tenta de novo',
  },
  /** O pareamento estourou o tempo. */
  syncTimeout: {
    oQueAconteceu: 'a conexão demorou demais',
    oQuePodeFazer: 'tenta de novo em um instante',
  },

  /** O link colado não tinha URL válida (`SPEC-012 §8.6`). */
  linkInvalido: {
    oQueAconteceu: 'não achei um link nesse texto',
    oQuePodeFazer: 'cola um endereço que comece com http',
  },  /** Código desconhecido — nunca vaza a mensagem original. */
  [FALLBACK]: {
    oQueAconteceu: 'não consegui fazer isso agora',
    oQuePodeFazer: 'tenta de novo daqui a pouco',
  },
};

/**
 * `SyncProviderError.kind` → chave de erro. `SPEC-M-018 D17` — o pacote de sync
 * entrega **código de máquina**, e a tradução para frase mora aqui.
 *
 * O `Record<SyncProviderErrorKind, …>` é exaustivo de propósito: um `kind` novo
 * no `packages/sync` **quebra a compilação** em vez de cair silenciosamente num
 * texto errado. Import só de tipo — em runtime esta linha não existe, e a voz
 * continua sem depender do pacote.
 */
export const ERRO_POR_KIND_SYNC: Record<SyncProviderErrorKind, string> = {
  AUTH: 'syncAuth',
  REMOTE_CHANGED: 'syncRemotoMudou',
  NETWORK: 'syncRede',
  NOT_FOUND: 'syncVazio',
  UNKNOWN: FALLBACK,
};

/**
 * A frase de um erro de sync, a partir do erro lançado.
 *
 * `DataClientProvider` usava `e.message` direto — que era o `format!` do
 * pacote. Um erro sem `kind` é `FALLBACK`, e o detalhe técnico (quando houver)
 * fica para a expansão (`D5`).
 */
export function erroDeSync(e: unknown): string {
  const kind = e instanceof SyncProviderError ? e.kind : null;
  const chave = kind ? ERRO_POR_KIND_SYNC[kind] : FALLBACK;
  return erro(chave);
}

/** Contexto sem tratamento por nome — o padrão seguro (`D8`). */
export const SEM_NOME: VozContexto = { tratamentoAutorizado: false };

/** Resolve uma `Frase` com os parâmetros e o contexto. */
function resolver(frase: Frase, params: Params, ctx: VozContexto): string {
  return typeof frase === 'string' ? frase : frase(params, ctx);
}

/**
 * Lê uma frase de um catálogo. A voz fala **por chave**: o componente pede
 * `VAZIO.preenchimento` e nunca escreve a frase (`D7`, `I5`).
 */
export function frase(catalogo: Catalogo, chave: string, params: Params = {}): string {
  const achada = catalogo[chave];
  if (achada === undefined) {
    // Chave pedida e não existente é bug de digitação, não caso previsto:
    // devolve o código em vez de `undefined` na tela, que é o que `D5` proíbe.
    throw new Error(`voz: chave "${chave}" não existe no catálogo`);
  }
  return resolver(achada, params, SEM_NOME);
}

/**
 * A frase de erro da usuária, com as duas partes de `D5`.
 *
 * Código desconhecido cai em `FALLBACK` — a mensagem original **nunca** vaza,
 * porque `erro()` não recebe `Error`, só o código.
 */
export function erro(codigo: string, params: Params = {}, ctx: VozContexto = SEM_NOME): string {
  const entrada = ERRO[codigo] ?? ERRO[FALLBACK];
  const aconteceu = resolver(entrada.oQueAconteceu, params, ctx);
  const podeFazer = resolver(entrada.oQuePodeFazer, params, ctx);
  return `${aconteceu}. ${podeFazer}`;
}

// ---------------------------------------------------------------------------
// Inspeção do catálogo — o que o gate e o teste leem (`I3`, `I4`)
// ---------------------------------------------------------------------------

/**
 * Os catálogos por categoria, na ordem de `CATEGORIAS`.
 *
 * `ERRO` aparece aqui **vazio** de propósito: ele tem forma própria (`ErroVoz`,
 * duas frases) e é lido pelo segundo parâmetro de `frasesDoCatalogo`. Mantê-lo na
 * lista é o que garante que nenhuma categoria nova entre sem ser percorrida.
 */
export const CATALOGOS: Record<Categoria, Catalogo> = {
  ERRO: {},
  VAZIO,
  DICA,
  CONFIRMACAO,
  CELEBRACAO,
  NOTIFICACAO,
  ONBOARDING,
};

export interface FraseDoCatalogo {
  categoria: Categoria;
  chave: string;
  /** Chave completa `CATEGORIA.chave`. */
  id: string;
  /** O texto da frase; para a forma com função, o **corpo** da função. */
  texto: string;
}

/**
 * Achata os catálogos numa lista de frases legíveis.
 *
 * A forma com função é lida pelo corpo (`toString`) — o texto vive no template
 * literal, e é isso que o gate e o teste precisam ver. `ERRO` achata nas **duas**
 * frases de `D5`, para que o texto de erro também seja coberto por `I3` e por
 * `PROIBIDO`.
 */
export function frasesDoCatalogo(
  catalogos: Record<Categoria, Catalogo> = CATALOGOS,
  erro: Record<string, ErroVoz> = ERRO,
): FraseDoCatalogo[] {
  const out: FraseDoCatalogo[] = [];
  const empurra = (categoria: Categoria, chave: string, sufixo: string, frase: Frase) => {
    out.push({
      categoria,
      chave,
      id: `${categoria}.${chave}${sufixo}`,
      texto: typeof frase === 'string' ? frase : frase.toString(),
    });
  };

  for (const categoria of CATEGORIAS) {
    if (categoria === 'ERRO') {
      for (const [chave, entrada] of Object.entries(erro)) {
        empurra(categoria, chave, '.oQueAconteceu', entrada.oQueAconteceu);
        empurra(categoria, chave, '.oQuePodeFazer', entrada.oQuePodeFazer);
      }
      continue;
    }
    for (const [chave, frase] of Object.entries(catalogos[categoria])) {
      empurra(categoria, chave, '', frase);
    }
  }
  return out;
}

/** `D3` — o apelido vale nesta chave? */
export function podeUsarApelido(id: string): boolean {
  return CHAVES_COM_APELIDO.includes(id);
}