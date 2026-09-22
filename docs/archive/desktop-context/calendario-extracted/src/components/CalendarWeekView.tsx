import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarItem,
  LayerConfig,
} from '../types';
import {
  STRUCTURED_HOURS,
  parseTimeToMinutes,
  minutesToTime,
  getWeekDaysForDate,
  getCurrentTimeHM,
  minutesTo30MinBlocks,
  computeOverlappingEventLayout,
  snapTo30Minutes,
  PositionedEvent,
} from '../utils/dateUtils';
import {
  GraduationCap,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Users,
  Move,
  GripHorizontal,
} from 'lucide-react';

interface CalendarWeekViewProps {
  items: CalendarItem[];
  layers: LayerConfig[];
  selectedDate: string;
  selectedItem: CalendarItem | null;
  onSelectItem: (item: CalendarItem) => void;
  onSlotClick: (date: string, time: string) => void;
  onUpdateItemTime?: (
    itemId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => void;
  activeTimerItemId?: string | null;
}

const HOUR_HEIGHT = 80; // 80px per hour => 40px per 30-minute slot
const HALF_HOUR_HEIGHT = 40;
const START_HOUR = 7; // 7:00
const END_HOUR = 22; // 22:00

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  items,
  layers,
  selectedDate,
  selectedItem,
  onSelectItem,
  onSlotClick,
  onUpdateItemTime,
  activeTimerItemId,
}) => {
  // Dynamic live time for current time indicator
  const [currentHM, setCurrentHM] = useState(getCurrentTimeHM());
  const [hoveredSlot, setHoveredSlot] = useState<{ date: string; time: string } | null>(null);

  // Drag & Resize State
  const [draggingState, setDraggingState] = useState<{
    itemId: string;
    originalDate: string;
    originalStartMins: number;
    durationMins: number;
    currentDate: string;
    currentStartMins: number;
    currentEndMins: number;
    startY: number;
    startX: number;
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

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const weekDays = getWeekDaysForDate(selectedDate, false);

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

      // Check horizontal movement across day columns if grid is available
      let targetDate = draggingState.originalDate;
      if (gridContainerRef.current) {
        const rect = gridContainerRef.current.getBoundingClientRect();
        const colWidth = (rect.width - 64) / weekDays.length;
        const relativeX = e.clientX - rect.left - 64;
        const colIndex = Math.floor(relativeX / colWidth);
        if (colIndex >= 0 && colIndex < weekDays.length) {
          targetDate = weekDays[colIndex].fullDate;
        }
      }

      setDraggingState((prev) =>
        prev
          ? {
              ...prev,
              currentDate: targetDate,
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
        (draggingState.currentStartMins !== draggingState.originalStartMins ||
          draggingState.currentDate !== draggingState.originalDate)
      ) {
        const newStartTime = minutesToTime(draggingState.currentStartMins);
        const newEndTime = minutesToTime(draggingState.currentEndMins);
        onUpdateItemTime(
          draggingState.itemId,
          draggingState.currentDate,
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
  }, [draggingState, onUpdateItemTime, weekDays]);

  // Global mouse handlers for Resizing
  useEffect(() => {
    if (!resizingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizingState.startY;
      const deltaMinutes = snapTo30Minutes((deltaY / HOUR_HEIGHT) * 60);

      const minDuration = 30; // Minimum 30 minutes
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

  const visibleLayerIds = new Set(
    layers.filter((l) => l.visible).map((l) => l.id)
  );

  // Filter items by visible layers
  const visibleItems = items.filter((item) => visibleLayerIds.has(item.layer));
  const allDayItems = visibleItems.filter((item) => item.isAllDay);
  const timeGridItems = visibleItems.filter((item) => !item.isAllDay);

  // Calculate position for current time line (red indicator)
  const getCurrentTimePosition = () => {
    const currentMins = parseTimeToMinutes(currentHM);
    const minsFromBase = currentMins - START_HOUR * 60;
    return (minsFromBase / 60) * HOUR_HEIGHT;
  };

  const getLayerStyles = (layerId: string, isSelected: boolean) => {
    switch (layerId) {
      case 'faculdade':
        return {
          bg: isSelected ? 'bg-[#E6F2F7]' : 'bg-[#F3F9FC]',
          border: isSelected ? 'border-[#4A879F] ring-2 ring-[#83BCD0]/50' : 'border-[#CEE7F0]',
          text: 'text-[#284955]',
          subtext: 'text-[#4A879F]',
          dot: '#4A879F',
          iconColor: 'text-[#4A879F]',
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
          iconColor: 'text-[#D85F79]',
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
          iconColor: 'text-[#5A9F76]',
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
          iconColor: 'text-[#BD913C]',
          badgeBg: 'bg-[#FFF0CC]',
          badgeText: 'text-[#96702B]',
        };
      case 'google_calendar':
        return {
          bg: isSelected ? 'bg-[#F3EEE8]' : 'bg-[#FAF8F5]',
          border: isSelected ? 'border-[#927D6B] ring-2 ring-[#D9CDC0]/50' : 'border-[#E8DFD5]',
          text: 'text-[#40383A]',
          subtext: 'text-[#927D6B]',
          dot: '#927D6B',
          iconColor: 'text-[#927D6B]',
          badgeBg: 'bg-[#F3EEE8]',
          badgeText: 'text-[#6D6366]',
        };
      default:
        return {
          bg: isSelected ? 'bg-[#F3EEE8]' : 'bg-[#FAF8F5]',
          border: 'border-[#E9DFDC]',
          text: 'text-[#40383A]',
          subtext: 'text-[#918689]',
          dot: '#918689',
          iconColor: 'text-[#918689]',
          badgeBg: 'bg-[#F3EEE8]',
          badgeText: 'text-[#6D6366]',
        };
    }
  };

  const getSubcategoryIcon = (category: string) => {
    switch (category) {
      case 'aula':
        return <GraduationCap size={12} />;
      case 'prova':
        return <AlertCircle size={12} className="text-[#D85F79]" />;
      case 'bloco_tcc':
        return <BookOpen size={12} />;
      case 'reuniao':
        return <Users size={12} />;
      case 'revisao':
        return <Bookmark size={12} />;
      default:
        return <Clock size={12} />;
    }
  };

  const currentLineTop = getCurrentTimePosition();
  const totalGridHeight = STRUCTURED_HOURS.length * HOUR_HEIGHT;

  return (
    <div
      id="calendar-week-view"
      className="flex-1 flex flex-col min-w-0 bg-[#FFFCF8] overflow-hidden select-none"
    >
      {/* Day Header Row */}
      <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-[#E9DFDC] bg-[#FFFCF8] shrink-0 shadow-2xs z-10">
        {/* Empty left corner */}
        <div className="border-r border-[#E9DFDC] flex items-center justify-center p-2">
          <span className="text-[10px] font-bold text-[#ADA3A5] uppercase tracking-wider font-mono">
            30m
          </span>
        </div>

        {/* 5 Day Headers */}
        {weekDays.map((day) => {
          return (
            <div
              key={day.fullDate}
              className={`py-2 text-center border-r border-[#E9DFDC] last:border-r-0 flex flex-col items-center justify-center gap-0.5 ${
                day.isToday ? 'bg-[#FFF8F1]/60' : ''
              }`}
            >
              <span className="text-[11px] font-bold tracking-wider text-[#918689] uppercase">
                {day.name}
              </span>
              {day.isToday ? (
                <span className="w-6.5 h-6.5 rounded-full bg-[#D85F79] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {day.dayOfMonth}
                </span>
              ) : (
                <span
                  className={`text-xs font-bold ${
                    day.isSelected ? 'text-[#D85F79]' : 'text-[#40383A]'
                  }`}
                >
                  {day.dayOfMonth}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* "dia" All-Day Deadlines & Responsibilities Bar */}
      <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-[#E9DFDC] bg-[#FAF8F5] min-h-[36px] items-center shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#918689] text-right pr-3 border-r border-[#E9DFDC]">
          dia
        </div>

        {weekDays.map((day) => {
          const dayAllDayItems = allDayItems.filter((i) => i.date === day.fullDate);
          return (
            <div
              key={`allday-${day.fullDate}`}
              className="px-1.5 py-1 border-r border-[#E9DFDC] last:border-r-0 flex flex-col gap-1 min-h-[36px] justify-center"
            >
              {dayAllDayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="w-full text-left px-2 py-0.5 rounded-lg bg-[#F3F9FC] hover:bg-[#E6F2F7] border border-[#CEE7F0] text-[#284955] text-[11px] font-semibold flex items-center gap-1.5 transition-colors truncate shadow-2xs cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A879F] shrink-0" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Main 30-Minute Subdivided Time Grid */}
      <div className="flex-1 overflow-y-auto relative" ref={gridContainerRef}>
        <div
          style={{ height: `${totalGridHeight}px` }}
          className="grid grid-cols-[64px_repeat(5,1fr)] relative"
        >
          {/* Time Labels Column with :00 and :30 markings */}
          <div className="border-r border-[#E9DFDC] flex flex-col bg-[#FFFCF8] select-none">
            {STRUCTURED_HOURS.map((hourObj) => (
              <div
                key={`label-${hourObj.label}`}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-[#F2EBE8] flex flex-col justify-between py-1 pr-2 text-right"
              >
                {/* Top :00 label */}
                <div className="text-[11px] font-bold font-mono text-[#40383A] leading-none">
                  {hourObj.label}
                </div>
                {/* Sub :30 label */}
                <div className="text-[10px] font-mono text-[#ADA3A5] leading-none">
                  :30
                </div>
              </div>
            ))}
          </div>

          {/* 5 Day Columns with 30-Minute Interactive Slots */}
          {weekDays.map((day) => {
            const dayItems = timeGridItems.filter((i) => i.date === day.fullDate);
            // Overlapping layout computation (splits simultaneous events side by side)
            const positionedEvents = computeOverlappingEventLayout(
              dayItems,
              START_HOUR,
              HOUR_HEIGHT
            );

            return (
              <div
                key={`grid-col-${day.fullDate}`}
                className={`relative border-r border-[#E9DFDC] last:border-r-0 h-full group ${
                  day.isToday ? 'bg-[#FFFDFB]' : 'bg-[#FFFCF8]'
                }`}
              >
                {/* Hourly Slots (Each split into two 30-minute rows) */}
                {STRUCTURED_HOURS.map((hourObj) => (
                  <div
                    key={`slot-hour-${day.fullDate}-${hourObj.hourNum}`}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-[#E9DFDC]/80 flex flex-col"
                  >
                    {/* Top 30-minute Sub-Slot (:00) */}
                    <div
                      onClick={() => onSlotClick(day.fullDate, hourObj.slotTop)}
                      onMouseEnter={() =>
                        setHoveredSlot({ date: day.fullDate, time: hourObj.slotTop })
                      }
                      onMouseLeave={() => setHoveredSlot(null)}
                      style={{ height: `${HALF_HOUR_HEIGHT}px` }}
                      className="border-b border-dashed border-[#F2EBE8] hover:bg-[#FFF5F7]/60 transition-colors cursor-pointer relative group/subslot"
                      title={`+ Agendar ${day.name} às ${hourObj.slotTop}`}
                    >
                      <span className="opacity-0 group-hover/subslot:opacity-100 absolute left-2 top-1 text-[10px] font-mono font-bold text-[#D85F79] pointer-events-none transition-opacity">
                        + {hourObj.slotTop} (30m)
                      </span>
                    </div>

                    {/* Bottom 30-minute Sub-Slot (:30) */}
                    <div
                      onClick={() => onSlotClick(day.fullDate, hourObj.slotBottom)}
                      onMouseEnter={() =>
                        setHoveredSlot({ date: day.fullDate, time: hourObj.slotBottom })
                      }
                      onMouseLeave={() => setHoveredSlot(null)}
                      style={{ height: `${HALF_HOUR_HEIGHT}px` }}
                      className="hover:bg-[#FFF5F7]/60 transition-colors cursor-pointer relative group/subslot"
                      title={`+ Agendar ${day.name} às ${hourObj.slotBottom}`}
                    >
                      <span className="opacity-0 group-hover/subslot:opacity-100 absolute left-2 top-1 text-[10px] font-mono font-bold text-[#D85F79] pointer-events-none transition-opacity">
                        + {hourObj.slotBottom} (30m)
                      </span>
                    </div>
                  </div>
                ))}

                {/* Current Time Indicator Line (Live Red Line on Today's column) */}
                {day.isToday && currentLineTop >= 0 && currentLineTop <= totalGridHeight && (
                  <div
                    style={{ top: `${currentLineTop}px` }}
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#D85F79] -ml-1 shadow-xs ring-2 ring-white" />
                    <div className="h-0.5 w-full bg-[#D85F79]" />
                  </div>
                )}

                {/* Render Positioned & Overlapping Event Cards */}
                {positionedEvents.map((pos) => {
                  const item = pos.item;
                  const isBeingDragged = draggingState?.itemId === item.id;
                  const isBeingResized = resizingState?.itemId === item.id;

                  // Dynamic coords if dragging or resizing
                  let top = pos.top;
                  let height = pos.height;
                  let displayStartTime = item.startTime;
                  let displayEndTime = item.endTime;
                  let displayDuration = pos.durationMins;

                  if (isBeingDragged && draggingState) {
                    const startFromBase =
                      draggingState.currentStartMins - START_HOUR * 60;
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
                  const isCompact30m = height < 48;

                  // Overlapping horizontal calculations (Google Calendar style)
                  const colWidthPercent = 100 / pos.totalCols;
                  const leftPercent = pos.colIndex * colWidthPercent;

                  return (
                    <div
                      key={item.id}
                      id={`calendar-item-${item.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isBeingDragged && !isBeingResized) {
                          onSelectItem(item);
                        }
                      }}
                      onMouseDown={(e) => {
                        // Don't drag if clicked on resize handle or right click
                        if (e.button !== 0) return;
                        const startMins = parseTimeToMinutes(item.startTime);
                        const endMins = parseTimeToMinutes(item.endTime);
                        setDraggingState({
                          itemId: item.id,
                          originalDate: item.date,
                          originalStartMins: startMins,
                          durationMins: endMins - startMins,
                          currentDate: item.date,
                          currentStartMins: startMins,
                          currentEndMins: endMins,
                          startY: e.clientY,
                          startX: e.clientX,
                        });
                      }}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${leftPercent}% + 1.5px)`,
                        width: `calc(${colWidthPercent}% - 3px)`,
                      }}
                      className={`absolute rounded-xl border px-2 py-1 flex flex-col justify-between transition-[box-shadow,border-color] duration-150 cursor-grab active:cursor-grabbing overflow-hidden ${
                        isBeingDragged
                          ? 'z-40 opacity-95 shadow-xl scale-[1.02] ring-2 ring-[#D85F79]'
                          : isBeingResized
                          ? 'z-40 shadow-lg ring-2 ring-[#4A879F]'
                          : pos.totalCols > 1
                          ? 'z-10 shadow-xs hover:z-20 hover:shadow-md'
                          : 'z-10 shadow-2xs hover:shadow-sm'
                      } ${styles.bg} ${styles.border}`}
                    >
                      {/* Active Live Drag / Resize Feedback Overlay Tooltip */}
                      {(isBeingDragged || isBeingResized) && (
                        <div className="absolute top-1 right-1 z-30 bg-[#40383A] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 animate-in fade-in">
                          <span>
                            {displayStartTime} - {displayEndTime}
                          </span>
                          <span>({blocksCount}×30m)</span>
                        </div>
                      )}

                      {/* Compact 30-minute card view */}
                      {isCompact30m ? (
                        <div className="flex items-center justify-between gap-1 h-full">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: styles.dot }}
                            />
                            <span
                              className={`text-xs font-bold truncate ${styles.text}`}
                            >
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded-md ${styles.badgeBg} ${styles.badgeText}`}
                            >
                              30m
                            </span>
                            {item.status === 'concluido' && (
                              <CheckCircle2 size={11} className="text-[#5A9F76]" />
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Standard 60m+ rich card view */
                        <>
                          {/* Top row: Category badge, Title, Duration pills */}
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: styles.dot }}
                                />
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider truncate ${styles.subtext}`}
                                >
                                  {pos.totalCols > 1 ? item.category : item.categoryLabel}
                                </span>
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <span
                                  className={`text-[8px] font-bold font-mono px-1 py-0.2 rounded ${styles.badgeBg} ${styles.badgeText}`}
                                  title={`${displayDuration} minutos (${blocksCount} faixas de 30m)`}
                                >
                                  {blocksCount === 1 ? '30m' : `${blocksCount * 0.5}h`}
                                </span>

                                {isTimerRunning && (
                                  <span className="bg-[#D85F79] text-white text-[8px] font-bold px-1 rounded-full animate-pulse">
                                    LIVE
                                  </span>
                                )}

                                {item.hasWarning && (
                                  <span
                                    title={item.warningText}
                                    className="text-[#D85F79] shrink-0"
                                  >
                                    <AlertCircle size={11} />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Title */}
                            <div
                              className={`text-xs font-bold leading-tight line-clamp-2 mt-0.5 ${styles.text}`}
                            >
                              {item.title}
                            </div>
                          </div>

                          {/* Bottom row: Time range & 30m block meter */}
                          <div className="flex items-center justify-between text-[9px] pt-1 border-t border-black/5 mt-auto">
                            <div
                              className={`flex items-center gap-1 font-mono font-medium truncate ${styles.subtext}`}
                            >
                              {getSubcategoryIcon(item.category)}
                              <span className="truncate">
                                {displayStartTime} — {displayEndTime}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {item.status === 'concluido' ? (
                                <span
                                  className="text-[#5A9F76] font-bold flex items-center"
                                  title="Concluído"
                                >
                                  <CheckCircle2 size={11} />
                                </span>
                              ) : item.etapas && item.etapas.length > 0 ? (
                                <span className="text-[8px] font-mono text-[#918689] bg-white/80 px-1 rounded border border-[#E9DFDC]">
                                  {item.etapas.filter((e) => e.completed).length}/
                                  {item.etapas.length}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Bottom Resize Handle for extending/shortening duration */}
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
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/10 flex items-center justify-center group/resize"
                        title="Arrastar para ajustar duração em blocos de 30m"
                      >
                        <div className="w-6 h-0.5 bg-black/20 rounded-full group-hover/resize:bg-[#40383A] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
