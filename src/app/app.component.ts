import { Component, effect, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { UserModel } from '../app/models/user';
import { AuthService } from './shared/services/auth.service';
import { Router } from '@angular/router';
import { EmojiPickerService } from './shared/services/emoji-picker.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'DABubble';
  firestore: Firestore = inject(Firestore);
  items$: Observable<any[]>;
  user: UserModel = new UserModel(null);  tokens: string[] = [];
  turnAround:boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    const usersCollection = collection(this.firestore, 'users');
    this.items$ = collectionData(usersCollection, { idField: 'id' });
  }


  /**
   * OnInit lifecycle hook. If the user is authenticated and the current
   * route is the root route ('/'), navigate to the board route ('/board').
   */
  ngOnInit(): void {
    const isAuthenticated = this.authService.isUserAuthenticated();
    if (isAuthenticated && this.router.url === '/') {
      this.router.navigateByUrl('/board');
    }
    this.checkOrietationInterval();
  }

  checkOrietationInterval() {
    setInterval(() => {
      if (this.checkOrientationAndWidth()) {
        this.turnAround = true;
      } else {
        this.turnAround = false;
      }
    }, 2000)
  }

  checkOrientationAndWidth = () => {
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    const maxWidth800px = window.matchMedia("(max-width: 800px)").matches;
    return isLandscape && maxWidth800px;
  }
}
