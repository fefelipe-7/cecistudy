import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CATALOGOS,
  CHAVES_COM_APELIDO,
  CHAVES_ONDE_SE_NOMEIA,
  ERRO,
  ERRO_POR_KIND_SYNC,
  FALLBACK,
  PROIBIDO,
  VOZ,
  comNome,
  erro,
  erroDeSync,
  frasesDoCatalogo,
  nomeDisponivel,
  podeUsarApelido,
  type Categoria,
  type Catalogo,
  type ErroVoz,
  type VozContexto,
} from '../voice';
import * as voz from '../voice';
import { SyncProviderError } from '../../../packages/sync/src/provider';

// ---------------------------------------------------------------------------
// I10 · a voz não lê relógio
// ---------------------------------------------------------------------------

describe('I10 · a voz não lê relógio', () => {
  const fonte = fs.readFileSync(path.resolve(__dirname, '../voice.ts'), 'utf-8');

  it('lê o relógio no máximo uma vez, e só como default de parâmetro', () => {
    // `I10`: a escolha da voz tem que ser determinística dado um relógio.
    // Nenhuma regra permite `Date.now()` espalhado. Um `new Date()` como
    // **default de parâmetro injetado** é o padrão que `thesis.ts` já usa
    // ("o único relógio do arquivo") — e é ele que torna `dica(ctx)` utilizável
    // sem o chamador ter que fabricar uma data.
    //
    // Comentário não conta: a regra é escrita com esses nomes no texto, e um gate
    // que se acusa sozinho é um gate desligado.
    const codigo = fs
      .readFileSync(path.resolve(__dirname, '../voice.ts'), 'utf-8')
      .split('\n')
      .filter((l) => !/^\s*(\*|\/\/)/.test(l))
      .join('\n');

    expect(codigo).not.toMatch(/Date\.now\(\)/);
    expect(codigo).not.toMatch(/new Date\(\s*\)\s*[.+-]/);

    const defaults = [...codigo.matchAll(/=\s*new Date\(\)/g)];
    expect(
      defaults.length,
      `a voz deve ler o relógio só como default de parâmetro; encontrou ${defaults.length}`,
    ).toBe(3); // dica, resumoDoDia, saudacao
  });

  it('não importa React, perfil, storage nem plataforma', () => {
    const fonte = fs.readFileSync(path.resolve(__dirname, '../voice.ts'), 'utf-8');
    for (const proibido of ['react', 'capacitor', '__TAURI__', 'useMobileApp', 'context/']) {
      expect(fonte, `voz.ts não pode depender de "${proibido}" (D14)`).not.toMatch(
        new RegExp(`from ['"][^'"]*${proibido}`),
      );
    }
  });

  it('a única dependência externa é o erro do sync, e é estreita', () => {
    // `SPEC-M-018 D17`: a voz precisa do `SyncProviderError` para ler o `kind`.
    // É a **única** exceção à voz de dado puro, e ela é declarada aqui para que
    // aparecer uma segunda não passe por detalhe esquecido.
    const fonte = fs.readFileSync(path.resolve(__dirname, '../voice.ts'), 'utf-8');
    const externos = [...fonte.matchAll(/from ['"](\.[^'"]*)['"]/g)].map((m) => m[1]);
    const foraDoSync = externos.filter((e) => !e.includes('packages/sync'));
    expect(foraDoSync).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// D8 / I9 · tratamento por nome
// ---------------------------------------------------------------------------

describe('D8 · tratamento por nome é opcional e é dado', () => {
  const semNome: VozContexto = { tratamentoAutorizado: false };
  const comNomeCtx: VozContexto = { tratamentoAutorizado: true, nomeDaUsuaria: 'Fernanda' };

  it('sem autorização, o nome não é usado mesmo estando no perfil', () => {
    expect(
      nomeDisponivel({ tratamentoAutorizado: false, nomeDaUsuaria: 'Fernanda' }),
    ).toBeUndefined();
  });

  it('sem nome, não usa tratamento', () => {
    expect(nomeDisponivel({ tratamentoAutorizado: true })).toBeUndefined();
    expect(nomeDisponivel({ tratamentoAutorizado: true, nomeDaUsuaria: '' })).toBeUndefined();
    expect(nomeDisponivel({ tratamentoAutorizado: true, nomeDaUsuaria: '   ' })).toBeUndefined();
  });

  it('com autorização e nome, usa o nome como foi digitado', () => {
    expect(nomeDisponivel(comNomeCtx)).toBe('Fernanda');
  });

  it('a frase volta intacta quando não há nome', () => {
    const frase = 'vou lembrar do seu ritmo';
    expect(comNome(frase, semNome)).toBe(frase);
    expect(comNome(frase, { tratamentoAutorizado: true })).toBe(frase);
    expect(comNome(frase, { tratamentoAutorizado: true, nomeDaUsuaria: '  ' })).toBe(frase);
  });

  it('a frase abre com o nome quando ele existe, sem espaço a mais', () => {
    const saida = comNome('vou lembrar do seu ritmo', comNomeCtx);
    expect(saida).toBe('Fernanda, vou lembrar do seu ritmo');
    expect(saida).not.toMatch(/,\s{2,}/);
    expect(saida).not.toMatch(/\s{2,}/);
  });

  it('o nome entra aparado', () => {
    expect(comNome('bora', { tratamentoAutorizado: true, nomeDaUsuaria: '  Fernanda  ' })).toBe(
      'Fernanda, bora',
    );
  });
});

// ---------------------------------------------------------------------------
// D3 / I3 · o apelido tem janela
// ---------------------------------------------------------------------------

describe('I3 · o apelido "ceço" só vale nas chaves autorizadas', () => {
  const apelido = VOZ.intimidade;

  it('toda chave autorizada é uma chave do catálogo', () => {
    const ids = new Set(frasesDoCatalogo().map((f) => f.id));
    for (const chave of CHAVES_COM_APELIDO) {
      expect(ids, `CHAVES_COM_APELIDO tem "${chave}", que não existe no catálogo`).toContain(chave);
    }
  });

  it('nenhuma frase do catálogo usa o apelido fora da janela', () => {
    const infrações = frasesDoCatalogo()
      .filter((f) => f.texto.includes(apelido))
      .filter((f) => !podeUsarApelido(f.id))
      .map((f) => f.id);
    expect(infrações).toEqual([]);
  });

  it('o nome de registro NÃO é tratamento por nome dentro da frase (D2)', () => {
    // O personagem se nomeia **uma vez**: no primeiro contato (`D2`, exceção
    // escolhida pela dona). Em toda a outra voz, o nome vive no rótulo da dica.
    expect(VOZ.rotuloDica).toContain(VOZ.registro);
    const frases = frasesDoCatalogo().filter((f) => f.texto.includes(VOZ.registro));
    expect(
      frases.map((f) => f.id),
      `frase se nomeando fora do primeiro contato`,
    ).toEqual([...CHAVES_ONDE_SE_NOMEIA]);
  });
});

// ---------------------------------------------------------------------------
// I4 / D3 · vocabulário proibido
// ---------------------------------------------------------------------------

describe('a voz não fala vocabulário proibido', () => {
  it('nenhuma frase do catálogo contém termo proibido', () => {
    const achados: string[] = [];
    for (const frase of frasesDoCatalogo()) {
      const alvo = frase.texto.toLowerCase();
      for (const termo of Object.keys(PROIBIDO)) {
        // **Limite de palavra**, nunca substring: `ceci` como substring acusa
        // `cecistudy` — que é a marca. Gate que acusa o código certo é desligado
        // na primeira semana (`check-boundaries.mjs:261-265`).
        const padrao = new RegExp(`\\b${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (padrao.test(alvo)) achados.push(`${frase.id}: "${termo}"`);
      }
    }
    expect(achados).toEqual([]);
  });

  it('"cantinho" é metáfora, não nome de produto: a marca não o contém (D4)', () => {
    expect(VOZ.marca).not.toContain('cantinho');
    expect(VOZ.marcaTecnica).not.toContain('cantinho');
    expect(VOZ.marcaTecnica).not.toContain('♡');
  });
});

// ---------------------------------------------------------------------------
// O walker — testado por fixture, para não ser um teste que passa no vazio
// ---------------------------------------------------------------------------

describe('frasesDoCatalogo', () => {
  /** Devolve catálogo **e** `ERRO` de fixture — senão o catálogo real vaza. */
  const comFixture = (
    erroFixture: Record<string, ErroVoz> = {},
    celebracao: Catalogo = {},
  ): [Record<Categoria, Catalogo>, Record<string, ErroVoz>] => [
    {
      ERRO: {},
      VAZIO: {},
      DICA: {},
      CONFIRMACAO: {},
      CELEBRACAO: celebracao,
      NOTIFICACAO: {},
      ONBOARDING: {},
    },
    erroFixture,
  ];

  it('achata string e função, e a função é lida pelo corpo', () => {
    const [catalogos, catErro] = comFixture({}, { comParam: (p) => `passa ${p.n} cartão` });
    const achadas = frasesDoCatalogo(catalogos, catErro);
    expect(achadas).toHaveLength(1);
    expect(achadas[0].id).toBe('CELEBRACAO.comParam');
    expect(achadas[0].texto).toContain('cartão');
  });

  it('achata o ERRO nas DUAS frases de D5', () => {
    const [catalogos, catErro] = comFixture({
      algo: { oQueAconteceu: 'não consegui montar', oQuePodeFazer: 'tenta de novo' },
    });
    expect(frasesDoCatalogo(catalogos, catErro).map((f) => f.id)).toEqual([
      'ERRO.algo.oQueAconteceu',
      'ERRO.algo.oQuePodeFazer',
    ]);
  });

  it('enxerga o apelido dentro do corpo da função (fixture que prova o detector)', () => {
    const [catalogos, catErro] = comFixture({}, { comApelido: (p) => `ceço, ${p.x}` });
    expect(frasesDoCatalogo(catalogos, catErro)[0].texto).toContain('ceço');
  });

  it('a detecção é por LITERAL: interpolar uma constante escapa do walker', () => {
    // Limitação real do gate, não do teste. `frasesDoCatalogo` lê o corpo da
    // função, então uma frase montada por interpolação de constante fica
    // invisível — e um gate que pode ser burlado assim é pior do que nenhum.
    // Por isso toda frase do catálogo é **literal**; `voice.ts` documenta isso.
    const [catalogos, catErro] = comFixture({}, { indireto: (p) => `${VOZ.intimidade}, ${p.x}` });
    expect(frasesDoCatalogo(catalogos, catErro)[0].texto).not.toContain('ceço');
  });

  it('enxerga termo proibido dentro do corpo da função (fixture)', () => {
    const [catalogos, catErro] = comFixture({}, { comCodi: () => 'deu Exception no meio' });
    expect(frasesDoCatalogo(catalogos, catErro)[0].texto.toLowerCase()).toContain('exception');
  });

  it('um catálogo vazio devolve lista vazia, sem inventar chave', () => {
    const [catalogos, catErro] = comFixture();
    expect(frasesDoCatalogo(catalogos, catErro)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// D7 / I10 · o motor único
// ---------------------------------------------------------------------------

describe('D7 · o motor de dica é um só, com variante por contexto', () => {
  const AGORA = new Date(2026, 9, 14, 12, 0);

  it('a prova de hoje é mais específica que "cartões vencidos"', () => {
    const dica = voz.dica(
      { cartoesVencidos: 5, provasPendentes: 1, diasAteProva: 0, tituloProva: 'Neuropsicologia' },
      AGORA,
    );
    expect(dica).toContain('Neuropsicologia');
    expect(dica).toContain('hoje');
    expect(dica).not.toContain('cartão');
  });

  it('prova vencida pede anotação, não revisão', () => {
    expect(
      voz.dica({ provasPendentes: 1, diasAteProva: -2, tituloProva: 'Clínica' }, AGORA),
    ).toContain('já passou');
  });

  it('cada faixa de dias diz a coisa certa', () => {
    const dias = (n: number) =>
      voz.dica({ provasPendentes: 1, diasAteProva: n, tituloProva: 'X' }, AGORA);
    expect(dias(1)).toContain('amanhã');
    expect(dias(5)).toContain('em 5 dias');
  });

  it('frequência fora de dia vira a dica da matéria', () => {
    const dica = voz.dica({ frequenciaPercent: 82 }, AGORA);
    expect(dica).toContain('82%');
    expect(dica).toContain('faltas');
  });

  it('sem nada específico, o descanso é o padrão — e é sempre o mesmo', () => {
    const a = voz.dica({ cartoesVencidos: 0 }, AGORA);
    const b = voz.dica({}, AGORA);
    expect(a).toBe(b);
    expect(a).toContain('sem pressa');
  });

  it('a sequência sem foco pede sessão curta antes da sequência afirmativa', () => {
    // A ordem das candidatas É a regra de especificidade. Se inverter, a
    // usuária recebe "você tá construindo algo bonito" em vez de um convite.
    const dica = voz.dica({ diasDeSequencia: 5, minutosDeFocoHoje: 0 }, AGORA);
    expect(dica).toContain('sessão curtinha');
  });

  it('o resumo do dia é a outra porta do MESMO motor, não um segundo', () => {
    expect(voz.resumoDoDia({ tarefasPendentes: 0, provasPendentes: 0 }, AGORA)).toContain('leve');
    expect(voz.resumoDoDia({ tarefasPendentes: 0, provasPendentes: 2 }, AGORA)).toContain('prova');
    expect(voz.resumoDoDia({ tarefasPendentes: 3, provasPendentes: 0 }, AGORA)).toContain('tarefa');
    const misto = voz.resumoDoDia({ tarefasPendentes: 3, provasPendentes: 2 }, AGORA);
    expect(misto).toContain('3');
    expect(misto).toContain('2');
  });

  it('a saudação segue o ciclo do dia, madrugada inclusive', () => {
    expect(voz.saudacao(new Date(2026, 0, 1, 1, 30))).toBe('boa madrugada');
    expect(voz.saudacao(new Date(2026, 0, 1, 9, 30))).toBe('bom dia');
    expect(voz.saudacao(new Date(2026, 0, 1, 13, 30))).toBe('boa tarde');
    expect(voz.saudacao(new Date(2026, 0, 1, 20, 30))).toBe('boa noite');
  });

});

// ---------------------------------------------------------------------------
// Contrato das categorias
// ---------------------------------------------------------------------------

describe('a camada 1 tem as sete categorias do contrato', () => {
  it('o catálogo expõe exatamente as categorias de SPEC-C-014 §5.2', () => {
    expect(Object.keys(CATALOGOS).sort()).toEqual(
      ['CELEBRACAO', 'CONFIRMACAO', 'DICA', 'ERRO', 'NOTIFICACAO', 'ONBOARDING', 'VAZIO'].sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// D5 / I8 · o erro tem sempre as duas frases
// ---------------------------------------------------------------------------

/**
 * `D1` — a voz **não** é a voz de sistema. Estes são os marcadores que o D1
 * remove; nenhum pode sobreviver em frase de erro.
 *
 * A lista é de **marcadores de sistema**, não de verbos em 1ª pessoa: exigir um
 * verbo específico seria exigir o meu vocabulário, não a regra. `D1` proíbe o
 * "o app não conseguiu"; não obriga "não consegui".
 */
const MARCADOR_DE_SISTEMA =
  /\b(o app|a aplicação|o sistema|não foi possível|não foi possivel|ocorreu um erro|erro inesperado|indisponível no momento)\b/;

/** `Frase` pode ser string ou função; o teste precisa do texto nos dois casos. */
function textoDe(frase: unknown): string {
  return typeof frase === 'string' ? frase : String(frase);
}

/**
 * `D5` — o que a segunda frase tem que conter: um verbo de ação. Declarado aqui
 * para que o conjunto fique legível e versionado junto do teste, e não
 * espalhado em regex solto.
 */
const VERBO_DE_ACAO =
  /(tenta|volta|confere|abre|espera|recarrega|sincroniza|começa|desfaz|deixa|coloca|escreve|escolhe|diz|guarda|anota|registra|afrouxa|cria|cola)/;

describe('D5 · o erro tem duas frases, nesta ordem', () => {
  const codigos = Object.keys(ERRO);

  it('todo código tem as duas frases não vazias', () => {
    const ruins: string[] = [];
    for (const codigo of codigos) {
      const v = ERRO[codigo];
      if (!textoDe(v.oQueAconteceu).trim()) ruins.push(`${codigo}: oQueAconteceu vazio`);
      if (!textoDe(v.oQuePodeFazer).trim()) ruins.push(`${codigo}: oQuePodeFazer vazio`);
    }
    expect(ruins).toEqual([]);
  });

  it('a primeira frase não é voz de SISTEMA (D1)', () => {
    // "o app não conseguiu", "não foi possível", "ocorreu um erro" — é exatamente
    // o que D1 tira. O que o cecinho diz não tem Marcador de sistema.
    const comSistema = codigos.filter((c) =>
      MARCADOR_DE_SISTEMA.test(textoDe(ERRO[c].oQueAconteceu).toLowerCase()),
    );
    expect(comSistema).toEqual([]);
  });

  it('a primeira frase não deixa a usuária como culpada (D5)', () => {
    const comCulpa = codigos.filter((c) =>
      /inválid|obrigatóri|não informado|missing/.test(textoDe(ERRO[c].oQueAconteceu).toLowerCase()),
    );
    expect(comCulpa).toEqual([]);
  });

  it('a segunda frase diz o que ela pode fazer (verbo de ação)', () => {
    const semAcao = codigos.filter((c) => {
      const texto = textoDe(ERRO[c].oQuePodeFazer).toLowerCase();
      return !VERBO_DE_ACAO.test(texto);
    });
    expect(semAcao).toEqual([]);
  });

  it('a frase composta junta as duas com ponto, e não com quebra', () => {
    const saida = erro('senhaInvalida');
    expect(saida).toBe('não consegui abrir esse backup. confere a senha e tenta de novo');
    expect(saida.split('. ')).toHaveLength(2);
  });

  it('código desconhecido cai no fallback e NÃO vaza a mensagem original', () => {
    const saida = erro('umCodigoQueNaoExiste');
    expect(saida).toBe(erro(FALLBACK));
    expect(saida).not.toContain('umCodigoQueNaoExiste');
    expect(saida).not.toMatch(/undefined|null|NaN/);
  });

  it('nenhum erro usa o apelido "ceço" — o walker alcança as duas frases', () => {
    const comApelido = frasesDoCatalogo().filter(
      (f) => f.categoria === 'ERRO' && f.texto.includes(VOZ.intimidade),
    );
    expect(comApelido).toEqual([]);
    expect(podeUsarApelido('ERRO.appQuebrou.oQueAconteceu')).toBe(false);
  });

  it('sem contexto, o erro não usa tratamento por nome', () => {
    const semNome = erro('appQuebrou');
    expect(semNome).not.toMatch(/^[A-ZÀ-Ü][a-zà-ü]+,/);
  });
});

// ---------------------------------------------------------------------------
// D17 · o código do sync vira frase; o detalhe técnico não vaza
// ---------------------------------------------------------------------------

describe('D17 · erroDeSync traduz o código e esconde o diagnóstico', () => {
  it('cada kind do sync tem frase própria, e o mapa é exaustivo', () => {
    expect(Object.keys(ERRO_POR_KIND_SYNC).sort()).toEqual([
      'AUTH',
      'NETWORK',
      'NOT_FOUND',
      'REMOTE_CHANGED',
      'UNKNOWN',
    ]);
  });

  it('a frase sai do código, e o texto técnico do pacote não aparece', () => {
    const comDetalhe = new SyncProviderError('AUTH', '401 Unauthorized: token xyz');
    const frase = erroDeSync(comDetalhe);
    expect(frase).toBe(erro('syncAuth'));
    expect(frase).not.toContain('Unauthorized');
    expect(frase).not.toContain('401');
    expect(frase).not.toContain('xyz');
  });

  it('a voz não fala jargão do sync (D5)', () => {
    // "token", "401", "sha" são diagnóstico. A regra é da frase, não do
    // detalhe técnico — que pode falar o que quiser, ele fica na expansão.
    //
    // **`http` ficou fora da lista de propósito:** "comece com http" é
    // informação que a usuária precisa para colar o link, não mecânica interna.
    // A lista é de jargão de **diagnóstico**; quem amplia sem esse critério
    // reprova frase certa — e o próprio teste abaixo seria o primeiro a cair.
    const jargao = /\b(token|401|403|409|json|sha|sha1|api)\b/i;
    const achados = Object.keys(ERRO).filter((c) =>
      jargao.test(textoDe(ERRO[c].oQueAconteceu) + textoDe(ERRO[c].oQuePodeFazer)),
    );
    expect(achados).toEqual([]);
  });

  it('erro que não é do sync cai no fallback, sem vazar a mensagem', () => {
    const frase = erroDeSync(new Error('TypeError: cannot read property x of undefined'));
    expect(frase).toBe(erro(FALLBACK));
    expect(frase).not.toContain('TypeError');
    expect(frase).not.toContain('undefined');
  });

});

// ---------------------------------------------------------------------------
// D12 · chave sem consumidor
// ---------------------------------------------------------------------------

describe('D12 · toda chave de voz tem consumidor em produção', () => {
  const raiz = path.resolve(__dirname, '../..');
  const fonteDe = (rel: string): string => fs.readFileSync(path.join(raiz, rel), 'utf-8');

  /**
   * Arquivos de produção que podem consumir voz (fora do próprio catálogo).
   *
   * A varredura cobre as camadas de **apresentação** — `components`,
   * `shells` e `overlays`. A casca (`shells`) é onde o chrome do app mora, e
   * é tão produção quanto os componentes: a barra contextual, por exemplo,
   * avisa a falha da ação dali (SPEC-022 D10).
   */
  const consumo = (() => {
    const arquivos: string[] = [];
    const andar = (dir: string) => {
      for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        const cheio = path.join(dir, entrada.name);
        if (entrada.isDirectory()) andar(cheio);
        else if (/\.tsx?$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) {
          arquivos.push(cheio);
        }
      }
    };
    for (const camada of ['components', 'shells', 'overlays']) {
      const alvo = path.join(raiz, camada);
      if (fs.existsSync(alvo)) andar(alvo);
    }
    return arquivos.map((a) => ({
      arquivo: path.relative(raiz, a),
      texto: fs.readFileSync(a, 'utf-8'),
    }));
  })();

  it('todo código de ERRO tem consumidor em produção (D12)', () => {
    // Dois caminhos legítimos de consumo: a tela pede a chave, **ou** o mapa
    // `kind → chave` do sync a referencia (a tela não conhece `kind`).
    const semConsumidor = Object.keys(ERRO).filter((codigo) => {
      const noMapa = Object.values(ERRO_POR_KIND_SYNC).includes(codigo);
      const producao = consumo.filter(
        (c) => c.texto.includes(`'${codigo}'`) && !c.texto.includes('voice.test'),
      );
      const servidaPeloMapa = Object.values(ERRO_POR_KIND_SYNC).filter((k) =>
        producao.some((c) => c.texto.includes(`erroDeSync`)),
      );
      return !(noMapa || servidaPeloMapa.includes(codigo) || producao.length > 0);
    });
    expect(semConsumidor, 'códigos sem consumidor em produção — chave morta é dívida (D12)').toEqual(
      [],
    );
  });
});
