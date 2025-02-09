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
import { combineLatest, from, Observable, of, Subject } from 'rxjs';
import { catchError, filter, isEmpty, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
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
import { FormsModule } from '@angular/forms';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
import { SaveEditMessageService } from '../../../shared/services/save-edit-message.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { ParentMessageComponent } from '../parentmessage/parent-message.component';
import { MessageComponent } from '../messages/messages.component';
import { ThreadMessageComponent } from '../threadmessages/threadmessages.component';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, RelativeDatePipe, FormsModule, ParentMessageComponent, MessageComponent, ThreadMessageComponent],
  styleUrls: ['./chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatboxComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() builder!: string;
  @Output() threadChatToggle = new EventEmitter<void>();
  
  currentChannel$: Observable<Channel | null>;
  messages$: Observable<Message[]>;
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
  messages = signal<Message[]>([]);
  previousTimestamp: number | null = null;
  isEmptyMessage: boolean = false;
  self:boolean = false;
  private:boolean = false;
  channelName: string = '';
  channelCreatorName:string = '';
  timestep: any;
  user: {
    name:string,
    photoUrl:string,
    id:string,
  } = {
    name: '',
    photoUrl: '',
    id: '',
  };

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
    private stateService: StateService,
    private saveEditedMessage: SaveEditMessageService,
    private emojiStorageService: EmojiStorageService
  ) {
    this.currentChannel$ = this.channelsService.currentChannel$;
    this.messages$ = this.messagesService.messages$.pipe(
      map(messages => 
        messages.map(message => ({
          ...message,
          timestamp: message['timestamp'] ? new Date(message['timestamp']) : new Date(),
          threadMessages$: message.threadMessages$
            }))
      )
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
    this.channelsService.currentChannel$.pipe(
      filter(channel => !!channel),
      switchMap((channel) => 
        this.getUserName(channel?.createdBy ?? '').pipe(
          map(userName => ({ channel, userName })),
          tap(({ channel }) => {
            let x = new Date(channel?.createdAt ? channel?.createdAt : '')
          
            if (typeof Date) {
              const day = x.getDate();
              const month = x.getMonth() + 1; // Monate sind 0-basiert
              const year = x.getFullYear();
              const newDate = `${day}.${month}.${year}`;
              
              if (
                (x.getDate() === new Date().getDate()) &&
                (x.getMonth()+1 === new Date().getMonth() +1) &&
                (x.getFullYear() === new Date().getFullYear())
              ) {
                this.timestep = "Heute"
              } else {
                this.timestep = newDate;
              }
            } else {
              console.error("Can't set Date, invalid timestamp");
            }
          }),
        ),
      )
    ).subscribe(({ channel, userName }) => {
      if (channel) {
        this.messagesService.loadMessagesForChannel(channel.id);
      }
      this.channelCreatorName = userName;
    });
    
    this.messagesService.messageId$.subscribe((messageId) => {
      if (messageId) {
        this.setParentMessage();
      }
    });
    this.messagesService.messages$.subscribe(messages => {
      this.messages.set(
        messages.map(msg => ({
          ...msg,
          threadMessages: [],
        }))
      );
    
      messages.forEach(msg => {
        if (msg.docId) {
          this.messagesService.getThreadMessagesForMessage(msg.docId).subscribe(threads => {
            const updatedMessages = this.messages().map(m =>
              m.docId === msg.docId ? { ...m, threadMessages: threads } : m
            );
            this.messages.set(updatedMessages);
          });
        };
      });
    
    });    
    this.setParentMessage();
    this.threadMessages$.subscribe(threadMessages => {
    });
    this.avatars$ = this.messagesService.avatars$;

    this.currentChannel$.subscribe(channel => {
      this.channelName = channel?.name ? channel.name : "";
      if (channel?.isPrivate) {
        this.private = true;

        if (channel.members.length == 1 && channel.members[0] === this.activeUserId) {
          this.getOwnData()
        } else {
          this.self = false;
          let user = channel.members.filter(id => id !== this.activeUserId);
          let userobj = this.userService.getUserById(user[0]).pipe(map((user) => user));
          userobj.subscribe(user => {
            const data = {
              name: user.name ? user.name : '',
              photoUrl: user.photoURL ? user.photoURL : '',
              id: user.userId ? user.userId : '',
            }
            this.user = data;
          })
        }
        this.checkMessageIsEmpty();
      } else {
        this.private = false
      }
    })
  }


  ngAfterViewInit(): void {
    if (this.builder === 'threadchat') {
      this.messagesService.parentMessageId$.subscribe((messageId) => {
        if (messageId) {
          this.setParentMessage();
          this.activeMessageId = messageId;
        }
      });
    }
    const chatbox = document.querySelector(this.builder === 'mainchat' ? '.mainchat__chatbox' : '.threadchat__chatbox');
    if (chatbox) {
      const observer = new MutationObserver(() => {
        this.scrollToBottom(this.builder === 'mainchat' ? '.mainchat__chatbox' : '.threadchat__chatbox');
      });
      observer.observe(chatbox, { childList: true, subtree: true });
      this.checkMessageIsEmpty();
    }
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
    }, 500);
  }


  async onMessageSelect(messageId: string): Promise<void> {
    this.messagesService.setParentMessageId(messageId);
    this.activeMessageId = messageId;
    this.messagesService.setMessageId(messageId);
    this.stateService.setThreadchatState('in');
  }


  setParentMessage(): void {
    combineLatest([
      this.messagesService.parentMessageId$,
      this.messagesService.messages$
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([parentMessageId, messages]) => {
      this.parentMessage = messages.find(msg => msg.docId === parentMessageId) || null;
      this.cdRef.markForCheck();
    });
  }


  // editMessage(message: Partial<Message>, deleteMessage: boolean) {
  //   this.dialog.open(EditmessageComponent, {
  //     width: 'fit-content',
  //     maxWidth: '100vw',
  //     height: 'fit-content',
  //     data: { message, deleteMessage },
  //   });
  // }

  editMessage2(message: Partial<Message>) {
    message.sameDay = true;
  }

  // cancelEdit(message: Partial<Message>) {
  //   message.sameDay = false;
  // }

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

  addEmoji(messageIdOrThreadDocId: string, userId: string, emoji: string, isThreadMessage: boolean): void {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };
    const updatePromise = isThreadMessage
      ? this.messagesService.updateThreadMessage(this.activeMessageId!, messageIdOrThreadDocId, userId, updateData)
      : this.messagesService.updateMessage(messageIdOrThreadDocId, userId, updateData);
    updatePromise.catch(error => console.error('Fehler beim Hinzufügen der Reaktion:', error));
    this.emojiPickerService.closeChatBoxEmojiPicker();
    this.emojiStorageService.saveEmoji(emoji);
  }


  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }


  @HostListener('document:click', ['$event'])
  onChatboxDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
  
    if (!target.closest('.emoji-picker__wrapper')) { 
      // Schließe nur, wenn NICHT auf einen Emoji-Picker geklickt wurde
      this.emojiPickerService.closeChatBoxEmojiPicker();
    }
  }



  handleUserClick(userId: string): void {
    if (userId) {
      if (this.activeUserId !== userId) {
        this.openDialogUser(userId);
      } else {
        this.userDialog$.openProfile();
        this.userDialog$.exitActiv = false;
      }
    }
  }


  openDialogUser(id: string | undefined): void {
    this.dialog.open(ProfileviewComponent, {
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


  getUserName(userId: string): Observable<string> {
    return this.userService.getuserName(userId);
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

  checkMessageIsEmpty() {
    this.messages$.subscribe(message => {
      if (message.length === 0) {
        this.isEmptyMessage = true;
      } else {
        this.isEmptyMessage = false;
      }
    })    
  }
  

  getLastUsedEmojis(index: number) {
    const emojis = this.emojiStorageService.getEmojis();
    return emojis[index];
  }

  getOwnData() {
    let id = this.activeUserId ? this.activeUserId : "";
    let userObj = this.userService.getUserById(id).pipe(map((user) => user));
    userObj.subscribe(user => {
      const data = {
        name: user.name ? user.name : '',
        photoUrl: user.photoURL ? user.photoURL : '',
        id: user.userId ? user.userId : '',
      }
      this.user = data;
    })
    this.self = true;
  }

  // checkIdIsUser(id: string | undefined) {
  //   if (this.activeUserId !== id) {
  //     this.openDialogUser(id);
  //   } else {
  //     this.userDialog$.openProfile();
  //     this.userDialog$.exitActiv = false;
  //   }
  // }

}
