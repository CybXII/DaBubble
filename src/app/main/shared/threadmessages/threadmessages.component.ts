import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
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
import { FormsModule } from '@angular/forms';
import { SaveEditMessageService } from '../../../shared/services/save-edit-message.service';
import { EditmessageComponent } from '../editmessage/editmessage.component';
import { UserDialogService } from '../../../shared/services/user-dialog.service';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, FormsModule],
  templateUrl: './threadmessages.component.html',
  styleUrls: ['./threadmessages.component.scss', '../chatbox/chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ThreadMessagesComponent implements OnInit, OnDestroy {
  @ViewChild('editTextArea') editTextArea!: ElementRef<HTMLTextAreaElement>;
  @Input() threadMessage!: ThreadMessage;
  @Input() activeUserId!: string;
  @Input() activeMessageId!: string;
  @Output() userClicked = new EventEmitter<string>();
  private subscriptions: Subscription = new Subscription();
  isEmojiPickerOpen: boolean = false;  displayPickerBottom: boolean = false;
  editAcitve: boolean = false;

  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    private userService: UserService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private saveEditedMessage: SaveEditMessageService,
    private cdr: ChangeDetectorRef,
    private uds: UserDialogService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.activeThreadMessagePicker$.subscribe((id) => {
        console.log(`🔄 ThreadMessagePicker Update: ${id}`);
        this.isEmojiPickerOpen = id === this.threadMessage.docId;
        this.cdr.detectChanges(); // 🚀 TRIGGER FÜR UI-AKTUALISIERUNG
      })
    );
    console.log(this.threadMessage.docId);
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
    } else if (this.activeUserId === userId) {
      this.uds.openProfile()
      this.uds.exitActiv = false;
    }
  }

  getLastUsedEmojis(index: number) {
    return this.emojiStorageService.getEmojis()[index];
  }

  addEmoji(messageId: string, userId: string, emoji: string): void {
    if(this.editAcitve){
      const textArea = this.editTextArea.nativeElement;
      const startPos = textArea.selectionStart; // 🟢 Cursor-Startposition
      const endPos = textArea.selectionEnd; 
      if (startPos === null || endPos === null) {
        console.error("❌ Fehler: Cursor-Position nicht erkannt.");
        this.threadMessage.message += emoji;
        this.emojiPickerService.closeAllMessagePickers();
      } else {
        const newText = 
        this.threadMessage.message.substring(0, startPos) + 
        emoji + 
        this.threadMessage.message.substring(endPos);
    
        // ⏭️ Aktualisiere den Text in der Message
        this.threadMessage.message = newText;
      
        // 🔥 Setze den Cursor direkt hinter das eingefügte Emoji
        setTimeout(() => {
          textArea.focus();
          textArea.selectionStart = textArea.selectionEnd = startPos + emoji.length;
        }, 0);
      }
  
    // 🎯 Emoji Picker schließen
    this.emojiPickerService.closeAllThreadMessagePickers();

    } else {
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
  }

  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }

  editMessage(message: Partial<Message>, deleteMessage: boolean, inlineEdit = false) {
    this.editAcitve = true;
    if (inlineEdit && window.innerWidth > 450) {
      sessionStorage.setItem('EditedMessage', message.message as string);
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
    let messageText = sessionStorage.getItem('EditedMessage');
    message.message = messageText as string;
    message.sameDay = false;
    this.editAcitve = false;
  }

  saveEdit(threadMessage: Partial<ThreadMessage>, parentMessageId: string) {
    if (!threadMessage.docId) {
      console.error("❌ Fehler: Thread-Nachricht hat keine docId.");
      return;
    }
  
    // 🚀 Lade die Original-Thread-Nachricht aus Firestore
    this.messagesService.getThreadMessage(parentMessageId, threadMessage.docId).then(originalThreadMessage => {
      if (!originalThreadMessage) {
        console.error("❌ Fehler: Thread-Nachricht nicht gefunden in Firestore:", threadMessage.docId);
        return;
      }
  
      // ✅ Nur den Nachrichtentext ändern, alles andere bleibt gleich!
      const updateData: Partial<ThreadMessage> = {
        message: threadMessage.message,  // 👈 Nur der Text wird geändert!
      };
      if (threadMessage.docId && originalThreadMessage.createdBy) {
        this.messagesService.updateThreadMessage(parentMessageId, threadMessage.docId, originalThreadMessage.createdBy, updateData)
        .then(() => {
          console.log("✅ Thread-Nachricht erfolgreich aktualisiert:", updateData);
        })
        .catch(error => {
          console.error("❌ Fehler beim Speichern der Thread-Nachricht:", error);
        });

      }

      // 🔥 Speichern der aktualisierten Nachricht ohne `reactions`
  
    });
  
    // 🟢 Beende den Bearbeitungsmodus
    this.editAcitve = false;
  }
  
}
