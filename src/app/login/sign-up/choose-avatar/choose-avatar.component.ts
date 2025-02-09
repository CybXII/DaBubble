import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

/**
 * ChooseAvatarComponent - A component that allows users to choose an avatar during sign-up.
 */
@Component({
  selector: 'app-choose-avatar',
  imports: [ CommonModule ],
  standalone: true,   // <-- Add this line
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})
export class ChooseAvatarComponent {

  /**
   * activePic - Index of the currently active (selected) profile picture.
   */
  activePic:number = -1 ;

  /**
   * profilesPics - Array of profile picture filenames.
   */
  profilesPics: string[] = ['avatar2.svg','avatar1.svg','avatar3.svg','avatar6.svg','avatar5.svg','avatar4.svg',];

  /**
   * path - Path to the profile pictures directory.
   */
  path:string = "/img/avatars/";

  /**
   * Constructor for ChooseAvatarComponent.
   * @param {Router} router - The Angular Router service.
   * @param {AuthService} auth - The authentication service.
   */
  constructor(private router: Router, private auth: AuthService) {}

  /**
   * userData - Object to hold user sign-up data.
   */
  @Input() userData: any = {
    name: "",
    email: "",
    password: "",
    privacy: false,
    photoURL: "",
  };

  /**
   * backward - Event emitter to signal when to go back to the previous step.
   */
  @Output() backward = new EventEmitter<void>();

  /**
   * showSuccess - A flag to indicate if the success message should be shown.
   */
  showSuccess: boolean = false;
  
  /**
   * Emits the backward event to go back to the previous step.
   */
  back() {
    this.backward.emit();
  }

  /**
   * Sets the active profile picture.
   * @param {number} index - The index of the selected profile picture.
   */
  setActive(index:number) {
    this.activePic = index;
  }

  /**
   * Handles the sign-up process when the avatar is chosen.
   */
  onSignup(){
    this.showSuccess = true;
  }

  /**
   * Completes the sign-up process by setting the user's avatar and registering the user.
   */
  signUpAvatar() {
    this.userData.photoURL = `${this.path}${this.profilesPics[this.activePic]}`;
    this.auth.register(this.userData.email, this.userData.password, this.userData.name, this.userData.photoURL);
    this.onSignup();
  }
}
