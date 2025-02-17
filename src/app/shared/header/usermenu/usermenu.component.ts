import { Component } from '@angular/core';
import { DialogComponent } from './dialog/dialog.component';
import { CommonModule } from '@angular/common';
import { UserDialogService } from '../../services/user-dialog.service';

@Component({
  selector: 'app-usermenu',
  standalone: true,
  imports: [DialogComponent, CommonModule],
  templateUrl: './usermenu.component.html',
  styleUrl: './usermenu.component.scss',
})
export class UsermenuComponent {
  mobileDialog: boolean = false;
  constructor(public userDialog: UserDialogService) {}

  /**
   * Opens the user menu dialog, with the mobile dialog layout.
   * This sets `mobileDialog` to true, and calls `openDialog` on the `UserDialogService`.
   * @param event The event that triggered opening the dialog, passed to `openDialog`.
   */
  openMobileUserMenu(event: Event){
    this.mobileDialog = true;
    this.userDialog.openDialog(event);
  }

  /**
   * Opens the user menu dialog, with the desktop dialog layout.
   * This sets `mobileDialog` to false, and calls `openDialog` on the `UserDialogService`.
   * @param event The event that triggered opening the dialog, passed to `openDialog`.
   */
  openDesktopUserMenu(event: Event){
    this.mobileDialog = false;
    this.userDialog.openDialog(event);
  }
}

