/** Horas em pt-BR: 1.5 → "1,5"; 2 → "2"; 0.25 → "0,25"; sem zeros sobrando. */
export const formatHours = (n: number): string => {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace('.', ',');
};

/** Com a unidade: "1,5 h". */
export const formatHoursBR = (n: number): string => `${formatHours(n)} h`;