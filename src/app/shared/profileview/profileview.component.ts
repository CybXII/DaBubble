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

  async getUser() {
    const user = await this.userService.getUsernamesByIds(this.ID);
    this.users = {
      name: user[0].name ? user[0].name : "",
      userId: user[0].userId,
      photoURL: user[0].photoURL ? user[0].photoURL : "",
      email: user[0].email ? user[0].email : "",
      status: user[0].status ? user[0].status : false,
    }
    // console.log(this.users);
    this.member = this.users;
  }

  closeProfile() {
    this.dialogRef.close(); 
  }

  async sendMessage() {
    const currentUserId = this.authService.userId();
    const otherUserId = this.member?.userId;

    if (!currentUserId || !otherUserId) {
      console.error('Benutzer-IDs fehlen. Kanal kann nicht erstellt werden.');
      return;
    }

    try {
      // Prüfe, ob ein privater Channel existiert
      const existingChannels = await this.channelService.getPrivateChannelByMembers([currentUserId, otherUserId]);

      if (existingChannels.length > 0) {
        const existingChannel = existingChannels[0];
        if (existingChannel.id) {
          console.log('Zu bestehendem Channel wechseln:', existingChannel.id);
          await this.channelService.selectChannel(existingChannel.id);
          this.closeProfile();
        }
        return;
      }
      // Erstelle einen neuen privaten Channel
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
      console.log('Privater Channel erfolgreich erstellt:', newChannel);
    } catch (error) {
      console.error('Fehler beim Überprüfen oder Erstellen des Channels:', error);
    }
  }
}




// const currentUserId = this.authService.userId();
// const otherUserId = this.member?.userId;

// if (!currentUserId || !otherUserId) {
//   console.error('Benutzer-IDs fehlen. Kanal kann nicht erstellt werden.');
//   return;
// }

// try {
//   // Prüfe, ob ein privater Channel existiert
//   const existingChannels = await this.channelService.getPrivateChannelByMembers([currentUserId, otherUserId]);

//   if (existingChannels.length > 0) {
//     const existingChannel = existingChannels[0];
//     if (existingChannel.id) {
//       console.log('Zu bestehendem Channel wechseln:', existingChannel.id);
//       await this.channelService.selectChannel(existingChannel.id);
//     }
//     return;
//   }

//   // Erstelle neuen privaten Channel
//   const newChannel: Channel = {
//     name: 'Privater Channel',
//     description: '',
//     isPrivate: true,
//     createdBy: currentUserId,
//     members: [currentUserId, otherUserId],
//   };