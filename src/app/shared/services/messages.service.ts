import { Injectable } from '@angular/core';
import {Firestore,collection, query, collectionData,addDoc, where, updateDoc, doc, getDoc, getDocs, onSnapshot, orderBy, Timestamp, Query, DocumentData,DocumentReference} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, Reaction, ThreadMessage } from '../../models/message';
import { SharedService } from './newmessage.service';

@Injectable({
  providedIn: 'root',
})

export class MessagesService {
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private threadMessagesSubject = new BehaviorSubject<ThreadMessage[]>([]);
  private messageIdSubject = new BehaviorSubject<string | null>(null);
  private parentMessageIdSubject = new BehaviorSubject<string | null>(null);
  private avatarsSubject = new BehaviorSubject<Map<string, string>>(new Map());
  messages$ = this.messagesSubject.asObservable();
  threadMessages$ = this.threadMessagesSubject.asObservable();
  messageId$ = this.messageIdSubject.asObservable();
  parentMessageId$ = this.parentMessageIdSubject.asObservable();
  avatars$: Observable<Map<string, string>> = this.avatarsSubject.asObservable();
  private activeChannelId: string | null = null;
  private activeMessageId: string | null = null;
  private unsubscribeMessages: (() => void) | null = null;
  private unsubscribeThreads: (() => void) | null = null;

  /**
   * Constructs a new instance of the MessagesService.
   * @param firestore The Firestore database service.
   * @param sharedService The service providing the active channel ID and message ID.
   */
  constructor(private firestore: Firestore, private sharedService: SharedService) {}


  /**
   * Loads avatars for the given messages into the avatarsSubject.
   * @param messages the messages to load avatars for
   */
  loadAvatars(messages: Message[]): void {
    const avatarMap = new Map<string, string>();
    messages.forEach((message) => {avatarMap.set(message.createdBy,message.creatorPhotoURL || '/assets/default-avatar.png');});
    this.avatarsSubject.next(avatarMap);
  }


  /**
   * Loads messages for the given channel ID and updates the messagesSubject.
   * @param channelId the ID of the channel to load messages for
   */
  loadMessagesForChannel(channelId: string | undefined): void {
    if (!channelId) 
      return console.error('Channel-ID ist erforderlich für Nachrichtenabruf.');
    if (this.activeChannelId !== channelId)
      this.activeChannelId = channelId;
    this.messagesSubject.next([]);  
    if (this.unsubscribeMessages) this.unsubscribeMessages();
    const messagesRef = collection(this.firestore, 'messages');
    const q = query(messagesRef, where('channelId', '==', channelId));
    this.createMessageSubscriptions(q);
  }


