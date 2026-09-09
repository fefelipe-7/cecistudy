import React from 'react';
import { CalendarItem, LayerConfig } from '../types';
import { getMonthCalendarGrid, parseDateSafe, isToday } from '../utils/dateUtils';

interface CalendarMonthViewProps {
  items: CalendarItem[];
  layers: LayerConfig[];
  selectedDate: string;
  selectedItem: CalendarItem | null;
  onSelectItem: (item: CalendarItem) => void;
  onSelectDate: (date: string) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  items,
  layers,
  selectedDate,
  selectedItem,
  onSelectItem,
  onSelectDate,
}) => {
  const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));
  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const dateObj = parseDateSafe(selectedDate);
  const year = dateObj.getFullYear();
  const monthIndex = dateObj.getMonth();

  const monthGrid = getMonthCalendarGrid(year, monthIndex);

  const getLayerColor = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    return layer?.colorHex || '#D85F79';
  };

  return (
    <div id="calendar-month-view" className="flex-1 flex flex-col min-w-0 bg-[#FFFCF8] overflow-y-auto select-none">
      {/* Month Header Days */}
      <div className="grid grid-cols-7 border-b border-[#E9DFDC] bg-[#FAF8F5] shrink-0">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="py-2.5 px-3 text-xs font-bold text-[#918689] uppercase tracking-wider border-r border-[#E9DFDC] last:border-r-0 text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Perpetual Month Grid */}
      <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-[640px] bg-[#E9DFDC] gap-px">
        {monthGrid.map((cell, index) => {
          const dayItems = items.filter(
            (i) => i.date === cell.fullDate && visibleLayerIds.has(i.layer)
          );
          const isSelected = cell.fullDate === selectedDate;

          return (
            <div
              key={`month-cell-${cell.fullDate}-${index}`}
              onClick={() => onSelectDate(cell.fullDate)}
              className={`p-2 min-h-[110px] transition-colors flex flex-col justify-between cursor-pointer group ${
                cell.isCurrentMonth
                  ? isSelected
                    ? 'bg-[#FFF5F7]'
                    : 'bg-[#FFFCF8] hover:bg-[#FFF8F1]'
                  : 'bg-[#FAF8F5]/60 text-[#ADA3A5]'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    cell.isToday
                      ? 'w-6 h-6 rounded-full bg-[#D85F79] text-white flex items-center justify-center shadow-xs font-mono'
                      : isSelected
                      ? 'w-6 h-6 rounded-full bg-[#FFE9EE] text-[#D85F79] flex items-center justify-center font-bold'
                      : cell.isCurrentMonth
                      ? 'text-[#40383A]'
                      : 'text-[#ADA3A5]'
                  }`}
                >
                  {cell.dayOfMonth}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[10px] font-semibold text-[#918689]">
                    {dayItems.length} {dayItems.length === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </div>

              {/* Event Chips */}
              <div className="flex flex-col gap-1 mt-1.5 overflow-hidden">
                {dayItems.slice(0, 3).map((item) => {
                  const isItemSelected = selectedItem?.id === item.id;
                  const color = getLayerColor(item.layer);

                  return (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item);
                      }}
                      style={{
                        borderLeftColor: color,
                        borderLeftWidth: '3px',
                      }}
                      className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold truncate transition-colors border cursor-pointer ${
                        isItemSelected
                          ? 'bg-[#FFE9EE] text-[#71303F] border-[#FFD3DD]'
                          : 'bg-[#FAF8F5] hover:bg-[#FFF5F7] text-[#40383A] border-[#E9DFDC]'
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}

                {dayItems.length > 3 && (
                  <span className="text-[10px] font-semibold text-[#D85F79] pl-1">
                    +{dayItems.length - 3} mais...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
