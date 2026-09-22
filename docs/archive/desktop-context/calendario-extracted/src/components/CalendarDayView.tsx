import React, { useState, useEffect } from 'react';
import { CalendarItem, LayerConfig } from '../types';
import {
  STRUCTURED_HOURS,
  parseTimeToMinutes,
  minutesToTime,
  formatDatePtBR,
  formatDuration,
  getCurrentTimeHM,
  isToday,
  minutesTo30MinBlocks,
  computeOverlappingEventLayout,
  snapTo30Minutes,
} from '../utils/dateUtils';
import {
  CheckCircle2,
  Clock,
  Play,
  AlertCircle,
  Sparkles,
  Bookmark,
  BookOpen,
  GraduationCap,
  Users,
} from 'lucide-react';

interface CalendarDayViewProps {
  items: CalendarItem[];
  layers: LayerConfig[];
  selectedDate: string;
  selectedItem: CalendarItem | null;
  onSelectItem: (item: CalendarItem) => void;
  onSlotClick: (date: string, time: string) => void;
  onStartTimer: (item: CalendarItem) => void;
  onUpdateItemTime?: (
    itemId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => void;
  activeTimerItemId?: string | null;
}

const HOUR_HEIGHT = 80;
const HALF_HOUR_HEIGHT = 40;
const START_HOUR = 7;
const END_HOUR = 22;

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  items,
  layers,
  selectedDate,
  selectedItem,
  onSelectItem,
  onSlotClick,
  onStartTimer,
  onUpdateItemTime,
  activeTimerItemId,
}) => {
  const [currentHM, setCurrentHM] = useState(getCurrentTimeHM());

  // Drag & Resize State
  const [draggingState, setDraggingState] = useState<{
    itemId: string;
    originalDate: string;
    originalStartMins: number;
    durationMins: number;
    currentStartMins: number;
    currentEndMins: number;
    startY: number;
  } | null>(null);

  const [resizingState, setResizingState] = useState<{
    itemId: string;
    date: string;
    startTime: string;
    startMins: number;
    originalDurationMins: number;
    currentEndMins: number;
    currentDurationMins: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHM(getCurrentTimeHM());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Global mouse handlers for Dragging
  useEffect(() => {
    if (!draggingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - draggingState.startY;
      const deltaMinutes = snapTo30Minutes((deltaY / HOUR_HEIGHT) * 60);

      const minAllowedStart = START_HOUR * 60;
      const maxAllowedStart = (END_HOUR - 0.5) * 60;

      let newStartMins = draggingState.originalStartMins + deltaMinutes;
      newStartMins = Math.max(minAllowedStart, Math.min(maxAllowedStart, newStartMins));
      const newEndMins = newStartMins + draggingState.durationMins;

      setDraggingState((prev) =>
        prev
          ? {
              ...prev,
              currentStartMins: newStartMins,
              currentEndMins: newEndMins,
            }
          : null
      );
    };

    const handleMouseUp = () => {
      if (
        draggingState &&
        onUpdateItemTime &&
        draggingState.currentStartMins !== draggingState.originalStartMins
      ) {
        const newStartTime = minutesToTime(draggingState.currentStartMins);
        const newEndTime = minutesToTime(draggingState.currentEndMins);
        onUpdateItemTime(
          draggingState.itemId,
          draggingState.originalDate,
          newStartTime,
          newEndTime
        );
      }
      setDraggingState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingState, onUpdateItemTime]);

  // Global mouse handlers for Resizing
  useEffect(() => {
    if (!resizingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizingState.startY;
      const deltaMinutes = snapTo30Minutes((deltaY / HOUR_HEIGHT) * 60);

      const minDuration = 30;
      const maxAllowedEnd = (END_HOUR + 1) * 60;

      let newDuration = resizingState.originalDurationMins + deltaMinutes;
      newDuration = Math.max(minDuration, newDuration);

      let newEndMins = resizingState.startMins + newDuration;
      if (newEndMins > maxAllowedEnd) {
        newEndMins = maxAllowedEnd;
        newDuration = newEndMins - resizingState.startMins;
      }

      setResizingState((prev) =>
        prev
          ? {
              ...prev,
              currentEndMins: newEndMins,
              currentDurationMins: newDuration,
            }
          : null
      );
    };

    const handleMouseUp = () => {
      if (
        resizingState &&
        onUpdateItemTime &&
        resizingState.currentDurationMins !== resizingState.originalDurationMins
      ) {
        const newEndTime = minutesToTime(resizingState.currentEndMins);
        onUpdateItemTime(
          resizingState.itemId,
          resizingState.date,
          resizingState.startTime,
          newEndTime
        );
      }
      setResizingState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingState, onUpdateItemTime]);

  const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));
  const dayItems = items.filter(
    (item) => item.date === selectedDate && visibleLayerIds.has(item.layer)
  );
  const allDayItems = dayItems.filter((i) => i.isAllDay);
  const timeGridItems = dayItems.filter((i) => !i.isAllDay);

  const positionedEvents = computeOverlappingEventLayout(
    timeGridItems,
    START_HOUR,
    HOUR_HEIGHT
  );

  const getLayerStyles = (layerId: string, isSelected: boolean) => {
    switch (layerId) {
      case 'faculdade':
        return {
          bg: isSelected ? 'bg-[#E6F2F7]' : 'bg-[#F3F9FC]',
          border: isSelected ? 'border-[#4A879F] ring-2 ring-[#83BCD0]/50' : 'border-[#CEE7F0]',
          text: 'text-[#284955]',
          subtext: 'text-[#4A879F]',
          dot: '#4A879F',
          badgeBg: 'bg-[#E6F2F7]',
          badgeText: 'text-[#396D82]',
        };
      case 'tcc':
        return {
          bg: isSelected ? 'bg-[#FFE9EE]' : 'bg-[#FFF5F7]',
          border: isSelected ? 'border-[#D85F79] ring-2 ring-[#FFB8C7]/50' : 'border-[#FFD3DD]',
          text: 'text-[#71303F]',
          subtext: 'text-[#D85F79]',
          dot: '#D85F79',
          badgeBg: 'bg-[#FFE9EE]',
          badgeText: 'text-[#B94862]',
        };
      case 'estudos':
        return {
          bg: isSelected ? 'bg-[#DDF3E5]' : 'bg-[#F2FAF5]',
          border: isSelected ? 'border-[#5A9F76] ring-2 ring-[#A8D8B9]/50' : 'border-[#C2E8D0]',
          text: 'text-[#2A513A]',
          subtext: 'text-[#5A9F76]',
          dot: '#5A9F76',
          badgeBg: 'bg-[#DDF3E5]',
          badgeText: 'text-[#356647]',
        };
      case 'marketing':
        return {
          bg: isSelected ? 'bg-[#FFF0CC]' : 'bg-[#FFF9ED]',
          border: isSelected ? 'border-[#BD913C] ring-2 ring-[#FCE4A8]/50' : 'border-[#FCE4A8]',
          text: 'text-[#5E471F]',
          subtext: 'text-[#BD913C]',
          dot: '#BD913C',
          badgeBg: 'bg-[#FFF0CC]',
          badgeText: 'text-[#96702B]',
        };
      default:
        return {
          bg: isSelected ? 'bg-[#F3EEE8]' : 'bg-[#FAF8F5]',
          border: 'border-[#E9DFDC]',
          text: 'text-[#40383A]',
          subtext: 'text-[#918689]',
          dot: '#918689',
          badgeBg: 'bg-[#F3EEE8]',
          badgeText: 'text-[#6D6366]',
        };
    }
  };

  const getSubcategoryIcon = (category: string) => {
    switch (category) {
      case 'aula':
        return <GraduationCap size={13} />;
      case 'prova':
        return <AlertCircle size={13} className="text-[#D85F79]" />;
      case 'bloco_tcc':
        return <BookOpen size={13} />;
      case 'reuniao':
        return <Users size={13} />;
      case 'revisao':
        return <Bookmark size={13} />;
      default:
        return <Clock size={13} />;
    }
  };

  const getCurrentTimePosition = () => {
    const currentMins = parseTimeToMinutes(currentHM);
    const minsFromBase = currentMins - START_HOUR * 60;
    return (minsFromBase / 60) * HOUR_HEIGHT;
  };

  const isCurrentDayToday = isToday(selectedDate);
  const currentLineTop = getCurrentTimePosition();
  const totalGridHeight = STRUCTURED_HOURS.length * HOUR_HEIGHT;

  return (
    <div
      id="calendar-day-view"
      className="flex-1 flex flex-col min-w-0 bg-[#FFFCF8] overflow-hidden select-none"
    >
      {/* Day Header */}
      <div className="p-4 border-b border-[#E9DFDC] bg-[#FFFCF8] flex items-center justify-between shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-display text-[#40383A]">
              {formatDatePtBR(selectedDate)}
            </h2>
            {isCurrentDayToday && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE9EE] text-[#D85F79] border border-[#FFD3DD]">
                Hoje
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F2F7] text-[#396D82] border border-[#CEE7F0]">
              Grade de 30 minutos
            </span>
          </div>
          <span className="text-xs text-[#918689] font-medium">
            {dayItems.length} compromissos previstos • Arraste ou redimensione os blocos para ajustar horários
          </span>
        </div>
      </div>

      {/* All-Day bar if any */}
      {allDayItems.length > 0 && (
        <div className="p-3 bg-[#FAF8F5] border-b border-[#E9DFDC] flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-[#918689] uppercase tracking-wider">
            Responsabilidades & Entregas do dia
          </span>
          <div className="flex flex-wrap gap-2">
            {allDayItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="px-3 py-1.5 bg-[#F3F9FC] hover:bg-[#E6F2F7] text-[#284955] border border-[#CEE7F0] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#4A879F]" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 30-Minute Subdivided Timeline */}
      <div className="flex-1 overflow-y-auto relative">
        <div
          style={{ height: `${totalGridHeight}px` }}
          className="grid grid-cols-[68px_1fr] relative"
        >
          {/* Time Labels with :00 and :30 markings */}
          <div className="border-r border-[#E9DFDC] flex flex-col bg-[#FFFCF8] select-none">
            {STRUCTURED_HOURS.map((hourObj) => (
              <div
                key={`label-${hourObj.label}`}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-[#F2EBE8] flex flex-col justify-between py-1 pr-3 text-right"
              >
                <div className="text-xs font-bold font-mono text-[#40383A]">
                  {hourObj.label}
                </div>
                <div className="text-[11px] font-mono text-[#ADA3A5]">
                  :30
                </div>
              </div>
            ))}
          </div>

          {/* Grid Slots */}
          <div className="relative h-full bg-[#FFFCF8]">
            {STRUCTURED_HOURS.map((hourObj) => (
              <div
                key={`slot-${hourObj.hourNum}`}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-[#E9DFDC]/80 flex flex-col"
              >
                {/* Top 30m sub-slot */}
                <div
                  onClick={() => onSlotClick(selectedDate, hourObj.slotTop)}
                  style={{ height: `${HALF_HOUR_HEIGHT}px` }}
                  className="border-b border-dashed border-[#F2EBE8] hover:bg-[#FFF5F7]/60 transition-colors cursor-pointer relative group"
                  title={`+ Agendar às ${hourObj.slotTop}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute left-3 top-1 text-[11px] font-mono font-bold text-[#D85F79] pointer-events-none transition-opacity">
                    + {hourObj.slotTop} (bloco de 30min)
                  </span>
                </div>

                {/* Bottom 30m sub-slot */}
                <div
                  onClick={() => onSlotClick(selectedDate, hourObj.slotBottom)}
                  style={{ height: `${HALF_HOUR_HEIGHT}px` }}
                  className="hover:bg-[#FFF5F7]/60 transition-colors cursor-pointer relative group"
                  title={`+ Agendar às ${hourObj.slotBottom}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute left-3 top-1 text-[11px] font-mono font-bold text-[#D85F79] pointer-events-none transition-opacity">
                    + {hourObj.slotBottom} (bloco de 30min)
                  </span>
                </div>
              </div>
            ))}

            {/* Current Time Indicator Line (Today only) */}
            {isCurrentDayToday && currentLineTop >= 0 && currentLineTop <= totalGridHeight && (
              <div
                style={{ top: `${currentLineTop}px` }}
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#D85F79] -ml-1.25 shadow-xs ring-2 ring-white" />
                <div className="h-0.5 w-full bg-[#D85F79]" />
              </div>
            )}

            {/* Overlapping Event Cards */}
            {positionedEvents.map((pos) => {
              const item = pos.item;
              const isBeingDragged = draggingState?.itemId === item.id;
              const isBeingResized = resizingState?.itemId === item.id;

              let top = pos.top;
              let height = pos.height;
              let displayStartTime = item.startTime;
              let displayEndTime = item.endTime;
              let displayDuration = pos.durationMins;

              if (isBeingDragged && draggingState) {
                const startFromBase = draggingState.currentStartMins - START_HOUR * 60;
                top = (startFromBase / 60) * HOUR_HEIGHT;
                displayStartTime = minutesToTime(draggingState.currentStartMins);
                displayEndTime = minutesToTime(draggingState.currentEndMins);
              } else if (isBeingResized && resizingState) {
                height = Math.max(
                  (resizingState.currentDurationMins / 60) * HOUR_HEIGHT - 3,
                  36
                );
                displayEndTime = minutesToTime(resizingState.currentEndMins);
                displayDuration = resizingState.currentDurationMins;
              }

              const isSelected = selectedItem?.id === item.id;
              const styles = getLayerStyles(item.layer, isSelected);
              const isTimerRunning = activeTimerItemId === item.id;
              const blocksCount = minutesTo30MinBlocks(displayDuration);

              const colWidthPercent = 100 / pos.totalCols;
              const leftPercent = pos.colIndex * colWidthPercent;

              return (
                <div
                  key={item.id}
                  id={`day-item-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isBeingDragged && !isBeingResized) {
                      onSelectItem(item);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    const startMins = parseTimeToMinutes(item.startTime);
                    const endMins = parseTimeToMinutes(item.endTime);
                    setDraggingState({
                      itemId: item.id,
                      originalDate: item.date,
                      originalStartMins: startMins,
                      durationMins: endMins - startMins,
                      currentStartMins: startMins,
                      currentEndMins: endMins,
                      startY: e.clientY,
                    });
                  }}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `calc(${leftPercent}% + 3px)`,
                    width: `calc(${colWidthPercent}% - 6px)`,
                  }}
                  className={`absolute rounded-2xl border p-3 flex flex-col justify-between transition-[box-shadow,border-color] duration-150 cursor-grab active:cursor-grabbing overflow-hidden ${
                    isBeingDragged
                      ? 'z-40 opacity-95 shadow-xl scale-[1.01] ring-2 ring-[#D85F79]'
                      : isBeingResized
                      ? 'z-40 shadow-lg ring-2 ring-[#4A879F]'
                      : pos.totalCols > 1
                      ? 'z-10 shadow-xs hover:z-20 hover:shadow-md'
                      : 'z-10 shadow-2xs hover:shadow-sm'
                  } ${styles.bg} ${styles.border}`}
                >
                  {/* Drag / Resize Feedback Overlay */}
                  {(isBeingDragged || isBeingResized) && (
                    <div className="absolute top-2 right-2 z-30 bg-[#40383A] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1.5 animate-in fade-in">
                      <span>
                        {displayStartTime} — {displayEndTime}
                      </span>
                      <span>({blocksCount} blocos de 30m)</span>
                    </div>
                  )}

                  {/* Top: Category and Pills */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: styles.dot }}
                        />
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider truncate ${styles.subtext}`}
                        >
                          {item.categoryLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${styles.badgeBg} ${styles.badgeText}`}
                        >
                          {formatDuration(displayDuration)} • {blocksCount}×30m
                        </span>

                        {isTimerRunning && (
                          <span className="bg-[#D85F79] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            TIMER ATIVO
                          </span>
                        )}

                        {item.hasWarning && (
                          <span title={item.warningText} className="text-[#D85F79]">
                            <AlertCircle size={14} />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`text-sm font-bold leading-snug mt-0.5 ${styles.text}`}>
                      {item.title}
                    </div>
                  </div>

                  {/* Bottom: Subcategory Icon, Time & Etapas */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-black/5 mt-auto">
                    <div className={`flex items-center gap-1.5 font-mono font-medium ${styles.subtext}`}>
                      {getSubcategoryIcon(item.category)}
                      <span>
                        {displayStartTime} — {displayEndTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'concluido' ? (
                        <span className="text-[#5A9F76] font-bold flex items-center gap-1 text-xs">
                          <CheckCircle2 size={14} />
                          <span>Concluído</span>
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTimer(item);
                          }}
                          className="p-1 hover:bg-white rounded-lg transition-colors text-[#5A9F76] cursor-pointer"
                          title="Iniciar foco"
                        >
                          <Play size={13} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startMins = parseTimeToMinutes(item.startTime);
                      const endMins = parseTimeToMinutes(item.endTime);
                      setResizingState({
                        itemId: item.id,
                        date: item.date,
                        startTime: item.startTime,
                        startMins,
                        originalDurationMins: endMins - startMins,
                        currentEndMins: endMins,
                        currentDurationMins: endMins - startMins,
                        startY: e.clientY,
                      });
                    }}
                    className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-black/10 flex items-center justify-center group/resize"
                    title="Arrastar para ajustar duração em blocos de 30m"
                  >
                    <div className="w-8 h-0.5 bg-black/20 rounded-full group-hover/resize:bg-[#40383A] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
