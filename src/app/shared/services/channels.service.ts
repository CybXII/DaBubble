import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, setDoc, addDoc, onSnapshot, query, where, deleteDoc } from '@angular/fire/firestore';
import { Channel } from '../../models/channel';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { MessagesService } from './messages.service';
import { StateService } from './state.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  private collectionName = 'channels';
  threadAktive: boolean = false;
  private currentChannelSubject = new BehaviorSubject<Channel | null>(null);
  currentChannel$ = this.currentChannelSubject.asObservable();
  channelsOpen: boolean = true;
  default: boolean = false;
  private userChangesSubject = new BehaviorSubject<{ id: string; name: string } | null>(null);
  userChanges$ = this.userChangesSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private stateService: StateService,
    private userService: UserService
  ) {
    this.trackUserChanges();
  }

  async setDefaultChannel(): Promise<void> {
    try {
      const userId = this.authService.userId();
      if (!userId) {
        console.warn('Keine Benutzer-ID verfügbar.');
        return;
      }
      const channels = await this.getAllChannels();
      const userChannels = channels.filter(channel => 
        channel.members && channel.members.includes(userId)
      );
      if (userChannels.length > 0) {
        const cachedChannelId = sessionStorage.getItem('lastChannelId');
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
        if (!this.default) {
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
    if (!channelId) {
      console.error('Ungültige Channel-ID.');
      return;
    }
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    onSnapshot(channelRef, (channelDoc) => {
      if (channelDoc.exists()) {
        const channel = { id: channelId, ...channelDoc.data() } as Channel;
        console.log('🔥 Firestore Echtzeit-Update für `channel$`:', channel);
        this.currentChannelSubject.next(channel);
      }
    });
    if (window.innerWidth <= 900) {
      this.stateService.closeMenuAndThread();
    }
    this.stateService.setThreadchatState('out');
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
        .sort((a, b) => a.name.localeCompare(b.name));
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
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(channels);
    });
    return unsubscribe;
  }

  async getChannelMembers(privateChannels: Channel[]): Promise<{ [channelId: string]: string[] }> {
    const userId = this.authService.userId();
    const channelMembers: { [channelId: string]: string[] } = {};

    for (const channel of privateChannels) {
      const memberIds = channel.members;
    
      if (!channel.id) {
        console.error('Channel hat keine ID:', channel);
        continue; // Überspringt den aktuellen Channel, wenn keine ID vorhanden ist
      }
    
      if (memberIds.length === 2) {
        const conversationPartnerId = memberIds.find((id) => id !== userId);
        if (conversationPartnerId) {
          const usernames = await this.userService.getUsernamesByIds([conversationPartnerId]);
          channelMembers[channel.id] = usernames.map((user) => user.name);
        }
      } else if (memberIds.length === 1 && memberIds[0] === userId) {
        const currentUser = await this.userService.getUsernamesByIds([userId]);
        channelMembers[channel.id] = currentUser.map((user) => `${user.name} (Du)`);
      } else {
        channelMembers[channel.id] = ['Unbekannt'];
      }
    }

    return channelMembers;
  }

  getConversationPartnerName(channelId: string, channelMembers: { [channelId: string]: string[] }): string {
    console.log(channelMembers);
    const members = channelMembers[channelId];
    if (!members || members.length === 0) {
      return 'Unbekannt';
    }
    return members[0];
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
    sessionStorage.removeItem('lastChannelId');
    this.default
    this.setDefaultChannel();
  }

  async deleteChannel(channelId: string): Promise<void> {
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {
      await deleteDoc(channelRef);
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

  updateUserName(userId: string, newName: string): void {
    this.userChangesSubject.next({ id: userId, name: newName });
  }

  private trackUserChanges(): void {
    const usersRef = collection(this.firestore, 'users'); // Passe 'users' an deinen tatsächlichen Pfad an
    onSnapshot(usersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const updatedUser = { id: change.doc.id, ...change.doc.data() } as { id: string; name: string };
          this.userChangesSubject.next(updatedUser);
        }
      });
    });
  }
}
