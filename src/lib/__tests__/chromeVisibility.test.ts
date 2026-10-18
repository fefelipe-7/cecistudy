/**
 * Máquina de visibilidade do chrome (SPEC-M-019 §5.3).
 *
 * Função pura, sem DOM e sem React: é o que permite cobrir a tabela de eventos
 * inteira — inclusive as combinações que só quebram em aparelho — sem simular
 * rolagem de verdade.
 */

import { describe, expect, it } from 'vitest';

import {
  chromeReducer,
  ESTADO_INICIAL,
  IDLE_HIDE_MS,
  precisaDeInert,
  SCROLL_DEAD_ZONE_PX,
  TOP_PX,
  type ChromeEvent,
  type ChromeState,
} from '../chromeVisibility';

const reduce = (estado: ChromeState, evento: ChromeEvent) => chromeReducer(estado, evento);

const rolou = (delta: number, scrollY = 500) =>
  ({ type: 'rolou', delta, scrollY }) as ChromeEvent;
const parou = (aposMs: number = IDLE_HIDE_MS) =>
  ({ type: 'parou', aposMs }) as ChromeEvent;
const focou = (dentro: boolean) => ({ type: 'focou', dentro }) as ChromeEvent;

/** Estado médio: visível, fora do topo, sem menu, sem foco. */
const MEIO: ChromeState = { visivel: true, noTopo: false, preso: false, foco: false };

describe('chromeReducer — rolando (A5)', () => {
  it('rolar para baixo esconde', () => {
    expect(reduce(MEIO, rolou(40)).visivel).toBe(false);
  });

  it('rolar para cima mostra', () => {
    expect(reduce({ ...MEIO, visivel: false }, rolou(-40)).visivel).toBe(true);
  });

  it('a direção importa, não o estado atual', () => {
    // Escondida + para cima ⇒ aparece. Mostrada + para baixo ⇒ some.
    expect(reduce({ ...MEIO, visivel: false }, rolou(-1 - SCROLL_DEAD_ZONE_PX)).visivel).toBe(true);
    expect(reduce(MEIO, rolou(1 + SCROLL_DEAD_ZONE_PX)).visivel).toBe(false);
  });

  it('na zona morta não muda nada — e devolve a MESMA referência', () => {
    for (const delta of [0, 1, -1, SCROLL_DEAD_ZONE_PX, -SCROLL_DEAD_ZONE_PX]) {
      expect(reduce(MEIO, rolou(delta))).toBe(MEIO);
    }
  });

  it('no topo, a direção não importa: sempre visível (J3)', () => {
    for (const delta of [-100, 0, 100]) {
      const s = reduce({ ...MEIO, visivel: false }, rolou(delta, 0));
      expect(s.visivel).toBe(true);
      expect(s.noTopo).toBe(true);
    }
  });

  it('o topo vence a direção mesmo indo para baixo', () => {
    const s = reduce({ ...MEIO, visivel: true }, rolou(100, TOP_PX));
    expect(s.visivel).toBe(true);
    expect(s.noTopo).toBe(true);
  });

  it('rolar para cima tira a marca de topo', () => {
    expect(reduce({ ...ESTADO_INICIAL }, rolou(-30, 400)).noTopo).toBe(false);
  });
});

describe('chromeReducer — somando por inatividade (A5)', () => {
  it('3 s parada fora do topo esconde', () => {
    expect(reduce(MEIO, parou()).visivel).toBe(false);
  });

  it('antes do tempo, nada', () => {
    expect(reduce(MEIO, parou(IDLE_HIDE_MS - 1)).visivel).toBe(true);
  });

  it('no topo, nunca some sozinho', () => {
    expect(reduce({ ...ESTADO_INICIAL }, parou()).visivel).toBe(true);
  });

  it('já escondido, `parou` é idempotente', () => {
    const escondido = { ...MEIO, visivel: false };
    expect(reduce(escondido, parou())).toEqual(escondido);
  });
});

