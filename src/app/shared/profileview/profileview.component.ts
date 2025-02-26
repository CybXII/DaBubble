import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { ChannelsService } from '../services/channels.service';
import { Channel } from '../../models/channel';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profileview',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './profileview.component.html',
  styleUrl: './profileview.component.scss'
})
export class ProfileviewComponent {
  @Input() member?:any;
  @Input() ID?:any = [];
  users: {
    name: string;
    userId: string;
    photoURL: string;
    email: string;
    status: boolean;
  } = {
    name: '',
    userId: '',
    photoURL: '',
    email: '',
    status: false,
  };


  /**
   * The constructor for the ProfileViewComponent.
   *
   * @param data An object from the MatDialog with the data to be passed
   *             to the component. This object should contain either the
   *             member to be displayed or a list of IDs.
   * @param dialogRef The MatDialogRef object of the component.
   * @param authService The AuthService used to get the active user.
   * @param channelService The ChannelsService used to get the members of
   *                       a channel.
   * @param userService The UserService used to get user data.
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ProfileviewComponent>,
    public authService: AuthService,
    public channelService: ChannelsService,
    private userService: UserService
  ) {
    if (data.member == null || '') {
      this.ID.push(data.ID)
      this.getUser();
    } else {
      this.member = data.member
    }
  }


  /**
   * Holt den Benutzer, der in `this.ID` gespeichert ist.
   * @returns {Promise<void>}
   */
  async getUser() {
    const user = await this.userService.getUsernamesByIds(this.ID);
    this.users = {
      name: user[0].name ? user[0].name : "",
      userId: user[0].userId,
      photoURL: user[0].photoURL ? user[0].photoURL : "",
      email: user[0].email ? user[0].email : "",
      status: user[0].status ? user[0].status : false,
    }
    this.member = this.users;
  }


  /**
   * Closes the profile dialog.
   */
  closeProfile() {
    this.dialogRef.close(); 
  }


  /**
   * Sends a message to the user in the profile and switches to the private channel.
   * If the channel doesn't exist, it will be created.
   * @returns {Promise<void>}
   */
  async sendMessage() {
    const currentUserId = this.authService.userId();
    const otherUserId = this.member?.userId;
    if (!currentUserId || !otherUserId) {
      console.error('Benutzer-IDs fehlen. Kanal kann nicht erstellt werden.');
      return;
    }
    try {
      const existingChannels = await this.channelService.getPrivateChannelByMembers([currentUserId, otherUserId]);
      if (existingChannels.length > 0)
        this.switchToExistingChannel(existingChannels);
      else {
        await this.createPrivateChannel(currentUserId, otherUserId);
      }
    } catch (error) {
      console.error('Fehler beim Überprüfen oder Erstellen des Channels:', error);
    }
  }


  /**
   * Switches to an existing private channel with the given members.
   *
   * @param existingChannels An array of existing channels. The first element is used.
   * @returns A promise that resolves when the channel is selected.
   */
  async switchToExistingChannel(existingChannels: Channel[]) {
    const existingChannel = existingChannels[0];
    if (existingChannel.id) {
      await this.channelService.selectChannel(existingChannel.id);
      this.closeProfile();
    }
    return;
  }


  /**
   * Creates a private channel with the given other user ID and sends a message
   * to switch to this channel.
   *
   * @param currentUserId The ID of the currently logged-in user.
   */
  async createPrivateChannel(currentUserId: string, otherUserId: string) {
    const newChannel: Channel = {
      name: 'Privater Channel',
      description: '',
      isPrivate: true,
      createdBy: currentUserId,
      members: [currentUserId, otherUserId],
    };
    await this.channelService.createChannel(newChannel);
    this.sendMessage();
    this.closeProfile();
  }
}