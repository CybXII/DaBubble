import { Injectable } from '@angular/core';
import { Firestore, collection, onSnapshot, query, where, addDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  // Observables für Nachrichten und Thread-Nachrichten
  private messagesSubject = new BehaviorSubject<any[]>([]);
  private threadMessagesSubject = new BehaviorSubject<any[]>([]);
  private threadchatStateSubject = new BehaviorSubject<boolean>(false);
  messages$ = this.messagesSubject.asObservable(); // Observable für Nachrichten
  threadMessages$ = this.threadMessagesSubject.asObservable(); // Observable für Thread-Nachrichten
  threadchatState$ = this.threadchatStateSubject.asObservable();
  constructor(private firestore: Firestore) {}

  // Nachrichten eines spezifischen Channels in Echtzeit laden
  loadMessagesForChannel(channelId: string): void {
    const messagesRef = collection(this.firestore, 'messages');
    const q = query(messagesRef, where('channelId', '==', channelId));

    onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      this.messagesSubject.next(messages);
    });
}

  loadThreadMessages(messageId: string): void {
    const threadMessagesRef = collection(this.firestore, `messages/${messageId}/threadMessages`);

    onSnapshot(threadMessagesRef, (snapshot) => {
      if (snapshot.empty) {
        console.warn('Keine Thread-Nachrichten in der Subcollection vorhanden.');
        this.threadMessagesSubject.next([]); // Leeres Array weitergeben
      } else {
        const threadMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        this.threadMessagesSubject.next(threadMessages);
      }
    });
    this.openThreadChat(); // Öffne den Threadchat automatisch
  }


  // Neue Nachricht hinzufügen
  async addMessage(message: any): Promise<void> {
    const messagesRef = collection(this.firestore, 'messages');

    try {
      await addDoc(messagesRef, message);
      console.log('Nachricht erfolgreich hinzugefügt:', message);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Nachricht:', error);
      throw error;
    }
  }

  // Neue Thread-Nachricht hinzufügen
  async addThreadMessage(messageId: string, threadMessage: any): Promise<void> {
    const threadMessagesRef = collection(this.firestore, `messages/${messageId}/threadMessages`);

    try {
      await addDoc(threadMessagesRef, threadMessage);
      console.log('Thread-Nachricht erfolgreich hinzugefügt:', threadMessage);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Thread-Nachricht:', error);
      throw error;
    }
  }

    // Threadchat öffnen
    openThreadChat(): void {
      this.threadchatStateSubject.next(true);
    }
  
    // Threadchat schließen
    closeThreadChat(): void {
      this.threadchatStateSubject.next(false);
    }
}
