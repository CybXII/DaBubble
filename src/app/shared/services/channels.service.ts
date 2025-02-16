import { HostListener, Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, setDoc, addDoc, onSnapshot, query, where, deleteDoc } from '@angular/fire/firestore';
import { Channel } from '../../models/channel';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { StateService } from './state.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  private currentChannelSubject = new BehaviorSubject<Channel | null>(null);
  currentChannel$ = this.currentChannelSubject.asObservable();
  private userChangesSubject = new BehaviorSubject<{ id: string; name: string } | null>(null);
  userChanges$ = this.userChangesSubject.asObservable();
  private previousTimestamp: number | null = null;
  private collectionName = 'channels';
  threadAktive: boolean = false;
  channelsOpen: boolean = true;
  default: boolean = false;
  mobile = false

  /**
   * Creates an instance of the ChannelsService.
   * @param {Firestore} firestore Firestore service for interacting with the Firestore database.
   * @param {AuthService} authService AuthService for managing user authentication.
   * @param {StateService} stateService StateService for managing application state.
   * @param {UserService} userService UserService for managing user data.
   * @constructor
   */
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private stateService: StateService,
    private userService: UserService
  ) {
    this.trackUserChanges();
    this.onResize();
  }

  /**
   * Updates the `mobile` property based on the current window width.
  */
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.mobile = window.innerWidth <= 900;
  }

  /**
   * Sets the default channel to the first channel in the channel list.
   * @returns A Promise that resolves when the default channel has been set.
   */
  async setDefaultChannel(): Promise<void> {
    try {
      this.initDefaultChannel();
    } catch (error) {
      console.error('Fehler beim Setzen des Default Channels:', error);
    }
  }


  /**
   * Initializes the default channel for the current user.
   * Retrieves all channels, filters them to find the channels the user is a member of,
   * and attempts to set one as the default channel.
   */
  async initDefaultChannel() {
    const userId = this.authService.userId();
    if (!userId) { return console.warn('Keine Benutzer-ID verfügbar.') }
    const channels = await this.getAllChannels();
    const userChannels = channels.filter(channel => channel.members && channel.members.includes(userId));
    if (userChannels.length > 0) {
      this.searchAndSetDefaultChannel(userChannels);
    } else {
      if (!this.default) {
        this.clearCurrentChannel();
        this.default = true;
        this.currentChannelSubject.next(null);
      }
    }
  }


  /**
   * Searches for a channel to set as the default channel based on the channels the user is a member of.
   * Looks for a channel ID in the local storage and attempts to find a matching channel in the provided array.
   * @param userChannels The channels the user is a member of.
   */
  async searchAndSetDefaultChannel(userChannels: Channel[]) {
    const cachedChannelId = localStorage.getItem('lastChannelId');
    const defaultChannel = cachedChannelId
      ? userChannels.find(channel => channel.id === cachedChannelId) || userChannels[0]
      : userChannels[0];
    if (defaultChannel && defaultChannel.id) {
      if (!this.mobile)
        await this.selectChannel(defaultChannel.id);
    } else 
      console.warn('Kein gültiger Default-Channel gefunden.');
  }


  /**
   * Selects a channel based on the provided channel ID.
   * Sets the active channel ID and name when a new channel is received.
   * @param {string} channelId - The ID of the channel to select.
   * @returns {Promise<void>} - A promise that resolves when the channel is selected.
   */
  async selectChannel(channelId: string): Promise<void> {
    if (!channelId)
      return console.error('Ungültige Channel-ID.');
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    onSnapshot(channelRef, (channelDoc) => {
      if (channelDoc.exists()) {
        const channel = { id: channelId, ...channelDoc.data() } as Channel;
        this.currentChannelSubject.next(channel);
        localStorage.setItem('lastChannelId', channel.id || "");
      }
    });
    if (window.innerWidth <= 900)
      this.stateService.closeMenuAndThread();
    this.stateService.setThreadchatState('out');
  }


  /**
   * Creates a new channel in Firestore.
   * @param {Channel} channel The object containing the channel data to be created.
   * @returns {Promise<void>} A Promise resolving when the channel has been created.
   */
  async createChannel(channel: Channel): Promise<void> {
    const channelsCollection = collection(this.firestore, this.collectionName);
    try {
      await addDoc(channelsCollection, {
        ...channel,
        createdAt: new Date().getTime(),
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels:', error);
      throw error;
    }
  }


  /**
   * Retrieves a channel by its ID from Firestore.
   * @param {string} channelId The ID of the channel to retrieve.
   * @returns {Promise<Channel | null>} A Promise resolving to the retrieved channel object or null if the channel does not exist.
   */
  async getChannelById(channelId: string): Promise<Channel | null> {
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {
      const channelSnapshot = await getDoc(channelRef);
      if (channelSnapshot.exists()) {
        return channelSnapshot.data() as Channel;
      } else {
        console.error('Channel nicht gefunden');
        return null;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Channels:', error);
      throw error;
    }
  }


  /**
   * Retrieves all channels from Firestore, sorted by their name.
   * @returns A promise that resolves with an array of Channel objects.
   * @throws Will throw an error if there is an issue retrieving the channels.
   */
  async getAllChannels(): Promise<Channel[]> {
    const channelsRef = collection(this.firestore, this.collectionName);
    try {
      const querySnapshot = await getDocs(channelsRef);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Fehler beim Abrufen der Channels:', error);
      throw error;
    }
  }


  /**
   * Loads the channels in real-time from Firestore. 
   * @param callback A callback function that is called whenever the channels change.
   * @returns A function that can be called to unsubscribe from the Firestore channel
   */
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


  /**
   * Retrieves the members of a list of private channels.
   * @param {Channel[]} privateChannels - An array of private channel objects.
   * @returns {Promise<{ [channelId: string]: string[] }>} - An object mapping channel IDs to arrays of user IDs.
   */
  async getChannelMembers(privateChannels: Channel[]): Promise<{ [channelId: string]: string[] }> {
    const userId = this.authService.userId();
    const channelMembers: { [channelId: string]: string[] } = {};
    for (const channel of privateChannels) {
      if (!channel.id) {
        console.error('Channel has no ID:', channel);
        continue;
      }
      channelMembers[channel.id] = await this.determineChannelMembers(channel, userId);
    }
    return channelMembers;
  }


  /**
   * Determines the members of a private channel.
   * @param {Channel} channel - The private channel object.
   * @param {string} userId - The current user's ID.
   * @returns {Promise<string[]>} - A list of usernames in the channel.
   */
  private async determineChannelMembers(channel: Channel, userId: string | null): Promise<string[]> {
    const memberIds = channel.members;
    if (memberIds.length === 2 && userId)
      return this.getConversationPartnerNames(memberIds, userId);
    if (memberIds.length === 1 && memberIds[0] === userId)
      return this.getCurrentUserName(userId);
    return ['Unknown'];
  }

  /**
   * Retrieves the conversation partner's name.
   * @param {string[]} memberIds - The list of member IDs in the channel.
   * @param {string} userId - The current user's ID.
   * @returns {Promise<string[]>} - A list containing the partner's username.
   */
  private async getConversationPartnerNames(memberIds: string[], userId: string): Promise<string[]> {
    const conversationPartnerId = memberIds.find(id => id !== userId);
    if (!conversationPartnerId) return ['Unknown'];
    const usernames = await this.userService.getUsernamesByIds([conversationPartnerId]);
    return usernames.map(user => user.name);
  }


  /**
   * Retrieves the current user's name and appends "(You)".
   * @param {string} userId - The current user's ID.
   * @returns {Promise<string[]>} - A list containing the user's name with "(You)".
   */
  private async getCurrentUserName(userId: string): Promise<string[]> {
    const currentUser = await this.userService.getUsernamesByIds([userId]);
    return currentUser.map(user => `${user.name} (You)`);
  }


  /**
   * Retrieves the name of the first conversation partner for a given channel.
   * @param channelId - The ID of the channel to find the conversation partner for.
   * @param channelMembers - An object mapping channel IDs to arrays of member names.
   * @returns The name of the first conversation partner or 'Unbekannt' if not found.
   */
  getConversationPartnerName(channelId: string, channelMembers: { [channelId: string]: string[] }): string {
    const members = channelMembers[channelId];
    if (!members || members.length === 0)
      return 'Unbekannt';
    return members[0];
  }


  /**
   * Toggles the channels open state between true and false.
   * If the channels are currently open, they are closed and vice versa.
   * @returns {void} Nothing.
   */
  toggleChannelsOpen(): void {
    this.channelsOpen = !this.channelsOpen;
  }


  /**
   * Updates a channel with the given ID in Firestore.
   * @param channelId The ID of the channel to update.
   * @param updatedData The data to update for the channel.
   * @returns A promise that resolves when the channel is updated.
   */
  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<void> {
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {
      await setDoc(channelRef, updatedData, { merge: true });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Channels:', error);
      throw error;
    }
  }


  /**
   * Clears the current channel by emitting a null value to the current channel observable and
   * removing the last channel ID from local storage.
   */
  clearCurrentChannel(): void {
    this.currentChannelSubject.next(null);
    localStorage.removeItem('lastChannelId');
    this.default
    this.setDefaultChannel();
  }


  /**
   * Deletes a channel with the given ID from Firestore.
   * @param channelId The ID of the channel to delete.
   */
  async deleteChannel(channelId: string): Promise<void> {
    const channelRef = doc(this.firestore, `${this.collectionName}/${channelId}`);
    try {await deleteDoc(channelRef)} 
    catch (error) {console.error('Fehler beim Löschen des Channels:', error)}
  }


  /**
   * Retrieves all private channels from Firestore that contain all of the given member IDs.
   * @param memberIds The IDs of the members to search for.
   * @returns An array of private channels that contain all of the given member IDs.
   */
  async getPrivateChannelByMembers(memberIds: string[]): Promise<Channel[]> {
    const channelsRef = collection(this.firestore, this.collectionName);
    const queryRef = query(channelsRef, where('isPrivate', '==', true));
    try {
      const querySnapshot = await getDocs(queryRef);
      const channels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      return channels.filter(channel => memberIds.every(memberId => channel.members.includes(memberId)));
    } catch (error) {
      console.error('Fehler beim Abrufen privater Channels:', error);
      return [];
    }
  }


  /**
   * Emits an event on the userChangesSubject observable whenever a user's name is changed.
   * @param userId The ID of the user whose name was changed.
   * @param newName The new name of the user.
   */
  updateUserName(userId: string, newName: string): void {
    this.userChangesSubject.next({ id: userId, name: newName });
  }


  /**
   * Tracks changes to all user documents in the Firestore users collection.
   * Listens to the users collection and emits an event on the userChangesSubject observable.
   */
  private trackUserChanges(): void {
    const usersRef = collection(this.firestore, 'users');
    onSnapshot(usersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const updatedUser = { id: change.doc.id, ...change.doc.data() } as { id: string; name: string };
          this.userChangesSubject.next(updatedUser);
        }
      });
    });
  }


  /**
 * Checks if the given timestamp represents a different day than the previous one.
 * Updates the stored timestamp for future comparisons.
 * @param {string | Date | undefined} currentTimestamp - The timestamp to check.
 * @returns {boolean} - `true` if the day has changed, `false` otherwise.
 * @throws {Error} - If an invalid timestamp is provided.
 */
  checkAndSetPreviousTimestamp(currentTimestamp: string | Date | undefined): boolean {
    if (!currentTimestamp) return false;
    const currentDate = new Date(currentTimestamp);
    if (isNaN(currentDate.getTime()))
      throw new Error('Invalid timestamp provided');
    if (!this.previousTimestamp) {
      this.previousTimestamp = currentDate.getTime();
      return true;
    }
    const previousDate = new Date(this.previousTimestamp);
    const isDifferentDay =
      currentDate.getDate() !== previousDate.getDate() ||
      currentDate.getMonth() !== previousDate.getMonth() ||
      currentDate.getFullYear() !== previousDate.getFullYear();
    this.previousTimestamp = currentDate.getTime();
    return isDifferentDay;
  }
}