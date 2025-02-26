import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ChooseAvatarComponent, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  avatar: boolean = false;
  userData = {name: "", email: "", password: "", privacy: false, photoURL: ""}

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

  /**
  * Checks if the width of the window is less than 400 pixels.
  * @returns {boolean} - Returns `true` if the window width is less than 400 pixels, otherwise `false`.
  */
  windowWidth() {
    if (window.innerWidth < 400) {return true} else return false
  }
}
