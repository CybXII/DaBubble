// import { Component, EventEmitter, HostListener, Input, Output, signal, Signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { UserService } from '../../../shared/services/user.service';
// import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
// import { RelativeDatePipe } from '../../../pipes/timestamp-to-date.pipe';

// import { MessagesService } from '../../../shared/services/messages.service';
// import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
// import { Message, Reaction } from '../../../models/message';
// import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
// import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
// import { firstValueFrom, Subscription } from 'rxjs';

// @Component({
//   selector: 'app-parent-message',
//   standalone: true,
//   imports: [CommonModule, ReactionsComponent, RelativeDatePipe, EmojiPickerComponent],
//   templateUrl: './parent-message.component.html',
//   styleUrls: ['./parent-message.component.scss', '../chatbox/chatbox.component.scss'],
// })
// export class ParentMessageComponent {
//   @Input() activeMessageId!: string;
//   @Input() parentMessage!: Partial<Message>;
//   @Input() activeUserId!: string;
//   @Output() userClicked = new EventEmitter<string>();

//   subscriptions = new Subscription();
//   isChatBoxEmojiPickerOpen = signal(false);
//   chatBoxEmojiPickerForId = signal<string | null>(null);
//   displayPickerBottom: boolean = false;

//   isMessageBoxMainPickerOpen: boolean = false;
//   isMessageBoxThreadPickerOpen: boolean = false;
//   isMessageBoxCreateMessagePickerOpen: boolean = false;
//   displayEmojiPickerMainThread: boolean = false;


//   constructor(
//     private userService: UserService,
//     public emojiPickerService: EmojiPickerService,
//     private messagesService: MessagesService,
//     private emojiStorageService: EmojiStorageService
//   ) {
//     const emojiPickerMainThreadSubscription =
//     this.emojiPickerService.displayEmojiPickerMainThread$.subscribe((open) => {
//       this.displayEmojiPickerMainThread = open;
//     });

//     const emojiPickerMainSubscription =
//     this.emojiPickerService.isMessageBoxMainPickerOpen$.subscribe((open) => {
//       this.isMessageBoxMainPickerOpen = open;
//     });
//   const emojiPickerThreadSubscription =
//     this.emojiPickerService.isMessageBoxThreadPickerOpen$.subscribe(
//       (open) => {
//         this.isMessageBoxThreadPickerOpen = open;
//       }
//     );
//   const emojiPickerCreateMessageSubscription =
//     this.emojiPickerService.isMessageBoxCreateMessagePickerOpen$.subscribe(
//       (open) => {
//         this.isMessageBoxCreateMessagePickerOpen = open;
//       }
//     );
//   this.subscriptions.add(emojiPickerMainThreadSubscription);
//   this.subscriptions.add(emojiPickerMainSubscription);
//   this.subscriptions.add(emojiPickerThreadSubscription);
//   this.subscriptions.add(emojiPickerCreateMessageSubscription);
//   }

//   ngOnInit() {
//     console.log("Emoji Picker geladen", this.parentMessage);

//     this.emojiPickerService.isChatBoxPickerOpen$.subscribe(
//       (open) => this.isChatBoxEmojiPickerOpen.set(open)
//     );

//     this.emojiPickerService.chatBoxEmojiPickerForId$.subscribe(
//       (id) => this.chatBoxEmojiPickerForId.set(id)
//     );
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.unsubscribe();
//   }

//   getUserName(userId: string) {
//     return this.userService.getuserName(userId);
//   }

//   getUserAvatar(userId: string) {
//     return this.userService.getuserAvatar(userId);
//   }

//   checkIdIsUser(userId: string) {
//     if (this.activeUserId !== userId) {
//       this.userClicked.emit(userId);
//     }
//   }



//   /** Öffnet oder schließt den Emoji-Picker für diese Parent-Message */
//   /** 🛠 Öffnet oder schließt den Emoji-Picker für die Parent-Message */
//   toggleEmojiPicker(messageId: string) {
//     console.log(`🛠 Toggle Emoji Picker für ThreadMessage: ${messageId}`);
//     this.emojiPickerService.openNewChatBoxEmojiPicker(messageId, true);
//   }

  

