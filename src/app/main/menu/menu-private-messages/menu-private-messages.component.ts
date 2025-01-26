import { Component, OnInit, OnDestroy } from '@angular/core';
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
  styleUrl: './menu-private-messages.component.scss'
})
export class MenuPrivateMessagesComponent implements OnInit, OnDestroy {
  messagesOpen: boolean = false;
  privateChannels: Channel[] = [];
  loading: boolean = true;
  channelMembers: { [channelId: string]: string[] } = {};

  private unsubscribeFn: (() => void) | null = null;

  constructor(
    private dialog: MatDialog,
    public channelsService: ChannelsService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadPrivateChannels();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
    }
  }

  loadPrivateChannels(): void {
    this.loading = true;
    this.unsubscribeFn = this.channelsService.loadChannelsRealtime(async (channels) => {
      this.privateChannels = channels.filter((channel) => channel.isPrivate);
      this.channelMembers = await this.channelsService.getChannelMembers(this.privateChannels);
      this.loading = false;
    });
  }

  getConversationPartnerName(channelId: string): string {
    return this.channelsService.getConversationPartnerName(channelId, this.channelMembers);
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