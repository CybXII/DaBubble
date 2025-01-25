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
import { Observable, Subject } from 'rxjs';
import { catchError, map, takeUntil, tap } from 'rxjs/operators';
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


@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, RelativeDatePipe],
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatboxComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() builder!: string;
  @Output() threadChatToggle = new EventEmitter<void>();
  currentChannel$: Observable<Channel | null>;
  messages$: Observable<Partial<Message>[]>;
  avatars$!: Observable<Map<string, string>>;
  threadMessages$: Observable<ThreadMessage[]>;
  activeUserId: string | null = null;
  activeMessageId: string | null = null;
  loadingMessages: WritableSignal<boolean> = signal(true);
  private destroy$ = new Subject<void>();
  loadingAvatars: boolean = false;
  selectedEmoji: string = '';
  isChatBoxEmojiPickerOpen: boolean = false;
  chatBoxEmojiPickerOpenFor: string | null = null;
  displayPickerBottom: boolean = false;
  parentMessage: Message | null = null;
  currentDay:boolean = false;
  displayEmojiPickerMainThread:boolean = false;

  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private authService: AuthService,
    public dialog: MatDialog,
    private userDialog$: UserDialogService,
    public emojiPickerService: EmojiPickerService,
    private cdRef: ChangeDetectorRef,
    private destroyRef: DestroyRef
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
      this.cdRef.markForCheck();
    })

    this.destroyRef.onDestroy(() => {
      emojiSubscription1.unsubscribe();
      emojiSubscription2.unsubscribe();
      emojiSubscription3.unsubscribe();
    })
  }

  ngAfterViewInit(): void {
    const chatboxSelector =
      this.builder === 'mainchat' ? 'mainchat__chatbox' : 'threadchat__chatbox';
    const observer = new MutationObserver(() => {
      const chatbox = document.querySelector(chatboxSelector) as HTMLElement;
      if (chatbox) {
        chatbox.scrollTop = chatbox.scrollHeight;
        observer.disconnect();
      }
    });
    if (this.builder === 'threadchat') {
      console.log('ChatboxComponent initialized', this.parentMessage);
    }
    observer.observe(document.body, { childList: true, subtree: true });
  }

  scrollToBottom(selector: string): void {
    const chatbox = document.querySelector(selector) as HTMLElement;
    if (chatbox) {
      setTimeout(() => {
        chatbox.scrollTop = chatbox.scrollHeight;
      }, 0);
    }
  }


  checkForScrollbar(selector: string): void {
    const chatbox = document.querySelector(selector) as HTMLElement;
    if (chatbox.scrollHeight > chatbox.clientHeight) {
      chatbox.classList.add('has-scroll');
      this.scrollToBottom(selector);
    } else {
      chatbox.classList.remove('has-scroll');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initMainChat(): void {
    this.currentChannel$
      .pipe(takeUntil(this.destroy$))
      .subscribe((channel) => this.handleMainChatChannel(channel));
    this.avatars$ = this.messagesService.avatars$;
  }

  private initThreadChat(): void {
    this.messagesService.messageId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messageId) => this.handleThreadChatMessage(messageId));
  
    // Parent-Message abonnieren und Change Detection auslösen
    this.messagesService.parentMessage$
      .pipe(
        takeUntil(this.destroy$),
        map((parentMessage) => {
          if (parentMessage && parentMessage.timestamp) {
            return {
              ...parentMessage,
            };
          }
          return parentMessage;
        })
      )
      .subscribe((formattedParentMessage) => {
        this.parentMessage = formattedParentMessage;
        console.log('Formattierte Parent-Nachricht:', this.parentMessage);
        console.log('ThreadNachrichten:', this.messages$);
        this.cdRef.detectChanges(); // Manuelle Änderungserkennung
      });
  }




  private async handleMainChatChannel(channel: Channel | null): Promise<void> {
    if (channel) {
      this.loadingMessages.set(true);
      try {
        this.messages$ = this.messagesService
          .loadMessagesForChannel(channel.id || '')
          .pipe(
            tap(() => {
              setTimeout(() => {
                this.scrollToBottom(
                  this.builder === 'mainchat'
                    ? '.mainchat__chatbox'
                    : '.threadchat__chatbox'
                );
              }, 0);
              this.loadingAvatars = true;
            }),
            map((messages) =>
              messages.sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return dateA - dateB;
              }),
            ),
            tap(() => {
              // this.checkSameDay();
              this.loadingAvatars = false;
            }),
            catchError((error) => {
              console.error(
                'Fehler beim Laden und Sortieren der Nachrichten:',
                error
              );
              this.loadingAvatars = false;
              return [];
            })
          );
        this.getMessageTimestep();
      } catch (error) {
        console.error('Fehler beim Laden der Nachrichten:', error);
      } finally {
        this.loadingMessages.set(false);
        // this.getMessageTimestep();
      }
    }
  }

  private handleThreadChatMessage(messageId: string | null): void {
    this.activeMessageId = messageId;
    if (messageId) {
      this.loadingMessages.set(true);
      try {
        this.messagesService.loadThreadMessages(messageId);
        this.activeMessageId = messageId;
      } catch (error) {
        console.error('Fehler beim Laden der Thread-Nachrichten:', error);
      } finally {
        this.loadingMessages.set(false);
        setTimeout(() => {
          this.scrollToBottom('.threadchat__chatbox');
        }, 200);
      }
    } else {
      console.log('Keine gültige Message-ID für Thread gefunden.');
    }
  }

  onMessageSelect(messageId: string): void {
    this.activeMessageId = messageId;
    this.messagesService.setMessageId(messageId);
    this.messagesService.loadThreadMessages(messageId);
  }

  trackByMessageId(index: number, message: Message): string {
    return message.docId || index.toString();
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
    console.log('displayEmojiPickerMainThread', this.displayEmojiPickerMainThread);
    // checks if the picker should display at the bottom or at the top of the message
    this.displayPickerBottom = displayPickerBottom;
    // checks if any picker of the messagebox is open, and closes it
    if (
      this.emojiPickerService.isMessageBoxMainPickerOpen$ ||
      this.emojiPickerService.isMessageBoxThreadPickerOpen$
    ) {
      this.emojiPickerService.closeMsgBoxEmojiPickerMain();
      this.emojiPickerService.closeMsgBoxEmojiPickerThread();
    }
    // checks if any picker of the chatbox is open
    if (this.isChatBoxEmojiPickerOpen) {
      // if the chatbox is already open for another message, closes it and opens it for a new message. If it's open for the message we clicked on, it closes
      if (messageId !== this.chatBoxEmojiPickerOpenFor) {
        this.emojiPickerService.openNewChatBoxEmojiPicker(messageId);
      } else {
        this.emojiPickerService.closeChatBoxEmojiPicker();
      }
    } else {
      // Opens a new emoji picker for the message we clicked on.
      this.emojiPickerService.openChatBoxEmojiPicker(messageId, threadMain ? threadMain : false);
    }
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

  addEmoji(
    messageIdOrThreadDocId: string,
    userId: string,
    emoji: string,
    isThreadMessage: boolean
  ): void {
    this.selectedEmoji = emoji;

    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = {
      reactions: [reaction],
    };

    // Determine whether to update a thread message or a regular message
    const updatePromise = isThreadMessage
      ? this.messagesService.updateThreadMessage(
          this.activeMessageId!,
          messageIdOrThreadDocId,
          userId,
          updateData
        )
      : this.messagesService.updateMessage(
          messageIdOrThreadDocId,
          userId,
          updateData
        );

    updatePromise
      .then(() => {
        console.log(
          `Reaction added to ${isThreadMessage ? `thread message` : 'message'}`
        );
      })
      .catch((error) => {
        console.error('Error adding reaction:', error);
      });

    this.emojiPickerService.closeChatBoxEmojiPicker();
    console.log('chatbox', messageIdOrThreadDocId);
    console.log('chatbox', userId);
    console.log('chatbox', updateData);
    this.cdRef.markForCheck();
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
    this.dialog.open(ProfileviewComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { ID: id },
    });
  }



  // Activer Code



  getMessageTimestep() {
    this.messages$.subscribe( messages => {
      messages.map((message) => {
        // console.log(message.message);
        const messageTime = message.timestamp ? new Date(message.timestamp) : 0;

        let messTime = this.gettingDate(messageTime)

        if (message.docId == 'dtak60DWUiZ9K5RZIqfi') {
          console.log('id is da', messTime);
          message.sameDay = true;
        } else {
          message.sameDay = false;
        }

        // console.log(message.sameDay);
      })
    })
  }

  gettingDate(date: any) {
    var month = date.getUTCMonth() + 1;
    var day = date.getUTCDate();
    var year = date.getUTCFullYear();
    var newDate = day + "." + month + "." + year;

    return newDate;
  }



  // Inactiver Code



  checkSameDay(A_timestamp: number, B_timestamp: number, messages: Message[]) {
    // console.warn(messages);

    let dateObjA = new Date(A_timestamp);
    let dateObjB = new Date(B_timestamp);

    var month = dateObjA.getUTCMonth() + 1;
    var day = dateObjA.getUTCDate();
    var year = dateObjA.getUTCFullYear();
    var newDateA = day + "." + month + "." + year;
    // console.log(newDateA)

    var month = dateObjB.getUTCMonth() + 1;
    var day = dateObjB.getUTCDate();
    var year = dateObjB.getUTCFullYear();
    var newDateB = day + "." + month + "." + year;
    // console.log(newDateB)

    // this.check(newDateA, newDateB, messages);
    
    // if (newDateA === newDateB) {
    //   // sollte true sein nur zu testzwecken auf false gesetzt; sameDay Variable in message model hinzufügen um sie bei jeder message abzurufen
    //   // console.warn("true")
    // } else  {
    //   // console.warn("false")
    //   if (currentDay === (A_timestamp || B_timestamp)) {
    //     console.log("current Day", currentDay, newDateA, newDateB)
    //     this.currentDay = true;
    //   } else {
    //     console.log("not current Day", currentDay, newDateA, newDateB)
    //     this.currentDay = false;
    //   }
    // }
  }

  check(newDateA:string, newDateB: string, messages:Message[]) {

    messages.slice().reverse().forEach((element) => {
      let dateC = new Date(element.timestamp);

      var month = dateC.getUTCMonth() + 1;
      var day = dateC.getUTCDate();
      var year = dateC.getUTCFullYear();
      var newDateC = day + "." + month + "." + year;

      // console.error(newDateA, newDateB, newDateC);
      console.log( newDateA === newDateB || newDateA === newDateC || newDateB === newDateC);
      if(newDateA === newDateB && newDateA === newDateC && newDateB === newDateC) {
        // if (element == messages[messages.length -1]) {
        //   element.sameDay = false;
        // }
        element.sameDay = true;
        console.log(element.docId, element.message, element.sameDay)
        // console.log('true');
      } else {
        element.sameDay = false;
        // console.log('false');
        console.warn(element.docId, element.message, element.sameDay)
      }
    })

    // for (let message = messages.length; message > 0; message--) {
    //   const element = messages[message];
    //   let dateC = new Date(element.timestamp);
    //   var month = dateC.getUTCMonth() + 1;
    //   var day = dateC.getUTCDate();
    //   var year = dateC.getUTCFullYear();
    //   var newDateC = day + "." + month + "." + year;
    //   console.error(newDateA, newDateB, newDateC);
    //   if(newDateA === newDateB && newDateA === newDateC && newDateB == newDateC) {
    //     element.sameDay = true;
    //     console.log('true');
    //   } else {
    //     element.sameDay = false;
    //     console.log('false');
    //   }
    // }
  }

  checkCurrentDay(value: any):string {
    if (!value) {
      return 'Ungültiges Datum';
    }

    let date: Date;

    if (value.seconds) {
      date = new Date(value.seconds * 1000);
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      return 'Ungültiges Datum';
    }

    const today = new Date();

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return `Heute`;
    }

    return '';
  }

  checkSameDayMessage(messages:any) {

  }
}
