import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, signal, WritableSignal } from '@angular/core';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Message, ThreadMessage } from '../../../models/message';
import { Observable, Subject } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { EditmessageComponent } from '../editmessage/editmessage.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatboxComponent implements OnInit, OnDestroy {
  @Input() builder!: string;
  // @Input() channelId!: string; // channelId als Input-Property hinzugefügt
  @Output() threadChatToggle = new EventEmitter<void>();
  
  currentChannel$: Observable<Channel | null>;
  messages$: Observable<Partial<Message>[]>;
  avatars$!: Observable<Map<string, string>>; // `!`-Operator verwendet
  threadMessages$: Observable<ThreadMessage[]>;
  activeUserId: string | null = null;
  activeMessageId: string | null = null;
  loadingMessages: WritableSignal<boolean> = signal(true);
  private destroy$ = new Subject<void>();
  loadingAvatars: boolean = false;

  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.currentChannel$ = this.channelsService.currentChannel$;
    this.messages$ = this.messagesService.messages$;
    this.threadMessages$ = this.messagesService.threadMessages$;
    this.activeUserId = this.authService.userId();
  }

  ngOnInit(): void {
    this.channelsService.setDefaultChannel();
    if (this.builder === 'mainchat') {
      this.initMainChat();
    } else if (this.builder === 'threadchat') {
      this.initThreadChat();
    }
  }

  ngOnDestroy(): void {
    console.log('Chatbox wird zerstört', this.builder);
    this.destroy$.next();
    this.destroy$.complete();
    console.log('Alle Ressourcen aufgeräumt.');
  }


  private initMainChat(): void {
    console.log(`Chatbox initialisiert mit builder: ${this.builder}`);
    this.currentChannel$
      .pipe(takeUntil(this.destroy$))
      .subscribe((channel) => this.handleMainChatChannel(channel));
    this.avatars$ = this.messagesService.avatars$;
  }


  private async handleMainChatChannel(channel: Channel | null): Promise<void> {
    if (channel) {
      this.loadingMessages.set(true);
      try {
        const loadMessages = this.messagesService.loadMessagesForChannel(channel.id || '');
        this.messages$ = loadMessages
        this.loadingAvatars = true;
      } catch (error) {
        console.error('Fehler beim Laden der Nachrichten:', error);
      } finally {
        this.loadingMessages.set(false);
      }
    }
  }

  loadMessagesForChannel(channelId: string): void {
    this.loadingAvatars = true;
    this.messages$ = this.messagesService.loadMessagesForChannel(channelId).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.loadingAvatars = false;
      }),
      catchError((error) => {
        console.error('Fehler beim Laden der Nachrichten:', error);
        this.loadingAvatars = false;
        return [];
      })
    );
  }


  private initThreadChat(): void {
    console.log(`Chatbox initialisiert mit builder: ${this.builder}`);
    this.messagesService.messageId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messageId) => this.handleThreadChatMessage(messageId));
      this.avatars$ = this.messagesService.avatars$;
  }


  private handleThreadChatMessage(messageId: string | null): void {
    this.activeMessageId = messageId;
    console.log('Thread-Nachrichten für Nachricht geladen:', messageId);

    if (messageId) {
      this.loadingMessages.set(true);
      try {
        this.messagesService.loadThreadMessages(messageId);
        this.activeMessageId = messageId;
      } catch (error) {
        console.error('Fehler beim Laden der Thread-Nachrichten:', error);
      } finally {
        this.loadingMessages.set(false);
      }
    } else {
      console.log('Keine gültige Message-ID für Thread gefunden.');
    }
  }


  /**
   * Wählt eine Nachricht aus und lädt die zugehörigen Thread-Nachrichten.
   */
  onMessageSelect(messageId: string): void {
    this.activeMessageId = messageId;
    console.log('Nachricht ausgewählt:', messageId);
    this.messagesService.setMessageId(messageId);
    this.messagesService.loadThreadMessages(messageId);
  }


  trackByMessageId(index: number, message: Message): string {
    return message.docId || index.toString();
  }

  editMessage(message: Partial<Message> , deleteMessage: boolean) {
    console.log('Editmessage wird ausgeführt:', message);
        this.dialog.open(EditmessageComponent, {
          width: 'fit-content',
          maxWidth: '100vw',
          height: 'fit-content',
          data: { message, deleteMessage },
        });
  }


  editThreadMessage(message: Partial<ThreadMessage>, deleteMessage: boolean, parentMessageId: string, docId: string | undefined) {
    console.log('Editmessage wird ausgeführt:', message);
    this.dialog.open(EditmessageComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { message, deleteMessage, thread: true, parentMessageId, docId },
    });
  }
}
