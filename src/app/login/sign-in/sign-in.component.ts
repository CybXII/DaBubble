import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

  loginData = {
    email: "",
    password: "",
  };

  constructor(private router: Router) { }

  loginAsGuest() {
    this.router.navigateByUrl('board');
  }

  login(ngForm: NgForm) {
    if (ngForm.valid && ngForm.submitted) {
      console.log("form functional", this.loginData);
    }
    this.router.navigateByUrl('board');
  }

}