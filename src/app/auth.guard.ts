import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './shared/services/user.service';
import { AuthService } from './shared/services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const userService = inject(UserService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const localUserData = sessionStorage.getItem('userData');
  const localUserId = JSON.parse(localUserData || '{}');
  const userIdIsValid = await userService.checkUserId(localUserId.userId);

  if (authService.isAuthenticated() && userIdIsValid) {
    if (state.url === '/') {
      setTimeout(() => {router.navigateByUrl('/board');}, 6000);
      return false;
    }
    return true;
  }
  router.navigate(['/']);
  return false;
}
