import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { Subscription } from 'rxjs';
import { Message, ThreadMessage } from '../../../models/message';
import { AuthService } from '../../../shared/services/auth.service';
import { UserModel } from '../../../models/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../../shared/services/newmessage.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { Channel } from '../../../models/channel';

@Component({
  selector: 'app-messagebox',
  standalone: true,
  imports: [CommonModule, FormsModule, EmojiPickerComponent],
  templateUrl: './messagebox.component.html',
  styleUrls: ['./messagebox.component.scss'], // Korrektur: "styleUrl" zu "styleUrls"
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MessageboxComponent implements OnInit, OnDestroy {
  @Input() builder!: string;
  channelId: string | undefined;
  messageId: string | undefined;
  activeChannelName: string | null = null;
  messageContent: string = '';
  private subscriptions: Subscription = new Subscription();
  activeUserId: string | null = null;
  isMessageBoxMainPickerOpen: boolean = false;
  isMessageBoxThreadPickerOpen: boolean = false;
  isMessageBoxCreateMessagePickerOpen: boolean = false;
  members: any = [];

  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private authService: AuthService,
    public emojiPickerService: EmojiPickerService,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.activeUserId = this.authService.userId();
    if (this.builder === 'mainchat') {
      // Beobachtet den aktuellen Channel
      const channelSubscription =
        this.channelsService.currentChannel$.subscribe((channel) => {
          if (channel) {
            this.channelId = channel.id;
            this.activeChannelName = channel.name;
            console.log('Aktueller Channel-Name:', this.activeChannelName);
          } else {
            console.log('Kein aktiver Channel ausgewählt.');
          }
        });
      this.subscriptions.add(channelSubscription);
    } else if (this.builder === 'threadchat') {
      // Beobachtet die Message-ID für den Threadchat
      const threadSubscription = this.messagesService.messageId$.subscribe(
        (messageId) => {
          if (messageId) {
            this.messageId = messageId;
            console.log('Threadchat aktiv, Message-ID:', messageId);
          } else {
            // console.log('Keine gültige Message-ID für den Threadchat gefunden.');
          }
        }
      );
      this.subscriptions.add(threadSubscription);
    }

    const emojiPickerMainSubscription =
      this.emojiPickerService.isMessageBoxMainPickerOpen$.subscribe((open) => {
        this.isMessageBoxMainPickerOpen = open;
      });
    const emojiPickerThreadSubscription =
      this.emojiPickerService.isMessageBoxThreadPickerOpen$.subscribe(
        (open) => {
          this.isMessageBoxThreadPickerOpen = open;
        }
      );
    const emojiPickerCreateMessageSubscription =
      this.emojiPickerService.isMessageBoxCreateMessagePickerOpen$.subscribe(
        (open) => {
          this.isMessageBoxCreateMessagePickerOpen = open;
        }
      );
    this.subscriptions.add(emojiPickerMainSubscription);
    this.subscriptions.add(emojiPickerThreadSubscription);
    this.subscriptions.add(emojiPickerCreateMessageSubscription);
  }

  ngOnDestroy(): void {
    // Alle Subscriptions aufräumen
    this.subscriptions.unsubscribe();
  }

  jumpToAtAbove() {
    console.log('you clicked (at)');
    //this.searchString = "@";
    this.sharedService.setSearchString('@');
  }

  // von christoph
  sendToId: string = '';


  async createNewMessage(): Promise<void> {
    if (!this.messageContent.trim()) {
      console.error('Nachricht darf nicht leer sein.');
      return;
    }

    // searchText auswerten
    let sendToUserId = this.sharedService.getUserIdString();
    let sendToChannelId = this.sharedService.getChannelIdString();
    let sendToTarget = this.sharedService.getTargetString();

    console.log('dahin 1:', sendToTarget);

    if (sendToTarget == 'toUser') {

      this.sendToId = sendToUserId;

      // unklar ob das wichtig ist ...
      //this.members = [sendToUserId, this.activeUserId];
      //console.log('members:', this.members);

      // finde channel wo nur die zwei drin sind

      // Prüfe, ob ein privater Channel existiert
      const existingChannels = await this.channelsService.getPrivateChannelByMembers([this.activeUserId ?? '', sendToUserId]);
      console.log("test wegen privater channel: ", existingChannels);

      if (existingChannels.length > 0) {
        this.sendToId = existingChannels[0].id ?? '';
      } else {
        // Erstelle einen neuen privaten Channel
        const newChannel: Channel = {
          name: 'Privater Channel',
          description: '',
          isPrivate: true,
          createdBy: this.activeUserId ?? '',
          members: [this.activeUserId ?? '', sendToUserId ?? ''],
        };
        await this.channelsService.createChannel(newChannel);
      }
    } else if (sendToTarget == 'toChannel') {
      this.sendToId = sendToChannelId;
      //this.members = [];
    }

    console.log('dahin:', this.sendToId);

    // senden
    let user: UserModel = (await this.authService.getUserById(
      this.activeUserId
    )) as UserModel;

    // Erstelle ein Message-Objekt
    const message: Message = {
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

    // Sende die Nachricht über den Service
    if (1 == 1) {
      try {
        await this.messagesService.addMessage(message);
        console.log('Nachricht erfolgreich gesendet:', message);
        this.messageContent = '';
      } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
      }
    } else {
      console.error('Keine gültige Channel-ID verfügbar.');
    }

    // ansicht: direkt da hin wechseln!
    await this.channelsService.selectChannel(this.sendToId);

  }

  async sendMessage(): Promise<void> {
    if (!this.messageContent.trim()) {
      console.error('Nachricht darf nicht leer sein.');
      return;
    }

    let user: UserModel = (await this.authService.getUserById(
      this.activeUserId
    )) as UserModel;

    // Erstelle ein Message-Objekt
    const message: Message = {
      channelId: this.channelId || '',
      createdBy: this.activeUserId || '',
      creatorName: user.name || '',
      creatorPhotoURL: user.photoURL || '',
      message: this.messageContent.trim(),
      timestamp: new Date(),
      members: [],
      reactions: [],
      sameDay: false,
    };

    // Sende die Nachricht über den Service
    if (this.channelId) {
      try {
        await this.messagesService.addMessage(message);
        console.log('Nachricht erfolgreich gesendet:', message);
        this.messageContent = '';
      } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
      }
    } else {
      console.error('Keine gültige Channel-ID verfügbar.');
    }
  }

  /**
   * Sende eine neue Thread-Nachricht.
   */
  async sendThreadMessage(): Promise<void> {
    if (!this.messageContent.trim()) {
      console.error('Nachricht darf nicht leer sein.');
      return;
    }
    let user: UserModel = (await this.authService.getUserById(
      this.activeUserId
    )) as unknown as UserModel;
    console.log('User:', user);
    // Erstelle ein ThreadMessage-Objekt
    const threadMessage: ThreadMessage = {
      createdBy: this.activeUserId || '',
      creatorName: user.name || '',
      creatorPhotoURL: user.photoURL || '',
      message: this.messageContent.trim(),
      timestamp: new Date(),
      reactions: [],
      isThreadMessage: true,
      sameDay: false,
    };

    // Sende die Nachricht über den Service
    if (this.messageId) {
      this.messagesService
        .addThreadMessage(this.messageId, threadMessage)
        .then(() => {
          console.log('Thread-Nachricht erfolgreich gesendet:', threadMessage);
          this.messageContent = '';
        })
        .catch((error) => {
          console.error('Fehler beim Senden der Thread-Nachricht:', error);
        });
    } else {
      console.error('Keine gültige Message-ID für den Thread verfügbar.');
    }
  }

  toggleEmojiPickerMain() {
    if (
      !this.isMessageBoxMainPickerOpen &&
      !this.isMessageBoxThreadPickerOpen
    ) {
      this.emojiPickerService.closeChatBoxEmojiPicker();
      this.emojiPickerService.openMsgBoxEmojiPickerMain();
    } else if (this.isMessageBoxMainPickerOpen) {
      this.emojiPickerService.closeMsgBoxEmojiPickerMain();
    } else if (this.isMessageBoxThreadPickerOpen) {
      this.emojiPickerService.closeMsgBoxEmojiPickerThread();
      this.emojiPickerService.closeChatBoxEmojiPicker();
      this.emojiPickerService.openMsgBoxEmojiPickerMain();
    }
  }

  toggleEmojiPickerThread() {
    if (
      !this.isMessageBoxMainPickerOpen &&
      !this.isMessageBoxThreadPickerOpen
    ) {
      this.emojiPickerService.closeChatBoxEmojiPicker();
      this.emojiPickerService.openMsgBoxEmojiPickerThread();
    } else if (this.isMessageBoxThreadPickerOpen) {
      this.emojiPickerService.closeMsgBoxEmojiPickerThread();
    } else if (this.isMessageBoxMainPickerOpen) {
      this.emojiPickerService.closeMsgBoxEmojiPickerMain();
      this.emojiPickerService.closeChatBoxEmojiPicker();
      this.emojiPickerService.openMsgBoxEmojiPickerThread();
    }
  }

  toggleEmojiPickerCreateMessage() {
    if (this.isMessageBoxCreateMessagePickerOpen) {
      this.emojiPickerService.closeMsgBoxCreateMessageEmojiPicker();
    } else {
      this.emojiPickerService.openMsgBoxCreateMessageEmojiPicker();
    }
  }

  preventMsgBoxEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  closeEmojiPicker(event: Event): void {
    if (this.isMessageBoxMainPickerOpen) {
      this.emojiPickerService.closeMsgBoxEmojiPickerMain();
    } else if (this.isMessageBoxThreadPickerOpen) {
      this.emojiPickerService.closeMsgBoxEmojiPickerThread();
    }
  }

  addEmoji(emoji: string) {
    this.messageContent += emoji;
  }

  checkKeyStatus(event: KeyboardEvent, chat: string): void {
    if (event.shiftKey && event.keyCode == 13) {
      event.preventDefault();
    } else if (event.keyCode == 13) {
      if (chat === 'mainchat') {
        this.sendMessage();
      } else if (chat === 'threadchat') {
        this.sendThreadMessage();
      }
    }
  }
}
