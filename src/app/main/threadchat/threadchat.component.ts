import { Component } from '@angular/core';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';
import { ThreadchatHeaderComponent } from './threadchat-header/threadchat-header.component';

@Component({
  selector: 'app-threadchat',
  imports: [ThreadchatHeaderComponent, ChatboxComponent, MessageboxComponent],
  templateUrl: './threadchat.component.html',
  styleUrl: './threadchat.component.scss',
})
export class ThreadchatComponent {

  
}
