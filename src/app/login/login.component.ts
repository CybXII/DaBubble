import { NgStyle, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,   // <-- Add this line
  imports: [RouterOutlet, NgStyle, RouterModule, NgClass],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginPage: boolean = true;
  introPlayed: boolean = false;

  constructor(public router: Router) {
    this.checkside();

    // check if it was played
    let introPlayedVar = sessionStorage.getItem('introPlayed');
    if (introPlayedVar !== null) {
      this.introPlayed = JSON.parse(introPlayedVar);
    }

    // save entry after delay
    setTimeout(() => {
      this.introPlayed = true;
      sessionStorage.setItem('introPlayed', JSON.stringify(this.introPlayed));
    }, 6000);

  }

  homeroute: any = "";

  checkside() {
    setInterval(() => {
      if (this.router.routerState.snapshot.url == '/') {
        console.log(this.router.routerState.snapshot.url);
        this.loginPage = true;
      } else {
        this.loginPage = false;
      }
    },100)
  }

}
