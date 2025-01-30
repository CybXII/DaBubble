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
    public userDialog: UserDialogService
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
        console.log('Benutzer-Änderungen erkannt:');
        snapshot.docChanges().forEach((change) => {
          console.log(`Typ der Änderung: ${change.type}`);
          if (change.type === 'modified') {
            const updatedUser = change.doc.data();
            console.log('Aktualisierter Benutzer:', updatedUser);
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
      ids.push(id2)
    }
    console.log(ids)
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
    // Den Benutzer von id2 hinzufügen
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
    console.warn(this.activeUsers)
  }

  toggleMessagesOpen(): void {
    this.messagesOpen = !this.messagesOpen;
  }

  getAvatar(privateChannel: Channel): string {
    return '/img/avatars/avatar1.svg';
  }
}


// const sortPromises = channelsWithPartnerNames.map(async (channel) => {
//   const partnerA = channel.partnerNames[0] || '';
//   const partnerB = channel.partnerNames[1] || '';
//   const memberA = channel.members[1] !== userId ? channel.members[1] : undefined;
//   const memberB = channel.members[2] !== userId ? channel.members[2] : undefined;
  
//   let userA = null;
//   let userB = null;

//   if (memberA && memberB) {
//     userA = await this.getUser(memberA, memberB);
//     userB = await this.getUser(memberB, memberA);
//   }

//   const isUserAloneInA = channel.members.length === 1 && channel.members[0] === userId;
//   return { channel, partnerA, partnerB, userA, userB, isUserAloneInA };
// });

// const sortedChannels = (await Promise.all(sortPromises))
//   .sort((a, b) => {
//     const isUserAloneInA = a.channel.members.length === 1 && a.channel.members[0] === userId;
//     const isUserAloneInB = b.channel.members.length === 1 && b.channel.members[0] === userId;
//     if (isUserAloneInA && !isUserAloneInB) return -1;
//     if (!isUserAloneInA && isUserAloneInB) return 1;
//     return a.partnerA.localeCompare(b.partnerB);
//   })
//   .map(({ channel }) => channel);

// this.privateChannels = sortedChannels;
