import { Component } from '@angular/core';
import { ChatHeaderComponent } from '../shared/chat-header/chat-header.component';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';

@Component({
  selector: 'app-threadchat',
  imports: [ChatHeaderComponent, ChatboxComponent, MessageboxComponent],
  templateUrl: './threadchat.component.html',
  styleUrl: './threadchat.component.scss'
})
export class ThreadchatComponent {

}
