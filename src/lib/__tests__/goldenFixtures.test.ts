import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalize } from '../canonicalJson';
import type { BackupV2 } from '../../../packages/data/src/exportImport';
import {
  sampleSnapshot,
  emptySnapshot,
  goldenEnvelope,
  goldenCollectionKeys,
} from '../../data/fixtures/goldenSample';

/**
 * Golden files (F0.4) — paridade byte-a-byte TS ↔ arquivos em
 * `cecistudy-rust/contracts/golden/` (o conteúdo é o canonical JSON v1).
 *
 * GERAÇÃO: `GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts`
 * IMPORTANTE: alterar `goldenSample.ts` ou `packages/data/src/schema` nUNCA deve
 * produzir diff sem regenerar + revisar os arquivos (paridade com o lado Rust).
 */
const GOLDEN_DIR = join(import.meta.dirname, '../../../cecistudy-rust/contracts/golden');
const WRITE = process.env.GOLDEN_WRITE === '1';

function fixtures(): { empty: BackupV2; sample: BackupV2 } {
  const empty = goldenEnvelope(emptySnapshot());
  const sample = goldenEnvelope(sampleSnapshot());
  return { empty, sample };
}

function writeIfEnabled(): void {
  if (!WRITE) return;
  const { empty, sample } = fixtures();
  const dirs = [join(GOLDEN_DIR, 'collections/empty'), join(GOLDEN_DIR, 'collections/sample')];
  for (const d of dirs) mkdirSync(d, { recursive: true });

  writeFileSync(join(GOLDEN_DIR, 'full_backup.empty.json'), canonicalize(empty) + '\n');
  writeFileSync(join(GOLDEN_DIR, 'full_backup.sample.json'), canonicalize(sample) + '\n');

  for (const [label, envelope] of [
    ['empty', empty],
    ['sample', sample],
  ] as const) {
    const payload = envelope.payload as Record<string, unknown>;
    for (const key of goldenCollectionKeys(payload)) {
      writeFileSync(
        join(GOLDEN_DIR, `collections/${label}/${key}.json`),
        canonicalize(payload[key]) + '\n'
      );
    }
  }
}

beforeAll(writeIfEnabled);

function readGolden(rel: string): string {
  const p = join(GOLDEN_DIR, rel);
  if (!existsSync(p)) throw new Error(`golden ausente — gere com GOLDEN_WRITE=1: ${rel}`);
  return readFileSync(p, 'utf8').trim();
}

describe('golden fixtures (F0.4)', () => {
  it('envelope vazio bate com full_backup.empty.json', () => {
    expect(canonicalize(goldenEnvelope(emptySnapshot()))).toBe(readGolden('full_backup.empty.json'));
  });

  it('envelope cênico bate com full_backup.sample.json', () => {
    expect(canonicalize(goldenEnvelope(sampleSnapshot()))).toBe(
      readGolden('full_backup.sample.json')
    );
  });

  it('cada coleção do estado cênico bate com o arquivo por-coleção', () => {
    const payload = goldenEnvelope(sampleSnapshot()).payload as Record<string, unknown>;
    for (const key of goldenCollectionKeys(payload)) {
      expect(canonicalize(payload[key]), `coleção ${key}`).toBe(
        readGolden(`collections/sample/${key}.json`)
      );
    }
  });

  it('cada coleção do estado vazio bate com o arquivo por-coleção', () => {
    const payload = goldenEnvelope(emptySnapshot()).payload as Record<string, unknown>;
    for (const key of goldenCollectionKeys(payload)) {
      expect(canonicalize(payload[key]), `coleção ${key}`).toBe(
        readGolden(`collections/empty/${key}.json`)
      );
    }
  });

  it('arquivos em collections/ seguem 1-por-coleção (nenhum órfão/extra)', () => {
    for (const label of ['empty', 'sample'] as const) {
      const expected = new Set(
        goldenCollectionKeys(goldenEnvelope(label === 'empty' ? emptySnapshot() : sampleSnapshot()).payload as Record<string, unknown>)
      );
      const files = readdirSync(join(GOLDEN_DIR, `collections/${label}`))
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''));
      expect(files.sort()).toEqual([...expected].sort());
    }
  });

  it('golden file é canonical JSON v1 (chaves ordenadas)', () => {
    const raw = readGolden('full_backup.sample.json');
    const reparsed = JSON.parse(raw) as Record<string, unknown>;
    expect(canonicalize(reparsed)).toBe(raw);
  });
});