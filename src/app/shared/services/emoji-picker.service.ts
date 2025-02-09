import { Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  public isPickerOpen: WritableSignal<boolean> = signal(false);
  public openForMessageId: WritableSignal<string | null> = signal(null);

  isPickerOpen$ = this.isPickerOpen.asReadonly();
  openForMessageId$ = this.openForMessageId.asReadonly();

  constructor() {}

  /**
   * Öffnet den Emoji-Picker für eine bestimmte Nachricht (Message oder ThreadMessage)
   */
  openChatBoxEmojiPicker(messageId: string) {
    if (this.openForMessageId() === messageId) {
      this.closeChatBoxEmojiPicker(); // Falls derselbe Picker offen ist, schließen
    } else {
      this.closeAllEmojiPickers(); // Vorher alle anderen schließen
      this.openForMessageId.set(messageId);
      this.isPickerOpen.set(true);
    }
  }

  /**
   * Schließt alle Emoji-Picker (sorgt dafür, dass immer nur einer offen ist)
   */
  closeAllEmojiPickers() {
    this.isPickerOpen.set(false);
    this.openForMessageId.set(null);
  }

  /**
   * Schließt den aktiven Emoji-Picker
   */
  closeChatBoxEmojiPicker() {
    this.isPickerOpen.set(false);
    this.openForMessageId.set(null);
  }

  /**
   * Prüft, ob der Emoji-Picker für eine bestimmte Nachricht geöffnet ist
   */
  isEmojiPickerOpenFor(messageId: string): boolean {
    return this.isPickerOpen() && this.openForMessageId() === messageId;
  }

  openMsgBoxEmojiPickerMain() {
    this.closeAllEmojiPickers();  // Erst alles schließen
    this.isPickerOpen.set(true);
    this.openForMessageId.set('main');
  }
  
  openMsgBoxEmojiPickerThread() {
    this.closeAllEmojiPickers();
    this.isPickerOpen.set(true);
    this.openForMessageId.set('thread');
  }
  
  openMsgBoxCreateMessageEmojiPicker() {
    this.closeAllEmojiPickers();
    this.isPickerOpen.set(true);
    this.openForMessageId.set('createMessage');
  }
  
  closeMsgBoxEmojiPickerMain() {
    if (this.openForMessageId() === 'main') {
      this.closeChatBoxEmojiPicker();
    }
  }
  
  closeMsgBoxEmojiPickerThread() {
    if (this.openForMessageId() === 'thread') {
      this.closeChatBoxEmojiPicker();
    }
  }
  
  closeMsgBoxCreateMessageEmojiPicker() {
    if (this.openForMessageId() === 'createMessage') {
      this.closeChatBoxEmojiPicker();
    }
  }
}
