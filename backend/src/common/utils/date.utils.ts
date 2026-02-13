/**
 * Date normalization utilities with timezone support
 * Sistema Zaiken - Manejo correcto de fechas para sistema de deuda de horas
 */

import * as moment from 'moment-timezone';

export class DateUtils {
  private static DEFAULT_TIMEZONE = 'America/Bogota';

  /**
   * Normalize a date to midnight in the business timezone
   * This ensures consistent "same day" comparisons regardless of user timezone
   * @param date - Date to normalize (Date object or ISO string)
   * @param timezone - Business timezone (defaults to America/Bogota)
   * @returns Date normalized to midnight
   */
  static normalizeToBusinessDate(
    date: Date | string,
    timezone?: string,
  ): Date {
    const tz = timezone || this.DEFAULT_TIMEZONE;

    // If date is a string in YYYY-MM-DD format, parse it explicitly in the target timezone
    // to avoid UTC interpretation issues
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return moment.tz(date, 'YYYY-MM-DD', tz).startOf('day').toDate();
    }

    // For Date objects or other string formats, convert to the target timezone
    return moment.tz(date, tz).startOf('day').toDate();
  }

  /**
   * Get start and end of day range in business timezone
   * Useful for date range queries
   * @param date - Date to get range for
   * @param timezone - Business timezone
   * @returns Object with start and end dates
   */
  static getDateRange(
    date: Date | string,
    timezone?: string,
  ): { start: Date; end: Date } {
    const tz = timezone || this.DEFAULT_TIMEZONE;
    const m = moment.tz(date, tz).startOf('day');
    return {
      start: m.toDate(),
      end: m.clone().endOf('day').toDate(),
    };
  }

  /**
   * Check if two dates are the same day in the business timezone
   * @param date1 - First date
   * @param date2 - Second date
   * @param timezone - Business timezone
   * @returns True if same day
   */
  static isSameDay(
    date1: Date,
    date2: Date,
    timezone?: string,
  ): boolean {
    const tz = timezone || this.DEFAULT_TIMEZONE;
    return moment.tz(date1, tz).isSame(moment.tz(date2, tz), 'day');
  }

  /**
   * Format date as YYYY-MM-DD in business timezone
   * @param date - Date to format
   * @param timezone - Business timezone
   * @returns Formatted date string
   */
  static formatDate(date: Date, timezone?: string): string {
    const tz = timezone || this.DEFAULT_TIMEZONE;
    return moment.tz(date, tz).format('YYYY-MM-DD');
  }

  /**
   * Format date with time as YYYY-MM-DD HH:mm:ss in business timezone
   * @param date - Date to format
   * @param timezone - Business timezone
   * @returns Formatted datetime string
   */
  static formatDateTime(date: Date, timezone?: string): string {
    const tz = timezone || this.DEFAULT_TIMEZONE;
    return moment.tz(date, tz).format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Get current date normalized to midnight in business timezone
   * @param timezone - Business timezone
   * @returns Today's date at midnight
   */
  static getToday(timezone?: string): Date {
    return this.normalizeToBusinessDate(new Date(), timezone);
  }

  /**
   * Add days to a date
   * @param date - Base date
   * @param days - Number of days to add (can be negative)
   * @param timezone - Business timezone
   * @returns New date
   */
  static addDays(date: Date, days: number, timezone?: string): Date {
    const tz = timezone || this.DEFAULT_TIMEZONE;
    return moment.tz(date, tz).add(days, 'days').toDate();
  }

  /**
   * Get timezone from Negocio configuration
   * @param negocioConfig - Configuration JSON from Negocio
   * @returns Timezone string or default
   */
  static getTimezoneFromConfig(negocioConfig: any): string {
    return negocioConfig?.timezone || this.DEFAULT_TIMEZONE;
  }

  /**
   * Validate that a date is not in the future
   * @param date - Date to validate
   * @param timezone - Business timezone
   * @returns True if date is today or in the past
   */
  static isNotFuture(date: Date, timezone?: string): boolean {
    const tz = timezone || this.DEFAULT_TIMEZONE;
    const today = this.getToday(tz);
    const normalizedDate = this.normalizeToBusinessDate(date, tz);
    return normalizedDate <= today;
  }
}
