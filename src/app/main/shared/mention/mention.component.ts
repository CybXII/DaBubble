import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ChannelsService } from '../../../shared/services/channels.service';
import { Channel } from '../../../models/channel';
import { UserService } from '../../../shared/services/user.service';
import { CommonModule } from '@angular/common';
import { MentionService } from '../../../shared/services/mention.service';

@Component({
  selector: 'app-mention',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mention.component.html',
  styleUrl: './mention.component.scss'
})
export class MentionComponent {
  @Input() builder:string = '';
  acitveUserID: string | null;
  activeChannel$: Observable<Channel | null>;
  members: any = [];
  // activeUsers: any = [];
  state:boolean = false;

  constructor(
    private messagesService: MessagesService,
    private auth: AuthService,
    private channelService: ChannelsService,
    private userService: UserService,
    private mentionService: MentionService,
  ) {
    this.acitveUserID = auth.userId();
    this.activeChannel$ = channelService.currentChannel$;
    this.getMembers();
  }

  getMembers() {
    this.activeChannel$.subscribe(channel => {
      channel?.members.forEach(member => {
        this.userService.getUserById(member).subscribe(user => {
          const data = {
            name: user.name ? user.name : '',
            photoUrl: user.photoURL ? user.photoURL : '',
            id: user.userId ? user.userId : '',
            status: user.status ? user.status : false,
            mention: false,
          }
          if(data.name !== "Unbekannt" && data.id !== this.acitveUserID) {
            this.checkMention(data.id)
            if (!this.state) {
              this.members.push(data)
            } else {
              data.mention = true;
              this.members.push(data)
              console.log("member exestiert!!", data.name)
            }
          }
        })
      })
    })
  }

  selectMember(member:any, builder = this.builder) {
    if (!member.mention) {
      member.mention = true;
      this.mentionService.mentionSomeone(member, builder);
    } else {
      member.mention = false;
      this.mentionService.disselect(member.id);
    }
  }

  checkMention(id:string) {
    this.mentionService.mentionsUser.forEach((user:any) => {
      if (id === user.id) {
        this.state = true;
      } else {
        this.state = false;
      }
    })
  }
  
}