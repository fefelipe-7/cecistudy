import { ViewMode, CalendarItem } from '../types';

export function formatTime(timeStr: string): string {
  return timeStr;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// Convert YYYY-MM-DD to a safe local Date object (avoiding timezone offset shifts)
export function parseDateSafe(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

// Format Date object to YYYY-MM-DD
export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Get real system current date in YYYY-MM-DD
export function getCurrentDateISO(): string {
  const now = new Date();
  return formatDateToISO(now);
}

// Get real system current time in HH:MM
export function getCurrentTimeHM(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Get real system current time in HH:MM:SS
export function getCurrentTimeHMS(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === getCurrentDateISO();
}

export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

// Add or subtract days
export function addDays(dateStr: string, days: number): string {
  const d = parseDateSafe(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateToISO(d);
}

// Add or subtract weeks
export function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7);
}

// Add or subtract months
export function addMonths(dateStr: string, months: number): string {
  const d = parseDateSafe(dateStr);
  d.setMonth(d.getMonth() + months);
  return formatDateToISO(d);
}

// Calculate ISO Week Number
export function getWeekNumber(dateStr: string): number {
  const d = parseDateSafe(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export interface WeekDayItem {
  dayNumber: number; // 0=Sun, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  name: string; // "SEG", "TER", etc.
  fullDate: string; // "YYYY-MM-DD"
  dayOfMonth: number;
  isToday: boolean;
  isSelected: boolean;
}

const WEEK_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const MONTHS_PT_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

/**
 * Generates Monday through Friday (or Sunday through Saturday) for ANY given date.
 */
export function getWeekDaysForDate(
  selectedDate: string,
  includeWeekend = false
): WeekDayItem[] {
  const currentDate = parseDateSafe(selectedDate);
  const currentDayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday, ...

  // Calculate Monday offset:
  // If today is Sunday (0), Monday was 6 days ago (or next day depending on week start).
  // Standard academic week starts on Monday (1).
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() + distanceToMonday);

  const daysCount = includeWeekend ? 7 : 5;
  const startOffset = includeWeekend ? -1 : 0; // if weekend, start on Sunday (Monday - 1)

  const result: WeekDayItem[] = [];
  const todayISO = getCurrentDateISO();

  for (let i = 0; i < daysCount; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + (includeWeekend ? i - 1 : i));
    const dayISO = formatDateToISO(day);

    result.push({
      dayNumber: day.getDay(),
      name: WEEK_NAMES[day.getDay()],
      fullDate: dayISO,
      dayOfMonth: day.getDate(),
      isToday: dayISO === todayISO,
      isSelected: dayISO === selectedDate,
    });
  }

  return result;
}

export const HOURS_LIST = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00'
];

export const TIME_SLOTS_30MIN = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
];

export interface StructuredHour {
  hourNum: number;
  label: string;
  slotTop: string; // e.g. "08:00"
  slotBottom: string; // e.g. "08:30"
}

export const STRUCTURED_HOURS: StructuredHour[] = [
  { hourNum: 7, label: '07:00', slotTop: '07:00', slotBottom: '07:30' },
  { hourNum: 8, label: '08:00', slotTop: '08:00', slotBottom: '08:30' },
  { hourNum: 9, label: '09:00', slotTop: '09:00', slotBottom: '09:30' },
  { hourNum: 10, label: '10:00', slotTop: '10:00', slotBottom: '10:30' },
  { hourNum: 11, label: '11:00', slotTop: '11:00', slotBottom: '11:30' },
  { hourNum: 12, label: '12:00', slotTop: '12:00', slotBottom: '12:30' },
  { hourNum: 13, label: '13:00', slotTop: '13:00', slotBottom: '13:30' },
  { hourNum: 14, label: '14:00', slotTop: '14:00', slotBottom: '14:30' },
  { hourNum: 15, label: '15:00', slotTop: '15:00', slotBottom: '15:30' },
  { hourNum: 16, label: '16:00', slotTop: '16:00', slotBottom: '16:30' },
  { hourNum: 17, label: '17:00', slotTop: '17:00', slotBottom: '17:30' },
  { hourNum: 18, label: '18:00', slotTop: '18:00', slotBottom: '18:30' },
  { hourNum: 19, label: '19:00', slotTop: '19:00', slotBottom: '19:30' },
  { hourNum: 20, label: '20:00', slotTop: '20:00', slotBottom: '20:30' },
  { hourNum: 21, label: '21:00', slotTop: '21:00', slotBottom: '21:30' },
];

