import { Component, Input } from '@angular/core';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';
import { ThreadchatHeaderComponent } from './threadchat-header/threadchat-header.component';
import { Thread } from '../../models/thread';
import { MessagesService } from '../../shared/services/messages.service';

@Component({
  selector: 'app-threadchat',
  standalone: true,   // <-- Add this line
  imports: [ThreadchatHeaderComponent, ChatboxComponent, MessageboxComponent],
  templateUrl: './threadchat.component.html',
  styleUrl: './threadchat.component.scss',
})
export class ThreadchatComponent {
  @Input() builder!: string;
  @Input() parentMessage!: any; // Parent-Message als Input
  threadMessages: any[] = []; // Thread-Nachrichten

  constructor(private messagesService: MessagesService) {}

  ngOnInit(): void {
    // Abonniere Thread-Nachrichten aus dem MessagesService
    this.messagesService.threadMessages$.subscribe((threadMessages) => {
      this.threadMessages = threadMessages;
      console.log('Thread-Nachrichten aktualisiert:', this.threadMessages);
    });
  }
}
