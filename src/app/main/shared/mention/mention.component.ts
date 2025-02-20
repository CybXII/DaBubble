import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
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
  private unsubscribeFn: (() => void) | null = null;
  @Input() builder:string = '';
  acitveUserID: string | null;
  activeChannel$: Observable<Channel | null>;
  members: any = [];
  state:boolean = false;
  channels: Channel[] = [];

  /**
   * Constructor for the MentionComponent.
   * Subscribes to the currently active channel and loads the members of this channel.
   * Also sets the active user ID.
   * @param auth The AuthService to get the active user ID.
   * @param channelService The ChannelService to subscribe to the active channel.
   * @param userService The UserService to load the members of the channel.
   * @param mentionService The MentionService to handle the mention logic.
   */
  constructor(
    private auth: AuthService,
    private channelService: ChannelsService,
    private userService: UserService,
    public mentionService: MentionService,
  ) {
    this.acitveUserID = this.auth.userId();
    this.activeChannel$ = this.channelService.currentChannel$;
    this.getMembers();
  }


  /**
   * Subscribes to the currently active channel and loads the members of this channel.
   *
   * For each member, it calls the checkMentions method to check if the member is already mentioned.
   * If the member is not mentioned, it adds the member to the members array.
   */
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
          this.checkMentions(data);
        })
      })
    })
  }


  /**
   * Checks if the member is already mentioned and adds the member to the members array.
   *
   * If the member is not mentioned, it adds the member to the members array.
   * If the member is already mentioned, it sets the mention property of the member to true.
   * @param data The member to be checked with the properties name, photoUrl, id, status, and mention.
   */
  checkMentions(data: {name: string; photoUrl: string; id: string; status: boolean; mention: boolean;}) {
    if(data.name !== "Unbekannt" && data.id !== this.acitveUserID) {
      this.checkMention(data.id)
      if (!this.state) {
        this.members.push(data)
      } else {
        data.mention = true;
        this.members.push(data)
      }
    }
  }


  /**
   * Selects a member and updates the mention property of the member.
   *
   * If the member is not mentioned, it sets the mention property to true and calls the mentionSomeone method of the MentionService.
   * If the member is already mentioned, it sets the mention property to false and calls the disselect method of the MentionService.
   * @param member The member object containing the user data to be selected.
   * @param builder The builder string indicating the component to be used for the mention. Default is the builder string of the component.
   */
  selectMember(member:any, builder = this.builder) {
    if (!member.mention) {
      member.mention = true;
      this.mentionService.mentionSomeone(member, builder);
    } else {
      member.mention = false;
      this.mentionService.disselect(member.id);
    }
  }


  /**
   * Checks if the member with the given id is already mentioned.
   *
   * Loops through the mentionsUser array of the MentionService and checks if the id of the member matches the id of a user in the array.
   * If it does, it sets the state property to true, else it sets it to false.
   * @param id The id of the member to be checked.
   */
  checkMention(id:string) {
    this.mentionService.mentionsUser.forEach((user:any) => {
      if (id === user.id) {
        this.state = true;
      } else {
        this.state = false;
      }
    })
  }


  

  /**
   * Initializes the component by loading the channels in real-time.
   */
  ngOnInit(): void {
    this.loadChannelsRealtime();
    console.log("läuft")
  }

  /**
   * Cleans up the component by unsubscribing from the Firestore channel list
   * listener. This is necessary to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
    }
  }

  /**
   * Loads the channels in real-time from Firestore. This method is called in ngOnInit()
   * and unsubscribes in ngOnDestroy() to prevent memory leaks.
   */
  loadChannelsRealtime(): void {
    this.unsubscribeFn = this.channelService.loadChannelsRealtime((channels) => {
      channels.forEach((channel) => {
        if (!channel.isPrivate) {
          this.channels.push(channel);
        } else {
          null
        }
      })
      console.log(this.channels)
    });
  }

  selectChannel(channel:string) {
    this.mentionService.mentionChannel(channel, this.builder)
    this.mentionService.channelSelection = false;
  }
}