import { Component } from '@angular/core';
import { ToastMessageService, ToastMessage } from '../services/toastmessage.service';

@Component({
  selector: 'app-toastmessage',
  templateUrl: './toastmessage.component.html',
  styleUrls: ['./toastmessage.component.scss'],
  standalone: true,
})

export class ToastMessageComponent {
  toastMessage: ToastMessage | null = null;

  /**
   * Creates an instance of ToastMessageComponent.
   * @param {ToastMessageService} toastMessageService - The toast message service.
   */
  constructor(private toastMessageService: ToastMessageService) {
  }

  /**
   * Gets the current toast message.
   * @returns {Observable<ToastMessage | null>} - The current toast message.
   */
  get toast(){
    return this.toastMessageService.toastSignal();
  }
}
