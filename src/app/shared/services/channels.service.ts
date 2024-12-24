import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, query, where, getDocs, setDoc, addDoc, onSnapshot  } from '@angular/fire/firestore';
import { Channel } from '../../models/channel';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  private collectionName = 'channels';
  private messagesCollectionName = 'messages';
  threadAktive: boolean = false;
  private currentChannelSubject = new BehaviorSubject<Channel | null>(null);
  currentChannel$ = this.currentChannelSubject.asObservable();
  constructor(private firestore: Firestore) {}
  channelsOpen: boolean = false;
  async createChannel(channel: Channel): Promise<void> {
    const channelsCollection = collection(this.firestore, this.collectionName);
    try {
      await addDoc(channelsCollection, {
        ...channel,
        createdAt: new Date(),
      });
      console.log('Channel erfolgreich erstellt');
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels:', error);
      throw error;
    }
  }

  async selectChannel(channelId: string): Promise<void> {
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {
      const channelDoc = await getDoc(channelRef); // Korrekte Methode für DocumentReference
      if (channelDoc.exists()) {
        const channel = { id: channelId, ...channelDoc.data() } as Channel;
        this.currentChannelSubject.next(channel); // Aktualisiere den aktuellen Channel
        // console.log('Channel ausgewählt:', channel);
      } else {
        console.error('Channel nicht gefunden.');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Channels:', error);
    }
  }
  

  async getChannelById(channelId: string): Promise<Channel | null> {
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {
      const channelSnapshot = await getDoc(channelRef);
      if (channelSnapshot.exists()) {
        return channelSnapshot.data() as Channel;
      } else {
        console.warn('Channel nicht gefunden');
        return null;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Channels:', error);
      throw error;
    }
  }


  async getAllChannels(): Promise<Channel[]> {
    const channelsRef = collection(this.firestore, this.collectionName);
    try {
      const querySnapshot = await getDocs(channelsRef);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
    } catch (error) {
      console.error('Fehler beim Abrufen der Channels:', error);
      throw error;
    }
  }


  loadChannelsRealtime(callback: (channels: Channel[]) => void): () => void {
    const channelsRef = collection(this.firestore, this.collectionName);
    const unsubscribe = onSnapshot(channelsRef, (snapshot) => {
      const channels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      callback(channels);
    });
    return unsubscribe;
  }


  toggleChannelsOpen(): void {
    this.channelsOpen = !this.channelsOpen;
  }

  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<void> {
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {
      await setDoc(channelRef, updatedData, { merge: true });
      // console.log('Channel erfolgreich aktualisiert:', updatedData);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Channels:', error);
      throw error;
    }
  }
}
