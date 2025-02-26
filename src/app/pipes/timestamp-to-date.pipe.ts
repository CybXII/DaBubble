import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore'

@Pipe({
  name: 'timestampToDate',
  standalone: true,
})
export class TimestampToDatePipe implements PipeTransform {
  /**
   * Converts a Timestamp, Date, number or string to a date string in german language.
   * @param value The value to be converted. If it is a Timestamp, it is converted to a Date.
   *              If it is a number, it is interpreted as a Unix timestamp in milliseconds.
   *              If it is a string, it is interpreted as a date string.
   * @returns A string describing the date in the format 'DD. MMMM YYYY'.
   *          If the input is invalid, 'Ungültiges Datum' is returned.
   */
  transform(value: number | Date | Timestamp | undefined): string {
    if (!value) return 'Ungültiges Datum';
    let date: Date;
    if (value instanceof Timestamp) 
      date = value.toDate();
    else if (typeof value === 'number') 
      date = new Date(value * 1000);
    else 
      date = new Date(value);
    return date.toLocaleDateString('de-DE', {day: '2-digit',month: 'long',year: 'numeric',});
  }
}


@Pipe({
  name: 'relativeDate',
  standalone: true,
})
export class RelativeDatePipe implements PipeTransform {
  /**
   * Converts a Timestamp, Date, number or string to a relative date string in german language.
   * @param value The value to be converted. If it is a Timestamp, it is converted to a Date.
   *              If it is a number, it is interpreted as a Unix timestamp in seconds.
   *              If it is a string, it is interpreted as a date string.
   * @returns A string describing the date relative to the current date.
   *          If the date is today, 'Heute' is returned.
   *          Otherwise, the weekday, day, month and year of the date are returned in german language.
   *          If the input is invalid, 'Ungültiges Datum' is returned.
   */
  transform(value: any): string {
    if (!value) return 'Ungültiges Datum';
    let date: Date;
    if (value instanceof Timestamp)
      date = value.toDate();
    else if (value.seconds)
      date = new Date(value.seconds * 1000);
    else if (value instanceof Date)
      date = value;
    else if (typeof value === 'string' || typeof value === 'number') 
      date = new Date(value);
    else
      return 'Ungültiges Datum';
    const today = new Date();
    if (date.getDate() === today.getDate() &&date.getMonth() === today.getMonth() &&date.getFullYear() === today.getFullYear()) 
      return `Heute`;
    return date.toLocaleDateString('de-DE', {weekday: 'long',day: 'numeric',month: 'long',});
  }
} 