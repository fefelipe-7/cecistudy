import { describe, expect, it, vi } from 'vitest';
import {
  buildEnrichmentPlan,
  enrichPendingWith,
  enrichReadingWith,
  MAX_ENRICH_ATTEMPTS,
  type EnrichResult,
  type HttpResult,
  type Transport,
} from '../enrichReading';
import type { ReadingItem } from '../../types';

const okJson = (data: unknown): HttpResult => ({ status: 200, data, text: JSON.stringify(data) });
const okText = (text: string): HttpResult => ({ status: 200, data: text, text });

const reading = (patch: Partial<ReadingItem> = {}): ReadingItem =>
  ({
    id: 'rdr-1',
    title: 'site.com',
    url: 'https://site.com/artigo',
    author: 'autor não informado',
    type: 'artigo',
    status: 'nao_iniciado',
    enrichStatus: 'pendente',
    ...patch,
  }) as ReadingItem;

const crossref = (authorN = 2) => ({
  message: {
    title: ['Título vindo do Crossref'],
    author: Array.from({ length: authorN }, (_, i) => ({
      family: `Sobrenome${i}`,
      given: `Nome${i}`,
    })),
    ['container-title']: ['Revista Fonte'],
    volume: '5',
    page: '10-22',
    ['published-print']: { ['date-parts']: [[2017, 3, 1]] },
    DOI: '10.1000/titulo.x',
  },
});

describe('buildEnrichmentPlan (SPEC-012 §7.3 item 0)', () => {
  it('DOI do campo vence (consulta Crossref)', () => {
    const plan = buildEnrichmentPlan({ id: 'r', doi: 'https://doi.org/10.1000/x' });
    expect(plan?.source).toBe('crossref');
    expect(plan?.url).toBe('https://api.crossref.org/works/10.1000/x');
  });

  it('DOI extraído da URL também consulta Crossref', () => {
    const plan = buildEnrichmentPlan({ id: 'r', url: 'https://doi.org/10.1000/abc.def' });
    expect(plan?.source).toBe('crossref');
  });

  it('sem DOI: busca a própria página', () => {
    const plan = buildEnrichmentPlan({ id: 'r', url: 'https://site.com/artigo' });
    expect(plan?.source).toBe('page');
    expect(plan?.url).toBe('https://site.com/artigo');
  });

  it('sem DOI e sem URL: nada a buscar', () => {
    expect(buildEnrichmentPlan({ id: 'r' })).toBeNull();
  });
});

describe('enrichReadingWith (transporte injetado)', () => {
  it('Crossref: título e autores separados entram no patch', async () => {
    const transport: Transport = vi.fn(async () => okJson(crossref()));
    const res = await enrichReadingWith(reading({ doi: 'https://doi.org/10.1000/titulo.x' }), transport);
    expect(res.kind).toBe('ok');
    if (res.kind !== 'ok') return;
    expect(res.patch.title).toBe('Título vindo do Crossref');
    expect(res.patch.authors).toEqual([
      { family: 'Sobrenome0', given: 'Nome0' },
      { family: 'Sobrenome1', given: 'Nome1' },
    ]);
    expect(res.patch.year).toBe('2017');
    expect(res.patch.enrichStatus).toBe('ok');
  });

  it('página: metatags Highwire entram no patch', async () => {
    const transport: Transport = vi.fn(async () =>
      okText(
        '<meta name="citation_title" content="Título da página"><meta name="citation_author" content="Worden, J.">',
      ),
    );
    const res = await enrichReadingWith(reading(), transport);
    expect(res.kind).toBe('ok');
    if (res.kind !== 'ok') return;
    expect(res.patch.title).toBe('Título da página');
    expect(res.patch.authors).toEqual([{ family: 'Worden', given: 'J.' }]);
  });

  it('HTTP de erro vira falhou', async () => {
    const transport: Transport = vi.fn(async () => ({ status: 404, data: null, text: '' }));
    const res = await enrichReadingWith(reading(), transport);
    expect(res.kind).toBe('falhou');
  });

  it('transporte lança online → falhou; offline → offline (mantém pendente)', async () => {
    const throwing: Transport = vi.fn(async () => {
      throw new Error('net');
    });
    expect((await enrichReadingWith(reading(), throwing)).kind).toBe('falhou');

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      expect((await enrichReadingWith(reading(), throwing)).kind).toBe('offline');
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
  });
});

describe('enrichPendingWith (abertura do app)', () => {
  it('só pendentes com url/doi são processados; escreve uma única vez', async () => {
    const ok: EnrichResult = {
      kind: 'ok',
      patch: { enrichStatus: 'ok', title: 'Título de verdade' },
    };
    const enrich = vi.fn(async () => ok);
    const prev = [reading(), reading({ id: 'rdr-2', enrichStatus: undefined })];
    let state = prev;
    const setReadings = vi.fn((fn: (p: typeof prev) => typeof prev) => {
      state = fn(state);
    });

    await enrichPendingWith(prev, setReadings, enrich);

    expect(enrich).toHaveBeenCalledTimes(1); // só a pendente com url
    expect(state[0].title).toBe('Título de verdade');
    expect(state[0].enrichStatus).toBe('ok');
    expect(state[1].title).toBe('site.com'); // intocada
  });

  it('offline incrementa tentativas; no teto vira falhou', async () => {
    const pending = reading({ enrichStatus: 'pendente', url: 'https://a.com' });
    let state = [pending];
    const fakeSet = vi.fn((fn: (p: ReadingItem[]) => ReadingItem[]) => {
      state = fn(state);
    });

    const offline: EnrichResult = { kind: 'offline' };
    for (let i = 0; i < MAX_ENRICH_ATTEMPTS; i += 1) {
      await enrichPendingWith(state, fakeSet, async () => offline);
      expect(fakeSet).toHaveBeenCalledTimes(i + 1);
    }
    // Depois de 3 aberturas sem rede: `falhou`, e nada mais a tentar.
    expect(state[0].enrichStatus).toBe('falhou');
    expect(state[0].enrichAttempts).toBe(MAX_ENRICH_ATTEMPTS);
  });
});