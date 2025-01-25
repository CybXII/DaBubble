import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  private isMessageBoxMainPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxThreadPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxCreateMessagePickerOpen = new BehaviorSubject<boolean>(false);
  private isChatBoxPickerOpen = new BehaviorSubject<boolean>(false);
  private chatBoxEmojiPickerForId = new BehaviorSubject<string>('');
  private displayEmojiPickerMainThread = new BehaviorSubject<boolean>(false);

  isMessageBoxMainPickerOpen$ = this.isMessageBoxMainPickerOpen.asObservable();
  isMessageBoxThreadPickerOpen$ =
    this.isMessageBoxThreadPickerOpen.asObservable();
    isMessageBoxCreateMessagePickerOpen$ = this.isMessageBoxCreateMessagePickerOpen.asObservable();
  isChatBoxPickerOpen$ = this.isChatBoxPickerOpen.asObservable();
  chatBoxEmojiPickerForId$ = this.chatBoxEmojiPickerForId.asObservable();
  displayEmojiPickerMainThread$ = this.displayEmojiPickerMainThread.asObservable();

  constructor() {}

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

  openChatBoxEmojiPicker(messageId: string, threadMain: boolean) {
    this.displayEmojiPickerMainThread.next(threadMain ? threadMain : false);
    this.isChatBoxPickerOpen.next(true);
    this.chatBoxEmojiPickerForId.next(messageId);
  }

  openNewChatBoxEmojiPicker(messageId: string) {
    this.isChatBoxPickerOpen.next(false);
    this.chatBoxEmojiPickerForId.next(messageId);
    this.isChatBoxPickerOpen.next(true);
  }

  closeChatBoxEmojiPicker() {
    this.displayEmojiPickerMainThread.next(false);
    this.isChatBoxPickerOpen.next(false);
    this.chatBoxEmojiPickerForId.next('');
  }
}
