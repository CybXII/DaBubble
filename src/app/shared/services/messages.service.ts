import { Injectable } from '@angular/core';
import { Firestore, collection, query,getDocs, collectionData, addDoc, where, onSnapshot, updateDoc, doc, getDoc, deleteDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, Reaction, ThreadMessage } from '../../models/message';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private messagesSubject = new BehaviorSubject<Partial<Message>[]>([]);
  messages$: Observable<Partial<Message>[]> = this.messagesSubject.asObservable();  
  private threadMessagesSubject = new BehaviorSubject<ThreadMessage[]>([]);
  private threadchatStateSubject = new BehaviorSubject<boolean>(false); // Zustand des Thread-Chats
  threadMessages$: Observable<ThreadMessage[]> = this.threadMessagesSubject.asObservable();
  threadchatState$ = this.threadchatStateSubject.asObservable(); // Observable für den Thread-Chat-Zustand
  private messageIdSubject = new BehaviorSubject<string | null>(null);
  messageId$ = this.messageIdSubject.asObservable();
  constructor(private firestore: Firestore) {}

  loadMessagesForChannel(channelId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const messagesRef = collection(this.firestore, 'messages');
      const q = query(messagesRef, where('channelId', '==', channelId));
  
      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const messages = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              createdBy: data['createdBy'] || 'Unbekannt',
              creatorName: data['creatorName'] || 'Unbekannt',
              creatorPhotoURL: data['creatorPhotoURL'] || '',
              isPrivate: data['isPrivate'] || false,
              message: data['message'] || '',
              timestamp: data['timestamp']
                ? new Date(data['timestamp'].seconds * 1000)
                : new Date(),
              members: data['members'] || [],
              reactions: data['reactions'] || [],
              thread: data['thread'] || null,
              docId: doc.id,
            } as Message;
          });
          this.messagesSubject.next(messages);
          resolve(); // Daten erfolgreich geladen
        } catch (error) {
          reject(error); // Fehler beim Laden der Daten
        } finally {
          unsubscribe(); // Event-Listener entfernen
        }
      });
    });
  }


  /**
   * Lädt Thread-Nachrichten einer bestimmten Nachricht und speichert sie lokal.
   * @param parentMessageId ID der Parent-Nachricht
   */
  loadThreadMessages(parentMessageId: string): void {
    const threadMessagesRef = collection(this.firestore, `messages/${parentMessageId}/threadMessages`);
    const threadMessages$ = collectionData(threadMessagesRef, { idField: 'docId' }) as Observable<ThreadMessage[]>;
  
    threadMessages$.subscribe((threadMessages) => {
      const processedMessages = threadMessages.map((threadMessage) => {
        return {
          ...threadMessage,
          parentMessageId, // parentMessageId hinzufügen
          timestamp: (threadMessage.timestamp as any).seconds
            ? new Date((threadMessage.timestamp as any).seconds * 1000)
            : threadMessage.timestamp, // Behalte andere Werte bei
        };
      });
  
      this.threadMessagesSubject.next(processedMessages);
    });
  
    this.openThreadChat(); // Öffne den Thread-Chat
  }
  

  /**
   * Fügt eine neue Nachricht hinzu.
   * @param message Die Nachricht, die hinzugefügt werden soll
   */
  async addMessage(message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, 'messages');
    try {
      await addDoc(messagesRef, message);
      console.log('Nachricht erfolgreich hinzugefügt:', message);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Nachricht:', error);
      throw error;
    }
  }

  /**
   * Fügt eine neue Thread-Nachricht hinzu.
   * @param messageId ID der Parent-Nachricht
   * @param threadMessage Die Thread-Nachricht
   */
  async addThreadMessage(messageId: string, threadMessage: ThreadMessage): Promise<void> {
    const threadMessagesRef = collection(this.firestore, `messages/${messageId}/threadMessages`);
    try {
      await addDoc(threadMessagesRef, threadMessage);
      console.log('Thread-Nachricht erfolgreich hinzugefügt:', threadMessage);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Thread-Nachricht:', error);
      throw error;
    }
  }

  /**
   * Öffnet den Thread-Chat.
   */
  openThreadChat(): void {
    
    this.threadchatStateSubject.next(true);
  }

  /**
   * Schließt den Thread-Chat.
   */
  closeThreadChat(): void {
    this.threadchatStateSubject.next(false);
  }


  
  setMessageId(messageId: string): void {
    this.messageIdSubject.next(messageId);
    // console.log('Message-ID gesetzt:', messageId);
  }

  async updateMessage(docId: string, userId: string, updateData: Partial<Message>): Promise<void> {
    const messageRef = doc(this.firestore, 'messages', docId);
  
    try {
      // Prüfe, ob es sich um eine Änderung der Reaktionen handelt
      if (updateData.reactions) {
        // Logik für das Hinzufügen/Entfernen von Reaktionen
        const currentMessage = await this.getMessage(docId);
        if (!currentMessage) throw new Error('Nachricht nicht gefunden.');
  
        const updatedReactions = this.updateReactions(
          currentMessage.reactions,
          updateData.reactions,
          userId
        );
        await updateDoc(messageRef, { reactions: updatedReactions });
      }
  
      // Prüfe, ob der Benutzer der Ersteller der Nachricht ist, um Text zu ändern oder zu löschen
      if (updateData.message) {
        const currentMessage = await this.getMessage(docId);
        if(currentMessage){
          if (currentMessage.createdBy !== userId) {
            throw new Error('Nur der Ersteller darf den Nachrichtentext ändern.');
          }
          await updateDoc(messageRef, { message: updateData.message });
        }
      }
  
      console.log('Nachricht erfolgreich aktualisiert:', docId);
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
      // Prüfe, ob es sich um eine Änderung der Reaktionen handelt
      if (updateData.reactions) {
        const currentThreadMessage = await this.getThreadMessage(messageId, threadDocId);
        if (!currentThreadMessage) throw new Error('Thread-Nachricht nicht gefunden.');

        const updatedReactions = this.updateReactions(
          currentThreadMessage.reactions,
          updateData.reactions,
          userId
        );
        await updateDoc(threadMessageRef, { reactions: updatedReactions });
      }
      // Prüfe, ob der Benutzer der Ersteller der Nachricht ist, um Text zu ändern oder zu löschen
      if (updateData.message) {
        const currentThreadMessage = await this.getThreadMessage(messageId, threadDocId);
        if (currentThreadMessage){
          if (currentThreadMessage.createdBy !== userId) {
            throw new Error('Nur der Ersteller darf den Nachrichtentext ändern.');
          }
          await updateDoc(threadMessageRef, { message: updateData.message });
        }
      }
      console.log('Thread-Nachricht erfolgreich aktualisiert:', threadDocId);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Thread-Nachricht:', error);
      throw error;
    }
  }

  private updateReactions(
    currentReactions: Reaction[] = [], // Standardwert hinzufügen
    newReactions: Reaction[] = [], // Standardwert hinzufügen
    userId: string
  ): Reaction[] {
    const updatedReactions = [...(currentReactions || [])]; // Verhindere Zugriff auf undefined
  
    newReactions.forEach((reaction) => {
      const existingReactionIndex = updatedReactions.findIndex(
        (r) => r.emoji === reaction.emoji && r.userName === userId
      );
  
      if (existingReactionIndex >= 0) {
        // Reaktion entfernen
        updatedReactions.splice(existingReactionIndex, 1);
      } else {
        // Reaktion hinzufügen
        updatedReactions.push({ emoji: reaction.emoji, userName: userId });
      }
    });
  
    return updatedReactions;
  }
  
  private async getMessage(docId: string): Promise<Message | null> {
    const docRef = doc(this.firestore, 'messages', docId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as Message) : null;
  }
  
  private async getThreadMessage(messageId: string, threadDocId: string): Promise<ThreadMessage | null> {
    console.log('Parent Message ID:', messageId);
    console.log('Thread Doc ID:', threadDocId);
  
    const docRef = doc(this.firestore, `messages/${messageId}/threadMessages`, threadDocId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as ThreadMessage) : null;
  }

  // async deleteMessage(docId: string, userId: string): Promise<void> {
  //   const messageRef = doc(this.firestore, 'messages', docId);
  
  //   try {
  //     // Prüfen, ob die Nachricht existiert
  //     const currentMessage = await this.getMessage(docId);
  //     if (!currentMessage) {
  //       throw new Error('Nachricht nicht gefunden.');
  //     }
  
  //     // Prüfen, ob der Benutzer der Ersteller der Nachricht ist
  //     if (currentMessage.createdBy !== userId) {
  //       throw new Error('Nur der Ersteller darf die Nachricht löschen.');
  //     }
  
  //     // Nachricht löschen
  //     await deleteDoc(messageRef);
  //     console.log('Nachricht erfolgreich gelöscht:', docId);
  //   } catch (error) {
  //     console.error('Fehler beim Löschen der Nachricht:', error);
  //     throw error;
  //   }
  // }
  async deleteMessage(
    docId: string,
    userId: string,
    isThread = false,
    parentMessageId?: string
  ): Promise<void> {
    try {
      let messageRef;
  
      if (isThread) {
        if (!parentMessageId) {
          throw new Error('ParentMessageId ist erforderlich für das Löschen von Thread-Nachrichten.');
        }
        messageRef = doc(this.firestore, `messages/${parentMessageId}/threadMessages`, docId);
      } else {
        if (!docId) {
          throw new Error('DocId ist erforderlich für das Löschen von Nachrichten.');
        }
        messageRef = doc(this.firestore, 'messages', docId);
      }
  
      // Prüfen, ob die Nachricht existiert
      const currentMessageSnapshot = await getDoc(messageRef);
      if (!currentMessageSnapshot.exists()) {
        throw new Error(isThread ? 'Thread-Nachricht nicht gefunden.' : 'Nachricht nicht gefunden.');
      }
  
      const currentMessage = currentMessageSnapshot.data() as Message | ThreadMessage;
  
      // Prüfen, ob der Benutzer der Ersteller ist
      if (currentMessage.createdBy !== userId) {
        throw new Error('Nur der Ersteller darf die Nachricht löschen.');
      }
  
      // Nachricht löschen
      await deleteDoc(messageRef);
      console.log(isThread ? 'Thread-Nachricht erfolgreich gelöscht.' : 'Nachricht erfolgreich gelöscht.');
    } catch (error) {
      console.error('Fehler beim Löschen der Nachricht:', error);
      throw error;
    }
  }


  async deleteThreadMessage(parentMessageId: string, threadDocId: string, userId: string): Promise<void> {
    const threadMessageRef = doc(this.firestore, `messages/${parentMessageId}/threadMessages`, threadDocId);
  
    try {
      // Prüfen, ob die Thread-Nachricht existiert
      const currentThreadMessage = await this.getThreadMessage(parentMessageId, threadDocId);
      if (!currentThreadMessage) {
        throw new Error('Thread-Nachricht nicht gefunden.');
      }
  
      // Prüfen, ob der Benutzer der Ersteller der Nachricht ist
      if (currentThreadMessage.createdBy !== userId) {
        throw new Error('Nur der Ersteller darf die Thread-Nachricht löschen.');
      }
  
      // Thread-Nachricht löschen
      await deleteDoc(threadMessageRef);
      console.log('Thread-Nachricht erfolgreich gelöscht:', threadDocId);
    } catch (error) {
      console.error('Fehler beim Löschen der Thread-Nachricht:', error);
      throw error;
    }
  }
}
