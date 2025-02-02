import { Component, OnInit, OnDestroy } from '@angular/core';
import { collection, Firestore, onSnapshot, sortedChanges } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { AddchatComponent } from '../../addchat/addchat.component';
import { MatDialog } from '@angular/material/dialog';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { SharedService } from '../../../shared/services/newmessage.service';
import { AuthService } from '../../../shared/services/auth.service';
import { UserDialogService } from '../../../shared/services/user-dialog.service';
import { UserService } from '../../../shared/services/user.service';
import { BehaviorSubject, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-menu-private-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-private-messages.component.html',
  styleUrl: './menu-private-messages.component.scss',
})


export class MenuPrivateMessagesComponent implements OnInit, OnDestroy {
  messagesOpen: boolean = true; // changed by christoph
  privateChannels: Channel[] = [];
  loading: boolean = true;
  channelMembers: { [channelId: string]: string[] } = {};
  private unsubscribeUserListener: (() => void) | null = null;
  private avatarCache = new Map<string, BehaviorSubject<string>>();
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


  constructor(
    private dialog: MatDialog,
    public channelsService: ChannelsService,
    private sharedService: SharedService,
    private firestore: Firestore,
    private authService: AuthService,
    public userDialog: UserDialogService,
    private userService: UserService
  ) {}


  ngOnInit(): void {
    this.loadPrivateChannels();
    this.subscribeToAllUsers();
  }


  ngOnDestroy(): void {
    if (this.unsubscribeUserListener) {
      this.unsubscribeUserListener();
      console.log('Benutzer-Listener entfernt.');
    }
  }


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


  async loadPrivateChannels(): Promise<void> {
    this.loading = true;
    this.channelsService.loadChannelsRealtime(async (channels) => {
      const privateChannels = channels.filter((channel) => channel.isPrivate);
      const rawChannelMembers = await this.channelsService.getChannelMembers(
        privateChannels
      );
      const userId = this.authService.userId();
      const channelsWithPartnerNames = await Promise.all(
        privateChannels.map(async (channel) => {
          const partnerIds = channel.members.filter((id) => id !== userId);
          const partnerNames = await this.authService.getUsernamesByIds(
            partnerIds
          );
          return {
            ...channel,
            partnerNames: partnerNames
              .map((user) => user.name)
              .sort((a, b) => a.localeCompare(b)), // Sortiere die Partner-Namen alphabetisch
          };
        })
      );
      this.privateChannels = channelsWithPartnerNames.sort((a, b) => {
        const isUserAloneInA =
          a.members.length === 1 && a.members[0] === userId;
        const isUserAloneInB =
          b.members.length === 1 && b.members[0] === userId;
        if (isUserAloneInA && !isUserAloneInB) return -1;
        if (!isUserAloneInA && isUserAloneInB) return 1;
        const partnerA = a.partnerNames[0] || '';
        const partnerB = b.partnerNames[0] || '';
        this.getUser(a.members[1], b.members[1])
        return partnerA.localeCompare(partnerB);
      });
      this.channelMembers = Object.keys(rawChannelMembers).reduce(
        (acc, channelId) => {
          acc[channelId] = rawChannelMembers[channelId];
          return acc;
        },
        {} as { [channelId: string]: string[] }
      );
      this.loading = false;
    });
  }

  async getUser(id:any, id2:any) {
    const ids = [id];
    if (id !== id2) {
      if (id2 !== undefined && id2 !== null) {        
        ids.push(id2)
      }
    }

    if (ids.some(id => id === undefined || id === null)) {
      console.error('[MenuPrivateMessagesComponent] ❌ FEHLER: Mindestens eine User-ID ist undefined oder null:', ids);
      throw new Error('[MenuPrivateMessagesComponent] ❌ FATAL ERROR: Eine User-ID ist undefined. Stacktrace:');
    }
    const user = await this.authService.getUsernamesByIds(ids);
    this.users = {
      name: user[0].name ? user[0].name : "",
      userId: user[0].userId ? user[0].userId : "",
      photoURL: user[0].photoURL ? user[0].photoURL : "",
      email: user[0].email ? user[0].email : "",
      status: user[0].status ? user[0].status : false,
    }
    if (this.activeUsers.length > 0 ) {
      const userExists = this.activeUsers.findIndex((element: { userId: string; }) => element.userId === this.users.userId);
      if (userExists === -1) {
        this.activeUsers.push(this.users);
        if (id !== id2) {
          this.getSecondUser(user)
        }
        this.activeUsers.push(this.users);
      }
    } else {
      this.activeUsers.push(this.users);
      if (id !== id2) {
        this.getSecondUser(user)
      }
    }
  }


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

  openDialog(): void {
    this.dialog.open(AddchatComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
    });
  }


  async selectChannel(channelId: string): Promise<void> {
    this.sharedService.updateVariable('false');
    this.channelsService.selectChannel(channelId);
  }


  toggleMessagesOpen(): void {
    this.messagesOpen = !this.messagesOpen;
  }


  getUserAvatar(channel: Channel): Observable<string> {
    const partnerId = this.getPartnerId(channel);
    return partnerId ? this.userService.getuserAvatar(partnerId) : of('/img/avatars/avatar1.svg');
  }


  getUserName(channel: Channel): Observable<string> {
    const partnerId = this.getPartnerId(channel);
    return partnerId ? this.userService.getuserName(partnerId) : of('/img/avatars/avatar1.svg');
  }


  getUserStatus(channel: Channel): Observable<string> {
    const partnerId = this.getPartnerId(channel);
    return partnerId ? this.userService.getuserStatus(partnerId) : of('offline');
  }


  getPartnerId(channel: Channel): string | null {
    const userId = this.authService.userId();
    if (!channel.members || channel.members.length === 0) {
        return null;
    }
    return channel.members.length === 1
        ? userId
        : channel.members.find(id => id !== userId) || null;
  }
}