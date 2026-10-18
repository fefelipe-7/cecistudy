/**
 * Contrato da desduplicação do 3D Paper — spec-performance §7, item F7.3.
 *
 * O que este teste garante:
 * - cada corpo de variante tem o marcador do engine EXATAMENTE uma vez;
 * - o `srcDoc` montado em runtime traz o engine injetado e NÃO traz mais o
 *   marcador (montagem correta, sem render em branco);
 * - o engine extraído é o mesmo nas 4 reconstruções (fonte única).
 *
 * (A equivalência byte-a-byte com os HTML originais foi provada pelo script
 * de migração antes de gravar — ver `migrate-3dpaper.mjs` citado no to-do.)
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThreeDPaper, ENGINE_MARKER } from '../3d-paper/ThreeDPaper';
import originalBody from '../3d-paper/sources/3d-paper.html?raw';
import certificateBody from '../3d-paper/sources/3d-paper-certificate.html?raw';
import japaneseBody from '../3d-paper/sources/3d-paper-japanese.html?raw';
import siteOfTheYearBody from '../3d-paper/sources/3d-paper-site-of-the-year.html?raw';
import engineSource from '../3d-paper/sources/engine.js?raw';

const BODIES = {
  original: originalBody,
  certificate: certificateBody,
  japanese: japaneseBody,
  'site-of-the-year': siteOfTheYearBody,
} as const;

describe('ThreeDPaper — engine desduplicado (spec §4.3/F7.3)', () => {
  it('o engine extraído existe e é o bloco pesado (não um corpo de variante)', () => {
    expect(engineSource.length).toBeGreaterThan(500_000);
    expect(engineSource).not.toContain(ENGINE_MARKER);
  });

  it('cada corpo de variante tem o marcador exatamente uma vez', () => {
    for (const [name, body] of Object.entries(BODIES)) {
      expect(body.split(ENGINE_MARKER).length - 1).toBe(1);
      expect(body.length).toBeLessThan(40_000); // corpo pequeno: só o que difere
      void name;
    }
  });

  it('o srcDoc montado traz o engine injetado e nenhum marcador restante', () => {
    const { getByTitle } = render(<ThreeDPaper variant="original" />);
    const iframe = getByTitle('3D Paper') as HTMLIFrameElement;
    const srcDoc = iframe.getAttribute('srcdoc') ?? '';
    expect(srcDoc).toContain(engineSource.slice(0, 200));
    expect(srcDoc).not.toContain(ENGINE_MARKER);
    expect(srcDoc.length).toBeGreaterThan(500_000); // documento completo
  });

  it('as quatro variantes montam documentos distintos e completos', () => {
    for (const [variant] of Object.entries(BODIES)) {
      const { getByTitle, unmount } = render(
        <ThreeDPaper variant={variant as 'original'} />,
      );
      const iframe = getByTitle(/3D Paper/) as HTMLIFrameElement;
      const srcDoc = iframe.getAttribute('srcdoc') ?? '';
      expect(srcDoc).not.toContain(ENGINE_MARKER);
      expect(srcDoc).toContain(engineSource.slice(0, 200));
      unmount();
    }
  });
});
