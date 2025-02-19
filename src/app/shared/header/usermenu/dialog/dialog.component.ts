import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { UserDialogService } from '../../../services/user-dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  @Output() dialogChange = new EventEmitter<boolean>();
  @Input() mobileDialog = false;
  activePic:number = -1 ;
  profilesPics: string[] = ['avatar2.svg','avatar1.svg','avatar3.svg','avatar6.svg','avatar5.svg','avatar4.svg',];

/**
 * Creates an instance of DialogComponent and performs an initial check 
 * to see if data changes are allowed using the UserDialogService.
 * 
 * @param userDialog$ - The service responsible for managing user dialog interactions.
 */
  constructor(public userDialog$: UserDialogService,) {
    this.userDialog$.dataChangeAllowedCheck();
  }


/**
 * Opens the user profile dialog with a mobile layout.
 * This method calls `openProfile` on the `UserDialogService`.
 */
  onOpenMobileProfile(){
    this.userDialog$.openProfile();
  }

  /**
   * Sets the active profile picture.
   * @param {number} index - The index of the selected profile picture.
   */
  setActive(index:number) {
    this.activePic = index;
  }

  /**
  * Sets the profile picture of the user.
  */
  setProfilePic() {
    this.userDialog$.photoUrl = `img/avatars/${this.profilesPics[this.activePic]}`
    this.userDialog$.saveProfile();
    this.userDialog$.profilePic = false;
  }

}
