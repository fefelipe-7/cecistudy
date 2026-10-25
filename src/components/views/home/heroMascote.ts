// Arte do hero da Home — só o hero usa estas oito. Elas não entram em
// `Mascote`/empty states de propósito: são ilustrações de cena, maiores que a
// mascotinha de canto.
import type { SaudacaoTurno } from '../../../lib/voice';

import breakfastHappy from '../../../assets/mascote/hero/breakfast-happy.webp';
import jugglingDay from '../../../assets/mascote/hero/juggling-day.webp';
import bikeRide from '../../../assets/mascote/hero/bike-ride.webp';
import heatFan from '../../../assets/mascote/hero/heat-fan.webp';
import snorkelDream from '../../../assets/mascote/hero/snorkel-dream.webp';
import jumpHello from '../../../assets/mascote/hero/jump-hello.webp';
import blanketCozy from '../../../assets/mascote/hero/blanket-cozy.webp';
import booksCozy from '../../../assets/mascote/hero/books-cozy.webp';

export const HERO_MASCOTES = {
  'breakfast-happy': breakfastHappy,
  'juggling-day': jugglingDay,
  'bike-ride': bikeRide,
  'heat-fan': heatFan,
  'snorkel-dream': snorkelDream,
  'jump-hello': jumpHello,
  'blanket-cozy': blanketCozy,
  'books-cozy': booksCozy,
} as const;

export type HeroMascoteExpression = keyof typeof HERO_MASCOTES;

/** Duas artes por turno; o dia par pega a primeira, o ímpar a segunda. */
const POR_TURNO: Record<SaudacaoTurno, [HeroMascoteExpression, HeroMascoteExpression]> = {
  madrugada: ['books-cozy', 'snorkel-dream'],
  manha: ['breakfast-happy', 'jump-hello'],
  tarde: ['bike-ride', 'heat-fan'],
  noite: ['blanket-cozy', 'juggling-day'],
};

/** A arte do hero: combina com o turno e alterna a cada dia (as oito aparecem). */
export function heroMascote(turno: SaudacaoTurno, dia: number): HeroMascoteExpression {
  const [par, impar] = POR_TURNO[turno];
  return dia % 2 === 0 ? par : impar;
}
