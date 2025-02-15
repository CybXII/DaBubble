import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastMessageService } from '../../shared/services/toastmessage.service';
import { ToastMessageComponent } from '../../shared/toastmessage/toastmessage.component';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastMessageComponent],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss',
})
export class ForgetPasswordComponent {
  userData = {email: '',};
  emailSended: boolean = false;
  countdown: number = 10;
  private intervalId: any;

  /**
   * Constructor for ForgetPasswordComponent.
   * @param {Router} router - The Angular Router service.
   * @param {AuthService} authService - The authentication service.
   */
  constructor(
    private router: Router,
    private authService: AuthService,
    private toastMessageService: ToastMessageService
  ) {}

  /**
   * Navigates back to the home page.
   */
  back() {
    this.router.navigateByUrl('');
  }

  /**
   * Starts a timer that decrements the countdown variable every second.
   * When the countdown reaches 0, the timer is cleared.
   */
  startTimer() {
    this.intervalId = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.intervalId);
      }
    }, 1000);
  }

  /**
   * Sends a reset password email.
   * @param {NgForm} form - The form containing the user email.
   */
  sendMail(form: NgForm) {
    this.authService
      .resetPassword(this.userData.email)
      .then(() => {
        form.resetForm();
        this.toastMessageService.showToastSignal('Email wurde gesendet!');
        this.emailSended = true;
        this.startTimer();
        setTimeout(() => {
          this.back();
        }, 10000);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Gets the current toast message.
   * @returns {string} - The current toast message.
   */
  get toastMessage() {
    return this.toastMessageService.toastSignal();
  }
}
