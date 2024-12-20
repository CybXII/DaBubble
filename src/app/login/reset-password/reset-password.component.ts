import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  standalone: true,   // <-- Add this line
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  warnText: string = "Ihre Kennwörter stimmen nicht überein";
  passwordmatch: boolean = false;
  passwords = {
    password: "",
    password2: "",
  };


  constructor(private router: Router, private auth: AuthService) { }

  back() {
    this.router.navigateByUrl('');
  }

  changePassword(ngform: NgForm) {
    if (ngform.valid && ngform.submitted && this.checkPasswordsMatch()) {
      console.log(this.passwords);
      this.auth.updateUserPassword(this.passwords.password);


    }
  }

  checkPasswordsMatch() {
    let a = this.passwords;
    if (a.password === a.password2) {
      this.passwordmatch = true;
      return true;
    } else {
      console.log("passwörter stimmen nicht überein");
      this.passwordmatch = false;
      return false;
    }
  }
}
