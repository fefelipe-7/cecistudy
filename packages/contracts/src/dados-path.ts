/**
 * Onde o contrato de dados mora em disco.
 *
 * O contrato é um artefato único e o dono é o app desktop (`ADR-007`,
 * `ADR-009`). Este app **consome**: os testes de golden, os fixtures de
 * migração e os vetores de hash leem — e os dois primeiros escrevem — os
 * arquivos do desktop.
 *
 * ## Por que isto existe e não um caminho literal
 *
 * A profundidade relativa entre os dois repositórios **não é a mesma** em todo
 * lugar:
 *
 * | onde | mobile | desktop | quantos `..` |
 * |---|---|---|---|
 * | local | `cecigroup/cecistudy/cecistudy` | `cecigroup/cecistudy-desktop` | 5 |
 * | CI | `work/cecistudy/cecistudy` | `work/cecistudy/cecistudy-desktop` | 4 |
 *
 * Um caminho literal passaria num lugar e falharia no outro, e a falha aparece
 * como "golden ausente", que parece problema de fixture em vez de problema de
 * caminho. Então o caminho é **descoberto**, subindo a árvore até achar o
 * diretório, com um nome de variável de ambiente como escape.
 *
 * `CECISTUDY_CONTRATO_DIR` (absoluto) tem precedência sobre a busca. É o que
 * permite rodar o gate contra uma cópia do contrato em outro lugar.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Raiz deste repositório (o app mobile). */
export const RAIZ_MOBILE = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/** Subcaminho do contrato dentro do repositório desktop. */
const SUBCAMINHO = 'contratos/dados';

/** Quantos níveis subir na busca. Suficiente para os dois layouts acima. */
const NIVEIS = 8;

/**
 * Acha o diretório do contrato subindo a árvore a partir de `de`.
 * Retorna `null` se não achar — e aí a mensagem de erro precisa ser boa,
 * porque "não achei" é o caso que alguém vai bater.
 */
function achaContrato(de: string): string | null {
  let dir = de;
  for (let i = 0; i < NIVEIS; i += 1) {
    const candidato = resolve(dir, 'cecistudy-desktop', SUBCAMINHO);
    if (existsSync(candidato)) return candidato;
    const pai = dirname(dir);
    if (pai === dir) break;
    dir = pai;
  }
  return null;
}

let cache: string | null | undefined;

/**
 * O caminho de `contratos/dados/` — o diretório do contrato de dados.
 *
 * Lança se não achar, em vez de devolver um caminho que não existe: um golden
 * lido de lugar errado é pior do que erro.
 */
export function dirDoContratoDeDados(): string {
  if (cache !== undefined) return cache ?? falhar();

  const doEnv = process.env.CECISTUDY_CONTRATO_DIR;
  if (doEnv) {
    if (!existsSync(doEnv)) {
      throw new Error(
        `CECISTUDY_CONTRATO_DIR="${doEnv}" não existe. ` +
          `Aponte para o diretório que contém schema.sql, backup-v2-spec.md e golden/.`,
      );
    }
    cache = doEnv;
    return cache;
  }

  cache = achaContrato(RAIZ_MOBILE);
  if (!cache) falhar();
  return cache as string;
}

/** `…/golden/` — os fixtures byte-a-byte. */
export function dirDosGoldens(): string {
  return resolve(dirDoContratoDeDados(), 'golden');
}

/** `…/golden/migrations/` — fixtures de payload legado. */
export function dirDosFixturesDeMigracao(): string {
  return resolve(dirDosGoldens(), 'migrations');
}

/** `…/golden/canonical_hash_vectors.json`. */
export function arquivoDosVetoresDeHash(): string {
  return resolve(dirDosGoldens(), 'canonical_hash_vectors.json');
}

function falhar(): never {
  const procurado = `…/cecistudy-desktop/${SUBCAMINHO}`;
  throw new Error(
    `não achei o contrato de dados (procurei por ${procurado} subindo ${NIVEIS} níveis a partir de ` +
      `${RAIZ_MOBILE}).\n` +
      `O contrato é do app desktop (ADR-007, ADR-009). Para o gate passar:\n` +
      `  - no CI: o workflow tem que fazer checkout de fefelipe-7/cecistudy-desktop\n` +
      `    em ../cecistudy-desktop, porque os dois repositórios são irmãos ali;\n` +
      `  - localmente, os dois repositórios têm que estar no mesmo grupo de pastas,\n` +
      `    ou CECISTUDY_CONTRATO_DIR precisa apontar para o diretório do contrato.`,
  );
}