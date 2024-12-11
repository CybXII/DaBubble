import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule ,FormsModule, ChooseAvatarComponent],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  avatar:boolean = false;

  userData = {
    name: "",
    email : "",
    password: "",
    privacy: false,
  }

  constructor(private router: Router) {}
  
  back() {
    this.router.navigateByUrl('');
  }

  signUp(form:NgForm) {
    if (form.valid && form.submitted) {
      console.log(this.userData);
      this.avatar = true;
      // this.router.navigateByUrl('chooseAvatar');
    }
  }

  close() {
    this.avatar = false;
  }
}
