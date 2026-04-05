import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

@Injectable({
  providedIn: 'root'
})
export class PublicGuard implements CanActivate {
  constructor(private supabaseSvc: SupabaseService, private router: Router) { }

  async canActivate(): Promise<boolean> {
    const { data: { session } } = await this.supabaseSvc.cliente.auth.getSession();

    // Si NO hay sesión activa, puede ver las páginas públicas
    if (!session) {
      return true;
    }

    // Si ya HAY un usuario logueado, lo mandamos a su dashboard correspondiente
    const { data: perfil } = await this.supabaseSvc.obtenerPerfil(session.user.id);

    if (perfil?.rol === 'admin') {
      this.router.navigate(['/dashboard-admin']);
    } else {
      this.router.navigate(['/dashboard-estudiante']);
    }

    return false;
  }
}
