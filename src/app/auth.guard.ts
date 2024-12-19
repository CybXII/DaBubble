import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

// export const authGuard: CanActivateFn = (route, state) => {
//   const authService = inject(AuthService);
//   const router = inject(Router);

//   if (authService.isAuthenticated()) {
//     if (state.url === '/') {
//       router.navigateByUrl('/board'); // Weiterleitung zur Board-Seite
//       return false; // Zugriff auf "/" verweigern
//     }
//     return true; // Zugriff erlauben
//   }

//   // Benutzer ist nicht eingeloggt
//   router.navigate(['']);
//   return false;
// };