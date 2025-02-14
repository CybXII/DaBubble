import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastMessageService } from '../../shared/services/toastmessage.service';
import { ToastMessageComponent } from '../../shared/toastmessage/toastmessage.component';

/**
 * ForgetPasswordComponent - A component that handles the forget password functionality.
 */
@Component({
  selector: 'app-forget-password',
  standalone: true, // <-- Add this line
  imports: [CommonModule, FormsModule, ToastMessageComponent],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss',
})
export class ForgetPasswordComponent {
  /**
   * userData - Object to hold user email.
   */
  userData = {
    email: '',
  };

  /**
   * emailSended - A flag to indicate if the email was successfully sent.
   */
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
        console.log(error);
      });
  }

  get toastMessage() {
    return this.toastMessageService.toastSignal();
  }
}
