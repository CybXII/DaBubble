import { Component, Input } from '@angular/core';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';
import { ThreadchatHeaderComponent } from './threadchat-header/threadchat-header.component';
import { Thread } from '../../models/thread';
import { MessagesService } from '../../shared/services/messages.service';

@Component({
  selector: 'app-threadchat',
  standalone: true,   // <-- Add this line
  imports: [ThreadchatHeaderComponent, MessageboxComponent],
  templateUrl: './threadchat.component.html',
  styleUrl: './threadchat.component.scss',
})
export class ThreadchatComponent {
  @Input() builder!: string;
  @Input() parentMessage: any = null; // Parent-Message als Input
  threadMessages: any[] = []; // Thread-Nachrichten

  constructor(private messagesService: MessagesService) {}

  
  ngOnInit(): void {
    if (!this.parentMessage) {
      console.warn('parentMessage ist nicht definiert. Es werden Standardwerte verwendet.');
      this.parentMessage = {
        avatarPath: '/img/default-avatar.svg',
        name: 'Unbekannt',
        description: '',
        messageDate: '',
        messageTime: '',
      };
    }
    // Abonniere Thread-Nachrichten aus dem MessagesService
    this.messagesService.threadMessages$.subscribe((threadMessages) => {
      this.threadMessages = threadMessages || []; // Leeres Array bei undefined
      console.log('Thread-Nachrichten aktualisiert:', this.threadMessages);
    });
  }
}
