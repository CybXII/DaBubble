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
  @Input()displayEmojiPickerMainThread: Signal<boolean> = signal(true);
  @Output() userClicked = new EventEmitter<string>();
  subscriptions = new Subscription(); // ✅ RICHTIG

  previousTimestamp: number | null = null;
  displayPickerBottom: boolean = false;
  isChatBoxEmojiPickerOpen = signal(false);
  chatBoxEmojiPickerOpenFor = signal<string | null>(null);
  isMessageBoxMainPickerOpen = false;
  isMessageBoxThreadPickerOpen = false;
  isMessageBoxCreateMessagePickerOpen = false;
  constructor(
    private userService: UserService,
    public emojiPickerService: EmojiPickerService,
    private messagesService: MessagesService,
    private emojiStorageService: EmojiStorageService
  ) {
    console.log("Emoji Picker geladen" ,this.parentMessage);
  }

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

  checkIdIsUser(userId: string) {
    if (this.activeUserId !== userId) {
      this.userClicked.emit(userId);
    }
  }



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
  
    updatePromise.then(() => {
      console.log('Emoji hinzugefügt:', emoji);
      this.emojiPickerService.closeChatBoxEmojiPicker(); // 🚀 Picker schließen
    }).catch(error => console.error('Fehler beim Hinzufügen der Reaktion:', error));
  
    this.emojiStorageService.saveEmoji(emoji);
  }
  
  
    preventEmojiPickerClose(event: Event): void {
      event.stopPropagation();
    }
}
