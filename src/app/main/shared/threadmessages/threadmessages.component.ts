import { Component, Input, Output, EventEmitter, Signal, signal, HostListener } from '@angular/core';
import { ThreadMessage, Reaction, Message } from '../../../models/message';
import { UserService } from '../../../shared/services/user.service';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
import { MatDialog } from '@angular/material/dialog';
import { EditmessageComponent } from '../editmessage/editmessage.component';
import { FormsModule } from '@angular/forms';
import { SaveEditMessageService } from '../../../shared/services/save-edit-message.service';

@Component({
  selector: 'app-thread-message',
  standalone: true,
  imports: [CommonModule, ReactionsComponent, FormsModule, EmojiPickerComponent],
  templateUrl: './threadmessages.component.html',
  styleUrls: ['./threadmessages.component.scss', '../chatbox/chatbox.component.scss'],
})
export class ThreadMessageComponent {
  @Input() threadMessage!: ThreadMessage;
  @Input() activeUserId!: string;
  @Input() activeMessageId!: string;
  @Output() userClicked = new EventEmitter<string>();
  displayPickerBottom: boolean = false;

  constructor(
    private userService: UserService,
    private emojiPickerService: EmojiPickerService,
    private messagesService: MessagesService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private saveEditedMessage: SaveEditMessageService  ) {}


  getUserName(userId: string) {
    return this.userService.getuserName(userId);
  }


  getUserAvatar(userId: string) {
    return this.userService.getuserAvatar(userId);
  }


  getLastUsedEmojis(index: number) {
    return this.emojiStorageService.getEmojis()[index];
  }


  checkIdIsUser(userId: string) {
    if (this.activeUserId !== userId) {
      this.userClicked.emit(userId);
    }
  }


  saveEdit(message: Partial<ThreadMessage>, threadMessage:boolean, parrentID: string) {
    this.saveEditedMessage.save(message, threadMessage, parrentID, message.docId)
  }


  toggleEmojiPicker(messageId: string) {
    console.log(`🛠 Toggle Emoji Picker für ThreadMessage: ${messageId}`);
    this.emojiPickerService.openNewChatBoxEmojiPicker(messageId, true);
  }


  isEmojiPickerOpenForThisMessage(): boolean {
    return (
      this.emojiPickerService.displayEmojiPickerMainThread.value && 
      this.emojiPickerService.chatBoxEmojiPickerForId.value === this.threadMessage.docId
    );
  }


  addEmoji(messageIdOrThreadDocId: string, userId: string, emoji: string): void {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };
    this.messagesService.updateThreadMessage(this.activeMessageId!, messageIdOrThreadDocId, userId, updateData)
      .then(() => {
        console.log('✅ Emoji hinzugefügt:', emoji);
        this.emojiPickerService.closeChatBoxEmojiPicker('addEmoji in ThreadMessages');
      })
      .catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));
    this.emojiStorageService.saveEmoji(emoji);
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


  cancelEdit(message: ThreadMessage) {
    message.sameDay = false;
  }


  editMessage2(message: ThreadMessage) {
    message.sameDay = true;
  }


  preventEmojiPickerClose(event: Event) {
    event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
    onChatboxDocumentClick(event: MouseEvent): void {
      if (this.isEmojiPickerOpenForThisMessage()) {
        this.emojiPickerService.closeChatBoxEmojiPicker('Clicked outside');
      }
    }
}
