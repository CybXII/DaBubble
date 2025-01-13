import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
// import { SignUpComponent } from '../sign-up.component'

@Component({
  selector: 'app-choose-avatar',
  imports: [ CommonModule ],
  standalone: true,   // <-- Add this line
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})
export class ChooseAvatarComponent {
  activePic:number = -1 ;
  profilesPics: string[] = ['avatar2.svg','avatar1.svg','avatar3.svg','avatar6.svg','avatar5.svg','avatar4.svg',];
  path:string = "/img/avatars/";

  constructor(private router: Router, private auth: AuthService) {} // private signUp: SignUpComponent
  @Input() userData: any = {
    name: "",
    email: "",
    password: "",
    privacy: false,
    photoURL: "",
  };
  @Output() backward = new EventEmitter<void>();

  showSuccess: boolean = false;
  
  back() {
    this.backward.emit();
  }

  setActive(index:number) {
    this.activePic = index;
  }

  onSignup(){
    this.showSuccess = true;
  }

  signUpAvatar() {
    this.userData.photoURL = `${this.path}${this.profilesPics[this.activePic]}`;
    this.auth.register(this.userData.email, this.userData.password, this.userData.name, this.userData.photoURL);
    this.onSignup();
  }
}
