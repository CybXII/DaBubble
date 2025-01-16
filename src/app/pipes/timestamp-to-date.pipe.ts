import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timestampToDate',
  standalone: true,
})
export class TimestampToDatePipe implements PipeTransform {
  transform(value: number | undefined): string {
    if (!value) return '';

    const date = new Date(value * 1000);

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
    if (!value) {
      return 'Ungültiges Datum';
    }

    // Konvertiere Firebase-Timestamp zu Date
    let date: Date;
    if (value.seconds) {
      date = new Date(value.seconds * 1000);
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      return 'Ungültiges Datum';
    }

    const today = new Date();

    // Prüfen, ob das Datum heute ist
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return `Heute, ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }

    // Andernfalls Standard-Datumsformat zurückgeben
    return date.toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ` - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}
