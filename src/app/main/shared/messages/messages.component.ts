import { Component, EventEmitter, Input, Output, Signal, signal } from '@angular/core';
import { Message } from '../../../models/message';
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

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, RelativeDatePipe],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss', '../chatbox/chatbox.component.scss'],
})
export class MessageComponent {
  @Input() message!: Message;
  @Input() activeUserId!: string;
  @Input() isCurrentUser!: boolean;
  @Input() activeMessageId!: string;

  displayPickerBottom: boolean = false;
  previousTimestamp: number | null = null;
  displayEmojiPickerMainThread: Signal<boolean> = signal(false);
  isChatBoxEmojiPickerOpen: Signal<boolean> = signal(false);
  chatBoxEmojiPickerOpenFor: Signal<string | null> = signal(null);



  constructor(
    private userService: UserService,
    private emojiPickerService: EmojiPickerService,
    private messagesService: MessagesService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private userDialog$: UserDialogService,
    private stateService: StateService
    
    
  ) {}

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

  toggleEmojiPicker(messageId: string, isThreadMessage: boolean) {
    this.displayPickerBottom = isThreadMessage;
    if (this.isChatBoxEmojiPickerOpen()) {
      if (messageId !== this.chatBoxEmojiPickerOpenFor()) {
        this.emojiPickerService.openNewChatBoxEmojiPicker(messageId, isThreadMessage);
      } else {
        this.emojiPickerService.openChatBoxEmojiPicker(messageId, isThreadMessage);
      }
    } else {
      this.emojiPickerService.openChatBoxEmojiPicker(messageId, isThreadMessage);
    }
  }

  addEmoji(messageId: string, userId: string, emoji: string, isThreadMessage: boolean) {
    this.messagesService.updateMessage(messageId, userId, { reactions: [{ emoji, userIds: [userId] }] });
    this.emojiPickerService.closeChatBoxEmojiPicker();
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
    // this.activeMessageId = messageId;
    this.messagesService.setMessageId(messageId);
    this.stateService.setThreadchatState('in');
  }

}
