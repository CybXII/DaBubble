import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

  constructor(private router: Router) {}

  loginAsGuest() {
    this.router.navigateByUrl('board');
  }

  login() {
    this.router.navigateByUrl('chooseAvatar');
  }

}