/**
 * Converts minutes to 30-minute blocks (1 bloco = 30 min)
 */
export function minutesTo30MinBlocks(minutes: number): number {
  return Math.max(1, Math.round(minutes / 30));
}

/**
 * Formats duration with block count (e.g. "30m (1 bloco)", "1h (2 blocos)", "1h 30m (3 blocos)")
 */
export function formatDurationWithBlocks(minutes: number): string {
  const blocks = minutesTo30MinBlocks(minutes);
  const durStr = formatDuration(minutes);
  const blockLabel = blocks === 1 ? '1 bloco' : `${blocks} blocos`;
  return `${durStr} • ${blockLabel} de 30m`;
}

/**
 * Converts hours (e.g. 14.5) to number of 30-minute blocks (e.g. 29)
 */
export function hoursTo30MinBlocks(hours: number): number {
  return Math.round(hours * 2);
}

export function formatDatePtBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  
  const dateObj = new Date(y, m - 1, d);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDayName = weekDays[dateObj.getDay()];
  const monthName = MONTHS_PT_SHORT[m - 1] || '';

  const todayISO = getCurrentDateISO();
  if (dateStr === todayISO) {
    return `Hoje (${weekDayName}, ${d} ${monthName})`;
  }

  return `${weekDayName}, ${d} ${monthName}`;
}

export function formatHeaderTitle(viewMode: ViewMode, selectedDate: string): { title: string; subtitle: string; weekNumber: number } {
  const [y, m, d] = selectedDate.split('-').map(Number);
  const dateObj = parseDateSafe(selectedDate);
  const weekDays = getWeekDaysForDate(selectedDate, false);
  const firstDay = weekDays[0];
  const lastDay = weekDays[weekDays.length - 1];
  const weekNum = getWeekNumber(selectedDate);
  const monthName = MONTHS_PT[m - 1] || '';
  const monthShort = MONTHS_PT_SHORT[m - 1] || '';

  if (viewMode === 'semana') {
    const firstMonthShort = MONTHS_PT_SHORT[parseDateSafe(firstDay.fullDate).getMonth()];
    const lastMonthShort = MONTHS_PT_SHORT[parseDateSafe(lastDay.fullDate).getMonth()];
    const yearStr = y.toString();

    let rangeStr = `${firstDay.dayOfMonth} a ${lastDay.dayOfMonth} de ${monthName}`;
    if (firstMonthShort !== lastMonthShort) {
      rangeStr = `${firstDay.dayOfMonth} ${firstMonthShort} – ${lastDay.dayOfMonth} ${lastMonthShort}`;
    }

    return {
      title: `${monthName} ${yearStr}`,
      subtitle: `Sem. ${firstDay.dayOfMonth} — ${lastDay.dayOfMonth}`,
      weekNumber: weekNum,
    };
  }

  if (viewMode === 'dia') {
    const fullWeekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const weekDayFullName = fullWeekDays[dateObj.getDay()];
    return {
      title: `${weekDayFullName}, ${d} de ${monthName} de ${y}`,
      subtitle: `Dia letivo • Semana ${weekNum}`,
      weekNumber: weekNum,
    };
  }

  if (viewMode === 'mes') {
    return {
      title: `${monthName} de ${y}`,
      subtitle: `Visão mensal de compromissos e prazos`,
      weekNumber: weekNum,
    };
  }

  // Agenda
  return {
    title: `Agenda de Atividades`,
    subtitle: `${monthName} ${y} • Semana ${firstDay.dayOfMonth} — ${lastDay.dayOfMonth}`,
    weekNumber: weekNum,
  };
}

