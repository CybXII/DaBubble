import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true,
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent implements OnInit {
  loginData = {email: '', password: ''};
  loginError = '';

  /**
   * Constructor for SignInComponent.
   * @param {AuthService} authService - The authentication service.
   * @param {Router} router - The Angular Router service.
   * @param {ActivatedRoute} route - The activated route to extract query parameters.
   */
  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute
  ) { }

  /**
   * ngOnInit - Lifecycle hook that is called after data-bound properties are initialized.
   */
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/board');
    }
    this.loginError = this.userService.loginError();
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
        this.loginError = 'Falsches Passwort oder E-Mail.';
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
