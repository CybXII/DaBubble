import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../../shared/services/newmessage.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { Subscription } from 'rxjs';
import { Message, ThreadMessage } from '../../../models/message';
import { UserModel } from '../../../models/user';
import { MentionService } from '../../../shared/services/mention.service';
import { MentionComponent } from '../mention/mention.component';

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

  activeUserId: string | null = null;

  channelId: string | undefined;
  messageId: string | undefined;
  activeChannelName: string | null = null;

  @Input() builder!: string;
  messageContent: string = '';
  private subscriptions: Subscription = new Subscription();
  isMessageBoxMainPickerOpen: boolean = false;
  isMessageBoxThreadPickerOpen: boolean = false;
  isMessageBoxCreateMessagePickerOpen: boolean = false;
  mentionPicker:boolean = false;

  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private authService: AuthService,
    public emojiPickerService: EmojiPickerService,
    private sharedService: SharedService,
    public mentionService: MentionService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.isMessageBoxMainPickerOpen$.subscribe((open) => {
        this.isMessageBoxMainPickerOpen = open;
      })
    );
    this.subscriptions.add(
      this.emojiPickerService.isMessageBoxThreadPickerOpen$.subscribe((open) => {
        this.isMessageBoxThreadPickerOpen = open;
      })
    );
    this.subscriptions.add(
      this.emojiPickerService.isMessageBoxCreateMessagePickerOpen$.subscribe((open) => {
        this.isMessageBoxCreateMessagePickerOpen = open;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleEmojiPickerMain() {
    this.mentionPicker = false;
    console.log('🟢 toggleEmojiPickerMain() aufgerufen');
    this.emojiPickerService.closeAllEmojiPickers();
    setTimeout(() => {
      this.emojiPickerService.toggleMsgBoxEmojiPickerMain();
    }, 50);
  }
  
  toggleEmojiPickerThread() {
    this.mentionPicker = false;
    console.log('🟢 toggleEmojiPickerThread() aufgerufen');
    this.emojiPickerService.closeAllEmojiPickers();
    setTimeout(() => {
      this.emojiPickerService.toggleMsgBoxEmojiPickerThread();
    }, 50);
  }
  
  toggleEmojiPickerCreateMessage() {
    console.log('🟢 toggleEmojiPickerCreateMessage() aufgerufen');
    this.emojiPickerService.closeAllEmojiPickers();
    setTimeout(() => {
      this.emojiPickerService.toggleMsgBoxCreateMessageEmojiPicker();
    }, 50);
  }

  preventMsgBoxEmojiPickerClose(event: Event): void {
    event.stopPropagation();
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
    if (event.getModifierState('AltGraph') && event.key == "q") {
      this.mentionPicker = true;
    }
    if (event.key == "Backspace") {
      this.mentionPicker = false;
    }
  }

  async createNewMessage(): Promise<void> {
    if (!this.messageContent.trim()) {
      console.error('Nachricht darf nicht leer sein.');
      return;
    }
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
    const message: Omit<Message, 'threadMessages$'> = {
      channelId: this.channelId || '',
      createdBy: this.activeUserId || '',
      creatorName: user.name || '',
      creatorPhotoURL: user.photoURL || '',
      message: this.messageContent.trim(),
      timestamp: new Date(),
      members: [],
      reactions: [],
      sameDay: false
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

  async sendThreadMessage(): Promise<void> {
    if (!this.messageContent.trim()) {
      console.error('Nachricht darf nicht leer sein.');
      return;
    }
    let user: UserModel = (await this.authService.getUserById(
      this.activeUserId
    )) as unknown as UserModel;
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
  }

  jumpToAtAbove() {
    console.log('you clicked (at)');
    //this.searchString = "@";
    this.sharedService.setSearchString('@');
  }

    closeMentionPicker(event: Event) {
    this.mentionPicker = false;
  }



  toogleMentionPicker() {
    if (this.mentionPicker) {
      this.mentionPicker = false;
    } else {
      if (this.isMessageBoxMainPickerOpen || this.isMessageBoxThreadPickerOpen) {
        this.isMessageBoxMainPickerOpen = false;
        this.isMessageBoxThreadPickerOpen = false;
      }
      this.mentionPicker = true;
    }
  }

  preventMsgBoxMentionPickerClose(event: Event): void {
    event.stopPropagation();
  }

}