export function getMonthCalendarGrid(year: number, monthIndex: number) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun

  const days: { fullDate: string; dayOfMonth: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
  const todayISO = getCurrentDateISO();

  // Previous month trailing days
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonthDate = new Date(year, monthIndex - 1, d);
    const iso = formatDateToISO(prevMonthDate);
    days.push({
      fullDate: iso,
      dayOfMonth: d,
      isCurrentMonth: false,
      isToday: iso === todayISO,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const curDate = new Date(year, monthIndex, i);
    const iso = formatDateToISO(curDate);
    days.push({
      fullDate: iso,
      dayOfMonth: i,
      isCurrentMonth: true,
      isToday: iso === todayISO,
    });
  }

  // Next month leading days to complete grid (up to 35 or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, monthIndex + 1, i);
    const iso = formatDateToISO(nextDate);
    days.push({
      fullDate: iso,
      dayOfMonth: i,
      isCurrentMonth: false,
      isToday: iso === todayISO,
    });
  }

  return days;
}

/**
 * Snap minutes to closest 30-minute increment (0, 30, 60...)
 */
export function snapTo30Minutes(minutes: number): number {
  return Math.round(minutes / 30) * 30;
}

/**
 * Add or subtract minutes to HH:MM time string, clamped within 00:00 - 23:30
 */
export function addMinutesToTimeString(timeStr: string, deltaMinutes: number): string {
  const currentMins = parseTimeToMinutes(timeStr);
  const newMins = Math.max(0, Math.min(23 * 60 + 30, snapTo30Minutes(currentMins + deltaMinutes)));
  return minutesToTime(newMins);
}

export interface PositionedEvent<T = CalendarItem> {
  item: T;
  top: number;
  height: number;
  colIndex: number;
  totalCols: number;
  durationMins: number;
}

interface MappedEventItem<T> {
  item: T;
  startMins: number;
  endMins: number;
  duration: number;
  top: number;
  height: number;
}

/**
 * Computes columns and widths for overlapping calendar items in a day view
 * Inspired by Google Calendar / Apple Calendar layout algorithms.
 */
export function computeOverlappingEventLayout<T extends { startTime: string; endTime: string } = CalendarItem>(
  items: T[],
  startHour: number = 7,
  hourHeight: number = 80
): PositionedEvent<T>[] {
  if (!items || items.length === 0) return [];

  // 1. Calculate raw start/end minutes for each item
  const mapped: MappedEventItem<T>[] = items.map((item) => {
    const startMins = parseTimeToMinutes(item.startTime);
    const endMins = Math.max(parseTimeToMinutes(item.endTime), startMins + 30);
    const duration = endMins - startMins;
    const startFromBase = startMins - startHour * 60;
    const top = (startFromBase / 60) * hourHeight;
    const height = Math.max((duration / 60) * hourHeight - 3, 36);

    return {
      item,
      startMins,
      endMins,
      duration,
      top,
      height,
    };
  });

  // 2. Sort by start time ascending, then by duration descending
  mapped.sort((a, b) => {
    if (a.startMins !== b.startMins) return a.startMins - b.startMins;
    return b.duration - a.duration;
  });

  // 3. Cluster overlapping events into distinct collision groups
  const groups: MappedEventItem<T>[][] = [];
  let currentGroup: MappedEventItem<T>[] = [];
  let groupEnd = 0;

  for (const ev of mapped) {
    if (currentGroup.length === 0) {
      currentGroup.push(ev);
      groupEnd = ev.endMins;
    } else if (ev.startMins < groupEnd) {
      // Overlaps with current group
      currentGroup.push(ev);
      groupEnd = Math.max(groupEnd, ev.endMins);
    } else {
      // New group
      groups.push(currentGroup);
      currentGroup = [ev];
      groupEnd = ev.endMins;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // 4. Assign columns within each group
  const results: PositionedEvent<T>[] = [];

  for (const group of groups) {
    const columns: MappedEventItem<T>[][] = [];

    for (const ev of group) {
      let placed = false;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const lastInCol = columns[colIdx][columns[colIdx].length - 1];
        if (lastInCol.endMins <= ev.startMins) {
          columns[colIdx].push(ev);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([ev]);
      }
    }

    const totalCols = columns.length;

    columns.forEach((colEvents, colIndex) => {
      colEvents.forEach((ev) => {
        results.push({
          item: ev.item,
          top: ev.top,
          height: ev.height,
          colIndex,
          totalCols,
          durationMins: ev.duration,
        });
      });
    });
  }

  return results;
}
