import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  HostListener,
  Output,
  Signal,
  signal,
  WritableSignal,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
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

@Component({
  selector: 'app-parent-message',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, RelativeDatePipe],
  templateUrl: './parent-message.component.html',
  styleUrls: ['./parent-message.component.scss', '../chatbox/chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ParentMessageComponent implements OnInit, OnDestroy {
    @ViewChild('emojiPickerContainer', { static: false }) emojiPickerContainer!: ElementRef;
  
  @Input() activeMessageId!: string;
  @Input() parentMessage!: Partial<Message>;
  @Input() activeUserId!: string;
  @Output() userClicked = new EventEmitter<string>();
  private subscriptions: Subscription = new Subscription();
  isEmojiPickerOpen: boolean = false;
  displayPickerBottom: boolean = false;

  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    private userService: UserService,
    private emojiStorageService: EmojiStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.activeParentPicker$.subscribe((id) => {
        console.log(`🔄 ParentMessagePicker Update: ${id}`);
        this.isEmojiPickerOpen = id === this.parentMessage.docId;
        this.cdr.detectChanges(); // 🚀 TRIGGER FÜR UI-AKTUALISIERUNG
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  toggleEmojiPicker() {
    console.log(`🟢 toggleEmojiPicker() für ParentMessage aufgerufen (ID: ${this.parentMessage.docId})`);
    if (this.parentMessage.docId){
      if (this.emojiPickerService.isParentMessageEmojiPickerOpen(this.parentMessage.docId)) {
        console.log('🔒 Schließe ParentMessage Emoji Picker für:', this.parentMessage.docId);
        this.emojiPickerService.closeAllEmojiPickers();
        return;
      }
      
      this.emojiPickerService.closeAllEmojiPickers();
      this.emojiPickerService.openParentMessageEmojiPicker(this.parentMessage.docId);
      console.log(`✅ ParentMessagePickerForId nach Öffnen: ${this.parentMessage.docId}`);
    }
  }


  isEmojiPickerOpenForThisMessage(): boolean {
    return this.emojiPickerService.isParentMessageEmojiPickerOpen(this.parentMessage.docId??'');
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

    this.messagesService.updateMessage(messageId, userId, updateData)
      .then(() => {
        console.log('✅ Emoji hinzugefügt:', emoji);
        this.emojiPickerService.closeAllParentPickers();      })
      .catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));
    this.emojiStorageService.saveEmoji(emoji);
  }

  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }
}
