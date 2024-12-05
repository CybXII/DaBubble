import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from '../login.component';

@Component({
  selector: 'app-choose-avatar',
  imports: [],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})
export class ChooseAvatarComponent {
  name:string = "Frederik Beck";

  constructor(private router: Router) {}
  
  back() {
    this.router.navigateByUrl('');
  }

  toBoard() {
    this.router.navigateByUrl('board');
  }
}
