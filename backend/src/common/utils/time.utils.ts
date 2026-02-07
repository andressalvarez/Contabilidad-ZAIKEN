/**
 * Time conversion utilities
 * Sistema Zaiken - Conversión entre horas y minutos
 */

export class TimeUtils {
  /**
   * Convert hours to minutes
   * @param hours - Number of hours (can have decimals)
   * @returns Minutes as integer
   */
  static hoursToMinutes(hours: number): number {
    return Math.round(hours * 60);
  }

  /**
   * Convert minutes to hours
   * @param minutes - Number of minutes
   * @returns Hours as decimal
   */
  static minutesToHours(minutes: number): number {
    return minutes / 60;
  }

  /**
   * Format minutes as human-readable string (e.g., "5h 30m" or "2h")
   * @param minutes - Number of minutes
   * @returns Formatted string
   */
  static formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  /**
   * Format minutes as decimal hours string (e.g., "5.50h")
   * @param minutes - Number of minutes
   * @returns Formatted string with 2 decimals
   */
  static formatHoursDecimal(minutes: number): string {
    return (minutes / 60).toFixed(2) + 'h';
  }

  /**
   * Parse time string to minutes
   * Supports formats: "5h 30m", "5.5h", "5h", "30m", "5:30"
   * @param timeStr - Time string
   * @returns Minutes as integer or null if invalid
   */
  static parseToMinutes(timeStr: string): number | null {
    if (!timeStr || typeof timeStr !== 'string') return null;

    const cleaned = timeStr.trim().toLowerCase();

    // Format: "5h 30m"
    const hoursMinutesMatch = cleaned.match(/^(\d+)h\s*(\d+)m$/);
    if (hoursMinutesMatch) {
      const hours = parseInt(hoursMinutesMatch[1], 10);
      const minutes = parseInt(hoursMinutesMatch[2], 10);
      return hours * 60 + minutes;
    }

    // Format: "5.5h" or "5h"
    const hoursMatch = cleaned.match(/^(\d+(?:\.\d+)?)h$/);
    if (hoursMatch) {
      const hours = parseFloat(hoursMatch[1]);
      return Math.round(hours * 60);
    }

    // Format: "30m"
    const minutesMatch = cleaned.match(/^(\d+)m$/);
    if (minutesMatch) {
      return parseInt(minutesMatch[1], 10);
    }

    // Format: "5:30" (HH:MM)
    const colonMatch = cleaned.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
      const hours = parseInt(colonMatch[1], 10);
      const minutes = parseInt(colonMatch[2], 10);
      return hours * 60 + minutes;
    }

    return null;
  }

  /**
   * Calculate elapsed minutes between two dates
   * @param startDate - Start date/time
   * @param endDate - End date/time
   * @returns Elapsed minutes
   */
  static getElapsedMinutes(startDate: Date, endDate: Date): number {
    const milliseconds = endDate.getTime() - startDate.getTime();
    return Math.floor(milliseconds / 60000);
  }
}
