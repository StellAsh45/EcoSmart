import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

@Injectable({
  providedIn: 'root'
})
export class PublicGuard implements CanActivate {
  constructor(private supabaseSvc: SupabaseService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
    
    // Si NO hay usuario, puede ver las páginas públicas (login/registro)
    if (!user) {
      return true;
    }

    // Si ya HAY un usuario logueado, lo mandamos a su dashboard correspondiente
    const { data: perfil } = await this.supabaseSvc.obtenerPerfil(user.id);
    
    if (perfil?.rol === 'admin') {
      this.router.navigate(['/dashboard-admin']);
    } else {
      this.router.navigate(['/dashboard-estudiante']);
    }

    return false;
  }
}
