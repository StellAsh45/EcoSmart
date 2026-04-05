import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RecoveryGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(): boolean {
    const enModoRecuperacion = sessionStorage.getItem('modo_recuperacion') === 'true';

    if (!enModoRecuperacion) {
      this.router.navigate(['/home']);
      return false;
    }


    sessionStorage.removeItem('modo_recuperacion');
    return true;
  }
}
