import { Component, Input, OnInit } from '@angular/core';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';
import { ThreadchatHeaderComponent } from './threadchat-header/threadchat-header.component';
import { ThreadMessage } from '../../models/message';
import { MessagesService } from '../../shared/services/messages.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';


@Component({
  selector: 'app-threadchat',
  standalone: true,
  imports: [ThreadchatHeaderComponent, ChatboxComponent,MessageboxComponent,CommonModule],
  templateUrl: './threadchat.component.html',
  styleUrls: ['./threadchat.component.scss'],
})
export class ThreadchatComponent implements OnInit {
  @Input() builder!: string;
  @Input() parentMessage: any = null; // Parent-Message als Input
  threadMessages$!: Observable<ThreadMessage[]>; // Thread-Nachrichten

  constructor(private messagesService: MessagesService) {}

  ngOnInit(): void {
    this.threadMessages$ = this.messagesService.threadMessages$;
  }

  trackByThreadMessageId(index: number, threadMessage: ThreadMessage): string {
    return threadMessage.docId!;
  }
}