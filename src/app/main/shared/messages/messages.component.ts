import { Component, effect, EventEmitter, Input, Output, Signal, signal, WritableSignal } from '@angular/core';
import { Message, Reaction } from '../../../models/message';
import { UserService } from '../../../shared/services/user.service';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
import { RelativeDatePipe } from "../../../pipes/timestamp-to-date.pipe";
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../../../shared/profileview/profileview.component';
import { UserDialogService } from '../../../shared/services/user-dialog.service';
import { StateService } from '../../../shared/services/state.service';
import { FormsModule } from '@angular/forms';
import { SaveEditMessageService } from '../../../shared/services/save-edit-message.service';
import { EditmessageComponent } from '../editmessage/editmessage.component';
import { firstValueFrom, Subscription, take } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, ReactionsComponent, RelativeDatePipe, FormsModule, EmojiPickerComponent],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss', '../chatbox/chatbox.component.scss'],
})
export class MessageComponent {
  @Input() shouldRenderDivider!: boolean;
  @Input() message!: Message;
  @Input() activeUserId!: string;
  @Input() isCurrentUser!: boolean;
  @Input() activeMessageId!: string;
  subscriptions = new Subscription(); // ✅ RICHTIG
  isChatBoxEmojiPickerOpen = signal(false);
  chatBoxEmojiPickerOpenFor = signal<string | null>(null);

  previousTimestamp: number | null = null;
  displayPickerBottom: boolean = false;
  isMessageBoxMainPickerOpen = false;
  isMessageBoxThreadPickerOpen = false;
  isMessageBoxCreateMessagePickerOpen = false;

  constructor(
    private userService: UserService,
    public emojiPickerService: EmojiPickerService,
    private messagesService: MessagesService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private userDialog$: UserDialogService,
    private saveEditedMessage: SaveEditMessageService,
    private stateService: StateService,
    ) {}

  ngOnInit() {
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

  getUserName(userId: string) {
    return this.userService.getuserName(userId);
  }

  getUserAvatar(userId: string) {
    return this.userService.getuserAvatar(userId);
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
  
  preventEmojiPickerClose(event: Event) {
    event.stopPropagation();
  }

  /**
   * Öffnet oder schließt den Emoji-Picker für eine Thread-Nachricht
   */
  toggleEmojiPicker(messageId: string, isThreadMessage: boolean) {
    console.log('toggleEmojiPicker', messageId, isThreadMessage);
    this.displayPickerBottom = isThreadMessage;
    if (this.isChatBoxEmojiPickerOpen()) {
      if (messageId !== this.chatBoxEmojiPickerOpenFor()) {
        this.chatBoxEmojiPickerOpenFor.set(messageId); // ✅ Signal richtig aktualisieren
      } else {
        this.isChatBoxEmojiPickerOpen.set(false); // ✅ Picker schließen
      }
    } else {
      this.chatBoxEmojiPickerOpenFor.set(messageId); // ✅ Picker auf diese Nachricht setzen
      this.isChatBoxEmojiPickerOpen.set(true); // ✅ Picker öffnen
    }
  }
  

  addEmoji(messageIdOrThreadDocId: string, userId: string, emoji: string, isThreadMessage: boolean): void {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };
  
    const updatePromise = isThreadMessage
      ? this.messagesService.updateThreadMessage(this.activeMessageId!, messageIdOrThreadDocId, userId, updateData)
      : this.messagesService.updateMessage(messageIdOrThreadDocId, userId, updateData);
  
    updatePromise.then(() => {
      console.log('Emoji hinzugefügt:', emoji);
      this.emojiPickerService.closeChatBoxEmojiPicker(); // 🚀 Picker schließen
    }).catch(error => console.error('Fehler beim Hinzufügen der Reaktion:', error));
  
    this.emojiStorageService.saveEmoji(emoji);
  }

  getLastUsedEmojis(index: number) {
    const emojis = this.emojiStorageService.getEmojis();
    return emojis[index];
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

  saveEdit(message: Partial<Message>, threadMessage:boolean, parrentID: string) {
    this.saveEditedMessage.save(message, threadMessage, parrentID, message.docId)
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
