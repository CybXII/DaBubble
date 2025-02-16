import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { UserModel } from '../app/models/user';
import { AuthService } from './shared/services/auth.service';
import { Router } from '@angular/router';

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

  /**
   * The constructor for the AppComponent class.
   * @param authService The AuthService to provide the user authentication state.
   * @param router The Router to navigate to the board route if the user is
   * authenticated and the current route is the root route.
   */
  constructor(private authService: AuthService, private router: Router) {
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

  /**
   * Checks the orientation and width of the screen every 2 seconds and
   * sets the `turnAround` flag accordingly. If the screen is in landscape
   * mode and the width is less than or equal to 800px, then `turnAround`
   * is set to true. Otherwise, it is set to false.
   */
  checkOrietationInterval() {
    setInterval(() => {
      if (this.checkOrientationAndWidth()) 
        this.turnAround = true;
      else 
        this.turnAround = false;
    }, 2000)
  }
  checkOrientationAndWidth = () => {
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    const maxWidth800px = window.matchMedia("(max-width: 800px)").matches;
    return isLandscape && maxWidth800px;
  }
}
