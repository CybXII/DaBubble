import { Component, Input } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';
import { SearchbarComponent } from './searchbar/searchbar.component';
import { UsermenuComponent } from './usermenu/usermenu.component';
import { Router, RouterModule } from '@angular/router';
import { ToastMessageService } from '../services/toastmessage.service';
import { ToastMessageComponent } from '../toastmessage/toastmessage.component';


@Component({
  selector: 'app-header',
  standalone: true,   // <-- Add this line
  imports: [LogoComponent, SearchbarComponent, UsermenuComponent, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  currentUrl: string = '';
  

  constructor(private router: Router, private toastMessageService: ToastMessageService) {
    this.currentUrl = this.router.url;
    console.log(this.currentUrl);

  }

}
