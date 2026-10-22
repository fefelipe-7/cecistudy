/**
 * A regra de voz do cecinho, em um módulo só (`SPEC-M-018` D15/D16).
 *
 * `check-boundaries.mjs` **importa** isto, e `gerar-voice-allowlist.mjs` também.
 * Antes as constantes viviam no texto do gate e o gerador as extraía com
 * regex — parsear código por texto funciona até deixar de funcionar, e aí falha
 * em silêncio. Uma regra, um arquivo, dois consumidores.
 *
 * **O que a regra é:** acusa frase de voz da **camada 1** escrita inline em
 * componente, por **categoria**, nunca por acento.
 *
 * **O que ela não é:** não reprova "isto tem acento?". `levels.ts` guarda
 * títulos temáticos, `libraryData.ts` guarda catálogo e `navigation.ts` guarda
 * prosa de engenharia — os três têm pt-BR e os três estão certos. Gate que
 * reprova código certo é desligado na primeira semana, e desligado não protege.
 * Rótulo funcional (camada 2) e catálogo (camada 3) ficam fora **por definição**
 * (`SPEC-C-014 D9), não por allowlist.
 */

/** Arquivos que são a própria voz, ou a liga a ela — nunca infração neles. */
export const ISENTOS_DE_VOZ = [
  'src/lib/voice.ts',
  'src/lib/useVoz.ts',
  'src/lib/diasAte.ts',
];

/** Categorias da camada 1 e o sinal que as denuncia (`SPEC-C-014` §5.2). */
export const CATEGORIAS_DE_VOZ = [
  {
    // `['"`][^'"`]+` e não `['"`]`: `setError('')` é **limpar** o erro, não
    // escrever voz. O fixture não pegaria isso porque ninguém escreve `setError('')`
    // esperando reprovação — pegou na baseline real.
    nome: 'erro',
    re: /\b(setError|setErro|setSituacao|setErrorMsg|setErroDeEscrita|setErroDescriptografar|showErro)\s*\(\s*['"`][^'"`]+['"`]/,
  },
  {
    nome: 'toast',
    re: /\b(toast|showToast)\s*\(\s*['"`]/,
  },
  {
    nome: 'confirmacao',
    re: /\b(confirm|window\.confirm|alert)\s*\(\s*['"`]/,
  },
  {
    // Sem exigir acento — o fixture provou que exigir é um buraco. `description`
    // e `emptyMessage` com literal **são** estado vazio, com ou sem til.
    nome: 'vazio',
    re: /\b(description|emptyMessage)\s*=\s*['"`][^'"`]+/i,
  },
];

/**
 * `notificacao` fica **fora** do detector genérico, de propósito.
 *
 * A primeira versão casava `title:` / `body:` em qualquer lugar, e reprovou
 * `libraryData.ts` (31: títulos de livro), `headerConfig.ts` (9: seção) e
 * `goldenSample.ts` (9: fixture). Tudo aquilo é **camada 3 — catálogo**, e está
 * certo. É a lição do próprio projeto (`check-boundaries.mjs:261-265`) aparecendo
 * de novo: gate que reprova código certo é desligado na primeira semana.
 *
 * A regra de notificação é então **exata**: só vale dentro de
 * `src/lib/notifications.ts`, e só quando o `title`/`body` do objeto agendado é
 * literal em vez de vir de `vozFrase(...)`.
 */
export const ARQUIVO_DE_NOTIFICACAO = 'src/lib/notifications.ts';

/** `title:`/`body:` literal dentro do agendamento nativo = infração. */
export function infracoesDeNotificacao(content) {
  const infracoes = [];
  semComentario(content)
    .split('\n')
    .forEach((linha, i) => {
      const m = /\b(title|body)\s*:\s*(['"`])([^'"`]*)\2/.exec(linha);
      if (!m) return;
      infracoes.push({
        linha: i + 1,
        categoria: 'notificacao',
        texto: linha.trim().slice(0, 90),
      });
    });
  return infracoes;
}

/**
 * Filtro de "isto parece texto de produto".
 *
 * A primeira versão exigia acento, e o fixture provou que isso é um **buraco**:
 * `'isso apaga tudo, tem certeza?'` e `'nenhuma leitura em andamento'` não têm
 * acento nenhum e escapavam. Frase sem acento é frase de produto.
 *
 * O filtro que sobra é o que realmente distingue: a string é passada para uma
 * **chamada de voz** (`showToast(`, `setError(`, `description=`). Se o argumento
 * é literal e a função é de voz, é voz — com ou sem acento. Por isso o acento
 * virou **heurística de leitura**, não condição: aparece no relatório para ajudar
 * a ler a infração, e não decide nada.
 */
export const E_PT_BR = /[à-úâêôãõç♡✨🔥☕🌷]/;

/**
 * Remove comentários, porque o gate julga o texto que a pessoa **escreveu**, e
 * não o que a regra sobre esse texto disse. Sem isso o gate se acusa sozinho —
 * a documentação da regra cita `toast('...')` e seria reprovada por estar
 * documentada.
 */
export function semComentario(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** As infrações de voz inline de um arquivo. Uma por linha, no máximo. */
export function infracoesDeVoz(content) {
  const infracoes = [];
  semComentario(content)
    .split('\n')
    .forEach((linha, i) => {
      for (const cat of CATEGORIAS_DE_VOZ) {
        if (!cat.re.test(linha)) continue;
        infracoes.push({
          linha: i + 1,
          categoria: cat.nome,
          comAcento: E_PT_BR.test(linha),
          texto: linha.trim().slice(0, 90),
        });
        return;
      }
    });
  return infracoes;
}