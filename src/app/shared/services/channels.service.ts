import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, setDoc, addDoc, onSnapshot, query, where, deleteDoc  } from '@angular/fire/firestore';
import { Channel } from '../../models/channel';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { MessagesService } from './messages.service';


@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  private collectionName = 'channels';
  threadAktive: boolean = false;
  private currentChannelSubject = new BehaviorSubject<Channel | null>(null);
  currentChannel$ = this.currentChannelSubject.asObservable();
  constructor(private firestore: Firestore, private authService: AuthService , private messagesService: MessagesService) {}
  channelsOpen: boolean = false;
  default: boolean = false;


  async setDefaultChannel(): Promise<void> {
    try {
      const userId = this.authService.userId(); // Aktuelle Benutzer-ID abrufen
      if (!userId) {
        console.warn('Keine Benutzer-ID verfügbar.');
        return;
      }
      const channels = await this.getAllChannels();
      const userChannels = channels.filter(channel => 
        channel.members && channel.members.includes(userId)
      );
      if (userChannels.length > 0) {
        const cachedChannelId = localStorage.getItem('lastChannelId');
        const defaultChannel = cachedChannelId
          ? userChannels.find(channel => channel.id === cachedChannelId) || userChannels[0]
          : userChannels[0];
        if (defaultChannel && defaultChannel.id) {
          await this.selectChannel(defaultChannel.id);
        } else {
          console.warn('Kein gültiger Default-Channel gefunden.');
        }
      } else {
        console.warn('Keine Channels verfügbar, in denen der Benutzer Mitglied ist.');
        if (!this.default){
          this.clearCurrentChannel();
          this.default = true;
          this.currentChannelSubject.next(null);
        }
      }
    } catch (error) {
      console.error('Fehler beim Setzen des Default Channels:', error);
    }
  }


  async selectChannel(channelId: string): Promise<void> {
    this.messagesService.closeThreadChat();
    if (!channelId) {
      console.error('Ungültige Channel-ID.');
      return;
    }
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {
      const channelDoc = await getDoc(channelRef);
      if (channelDoc.exists()) {
        const channel = { id: channelId, ...channelDoc.data() } as Channel;
        this.currentChannelSubject.next(channel);
        localStorage.setItem('lastChannelId', channelId);
      } else {
        console.error('Channel nicht gefunden.');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Channels:', error);
    }
  }
  

  async createChannel(channel: Channel): Promise<void> {
    const channelsCollection = collection(this.firestore, this.collectionName);
    try {
      await addDoc(channelsCollection, {
        ...channel,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels:', error);
      throw error;
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
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Channel))
        .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetische Sortierung nach Name
    } catch (error) {
      console.error('Fehler beim Abrufen der Channels:', error);
      throw error;
    }
  }


  loadChannelsRealtime(callback: (channels: Channel[]) => void): () => void {
    const userId = this.authService.userId();
    const channelsRef = collection(this.firestore, this.collectionName);
    const queryRef = query(channelsRef, where('members', 'array-contains', userId));
    const unsubscribe = onSnapshot(queryRef, (snapshot) => {
      const channels = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Channel))
        .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetische Sortierung
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
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Channels:', error);
      throw error;
    }
  }

  clearCurrentChannel(): void {
    this.currentChannelSubject.next(null);
    localStorage.removeItem('lastChannelId');
    this.default
    this.setDefaultChannel();
  }

  async deleteChannel(channelId: string): Promise<void> {
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {
      await deleteDoc(channelRef); // Löscht das Dokument komplett
    } catch (error) {
      console.error('Fehler beim Löschen des Channels:', error);
    }
  }


  async getPrivateChannelByMembers(memberIds: string[]): Promise<Channel[]> {
    const channelsRef = collection(this.firestore, this.collectionName);
    const queryRef = query(channelsRef, where('isPrivate', '==', true));
    try {
      const querySnapshot = await getDocs(queryRef);
      const channels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      return channels.filter(channel =>
        memberIds.every(memberId => channel.members.includes(memberId))
      );
    } catch (error) {
      console.error('Fehler beim Abrufen privater Channels:', error);
      return [];
    }
  }
}
