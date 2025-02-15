import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  WritableSignal,
  signal,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
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
import { StateService } from '../../../shared/services/state.service';
import { FormsModule } from '@angular/forms';
import { SaveEditMessageService } from '../../../shared/services/save-edit-message.service';
import { EditmessageComponent } from '../editmessage/editmessage.component';
import { UserDialogService } from '../../../shared/services/user-dialog.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, RelativeDatePipe, FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss', '../chatbox/chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MessageComponent implements OnInit, OnDestroy {
  @ViewChild('editTextArea') editTextArea!: ElementRef<HTMLTextAreaElement>;
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
  editAcitve: boolean = false;

  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    private userService: UserService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private saveEditedMessage: SaveEditMessageService,
    private stateService: StateService,
    private cdr: ChangeDetectorRef,
    private uds: UserDialogService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.activeMessagePicker$.subscribe((id) => {
        console.log(`🔄 MessagePicker Update: ${id}`);
        this.isEmojiPickerOpen.set(id === this.message.docId);
        this.cdr.detectChanges(); // 🚀 TRIGGER FÜR UI-AKTUALISIERUNG
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleEmojiPicker() {
    console.log(`🟢 toggleEmojiPicker() für Message aufgerufen (ID: ${this.message.docId})`);
    if (this.message.docId) {
      if (this.emojiPickerService.isMessageEmojiPickerOpen(this.message.docId)) {
        console.log('🔒 Schließe Emoji Picker für:', this.message.docId);
        this.emojiPickerService.closeAllEmojiPickers();
        return;
      }
      this.emojiPickerService.closeAllEmojiPickers();
      this.emojiPickerService.openMessageEmojiPicker(this.message.docId);
      console.log(`✅ EmojiPickerForId nach Öffnen: ${this.message.docId}`);
    } 
  }


  isEmojiPickerOpenForThisMessage(): boolean {
    return this.emojiPickerService.isMessageEmojiPickerOpen(this.message.docId??'');
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
    } else if (this.activeUserId === userId) {
      this.uds.openProfile()
      this.uds.exitActiv = false;
    }
  }

  getLastUsedEmojis(index: number) {
    return this.emojiStorageService.getEmojis()[index];
  }

  addEmoji(messageId: string, userId: string, emoji: string, isThreadMessage: boolean): void {
    if (this.editAcitve){
      const textArea = this.editTextArea.nativeElement;
      const startPos = textArea.selectionStart; // 🟢 Cursor-Startposition
      const endPos = textArea.selectionEnd; 
      if (startPos === null || endPos === null) {
        console.error("❌ Fehler: Cursor-Position nicht erkannt.");
        this.message.message += emoji;
        this.emojiPickerService.closeAllMessagePickers();
      } else {
        const newText = this.message.message.substring(0, startPos) + emoji 
        + this.message.message.substring(endPos);

        // ⏭️ Aktualisiere den Text in der Message
        this.message.message = newText;

        // 🔥 Setze den Cursor direkt hinter das eingefügte Emoji
        setTimeout(() => {
        textArea.focus();
        textArea.selectionStart = textArea.selectionEnd = startPos + emoji.length;
        }, 0);
      }

      // 🎯 Emoji Picker schließen
      this.emojiPickerService.closeAllMessagePickers();
    } else {
      const reaction: Reaction = { emoji, userIds: [userId] };
      const updateData: Partial<Message> = { reactions: [reaction] };
  
      const updatePromise = isThreadMessage
        ? this.messagesService.updateThreadMessage(this.activeMessageId!, messageId, userId, updateData)
        : this.messagesService.updateMessage(messageId, userId, updateData);
  
      updatePromise.then(() => {
        console.log('✅ Emoji hinzugefügt:', emoji);
        this.emojiPickerService.closeAllMessagePickers();
      }).catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));
  
      this.emojiStorageService.saveEmoji(emoji);
    }
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
    if (!message.docId) {
      console.error("❌ Fehler: Nachricht hat keine docId.");
      return;
    }
  
    // 🚀 Lade die Original-Nachricht aus Firestore
    this.messagesService.getMessage(message.docId).then(originalMessage => {
      if (!originalMessage) {
        console.error("❌ Fehler: Nachricht nicht gefunden in Firestore:", message.docId);
        return;
      }
  
      // ✅ Nur den Nachrichtentext ändern, alles andere bleibt gleich!
      const updateData: Partial<Message> = {
        message: message.message,
      };
      if (message.docId && originalMessage.createdBy) {
        this.messagesService.updateMessage(message.docId, originalMessage.createdBy, updateData)
        .then(() => {
          console.log("✅ Nachricht erfolgreich aktualisiert:", updateData);
        })
        .catch(error => {
          console.error("❌ Fehler beim Speichern:", error);
        });

      }
      else {
        console.error("❌ Fehler: Nachricht hat keine docId oder createdBy ID.");
      }
      // 🔥 Speichern der aktualisierten Nachricht ohne `reactions`
    });
    this.editAcitve = false;
  }

  cancelEdit(message: Partial<Message>) {
    let messageText = sessionStorage.getItem('EditedMessage');
    message.message = messageText as string;
    message.sameDay = false;    
    this.editAcitve = false;
  }

  editMessage(message: Partial<Message>, deleteMessage: boolean, inlineEdit = false) {
    this.editAcitve = true;
    // if (inlineEdit && window.innerWidth > 450) {
      sessionStorage.setItem('EditedMessage', message.message as string);
      message.sameDay = true;
      return;
    // } else {
    //   this.dialog.open(EditmessageComponent, {
    //     width: 'fit-content',
    //     maxWidth: '100vw',
    //     height: 'fit-content',
    //     data: { message, deleteMessage },
    //   });
    // }
  }

  checkWidth() {
    if (window.innerWidth > 400) {return true} else return false;
  }

  ckeckThredMessageAndWidth(message:any) {
    let length;
    if (message.threadMessages$._value.length !== 0) {
      length = message.threadMessages$._value.length
    } else {
      return null
    }
    if (length > 0 && window.innerWidth < 400) {return true} else return false;
  }
}
