import { Component } from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { Channel } from '../../../models/channel';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-mainchat-header',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './mainchat-header.component.html',
  styleUrl: './mainchat-header.component.scss'
})
export class MainchatHeaderComponent {
  private avatarCache = new Map<string, string>();
  avatarsLoaded = false;
  memberAvatars: { [key: string]: string } = {};
  channelTitle: string = '';
  channel: Observable<Channel | null>;
  channelMembers: { id: string; photoURL: string }[] = [];
  loading = true;
  constructor(private channelsService: ChannelsService, private authService: AuthService) {
    this.channel = this.channelsService.currentChannel$;  
  
  }

    ngOnInit(): void {
      this.channel.subscribe(async (channel) => {
        if (channel) {
          this.channelTitle = channel.name;
          await this.loadMemberAvatars(channel.members).then((memberAvatars) => {
          this.channelMembers = memberAvatars;
          });
        }
      });
    }


  /**
   * Lädt Avatare für alle Channel-Mitglieder.
   */
  private async loadMemberAvatars(members: string[]): Promise<{ id: string; photoURL: string }[]> {
    const memberAvatars: { id: string; photoURL: string }[] = [];
    for (const memberId of members) {
      const avatarUrl = await this.authService.getCachedAvatar(memberId);
      memberAvatars.push({ id: memberId, photoURL: avatarUrl });
    }
    return memberAvatars;
  }
    currentChannel() {
      return this.channelsService.currentChannel$;
    }
}
