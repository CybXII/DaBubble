import { Component } from '@angular/core';
import { HeaderComponent } from '../shared/header/header.component';
import { BuilderComponent } from '../shared/builder/builder.component';
import { ToastMessageService } from '../shared/services/toastmessage.service';
import { ToastMessageComponent } from '../shared/toastmessage/toastmessage.component';

@Component({
  selector: 'app-main',
  standalone: true,   // <-- Add this line
  imports: [HeaderComponent, BuilderComponent, ToastMessageComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  constructor(private toastMessageService: ToastMessageService) {}

  get toastMessage(){
    return this.toastMessageService.toastSignal();
  }
}
