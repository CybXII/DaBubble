import { Component, OnInit, OnDestroy } from '@angular/core';
import { collection, Firestore, onSnapshot, sortedChanges } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { AddchatComponent } from '../../addchat/addchat.component';
import { MatDialog } from '@angular/material/dialog';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { SharedService } from '../../../shared/services/newmessage.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-menu-private-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-private-messages.component.html',
  styleUrl: './menu-private-messages.component.scss',
})
export class MenuPrivateMessagesComponent implements OnInit, OnDestroy {
  messagesOpen: boolean = false;
  privateChannels: Channel[] = [];
  loading: boolean = true;
  channelMembers: { [channelId: string]: string[]; } = {};
  private unsubscribeUserListener: (() => void) | null = null;

  constructor(
    private dialog: MatDialog,
    public channelsService: ChannelsService,
    private sharedService: SharedService,
    private firestore: Firestore,
    private authService: AuthService
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
    this.unsubscribeUserListener = onSnapshot(usersCollectionRef, (snapshot) => {
      console.log('Benutzer-Änderungen erkannt:');
      snapshot.docChanges().forEach((change) => {
        console.log(`Typ der Änderung: ${change.type}`);
        if (change.type === 'modified') {
          const updatedUser = change.doc.data();
          console.log('Aktualisierter Benutzer:', updatedUser);
          this.loadPrivateChannels();
        }
      });
    });
  }


  loadPrivateChannels(): void {
    this.loading = true;
  
    this.channelsService.loadChannelsRealtime(async (channels) => {
      const privateChannels = channels.filter((channel) => channel.isPrivate);
      const rawChannelMembers = await this.channelsService.getChannelMembers(privateChannels);
      const userId = this.authService.userId()
      const channelsWithPartnerNames = await Promise.all(
        privateChannels.map(async (channel) => {
          const partnerIds = channel.members.filter((id) => id !== userId);
          const partnerNames = await this.authService.getUsernamesByIds(partnerIds);
          return {
            ...channel,
            partnerNames: partnerNames.map((user) => user.name).sort((a, b) => a.localeCompare(b)), // Sortiere die Partner-Namen alphabetisch
          };
        })
      );
      this.privateChannels = channelsWithPartnerNames.sort((a, b) => {
        const isUserAloneInA = a.members.length === 1 && a.members[0] === userId;
        const isUserAloneInB = b.members.length === 1 && b.members[0] === userId;
        if (isUserAloneInA && !isUserAloneInB) return -1;
        if (!isUserAloneInA && isUserAloneInB) return 1;
        const partnerA = a.partnerNames[0] || '';
        const partnerB = b.partnerNames[0] || '';
        return partnerA.localeCompare(partnerB);
      });
        this.channelMembers = Object.keys(rawChannelMembers).reduce((acc, channelId) => {
        acc[channelId] = rawChannelMembers[channelId];
        return acc;
      }, {} as { [channelId: string]: string[] });
      this.loading = false;
    });
  }


  openDialog(): void {
    this.dialog.open(AddchatComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
    });
  }

  selectChannel(channelId: string): void {
    this.sharedService.updateVariable('false');
    this.channelsService.selectChannel(channelId);
  }

  toggleMessagesOpen(): void {
    this.messagesOpen = !this.messagesOpen;
  }

  getAvatar(privateChannel: Channel): string {
    return '/img/avatars/avatar1.svg';
  }
}
