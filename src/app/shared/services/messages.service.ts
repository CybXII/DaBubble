import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  collectionData,
  addDoc,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  getDocs,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, Reaction, ThreadMessage } from '../../models/message';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Thread } from '../../models/thread';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private messagesSubject = new BehaviorSubject<Partial<Message>[]>([]);
  messages$: Observable<Partial<Message>[]> =
    this.messagesSubject.asObservable();
  private threadMessagesSubject = new BehaviorSubject<ThreadMessage[]>([]);
  private threadchatStateSubject = new BehaviorSubject<boolean>(false);
  threadMessages$: Observable<ThreadMessage[]> =
    this.threadMessagesSubject.asObservable();
  threadchatState$ = this.threadchatStateSubject.asObservable();
  private messageIdSubject = new BehaviorSubject<string | null>(null);
  messageId$ = this.messageIdSubject.asObservable();
  constructor(private firestore: Firestore) {}
  private avatarsSubject = new BehaviorSubject<Map<string, string>>(new Map());
  avatars$: Observable<Map<string, string>> =
    this.avatarsSubject.asObservable();
  private parentMessageSubject = new BehaviorSubject<Message | null>(null);
  parentMessage$ = this.parentMessageSubject.asObservable();

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

  loadMessagesForChannel(channelId: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, 'messages');
    const q = query(messagesRef, where('channelId', '==', channelId));

    return collectionData(q, { idField: 'docId' }).pipe(
      map((docs) => {
        const messages = docs.map((doc) => ({
          docId: doc.docId,
          createdBy: doc['createdBy'] || 'Unbekannt',
          creatorName: doc['creatorName'] || 'Unbekannt',
          creatorPhotoURL: doc['creatorPhotoURL'] || '',
          message: doc['message'] || '',
          timestamp: doc['timestamp']
            ? new Date(doc['timestamp'].seconds * 1000)
            : new Date(),
          members: doc['members'] || [],
          reactions: doc['reactions'] || [],
          thread: doc['thread'] || null,
          sameDay: false || true,
        }));
        this.loadAvatars(messages);
        return messages;
      }),
      catchError((error) => {
        console.error('Fehler beim Abrufen der Nachrichten:', error);
        return [];
      })
    );
  }

  /**
   * Lädt Thread-Nachrichten einer bestimmten Nachricht und speichert sie lokal.
   * @param parentMessageId ID der Parent-Nachricht
   */
  loadThreadMessages(parentMessageId: string): void {
    const threadMessagesRef = collection(
      this.firestore,
      `messages/${parentMessageId}/threadMessages`
    );
    const threadMessages$ = collectionData(threadMessagesRef, {
      idField: 'docId',
    }) as Observable<ThreadMessage[]>;

    threadMessages$
      .pipe(
        map((threadMessages) =>
          threadMessages
            .map((threadMessage) => ({
              ...threadMessage,
              parentMessageId,
              timestamp: (threadMessage.timestamp as any)?.seconds
                ? new Date((threadMessage.timestamp as any).seconds * 1000)
                : threadMessage.timestamp,
            }))
            .sort((a, b) => {
              const dateA = new Date(a.timestamp).getTime();
              const dateB = new Date(b.timestamp).getTime();
              return dateB - dateA; // Sortiert absteigend nach Datum
            })
        )
      )
      .subscribe((sortedThreadMessages) => {
        this.threadMessagesSubject.next(sortedThreadMessages);
      });

    // Holen der Parent-Nachricht
    const parentMessageRef = doc(this.firestore, `messages/${parentMessageId}`);
    getDoc(parentMessageRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const parentMessage = {
            docId: parentMessageId,
            ...docSnap.data(),
          } as Message;
          this.parentMessageSubject.next(parentMessage);
          console.log('Parent-Nachricht geladen:', parentMessage);
        } else {
          console.warn('Parent-Nachricht nicht gefunden');
          this.parentMessageSubject.next(null);
        }
      })
      .catch((error) => {
        console.error('Fehler beim Laden der Parent-Nachricht:', error);
        this.parentMessageSubject.next(null);
      });

    this.openThreadChat();
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
  async addThreadMessage(
    messageId: string,
    threadMessage: ThreadMessage
  ): Promise<void> {
    const threadMessagesRef = collection(
      this.firestore,
      `messages/${messageId}/threadMessages`
    );
    try {
      await addDoc(threadMessagesRef, threadMessage);
      console.log('Thread-Nachricht erfolgreich hinzugefügt:', threadMessage);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Thread-Nachricht:', error);
      throw error;
    }
  }

  openThreadChat(): void {
    this.threadchatStateSubject.next(true);
  }

  closeThreadChat(): void {
    this.threadchatStateSubject.next(false);
  }

  setMessageId(messageId: string): void {
    this.messageIdSubject.next(messageId);
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
        const currentThreadMessage = await this.getThreadMessage(
          messageId,
          threadDocId
        );
        if (currentThreadMessage) {
          if (currentThreadMessage.createdBy !== userId) {
            throw new Error(
              'Nur der Ersteller darf den Nachrichtentext ändern.'
            );
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
    currentReactions: Reaction[] = [],
    newReactions: Reaction[] = [],
    userId: string
  ): Reaction[] {
    const updatedReactions = [...(currentReactions || [])];

    newReactions.forEach((reaction) => {
      const existingReactionIndex = updatedReactions.findIndex(
        (r) => r.emoji === reaction.emoji && r.userId === userId
      );

      if (existingReactionIndex >= 0) {
        updatedReactions.splice(existingReactionIndex, 1);
      } else {
        updatedReactions.push({ emoji: reaction.emoji, userId: userId });
      }
    });

    return updatedReactions;
  }

  private async getMessage(docId: string): Promise<Message | null> {
    const docRef = doc(this.firestore, 'messages', docId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as Message) : null;
  }

  // public getAllMessages(): Observable<Message[]> {
  //   const messagesRef = collection(this.firestore, 'messages');
  //   return collectionData(messagesRef, { idField: 'docId' }) as Observable<
  //     Message[]
  //   >;
  // }

  public getAllMessages(userId: string): Observable<Message[]> {
    const channelsRef = collection(this.firestore, 'channels');
    const messagesRef = collection(this.firestore, 'messages');

    // Fetch channels where the user is a member
    const userChannels$ = collectionData(channelsRef, { idField: 'id' }).pipe(
      map((channels: any[]) =>
        channels.filter((channel) => (channel.members || []).includes(userId))
      ),
      map((channels) => channels.map((channel) => channel.id)) // Extract channel IDs
    );

    // Fetch messages only for relevant channels
    return userChannels$.pipe(
      switchMap((channelIds: string[]) => {
        const messagesQuery = query(
          messagesRef,
          where('channelId', 'in', channelIds) // Fetch messages from relevant channels
        );
        return collectionData(messagesQuery, {
          idField: 'docId',
        }) as Observable<Message[]>;
      })
    );
  }

  private async getThreadMessage(
    messageId: string,
    threadDocId: string
  ): Promise<ThreadMessage | null> {
    console.log('Parent Message ID:', messageId);
    console.log('Thread Doc ID:', threadDocId);

    const docRef = doc(
      this.firestore,
      `messages/${messageId}/threadMessages`,
      threadDocId
    );
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as ThreadMessage) : null;
  }

  // public async getAllThreadMessages(): Promise<ThreadMessage[]> {
  //   const messagesSnapshot = await getDocs(
  //     collection(this.firestore, 'messages')
  //   );
  //   const threadMessagesPromises = messagesSnapshot.docs.map(
  //     async (messageDoc) => {
  //       const threadMessagesSnapshot = await getDocs(
  //         collection(this.firestore, `messages/${messageDoc.id}/threadMessages`)
  //       );
  //       return threadMessagesSnapshot.docs.map(
  //         (doc) => ({ channelId: messageDoc.data()['channelId'], messageId: messageDoc.id, docId: doc.id, ...doc.data() } as ThreadMessage)
  //       );
  //     }
  //   );
  //   console.log('Thread Messages Promises:', threadMessagesPromises);

  //   const threadMessagesArrays = await Promise.all(threadMessagesPromises);
  //   console.log('Thread Messages Arrays:', threadMessagesArrays);
  //   return threadMessagesArrays.flat();
  // }

  public async getAllThreadMessages(userId: string): Promise<ThreadMessage[]> {
    // Fetch all channels to check for membership
    const channelsSnapshot = await getDocs(
      collection(this.firestore, 'channels')
    );

    // Filter channels where the userId is a member
    const relevantChannels = channelsSnapshot.docs.filter((channelDoc) => {
      const members = channelDoc.data()['members'] || [];
      return members.includes(userId); // Check if userId is in the members array
    });

    const relevantChannelIds = relevantChannels.map(
      (channelDoc) => channelDoc.id
    );

    // Fetch messages only from relevant channels
    const messagesSnapshot = await getDocs(
      collection(this.firestore, 'messages')
    );
    const relevantMessagesDocs = messagesSnapshot.docs.filter((messageDoc) => {
      const channelId = messageDoc.data()['channelId'];
      return relevantChannelIds.includes(channelId); // Check if the message belongs to a relevant channel
    });

    const threadMessagesPromises = relevantMessagesDocs.map(
      async (messageDoc) => {
        const threadMessagesSnapshot = await getDocs(
          collection(this.firestore, `messages/${messageDoc.id}/threadMessages`)
        );
        return threadMessagesSnapshot.docs.map(
          (doc) =>
            ({
              channelId: messageDoc.data()['channelId'],
              messageId: messageDoc.id,
              docId: doc.id,
              ...doc.data(),
            } as ThreadMessage)
        );
      }
    );

    console.log('Filtered Channels:', relevantChannelIds);
    console.log('Filtered Messages:', relevantMessagesDocs);
    console.log('Thread Messages Promises:', threadMessagesPromises);

    const threadMessagesArrays = await Promise.all(threadMessagesPromises);
    console.log('Thread Messages Arrays:', threadMessagesArrays);

    return threadMessagesArrays.flat();
  }

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
          throw new Error(
            'ParentMessageId ist erforderlich für das Löschen von Thread-Nachrichten.'
          );
        }
        messageRef = doc(
          this.firestore,
          `messages/${parentMessageId}/threadMessages`,
          docId
        );
      } else {
        if (!docId) {
          throw new Error(
            'DocId ist erforderlich für das Löschen von Nachrichten.'
          );
        }
        messageRef = doc(this.firestore, 'messages', docId);
      }

      const currentMessageSnapshot = await getDoc(messageRef);
      if (!currentMessageSnapshot.exists()) {
        throw new Error(
          isThread
            ? 'Thread-Nachricht nicht gefunden.'
            : 'Nachricht nicht gefunden.'
        );
      }

      const currentMessage = currentMessageSnapshot.data() as
        | Message
        | ThreadMessage;

      if (currentMessage.createdBy !== userId) {
        throw new Error('Nur der Ersteller darf die Nachricht löschen.');
      }

      await deleteDoc(messageRef);
      console.log(
        isThread
          ? 'Thread-Nachricht erfolgreich gelöscht.'
          : 'Nachricht erfolgreich gelöscht.'
      );
    } catch (error) {
      console.error('Fehler beim Löschen der Nachricht:', error);
      throw error;
    }
  }

  async deleteThreadMessage(
    parentMessageId: string,
    threadDocId: string,
    userId: string
  ): Promise<void> {
    const threadMessageRef = doc(
      this.firestore,
      `messages/${parentMessageId}/threadMessages`,
      threadDocId
    );

    try {
      const currentThreadMessage = await this.getThreadMessage(
        parentMessageId,
        threadDocId
      );
      if (!currentThreadMessage) {
        throw new Error('Thread-Nachricht nicht gefunden.');
      }

      if (currentThreadMessage.createdBy !== userId) {
        throw new Error('Nur der Ersteller darf die Thread-Nachricht löschen.');
      }

      await deleteDoc(threadMessageRef);
      console.log('Thread-Nachricht erfolgreich gelöscht:', threadDocId);
    } catch (error) {
      console.error('Fehler beim Löschen der Thread-Nachricht:', error);
      throw error;
    }
  }
}
