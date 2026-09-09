import React from 'react';
import { CalendarItem, LayerConfig } from '../types';
import { formatDatePtBR, formatDuration } from '../utils/dateUtils';
import {
  CheckCircle2,
  Clock,
  Play,
  FileText,
  Bookmark,
  GraduationCap,
  Users,
  AlertCircle,
} from 'lucide-react';

interface CalendarAgendaViewProps {
  items: CalendarItem[];
  layers: LayerConfig[];
  selectedItem: CalendarItem | null;
  onSelectItem: (item: CalendarItem) => void;
  onToggleStatus: (item: CalendarItem) => void;
  onStartTimer: (item: CalendarItem) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  items,
  layers,
  selectedItem,
  onSelectItem,
  onToggleStatus,
  onStartTimer,
}) => {
  const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));
  const filteredItems = items.filter((item) => visibleLayerIds.has(item.layer));

  // Group by date
  const groupedDates = Array.from(new Set<string>(filteredItems.map((i) => i.date))).sort();

  const getLayer = (layerId: string) => {
    return layers.find((l) => l.id === layerId) || layers[0];
  };

  return (
    <div id="calendar-agenda-view" className="flex-1 flex flex-col min-w-0 bg-[#FFFCF8] overflow-y-auto p-6 select-none">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between pb-2 border-b border-[#E9DFDC]">
          <div>
            <h2 className="text-xl font-bold font-display text-[#40383A]">Agenda Acadêmica</h2>
            <p className="text-xs text-[#918689]">
              Visualização sequencial de todos os eventos, blocos de foco e entregas
            </p>
          </div>
          <span className="text-xs font-semibold text-[#6D6366] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E9DFDC] shadow-2xs">
            {filteredItems.length} atividades cadastradas
          </span>
        </div>

        {groupedDates.map((dateStr) => {
          const dateItems = filteredItems
            .filter((i) => i.date === dateStr)
            .sort((a, b) => (a.startTime > b.startTime ? 1 : -1));

          return (
            <div key={dateStr} className="flex flex-col gap-3">
              {/* Date Header */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#40383A] bg-[#FAF8F5] px-3 py-1 rounded-xl border border-[#E9DFDC] shadow-2xs">
                  {formatDatePtBR(dateStr)}
                </span>
                <div className="h-px flex-1 bg-[#E9DFDC]" />
              </div>

              {/* Items for this date */}
              <div className="flex flex-col gap-2.5">
                {dateItems.map((item) => {
                  const layer = getLayer(item.layer);
                  const isSelected = selectedItem?.id === item.id;
                  const isCompleted = item.status === 'concluido';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-sm flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-[#D85F79] bg-[#FFF5F7] ring-2 ring-[#FFB8C7]/40'
                          : 'border-[#E9DFDC] hover:border-[#DCCFCA]'
                      }`}
                    >
                      {/* Left: Check status + Info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(item);
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 transition-colors ${
                            isCompleted
                              ? 'bg-[#5A9F76] border-[#5A9F76] text-white'
                              : 'border-[#DCCFCA] hover:border-[#5A9F76] bg-white'
                          }`}
                          title="Alternar conclusão"
                        >
                          {isCompleted && <CheckCircle2 size={14} />}
                        </button>

                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: layer.badgeBg,
                                color: layer.badgeText,
                              }}
                            >
                              {layer.label} • {item.categoryLabel}
                            </span>

                            <span className="text-xs font-mono text-[#918689] font-semibold">
                              {item.isAllDay
                                ? 'Dia inteiro'
                                : `${item.startTime} — ${item.endTime}`}
                            </span>

                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                item.commitment === 'obrigatorio'
                                  ? 'bg-[#F3F9FC] text-[#396D82]'
                                  : item.commitment === 'importante'
                                  ? 'bg-[#FFF5F7] text-[#B94862]'
                                  : 'bg-[#F2FAF5] text-[#356647]'
                              }`}
                            >
                              {item.commitment}
                            </span>
                          </div>

                          <h3
                            className={`text-sm font-bold truncate ${
                              isCompleted
                                ? 'text-[#ADA3A5] line-through'
                                : 'text-[#40383A]'
                            }`}
                          >
                            {item.title}
                          </h3>

                          {item.etapas.length > 0 && (
                            <span className="text-[11px] text-[#918689]">
                              {item.etapas.filter((e) => e.completed).length} de {item.etapas.length} subtarefas concluídas
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {item.hasWarning && (
                          <span className="text-[#BD913C] p-1 bg-[#FFF9ED] border border-[#FCE4A8] rounded-lg text-xs flex items-center gap-1 font-semibold">
                            <AlertCircle size={13} />
                            <span>Aviso</span>
                          </span>
                        )}

                        {!isCompleted && !item.isAllDay && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTimer(item);
                            }}
                            className="px-3 py-1.5 bg-[#D85F79] hover:bg-[#B94862] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Focar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
