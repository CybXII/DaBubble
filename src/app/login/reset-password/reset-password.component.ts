import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  warnText:string = "";
  passwords = {
    password: "",
    password2: "",
  };

  constructor(private router: Router) {}
  
  back() {
    this.router.navigateByUrl('');
  }

  changePassword(ngform: NgForm) {

  }
}
