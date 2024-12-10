import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {

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
      this.router.navigateByUrl('chooseAvatar');
    }
  }
}
