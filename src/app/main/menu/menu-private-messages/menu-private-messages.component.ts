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
        
          // Überprüfen der Member-IDs
          const memberIds = channel.members;
        
          if (memberIds.length === 2) {
            // Wenn zwei Member vorhanden sind, Conversation-Partner-ID filtern
            const conversationPartnerId = memberIds.find(id => id !== this.authService.userId());
            if (conversationPartnerId) {
              const usernames = await this.authService.getUsernamesByIds([conversationPartnerId]);
              this.channelMembers[channel.id] = usernames.map(user => user.name);
            } else {
              this.channelMembers[channel.id] = ['Unbekannt'];
            }
          } else if (memberIds.length === 1 && memberIds[0] === this.authService.userId()) {
            // Wenn nur ein Member vorhanden ist, und dieser der User selbst ist
            const currentUserId = this.authService.userId();
            if (currentUserId) {
              const currentUser = await this.authService.getUsernamesByIds([currentUserId]);
              this.channelMembers[channel.id] = currentUser.map(user => `${user.name} (Du)`);
            } else {
              this.channelMembers[channel.id] = ['Unbekannt'];
            }
          } else {
            // Fallback für unerwartete Fälle
            this.channelMembers[channel.id] = ['Unbekannt'];
          }
        }
    
        console.log(this.channelMembers);
        this.loading = false;
      });
    }    
  
    getConversationPartnerName(channelId: string): string { 
      const members = this.channelMembers[channelId];
      
      // Prüfen, ob nur ein Member existiert und dieser der angemeldete Benutzer ist
      // console.log (members)
      if (members.length === 1 && members[0] === this.authService.userId()) {
        const currentUserName = this.authService.currentUser()?.name || 'Unbekannt';
        return `${members[0]} (Du)`;
      }

      if (!members || members.length === 0) {
        return 'Unbekannt';
      }
    

    
      // Anderenfalls den ersten Member ausgeben
      return members[0];
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
