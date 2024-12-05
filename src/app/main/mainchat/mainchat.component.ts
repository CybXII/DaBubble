import { Component } from '@angular/core';
import { ChatHeaderComponent } from '../shared/chat-header/chat-header.component';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';
@Component({
  selector: 'app-mainchat',
  imports: [ChatHeaderComponent, ChatboxComponent, MessageboxComponent],
  templateUrl: './mainchat.component.html',
  styleUrl: './mainchat.component.scss'
})
export class MainchatComponent {

}
