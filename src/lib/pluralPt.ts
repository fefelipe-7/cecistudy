// Plural pt-BR sem o bug do sufixo concatenation.
//
// O padrão `{palavra}{n !== 1 ? 'ões' : ''}` renderiza "sessãoões": ele concatena
// "ões" na palavra já flexionada. Em pt-BR o plural não é derivável por sufixo
// confiável ("sessão" → "sessões", mas "reflexão" → "reflexões" e "podcasts" →
// "podcasts"), então as duas formas entram explicitamente.

/** '2 sessões' · '1 sessão' · '0 sessões'. */
export const pluralPt = (n: number, singular: string, plural: string): string =>
  `${n} ${n === 1 ? singular : plural}`;

/** Só a palavra, sem o número. */
export const pluralWordPt = (n: number, singular: string, plural: string): string =>
  n === 1 ? singular : plural;