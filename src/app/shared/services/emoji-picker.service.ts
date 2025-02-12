import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  // MessageBox Picker States
  private isMessageBoxMainPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxThreadPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxCreateMessagePickerOpen = new BehaviorSubject<boolean>(false);
  public displayParentMsg = new BehaviorSubject<boolean>(false);
  
  public isChatBoxPickerOpen = new BehaviorSubject<boolean>(false);
  public chatBoxEmojiPickerForId = new BehaviorSubject<string>('');

  isMessageBoxMainPickerOpen$ = this.isMessageBoxMainPickerOpen.asObservable();
  isMessageBoxThreadPickerOpen$ = this.isMessageBoxThreadPickerOpen.asObservable();
  isMessageBoxCreateMessagePickerOpen$ = this.isMessageBoxCreateMessagePickerOpen.asObservable();
  displayParentMsg$ = this.displayParentMsg.asObservable();
  isChatBoxPickerOpen$ = this.isChatBoxPickerOpen.asObservable();
  chatBoxEmojiPickerForId$ = this.chatBoxEmojiPickerForId.asObservable();

  constructor() {
    this.chatBoxEmojiPickerForId$.subscribe((id) => {
      console.log(`🔍 chatBoxEmojiPickerForId geändert: ${id}`);
    });
  }

  /** Öffnet oder schließt den Main-Chat Emoji-Picker */
  toggleMsgBoxEmojiPickerMain() {
    if (this.isMessageBoxMainPickerOpen.value) {
      this.isMessageBoxMainPickerOpen.next(false);
    } else {
      this.isMessageBoxThreadPickerOpen.next(false);
      this.isMessageBoxMainPickerOpen.next(true);
    }
  }

  /** Öffnet oder schließt den Thread-Chat Emoji-Picker */
  toggleMsgBoxEmojiPickerThread() {
    if (this.isMessageBoxThreadPickerOpen.value) {
      this.isMessageBoxThreadPickerOpen.next(false);
    } else {
      this.isMessageBoxMainPickerOpen.next(false);
      this.isMessageBoxThreadPickerOpen.next(true);
    }
  }

  /** Öffnet oder schließt den Create-Message Emoji-Picker */
  toggleMsgBoxCreateMessageEmojiPicker() {
    if (this.isMessageBoxCreateMessagePickerOpen.value) {
      this.isMessageBoxCreateMessagePickerOpen.next(false);
    } else {
      this.isMessageBoxCreateMessagePickerOpen.next(true);
    }
  }

/** Öffnet oder schließt einen Emoji-Picker für eine bestimmte Nachricht */
openChatBoxEmojiPicker(messageId: string) {
  console.log(`🟢 openChatBoxEmojiPicker() wird aufgerufen mit messageId: ${messageId}`);
  if (this.chatBoxEmojiPickerForId.value === messageId) {
    console.log('🔴 Picker ist bereits offen, wird geschlossen...');
  } else {
    console.log(`✅ Emoji Picker wird für ID ${messageId} geöffnet.`);
    this.chatBoxEmojiPickerForId.next(messageId);
    this.isChatBoxPickerOpen.next(true);
    console.log(`🟢 Neuer Picker-Wert: ${this.chatBoxEmojiPickerForId.value}`);
  }
}

openParentMessageEmojiPicker(messageId: string) {
  console.log(`🟢 openParentMessageEmojiPicker() wird aufgerufen mit messageId: ${messageId}`);
  if (this.chatBoxEmojiPickerForId.value === messageId) {
    console.log('🔴 Picker ist bereits offen, wird geschlossen...');
  } else {
    console.log(`✅ Emoji Picker wird für ID ${messageId} geöffnet.`);
    this.displayParentMsg.next(true);
    this.chatBoxEmojiPickerForId.next(messageId);
    console.log(`🟢 Neuer Picker-Wert: ${this.chatBoxEmojiPickerForId.value}`);
  }
}

closeParentMessageEmojiPicker() {
  this.displayParentMsg.next(false);
  this.chatBoxEmojiPickerForId.next('');
}

  /** Schließt den Emoji-Picker für Nachrichten */
  closeChatBoxEmojiPicker() {
    this.chatBoxEmojiPickerForId.next('');
    this.isChatBoxPickerOpen.next(false);
  }

  /** Schließt alle Emoji-Picker */
/** Schließt alle Emoji-Picker */
  closeAllEmojiPickers() {
    console.log('🛑 closeAllEmojiPickers() wird aufgerufen - Alle Picker werden geschlossen!');
    console.trace(); // Zeigt die genaue Aufrufquelle in der Konsole
    this.isMessageBoxMainPickerOpen.next(false);
    this.isMessageBoxThreadPickerOpen.next(false);
    this.isMessageBoxCreateMessagePickerOpen.next(false);
    this.isChatBoxPickerOpen.next(false);
    this.chatBoxEmojiPickerForId.next('');
  }
}