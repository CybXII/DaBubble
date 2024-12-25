import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, signal, WritableSignal } from '@angular/core';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Message, ThreadMessage } from '../../../models/message';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimiert die Change Detection
})
export class ChatboxComponent implements OnInit, OnDestroy {
  @Input() builder!: string; // Vom Parent übergebener Channel-Name/ID
  @Output() threadChatToggle = new EventEmitter<void>(); // Öffnet den Thread-Chat
  currentChannel$: Observable<Channel | null>; // Aktueller Channel
  messages$: Observable<Partial<Message>[]>;
  threadMessages$: Observable<ThreadMessage[]>;
  activeUserId: string | null = null;
  activeMessageId: string | null = null; // Aktive Nachricht
  activeUserPhotoURL: string | null = null; // Avatar des aktiven Benutzers
  loadingMessages: WritableSignal<boolean> = signal(true);

  private destroy$ = new Subject<void>(); // Zum Aufräumen der Abonnements

  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private authService: AuthService
  ) {
    this.currentChannel$ = this.channelsService.currentChannel$;
    this.messages$ = this.messagesService.messages$; 
    this.threadMessages$ = this.messagesService.threadMessages$;
    this.activeUserId = this.authService.userId();
  }

  ngOnInit(): void {
    if (this.builder === 'mainchat') {
      console.log(`Chatbox initialisiert mit builder: ${this.builder}`);
      this.currentChannel$
        .pipe(takeUntil(this.destroy$)) // Automatisch beendet bei destroy$
        .subscribe((channel) => {
          if (channel) {
            this.loadingMessages.set(true);
            try {
              this.messagesService.loadMessagesForChannel(channel.id || '');
            } catch (error) {
              console.error('Fehler beim Laden der Nachrichten:', error);
            } finally {
              this.loadingMessages.set(false);
            }        
          }
        });
    }

    if (this.builder === 'threadchat') {
      console.log(`Chatbox initialisiert mit builder: ${this.builder}`);
      this.messagesService.messageId$
        .pipe(takeUntil(this.destroy$)) // Automatisch beendet bei destroy$
        .subscribe((messageId) => {
          if (messageId) {
            this.loadingMessages.set(true);
            try {
              this.messagesService.loadThreadMessages(messageId);
            } catch (error) {
              console.error('Fehler beim Laden der Thread-Nachrichten:', error);
            } finally {
              this.loadingMessages.set(false);
            }
          } else {
            console.log('Keine gültige Message-ID für Thread gefunden.');
          }
        });
    }
  }

  ngOnDestroy(): void {
    console.log('Chatbox wird zerstört', this.builder);
    this.destroy$.next(); // Signalisiert das Ende aller Abonnements
    this.destroy$.complete(); // Schließt den Subject-Stream
    console.log('Alle Ressourcen aufgeräumt.');
  }

  /**
   * Wählt eine Nachricht aus und lädt die zugehörigen Thread-Nachrichten.
   */
  onMessageSelect(messageId: string): void {
    this.activeMessageId = messageId; // Setze die aktive Nachricht
    this.messagesService.setMessageId(messageId); // Aktualisiere die Message-ID im Service
    this.messagesService.loadThreadMessages(messageId); // Lade Thread-Nachrichten
  }

  trackByMessageId(index: number, message: Message): string {
    return message.docId || index.toString(); // Fallback auf Index, falls docId fehlt
  }
}
