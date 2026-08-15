export interface LooseNote {
  id: string;
  title: string;
  content: string;
  category: 'reflexão' | 'estudo' | 'ideia' | 'lembrete';
  date: string;
}

export const CATEGORY_BADGE: Record<LooseNote['category'], string> = {
  'reflexão': 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand',
  'estudo': 'bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic',
  'ideia': 'bg-amber-bg text-amber-text border border-amber-border',
  'lembrete': 'bg-surface-muted text-ceci-secondary border border-ceci-border-default',
};

/** Formata um timestamp ISO para exibição amigável em pt-BR (ex.: "hoje, 11:30"). */
export function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `hoje, ${time}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return `ontem, ${time}`;
  return d
    .toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    .replace('.', '')
    .toLowerCase();
}
