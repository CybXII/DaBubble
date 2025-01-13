import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddchatComponent } from '../../addchat/addchat.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChannelsService } from '../../../shared/services/channels.service';
import { MatDialog } from '@angular/material/dialog';
import { Channel } from '../../../models/channel';
import { SharedService } from '../../../shared/services/newmessage.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-menu-private-messages',
  standalone: true,   // <-- Add this line
  imports: [CommonModule],
  templateUrl: './menu-private-messages.component.html',
  styleUrl: './menu-private-messages.component.scss'
})
export class MenuPrivateMessagesComponent {
  messagesOpen: boolean = false

  private unsubscribeFn: (() => void) | null = null;
  privateChannels: Channel[] = [];
  loading: boolean = true;
  currentChannelId: string | null = null;
  conversationPartnerName = '';
  channelMembers: { [channelId: string]: string[] } = {}; 


  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public channelsService: ChannelsService,
    private sharedService: SharedService,
    private authService: AuthService
    ) {}


    ngOnInit(): void {
      this.loadChannelsRealtime();
    }


    ngOnDestroy(): void {
      if (this.unsubscribeFn) {
        this.unsubscribeFn();
      }
    }


    loadChannelsRealtime(): void {
      this.loading = true;
      this.unsubscribeFn = this.channelsService.loadChannelsRealtime(async (channels) => {
        this.privateChannels = channels.filter(channel => channel.isPrivate);
        this.channelMembers = {};
        for (const channel of this.privateChannels) {
          if (!channel.id) {
            console.error('Channel hat keine ID:', channel);
            continue;
          }
          const memberIds = channel.members.filter(id => id !== this.authService.userId());
          const usernames = await this.authService.getUsernamesByIds(memberIds);
          this.channelMembers[channel.id] = usernames.map(user => user.name);
        }
        this.loading = false;
      });
    }
    
  
    getConversationPartnerName(channelId: string): string {
      const members = this.channelMembers[channelId];
      return members && members.length > 0 ? members[0] : 'Unbekannt';
    }


    async addChannel(): Promise<void> {
      console.error('addChannel() wurde nicht implementiert.');
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
      this.channelsService.selectChannel(channelId)
    }


  toggleMessagesOpen(): void {
    this.messagesOpen = !this.messagesOpen
  }

  getAvatar(privateChannel: Channel): string {
    return '/img/avatars/avatar1.svg';
  }


}
