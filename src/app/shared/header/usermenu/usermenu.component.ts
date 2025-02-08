import { Component, Inject, inject } from '@angular/core';
import { DialogComponent } from './dialog/dialog.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UserModel } from '../../../models/user';
import { UserDialogService } from '../../services/user-dialog.service';

@Component({
  selector: 'app-usermenu',
  standalone: true, // <-- Add this line
  imports: [DialogComponent, CommonModule],
  templateUrl: './usermenu.component.html',
  styleUrl: './usermenu.component.scss',
})
export class UsermenuComponent {
  mobileDialog: boolean = false;
  constructor(public userDialog: UserDialogService) {}

  openMobileUserMenu(event: Event){
    this.mobileDialog = true;
    console.log('opening mobile');
    this.userDialog.openDialog(event);
  }

  openDesktopUserMenu(event: Event){
    this.mobileDialog = false;
    this.userDialog.openDialog(event);
  }
}

