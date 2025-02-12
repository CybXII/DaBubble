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
  ChangeDetectorRef,
} from '@angular/core';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Message, ThreadMessage } from '../../../models/message';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../../../shared/profileview/profileview.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { UserDialogService } from '../../../shared/services/user-dialog.service';
import { UserService } from '../../../shared/services/user.service';
import { FormsModule } from '@angular/forms';
import { ParentMessageComponent } from '../parentmessage/parent-message.component';
import { MessageComponent } from '../messages/messages.component';
import { ThreadMessagesComponent } from '../threadmessages/threadmessages.component';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ParentMessageComponent, MessageComponent, ThreadMessagesComponent],
  styleUrls: ['./chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatboxComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() builder!: string;
  @Output() threadChatToggle = new EventEmitter<void>();
  private messages = signal<Message[]>([]);
  private destroy$ = new Subject<void>();
  private currentChannel$: Observable<Channel | null> = null!;
  public messages$: Observable<Message[]> = null!;
  public threadMessages$: Observable<ThreadMessage[]> = null!;
  public loadingMessages: WritableSignal<boolean> = signal(true);
  public parentMessage: Partial<Message> | null = null;
  public activeUserId: string | null = null;
  public activeMessageId: string | null = null;
  public loadingAvatars = true;
  public isEmptyMessage: boolean = false;
  public self: boolean = false;
  public private: boolean = false;
  public channelName: string = '';
  public channelCreatorName: string = '';
  public timestep: any;
  public user: { name: string, photoUrl: string, id: string, } = { name: '', photoUrl: '', id: '', };

  /**
   * Constructs a new instance of the ChatboxComponent.
   *
   * @param messagesService - The service providing the messages.
   * @param authService - The service providing the currently logged in user.
   * @param userDialog$ - The service allowing to open the user dialog.
   * @param cdRef - The service providing the ChangeDetectorRef.
   * @param userService - The service providing the user data.
   * @param channelsService - The service providing the current channel data.
   * @param dialog - The service allowing to open the thread chat dialog.
   * @param emojiPickerService - The service providing the emoji picker.
   */
  constructor(
    private messagesService: MessagesService,
    private authService: AuthService,
    private userDialog$: UserDialogService,
    private cdRef: ChangeDetectorRef,
    private userService: UserService,
    public channelsService: ChannelsService,
    public dialog: MatDialog,
    public emojiPickerService: EmojiPickerService,
  ) {
    this.initializeObservables();
    this.activeUserId = this.authService.userId();
  }


  /**
   * Initializes the observables for the current channel, messages, and thread messages.
   */
  private initializeObservables(): void {
    this.currentChannel$ = this.channelsService.currentChannel$;
    this.messages$ = this.getFormattedMessages();
    this.threadMessages$ = this.getFilteredThreadMessages();
  }


  /**
   * Retrieves the formatted list of messages.
   * Each message includes a timestamp and thread messages.
   * 
   * @returns {Observable<Message[]>} - An observable containing the formatted messages.
   */
  private getFormattedMessages(): Observable<Message[]> {
    return this.messagesService.messages$.pipe(
      map(messages =>
        messages.map(message => ({
          ...message,
          timestamp: message['timestamp'] ? new Date(message['timestamp']) : new Date(),
          threadMessages$: message.threadMessages$
        }))
      )
    );
  }


  /**
   * Filters the thread messages based on the currently selected message ID.
   * 
   * @returns {Observable<ThreadMessage[]>} - An observable containing the filtered thread messages.
   */
  private getFilteredThreadMessages(): Observable<ThreadMessage[]> {
    return combineLatest([
      this.messagesService.messageId$.pipe(startWith(null)),
      this.messagesService.threadMessages$.pipe(map(threads => threads || [])),
    ]).pipe(
      map(([messageId, threads]) => (!messageId ? [] : threads.filter(thread => thread.messageId === messageId)))
    );
  }


  /**
   * Initializes the component by setting up the default channel, subscribing to messages and thread messages, and handling the current channel.
   */
  ngOnInit(): void {
    this.initializeChannel();
    this.messagesService.messageId$.subscribe(messageId => {
      if (messageId)
        this.setParentMessage();
    });
    this.messagesService.messages$.subscribe(messages => {
      this.updateMessagesWithThreads(messages);
    });
    this.setParentMessage();
    this.threadMessages$.subscribe(() => { });
    this.handleCurrentChannel();
  }


  /**
   * Initializes the default channel and subscribes to channel changes.
   */
  private initializeChannel(): void {
    if (window.innerWidth > 900)
      this.channelsService.setDefaultChannel();
    this.channelsService.currentChannel$.pipe(
      filter(channel => !!channel),
      switchMap(channel =>
        this.userService.getuserName(channel?.createdBy ?? '').pipe(
          map(userName => ({ channel, userName })),
          tap(({ channel }) => this.formatTimestamp(channel?.createdAt))
        )
      )
    ).subscribe(({ channel, userName }) => {
      if (channel) {
        this.messagesService.loadMessagesForChannel(channel.id);
      }
      this.channelCreatorName = userName;
    });
  }


  /**
   * Formats the channel creation timestamp and sets the `timestep` variable.
   * @param {string | undefined} createdAt - The timestamp of the channel creation.
   */
  private formatTimestamp(createdAt?: Date | undefined): void {
    if (!createdAt) {
      console.error("Can't set Date, invalid timestamp");
      return;
    }
    const x = new Date(createdAt);
    const day = x.getDate();
    const month = x.getMonth() + 1;
    const year = x.getFullYear();
    const newDate = `${day}.${month}.${year}`;
    this.timestep = (day === new Date().getDate() &&
      month === new Date().getMonth() + 1 &&
      year === new Date().getFullYear()) ? "Heute" : newDate;
  }


  /**
   * Updates messages and loads thread messages for each message.
   * @param {Message[]} messages - The list of messages to process.
   */
  private updateMessagesWithThreads(messages: Message[]): void {
    this.messages.set(messages.map(msg => ({ ...msg, threadMessages: [] })));
    messages.forEach(msg => {
      if (msg.docId) {
        this.messagesService.getThreadMessagesForMessage(msg.docId).subscribe(threads => {
          const updatedMessages = this.messages().map(m =>
            m.docId === msg.docId ? { ...m, threadMessages: threads } : m
          );
          this.messages.set(updatedMessages);
        });
      }
    });
  }


  /**
   * Handles the current channel subscription and sets channel-specific properties.
   */
  private handleCurrentChannel(): void {
    this.currentChannel$.subscribe(channel => {
      this.channelName = channel?.name ?? "";
      this.private = !!channel?.isPrivate;
      if (this.private)
        this.handlePrivateChannel(channel);
      else
        this.private = false;
    });
  }


  /**
   * Handles private channel logic, including user retrieval.
   * @param {Channel | null} channel - The currently active channel.
   */
  private handlePrivateChannel(channel: Channel | null): void {
    if (!channel) return;
    if (channel.members.length === 1 && channel.members[0] === this.activeUserId)
      this.getOwnData();
    else {
      this.self = false;
      this.getChannelUserData(channel);
    }
    this.checkMessageIsEmpty();
  }


  /**
   * Retrieves user data for a private channel.
   * @param {Channel} channel - The private channel object.
   */
  private getChannelUserData(channel: Channel): void {
    let userId = channel.members.find(id => id !== this.activeUserId);
    if (!userId) return;
    this.userService.getUserById(userId).pipe(map(user => user)).subscribe(user => {
      this.user = {
        name: user.name ?? '',
        photoUrl: user.photoURL ?? '',
        id: user.userId ?? ''
      };
    });
  }


  /**
   * Lifecycle hook that is called after the component view has been initialized.
   * Sets up the subscription to the parent message ID observable and initializes the chatbox observer.
   */
  ngAfterViewInit(): void {
    this.subscribeToParentMessageId();
    this.initializeChatboxObserver();
  }


  /**
   * Subscribes to the parent message ID changes in thread chat mode.
   * Updates the active message ID when a new parent message is detected.
   */
  private subscribeToParentMessageId(): void {
    if (this.builder !== 'threadchat') return;
    this.messagesService.parentMessageId$.subscribe((messageId) => {
      if (messageId) {
        this.setParentMessage();
        this.activeMessageId = messageId;
      }
    });
  }


  /**
   * Initializes an observer to detect chatbox mutations and trigger auto-scrolling.
   */
  private initializeChatboxObserver(): void {
    const chatboxSelector = this.builder === 'mainchat' ? '.mainchat__chatbox' : '.threadchat__chatbox';
    const chatbox = document.querySelector(chatboxSelector);
    if (!chatbox) return;
    const observer = new MutationObserver(() => this.scrollToBottom(chatboxSelector));
    observer.observe(chatbox, { childList: true, subtree: true });
    this.checkMessageIsEmpty();
  }


  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Notifies all subscribers of the destroy subject and completes the subject.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  /**
   * Scrolls the chatbox to the bottom after a 500ms delay to allow the component to render all messages.
   * @param selector - The CSS selector of the chatbox element.
   */
  scrollToBottom(selector: string): void {
    setTimeout(() => {
      const chatbox = document.querySelector(selector) as HTMLElement;
      if (chatbox) {
        chatbox.scrollTop = chatbox.scrollHeight;
      }
    }, 500);
  }


  /**
   * Subscribes to changes in the parent message ID and updates the parent message object.
   * Uses a combination of the parent message ID and the list of messages to find and set the current parent message.
   * Marks the component for change detection to update the view.
   */
  setParentMessage(): void {
    combineLatest([this.messagesService.parentMessageId$, this.messagesService.messages$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([parentMessageId, messages]) => {
        this.parentMessage = messages.find(msg => msg.docId === parentMessageId) || null;
        this.cdRef.markForCheck();
      });
  }



/*************  ✨ Codeium Command ⭐  *************/
  /**
   * Handles a user click in the chatbox.
   * Opens the user profile dialog for the given user ID if the ID does not match the active user ID.
   * Otherwise, opens the user profile dialog for the active user ID and sets the `exitActiv` property to false.
   * @param {string | undefined} userId - The user ID of the user to open the profile dialog for.
   */
/******  2f18b8dc-633e-489e-80fd-f3a880f259df  *******/  handleUserClick(userId: string): void {
    if (userId) {
      if (this.activeUserId !== userId) {
        this.openDialogUser(userId);
      } else {
        this.userDialog$.openProfile();
        this.userDialog$.exitActiv = false;
      }
    }
  }


  /**
   * Opens the user profile dialog with the given user ID.
   * @param {string | undefined} id - The ID of the user to open the profile dialog for.
   */
  openDialogUser(id: string | undefined): void {
    this.dialog.open(ProfileviewComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { ID: id },
    });
  }


  /**
   * Checks if the message list is empty and updates the isEmptyMessage flag accordingly.
   * Subscribes to the messages$ observable to monitor changes in the message list.
   * Sets isEmptyMessage to true if there are no messages, otherwise false.
   */
  checkMessageIsEmpty() {
    this.messages$.subscribe(message => {
      if (message.length === 0) {
        this.isEmptyMessage = true;
      } else {
        this.isEmptyMessage = false;
      }
    })
  }


  /**
   * Subscribes to the current user's data and sets the user object to the received data.
   * If there is no active user ID, sets the user object to an empty object.
   * Sets the self flag to true to indicate that the user object is the current user.
   */
  getOwnData() {
    let id = this.activeUserId ? this.activeUserId : "";
    let userObj = this.userService.getUserById(id).pipe(map((user) => user));
    userObj.subscribe(user => {
      const data = { name: user.name ? user.name : '', photoUrl: user.photoURL ? user.photoURL : '', id: user.userId ? user.userId : '', }
      this.user = data;
    })
    this.self = true;
  }
}