import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  error: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastMessageService {
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();
  toastSignal = signal<string>('');

  /**
   * Shows a toast message with the given text.
   * @param error A boolean indicating if the toast message should be displayed as an error.
   * @param message The text to be displayed in the toast message.
   * @returns {void}
   */
  showToast(error: boolean, message: string) {
    this.toastSubject.next({ error, message });
  }

  /**
   * Shows a toast message with the given text for a short duration.
   * @param message The text to be displayed in the toast message.
   * @returns {void}
   */
  showToastSignal(message: string) {
    this.toastSignal.set(message);
    setTimeout(() => {
      this.toastSignal.set('');
    }, 2500);
  }
}
