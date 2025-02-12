// import { Component, Input, Output, EventEmitter, Signal, signal } from '@angular/core';
// import { ThreadMessage, Reaction, Message } from '../../../models/message';
// import { UserService } from '../../../shared/services/user.service';
// import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
// import { MessagesService } from '../../../shared/services/messages.service';
// import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
// import { CommonModule } from '@angular/common';
// import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
// import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
// import { MatDialog } from '@angular/material/dialog';
// import { EditmessageComponent } from '../editmessage/editmessage.component';
// import { FormsModule } from '@angular/forms';
// import { SaveEditMessageService } from '../../../shared/services/save-edit-message.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-thread-message',
//   standalone: true,
//   imports: [CommonModule, ReactionsComponent, FormsModule, EmojiPickerComponent],
//   templateUrl: './threadmessages.component.html',
//   styleUrls: ['./threadmessages.component.scss', '../chatbox/chatbox.component.scss'],
// })
// export class ThreadMessageComponent {
//   @Input() threadMessage!: ThreadMessage;
//   @Input() activeUserId!: string;
//   @Input() activeMessageId!: string;
//   @Output() userClicked = new EventEmitter<string>();
//   displayPickerBottom: boolean = false;
//   subscriptions = new Subscription();
//   isChatBoxEmojiPickerOpen = signal(false);
//   chatBoxEmojiPickerForId = signal<string | null>(null);
//   // displayEmojiPickerMainThread = signal(false);


//   isMessageBoxMainPickerOpen: boolean = false;
//   isMessageBoxThreadPickerOpen: boolean = false;
//   isMessageBoxCreateMessagePickerOpen: boolean = false;
//   displayEmojiPickerMainThread: boolean = false;

//   constructor(
//     private userService: UserService,
//     private emojiPickerService: EmojiPickerService,
//     private messagesService: MessagesService,
//     private emojiStorageService: EmojiStorageService,
//     public dialog: MatDialog,
//     private saveEditedMessage: SaveEditMessageService  ) {
//       const emojiPickerMainThreadSubscription =
//       this.emojiPickerService.displayEmojiPickerMainThread$.subscribe((open) => {
//         this.displayEmojiPickerMainThread = open;
//       });
  
//       const emojiPickerMainSubscription =
//       this.emojiPickerService.isMessageBoxMainPickerOpen$.subscribe((open) => {
//         this.isMessageBoxMainPickerOpen = open;
//       });
//     const emojiPickerThreadSubscription =
//       this.emojiPickerService.isMessageBoxThreadPickerOpen$.subscribe(
//         (open) => {
//           this.isMessageBoxThreadPickerOpen = open;
//         }
//       );
//     const emojiPickerCreateMessageSubscription =
//       this.emojiPickerService.isMessageBoxCreateMessagePickerOpen$.subscribe(
//         (open) => {
//           this.isMessageBoxCreateMessagePickerOpen = open;
//         }
//       );
//     this.subscriptions.add(emojiPickerMainThreadSubscription);
//     this.subscriptions.add(emojiPickerMainSubscription);
//     this.subscriptions.add(emojiPickerThreadSubscription);
//     this.subscriptions.add(emojiPickerCreateMessageSubscription);
//     }


//   getUserName(userId: string) {
//     return this.userService.getuserName(userId);
//   }


//   getUserAvatar(userId: string) {
//     return this.userService.getuserAvatar(userId);
//   }


//   getLastUsedEmojis(index: number) {
//     return this.emojiStorageService.getEmojis()[index];
//   }


//   checkIdIsUser(userId: string) {
//     if (this.activeUserId !== userId) {
//       this.userClicked.emit(userId);
//     }
//   }


//   saveEdit(message: Partial<ThreadMessage>, threadMessage:boolean, parrentID: string) {
//     this.saveEditedMessage.save(message, threadMessage, parrentID, message.docId)
//   }


//   toggleEmojiPicker(messageId: string) {
//     console.log(`🛠 Toggle Emoji Picker für ThreadMessage: ${messageId}`);
//     this.emojiPickerService.openNewChatBoxEmojiPicker(messageId, false);
//   }