describe('chromeReducer — menu (D8)', () => {
  it('abrir o menu prende e mostra', () => {
    const s = reduce(MEIO, { type: 'menu-abriu' });
    expect(s.preso).toBe(true);
    expect(s.visivel).toBe(true);
  });

  it('preso, nem rolagem nem inatividade escondem (J7)', () => {
    const preso = reduce(MEIO, { type: 'menu-abriu' });
    expect(reduce(preso, rolou(200)).visivel).toBe(true);
    expect(reduce(preso, parou()).visivel).toBe(true);
    expect(reduce(preso, parou()).preso).toBe(true);
  });

  it('fechar o menu solta o estado de preso', () => {
    const s = reduce(reduce(MEIO, { type: 'menu-abriu' }), { type: 'menu-fechou' });
    expect(s.preso).toBe(false);
    expect(s.visivel).toBe(true);
  });

  it('fechar o menu com a barra já oculta devolve o que estava', () => {
    const preso = reduce(MEIO, { type: 'menu-abriu' });
    expect(reduce(preso, { type: 'menu-fechou' }).visivel).toBe(true);
  });
});

describe('chromeReducer — foco de teclado (A8, J6)', () => {
  it('foco entrando dentro mostra a barra', () => {
    const s = reduce({ ...MEIO, visivel: false }, focou(true));
    expect(s.foco).toBe(true);
    expect(s.visivel).toBe(true);
  });

  it('com o foco dentro, nem rolagem nem inatividade escondem (J6)', () => {
    const comFoco = reduce(MEIO, focou(true));
    expect(reduce(comFoco, rolou(200)).visivel).toBe(true);
    expect(reduce(comFoco, parou()).visivel).toBe(true);
    expect(reduce(comFoco, parou()).foco).toBe(true);
  });

  it('sair do foco devolve o sumiço', () => {
    const comFoco = reduce(MEIO, focou(true));
    expect(reduce(comFoco, focou(false)).foco).toBe(false);
  });

  it('o foco sobrevive à navegação — quem prende é o estado atual', () => {
    const comFoco = reduce(MEIO, focou(true));
    expect(reduce(comFoco, { type: 'navegou' }).foco).toBe(true);
  });
});

describe('chromeReducer — navegar (D1)', () => {
  it('tela nova começa visível e no topo', () => {
    const escondido: ChromeState = { visivel: false, noTopo: false, preso: false, foco: false };
    const s = reduce(escondido, { type: 'navegou' });
    expect(s).toEqual({ visivel: true, noTopo: true, preso: false, foco: false });
  });

  it('navegar com o menu aberto continua preso', () => {
    const s = reduce({ visivel: true, noTopo: false, preso: true, foco: false }, { type: 'navegou' });
    expect(s.preso).toBe(true);
  });
});

describe('chromeReducer — totalidade', () => {
  const estados: ChromeState[] = [
    ESTADO_INICIAL,
    MEIO,
    { visivel: false, noTopo: false, preso: false, foco: false },
    { visivel: true, noTopo: true, preso: true, foco: false },
    { visivel: false, noTopo: false, preso: true, foco: false },
    { visivel: false, noTopo: false, preso: false, foco: true },
  ];
  const eventos: ChromeEvent[] = [
    rolou(100, 800),
    rolou(-100, 800),
    rolou(1, 800),
    rolou(0, 0),
    parou(),
    parou(10),
    { type: 'navegou' },
    { type: 'menu-abriu' },
    { type: 'menu-fechou' },
    { type: 'focou', dentro: true },
    { type: 'focou', dentro: false },
  ];

  it('nenhum par lança, e o estado devolvido é coerente', () => {
    for (const e of estados) {
      for (const ev of eventos) {
        const s = reduce(e, ev);
        expect(typeof s.visivel).toBe('boolean');
        expect(typeof s.noTopo).toBe('boolean');
        expect(typeof s.preso).toBe('boolean');
        // Invariante estrutural: prender (menu aberto ou foco dentro) implica visível.
        if (s.preso || s.foco) expect(s.visivel).toBe(true);
      }
    }
  });

  it('nenhum evento devolve estado fora de forma', () => {
    for (const ev of eventos) {
      const s = reduce(ESTADO_INICIAL, ev);
      expect(Object.keys(s).sort()).toEqual(['foco', 'noTopo', 'preso', 'visivel']);
    }
  });
});

describe('precisaDeInert (D2)', () => {
  it('barra oculta recebe inert; visível, não', () => {
    expect(precisaDeInert({ visivel: false, noTopo: false, preso: false, foco: false })).toBe(true);
    expect(precisaDeInert(MEIO)).toBe(false);
  });

  it('preso nunca fica sem inert indevido', () => {
    expect(precisaDeInert({ visivel: true, noTopo: false, preso: true, foco: false })).toBe(false);
  });

  it('com o foco dentro a barra é visível, então **não** tem inert (J6)', () => {
    expect(precisaDeInert({ visivel: true, noTopo: false, preso: false, foco: true })).toBe(false);
  });
});