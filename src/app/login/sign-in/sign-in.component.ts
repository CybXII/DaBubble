import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

/**
 * SignInComponent - A component that handles the sign-in functionality.
 */
@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true, // Standalone Component
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent implements OnInit {

  /**
   * loginData - Object to hold user login credentials.
   */
  loginData = {
    email: '',
    password: '',
  };

  /**
   * loginError - Error message for the UI.
   */
  loginError = ''; // Fehlernachricht für das UI

  /**
   * Constructor for SignInComponent.
   * @param {AuthService} authService - The authentication service.
   * @param {Router} router - The Angular Router service.
   * @param {ActivatedRoute} route - The activated route to extract query parameters.
   */
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  /**
   * ngOnInit - Lifecycle hook that is called after data-bound properties are initialized.
   */
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      console.log('User is authenticated, redirecting to /board');
      this.router.navigateByUrl('/board');
    }
    this.loginError = this.authService.loginError();
  }

  /**
   * Logs in the user.
   * @param {NgForm} ngForm - The form containing the user's login credentials.
   */
  async login(ngForm: NgForm): Promise<void> {
    if (ngForm.valid && ngForm.submitted) {
      try {
        await this.authService.login(this.loginData.email, this.loginData.password);
        this.redirectToBoard();
      } catch (error) {
        this.loginError = 'Falsches Passwort oder E-Mail.. Bitte noch einmal versuchen.';
      }
    }
  }

  /**
   * Logs in as a guest user.
   */
  async loginAsGuest(): Promise<void> {
    try {
      await this.authService.guestLogin();
      this.redirectToBoard();
    } catch (error) {
      this.loginError = 'Guest login failed.';
      console.error('Guest login error:', error);
    }
  }

  /**
   * Logs in using Google authentication.
   */
  async loginWithGoogle(): Promise<void> {
    try {
      await this.authService.googleLogin();
      this.redirectToBoard();
    } catch (error) {
      this.loginError = 'Google login failed.';
      console.error('Google login error:', error);
    }
  }

  /**
   * Redirects the user to the board page.
   */
  private redirectToBoard(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/board';
    this.router.navigateByUrl(returnUrl, { replaceUrl: true });
  }
}
