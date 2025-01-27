import { Component, Input } from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { Channel } from '../../../models/channel';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';
import { MenuDialogComponent } from "../../../shared/menu-dialog/menu-dialog.component";
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-mainchat-header',
  imports: [CommonModule, MenuDialogComponent],
  standalone: true,
  templateUrl: './mainchat-header.component.html',
  styleUrl: './mainchat-header.component.scss'
})


export class MainchatHeaderComponent {
  avatarCache = new Map<string, string>();
  avatarsLoaded = false;
  memberAvatars: { [key: string]: string } = {};
  channelTitle: string = '';
  channelDescription: string | undefined = '';
  channelId: string | undefined = '';
  channel: Observable<Channel | null>;
  channelMembers: { id: string; photoURL: string }[] = [];
  loading = true;
  channelMembersNames: { [channelId: string]: string[]; } = {};
  menuDialog: boolean = false;
  membersDialog: boolean = false;
  channelDialog: boolean = false;
  dialogData: any = null;
  channelCreator: string = '';
  channelCreatorId: string = '';
  isPrivate: boolean = false;
  convPartner: string = '';
  private subscriptions = new Subscription();
  constructor(private channelsService: ChannelsService, private authService: AuthService, private cdr: ChangeDetectorRef) {
    this.channel = this.channelsService.currentChannel$ as Observable<Channel | null>; 
  }


  ngOnInit(): void {
    this.subscriptions.add(
    this.channelsService.currentChannel$.subscribe((channel) => {
      if (channel) {
        this.channelTitle = channel.name;
        this.channelId = channel.id;
        this.channelDescription = channel.description;
        this.channelCreatorId = channel.createdBy;
        this.isPrivate = channel.isPrivate;
        const members = channel.members.map((memberId) => ({
          id: memberId,
          photoURL: this.authService.avatarCache.get(memberId),
        }));
        this.loadMemberAvatars(members).then((memberAvatars) => {
          this.channelMembers = memberAvatars;
          this.channelMembersNames[channel.id || ''] = [];
          const memberIds = channel.members;
          this.authService.getUsernamesByIds(memberIds).then((userDetails) => {
            if (userDetails) {
              userDetails.forEach((user) => {
                this.channelMembersNames[channel.id || ''].push(user.name);
              });
              this.convPartner = this.getConversationName();
            }
          });
        });
        this.authService.getUsernamesByIds([channel.createdBy]).then((creatorDetails) => {
          if (creatorDetails && creatorDetails.length > 0) {
            this.channelCreator = creatorDetails[0].name;
          }
        });
      }
    })
  );
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  private async loadMemberAvatars(members: { id: string; photoURL?: string }[]): Promise<{ id: string; photoURL: string }[]> {
    const memberAvatars: { id: string; photoURL: string }[] = [];
    for (const member of members) {
      let avatarUrl = member.photoURL || this.avatarCache.get(member.id);
      if (!avatarUrl) {
        avatarUrl = await this.authService.getCachedAvatar(member.id);
        this.avatarCache.set(member.id, avatarUrl);
      }
      memberAvatars.push({ id: member.id, photoURL: avatarUrl });
    }
    return memberAvatars;
  }


  onDialogSwitch(event: { from: string; to: string }) {
    this.closeAllDialogs();
    this.cdr.detectChanges();
    if (event.to === 'menuDialog') {
      this.menuDialog = true;
    } else if (event.to === 'membersDialog') {
      this.membersDialog = true;
    } else if (event.to === 'channelDialog') {
      this.channelDialog = true;
    }
    console.log(`Dialog switched: from ${event.from} to ${event.to}`);
  }


  currentChannel() {
    return this.channelsService.currentChannel$;
  }


  loadMessageAvatars(messages: { createdBy: string; photoURL?: string }[]): void {
    for (const message of messages) {
      if (!message.photoURL) {
        this.authService.getCachedAvatar(message.createdBy).then((avatarUrl) => {
          message.photoURL = avatarUrl;
        });
      }
    }
  }


  openDialog(menu: string) {
    this.closeAllDialogs();
    this.dialogData = {
      name: this.channelTitle,
      members: this.channelMembers,
      description: this.channelDescription,
      creator: this.channelCreator,
      createdBy: this.channelCreatorId,
      channelId: this.channelId,
      isPrivate: this.isPrivate
    };
    console.log(this.dialogData);
    if (menu === 'membersDialog') {
      console.log(this.dialogData.members);
      this.membersDialog = true;
    } else if (menu === 'menuDialog') {
      this.menuDialog = true;
    } else if (menu === 'channelDialog') {
      this.channelDialog = true;
    }
    this.cdr.detectChanges();
  }
  

  closeAllDialogs() {
    this.cdr.detectChanges();
    this.menuDialog = false;
    this.membersDialog = false;
    this.channelDialog = false;
  }


  onDialogChange(newValue: boolean, menu: string) {
    this.closeAllDialogs();
    if (menu === 'membersDialog') 
      this.membersDialog = newValue;
    else if (menu === 'menuDialog')
      this.menuDialog = newValue;
    else if (menu === 'channelDialog') 
      this.channelDialog = newValue;
  }


  closeDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
    this.menuDialog = false;
    this.membersDialog = false;
    this.channelDialog = false;
  }


  get userData() {
    return this.authService.userData();
  }

getConversationName(): string {
  if (this.channelId && this.channelMembersNames) {
    const memberNames = this.channelMembersNames[this.channelId];
    if (!memberNames || memberNames.length === 0) {
      return 'Unbekannt';
    }
    if (memberNames.length === 1) {
      return this.authService.currentUser()?.name || 'Unbekannt';
    }
    if (memberNames.length > 1) {
      const currentUserName = this.authService.currentUser()?.name;
      const conversationPartners = memberNames.filter(
        (name) => name !== currentUserName
      );
      if (conversationPartners.length > 0) {
        return conversationPartners[0]; 
      }
    }
  }
  return 'Unbekannt';
}

  
}