import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  collectionData,
  addDoc,
  where,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, Reaction, ThreadMessage } from '../../models/message';
import { catchError, map, switchMap } from 'rxjs/operators';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private threadMessagesSubject = new BehaviorSubject<ThreadMessage[]>([]);
  threadMessages$ = this.threadMessagesSubject.asObservable();

  private messageIdSubject = new BehaviorSubject<string | null>(null);
  messageId$ = this.messageIdSubject.asObservable();

  private parentMessageIdSubject = new BehaviorSubject<string | null>(null);
  parentMessageId$ = this.parentMessageIdSubject.asObservable();
  
  private avatarsSubject = new BehaviorSubject<Map<string, string>>(new Map());
  avatars$: Observable<Map<string, string>> = this.avatarsSubject.asObservable();

  private activeChannelId: string | null = null;
  private activeMessageId: string | null = null;
  private unsubscribeMessages: (() => void) | null = null;
  private unsubscribeThreads: (() => void) | null = null;

  constructor(private firestore: Firestore) {}

  loadAvatars(messages: Message[]): void {
    const avatarMap = new Map<string, string>();
    messages.forEach((message) => {
      avatarMap.set(
        message.createdBy,
        message.creatorPhotoURL || '/assets/default-avatar.png'
      );
    });
    this.avatarsSubject.next(avatarMap);
  }



