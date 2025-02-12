import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  HostListener,
  Output,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { UserService } from '../../../shared/services/user.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { Message, Reaction } from '../../../models/message';
import { Subscription } from 'rxjs';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
import { RelativeDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../../../shared/profileview/profileview.component';
import { StateService } from '../../../shared/services/state.service';
import { FormsModule } from '@angular/forms';
import { SaveEditMessageService } from '../../../shared/services/save-edit-message.service';
import { EditmessageComponent } from '../editmessage/editmessage.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, RelativeDatePipe, FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss', '../chatbox/chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MessageComponent implements OnInit, OnDestroy {
  @Input() shouldRenderDivider!: boolean;
  @Input() message!: Message;
  @Input() activeUserId!: string;
  @Input() isCurrentUser!: boolean;
  @Input() activeMessageId!: string;
  @Output() userClicked = new EventEmitter<string>();
  private subscriptions: Subscription = new Subscription();
  isEmojiPickerOpen: WritableSignal<boolean> = signal(false);
  displayPickerBottom: boolean = false;
  previousTimestamp: number | null = null;
  

  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    private userService: UserService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private saveEditedMessage: SaveEditMessageService,
    private stateService: StateService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.chatBoxEmojiPickerForId$.subscribe((id) => {
        this.isEmojiPickerOpen.set(id === this.message.docId);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleEmojiPicker() {
    console.log('🟢 toggleEmojiPicker() für ThreadMessage aufgerufen');
    console.log(`📌 Vorheriger Zustand: isEmojiPickerOpen = ${this.isEmojiPickerOpen()}`);
    console.log(`📌 ThreadMessage ID: ${this.message.docId}`);
    console.log(`📌 Aktueller EmojiPickerForId: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
    this.emojiPickerService.displayParentMsg.next(false);
    // Falls der Picker für die gleiche Nachricht bereits offen ist → schließen
    if (this.emojiPickerService.chatBoxEmojiPickerForId.value === this.message.docId && !this.emojiPickerService.displayParentMsg.value) {
      console.log('🔒 Schließe Emoji Picker für:', this.message.docId);
      this.emojiPickerService.closeChatBoxEmojiPicker();
      return;
    }
  
    // Ansonsten alle Picker schließen und für die aktuelle Nachricht öffnen
    this.emojiPickerService.closeAllEmojiPickers();
    console.log(`🔍 Nach closeAllEmojiPickers: chatBoxEmojiPickerForId = ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
    if ( this.message.docId) {
      console.log('🔓 Öffne Emoji Picker für:', this.message.docId);
      this.emojiPickerService.openChatBoxEmojiPicker(this.message.docId);
      console.log(`✅ EmojiPickerForId nach Öffnen: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
    }
  }

  isEmojiPickerOpenForThisMessage(): boolean {
    const isOpen = this.emojiPickerService.chatBoxEmojiPickerForId.value === this.message.docId && this.isEmojiPickerOpen();
    console.log(`🟢 Prüfe ob Emoji-Picker für ThreadMessage offen ist: ${isOpen}`);
    console.log(`📌 ThreadMessage ID: ${this.message.docId}`);
    console.log(`📌 Aktueller EmojiPickerForId: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
    return isOpen;
  }


  getUserName(userId: string) {
    return this.userService.getuserName(userId);
  }

  getUserAvatar(userId: string) {
    return this.userService.getuserAvatar(userId);
  }

  checkIdIsUser(userId: string) {
    if (this.activeUserId !== userId) {
      this.userClicked.emit(userId);
    }
  }

  getLastUsedEmojis(index: number) {
    return this.emojiStorageService.getEmojis()[index];
  }

  addEmoji(messageId: string, userId: string, emoji: string, isThreadMessage: boolean): void {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };

    const updatePromise = isThreadMessage
      ? this.messagesService.updateThreadMessage(this.activeMessageId!, messageId, userId, updateData)
      : this.messagesService.updateMessage(messageId, userId, updateData);

    updatePromise.then(() => {
      console.log('✅ Emoji hinzugefügt:', emoji);
      this.emojiPickerService.closeChatBoxEmojiPicker();
    }).catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));

    this.emojiStorageService.saveEmoji(emoji);
  }

  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
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

  async onMessageSelect(messageId: string): Promise<void> {
    this.messagesService.setParentMessageId(messageId);
    this.activeMessageId = messageId;
    this.messagesService.setMessageId(messageId);
    this.stateService.setThreadchatState('in');
  }

  saveEdit(message: Partial<Message>, threadMessage: boolean, parentID: string) {
    this.saveEditedMessage.save(message, threadMessage, parentID, message.docId);
  }

  cancelEdit(message: Partial<Message>) {
    message.sameDay = false;
  }

  editMessage(message: Partial<Message>, deleteMessage: boolean, inlineEdit = false) {
    if (inlineEdit) {
      message.sameDay = true;
      return;
    } else {
      this.dialog.open(EditmessageComponent, {
        width: 'fit-content',
        maxWidth: '100vw',
        height: 'fit-content',
        data: { message, deleteMessage },
      });
    }
  }
}
