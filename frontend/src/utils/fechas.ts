/**
 * Utility functions for date handling without timezone issues
 * All functions work with local timezone to avoid off-by-one date errors
 */

/**
 * Converts a Date object or ISO string to YYYY-MM-DD format
 * Uses local timezone to avoid date shifts
 *
 * @param value - Date object or ISO string
 * @returns Date in YYYY-MM-DD format
 */
export function toISODate(value: string | Date | null | undefined): string {
  if (!value) return '';

  // If already a string in correct format, return as-is
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  // Convert Date to YYYY-MM-DD using local timezone
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Converts a Date or ISO string to DD/MM/YYYY display format
 *
 * @param value - Date object or ISO string
 * @returns Date in DD/MM/YYYY format
 */
export function toDisplayDate(value: string | Date | null | undefined): string {
  const iso = toISODate(value);
  if (!iso) return '';

  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Gets today's date in YYYY-MM-DD format using local timezone
 *
 * @returns Today's date as YYYY-MM-DD
 */
export function getTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formats a Date or ISO string to ISO 8601 with time set to midnight
 * Useful for sending dates to API
 *
 * @param date - Date in YYYY-MM-DD format
 * @returns ISO 8601 string with time at 00:00:00
 */
export function toISODateTime(date: string): string {
  if (!date) return '';
  return `${date}T00:00:00`;
}

/**
 * Parses a display date (DD/MM/YYYY) to YYYY-MM-DD format
 *
 * @param displayDate - Date in DD/MM/YYYY format
 * @returns Date in YYYY-MM-DD format
 */
export function parseDisplayDate(displayDate: string): string {
  if (!displayDate) return '';

  const parts = displayDate.split('/');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Gets the start and end dates for the current month
 *
 * @returns Object with fechaInicio and fechaFin in YYYY-MM-DD format
 */
export function getCurrentMonthRange(): { fechaInicio: string; fechaFin: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // First day of current month
  const fechaInicio = toISODate(new Date(year, month, 1));

  // Last day of current month
  const fechaFin = toISODate(new Date(year, month + 1, 0));

  return { fechaInicio, fechaFin };
}

/**
 * Gets the start and end dates for the current year
 *
 * @returns Object with fechaInicio and fechaFin in YYYY-MM-DD format
 */
export function getCurrentYearRange(): { fechaInicio: string; fechaFin: string } {
  const year = new Date().getFullYear();
  return {
    fechaInicio: `${year}-01-01`,
    fechaFin: `${year}-12-31`,
  };
}
