// Calendário — mês navegável (SPEC-024 D3/D6).
// Desenho herdado da antiga sub-aba da Faculdade; a chave da grade é `DateKey`
// (`YYYY-MM-DD`), nunca o dia do mês: dezembro e janeiro não colidem (I10).
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEntry } from '../../../lib/schedule';
import type { DateKey } from '../../../types';
import { daysInMonth, monthName } from '../../../lib/schedule';

const WEEKDAY_HEADERS = ['d', 's', 't', 'q', 'q', 's', 's'];

const pad = (n: number) => String(n).padStart(2, '0');

/** `DateKey` a partir de ano/mês/dia locais — sem passar por UTC. */
export const dateKeyOf = (year: number, month: number, day: number): DateKey =>
  `${year}-${pad(month)}-${pad(day)}`;

interface CalendarMonthProps {
  year: number;
  month: number;
  /** Itens do mês visível, já agregados por `buildCalendarEntries` (D4). */
  entries: CalendarEntry[];
  today: DateKey;
  selected: DateKey | null;
  onShift: (delta: number) => void;
  onToday: () => void;
  onSelect: (day: DateKey | null) => void;
}

const CalendarMonth: React.FC<CalendarMonthProps> = ({
  year,
  month,
  entries,
  today,
  selected,
  onShift,
  onToday,
  onSelect,
}) => {
  const totalDays = daysInMonth(year, month);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const isCurrentMonth = today.startsWith(`${year}-${pad(month)}`);

  const daysWithEntries = new Set(entries.map((e) => e.date));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="font-display text-base font-bold text-ceci-primary">
          {monthName(year, month)} <span className="text-ceci-tertiary font-medium">{year}</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onShift(-1)}
            aria-label="mês anterior"
            className="w-8 h-8 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={onToday}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand hover:bg-surface-rose transition-colors cursor-pointer"
            >
              hoje
            </button>
          )}
          <button
            onClick={() => onShift(1)}
            aria-label="próximo mês"
            className="w-8 h-8 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-ceci-tertiary py-1 border-b border-ceci-border-default">
        {WEEKDAY_HEADERS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
        {Array.from({ length: firstWeekday }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const key = dateKeyOf(year, month, day);
          const hasEntry = daysWithEntries.has(key);
          const isToday = key === today;
          const isSelected = key === selected;

          return (
            <button
              key={key}
              onClick={() => onSelect(isSelected ? null : key)}
              aria-label={`dia ${day}${hasEntry ? ', tem itens' : ''}`}
              className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[40px] font-medium transition-colors cursor-pointer ${
                isToday
                  ? 'bg-ceci-brand-strong text-ceci-on-brand shadow-2xs font-bold'
                  : isSelected
                    ? 'bg-surface-blue text-ceci-academic-strong font-bold border border-ceci-border-academic'
                    : hasEntry
                      ? 'bg-surface-rose text-ceci-brand-strong font-bold border border-ceci-border-brand hover:bg-surface-rose'
                      : 'bg-surface-muted text-ceci-primary hover:bg-surface-subtle'
              }`}
            >
              <span>{day}</span>
              {hasEntry && <span className="w-1 h-1 rounded-full bg-current mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonth;
