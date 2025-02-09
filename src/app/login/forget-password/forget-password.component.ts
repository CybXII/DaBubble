import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

/**
 * ForgetPasswordComponent - A component that handles the forget password functionality.
 */
@Component({
  selector: 'app-forget-password',
  standalone: true,   // <-- Add this line
  imports: [CommonModule, FormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent {

  /**
   * userData - Object to hold user email.
   */
  userData = {
    email: "",
  }

  /**
   * emailSended - A flag to indicate if the email was successfully sent.
   */
  emailSended:boolean = false;

  /**
   * Constructor for ForgetPasswordComponent.
   * @param {Router} router - The Angular Router service.
   * @param {AuthService} authService - The authentication service.
   */
  constructor(private router: Router, private authService: AuthService) { }

  /**
   * Navigates back to the home page.
   */
  back() {
    this.router.navigateByUrl('');
  }

  /**
   * Sends a reset password email.
   * @param {NgForm} form - The form containing the user email.
   */
  sendMail(form: NgForm) {
    this.authService.resetPassword(this.userData.email).then(() => {
      form.resetForm();
      this.emailSended = true;
      setTimeout(() => {
        this.back();
      }, 10000)
    })
      .catch((error) => {
        console.log(error);
      })
  }
}
