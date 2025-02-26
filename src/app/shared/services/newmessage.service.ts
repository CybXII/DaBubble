import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { ThreadMessage } from '../../models/message';
import { Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private sharedVariable = new BehaviorSubject<string>('Initial Value');
  private searchStringSubject = new BehaviorSubject<string>('');
  private targetStringSubject = new BehaviorSubject<string>('');
  private userIdSubject = new BehaviorSubject<string>('');
  private channelIdSubject = new BehaviorSubject<string>('');
  sharedVariable$ = this.sharedVariable.asObservable();
  searchString$ = this.searchStringSubject.asObservable();
  targetString$ = this.targetStringSubject.asObservable();
  userId$ = this.userIdSubject.asObservable();
  channelId$ = this.channelIdSubject.asObservable();

  /**
   * Initializes the SharedService with the Firestore service.
   * @param firestore The Firestore service for interacting with the Firestore database.
   */
  constructor(private firestore: Firestore) {}

  /**
   * Updates the shared variable with the given new value.
   * @param newValue The new value to assign to the shared variable.
   */
  updateVariable(newValue: string) {
    this.sharedVariable.next(newValue);
  }


  /**
   * Updates the search string with the provided value.
   * 
   * @param value The new search string to be set.
   */
  setSearchString(value: string) {
    this.searchStringSubject.next(value);
  }


  /**
   * Updates the user ID string with the provided value.
   * @param value The new user ID string to be set.
   */
  setUserIdString(value: string) {
    this.userIdSubject.next(value);
  }


  /**
   * Updates the channel ID string with the provided value.
   * @param value The new channel ID string to be set.
   */
  setChannelIdString(value: string) {
    this.channelIdSubject.next(value);
  }


  /**
   * Updates the target string with the provided value.
   * The target string is a string that indicates whether the user is targeting a user or a channel.
   * @param value The new target string to be set.
   */
  setTargetString(value: string) {
    this.targetStringSubject.next(value);
  }


  /**
   * Returns the currently set user ID string.
   * @returns The currently set user ID string.
   */
  getUserIdString() {
    return this.userIdSubject.value;
  }


  /**
   * Returns the currently set channel ID string.
   * @returns The currently set channel ID string.
   */
  getChannelIdString() {
    return this.channelIdSubject.value;
  }


  /**
   * Returns the currently set target string.
   * The target string is a string that indicates whether the user is targeting a user or a channel.
   * @returns The currently set target string.
   */
  getTargetString() {
    return this.targetStringSubject.value;
  }

  
  /**
   * Returns the currently set search string.
   * @returns The currently set search string.
   */
  getSearchString() {
    return this.searchStringSubject.value;
  }


  /**
   * Jumps to the symbol character in the message content.
   */
    jumpToAtAbove(symbol:string) {
      this.setSearchString(symbol);
    }


    /**
   * Adds a new thread message to the Firestore database.
   * @param messageId The ID of the parent message to add the thread message to.
   * @param threadMessage The thread message to add to the database.
   * @returns A promise that resolves when the thread message has been successfully added to the database.
   */
    async addThreadMessage(messageId: string, threadMessage: ThreadMessage): Promise<void> {
      const threadMessagesRef = collection(this.firestore, `messages/${messageId}/threadMessages`);
      await addDoc(threadMessagesRef, threadMessage);
    }


  /**
   * Deletes a specified thread message from the Firestore database.
   * @param parentMessageId The ID of the parent message containing the thread message.
   * @param threadDocId The document ID of the thread message to be deleted.
   * @param userId The ID of the user requesting the deletion.
   * @returns A promise that resolves when the thread message has been successfully deleted.
   */
  async deleteThreadMessage(parentMessageId: string, threadDocId: string): Promise<void> {
    const threadMessageRef = doc(this.firestore, `messages/${parentMessageId}/threadMessages`, threadDocId);
    await deleteDoc(threadMessageRef);
  }

      /**
   * Converts a given timestamp value to a Date object.
   * @param timestamp The value to convert to a Date object.
   * @returns A Date object representing the given timestamp value.
   */
  convertTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  }

  /**
   * Deletes a message from the Firestore database.
   * @param docId The document ID of the message to delete.
   * @param userId The ID of the user performing the deletion.
   * @param isThread If true, the message is a thread message (default is `false`).
   * @param parentMessageId The ID of the parent message if the message is a thread message.
   * @returns A promise that resolves when the message has been successfully deleted from the database.
   */
  async deleteMessage(docId: string, userId: string, isThread = false, parentMessageId?: string): Promise<void> {
    let messageRef;
    if (isThread) {
      if (!parentMessageId) throw new Error('ParentMessageId erforderlich für Thread-Nachrichtenlöschung.');
      messageRef = doc(this.firestore, `messages/${parentMessageId}/threadMessages`, docId);
    } else 
      messageRef = doc(this.firestore, 'messages', docId);
    await deleteDoc(messageRef);
  }
}