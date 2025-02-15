import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  warnText: string = "Ihre Kennwörter stimmen nicht überein";
  passwordmatch: boolean = false;
  passwords = {password: "", password2: "",};
  successMessage: string = '';
  errorMessage: string = '';
  oobCode: string = '';

  /**
   * Constructor for ResetPasswordComponent.
   * @param {Router} router - The Angular Router service.
   * @param {AuthService} auth - The authentication service.
   * @param {ActivatedRoute} route - The activated route to extract query parameters.
   */
  constructor(private router: Router, private auth: AuthService, private route: ActivatedRoute) { }

  /**
   * ngOnInit - Lifecycle hook that is called after data-bound properties are initialized.
   */
  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'] || '';
      if (!this.oobCode) {
        this.errorMessage = 'Ungültiger oder fehlender Link.';
      }
    });
  }

  /**
   * Navigates back to the home page.
   */
  back() {
    this.router.navigateByUrl('');
  }

  /**
   * Changes the user's password.
   * @param {NgForm} ngform - The form containing the new passwords.
   */
  changePassword(ngform: NgForm) {
    if (ngform.valid && ngform.submitted && this.checkPasswordsMatch()) {
      this.auth.confirmPasswordReset(this.oobCode, this.passwords.password)
        .then(() => {
          this.successMessage = 'Das Passwort wurde erfolgreich zurückgesetzt.';
          this.errorMessage = '';
        })
    }
  }

  /**
   * Checks if the passwords match.
   * @returns {boolean} - True if the passwords match, false otherwise.
   */
  checkPasswordsMatch() {
    let a = this.passwords;
    if (a.password === a.password2) {
      this.passwordmatch = true;
      return true;
    } else {
      this.passwordmatch = false;
      return false;
    }
  }
}
