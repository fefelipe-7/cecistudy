import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

interface MoodCalendarWidgetProps {
  /** Optional: if true, show only a compact version */
  compact?: boolean;
}

export const MoodCalendarWidget: React.FC<MoodCalendarWidgetProps> = ({
  compact = false,
}) => {
  const { moodHistory } = useApp();

  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay(); // 0 = Sunday

  // Build a map of date string -> MoodEntry for quick lookup
  const moodMap = useMemo(() => {
    const map = new Map<string, import('../../types').MoodEntry>();
    moodHistory.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [moodHistory]);

  // Generate array of cells for the calendar (including blanks before first day)
  const cells: (string | null)[] = [];
  // Add blank cells for days before the 1st
  for (let i = 0; i < startingDay; i++) {
    cells.push(null);
  }
  // Add each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push(date);
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  return (
    <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2">
        <h3 className="font-display font-bold text-xl text-ceci-primary">
          calendário de humor
        </h3>
        <p className="text-xs text-ceci-secondary">
          {monthNames[month]} {year}
        </p>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 text-[10px] font-medium text-ceci-tertiary">
        {weekDays.map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          const isBlank = cell === null;
          const isToday =
            !isBlank &&
            cell ===
              `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const moodEntry = !isBlank ? moodMap.get(cell) : undefined;

          return (
            <div
              key={index}
              className={`
                rounded-xl p-2 text-center ${
                  isBlank
                    ? 'bg-surface-muted'
                    : isToday
                    ? 'bg-surface-rose border border-ceci-brand-brand'
                    : 'bg-white border border-ceci-border-default hover:bg-surface-muted'
                } cursor-pointer
              `}
            >
              {isBlank ? (
                <div className="text-xs text-ceci-tertiary"> — </div>
              ) : (
                <>
                  <div className="font-bold text-[12px]">{cell?.split('-')[2]}</div>
                  {moodEntry ? (
                    <>
                      <div className="text-2xl mb-1">{moodEntry.emoji}</div>
                      <div className="text-xs text-ceci-secondary">{moodEntry.label}</div>
                    </>
                  ) : (
                    <div className="text-xs text-ceci-muted">sem registro</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend / note */}
      <div className="text-xs text-ceci-secondary text-center">
        toque em um dia para ver detalhes (em desenvolvimento) ♡
      </div>
    </div>
  );
};