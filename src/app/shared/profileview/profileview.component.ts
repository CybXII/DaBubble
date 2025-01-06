import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../../models/user';

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
  ) {
    if (data.member == null || '') {
      this.ID.push(data.ID)
      this.getUser();
    } else {
      this.member = data.member
    }
  }

  async getUser() {
    const user = await this.authService.getUsernamesByIds(this.ID);
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

  sendMessage() {
    console.log(this.member);
  }
}
