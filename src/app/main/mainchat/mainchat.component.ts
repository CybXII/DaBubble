import { Component } from '@angular/core';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';
import { MainchatHeaderComponent } from './mainchat-header/mainchat-header.component';
@Component({
  selector: 'app-mainchat',
  standalone: true,   // <-- Add this line
  imports: [MainchatHeaderComponent, ChatboxComponent, MessageboxComponent],
  templateUrl: './mainchat.component.html',
  styleUrl: './mainchat.component.scss'
})
export class MainchatComponent {

}
