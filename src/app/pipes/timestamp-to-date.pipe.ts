import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore'

@Pipe({
  name: 'timestampToDate',
  standalone: true,
})
export class TimestampToDatePipe implements PipeTransform {
  transform(value: number | Date | Timestamp | undefined): string {
    if (!value) return 'Ungültiges Datum';

    let date: Date;
    if (value instanceof Timestamp) {
      date = value.toDate(); // Firestore-Timestamp zu Date konvertieren
    } else if (typeof value === 'number') {
      date = new Date(value * 1000); // Unix-Timestamp in Millisekunden umwandeln
    } else {
      date = new Date(value);
    }

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}


@Pipe({
  name: 'relativeDate',
  standalone: true,
})
export class RelativeDatePipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return 'Ungültiges Datum';

    let date: Date;
    if (value instanceof Timestamp) {
      date = value.toDate();
    } else if (value.seconds) {
      date = new Date(value.seconds * 1000);
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      return 'Ungültiges Datum';
    }

    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return `Heute`;
    }

    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
} 