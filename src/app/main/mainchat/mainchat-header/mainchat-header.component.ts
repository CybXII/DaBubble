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
  avatarCache = new Map<string, string>();
  avatarsLoaded = false;
  memberAvatars: { [key: string]: string } = {};
  channelTitle: string = '';
  channel: Observable<Channel | null>;
  channelMembers: { id: string; photoURL: string }[] = [];
  loading = true;
  open = false;
  active:string = '';
  
  constructor(private channelsService: ChannelsService, private authService: AuthService) {
    this.channel = this.channelsService.currentChannel$;  
  
  }

  ngOnInit(): void {
    this.channel.subscribe((channel) => {
      if (channel) {
        this.channelTitle = channel.name;
        const members = channel.members.map((memberId) => ({
          id: memberId,
          photoURL: this.authService.avatarCache.get(memberId),
        }));
        this.loadMemberAvatars(members).then((memberAvatars) => {
          this.channelMembers = memberAvatars;
          this.loading = false;
        });
      }
    });
  }


  /**
   * Lädt Avatare für alle Channel-Mitglieder.
   */
  private async loadMemberAvatars(members: { id: string; photoURL?: string }[]): Promise<{ id: string; photoURL: string }[]> {
    const memberAvatars: { id: string; photoURL: string }[] = [];
    
    for (const member of members) {
      let avatarUrl = member.photoURL || this.avatarCache.get(member.id); // Nutze Cache oder vorhandene URL
  
      if (!avatarUrl) {
        // Falls der Avatar nicht vorhanden ist, lade ihn
        avatarUrl = await this.authService.getCachedAvatar(member.id);
        this.avatarCache.set(member.id, avatarUrl); // Im Cache speichern
      }
  
      memberAvatars.push({ id: member.id, photoURL: avatarUrl });
    }
    return memberAvatars;
  }

  currentChannel() {
    return this.channelsService.currentChannel$;
  }

  loadMessageAvatars(messages: { createdBy: string; photoURL?: string }[]): void {
    for (const message of messages) {
      if (!message.photoURL) {
        // Nur laden, wenn keine photoURL vorhanden ist
        this.authService.getCachedAvatar(message.createdBy).then((avatarUrl) => {
          message.photoURL = avatarUrl;
        });
      }
    }
  }

  addPeople() {
    this.active = 'addPeople'
    this.open = true;
  }

  showAddedPeople() {
    this.active = 'showPeople'
    this.open = true;
  }

  closeDialog() {
    this.open = false;
  }
}