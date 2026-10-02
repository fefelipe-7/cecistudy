/**
 * Contrato de data civil do agendamento (regressão de fuso horário).
 *
 * ## O bug
 *
 * `todayISO()` zerava em hora **local** e devolvia `toISOString().slice(0,10)`,
 * que é **UTC**. Duas coisas quebravam, nas duas pontas do fuso:
 *
 * | fuso | defeito | sintoma |
 * |---|---|---|
 * | `Asia/Tokyo` (UTC+9) | meia-noite local → dia **anterior** em UTC | "hoje" responde *ontem* |
 * | `America/Bahia` (UTC-3) após 21h | instante já é o dia seguinte em UTC | cartão novo prometia `2d` em vez de `1d` |
 *
 * `schedule()` tinha o segundo defeito: calculava `due` a partir de `new Date()`
 * (relógio real), **ignorando o `nowIso` recebido** — então a mesma entrada
 * produzia saídas diferentes conforme a hora do dia, e `nowIso` injetado não
 * tornava nada testável.
 *
 * ## A regra fixada
 *
 * Toda data do módulo é **civil local** (`YYYY-MM-DD`), e `daysBetween` faz o
 * parse em hora local. Logo `due` tem de sair do mesmo fuso de `nowIso`.
 * `toISOString()` não pode aparecer neste caminho.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { addDaysISO, daysBetween, initCard, localDateISO, schedule, todayISO } from '../fsrs';

const TZ_ORIGINAL = process.env.TZ;

const emFuso = <T>(tz: string, fn: () => T): T => {
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (TZ_ORIGINAL === undefined) delete process.env.TZ;
    else process.env.TZ = TZ_ORIGINAL;
  }
};

/** Fuso a oeste de UTC: o instante local já virou "o dia seguinte" em UTC à noite. */
const FUSO_OESTE = 'America/Bahia';
/** Fuso a leste de UTC: a meia-noite local vira o dia **anterior** em UTC. */
const FUSO_LESTE = 'Asia/Tokyo';

/** Dia civil local real, calculado sem passar por UTC. */
const diaLocalReal = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

afterEach(() => {
  if (TZ_ORIGINAL === undefined) delete process.env.TZ;
  else process.env.TZ = TZ_ORIGINAL;
});

describe('localDateISO devolve o dia civil local, nunca o dia UTC', () => {
  it.each([FUSO_OESTE, FUSO_LESTE, 'Pacific/Kiritimati', 'UTC', 'Europe/Berlin'])(
    'em %s, todayISO() é o dia local real',
    (tz) => {
      // Ambos os lados são calculados **dentro** do fuso: comparar contra um
      // valor obtido depois da restauração não testaria nada.
      const [visto, esperado] = emFuso(tz, () => [todayISO(), diaLocalReal()] as const);
      expect(visto).toBe(esperado);
    },
  );

  it('formata com zero à esquerda (mês e dia < 10)', () => {
    // 2026-01-05: o bug de `slice` sem padding apareceria como "2026-1-5".
    const d = new Date(2026, 0, 5);
    expect(localDateISO(d)).toBe('2026-01-05');
  });

  it('nunca devolve o dia anterior (a falha em fusos a leste de UTC)', () => {
    const [hoje, ontem] = emFuso(FUSO_LESTE, () => {
      const hoje = todayISO();
      return [hoje, addDaysISO(hoje, -1)] as const;
    });
    expect(ontem).not.toBe(hoje);
    expect(daysBetween(ontem, hoje)).toBe(1);
  });
});

describe('schedule ancora o due em nowIso, não no relógio real', () => {
  it('cartão novo com nowIso explícito vence em exatamente 1 dia', () => {
    const card = initCard({ id: 'c1', due: '2026-03-10', lastReviewed: '2026-03-10', timesReviewed: 0 });
    const out = schedule(card, 2, '2026-03-10');
    expect(daysBetween('2026-03-10', out.due)).toBe(1);
  });

  it('a mesma entrada produz o mesmo due em qualquer fuso e qualquer hora', () => {
    const card = initCard({ id: 'c1', due: '2026-03-10', lastReviewed: '2026-03-10', timesReviewed: 0 });
    const oeste = emFuso(FUSO_OESTE, () => schedule(card, 2, '2026-03-10').due);
    const leste = emFuso(FUSO_LESTE, () => schedule(card, 2, '2026-03-10').due);
    expect(leste).toBe(oeste);
  });

  it('due nunca "anda" por causa do relógio real (nowIso manda)', () => {
    const card = initCard({ id: 'c1', due: '2026-03-10', lastReviewed: '2026-03-10', timesReviewed: 0 });
    // `nowIso` no passado: o vencimento é relativo a ele, não a hoje.
    const out = schedule(card, 2, '2026-03-10');
    expect(out.due < diaLocalReal()).toBe(true);
  });
});

describe('addDaysISO fecha o contrato com daysBetween', () => {
  it('ida e volta preserva a contagem de dias', () => {
    const base = '2026-02-27'; // ano bissexto
    expect(addDaysISO(base, 2)).toBe('2026-03-01');
    expect(daysBetween(base, addDaysISO(base, 2))).toBe(2);
  });

  it('atravessa a virada de ano', () => {
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('soma zero devolve a mesma data', () => {
    expect(addDaysISO('2026-07-15', 0)).toBe('2026-07-15');
  });
});