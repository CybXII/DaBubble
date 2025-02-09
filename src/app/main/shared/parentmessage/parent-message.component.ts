import { Component, EventEmitter, HostListener, Input, Output, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../shared/services/user.service';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { RelativeDatePipe } from '../../../pipes/timestamp-to-date.pipe';

import { MessagesService } from '../../../shared/services/messages.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { Message, Reaction } from '../../../models/message';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';

@Component({
  selector: 'app-parent-message',
  standalone: true,
  imports: [CommonModule, ReactionsComponent, RelativeDatePipe, EmojiPickerComponent],
  templateUrl: './parent-message.component.html',
  styleUrls: ['./parent-message.component.scss', '../chatbox/chatbox.component.scss'],
})
export class ParentMessageComponent {
  @Input() activeMessageId!: string;
  @Input() parentMessage!: Partial<Message>;
  @Input() activeUserId!: string;
  @Input()displayEmojiPickerMainThread: Signal<boolean> = signal(true);
  @Output() userClicked = new EventEmitter<string>();

  previousTimestamp: number | null = null;
  displayPickerBottom: boolean = false;
  isChatBoxEmojiPickerOpen = signal(false);
  chatBoxEmojiPickerOpenFor = signal<string | null>(null);

  constructor(
    private userService: UserService,
    private emojiPickerService: EmojiPickerService,
    private messagesService: MessagesService,
    private emojiStorageService: EmojiStorageService
  ) {
    console.log("Emoji Picker geladen" ,this.parentMessage);
  }

  ngOnInit() {
    console.log("Emoji Picker geladen" ,this.parentMessage);
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

  toggleEmojiPicker(messageId: string, isThreadMessage: boolean) {
    console.log('toggleEmojiPicker aufgerufen mit:', messageId, isThreadMessage);
    
    this.displayPickerBottom = isThreadMessage;
  
    if (this.isChatBoxEmojiPickerOpen()) {
      if (messageId !== this.chatBoxEmojiPickerOpenFor()) {
        console.log('Setze chatBoxEmojiPickerOpenFor auf:', messageId);
        this.chatBoxEmojiPickerOpenFor.set(messageId);
      } else {
        console.log('Schließe Picker');
        this.isChatBoxEmojiPickerOpen.set(false);
        this.chatBoxEmojiPickerOpenFor.set(null);
      }
    } else {
      console.log('Öffne Picker für:', messageId);
      this.chatBoxEmojiPickerOpenFor.set(messageId);
      this.isChatBoxEmojiPickerOpen.set(true);
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
