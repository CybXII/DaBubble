import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Component({
  selector: 'app-sign-up',
  standalone: true,   // <-- Add this line
  imports: [CommonModule, FormsModule, ChooseAvatarComponent, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  avatar: boolean = false;

  userData = {
    name: "",
    email: "",
    password: "",
    privacy: false,
  }


  async register() {
    //this.auth.register(this.userData.email, this.userData.password);
    this.auth.sendEmail(this.userData.email);
    console.log("mail sent to", this.userData.email);

    const userCredential = await this.afAuth.createUserWithEmailAndPassword(this.userData.email, this.userData.password);

    try {
      await userCredential.user?.sendEmailVerification();
      console.log('E-Mail wurde gesendet.');
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error);
    }

  }


  constructor(private router: Router, private auth: AuthService, private afAuth: AngularFireAuth) { }

  back() {
    this.router.navigateByUrl('');
  }

  signUp(form: NgForm) {
    if (form.valid && form.submitted) {
      console.log(this.userData);
      this.avatar = true;
      this.auth.sendEmail(this.userData.email);
      console.log("mail sent to", this.userData.email);
      // this.router.navigateByUrl('chooseAvatar');
    }
  }

  close() {
    this.avatar = false;
  }
}
