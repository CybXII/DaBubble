import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { ToastMessageService } from '../shared/services/toastmessage.service';
import { ToastMessageComponent } from '../shared/toastmessage/toastmessage.component';

/**
 * LoginComponent - A component that handles the login functionality.
 */
@Component({
  selector: 'app-login',
  standalone: true, // <-- Add this line
  imports: [RouterOutlet, RouterModule, NgClass, ToastMessageComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', './landscape.scss'],
})
export class LoginComponent {

  /**
   * loginPage - A flag to indicate if the current page is the login page.
   */
  loginPage: boolean = true;

  /**
   * forgetPassword - A flag to indicate if the forget password page is active.
   */
  forgetPassword:boolean = false;

  /**
   * introPlayed - A flag to indicate if the intro has been played.
   */
  introPlayed: boolean = false;

  /**
   * Constructor for LoginComponent.
   * @param {Router} router - The Angular Router service.
   * @param {ToastMessageService} toastMessageService - The toast message service.
   */
  constructor(public router: Router, private toastMessageService: ToastMessageService) {
    this.checkside();

    // check if it was played
    let introPlayedVar = sessionStorage.getItem('introPlayed');
    if (introPlayedVar !== null) {
      this.introPlayed = JSON.parse(introPlayedVar);
    }

    // save entry after delay
    setTimeout(() => {
      this.introPlayed = true; // cvo
      sessionStorage.setItem('introPlayed', JSON.stringify(this.introPlayed));
    }, 6000);
  }

  /**
   * Checks the current route and updates the page flags accordingly.
   */
  checkside() {
    setInterval(() => {
      if (this.router.routerState.snapshot.url == '/') {
        this.loginPage = true;
      } else {
        if (this.router.routerState.snapshot.url == '/forget') {
          this.forgetPassword = true;
        } else {
          this.forgetPassword = false;
        }
        this.loginPage = false;
      }
    },100)
  }

  /**
   * Gets the current toast message.
   * @returns {string} - The current toast message.
   */
  get toastMessage() {
    return this.toastMessageService.toastSignal();
  }
}
