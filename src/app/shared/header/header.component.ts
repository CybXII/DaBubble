import { Component } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';
import { SearchbarComponent } from './searchbar/searchbar.component';
import { UsermenuComponent } from './usermenu/usermenu.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [LogoComponent, SearchbarComponent, UsermenuComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  currentUrl: string = '';

  constructor(private router: Router) {
    this.currentUrl = this.router.url;
    console.log(this.currentUrl);

  }

}
