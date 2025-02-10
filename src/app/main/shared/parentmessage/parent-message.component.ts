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
import { firstValueFrom, Subscription } from 'rxjs';

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
  @Output() userClicked = new EventEmitter<string>();

  subscriptions = new Subscription();
  displayEmojiPickerMainThread = false;
  chatBoxEmojiPickerOpenFor: string | null = null;
  displayPickerBottom: boolean = false;




  constructor(
    private userService: UserService,
    public emojiPickerService: EmojiPickerService,
    private messagesService: MessagesService,
    private emojiStorageService: EmojiStorageService
  ) {
  }

  ngOnInit() {
    console.log("Emoji Picker geladen", this.parentMessage);

    // 🛠️ Achte nur auf displayEmojiPickerMainThread$
    this.subscriptions.add(
      this.emojiPickerService.displayEmojiPickerMainThread$.subscribe(
        (open) => {
          console.log(`🟠 displayEmojiPickerMainThread aktualisiert: ${open}`);
          this.displayEmojiPickerMainThread = open;
        }
      )
    );

    this.subscriptions.add(
      this.emojiPickerService.chatBoxEmojiPickerForId$.subscribe(
        (id) => {
          console.log(`🟠 chatBoxEmojiPickerForId aktualisiert: ${id}`);
          this.chatBoxEmojiPickerOpenFor = id;
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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



  /** Öffnet oder schließt den Emoji-Picker für diese Parent-Message */
  /** 🛠 Öffnet oder schließt den Emoji-Picker für die Parent-Message */
  toggleEmojiPicker(messageId: string) {
    if (!messageId) {
      console.log('🚫 Keine Parent-Message gefunden');
      return;
    }
  
    console.log(`🛠 Toggle Emoji Picker für ParentMessage: ${messageId} (Thread)`);
    this.emojiPickerService.openNewChatBoxEmojiPicker(messageId, true); // 🚀 True für Thread-Chat
  
    setTimeout(() => {
      console.log(`📌 Nach 100ms - displayEmojiPickerMainThread: ${this.emojiPickerService.displayEmojiPickerMainThread.value}`);
      console.log(`📌 Nach 100ms - isChatBoxPickerOpen: ${this.emojiPickerService.isChatBoxPickerOpen.value}`);
      console.log(`📌 Nach 100ms - chatBoxEmojiPickerForId: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
    }, 100);
  }
  

  /** Prüft, ob der Emoji-Picker für diese Nachricht offen ist */isEmojiPickerOpenForThisMessage(): boolean {
  return this.emojiPickerService.displayEmojiPickerMainThread.value &&
    this.emojiPickerService.chatBoxEmojiPickerForId.value === this.parentMessage.docId;
  }
  


  getLastUsedEmojis(index: number) {
    return this.emojiStorageService.getEmojis()[index];
  }


  /** 🛠 Emoji zur Nachricht hinzufügen */
  addEmoji(messageIdOrThreadDocId: string, userId: string, emoji: string): void {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };

    this.messagesService.updateMessage(messageIdOrThreadDocId, userId, updateData)
      .then(() => {
        console.log('Emoji hinzugefügt:', emoji);
        this.emojiPickerService.closeChatBoxEmojiPicker('addEmoji function');
      })
      .catch(error => console.error('Fehler beim Hinzufügen der Reaktion:', error));

    this.emojiStorageService.saveEmoji(emoji);
  }

  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }


  @HostListener('document:click', ['$event'])
  onChatboxDocumentClick(event: MouseEvent): void {
    if (this.isEmojiPickerOpenForThisMessage()) {
      this.emojiPickerService.closeChatBoxEmojiPicker('Clicked outside');
    }
  }
}