//   isEmojiPickerOpenForThisMessage(): boolean {
//     return !this.displayEmojiPickerMainThread && this.emojiPickerService.chatBoxEmojiPickerForId.value === this.threadMessage.docId
    
//   }


//   addEmoji(messageIdOrThreadDocId: string, userId: string, emoji: string): void {
//     const reaction: Reaction = { emoji, userIds: [userId] };
//     const updateData: Partial<Message> = { reactions: [reaction] };
//     this.messagesService.updateThreadMessage(this.activeMessageId!, messageIdOrThreadDocId, userId, updateData)
//       .then(() => {
//         console.log('✅ Emoji hinzugefügt:', emoji);
//         this.emojiPickerService.closeChatBoxEmojiPicker('addEmoji in ThreadMessages');
//       })
//       .catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));
//     this.emojiStorageService.saveEmoji(emoji);
//   }
    


//   editMessage(message: Partial<Message>, deleteMessage: boolean, inlineEdit = false) {
//     if (inlineEdit) {
//       message.sameDay = true;
//       return;
//     } else {
//       this.dialog.open(EditmessageComponent, {
//         width: 'fit-content',
//         maxWidth: '100vw',
//         height: 'fit-content',
//         data: { message, deleteMessage },
//       });
//     }
//   }


//   cancelEdit(message: ThreadMessage) {
//     message.sameDay = false;
//   }


//   editMessage2(message: ThreadMessage) {
//     message.sameDay = true;
//   }


//   preventEmojiPickerClose(event: Event) {
//     event.stopPropagation();
//   }
// }



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
  isEmojiPickerOpen: WritableSignal<boolean> = signal(false);
  displayPickerBottom: boolean = false;

  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    private userService: UserService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private saveEditedMessage: SaveEditMessageService,
    private stateService: StateService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.chatBoxEmojiPickerForId$.subscribe((id) => {
        console.log(`🔍 Subscription Update: chatBoxEmojiPickerForId = ${id}`);
        this.isEmojiPickerOpen.set(id === this.threadMessage.docId);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleEmojiPicker() {
    console.log('🟢 toggleEmojiPicker() für ThreadMessage aufgerufen');
    console.log(`📌 Vorheriger Zustand: isEmojiPickerOpen = ${this.isEmojiPickerOpen()}`);
    console.log(`📌 ThreadMessage ID: ${this.threadMessage.docId}`);
    console.log(`📌 Aktueller EmojiPickerForId: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
  
    // Falls der Picker für die gleiche Nachricht bereits offen ist → schließen
    if (this.emojiPickerService.chatBoxEmojiPickerForId.value === this.threadMessage.docId) {
      console.log('🔒 Schließe Emoji Picker für:', this.threadMessage.docId);
      this.emojiPickerService.closeChatBoxEmojiPicker();
      return;
    }
  
    // Ansonsten alle Picker schließen und für die aktuelle Nachricht öffnen
    this.emojiPickerService.closeAllEmojiPickers();
    console.log(`🔍 Nach closeAllEmojiPickers: chatBoxEmojiPickerForId = ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
  
    console.log('🔓 Öffne Emoji Picker für:', this.threadMessage.docId);
    if (this.threadMessage.docId){
      this.emojiPickerService.openChatBoxEmojiPicker(this.threadMessage.docId);
    }
    console.log(`✅ EmojiPickerForId nach Öffnen: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
  }

  isEmojiPickerOpenForThisMessage(): boolean {
    const isOpen = this.emojiPickerService.chatBoxEmojiPickerForId.value === this.threadMessage.docId && this.isEmojiPickerOpen();
    console.log(`🟢 Prüfe ob Emoji-Picker für ThreadMessage offen ist: ${isOpen}`);
    console.log(`ThreadMessage ID: ${this.threadMessage.docId}`);
    console.log(`Aktueller EmojiPickerForId: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
    return isOpen;
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
        this.emojiPickerService.closeChatBoxEmojiPicker();
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
