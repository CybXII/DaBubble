import { Component } from '@angular/core';
import { AddchatComponent } from "../../main/addchat/addchat.component";

@Component({
  selector: 'app-fullscreen-modal',
  standalone: true,   // <-- Add this line
  imports: [AddchatComponent],
  templateUrl: './fullscreen-modal.component.html',
  styleUrl: './fullscreen-modal.component.scss'
})
export class FullscreenModalComponent {

}
