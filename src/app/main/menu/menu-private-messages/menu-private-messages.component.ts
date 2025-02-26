import { Component, OnInit, OnDestroy } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { AddchatComponent } from '../../addchat/addchat.component';
import { MatDialog } from '@angular/material/dialog';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { SharedService } from '../../../shared/services/newmessage.service';
import { AuthService } from '../../../shared/services/auth.service';
import { UserDialogService } from '../../../shared/services/user-dialog.service';
import { CustomUser, UserService } from '../../../shared/services/user.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-menu-private-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-private-messages.component.html',
  styleUrl: './menu-private-messages.component.scss',
})


export class MenuPrivateMessagesComponent implements OnInit, OnDestroy {
  messagesOpen: boolean = true;
  privateChannels: Channel[] = [];
  loading: boolean = true;
  channelMembers: { [channelId: string]: string[] } = {};
  private unsubscribeUserListener: (() => void) | null = null;
  users: {
    name: string;
    userId: string;
    photoURL: string;
    email: string;
    status: boolean;
  } = {
    name: '',
    userId: '',
    photoURL: '',
    email: '',
    status: false,
  };
  activeUsers:any = []


  /**
   * @constructor
   *
   * @param dialog - MatDialog service for opening dialogs.
   * @param channelsService - ChannelsService for managing channels.
   * @param sharedService - SharedService for managing shared state.
   * @param firestore - Firestore database service.
   * @param authService - AuthService for authentication.
   * @param userDialog - UserDialogService for managing user dialogs.
   * @param userService - UserService for managing users.
   */
  constructor(
    private dialog: MatDialog,
    public channelsService: ChannelsService,
    private sharedService: SharedService,
    private firestore: Firestore,
    private authService: AuthService,
    public userDialog: UserDialogService,
    private userService: UserService
  ) {}


