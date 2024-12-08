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
  profilesPics: string[] = ['pic.svg','00c.Charaters (1).svg','00c.Charaters (2).svg','00c.Charaters (3).svg','00c.Charaters (4).svg','00c.Charaters (5).svg',];
  path:string = "assets/svgs/";

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
