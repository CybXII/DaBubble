import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Channel } from '../../../models/channel';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { UserModel } from '../../../models/user';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-user-to-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user-to-channel.component.html',
  styleUrl: './add-user-to-channel.component.scss'
})

export class AddUserToChannelComponent{
  @Input() active = '';
  @Input() channelName = '';
  @Input() ids:string[] = [];
  @Output() close = new EventEmitter<void>();
  memberIDs: any[] = [];
  members: any[] = [];
  channel: Observable<Channel | null>;
  loading = true;
  userArray:any;
  profileOpen:boolean = false;
  activeMember: {
    name: string,
    email: string,
    status:boolean,
    avatar: string,
  } = {
    name: '',
    email: '',
    status: false,
    avatar: '',
  };


  /**
   * Constructs a new instance of the AddUserToChannelComponent.
   *
   * Initializes the component by subscribing to the current channel observable and clearing the
   * members and member IDs arrays.
   *
   * @param channelsService - The service providing the current channel data.
   * @param firestore - The Firestore database service.
   */
  constructor(
    private channelsService: ChannelsService, 
    private firestore: Firestore,
  ) {
    this.channel = this.channelsService.currentChannel$;
    this.members.splice(0);
    this.memberIDs.splice(0);
  }


  /**
   * Initializes the component by subscribing to the current channel observable and retrieving
   * the member IDs of the channel. Calls the getData method to retrieve the user data.
   */
  ngOnInit(): void {
    this.channel.subscribe((channel) => {
      if (channel) {
        const members = channel.members.map((memberId) => ({
          id: memberId,
        }));
        for (let i = 0; i < members.length; i++) {
          let meb = members[i].id
          this.memberIDs.push(meb)
        }
        this.getData();
      }
    });
  }


  /**
   * Retrieves user data for the members of the current channel.
   * Loops through the member IDs and uses the Firestore getDoc method to retrieve the user data.
   * Stores the user data in the members array.
   * @returns {Promise<void>}
   */
  async getData() {
    let Uid;
      if (this.members.length <= this.memberIDs.length) {
        for (let i = 0; i < this.memberIDs.length; i++) {
          const id = this.memberIDs[i];
          Uid = id;
          if (Uid) {
            const Ref = doc(this.firestore, `users/${Uid}`);
            const coll = await getDoc(Ref)
            this.userArray = { ...coll.data() } as UserModel;
            this.members.push(this.userArray)
          } else {
          }
        }
      }
  }


  /**
   * Emits the close event to notify parent components that the user has requested to close the component.
   */
  onClose() {
    this.close.emit();
  }


  /**
   * Prevents the event from propagating up the DOM tree, effectively canceling 
   * any further event handling.
   * @param event The event to stop propagating.
   */
  stopPropagation(event:any) {
    event.stopPropagation();
  }


  /**
   * Opens the profile of the user with the given id.
   * @param id The id of the user to open the profile of.
   */
  openProfile(id: string) {
    for (let i = 0; i < this.members.length; i++) {
      const element = this.members[i];
      if (element.userId === id) {
        this.activeMember.name = element.name;
        this.activeMember.email = element.email;
        this.activeMember.status = element.status;
        this.activeMember.avatar = element.photoURL;
      }
    }
    this.profileOpen = true;
  }


  /**
   * Closes the profile view by setting `profileOpen` to false.
   */
  closeProfile() {
    this.profileOpen = false;
  }
}