  /**
   * Initializes the component by loading the private channels and subscribing
   * to all user data in real-time.
   */
  ngOnInit(): void {
    this.loadPrivateChannels();
    this.subscribeToAllUsers();
  }


  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Removes the user listener to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.unsubscribeUserListener) {
      this.unsubscribeUserListener();
    }
  }


  /**
   * Subscribes to all user data in real-time from Firestore.
   *
   * On user changes, reloads the private channels.
   */
  subscribeToAllUsers(): void {
    const usersCollectionRef = collection(this.firestore, 'users');
    this.unsubscribeUserListener = onSnapshot(
      usersCollectionRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            this.loadPrivateChannels();
          }
        });
      }
    );
  }


  /**
   * Loads all private channels from Firestore in real-time.
   * 
   * @remarks
   * The method filters the channels by the `isPrivate` property and then
   * calls the {@link ChannelsService.getChannelMembers} method to get the
   * channel members. The channel details are then initialized with the retrieved
   * channel members.
   * 
   * @returns A promise that resolves when the channels are loaded.
   */
  async loadPrivateChannels(): Promise<void> {
    this.loading = true;
    this.channelsService.loadChannelsRealtime(async (channels) => {
      const privateChannels = channels.filter((channel) => channel.isPrivate);
      const rawChannelMembers = await this.channelsService.getChannelMembers(privateChannels);
      this.initChannelDetails(privateChannels);
      this.setChannelMembers(rawChannelMembers);
      this.loading = false;
    });
  }


  /**
   * Initializes the channel details by getting the partner names for each private channel.
   * 
   * @param privateChannels - An array of private channels.
   * @returns A promise that resolves when the channels have been initialized.
   */
  async initChannelDetails(privateChannels : Channel[]) {
    const userId = this.authService.userId();
    const channelsWithPartnerNames = await Promise.all(
      privateChannels.map(async (channel) => {
        const partnerIds = channel.members.filter((id) => id !== userId);
        const partnerNames = await this.userService.getUsernamesByIds(partnerIds);
        return {
          ...channel,
          partnerNames: partnerNames.map((user) => user.name).sort((a, b) => a.localeCompare(b)),
        };
      })
    );
    if(userId) {
      this.initPrivateChannels(channelsWithPartnerNames, userId); 
    }
  }

  /**
   * Sets the channel members object with the given raw channel members.
   * The channel members object is a mapping of channel IDs to arrays of user IDs.
   * The method takes the raw channel members object and reduces it to the
   * desired format.
   * @param rawChannelMembers - The raw channel members object from Firestore.
   */
  setChannelMembers(rawChannelMembers: { [channelId: string]: string[] }) {
    this.channelMembers = Object.keys(rawChannelMembers).reduce(
      (acc, channelId) => {
        acc[channelId] = rawChannelMembers[channelId];
        return acc;
      },
      {} as { [channelId: string]: string[] }
    );
  }

  /**
   * Initializes the list of private channels with the given partner names and user data.
   * Sorts the channels based on whether the user is the sole member and by the partner's name.
   * If the user is the only member in a channel, that channel is prioritized in the list.
   * Otherwise, channels are sorted alphabetically by the first partner's name.
   *
   * @param channelsWithPartnerNames - An array of private channels, each with associated partner names and metadata.
   * @param userId - The ID of the current user, used to determine channel membership.
   */
  initPrivateChannels(channelsWithPartnerNames:{
    partnerNames: string[];
    id?: string;
    name: string;
    description?: string;
    createdBy: string;
    members: string[];
    isPrivate: boolean;
    createdAt?: Date;
    }[], userId: string): void {
      this.privateChannels = channelsWithPartnerNames.sort((a, b) => {
        const isUserAloneInA = a.members.length === 1 && a.members[0] === userId;
        const isUserAloneInB = b.members.length === 1 && b.members[0] === userId;
        if (isUserAloneInA && !isUserAloneInB) return -1;
        if (!isUserAloneInA && isUserAloneInB) return 1;
        const partnerA = a.partnerNames[0] || '';
        const partnerB = b.partnerNames[0] || '';
        this.getUser(a.members[1], b.members[1])
        return partnerA.localeCompare(partnerB);
      });
    }


  /**
   * Gets the user data for the given user IDs.
   * 
   * @param id - The first user ID.
   * @param id2 - The second user ID. If `id2` is not given, the method will not check for the second user.
   * @returns A promise that resolves when the user data has been retrieved.
   * @throws {Error} If one of the given user IDs is undefined or null.
   */
  async getUser(id:any, id2:any) {
    const ids = [id];
    if (id !== id2) {
      if (id2 !== undefined && id2 !== null)       
        ids.push(id2)
    }
    if (ids.some(id => id === undefined || id === null)) 
      throw new Error('User-ID ist undefined.');
    this.checkForOwnPrivatChat(ids, id, id2)
  }


  /**
   * Checks if a private chat with the specified user IDs exists and updates the active users list.
   *
   * Retrieves usernames associated with the given IDs. If the active users list is not empty,
   * it checks if the user is already in the list. If not, it adds the user to the list.
   * If the IDs are different, it retrieves the second user's data.
   *
   * @param ids - An array of user IDs to check.
   * @param id - The first user ID.
   * @param id2 - The second user ID. Used to determine if both IDs are different for further processing.
   */
  async checkForOwnPrivatChat(ids:any, id:any, id2:any) {
    const user = await this.userService.getUsernamesByIds(ids);
    if (this.activeUsers.length > 0 ) {
      const userExists = this.activeUsers.findIndex((element: { userId: string; }) => element.userId === this.users.userId);
      if (userExists === -1) {
        this.activeUsers.push(this.users);
        if (id !== id2) 
          this.getSecondUser(user)
        this.activeUsers.push(this.users);
      }
    } else {
      this.activeUsers.push(this.users);
      if (id !== id2) 
        this.getSecondUser(user)
    }
  }


  /**
   * Sets the user data for the component.
   * 
   * @param user - An array of user objects. The first element is used to set the user data.
   * @returns {void}
   */
  setUserData(user: CustomUser[]){
    this.users = {
      name: user[0].name ? user[0].name : "",
      userId: user[0].userId ? user[0].userId : "",
      photoURL: user[0].photoURL ? user[0].photoURL : "",
      email: user[0].email ? user[0].email : "",
      status: user[0].status ? user[0].status : false,
    }
  }


  /**
   * Extracts the second user's data from the given user object and adds it to the active users list.
   *
   * @param user - An object containing user data, expected to have at least two elements where the second element is used.
   */
  getSecondUser(user:any) {
    const secondUser = {
      name: user[1].name ? user[1].name : "",
      userId: user[1].userId ? user[1].userId : "",
      photoURL: user[1].photoURL ? user[1].photoURL : "",
      email: user[1].email ? user[1].email : "",
      status: user[1].status ? user[1].status : false,
    };
    this.activeUsers.push(secondUser);
  }


  /**
   * Opens the add chat dialog component.
   * 
   * @returns {void} Nothing.
   */
  openDialog(): void {
    this.dialog.open(AddchatComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
    });
  }


  /**
   * Selects a channel and closes the private messages menu.
   *
   * @param channelId - The ID of the channel to select.
   * @returns A promise that resolves when the channel is selected.
   */
  async selectChannel(channelId: string): Promise<void> {
    this.sharedService.updateVariable('false');
    this.channelsService.selectChannel(channelId);
  }


  /**
   * Toggles the messages open state between true and false.
   * If the messages are currently open, they are closed and vice versa.
   * @returns {void} Nothing.
   */
  toggleMessagesOpen(): void {
    this.messagesOpen = !this.messagesOpen;
  }


  /**
   * Retrieves the avatar URL for a partner in the given channel.
   * 
   * If there is a conversation partner, fetches the avatar using the partner's ID.
   * If no partner is found, returns a default avatar URL.
   * 
   * @param channel The channel object containing member information.
   * @returns An observable that emits the avatar URL of the partner or a default avatar URL.
   */
  getUserAvatar(channel: Channel): Observable<string> {
    const partnerId = this.getPartnerId(channel);
    return partnerId ? this.userService.getuserAvatar(partnerId) : of('/img/avatars/avatar1.svg');
  }


  /**
   * Retrieves the name of a partner in the given channel.
   * 
   * If there is a conversation partner, fetches the name using the partner's ID.
   * If no partner is found, returns the default avatar URL.
   * 
   * @param channel The channel object containing member information.
   * @returns An observable that emits the name of the partner or the default avatar URL.
   */
  getUserName(channel: Channel): Observable<string> {
    const partnerId = this.getPartnerId(channel);
    return partnerId ? this.userService.getuserName(partnerId) : of('/img/avatars/avatar1.svg');
  }


  /**
   * Retrieves the online status of a conversation partner in the given channel.
   * 
   * If there is a conversation partner, fetches their status using the partner's ID.
   * If no partner is found, returns 'offline'.
   * 
   * @param channel The channel object containing member information.
   * @returns An observable that emits the partner's status or 'offline'.
   */
  getUserStatus(channel: Channel): Observable<string> {
    const partnerId = this.getPartnerId(channel);
    return partnerId ? this.userService.getuserStatus(partnerId) : of('offline');
  }


  /**
   * Retrieves the ID of a conversation partner in the given channel.
   * 
   * If the channel only has one member, returns the active user's ID.
   * If there are multiple members, returns the ID of the first member that is not the active user.
   * If the channel has no members, returns null.
   * 
   * @param channel The channel object containing member information.
   * @returns The ID of the conversation partner or null if no partner is found.
   */
  getPartnerId(channel: Channel): string | null {
    const userId = this.authService.userId();
    if (!channel.members || channel.members.length === 0)
        return null;
    return channel.members.length === 1 ? userId : channel.members.find(id => id !== userId) || null;
  }
}