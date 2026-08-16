import { describe, expect, it } from 'vitest';
import {
  isSemver,
  parseOtaManifest,
  semverCompare,
  shouldUpdate,
} from '../otaLogic';

describe('semverCompare', () => {
  it('compara patch numéricamente (1.0.10 > 1.0.9)', () => {
    expect(semverCompare('1.0.10', '1.0.9')).toBeGreaterThan(0);
  });

  it('compara major/minor/patch', () => {
    expect(semverCompare('1.0.0', '0.9.9')).toBeGreaterThan(0);
    expect(semverCompare('1.2.0', '1.3.0')).toBeLessThan(0);
    expect(semverCompare('1.0.0', '1.0.0')).toBe(0);
  });

  it('completa partes ausentes como zero', () => {
    expect(semverCompare('1.0', '1.0.0')).toBe(0);
    expect(semverCompare('2', '2.0.1')).toBeLessThan(0);
  });

  it('ignora metadata de build', () => {
    expect(semverCompare('1.0.1+build.5', '1.0.1')).toBe(0);
  });
});

describe('isSemver', () => {
  it('aceita semver válidos', () => {
    expect(isSemver('1.0.0')).toBe(true);
    expect(isSemver('1.2')).toBe(true);
    expect(isSemver('1.0.10')).toBe(true);
  });

  it('rejeita não-semver', () => {
    expect(isSemver('builtin')).toBe(false);
    expect(isSemver('abc')).toBe(false);
    expect(isSemver('1.0.0.0')).toBe(false);
    expect(isSemver('')).toBe(false);
  });
});

describe('parseOtaManifest', () => {
  it('parseia um manifest válido', () => {
    const manifest = parseOtaManifest({
      version: '1.0.7',
      url: 'https://example.com/bundles/1.0.7.zip',
      checksum: 'abc123',
      releasedAt: '2026-08-15T00:00:00Z',
    });
    expect(manifest.version).toBe('1.0.7');
    expect(manifest.url).toBe('https://example.com/bundles/1.0.7.zip');
    expect(manifest.checksum).toBe('abc123');
    expect(manifest.releasedAt).toBe('2026-08-15T00:00:00Z');
  });

  it('aceita releasedAt opcional', () => {
    const manifest = parseOtaManifest({
      version: '1.0.7',
      url: 'https://example.com/bundles/1.0.7.zip',
      checksum: 'abc123',
    });
    expect(manifest.releasedAt).toBeUndefined();
  });

  it('lança erro em manifest malformado', () => {
    expect(() => parseOtaManifest(null)).toThrow();
    expect(() => parseOtaManifest('nope')).toThrow();
    expect(() => parseOtaManifest({ version: 'x', url: 'u', checksum: 'c' })).toThrow();
    expect(() => parseOtaManifest({ version: '1.0.0', url: '', checksum: 'c' })).toThrow();
    expect(() => parseOtaManifest({ version: '1.0.0', url: 'u' })).toThrow();
  });
});

describe('shouldUpdate', () => {
  it('atualiza quando ainda está no bundle builtin', () => {
    expect(shouldUpdate('builtin', '1.0.7')).toBe(true);
    expect(shouldUpdate(null, '1.0.7')).toBe(true);
    expect(shouldUpdate(undefined, '1.0.7')).toBe(true);
  });

  it('atualiza quando a versão atual não é semver', () => {
    expect(shouldUpdate('v1', '1.0.7')).toBe(true);
  });

  it('não atualiza quando já está na versão mais nova', () => {
    expect(shouldUpdate('1.0.7', '1.0.7')).toBe(false);
    expect(shouldUpdate('1.0.9', '1.0.7')).toBe(false);
  });

  it('atualiza quando o manifest é mais novo', () => {
    expect(shouldUpdate('1.0.7', '1.0.8')).toBe(true);
    expect(shouldUpdate('1.0.9', '1.0.10')).toBe(true);
  });

  it('ignora manifest não-semver', () => {
    expect(shouldUpdate('1.0.0', 'builtin')).toBe(false);
  });
});