  /**
   * Creates a subscription to the Firestore messages collection for the given Query.
   * @param q the Firestore Query object to subscribe to
   */
  createMessageSubscriptions(q: Query<DocumentData, DocumentData>) {
    this.unsubscribeMessages = onSnapshot(q, (snapshot) => {
      let messages = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          docId: docSnap.id,
          ...data,
          timestamp: this.sharedService.convertTimestamp(data['timestamp']),
          createdBy: data['createdBy'] || 'Unknown',
          creatorName: data['creatorName'] || 'Unknown',
          creatorPhotoURL: data['creatorPhotoURL'] || '/assets/default-avatar.png',
          members: data['members'] || [],
          reactions: data['reactions'] || [],
          message: data['message'] || '',
          sameDay: false,
          threadMessages$: new BehaviorSubject<ThreadMessage[]>([])
        } as Message;
      });
      this.setMessageData(messages);
    });
  }


  /**
   * Sorts the given messages by timestamp and updates the messagesSubject.
   * For each message, it also creates a subscription to the threadMessages collection
   * and updates the threadMessages$ property of the message with the sorted thread messages.
   * @param messages the messages to update
   */
  setMessageData(messages: Message[]) {
    messages.sort((a, b) =>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    messages.forEach(msg => {
      const threadRef = collection(this.firestore, `messages/${msg.docId}/threadMessages`);
      onSnapshot(threadRef, (snapshot) => {
        let updatedThreads = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data(),
          timestamp: this.sharedService.convertTimestamp(doc.data()['timestamp']),
        })) as ThreadMessage[];
        updatedThreads.sort((b, a) =>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        if (msg.threadMessages$) {
          msg.threadMessages$.next(updatedThreads);
        }
      });
    });
    this.messagesSubject.next(messages);
  }


  /**
   * Retrieves an array of thread messages for a given parent message ID from Firestore.
   * @param parentMessageId - The ID of the parent message to retrieve thread messages for.
   * @returns A promise that resolves to an array of `ThreadMessage` objects.
   */
  async getThreadArrays(parentMessageId: string): Promise<ThreadMessage[]> {
    const threadMessagesRef = collection(this.firestore, `messages/${parentMessageId}/threadMessages`);
    const q = query(threadMessagesRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      docId: docSnap.id,
      messageId: parentMessageId,
      message: docSnap.data()['message'] || '',
      createdBy: docSnap.data()['createdBy'] || 'Unknown',
      timestamp: this.sharedService.convertTimestamp(docSnap.data()['timestamp']),
      reactions: docSnap.data()['reactions'] || [],
    }) as ThreadMessage);
  }


  /**
   * Loads all thread messages for a given parent message ID from Firestore.
   * It cancels any existing subscription to thread messages and creates a new one.
   * @param parentMessageId The ID of the parent message to load thread messages for.
   */
  loadThreadMessages(parentMessageId: string): void {
    if (this.activeMessageId === parentMessageId) return;
    this.activeMessageId = parentMessageId;
    if (this.unsubscribeThreads) this.unsubscribeThreads();
    const threadMessagesRef = collection(this.firestore, `messages/${parentMessageId}/threadMessages`);
    const q = query(threadMessagesRef, orderBy('timestamp', 'asc'));
    this.createThreadSubscriptions(q, parentMessageId);
  }


  /**
   * Creates a subscription to the given query of thread messages and updates the threadMessagesSubject with the sorted thread messages.
   * @param q The query of thread messages to subscribe to.
   * @param parentMessageId The ID of the parent message to which the thread messages belong.
   */
  createThreadSubscriptions(q: Query<DocumentData, DocumentData>, parentMessageId: string) {
    this.unsubscribeThreads = onSnapshot(q, async (snapshot) => {
      const threadMessages = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          docId: docSnap.id,
          messageId: parentMessageId,
          ...data,
          timestamp: this.sharedService.convertTimestamp(data['timestamp']),
          isThreadMessage: true,
        } as ThreadMessage;
      });
      threadMessages.sort((a, b) =>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      this.threadMessagesSubject.next(threadMessages);
    });
  }


  /**
   * Sets the parent message ID to the given value and notifies all subscribers to the parentMessageIdSubject.
   * @param messageId The ID of the parent message to set, or null to clear the parent message ID.
   */
  setParentMessageId(messageId: string | null): void {
    this.parentMessageIdSubject.next(messageId);
  }


  /**
   * Adds a new message to the Firestore database.
   * @param message The message to add to the database.
   * @returns A promise that resolves when the message has been successfully added to the database.
   */
  async addMessage(message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, 'messages');
    await addDoc(messagesRef, {
      ...message,
      timestamp: Timestamp.fromDate(new Date()),
    });
  }


  /**
   * Sets the ID of the message for which to load thread messages to the given value and loads the thread messages.
   * @param messageId The ID of the message for which to load thread messages.
   */
  setMessageId(messageId: string): void {
    this.messageIdSubject.next(messageId);
    this.loadThreadMessages(messageId);
  }


  /**
   * Retrieves all thread messages for a given user from the Firestore database.
   * @param userId The ID of the user for which to retrieve thread messages.
   * @returns An observable that emits an array of `ThreadMessage` objects.
   */
  // getAllThreadMessages(userId: string): Observable<ThreadMessage[]> {
  //   const threadMessagesRef = collection(this.firestore, 'threads');
  //   return collectionData(threadMessagesRef) as Observable<ThreadMessage[]>;
  // }
  async getAllThreadMessages(userId: string): Promise<ThreadMessage[]> {
    const messagesRef = collection(this.firestore, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
  
    let allThreadMessages: ThreadMessage[] = [];
  
    for (const messageDoc of messagesSnapshot.docs) {
      const parentMessageData = messageDoc.data();
      const threadMessagesRef = collection(this.firestore, `messages/${messageDoc.id}/threadMessages`);
      const threadMessagesSnapshot = await getDocs(threadMessagesRef);
      const threadMessages = threadMessagesSnapshot.docs.map((threadDoc) => ({
        docId: threadDoc.id,
        messageId: messageDoc.id,
        channelId: parentMessageData['channelId'],
        ...threadDoc.data(),
      })) as ThreadMessage[];
      allThreadMessages = [...allThreadMessages, ...threadMessages];
    }
    return allThreadMessages;
  }
  
  


  /**
   * Retrieves all messages for a given user from the Firestore database.
   * @param userId The ID of the user for which to retrieve messages.
   * @returns An observable that emits an array of `Message` objects.
   */
  getAllMessages(userId: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, 'messages');
    return collectionData(messagesRef) as Observable<Message[]>;
  }


  /**
   * Updates a message in the Firestore database with the given data.
   * @param docId The document ID of the message to update.
   * @param userId The ID of the user performing the update.
   * @param updateData The partial message data to update the message with.
   * @returns A promise that resolves when the message has been successfully updated in the database.
   */
  async updateMessage(docId: string,userId: string,updateData: Partial<Message>): Promise<void> {
    const messageRef = doc(this.firestore, 'messages', docId);
    try {await this.updateMessageData(docId, updateData, messageRef, userId);}
    catch (error) {throw console.error('Fehler beim Aktualisieren der Nachricht:', error);;}
  }


  /**
   * Updates a message in the Firestore database with the given data.
   * @param docId The document ID of the message to update.
   * @param updateData The partial message data to update the message with.
   * @param messageRef The reference to the Firestore document of the message to update.
   * @param userId The ID of the user performing the update.
   * @returns A promise that resolves when the message has been successfully updated in the database.
   */
  async updateMessageData(docId : string, updateData : Partial<Message>, messageRef : DocumentReference, userId : string) {
    if (updateData.reactions) {
      const currentMessage = await this.getMessage(docId);
      if (!currentMessage) throw new Error('Nachricht nicht gefunden.');
      const updatedReactions = this.updateReactions(currentMessage.reactions,updateData.reactions,userId);
      await updateDoc(messageRef, { reactions: updatedReactions });
    }
    if (updateData.message) {
      const currentMessage = await this.getMessage(docId);
      if (currentMessage) {
        if (currentMessage.createdBy !== userId) 
          throw new Error('Nur der Ersteller darf den Nachrichtentext ändern.');
        await updateDoc(messageRef, { message: updateData.message });
      }
    }
  }


  /**
   * Updates a thread message in the Firestore database with the given data.
   * @param messageId The ID of the parent message to which the thread message belongs.
   * @param threadDocId The document ID of the thread message to update.
   * @param userId The ID of the user performing the update.
   * @param updateData The partial thread message data to update the message with.
   * @returns A promise that resolves when the thread message has been successfully updated in the database.
   */
  async updateThreadMessage(messageId: string,threadDocId: string,userId: string,updateData: Partial<ThreadMessage>): Promise<void> {
    const threadMessageRef = doc(this.firestore,`messages/${messageId}/threadMessages`,threadDocId);
    try {this.updateThreadMessageData(messageId,threadDocId,updateData,threadMessageRef,userId);} 
    catch (error) {throw console.error('Fehler beim Aktualisieren der Thread-Nachricht:', error);}
  }


  /**
   * Updates a thread message in the Firestore database with the given data.
   * @param messageId The ID of the parent message to which the thread message belongs.
   * @param threadDocId The document ID of the thread message to update.
   * @param updateData The partial thread message data to update the message with.
   * @param threadMessageRef The document reference of the thread message in Firestore.
   * @param userId The ID of the user performing the update.
   * @throws Will throw an error if the thread message is not found or if the current user is not the creator.
   */
  async updateThreadMessageData(messageId: string, threadDocId: string, updateData : Partial<ThreadMessage>, threadMessageRef : DocumentReference, userId : string) {
    if (updateData.reactions) {
      const currentThreadMessage = await this.getThreadMessage(messageId,threadDocId);
      if (!currentThreadMessage)
        throw new Error('Thread-Nachricht nicht gefunden.');
      const updatedReactions = this.updateReactions(currentThreadMessage.reactions,updateData.reactions,userId);
      await updateDoc(threadMessageRef, { reactions: updatedReactions });
    }
    if (updateData.message) {
      const currentThreadMessage = await this.getThreadMessage(messageId,threadDocId);
      if (currentThreadMessage) {
        if (currentThreadMessage.createdBy !== userId) {
          throw new Error('Nur der Ersteller darf den Nachrichtentext ändern.');
        }
        await updateDoc(threadMessageRef, { message: updateData.message });
      }
    }
  }


  /**
   * Updates a list of reactions with new reactions.
   * @param currentReactions The current list of reactions.
   * @param newReactions The new list of reactions to add to the current list.
   * @param userId The ID of the user performing the update.
   * @returns The updated list of reactions.
   */
  private updateReactions(currentReactions: Reaction[] = [],newReactions: Reaction[] = [],userId: string): Reaction[] {
    const updatedReactions = [...(currentReactions || [])];
    newReactions.forEach((reaction) => {
      const existingReactionIndex = updatedReactions.findIndex((r) => r.emoji === reaction.emoji);
      if (existingReactionIndex >= 0) {
        this.initReactions(updatedReactions as Reaction[], existingReactionIndex, userId);
      } else 
        updatedReactions.push({ emoji: reaction.emoji, userIds: [userId] });
    });
    return updatedReactions;
  }


  /**
   * Initializes a reaction in a list of reactions by adding a user ID to the list of user IDs
   * associated with the reaction. If the user ID is already in the list, it is removed.
   * @param updatedReactions The list of reactions to initialize.
   * @param existingReactionIndex The index of the reaction in the list of reactions to initialize.
   * @param userId The user ID to add to the list of user IDs associated with the reaction.
   */
  initReactions(updatedReactions: Reaction[], existingReactionIndex: number, userId: string) {
    const existingReaction = updatedReactions[existingReactionIndex];
    if (!existingReaction.userIds.includes(userId)) 
      existingReaction.userIds.push(userId);
    else {
      const index = existingReaction.userIds.indexOf(userId);
      if (index > -1) {
        existingReaction.userIds.splice(index, 1);
        if (existingReaction.userIds.length === 0) {
          const reactionIndex = updatedReactions.findIndex((r) => r.emoji === existingReaction.emoji);
          if (reactionIndex > -1) 
            updatedReactions.splice(reactionIndex, 1);
        }
      }
    }
  }


  /**
   * Retrieves a message from the Firestore database.
   * @param docId The document ID of the message to retrieve.
   * @returns A promise that resolves to a `Message` object if the message is found in Firestore,
   * or `null` if the message is not found.
   */
  public async getMessage(docId: string): Promise<Message | null> {
    const docRef = doc(this.firestore, 'messages', docId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as Message) : null;
  }


  /**
   * Retrieves a thread message from the Firestore database.
   * @param messageId The ID of the parent message to which the thread message belongs.
   * @param threadDocId The document ID of the thread message to retrieve.
   * @returns A promise that resolves to a `ThreadMessage` object if the thread message is found in Firestore,
   * or `null` if the thread message is not found.
   */
  public async getThreadMessage(messageId: string,threadDocId: string): Promise<ThreadMessage | null> {
    const docRef = doc(this.firestore,`messages/${messageId}/threadMessages`,threadDocId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as ThreadMessage) : null;
  }


  /**
   * Retrieves all thread messages for a given parent message ID from Firestore.
   * @param parentMessageId The ID of the parent message to retrieve thread messages for.
   * @returns An observable that emits an array of `ThreadMessage` objects whenever the thread messages in Firestore change.
   */
  getThreadMessagesForMessage(parentMessageId: string): Observable<ThreadMessage[]> {
    return new Observable(observer => {
      const threadMessagesRef = collection(this.firestore, `messages/${parentMessageId}/threadMessages`);
      return onSnapshot(threadMessagesRef, snapshot => {
        const threads = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data(),
        })) as ThreadMessage[];
        observer.next(threads);
      }, error => observer.error(error));
    });
  }
}