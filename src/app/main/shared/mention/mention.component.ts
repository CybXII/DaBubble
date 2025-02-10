import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ChannelsService } from '../../../shared/services/channels.service';
import { Channel } from '../../../models/channel';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-mention',
  standalone: true,
  imports: [],
  templateUrl: './mention.component.html',
  styleUrl: './mention.component.scss'
})
export class MentionComponent {
  acitveUserID: string | null;
  activeChannel$: Observable<Channel | null>;
  members: any = [];
  activeUsers: any = [];

  constructor(
    private messagesService: MessagesService,
    private auth: AuthService,
    private channelService: ChannelsService,
    private userService: UserService,
  ) {
    this.acitveUserID = auth.userId();
    this.activeChannel$ = channelService.currentChannel$;
    this.getMembers();
  }

  getMembers() {
    this.activeChannel$.subscribe(channel => {
      console.log("Mitglieder :", channel?.members)
      channel?.members.forEach(member => {
        this.userService.getUserById(member).subscribe(user => {
          const data = {
            name: user.name ? user.name : '',
            photoUrl: user.photoURL ? user.photoURL : '',
            id: user.userId ? user.userId : '',
          }
          this.members.push(data)
        })
      })
      console.warn(this.members)
    })
  }
  
}