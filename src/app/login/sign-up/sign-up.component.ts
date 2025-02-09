import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { UserModel } from '../../models/user';

/**
 * SignUpComponent - A component that handles the sign-up functionality.
 */
@Component({
  selector: 'app-sign-up',
  standalone: true,   // <-- Add this line
  imports: [CommonModule, FormsModule, ChooseAvatarComponent, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {

  /**
   * avatar - A flag to indicate if the avatar selection is active.
   */
  avatar: boolean = false;

  /**
   * userData - Object to hold user sign-up data.
   */
  userData = {
    name: "",
    email: "",
    password: "",
    privacy: false,
    photoURL: "",
  }

  /**
   * Constructor for SignUpComponent.
   * @param {Router} router - The Angular Router service.
   * @param {AuthService} auth - The authentication service.
   */
  constructor(private router: Router, private auth: AuthService) { }

  /**
   * Navigates back to the home page.
   */
  back() {
    this.router.navigateByUrl('');
  }

  /**
   * Handles the sign-up process.
   * @param {NgForm} form - The form containing the user sign-up data.
   */
  signUp(form: NgForm) {
    if (form.valid && form.submitted) {
      this.avatar = true;
    }
  }

  /**
   * Closes the avatar selection.
   */
  close() {
    this.avatar = false;
  }
}
