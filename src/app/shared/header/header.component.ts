import { Component, HostListener, Input } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';
import { SearchbarComponent } from './searchbar/searchbar.component';
import { UsermenuComponent } from './usermenu/usermenu.component';
import { Router, RouterModule } from '@angular/router';
import { MenutogglerComponent } from "../../main/shared/menutoggler/menutoggler.component";
import { StateService } from '../services/state.service';


@Component({
  selector: 'app-header',
  standalone: true,   // <-- Add this line
  imports: [LogoComponent, SearchbarComponent, UsermenuComponent, RouterModule, MenutogglerComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  currentUrl: string = '';
  mobile = false;
  menuOpened = false
  menuState = 'in';
  threadchatState = 'out';

  constructor(private router: Router, private stateService: StateService) {
    this.currentUrl = this.router.url;
    this.onResize();
  }


  @HostListener('window:resize', [])
  onResize(): void {
    this.mobile = window.innerWidth <= 900;
  }

  ngOnInit(): void {

    this.stateService.menuState$.subscribe((state) => {
      this.menuState = state;
      this.menuOpened = state === 'in';
    });
  }

  toggleMenu(): void {
    this.menuState = this.menuState === 'in' ? 'out' : 'in';
    this.menuOpened = this.menuState === 'in';  
    this.stateService.setMenuState(this.menuState)
  }
}
