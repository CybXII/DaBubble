import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-choose-avatar',
  imports: [CommonModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})
export class ChooseAvatarComponent {
  name:string = "Frederik Beck";
  activePic:number = -1 ;
  profilesPics: string[] = ['avatar2.svg','avatar1.svg','avatar3.svg','avatar6.svg','avatar5.svg','avatar4.svg',];
  path:string = "/img/avatars/";

  constructor(private router: Router) {}
  
  back() {
    this.router.navigateByUrl('');
  }

  toBoard() {
    this.router.navigateByUrl('board');
  }

  setActive(index:number) {
    this.activePic = index;
  }
}
