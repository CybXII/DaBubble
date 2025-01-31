import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  WritableSignal,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  DestroyRef,
  NgModule,
} from '@angular/core';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Message, Reaction, ThreadMessage } from '../../../models/message';
import { combineLatest, from, Observable, Subject } from 'rxjs';
import { catchError, map, startWith, takeUntil, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { EditmessageComponent } from '../editmessage/editmessage.component';
import { MatDialog } from '@angular/material/dialog';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { ProfileviewComponent } from '../../../shared/profileview/profileview.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { UserDialogService } from '../../../shared/services/user-dialog.service';
import { RelativeDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import { UserService } from '../../../shared/services/user.service';
import { StateService } from '../../../shared/services/state.service';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, RelativeDatePipe],
  styleUrls: ['./chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatboxComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() builder!: string;
  @Output() threadChatToggle = new EventEmitter<void>();
  
  currentChannel$: Observable<Channel | null>;
  messages$: Observable<Partial<Message>[]>;
  threadMessages$: Observable<ThreadMessage[]>;
  avatars$!: Observable<Map<string, string>>;
  parentMessage: Partial<Message> | null = null;  
  activeUserId: string | null = null;
  activeMessageId: string | null = null;
  loadingMessages: WritableSignal<boolean> = signal(true);
  loadingAvatars  = true;
  private destroy$ = new Subject<void>();
  displayEmojiPickerMainThread:boolean = false;
  isChatBoxEmojiPickerOpen: boolean = false;
  chatBoxEmojiPickerOpenFor: string | null = null;
  displayPickerBottom: boolean = false;

  previousTimestamp: number | null = null;

  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private authService: AuthService,
    public dialog: MatDialog,
    private userDialog$: UserDialogService,
    public emojiPickerService: EmojiPickerService,
    private cdRef: ChangeDetectorRef,
    private destroyRef: DestroyRef,
    private userService: UserService,
    private stateService: StateService
  ) {
    this.currentChannel$ = this.channelsService.currentChannel$;
    this.messages$ = combineLatest([
      this.channelsService.currentChannel$,
      this.messagesService.messages$
    ]).pipe(
      map(([channel, messages]) => {
        if (!channel) return [];
        return messages.filter(message => message.channelId === channel.id);
      })
    );
    this.threadMessages$ = combineLatest([
      this.messagesService.messageId$.pipe(startWith(null)),
      this.messagesService.threadMessages$.pipe(map(threads => threads || [])),
    ]).pipe(
      map(([messageId, threads]) => {
        if (!messageId) return [];
        return threads.filter(thread => thread.messageId === messageId);
      })
    );

    this.activeUserId = this.authService.userId();
  }

  ngOnInit(): void {
    this.channelsService.setDefaultChannel();
    this.channelsService.currentChannel$.subscribe(channel => {
      if (channel) {
        this.messagesService.loadMessagesForChannel(channel.id);
      }
    });
    this.avatars$ = this.messagesService.avatars$;
    
    const emojiSubscription1 = this.emojiPickerService.isChatBoxPickerOpen$.subscribe((open) => {
      this.isChatBoxEmojiPickerOpen = open;
      this.cdRef.markForCheck();
    });
    
    const emojiSubscription2 = this.emojiPickerService.chatBoxEmojiPickerForId$.subscribe((id) => {
      this.chatBoxEmojiPickerOpenFor = id;
      this.cdRef.markForCheck();
    });
    
    const emojiSubscription3 = this.emojiPickerService.displayEmojiPickerMainThread$.subscribe((display) => {
      this.displayEmojiPickerMainThread = display;
      console.log('Emoji main thread?' + display)
      this.cdRef.markForCheck();
    });
    
    this.destroyRef.onDestroy(() => {
      emojiSubscription1.unsubscribe();
      emojiSubscription2.unsubscribe();
      emojiSubscription3.unsubscribe();
    });
  }


  ngAfterViewInit(): void {
    if (this.builder === 'threadchat') {
      this.messagesService.parentMessageId$.subscribe((messageId) => {
        if (messageId) {
          this.setParentMessage(messageId);
        }
      });
    }


    setTimeout(() => {
      this.scrollToBottom(
        this.builder === 'mainchat' ? '.mainchat__chatbox' : '.threadchat__chatbox'
      );
    }, 0);
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  scrollToBottom(selector: string): void {
    setTimeout(() => {
      const chatbox = document.querySelector(selector) as HTMLElement;
      if (chatbox) {
        chatbox.scrollTop = chatbox.scrollHeight;
      }
    }, 0);
  }


  async onMessageSelect(messageId: string): Promise<void> {
    this.messagesService.setParentMessageId(messageId);
    this.activeMessageId = messageId;
    this.messagesService.setMessageId(messageId);
    this.stateService.setThreadchatState('in');
  }


  setParentMessage(messageId: string): void {
    this.messages$.subscribe((messages) => {
      const foundMessage = messages.find((msg) => msg.docId === messageId) || null;
      if (foundMessage) {
        this.parentMessage = foundMessage;
      }
    });
  }

  editMessage(message: Partial<Message>, deleteMessage: boolean) {
    this.dialog.open(EditmessageComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { message, deleteMessage },
    });
  }


  editThreadMessage(
    message: Partial<ThreadMessage>,
    deleteMessage: boolean,
    parentMessageId: string,
    docId: string | undefined
  ) {
    this.dialog.open(EditmessageComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { message, deleteMessage, thread: true, parentMessageId, docId },
    });
  }

  toggleEmojiPicker(messageId: string, displayPickerBottom: boolean, threadMain?: boolean) {
    console.log('open picker for:' + messageId + ' picker bottom?: ' + displayPickerBottom + ' threadMain?: ' + threadMain);
    this.displayPickerBottom = displayPickerBottom;
    if (this.isChatBoxEmojiPickerOpen) {
      if (messageId !== this.chatBoxEmojiPickerOpenFor) {
        this.emojiPickerService.openNewChatBoxEmojiPicker(messageId, threadMain ? threadMain : false);
      } else {
        this.emojiPickerService.openChatBoxEmojiPicker(messageId, threadMain ? threadMain : false)
      }
    } else {
      this.emojiPickerService.openChatBoxEmojiPicker(messageId, threadMain || false);
    }
  }


  addEmoji(messageIdOrThreadDocId: string, userId: string, emoji: string, isThreadMessage: boolean): void {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };
    const updatePromise = isThreadMessage
      ? this.messagesService.updateThreadMessage(this.activeMessageId!, messageIdOrThreadDocId, userId, updateData)
      : this.messagesService.updateMessage(messageIdOrThreadDocId, userId, updateData);
    updatePromise.catch(error => console.error('Fehler beim Hinzufügen der Reaktion:', error));
    this.emojiPickerService.closeChatBoxEmojiPicker();
  }


  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }


  @HostListener('document:click', ['$event'])
  onChatboxDocumentClick(event: MouseEvent): void {
    if (this.isChatBoxEmojiPickerOpen) {
      this.emojiPickerService.closeChatBoxEmojiPicker();
    }
  }


  checkIdIsUser(id: string | undefined) {
    if (this.activeUserId !== id) {
      this.openDialogUser(id);
    } else {
      this.userDialog$.openProfile();
      this.userDialog$.exitActiv = false;
    }
  }


  openDialogUser(id: string | undefined): void {
    this.dialog.open(EditmessageComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { ID: id },
    });
  }


  checkAndSetPreviousTimestamp(currentTimestamp: string | Date | undefined): boolean {
    if (!currentTimestamp) {
      return false;
    }
    const currentDate = new Date(currentTimestamp);
    if (isNaN(currentDate.getTime())) {
      throw new Error('Invalid timestamp provided');
    }
    if (!this.previousTimestamp) {
      this.previousTimestamp = currentDate.getTime();
      return true;
    }
    const previousDate = new Date(this.previousTimestamp);
    const isDifferentDay =
      currentDate.getDate() !== previousDate.getDate() ||
      currentDate.getMonth() !== previousDate.getMonth() ||
      currentDate.getFullYear() !== previousDate.getFullYear();
    this.previousTimestamp = currentDate.getTime();
    return isDifferentDay;
  }


  getOtherUserId(userIds: string[]): string[] {
    return userIds.filter(id => id !== this.activeUserId);
  }


  getOtherUser(userId: string): Observable<string> {
    return this.userService.getUserById(userId).pipe(map((user) => user.name));
  }

  getUserAvatar(userId: string) {
    return this.userService.getuserAvatar(userId);
  }


  trackByMessage(index: number, message: ThreadMessage): string {
    let timestampValue: number = 0;
    if (message.timestamp instanceof Date) {
      timestampValue = message.timestamp.getTime();
    } else if (typeof message.timestamp === 'string') {
      timestampValue = new Date(message.timestamp).getTime();
    } else if (typeof message.timestamp === 'number') {
      timestampValue = message.timestamp;
    } else if (message.timestamp && 'seconds' in message.timestamp) {
      timestampValue = message.timestamp;
    }
    return message.docId || `fallback-${timestampValue}-${index}`;
  }
}