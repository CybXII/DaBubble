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
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, Reaction, ThreadMessage } from '../../models/message';
import { catchError, map, switchMap } from 'rxjs/operators';
import { StateService } from './state.service';


@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private messagesSubject = new BehaviorSubject<Partial<Message>[]>([]);
  messages$: Observable<Partial<Message>[]> = this.messagesSubject.asObservable();
  private threadMessagesSubject = new BehaviorSubject<ThreadMessage[]>([]);
  threadMessages$: Observable<ThreadMessage[]> = this.threadMessagesSubject.asObservable();
  private messageIdSubject = new BehaviorSubject<string | null>(null);
  messageId$ = this.messageIdSubject.asObservable();
  private avatarsSubject = new BehaviorSubject<Map<string, string>>(new Map());
  avatars$: Observable<Map<string, string>> = this.avatarsSubject.asObservable();
  private parentMessageSubject = new BehaviorSubject<Message | null>(null);
  parentMessage$ = this.parentMessageSubject.asObservable();

  constructor(private firestore: Firestore, private stateService: StateService) {}

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
              timestamp: (threadMessage.timestamp as any).seconds
                ? new Date((threadMessage.timestamp as any).seconds * 1000)
                : threadMessage.timestamp,
            }))
            .sort((a, b) => {
              const dateA = new Date(a.timestamp).getTime();
              const dateB = new Date(b.timestamp).getTime();
              return dateA - dateB;
            })
        )
      )
      .subscribe((sortedThreadMessages) => {
        this.threadMessagesSubject.next(sortedThreadMessages);
      });

      const parentMessageRef = doc(this.firestore, `messages/${parentMessageId}`);
      onSnapshot(parentMessageRef, (docSnap) => {
        if (docSnap.exists()) {
          const parentMessage = {
            docId: parentMessageId,
            ...docSnap.data(),
          } as Message;
          this.parentMessageSubject.next(parentMessage); // Echtzeit-Update
        } else {
          this.parentMessageSubject.next(null);
        }
      });
    this.stateService.setThreadchatState('in');
  }


  async addMessage(message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, 'messages');
    try {
      await addDoc(messagesRef, message);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Nachricht:', error);
      throw error;
    }
  }


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
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Thread-Nachricht:', error);
      throw error;
    }
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
    console.log('messages service ', currentReactions);
    console.log('messages service ', newReactions);
    return updatedReactions;
  }

  private async getMessage(docId: string): Promise<Message | null> {
    const docRef = doc(this.firestore, 'messages', docId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as Message) : null;
  }


  public getAllMessages(userId: string): Observable<Message[]> {
    const channelsRef = collection(this.firestore, 'channels');
    const messagesRef = collection(this.firestore, 'messages');
    const userChannels$ = collectionData(channelsRef, { idField: 'id' }).pipe(
      map((channels: any[]) =>
        channels.filter((channel) => (channel.members || []).includes(userId))
      ),
      map((channels) => channels.map((channel) => channel.id))
    );
    return userChannels$.pipe(
      switchMap((channelIds: string[]) => {
        const messagesQuery = query(
          messagesRef,
          where('channelId', 'in', channelIds)
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
    const docRef = doc(
      this.firestore,
      `messages/${messageId}/threadMessages`,
      threadDocId
    );
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? (docSnapshot.data() as ThreadMessage) : null;
  }


  public async getAllThreadMessages(userId: string): Promise<ThreadMessage[]> {
    const channelsSnapshot = await getDocs(
      collection(this.firestore, 'channels')
    );
    const relevantChannels = channelsSnapshot.docs.filter((channelDoc) => {
      const members = channelDoc.data()['members'] || [];
      return members.includes(userId);
    });
    const relevantChannelIds = relevantChannels.map(
      (channelDoc) => channelDoc.id
    );
    const messagesSnapshot = await getDocs(
      collection(this.firestore, 'messages')
    );
    const relevantMessagesDocs = messagesSnapshot.docs.filter((messageDoc) => {
      const channelId = messageDoc.data()['channelId'];
      return relevantChannelIds.includes(channelId);
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
    const threadMessagesArrays = await Promise.all(threadMessagesPromises);
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
    const threadMessageRef = doc(this.firestore,`messages/${parentMessageId}/threadMessages`,threadDocId);
    try {
      const currentThreadMessage = await this.getThreadMessage(parentMessageId,threadDocId);
      if (!currentThreadMessage) {
        throw new Error('Thread-Nachricht nicht gefunden.');
      }
      if (currentThreadMessage.createdBy !== userId) {
        throw new Error('Nur der Ersteller darf die Thread-Nachricht löschen.');
      }
      await deleteDoc(threadMessageRef);
    } catch (error) {
      console.error('Fehler beim Löschen der Thread-Nachricht:', error);
      throw error;
    }
  }
}
