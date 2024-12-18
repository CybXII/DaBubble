import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ToastMessageService,
  ToastMessage,
} from '../services/toastmessage.service';

@Component({
  selector: 'app-toastmessage',
  templateUrl: './toastmessage.component.html',
  styleUrls: ['./toastmessage.component.scss'],
  standalone: true,
})
export class ToastMessageComponent implements OnInit, OnDestroy {
  toastMessage: ToastMessage | null = null;
  private subscription!: Subscription;

  constructor(public toastMessageService: ToastMessageService) {
    this.subscription = this.toastMessageService.toast$.subscribe(
      (toastMessage) => {
        this.toastMessage = toastMessage;
        setTimeout(() => (this.toastMessage = null), 2500);
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get toast(){
    return this.toastMessageService.toastSignal();
  }
}