//   /** Prüft, ob der Emoji-Picker für diese Nachricht offen ist */
//   isEmojiPickerOpenForThisMessage(): boolean {
//   return this.emojiPickerService.chatBoxEmojiPickerForId.value === this.parentMessage.docId 
//   && this.emojiPickerService.displayEmojiPickerMainThread.value;
//   }
  


//   getLastUsedEmojis(index: number) {
//     return this.emojiStorageService.getEmojis()[index];
//   }


//   /** 🛠 Emoji zur Nachricht hinzufügen */
//   addEmoji(messageIdOrThreadDocId: string, userId: string, emoji: string): void {
//     const reaction: Reaction = { emoji, userIds: [userId] };
//     const updateData: Partial<Message> = { reactions: [reaction] };

//     this.messagesService.updateMessage(messageIdOrThreadDocId, userId, updateData)
//       .then(() => {
//         console.log('Emoji hinzugefügt:', emoji);
//         this.emojiPickerService.closeChatBoxEmojiPicker('addEmoji function');
//       })
//       .catch(error => console.error('Fehler beim Hinzufügen der Reaktion:', error));

//     this.emojiStorageService.saveEmoji(emoji);
//   }

//   preventEmojiPickerClose(event: Event): void {
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
  Signal,
  signal,
  WritableSignal,
  ViewChild,
  ElementRef
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
  isEmojiPickerOpen: WritableSignal<boolean> = signal(false);
  isChatBoxPickerOpen: WritableSignal<boolean> = signal(false);

  displayPickerBottom: boolean = false;

  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    private userService: UserService,
    private emojiStorageService: EmojiStorageService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.chatBoxEmojiPickerForId$.subscribe((id) => {
        this.isEmojiPickerOpen.set(id === this.parentMessage.docId);
      })
    );
    this.subscriptions.add(
      this.emojiPickerService.isChatBoxPickerOpen$.subscribe((id) => {
        this.isChatBoxPickerOpen.set(false);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  toggleEmojiPicker() {
    console.log('🟢 toggleEmojiPicker() für ThreadMessage aufgerufen');
    console.log(`📌 Vorheriger Zustand: isEmojiPickerOpen = ${this.isEmojiPickerOpen()}`);
    console.log(`📌 ThreadMessage ID: ${this.parentMessage.docId}`);
    console.log(`📌 Aktueller EmojiPickerForId: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
  
    // Falls der Picker für die gleiche Nachricht bereits offen ist → schließen
    if (this.emojiPickerService.chatBoxEmojiPickerForId.value === this.parentMessage.docId) {
      console.log('🔒 Schließe Emoji Picker für:', this.parentMessage.docId);
      this.emojiPickerService.displayParentMsg.next(false);   
      this.emojiPickerService.closeChatBoxEmojiPicker();
      return;
    }
  
    // Ansonsten alle Picker schließen und für die aktuelle Nachricht öffnen
    this.emojiPickerService.closeAllEmojiPickers();
    console.log(`🔍 Nach closeAllEmojiPickers: chatBoxEmojiPickerForId = ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
  
    console.log('🔓 Öffne Emoji Picker für:', this.parentMessage.docId);
    if (this.parentMessage.docId) {   
      this.emojiPickerService.displayParentMsg.next(true);   
      this.emojiPickerService.openChatBoxEmojiPicker(this.parentMessage.docId);
    }
    console.log(`✅ EmojiPickerForId nach Öffnen: ${this.emojiPickerService.chatBoxEmojiPickerForId.value}`);
  }


  
  
  isEmojiPickerOpenForThisMessage(): boolean {
    const isOpen = this.emojiPickerService.chatBoxEmojiPickerForId.value === this.parentMessage.docId;
    console.log(`🟢 Prüfe ob Emoji-Picker für ThreadMessage offen ist: ${isOpen}`);
    console.log(`ThreadMessage ID: ${this.parentMessage.docId}`);
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

    this.messagesService.updateMessage(messageId, userId, updateData)
      .then(() => {
        console.log('✅ Emoji hinzugefügt:', emoji);
        this.emojiPickerService.closeChatBoxEmojiPicker();      })
      .catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));
    this.emojiStorageService.saveEmoji(emoji);
  }

  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }
}
