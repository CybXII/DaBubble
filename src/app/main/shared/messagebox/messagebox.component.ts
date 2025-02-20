import {ChangeDetectionStrategy,Component,Input,OnInit,OnDestroy,ViewChild,ElementRef,} from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../../shared/services/newmessage.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { Message, ThreadMessage } from '../../../models/message';
import { UserModel } from '../../../models/user';
import { MentionService } from '../../../shared/services/mention.service';
import { MentionComponent } from '../mention/mention.component';
import { Channel } from '../../../models/channel';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-messagebox',
  standalone: true,
  imports: [CommonModule, FormsModule, EmojiPickerComponent, MentionComponent],
  templateUrl: './messagebox.component.html',
  styleUrls: ['./messagebox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})

export class MessageboxComponent implements OnInit, OnDestroy {
  @ViewChild('mainMessageBox') mainMessageBox!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('threadMessageBox') threadMessageBox!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('emojiPickerContainer', { static: false }) emojiPickerContainer!: ElementRef;
  private subscriptions: Subscription = new Subscription();
  @Input() builder!: string;
  activeUserId: string | null = null;
  activeChannelName: string | null = null;
  channelId: string | undefined;
  messageId: string | undefined;
  sendToId: string = '';
  messageContent: string = '';
  members: any = [];
  isMessageBoxMainPickerOpen: boolean = false;
  isMessageBoxThreadPickerOpen: boolean = false;
  isMessageBoxCreateMessagePickerOpen: boolean = false;
  /**
   * Constructor for the MessageboxComponent.
   * @param channelsService - Service for handling channel operations.
   * @param messagesService - Service for handling message operations.
   * @param authService - Service for managing authentication operations.
   * @param emojiPickerService - Service for handling emoji picker functionalities.
   * @param sharedService - Service for shared data and operations.
   * @param mentionService - Service for handling mention-related operations.
   * @param userService - Service for user-related operations.
   */
  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private authService: AuthService,
    public emojiPickerService: EmojiPickerService,
    public sharedService: SharedService,
    public mentionService: MentionService,
    private userService: UserService,
  ) {}


  /**
   * Initializes the MessageboxComponent by setting the active user ID and subscribing to the appropriate channels or threads based on the builder type.
   */
  ngOnInit(): void {
    this.activeUserId = this.authService.userId();
    if (this.builder === 'mainchat') 
      this.addChannelSubscription();
    else if (this.builder === 'threadchat') 
      this.addThreadSubscriptions();
    this.addEmojiSubscriptions();
  }


  /**
   * Subscribes to the current channel observable and sets the active channel ID and name when a new channel is received.
   */
  addChannelSubscription() {
    const channelSubscription =
    this.channelsService.currentChannel$.subscribe((channel) => {
      if (channel) {
        this.channelId = channel.id;
        this.activeChannelName = channel.name;
        if (this.mainMessageBox) 
          setTimeout(() => this.mainMessageBox.nativeElement.focus(), 100);
      }
    });
  this.subscriptions.add(channelSubscription);
  }


  /**
   * Subscribes to the current message ID observable and sets the active message ID when a new message ID is received.
   */
  addThreadSubscriptions() {
    const threadSubscription = this.messagesService.messageId$.subscribe(
      (messageId) => {
        if (messageId) {
          this.messageId = messageId;
          if (this.threadMessageBox) 
            setTimeout(() => this.threadMessageBox.nativeElement.focus(), 100);
        }
      }
    );
    this.subscriptions.add(threadSubscription);
  }


  /**
   * Subscribes to the emoji picker observables to set the state of the pickers in the message box component.
   */
  addEmojiSubscriptions() {
    this.subscriptions.add(this.emojiPickerService.isMessageBoxMainPickerOpen$.subscribe((open) => {
        this.isMessageBoxMainPickerOpen = open;})
    );
    this.subscriptions.add(this.emojiPickerService.isMessageBoxThreadPickerOpen$.subscribe((open) => {
        this.isMessageBoxThreadPickerOpen = open;})
    );
    this.subscriptions.add(this.emojiPickerService.isMessageBoxCreateMessagePickerOpen$.subscribe((open) => {
        this.isMessageBoxCreateMessagePickerOpen = open;})
    );
  }


  /**
   * Lifecycle hook that is called when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Toggles the emoji picker for the main message box.
   */
  toggleEmojiPickerMain() {
    this.mentionService.status = false;
    this.emojiPickerService.closeAllEmojiPickers();
    setTimeout(() => {this.emojiPickerService.toggleMsgBoxEmojiPickerMain()}, 50);
  }


  /**
   * Toggles the emoji picker for the thread message box.
   */
  toggleEmojiPickerThread() {
    this.mentionService.status = false;
    this.emojiPickerService.closeAllEmojiPickers();
    setTimeout(() => {this.emojiPickerService.toggleMsgBoxEmojiPickerThread()}, 50);
  }


  /**
   * Toggles the emoji picker for the create message box.
   */
  toggleEmojiPickerCreateMessage() {
    this.emojiPickerService.closeAllEmojiPickers();
    setTimeout(() => {this.emojiPickerService.toggleMsgBoxCreateMessageEmojiPicker()}, 50);
  }


  /**
   * Prevents the emoji picker from closing when a click event occurs.
   * @param event The click event to prevent from propagating.
   */
  preventMsgBoxEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }


  /**
   * Adds an emoji to the message content in the message box.
   * @param emoji The emoji to add to the message content.
   */
  addEmoji(emoji: string) {
    this.messageContent += emoji;
  }


  /**
   * Checks the key status of the given event and performs the corresponding action.
   * @param event The event to check the key status from.
   * @param chat The type of chat to send the message to.
   */
  checkKeyStatus(event: KeyboardEvent, chat: string): void {
    this.handleSendMessageOnKeyPress(event, chat)
    if (event.getModifierState('AltGraph') && event.key == "q") 
      this.mentionService.status = true;
      this.mentionService.isOpendWithKeys = true
    if (event.key == "Backspace") 
      this.mentionService.status = false;
      this.mentionService.channelSelection = false;
    if (event.key == "#") {
      if (chat === 'createmessage') {
        this.sharedService.jumpToAtAbove('#')
      }
      this.mentionService.channelSelection = true;
    }
  }

  /**
  * Handles the sending of messages based on key press events.
  * @param {KeyboardEvent} event - The keyboard event triggered by key presses.
  * @param {string} chat - The type of chat (mainchat, threadchat, createmessage).
  */
  handleSendMessageOnKeyPress(event: KeyboardEvent, chat: string) {
    if (event.shiftKey && event.key == 'Enter') {
      event.preventDefault();
    } else if (event.key == 'Enter') {
      if (chat === 'mainchat')
        this.sendMessage();
      else if (chat === 'threadchat') 
        this.sendThreadMessage();
      else if (chat === 'createmessage') 
        this.createNewMessage();
    }
  }


  /**
   * Closes the mention picker by setting the mention service status to false.
   * @param event The event that triggers the mention picker closure.
   */
  closeMentionPicker(event: Event) {
    this.mentionService.status = false;
  }


  /**
   * Toggles the mention picker.
   */
  toogleMentionPicker() {
    if (this.mentionService.status) {
      this.mentionService.status = false;
    } else {
      if (this.isMessageBoxMainPickerOpen || this.isMessageBoxThreadPickerOpen) {
        this.isMessageBoxMainPickerOpen = false;
        this.isMessageBoxThreadPickerOpen = false;
      }
      this.mentionService.status = true;
      this.mentionService.channelSelection = false;
    }
  }


  /**
   * Prevents the propagation of the given event to prevent the mention picker from closing
   * @param event The event to prevent from propagating.
   */
  preventMsgBoxMentionPickerClose(event: Event): void {
    event.stopPropagation();
  }


  /**
   * Creates a new private channel between the active user and another specified user.
   * @param sendToUserId - The ID of the user to create the channel with.
   */
  async createNewChannel(sendToUserId: string) {
    let user1 = await firstValueFrom(this.userService.getuserName(this.activeUserId ?? ''));
    let user2 = await firstValueFrom(this.userService.getuserName(sendToUserId ?? ''));
    const newChannel: Channel = {
      name: `zwischen ${user1} und ${user2}`,
      description: '',
      isPrivate: true,
      createdBy: this.activeUserId ?? '',
      members: [this.activeUserId ?? '', sendToUserId ?? ''],
    };
    await this.channelsService.createChannel(newChannel);
  }


  /**
   * Determines the target ID for sending a message based on the target type.
   * @param sendToTarget - The type of target, either 'toUser' or 'toChannel'.
   * @param sendToUserId - The ID of the user to send the message to.
   * @param sendToChannelId - The ID of the channel to send the message to.
   */
  async checkMessageTarget(sendToTarget: string, sendToUserId: string, sendToChannelId: string) {
    if (sendToTarget == 'toUser') {
      this.sendToId = sendToUserId;
      const existingChannels = await this.channelsService.getPrivateChannelByMembers([this.activeUserId ?? '', sendToUserId]);
      if (existingChannels.length > 0) 
        this.sendToId = existingChannels[0].id ?? '';
      else
        this.createNewChannel(sendToUserId);
    } else if (sendToTarget == 'toChannel') 
      this.sendToId = sendToChannelId;
  }


  /**
   * Generates a Message object based on the active user and the message content.
   * @returns {Promise<Message>} - A promise that resolves with the generated Message object.
   */
  async generateNewMessageObject(): Promise<Message> {
    let user: UserModel = (await this.userService.getUserForMessageById(this.activeUserId)) as UserModel;
    const message: Omit<Message, 'threadMessages$'> = {
      channelId: this.sendToId || '',
      createdBy: this.activeUserId || '',
      creatorName: user.name || '',
      creatorPhotoURL: user.photoURL || '',
      message: this.messageContent.trim(),
      timestamp: new Date(),
      members: this.members,
      reactions: [],
      sameDay: false,
    };
    return message;
  }


  /**
   * Sends a message to the currently selected channel.
   * @returns {Promise<void>} - A promise that resolves when the message has been sent.
   */
  async sendMessage(): Promise<void> {
    if (!this.messageContent.trim()) 
      return console.error('Nachricht darf nicht leer sein.');
    let user: UserModel = (await this.userService.getUserForMessageById(this.activeUserId)) as UserModel;
    const message: Omit<Message, 'threadMessages$'> = this.userService.generateMessageObject(user, this.channelId, this.activeUserId, this.messageContent);
    if (this.channelId) {
      try {
        await this.messagesService.addMessage(message);
        this.messageContent = '';
      } catch (error) {console.error('Fehler beim Senden der Nachricht:', error);}
    } else 
      console.error('Keine gültige Channel-ID verfügbar.');
  }


  /**
   * Sends a thread message using the currently selected parent message ID.
   * @returns {Promise<void>} - A promise that resolves when the message has been sent.
   */
  async sendThreadMessage(): Promise<void> {
    if (!this.messageContent.trim()) 
      return console.error('Nachricht darf nicht leer sein.');
    const threadMessage: ThreadMessage = await this.userService.generateThreadMessageObject( this.activeUserId, this.messageContent);
    this.sendThreadMessageWithService(threadMessage)
  }


  /**
   * Sends a thread message using the currently selected parent message ID.
   * @param {ThreadMessage} threadMessage - The thread message object to be sent.
   */
  sendThreadMessageWithService(threadMessage: ThreadMessage) {
    if (this.messageId) {
      this.sharedService.addThreadMessage(this.messageId, threadMessage)
        .then(() => {this.messageContent = '';})
        .catch((error) => {console.error('Fehler beim Senden der Thread-Nachricht:', error);});
    } else 
      console.error('Keine gültige Message-ID für den Thread verfügbar.');
  }


  /**
   * Checks which channel the message should be sent to based on the target string.
   * If the target is a user, it will check if a private channel with that user already exists.
   * If the channel does not exist, it will create a new channel with the user.
   * If the target is a channel, it will set the `sendToId` to the channel ID.
   */
  async checkChannelWhereToSendMessage() {
    let sendToUserId = this.sharedService.getUserIdString();
    let sendToChannelId = this.sharedService.getChannelIdString();
    let sendToTarget = this.sharedService.getTargetString();
    if (sendToTarget == 'toUser') {
      this.sendToId = sendToUserId;
      let existingChannels = await this.channelsService.getPrivateChannelByMembers([this.activeUserId ?? '', sendToUserId]);
      if (existingChannels.length > 0) 
        this.sendToId = existingChannels[0].id ?? '';
      else 
        this.createNewChannel(sendToUserId);
        existingChannels = await this.channelsService.getPrivateChannelByMembers([this.activeUserId ?? '', sendToUserId]);
        if (existingChannels.length > 0) 
          this.sendToId = existingChannels[0].id ?? '';
        else 
          console.error('Kein privater Kanal gefunden.');
      } else if (sendToTarget == 'toChannel') 
      this.sendToId = sendToChannelId;
  }


  /**
   * Creates a new message by calling checkChannelWhereToSendMessage and sendNewMessage.
   * If the message is sent successfully, the input field is cleared and the channel is selected.
   * @returns {Promise<void>} - A promise that resolves when the message has been sent.
   */
  async createNewMessage(): Promise<void> {
    if (!this.messageContent.trim()) 
      return console.error('Nachricht darf nicht leer sein.');
    await this.checkChannelWhereToSendMessage();
    await this. sendNewMessage();
    this.sharedService.updateVariable('');
    this.channelsService.selectChannel(this.sendToId);
  }


  /**
   * Sends a new message using the currently entered message content and the ID of the channel or user to send the message to.
   * The message is created using the currently logged-in user's data and the timestamp of the sending time.
   * If the message is sent successfully, the input field is cleared.
   */
  async sendNewMessage(){
    let user: UserModel = (await this.userService.getUserForMessageById(this.activeUserId)) as UserModel;
    if (this.activeUserId){
      const message: Omit<Message, 'threadMessages$'> = {
        channelId: this.sendToId || '',
        createdBy: this.activeUserId || '',
        creatorName: user.name || '',
        creatorPhotoURL: user.photoURL || '',
        message: this.messageContent.trim(),
        timestamp: new Date(),
        members: [this.activeUserId,this.sendToId],
        reactions: [],
        sameDay: false,
      };  
      if (1 == 1) {
        try {
          await this.messagesService.addMessage(message);
          this.messageContent = '';
        } catch (error) {console.error('Fehler beim Senden der Nachricht:', error)}
      } else 
        console.error('Keine gültige Channel-ID verfügbar.');
    }
  }
}