loadMessagesForChannel(channelId: string | undefined): void {
  if (!channelId) {
    console.error('Channel-ID ist erforderlich für Nachrichtenabruf.');
    return;
  }

  if (this.activeChannelId !== channelId) {
    this.activeChannelId = channelId;
  } else {
    console.log('Channel bereits aktiv:', channelId);
    return;
  }

  console.log('🆕 Lade Nachrichten für Channel:', channelId);

  // ⏭ **Alte Nachrichten löschen, um falsche Channel-Daten zu verhindern**
  this.messagesSubject.next([]);  
  if (this.unsubscribeMessages) this.unsubscribeMessages(); // Entferne vorherigen Listener

  const messagesRef = collection(this.firestore, 'messages');
  const q = query(messagesRef, where('channelId', '==', channelId));

  this.unsubscribeMessages = onSnapshot(q, (snapshot) => {
    let messages = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        docId: docSnap.id,
        ...data,
        timestamp: this.convertTimestamp(data['timestamp']),
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

    // 🔥 **Sortierung der Nachrichten im Frontend nach `timestamp`**
    messages.sort((a, b) =>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    // doch anders sortieren, der Rest passiert dann via CSS
    // messages.sort((a, b) =>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())



    // 🔄 **Live-Updates für `threadMessages`**
    messages.forEach(msg => {
      const threadRef = collection(this.firestore, `messages/${msg.docId}/threadMessages`);
      
      onSnapshot(threadRef, (snapshot) => {
        let updatedThreads = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data(),
          timestamp: this.convertTimestamp(doc.data()['timestamp']),
        })) as ThreadMessage[];

        // 🔥 Sortierung der Thread-Nachrichten im Frontend
        updatedThreads.sort((a, b) =>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        
        //doch anders!
        // updatedThreads.sort((a, b) =>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())


        // 🔄 Aktualisiere `threadMessages$`
        if (msg.threadMessages$) msg.threadMessages$.next(updatedThreads);
      });
    });

    console.log('Aktualisierte Nachrichten:', messages);

    // 🔥 Cache aktualisieren
    this.messagesSubject.next(messages);
  });
}

    /**
   * 🔥 Lädt alle ThreadMessages für eine bestimmte Nachricht.
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
        timestamp: this.convertTimestamp(docSnap.data()['timestamp']),
        reactions: docSnap.data()['reactions'] || [],
      }) as ThreadMessage);
    }


  /**
   * 🔥 Lädt Thread-Nachrichten für eine Parent-Nachricht, sortiert sie und speichert sie im Cache.
   */
  loadThreadMessages(parentMessageId: string): void {
  if (this.activeMessageId === parentMessageId) return; // Verhindert doppelte Listener
  this.activeMessageId = parentMessageId;
  if (this.unsubscribeThreads) this.unsubscribeThreads(); // Entferne vorherigen Listener
  const threadMessagesRef = collection(this.firestore, `messages/${parentMessageId}/threadMessages`);
  const q = query(threadMessagesRef, orderBy('timestamp', 'asc'));
  this.unsubscribeThreads = onSnapshot(q, async (snapshot) => {
    const threadMessages = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        docId: docSnap.id,
        messageId: parentMessageId,
        ...data,
        timestamp: this.convertTimestamp(data['timestamp']),
        isThreadMessage: true,
      } as ThreadMessage;
    });
    // ✅ Sortierung beibehalten
    threadMessages.sort((a, b) =>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // doch anders!
    //threadMessages.sort((a, b) =>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 🔥 Cache aktualisieren
    this.threadMessagesSubject.next(threadMessages);
  });
}


  setParentMessageId(messageId: string | null): void {
    this.parentMessageIdSubject.next(messageId);
  }


  async addMessage(message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, 'messages');
    await addDoc(messagesRef, {
      ...message,
      timestamp: Timestamp.fromDate(new Date()), // ✅ Timestamp richtig speichern
    });
  }


  async addThreadMessage(messageId: string, threadMessage: ThreadMessage): Promise<void> {
    const threadMessagesRef = collection(this.firestore, `messages/${messageId}/threadMessages`);
    await addDoc(threadMessagesRef, threadMessage);
  }


  /**
   * 🔥 Setzt die aktive Message-ID, um den Thread-Chat zu steuern
   */
  setMessageId(messageId: string): void {
    this.messageIdSubject.next(messageId);
    this.loadThreadMessages(messageId);
  }


  /**
   * 🔥 Hilfsfunktion: Konvertiert Firestore-Timestamps sicher in JavaScript `Date`-Objekte.
   */
  convertTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  }

  async deleteMessage(docId: string, userId: string, isThread = false, parentMessageId?: string): Promise<void> {
    let messageRef;
    if (isThread) {
      if (!parentMessageId) throw new Error('ParentMessageId erforderlich für Thread-Nachrichtenlöschung.');
      messageRef = doc(this.firestore, `messages/${parentMessageId}/threadMessages`, docId);
    } else {
      messageRef = doc(this.firestore, 'messages', docId);
    }
    await deleteDoc(messageRef);
  }


  async deleteThreadMessage(parentMessageId: string, threadDocId: string, userId: string): Promise<void> {
    const threadMessageRef = doc(this.firestore, `messages/${parentMessageId}/threadMessages`, threadDocId);
    await deleteDoc(threadMessageRef);
  }


  getAllThreadMessages(userId: string): Observable<ThreadMessage[]> {
    const threadMessagesRef = collection(this.firestore, 'threads');
    return collectionData(threadMessagesRef) as Observable<ThreadMessage[]>;
  }


  getAllMessages(userId: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, 'messages');
    return collectionData(messagesRef) as Observable<Message[]>;
  }


  async updateMessage(
    docId: string,
    userId: string,
    updateData: Partial<Message>
  ): Promise<void> {
    const messageRef = doc(this.firestore, 'messages', docId);
    try {
      if (updateData.reactions) {
        const currentMessage = await this.getMessage(docId);
        if (!currentMessage) throw new Error('Nachricht nicht gefunden.');
        const updatedReactions = this.updateReactions(
          currentMessage.reactions,
          updateData.reactions,
          userId
        );
        await updateDoc(messageRef, { reactions: updatedReactions });
      }
      if (updateData.message) {
        const currentMessage = await this.getMessage(docId);
        if (currentMessage) {
          if (currentMessage.createdBy !== userId) {
            throw new Error(
              'Nur der Ersteller darf den Nachrichtentext ändern.'
            );
          }
          await updateDoc(messageRef, { message: updateData.message });
        }
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Nachricht:', error);
      throw error;
    }
  }


  async updateThreadMessage(
    messageId: string,
    threadDocId: string,
    userId: string,
    updateData: Partial<ThreadMessage>
  ): Promise<void> {
    const threadMessageRef = doc(
      this.firestore,
      `messages/${messageId}/threadMessages`,
      threadDocId
    );
    try {
      if (updateData.reactions) {
        const currentThreadMessage = await this.getThreadMessage(
          messageId,
          threadDocId
        );
        if (!currentThreadMessage)
          throw new Error('Thread-Nachricht nicht gefunden.');
        const updatedReactions = this.updateReactions(
          currentThreadMessage.reactions,
          updateData.reactions,
          userId
        );
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
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Thread-Nachricht:', error);
      throw error;
    }
  }


  private updateReactions(
    currentReactions: Reaction[] = [],
    newReactions: Reaction[] = [],
    userId: string
  ): Reaction[] {
    const updatedReactions = [...(currentReactions || [])];
    newReactions.forEach((reaction) => {
      const existingReactionIndex = updatedReactions.findIndex(
        (r) => r.emoji === reaction.emoji
      );
      if (existingReactionIndex >= 0) {
        const existingReaction = updatedReactions[existingReactionIndex];
        if (!existingReaction.userIds.includes(userId)) {
          existingReaction.userIds.push(userId);
        } else {
          const index = existingReaction.userIds.indexOf(userId);
          if (index > -1) {
            existingReaction.userIds.splice(index, 1);
            if (existingReaction.userIds.length === 0) {
              const reactionIndex = updatedReactions.findIndex(
                (r) => r.emoji === existingReaction.emoji
              );
              if (reactionIndex > -1) {
                updatedReactions.splice(reactionIndex, 1);
              }
            }
          }
        }
      } else {
        updatedReactions.push({ emoji: reaction.emoji, userIds: [userId] });
      }
    });
    return updatedReactions;
  }


    private async getMessage(docId: string): Promise<Message | null> {
    const docRef = doc(this.firestore, 'messages', docId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as Message) : null;
  }


  private async getThreadMessage(
    messageId: string,
    threadDocId: string
  ): Promise<ThreadMessage | null> {
    const docRef = doc(
      this.firestore,
      `messages/${messageId}/threadMessages`,
      threadDocId
    );
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as ThreadMessage) : null;
  }

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