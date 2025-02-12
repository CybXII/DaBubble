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
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { UserService } from '../../../shared/services/user.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { Message, ThreadMessage, Reaction } from '../../../models/message';
import { Subscription } from 'rxjs';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
import { MatDialog } from '@angular/material/dialog';
import { StateService } from '../../../shared/services/state.service';
import { FormsModule } from '@angular/forms';
import { SaveEditMessageService } from '../../../shared/services/save-edit-message.service';
import { EditmessageComponent } from '../editmessage/editmessage.component';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, FormsModule],
  templateUrl: './threadmessages.component.html',
  styleUrls: ['./threadmessages.component.scss', '../chatbox/chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ThreadMessagesComponent implements OnInit, OnDestroy {
  @Input() threadMessage!: ThreadMessage;
  @Input() activeUserId!: string;
  @Input() activeMessageId!: string;
  @Output() userClicked = new EventEmitter<string>();
  private subscriptions: Subscription = new Subscription();
  isEmojiPickerOpen: boolean = false;  displayPickerBottom: boolean = false;

  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    private userService: UserService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private saveEditedMessage: SaveEditMessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.activeThreadMessagePicker$.subscribe((id) => {
        console.log(`🔄 ThreadMessagePicker Update: ${id}`);
        this.isEmojiPickerOpen = id === this.threadMessage.docId;
        this.cdr.detectChanges(); // 🚀 TRIGGER FÜR UI-AKTUALISIERUNG
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleEmojiPicker() {
    console.log(`🟢 toggleEmojiPicker() für ThreadMessage aufgerufen (ID: ${this.threadMessage.docId})`);
    if (this.threadMessage.docId) {
      if (this.emojiPickerService.isThreadMessageEmojiPickerOpen(this.threadMessage.docId)) {
        console.log('🔒 Schließe ThreadMessage Emoji Picker für:', this.threadMessage.docId);
        this.emojiPickerService.closeAllEmojiPickers();
        return;
      }
    
      this.emojiPickerService.closeAllEmojiPickers();
      this.emojiPickerService.openThreadMessageEmojiPicker(this.threadMessage.docId);
      console.log(`✅ ThreadMessagePickerForId nach Öffnen: ${this.threadMessage.docId}`);
    }
  }

  isEmojiPickerOpenForThisMessage(): boolean {
    return this.emojiPickerService.isThreadMessageEmojiPickerOpen(this.threadMessage.docId??'');
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

  addEmoji(messageId: string, userId: string, emoji: string): void {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };

    this.messagesService.updateThreadMessage(this.activeMessageId!, messageId, userId, updateData)
      .then(() => {
        console.log('✅ Emoji hinzugefügt:', emoji);
        this.emojiPickerService.closeAllThreadMessagePickers();
      })
      .catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));

    this.emojiStorageService.saveEmoji(emoji);
  }

  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
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

  cancelEdit(message: Partial<Message>) {
    message.sameDay = false;
  }

  saveEdit(message: Partial<ThreadMessage>, threadMessage:boolean, parrentID: string) {
    this.saveEditedMessage.save(message, threadMessage, parrentID, message.docId)
  }
}
