import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  private isMessageBoxMainPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxThreadPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxCreateMessagePickerOpen = new BehaviorSubject<boolean>(false);
  public displayEmojiPickerMainThread = new BehaviorSubject<boolean>(false);
  // private isChatBoxPickerOpen = new BehaviorSubject<boolean>(false);
  // private chatBoxEmojiPickerForId = new BehaviorSubject<string>('');

  // isChatBoxPickerOpen$ = this.isChatBoxPickerOpen.asObservable();
  // chatBoxEmojiPickerForId$ = this.chatBoxEmojiPickerForId.asObservable();
  isMessageBoxMainPickerOpen$ = this.isMessageBoxMainPickerOpen.asObservable();
  isMessageBoxThreadPickerOpen$ =this.isMessageBoxThreadPickerOpen.asObservable();
  isMessageBoxCreateMessagePickerOpen$ = this.isMessageBoxCreateMessagePickerOpen.asObservable();
  displayEmojiPickerMainThread$ = this.displayEmojiPickerMainThread.asObservable();
  

  public isChatBoxPickerOpen = new BehaviorSubject<boolean>(false);
  public chatBoxEmojiPickerForId = new BehaviorSubject<string>('');

  isChatBoxPickerOpen$ = this.isChatBoxPickerOpen.asObservable();
  chatBoxEmojiPickerForId$ = this.chatBoxEmojiPickerForId.asObservable();

  constructor() {
  }

  openMsgBoxEmojiPickerMain() {
    this.isMessageBoxMainPickerOpen.next(true);
  }

  openMsgBoxEmojiPickerThread() {
    this.isMessageBoxThreadPickerOpen.next(true);
  }

  openMsgBoxCreateMessageEmojiPicker(){
    this.isMessageBoxCreateMessagePickerOpen.next(true);
  }

  closeMsgBoxEmojiPickerMain() {
    this.isMessageBoxMainPickerOpen.next(false);
  }
  
  closeMsgBoxEmojiPickerThread() {
    this.isMessageBoxThreadPickerOpen.next(false);
  }

  closeMsgBoxCreateMessageEmojiPicker(){
    this.isMessageBoxCreateMessagePickerOpen.next(false);
  }

  openChatBoxEmojiPickerOLDALEX(messageId: string, threadMain: boolean) {
    this.displayEmojiPickerMainThread.next(threadMain ? true : false);
    this.isChatBoxPickerOpen.next(true);
    this.chatBoxEmojiPickerForId.next(messageId);
  }

  openChatBoxEmojiPicker(messageId: string) {
    if (this.chatBoxEmojiPickerForId.value === messageId) {
      this.closeChatBoxEmojiPicker('openChatBoxEmojiPicker function');
    } else {
      this.isChatBoxPickerOpen.next(false);
      setTimeout(() => {  // 🚀 SetTimeout gibt Angular Zeit zum Rendern
        this.chatBoxEmojiPickerForId.next(messageId);
        this.isChatBoxPickerOpen.next(true);
      }, 0);
    }
  }
  
  openNewChatBoxEmojiPicker(messageId: string, threadMain: boolean) {
    console.log(`🟢 openNewChatBoxEmojiPicker() AUFGERUFEN für ${messageId} (Thread: ${threadMain})`);
  
    if (threadMain) {
      this.displayEmojiPickerMainThread.next(true);
      this.isChatBoxPickerOpen.next(false); // Chatbox-Picker schließen
    } else {
      this.isChatBoxPickerOpen.next(true);
      this.displayEmojiPickerMainThread.next(false); // Thread-Picker schließen
    }
  
    if (this.chatBoxEmojiPickerForId.value === messageId) {
      console.log(`🔴 Picker für ${messageId} war bereits offen → SCHLIESSEN`);
      this.closeChatBoxEmojiPicker('openNewChatBoxEmojiPicker function');
    } else {
      this.chatBoxEmojiPickerForId.next(messageId);
    }
  
    setTimeout(() => {
      console.log(`🔎 [100ms später] displayEmojiPickerMainThread: ${this.displayEmojiPickerMainThread.value}`);
      console.log(`🔎 [100ms später] isChatBoxPickerOpen: ${this.isChatBoxPickerOpen.value}`);
      console.log(`🔎 [100ms später] chatBoxEmojiPickerForId: ${this.chatBoxEmojiPickerForId.value}`);
    }, 100);
  }

  closeChatBoxEmojiPicker(trigger :string) {
    console.log("🚨 closeChatBoxEmojiPicker() wurde aufgerufen!", trigger);
    this.isChatBoxPickerOpen.next(false);
    this.chatBoxEmojiPickerForId.next('');
  }
  

  closeChatBoxEmojiPickerOLDALEX() {
    this.displayEmojiPickerMainThread.next(false);
    this.isChatBoxPickerOpen.next(false);
    this.displayEmojiPickerMainThread.next(false);
    this.chatBoxEmojiPickerForId.next('');
  }

  isEmojiPickerOpenFor(messageId: string): boolean {
    return this.isChatBoxPickerOpen.value && this.chatBoxEmojiPickerForId.value === messageId;
  }
}