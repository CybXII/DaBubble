import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-choose-avatar',
  imports: [ CommonModule ],
  standalone: true,
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})
export class ChooseAvatarComponent {
  @Input() userData: any = {name: "", email: "", password: "", privacy: false, photoURL: ""};
  @Output() backward = new EventEmitter<void>();

  activePic:number = -1 ;
  profilesPics: string[] = ['avatar2.svg','avatar1.svg','avatar3.svg','avatar6.svg','avatar5.svg','avatar4.svg',];
  path:string = "/img/avatars/";
  showSuccess: boolean = false;


  /**
   * Constructor for ChooseAvatarComponent.
   * @param {Router} router - The Angular Router service.
   * @param {AuthService} auth - The authentication service.
   */
  constructor(private auth: AuthService) {}


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
