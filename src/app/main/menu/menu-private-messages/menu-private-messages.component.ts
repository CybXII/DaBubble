import { Component, OnInit, OnDestroy } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { AddchatComponent } from '../../addchat/addchat.component';
import { MatDialog } from '@angular/material/dialog';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { SharedService } from '../../../shared/services/newmessage.service';

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
    private firestore: Firestore
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
      this.privateChannels = channels.filter((channel) => channel.isPrivate);
      const rawChannelMembers = await this.channelsService.getChannelMembers(this.privateChannels);
      this.channelMembers = Object.keys(rawChannelMembers).reduce((acc, channelId) => {
        acc[channelId] = rawChannelMembers[channelId]; // Direkt die Namen übernehmen
        return acc;
      }, {} as { [channelId: string]: string[] }); // Typ auf string[] ändern
      this.loading = false;
      console.log('Private Channels geladen:', this.privateChannels);
      console.log('Channel Members:', JSON.stringify(this.channelMembers, null, 2));
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
