import { Component, EventEmitter, HostListener, Input, Output, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../shared/services/user.service';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { RelativeDatePipe } from '../../../pipes/timestamp-to-date.pipe';

import { MessagesService } from '../../../shared/services/messages.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { Message, Reaction } from '../../../models/message';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';

@Component({
  selector: 'app-parent-message',
  standalone: true,
  imports: [CommonModule, ReactionsComponent, RelativeDatePipe],
  templateUrl: './parent-message.component.html',
  styleUrls: ['./parent-message.component.scss', '../chatbox/chatbox.component.scss'],
})
export class ParentMessageComponent {
  @Input() activeMessageId!: string;
  @Input() parentMessage!: Partial<Message>;
  @Input() activeUserId!: string;
  @Output() userClicked = new EventEmitter<string>();

  isChatBoxEmojiPickerOpen: Signal<boolean> = signal(false);
  chatBoxEmojiPickerOpenFor: Signal<string | null> = signal(null);
  displayPickerBottom: boolean = false;

  constructor(
    private userService: UserService,
    private emojiPickerService: EmojiPickerService,
    private messagesService: MessagesService,
    private emojiStorageService: EmojiStorageService
  ) {}

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

  toggleEmojiPicker(messageId: string) {
    if (this.isChatBoxEmojiPickerOpen()) {
      if (messageId !== this.chatBoxEmojiPickerOpenFor()) {
        this.emojiPickerService.openNewChatBoxEmojiPicker(messageId, false);
      } else {
        this.emojiPickerService.openChatBoxEmojiPicker(messageId, false);
      }
    } else {
      this.emojiPickerService.openChatBoxEmojiPicker(messageId, false);
    }
  }


  getLastUsedEmojis(index: number) {
    const emojis = this.emojiStorageService.getEmojis();
    return emojis[index];
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
}
